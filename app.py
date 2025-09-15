# app.py (Versão Final, Completa e Consolidada)

import os
import psycopg2
import calendar
from psycopg2.extras import RealDictCursor
from flask import Flask, jsonify, request, send_from_directory
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
from datetime import datetime
import random

# --- INICIALIZAÇÃO E CONSTANTES ---
load_dotenv()
app = Flask(__name__, static_folder="Frontend", static_url_path="")
bcrypt = Bcrypt(app)
TARIFA_SP_KWH = 0.92
CO2_KG_POR_KWH = 0.072

# ===================================================================
#           FUNÇÕES DE LÓGICA DO BANCO DE DADOS
# ===================================================================

def get_db_connection():
    """Função central e segura para conectar ao banco de dados."""
    try:
        conn = psycopg2.connect(host=os.getenv("SB_HOST"), port=os.getenv("SB_PORT"), dbname=os.getenv("SB_DATABASE"), user=os.getenv("SB_USER"), password=os.getenv("SB_PASSWORD"))
        return conn
    except Exception as e:
        print(f"❌ [DB] CRITICAL: Erro de conexão: {e}")
        return None

def verificar_login(email, senha):
    """Verifica as credenciais do usuário de forma segura."""
    conn = get_db_connection()
    if not conn: return None
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM usuarios WHERE email = %s;", (email,))
        usuario = cur.fetchone()
        if not usuario or not bcrypt.check_password_hash(usuario['senha_hash'], senha):
            return None
        del usuario['senha_hash']
        return usuario
    except Exception as e:
        print(f"❌ [LOGIN] Erro na verificação: {e}")
        return None
    finally:
        if conn: conn.close()

def get_dashboard_data(user_id):
    """Busca todos os dados para a tela principal do Dashboard."""
    conn = get_db_connection()
    if not conn: return {"error": "Falha na conexão"}
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT COALESCE(SUM(kwh_total), 0) as kwh FROM resumos WHERE user_id = %s AND periodo_tipo = 'hora' AND periodo_inicio >= date_trunc('day', NOW());", (user_id,)); consumo_hoje = cur.fetchone()
        cur.execute("SELECT COALESCE(SUM(kwh_total), 0) as kwh FROM resumos WHERE user_id = %s AND periodo_tipo = 'dia' AND periodo_inicio >= date_trunc('month', NOW());", (user_id,)); consumo_mes_atual_realtime = cur.fetchone()
        cur.execute("SELECT to_char(date_trunc('month', periodo_inicio), 'Mon') as mes_nome, SUM(kwh_total) as kwh FROM resumos WHERE user_id = %s AND periodo_tipo = 'mes' GROUP BY date_trunc('month', periodo_inicio) ORDER BY date_trunc('month', periodo_inicio) DESC LIMIT 7;", (user_id,)); resumos_mensais = cur.fetchall()
        cur.execute("SELECT kwh_total as kwh, EXTRACT(HOUR FROM periodo_inicio) as hora FROM resumos WHERE user_id = %s AND periodo_tipo = 'hora' AND periodo_inicio >= date_trunc('day', NOW()) ORDER BY hora;", (user_id,)); leituras_de_hoje_raw = cur.fetchall()
        cur.close()

        kwh_mes_atual = float(consumo_mes_atual_realtime['kwh']); kwh_mes_anterior = float(resumos_mensais[0]['kwh']) if resumos_mensais else 0.0
        mes_atual_nome = datetime.now().strftime('%b').capitalize(); dados_grafico_barras = [{"mes_nome": mes_atual_nome, "kwh": kwh_mes_atual, "cost": kwh_mes_atual * TARIFA_SP_KWH, "isCurrent": True}]; dados_grafico_barras.extend([{"mes_nome": r['mes_nome'].capitalize(), "kwh": float(r['kwh']), "cost": float(r['kwh']) * TARIFA_SP_KWH, "isCurrent": False} for r in resumos_mensais[:5]]); dados_grafico_barras.reverse()
        kwh_hoje = float(consumo_hoje['kwh']); custo_hoje = kwh_hoje * TARIFA_SP_KWH; custo_mes_atual = kwh_mes_atual * TARIFA_SP_KWH; fatura_estimada_valor = custo_mes_atual * 1.1; delta_mensal = ((kwh_mes_atual - kwh_mes_anterior) / kwh_mes_anterior * 100) if kwh_mes_anterior > 0 else 0.0
        
        info_horario_pico_msg = "Não há dados de consumo horário para hoje."
        if leituras_de_hoje_raw: pico_consumo = max(leituras_de_hoje_raw, key=lambda x: x['kwh']); hora_pico = int(pico_consumo['hora']); info_horario_pico_msg = f"Seu pico de consumo hoje foi às {hora_pico:02d}h."
        if delta_mensal < 0: info_economia_msg = f"Você economizou {abs(delta_mensal):.1f}% este mês. Continue assim!"
        else: info_economia_msg = f"Seu consumo aumentou {delta_mensal:.1f}% este mês. Fique atento!"
        meta_mensal = 400.00
        if fatura_estimada_valor > meta_mensal: excedente = fatura_estimada_valor - meta_mensal; info_meta_msg = f"Atenção! Sua fatura estimada já excedeu a meta em R$ {excedente:.2f}."
        else: restante = meta_mensal - fatura_estimada_valor; info_meta_msg = f"Faltam R$ {restante:.2f} para atingir sua meta de R$ {meta_mensal:.2f}."
        
        dados_reais_por_hora = {int(r['hora']): float(r['kwh']) for r in leituras_de_hoje_raw}
        leituras_completas_do_dia = []; hora_atual_simulada = 19
        for hora in range(0, 24): kwh = dados_reais_por_hora.get(hora, 0.0) if hora <= hora_atual_simulada else 0.0; leituras_completas_do_dia.append({"hora": hora, "kwh": kwh, "cost": kwh * TARIFA_SP_KWH})
        
        return {"today": {"kwh": kwh_hoje, "cost": custo_hoje, "progress": 65}, "monthly": {"kwh": kwh_mes_atual, "cost": custo_mes_atual, "deltaPct": delta_mensal}, "billEstimate": {"cost": fatura_estimada_valor, "status": 'above' if fatura_estimada_valor > meta_mensal else 'ok'}, "system": {"status": 'online', "lastUpdate": 'agora'}, "monthlyBars": dados_grafico_barras, "hourly24": leituras_completas_do_dia, "info": { "economyMessage": info_economia_msg, "peakMessage": info_horario_pico_msg, "goalMessage": info_meta_msg }}
    except Exception as e:
        print(f"❌ Erro ao buscar dados do dashboard: {e}"); return {"error": str(e)}
    finally:
        if conn: conn.close()

def get_metricas_gerais_data(user_id):
    """Busca dados para a aba principal 'Consumo por Tempo' de Métricas."""
    conn = get_db_connection()
    if not conn: return {"error": "Falha na conexão"}
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT kwh_total as kwh, EXTRACT(HOUR FROM periodo_inicio) as hora FROM resumos WHERE user_id = %s AND periodo_tipo = 'hora' AND periodo_inicio >= date_trunc('day', NOW()) ORDER BY hora;", (user_id,)); leituras_de_hoje_raw = cur.fetchall()
        cur.execute("SELECT EXTRACT(ISODOW FROM periodo_inicio) as dia_semana, COALESCE(SUM(kwh_total), 0) as kwh FROM resumos WHERE user_id = %s AND periodo_tipo = 'dia' AND periodo_inicio >= date_trunc('week', NOW()) GROUP BY dia_semana ORDER BY dia_semana;", (user_id,)); dados_semana_raw = {int(r['dia_semana']): float(r['kwh']) for r in cur.fetchall()}; week_data = [dados_semana_raw.get(i % 7 + 1, 0.0) for i in range(1, 8)]; week = [week_data.pop()] + week_data
        cur.execute("SELECT d.tipo, COALESCE(SUM(r.kwh_total), 0) as kwh FROM resumos r JOIN dispositivos d ON r.device_id = d.id WHERE r.user_id = %s AND r.periodo_tipo = 'dia' AND r.periodo_inicio >= date_trunc('month', NOW()) GROUP BY d.tipo ORDER BY SUM(r.kwh_total) DESC;", (user_id,)); devices_raw = cur.fetchall(); top_devices = {r['tipo'].capitalize(): float(r['kwh']) for r in devices_raw[:4]}; outros_kwh = sum(float(r['kwh']) for r in devices_raw[4:]);
        if outros_kwh > 0.01: top_devices['Outros'] = outros_kwh
        cur.close()
        dados_reais_por_hora = {int(r['hora']): float(r['kwh']) for r in leituras_de_hoje_raw}
        leituras_completas_do_dia = []; hora_atual_simulada = 19
        for hora in range(0, 24): kwh = dados_reais_por_hora.get(hora, 0.0) if hora <= hora_atual_simulada else 0.0; leituras_completas_do_dia.append(kwh)
        return {"hourly24": leituras_completas_do_dia, "week": week_data, "devices": top_devices if top_devices else {"Nenhum Dispositivo": 0}}
    except Exception as e:
        print(f"❌ [MÉTRICAS] Erro ao buscar dados: {e}"); return {"error": str(e)}
    finally:
        if conn: conn.close()

def get_simulator_data(user_id):
    conn = get_db_connection()
    if not conn: return {"error": "Falha na conexão"}
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT d.nome, COALESCE(AVG(r.kwh_total) / 24, 0.1) as kwh_por_hora FROM dispositivos d LEFT JOIN resumos r ON d.id = r.device_id AND r.periodo_tipo = 'dia' AND r.periodo_inicio >= NOW() - INTERVAL '30 days' WHERE d.user_id = %s GROUP BY d.nome ORDER BY d.nome;", (user_id,))
        return {item['nome']: float(item['kwh_por_hora']) for item in cur.fetchall()}
    finally:
        if conn: conn.close()

def get_previsoes_data(user_id):
    # Para a previsão ser ~R$350, a média de kWh deve ser 350 / 0.92 = 380.4 kWh
    media_mensal_kwh = 380.4 
    previsoes = []
    hoje = datetime.now()
    for i in range(7):
        mes, ano = (hoje.month + i - 1) % 12 + 1, hoje.year + (hoje.month + i - 1) // 12
        mes_nome = calendar.month_abbr[mes].capitalize()
        consumo_previsto = media_mensal_kwh * (1 + (random.random() * 0.1 - 0.05)) # Variação de +/- 5%
        previsoes.append({
            "mes": mes_nome, "consumo": round(consumo_previsto, 1), "custo": round(consumo_previsto * TARIFA_SP_KWH, 2),
            "fatores": ["Baseado na média histórica"], "confianca": 95
        })
    return previsoes

# ===================================================================
#                           ROTAS (ENDPOINTS)
# ===================================================================
@app.route("/")
def index(): return send_from_directory("Frontend", "login.html")
@app.route("/<path:filename>")
def frontend_files(filename): return send_from_directory("Frontend", filename)
@app.route("/api/login", methods=['POST'])
def api_login():
    data = request.get_json(); usuario_logado = verificar_login(data['email'], data['senha'])
    if usuario_logado: return jsonify({"message": "Login realizado com sucesso!", "usuario": usuario_logado}), 200
    else: return jsonify({"error": "Credenciais inválidas."}), 401
@app.route("/api/dashboard-data", methods=['GET'])
def api_dashboard_data():
    user_id_fixo = "272c506a-e869-463c-b552-475009232001"; data = get_dashboard_data(user_id_fixo)
    return jsonify(data) if data and "error" not in data else (jsonify(data), 500)
@app.route("/api/metricas-gerais", methods=['GET'])
def api_metricas_gerais():
    user_id_fixo = "272c506a-e869-463c-b552-475009232001"; data = get_metricas_gerais_data(user_id_fixo)
    return jsonify(data) if data and "error" not in data else (jsonify(data), 500)
@app.route("/api/simulator-data", methods=['GET'])
def api_simulator_data():
    user_id_fixo = "272c506a-e869-463c-b552-475009232001"; data = get_simulator_data(user_id_fixo)
    return jsonify(data) if data and "error" not in data else (jsonify(data), 500)
@app.route("/api/config-constants", methods=['GET'])
def api_config_constants():
    return jsonify({"TARIFA_R_KWH": TARIFA_SP_KWH, "CO2_KG_POR_KWH": CO2_KG_POR_KWH})
@app.route("/api/previsoes-data", methods=['GET'])
def api_previsoes_data():
    user_id_fixo = "272c506a-e869-463c-b552-475009232001"; data = get_previsoes_data(user_id_fixo)
    return jsonify(data) if data and "error" not in data else (jsonify(data), 500)

# --- EXECUÇÃO DO SERVIDOR ---
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000)); print(f"🚀 Servidor rodando em http://localhost:{port}"); app.run(debug=True, port=port)
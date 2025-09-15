# Backend/banco_de_dados/dashboard_data.py

import psycopg2
from psycopg2.extras import RealDictCursor
from .login import get_db_connection # Reutilizamos a função de conexão

def get_dashboard_data(user_id):
    """
    Consulta o banco e retorna um dicionário com todos os dados para o dashboard.
    """
    conn = get_db_connection()
    if not conn:
        # Retorna uma estrutura de erro se não conseguir conectar
        return {"error": "Falha na conexão com o banco de dados"}

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # --- Query 1: Consumo de Hoje (soma das últimas 24h por hora) ---
        cur.execute("""
            SELECT COALESCE(SUM(kwh_total), 0) as kwh
            FROM resumos
            WHERE user_id = %s AND periodo_tipo = 'hora' AND periodo_inicio >= NOW() - INTERVAL '24 hours';
        """, (user_id,))
        consumo_hoje = cur.fetchone()

        # --- Query 2: Consumo do Mês Atual ---
        cur.execute("""
            SELECT COALESCE(SUM(kwh_total), 0) as kwh
            FROM resumos
            WHERE user_id = %s AND periodo_tipo = 'dia' AND periodo_inicio >= date_trunc('month', NOW());
        """, (user_id,))
        consumo_mes_atual = cur.fetchone()

        # --- Query 3: Consumo do Mês Anterior (para comparação) ---
        cur.execute("""
            SELECT COALESCE(SUM(kwh_total), 0) as kwh
            FROM resumos
            WHERE user_id = %s AND periodo_tipo = 'dia' 
              AND periodo_inicio >= date_trunc('month', NOW() - INTERVAL '1 month')
              AND periodo_inicio < date_trunc('month', NOW());
        """, (user_id,))
        consumo_mes_anterior = cur.fetchone()

        # --- Query 4: Consumo das últimas 24 horas (para o gráfico de linha) ---
        cur.execute("""
            SELECT kwh_total as kwh
            FROM resumos
            WHERE user_id = %s AND periodo_tipo = 'hora' AND periodo_inicio >= NOW() - INTERVAL '24 hours'
            ORDER BY periodo_inicio
            LIMIT 24;
        """, (user_id,))
        leituras_24h = cur.fetchall()

        # --- Query 5: Consumo dos últimos 4 meses (para o gráfico de barras) ---
        cur.execute("""
            SELECT kwh_total as kwh
            FROM resumos
            WHERE user_id = %s AND periodo_tipo = 'mes'
            ORDER BY periodo_inicio DESC
            LIMIT 4;
        """, (user_id,))
        leituras_meses = cur.fetchall()

        cur.close()

        # --- Montando o objeto de resposta (similar ao MOCK) ---
        # Simulação de alguns dados que ainda não temos no banco
        tarifa_kwh = 0.92 

        kwh_hoje = float(consumo_hoje['kwh'])
        custo_hoje = kwh_hoje * tarifa_kwh

        kwh_mes_atual = float(consumo_mes_atual['kwh'])
        custo_mes_atual = kwh_mes_atual * tarifa_kwh

        kwh_mes_anterior = float(consumo_mes_anterior['kwh'])
        delta_mensal = ((kwh_mes_atual - kwh_mes_anterior) / kwh_mes_anterior * 100) if kwh_mes_anterior > 0 else 0

        # Extrai apenas os valores de kWh para as listas dos gráficos
        hourly_data = [float(r['kwh']) for r in leituras_24h]
        monthly_bars_data = [float(r['kwh']) for r in reversed(leituras_meses)] # Inverte para ter do mais antigo ao mais novo

        dados_dashboard = {
            "today": {"kwh": kwh_hoje, "cost": custo_hoje, "progress": 65}, # Progresso ainda é mockado
            "monthly": {"kwh": kwh_mes_atual, "cost": custo_mes_atual, "deltaPct": delta_mensal},
            "billEstimate": {"cost": custo_mes_atual * 1.1, "status": 'above'}, # Estimativa simples
            "system": {"status": 'online', "lastUpdate": 'agora'},
            "monthlyBars": monthly_bars_data,
            "hourly24": hourly_data,
            "info": { # Infos ainda mockadas
                "economyPct": 5.3,
                "peakHours": '18h–22h',
                "metaRemaining": 54.20,
                "metaGoal": 400
            }
        }
        return dados_dashboard

    except Exception as e:
        print(f"❌ Erro ao buscar dados do dashboard: {e}")
        return {"error": str(e)}
    finally:
        if conn:
            conn.close()
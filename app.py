from flask import Flask, send_from_directory, jsonify
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Carregar variáveis do .env
load_dotenv("Backend/Banco de Dados/.env")

app = Flask(__name__, static_folder="Frontend", template_folder="Frontend")

# --- Configuração do banco ---
def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv("SB_HOST"),
        port=os.getenv("SB_PORT"),
        dbname=os.getenv("SB_DATABASE"),
        user=os.getenv("SB_USER"),
        password=os.getenv("SB_PASSWORD")
    )
    return conn

# --- Rota para o frontend ---
@app.route("/")
def index():
    return send_from_directory("Frontend", "login.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory("Frontend", filename)

# --- Rotas de API ---
@app.route("/api/hello")
def hello_api():
    return {"message": "API Revolts funcionando 🔋⚡"}

# Exemplo de consulta ao banco
@app.route("/api/usuarios")
def get_usuarios():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM usuarios;")  # precisa existir tabela 'usuarios'
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(rows)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Servidor rodando em http://localhost:{port}")
    app.run(debug=True, port=port)

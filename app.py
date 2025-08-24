from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder="Frontend", template_folder="Frontend")

# --- Rota para o frontend (páginas HTML) ---
@app.route("/")
def index():
    return send_from_directory("Frontend", "login.html")

# --- Rota para outros arquivos estáticos (CSS, JS, imagens) ---
@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory("Frontend", filename)

# --- Rotas de API do backend ---
@app.route("/api/hello")
def hello_api():
    return {"message": "API Revolts funcionando 🔋⚡"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Servidor rodando em http://localhost:{port}")
    app.run(debug=True, port=port)

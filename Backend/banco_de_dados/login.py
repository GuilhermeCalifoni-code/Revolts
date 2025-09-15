# Backend/banco_de_dados/login.py

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env que está na raiz do projeto
load_dotenv()

# Inicializa o bcrypt aqui, mas ele será configurado pelo app.py
bcrypt = Bcrypt()

def get_db_connection():
    """Função auxiliar para conectar ao banco."""
    try:
        conn = psycopg2.connect(
            host=os.getenv("SB_HOST"),
            port=os.getenv("SB_PORT"),
            dbname=os.getenv("SB_DATABASE"),
            user=os.getenv("SB_USER"),
            password=os.getenv("SB_PASSWORD")
        )
        return conn
    except Exception as e:
        print(f"❌ [DB] CRITICAL: Erro ao tentar conectar ao banco: {e}")
        return None

def verificar_login(email, senha):
    """
    Verifica as credenciais do usuário no banco de dados.
    Retorna os dados do usuário se o login for bem-sucedido, senão retorna None.
    """
    print(f"\n➡️ [DB] Iniciando verificação para o email: {email}")
    conn = get_db_connection()
    if not conn:
        print("❌ [DB] Erro: Falha na conexão com o banco de dados.")
        return None

    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print("➡️ [DB] Executando query para buscar usuário...")
        cur.execute("SELECT * FROM usuarios WHERE email = %s;", (email,))
        usuario = cur.fetchone()
        
        if not usuario:
            print("❌ [DB] Usuário não encontrado no banco de dados.")
            return None
        
        print("✅ [DB] Usuário encontrado. Verificando a senha...")
        if bcrypt.check_password_hash(usuario['senha_hash'], senha):
            print("✅ [DB] Senha CORRETA. Login autorizado.")
            del usuario['senha_hash'] 
            return usuario
        else:
            print("❌ [DB] Senha INCORRETA.")
            return None
            
    except Exception as e:
        print(f"❌ [DB] Erro excepcional durante a verificação: {e}")
        return None
    finally:
        if conn:
            conn.close()
            print("🔌 [DB] Conexão com o banco fechada.")
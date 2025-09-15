# gerar_hash.py
from flask import Flask
from flask_bcrypt import Bcrypt

# Simplesmente para inicializar o bcrypt
app = Flask(__name__)
bcrypt = Bcrypt(app)

# <<-- COLOQUE A SENHA QUE VOCÊ QUER USAR AQUI -->>
senha_para_hashear = "senha123"

# Gera o hash
hash_gerado = bcrypt.generate_password_hash(senha_para_hashear).decode('utf-8')

print("\n================ HASH GERADO ================")
print(hash_gerado)
print("===========================================\n")
print("COPIE o hash acima e use no seu script SQL.")
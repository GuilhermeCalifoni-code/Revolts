// Frontend/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("▶️ [JS] Página de login carregada. Script login.js em execução.");

    // CORREÇÃO: Usando o ID "loginForm" do seu HTML
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        console.error("❌ [JS] Erro crítico: Formulário com id='loginForm' não encontrado no HTML.");
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log("▶️ [JS] Formulário de login enviado pelo usuário.");

        // CORREÇÃO: Usando os IDs "usuario" e "senha" do seu HTML
        const email = document.getElementById('usuario').value;
        const senha = document.getElementById('senha').value;

        const data = {
            email: email,
            senha: senha
        };
        console.log("▶️ [JS] Enviando para a API (/api/login) os seguintes dados:", data);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            console.log(`◀️ [JS] Resposta recebida do servidor com status: ${response.status}`);

            if (response.ok) {
                console.log("✅ [JS] Login bem-sucedido! Redirecionando para o dashboard...");
                window.location.href = 'dashboard.html';
            } else {
                const errorData = await response.json();
                console.error(`❌ [JS] Falha no login: ${errorData.error}`);
                
                // MUDANÇA: Usando alert() para mostrar o erro, já que não há um campo de erro no HTML
                alert(errorData.error || 'Erro ao tentar fazer login.');
            }

        } catch (error) {
            console.error('❌ [JS] Erro de rede ou na requisição:', error);
            
            // MUDANÇA: Usando alert() para mostrar o erro de rede
            alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
        }
    });
});
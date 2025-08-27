// js/login.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // impede recarregar a página

    // Usuário e senha fixos para teste enquanto não temos um banco de dados 
    const usuarioFixo = "admin@revolts.com";
    const senhaFixa = "1234";

    // Captura os valores digitados
    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    // Validação simples
    if (usuario === usuarioFixo && senha === senhaFixa) {
      alert("Login bem-sucedido 🚀");
      window.location.href = "dashboard.html"; // redireciona para a Home que no caso é o dashboard.html
    } else {
      alert("Usuário ou senha inválidos ❌");
    }
  });
});

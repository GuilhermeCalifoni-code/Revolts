// ================= Navegação entre seções =================
const menuBtns = document.querySelectorAll('.menu-btn');
const secoes = document.querySelectorAll('.secao');

menuBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active do menu
        menuBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Mostra a seção correspondente
        const target = btn.dataset.target;
        secoes.forEach(sec => {
            if(sec.id === target){
                sec.classList.add('ativa');
            } else {
                sec.classList.remove('ativa');
            }
        });
    });
});

// ================= Toggles =================
const toggles = document.querySelectorAll('.toggle');
toggles.forEach(toggle => {
    toggle.addEventListener('change', () => {
        // Toggle já muda visual pelo CSS :checked
        console.log(`Toggle "${toggle.name || toggle.previousElementSibling.textContent}" está ${toggle.checked ? 'Ligado' : 'Desligado'}`);
    });
});

// ================= Sliders =================
const limiteMensal = document.getElementById('limite-mensal');
const limiteMensalVal = document.getElementById('limite-mensal-val');
const limiteDiario = document.getElementById('limite-diario');
const limiteDiarioVal = document.getElementById('limite-diario-val');

limiteMensal.addEventListener('input', () => {
    limiteMensalVal.textContent = limiteMensal.value;
});

limiteDiario.addEventListener('input', () => {
    limiteDiarioVal.textContent = limiteDiario.value;
});

// ================= Botão Salvar Preferências =================
const btnSalvar = document.getElementById('salvar-preferencias');
btnSalvar.addEventListener('click', () => {
    // Perfil
    const perfilForm = document.getElementById('form-perfil');
    const perfilData = Object.fromEntries(new FormData(perfilForm).entries());

    // Exibição
    const exibicaoForm = document.getElementById('form-exibicao');
    const exibicaoData = Object.fromEntries(new FormData(exibicaoForm).entries());

    // Preferências toggles
    const togglesData = {};
    toggles.forEach(t => {
        togglesData[t.name || t.previousElementSibling.textContent] = t.checked;
    });

    // Limites
    const limitesData = {
        limiteMensal: limiteMensal.value,
        limiteDiario: limiteDiario.value
    };

    const dadosCompletos = {
        perfil: perfilData,
        exibicao: exibicaoData,
        toggles: togglesData,
        limites: limitesData
    };

    console.log('Dados Salvos:', dadosCompletos);
    alert('Alterações salvas! (verifique o console)');
});

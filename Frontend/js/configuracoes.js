// ================= Navegação entre seções =================
const CONFIG_STORAGE_KEY = 'energy:config';

const menuBtns = document.querySelectorAll('.tab'); // Seleciona os botões de aba
const secoes = document.querySelectorAll('.secao');

menuBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active do menu
        menuBtns.forEach(b => b.classList.remove('tab--active')); // Remove a classe ativa de todos
        btn.classList.add('tab--active');

        // Mostra a seção correspondente
        const target = btn.dataset.target;
        secoes.forEach(sec => {
            sec.classList.toggle('ativa', sec.id === target);
        });
    });
});

// ================= Toggles =================
const toggles = document.querySelectorAll('.toggle');
toggles.forEach(toggle => {
  toggle.addEventListener('change', () => {
    // A lógica de estado já é gerenciada pelo 'checked' do input
    console.log(`Toggle "${toggle.name}" mudou para: ${toggle.checked}`);
  });
});

// ================= Sliders =================
const limiteMensal = document.getElementById('limite-mensal');
const limiteMensalVal = document.getElementById('limite-mensal-val');
const limiteDiario = document.getElementById('limite-diario');
const limiteDiarioVal = document.getElementById('limite-diario-val');

limiteMensal?.addEventListener('input', () => {
    limiteMensalVal.textContent = limiteMensal.value;
});

limiteDiario?.addEventListener('input', () => {
    limiteDiarioVal.textContent = limiteDiario.value;
});

// ================= Botão Salvar Preferências =================
const btnSalvar = document.getElementById('salvar-preferencias');
btnSalvar?.addEventListener('click', () => {
    const allData = {};

    // Coleta dados de todos os formulários
    document.querySelectorAll('form').forEach(form => {
        const formData = new FormData(form);
        for (let [key, value] of formData.entries()) {
            allData[key] = value;
        }
    });

    // Coleta dados de todos os toggles
    document.querySelectorAll('.toggle').forEach(toggle => {
        if (toggle.name) {
            allData[toggle.name] = toggle.checked;
        }
    });

    // Coleta dados de todos os ranges/sliders
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        if (slider.name) {
            allData[slider.name] = slider.value;
        }
    });

    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(allData));
    console.log('Dados Salvos:', allData);
    alert('Alterações salvas com sucesso! (Verifique o console para ver os dados)');
});

// Upload de foto
const fotoPerfil = document.querySelector('.foto-perfil');
fotoPerfil?.addEventListener('click', () => {
    document.getElementById('upload-foto').click();
});

// ================= Carregar Configurações Salvas =================
function loadSettings() {
    const savedSettings = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!savedSettings) {
        console.log('Nenhuma configuração salva encontrada.');
        return;
    }

    const settings = JSON.parse(savedSettings);
    console.log('Carregando configurações:', settings);

    // Preenche todos os inputs, selects e textareas
    document.querySelectorAll('input[name], select[name], textarea[name]').forEach(el => {
        if (settings[el.name] !== undefined) {
            if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = settings[el.name];
            } else {
                el.value = settings[el.name];
            }

            // Atualiza o valor visual dos sliders
            if (el.type === 'range') {
                el.dispatchEvent(new Event('input'));
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', loadSettings);

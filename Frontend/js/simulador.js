// simulador.js (Versão com dados reais da API e matemática correta)

const $ = s => document.querySelector(s);

let cBar, cDonut, cLine;

// ALTERADO: Constantes atualizadas com valores reais para SP/Brasil
const TARIFA_R_KWH = 0.92;     // Valor médio residencial ENEL SP com impostos
const CO2_KG_POR_KWH = 0.072;  // Fator de emissão do Sistema Interligado Nacional (Brasil)

let kwhHoraDispositivos = {}; // Objeto para guardar os dados do backend

// --- Funções de Formatação e Utilitários ---
function fmtBRL(v){ return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

// --- Funções do Chart.js (Gráficos) ---
function initCharts(){
    cBar = new Chart($('#cBar'), { type:'bar', data:{ labels:['Atual','Simulado'], datasets:[{ label:'Consumo (kWh/mês)', data:[0,0], backgroundColor:['rgba(239,68,68,0.85)','rgba(34,197,94,0.85)'], borderRadius: 8 }] }, options: baseOptions('kWh') });
    cDonut = new Chart($('#cDonut'), { type:'doughnut', data:{ labels:['Consumo Simulado','Economia'], datasets:[{ data:[100,0], backgroundColor:['rgba(59,130,246,0.8)','rgba(34,197,94,0.8)'] }] }, options:{ ...baseOptions(), cutout:'60%', plugins:{ legend:{ position:'bottom', labels:{ color:getTextColor() } } } } });
    cLine = new Chart($('#cLine'), { type:'line', data:{ labels: Array.from({length:12},(_,i)=>`${i+1}º`), datasets:[ { label:'Custo atual (R$)', data:Array(12).fill(0), borderColor:'rgba(239,68,68,0.9)', borderWidth:2, tension:.35, fill:false, pointRadius:0 }, { label:'Custo simulado (R$)', data:Array(12).fill(0), borderColor:'rgba(34,197,94,0.95)', borderWidth:2, tension:.35, fill:false, pointRadius:0 } ] }, options: baseOptions('R$') });
}
function baseOptions(yUnit){ return { responsive:true, maintainAspectRatio:false, scales:{ x:{ ticks:{ color:getTextMuted() }, grid:{ color:'rgba(255,255,255,0.06)' }}, y:{ ticks:{ color:getTextMuted(), callback:v=> yUnit === 'R$' ? fmtBRL(v) : `${v} ${yUnit}` }, grid:{ color:'rgba(255,255,255,0.06)' }} }, plugins:{ legend:{ labels:{ color:getTextMuted() } }, tooltip:{ mode:'index', intersect:false } } }; }
function getTextColor(){ return getComputedStyle(document.body).getPropertyValue('--text') || '#E5E7EB'; }
function getTextMuted(){ return getComputedStyle(document.body).getPropertyValue('--text-muted') || '#9CA3AF'; }

// --- Lógica Principal da Simulação ---
function simular(){
    const dispNome = $('#inpDispositivo').value;
    const hAtual = clamp(parseFloat($('#inpAtual').value) || 0, 0, 24);
    const hDesej = clamp(parseFloat($('#inpDesejado').value) || 0, 0, 24);
    
    const kwhPorHora = kwhHoraDispositivos[dispNome] ?? 0;
    
    const consumoAtualMes   = kwhPorHora * hAtual * 30;
    const consumoSimuladoMes= kwhPorHora * hDesej * 30;

    const economiaKwh = Math.max(0, consumoAtualMes - consumoSimuladoMes);
    const economiaR$  = economiaKwh * TARIFA_R_KWH;
    const co2Kg       = economiaKwh * CO2_KG_POR_KWH;

    // Métricas
    $('#mEnergia').textContent    = `${economiaKwh.toFixed(1)} kWh/mês`;
    $('#mFinanceiro').textContent = `${fmtBRL(economiaR$)}/mês`;
    $('#mCO2').textContent        = `${co2Kg.toFixed(2)} kg CO₂/mês`;

    // Gráficos e Destaques
    cBar.data.datasets[0].data = [consumoAtualMes, consumoSimuladoMes]; cBar.update();
    cDonut.data.datasets[0].data = [consumoSimuladoMes, economiaKwh]; cDonut.update();
    const custoAtualMes = consumoAtualMes * TARIFA_R_KWH;
    const custoSimuladoMes = consumoSimuladoMes * TARIFA_R_KWH;
    cLine.data.datasets[0].data = Array(12).fill(custoAtualMes);
    cLine.data.datasets[1].data = Array(12).fill(custoSimuladoMes);
    cLine.update();
    $('#hFinanceiro').textContent = fmtBRL(economiaR$ * 12);
    $('#hEnergia').textContent    = `${(economiaKwh * 12).toFixed(0)} kWh`;
    $('#hCO2').textContent        = `${(co2Kg * 12).toFixed(1)} kg`;
}

// --- Inicialização da Página ---
async function init() {
    initCharts();
    try {
        const response = await fetch('/api/simulator-data'); // Rota que criamos no app.py
        if (!response.ok) throw new Error("Falha na API de dados do simulador");
        kwhHoraDispositivos = await response.json();

        const selector = $('#inpDispositivo');
        selector.innerHTML = '';
        Object.keys(kwhHoraDispositivos).forEach(nomeDispositivo => {
            const option = document.createElement('option');
            option.value = nomeDispositivo;
            option.textContent = nomeDispositivo;
            selector.appendChild(option);
        });
        
        selector.addEventListener('change', simular);
        simular();
    } catch(error) {
        console.error("Erro ao inicializar o simulador:", error);
        alert("Não foi possível carregar os dados de consumo dos seus dispositivos.");
    }
    $('#btnSimular').addEventListener('click', simular);
}

document.addEventListener('DOMContentLoaded', init);
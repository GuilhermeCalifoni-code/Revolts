// Frontend/js/simulador.js (Versão Final e Corrigida)
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
let cBar, cLine;
let TARIFA_R_KWH = 0.92;
let CO2_KG_POR_KWH = 0.072;
let kwhHoraDispositivos = {};
function fmtBRL(v){ return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function initCharts(){
    const canvasBar = $('#cBar');
    if (!canvasBar) { console.log("Gráfico de Barras do Simulador não encontrado."); return; }
    cBar = new Chart(canvasBar, { type:'bar', data:{ labels:['Custo Atual','Custo Simulado'], datasets:[{ label:'Custo Mensal (R$)', data:[0,0], backgroundColor:['rgba(239,68,68,0.85)','rgba(34,197,94,0.85)'], borderRadius: 8 }] }, options: baseOptions('R$') });
    cLine = new Chart($('#cLine'), { type:'line', data:{ labels: Array.from({length:12},(_,i)=>`${i+1}º Mês`), datasets:[ { label:'Projeção de Custo Atual (R$)', data:Array(12).fill(0), borderColor:'rgba(239,68,68,0.9)', borderWidth:2, tension:.35, fill:false, pointRadius:0 }, { label:'Projeção de Custo Simulado (R$)', data:Array(12).fill(0), borderColor:'rgba(34,197,94,0.95)', borderWidth:2, tension:.35, fill:false, pointRadius:0 } ] }, options: baseOptions('R$') });
}
function baseOptions(yUnit){ return { responsive:true, maintainAspectRatio:false, scales:{ x:{ ticks:{ color:getTextMuted() }, grid:{ color:'rgba(255,255,255,0.06)' }}, y:{ ticks:{ color:getTextMuted(), callback:v=> yUnit === 'R$' ? fmtBRL(v) : `${v} ${yUnit}` }, grid:{ color:'rgba(255,255,255,0.06)' }} }, plugins:{ legend:{ labels:{ color:getTextMuted() } }, tooltip:{ mode:'index', intersect:false } } }; }
function getTextColor(){ return getComputedStyle(document.body).getPropertyValue('--text') || '#E5E7EB'; }
function getTextMuted(){ return getComputedStyle(document.body).getPropertyValue('--text-muted') || '#9CA3AF'; }
function simular(){
    const dispNome = $('#inpDispositivo').value;
    const hAtual = clamp(parseFloat($('#inpAtual').value) || 0, 0, 24);
    const hDesej = clamp(parseFloat($('#inpDesejado').value) || 0, 0, 24);
    const kwhPorHora = kwhHoraDispositivos[dispNome] ?? 0;
    const consumoAtualMes = kwhPorHora * hAtual * 30;
    const custoAtualMes = consumoAtualMes * TARIFA_R_KWH;
    const consumoSimuladoMes = kwhPorHora * hDesej * 30;
    const custoSimuladoMes = consumoSimuladoMes * TARIFA_R_KWH;
    const economiaKwh = consumoAtualMes - consumoSimuladoMes;
    const economiaR$  = custoAtualMes - custoSimuladoMes;
    const co2Kg = economiaKwh * CO2_KG_POR_KWH;
    $('#mFinanceiro').textContent = `${fmtBRL(economiaR$)}/mês`;
    $('#mEnergia').textContent = `${economiaKwh.toFixed(1)} kWh/mês`;
    $('#mCO2').textContent = `${co2Kg.toFixed(2)} kg CO₂/mês`;
    if (cBar) { cBar.data.datasets[0].data = [custoAtualMes, custoSimuladoMes]; cBar.update(); }
    if (cLine) {
        cLine.data.datasets[0].data = Array.from({length:12}, (_, i) => custoAtualMes * (i + 1));
        cLine.data.datasets[1].data = Array.from({length:12}, (_, i) => custoSimuladoMes * (i + 1));
        cLine.update();
    }
    $('#hFinanceiro').textContent = fmtBRL(economiaR$ * 12);
    $('#hEnergia').textContent    = `${(economiaKwh * 12).toFixed(0)} kWh`;
    $('#hCO2').textContent        = `${(co2Kg * 12).toFixed(1)} kg`;
}
async function init() {
    initCharts();
    try {
        const [configResp, devicesResp] = await Promise.all([ fetch('/api/config-constants'), fetch('/api/simulator-data') ]);
        if (!configResp.ok) throw new Error("Falha na API de configuração");
        const configData = await configResp.json();
        TARIFA_R_KWH = configData.TARIFA_R_KWH; CO2_KG_POR_KWH = configData.CO2_KG_POR_KWH;
        if (!devicesResp.ok) throw new Error("Falha na API de dados do simulador");
        kwhHoraDispositivos = await devicesResp.json();
        const selector = $('#inpDispositivo');
        selector.innerHTML = '';
        Object.keys(kwhHoraDispositivos).forEach(nomeDispositivo => {
            const option = document.createElement('option');
            option.value = nomeDispositivo;
            option.textContent = nomeDispositivo;
            selector.appendChild(option);
        });
        selector.addEventListener('input', simular);
        $('#inpAtual').addEventListener('input', simular);
        $('#inpDesejado').addEventListener('input', simular);
        $('#btnSimular').addEventListener('click', simular);
        simular();
    } catch(error) {
        console.error("Erro ao inicializar o simulador:", error);
        alert("Não foi possível carregar os dados para o simulador.");
    }
}
document.addEventListener('DOMContentLoaded', init);
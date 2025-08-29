// simulador.js
const $ = s => document.querySelector(s);

let cBar, cDonut, cLine;

const TARIFA_R$KWH = 0.78;       
const CO2_KG_POR_KWH = 0.45;      

function fmtBRL(v){ return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }

function initCharts(){
  cBar = new Chart($('#cBar'), {
    type:'bar',
    data:{
      labels:['Atual','Simulado'],
      datasets:[
        { label:'Consumo (kWh/mês)', data:[0,0], backgroundColor:['rgba(239,68,68,0.85)','rgba(34,197,94,0.85)'], borderRadius: 8 }
      ]
    },
    options: baseOptions('kWh')
  });

  cDonut = new Chart($('#cDonut'), {
    type:'doughnut',
    data:{
      labels:['Consumo Simulado','Economia'],
      datasets:[{ data:[100,0], backgroundColor:['rgba(59,130,246,0.8)','rgba(34,197,94,0.8)'] }]
    },
    options:{ ...baseOptions(), cutout:'60%', plugins:{ legend:{ position:'bottom', labels:{ color:getTextColor() } } } }
  });

  cLine = new Chart($('#cLine'), {
    type:'line',
    data:{
      labels: Array.from({length:12},(_,i)=>`${i+1}º`),
      datasets:[
        { label:'Consumo atual (kWh)', data:Array(12).fill(0), borderColor:'rgba(239,68,68,0.9)', borderWidth:2, tension:.35, fill:false, pointRadius:0 },
        { label:'Consumo simulado (kWh)', data:Array(12).fill(0), borderColor:'rgba(34,197,94,0.95)', borderWidth:2, tension:.35, fill:false, pointRadius:0 }
      ]
    },
    options: baseOptions('kWh')
  });
}

function baseOptions(yUnit){
  return {
    responsive:true, maintainAspectRatio:false,
    scales:{
      x:{ ticks:{ color:getTextMuted() }, grid:{ color:'rgba(255,255,255,0.06)' }},
      y:{ ticks:{ color:getTextMuted(), callback:v=>`${v} ${yUnit||''}` }, grid:{ color:'rgba(255,255,255,0.06)' }}
    },
    plugins:{ legend:{ labels:{ color:getTextMuted() } }, tooltip:{ mode:'index', intersect:false } }
  };
}
function getTextColor(){ return getComputedStyle(document.body).getPropertyValue('--text') || '#E5E7EB'; }
function getTextMuted(){ return getComputedStyle(document.body).getPropertyValue('--text-muted') || '#9CA3AF'; }

// Modelo simples de consumo por dispositivo (kWh por hora)
const kwhHora = {
  'Ar Condicionado': 1.2,
  'Geladeira': 0.12,
  'TV': 0.09,
  'Iluminação': 0.06,
  'Máquina de Lavar': 0.5,
  'Computador': 0.15
};

function simular(){
  const disp = $('#inpDispositivo').value;
  const hAtual = clamp(parseFloat($('#inpAtual').value) || 0, 0, 24);
  const hDesej = clamp(parseFloat($('#inpDesejado').value) || 0, 0, 24);

  const kwhPorHora = kwhHora[disp] ?? 0.1;
  const dias = $('#periodo')?.value === '12m' ? 365/12*1 : 30; // mantém 30d padrão

  const consumoAtualMes   = kwhPorHora * hAtual  * 30;
  const consumoSimuladoMes= kwhPorHora * hDesej  * 30;

  const economiaKwh = Math.max(0, consumoAtualMes - consumoSimuladoMes);
  const economiaR$  = economiaKwh * TARIFA_R$/KWH;
  const co2Kg       = economiaKwh * CO2_KG_POR_KWH;

  // Métricas
  $('#mEnergia').textContent   = `${economiaKwh.toFixed(1)} kWh/mês`;
  $('#mFinanceiro').textContent= `${fmtBRL(economiaR$)}/mês`;
  $('#mCO2').textContent       = `${co2Kg.toFixed(1)} kg CO₂/mês`;

  // Gráfico barras
  cBar.data.datasets[0].data = [consumoAtualMes, consumoSimuladoMes];
  cBar.update();

  // Donut
  cDonut.data.datasets[0].data = [consumoSimuladoMes, economiaKwh];
  cDonut.update();

  // Projeção 12 meses
  const atual12 = Array.from({length:12},()=>consumoAtualMes);
  const sim12   = Array.from({length:12},()=>consumoSimuladoMes);
  cLine.data.datasets[0].data = atual12;
  cLine.data.datasets[1].data = sim12;
  cLine.update();

  // Destaques
  const ecoAnualR$ = economiaR$ * 12;
  const ecoAnualKwh = economiaKwh * 12;
  const ecoAnualCO2 = co2Kg * 12;

  $('#hFinanceiro').textContent = fmtBRL(ecoAnualR$);
  $('#hEnergia').textContent    = `${ecoAnualKwh.toFixed(0)} kWh`;
  $('#hCO2').textContent        = `${ecoAnualCO2.toFixed(0)} kg`;
}

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

// Eventos
document.addEventListener('DOMContentLoaded', ()=>{
  // abrir/fechar sidebar no mobile
  document.getElementById('btnBurger')?.addEventListener('click', ()=>{
    document.querySelector('.sidebar').classList.toggle('open');
  });

  initCharts();
  document.getElementById('btnSimular').addEventListener('click', simular);
  // simulação inicial
  simular();
});

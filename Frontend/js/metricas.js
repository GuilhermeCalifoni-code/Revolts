// metricas.js
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Mock de dados
const hourly24 = [0.2,0.3,0.5,0.6,0.9,1.8,3.0,4.4,5.2,6.0,7.1,6.4,5.0,3.6,2.4,1.8,1.2,0.9,0.6,0.4,0.3,0.25,0.2,0.15];
const week = [82, 96, 110, 105, 120, 134, 98]; // dom..sáb
const devices = { 'Ar Cond.': 38, 'Geladeira': 22, 'Iluminação': 14, 'TV/Áudio': 11, 'Outros': 15 };

// Gráficos
let g1, g2, g3;

function chartLine(ctx, labels, data){
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels, datasets: [{
        label: 'kW',
        data,
        borderWidth: 2,
        fill: false,
        tension: 0.35,
        borderColor: 'rgba(34,197,94,0.9)',
        pointRadius: 0
      }]
    },
    options: baseOptions('kW')
  });
}

function chartBar(ctx, labels, data, color='rgba(59,130,246,0.85)'){
  return new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'kWh', data, backgroundColor: color, borderRadius: 6 }] },
    options: baseOptions('kWh')
  });
}

function chartDonut(ctx, labels, data){
  return new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: [
      'rgba(59,130,246,0.8)','rgba(34,197,94,0.8)','rgba(245,158,11,0.8)','rgba(148,163,184,0.8)','rgba(99,102,241,0.8)'] }]},
    options: {
      ...baseOptions(),
      cutout: '62%',
      plugins: { legend: { position:'bottom', labels:{ color:getTextColor() } } }
    }
  });
}

function baseOptions(yUnit){
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color:getTextMuted() }, grid: { color:'rgba(255,255,255,0.06)' } },
      y: { ticks: { color:getTextMuted(), callback: v => yUnit? `${v} ${yUnit}`: v }, grid: { color:'rgba(255,255,255,0.06)' } }
    },
    plugins: { legend: { display:false }, tooltip: { mode:'index', intersect:false } }
  };
}
function getTextColor(){ return getComputedStyle(document.body).getPropertyValue('--text') || '#E5E7EB'; }
function getTextMuted(){ return getComputedStyle(document.body).getPropertyValue('--text-muted') || '#9CA3AF'; }

function initCharts(){
  g1 = chartLine($('#g1'), [...Array(24).keys()].map(h=>String(h).padStart(2,'0')+'h'), hourly24);
  g2 = chartBar($('#g2'), ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'], week);
  g3 = chartDonut($('#g3'), Object.keys(devices), Object.values(devices));
}

// Abas (rótulos apenas demonstrativos)
$$('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.tab').forEach(t=>t.classList.remove('tab--active'));
    btn.classList.add('tab--active');
    const t = btn.dataset.tab;
    $('#g1-title').textContent = (
      t==='t1' ? 'Consumo por Hora — últimas 24h' :
      t==='t2' ? 'Consumo por Hora — dispositivos' :
      t==='t3' ? 'Comparativo de períodos' :
                 'Tendências (média móvel)');
    $('#g2-title').textContent = (
      t==='t1' ? 'Consumo Semanal (kWh)' :
      t==='t2' ? 'Consumo por Dispositivo (kWh)' :
      t==='t3' ? 'Consumo Mensal (kWh)' :
                 'Tendência Semanal (kWh)');
  });
});

// Estatísticas
function updateStats(){
  const media = hourly24.reduce((a,b)=>a+b,0)/hourly24.length;
  const pico = Math.max(...hourly24);
  const min = Math.min(...hourly24);
  const eficiencia = Math.max(70, Math.min(96, Math.round(100 - (pico-media)*10)));

  $('#st-media').textContent = `${media.toFixed(2)} kW`;
  $('#st-pico').textContent  = `${pico.toFixed(2)} kW`;
  $('#st-min').textContent   = `${min.toFixed(2)} kW`;
  $('#st-efi').textContent   = `${eficiencia}%`;
}

document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  updateStats();
});

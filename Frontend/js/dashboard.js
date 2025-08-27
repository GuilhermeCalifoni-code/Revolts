/* dashboard.js — renderização, mocks, tema, refresh, toasts, localStorage */

import { ChartsUtil, renderBarsChart, renderLineChart } from './charts.js';

/* MOCK: (copiar exatamente) */
const MOCK = {
  today: { kwh: 24.5, cost: 18.75, progress: 65 },
  monthly: { kwh: 485.2, cost: 371.54, deltaPct: -5.4 },
  billEstimate: { cost: 425.80, status: 'above' },
  system: { status: 'online', lastUpdate: 'agora' },
  monthlyBars: [480, 455, 500, 470], // Jan..Abr
  hourly24: [0.1,0.2,0.3,0.6,1.0,2.1,3.0,4.2,5.5,6.8,7.1,5.8,4.6,3.2,2.5,1.9,1.2,0.9,0.6,0.4,0.2,0.15,0.12,0.08],
  info: {
    economyPct: 5.3,
    peakHours: '18h–22h',
    metaRemaining: 54.20,
    metaGoal: 400
  }
};

const STORAGE_KEY = 'energy:dashboard:data';
const THEME_KEY = 'energy:theme';

function ensureData(){
  if(!localStorage.getItem(STORAGE_KEY)){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK));
  }
  return JSON.parse(localStorage.getItem(STORAGE_KEY));
}

function saveData(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatCurrency(n){
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function setLive(msg){
  const el = document.getElementById('srLive');
  if(el){ el.textContent = msg; }
}

function applyThemeFromStorage(){
  const saved = localStorage.getItem(THEME_KEY);
  if(saved){
    document.body.classList.toggle('theme-light', saved === 'light');
    document.body.classList.toggle('theme-dark', saved !== 'light');
    return;
  }
  // padrão: se preferir dark, usar dark
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('theme-dark', prefersDark);
  document.body.classList.toggle('theme-light', !prefersDark);
}

function toggleTheme(){
  const isLight = document.body.classList.contains('theme-light');
  const next = isLight ? 'dark' : 'light';
  document.body.classList.toggle('theme-light', !isLight);
  document.body.classList.toggle('theme-dark', isLight);
  localStorage.setItem(THEME_KEY, next);
  setLive(`Tema ${next === 'light' ? 'claro' : 'escuro'} ativado`);
}

/* Renderização dos cards */
function renderCards(data){
  // Hoje
  document.getElementById('todayKwh').textContent = `${data.today.kwh.toFixed(1)} kWh`;
  document.getElementById('todayCost').textContent = formatCurrency(data.today.cost);
  const prog = document.getElementById('todayProgress');
  prog.style.width = `${data.today.progress}%`;
  prog.setAttribute('aria-valuenow', String(data.today.progress));
  document.getElementById('todayFoot').textContent = `${data.today.progress}% da meta diária`;

  // Mensal
  document.getElementById('monthKwh').textContent = `${data.monthly.kwh.toFixed(1)} kWh`;
  document.getElementById('monthCost').textContent = formatCurrency(data.monthly.cost);
  const monthDelta = document.getElementById('monthDelta');
  const delta = data.monthly.deltaPct;
  const isDown = delta < 0;
  monthDelta.textContent = `${isDown ? '▼' : '▲'} ${Math.abs(delta).toFixed(1)}% vs mês anterior`;
  monthDelta.classList.toggle('compare-text--green', isDown);
  monthDelta.classList.toggle('compare-text--red', !isDown);

  // Fatura estimada
  document.getElementById('billCost').textContent = formatCurrency(data.billEstimate.cost);
  const chip = document.getElementById('billChip');
  if(data.billEstimate.status === 'above'){
    chip.textContent = 'Acima da meta';
    chip.className = 'chip chip--danger';
  }else{
    chip.textContent = 'Dentro da meta';
    chip.className = 'chip';
  }

  // Sistema
  document.getElementById('sysStatus').textContent = data.system.status === 'online' ? 'Online' : 'Offline';
  document.getElementById('sysStatus').classList.toggle('metric-value--green', data.system.status === 'online');
  document.getElementById('sysSub').textContent = data.system.status === 'online' ? 'Todos os sensores ativos' : 'Verificar sensores';
  document.getElementById('sysLast').textContent = `Última atualização: ${data.system.lastUpdate}`;

  // Info cards
  document.getElementById('infoEconomy').textContent = `Você economizou ${data.info.economyPct}% este mês comparado ao anterior. Continue assim!`;
  document.getElementById('infoPeak').textContent = `Maior consumo entre ${data.info.peakHours}. Considere usar aparelhos fora desse período.`;
  document.getElementById('infoGoal').textContent = `Faltam ${formatCurrency(data.info.metaRemaining)} para atingir sua meta de economia de ${formatCurrency(data.info.metaGoal)}/mês.`;
}

/* Gráficos */
let mensalChart, horaChart;

function renderCharts(data){
  const c1 = document.getElementById('chartMensal');
  const c2 = document.getElementById('chartHora');

  // Barras: Atual vs Anterior
  const mensalAtual = data.monthlyBars; // Jan..Abr
  // anterior: leve variação para efeito visual
  const mensalAnterior = mensalAtual.map((v,i)=> Math.max(0, Math.round(v * (0.95 + Math.random()*0.1))));

  const labelsMes = ['Jan','Fev','Mar','Abr'];

  mensalChart = renderBarsChart(c1, [
    { label: 'Atual', data: mensalAtual },
    { label: 'Mês anterior', data: mensalAnterior }
  ], { labels: labelsMes, max: 600 });

  // Linha: 24h (amostrar 12 pontos para eixo X 00h..20h)
  const hourly = data.hourly24;
  const labelsHora = ['00h','04h','08h','12h','16h','20h'];
  // gerar 12 pontos (média de blocos de 2)
  const pts12 = [];
  for(let i=0;i<24;i+=2){
    pts12.push( (hourly[i] + hourly[i+1]) / 2 );
  }
  horaChart = renderLineChart(c2, { data: pts12 }, { labels: labelsHora, max: 8, duration: 900 });
}

/* Refresh: aleatoriza +/-8% e re-renderiza */
function vary(val, pct=0.08){ const f = 1 + (Math.random()*2*pct - pct); return val*f; }
function refreshData(){
  const data = ensureData();

  data.today.kwh = Math.max(5, +vary(data.today.kwh));
  data.today.cost = Math.max(3, +vary(data.today.cost));
  data.today.progress = Math.round(clampNum(vary(data.today.progress), 10, 100));

  data.monthly.kwh = Math.max(100, +vary(data.monthly.kwh));
  data.monthly.cost = Math.max(80, +vary(data.monthly.cost));
  // delta entre -9% e +9%
  data.monthly.deltaPct = +( (Math.random()*18 - 9).toFixed(1) );

  data.billEstimate.cost = Math.max(120, +vary(data.billEstimate.cost));
  data.billEstimate.status = data.billEstimate.cost > 400 ? 'above' : 'ok';

  // barras (Jan..Abr)
  data.monthlyBars = data.monthlyBars.map(v => Math.round(Math.max(60, vary(v))));

  // hourly 24
  data.hourly24 = data.hourly24.map(v => +(Math.max(0.05, vary(v))).toFixed(2));

  data.system.lastUpdate = 'agora';

  // info
  data.info.economyPct = +((Math.random()*8)+1).toFixed(1);
  data.info.metaRemaining = +(Math.max(10, vary(data.info.metaRemaining))).toFixed(2);

  saveData(data);
  renderCards(data);
  renderCharts(data); // reanima
  announceUpdate();
  detectHighConsumption(data);
  document.getElementById('lastUpdate').textContent = 'Última atualização: agora';
}

function clampNum(v, a, b){ return Math.max(a, Math.min(b, v)); }

/* Toast de pico elevado */
function detectHighConsumption(data){
  const limit = 6.5;
  const idx = data.hourly24.findIndex(v => v > limit);
  if(idx >= 0){
    const hh = String(idx).padStart(2,'0') + ':00';
    showToast(`Consumo alto detectado às ${hh}`, ()=> {
      // ação "ver detalhe": focar gráfico de hora
      document.getElementById('chartHora').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}

function showToast(message, onClick){
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toastMsg');
  const btn = document.getElementById('toastBtn');
  msg.textContent = message;
  toast.classList.add('show');
  const clickHandler = ()=>{
    toast.classList.remove('show');
    if(onClick) onClick();
    btn.removeEventListener('click', clickHandler);
  };
  btn.addEventListener('click', clickHandler);
  setTimeout(()=> toast.classList.remove('show'), 5000);
}

/* Acessibilidade: anunciar mudanças */
function announceUpdate(){
  setLive('Dados do dashboard atualizados.');
}

/* Sidebar mobile */
function setupSidebar(){
  const btn = document.getElementById('btnBurger');
  const sidebar = document.querySelector('.sidebar');
  btn?.addEventListener('click', ()=>{
    sidebar.classList.toggle('open');
  });
}

/* Inicialização */
function init(){
  applyThemeFromStorage();

  const data = ensureData();
  // se acabou de criar, garantir persistência
  saveData(data);

  renderCards(data);
  renderCharts(data);
  detectHighConsumption(data);

  // Botões
  document.getElementById('btnRefresh').addEventListener('click', refreshData);
  document.getElementById('btnThemeToggle').addEventListener('click', toggleTheme);

  // ação de recarregar do card 1 (apenas delega ao refresh)
  document.querySelectorAll('.card-action').forEach(btn=>{
    btn.addEventListener('click', refreshData);
  });

  setupSidebar();
}

window.addEventListener('DOMContentLoaded', init);

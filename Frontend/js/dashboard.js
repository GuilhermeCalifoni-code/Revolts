// dashboard.js (Versão Final com Foco em R$)

import { renderBarsChart, renderLineChart } from './charts.js';

// ... (fetchDashboardData, formatCurrency, setLive continuam os mesmos) ...
async function fetchDashboardData() { console.log("▶️ [DashboardJS] Buscando dados do backend..."); const response = await fetch('/api/dashboard-data'); if (!response.ok) { console.error("❌ [DashboardJS] Falha ao buscar dados do backend."); alert("Não foi possível carregar os dados do dashboard."); return null; } const data = await response.json(); console.log("✅ [DashboardJS] Dados recebidos:", data); return data; }
function formatCurrency(n){ return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function setLive(msg){ const el = document.getElementById('srLive'); if(el){ el.textContent = msg; } }

function renderCards(data){
    document.getElementById('todayCost').textContent = formatCurrency(data.today.cost);
    document.getElementById('todayKwh').textContent = `${data.today.kwh.toFixed(1)} kWh`;
    document.getElementById('monthCost').textContent = formatCurrency(data.monthly.cost);
    document.getElementById('monthKwh').textContent = `${data.monthly.kwh.toFixed(1)} kWh`;
    const prog = document.getElementById('todayProgress'); prog.style.width = `${data.today.progress}%`; prog.setAttribute('aria-valuenow', String(data.today.progress)); document.getElementById('todayFoot').textContent = `${data.today.progress}% da meta diária`;
    const monthDelta = document.getElementById('monthDelta'); const delta = data.monthly.deltaPct; const isDown = delta < 0; monthDelta.textContent = `${isDown ? '▼' : '▲'} ${Math.abs(delta).toFixed(1)}% vs mês anterior`; monthDelta.classList.toggle('compare-text--green', isDown); monthDelta.classList.toggle('compare-text--red', !isDown);
    document.getElementById('billCost').textContent = formatCurrency(data.billEstimate.cost);
    const chip = document.getElementById('billChip');
    if(data.billEstimate.status === 'above'){ chip.textContent = 'Acima da meta'; chip.className = 'chip chip--danger'; }else{ chip.textContent = 'Dentro da meta'; chip.className = 'chip';}
    document.getElementById('sysStatus').textContent = data.system.status === 'online' ? 'Online' : 'Offline'; document.getElementById('sysStatus').classList.toggle('metric-value--green', data.system.status === 'online'); document.getElementById('sysSub').textContent = data.system.status === 'online' ? 'Todos os sensores ativos' : 'Verificar sensores'; document.getElementById('sysLast').textContent = `Última atualização: ${data.system.lastUpdate}`;
    document.getElementById('infoEconomy').textContent = data.info.economyMessage;
    document.getElementById('infoPeak').textContent = data.info.peakMessage;
    document.getElementById('infoGoal').textContent = data.info.goalMessage;
}
  
let mensalChart, horaChart;

function initCharts(data) {
    const c1 = document.getElementById('chartMensal');
    const c2 = document.getElementById('chartHora');

    // Gráfico de Barras com Custo (R$)
    const monthlyDataFromAPI = data.monthlyBars;
    const monthlyCostValues = monthlyDataFromAPI.map(d => d.cost);
    const monthLabels = monthlyDataFromAPI.map(d => d.mes_nome);
    const barBlue = 'rgba(59,130,246,0.55)'; const barGray = 'rgba(107,114,128,0.35)';
    const barColors = monthlyDataFromAPI.map(d => d.isCurrent ? barBlue : barGray);

    if (mensalChart) mensalChart.destroy();
    mensalChart = renderBarsChart(c1, [{ label: 'Custo (R$)', data: monthlyCostValues, colors: barColors, meta: { kwh: monthlyDataFromAPI.map(d => d.kwh) }}], { labels: monthLabels, max: 450 });

    // Gráfico de Linha com Custo (R$)
    if (horaChart) horaChart.destroy();
    const hourlyDataFromAPI = data.hourly24;
    const costValues = hourlyDataFromAPI.map(d => d.cost); // Usa o custo
    const horaAtualJS = new Date().getHours();
    const hourLabels = hourlyDataFromAPI.map(item => {
        const horaDoDado = item.hora;
        if (horaDoDado === horaAtualJS) { return 'Agora'; }
        if (horaDoDado % 3 === 0) { return `${String(horaDoDado).padStart(2, '0')}h`; }
        return '';
    });
    
    // Passa o custo como dado principal e o kwh como metadado
    horaChart = renderLineChart(c2, { data: costValues, meta: { kwh: hourlyDataFromAPI.map(d => d.kwh) }}, { labels: hourLabels, max: 3, yUnit: 'R$' });
}

async function init(){
    const data = await fetchDashboardData();
    if (data) {
        renderCards(data);
        initCharts(data);
        document.getElementById('btnRefresh').addEventListener('click', init);
    }
}

window.addEventListener('DOMContentLoaded', init);
// metricas.js (Versão de Debug Simplificada e Robusta)

const $ = (sel) => document.querySelector(sel);

// API FETCHER ÚNICO
async function fetchMetricasGerais() {
    console.log("1. [JS] Iniciando busca na API /api/metricas-gerais...");
    const response = await fetch('/api/metricas-gerais');
    
    if (!response.ok) {
        console.error(`❌ [JS] A API respondeu com erro! Status: ${response.status}`);
        throw new Error("Falha ao buscar métricas gerais");
    }
    
    console.log("2. [JS] Resposta da API recebida com sucesso.");
    const data = await response.json();
    console.log("3. [JS] Dados recebidos do backend:", data);
    return data;
}

// --- CHARTING (usando Chart.js) ---
let g1, g2, g3;
function chartLine(ctx, labels, data) { return new Chart(ctx, {type:'line',data:{labels,datasets:[{label:'kW',data,borderWidth:2,fill:true,backgroundColor:'rgba(34,197,94,0.1)',tension:0.35,borderColor:'rgba(34,197,94,0.9)',pointRadius:0}]},options:baseOptions('kW')}); }
function chartBar(ctx, labels, data, color='rgba(59,130,246,0.85)') { return new Chart(ctx, {type:'bar',data:{labels,datasets:[{label:'kWh',data,backgroundColor:color,borderRadius:6}]},options:baseOptions('kWh')}); }
function chartDonut(ctx, labels, data) {
    return new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: ['#3B82F6','#22C55E','#F59E0B','#94A3B8','#6366F1'] }]},
        options: {
            ...baseOptions(), cutout: '62%',
            plugins: {
                legend: { position: 'bottom', labels: { color: getTextColor() }},
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed !== null) {
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? (context.parsed / total * 100).toFixed(1) : 0;
                                label += `${context.raw.toFixed(2)} kWh (${percentage}%)`;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}
function baseOptions(yUnit) { return {responsive:true,maintainAspectRatio:false,scales:{x:{ticks:{color:getTextMuted()},grid:{color:'rgba(255,255,255,0.06)'}},y:{ticks:{color:getTextMuted(),callback:v=>yUnit?`${v} ${yUnit}`:v},grid:{color:'rgba(255,255,255,0.06)'}}},plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false}}}; }
function getTextColor(){ return getComputedStyle(document.body).getPropertyValue('--text-color') || '#E5E7EB'; }
function getTextMuted(){ return getComputedStyle(document.body).getPropertyValue('--text-muted') || '#9CA3AF'; }

// --- UI UPDATER ---
function updateUI(data) {
    console.log("4. [JS] Iniciando atualização da UI (gráficos e stats)...");
    
    if (g1) g1.destroy(); if (g2) g2.destroy(); if (g3) g3.destroy();
    g1 = chartLine($('#g1'), [...Array(24).keys()].map(h => String(h).padStart(2,'0') + 'h'), data.hourly24);
    g2 = chartBar($('#g2'), ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'], data.week);
    g3 = chartDonut($('#g3'), Object.keys(data.devices), Object.values(data.devices));

    const hourly = data.hourly24;
    if (!hourly || hourly.length === 0 || hourly.every(v => v === 0)) {
        $('#st-media').textContent = '0.00 kW'; $('#st-pico').textContent = '0.00 kW'; $('#st-min').textContent = '0.00 kW';
        if($('#st-efi')) $('#st-efi').textContent = '100%';
        console.log("5. [JS] UI atualizada com dados ZERADOS.");
        return;
    }
    const media = hourly.reduce((a,b) => a+b, 0) / hourly.length;
    const pico = Math.max(...hourly);
    const minValoresPositivos = hourly.filter(v => v > 0);
    const min = minValoresPositivos.length > 0 ? Math.min(...minValoresPositivos) : 0;
    const eficiencia = Math.max(70, Math.min(96, Math.round(100 - (pico - media) * 10)));
    $('#st-media').textContent = `${media.toFixed(2)} kW`;
    $('#st-pico').textContent  = `${pico.toFixed(2)} kW`;
    $('#st-min').textContent   = `${min.toFixed(2)} kW`;
    if($('#st-efi')) $('#st-efi').textContent = `${eficiencia}%`;
    
    console.log("5. [JS] Atualização da UI concluída com SUCESSO.");
}

// --- INITIALIZATION ---
async function init() {
    try {
        const dataGeral = await fetchMetricasGerais();
        updateUI(dataGeral);
    } catch (error) {
        console.error("ERRO FATAL NA INICIALIZAÇÃO:", error);
        alert("Ocorreu um erro ao carregar a página. Verifique o console do navegador e o terminal do Python para mais detalhes.");
    }
}

document.addEventListener('DOMContentLoaded', init);
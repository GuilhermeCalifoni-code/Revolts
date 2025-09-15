// previsoes.js (Versão Final Restaurada e Corrigida)

document.addEventListener('DOMContentLoaded', () => {
    let previsoesChart = null;
    const CORES = { green: 'rgba(34, 197, 94, 0.9)', amber: 'rgba(245, 158, 11, 0.9)' };

    function render(dados) {
        if (!dados || dados.length === 0) {
            document.body.innerHTML = "<h1>Não há dados suficientes para gerar previsões.</h1>";
            return;
        }

        const consumoMedio = dados.reduce((sum, p) => sum + p.consumo, 0) / dados.length;
        const custoMedio = dados.reduce((sum, p) => sum + p.custo, 0) / dados.length;
        const confianca = dados[0].confianca;

        document.getElementById('consumoTotal').textContent = `${consumoMedio.toFixed(1)} kWh/mês`;
        document.getElementById('custoTotal').textContent = `R$ ${custoMedio.toFixed(2)}/mês`;
        document.getElementById('confiancaMedia').textContent = `${confianca} %`;

        const containerMensais = document.getElementById("cards-mensais");
        containerMensais.innerHTML = '';
        dados.forEach((p) => {
            const card = document.createElement("article");
            card.className = "card card-diario";
            card.innerHTML = `
              <h4>📅 ${p.mes}</h4>
              <p class="consumo">Consumo: ${p.consumo.toFixed(1)} kWh</p>
              <p class="custo">Custo: R$ ${p.custo.toFixed(2)}</p>
              <ul>${p.fatores.map((f) => `<li>${f}</li>`).join("")}</ul>
              <div class="barra"><span style="width:${p.confianca}%;"></span></div>
              <p class="confianca">${p.confianca}% confiança</p>
            `;
            containerMensais.appendChild(card);
        });
        
        renderChart(dados);
    }
    
    function renderChart(dados) {
        const ctx = document.getElementById('chartPrevisoes').getContext('2d');
        const labels = dados.map(p => p.mes);
        if (previsoesChart) { previsoesChart.destroy(); }
        previsoesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Consumo (kWh)', data: dados.map(p => p.consumo), borderColor: CORES.green, backgroundColor: CORES.green.replace('0.9', '0.1'), tension: 0.4, fill: true, yAxisID: 'y' },
                    { label: 'Custo (R$)', data: dados.map(p => p.custo), borderColor: CORES.amber, backgroundColor: CORES.amber.replace('0.9', '0.1'), tension: 0.4, fill: true, yAxisID: 'y1' },
                ],
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { type: 'linear', display: true, position: 'left', beginAtZero: true, title: { display: true, text: 'Consumo (kWh)' } },
                    y1: { type: 'linear', display: true, position: 'right', beginAtZero: true, title: { display: true, text: 'Custo (R$)' }, grid: { drawOnChartArea: false } },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false, callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) { label += ': '; } if (context.parsed.y !== null) { label += context.dataset.label.includes('Custo') ? `R$ ${context.parsed.y.toFixed(2)}` : `${context.parsed.y.toFixed(1)} kWh`; } return label; } } }
                },
            },
        });
    }

    async function init() {
        try {
            const response = await fetch('/api/previsoes-data');
            if (!response.ok) { throw new Error("Falha ao buscar dados da API de previsões"); }
            const data = await response.json();
            render(data);
        } catch (error) {
            console.error("Erro ao inicializar a página de previsões:", error);
            document.getElementById("cards-mensais").innerHTML = `<p style="color:red; text-align:center;">Não foi possível carregar as previsões.</p>`;
        }
    }
    init();
});
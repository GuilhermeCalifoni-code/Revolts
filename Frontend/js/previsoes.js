document.addEventListener('DOMContentLoaded', () => {
  // =================================
  // DADOS DE EXEMPLO (MOCK)
  // =================================
  const mockData = [
    { mes: "Jan", consumo: 350.5, custo: 280.3, fatores: ["↑ Temperatura", "↑ Ar-condicionado"], confianca: 85, },
    { mes: "Fev", consumo: 330.2, custo: 265.1, fatores: ["↑ Umidade", "↓ Iluminação"], confianca: 78, },
    { mes: "Mar", consumo: 365.8, custo: 295.5, fatores: ["↑ Atividade industrial", "↑ Temperatura"], confianca: 90, },
    { mes: "Abr", consumo: 310.0, custo: 250.0, fatores: ["↓ Climatização", "↑ Ventilação natural"], confianca: 82, },
    { mes: "Mai", consumo: 380.7, custo: 310.8, fatores: ["↑ Temperatura", "↑ Refrigeração"], confianca: 88, },
    { mes: "Jun", consumo: 300.0, custo: 245.0, fatores: ["↓ Atividade comercial", "↓ Iluminação"], confianca: 80, },
    { mes: "Jul", consumo: 325.5, custo: 260.2, fatores: ["↓ Atividade industrial", "↑ Ventilação natural"], confianca: 75, },
  ];

  // =================================
  // ESTADO E ELEMENTOS DO DOM
  // =================================

  let previsoesChart = null;

  // Cores do tema (para consistência com o CSS)
  const CORES = {
    green: 'rgba(34, 197, 94, 0.9)',
    amber: 'rgba(245, 158, 11, 0.9)',
  };
  /**
   * Renderiza todos os componentes da página com os dados fornecidos.
   * @param {Array} dados - O array de previsões mensais.
   */
  function render(dados) {
    // 1. Renderiza os cards de resumo
    const consumoTotal = dados.reduce((sum, p) => sum + p.consumo, 0);
    const custoTotal = dados.reduce((sum, p) => sum + p.custo, 0);
    const confiancaMedia = dados.reduce((sum, p) => sum + p.confianca, 0) / dados.length;

    document.getElementById('consumoTotal').textContent = `${consumoTotal.toFixed(1)} kWh`;
    document.getElementById('custoTotal').textContent = `R$ ${custoTotal.toFixed(2)}`;
    document.getElementById('confiancaMedia').textContent = `${confiancaMedia.toFixed(0)} %`;

    // 2. Renderiza os cards de detalhes mensais
    const containerMensais = document.getElementById("cards-mensais");
    containerMensais.innerHTML = ''; // Limpa o container
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

    // 3. Renderiza o gráfico principal
    renderChart(dados);
    // Não há gráfico para renderizar nesta versão.
  }

  /**
   * Renderiza o gráfico de previsões.
   * @param {Array} dados - O array de previsões mensais.
   */
  function renderChart(dados) {
    const ctx = document.getElementById('chartPrevisoes').getContext('2d');
    const labels = dados.map(p => p.mes);
    const consumoData = dados.map(p => p.consumo);
    const custoData = dados.map(p => p.custo);

    if (previsoesChart) {
      previsoesChart.destroy();
    }

    previsoesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Consumo (kWh)',
            data: consumoData,
            borderColor: CORES.green,
            backgroundColor: CORES.green.replace('0.9', '0.1'),
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Custo (R$)',
            data: custoData,
            borderColor: CORES.amber,
            backgroundColor: CORES.amber.replace('0.9', '0.1'),
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { 
            beginAtZero: true 
          },
        },
        plugins: {
          legend: {
            display: false, // A legenda customizada já está no HTML
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.dataset.label.includes('Custo') ? `R$ ${context.parsed.y.toFixed(2)}` : `${context.parsed.y.toFixed(1)} kWh`;
                }
                return label;
              }
            }
          }
        },
      },
    });
  }

  // =================================
  // INICIALIZAÇÃO
  // =================================
  render(mockData);
});
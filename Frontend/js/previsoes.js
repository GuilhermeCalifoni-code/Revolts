// previsoes.js

// Dados de exemplo para 7 meses
const previsoesMensais = [
    {
        mes: "Jan",
        consumo: 350.5, // Exemplo: Mês com mais uso de ar condicionado
        custo: 280.30,
        fatores: ["↑ Temperatura", "↑ Uso de ar-condicionado"],
        confianca: 85,
    },
    {
        mes: "Fev",
        consumo: 330.2,
        custo: 265.10,
        fatores: ["↑ Umidade", "↓ Uso de iluminação"],
        confianca: 78,
    },
    {
        mes: "Mar",
        consumo: 365.8,
        custo: 295.50,
        fatores: ["↑ Atividade industrial", "↑ Temperatura"],
        confianca: 90,
    },
    {
        mes: "Abr",
        consumo: 310.0,
        custo: 250.00,
        fatores: ["↓ Uso de climatização", "↑ Ventilação natural"],
        confianca: 82,
    },
    {
        mes: "Mai",
        consumo: 380.7,
        custo: 310.80,
        fatores: ["↑ Temperatura", "↑ Uso de refrigeração"],
        confianca: 88,
    },
    {
        mes: "Jun",
        consumo: 300.0,
        custo: 245.00,
        fatores: ["↓ Atividade comercial", "↓ Uso de iluminação"],
        confianca: 80,
    },
    {
        mes: "Jul",
        consumo: 325.5,
        custo: 260.20,
        fatores: ["↓ Atividade industrial", "↑ Ventilação natural"],
        confianca: 75,
    },
];

// --- Atualizar Cards de Resumo ---
function atualizarCardsResumo(dados) {
    const consumoTotal = dados.reduce((sum, p) => sum + p.consumo, 0);
    const custoTotal = dados.reduce((sum, p) => sum + p.custo, 0);
    const confiancaMedia = dados.reduce((sum, p) => sum + p.confianca, 0) / dados.length;

    document.getElementById("consumoTotal").textContent = `${consumoTotal.toFixed(1)} kWh`;
    document.getElementById("custoTotal").textContent = `R$ ${custoTotal.toFixed(2)}`;
    document.getElementById("confiancaMedia").textContent = `${confiancaMedia.toFixed(0)} %`;
}

// --- Inserir Cards Mensais ---
const containerMensais = document.getElementById("cards-mensais");

previsoesMensais.forEach((p) => {
    const card = document.createElement("div");
    card.classList.add("card-diario"); // Reutilizando a classe CSS do card diário

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

// --- Configuração do Gráfico ---
const ctx = document.getElementById("chartPrevisoes").getContext("2d");
new Chart(ctx, {
    type: "line",
    data: {
        labels: previsoesMensais.map((p) => p.mes),
        datasets: [
            {
                label: "Consumo (kWh)",
                data: previsoesMensais.map((p) => p.consumo),
                borderColor: "#00ff88", // Verde vibrante
                backgroundColor: "rgba(0, 255, 136, 0.2)", // Verde com transparência
                fill: true, // Preenchimento abaixo da linha
                tension: 0.4, // Curva suave
                pointRadius: 5, // Raio do ponto
                pointHoverRadius: 8, // Raio do ponto ao passar o mouse
                pointBackgroundColor: '#fff', // Cor de fundo do ponto
                pointBorderColor: '#00ff88', // Cor da borda do ponto
            },
            {
                label: "Custo (R$)",
                data: previsoesMensais.map((p) => p.custo),
                borderColor: "#facc15", // Amarelo vibrante
                backgroundColor: "rgba(250, 204, 21, 0.2)", // Amarelo com transparência
                fill: true, // Preenchimento abaixo da linha
                tension: 0.4, // Curva suave
                pointRadius: 5, // Raio do ponto
                pointHoverRadius: 8, // Raio do ponto ao passar o mouse
                pointBackgroundColor: '#fff', // Cor de fundo do ponto
                pointBorderColor: '#facc15', // Cor da borda do ponto
            },
        ],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false, // Essencial para controlar altura com CSS
        plugins: {
            legend: {
                display: false, // Esconde a legenda padrão do Chart.js pois temos uma customizada
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
                            if (context.dataset.label.includes('Custo')) {
                                label += `R$ ${context.parsed.y.toFixed(2)}`;
                            } else {
                                label += `${context.parsed.y.toFixed(1)} kWh`;
                            }
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: "#ccc", // Cor do texto dos eixos X
                    font: {
                        size: 12 // Tamanho da fonte dos eixos X
                    }
                },
                grid: {
                    color: "rgba(255, 255, 255, 0.1)", // Linhas de grade X mais sutis
                    drawBorder: false // Remove a borda do eixo X
                }
            },
            y: {
                ticks: {
                    color: "#ccc", // Cor do texto dos eixos Y
                    font: {
                        size: 12 // Tamanho da fonte dos eixos Y
                    },
                    // Formatar os ticks do eixo Y se necessário (ex: adicionar 'kWh' ou 'R$')
                    callback: function(value, index, ticks) {
                        // Este callback é um pouco mais complexo para misturar unidades
                        // Se a primeira série for kWh e a segunda R$, podemos fazer uma distinção
                        // Para simplificar, vamos apenas retornar o valor
                        return value;
                    }
                },
                grid: {
                    color: "rgba(255, 255, 255, 0.1)", // Linhas de grade Y mais sutis
                    drawBorder: false // Remove a borda do eixo Y
                },
                beginAtZero: true // Garante que o eixo Y comece em 0
            },
        },
    },
});

// Chamar a função para atualizar os cards de resumo ao carregar a página
atualizarCardsResumo(previsoesMensais);
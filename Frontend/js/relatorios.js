// Frontend/js/relatorios.js
const $ = s => document.querySelector(s);

async function fetchUserDevices() {
    const response = await fetch('/api/user-devices');
    if (!response.ok) throw new Error("Falha ao buscar dispositivos");
    return await response.json();
}
async function fetchRelatorioData(filtros) {
    const response = await fetch('/api/relatorio-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filtros)
    });
    if (!response.ok) throw new Error("Falha ao buscar dados do relatório");
    return await response.json();
}
function populateDeviceSelector(devices) {
    const selector = $('#deviceSelector');
    devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.id;
        option.textContent = device.nome;
        selector.appendChild(option);
    });
}
function updatePreview(data) {
    $('#preview-section').style.display = 'block';
    const formatDate = (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
    $('#previewPeriodo').textContent = `${formatDate(data.periodo.inicio)} a ${formatDate(data.periodo.fim)}`;
    $('#previewKwh').textContent = `${data.total_kwh.toFixed(2)} kWh`;
    $('#previewCusto').textContent = data.custo_total.toLocaleString('pt-BR', {style:'currency', currency: 'BRL'});
    const tableBody = $('#previewTableBody');
    tableBody.innerHTML = '';
    data.detalhes_por_dispositivo.forEach(item => {
        const row = tableBody.insertRow();
        row.innerHTML = `<td>${item.dispositivo}</td><td>${item.kwh.toFixed(2)}</td><td>${item.custo.toLocaleString('pt-BR', {style:'currency', currency: 'BRL'})}</td>`;
    });
}
function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const formatDate = (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
    doc.setFontSize(20); doc.text("Relatório de Consumo de Energia", 14, 22);
    doc.setFontSize(12); doc.text(`Período de Análise: ${formatDate(data.periodo.inicio)} a ${formatDate(data.periodo.fim)}`, 14, 30);
    doc.setFontSize(14); doc.text("Resumo Geral", 14, 45);
    doc.setFontSize(11);
    doc.text(`Consumo Total: ${data.total_kwh.toFixed(2)} kWh`, 14, 52);
    doc.text(`Custo Total: ${data.custo_total.toLocaleString('pt-BR', {style:'currency', currency: 'BRL'})}`, 14, 59);
    const head = [['Dispositivo', 'Consumo (kWh)', 'Custo (R$)']];
    const body = data.detalhes_por_dispositivo.map(item => [
        item.dispositivo, item.kwh.toFixed(2),
        item.custo.toLocaleString('pt-BR', {style:'currency', currency: 'BRL'})
    ]);
    doc.autoTable({ startY: 70, head, body, theme: 'striped', headStyles: { fillColor: [22, 160, 133] } });
    doc.save(`relatorio_consumo.pdf`);
}
async function init() {
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
    $('#startDate').value = primeiroDia;
    $('#endDate').value = ultimoDia;
    try {
        const devices = await fetchUserDevices();
        populateDeviceSelector(devices);
    } catch (e) {
        console.error(e);
        alert("Não foi possível carregar a lista de dispositivos.");
    }
}
$('#btnGerar').addEventListener('click', async () => {
    const filtros = { startDate: $('#startDate').value, endDate: $('#endDate').value, deviceId: $('#deviceSelector').value };
    if (!filtros.startDate || !filtros.endDate) { alert("Por favor, selecione as datas."); return; }
    const btn = $('#btnGerar');
    btn.textContent = 'Gerando...'; btn.disabled = true;
    try {
        const reportData = await fetchRelatorioData(filtros);
        updatePreview(reportData);
        generatePDF(reportData);
    } catch (error) {
        alert(error.message);
    } finally {
        btn.textContent = 'Gerar Relatório'; btn.disabled = false;
    }
});
document.addEventListener('DOMContentLoaded', init);
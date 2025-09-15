// charts.js (Versão Final com Foco em R$)

// ... (funções setupHiDPICanvas, createTooltip, clamp continuam as mesmas) ...
function setupHiDPICanvas(canvas, cssWidth, cssHeight){const dpr = window.devicePixelRatio || 1;canvas.width = Math.floor(cssWidth * dpr);canvas.height = Math.floor(cssHeight * dpr);canvas.style.width = cssWidth + 'px';canvas.style.height = cssHeight + 'px';const ctx = canvas.getContext('2d');ctx.setTransform(dpr, 0, 0, dpr, 0, 0);return { ctx, dpr };}
function createTooltip(container){const t = document.createElement('div');t.className = 'chart-tooltip';t.style.display = 'none';container.appendChild(t);return {show(x, y, html){t.innerHTML = html;t.style.left = x + 'px';t.style.top  = y + 'px';t.style.display = 'block';},hide(){ t.style.display = 'none'; }};}
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

// ALTERADO: drawGrid agora pode formatar o eixo Y como moeda
function drawGrid(ctx, rect, {xTicks, yTicks, xLabels = [], yMaxLabel = '', yUnit = ''}){
  const {x, y, w, h} = rect;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
  for(let i=0;i<yTicks.length;i++){ const ty = y + h - yTicks[i]*h; ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x+w, ty); ctx.stroke(); }
  ctx.setLineDash([]); ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted') || '#9CA3AF'; ctx.font = '12px Inter, system-ui, -apple-system, Segoe UI, Roboto'; ctx.textBaseline = 'middle';
  for(let i=0;i<yTicks.length;i++){
    let val = (yTicks[i]*yMaxLabel).toFixed(yUnit === 'R$' ? 2 : 0);
    if(yUnit === 'R$') val = `R$${val}`;
    const ty = y + h - yTicks[i]*h;
    ctx.fillText(val, x - 40, ty);
  }
  ctx.textBaseline = 'top';
  for(let i=0;i<xLabels.length;i++){ const tx = x + (i+0.5)*(w/xLabels.length); ctx.fillText(xLabels[i], tx-12, y+h+8); }
  ctx.restore();
}

export function renderBarsChart(canvas, datasets, opts={}){
    if (!canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!canvas.hasBeenSetup) { setupHiDPICanvas(canvas, canvas.clientWidth, canvas.clientHeight); canvas.hasBeenSetup = true; }
    const rectCss = { width: canvas.clientWidth, height: canvas.clientHeight };
    const padding = {left: 48, right: 12, top: 18, bottom: 28};
    const inner = { x: padding.left, y: padding.top, w: rectCss.width - padding.left - padding.right, h: rectCss.height - padding.top - padding.bottom };
    const labels = opts.labels || []; const max = opts.max || 450;
    const yTicksVals = [0, 150, 300, 450]; const yTicks = yTicksVals.map(v => v/max);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, inner, { xTicks: [], yTicks, xLabels: labels, yMaxLabel: max, yUnit: 'R$' }); // <-- Passando a unidade
    drawBars(ctx, inner, datasets, labels, max, opts);
    const tip = createTooltip(canvas.parentElement);
    const hitZones = getHitZones(inner, datasets, labels, max);
    canvas.onmousemove = (ev)=>{
      const rect = canvas.getBoundingClientRect(); const mx = ev.clientX - rect.left; const my = ev.clientY - rect.top;
      const hit = hitZones.find(z => mx>=z.x && mx<=z.x+z.w && my>=z.y && my<=z.y+z.h);
      if(hit){
        const costText = hit.value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        const kwhText = hit.kwh ? `(${hit.kwh.toFixed(1)} kWh)` : '';
        tip.show(ev.clientX - rect.left, hit.y, `<strong>${hit.label}</strong><br>${costText} ${kwhText}`);
      }else{ tip.hide(); }
    };
    canvas.onmouseleave = ()=> tip.hide();
}

function drawBars(ctx, inner, datasets, labels, max, opts) { /* ...código existente... */ const groupCount = labels.length;const seriesCount = datasets.length;const groupWidth = inner.w / groupCount;const barGap = 6;const innerGroupWidth = groupWidth - 16;const barWidth = (innerGroupWidth - (seriesCount-1)*barGap) / seriesCount;for(let g=0; g<groupCount; g++){for(let s=0; s<seriesCount; s++){const val = datasets[s].data[g];const ratio = clamp(val/max, 0, 1);const x = inner.x + g*groupWidth + 8 + s*(barWidth + barGap);const y = inner.y + inner.h - ratio*inner.h;const h = ratio*inner.h;ctx.fillStyle = datasets[s].colors?.[g] || 'rgba(59,130,246,0.35)';ctx.strokeStyle = 'rgba(255,255,255,0.20)';ctx.lineWidth = 1;ctx.beginPath();const r = 6;ctx.moveTo(x, y+r);ctx.arcTo(x, y, x+r, y, r);ctx.lineTo(x+barWidth-r, y);ctx.arcTo(x+barWidth, y, x+barWidth, y+r, r);ctx.lineTo(x+barWidth, y+h);ctx.lineTo(x, y+h);ctx.closePath();ctx.fill();ctx.stroke();}}}

function getHitZones(inner, datasets, labels, max) {
    const hitZones = []; const groupCount = labels.length; const seriesCount = datasets.length; const groupWidth = inner.w / groupCount; const barGap = 6; const innerGroupWidth = groupWidth - 16; const barWidth = (innerGroupWidth - (seriesCount - 1) * barGap) / seriesCount;
    for (let g = 0; g < groupCount; g++) {
        for (let s = 0; s < seriesCount; s++) {
            const val = datasets[s].data[g];
            const kwh = datasets[s].meta?.kwh?.[g];
            const ratio = clamp(val / max, 0, 1); const x = inner.x + g * groupWidth + 8 + s * (barWidth + barGap); const y = inner.y + inner.h - ratio * inner.h; const h = ratio * inner.h;
            hitZones.push({ x, y, w: barWidth, h, label: labels[g], series: datasets[s].label, value: val, kwh: kwh });
        }
    }
    return hitZones;
}

function catmullRom2bezier(points) { /* ...código existente... */ const result = [];for (let i = 0; i < points.length - 1; i++) {const p0 = points[i - 1] || points[i];const p1 = points[i];const p2 = points[i + 1];const p3 = points[i + 2] || p2;const cp1x = p1.x + (p2.x - p0.x) / 6;const cp1y = p1.y + (p2.y - p0.y) / 6;const cp2x = p2.x - (p3.x - p1.x) / 6;const cp2y = p2.y - (p3.y - p1.y) / 6;result.push({ cp1x, cp1y, cp2x, cp2y, x: p2.x, y: p2.y });}return result;}

export function renderLineChart(canvas, series, opts={}){
    if (!canvas.getContext) return;
    const rectCss = canvas.getBoundingClientRect();
    const { ctx } = setupHiDPICanvas(canvas, rectCss.width, rectCss.height);
    const padding = { left: 48, right: 16, top: 16, bottom: 28 };
    const inner = { x: padding.left, y: padding.top, w: rectCss.width - padding.left - padding.right, h: rectCss.height - padding.top - padding.bottom };
    const max = opts.max || 8;
    const yUnit = opts.yUnit || 'kW'; // Default para kW se não for especificado
    const labels = opts.labels || [];
    const data = series.data || []; const metaKwh = series.meta?.kwh || [];
    const n = data.length; if (n === 0) return;
    const yTicksVals = yUnit === 'R$' ? [0, 1, 2, 3] : [0, 2, 4, 6, 8];
    const yTicks = yTicksVals.map(v => v / max);
    drawGrid(ctx, inner, { xTicks: [], yTicks, xLabels: labels, yMaxLabel: max, yUnit });
    const stepX = n > 1 ? inner.w / (n - 1) : inner.w;
    const pts = data.map((v, i) => { const x = inner.x + i * stepX; const y = inner.y + inner.h - (clamp(v / max, 0, 1)) * inner.h; return { x, y, v, kwh: metaKwh[i] }; });
    const beziers = catmullRom2bezier(pts);
    let start = null; const duration = clamp(opts.duration || 900, 200, 2000);
    const strokeColor = 'rgba(34,197,94,0.9)'; const strokeWidth = 2;
    function frame(ts) { /* ...código da animação... */ if(!start) start = ts;const t = clamp((ts - start)/duration, 0, 1);ctx.clearRect(0, 0, rectCss.width, rectCss.height);drawGrid(ctx, inner, { xTicks: [], yTicks, xLabels: labels, yMaxLabel: max, yUnit });ctx.save();ctx.beginPath();ctx.moveTo(pts[0].x, pts[0].y);const totalSeg = beziers.length;const segFloat = t * totalSeg;const segIndex = Math.floor(segFloat);const segT = segFloat - segIndex;for (let i = 0; i < beziers.length; i++) {const b = beziers[i];if (i < segIndex) {ctx.bezierCurveTo(b.cp1x, b.cp1y, b.cp2x, b.cp2y, b.x, b.y);} else if (i === segIndex) {ctx.bezierCurveTo(b.cp1x, b.cp1y, b.cp1x + (b.cp2x - b.cp1x) * segT, b.cp1y + (b.cp2y - b.cp1y) * segT, b.x, b.y);break;} else {break;}}ctx.strokeStyle = strokeColor;ctx.lineWidth = strokeWidth;ctx.stroke();ctx.restore();if (t < 1) requestAnimationFrame(frame);else drawPeak();}
    function drawPeak() { let maxI = 0; for (let i = 1; i < pts.length; i++) if (pts[i].v > pts[maxI].v) maxI = i; const p = pts[maxI]; if (!p) return; ctx.save(); ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(34,197,94,1)'; ctx.fill(); ctx.restore();}
    requestAnimationFrame(frame);
    const tip = createTooltip(canvas.parentElement);
    canvas.onmousemove = (ev) => {
        const rect = canvas.getBoundingClientRect(); const mx = ev.clientX - rect.left; const my = ev.clientY - rect.top;
        const idx = Math.round((mx - inner.x) / stepX); const i = clamp(idx, 0, n - 1); const p = pts[i];
        if (p && Math.abs(my - p.y) < 40) {
            const costText = p.v.toLocaleString('pt-BR', {style:'currency', currency: 'BRL'});
            const kwhText = p.kwh ? `(${p.kwh.toFixed(2)} kWh)` : '';
            tip.show(p.x, p.y, `${labels[i] || (String(i).padStart(2,'0')+'h')}: ${costText} ${kwhText}`);
        } else { tip.hide(); }
    };
    canvas.onmouseleave = () => tip.hide();
}
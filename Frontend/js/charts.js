/* charts.js — utilitário de canvas para gráficos HiDPI, grid, barras e linha suave
   Requisitos: sem libs externas, suporte a devicePixelRatio, tooltips e animação via rAF
*/

function setupHiDPICanvas(canvas, cssWidth, cssHeight){
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(cssWidth * dpr);
  canvas.height = Math.floor(cssHeight * dpr);
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, dpr };
}

function createTooltip(container){
  const t = document.createElement('div');
  t.className = 'chart-tooltip';
  t.style.display = 'none';
  container.appendChild(t);
  return {
    show(x, y, html){
      t.innerHTML = html;
      t.style.left = x + 'px';
      t.style.top  = y + 'px';
      t.style.display = 'block';
    },
    hide(){ t.style.display = 'none'; }
  };
}

function drawGrid(ctx, rect, {xTicks, yTicks, xLabels = [], yMaxLabel = ''}){
  const {x, y, w, h} = rect;
  ctx.save();
  // fundo sutil
  // linhas Y
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.setLineDash([2, 4]);
  ctx.lineWidth = 1;

  for(let i=0;i<yTicks.length;i++){
    const ty = y + h - yTicks[i]*h;
    ctx.beginPath();
    ctx.moveTo(x, ty);
    ctx.lineTo(x+w, ty);
    ctx.stroke();
  }

  // eixo Y labels
  ctx.setLineDash([]);
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted') || '#9CA3AF';
  ctx.font = '12px Inter, system-ui, -apple-system, Segoe UI, Roboto';
  ctx.textBaseline = 'middle';

  for(let i=0;i<yTicks.length;i++){
    const val = (yTicks[i]*yMaxLabel).toFixed(0);
    const ty = y + h - yTicks[i]*h;
    ctx.fillText(val, x - 28, ty);
  }

  // eixo X labels
  ctx.textBaseline = 'top';
  for(let i=0;i<xLabels.length;i++){
    const tx = x + (i+0.5)*(w/xLabels.length);
    ctx.fillText(xLabels[i], tx-12, y+h+8);
  }

  ctx.restore();
}

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

/* Gráfico de Barras Agrupadas */
export function renderBarsChart(canvas, datasets, opts={}){
  const rectCss = canvas.getBoundingClientRect();
  const { ctx } = setupHiDPICanvas(canvas, rectCss.width, rectCss.height);
  const padding = {left: 48, right: 12, top: 18, bottom: 28};
  const inner = { x: padding.left, y: padding.top, w: rectCss.width - padding.left - padding.right, h: rectCss.height - padding.top - padding.bottom };

  // Dados
  const labels = opts.labels || [];
  const max = opts.max || 600;

  // Grid (0, 150, 300, 450, 600)
  const yTicksVals = [0, 150, 300, 450, 600];
  const yTicks = yTicksVals.map(v => v/max); // normalizado

  drawGrid(ctx, inner, { xTicks: [], yTicks, xLabels: labels, yMaxLabel: max });

  // Barras
  const groupCount = labels.length;
  const seriesCount = datasets.length;
  const groupWidth = inner.w / groupCount;
  const barGap = 6;
  const innerGroupWidth = groupWidth - 16;
  const barWidth = (innerGroupWidth - (seriesCount-1)*barGap) / seriesCount;

  // estilos
  const barBg = 'rgba(255,255,255,0.08)';
  const barBorder = 'rgba(255,255,255,0.20)';
  const barCurrent = 'rgba(59,130,246,0.35)'; // --blue 35%
  const barPrev    = 'rgba(255,255,255,0.18)';

  const hitZones = []; // para tooltip/hover

  for(let g=0; g<groupCount; g++){
    for(let s=0; s<seriesCount; s++){
      const val = datasets[s].data[g];
      const ratio = clamp(val/max, 0, 1);
      const x = inner.x + g*groupWidth + 8 + s*(barWidth + barGap);
      const y = inner.y + inner.h - ratio*inner.h;
      const h = ratio*inner.h;
      ctx.fillStyle = s === 0 ? barCurrent : barPrev;
      ctx.strokeStyle = barBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const r = 6;
      // retângulo com cantos levemente arredondados
      ctx.moveTo(x, y+r);
      ctx.arcTo(x, y, x+r, y, r);
      ctx.lineTo(x+barWidth-r, y);
      ctx.arcTo(x+barWidth, y, x+barWidth, y+r, r);
      ctx.lineTo(x+barWidth, y+h);
      ctx.lineTo(x, y+h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      hitZones.push({
        x, y, w: barWidth, h,
        label: labels[g],
        series: datasets[s].label,
        value: val
      });
    }
  }

  // Tooltip
  const tip = createTooltip(canvas.parentElement);
  canvas.onmousemove = (ev)=>{
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    const hit = hitZones.find(z => mx>=z.x && mx<=z.x+z.w && my>=z.y && my<=z.y+z.h);
    if(hit){
      tip.show(ev.clientX - rect.left, hit.y, `<strong>${hit.series}</strong><br>${hit.label}: ${hit.value.toFixed(0)} kWh`);
    }else{
      tip.hide();
    }
  };
  canvas.onmouseleave = ()=> tip.hide();

  return {
    update(newDatasets){
      renderBarsChart(canvas, newDatasets, opts);
    }
  };
}

/* Curva suave (Catmull-Rom -> Bezier) */
function catmullRom2bezier(points){
  const result = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    result.push({cp1x, cp1y, cp2x, cp2y, x: p2.x, y: p2.y});
  }
  return result;
}

/* Gráfico de Linha com animação */
export function renderLineChart(canvas, series, opts={}){
  const rectCss = canvas.getBoundingClientRect();
  const { ctx } = setupHiDPICanvas(canvas, rectCss.width, rectCss.height);
  const padding = {left: 44, right: 16, top: 16, bottom: 28};
  const inner = { x: padding.left, y: padding.top, w: rectCss.width - padding.left - padding.right, h: rectCss.height - padding.top - padding.bottom };

  const max = opts.max || 8;
  const labels = opts.labels || [];
  const data = series.data || [];
  const n = data.length;

  // Eixo/grid Y: 0,2,4,6,8
  const yTicksVals = [0,2,4,6,8];
  const yTicks = yTicksVals.map(v => v/max);

  drawGrid(ctx, inner, { xTicks: [], yTicks, xLabels: labels, yMaxLabel: max });

  // mapear pontos
  const stepX = inner.w/(n-1);
  const pts = data.map((v, i)=>{
    const x = inner.x + i*stepX;
    const y = inner.y + inner.h - (clamp(v/max,0,1))*inner.h;
    return {x, y, v};
  });

  // curva
  const beziers = catmullRom2bezier(pts);

  // animação de traçado
  let start = null;
  const duration = clamp(opts.duration || 900, 200, 2000);
  const strokeColor = 'rgba(34,197,94,0.9)'; // --green
  const strokeWidth = 2;

  function frame(ts){
    if(!start) start = ts;
    const t = clamp((ts - start)/duration, 0, 1);

    // limpar área do gráfico (apenas o inner + margens pequenas)
    ctx.clearRect(0, 0, rectCss.width, rectCss.height);
    // redesenhar grid
    drawGrid(ctx, inner, { xTicks: [], yTicks, xLabels: labels, yMaxLabel: max });

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    const totalSeg = beziers.length;
    const segFloat = t * totalSeg;
    const segIndex = Math.floor(segFloat);
    const segT = segFloat - segIndex;

    for(let i=0;i<beziers.length;i++){
      const b = beziers[i];
      if(i < segIndex){
        ctx.bezierCurveTo(b.cp1x, b.cp1y, b.cp2x, b.cp2y, b.x, b.y);
      }else if(i === segIndex){
        // interpolar até ponto parcial
        // aproximação: desenhar até o cp1/cp2 proporcional (simples e suave)
        ctx.bezierCurveTo(
          b.cp1x, b.cp1y,
          b.cp1x + (b.cp2x - b.cp1x)*segT, b.cp1y + (b.cp2y - b.cp1y)*segT,
          b.x, b.y // termina no ponto final para manter forma (boa o suficiente visualmente)
        );
        break;
      }else{
        break;
      }
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
    ctx.restore();

    if(t < 1) requestAnimationFrame(frame);
    else drawPeak();
  }

  function drawPeak(){
    // ponto de pico
    let maxI = 0;
    for(let i=1;i<pts.length;i++) if(pts[i].v > pts[maxI].v) maxI = i;
    const p = pts[maxI];
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(34,197,94,1)';
    ctx.fill();
    ctx.restore();
  }

  requestAnimationFrame(frame);

  // Tooltip
  const tip = createTooltip(canvas.parentElement);
  canvas.onmousemove = (ev)=>{
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    // encontrar ponto mais próximo no eixo X
    const idx = Math.round((mx - inner.x)/stepX);
    const i = clamp(idx, 0, n-1);
    const p = pts[i];
    if(p && Math.abs(my - p.y) < 40){
      tip.show(p.x, p.y, `${String(i).padStart(2,'0')}h: ${p.v.toFixed(2)} kW`);
    }else{
      tip.hide();
    }
  };
  canvas.onmouseleave = ()=> tip.hide();

  return {
    update(newSeries){
      renderLineChart(canvas, newSeries, opts);
    }
  };
}

export const ChartsUtil = {
  renderBarsChart,
  renderLineChart
};



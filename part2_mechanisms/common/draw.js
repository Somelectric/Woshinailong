// 工程制图工具库 v1 —— 全站动画绘制的质量标准载体
// 依赖：无（可与 controls.js 的 svg/line/circle 混用）
// 色板语义（全站统一）：
//   机架/固定件 深灰 #3a3f45（剖面线填充）
//   主动件     绿 #0e6b5c
//   从动件     橙 #d9662c
//   高亮/轨迹  红 #b3372c
//   导轨/参考  灰 #8a919b

export const COLORS = {
  frame: '#3a3f45',     // 机架
  frameFill: '#d8d5cc', // 机架浅填充
  drive: '#0e6b5c',     // 主动件
  driven: '#d9662c',    // 从动件
  hi: '#b3372c',        // 高亮
  ref: '#8a919b',       // 参考线
  ink: '#232a31',       // 轮廓
  bg: '#fbfaf6',        // 舞台底
  grid: '#e9e6dd',
};

const SVG_NS = 'http://www.w3.org/2000/svg';

const el = (tag, attrs = {}, children = []) => {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const c of children) if (c) e.appendChild(c);
  return e;
};

/* ===== 剖面线 pattern（机架/固定件的 45° 剖面填充） =====
   每个页面首次调用会向 svg 注册 <defs><pattern>；同 id 重复注册自动跳过 */
export function hatchPattern(svgRoot, id = 'hatch', color = COLORS.frame, spacing = 6, width = 1) {
  if (svgRoot.querySelector(`#${id}`)) return id;
  const defs = svgRoot.querySelector('defs') || (() => {
    const d = el('defs', {});
    svgRoot.insertBefore(d, svgRoot.firstChild);
    return d;
  })();
  defs.appendChild(el('pattern', {
    id, patternUnits: 'userSpaceOnUse', width: spacing, height: spacing,
    patternTransform: 'rotate(45)',
  }, [el('line', { x1: 0, y1: 0, x2: 0, y2: spacing, stroke: color, 'stroke-width': width })]));
  return id;
}

/* ===== 机架矩形（剖面线填充 + 轮廓） ===== */
export function frameRect(svgRoot, x, y, w, h, attrs = {}) {
  const id = hatchPattern(svgRoot, attrs.hatchId || 'hatch');
  return el('rect', {
    x, y, width: w, height: h,
    fill: `url(#${id})`, stroke: COLORS.ink, 'stroke-width': attrs.sw || 1.8, rx: attrs.rx ?? 1.5,
    ...attrs.extra,
  });
}

/* ===== 地面符号（斜短线族，工程制图标准） ===== */
export function ground(svgRoot, x, y, w, attrs = {}) {
  const g = el('g', {});
  g.appendChild(el('line', { x1: x, y1: y, x2: x + w, y2: y, stroke: COLORS.ink, 'stroke-width': attrs.sw || 2.5 }));
  const n = Math.max(3, Math.floor(w / (attrs.gap || 12)));
  for (let i = 0; i <= n; i++) {
    const gx = x + (i / n) * (w - 6) + 3;
    g.appendChild(el('line', { x1: gx, y1: y, x2: gx - 8, y2: y + (attrs.h || 10), stroke: COLORS.ink, 'stroke-width': 1.2 }));
  }
  return g;
}

/* ===== 转动副符号：圆销（白底双圈）+ 可选小三角支座 ===== */
export function pinJoint(x, y, r = 6, attrs = {}) {
  const g = el('g', {});
  if (attrs.pedestal !== false) {
    g.appendChild(el('polygon', {
      points: `${x - r * 1.9},${y + r * 1.4} ${x + r * 1.9},${y + r * 1.4} ${x},${y}`,
      fill: attrs.pedestalColor || COLORS.frame,
    }));
  }
  g.appendChild(el('circle', { cx: x, cy: y, r, fill: 'white', stroke: COLORS.ink, 'stroke-width': 2 }));
  g.appendChild(el('circle', { cx: x, cy: y, r: r * 0.35, fill: COLORS.ink }));
  return g;
}

/* ===== 移动副：导轨（阴影线滑道） ===== */
export function sliderGuide(svgRoot, x1, x2, y, attrs = {}) {
  const g = el('g', {});
  const th = attrs.th || 5;
  g.appendChild(el('line', { x1, y1: y, x2, y2: y, stroke: COLORS.ref, 'stroke-width': th }));
  // 导轨下阴影短斜线
  const n = Math.floor((x2 - x1) / 14);
  for (let i = 0; i <= n; i++) {
    const gx = x1 + i * ((x2 - x1) / n);
    g.appendChild(el('line', { x1: gx, y1: y + th / 2, x2: gx - 7, y2: y + th / 2 + 7, stroke: COLORS.ref, 'stroke-width': 1 }));
  }
  return g;
}

/* ===== 通用箭头 marker 注册（一次注册多个色） ===== */
export function arrowMarkers(svgRoot, colors = [COLORS.hi, COLORS.drive, COLORS.driven, '#5a6472']) {
  const defs = svgRoot.querySelector('defs') || (() => {
    const d = el('defs', {});
    svgRoot.insertBefore(d, svgRoot.firstChild);
    return d;
  })();
  colors.forEach((c) => {
    const id = 'ar-' + c.replace('#', '');
    if (defs.querySelector(`#${id}`)) return;
    defs.appendChild(el('marker', {
      id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6.5, markerHeight: 6.5,
      orient: 'auto-start-reverse',
    }, [el('path', { d: 'M 0 0 L 10 5 L 0 10 z', fill: c })]));
  });
  return (c) => 'url(#ar-' + c.replace('#', '') + ')';
}

/* ===== 力/速度箭头（带可选标签） ===== */
export function arrow(svgRoot, x1, y1, x2, y2, { color = COLORS.hi, width = 2.5, label, dasharray } = {}) {
  arrowMarkers(svgRoot, [color]);
  const g = el('g', {});
  g.appendChild(el('line', {
    x1, y1, x2, y2, stroke: color, 'stroke-width': width,
    'marker-end': `url(#ar-${color.replace('#', '')})`,
    ...(dasharray ? { 'stroke-dasharray': dasharray } : {}),
  }));
  if (label) {
    const t = el('text', {
      x: (x1 + x2) / 2 + 6, y: (y1 + y2) / 2 - 6,
      fill: color, 'font-size': 11.5, 'font-family': 'monospace', 'font-weight': 600,
    });
    t.textContent = label;
    g.appendChild(t);
  }
  return g;
}

/* ===== 速度矢量（长度∝速率，带 |v| 读数） ===== */
export function velocityArrow(svgRoot, x, y, vx, vy, { scale = 0.35, label, color = COLORS.hi } = {}) {
  const g = el('g', {});
  const speed = Math.hypot(vx, vy);
  if (speed < 1e-6) {
    const t = el('text', { x: x + 8, y: y - 8, fill: COLORS.ref, 'font-size': 10.5, 'font-family': 'monospace' });
    t.textContent = 'v = 0';
    g.appendChild(t);
    return g;
  }
  const ex = x + vx * scale, ey = y + vy * scale;
  arrowMarkers(svgRoot, [color]);
  g.appendChild(el('line', {
    x1: x, y1: y, x2: ex, y2: ey, stroke: color, 'stroke-width': 2.8,
    'marker-end': `url(#ar-${color.replace('#', '')})`,
  }));
  g.appendChild(el('circle', { cx: x, cy: y, r: 2.6, fill: color }));
  if (label !== 'none') {
    const t = el('text', {
      x: ex + 7, y: ey - 5, fill: color, 'font-size': 10.5, 'font-family': 'monospace',
    });
    t.textContent = label || `|v|=${speed.toFixed(0)}`;
    g.appendChild(t);
  }
  return g;
}

/* ===== 分步讲解控制器 =====
   steps: [{ at: 0~1 相位, title: 短标题, desc: 一句话解释 }]
   ctl: createControls() 的返回值（用其 seek/pause/play）
   行为：
   - 渲染步骤条（①②③…可点）+ 上一步/下一步/自动 按钮 + 说明面板
   - 点步骤：ctl.pause() + ctl.seek(step.at)
   - 自动播放时（ctl 在播）：根据 getPhase() 反向高亮所属步骤并同步说明面板
*/
export function stepControls(mount, { steps, ctl, getPhase }) {
  mount.innerHTML = `
    <div class="step-ctl">
      <div class="step-track">
        ${steps.map((s, i) => `<button class="step-btn" data-i="${i}" title="${s.title}">${i + 1}</button>`).join('')}
        <span class="step-spacer"></span>
        <button class="btn secondary step-prev">← 上一步</button>
        <button class="btn secondary step-next">下一步 →</button>
        <button class="btn step-play">▶ 自动</button>
      </div>
      <div class="step-desc"><div class="step-desc-title"></div><div class="step-desc-body"></div></div>
    </div>
  `;
  const btns = Array.from(mount.querySelectorAll('.step-btn'));
  const titleEl = mount.querySelector('.step-desc-title');
  const bodyEl = mount.querySelector('.step-desc-body');
  const playBtn = mount.querySelector('.step-play');
  let cur = 0;
  let auto = false;
  let autoTimer = null;

  function show(i, { seek = true } = {}) {
    cur = Math.max(0, Math.min(steps.length - 1, i));
    btns.forEach((b, j) => b.classList.toggle('active', j === cur));
    titleEl.textContent = `${cur + 1}/${steps.length} · ${steps[cur].title}`;
    bodyEl.innerHTML = steps[cur].desc;
    if (seek && ctl) {
      ctl.pause();
      ctl.seek(steps[cur].at);
    }
  }
  btns.forEach((b) => b.addEventListener('click', () => { auto = false; stopAuto(); show(+b.dataset.i); }));
  mount.querySelector('.step-prev').addEventListener('click', () => { auto = false; stopAuto(); show(cur - 1); });
  mount.querySelector('.step-next').addEventListener('click', () => { auto = false; stopAuto(); show(cur + 1); });

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    playBtn.textContent = '▶ 自动';
  }
  playBtn.addEventListener('click', () => {
    if (auto) { stopAuto(); auto = false; return; }
    auto = true;
    playBtn.textContent = '⏸ 停止';
    // 自动逐 step：每个停留 1.6s，seek 后让动画停在该步
    const tick = () => {
      show(cur + 1 > steps.length - 1 ? 0 : cur + 1);
    };
    tick();
    autoTimer = setInterval(tick, 1600);
  });

  // 动画播放时反向同步（渲染循环里调用返回的 syncFromPhase）
  show(0, { seek: false });
  return {
    syncFromPhase(phase) {
      if (auto) return; // 自动模式不跟随
      // 找当前 phase 所属步骤
      let idx = 0;
      for (let i = 0; i < steps.length; i++) {
        if (phase >= steps[i].at - 1e-6) idx = i;
      }
      if (idx !== cur) {
        cur = idx;
        btns.forEach((b, j) => b.classList.toggle('active', j === cur));
        titleEl.textContent = `${cur + 1}/${steps.length} · ${steps[cur].title}`;
        bodyEl.innerHTML = steps[cur].desc;
      }
    },
  };
}

/* ===== 同步曲线（fn(t)→值；画曲线 + 当前点 + 数值） =====
   opts: { x, y, w, h, t: 当前 0~1, fn, color, yLabel, xLabel, yMax(可选), yMin=0 } */
export function syncCurve(svgRoot, { x, y, w, h, t, fn, color = COLORS.drive, yLabel, xLabel, yMax, yMin = 0, title }) {
  const g = el('g', {});
  g.appendChild(el('rect', { x: x - 8, y: y - h - 26, width: w + 16, height: h + 46, fill: 'white', stroke: COLORS.grid, rx: 5 }));
  // 采样求值域
  let mx = yMax, mn = yMin;
  if (mx === undefined) {
    mx = -Infinity; mn = Infinity;
    const N = 80;
    for (let i = 0; i <= N; i++) {
      const v = fn(i / N);
      mx = Math.max(mx, v); mn = Math.min(mn, v);
    }
    mx = Math.max(mx, mn + 1e-6) * 1.15;
    mn = Math.min(mn, 0);
    if (mn > 0) mn = 0;
  }
  // 轴
  const y0 = y - ((0 - mn) / (mx - mn)) * h;
  g.appendChild(el('line', { x1: x, y1: y, x2: x + w, y2: y, stroke: COLORS.ink, 'stroke-width': 1.2 }));
  g.appendChild(el('line', { x1: x, y1: y - h, x2: x, y2: y, stroke: COLORS.ink, 'stroke-width': 1.2 }));
  g.appendChild(el('line', { x1: x, y1: y0, x2: x + w, y2: y0, stroke: COLORS.ref, 'stroke-width': 0.8, 'stroke-dasharray': '3 3' }));
  // 曲线
  let d = '';
  const N = 96;
  for (let i = 0; i <= N; i++) {
    const tt = i / N;
    const v = Math.max(mn, Math.min(mx, fn(tt)));
    const px = x + tt * w;
    const py = y - ((v - mn) / (mx - mn)) * h;
    d += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ',' + py.toFixed(1);
  }
  g.appendChild(el('path', { d, fill: 'none', stroke: color, 'stroke-width': 2 }));
  // 当前点
  const vNow = fn(Math.max(0, Math.min(1, t)));
  const px = x + Math.max(0, Math.min(1, t)) * w;
  const py = y - ((Math.max(mn, Math.min(mx, vNow)) - mn) / (mx - mn)) * h;
  g.appendChild(el('circle', { cx: px, cy: py, r: 4.5, fill: COLORS.hi, stroke: 'white', 'stroke-width': 1.5 }));
  // 数值 + 标签
  const t1 = el('text', { x: px + (px > x + w * 0.7 ? -8 : 8), y: py - 9, fill: COLORS.hi, 'font-size': 11, 'font-family': 'monospace', 'text-anchor': px > x + w * 0.7 ? 'end' : 'start', 'font-weight': 600 });
  t1.textContent = (typeof vNow === 'number' && isFinite(vNow)) ? vNow.toFixed(2) : '—';
  g.appendChild(t1);
  if (title) {
    const t2 = el('text', { x: x + w / 2, y: y - h - 12, 'text-anchor': 'middle', fill: '#5a6472', 'font-size': 11 });
    t2.textContent = title;
    g.appendChild(t2);
  }
  if (yLabel) {
    const t3 = el('text', { x: x - 6, y: y - h + 6, fill: '#5a6472', 'font-size': 10, 'font-family': 'monospace', 'text-anchor': 'end' });
    t3.textContent = yLabel;
    g.appendChild(t3);
  }
  if (xLabel) {
    const t4 = el('text', { x: x + w, y: y + 14, fill: '#5a6472', 'font-size': 10, 'font-family': 'monospace', 'text-anchor': 'end' });
    t4.textContent = xLabel;
    g.appendChild(t4);
  }
  return g;
}

/* ===== 双线杆（有厚度的零件，替代单线） ===== */
export function bar(x1, y1, x2, y2, { color = COLORS.drive, th = 7, opacity } = {}) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len * th / 2, ny = dx / len * th / 2;
  return el('polygon', {
    points: `${x1 + nx},${y1 + ny} ${x2 + nx},${y2 + ny} ${x2 - nx},${y2 - ny} ${x1 - nx},${y1 - ny}`,
    fill: color, stroke: COLORS.ink, 'stroke-width': 1.4, ...(opacity ? { opacity } : {}),
  });
}

/* ===== 舞台网格（淡参考网格） ===== */
export function stageGrid(svgRoot, w, h, step = 40) {
  const g = el('g', { opacity: 0.5 });
  for (let x = step; x < w; x += step) {
    g.appendChild(el('line', { x1: x, y1: 0, x2: x, y2: h, stroke: COLORS.grid, 'stroke-width': 0.5 }));
  }
  for (let y = step; y < h; y += step) {
    g.appendChild(el('line', { x1: 0, y1: y, x2: w, y2: y, stroke: COLORS.grid, 'stroke-width': 0.5 }));
  }
  return g;
}

// 共享动画控制器
// 用法：
//   const ctl = createControls(container, {
//     duration: 4000,           // 一周期毫秒
//     speeds: [0.25, 0.5, 1, 2],
//     defaultSpeed: 1,
//     onTick: (t) => {...},     // t: 0~1 的归一化时间
//     showAngle: true,          // 是否显示当前角度读数
//   });
//   ctl.play(); ctl.pause(); ctl.setSpeed(0.5); ctl.seek(0.5);

export function createControls(container, options = {}) {
  const opts = {
    duration: 4000,
    speeds: [0.25, 0.5, 1, 2],
    defaultSpeed: 1,
    onTick: () => {},
    showAngle: false,
    ...options,
  };

  let speed = opts.defaultSpeed;
  let playing = true;
  let phase = 0; // 0~1
  let lastTs = null;
  let rafId = null;

  container.innerHTML = `
    <div class="controls">
      <button class="btn toggle">⏸ 暂停</button>
      <button class="btn secondary restart">↺ 重置</button>
      <div class="speed-control">
        <span>速度</span>
        ${opts.speeds.map(s => `<button class="speed-btn ${s === opts.defaultSpeed ? 'active' : ''}" data-speed="${s}">${s}×</button>`).join('')}
      </div>
      <input type="range" class="progress" min="0" max="1000" value="0">
      ${opts.showAngle ? `<span class="angle-readout">θ = <span class="angle-val">0°</span></span>` : ''}
    </div>
  `;

  const toggleBtn = container.querySelector('.toggle');
  const restartBtn = container.querySelector('.restart');
  const speedBtns = container.querySelectorAll('.speed-btn');
  const progress = container.querySelector('.progress');
  const angleVal = container.querySelector('.angle-val');

  function setPhase(p) {
    phase = ((p % 1) + 1) % 1;
    progress.value = phase * 1000;
    opts.onTick(phase);
    if (opts.showAngle && angleVal) {
      angleVal.textContent = `${(phase * 360).toFixed(0)}°`;
    }
  }

  function tick(ts) {
    if (!playing) return;
    if (lastTs === null) lastTs = ts;
    const dt = ts - lastTs;
    lastTs = ts;
    const dPhase = (dt / opts.duration) * speed;
    setPhase(phase + dPhase);
    rafId = requestAnimationFrame(tick);
  }

  function play() {
    if (playing) return;
    playing = true;
    lastTs = null;
    toggleBtn.textContent = '⏸ 暂停';
    rafId = requestAnimationFrame(tick);
  }

  function pause() {
    playing = false;
    toggleBtn.textContent = '▶ 播放';
    if (rafId) cancelAnimationFrame(rafId);
  }

  function setSpeed(s) {
    speed = s;
    speedBtns.forEach(b => b.classList.toggle('active', parseFloat(b.dataset.speed) === s));
  }

  toggleBtn.addEventListener('click', () => (playing ? pause() : play()));
  restartBtn.addEventListener('click', () => setPhase(0));
  speedBtns.forEach(b => b.addEventListener('click', () => setSpeed(parseFloat(b.dataset.speed))));
  progress.addEventListener('input', (e) => {
    pause();
    setPhase(parseFloat(e.target.value) / 1000);
  });

  // 初次绘制
  setPhase(0);
  rafId = requestAnimationFrame(tick);

  return {
    play,
    pause,
    setSpeed,
    seek: setPhase,
    getPhase: () => phase,
    setDuration: (ms) => { opts.duration = ms; },
  };
}

// === 通用 SVG 渲染辅助 ===
export const svg = (tag, attrs = {}, children = []) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  for (const c of children) {
    if (c) el.appendChild(c);
  }
  return el;
};

export const line = (x1, y1, x2, y2, attrs = {}) =>
  svg('line', { x1, y1, x2, y2, ...attrs });

export const circle = (cx, cy, r, attrs = {}) =>
  svg('circle', { cx, cy, r, ...attrs });

export const clear = (parent) => {
  while (parent.firstChild) parent.removeChild(parent.firstChild);
};

// 把数学坐标 (y up) 转 SVG 坐标 (y down)，原点平移到 (ox, oy)
export const toSvg = (p, ox, oy, scale = 1) => ({
  x: ox + p.x * scale,
  y: oy - p.y * scale,
});

// 渲染侧栏导航的当前页高亮
export function highlightNav(currentPage) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === currentPage);
  });
}

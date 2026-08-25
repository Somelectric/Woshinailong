// 内联 SVG 图标 sprite v1 —— 零依赖图标方案
// 用法：任意模块 JS 里 import { mountIcons, icon } 后：
//   mountIcons()  → 向 body 开头注入 <svg id="icon-sprite" style="display:none">
//   HTML 静态写法：<svg class="ic"><use href="#i-gear"></use></svg>
// 图标 stroke=currentColor，颜色随文字色。

const SYMS = {
  bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>',
  motor: '<rect x="3" y="8" width="12" height="8" rx="2"/><circle cx="18" cy="12" r="2"/><path d="M18 12h3"/>',
  gear: '<circle cx="12" cy="12" r="3.4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  ruler: '<rect x="2" y="9" width="20" height="6" rx="1"/><path d="M6 9v3M10 9v3M14 9v3M18 9v3"/>',
  wrench: '<path d="M14.7 6.3a4.5 4.5 0 0 0-6 5.6L3 17.6 6.4 21l5.7-5.7a4.5 4.5 0 0 0 5.6-6l-3 3-2.4-2.4 3-3z"/>',
  hinge: '<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/>',
  print: '<rect x="6" y="3" width="12" height="5" rx="1"/><path d="M6 8H4a2 2 0 0 0-2 2v6h20v-6a2 2 0 0 0-2-2h-2M6 14h12v7H6z"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11M15 9v11"/>',
  layers: '<path d="M12 3 2 8l10 5 10-5-10-5zM2 13l10 5 10-5"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 15-5-4-7 8"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  alert: '<path d="M12 3 2 20h20L12 3zM12 10v5M12 18v.5"/>',
  book: '<path d="M4 4h7v16H4zM13 4h7v16h-7"/>',
  arrow: '<path d="M4 12h14m-5-6 6 6-6 6"/>',
  flag: '<path d="M5 21V4h13l-3 5 3 5H5"/>',
  cam: '<path d="M3 12h4l2-3h6l2 3h4M5 9v10h14V9"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  spring: '<path d="M12 2v3M12 19v3M6 6h12M6 10h12M6 14h12M6 18h12M6 6c0 4 12 4 12 8s-12 4-12 8"/>',
};

export function mountIcons() {
  if (document.getElementById('icon-sprite')) return;
  document.body.insertAdjacentHTML('afterbegin',
    `<svg id="icon-sprite" style="display:none" aria-hidden="true">${
      Object.entries(SYMS).map(([k, p]) =>
        `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</symbol>`).join('')
    }</svg>`);
}

// 供 JS 动态生成 HTML 时用（如 stepControls）
export const icon = (name, cls = '') =>
  `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;

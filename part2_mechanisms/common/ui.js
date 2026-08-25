// 全站 UI 副作用模块 v1 —— 图标挂载 + 入场微动效
// 由 sidebar.js 顶部 `import './ui.js';` 引入，13 个内容页全站生效（index.html 自己 import）。
// 设计要点：
//   - 只有 JS 成功运行（html 有 .js-reveal 类）时才隐藏 [data-reveal]，禁 JS 不白屏
//   - prefers-reduced-motion 时直接显示，无动画

import { mountIcons } from './icons.js';
mountIcons();

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('js-on');

if (!REDUCED && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-reveal');
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.10, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
} else {
  document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('in'));
}

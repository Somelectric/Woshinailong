// 共享侧栏导航 v3 - 在每个页面 <body> 开头放 <div id="sidebar-mount"></div>
// 然后 import 这个文件调用 injectSidebar('motion-oscillation')
// 叙事主线：运动转换（电最擅长旋转 → 怎么把旋转变成你要的运动）

import './ui.js'; // 图标 sprite + 入场微动效（全站副作用模块）

const NAV_ITEMS = [
  { section: '入门' },
  { id: 'index', href: 'index.html', label: '首页', num: '00' },
  { id: 'dof', href: 'dof.html', label: '自由度', num: '01' },
  { section: '运动转换' },
  { id: 'motion-linear', href: 'motion-linear.html', label: '旋转 → 直线', num: '02' },
  { id: 'motion-oscillation', href: 'motion-oscillation.html', label: '旋转 → 摆动', num: '03', hero: true },
  { id: 'motion-intermittent', href: 'motion-intermittent.html', label: '连续 → 间歇', num: '04' },
  { id: 'motion-gripping', href: 'motion-gripping.html', label: '旋转 → 抓取', num: '05' },
  { id: 'motion-transmission', href: 'motion-transmission.html', label: '旋转 → 旋转', num: '06' },
  { id: 'motion-complex', href: 'motion-complex.html', label: '轨迹合成', num: '07' },
  { section: '原理' },
  { id: 'motors', href: 'motors.html', label: '电机原理', num: '08', hero: true },
  { id: 'control', href: 'control.html', label: '传感与控制', num: '09' },
  { section: '落地' },
  { id: 'chassis', href: 'chassis.html', label: '底盘与悬挂', num: '10' },
  { id: 'actuators', href: 'actuators.html', label: '执行器选型', num: '11' },
  { id: 'engineering', href: 'engineering.html', label: '工程实现', num: '12' },
  { id: 'printing', href: 'printing.html', label: '3D 打印实操', num: '13' },
  { section: '收尾' },
  { id: 'wrap-up', href: 'wrap-up.html', label: '选型决策树', num: '14' },
];

export function injectSidebar(activeId) {
  const mount = document.getElementById('sidebar-mount');
  if (!mount) return;

  const items = NAV_ITEMS.map(item => {
    if (item.section) {
      return `<div class="nav-section">${item.section}</div>`;
    }
    return `<a class="nav-item ${item.id === activeId ? 'active' : ''} ${item.hero ? 'hero' : ''}" href="${item.href}">
      <span class="num">${item.num}</span>${item.label}
    </a>`;
  }).join('');

  mount.innerHTML = `
    <div class="sidebar">
      <h1>机构设计</h1>
      <div class="subtitle">Part 2 · 从旋转到运动</div>
      ${items}
    </div>
  `;
}

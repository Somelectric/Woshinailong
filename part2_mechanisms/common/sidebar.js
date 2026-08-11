// 共享侧栏导航 - 在每个页面 <body> 开头放 <div id="sidebar-mount"></div>
// 然后 import 这个文件调用 injectSidebar('motion-oscillation')

const NAV_ITEMS = [
  { section: '入门' },
  { id: 'index', href: 'index.html', label: '首页', num: '00' },
  { id: 'dof', href: 'dof.html', label: '自由度', num: '01' },
  { section: '6 类运动方式' },
  { id: 'motion-linear', href: 'motion-linear.html', label: '直线运动', num: '02' },
  { id: 'motion-oscillation', href: 'motion-oscillation.html', label: '摆动 · 四杆', num: '03', hero: true },
  { id: 'motion-intermittent', href: 'motion-intermittent.html', label: '间歇运动', num: '04' },
  { id: 'motion-gripping', href: 'motion-gripping.html', label: '夹持拾取', num: '05' },
  { id: 'motion-transmission', href: 'motion-transmission.html', label: '减速传动', num: '06' },
  { id: 'motion-complex', href: 'motion-complex.html', label: '复杂曲线', num: '07' },
  { section: '收尾' },
  { id: 'wrap-up', href: 'wrap-up.html', label: '选型决策树', num: '08' },
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
      <div class="subtitle">Part 2 · 运动方式分类</div>
      ${items}
    </div>
  `;
}

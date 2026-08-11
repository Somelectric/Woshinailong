// 机构运动学数学工具库

export const TAU = Math.PI * 2;
export const deg = (rad) => (rad * 180) / Math.PI;
export const rad = (d) => (d * Math.PI) / 180;

/**
 * 四杆机构求解：给定 4 个杆长和原动件角度，求其余杆角度
 * 约定坐标系：A 在原点，D 在 (d, 0)
 *   A---D  （机架 d）
 *   |   |
 *   a   c   （a=曲柄/原动件，c=摇杆/从动件）
 *   |   |
 *   B---C   （b=连杆）
 * 输入: { a, b, c, d, theta1 }  单位：mm, rad
 * 输出: { B, C, theta2, theta3, valid }
 */
export function fourBar({ a, b, c, d, theta1 }) {
  const A = { x: 0, y: 0 };
  const D = { x: d, y: 0 };
  const B = { x: a * Math.cos(theta1), y: a * Math.sin(theta1) };

  // C 在以 B 为圆心半径 b 的圆 与 以 D 为圆心半径 c 的圆 的交点
  const dx = D.x - B.x;
  const dy = D.y - B.y;
  const distBD = Math.hypot(dx, dy);

  // 两圆相交条件
  if (distBD > b + c + 1e-6 || distBD < Math.abs(b - c) - 1e-6) {
    return { valid: false, A, D, B, C: null, theta2: null, theta3: null };
  }

  // 沿 BD 方向的距离 a1（从 B 到两圆交点连线中点）
  const a1 = (b * b - c * c + distBD * distBD) / (2 * distBD);
  // 垂直 BD 方向的偏移
  const h = Math.sqrt(Math.max(0, b * b - a1 * a1));

  // 单位向量 BD
  const ux = dx / distBD;
  const uy = dy / distBD;
  // 垂直方向（取"上"方）
  const px = -uy;
  const py = ux;

  // 取 open 配置（C 在 BD 上方）
  const C = {
    x: B.x + a1 * ux + h * px,
    y: B.y + a1 * uy + h * py,
  };

  const theta2 = Math.atan2(C.y - B.y, C.x - B.x);
  const theta3 = Math.atan2(C.y - D.y, C.x - D.x);

  return { valid: true, A, D, B, C, theta2, theta3 };
}

/**
 * Grashof 判定
 * 输入: { a, b, c, d }，约定 a 为原动件，d 为机架
 * 输出: { grashof: bool, type: 'crank-rocker' | 'double-crank' | 'double-rocker' | 'triple-rocker' | 'change-point', desc }
 */
export function grashof({ a, b, c, d }) {
  const lens = [
    { name: 'a', val: a, role: 'crank' },
    { name: 'b', val: b, role: 'coupler' },
    { name: 'c', val: c, role: 'rocker' },
    { name: 'd', val: d, role: 'frame' },
  ].sort((x, y) => x.val - y.val);

  const s = lens[0];
  const l = lens[3];
  const p = lens[1];
  const q = lens[2];
  const sum = s.val + l.val;
  const other = p.val + q.val;

  if (Math.abs(sum - other) < 0.5) {
    return { grashof: true, type: 'change-point', desc: '变位点机构（s+l = p+q），运动到特定位置会不确定' };
  }
  if (sum > other) {
    return { grashof: false, type: 'triple-rocker', desc: '非 Grashof（s+l > p+q），三摇杆——没有杆能整周转动' };
  }
  // Grashof 满足，最短杆决定类型
  if (s.role === 'frame') {
    return { grashof: true, type: 'double-crank', desc: '双曲柄（最短杆是机架）——两个连架杆都能整周转动' };
  }
  if (s.role === 'crank' || s.role === 'rocker') {
    return { grashof: true, type: 'crank-rocker', desc: '曲柄摇杆（最短杆是连架杆）——原动件整周转动，从动件只摆动' };
  }
  return { grashof: true, type: 'double-rocker', desc: '双摇杆（最短杆是连杆）——两个连架杆都只能摆动' };
}

/**
 * 连杆曲线上某点的位置（用于绘制轨迹）
 * 输入: 四杆解 + 连杆上点的局部坐标 (e: 沿连杆方向偏移, f: 垂直连杆方向偏移)
 */
export function couplerPoint(sol, e, f) {
  if (!sol.valid) return null;
  const { B, C, theta2 } = sol;
  const ux = Math.cos(theta2);
  const uy = Math.sin(theta2);
  const px = -uy;
  const py = ux;
  return {
    x: B.x + e * ux + f * px,
    y: B.y + e * uy + f * py,
  };
}

/**
 * 曲柄滑块：曲柄 a、连杆 b、偏置 e（滑块导路与曲柄轴心的垂直距离）
 * 输入: { a, b, e, theta1 }
 * 输出: { crankEnd, sliderPos, sliderVel, valid }
 *   sliderPos: 滑块沿水平导路的 x 坐标
 */
export function crankSlider({ a, b, e, theta1 }) {
  const crankEnd = {
    x: a * Math.cos(theta1),
    y: a * Math.sin(theta1),
  };
  // 滑块在水平导路 y = -e 上（约定 e>0 表示导路在曲柄轴心下方）
  // (sliderX - crankEnd.x)^2 + (-e - crankEnd.y)^2 = b^2
  const dy = -e - crankEnd.y;
  const disc = b * b - dy * dy;
  if (disc < 0) return { valid: false, crankEnd, sliderPos: null };
  // 取 +sqrt（滑块通常在远端）
  const sliderPos = crankEnd.x + Math.sqrt(disc);
  return { valid: true, crankEnd, sliderPos };
}

/**
 * 槽轮机构（Geneva）：主动销一次转动，从动轮间歇转动
 * 简化模型：n 个槽的从动轮，主动销以角速度 ω 匀速转动
 * 输入: { n: 槽数, driveAngle: 当前主动销角度 (rad), R: 主动销旋转半径 }
 * 输出: { driverAngle, drivenAngle, engaged: bool }
 *   engaged = 主动销在槽内
 */
export function geneva({ n, driveAngle, R = 60 }) {
  // 每槽对应角度
  const slotAngle = TAU / n;
  // 标准化主动销角度到 [0, TAU)
  const normA = ((driveAngle % TAU) + TAU) % TAU;
  // 主动销在 [0, slotAngle/2) 内啮合（具体范围依赖几何，这里简化）
  // 简化：将主动销角度归一化到单个周期内
  const phase = normA % slotAngle;
  const inDrive = phase < slotAngle / 2;
  // 啮合期间从动轮转动 slotAngle；非啮合期间保持
  // 这里返回相位信息，UI 层负责展示
  return {
    driverAngle: normA,
    phase,
    slotAngle,
    inDrive,
    drivenAngle: inDrive ? (phase / (slotAngle / 2)) * slotAngle : 0,
  };
}

/**
 * 标准齿轮节圆计算
 * 输入: { m: 模数, z1, z2: 齿数 }
 * 输出: { r1, r2, ratio, centerDist }
 */
export function gears({ m, z1, z2 }) {
  const r1 = (m * z1) / 2;
  const r2 = (m * z2) / 2;
  return {
    r1,
    r2,
    ratio: z2 / z1,
    centerDist: r1 + r2,
  };
}

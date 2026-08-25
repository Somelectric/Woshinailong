// 机构运动学数学工具库 v2
// 全部采用 y 向上的数学坐标系；绘制层负责转成 SVG 坐标（y 向下）。
// 单位约定：长度 mm，角度 rad（函数名带 Deg 后缀的除外），扭矩 N·m。

export const TAU = Math.PI * 2;
export const deg = (rad) => (rad * 180) / Math.PI;
export const rad = (d) => (d * Math.PI) / 180;
export const G = 9.81; // m/s²

/* ============================================================
 * 四杆机构
 * ============================================================ */

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

  const dx = D.x - B.x;
  const dy = D.y - B.y;
  const distBD = Math.hypot(dx, dy);

  if (distBD > b + c + 1e-6 || distBD < Math.abs(b - c) - 1e-6) {
    return { valid: false, A, D, B, C: null, theta2: null, theta3: null };
  }

  const a1 = (b * b - c * c + distBD * distBD) / (2 * distBD);
  const h = Math.sqrt(Math.max(0, b * b - a1 * a1));

  const ux = dx / distBD;
  const uy = dy / distBD;
  const px = -uy;
  const py = ux;

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
 * 输出: { grashof, type, desc }
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
  if (s.role === 'frame') {
    return { grashof: true, type: 'double-crank', desc: '双曲柄（最短杆是机架）——两个连架杆都能整周转动' };
  }
  if (s.role === 'crank' || s.role === 'rocker') {
    return { grashof: true, type: 'crank-rocker', desc: '曲柄摇杆（最短杆是连架杆）——原动件整周转动，从动件只摆动' };
  }
  return { grashof: true, type: 'double-rocker', desc: '双摇杆（最短杆是连杆）——两个连架杆都只能摆动' };
}

/**
 * 连杆曲线上某点的位置
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
 * 传动角：连杆 b 与从动杆（摇杆 c）之间的夹角（锐角形式，rad）
 * μ 越大传力越好；工程准则 μ_min ≥ 40°（高速重载建议 ≥ 50°）
 */
export function transmissionAngle(sol) {
  if (!sol.valid) return null;
  const { B, C, D } = sol;
  const vBC = { x: C.x - B.x, y: C.y - B.y }; // 连杆方向
  const vDC = { x: C.x - D.x, y: C.y - D.y }; // 摇杆方向
  const dot = vBC.x * vDC.x + vBC.y * vDC.y;
  const cosMu = dot / (Math.hypot(vBC.x, vBC.y) * Math.hypot(vDC.x, vDC.y));
  const mu = Math.acos(Math.max(-1, Math.min(1, cosMu)));
  return Math.min(mu, Math.PI - mu); // 锐角形式
}

/**
 * 最小传动角：曲柄与机架共线的两个位置（θ₁=0 与 θ₁=π）取劣者
 * 余弦定理直接解，无需数值搜索
 * 输出: { mu1, mu2, muMin } 单位 rad；仅对装配成功的杆长有意义
 */
export function minTransmissionAngle({ a, b, c, d }) {
  // θ₁ = π（曲柄指向 D，BD 距离 = d − a）：折叠共线
  const d1 = Math.abs(d - a);
  // θ₁ = 0（曲柄背向 D，BD 距离 = d + a）：拉伸共线
  const d2 = d + a;
  const muOf = (distBD) => {
    const cosMu = (b * b + c * c - distBD * distBD) / (2 * b * c);
    const mu = Math.acos(Math.max(-1, Math.min(1, cosMu)));
    return Math.min(mu, Math.PI - mu); // 锐角形式
  };
  const mu1 = muOf(d1);
  const mu2 = muOf(d2);
  return { mu1, mu2, muMin: Math.min(mu1, mu2) };
}

/**
 * 急回特性：极位夹角 θ 与行程速比系数 K
 * 摇杆两极限位置出现在曲柄与连杆共线时（AC = b−a 与 AC = b+a）
 * 输出: { thetaDeg, K, valid } —— 仅曲柄摇杆有意义；K>1 表示有急回
 */
export function quickReturn({ a, b, c, d }) {
  const angAt = (AC) => {
    const cosA = (d * d + AC * AC - c * c) / (2 * d * AC);
    return Math.acos(Math.max(-1, Math.min(1, cosA)));
  };
  const angExt = angAt(b + a); // 曲柄+连杆拉直共线
  const angFold = angAt(Math.abs(b - a)); // 折叠共线
  const theta = Math.abs(angExt - angFold); // 极位夹角
  const thetaDeg = deg(theta);
  const K = (180 + thetaDeg) / (180 - thetaDeg);
  return { theta, thetaDeg, K, valid: thetaDeg > 0.5 };
}

/* ============================================================
 * 凸轮
 * ============================================================ */

/**
 * 余弦加速度（简谐）升程规律：升程 β → 远休 δ → 回程 β → 近休 δ，2β+2δ = 2π
 * 返回 0~1 无量纲位移 s(φ)
 */
export function camLaw(phi, beta, delta) {
  const x = ((phi % TAU) + TAU) % TAU;
  if (x < beta) return 0.5 * (1 - Math.cos(Math.PI * x / beta));
  if (x < beta + delta) return 1;
  if (x < 2 * beta + delta) return 0.5 * (1 + Math.cos(Math.PI * (x - beta - delta) / beta));
  return 0;
}

/**
 * 直动从动件压力角（近似，对摆动从动件作教学近似同样适用）
 * tanα = |ds/dφ| / (r₀ + s)；α 越小侧向推力越小，准则 α_max ≤ 30°（升程）
 * 输入: { r0, h, beta, phi }（凸轮几何 + 升程规律参数）
 * 输出: { alpha, s } 单位 rad / mm
 */
export function camPressureAngle({ r0, h, beta, phi }) {
  const eps = 1e-4;
  const s = h * camLaw(phi, beta, deltaFromBeta(beta));
  const s2 = h * camLaw(phi + eps, beta, deltaFromBeta(beta));
  const dsdphi = (s2 - s) / eps; // mm/rad
  const tanAlpha = Math.abs(dsdphi) / (r0 + s);
  return { alpha: Math.atan(tanAlpha), s };
}
function deltaFromBeta(beta) { return Math.PI - beta; } // 2β+2δ=2π

/* ============================================================
 * 曲柄滑块 / 平行夹爪
 * ============================================================ */

/**
 * 曲柄滑块：曲柄 a、连杆 b、偏置 e（滑块导路与曲柄轴心的垂直距离）
 * 输出: { crankEnd, sliderPos, valid }
 */
export function crankSlider({ a, b, e, theta1 }) {
  const crankEnd = {
    x: a * Math.cos(theta1),
    y: a * Math.sin(theta1),
  };
  const dy = -e - crankEnd.y;
  const disc = b * b - dy * dy;
  if (disc < 0) return { valid: false, crankEnd, sliderPos: null };
  const sliderPos = crankEnd.x + Math.sqrt(disc);
  return { valid: true, crankEnd, sliderPos };
}

/**
 * 平行夹爪（连杆式）：单个舵机圆盘上两个相位差 180° 的曲柄销，
 * 各经一根恒长连杆驱动一只手指，手指沿水平导轨纯平移。
 * 导轨过曲柄中心（railY=0）时机构严格对称。
 * 输入: { r: 曲柄半径, l: 连杆长, theta: 曲柄角, railY: 导轨 y（默认 0） }
 * 输出: { pin1, pin2, f1, f2, gamma1, gamma2, openness, valid }
 *   f1/f2: 手指位置；gamma: 连杆与导轨方向的夹角（传动角，rad）
 *   openness: 两手指内侧间距（mm）
 */
export function parallelGripper({ r, l, theta, railY = 0 }) {
  const pin1 = { x: r * Math.cos(theta), y: r * Math.sin(theta) };
  const pin2 = { x: -pin1.x, y: -pin1.y };
  const dy1 = railY - pin1.y;
  const disc = l * l - dy1 * dy1;
  if (disc <= 0) return { valid: false, pin1, pin2 };
  const s = Math.sqrt(disc);
  const f1 = { x: pin1.x + s, y: railY }; // 右手指：取销右侧交点
  const f2 = { x: pin2.x - s, y: railY }; // 左手指：镜像取左侧交点
  const gamma1 = Math.atan2(Math.abs(f1.y - pin1.y), Math.abs(f1.x - pin1.x)); // 连杆与水平夹角
  const gamma2 = gamma1; // 严格对称
  const fingerW = 12; // 手指宽度（示意）
  return {
    valid: true, pin1, pin2, f1, f2, gamma1, gamma2,
    openness: (f1.x - fingerW / 2) - (f2.x + fingerW / 2),
  };
}

/**
 * 夹持力（虚功原理，准静态、忽略摩擦与惯性）
 * 输入: { r, l, theta, torque } 扭矩单位 N·mm（如 20 kg·cm ≈ 1960 N·mm）
 * 输出: { F: 单指法向力 N, dxdtheta: 手指位移对曲柄角导数 }
 */
export function gripForce({ r, l, theta, torque }) {
  const eps = 1e-5;
  const sol = (t) => parallelGripper({ r, l, theta: t });
  const a = sol(theta);
  const b = sol(theta + eps);
  if (!a.valid || !b.valid) return { F: null, dxdtheta: null };
  const dxdtheta = (b.f1.x - a.f1.x) / eps;
  if (Math.abs(dxdtheta) < 1e-6) return { F: null, dxdtheta };
  return { F: Math.abs(torque / dxdtheta), dxdtheta };
}

/* ============================================================
 * 槽轮机构（Geneva）—— 真实几何与运动学
 * ============================================================ */

/**
 * 槽轮几何：中心距 C = R/sin(π/n)（保证销入槽无冲击）
 * alpha: 半啮合角（销从入槽到出槽主动轮转角的一半）= π/2 − π/n
 * motionAngle: 从动轮每槽步进角 = 2π/n
 * 输出: { C, lambda, alpha, motionAngle, dwellAngle }
 *   lambda = R/C = sin(π/n)；dwellAngle: 主动轮每循环的停歇弧段
 */
export function geneva({ n, R = 60 }) {
  const C = R / Math.sin(Math.PI / n);
  const lambda = R / C;
  const alpha = Math.PI / 2 - Math.PI / n;
  const motionAngle = TAU / n;               // 从动轮步进角
  const dwellArc = TAU - 2 * alpha;          // 主动轮停歇弧段
  return { C, lambda, alpha, motionAngle, dwellArc };
}

/**
 * 槽轮从动轮真实转角（正切关系）
 * φ 为主动销相对"销心连线"的角度；|φ| ≤ alpha 时啮合
 *   tanβ = λsinφ / (1 − λcosφ)，β ∈ (−π/n, +π/n)
 * 角速度比：ω₂/ω₁ = λ(cosφ − λ) / (1 − 2λcosφ + λ²)
 * 输出: { engaged, beta, ratio }
 */
export function genevaDriven({ n, R = 60, driverAngle }) {
  const { lambda, alpha } = geneva({ n, R });
  const phi = ((driverAngle + alpha) % TAU + TAU) % TAU - alpha; // 归一到 [−alpha, TAU−alpha)
  if (phi >= -alpha && phi <= alpha) {
    const beta = Math.atan2(lambda * Math.sin(phi), 1 - lambda * Math.cos(phi));
    const ratio = (lambda * (Math.cos(phi) - lambda)) /
      (1 - 2 * lambda * Math.cos(phi) + lambda * lambda);
    return { engaged: true, beta, ratio };
  }
  return { engaged: false, beta: null, ratio: 0 };
}

/* ============================================================
 * 齿轮与轮系
 * ============================================================ */

/**
 * 标准齿轮节圆计算
 * 输出: { r1, r2, ratio, centerDist }
 */
export function gears({ m, z1, z2 }) {
  const r1 = (m * z1) / 2;
  const r2 = (m * z2) / 2;
  return { r1, r2, ratio: z2 / z1, centerDist: r1 + r2 };
}

/**
 * 齿轮啮合相位补偿：两轮节圆相切时，为使齿与齿槽对上，
 * z1 为奇数时从动轮需错开半个齿距
 * 输出: 从动轮相位偏移（deg）
 */
export function gearPhase(z1, z2) {
  return z1 % 2 !== 0 ? 180 / z2 : 0;
}

/**
 * 行星轮系（Willis 公式，内齿圈固定、太阳轮输入、系杆输出）
 * i = 1 + zr/zs；装配条件 zp = (zr − zs)/2 须为整数
 * 输出: { ratio, assemblyOK, zpNeeded }
 */
export function willis({ zs, zp, zr }) {
  const ratio = 1 + zr / zs;
  const assemblyOK = (zr - zs) % 2 === 0 && zp === (zr - zs) / 2;
  return { ratio, assemblyOK, zpNeeded: (zr - zs) / 2 };
}

/**
 * 蜗轮蜗杆传动比：i = z_wheel / z_thread（z_thread 为蜗杆头数）
 */
export function wormRatio({ zWheel, zThread = 1 }) {
  return zWheel / zThread;
}

/* ============================================================
 * 执行器
 * ============================================================ */

/**
 * 关节扭矩：水平面内抬起负载所需的保持扭矩
 * T = m·g·L·cosθ（θ 为臂与水平方向的仰角）
 * 输入: { m_kg, L_m, angle_deg }
 * 输出: { Nm, kgcm }
 */
export function motorTorque({ m_kg, L_m, angle_deg = 0 }) {
  const Nm = m_kg * G * L_m * Math.cos(rad(angle_deg));
  return { Nm, kgcm: Nm / 0.0980665 };
}

/**
 * 直流电机扭矩-转速线性模型（额定电压下）
 * T = T_stall · (1 − n / n₀)，n₀ 为空载转速
 */
export function dcMotorCurve({ stallTorque, noLoadRPM, rpm }) {
  if (noLoadRPM === 0) return null;
  const n = Math.max(0, Math.min(noLoadRPM, rpm));
  return stallTorque * (1 - n / noLoadRPM);
}

/**
 * 真空吸盘吸力：F = Δp · A = Δp · πD²/4
 * 输入: { dP_kPa: 压差, d_mm: 吸盘直径 }
 * 输出: F（N）
 */
export function vacuumForce({ dP_kPa, d_mm }) {
  const A = Math.PI * d_mm * d_mm / 4; // mm²
  return dP_kPa * 1000 * A * 1e-6; // kPa·m² → N
}

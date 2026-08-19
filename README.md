# 机构设计课程资料

ARC 农业机器人俱乐部 · 大一新成员入门课 · 基于 ASABE 2025 国际亚军（Machine Family 队）的鸡蛋分拣机器人。

## 分工

| 部分 | 内容 | 负责 |
|---|---|---|
| **Part 1** | ASABE 经验分享（PPT + PDF） | **宋在扬** |
| **Part 2** | 机构原理互动课（HTML） | **马庆一** |

## 目录结构

```
.
├── part1_asabe/                    # ← 宋在扬 维护
│   ├── slides.pptx                 # 主用 PPT（17 页，含视频）
│   ├── slides.pdf                  # PDF 备份（防字体/兼容问题）
│   ├── build_ppt.py                # PPT 生成脚本（python-pptx）
│   └── export_pdf.py               # PPT → PDF 转换脚本
│
├── part2_mechanisms/               # ← 马庆一 维护
│   ├── index.html                  # 导航首页
│   ├── dof.html                    # 自由度概念页
│   ├── motion-linear.html          # 直线运动（曲柄滑块 hero）
│   ├── motion-oscillation.html     # 摆动（四杆 hero + 3 个待开发）
│   ├── motion-intermittent.html    # 间歇运动（槽轮 hero）
│   ├── motion-gripping.html        # 夹持拾取（平行夹爪 hero）
│   ├── motion-transmission.html    # 减速传动（齿轮对 hero）
│   ├── motion-complex.html         # 复杂曲线（五杆 hero）
│   ├── wrap-up.html                # 选型决策树
│   └── common/                     # 共享：style.css / controls.js / math.js / sidebar.js
│
├── assets/
│   ├── asabe/                      # 从 docx 抽出的实物图（10 张）
│   ├── video/competition-demo.mp4  # 比赛演示视频（19 MB）
│   └── ...
│
├── 2025 ASABE Robotics Design Report Written by Machine Family(1).docx
├── 2025 ASABE Student Robotics Challenge.docx.pdf
└── 整车装配体.png                  # SolidWorks 总装截图
```

## 各部分说明

### Part 1（PPT）

17 页，叙事主线：**任务拆解（解耦 → 选型 → 耦合）+ 迭代 + 细节 + 心得**。

| # | 标题 |
|---|---|
| 1 | 标题页 |
| 2 | ASABE 2025 任务：5 分钟收蛋分拣 |
| 3 | 赛场与任务：场地、四项任务与得分（含场地示意图） |
| 4 | 方法论：解耦 → 耦合 |
| 5 | 收集方案 5 选 1（含网兜式） |
| 6 | 分拣方案 5 选 1（含丝线方案） |
| 7 | 耦合不止一种：两组方案对照（友组 vs 我们） |
| 8 | 耦合：刮板 + 压力传感器一体化 |
| 9 | 设计细节：末端执行器的关键参数 |
| 10 | 迭代思路：方案只是起点（5 个真实迭代故事） |
| 11 | 整机总览 |
| 12 | 释放机构（好蛋 + 坏蛋） |
| 13 | 实战流程：收蛋 → 称重 → 分类 → 释放 |
| 14 | 比赛演示视频 |
| 15 | 机构设计心得：实战教会我们的 6 件事 |
| 16 | 方法论回顾：解耦 → 选型 → 耦合（流程图） |
| 17 | 桥段 + Q&A |

**修改方式**：改 `build_ppt.py` → 跑 `python build_ppt.py` 重新生成 PPT → 跑 `python export_pdf.py` 同步 PDF。

### Part 2（HTML）

9 个页面，按"运动方式"分类。每个 hero demo 都可调参数 + 实时动画。

**修改方式**：纯 HTML/CSS/JS，零依赖。改完直接刷新浏览器看效果。

本地预览（在项目根目录）：
```bash
cd part2_mechanisms
python -m http.server 8765
# 浏览器打开 http://localhost:8765/
```

**待办**：`motion-oscillation.html` 后 3 个 tab（凸轮摆动 / 直接舵机 / 齿条-齿轮）目前是"待开发"占位，可以补。

## 协作约定

用 `git` 协作的标准流程：

```bash
# 改之前先拉最新
git pull

# 改完后
git add <改的文件>      # 或 git add .（加所有改动）
git commit -m "简短描述改了什么"
git push
```

**重要**：
- 改 Part 1 时只动 `part1_asabe/`，改 Part 2 时只动 `part2_mechanisms/`，**互不干扰**
- 共享的素材（`assets/`）改动前最好提前沟通
- PPT 是生成产物，**改了 `build_ppt.py` 一定要重新生成 `slides.pptx`**，不要手改 PPT 然后又跑脚本（会被覆盖）

## 构建 PPT 的依赖

```bash
pip install python-pptx pywin32 Pillow
```

`export_pdf.py` 依赖 Windows 上的 Microsoft PowerPoint（通过 COM 自动化转 PDF）。

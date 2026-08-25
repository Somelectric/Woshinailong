# figure/ —— 待补充实物图片

这个文件夹放**你在网上收集的实物图片**。页面里对应位置已经用虚线"待补充"占位块占好版式，
你只要把图片按下表的文件名放进这个文件夹，然后按最后一节替换一行 HTML，图片就会显示出来。

> 为什么不直接用网图链接？本课程约定**零依赖、离线可用**（不引任何外部 CDN/图床），
> 所以图片必须下载成本地文件放进 `figure/`。

## 需要收集的图片清单

| 文件名 | 放在哪页 | 建议内容 | 搜索关键词 |
|---|---|---|---|
| `actuator-dc-gearmotor.png` | `actuators.html` 执行器选型（页尾） | 直流减速电机 / 舵机实物，最好能看到减速箱与安装法兰 | "直流减速电机 37GB"、"标准舵机 SG90/MG996"、"DC gearmotor" |
| `motor-brushed-dc.png` | `motors.html` · 有刷直流 tab | 有刷直流电机，**最好拆开露出换向器铜片 + 碳刷** | "有刷电机 换向器 电刷"、"brushed DC motor commutator" |
| `motor-bldc.png` | `motors.html` · 无刷 BLDC tab | 无刷电机：航模外转子电机 / 云台电机 | "无刷电机 航模"、"云台电机 BLDC gimbal motor" |
| `encoder-photo.png` | `control.html` · 编码器 tab | 增量式旋转编码器实物（码盘 + 读数头 / 成品 AB 相编码器） | "增量式旋转编码器"、"rotary incremental encoder"、"AS5600 磁编码器" |
| `printer-bambu-p1s.png` | `printing.html` · 认识机器（页首） | 拓竹 Bambu Lab P1S 3D 打印机整机 | "Bambu Lab P1S"、"拓竹 P1S 打印机" |

### 建议规格
- 格式：`.png`（透明底最佳）或 `.jpg`；文件名**必须与上表完全一致**。
- 比例：任意（页面会按原比例完整显示、不裁切，最大高度约 420px）。
- 大小：单张建议 ≤ 800 KB（课堂离线加载快）。宽度 800–1200px 足够清晰。
- 版权：优先用可商用/CC 授权或自己拍的图，课堂内部使用注意来源。

## 放好图片后，怎么让它显示（每张图改一行）

页面里现在是这样的占位块（以执行器页为例）：

```html
<figure class="photo-fig" data-reveal>
  <div class="img-placeholder">🖼 待补充：直流减速电机 / 舵机实物<span class="ph-file">figure/actuator-dc-gearmotor.png</span></div>
  <figcaption>……</figcaption>
</figure>
```

把中间那行 `<div class="img-placeholder">…</div>` 换成 `<img>` 即可（`<figcaption>` 不用动）：

```html
<figure class="photo-fig" data-reveal>
  <img src="figure/actuator-dc-gearmotor.png" alt="直流减速电机 / 舵机实物" loading="lazy">
  <figcaption>……</figcaption>
</figure>
```

其余四处同理，`src` 换成对应文件名即可。改完直接刷新浏览器（走 `http://`，见项目根 README）。

## 备注：已有可用但未用上的图（可选）
`assets/asabe/` 里有两张**软爪材料**图已存在、但当前没被引用：
- `material-fabric.png`（织物/柔性材料）
- `material-sponge.png`（海绵/软性材料）

如果想给 `motion-gripping.html` 的"软爪"小节补配图，可以直接用这两张（无需再收集）。需要的话告诉我，我来接进去。

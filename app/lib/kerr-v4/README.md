# Kerr v4：逐像素 Kerr 光线追踪（路线图 A1）

这一版用真正的 Kerr 零测地线替换 `KerrRayTraceRendererV3` 里的 2D 启发式着色器。屏幕上每个像素都从相机出发积分一条光线。GPU 结果和 float64 参考逐像素比对过，Cinematic 和 Science 两种显示用的是同一套几何、红移和颜色。

## 文件

| 文件 | 作用 |
| --- | --- |
| `kerrMetricKS.ts` | Kerr–Schild 笛卡儿坐标下的度规、解析导数、哈密顿方程；ISCO、光子轨道、圆轨道 E/L/Ω |
| `kerrDiskModel.ts` | Page–Thorne 通量表（数值积分）、黑体 CIE → 线性 sRGB 颜色表 |
| `kerrCameraV4.ts` | 静止观测者的正交标架（float64 度规 Gram–Schmidt），像素 → 初始动量 |
| `kerrReferenceTracer.ts` | float64 参考：Dormand–Prince 5(4)，rtol 1e-10，割线法定位赤道面穿越 |
| `kerrShaderV4.ts` | GLSL ES 3.00 着色器（与参考同一组方程，float32 + RK4）、uniform 打包、两个预设 |
| `kerrWebGLRendererV4.ts` | 不依赖框架的 WebGL2 驱动；`KerrCinematicPipelineV4` 负责 HDR、bloom 和 ACES |
| `kerrThreeV4.ts` | three.js 材质与 uniform 绑定（three 0.170 实测与原生 WebGL 路径逐像素一致） |
| `../../components/KerrRendererV4.tsx` | R3F 组件 |
| `kerrReference.test.ts` | 9 项解析校验（vitest） |
| `validation/validation-128-step0.04.json` | GPU 对 float64 的验证记录 |
| `../../../scripts/kerr-v4/` | 交互演示的源码与构建脚本、验证脚本 |
| `../../../public/kerr-v4-demo.html` | 构建好的单文件演示（开发服务器下访问 `/kerr-v4-demo.html`，也可直接双击打开） |

## 物理与数值

- 坐标：Kerr–Schild 笛卡儿坐标，G = c = M = 1，自旋沿 +z。外视界在该坐标下正则。
- 光线：哈密顿形式 H = ½(−k_t² + |k|²) − ½ f L²，L = −k_t + l·k。k_t 守恒。
- 相机：KS 静止观测者 u ∝ ∂_t（必须位于能层外）。按构造 k·u_obs = 1，所以 g = 1 / (k·u_em)。
- 吸积盘：赤道面薄盘，不透明，从 ISCO 延伸到 rOut。发射体沿顺行开普勒圆轨道运动。通量用 Page–Thorne 公式，T ∝ F^¼，观测温度 T_obs = g·T。
- 颜色与亮度：取观测温度 T_obs 下黑体的 CIE Y 亮度和色度。对黑体盘来说这正是可见光波段的观测结果，所以多普勒增亮和颜色偏移会自动出现，不需要另外编写。
- 捕获判据：r < r₊ + 0.02。逃逸判据：r > max(8D, 20 rOut, 600)，并且光线向外运动。CPU 和 GPU 用的是同一份常量。

## 验证结果

`kerrReference.test.ts` 共 9 项，全部通过：

- r、f、l 的解析导数与中心差分之差 < 1e-7。
- 光线初始为零矢量（|H| < 1e-14），沿强弯曲光线 |H| 保持在 1e-9 以下。
- Schwarzschild 阴影角半径与 sin α = 3√3·√(1−2/D)/D 的相对误差 < 1e-6（D = 1000）。
- a = 0.9、侧视时，阴影左右边缘与 α = −λ(r_ph) 的误差 < 0.01 M，且顺行一侧在左边。这一项同时检查了自旋方向。
- 正视时盘面红移等于 1/(√(1−f_obs)·u^t)，误差 < 1e-8。
- Page–Thorne 通量在 ISCO 处为零，并已归一化；黑体颜色随温度从红经白到蓝。

GPU 与 float64 参考的逐像素比对（128×128，stepScale 0.04，SwiftShader）：

| 工况 | 分类一致 | 红移 max \|Δg\|/g | 红移 p99 |
| --- | --- | --- | --- |
| a 0.9 · i 75° | 100% | 1.0e-4 | 1.1e-6 |
| a 0 · i 60° | 100% | 2.9e-5 | 5.5e-7 |
| a 0.99 · i 85° | 99.976% | 3.4e-5 | 5.6e-6 |
| a −0.6 · i 45° | 100% | 3.1e-5 | 4.4e-7 |

不一致的 4 个像素都落在近极端自旋的临界曲线上。路线图里 A1 的验收标准是分类一致 ≥ 99%、红移误差 ≤ 1e-3，这一组结果已经满足。帧率那一项（RTX 4060 上 1080p ≥ 60 fps）还需要在你的电脑上实测。

## 运行

```powershell
npx vitest run app/lib/kerr-v4                    # 解析校验
npx tsx scripts/kerr-v4/validate.mts               # GPU 对 float64；默认调用真实 GPU，设 SOFTWARE=1 则复现上面的记录
node scripts/kerr-v4/build-demo.mjs               # 重新生成 public/kerr-v4-demo.html
```

## 接入现有场景

```tsx
import { KerrRendererV4 } from "./KerrRendererV4";
import { KERR_V4_CINEMATIC, KERR_V4_SCIENCE } from "../lib/kerr-v4/kerrShaderV4";

// 例如在 KerrBlackHole.tsx 里替换 <KerrStrongGravityRendererV299 …/> / <KerrRayTraceRendererV3 …/>
<KerrRendererV4
  spin={aOverM}
  center={[0, 0, 0]}
  sceneUnitsPerM={radiusScene / kerrOuterHorizonRadiusM(aOverM)}   // 场景里 1 M 对应的长度（该函数已在 KerrBlackHole.tsx 中导入）
  resolutionScale={0.5}
  settings={strongGravityRenderMode === "science" ? KERR_V4_SCIENCE : KERR_V4_CINEMATIC}
/>
```

组件把场景 +Y 当作自旋轴，只在相机或参数变化时才重新追踪。`output="linear-hdr"` 会输出线性 HDR，交给现有的后处理管线做 bloom 和色调映射。

## 仍属展示层的部分（Science 预设全部关闭）

- `diskDetail`：随开普勒流剪切的湍流纹理，以及外缘渐隐。
- `luminanceGamma < 1`：压缩亮度动态范围，颜色不变。
- bloom。
- 星空是程序生成的，不是星表。

## 帧率实测（2026-11-05，RTX 4060 Laptop，Chrome，ANGLE D3D11）

`PW_CHANNEL=chrome npx tsx scripts/kerr-v4/benchmark.mts`，演示页默认机位（a = 0.9，i = 83°，D = 110 M），每帧计时到 1 像素读回为止（Chrome 里 `gl.finish()` 不会阻塞），记录在 `validation/benchmark-2026-11-05.json`：

| 追踪分辨率 | Cinematic 中位数 | Science 中位数 |
| --- | --- | --- |
| 1920×1080 | 43 ms（23 fps） | 46 ms（22 fps） |
| 1280×720 | 20 ms（50 fps） | 21 ms（47 fps） |
| 960×540 | 11.6 ms（86 fps） | 12.6 ms（79 fps） |

原生 1080p 逐像素追踪达不到 A1 的 60 fps。`KerrRendererV4` 因此在视角变化时以 `resolutionScale`（默认 0.5）追踪并放大显示，视角静止 `settleMs`（250 ms）后再以 `stillResolutionScale`（默认 1）追踪一帧原生分辨率。动画盘面（`animateDisk`）始终用交互分辨率。

## 已接入主场景

`KerrBlackHole.tsx` 的 Cinematic 模式改用 `KerrRendererV4`（替换 V3 二维近似和 V299 cinematic 分支），自旋轴取场景 +Z，与测地线轨迹、教学粒子一致；Science 模式仍用 V299 及其科学载荷。黑洞按展示半径 `horizonScene` 缩放，1 M = horizonScene / r₊ 个场景单位，是展示比例，不是物理尺寸。V4 自己画阴影，所以 Cinematic 模式不再叠加代理视界球和能层网格。画质档位：mobile-safe 0.35、interactive 0.5、science-still 1。

同机位前后对照（sandbox 路由 → 导航器 → “Kerr 相对论工作室”，1280×720）：`docs/screenshots/a1-kerr-v4/before-kerr-studio.jpg`、`after-kerr-studio.jpg`；`intermediate-wrong-spin-axis.jpg` 是自旋轴尚取 +Y 时的错误画面（盘面和轨迹不在同一平面），留作记录。

## 真实 GPU 校验（2026-11-05）

`PW_CHANNEL=chrome npx tsx scripts/kerr-v4/validate.mts` 在 RTX 4060 Laptop（ANGLE D3D11）上运行，记录在 `validation/validation-128-step0.04-gpu.json`：分类一致 100% / 100% / 99.976% / 100%，红移最大相对误差 1.5e-4 / 1.7e-5 / 3.5e-5 / 1.1e-5，均满足 A1 的 ≥ 99%、≤ 1e-3。

## 入口

默认 Orbit Atlas 界面：右上“工具” → “Kerr 黑洞 · 光线追踪”（`docs/screenshots/a1-kerr-v4/atlas-default-entry.jpg`），Esc 退出。sandbox 路由的导航器入口“Kerr 相对论工作室”保留。

## 接下来

1. 用 Gaia 星表立方体贴图替换程序星空；静帧加入逐帧累积超采样。
2. 路线图 A2：厚盘、偏振（Walker–Penrose 上 GPU）、热斑。

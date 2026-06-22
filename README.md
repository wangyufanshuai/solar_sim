# Solar sim — Next.js + React Three Fiber

App Router + TypeScript：深色背景 + 可选 equirect 银河环境球、选择性 Bloom / Vignette、轨道尾迹、天体标签、底部控制栏。旧版 Vite 前端仍在 `solar_sim/web/`。

### LightBender（可选引力透镜后处理）

- **默认关闭**。在 `.env.local` 中设置 `NEXT_PUBLIC_LENSING_ENABLED=1` 启用；可选 `NEXT_PUBLIC_LENSING_STRENGTH`（默认 1）、`NEXT_PUBLIC_LENSING_STEPS`（4–16，默认 10）、`NEXT_PUBLIC_LENSING_UV_SCALE`（屏幕 UV 夸张系数，默认 5）。
- **`NEXT_PUBLIC_LENSING_QUALITY`**：`high`（默认）| `medium` | `low`。分档控制 **参与透镜的天体数量**（最多 12 / 8 / 4，且始终包含太阳）、**迭代步数上限**、**切向环增强** 与 **弧向 3-tap 窄带采样**（low 档关闭窄带采样）。高分辨率下优先用 `medium` 或 `low` 以维持帧率。
- **物理说明**：日心场景下真实透镜角极小；本效果为 **δθ ∝ 4GM/(c²b)** 的多体弱场近似 + 沿视线若干次迭代，并带 **强度系数**，用于教学可视化（爱因斯坦环/弧），**非真实比例**。
- **屏幕映射**：将偏折前后的视线与相机 **`projectionMatrix` × `viewMatrix`** 重投影到 UV，再叠加相对 **太阳屏幕位置** 的切向加权与可选弧向采样，比早期纯 `(Δw).xy` 近似更符合透视。
- **天体裁剪**：太阳始终参与；其余天体按 **m / dist²** 排序，并丢弃相机后方（与视线夹角余弦小于 −0.1）的候选，减少无效循环。
- **实现**：`postprocessing` 自定义 `Effect`（`LightBenderEffect.ts`），仅对 **深度接近远裁剪** 的像素扭曲背景，行星/太阳几何不因深度掩码而整体形变。链路上置于 **SelectiveBloom 之前**，减轻 Bloom 对扭曲的二次采样伪影。
- **性能**：单 Pass、步数 × 天体数有上限；2K/高刷下可降低 `NEXT_PUBLIC_LENSING_QUALITY`、`NEXT_PUBLIC_LENSING_STEPS`，或与 SSAO 二选一。

### 物理积分 Web Worker + SharedArrayBuffer

- **默认路径**：若页面为 [**cross-origin isolated**](https://developer.mozilla.org/en-US/docs/Web/API/crossOriginIsolated)（[`next.config.mjs`](next.config.mjs) 已加 `COOP: same-origin` + `COEP: credentialless`），则使用 **Dedicated Worker** 跑 [`SolarSystemPhysics`](app/lib/solarSystemPhysics.ts)，状态经 **SharedArrayBuffer** 与主线程共享（`posM` / `velM` / `posAu` / `mass` + 元数据），渲染侧仅读 TypedArray 视图。
- **回退**：无隔离或无 `SharedArrayBuffer` 时自动回到 **主线程** 积分（行为与旧版一致）。
- **缓冲容量**：[`PHYSICS_CAPACITY = 256`](app/lib/physicsSharedBuffer.ts) 预分配槽位；当前仍只积分前 `SOLAR_SYSTEM_BODIES.length` 个天体，为后续小行星扩展留空。
- **性能 HUD**：左上角「物理计算」显示 **积分子步/秒**（滑动 1s）与 **Full 1PN / Economy / Newton** 档位（Economy 放宽 DP 容差与加速度求值上限；Newton 强制 `invC2=0`）。底栏「引力：EIH 1PN / 牛顿」仍控制是否传入 `1/c²`。
- **历书日**：`simDaysRef` 在主线程按帧累加，与 Worker 内元数据中的 sim-days 并行维护（UI 以 ref 为准）。

### 克尔黑洞（演示天体）

- **位置**：固定于 [`KERR_BLACK_HOLE_OFFSET_AU`](app/components/KerrBlackHole.tsx)（约 52 AU 偏移），**不参与** [`SolarSystemPhysics`](app/lib/solarSystemPhysics.ts) N 体积分，避免破坏 J2000 初值。
- **几何**：[`kerrGeometry.ts`](app/lib/kerrGeometry.ts) 给出外视界半径 r₊、赤道外静态极限（能层外边界）等 **Kerr 解析式**（无量纲自旋 χ=a/M）；面板实时显示 **物理千米** 尺度。
- **能层外观**：扁球状半透明壳由顶点着色器按 **静态极限** r_sl(θ)/r₊ 径向位移单位球实现；片元阶段用 **程序化 flow map + 噪声** 做环向流动，χ→0 时自动减弱，仅为 **参考系拖拽的教学示意**，非严格 Kerr 流体或测地线纹理。场景 uniform 含 r_g 与 r₊（`uRgScene` / `uHorizonRadius`）。
- **测试粒子**：[`kerrFrameDraggingAccel.ts`](app/lib/kerrFrameDraggingAccel.ts) 使用 **弱场 GEM**（牛顿引力 + 与 J 相关的 gravitomagnetic 项），**不是**完整 Kerr 测地线；真实 Lense–Thirring 加速度极小，故 **「参考系拖曳放大」** 滑条为教学系数，仅作用于粒子受力。
- **视界大小在场景中的显示**：真实 r₊ 相对 AU 可忽略；场景中经 `LENGTH_EXAGGERATION` 放大，仅保留 **相对形状** 随 M、χ 的变化趋势。

---

## 如何运行（推荐：两个终端）

### 前置条件

- **Node.js 18+**（终端执行 `node -v`）
- **Python 3.10+**，已安装本仓库依赖（`pip install -r solar_sim/requirements.txt` 或你当前用的环境）
- 仓库根目录指包含 `solar_sim` 文件夹的那一层（例如 `E:\86137\myai`）

### 终端 A：可视化后端（端口 8765）

在**仓库根目录**打开 PowerShell 或 CMD，把 `PYTHONPATH` 设为根目录（让 Python 能 `import solar_sim`），再启动 `uvicorn`：

**PowerShell：**

```powershell
cd E:\86137\myai
$env:PYTHONPATH = "E:\86137\myai"
python -m uvicorn solar_sim.viz_server:app --host 127.0.0.1 --port 8765
```

若 `python` 不可用，可改用 `py -3 -m uvicorn ...`。

看到 `Uvicorn running on http://127.0.0.1:8765` 即成功。  
（仅看 Next 3D 场景、不连仿真时，**可以暂时不启** 8765。）

### 终端 B：Next 前端（端口 **3001**，避免与常见 3000 冲突）

```powershell
cd E:\86137\myai\solar_sim\next-web
npm install
npm run dev
```

浏览器打开：**http://127.0.0.1:3001/** 或 **http://localhost:3001/**（本项目的 `npm run dev` **默认 3001**，不是 Next 默认的 3000。开发脚本已绑定 **`127.0.0.1`**，部分环境下比纯 `localhost` 更稳定。）

**务必使用 `http://`，不要用 `https://`。** 开发服务器是普通 HTTP；若用 https 访问，浏览器会提示「无效响应」或连接失败。

**地址栏里端口后面只保留 `/` 或留空**，不要把中文说明、全角括号等粘进路径（否则易触发异常页面）。误粘时可直接访问根路径：**`http://127.0.0.1:3002/`**（若你用 `dev:3002`）。

### 若终端报 `EADDRINUSE`（端口被占用）

说明 **3001 上已有旧的 `node` 进程**（例如上次没关的 dev）。任选其一：

1. 结束占用端口的进程后再 `npm run dev`。
2. 换端口启动：`npm run dev:3002`，然后打开 **http://127.0.0.1:3002/**。

### 若浏览器出现「404 | This page could not be found」

1. **核对端口**：地址栏必须是 **`http://localhost:3001/`**。若打开的是 **`http://localhost:3000/`**，往往是电脑上**别的程序**在占用 3000，你会看到空白站点的 404，而不是本仿真。
2. **核对目录**：`npm run dev` 必须在 **`solar_sim/next-web`** 下执行（该目录内有 `app/page.tsx`）。
3. **想改用 3000**：在项目目录执行 `npm run dev:3000`，然后打开 **http://localhost:3000/**。
4. **仍异常**：删掉 `.next` 后重装并启动：`Remove-Item -Recurse -Force .next; npm run dev`（PowerShell）。

- **旋转/缩放场景**：在画布上拖拽（OrbitControls）。
- **底部栏**：播放/暂停（控制 N 体积分与历书日累加）、**天/秒** 缩放仿真步长、**引力：EIH 1PN / 牛顿** 开关、缩放 ±、准星（焦点回原点）已与相机联动。
- **双击天体**（太阳/行星/月球）：打开右侧 **Universe Sandbox 风格侧栏**，并触发 **inspect** 相机近距离框选约 4s；单击天体仅阻止从球面起拖 OrbitControls，不会打开侧栏。底栏准星：对已选天体做 **orbit** 远景对准；无选中则回日心。
- **地月视角**：底栏 **地球图标** — 相机对准地–月中心、自动拉近；并临时 **放大地球/月球网格与标签**（仅显示用，N 体位置不变）。双击其他天体、对准选中、回日心或关闭侧栏会退出该模式。
- **装饰小天体**：若干带标签的**非 N 体**小点（如 2014 NW65、Arrokoth）仅作远景氛围，不参与 `SolarSystemPhysics` 积分。
- **轨道轨迹**：极细线（`lineWidth≈0.55`）、**低透明度**（`opacity≈0.1`）、**高 tailFloor** 使整条弧像参考图里淡淡的雾线；`toneMapped={false}` 避免 Bloom/色调映射把线拉爆；各行星 **muted** 分色。选中时仅略提亮。想更醒目可调 `SolarSystemBodies` 内 `OrbitTrail` 的 `opacity` / `lineWidth`。
- **闭合椭圆（密切轨道）**：在积分尾迹之外另有一层**瞬时两体日心开普勒椭圆**（`OsculatingOrbitEllipse` + `osculatingOrbit.ts`），更接 Universe Sandbox 的整圈示意；N 体扰动下椭圆会缓慢变形。无界轨道时不绘制。
- **行星外观**：将 2K 等矩形贴图放入 [`public/textures/planets/`](public/textures/planets/)，文件名为 **`{id}.jpg`**（`mercury` … `neptune`、`moon`，见目录 [`README.md`](public/textures/planets/README.md)）；可在 `next-web` 下执行 **`node scripts/fetch-planet-textures.mjs`** 自动下载。缺失时回退为纯色球。**土星**带程序化光环；**太阳**为高亮 Basic + 参数化日冕（SDO 风格亮度示意，非真实日面纹理），与 Bloom / Lens Flare 协调。
- **WebSocket 仿真**：生产环境使用 `wss://solar.wangyufan.xyz/ws/sim` 与 `wss://solar.wangyufan.xyz/ws/launch`；本地开发可改 `.env.local`。Next rewrites 不处理 WS 升级，线上由 Nginx 反代。

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式（热更新） |
| `npm run build` | 生产构建 |
| `npm run start` | 构建后启动（需先 `build`） |

### 浏览器显示 Internal Server Error

多为 **`.next` 与当前代码不同步**（日志里可能出现 `Cannot find module './xxx.js'`）。在项目目录删除缓存后重启：

```powershell
cd E:\86137\myai\solar_sim\next-web
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

若 **3001 已被占用**，先结束占用该端口的旧 `node` 进程，或改用 `npx next dev -p 3002`。

---

## Run (English summary)

1. From repo root: `PYTHONPATH=<repo_root> python -m uvicorn solar_sim.viz_server:app --host 127.0.0.1 --port 8765`
2. `cd solar_sim/next-web && npm install && npm run dev` → http://localhost:3001

---

## 资源与代理

- **`next.config.mjs`**：`/textures/*` 在本地 `public/` 没有文件时，会尝试转发到 `http://127.0.0.1:8765/textures/*`。
- **背景**：清屏与初始底色为 **#000000**。默认依次尝试 **`milky-way-equirect.jpg`**、**`eso0932a.jpg`**（见 [`public/textures/sky/README.md`](public/textures/sky/README.md)）：内球材质 **20%** 色调后再 **`PMREMGenerator.fromScene`** → **`scene.background` + `scene.environment`**（[`GalaxyEnvironmentSphere`](app/components/GalaxyEnvironmentSphere.tsx)）。**`NEXT_PUBLIC_SKY_EQUIRECT_URL`** 可强制单 URL；**`NEXT_PUBLIC_SKY_EQUIRECT_EXPOSURE`** 默认 **1**（在 20% 基础上的可选压暗，≤1）。ESO 回退图可运行 **`npm run fetch-sky-eso`**。未就绪或失败时 [`ScienceBackdrop`](app/components/ScienceBackdrop.tsx) 使用渐变 + 星点。行星贴图与「是否 NASA 高清全集」见 [`public/textures/planets/README.md`](public/textures/planets/README.md) 与 **`NEXT_PUBLIC_PLANET_TEXTURE_BASE`**。
- **后处理**：[`PostProcessingSafe`](app/components/PostProcessingSafe.tsx) 使用 **SelectiveBloom**（较高 **`luminanceThreshold`**，偏强太阳、弱行星/暗轨；`ignoreBackground`）；附带轻度 **Vignette**（`offset≈0.3`、`darkness≈0.38`）。天体 **Html 标签** 用 CSS 轻微呼吸光晕；轨道线在材质 **opacity** 上小幅正弦调制。
- **光照与阴影**：[`UniverseCanvas`](app/components/UniverseCanvas.tsx) 中阴影可按体开启；太阳 [`pointLight`](app/components/CelestialBody.tsx) 等提供主照明。环境光 **≤0.02**（默认 **0.01**，「True Void」近黑场）。点光源立方体阴影开销较大，低端机可后续加质量开关。
- **行星贴图**：`public/textures/planets/` 已附带九大天体漫反射图（拉近可见表面细节）；来源与许可见 [`public/textures/planets/README.md`](public/textures/planets/README.md)。可运行 `npm run fetch-planet-textures` 重新下载。
- **线上大资源**：大型 GLB、天空图和行星贴图放在 OSS 的 `solar/` 前缀下，生产环境用 `NEXT_PUBLIC_SOLAR_ASSET_BASE=/solar-assets/solar` 通过同源 Nginx 代理加载，避免 Git 仓库膨胀和 WebGL CORS 问题。
- **轨道线**：细线（`lineWidth≈1.15`）、**分色**、**半透明**（`opacity≈0.38` + 沿历史渐变），风格接近概览型轨道图；想更“实”可把 `SolarSystemBodies` 里 `OrbitTrail` 的 `opacity` 调高或设 `fadeTail={false}`。
- **相机事件桥**：`app/lib/camera-bridge.ts`（底部栏 → Canvas 内 OrbitControls）。

---

## 太阳系 J2000 数据与 N 体

- **数据文件**：[`app/data/planetsJ2000.ts`](app/data/planetsJ2000.ts) — 太阳、水星…海王星与**月球**；`massKg`（kg，[`nasaMasses.ts`](app/data/nasaMasses.ts)）；`positionAu` / `velocityAuPerDay` 来自 [`ephemerisGenerated.ts`](app/data/ephemerisGenerated.ts)（默认 J2000.0 快照）。
- **刷新星历（Horizons）**：在仓库根目录（需已安装 `astroquery` 等，见 `solar_sim/requirements.txt`）执行  
  `python solar_sim/export_ephemeris_nextweb.py`  
  会更新 [`ephemerisGenerated.ts`](app/data/ephemerisGenerated.ts)、[`horizonsReference.ts`](app/data/horizonsReference.ts) 与 `public/data/horizons_reference.json`（详见 `solar_sim/README.md`）。
- **历元**：默认 **J2000.0**（JD **2451545.0** TDB），日心黄道；`EPOCH_JD_TDB` 从星历模块重导出，避免与文件名 “J2000” 混淆。
- **标签读数**：天体 HTML 标签下行显示 **日心距 (AU)**、**视线方向多普勒 z≈v_r/c**（相机指向）、以及与 **Horizons 导出快照** 的 **Δr / Δv**（仅初值历元对齐；长时间积分会偏离）。
- **物理（SI）**：[`app/lib/physicsEngine.ts`](app/lib/physicsEngine.ts) — 全体 **牛顿引力** + 软化 ε；**全部天体** 叠加与 Python [`pn_eih_accel.py`](../pn_eih_accel.py) `acceleration_eih` 一致的 **EIH 1PN**（`inv_c²`；关闭相对论时 `invC2 = 0` 走纯牛顿分支）。**动力学仍为点质量**；**J2 扁球项**仅叠加在用于 **弱场引力时间膨胀** 的牛顿势 Φ 上（自转轴近似 **+Z**，见 [`planetJ2Data.ts`](app/lib/planetJ2Data.ts)），天王星/海王星倾角误差为已知教学近似。
- **常数**：[`app/lib/physicalConstants.ts`](app/lib/physicalConstants.ts) 含 `G_SI`（CODATA 2018 量级）、`C_LIGHT`、`AU_METERS`、`C_AU_PER_DAY`（约 173.144… AU/day）。
- **积分**：[`app/lib/solarSystemPhysics.ts`](app/lib/solarSystemPhysics.ts) 默认使用 **Dormand–Prince 5(4)**（与 MATLAB `ode45` 同族）**自适应步长**：按局部误差接受/拒绝步并缩放 `dt`，近距离高速段自动用更小步长，减轻轨迹锯齿；每一步的各 RK 阶段仍调用同一 [`calculateAcceleration`](app/lib/physicsEngine.ts)（**`invC2` 为常数**，不改变 1PN 形式，仅提高时间离散精度）。调试或 A–B 对比：在 `.env.local` 设 **`NEXT_PUBLIC_SOLAR_FIXED_RK4=1`** 可切回 **固定子步 RK4**（至多 256 段、单段 ≤1200 s）。可调参见 `solarSystemPhysics.ts` 顶部常量（`ADAPTIVE_RTOL` / `ADAPTIVE_DT_MIN_S` / `MAX_ACCEL_EVALS_PER_STEP` 等）。
- **R3F**：[`SolarSystemIntegrator.tsx`](app/components/SolarSystemIntegrator.tsx) 在 `useFrame` 中推进物理并累加 `simDaysRef`；[`useSolarSystem.ts`](app/lib/useSolarSystem.ts) 提供 `useSolarSystemPhysicsRef()`；[`SolarSystemBodies.tsx`](app/components/SolarSystemBodies.tsx) 按 `posAu × AU_TO_SCENE` 渲染与尾迹。
- **timeSpeed**：底部栏 **天/秒** 即 `daysPerSecond`，直接缩放积分步长；**暂停**时不推进物理与历书日计数。相对论模式下若发散可适当降低 **天/秒**。

---

## 科研测控看板（`ScienceTelemetryPanel`）

左侧可折叠面板（Recharts）：仅在有**选中天体**时由 [`TelemetryBridge`](app/components/UniverseCanvas.tsx) 向环形缓冲写入样本；UI 约 **160 ms** 轮询刷新，避免整页高频重绘。

- **瞬时径向速度（km/s）**：相对太阳，\(v_\mathrm{rad} = (\mathbf v_b - \mathbf v_\odot)\cdot \hat{\mathbf r}\)，\(\mathbf r = \mathbf r_b - \mathbf r_\odot\)（SI 下为 m/s，图中为 km/s）。选中太阳时径向速度无单独日心定义，图中可显示为 **—**（与侧栏一致）。
- **相对偏心率波动**：由日心瞬时密切轨道得到 \(e(t)\)（与 [`osculatingOrbit.ts`](app/lib/osculatingOrbit.ts) 同源逻辑，见 [`osculatingElements.ts`](app/lib/osculatingElements.ts)）；\(e_\mathrm{rel}(t) = (e(t)-e_0)/\max(|e_0|,\varepsilon)\)，其中 \(e_0\) 为**本会话**在选中该天体后记录的首个有效偏心率。
- **1PN 加速度占比**：对当前物理快照各调用一次 [`calculateAcceleration`](app/lib/physicsEngine.ts)（`invC2=0` 与完整 1PN），\(f_\mathrm{PN} = |\mathbf a_\mathrm{tot}-\mathbf a_N|/\max(|\mathbf a_\mathrm{tot}|,\epsilon)\)。**牛顿模式**或关闭相对论时该项为 **0 / N/A**（导出元数据中会标注 `relativityEnabled`）。双次求加速度成本较高，桥内按**约 120 ms 墙钟**节流采样，而非每帧。
- **FFT 功率谱**：对缓冲内**日心距离（AU）**序列做 radix-2 实 FFT（长度不足时零填充到 2 的幂），横轴为 **cycles/day**；默认加 **Hann 窗**减轻泄漏。分辨率 \(\Delta f \sim 1/(N\,\Delta t_\mathrm{sim\,days})\)，\(N\) 为参与 FFT 的点数。
- **竖向参考线**：由**最新样本**的瞬时密切半长轴与 \(\mu=G(M_\odot+m)\) 估算开普勒周期 \(T\)，在谱上标出 \(f_k=k/T\)（\(k=1,2,3\)）。这些是**教学/启发式参考**，**不是**严格 N 体系统的本征频率；摄动与多体效应会使真实谱峰偏离。
- **导出**：**JSON** / **CSV** 为当前环形缓冲内按时间排序的有效样本，含 `bodyIndex`、`bodyId`、`simDays` 范围与列说明；可用 Python `json.load` / `pandas.read_csv` 读取。

---

## 近期优化说明

- **DPR 上限**：Canvas `dpr={[1, 2]}`，减轻 4K 屏上的 GPU 压力。
- **移动端**：画布区域 `touch-none` 减少误滚动；底栏保留 `pointer-events-auto`；底栏增加安全区内边距。
- **事件名集中**：缩放/聚焦使用 `camera-bridge.ts`，避免字符串写散。

## Production

将 `next.config.mjs` 里 rewrites 的 `destination` 改成实际 API 主机，或只使用 `public/` 静态资源并删除相关 rewrite。

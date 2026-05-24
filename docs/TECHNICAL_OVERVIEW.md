# Universe Sandbox Clone 技术说明文档

本文档说明 `next-web` 项目的技术组成、核心模块、运行方式、渲染管线、物理系统、资源加载和可调参数。目标读者是后续继续开发、调试视觉效果、扩展物理模拟或维护项目的开发者。

## 1. 项目定位

这是一个基于 Next.js + React Three Fiber 的太阳系 / 宇宙沙盒可视化项目。项目目标是复刻 Universe Sandbox 类似的交互体验：可缩放太阳系、星体贴图、轨道可视化、时间推进、相对论 / 黑洞演示、发射模式、历史状态、遥测面板和深空背景。

项目不是纯静态展示页，而是一个前端实时仿真应用：

- 前端 UI 使用 React / Next.js App Router。
- 3D 场景使用 Three.js，通过 `@react-three/fiber` 组织 React 组件。
- 控制器、标签和辅助 3D 工具使用 `@react-three/drei`。
- 后期处理使用 `@react-three/postprocessing` 和 Three.js `EffectComposer`。
- 太阳系动力学使用 TypeScript 自写 N 体积分器。
- 性能路径支持 Web Worker + `SharedArrayBuffer`。
- 星体贴图、银河背景、NASA 图片等资源放在 `public/textures`。

## 2. 技术栈

### 前端框架

- `next@14.2.x`：使用 App Router，页面入口在 `app/page.tsx`，主应用在 `app/UniversePage.tsx`。
- `react@18.3.x` / `react-dom@18.3.x`：UI 状态、组件树、动态加载。
- TypeScript：项目开启 `strict`，配置见 `tsconfig.json`。

### 3D 渲染

- `three@0.170.x`：底层 WebGL 渲染、材质、几何体、后处理、纹理。
- `@react-three/fiber`：把 Three.js 场景写成 React 组件，核心 Canvas 在 `app/components/UniverseCanvas.tsx`。
- `@react-three/drei`：使用 `OrbitControls`、`Html` 标签等便捷组件。
- `three-stdlib`：使用 `Line2` / `LineGeometry` / `LineMaterial` 绘制屏幕空间宽线轨道。

### 后期和视觉

- `@react-three/postprocessing`：用于选择性 Bloom、SSAO、ToneMapping、LensFlare、SMAA、Vignette。
- Three.js `EffectComposer`：备用后期管线，文件在 `app/effects/ThreeJsPostPipeline.tsx`。
- 自定义 ShaderMaterial：星空点、银河背景球、太阳辉光、轨道尾迹、发射粒子、引力透镜等都使用自定义 GLSL。

### UI 和样式

- Tailwind CSS：配置在 `tailwind.config.ts`，全局样式在 `app/globals.css`。
- `framer-motion`：用于部分 UI 动画和侧栏过渡。
- `lucide-react`：图标库。
- `recharts`：科研遥测面板图表。
- 字体：`@fontsource-variable/inter`、`@fontsource-variable/jetbrains-mono`。

### 轨道 / 卫星 / 发射

- `satellite.js`：用于 TLE / 卫星轨道相关逻辑。
- 自写本地发射物理：`app/lib/localLaunchPhysics.ts`。
- 发射 UI 和可视化：`LaunchControlPanel.tsx`、`LaunchSceneView.tsx`、`LaunchTelemetryStrip.tsx`。

## 3. 目录结构

```text
next-web/
  app/
    UniversePage.tsx              # 主页面状态中心
    components/                   # R3F 场景组件和 UI 组件
    lib/                          # 物理、轨道、资源、工具函数
    data/                         # 太阳系数据、星表、参考轨道、贴图 manifest
    effects/                      # 后处理和自定义视觉 effect
    context/                      # React Context
    workers/                      # Web Worker
    api/                          # Next API routes
  public/
    textures/                     # 行星、太阳、星空、银河背景贴图
  scripts/                        # 贴图下载脚本
  docs/                           # 文档
  next.config.mjs                 # Next 配置、COOP/COEP、资源 fallback
```

## 4. 应用入口和状态流

### 页面入口

- `app/page.tsx`：Next 页面入口。
- `app/ClientAppShell.tsx`：客户端壳层。
- `app/UniversePage.tsx`：项目主要状态中心。

`UniversePage.tsx` 管理这些核心状态：

- 播放 / 暂停：`isPlaying`
- 仿真速度：`daysPerSecond`
- 相对论开关：`relativityEnabled`
- 当前选中星体：`selectedBodyIndex`
- 地月视角：`earthMoonView`
- 视觉增强开关：`visualEnhance`
- 视图开关：`viewSettings`
- 物理精度档位：`precisionTierRef`
- 黑洞演示参数：`kerrBlackHole`
- 时间历史和快照：`PhysicsHistoryStack`
- 发射模式状态：`launchMode` / `localLaunchActive`

### Canvas 动态加载

`UniverseCanvas` 使用 Next dynamic import 且关闭 SSR：

```ts
const UniverseCanvas = dynamic(() => import("./components/UniverseCanvas"), {
  ssr: false,
});
```

原因是 WebGL、`window`、`SharedArrayBuffer`、Canvas 等只能在浏览器端运行。

## 5. Three.js 场景结构

### Canvas 配置

文件：`app/components/UniverseCanvas.tsx`

主要设置：

- `dpr={[1, 2]}`：限制最高 DPR，避免 4K 屏 GPU 压力爆炸。
- `camera.fov = 39`：偏 Universe Sandbox 的窄视角。
- `near = 0.5`，`far = 1e9`：支持太阳系尺度。
- `logarithmicDepthBuffer = true`：缓解大尺度下深度精度问题。
- `ACESFilmicToneMapping`：电影式色调映射。
- `outputColorSpace = THREE.SRGBColorSpace`。
- 开启 PCF Soft Shadow。

### 场景主组件

文件：`app/components/UniverseScene.tsx`

核心组成：

- `OrbitControls`：鼠标旋转、缩放、平移。
- `SolarSystemIntegrator`：每帧推进物理。
- `SolarSystemBodies`：渲染太阳、行星、月球、小天体。
- `ScienceBackdrop`：深空星点、银河背景。
- `ReferenceOrbitDecor`：参考轨道线。
- `OsculatingOrbitEllipse`：实时密切轨道椭圆。
- `OrbitTrail`：运动尾迹。
- `KerrBlackHole`：Kerr 黑洞演示。
- `LagrangePointsViz`：拉格朗日点。
- `ConstellationLines` / `GaiaStarField`：远景星表和连线。
- `LaunchSceneBridge` / `LaunchSceneView`：发射模式。
- `PostProcessingGate`：后处理入口。

## 6. 物理系统

### 数据来源

文件：`app/data/planetsJ2000.ts`

星体定义包含：

- `id` / `name`
- `massKg`
- `radiusScene`
- `positionAu`
- `velocityAuPerDay`
- `textureMap`
- `normalMap`
- `atmosphereColor`
- `osculatingCentralBodyIndex`

位置和速度来自 `app/data/ephemerisGenerated.ts`，质量来自 `app/data/nasaMasses.ts`。坐标单位主要是 AU 和 AU/day，积分时会转换为 SI 单位。

关键比例：

- `AU_TO_SCENE = 52`：1 AU 映射为 52 个 Three.js 场景单位。
- `DEFAULT_SIM_DAYS_PER_WORLD_SECOND = 1.2`：默认 1 秒现实时间推进 1.2 天仿真时间。

### N 体引力和 1PN

文件：`app/lib/physicsEngine.ts`

核心函数：`calculateAcceleration`

计算内容：

- 牛顿 N 体引力。
- 可选 Einstein-Infeld-Hoffmann 1PN 修正。
- 软化项 `eps2`，默认约 `1e-4 AU` 的平方，避免近距离数值奇异。

单位：

- 位置：米。
- 速度：米 / 秒。
- 质量：千克。
- 时间：秒。

相对论模式：

- Full / Economy：`invC2 = 1 / c^2`，启用 1PN。
- Newton：`invC2 = 0`，只使用牛顿引力。

### 积分器

文件：`app/lib/solarSystemPhysics.ts`

默认积分器：

- Dormand-Prince 5(4)，类似 MATLAB `ode45`。
- 自适应步长。
- 默认相对误差 `1e-10`。
- Economy 档相对误差 `1e-8`。

备用积分器：

- 固定步长 RK4。
- 通过 `.env.local` 设置 `NEXT_PUBLIC_SOLAR_FIXED_RK4=1` 启用。

性能保护：

- `MAX_DP_ATTEMPTS_PER_STEP`
- `DEFAULT_MAX_ACCEL_EVALS`
- `ECONOMY_MAX_ACCEL_EVALS`
- `ADAPTIVE_DT_MIN_S`
- `ADAPTIVE_DT_MAX_S`

### Worker 和 SharedArrayBuffer

文件：

- `app/workers/physics.worker.ts`
- `app/lib/physicsSharedBuffer.ts`
- `app/lib/useSolarSystem.ts`

项目优先使用 Web Worker + `SharedArrayBuffer`：

- 主线程负责渲染和 UI。
- Worker 负责物理积分。
- `SharedArrayBuffer` 共享 `posM`、`velM`、`posAu`、`mass` 和元数据。

缓冲布局：

```text
posM   Float64Array, capacity * 3
velM   Float64Array, capacity * 3
posAu  Float64Array, capacity * 3
mass   Float64Array, capacity
metaF64
metaI32
```

`PHYSICS_CAPACITY = 256`，当前只积分 `SOLAR_SYSTEM_BODIES.length` 个 active body，预留给更多小天体。

为了启用 `SharedArrayBuffer`，`next.config.mjs` 设置了：

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: credentialless`

如果浏览器不满足 cross-origin isolated，项目会回退到主线程积分。

## 7. 星体渲染

### 星体入口

文件：`app/components/SolarSystemBodies.tsx`

职责：

- 遍历 `SOLAR_SYSTEM_BODIES`。
- 根据物理 `posAu` 更新每个星体的 Three.js group 位置。
- 渲染太阳、行星、月球、小天体、土星环、轨道尾迹和密切轨道。
- 根据 `earthMoonView` 临时放大地球和月球显示尺寸。

### 通用星体

文件：

- `app/components/CelestialBody.tsx`
- `app/components/Planet.tsx`
- `app/components/SunBody.tsx`

行星使用：

- diffuse texture
- optional normal map
- `MeshPhysicalMaterial` 或物理材质参数
- Fresnel 大气辉光：`EarthAtmosphereGlow.tsx`
- 低分辨率 LOD / sprite fallback

太阳使用：

- 太阳贴图。
- 基础球体材质。
- 叠加弱 photosphere overlay。
- Fresnel corona shader。
- sprite halo。
- point light 提供主照明。

### 土星环

`SolarSystemBodies.tsx` 内部的 `SaturnRings` 使用两个 `ringGeometry` 叠层，透明材质、双面渲染，用于快速模拟环带。

## 8. 轨道系统

项目里有三类轨道可视化。

### 运动尾迹

文件：

- `app/components/OrbitTrail.tsx`
- `app/lib/orbitTrailGradientMaterial.ts`

用途：

- 显示星体过去一段时间的路径。
- 使用渐变 ShaderMaterial。
- 支持头部更亮、尾部淡出。
- 对选中星体提高亮度。

### 密切轨道椭圆

文件：

- `app/components/OsculatingOrbitEllipse.tsx`
- `app/lib/osculatingOrbit.ts`
- `app/lib/osculatingElements.ts`

用途：

- 根据当前瞬时位置 / 速度计算二体密切轨道。
- 行星默认以太阳为中心。
- 月球 / 卫星可以指定 `osculatingCentralBodyIndex`。
- 使用 `Line2` 绘制屏幕空间线宽。

### 参考轨道

文件：

- `app/components/ReferenceOrbitDecor.tsx`
- `app/data/referenceKeplerOrbits.ts`

用途：

- 绘制固定 Kepler 参考轨道。
- 可以用于小行星、彗星、外太阳系对象等静态参考。

### 宽线工具

文件：`app/lib/hairlineOrbitLine.ts`

封装：

- `LineGeometry`
- `Line2`
- core line
- glow line
- opacity setter

用双层线模拟“细核心 + 软光晕”。如果轨道太粗、过曝或看不到，优先调这个文件和 `orbitCinematicTokens.ts`。

## 9. 深空背景

### 背景组件

文件：

- `app/components/ScienceBackdrop.tsx`
- `app/components/GalaxyEnvironmentSphere.tsx`
- `app/components/BrightStarCatalog.tsx`
- `app/components/GaiaStarField.tsx`
- `app/components/DeepSpaceGradientSky.tsx`

背景分为几层：

- 银河环境球：加载本地 equirect 图片，如 `/textures/sky/eso0932a.png`、`/textures/sky/milky-way-equirect.jpg`。
- 程序化星点：近、中、远三层 Points。
- Bright star catalog：亮星目录。
- Gaia star field：星表远景。
- fallback gradient：贴图未加载时的深空渐变。

### 星点 shader

`ScienceBackdrop.tsx` 中的星点使用自定义 shader：

- 顶点阶段设置 `gl_PointSize`。
- 片元阶段根据 `gl_PointCoord` 做圆形裁切。
- 使用 Gaussian / smooth edge 避免方块像素点。
- 根据背景贴图是否加载成功降低程序化星点透明度，避免背景和星点互相抢画面。

### 本地背景资源

当前资源位于：

```text
public/textures/sky/
  eso0932a.png
  milky-way-equirect.jpg
```

行星和太阳贴图位于：

```text
public/textures/planets/
public/textures/planets/nasa-hd/
```

如果要替换 NASA 背景图，推荐放到 `public/textures/sky/`，然后在 `GalaxyEnvironmentSphere.tsx` 的候选列表中加入路径，或通过环境变量指定。

## 10. 后期处理

### 管线选择

文件：`app/components/UniversePostProcessing.tsx`

默认有两条路径：

- Three.js `EffectComposer`：`app/effects/ThreeJsPostPipeline.tsx`
- pmndrs postprocessing：当启用 LightBender 或 SSAO 时使用

### ThreeJsPostPipeline

文件：`app/effects/ThreeJsPostPipeline.tsx`

Pass 顺序：

1. `RenderPass`
2. `UnrealBloomPass`
3. Chromatic aberration pass
4. Vignette pass
5. Film grain pass
6. SMAA
7. OutputPass

注意：Bloom、色散、颗粒都很容易让星空变成像素噪点或让太阳过曝。默认应保持保守。

### pmndrs 后期

使用组件：

- `SelectiveBloom`
- `SSAO`
- `ToneMapping`
- `BrightnessContrast`
- `Vignette`
- `SMAA`
- `SunLensFlare`
- `LightBender`

选择性 Bloom 依赖 `BloomSceneContext` 注册目标。太阳、轨道、行星等如果注册过多，会导致全屏泛白。

### 视觉增强开关

状态在 `UniversePage.tsx`：

```ts
const [visualEnhance, setVisualEnhance] = useState(false);
```

UI 在 `UniverseSandboxHud.tsx`。开启后会提高部分后期参数，但默认建议关闭，避免调试时误判材质和贴图。

## 11. 相对论和黑洞演示

### LightBender

文件：

- `app/effects/LightBender.tsx`
- `app/effects/LightBenderEffect.ts`
- `app/effects/lightbender.frag.glsl`
- `app/effects/lightBenderBridge.ts`

用途：

- 对远景背景做屏幕空间引力透镜扭曲。
- 教学 / 视觉演示为主，不按真实太阳系角秒比例展示。

环境变量：

- `NEXT_PUBLIC_LENSING_ENABLED=1`
- `NEXT_PUBLIC_LENSING_STRENGTH`
- `NEXT_PUBLIC_LENSING_STEPS`
- `NEXT_PUBLIC_LENSING_UV_SCALE`
- `NEXT_PUBLIC_LENSING_QUALITY=high|medium|low`

### Kerr 黑洞

文件：

- `app/components/KerrBlackHole.tsx`
- `app/components/KerrBlackHolePanel.tsx`
- `app/lib/kerrGeometry.ts`
- `app/lib/kerrFrameDraggingAccel.ts`

用途：

- 可视化 Kerr 黑洞事件视界、能层等概念。
- 提供 frame dragging 教学参数。
- 不直接作为完整广义相对论测地线积分器。

## 12. 发射系统

### UI

文件：

- `app/components/LaunchControlPanel.tsx`
- `app/components/LaunchTelemetryStrip.tsx`

用户选择发射场、时间倍率、任务参数后进入发射模式。

### 本地发射模拟

文件：

- `app/components/LaunchSceneView.tsx`
- `app/lib/localLaunchPhysics.ts`
- `app/lib/spacecraftAutopilot.ts`

流程：

1. 从当前全局物理系统读取地球位置、速度和月球相对位置。
2. 根据发射场经纬度创建局部发射状态。
3. 每帧用多个 sub-step 推进局部发射物理。
4. 渲染地球、飞船、喷焰粒子和遥测。
5. 达到条件后转换为日心坐标。
6. 写入全局 `SPACECRAFT_BODY_INDEX` 的 `posM` / `velM` / `mass`。
7. 相机锁定飞船。

### WebSocket 预留

文件：`app/lib/useLaunchWebSocket.ts`

`.env.example` 中有：

```env
NEXT_PUBLIC_SIM_WS_URL=ws://127.0.0.1:8765/ws/sim
```

Next rewrite 不支持 WebSocket upgrade，因此 WS 要直接连后端地址。

## 13. 遥测、历史和状态快照

### 遥测

文件：

- `app/components/ScienceTelemetryPanel.tsx`
- `app/lib/telemetryTypes.ts`
- `app/lib/telemetryExport.ts`
- `app/lib/bodyLiveMetrics.ts`
- `app/lib/labelPhysicsMetrics.ts`

显示内容包括：

- 径向速度。
- 密切轨道偏心率变化。
- 1PN 加速度占比。
- FFT 功率谱。
- JSON / CSV 导出。

### 诊断

文件：

- `app/lib/solarSystemDiagnostics.ts`
- `app/components/PhysicsPerformanceHud.tsx`

用于显示积分步数、性能档位、能量 / 角动量漂移、Mercury perihelion 等指标。

### 历史快照

文件：

- `app/lib/physicsHistoryStack.ts`
- `app/lib/physicsSnapshot.ts`
- `app/lib/applyPhysicsSnapshot.ts`
- `app/components/SimulationHistoryBar.tsx`

用途：

- 记录历史状态。
- 时间轴 scrub。
- 导入 / 导出物理快照。
- 将快照重新写回物理缓冲。

## 14. UI 系统

主要 UI 文件：

- `BottomControlBar.tsx`：底部播放、速度、视角、工具入口。
- `UniverseSandboxHud.tsx`：左侧 / 顶层 Universe Sandbox 风格 HUD。
- `BodyDetailSidebar.tsx`：星体详情侧栏。
- `ScienceTelemetryPanel.tsx`：科研图表面板。
- `PhysicsPerformanceHud.tsx`：物理性能 HUD。
- `KerrBlackHolePanel.tsx`：黑洞参数面板。
- `VisualEnhanceToggle.tsx`：视觉增强开关。

相机事件通过 `app/lib/camera-bridge.ts` 解耦，UI 不直接持有 Three.js camera，而是 dispatch 浏览器事件，由 `UniverseScene` 内的 bridge 接收。

## 15. 资源加载

### 纹理加载工具

文件：

- `app/lib/useOptionalTexture.ts`
- `app/lib/planetTextureManifest.ts`
- `app/lib/planetTextureManager.ts`
- `app/lib/planetTextureUserStore.ts`
- `app/context/PlanetTextureAssetsContext.tsx`
- `app/context/PlanetUserTextureContext.tsx`

特点：

- 贴图存在则加载。
- 缺失时 fallback 到颜色材质。
- 支持本地用户贴图管理。

### 下载脚本

`package.json` 中提供：

```bash
npm run fetch-planet-textures
npm run fetch-nasa-earth-hd
npm run fetch-nasa-hd-all
npm run fetch-nasa-hd-extras
npm run fetch-sky-eso
```

脚本位于 `scripts/`。

### Next fallback rewrite

`next.config.mjs` 中：

```js
source: "/textures/:path*",
destination: "http://127.0.0.1:8765/textures/:path*"
```

本地 `public/textures` 没有资源时，会尝试从 `viz_server` 代理获取。

## 16. 环境变量

见 `.env.example`。

常用变量：

- `NEXT_PUBLIC_SIM_WS_URL`：发射 / 仿真后端 WebSocket。
- `NEXT_PUBLIC_SOLAR_FIXED_RK4=1`：启用固定 RK4。
- `NEXT_PUBLIC_SKY_EQUIRECT_URL`：强制指定天空背景贴图。
- `NEXT_PUBLIC_SKY_EQUIRECT_EXPOSURE`：天空贴图曝光。
- `NEXT_PUBLIC_ENABLE_SSAO=1`：启用 SSAO。
- `NEXT_PUBLIC_LENSING_ENABLED=1`：启用引力透镜。
- `NEXT_PUBLIC_LENSING_QUALITY`：透镜质量档位。

### DeepSeek Mission Advisor

Mission Designer 的 DeepSeek 增强顾问通过服务端 route 调用：

- `DEEPSEEK_API_KEY`：DeepSeek API key，仅服务端读取，不要使用 `NEXT_PUBLIC_` 前缀。
- `DEEPSEEK_MODEL`：默认 `deepseek-v4-flash`。
- `DEEPSEEK_API_BASE`：默认 `https://api.deepseek.com`。

客户端只调用 `/api/mission-advisor/deepseek`。无 key、超时、HTTP 错误或非 JSON 输出时，route 返回本地规则顾问 fallback，任务优化器和主 N 体物理状态不受影响。

## 17. 运行命令

安装依赖：

```powershell
cd E:\86137\myai\solar_sim\next-web
npm install
```

开发模式：

```powershell
npm run dev
```

生产构建：

```powershell
npm run build
```

生产启动：

```powershell
npm run start
```

默认地址：

```text
http://127.0.0.1:3001/
```

其他端口：

```powershell
npm run dev:3000
npm run dev:3002
```

清理构建缓存：

```powershell
npm run clean
```

## 18. 调参指南

### 太阳太亮 / 太假

优先看：

- `app/components/SunBody.tsx`
- `app/components/SolarSystemBodies.tsx`
- `app/components/UniversePostProcessing.tsx`
- `app/effects/ThreeJsPostPipeline.tsx`

常调参数：

- `pointLightIntensity`
- corona shader alpha
- halo sprite opacity / scale
- Bloom strength / threshold / radius
- 是否把太阳 mesh 注册为 Bloom target

### 背景太亮 / 太暗

优先看：

- `app/components/GalaxyEnvironmentSphere.tsx`
- `app/components/ScienceBackdrop.tsx`
- `.env.local` 中 `NEXT_PUBLIC_SKY_EQUIRECT_EXPOSURE`

原则：

- 背景应保持深黑，不要盖住星体。
- 银河带只做质感层，不应该整体提亮画面。
- 程序化星点透明度要随背景贴图加载状态降低。

### 有方块像素点

优先看：

- `ScienceBackdrop.tsx`
- `BrightStarCatalog.tsx`
- `ThreeJsPostPipeline.tsx`

处理方向：

- 点精灵片元 shader 必须用 `gl_PointCoord` 做圆形裁切。
- 降低 `gl_PointSize` 上限。
- 降低 film grain。
- 降低 chromatic aberration。
- 避免 Bloom 作用于大量小星点。

### 轨道看不到

优先看：

- `simulationViewSettings.ts`
- `ReferenceOrbitDecor.tsx`
- `OsculatingOrbitEllipse.tsx`
- `hairlineOrbitLine.ts`
- `orbitCinematicTokens.ts`

处理方向：

- 确认 `showOsculatingOrbits` / `showReferenceOrbits` 是否开启。
- 调整 `ORBIT_CINEMATIC_BASE_OPACITY`。
- 调整 core / glow line width。
- 不要把轨道 Bloom 调太高，否则会变成粗白线。

### 行星贴图不加载

优先看：

- `public/textures/planets/`
- `planetTextureManifest.ts`
- `useOptionalTexture.ts`
- 浏览器 Network 是否 404。

处理方向：

- 确认路径以 `/textures/...` 开头。
- 确认文件存在于 `public`。
- 确认图片格式浏览器支持。
- 如果是 NASA 本地资源，建议统一放入 `public/textures/planets/nasa-hd/` 后在 manifest 中映射。

## 19. 已知风险

- README 当前存在编码乱码，建议后续重写或替换。
- 大尺度场景同时使用透明材质、Bloom、log depth、Line2，容易出现排序和过曝问题。
- `SharedArrayBuffer` 依赖 COOP / COEP，某些外部资源若不满足隔离策略可能导致 Worker 路径不可用。
- 太阳系尺度和星体可见尺度是视觉压缩后的，不是严格按真实半径比例显示。
- LightBender、Kerr 黑洞、frame dragging 是教学 / 视觉演示，不应当作为精确 GR 求解器。
- 发射模式当前主要走本地简化模型，WebSocket 后端是预留 / 可选路径。

## 20. 推荐维护顺序

如果继续把项目做成更像 Universe Sandbox，建议按这个顺序推进：

1. 先稳定视觉基线：背景、太阳、轨道、星体材质分开调，避免 Bloom 一锅端。
2. 再整理资源系统：把 NASA 贴图路径、fallback、用户贴图统一到 manifest。
3. 然后做轨道分层：参考轨道、密切轨道、历史尾迹分别有独立开关和样式。
4. 再做性能分层：近景 mesh、远景 sprite、极远点星要有明确 LOD。
5. 最后再加强后期：Bloom、LensFlare、SSAO、LightBender 都应该是可控的增强层，而不是默认掩盖基础画面。


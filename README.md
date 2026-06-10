# Solar Sim

Solar Sim 是一个直接运行在浏览器中的太阳系物理与可视化项目。它使用 Next.js、React Three Fiber、Three.js 和 TypeScript 构建，目标是在 Web 中提供接近 Universe Sandbox 的太阳系观察、星体锁定放大、轨道、发射和深空背景体验，同时保留完整源码、资源和物理管线的可改造能力。

项目现在就是标准 Next.js 工程，入口文件、`package.json`、`app/`、`public/` 都在仓库根目录，不再包在 `next-web/` 子目录里。

## 核心能力

- **太阳系 N 体模拟**：太阳、八大行星、月球、冥王星及扩展天体数据以 J2000/Horizons 风格初始化，支持实时推进、暂停、时间倍率和轨道显示。
- **物理精度分层**：支持 Newton、Economy、Full 1PN 档位；核心加速度计算包含牛顿引力与 EIH 1PN 近似路径。
- **Worker 物理运行时**：跨源隔离可用时使用 Dedicated Worker + SharedArrayBuffer，让物理积分和主线程渲染解耦。
- **Universe Sandbox 风格相机**：支持单击 inspect、双击 lock、持续锁定跟随、连续缩放、地月视角、太阳系广角和发射相机。
- **高清星体外观**：主要星体使用本地高清贴图；近距离锁定时强制 mesh 渲染，避免 sprite 替身导致近景失真。
- **物理自转**：太阳、行星和主要天体根据模拟日推进视觉自转；地球云层使用略不同角速度产生大气流动感。
- **8K 深空背景**：本地构建 `8192x4096` 天球贴图，来源为 NASA SVS Deep Star Maps 2020 与 ESO/S. Brunier Milky Way panorama，运行时不依赖外链。
- **星空内容层**：包含亮星、星座线、星云、星团、脉冲星和银河尺度参考内容，并尽量使用合批几何控制性能成本。
- **本地发射流程**：内置 Artemis 风格发射 UI 和本地物理，支持任务参数、倒计时、起飞、尾迹、目标线、发射相机、中止和 handoff。
- **科学遥测面板**：提供距离、速度、时间倍率、相对论状态、轨道参数、FFT/功率谱和数据导出能力。

## 技术架构

### 前端运行时

- **Next.js App Router**：页面入口在 [`app/page.tsx`](app/page.tsx)，主要 UI 和 Canvas 由 [`app/UniversePage.tsx`](app/UniversePage.tsx) 组织。
- **React Three Fiber**：核心 3D 场景由 [`app/components/UniverseCanvas.tsx`](app/components/UniverseCanvas.tsx) 与 [`app/components/UniverseScene.tsx`](app/components/UniverseScene.tsx) 承载。
- **Three.js / drei**：负责天体 mesh、轨道线、星空背景、发射模型、后处理和 OrbitControls。
- **TypeScript**：物理、数据、UI 状态和渲染路径均使用 TS 类型约束。
- **Tailwind CSS**：HUD、侧栏、底部控制条和发射面板采用 Tailwind 组织样式。

### 物理与数据流

1. 初始天体数据来自 `app/data/*`，包括 J2000 位置速度、质量、显示事实、贴图 manifest 和星表。
2. `useSolarSystem` 创建物理运行时，优先使用 Worker + SharedArrayBuffer，失败时回退主线程。
3. `SolarSystemIntegrator` 每帧推进模拟日和物理状态。
4. `SolarSystemBodies` 根据物理快照渲染星体、轨道、标签、自转和近景 LOD。
5. 相机桥接事件集中在 `app/lib/camera-bridge.ts`，底部工具栏、双击锁定和发射 handoff 都通过事件驱动相机。

### 背景资源管线

背景不是普通屏幕贴图，而是严格 2:1 equirectangular 天球：

- 构建脚本：[`scripts/build-universe-sandbox-sky.py`](scripts/build-universe-sandbox-sky.py)
- 输出：`public/textures/sky/universe-sandbox-sky-8k.jpg`
- 缓存源文件：`.cache/sky-sources`
- 运行时组件：`GalaxyEnvironmentSphere`
- fallback：`nasa_milkyway_2020_4k_balanced.jpg`

脚本会下载并处理：

- NASA SVS Deep Star Maps 2020：`milkyway_2020_8k.exr`、`hiptyc_2020_8k.exr`
- ESO/S. Brunier Milky Way panorama：`eso0932a`

渲染时 shader 只做轻量曝光、对比、冷色调和细星增强，避免实时噪声或程序雾带造成 FPS 下降。

### 发射系统

发射体验默认走本地物理，不依赖外部 WebSocket：

- UI：`LaunchControlPanel`
- 场景：`LaunchSceneView`
- 物理：`localLaunchPhysics`
- 任务配置：`launchMissionProfiles`
- 轨迹和尾迹：`LaunchTrajectoryLine`、`EnginePlume`

流程固定为选择任务参数、倒计时、起飞、发射相机跟随、中止或 handoff。中止会清理本地发射状态并恢复主太阳系视图；handoff 会自动锁定飞船。

## 与 Universe Sandbox 的对比

本项目不是 Universe Sandbox 的完整替代品，也不声称覆盖其气候、碰撞、材料破坏和完整沙盒生态。Universe Sandbox 是成熟的商业级宇宙物理沙盒；Solar Sim 更偏向一个可以部署、学习、审计和二次开发的 Web 科学可视化平台。

| 维度 | Universe Sandbox | Solar Sim |
| --- | --- | --- |
| 定位 | 商业级宇宙物理沙盒，强调创建、破坏、碰撞、气候和材料交互 | Web 可改造太阳系模拟平台，强调源码可控、浏览器运行和可集成 |
| 运行方式 | 桌面应用，依赖 Steam/Epic/itch 等分发渠道 | 浏览器运行，Next.js 项目可本地启动或自行部署 |
| 可扩展性 | 用户主要通过内置工具和 Workshop 扩展内容 | 代码、物理、数据、贴图、UI、发射流程都可直接修改 |
| 物理重点 | 实时重力、气候、碰撞、材料交互等完整沙盒体验 | N 体轨道、1PN 近似、J2000/Horizons 数据、教学/科研可视化 |
| 数据管线 | 封装在产品内 | 星历、星表、贴图、8K 背景构建脚本均在仓库中可审计 |
| Web 集成 | 不是 Web-first | 可嵌入 Web 工作流，适合教学页面、仪表盘、演示系统或二次开发 |
| 观测工具 | 产品内置工具丰富 | 可直接扩展 React 面板、导出遥测、接入自定义 API 或实验数据 |
| 资源控制 | 商业资产和引擎管线不可直接改 | 本地资产、shader、LOD、纹理 fallback、性能策略都可调整 |

Solar Sim 的优势主要在开放性和工程可控性：可以把每个物理公式、贴图来源、相机逻辑、发射状态和 UI 面板拿出来改，也可以作为 Web 产品的一部分集成。Universe Sandbox 的优势仍然是成熟度、完整沙盒工具、碰撞/气候/材料模拟和内容生态。

## 快速开始

```powershell
npm install
npm run dev
```

浏览器打开：

```text
http://127.0.0.1:3001/
```

常用命令：

```powershell
npm run dev        # 127.0.0.1:3001
npm run dev:3000   # 127.0.0.1:3000
npm run dev:3002   # 127.0.0.1:3002
npm run build
npm run start
npm run build-sky  # 重建 8K 天球背景
```

如果 3001 被占用：

```powershell
npm run dev:3002
```

## 资源与体积

仓库包含较多本地视觉资源，包括行星贴图、NASA HD 纹理、飞船模型和 8K 星空背景。当前最大文件为 `public/models/spacecraft/gateway-core.glb`，约 63 MB，GitHub 可以接受但超过 50 MB 推荐阈值。后续如果继续增加大型 GLB、EXR、HDR 或高分辨率贴图，建议启用 Git LFS。

不要把背景构建源文件提交到仓库：

```text
.cache/sky-sources/
```

这些源文件由 `npm run build-sky` 下载缓存，运行时只需要 `public/textures/sky/*.jpg`。

## 验证

## DeepSeek Mission Advisor

Mission Designer can optionally call DeepSeek from a server-side Next.js route:

```powershell
# .env.local
DEEPSEEK_API_KEY=your_deepseek_key
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_API_BASE=https://api.deepseek.com
```

Do not prefix the key with `NEXT_PUBLIC_`. The browser calls `/api/mission-advisor/deepseek`; the route reads the key on the server and falls back to the local rule-based advisor when the key is missing, the request times out, or DeepSeek returns malformed content.

## Mission Fidelity Boundary

Mission Designer is a preliminary engineering-audit tool, not an operational flight-dynamics certification chain.

- Lambert ranking uses the fixed Earth-Venus-Jupiter-Saturn sequence and excludes non-converged Lambert candidates from feasible ranking.
- `spice-table` mode uses the committed NAIF DE442s binary state table at `public/data/spice-ephemeris-v1.bin`; the browser verifies the table size and SHA-256 before the Mission worker uses it.
- Cowell propagation, covariance, and low-thrust library matching run in `missionOptimizer.worker` so the UI does not synchronously block on mission search.
- The current low-thrust library is intentionally marked `status: "seed"` unless a record is generated by a verified offline Hermite-Simpson solve with terminal residuals below 1000 km and 10 m/s. Seed records are displayed for audit context only and do not upgrade a plan to `low-thrust-collocation`.
- Parameter sets outside the precomputed low-thrust grid must be solved offline before they can be treated as finite-thrust candidates.

Regeneration commands:

```powershell
npm run fetch:spice       # downloads kernels to .cache/spice and rebuilds committed compact tables
npm run audit:spice       # validates table checksum and low-thrust status metadata
npm run test:spice-python # compares committed SPICE table samples against SpiceyPy direct queries
```

Do not commit `.cache/spice`, raw NAIF kernels, `.env.local`, dynamic visual runs, or real API keys.

## Workbench And Showcase Boundary

This version positions Solar Sim as a preliminary aerospace engineering workbench plus a high-end WebGL showcase.

- Mission Workbench schema v2 stores multiple scenarios and immutable run history in IndexedDB. Existing localStorage schema v1 projects migrate on first load, and JSON import remains compatible with v1/v2.
- Run Compare accepts 2-4 immutable runs and compares C3, delta-v, propellant, duration, robustness, constraint margin, Cowell residual, and arrival 3-sigma. Failed and unverified finite-thrust records remain audit-only.
- Mission exchange exports include CCSDS OEM 3.0 and OPM 3.0 KVN with absolute TDB epochs, heliocentric ECLIPJ2000 states in km/km/s, initial covariance, and explicit injection/DSM maneuver records.
- Reports preserve solver provenance, SPICE checksum status, ephemeris audit, Cowell/covariance results, constraint margins, rejected candidates, and low-thrust availability.
- Low-thrust seed records remain audit-only. They are not ranked as feasible unless an offline Hermite-Simpson solve is explicitly marked `status: "converged"` and passes residual gates.
- Showcase Tour and Spacecraft Gallery v2 are presentation features. Gallery Draco decoding is local (`public/draco`), with no runtime decoder CDN dependency. They do not enter the N-body integrator and do not change mission dynamics.
- The current visual target is strong browser showcase quality. It is not an offline film renderer with path-traced volumetrics, production compositing, or physically complete spacecraft materials.

Local regression gates:

```bash
npm run visual:acceptance
npm run visual:regression
npm run visual:tour
npm run perf:profile:assert
npm run audit:mission-project
npm run audit:ccsds
npm run audit:gallery-models
npm run audit:sky-atlas
```

CCSDS demo artifacts can be regenerated with `npm run export:demo-ccsds`. The exporter is intended for preliminary data exchange and does not turn the workbench into a certified flight-dynamics chain.

## Sky Atlas Boundary

Sky Atlas Explorer is a curated visual navigation layer. It merges the committed nearby stars, Gaia bright-star cross-match, constellation guide layer, nebulae, clusters, pulsars, and NASA deep-sky manifests into a searchable flight experience.

- It is not a complete SpaceEngine-scale procedural universe or a certified planetarium database.
- Coordinates, distances, and magnitudes are used for visual orientation and education, not professional astrometric reduction.
- Atlas route playback reuses the existing camera direction focus path and does not change the global N-body simulation, Mission Designer, SPICE/Cowell audit, or DeepSeek integration.
- New Atlas resources are staged from existing committed manifests; no additional large textures, HDR files, or GLB models are required for this version.

The demo Atlas route can be regenerated with `npm run export:demo-atlas-route`.

## Production Deployment

Recommended ECS sizing:

- Personal test only: 2 vCPU / 2 GiB with swap. This can run the app, but it is not the target for smooth stable service.
- Stable small deployment: 2 vCPU / 4 GiB.
- Public demo or multiple users: 4 vCPU / 8 GiB plus Nginx/Caddy and CDN.

Production commands:

```bash
npm ci
npm run build
HOSTNAME=0.0.0.0 PORT=3001 npm run start
```

DeepSeek configuration must stay in server environment variables or `.env.local`; never commit a real API key. Large sky and planet assets are currently served from `public/`. For public traffic, put `public/textures` behind CDN or object storage to reduce ECS bandwidth and first-load latency.

2C2G 服务器可以作为测试站或低访问展示站，但不建议作为商业稳定主站。若机器上已有其他网站，建议增加 2 GiB swap，把 `npm run build` 放在本地或 GitHub Actions 完成，服务器只运行 Next.js SSR/API 和静态路由；Nginx/Caddy 应配置 gzip/brotli、长缓存 headers，并优先将 `public/textures`、`public/models` 放到 OSS/CDN。DeepSeek key 只放服务器环境变量。

For local production testing on Windows:

```powershell
npm run start:local
```

本轮已验证：

- `npx tsc --noEmit`
- 浏览器打开 `http://127.0.0.1:3001/`
- 8K 背景资源 HEAD 请求正常
- 广角太阳系、旋转视角、近景锁定和发射场景截图验证
- 控制台无新增 error/warning

## 已知边界

- 不是完整 Universe Sandbox 克隆，不包含成熟的气候、材料、星体破碎和复杂碰撞系统。
- 太阳系物理主要服务于实时交互和可视化，极端长时间积分不应替代专业星历软件。
- 8K 背景提升质感，但会增加显存占用；低端设备可以改用 4K fallback。
- 部分远景星表、星座和星云内容用于视觉参考，不是完整天文学 catalog 浏览器。

## 目录说明

```text
app/
  components/      3D 场景、HUD、发射、星体、轨道和背景组件
  data/            行星、星表、星云、星团、贴图 manifest
  lib/             物理、相机桥、轨道、发射、遥测和资源工具
  workers/         物理与卫星 worker
public/
  models/          飞船模型
  textures/        行星贴图和天空贴图
scripts/           资源下载与 8K 天球构建脚本
docs/              技术文档和中文说明
```

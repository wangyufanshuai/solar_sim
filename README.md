# Orbit Atlas

Orbit Atlas 是一个科学电影感的交互式天文学图谱，覆盖太阳系总览、天体检查、恒星与系外行星、任务发射、相对论实验和 Scene Lab。应用始终使用一个 WebGL2 Canvas，并提供两种交付配置：

- `standalone-full`：完整本地体验，通过 6 个内容包提供高清纹理、模型、目录和科研资料。
- `vercel-lite`：自包含 Web 体验，只携带版本化 Lite 资产，不访问 loopback 或完整内容包 API。

当前本地发布状态为 `governance-verified-product-candidate-science-shadow-retained`。默认科学内核仍为 `legacy-eih-1pn`；新的弱场模型、Variational STM 和 Kerr dense 验证只用于离线研究，不写入实时或 Worker physics。

## 当前证据

- Next `16.2.10`、React `19.2.7`、R3F `9.6.1`、Three `0.170.0`。
- 674/674 基线回归，TypeScript 与 Rust 检查通过。
- 内容包 6 包、805/805 文件、约 539.1 MiB。
- Lite 595 文件、65.9 MiB。
- Canvas-ready JavaScript：standalone 612,827 B，Lite 612,822 B；均通过 600 KiB 门槛，尚未达到 590 KiB 工程目标。
- RTX 4060 五场景达到发布性能门槛；10 轮生命周期测试通过。
- Kerr dense 已完成 1/49 shards、64/3097 rays、512 次执行，部分结果禁止聚合。
- Variational STM 仍是 smoke evidence；30 日校准和十年 blind holdout 尚未完成。
- 弱场候选聚合 RMS 略有改善，但仍存在 15 项逐天体回归，因此科学状态保持 `shadow-retained`。

当前唯一动态证据入口由以下命令生成并校验：

```powershell
npm run build:evidence:current
npm run check:evidence:current
npm run test:atlas:current-evidence-v233
npm run build:dossier:v233
```

checksummed governance dossier 位于 `dist/release/orbit-atlas-v233-governance-dossier.md`。

## 运行

开发模式：

```powershell
cd E:\86137\myai\solar_sim\next-web
npm install
npm run dev
```

默认地址为 `http://127.0.0.1:3001/`。

构建 current/previous 双槽：

```powershell
npm run build:atlas:standalone:current
npm run build:atlas:lite:current
```

启动 standalone：

```powershell
node scripts/start-atlas-standalone.mjs --dist-dir .next-atlas-standalone-current --port 3017
```

构建与 Browser QA 必须串行执行，Playwright 固定单 worker，以适配 16 GB 内存环境。

## 内容包

standalone 默认从 `dist/content-packs` 读取：

- `core`
- `planet-hd`
- `deep-sky`
- `spacecraft`
- `science-fixtures`
- `runtime-codecs`

同源 API 支持白名单、Range、ETag、MIME、不可变缓存和路径逃逸防护：

- `GET /api/atlas/content-packs`
- `GET /api/atlas/content-packs/:pack/manifest`
- `GET /api/atlas/content-packs/:pack/files/:path`

内容包不会复制进 `.next`、Vercel source upload 或 Lite 资产。

## 科学边界

- 实时太阳系继续使用冻结的 Newton/EIH 1PN、RK4/DP 和既有 Worker 协议。
- `ScientificPromotionDecisionV7` 是唯一晋级决策类型，当前结果为 `shadow-retained`。
- 603 个根 `data-atlas-*` 属性是历史 Browser 兼容合同，不承载易变科研进度。
- 当前科研进度发布在非根 evidence surface，并由 checksummed manifest 派生。
- Kerr 模块研究 null geodesic、临界曲线、红移、解析薄盘和偏振传输；它不是 GRMHD、数值相对论或黑洞并合模拟器。
- Web 产品通过不代表候选科学模型获得晋级资格。

## 发布边界

本地验证不等于公开发布。以下操作需要单独授权或外部条件：

- Vercel preview、`solar.wangyufan.xyz` 域名迁移和 DNS rollback。
- Azure Artifact Signing。
- Windows 10/11 外部设备上的 MSI/NSIS 安装、启动、卸载与重装测试。
- Git staging、commit、签名 tag 和发布分支。

当前不执行 reset、revert、clean、stage、commit、部署或签名。

## 文档

- 当前架构与历史轨道：`docs/TECHNICAL_OVERVIEW.md`
- v233 治理 dossier：`dist/release/orbit-atlas-v233-governance-dossier.md`
- v232 本地发布 dossier：`dist/release/orbit-atlas-v232-final-local-release-dossier.md`
- 外部安装测试模板：`docs/EXTERNAL_WINDOWS_INSTALL_QA.md`

冻结边界包括 scientific gate、旧 fixtures、实时/Worker physics、RK4/DP、legacy EIH 1PN、V9 sky、v75、v97 和 v99。

# Orbit Atlas

Orbit Atlas 是一个科学电影感的交互式天文学图谱，覆盖太阳系总览、天体检查、恒星与系外行星、任务发射、相对论实验和 Scene Lab。应用始终使用一个 WebGL2 Canvas，并提供两种交付配置：

- `standalone-full`：完整本地体验，通过 6 个内容包提供高清纹理、模型、目录和科研资料。
- `vercel-lite`：自包含 Web 体验，只携带版本化 Lite 资产，不访问 loopback 或完整内容包 API。

当前本地发布状态为 `governance-verified-product-candidate-science-failed-shadow-retained`。默认科学内核仍为 `legacy-eih-1pn`；新的弱场模型、Variational STM 和 Kerr dense 验证只用于离线研究，不写入实时或 Worker physics。V8 dense campaign 的失败作为不可变负证据保留，产品优化与科学晋级已显式解耦。

## 当前证据

- Next `16.2.10`、React `19.2.7`、R3F `9.6.1`、Three `0.170.0`。
- v262 的回归、双构建、bundle、内容包、浏览器、48-frame 视觉、30-cycle soak 与 RTX 数值只以生成的 `dist/release/orbit-atlas-v262-local-candidate-evidence.json` 为准；README 不维护第二份动态数字。
- dedicated v262 standalone、Lite boundary、移动 A/B、视觉、正式 30-cycle soak 与 RTX 门禁已完成；纠正后的 fresh 22 项在最终 standalone build 上得到 `20 passed / 1 skipped / 1 failed`，唯一失败是 mobile 测试误点隐藏的 desktop-only 模式按钮。测试侧 viewport 路由已修正但按“不自动重试”规则尚未复跑，因此本地候选保持 `blocked-fresh-matrix-not-reclosed`，不能视为最终发布通过。
- Kerr dense V8 在 shard 3 失败：3/49 个 shard 被接受，192/3097 rays 与 1,536 次执行属于完整覆盖；失败 shard 另尝试 64 rays/512 次执行，其中 4 次 Carter–Mino execution 触发 180 秒 watchdog。失败 shard 不计入完成覆盖，禁止部分聚合和自动重试。
- Variational STM 仍是 smoke evidence；30 日校准和十年 blind holdout 尚未完成。
- 弱场 fitted-blind 证据未证明 aggregate improvement，15 项历史逐天体回归中 10 项已确认；科学状态保持 `shadow-retained`。

证据优先级为：终态 aggregate/STM（若存在）或 terminal campaign progress + failed-shard negative evidence → V13 research campaign → current evidence → governance dossier → README/Technical Overview。旧 V6/V7 只作不可变历史负证据。

当前唯一动态证据入口由以下命令生成并校验：

```powershell
npm run build:evidence:current
npm run check:evidence:current
npm run test:atlas:current-evidence-v233
npm run build:dossier:v233
```

checksummed governance dossier 位于 `dist/release/orbit-atlas-v233-governance-dossier.md`；当前 manifest SHA-256 为 `9b897052d5a03984e75b78f177fe131e6a9e04baecc59d24d6b03655065c8ce8`。

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

- v262 只交付本地 standalone/Lite 候选；本轮未执行 Vercel CLI、Preview、production、`solar.wangyufan.xyz` 域名迁移或 DNS rollback。
- Azure Artifact Signing。
- Windows 10/11 外部设备上的 MSI/NSIS 安装、启动、卸载与重装测试。
- Git staging、commit、签名 tag 和发布分支。

当前不执行 reset、revert、clean、Git stage、commit、Vercel、production deploy、DNS 迁移或签名。

## 文档

- 当前架构与历史轨道：`docs/TECHNICAL_OVERVIEW.md`
- v233 治理 dossier：`dist/release/orbit-atlas-v233-governance-dossier.md`
- v232 本地发布 dossier：`dist/release/orbit-atlas-v232-final-local-release-dossier.md`
- v262 动态产品证据：`dist/release/orbit-atlas-v262-local-candidate-evidence.json`
- v262 本地 A/B dossier：`dist/release/orbit-atlas-v262-local-ab-dossier.md`
- 外部安装测试模板：`docs/EXTERNAL_WINDOWS_INSTALL_QA.md`

冻结边界包括 scientific gate、旧 fixtures、实时/Worker physics、RK4/DP、legacy EIH 1PN、V9 sky、v75、v97 和 v99。

## v255 starfield catalog expansion (historical fallback)

The active deep-space presentation layer is `v255-catalog-expansion`. It loads the generated `gaia-dr3-nearby-46000-v255` asset only after Orbit Atlas, Workbench/catalog or renderable deep-space intent, and retains the historical bright-5000 fallback. The renderer keeps one InstancedMesh and selects bounded candidates through a deterministic 48x24 sky-sector index. Active budgets are mobile 1,000, balanced 4,000 and dense 8,000; selected-body closeups are capped at 1,200.

The formal IAU layer remains 88 constellations. v255 adds 32 named asterism guide groups explicitly marked non-official, plus composed curated layers of 96 star clusters and 128 nebula markers. These are navigation/presentation objects only and never enter SolarSystemIntegrator, Worker physics, EIH 1PN or a scientific gate. Active counts, budgets and mutation boundaries come from `dist/science/catalog-expansion-v255.json`; the Gaia source/output hashes and filter provenance are in `dist/science/gaia-dr3-nearby-46000-v255.manifest.json`.

## v256-v262 local research candidate

The v256-v262 candidate adds compact runtime state, the V7-derived HEALPix streaming archive, an offline observing planner, a frozen Gaia science subset and uncertainty worker, five explicit scale bands, OpenNGC/local-only Cosmicflows layers, and the optional Science Cinematic visual profile. Legacy V9 remains the default and the failed V8 science state remains unchanged.

All mutable counts, hashes, build IDs, bundle measurements, content-pack results, browser/visual QA, lifecycle soak and hardware FPS/P95 measurements are generated in `dist/release/orbit-atlas-v262-local-candidate-evidence.json`; README does not maintain a second copy. The corresponding human-readable local A/B summary is `dist/release/orbit-atlas-v262-local-ab-dossier.md`. `dist/release/orbit-atlas-current-product-evidence-v262.json` points to the product evidence while leaving `dist/release/orbit-atlas-current-evidence-v233.json` as the unchanged science authority.

GaiaUnlimited completeness remains unavailable with preserved negative evidence, Cosmicflows public bundling remains blocked pending redistribution permission, and no v262 candidate is promoted or deployed automatically.

The combined fresh browser matrix is also not closed: its first two attempts mixed dedicated Lite/soak/visual tests into a standalone server and ended without a reporter summary. The corrected single-worker 22-test run against the final standalone build returned 20 passed, one skipped and one failed; the only failure was a mobile test selecting a hidden desktop-only mode control. The test-side mobile route is now corrected but has not been rerun under the no-automatic-retry policy. This negative evidence is retained in the generated v262 manifest and blocks local-candidate promotion.

## v271-v275 local shadow candidate

The v271-v275 work is tracked only through the generated capability pointer at `dist/release/orbit-atlas-current-local-shadow-candidate-v275.json` and its referenced phase manifests. It adds the resumable Gaia research/10m pipelines, five-band camera arbitration, Science Cinematic V3, lazy deep-space presentation, bounded API policy, R3F/GPU observability and owner/byte-aware resource lifecycle accounting. README intentionally does not duplicate mutable counts, hashes or gate results.

The formal product pointer remains v263. Legacy V9 remains the formal, Lite and ordinary standalone default; the v274 profile is not promoted while its browser/performance gates are unqualified. The protected `legacy-eih-1pn` and Kerr science implementation remain unchanged.

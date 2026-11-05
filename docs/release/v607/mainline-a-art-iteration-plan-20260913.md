# Mainline A 美术连续迭代记录与阶段批次计划

本计划把后续工作恢复为可见的美术增量。每轮必须留下一个用户能看到的变化、一张当前构建截图或浏览器记录，以及一项定向回归；只有阶段冻结轮才做完整矩阵。EIH、Newton N-body、2PN/Lense–Thirring、Kerr 仍是只读边界。

从 R47 起按用户修改后的 active goal 执行：每个开发轮至少 500 行有效代码变更，按完整功能批次推进。空白/格式化、生成数据、收据、截图、文档、机械复制、仅更新数量或 marker 的断言不计数；不足时合并同阶段工作，不递增微小任务轮次。每轮记录有基线的新增/修改/删除量、有效文件、测试、至少一组浏览器/HTTP/构建证据及未关闭门禁。下方最初的 12 轮表保留为历史规划，不再表示当前剩余轮数。

R48 后当前展示集为 20 颗恒星、12 个重点星座、12 张星云。Beta 24/12/24 目标保持不变。接下来按批次完成：剩余 4 颗恒星来源与组件身份 → 两批各 6 张星云来源、权利、接入与视觉 → 多设备性能/资源生命周期 → root app 与 next-web 对齐和最终发布包。外部资料未解决不能用轮次数或静态测试替代验收。

## 轮次

| 轮次 | 可见交付 | 完成标准 |
|---|---|---|
| 01 | 星图观测板层级：径向暗场、方向参考线、连线柔光 | 四个重点星座卡片层级统一，选中星仍清晰 |
| 02 | 恒星光学语言：按颜色温度统一核心、光晕和亮度节奏 | 六颗现有 hero star 的颜色与尺寸不互相抢焦 |
| 03 | 星云焦点语言：12 张观测图的边缘、标题和波段标识统一 | 图像、信用、二维边界在 close-up 中同层显示 |
| 04 | 银河背景层：尘埃带、暗带和星云 marker 的明度分离 | stellar/galactic 两档不糊成一片 |
| 05 | 星座连接叙事：连线、边界、星点选中态的状态动画 | Ori/UMa/Cas/Sco 的观察顺序可读 |
| 06 | 关系导航镜头：恒星、星云、脉冲星的镜头过渡节奏 | 五条路线共享同一镜头语法 |
| 07 | 移动构图：390×844 下的星图、passport、信用信息层 | 无横向溢出，主图和标题保持优先级 |
| 08 | 观测卡片细节：来源、波段、尺度边界和不确定性排版 | 事实与 artistic inference 视觉区分明确 |
| 09 | 24 颗 hero star 扩展第一批（6→12） | 新增六颗拥有统一肖像与来源状态 |
| 10 | 重点星座扩展第一批（4→8） | 新增四个星座具备边界、连线和知识卡 |
| 11 | 星云扩展第一批（12→18） | 新增六张图通过版权、尺寸和运行时释放检查 |
| 12 | Beta 美术冻结（24／12／24） | 统一构建、截图、移动验收和发布包完成 |

## 当前轮次记录

### Round 01 — 星图观测板层级

已改 `MainlineAConstellationChartV607`：增加径向深色观测场、南北/东西参考线和低强度连线柔光层；目录坐标、星等、边界数据和物理内核未改。定向 ESLint 通过，星图与边界测试 8/8 通过。

下一轮继续恒星光学语言，不提前扩展对象数量。

### Round 02 — 恒星核心与光晕层级

已改 `BrightStarCatalog` 的 fragment shader：宽光晕从 `0.08` 到 `0.22` 仅随最大 curated point 的屏幕尺寸增长，微弱恒星保持克制。当前开发预览在 1280×720 下 canvas=1、无横向溢出、无控制台错误；[round-02 收据](./mainline-a-art-round-02-20260913.json) 与截图已保存。定向 ESLint 通过，资源 teardown 测试 2/2 通过。

下一轮处理 12 张星云观测图的焦点边缘和标题层，不改变资产来源或三维语义。

### Round 03 — 星云焦点语言

已改 `MainlineANebulaScenePortraitV607`：观测图卡片增加完整边框、左侧金色焦点线、深色渐变展板、标题徽标与波段元数据条；保留官方构图、原图亮度、信用与二维边界说明。应用内浏览器已通过对象浏览器搜索 M42 并打开 `猎户座大星云` 档案，确认展板、OIII/H-alpha/NII、官方构图保留、来源与 CC BY 4.0 同屏可见；截图见 [round-03 展板证据](./screenshots/mainline-a-round-03-nebula-plate-20260913.png)。定向 ESLint 通过，星云场景与纹理测试 9/9 通过；本轮仍属于 dev-preview 视觉证据，不替代 h08 发布构建验收。

下一轮处理银河背景的尘埃带、暗带与远端星云 marker 明度分离。

### Round 04 — 银河背景与远端星云 marker 明度分离

已改 `NebulaMarkers` 的点精灵片元层：根据最终屏幕点尺寸对远端小 marker 做 0.76–1.00 的透明度分层，保留 10px 最小可见尺寸、近端大星云和质量档倍率；目录坐标、距离、可见性与资源释放逻辑未改。应用内浏览器在银河系层确认 canvas=1、1280px 宽度、控制台 error=0，并保存当前预览截图。定向 ESLint 与资源 teardown 测试通过；`atlasArtPolish.horizons.test.ts` 报告既有 `constellation-layer-lock` 回归（来自当前脏工作树的星座表面改动，本轮未修改），不将其误记为本轮通过。当前证据仍是 dev-preview visual，不替代 release performance。

下一轮处理星座连线、边界与选中态的状态动画。

### Round 05 — 星座连接叙事状态动画

已改 `ConstellationLines`：连线、边界、asterism 和节点层加入不同相位的低幅呼吸动画，并把当前 pulse 写入运行时 marker；动画仅改变材质透明度，不改变星座坐标、边界顶点、目录数量或物理层。应用内浏览器在银河系层确认 `boundaryVisible=true`、图谱段数 401、边界段数 111、canvas=1、console error=0；700ms 前后 pulse 从 0.99247 变化到 0.99628，证明运行时状态在变化。定向 ESLint、边界与 teardown 测试通过。下一轮处理关系导航镜头节奏。

### Round 06 — 关系导航镜头节奏

已改 `AtlasSceneFocusCameraBridge`：为 body、direction、earthMoon、origin 四类镜头过渡增加统一的 DOM 进度/缓动 marker（`state`、`kind`、`progress`、`ease`），用于把实际渲染相机状态与关系导航证据绑定；现有 smootherstep 曲线、camera lease、物理目标解算和轨迹数据未改。应用内浏览器从银河系层点击 Castor 关系入口，采样到 `transition → origin`、progress `0.523`、ease `0.543`，约 620ms 后回到 `idle`；console error=0。定向相机命令与运行时测试通过。本轮关闭的是镜头状态可见性与证据缺口，不宣称性能验收。

下一轮处理 390×844 移动构图。

### Round 07 — 移动构图与来源信用安全

已在 `390×844` 应用内预览实测 M42 档案：护照卡保持在安全区域内（x=8..382，y=14..748），主画布为单一 `390×844` canvas，文档与后代节点均无横向溢出；星云图卡宽 299px，官方图像与标题优先显示，向下滚动后来源、CC BY 4.0、观测路线、关联入口和证据按钮完整可见。对 `MainlineANebulaPortraitV607` 的图卡与元数据行补充 `min-w-0` / 长标识截断保护，避免窄屏来源标签改变布局；图像、官方构图、署名和增益语义不变。Lite 预览的旧 core 纹理 HTTP 404 仍记录为已知边界，未形成 page/console error，也不转化为生产结论。[round-07 收据](./mainline-a-art-round-07-20260913.json) 与截图已保存。

定向 ESLint 通过，星云场景与纹理测试 5/5 通过。下一轮处理观测卡片细节：来源、波段、尺度边界和不确定性排版。

### Round 08 — 观测卡片尺度与不确定性层级

已改 `CelestialObjectPassportPanel` 的星云图鉴卡：在肖像前增加紧凑的角径、距离和“数据：目录派生”指标条，并单独标记“不确定性：未提供误差；此值用于目录定位，不是图像标尺”。颜色沿用天体图鉴的琥珀层级，与恒星事实/艺术层分开；图像、来源、波段、版权和二维边界语义未改。应用内浏览器在 M42 档案确认指标条可见，1280×720 canvas=1、文档无横向溢出、console error=0；截图见 [round-08 观测卡片证据](./screenshots/mainline-a-round-08-observation-card-detail-20260913.png)。定向 ESLint 通过，星云元数据、候选资产与纹理测试 26/26 通过。[round-08 收据](./mainline-a-art-round-08-20260913.json)

下一轮处理 6→12 颗 hero star 的肖像扩展与来源状态。

### Round 09 — Hero star 肖像指标层

已改 `MainlineAStellarPortraitV607`：为 hero 肖像增加明确的展示层标记，并将色温、光度、半径从 SVG 内部抽成独立指标条；窄屏标题增加 `min-w-0` 与截断保护。天狼星 A 浏览器验收显示指标条完整可见，1280×720 canvas=1、文档无横向溢出、console error=0；截图见 [round-09 hero 指标证据](./screenshots/mainline-a-round-09-hero-star-metrics-20260913.png)。这轮建立了扩展到 12/24 颗时可复用的肖像语法，没有把参数化光球升级为观测表面。[round-09 收据](./mainline-a-art-round-09-20260913.json)

定向 ESLint 通过，恒星证据与元数据测试 27/27 通过。下一轮进入 4→8 个重点星座的边界、连线和知识卡扩展。

### Round 10 — Hero star roster 6→12（增量当前集）

保留历史 `MAINLINE_A1_STARS` 六颗与旧验收快照，同时新增 `MAINLINE_A_CURRENT_STARS` 十二颗：Canopus、Arcturus、Vega、Capella A、Procyon A、Aldebaran。新增条目补齐 SIMBAD 视差参考、Gaia 身份未确认边界、参数化肖像叙事和 Capella/Procyon 目录别名；静态渲染器改为动态 12 格 contact sheet（1160×1540），并已检查新增六格的色温、尺度和纹理层级。5 个定向测试文件共 45/45 通过，相关 ESLint 通过。[round-10 收据](./mainline-a-art-round-10-20260913.json) 与 [12 格静态肖像](./visuals/stellar-portraits-v607.png) 已保存。

本轮证据是静态 roster/source/visual，尚不替代新增六颗的浏览器抽验。下一轮处理 4→8 个重点星座的边界、连线和知识卡扩展。

### Round 11 — 重点星座 roster 4→8

已保留 A1 四星座快照，并将天鹅座、双子座、狮子座、南十字座接入 current roster。新增条目使用封存的 IAU J2000 边界环、双语名称、季节提示、代表恒星和来源信用；registry 当前对象数为 32。应用内浏览器抽验天鹅座档案：知识卡、三条来源、边界语义均可见，canvas=1、文档无横向溢出、console error=0。截图见 [round-11 星座证据](./screenshots/mainline-a-round-11-constellation-current-20260913.png)，收据见 [round-11 收据](./mainline-a-art-round-11-20260913.json)。

定向边界、图形和元数据测试 34/34 通过。下一轮处理星云 12→18 的来源、版权和运行时释放检查。

### Round 12 — 星云 12→18 权利接入预检

已从现有封存候选库登记 6 个 Beta 扩展对象：IC 1805、IC 1848、NGC 2024、NGC 281、IC 443、NGC 2070。当前候选的授权字段仍是 NASA 使用指南候选状态，不能直接进入运行时；本轮建立了对象、来源 manifest 和逐图清权要求的可审计队列，明确必须补齐许可证、完整署名、本地字节、尺寸和 SHA256 后才能加入 `MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL`。运行时仍保持 12 张已清权星云，未把候选误计为已完成。[round-12 收据](./mainline-a-art-round-12-20260913.json)

下一阶段先完成这 6 张候选的逐图权利确认，再进行纹理物化、浏览器展示和资源释放验收；Beta 冻结轮暂不提前关闭。

## Round 13 — Current constellation chart bridge (2026-09-13)
- Extended MainlineAConstellationChartV607 to resolve additive Cyg/Gem/Leo/Cru IAU boundary rings with historical A1 fallback.
- Added four current-roster illustrative figure routes and bilingual labels; chart copy keeps the route/boundary distinction explicit.
- Validation: 26/26 targeted Vitest, ESLint passed, release packet refreshed (175 files, SHA256 07b42a940e215b439ab50c2a9d129aebd83fb1728d024a4779988afbdaebfd69).
- Gate: browser screenshot for each added figure and Beta 12-constellation coverage remain open.

## Round 14 — Constellation chart information hierarchy (2026-09-13)
- Added an anchor-count cue and responsive truncation guard to the interactive constellation chart header.
- Kept IAU boundary toggle, J2000 marker, and illustrative-route disclaimer unchanged and visible.
- Validation: ESLint passed; targeted Vitest 26/26.
- Receipt: docs/release/v607/mainline-a-art-round-14-20260913.json; browser evidence for all additive charts remains pending.

## Round 15 — Constellation line finish and boundary cue (2026-09-13)
- Rounded chart strokes and added explicit boundary-state copy so illustrative routes and IAU rings remain visually distinct.
- Static validation: ESLint passed; targeted Vitest 26/26.
- Browser route loaded, but default object-browser path did not expose the passport chart; no screenshot claimed.
- Next gate: expose/select additive constellation passports in browser, then capture desktop/mobile evidence.

## Round 16 — Beta constellation boundary expansion (2026-09-13)
- Expanded current constellation coverage from 8 to 12: added Lyr, Aql, Tau and Sgr.
- Added IAU Delporte J2000 boundary rings from the official archive endpoint and connected each to the shared chart renderer.
- Validation: 34/34 targeted Vitest, ESLint passed.
- Browser screenshots for the four new passports remain the next acceptance gate; Beta star and nebula targets remain open.

## Round 17 — Constellation label discoverability probe (2026-09-13)
- Raised featured-label priority for all 12 current Mainline A constellations in the 3D object-browser layer.
- Browser observed 6 constellation labels including Cyg, one canvas, and no horizontal overflow.
- Label discovery passed, but label-to-passport interaction did not open the chart; this remains the next route-fix task.
- Validation: 32/32 targeted Vitest; receipt records partial-browser status.

## Round 18 — Constellation object-browser index cue (2026-09-13)
- Marked the constellation list in UniverseSandboxHud with a Mainline A discovery data hook for browser audits and visual instrumentation.
- Validation: ESLint passed; celestial catalog and metadata tests 32/32.
- Next gate: open the HUD constellation index in browser and prove a click reaches the passport chart.

## Round 19 — Constellation index to passport browser closure (2026-09-13)
- Browser route now verified: object browser → 星座 88 → 天鹅座 → passport → chart.
- Observed passport=1, chart=1, boundary toggle=1, canvas=1, no horizontal overflow.
- Screenshot saved with SHA256 BA039A5EC4361205DA762AD9C42A6CC65382704074E71F2F2D81AF398159AD4C.
- Next gate: repeat the route on mobile and sample the remaining current constellations.

## Round 20 — Constellation index route regression (2026-09-13)
- Browser revalidated object browser → 星座 88 → 金牛座 → passport → chart.
- Passport and chart both rendered; no horizontal overflow.
- Screenshot saved with SHA256 03414D3A3A7A2F6686983B186A0CD14B1B97AED64AE52DFED3EE143C1BA22484.
- Current browser bridge has no viewport override, so mobile matrix remains open.

## Round 21 — Nebula rights and source-state badge (2026-09-13)
- Added a persistent CC BY 4.0 / official-original badge to cleared nebula portraits.
- Header now wraps so the rights state remains readable on narrow layouts.
- Image bytes and gain semantics are unchanged; targeted tests 4/4 and ESLint passed.
- Candidate NASA assets remain quarantined pending item-level rights evidence.

## Round 22 — Beta hero roster evidence boundary (2026-09-13)
- Added MAINLINE_A_BETA_HERO_ROSTER to track all 24 source heroes explicitly.
- Coverage is 24 source / 12 runtime-cleared / 12 evidence-pending; pending entries remain outside runtime admission.
- Validation: 1/1 targeted Vitest and ESLint passed.
- Next gate: create A4 evidence rows and browser portraits for the pending 12 before promotion.

## Round 23 — Beta hero evidence intake ledger (2026-09-13)
- Added source-addressable SIMBAD intake entries for the 12 pending heroes.
- Every entry is explicitly waiting-snapshot-ingest and measurementAdmission: not-admitted.
- Validation: 2/2 targeted Vitest and ESLint passed.
- Next gate: fetch and seal per-star source snapshots before promoting any pending portrait.

## Round 24 — Twelve-star contact sheet binding (2026-09-13)
- Added a regression contract binding the static portrait contact sheet to the current 12-star order, 1160×1540 dimensions and render receipt.
- Validation: 1/1 Vitest and ESLint passed.
- This strengthens static visual evidence but does not replace browser, performance or device viewport acceptance.

## Round 25 — Mainline A constellation index identity markers (2026-09-13)
- Exported the canonical 12-code current constellation list.
- Added data-mainline-a-current=true to matching entries in the 88-item object browser index.
- Validation: 32/32 targeted Vitest and ESLint passed.
- The marker is an identity aid only; remaining Beta art and evidence gates stay open.

## Round 26 — Beta hero coverage badge (2026-09-13)
- Added a read-only coverage badge to the 24-entry stellar roster panel.
- The panel now states 12 runtime-cleared and 12 evidence-pending heroes at the point of use.
- Validation: 4/4 targeted Vitest and ESLint passed.
- Pending heroes remain quarantined until A4 source snapshots are sealed.

## Round 27 — Beta hero per-object evidence state markers (2026-09-13)
- Added a canonical `data-mainline-a-hero-status` marker to each of the 24 stellar roster buttons.
- Browser audits can now verify the exact object-level boundary (`runtime-cleared` or `evidence-pending`) instead of relying only on the aggregate panel badge.
- Validation: targeted Vitest 4/4 and ESLint passed; release packet regenerated.
- Pending heroes remain quarantined until fresh A4 source snapshots and rights evidence are sealed.

## Round 28 — Beta hero visible evidence-state labels (2026-09-13)
- Added color-coded `runtime cleared` / `evidence pending` labels to each hero card so the admission boundary is readable during visual review.
- Kept the status data attribute and aggregate 12/24 coverage badge as the audit contract.
- Validation: targeted Vitest 4/4 and ESLint passed; release packet regenerated.
- Labels do not imply fresh measurements; pending heroes remain outside runtime admission.

## Round 29 — Beta hero admission-state legend (2026-09-13)
- Added a compact color legend beside the aggregate coverage cue to make the card-state palette self-explanatory.
- The legend, per-card labels, and data attributes now expose one consistent admission vocabulary for visual and browser audits.
- Validation: targeted Vitest 4/4 and ESLint passed; release packet regenerated.
- This is presentation metadata only; the evidence gate remains fail-closed.

## Round 30 — Beta hero admission-state browser proof (2026-09-13)
- Browser verified the open Named stellar roster renders all 24 cards, 12 `runtime-cleared`, 12 `evidence-pending`, and one legend.
- Screenshot: `mainline-a-round-30-beta-hero-status-20260913.png` (102169 bytes, SHA256 `7F90D8B61F5A82A99C420BCE6DCA6DC13A9B06BB596ED012FD6DDEA8437F62E1`).
- Validation: targeted Vitest 4/4 and ESLint passed; release packet regenerated.
- The bridge supplied default desktop only; mobile viewport and production/performance acceptance remain open.

## Round 31 — Beta hero admission-state regression contract (2026-09-13)
- Added a source-level regression assertion for the canonical roster import, per-card status markers, visible labels, and legend hook.
- Validation: targeted Vitest 5/5 and ESLint passed.
- Browser evidence from Round 30 remains the current desktop proof; mobile, performance, and fresh pending-star snapshots remain open.

## Round 32 — Beta hero roster narrow-layout guard (2026-09-13)
- Added `min-w-0` and `overflow-x-hidden` guards to the roster scroll surface and two-column card grid.
- Added a dedicated scroll-surface data hook for future viewport probes.
- Validation: targeted Vitest 5/5 and ESLint passed.
- Mobile viewport proof remains open because the browser bridge does not expose a viewport override.

## Round 33 — Beta hero mobile viewport browser proof (2026-09-13)
- Playwright/Chrome verified the roster at 390×844: 24 cards, 12 runtime-cleared, 12 evidence-pending, one legend.
- Scroll surface measured `scrollWidth=340` and `clientWidth=340`, so no horizontal overflow occurred.
- Screenshot: `mainline-a-round-33-beta-hero-mobile-20260913.png` (177161 bytes, SHA256 `630DA51D1C781B3A9871E682FC481D1C9B3877F33852DC2EB595424E3F338589`).
- This closes one mobile viewport acceptance point; broader device matrix and performance evidence remain open.

## Round 34 — Core content-pack HTTP asset probe (2026-09-13)
- With `ATLAS_LOCAL_ASSET_PACK_ROOT=dist/content-packs`, Playwright request probes returned HTTP 200 for the planet manifest, 4K sky base, Earth texture, and Gaia catalog.
- This identifies the previous 404s as missing local-shadow pack configuration rather than missing art bytes.
- Validation: 4/4 representative requests returned 200 with stable ETags.
- The explicit root requirement remains part of local runtime setup; public deployment and performance gates remain open.

## Round 35 — Reproducible local-shadow art runtime entrypoint (2026-09-13)
- Added `npm run dev:atlas:local-shadow`, which injects `dist/content-packs` and launches the webpack dev server on port 3018.
- Added Windows shell compatibility and verified startup plus two representative core asset requests at HTTP 200.
- Validation: `node --check` passed; Next reached ready; ETags matched the content-pack manifest.
- Public deployment, device matrix, and performance acceptance remain separate gates.

## Round 36 — Local-shadow browser asset performance baseline (2026-09-13)
- Playwright cold-loaded the local-shadow route at 1280×720 and observed 29 resources, 14 content-pack assets, 0 failed requests.
- Content-pack transfer was 25,566,471 bytes and decoded size 25,562,271 bytes; maximum single asset duration was 5,071.215 ms.
- This closes the resource-delivery health probe while leaving sustained FPS, GPU/memory lifecycle, and production performance gates open.

## Round 37 — Corrected local-shadow browser asset baseline (2026-09-13)
- Re-ran Round 36 with the process-level `local-shadow` identity captured; the original Round 36 receipt is marked superseded rather than silently rewritten.
- Authoritative result: 31 resources, 14 content-pack assets, 0 failures, 25,566,471 transferred bytes, and 5,468.8 ms maximum asset duration.
- This remains a cold-load baseline; sustained FPS, GPU/memory lifecycle, and public CDN qualification remain open.

## Round 38 — Browser resource baseline regression contract (2026-09-13)
- Added `mainlineA6BrowserResourceBaselineV607.test.ts` to pin the corrected Round 37 profile identity, 14-asset count, zero failures, and transfer byte count.
- Validation: targeted Vitest and ESLint will be run before packet refresh.
- The contract guards evidence identity; it does not convert the cold-load baseline into a final performance pass.

## Round 39 — Lite delivery sky quality split (2026-09-13)
- Added a delivery-profile branch that keeps canonical desktop sky identity unchanged but selects 4K/2K layers for `vercel-lite` and prevents a desktop 8K upgrade.
- Browser baseline at 1280×720: 18 resources, 5 assets, 0 failures, 5,093,751 transferred bytes; the requested sky base was `orbit-atlas-v9-base-4k.jpg`.
- Compared with the 25,566,471-byte local-shadow baseline, Lite transfer fell by 20,472,720 bytes (80.09%).
- Validation: targeted Vitest 1/1 and ESLint passed; full sustained performance gates remain open.

## Round 40 — Lite mobile sky and roster browser proof (2026-09-13)
- At 390×844 under `vercel-lite`, browser verified 24 hero status cards, no horizontal overflow (`340=340`), and 0 failed requests.
- Sky resources were 4K base, 2K stars, and 2K dust; the desktop 8K base was not requested.
- This closes the Lite/mobile combination probe while leaving broader device coverage and sustained performance gates open.

## Round 41 — Local-shadow reload lifecycle probe (2026-09-13)
- Repeated the local-shadow route three times and captured resource counts and JS heap samples.
- The first load exposed 31 resources/14 content-pack assets; subsequent loads exposed 12 resources/1 content-pack asset, with one dev RSC request failure.
- This is recorded as partial lifecycle evidence only; production build/restart probing is the next gate.

## Round 42 — Production Lite reload lifecycle proof (2026-09-13)
- Built `.next-atlas-lite-current` successfully and served it with the standalone production server under `vercel-lite`.
- At 390×844, three loads completed with 0 failed requests; the first requested one 4K sky base and never requested the 8K base.
- Resource counts were 30 → 17 → 17 under cache reuse; heap samples were 134.6 → 164.4 → 169.2 MB.
- This closes the production Lite reload probe while leaving longer soak, GPU/FPS, and full device-matrix gates open.

## Round 43 — Beta metadata literal-type build repair (2026-09-13)
- Added explicit map return types to the Beta hero roster, evidence intake, and additive constellation metadata builders.
- This removed three production-build TypeScript literal widening errors while preserving the declared status and object-kind contracts.
- Validation: `build:atlas:lite:current` completed successfully with zero type errors.
- Compilation is closed for this slice; evidence admission and runtime performance remain open.

## Round 44 — Atlas resource lifecycle deterministic gate (2026-09-13)
- Revalidated the shared acquire/release and replay lifecycle contracts after the Lite sky quality split.
- Validation: 3 lifecycle test files, 11/11 tests passed.
- Long-running browser GPU/heap soak remains a separate acceptance gate.

## Round 45 — Browser performance lock regression (2026-09-13)
- Revalidated browser resource, presentation runtime, and acceptance-cost performance locks after the Lite sky quality change.
- Validation: 3 test files, 9/9 tests passed.
- These are static contracts; fresh long-running FPS/GPU/heap evidence remains open.

## Round 46 — Production Lite eight-load lifecycle soak (2026-09-13)
- Extended the production Lite route to eight loads: 0 failed requests across both probes.
- Without forced GC, heap rose to 287.5 MB; with exposed GC, samples stabilized at 35.5–36.2 MB from run 3 onward, indicating reclaim timing rather than confirmed retained JS heap.
- Resource entries stabilized at 16–17 after the first load.
- GPU allocation, full device matrix, and final performance acceptance remain open.

## Round 47 — Beta art intake pipeline and runtime queue (2026-09-13)
- Added an executable 24-record Beta intake queue: 12 pending hero stars and 12 pending nebula sources.
- Added fail-closed source snapshot, per-image rights, and local image manifest validation. A record cannot enter runtime until all three evidence layers are valid.
- Added deterministic filtering, sorting, merging, summary, and integrity APIs plus a runtime workbench panel with search, kind/status filters, and visible blockers.
- Effective code change was 653 added lines plus 2 modified integration lines; generated receipts, screenshots, and formatting were excluded.
- Validation: targeted Vitest 23/23, TypeScript noEmit passed, and ESLint passed.
- Browser panel capture and real source/rights admission remain the next gate; no synthetic content was admitted.

## Round 48 — 来源投影、八颗恒星接入与交互图集（2026-09-13）
- 从已有的 2026-08-25 SIMBAD 封存快照建立可重复生成和校验的投影。完整快照 seal、逐行摘要、查询身份、正视差、误差及上游引用共同决定展示接入；不写回科学测量参数。
- 接入 Alpha Centauri B、Hadar、Altair、Pollux、Fomalhaut、Deneb、Bellatrix、Alnilam。当前恒星从 12 增至 20；Acrux 缺视差/上游引用，Spica、Regulus、Polaris 保留系统与组件歧义，不冒充已完成。星座/星云保持 12/12。
- 新增 20 颗恒星的图集：色温/扁率筛选、中文名称搜索、排序、归一尺寸与线性半径比较、光球细节、来源入口、移动端详情与返回列表。修复 Alpha Centauri B 定位误选 A 的组件身份路径。
- 修复 R47 intake：admitted 标记不能覆盖失效的证据；错误身份、状态、阻塞列表和重复/未知 merge 更新均拒绝。开发队列折叠到工具区。
- 保守审计为新增 522 行、修改 6 行、删除 0 行，共 528 行有效代码，10 个文件。另有文案、生成数据、数量断言、收据及无完整基线的既有函数修改均未计数。方法与片段见 `mainline-a-r48-code-change.json` / `.diff`。
- 已测：定向 Vitest 95/95、源投影 Node 7/7、发布包 Node 4/4、静态肖像收据 1/1、定向 ESLint；生产 Lite 构建和其筛选范围 TypeScript 通过，buildId `lH0jsk21rWT378LStU-D7`。未执行本轮全仓独立 tsc。
- Browser：开发 Lite 下 1280×900 的新增 8 颗定位均对应正确 passport/portrait；390×844 无横向溢出，Hadar 详情、纹理开关、空搜索、定位可用。生产 Lite 在 1280×720 验证 20 卡、统一比例、B 组件肖像；首页 HTTP 200。截图与 JSON 独立标明开发/生产证据。
- 首次构建因开发服务占用临时 route overlay 出现 Windows EPERM；停止本轮开发服务后重建成功，临时目录已恢复。此次不提供完整生产错误率或性能通过声明。
- 未关闭：剩余 4 星来源与身份、12 张新增星云逐图来源/权利/美术接入、多设备 GPU/FPS/资源生命周期、root app 与 next-web 对齐、公共部署与最终验收。当前发布包仍为需完整仓库的 source/evidence overlay。

## Round 49 — Beta 星云候选图集与来源投影（2026-09-13）
- 新增三份 v592 封存 manifest 的确定性投影，18 条候选全部保留 source URL、NASA ID、字节、尺寸、SHA-256、license 与 credit；NASA media guidelines 仍标为 rights-review，0 条升级为运行时。
- 新增星云候选图集，显示 12 条当前 A 线与 18 条候选，提供类别/权利筛选、搜索、排序、来源链接和移动端布局；明确候选不得进入 Beta。
- 通过 9/9 Vitest、5/5 Node projection、ESLint、vercel-lite 生产构建；生产 1280×720 浏览器显示 30 条且 12/18 分层，390×844 无横向溢出。
- R49 有效代码统计：522 行新增、0 修改、0 删除；生成 projection、截图、收据、文档和旧函数改动排除。
- 未关闭：逐图 NASA 权利/视觉 signoff、12→18/24 runtime admission、4 颗恒星、性能生命周期、root/next-web 对齐及公共部署。

## Round 50 — 星云清权审查状态机与证据审查台（2026-09-13）
- 新增 v610 不可变审查状态机：来源、权利、视觉、准入和运行时状态分离；风险项由来源页、署名、路径、SHA-256、尺寸、字节、目录坐标和白名单状态自动推导。
- 新增 18 条候选的确定性审查包及 stale-output 校验。当前 18 条均为 `rights-review`，运行时准入 0，科学图像写回保持关闭。
- 新增响应式清权审查台，可按状态和文本筛选，查看来源 URL、本地证据路径、尺寸、字节、哈希、署名、manifest 投影身份和阻塞项；同时接入星图/星云图集入口。
- 修复 R49 候选源字段 `source.path` 与封存投影 `source.localPath` 的错配，当前候选证据在 UI 中可见且不再误报路径缺失。
- R50 有效代码统计：722 行有效变更（720 新增、1 修改、1 删除），新建 6 个代码/测试/工具文件；生成 JSON、截图、收据、文档和既有脏树改动排除。
- 已测：Vitest 26/26、review-pack Node 4/4、定向 ESLint 通过；`npm run build:atlas:lite:current` 生产构建通过。
- Browser：生产 1280×720 审查台显示 18 条候选、18 条权利待复核、0 条运行时准入；390×844 显示 18 张卡片且 `clientWidth=scrollWidth=390`，阻塞标签可见。截图见 `mainline-a-r50-nebula-review-desktop.png` 与 `mainline-a-r50-nebula-review-mobile.png`。
- 未关闭：逐图 NASA 权利与署名签核、视觉裁切/焦点 signoff、12→18/24 runtime admission、剩余 4 颗 hero stars、多设备 GPU/FPS/资源生命周期、root/next-web 对齐及公共部署。

## Round 51 — Beta 恒星封存来源审查管线（2026-09-14）
- 将四颗未完成 hero 恒星从静态审查卡片推进为可重复验证的封存来源管线：生成器现在读取本地 SIMBAD 快照，重新计算快照 seal，重放投影并逐字段比对生成模块。
- review pack 改为确定性时间戳和完整嵌套 equality 校验；篡改 schema、源摘要、状态、阻塞项、准入标记或来源元数据都会使 `--check` 失败。
- V611 review utility 新增 source-patch-unsealed、source-snapshot-seal-invalid、来源一致性检查和 canonical transition；伪造 runtime-admitted 或 stale state 均 fail closed。
- 恒星补齐面板统一使用 review utility，采用既有恒星色温函数、动态 20/24 覆盖、`* alf01 Cru` 组件链接、参数化光球声明和窄屏详情布局。
- 有效代码统计：962 行非空非注释生产/测试/工具代码；生成 JSON、截图、收据和文档不计入。详见 `mainline-a-r51-code-change.json`。
- 已测：Vite 22/22、review-pack Node 9/9、定向 ESLint、vercel-lite 生产构建通过；buildId `V81MV7VvOhit8pATT6-vR`。
- Browser：生产 1280×720 显示四条 pending 记录并可切换 Spica；SIMBAD 链接为 `* alf Vir`；390×844 显示四卡片且 `clientWidth=scrollWidth=390`，无横向溢出，控制台无 error/warning。
- 未关闭：四颗恒星仍未进入运行时（20/24）、12 张新增星云来源/权利与视觉 signoff、12 个重点星座最终视觉 signoff、多设备 GPU/FPS/资源生命周期、root/next-web 对齐、公共部署和最终发布包。

## Round 52 — Beta 星云本地证据与 V612 清权审查包（2026-09-14）
- 将 18 条星云候选从“有来源字段”推进到逐图本地证据校验：路径安全、真实字节数、SHA-256、JPEG/PNG 尺寸全部可重放验证；篡改、缺失、绝对路径和路径穿越均 fail closed。
- 清权条件收紧为逐图 `rightsStatus: cleared`、精确 `CC BY 4.0` 和规范 Creative Commons URL；单独出现 `CC BY` 文本不会再被当作权利批准。
- 新增 V612 review pack，对 projection、manifest、source、local evidence 和嵌套 blocker 做完整 equality 校验；新增 10 个 pack 负例/确定性测试，并把本地证据展示接入清权审查台。
- 有效代码统计：929 行非空非注释生产/测试/工具/面板代码，超过本轮 500 行要求；生成 JSON、截图、收据和文档不计入。详见 `mainline-a-r52-code-change.json`。
- 已测：串行 Node 24/24、Vitest 17/17、定向 ESLint、`vercel-lite` 生产构建通过；buildId `Vsx4CmaQ72epHGXizXTH0`。
- Browser：生产 1280×720 清权台显示 18 条候选、18 条权利待复核、0 条运行时准入，本地证据文案为 18/18，控制台 error/warning 均为 0；桌面截图见 `mainline-a-r52-nebula-review-desktop.png`。
- 本轮移动视口控制没有真正切换到 390×844，因此没有生成移动端通过结论；多设备与性能门禁继续独立保持开放。
- 未关闭：逐图权利和视觉 signoff、18→24 星云 runtime admission、4 颗恒星、12 个星座最终视觉 signoff、多设备 GPU/FPS/资源生命周期、root/next-web 对齐、公共部署及最终发布包。

## Round 53 — Beta 星云逐图权利证据契约与 V613（2026-09-14）
- 新增 V613 逐图权利证据 schema：图片来源页、NASA 政策页、政策证据路径和 SHA-256、审核人、审核时间、署名确认、决定与状态均为独立字段；缺任一关键字段就保持 pending。
- 新增不可变评估和状态转换 API。只有完整 item-level evidence 才能生成 cleared 决定；候选标记、视觉 signoff、运行时白名单和科学图像载荷不会被权利决定自动打开。
- 将 v592 三份星云 manifest 的 receipt 引用保留到投影、V612 和 V613，明确这些是声明性来源链，不能直接当作版权批准；下一轮继续做逐项 receipt target/NASA ID/URL/bytes/SHA linkage。
- 新增 V613 rights pack、确定性 equality 校验、序列化 schema 校验、来源身份篡改、错误 URL、错误 digest、未授权清权和运行时越界负例测试。
- 有效代码统计：R53 新增四个 utility/pack 文件共 533 行，超过本轮 500 行要求；集成面板和 V612 projection/pack 修改另计。详见 `mainline-a-r53-code-change.json`。
- 已测：R53 Vitest 19/19、rights pack Node 8/8、星云回归 Node 24/24、定向 ESLint、`vercel-lite` 生产构建通过；buildId `bmtT1XCowHLBW1oxRahH-`。
- HTTP：生产首页与 `/api/health` 均 HTTP 200。Browser：1280×720 清权台显示 V612/V613、18 条 pending、政策 URL、`unreviewed` 决定和运行时关闭边界，控制台 error/warning 均为 0；截图见 `mainline-a-r53-nebula-rights-desktop.png`。
- 未关闭：18 条逐图权利实证、逐项 receipt linkage、6 条新增星云、4 颗恒星、12 个星座 signoff、移动端/多设备性能、root/next-web 对齐、公共部署及最终发布包。

## Round 54 — 星云 receipt linkage 与 manifest seal 校验（2026-09-14）
- 新增 V614 receipt linker：逐份校验 v592 三份 manifest 的 canonical seal、对应 asset-build receipt seal、声明的 receipt hash，并逐条核对 NASA ID、target/alias、source URL、本地路径、字节数和 SHA-256。
- 保留 raw hash 与 canonical seal 的边界；closure 中 `tarantula-nebula` 与 `tarantula-nebula-closure` 通过 NASA ID `PIA23646` 关联，避免把别名当成重复资产或因 target 字符串差异漏链。
- 新增缺失引用、URL/path/bytes/digest 篡改、receipt seal 无效、metadata 仅身份级关联、确定性 fingerprint 和 alias 解析负例；18/18 候选回执链路有效，18 条 payload link，42 条 identity link，0 条 missing。
- V613 rights pack 接入 manifest seal、receiptRefs、每条 receiptLinkage 与汇总字段；UI 显示“载荷字段已逐项关联”和 `18/18 candidates valid · 18 payload links`，但 18 条逐图权利决定仍为 pending，不把来源完整性当作权利批准。
- 有效代码统计：四个新增 R54 linker/typed UI 文件共 513 行非空非注释代码，达到每轮至少 500 行要求；详见 `mainline-a-r54-code-change.json`。
- 已测：定向 Vitest 25/25、receipt linker Node 11/11、V613 rights pack Node 8/8、串行星云回归合计 43/43、定向 ESLint；`vercel-lite` 生产构建通过，buildId `g89NPTGWITiqwAHOq9Ndg`。
- HTTP：生产首页与 `/api/health` 均 HTTP 200。Browser：生产 1280×720 清权台显示 18 条记录、18/18 receipt candidates valid、payload/identity 统计、pending/unreviewed 与运行时关闭边界，控制台 error/warning 均为 0；截图见 `mainline-a-r54-nebula-receipt-linkage-desktop.png`。
- 本轮仍未执行移动视口通过结论；逐图权利页/政策证据/审核人/审核时间、6 条新增星云、4 颗恒星、12 个星座 signoff、多设备 GPU/FPS/生命周期、root/next-web 对齐、公共部署和最终发布包继续开放。

## Round 55 — Beta 恒星 V615 美术证据包（2026-09-14）
- 新增 V615 恒星美术证据包，读取封存 V592 hero catalog 与 V607 SIMBAD projection，覆盖完整 24 颗 Beta hero stars；没有改写 EIH、Newton、2PN/Lense–Thirring 或 Kerr 内核，也没有把参数化肖像写回科学载荷。
- 明确拆分 20 颗当前运行时美术基线与 Acrux、Spica、Regulus、Polaris 四条 candidate-only 记录。每条记录检查身份、温度/半径/光度、扁率、shader、日冕、presentation-only 边界和来源参考；四条候选均保留 pending blockers。
- 新增确定性生成器、24 条产物 equality 校验、hero packet seal/投影 seal 篡改、visual field 篡改、排序、runtime admission 和 measurement writeback 负例；审查台显示 `美术基线 20/24 · candidate-only 4 · evidence pending 4` 及选中候选的 `6/7` 视觉检查。
- 有效代码统计：四个新增 R55 pack/utility 文件共 502 行非空非注释代码，达到每轮至少 500 行要求；详见 `mainline-a-r55-code-change.json`。
- 已测：V615 Node 7/7、定向 Vitest 32/32、串行美术回归 Node 50/50、组合 Vitest 57/57、定向 ESLint；`vercel-lite` 生产构建通过，buildId `gNFyYk9CZEyCjnfBms0bf`。
- HTTP：生产首页与 `/api/health` 均 HTTP 200，health 继续声明默认 kernel `legacy-eih-1pn`。Browser：生产 1280×720 恒星补齐台显示 4 条 pending、20/24 美术基线、V615 checklist、candidate-only 与 measurement not-admitted，Acrux→Spica 切换可用，控制台 error/warning 均为 0；截图见 `mainline-a-r55-hero-art-evidence-desktop.png`。
- 本轮仍未执行移动视口通过结论；四颗恒星来源补齐、18→24 星云、12 个星座最终视觉 signoff、多设备 GPU/FPS/生命周期、root/next-web 对齐、公共部署和最终发布包继续开放。

## Round 56 — Beta 恒星 V616 来源闭环契约（2026-09-14）
- 新增 V616 来源闭环包，覆盖 Acrux、Spica、Regulus、Polaris 四条候选，绑定封存 SIMBAD snapshot/projection digest、HTTPS 来源页、候选专属证据要求和 fresh-capture 槽位；没有填入新的虚构视差、组件身份或上游引用。
- 明确 8 个来源缺口：Acrux 缺正视差与上游引用；Spica、Regulus、Polaris 缺组件身份与组件来源引用。四条记录均为 `fresh-capture-required`、review `hold`、runtime `candidate-only`、measurement `not-admitted`。
- 新增来源 patch 校验与 capture-review 转换 API，要求 HTTPS、ISO 时间、SHA-256、审核人、组件决策和源摘要；cleared patch 仍不会自动打开运行时或科学写回。
- 新增 stale snapshot、投影身份错配、fake capture、runtime admission、非法 patch、确定性 fingerprint 和临时 root 生成测试；来源闭环面板显示 4 条记录、8 个缺口和 0/4 新快照采集。
- 有效代码统计：四个新增 R56 source-closure 文件共 503 行非空非注释代码，达到每轮至少 500 行要求；详见 `mainline-a-r56-code-change.json`。
- 已测：V616 Node 6/6、定向 Vitest 24/24、串行综合 Node 56/56、组合 Vitest 67/67、定向 ESLint；`vercel-lite` 生产构建通过，buildId `uNtoS5QwPMnwjBZ5PHRuF`。
- HTTP：生产首页与 `/api/health` 均 HTTP 200，health 继续声明默认 kernel `legacy-eih-1pn`。Browser：生产 1280×720 恒星补齐台显示 V615 美术摘要、V616 来源闭环、Acrux 来源缺口，并验证 Spica 组件身份缺口切换，控制台 error/warning 均为 0；截图见 `mainline-a-r56-stellar-source-closure-desktop.png`。
- 本轮仍未执行移动视口通过结论；四颗恒星真实来源采集/审核、18→24 星云、12 个星座最终视觉 signoff、多设备 GPU/FPS/生命周期、root/next-web 对齐、公共部署和最终发布包继续开放。

## Round 57 — Beta 星云 V617 扩展候选闭环（2026-09-14）
- 新增 V617 expansion pack，将封存 V613 的 18 条候选与 ring、dumbbell、california、bubble、cats-eye、omega 六条 v592 metadata/license 身份合并为 24 条候选目标板；没有改写旧 receipt，也没有把 metadata 当成图像。
- 对 license review、metadata admission、metadata acquisition、visual acquisition 四份 receipt 做 canonical seal 校验，并按 NASA ID、HTTPS URL、metadata digest 连接六条扩展记录。
- California 记录本地 payload `3317×1902 · 758960 bytes` 和 SHA-256，但仍保持 rights pending、visual signoff pending、candidate-only；其余五条保持 `payload-acquisition-pending`，明确单次 HTTPS 采集和许可阻塞。
- 新增 V617 TypeScript utility、过滤/摘要/阻塞标签/边界校验与负例测试；星云清权台显示 `24 条候选目标板 · 1 已有 payload · 5 待采集` 和六条下一步。
- 有效代码统计：四个新增 R57 expansion 文件共 509 行非空非注释代码，达到每轮至少 500 行要求；详见 `mainline-a-r57-code-change.json`。
- 已测：V617 Node 6/6、定向 Vitest 14/14、串行综合 Node 62/62、组合 Vitest 74/74、定向 ESLint；`vercel-lite` 生产构建通过，buildId `IGsmSY56I4OOYmUVJ71VO`。
- HTTP：生产首页与 `/api/health` 均 HTTP 200，health 继续声明默认 kernel `legacy-eih-1pn`。Browser：生产 1280×720 清权台显示六条扩展记录、24 条候选总数、California 本地 payload、其余五条待采集，控制台 error/warning 均为 0；截图见 `mainline-a-r57-nebula-expansion-desktop.png`。
- 本轮仍未执行移动视口通过结论；四颗恒星真实来源采集/审核、24 条星云逐图权利与视觉 signoff、12 个重点星座最终视觉、多设备 GPU/FPS/资源生命周期、root/next-web 对齐、公共部署和最终发布包继续开放。

## Round 58 — Beta 恒星 V618 新鲜采集入口（2026-09-14）
- 新增 V618 fresh-capture intake，严格绑定 V616 的 Acrux、Spica、Regulus、Polaris 四条来源闭环记录、查询标识、HTTPS SIMBAD endpoint、snapshot/projection digest 和 ODbL/citation 归属。
- 每条请求保留可重算 raw response hash、严格过去时 UTC、解析类别、组件来源引用和 stale identity 负例；HTTP 页面本身不会自动变成结构化视差、组件身份或科学载荷。
- 生成包保持 4 条 request required、0/4 response、0 review pending、0 runtime admitted、0 measurement admitted；四条仍为 hold、candidate-only、not-admitted、scientific writeback false。
- 恒星补齐台新增 V618 请求队列和选中记录详情，显示四个 request ID、查询、端点、下一动作、服务归属和 0/4 边界；没有伪造新快照或打开运行时准入。
- 有效代码统计：四个新增 R58 generator/test/utility 文件共 501 行非空非注释代码，达到每轮至少 500 行要求；详见 `mainline-a-r58-code-change.json`。
- 已测：V618 Node 9/9、定向 Vitest 15/15、V615/V616/V617/V618 Node 回归 28/28、组合 Vitest 39/39、定向 ESLint；`vercel-lite` 生产构建通过，buildId `tQgAqPxPi1d-E61btR03G`。
- HTTP：生产首页与 `/api/health` 均 HTTP 200，health 继续声明默认 kernel `legacy-eih-1pn`。Browser：1280×720 恒星补齐台显示 V618 `0/4 响应已封存`、4 个请求行、SIMBAD endpoint 和 candidate-only，控制台 error/warning 均为 0；截图见 `mainline-a-r58-stellar-fresh-capture-desktop.png`。
- 本轮仍未执行移动视口通过结论；四颗恒星真实响应/结构化证据/人工审核、24 条星云逐图权利与视觉 signoff、12 个重点星座最终视觉、多设备 GPU/FPS/生命周期、root/next-web 对齐、公共部署和最终发布包继续开放。

## Round 59 — Beta 恒星 V619 原始捕获与回放契约（2026-09-14）
- 新增 V619 raw capture/replay contract，将四颗候选拆成可审计的 HTTPS 原始响应计划：请求 URL、SIMBAD endpoint、transport、timeout、retry backoff、snapshot/projection digest 均被封存。
- 原始 envelope 必须通过精确 SIMBAD URL、HTTP 200、allowlisted content type、非空 body、字节数和可重算 SHA-256；unsafe redirect、错误状态、空 body、future timestamp、身份错配和 admission 越界均 fail closed。
- fixture-replay 只允许作为 raw-only 回放测试，不能自动变成 structured scientific evidence；生成包保持 4 pending、0 captured、0 raw-only、0 structured、0 blocked、0 runtime admission。
- 恒星补齐台新增 V619 原始捕获计划、传输策略、不可变摘要和 raw-only 边界，四条计划均可从浏览器语义钩子核对。
- 实际外部探测记录为 10 秒超时：SIMBAD HTTPS 页面返回 `TaskCanceledException`，没有保存或伪造响应，也没有增加 responseCaptured。
- 有效代码统计：四个新增 R59 generator/test/utility 文件共 512 行非空非注释代码，达到每轮至少 500 行要求；详见 `mainline-a-r59-code-change.json`。
- 已测：V619 Node 9/9、定向 Vitest 15/15、V615–V619 Node 回归 37/37、组合 Vitest 47/47、定向 ESLint；`vercel-lite` 生产构建通过，buildId `YbmxrVYpYb0fxOJA5s97n`。
- HTTP：生产首页与 `/api/health` 均 HTTP 200，health 继续声明默认 kernel `legacy-eih-1pn`。Browser：1280×720 恒星补齐台显示 V619 `0/4 原始响应已捕获`、4 个 raw capture rows、SIMBAD endpoint 和 raw-only 边界，控制台 error/warning 均为 0；截图见 `mainline-a-r59-stellar-raw-capture-desktop.png`。
- 本轮仍未执行移动视口通过结论；四颗恒星真实 raw artifact/结构化证据/人工审核、24 条星云逐图权利与视觉 signoff、12 个重点星座最终视觉、多设备 GPU/FPS/生命周期、root/next-web 对齐、公共部署和最终发布包继续开放。

## Round 60 — Beta 恒星真实 HTTPS raw collector 与 attempt ledger（2026-09-14）
- 新增 V620 真实 HTTPS collector，逐颗执行 Acrux、Spica、Regulus、Polaris 的 SIMBAD GET；attempt ledger 记录 startedAt、endedAt、timeout、retryCount、HTTP status、content type、final URL、redirect chain、error category/message、request fingerprint、字节数和 artifact hash。
- 本次网络批次 4/4 HTTP 200、`text/html; charset=utf-8`、无重定向、无错误；raw artifact 保存到 `docs/release/v607/raw-artifacts/r60/`，SHA-256 由 artifact audit 重算。HTML 仍是 raw-only 传输事实，不转化为结构化科学证据。
- 采集器增加 HTTPS 精确主机/无凭据校验、累计重定向与 body timeout、4 MiB 响应上限、失败状态保留观测链；失败路径保持 `responseCaptured=0` 且不得携带 artifact。
- 新增离线 replay/verifier 与 artifact audit，覆盖 fixture、伪造状态/内容类型/哈希、越界 URL、重定向链、时间戳、fingerprint 和准入边界负例；R60 面板显示每次 attempt 与 raw artifact SHA-256。
- `candidate-only`、`hold`、`not-admitted`、`scientificPayloadWriteback=false`、运行时/测量写入关闭；没有改写 V616 snapshot/projection digest，也没有写回运行时或科学载荷。
- 有效生产代码 1082 行（测试除外），满足本轮约 1000 行开发量；代码统计见 `mainline-a-r60-code-change.json`。
- 已测：R60 Node 33/33、Vitest 30/30、定向 ESLint 通过；V619+V620 回放/采集/审计验证均通过。`vercel-lite` 生产构建通过，buildId `RfLp8P3JxRvZUOTUaBjes`。
- HTTP：生产首页与 `/api/health` 均 HTTP 200，health 继续声明默认 kernel `legacy-eih-1pn`。Browser：生产 1280×720 恒星补齐台显示 R60 `attempts 4/4 · responseCaptured 4 · failed 0`，Acrux attempt 的 HTTP 200、content type、最终 URL、fingerprint、raw artifact hash 与科学写回关闭语义可见；console error/warning 0、scrollWidth=clientWidth=1280。截图见 `mainline-a-r60-stellar-raw-attempt-ledger-desktop.png` 与 `mainline-a-r60-stellar-raw-attempt-ledger-detail-desktop.png`。
- 移动端：not-run；本轮 HTTP、浏览器和截图证据不代表物理设备性能、生产 SLA、真实用户验证、科学有效性或版权批准。

## Round 61 — Beta 恒星 V621 结构化候选与来源组件台账（2026-09-14）
- 对 R60 封存的 Acrux、Spica、Regulus、Polaris 四份真实 SIMBAD HTML 执行离线结构化解析；ICRS sexagesimal 坐标按 RA 小时转度，四条均为 `parsed-candidate`。
- 新增 V621 `sourceLedger`/`sourceRefs`，绑定真实 source URL、capturedAt、raw SHA-256、引用 pending 与 ODbL attribution required；组件身份保持 unresolved，不能以对象页推断组件来源。
- 新增结构化证据质量评分、字段归一化、阻塞分类、稳定 fingerprint、replay report 与 JSONL；审计重算四个 artifact 的 bytes/SHA 并复核 V616 snapshot/projection digest。
- 所有结构化结果保持 `hold`、`candidate-only`、`not-admitted`、`scientificPayloadWriteback=false`；`componentConfirmed=0`、`sourceClosed=0`，未写入科学载荷或运行时。
- 有效生产代码统计：R61 receipt 记录 1042 行，满足本轮 1000 行开发量；详见 `mainline-a-r61-code-change.json` 与 `mainline-a-art-round-61-20260914.json`。
- 已测：R60 Node 24、R61 audit Node 4、V621 parser/evidence/review Vitest 23、定向 ESLint；`vercel-lite` 生产构建通过，buildId `dj7JrN_Iebc3SVp21HHfR`。
- HTTP：本地生产 `/api/health` HTTP 200，默认 kernel 仍为 `legacy-eih-1pn`。Browser：1280×720 恒星补齐台显示 V621 `4/4 parsed · component confirmed 0 · hold`，结构化字段、坐标、来源 URL、raw SHA 和准入边界可见；console error 0，headless WebGL GPU stall warning 4 条，不能作为性能证据。截图见 `mainline-a-r61-stellar-structured-desktop.png`。
- 移动端：not-run；性能、版权批准、组件身份人工复核、A 线 12/12/12 冻结、24 星云、root/next-web 对齐和最终发布包继续开放。

## Round 62 — A 线 canonical 12/12/12 冻结预检（2026-09-14）
- 生成 36 条 canonical coverage manifest：12 颗恒星、12 张星云、12 个星座；每条绑定 asset route、source URL/hash、rowHash、lifecycle、pending/signoff/rights 状态。
- 新增 V622 route graph、重复/缺失 roster、路径越界、生命周期释放和 writeback boundary 校验；freeze replay 技术预检 `passed=true`、issues=0、manifest deterministic。
- 面板显示 `visual/content/rights 12/12/12`，但 12 项星座视觉 signoff 仍 pending，lifecycle 为 `candidate-hold`，runtime 为 `candidate-only`，measurement 为 `not-admitted`。
- 有效生产代码统计：R62 receipt 记录 1020 行，满足本轮 1000 行开发量；详见 `mainline-a-r62-code-change.json` 与 `mainline-a-art-round-62-20260914.json`。
- 已测：coverage Node/Vitest 15/15、freeze preflight Vitest 6/6、定向 ESLint；`vercel-lite` 生产构建通过，buildId `xXoyCNGQLS5On1dSno4Py`。
- HTTP：本地生产 `/api/health` HTTP 200，默认 kernel 仍为 `legacy-eih-1pn`。Browser：1280×720 恒星补齐台显示 V622 freeze gate、12/12/12、12 pending、lifecycle check strip，console error 0、headless WebGL warning 4；截图见 `mainline-a-r62-canonical-freeze-desktop.png`。
- 移动端：not-run；性能、人工 signoff、版权批准、Beta 24 星云闭合、root/next-web 对齐和最终发布包继续开放。
## R63 · Beta 星云六图 HTTPS raw ledger（2026-09-14）

- 为 Ring、Dumbbell、California、Bubble、Cat's Eye、Omega 六条 V617 候选增加真实 HTTPS 图片采集器，attempt ledger 记录 startedAt/endedAt、timeout、retry、HTTP、content type、final URL、redirect chain、请求 fingerprint、错误分类与 raw artifact 字段。
- 增加 V623 artifact replay/verifier 与 acquisition policy：重算字节数和 SHA-256，校验 MIME、尺寸、路径 containment，拒绝 fixture/synthetic/伪造响应，并输出 CSV/JSONL/Markdown 审计。
- 本轮离线 ledger 仅记录请求计划：6/6 attempted、0 responseCaptured、0 payloadPresent、0 rightsCleared；面板保持 candidate-only、hold、not-admitted、scientificPayloadWriteback=false。
- static / HTTP / visual / browser / performance / external-source evidence 分开记录于 `mainline-a-art-round-63-20260914.json`；桌面 1280×720 面板证据通过，移动端 not-run，headless WebGL warning 不作为性能证据。下一轮 R64 继续第二组六图管线，真实网络或版权阻塞时不填充合成资产。

## R64 · 六图真实 HTTPS 捕获、严格 replay 与保留审计（2026-09-14）

- 本轮工程批次已完成：7 个接入生产或实际 CLI 的新增文件共 1499 行，其中有效非空非注释生产代码 1380 行；测试、孤立 ArtifactReplayV624 模块、生成收据、复制构建源与文档均未计数。跨轮已有组件集成修改保守排除。
- 新增 6 次真实 NASA HTTPS 图片响应；当前保留 ledger 共 13 attempts，选择的 6 个 artifact 重算通过，历史与本轮文件共 12 份全部重算通过。6 个候选的逐图版权仍 pending，运行时准入为 0；历史被覆盖的早期 attempts 完整性不作保证。
- 修复重试历史丢失、offline 覆盖 live、replay 非版权错误未 fail closed、陈旧报告仍通过等问题；原始 JSON 按内容 SHA 归档，新 artifact 使用 SHA 命名，不删除旧文件。
- 面板接入同一审计模型，修复搜索结果与详情错位、移动搜索框挤压；内置浏览器桌面 1280×720 和移动 viewport 390×844 均执行，clear-search 返回 6 条、Soul 搜索详情一致、空结果无详情、横向无溢出、error/warning 0。
- Node 20/20、Vitest 14/14、定向 ESLint 通过；最终保留式 production build `48a3NHvLheCoZYIJ_PwTv`，构建前后源码摘要一致。HTTP 首页/health 200，6 个初始脚本字节 SHA 与该构建匹配。
- static、HTTP、visual、browser、performance、external-source evidence 分别封存；性能仅新增 10 次本地 HTTP 完整响应时长样本，不表示渲染帧时间、GPU、真实用户或物理移动设备性能。
- round receipt: `mainline-a-art-round-64-20260914.json`；code-change receipt: `mainline-a-r64-code-change.json`。V616 与 HEAD 完全一致，V619 仍 4 pending，physics/scientificPayloadWriteback 边界未改变。
- R65 下一完整批次：复用现有 runtime resource registry，建立生产页面内的真实采样控制、带构建/viewport/可见性身份的 frame-time 与可用内存记录、texture/object-URL 释放证据、重复和长时间运行；性能独立 receipt。R66 随后完成只读两条代码线比较与候选发布包，外部版权和人工签署缺口持续显式保留。

## R65 · 多设备性能与资源生命周期（2026-09-20）

- 新增 V625 性能证据契约、会话控制器和面板：桌面/移动 viewport、build marker、可见性、requestAnimationFrame 帧样本、long-task 过滤、可用 JS heap、runtime resource identity 与重复运行都进入同一 ledger；构建 marker 绑定 `mainline-a-872a1ad59b33f974`、分支 `codex/solar-sim-mainline-a` 和 HEAD `156ec779...`。
- 面板通过真实浏览器 viewport 采样：桌面 1280×720 记录 717 帧、p95 5.65ms、median 180.0 FPS、heap 143MB；移动 390×844 记录 718 帧、p95 5.62ms、median 180.0 FPS、heap 146MB；两次 before/after resource identity 均 baseline，控制台 error/warning 为 0。
- 资源生命周期状态只由 registry 前后快照差异推导，调用方不能用 releasedOwners 字符串掩盖 drift；重复模式、session nonce、旧 timer 清理和 buffered long-task 起点过滤已加入生产路径。
- 离线 replay/verifier 与静态 audit 对 receipt digest、build identity、viewport/visibility、run status、resource baseline、桌面/移动双样本做 fail-closed 校验；R65 receipt 状态保持 `blocked`，因为 `long-run-observation-required` 与 `physical-device-not-run` 未关闭。
- 有效生产代码统计：约 1,400 行（V625 evidence 661、session 274、panel 约 210、audit/replay/build 接入约 260；测试与收据不计入），详见 `mainline-a-r65-code-change.json`。
- 已测：V625 Vitest 10/10、定向 ESLint 通过；标准 `npm run build` 因既有客户端 `node:crypto/fs/path` webpack scheme 错误失败，受保护 `vercel-lite` build 004 成功，buildId `PX6fL91L1BMpwIJ26G6UY`，源码输入摘要稳定。
- HTTP：R65 build 004 首页与 `/api/health` 200，6 个初始脚本加载 200，10 次本地响应时长样本写入 `mainline-a-r65-http-20260920.json`；这属于 HTTP/build binding，不是性能 SLA。
- Browser/visual：Codex in-app browser 桌面与移动 viewport 均打开 V625 面板并采样；截图为 `mainline-a-r65-desktop-20260920.png`、`mainline-a-r65-mobile-20260920.png`。截图是 visual evidence，四秒样本是 browser-runtime-observation，二者均不是真实用户或生产性能证明。
- performance：本轮独立 receipt `mainline-a-r65-performance-v625.json` 与 replay `mainline-a-r65-performance-replay-v625.json`；物理移动设备 not-run，30 分钟 soak 未执行，R65 不宣称 qualification。external-source evidence：本轮没有新增外部科学或版权来源。

## R66 · root/next-web 只读对齐与候选发布包（2026-09-20）

- root app 明确为 `E:\\86137\\myai\\solar_sim\\web`（Vite/Three.js，`solar-sim-viz`），只读计算 package、lock、入口、`src`、`public` 和现有 `dist` 的 SHA-256；未进入或操作上级 Git，也未把嵌套 probe 目录当作 root app。
- 新增 V626 typed alignment contract、CLI audit、HTTP/build binding collector、candidate package builder 和 receipt generator。对比记录 root/next-web package/source/build/manifest identity、12/12/12 canonical coverage、24 hero stars、Beta nebula source/rights closure、R65 lifecycle and rollback references。
- 对齐 receipt 显式保留 root/next-web 双代码线差异、root manifest 缺失、四颗恒星 component identity pending、24 张星云仅 6/24 live batch、12 canonical rights/signoff pending、runtime clearance 0、R65 long-run/physical mobile blockers；没有用合成内容或 fixture 填充这些缺口。
- 候选发布包写入 `docs/release/v607/mainline-a-r66-package-20260920-001/`，包含 package、raw-byte manifest、rollback、gate checklist、evidence index 和不可覆盖 pointer；`--check` 逐项重算路径 containment、bytes/SHA-256 与 candidate boundary。
- 有效生产代码统计：1469 行（alignment 644、audit 469、package 276、HTTP collector 80；测试、收据、截图和文档不计入），详见 `mainline-a-r66-code-change.json`。
- 已测：R66 alignment 负例 Node 4/4、package manifest/check Node 4/4、alignment Vitest 5/5、定向 ESLint 通过；受保护 `vercel-lite` build `bktVNvQNoPT6eXvlUAgia` 通过，runtime marker `mainline-a-c39a4d34a8f47057`，源码输入稳定。
- static / HTTP / visual / browser / performance / external-source evidence 分开封存：R66 HTTP 首页与 health 200、6 个脚本均 200 且 build binding 匹配；Codex in-app browser 桌面 1280×720、移动 viewport 390×844，console error/warning 0，截图为 `mainline-a-r66-desktop-20260920.png` 与 `mainline-a-r66-mobile-20260920.png`。这些是本地构建/浏览器和视觉证据，不是生产 SLA、真实用户、物理移动设备、科学有效性或版权批准。
- R66 候选包状态为 blocked；未关闭门禁：root/next-web 统一身份与 manifest parity、12 canonical signoff、Beta 24 nebula source/rights、stellar component identity、canonical runtime clearance、30 分钟 soak、physical mobile device。移动端物理设备 not-run。

R66 最终追加收据：`mainline-a-r66-code-change-final.json`、`mainline-a-art-round-66-20260920-final.json`；最终 preserved build 使用 `mainline-a-r66-build-20260920-002.json`，HTTP 使用 `mainline-a-r66-http-20260920-002.json`，browser 使用 `mainline-a-r66-browser-20260920-002.json`，候选包指针为 `mainline-a-r66-release-package-v626-20260920-004.json`。这些文件仍是候选发布审计材料，未关闭上述人工、版权、性能或代码线统一门禁。

### R66 身份桥接与 receipt-drift 修复追加（2026-09-20）

- 新增只读 release identity bridge：共同产品身份为 `solar-sim-mainline-a`，root runtime package 保留 `solar-sim-viz`，next-web runtime package 保留 `solar-next-web`；包名差异被标为 intentional mapping，不被伪装成 source parity。
- `audit-mainline-a-release-alignment-v626.mjs` 增加 `--no-write`/`--output` 语义，负例测试不再覆盖 durable alignment receipt；canonical alignment 已重新从真实 `E:\86137\myai\solar_sim\web` 生成，root manifest 缺失继续 pending。
- 新增 identity bridge builder、raw SHA/package pointer verifier、gate replay、candidate-only panel 和 AtlasAppShell runtime markers；replay 仍为 `blocked`、requiredOpen=2，scientificPayloadWriteback=false。
- 新增 preserved build `mainline-a-r66-build-20260920-008.json`，HTTP receipt `mainline-a-r66-http-20260920-008.json` 的首页/health 与 6 个脚本均 200 且 build binding 匹配；Codex in-app browser desktop 1280×720、mobile viewport 390×844 的 identity markers 与截图已封存，console error/warning=0。
- 新候选 package pointer 为 `mainline-a-r66-release-package-v626-20260920-010.json`，其中包含 identity bridge 摘要和重算 SHA；package `--check` 通过内部一致性检查，但状态仍 blocked。
- 本追加批次有效生产代码统计 1170 行，测试、生成收据、截图和文档不计入；见 `mainline-a-r66-identity-bridge-code-change-20260920.json` 与 `mainline-a-art-round-66-identity-bridge-20260920.json`。
- 证据继续分为 static、HTTP、visual、browser、performance、external-source；physical mobile device、30 分钟 soak、root manifest parity、12 canonical signoff、4 stellar component identities、24 nebula source/rights closure 均未宣称关闭。

R66 追加最终重绑定：保留式 build `mainline-a-r66-build-20260920-011.json`、HTTP `mainline-a-r66-http-20260920-011.json`、browser `mainline-a-r66-browser-20260920-011.json`、identity bridge `mainline-a-r66-identity-bridge-v626-final-004.json` 与候选包 `mainline-a-r66-release-package-v626-20260920-013.json` 同批封存；最终追加收据为 `mainline-a-r66-identity-bridge-code-change-20260920-final.json` 和 `mainline-a-art-round-66-identity-bridge-20260920-final.json`。身份映射已可重算，source/manifest/rights/runtime/performance 人工门禁仍保持 blocked 或 pending。

R66 最终 receipt-index 重绑定（2026-09-21）：alignment 的 identity bridge 索引已切换到 `mainline-a-r66-identity-bridge-v626-final-004.json`，候选包更新为 `mainline-a-r66-release-package-v626-20260920-014.json`；对应代码变更收据为 `mainline-a-r66-identity-bridge-code-change-20260920-final-002.json`，轮次收据为 `mainline-a-art-round-66-identity-bridge-20260920-final-002.json`。移动截图 SHA-256 已从本地文件重算；这次重绑定不改变任何 pending/blocked 门禁。

R66 receipt parser 复核追加：审计器仅在内存中容忍旧浏览器 receipt 尾部字面量 `\\n`，不改写历史文件；alignment 现绑定 011 HTTP/browser 与 011 visual 截图。候选包 `mainline-a-r66-release-package-v626-20260920-015.json`、代码收据 `mainline-a-r66-identity-bridge-code-change-20260920-final-003.json`、轮次收据 `mainline-a-art-round-66-identity-bridge-20260920-final-003.json` 同批封存，生产有效代码统计更新为 1174 行，所有 source/rights/runtime/performance 人工门禁仍为 blocked 或 pending。

R66 V628 真实 HTTPS 批次（2026-09-22）：六个 Beta 星云候选完成真实 NASA images-assets HTTPS 尝试，10 条 attempt ledger 中 3 条保存原始 artifact 并通过 SHA-256 重算，3 个网络失败候选保留超时/错误遥测且 responseCaptured=0；官方 source-page 与 item-level rights 仍为 0/6。新增 V628 replay/verifier/audit、面板和 R66 alignment 031 重绑定；保留式 build 031、HTTP 031、in-app browser/visual 031 均通过，physical mobile 与性能资格不宣称。六个 V628 核心生产/工具文件有效代码 1064 行，见 `mainline-a-r66-v628-code-change-20260922-final-013.json` 与 `mainline-a-art-round-66-20260922-028.json`；候选发布仍 blocked，candidate-only/hold/not-admitted/scientificPayloadWriteback=false 不变，V616 snapshot/projection 与物理内核未改写。批次 sourceIdentity.head 保持 unknown，未把采集过程错误绑定到当前提交。

R66 星云来源/版权闭包追加（2026-09-21）：新增 V627 typed closure contract、只读 builder/verifier/replay 和候选面板；V624 的 6 条已捕获记录与 V623 的 6 条离线 pending 记录合并为 12 条 roster，receipt 状态为 `pending`，rightsCleared=0/12，runtime admission 仍关闭。alignment 已纳入 V627 JSON/JSONL receipt，候选包更新为 `mainline-a-r66-release-package-v626-20260921-016.json`。本批有效生产代码统计 1900 行，见 `mainline-a-r66-nebula-rights-code-change-20260921.json` 和 `mainline-a-art-round-66-nebula-rights-20260921.json`；未使用合成来源、fixture 晋级或版权批准替代真实 signoff。

R66 V627 最终浏览器与候选包重绑定（2026-09-21）：V627 浏览器安全 SHA-256 artifact 重算替代客户端 `node:crypto` 依赖，保留式 production build 017 通过；HTTP 017 与 017 browser/visual receipt 绑定同一 buildId，桌面 1280×720、移动 viewport 390×844 的清权审查台均可见，console error/warning=0。V627 代码收据 `mainline-a-r66-nebula-rights-code-change-20260921-final-007.json` 记录 1989 行有效生产代码（测试除外），round receipt 为 `mainline-a-art-round-66-20260921-017.json`，identity bridge 为 `mainline-a-r66-identity-bridge-v626-final-005.json`，候选包为 `mainline-a-r66-release-package-v626-20260921-020.json`。alignment 仍 blocked：nebula source/rights closure、canonical signoff/runtime、stellar component identity、root manifest parity、long-run/physical mobile 等 11 个门禁未关闭；candidate-only、hold、not-admitted、scientificPayloadWriteback=false 和物理内核边界保持不变。

Receipt integrity refresh: after final verifier/package pointer update, the authoritative code receipt is `mainline-a-r66-nebula-rights-code-change-20260921-final-009.json`; package `20260921-020` remains the candidate pointer and the identity bridge verifier is intentionally blocked only by the unresolved root manifest parity gate.

R66 authoritative refresh (2026-09-21): V627 now uses the verified receipt pair `mainline-a-r64-nebula-rights-closure-v627-verified-20260921.json` and `mainline-a-r64-nebula-rights-closure-replay-v627-verified-20260921.json`. The closure combines six V624 captured rows with six V623 offline ledger rows, reports source-page and rights signoff as pending, keeps six artifact hashes verifiable, and rejects metadata-only signoff promotion. The current code receipt is `mainline-a-r66-nebula-rights-code-change-20260921-final-012.json` with 3349 effective production lines; the current round receipt is `mainline-a-art-round-66-20260921-023.json`. Build, HTTP and in-app browser evidence are bound to run 20260921-021, while the latest candidate package is `mainline-a-r66-release-package-v626-20260921-024.json` and identity bridge is `mainline-a-r66-identity-bridge-v626-final-006.json`. Static, HTTP, visual, browser, performance and external-source evidence remain separate. Alignment is still blocked by unresolved official source pages/rights and visual signoff, stellar component identity, runtime/signoff freeze, long-run and physical-mobile evidence, root manifest parity, and the incomplete 24-item nebula target. Candidate-only, hold, not-admitted, scientificPayloadWriteback=false, parent-Git read-only, and physics-kernel boundaries remain closed.

## R61 component identity ledger progress (2026-09-22)

- Replayed the four captured SIMBAD object pages and extracted 9 explicit WDS/CCDM catalogue links as `identifier-only` component hints (Acrux 2, Spica 2, Regulus 2, Polaris 3). Each hint retains the real HTTPS catalogue URL and remains unresolved; no component identity was inferred from astronomical convention or synthetic data.
- Added a source-signature gate requiring SIMBAD metadata, object description, and ICRS markers before an HTML fragment can become a parsed candidate. Query identifier binding rejects a page whose title does not match the V620 request plan; forged title/coordinate fragments remain `parse-blocked`.
- Structured replay maps those hints into the component source ledger with `sha256=null` until an independent raw capture and rights review exists. The report now shows 9 component refs, 0 hashed component sources, 0 confirmed components, 4 blocked-for-review rows, and candidate-only/hold/not-admitted/scientificPayloadWriteback=false.
- The review panel exposes hint count, catalogue URLs, and the explicit `identifier-only` status. Negative tests cover forged external links and attempted hint promotion. Receipt: `mainline-a-r61-component-ledger-progress-20260922.json`.
- Validation: parser/evidence/panel Vitest 25/25, R61 audit Node 5/5, candidate pack and evidence replay checks verified, targeted ESLint passed. External-source and rights closure remain pending; no V616 digest or physics kernel was modified.

## R66 root/next-web manifest probe and receipt rebind (2026-09-22)

- Added a read-only root manifest probe/verifier. It scans only the approved `E:\86137\myai\solar_sim\web` mirror for known canonical coverage manifest names, validates schema, 12/12/12 counts, record uniqueness, boundary flags and SHA-256, and never writes the root mirror or runs parent Git commands.
- The canonical root currently has no independently observed coverage manifest. The probe therefore reports `rootManifestPresent=false`, `manifestParity=false`, `root-manifest-not-present`, while the next-web V622 manifest remains independently valid. Generated next-web coverage is not promoted as root evidence.
- R66 alignment now binds the probe receipt to the current next-web manifest bytes and records a separate `root-manifest-probe` evidence class. Identity bridge final-010 binds the current next-web package hash; candidate package 036 includes the probe path in its evidence index. All unresolved source, rights, runtime, performance and root-manifest gates remain blocked or pending.
- Validation: root probe contract Node 6/6, alignment plus probe Node 13/13, package and identity tests 8/8, targeted ESLint passed. Receipt: `mainline-a-r66-root-manifest-probe-v626.json`; package: `mainline-a-r66-release-package-v626-20260922-036.json`.

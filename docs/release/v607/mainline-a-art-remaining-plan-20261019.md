# 宇宙美术剩余工期与交付计划

更新：2026-10-28，Asia/Shanghai。本文更新实际执行状态，保留原阶段交付、历史失败与旧工作包估算，不改动应用源码或现有 Goal 范围；旧工时不是当前滚动剩余工时。

<!-- BEGIN: MAINLINE_A_CURRENT_SNAPSHOT -->
**2026-10-28 当前快照：build15 的 A12 恒星／A12 星座／A12 星云本地候选技术交付与冻结已完成。M2／M3／M4 同构建完整矩阵、306 张实际运行图画廊、异常与释放检查、两次独立 ≥30 分钟观察及最终共同字节绑定均有实际收据。桌面 long07 为 30:02.003，移动模拟 mobile08 为 30:02.006，各完成六个五分钟路线窗口并关闭自有浏览器。双端配对结果为 passed-with-explicit-DOM-adjudication；原机器 DOM false／review-required 和全部历史失败保留，不将补充裁决写回原始数据。人工美术、逐图权利、实体设备、科学有效性和公开发布仍待各自审核。**

**当前交付入口：** [build15 候选交付与启动说明](./mainline-a-m5-candidate-delivery-20261028.md) · [候选冻结清单](./mainline-a-m5-candidate-freeze-20261028.json) · [306 张实际运行图画廊](../../../output/playwright/mainline-a-m5-final15-20261023/gallery.html) · [Sirius A／Orion／M42 桌面与移动六图](./mainline-a-current-art-preview-20261019.md)。下方历史快照仅保留原时点含义，不作为当前状态入口。

- **同一构建：** Build ID `qg3f2Z6WY5qYWfo3vEjmq`，runtime ID `mainline-a-183482b4a793d6d4`，源码 `183482b4a793d6d4e22ade276d3bfd301155f809a3618b5ed07102c0a1441b60`，见 [build15 构建收据](./mainline-a-r85-build-20261019-m5web15.json)。当前 2465 个源码输入前后匹配，不修改科学数据或权利状态。
- **A36 画面与交互：** [M2 full05](../../../output/playwright/mainline-a-m5-stars-final15-20261023/after/receipt.json)56 图、[M3 full04](../../../output/playwright/mainline-a-m5-nebulae-final15-20261023/after/receipt.json)138 图、[M4 full10](../../../output/playwright/mainline-a-m4-final15-20261023/receipt.json)112 图，共 36 对象、72 个设备组、240 张主要图与 66 张别名／故障／旅程图；[画廊清单](../../../output/playwright/mainline-a-m5-final15-20261023/gallery-manifest.json)与[桌面／移动模拟画廊浏览器检查](../../../output/playwright/mainline-a-m5-final15-20261023/gallery-browser-check.json)均保留同构建身份。星云观看、2×、来源、重试／切换与五站猎户座路线、返回／外部中断／窄屏／减少动画已按各自完整收据验证，代理审阅不代签人工美术。
- **专项与请求检查：** [GL15](../../../output/playwright/mainline-a-m5-20261019/final15-webgl-audit.json)保留两端真实 WebGL 丢失／恢复；[responsive15b](../../../output/playwright/mainline-a-m5-20261019/responsive15b-visual-audit.json)保留 9 张默认图及 6 张状态补充图的实际审阅；[orbitui08](../../../output/playwright/mainline-a-m5-20261018/orbit-layer-ui-20261023-orbitui08/receipt.json)覆盖 26 主状态＋8 补充；[pointer02](../../../output/playwright/mainline-a-m5-20261023/20261023-pointer02/receipt.json)覆盖三视口必要按钮真实命中与操作。[审阅开启 HTTP21](./mainline-a-m1-http-enabled-20261023-m5http21.json)及[默认关闭 HTTP20](./mainline-a-m1-http-default-off-20261019-m5http20.json)保留各自实际请求和资产检查范围。
- **两次完整长测：** [桌面 long07 原始 raw](../../../output/playwright/mainline-a-m5-longrun-20261028-m5long07/desktop-browser-raw.json)为 1,802,002.935 ms，[移动 mobile08 原始 raw](../../../output/playwright/mainline-a-m5-longrun-20261028-m5mobile08/mobile-browser-raw.json)为 1,802,006.305 ms；各自独立新浏览器／context、同一 build15、六窗完整路线、固定实际质量档及 DPR 1。[双端配对验收](../../../output/playwright/mainline-a-m5-pair-20261028-adjudication02/audit.json)实际通过原 non-DOM 验收、时钟、帧目标、资源／heap／尾窗、会话链与严格容量复核。桌面／移动 rAF 间隔 p50 为 6.965／6.955 ms，p95 为 7.145／7.130 ms；它们不是 renderer FPS 或实体手机性能。原保护策略保持每 15 秒定时检查至少 2 GiB 物理、2 GiB 提交余量及 10% 比例，实际查询间隔保留在原日志。
- **DOM 显式补充裁决：** [原始机器分析](../../../output/playwright/mainline-a-m5-pair-20261028-adjudication02/original-machine-analysis.json)中的 `ok=false`、DOM `false／review-required` 保留。桌面依据 [dom02 独立复核](../../../output/playwright/mainline-a-m5-20261028/dom02-independent-review01.json)的同构建六轮连接树／监听器稳定及自然恢复；移动依据 [同一正式会话的自然停留](../../../output/playwright/mainline-a-m5-longrun-20261028-m5mobile08/mobile-dom-settle.json)，60／120 秒均回到首轮运行基线以内（1661 nodes／4371 listeners，R65 持续 running）。未请求强制 GC，不增加计数容差，不证明原桌面末窗精确 GC 因果或不存在任何未观测泄漏。配对结论显式关联这些材料，未改写原机器结果。
- **当前测试与最终绑定：** [单设备采集及既有工具 48/48](../../../output/playwright/mainline-a-m5-20261028/single-device-tool-tests01.log)、[离线配对工具 8/8](../../../output/playwright/mainline-a-m5-20261028/pair-adjudicator-tests01.json)通过；[build15 应用 30 项定向检查与 lint](../../../output/playwright/mainline-a-m5-20261019/final15-app-validation.json)及生产构建按相同源码继续适用。[最终共同指纹](../../../output/playwright/mainline-a-m5-20261028/final-common-binding04.json)17 项检查通过，完整核对 2465 个源码输入，并复核 717 项唯一文件指纹，覆盖 306＋15 张图、117 保护输入、31 资产、6 metadata、3 编译产物及构建／工具／证据绑定；[冻结清单](./mainline-a-m5-candidate-freeze-20261028.json)另外保留最终交付入口和 733 项证据指纹。此前 42／37／32／70 项工具记录及 smoke03 只按各自历史版本使用，不累计代签。
- **失败与审阅入口保留：** long01–long06、[long07 整体 failed 及不足 30 分钟的移动中断](../../../output/playwright/mainline-a-m5-longrun-20261028-m5long07/attempt.json)、[dom01 部分诊断失败](../../../output/playwright/mainline-a-m5-dom-diagnostic-20261028-dom01/attempt.json)与[首个配对预检容量停止](../../../output/playwright/mainline-a-m5-pair-20261028-adjudication01/attempt.json)均保留，不改判成功。启动／停止、工作区依赖链接与受控默认关闭回退见[最终交付入口](./mainline-a-m5-candidate-delivery-20261028.md)和[本机审阅文档](./mainline-a-art-local-review-20261024.md)。

**完成边界：** 本地候选技术冻结已完成，保持 `candidate-only`、`hold`、`not-admitted`、`scientificPayloadWriteback=false`。人工美术、逐图权利、实体设备、科学有效性、公开发布及后续 Beta 扩容不由本次技术验收自动批准。下方 28–46h 等数字均为历史工作包预算，不是当前剩余工时或日期承诺。

<!-- END: MAINLINE_A_CURRENT_SNAPSHOT -->

<!-- BEGIN: MAINLINE_A_HISTORY_20261019_FINAL15 -->
**2026-10-19 build15 历史快照（原文保留；blocked、未运行、进程终态及接续顺序仅对应当时）**

**2026-10-19 当前快照：build15 已完成展示修复、定向验证、HTTP、两端 WebGL 恢复和 15 张响应式实拍；完整 A36 同构建复验仍未完成。本轮重负载执行因实际容量不足结束。** 用户授权的开发与采集已实际执行；Goal 尚未完成，工具仍是此前的 blocked 记录，不声称 active 或 complete。本回合内多次采集尝试不能当作三个连续 Goal 回合，也不据此作新的 blocked 审计。[Goal 现场记录](../../../output/playwright/mainline-a-m5-20261019/final15-goal-observed.json)仅记录状态，未变更状态。后续只更新本 BEGIN/END 块，下方历史原文保持原时点含义。

**实际画面入口：** [Sirius A、Orion、M42 桌面／移动六图预览](./mainline-a-current-art-preview-20261019.md)来自同一 build15 的 responsive15b 实际运行原图，尺寸为 1440×900／430×932。六图是当前可审看的有限交付，不替代完整 A36 和长测。

- **最终保留源码为 build15：** Build ID qg3f2Z6WY5qYWfo3vEjmq，源码 183482b4a793d6d4e22ade276d3bfd301155f809a3618b5ed07102c0a1441b60。已修复移动菜单裁切、NGC2237／M20 两条图像说明问题，以及平板／手机工作台、天体档案与顶徽标遮挡。保留 [build15 构建收据](./mainline-a-r85-build-20261019-m5web15.json)、[源码／暂存输入审计](../../../output/playwright/mainline-a-m5-20261019/final15-source-audit01.json)及[两条说明的官方来源核对](../../../output/playwright/mainline-a-m5-20261019/m3-image-notes-source-review.json)；本次未修改科学数据或权利状态。
- **当前定向检查：** [5 个应用文件 / 30 项测试及 2 文件 lint](../../../output/playwright/mainline-a-m5-20261019/final15-app-validation.json)、[9 个工具测试文件 / 70 项测试](../../../output/playwright/mainline-a-m5-20261019/final15-tools-validation.json)通过，源码前后一致；工具记录绑定最终采集脚本版本。这是定向检查，不是全仓测试。[审阅开启 HTTP19](./mainline-a-m1-http-enabled-20261019-m5http19.json)和[默认关闭 HTTP20](./mainline-a-m1-http-default-off-20261019-m5http20.json)各完成 40 次实际请求。
- **build15 专项实拍已完成：** GL15 桌面／移动模拟共 2 case 通过，真实丢失／恢复事件、同一 canvas/context、恢复绘制和清理均经[独立复核](../../../output/playwright/mainline-a-m5-20261019/final15-webgl-audit.json)。[responsive15b](../../../output/playwright/mainline-a-m5-responsive15-20261019/attempts/20261019-responsive15b/receipt.json)完成 9 张默认视图＋6 张未选／关闭档案辅助图；[独立审阅实际查看全部 15 张原图](../../../output/playwright/mainline-a-m5-20261019/responsive15b-visual-audit.json)，9 个串行自有浏览器均已关闭。此为有限尺寸和交互状态覆盖，不替代 A36 的 306 图矩阵、实体设备或性能验收。太阳系地球标签靠近徽标、关闭档案后底部卡片与风格条的局部重叠保留为后续精修项，未写成已关闭或整体“顶级美术”通过。
- **build15 全矩阵仍是部分／未运行：** [M2 full03](../../../output/playwright/mainline-a-m5-stars-final15-20261019/after/attempts/20261019-m2full03/failure.json)实际完成 14 个主对象设备组（桌面 12＋移动 2）和 4 个桌面别名，共 36 个视图，随后因资源保护中止；19 次浏览器 launch 均已断开，后续移动对象仍缺，不补签为完整 M2 通过。[M3 full03](../../../output/playwright/mainline-a-m5-nebulae-final15-20261019/after/attempts/20261019-m3full03/failure.json)在首个 M42 默认图之前触发资源保护，主视图为 0，非成功。M4 full09 未启动：串行命令在 M2 失败后退出。orbitui15 最终回归未跑，final15 的完整 306 图画廊及浏览器检查未生成；两次独立至少 30 分钟的长测均未启动，最终冻结未完成。
- **build12 的完整历史候选仍有效：** M2 full02 为 56 图，M3 full02 为 138 图，M4 full08 为 112 图，合计 36 对象／72 设备组／306 原图；[原画廊](../../../output/playwright/mainline-a-m5-final12-20261019/gallery.html)及[同构建审计](../../../output/playwright/mainline-a-m5-20261019/final12-matrix-gallery-audit.json)保留。其真实桌面／移动画廊检查和 orbitui07 的 26 主状态＋8 补充状态均只属于 build12，不转授 build15。
- **失败与执行策略原样保留：** build13 因构建期间 HUD 换行归一化导致源码漂移而失败；responsive14 的工具 selector 失败、responsive14b 的真实手机按钮碰撞分别保留。responsive15 先因资源触线失败（14 图的[有限视觉复核](../../../output/playwright/mainline-a-m5-20261019/responsive15-partial-visual-review.json)不代替成功），随后用新 run ID 的 responsive15b 完整通过。采集器改为每个完整 case 使用独立浏览器，内部重试／切换／旅程／返回流程及原检查不变，见[独立静态复核](../../../output/playwright/mainline-a-m5-20261019/fresh-browser-case-review.json)。此策略仅作功能／视觉开发，不将任何旧失败重判，不宣称跨 case 耐久性或长时性能通过。

**资源与进程终态：** 功能／视觉采集显式采用 constrained-development，10 秒采样，至少 1 GiB 物理余量、1.5 GiB 提交余量及 4% 提交比例；默认执行和性能长测保持原 2 GiB 物理、2 GiB 提交、10% 提交比例门槛。[M2 后三次标准容量观测](../../../output/playwright/mainline-a-m5-20261019/final15-post-m2-capacity01.json)均失败；M3 最后约 0.966 GiB 物理余量、0.887 GiB 提交余量，两条开发保护线均未达到。根任务已按 PID 40120／父进程 10548 核对并关闭自有 build15 预览，执行会话 92578 已确认退出码 1（主动停止服务）；旧 build14 预览会话 62671 和默认关闭服务会话 97765 也已确认退出码 1，均属自有服务关闭终态，不撤销既有构建或浏览器证据。其他任务进程未操作。

**接续顺序及预算：** 保持 build15 最终源码；资源出现稳定窗口后，核对保留构建的实际运行身份，使用新的输出目录和 run ID，依次重新完成 M2／M3／M4 同构建全矩阵、orbit UI 最终回归、306 图画廊及真实浏览器检查，再以原标准完成桌面／移动模拟各一次独立 ≥30 分钟长测和候选冻结。不得覆盖或复用既有 run ID，也不得把本次部分采集拼成全量通过。继续保持 candidate-only、hold、not-admitted、scientificPayloadWriteback=false；人工审美、逐图权利、实体设备与公开发布待审。**28–46 个有效工程小时仍是既有工作包预算，不从本次更新重启、不作为滚动剩余工时，也不是自然日期承诺。**

本轮可直接续做的源码、工具指纹、完成项、资源失败与清理记录见 [build15 续做交接](../../../output/playwright/mainline-a-m5-20261019/final15-resume-handoff01.json)。

<!-- END: MAINLINE_A_HISTORY_20261019_FINAL15 -->

<!-- BEGIN: MAINLINE_A_HISTORY_20261019_2135 -->
**21:35 历史快照（原文保留，不作为当前执行入口）**

**21:35 最新执行补记：** 用户已要求“继续在当前内存情况开发”，本回合正在实际续做，无需再次批准；Goal 工具仍记录 blocked，不声称 active 或 complete。build10（源码 `8f9db978856fcf63972401a585c1a154e4e9cf889a09b8b403a511d2235c19c8`）构建及 orbitui05 两端 26 主状态通过，但实际看图发现移动菜单左侧裁切。修复后的 [build11](./mainline-a-r85-build-20261019-m5web11.json) 已以单 worker 成功：Build ID `4_eBSSMLJi8E9cFbd7Ja-`，源码 `1f821f23dc1a33f3b9623a859d1638235c6296f03e8c4f3342aacf99e8f4647f`；当前 HUD 7 项定向测试、lint、9 文件 / 70 项 Node 工具测试，以及 [m5http13](./mainline-a-m1-http-enabled-20261019-m5http13.json)／[m5http14](./mainline-a-m1-http-default-off-20261019-m5http14.json)各 40 请求通过。旧 477 项应用回归属于 build10，不能写成 build11 全套重跑；源码身份见 [final11 审计](../../../output/playwright/mainline-a-m5-20261019/final11-source-audit01.json)。

orbitui06 保存桌面 13＋移动 10，共 23 个主状态，整次因提交余量不足失败；360／390／430px 的菜单边界实际通过，[8 张原图复核](../../../output/playwright/mainline-a-m5-20261019/orbitui06-visual-review.json)确认三尺寸菜单裁切关闭，但不扩大为完整回归、A36 响应式或人工美术认可。本状态快照中 M4 full07 正在执行，未写入通过结论；M4／M3／M2 完整同构建矩阵、306 张画廊、9 张响应式补充、GL、两次独立至少 30 分钟长测与冻结仍 pending。

本次功能／视觉实拍显式使用 `constrained-development`，每 10 秒要求至少 1 GiB 物理、1.5 GiB 提交余量及 4% 提交比例；这是最新用户要求下的开发档位，不是性能验收。默认与性能长测仍保留 2 GiB 物理、2 GiB 提交、10% 提交比例原门槛，历史失败不重判。工时仍是下列工作包的范围预算，不据本次通过次数新增日期承诺；详细证据和续做入口见 [M4/M5 最新交接](./mainline-a-m4-m5-delivery-draft-20261015.md)。

<!-- END: MAINLINE_A_HISTORY_20261019_2135 -->

**以下 20:33 补记、初稿阶段位置及容量观测均为历史快照；其中 active、待 build09／build10 等描述不是最新状态。原工作包范围与估算保留，资源执行规则按本次补记及风险条目更新。**

**20:33 执行补记：** 本计划之后已实际完成 build09、其定向检查/HTTP 和桌面 8 状态浏览器尝试；发现对象浏览器与图层菜单同时显示，随后修复三个展示组件。最新源码待 build10，当前 34 文件 / 477 项应用回归与 26 文件 lint 通过。资源再次不足，且同一条件已在本次恢复后的三个连续回合出现，Goal 已由工具确认 blocked、未完成。此为执行进展和外部资源等待，不代表美术精修已经完成；下文 active、待 build09 和此前容量数据属于写作时状态。最新入口见 [M4/M5 交接](./mainline-a-m4-m5-delivery-draft-20261015.md)及[当前恢复记录](../../../output/playwright/mainline-a-m5-20261019/final10-resume-handoff01.json)。

**2026-10-19 初稿历史预算：以现有网页版 A36（12 恒星、12 星座、12 星云）达到高完成度、可完整审看的美术候选为目标，当时预计还需 28–46 个有效工程小时。按每天 8 小时有效投入折合约 4–6 天，原安排建议预留 6–8 个工作日投入窗口。机器资源等待、用户审阅及外部资料等待另计。这组数字不是 10 月 24 日的剩余工时。**

这是按剩余工作包估算的预算，没有可靠的历史实施速率支持自然日期承诺。“顶级”最终须由实际画面和连续体验审阅决定，不能由测试数量或截图数量认定。当前技术收尾与进一步美术精修分别管理，不能在技术收尾后直接宣称美术品质已获认可。

## 2026-10-19 初稿时的位置（历史）

| 部分 | 已有成果 | 尚未关闭 |
|---|---|---|
| M0 / M1 | 基线与 Sirius A、Orion、M42 桌面/移动六图阶段交付 | 最终版本复核、进一步视觉精修和用户审阅 |
| M2 | A12 恒星共享呈现及阶段交付 | 当前最终构建复验；发光、临边、纹理尺度与形态差异精修 |
| M3 | A12 星云观看、放大、来源、切换与失败恢复的阶段交付 | 当前最终构建复验；原图画幅、背景和说明层级精修 |
| M4 | 星座与五站旅程已实现；旧 full05 有 112 张功能矩阵原图 | 移动画面干扰修复及两处 UI 修复的新构建闭环；旅程视觉节奏精修 |
| M5 | 旧构建已有定向测试、构建与 HTTP 证据 | 当前源码完整同构建矩阵、画廊、尺寸补充、GL 恢复、两次独立至少 30 分钟长测与冻结 |

本次通过 Goal 工具核对状态为 **active、未完成**。当前待 build09：最近两处生产修复分别处理图层菜单被天体档案拦截点击、退出聚焦后残留旧尺度提示。两文件当前 SHA 与交接记录一致；它们尚未取得新构建中的浏览器闭环。build08 的通过记录不能代替当前源码验收。

本次实际重看三个历史运行图：M2 桌面 Sirius A、旧星云最终尝试的桌面 M42、full05 移动 Orion。它们来自不同构建，只用于判断精修重点，不组成当前六图验收。我的视觉判断是：Sirius 的球面明暗、表面与外部光晕关系仍有改进空间；M42 的原始图像很有表现力，但银河背景、图像画幅与旁侧说明还需协调；Orion 移动主体已经可读，背景、线条和标签仍可形成更鲜明的主次。

最近一次有界容量观测共 5 次，4 次达标、1 次提交余量不达标，最长连续通过 2 次，未达到既定连续 3 次的恢复条件。观测会话已确认退出码 0；本次没有启动新测试、构建或浏览器。此结果表明资源有所改善，不证明能支撑两次长测，也不算产品进展。

## 五个工作包（原预算保留，当前执行状态见顶部快照）

| 顺序 | 有效工时 | 可见交付 | 退出条件 |
|---|---:|---|---|
| 1. 关闭当前技术收尾 | 旧预算 4–8h，非当前剩余工时 | 保留源码一致的 build15、已生成的完整实际运行画廊；补齐实际剩余门槛后形成技术候选记录 | 沿用适用的矩阵、旅程、异常、GL、尺寸和 UI 证据；必要按钮 pointer02 与短流程 smoke03 已通过，后者不计长测资格；补齐 long04 内桌面与移动模拟共两次正式观察验收及最终共同绑定；产品源码变化时才需要新构建 |
| 2. 精修三类样板 | 6–10h | Sirius A、Orion、M42 桌面/移动六张同视角运行对照；另用 Betelgeuse、Vega、Achernar 校准差异 | 主体、发光、背景、文字和操作层级有具体可见改善，记录用户审阅意见或明确 pending |
| 3. 推广到 A36 | 8–12h | 36 个对象共享视觉规则，保留对象个性 | 不同星云画幅、复杂星座、长名称及移动面板逐项检查；不只精修三个代表对象 |
| 4. 打磨五站旅程 | 4–6h | Orion → M42 → B33 → Betelgeuse → Rigel 连续体验 | 进入、停留、前后切换、打断恢复、返回及减少动画模式可用且节奏协调 |
| 5. 冻结精修版本 | 6–10h | 最终版本实拍画廊、体验入口、缺陷关闭清单与交付说明 | 精修后的新源码取得对应验证；用户美术意见逐项记录，未获审阅不代签 |
| 合计 | **28–46h** | **A36 高完成度展示候选** | **约 4–6 个八小时有效开发日** |

现有 M3–M5 Goal 仍以[原美术主线规划](./mainline-a-art-master-plan-20261014.md)的必需美术、完整画幅、来源、选择／旅程／返回和可用性要求为准；真实阻断缺陷不能归入“后续精修”后绕过。上述工作包保留为原安排：新增风格迭代和额外精修可另排，用户人工美术审阅未发生时明确 pending。只有本轮所有必需条件实际达成才形成技术候选冻结，不从测试或图片数量推导整体“顶级美术”认可。未变化且仍适用的通过项不无故重复，源码变化则运行受影响检查和最终所需验收。

2026-10-19 原工时安排为：第 1 个有效开发日争取完成技术收尾；第 2–3 日形成样板六图；第 3–5 日推广 A36 并打磨旅程；第 6 日及预留的第 7–8 日用于最终复验和有明确清单的返工。这是历史投入顺序，不从本次更新重新起算，也不是当前完成日期承诺。

## 美术完成标准

- **恒星有发光感和个性。** 协调球面明暗、临边、表面纹理与光晕；蓝热星、红巨星、快速自转对象有可辨认差异，主场景与图卡一致。艺术表面不当作观测事实。
- **星座主次清楚。** 聚焦时背景退后，关键星、连线、标签、正式边界分别可读；操作和资料不遮挡主角。保留原目录位置和边界数据。
- **星云成为画面主体。** 保留原图比例、信息和必要署名，协调图像画幅、周边暗场与说明；看全图、放大细节、查来源和返回自然衔接。
- **桌面与移动均有完整构图。** 主图与单一主要面板协调，关闭详情后恢复观看；按实际覆盖记录各尺寸，360px 旅程检查不能替代 A36 全量窄屏检查。
- **旅程有节奏且可控制。** 以连续真实操作判断过渡、停留、打断及返回，不从静态图推导动态体验通过。

首轮样板以六图及短连续旅程作为反馈入口；每次精修附可见变化及剩余问题。最多安排两轮有明确缺陷清单的精修；用户尚未审阅则标记 pending，不以代理判断替代用户认可。

## 风险、调整与停止条件

1. **4–8h、8–16h 及总量 32–54h 是 10 月 19 日的历史预算场景。** 它们不自动变成当前剩余工时；若实际补充检查、资源释放或长测再暴露问题，按具体缺陷重新估算必要工作，不持续滚动承诺“再几小时”。
2. **机器资源是当前关键依赖。** 性能长测及默认执行保持原资源门槛；功能／视觉实拍按用户最新要求显式采用上文开发档位，不能据此认定性能通过或重判旧失败。不足时保留失败记录，不关闭其他任务或用重复无变化审计制造进展。性能长测缺少稳定窗口时，日历完成日期仍不能可靠计算。
3. **每批必须关闭可见问题或交付可用对象。** 连续两个开发批次没有此类进展，先调整工作重心，停止增加与已知问题无关的审计工具。
4. **样板方向未稳定，不盲目批量推广。** 两轮精修仍无法形成方向时，列出具体分歧，重新固定样板和预算；不无限微调全部 36 个对象。
5. **冻结后新增内容另排。** 技术冻结后只修阻断项；更多天体、新背景、体积星云和全新电影系统不挤入本次预算。

## 更大的“顶级宇宙”范围

完整 Beta 为 24 恒星 / 12 星座 / 24 星云；在 A36 风格确认后，可暂留 **16–32h 增量工程预算**，正常情形总量约 **44–78h**。这是较低置信度估算，身份、素材、权利缺项本次未重新查证，外部等待不能被该预算吸收。

可穿行体积星云、行星地表与全新电影镜头系统是新的三维产品范围。先制作一个独立样板并验证性能，才能估算全量工作，不能包含在上述一周左右的网页美术安排中。

公开发布还取决于用户视觉审阅、素材适用权利及要求的真实设备验证。当前继续保持 candidate-only、hold、not-admitted、scientificPayloadWriteback=false；本计划不授予发布或科学验收。

## 依据

- [原美术主线规划](./mainline-a-art-master-plan-20261014.md)
- [当前 M4/M5 交付草稿与最新执行入口](./mainline-a-m4-m5-delivery-draft-20261015.md)
- [上一版工作包估算](./mainline-a-art-remaining-plan-20261018.md)
- [2026-10-19 历史源码与恢复状态](../../../output/playwright/mainline-a-m5-20261019/resume-turn01.json)
- [2026-10-19 历史五个容量样本](../../../output/playwright/mainline-a-m5-20261019/capacity-resume02.jsonl)
- [Sirius A 历史运行图](../../../output/playwright/mainline-a-m2-20261015/after/desktop-sirius-a-default.png)
- [M42 历史运行图](../../../output/playwright/mainline-a-m5-nebulae-final-20261015/after/desktop-m42-default.png)
- [Orion 移动历史运行图](../../../output/playwright/mainline-a-m4-20261015/attempts/20261018-m4full05/mobile-Ori-default.png)

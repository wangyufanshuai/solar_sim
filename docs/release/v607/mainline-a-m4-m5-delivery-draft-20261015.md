**Solar Sim · M4 / M5 交付记录｜本地候选已冻结｜2026-10-28 更新（Asia/Shanghai）**

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

**2026-10-19 21:35 最新续做状态：用户已要求“继续在当前内存情况开发”，本回合正在实际开发与采集；Goal 工具仍记录 blocked，不据此声称 active 或 complete。** 不需要再次申请相同授权。下方 20:33 及更早段落全部保留为历史；其中“当前”“恢复顺序”和待构建编号只对应当时，最新入口以本状态块为准。

- **build10 已成功并完成两端 orbitui05 的 26 个主状态。** 源码为 `8f9db978856fcf63972401a585c1a154e4e9cf889a09b8b403a511d2235c19c8`；实际看图随后发现移动端图层菜单左侧裁切，因此功能通过不等于视觉验收。保留 [build10](./mainline-a-r85-build-20261019-m5web10.json) 与 [orbitui05 原始收据](../../../output/playwright/mainline-a-m5-20261018/orbit-layer-ui-20261019-orbitui05/receipt.json)。
- **移动菜单修复后的 build11 已以单 worker 构建成功。** Build ID 为 `4_eBSSMLJi8E9cFbd7Ja-`，源码为 `1f821f23dc1a33f3b9623a859d1638235c6296f03e8c4f3342aacf99e8f4647f`。当前变更的 HUD 7 项定向测试和 lint 通过，9 文件 / 70 项 Node 工具测试通过；旧 477 项应用回归属于 build10，不写成 build11 全套重跑。见 [build11](./mainline-a-r85-build-20261019-m5web11.json)、[HUD 验证](../../../output/playwright/mainline-a-m5-20261019/mobile-layer-fix-handoff01.json)、[工具验证](../../../output/playwright/mainline-a-m5-20261019/final11-browser-tools-result.json)、[源码与 staging 审计](../../../output/playwright/mainline-a-m5-20261019/final11-source-audit01.json)。[开启审阅 m5http13](./mainline-a-m1-http-enabled-20261019-m5http13.json)与[默认关闭 m5http14](./mainline-a-m1-http-default-off-20261019-m5http14.json)各 40 次实际 HTTP 请求通过。
- **orbitui06 保存了桌面 13＋移动 10，共 23 个主状态；整次尝试因提交余量不足而失败。** 不将部分状态补签为完整 26 状态通过。360／390／430px 三种手机宽度的菜单边界实际通过；[8 张原图视觉复核](../../../output/playwright/mainline-a-m5-20261019/orbitui06-visual-review.json)确认这些尺寸的菜单裁切已关闭，并有限复核两端导航互斥。见[失败原始记录](../../../output/playwright/mainline-a-m5-20261018/orbit-layer-ui-20261019-orbitui06/failure.json)；这不是 A36 全量响应式或人工美术验收。

**本次资源执行策略：** 基于最新用户要求，功能／视觉采集显式采用 `constrained-development`：每 10 秒检查至少 1 GiB 物理余量、1.5 GiB 提交余量及 4% 提交比例；触线保留失败并清理所属浏览器。默认配置和性能长测继续使用原 2 GiB 物理、2 GiB 提交、10% 提交比例门槛，开发档位不能作为性能通过证据，也不重判任何历史失败。见[开发档位与验证记录](../../../output/playwright/mainline-a-m5-20261019/constrained-browser-guard-result01.json)。

**下一交付仍未完成：** 本状态快照中 M4 full07 已启动、正在执行，不预写成功；之后仍需 M4／M3／M2 同构建完整矩阵、306 张主画廊及浏览器检查、独立 9 张响应式补充、真实 GL 丢失／恢复、两次独立至少 30 分钟长测，以及候选冻结。继续保持 candidate-only、hold、not-admitted、scientificPayloadWriteback=false；人工视觉、权利、实体设备与公开发布仍待审。

<!-- END: MAINLINE_A_HISTORY_20261019_2135 -->

**以下为 20:33 及更早的历史原文，不作为最新执行状态。**

**2026-10-19 20:33 当前状态：Goal 已由工具确认 blocked，未完成；当前源码待 build10。** 本次恢复后的三个连续回合均出现同一主机资源条件，已通过 `read_thread` 核对。本回合曾获得稳定窗口并完成实际构建、浏览器与产品修复，不能描述为三个回合完全无进展；但最终五个容量样本均失败，11:32:17 UTC 的现场复核仍只有约 1.71 GiB 物理余量、1.24 GiB 提交余量（约 3.17%）。已完成可独立执行的定向回归，新的构建与浏览器验收需外部资源状态恢复。见[当前交接与三回合审计](../../../output/playwright/mainline-a-m5-20261019/final10-resume-handoff01.json)、[Goal 工具确认](../../../output/playwright/mainline-a-m5-20261019/final10-goal-blocked01.json)。下方各时点状态均为历史，最新状态以本段为准。

本轮 **build09**（`7-7O4nrihPRq5I-c7-zEW`，source `ffa8bdb6cd58048ea98299e34450b5d3e0e5106fe5a2a1d6f8a696c925c21c1a`）完成 33 文件 / 470 项应用测试、9 文件 / 65 项工具测试、25 文件 lint、构建和两种模式各 40 请求的 HTTP 检查，详见 [build09 预审](../../../output/playwright/mainline-a-m5-20261019/final09-preflight-audit.json)。随后 orbitui04 实际完成桌面 8 个主状态，移动 0；旧点击遮挡和退出黄字已通过有限实拍复核，但打开对象浏览器后图层菜单仍显示，整次浏览器尝试失败。[六张桌面实际图复核](../../../output/playwright/mainline-a-m5-20261019/orbitui04-visual-review.json)不扩大为完整或移动验收。

新修复将实际对象浏览器挂载/展开状态经 Workbench、Dock 传给 HUD，同时保留原 navigator session；导航打开时隐藏图层并清除旧打开状态，关闭后不自动复活菜单。相对 build09 仅修改三个生产展示文件，无删除，无科学数据写回；当前 2465 输入 SHA 为 `8f9db978856fcf63972401a585c1a154e4e9cf889a09b8b403a511d2235c19c8`。[当前源码定向验证](../../../output/playwright/mainline-a-m5-20261019/final10-source-tests.json)实际完成 **34 文件 / 477 项应用测试、26 文件 lint**，前后源码一致；[独立代码审查](../../../output/playwright/mainline-a-m5-20261019/hud-browser-fix-code-review01.json)无阻断。新增测试是组件 render/effect/handler harness，不代替真实键盘和指针操作。原容量门槛未修改；build10、其 HTTP 和浏览器均未执行。

**当前恢复顺序：** 恢复现有 Goal 并取得稳定资源窗口后，先对上述源码构建 build10，再运行两种 HTTP、完整桌面/移动 orbitui05、M4/M3/M2 同构建完整矩阵、306 图画廊实际浏览器检查、独立九图尺寸补充、真实 GL 丢失/恢复、两次独立至少 30 分钟长测，最后完成候选冻结。当前 477 项定向检查不因未改源码而无故重跑；65 项工具测试只按实际代码适用性引用。所有旧失败保留。根代理已核对并关闭自己创建的 3151 / 3152 预览，两执行会话均终态，端口监听为 0；本次浏览器已随失败清理，未操作其他任务进程。

**2026-10-19 20:10 恢复状态：Goal 已恢复 active，未完成。** 本次为重新恢复后的首个受阻回合，不能沿用昨日三回合计数。当前 2465 个源码输入仍精确匹配 `ffa8bdb6cd58048ea98299e34450b5d3e0e5106fe5a2a1d6f8a696c925c21c1a`；8 个交接指纹、31 图、6 份元数据、117 个保护文件均未漂移。8 次容量观测中 7 次失败、只有 1 次短暂达标，末次可用物理内存约 1.61 GiB、提交余量约 5.26%，尚无稳定运行窗口。没有启动新测试、build09、HTTP、预览或浏览器；端口 3151/3152 未见监听。有界容量观测会话已正常结束，恢复核对不算新验收通过。见[本次恢复记录](../../../output/playwright/mainline-a-m5-20261019/resume-turn01.json)和[素材/工具复核](../../../output/playwright/mainline-a-m5-20261019/resume-static01.json)。下文 blocked 与 active 均属对应历史时点；最新 Goal 状态以本段为准，工作范围与恢复顺序不变。

**11:44 最终状态：Goal 已由工具确认标记为 blocked，未完成。** 最新[三回合阻断审计](../../../output/playwright/mainline-a-m5-20261018/final09-blocked-audit01.json)经 `read_thread` 核对连续三个恢复回合，分别对应 full04、orbitui02 和本轮资源观测；中间取得的生产修复与实拍进展仍保留。11:44:24 再次现场检查，物理余量约 2.72 GiB，但提交余量比例约 9.66%，仍不满足原 10% 门槛。本轮所有可独立完成的展示修复与定向检查已保存，后续新构建及实际浏览器验收依赖持续资源余量，故执行停止规则；参见[工具确认及恢复记录](../../../output/playwright/mainline-a-m5-20261018/final09-goal-blocked01.json)。以下 active 描述是本轮修复期间的历史状态，不代表最终 Goal 状态。资源稳定后应恢复现有 Goal，并沿下列 build09 顺序续跑，不将其标为完成或缩减范围。

**2026-10-18 当前状态：两处 UI 修复已写入，待 build09；Goal active，未完成。** 当前源码 SHA 为 `ffa8bdb6cd58048ea98299e34450b5d3e0e5106fe5a2a1d6f8a696c925c21c1a`，相对 build08 仅 `AtlasScaleNavigatorV260.tsx` 与 `OrbitAtlasHud.tsx` 两份生产文件修改、0 删除，见 [final09-precheck.json](../../../output/playwright/mainline-a-m5-20261018/final09-precheck.json)。**build09 尚未执行，新的 33 文件定向回归、对应 HTTP 和浏览器检查均未执行，不能使用 build08 的验收补位。**

[orbitui03 原始失败记录](../../../output/playwright/mainline-a-m5-20261018/orbit-layer-ui-20261018-orbitui03/failure.json)绑定 build08/source08：已完成桌面 7 个状态、7 张原图，各状态检查通过；移动端 0 状态、0 图，整次尝试仍失败。根代理实际查看 01 初始开启、02 聚焦 UMa、03 退出三张原图，确认聚焦时太阳系标签/参考轨道消失，退出后恢复。不能把这三张视觉复核扩大为全部 7 张视觉通过，也不能把 7 个状态记为完整浏览器回归。

同次尝试还暴露两处 UI 问题：03 退出后显示过期的“Selection passport retained”黄字，原因是显示读取旧尺度旅程的对象状态；08 在焦点内修改开关时，实际点击被天体档案 header 拦截并超时。当前已修改导航展示以按当前对象和显示尺度派生状态，并修复 HUD 图层菜单与天体档案的交互层次；不改 store、物理或科学数据。[导航组件定向测试](../../../output/playwright/mainline-a-m5-20261018/ui-fix-tests01.log)9 项通过，两组件 lint 均退出 0（HUD 的执行结果由根代理记录）。这些只是定向验证，两项修复尚未取得新构建中的浏览器闭环。

GL 采集工具已接入原有 15 秒容量保护，在启动前、launch 前后、新 context 前和成功收尾检查，只关闭自己创建的浏览器，样本独占写入本次目录；[原有 4 项 GL 工具测试](../../../output/playwright/mainline-a-m5-20261018/gl-guard-tests01.log)通过。GL 判定和容量阈值未改，未运行实际 GL 恢复验收。orbitui helper 的 idle 稳态等待已用于上述 orbitui03 桌面 7 个状态实拍；后来新增的菜单错误现场记录、导航互斥处理和尺度状态断言尚未运行，不能由旧日志代签。

**当前资源终态：有界观测结束，未达到恢复条件。** [capacity-final09-01.jsonl](../../../output/playwright/mainline-a-m5-20261018/capacity-final09-01.jsonl)共 9 个样本，8 个失败、仅第 7 个通过，没有连续 3 次通过；根代理确认执行会话 54057 终态退出码 0。末次 02:40:38.712 UTC 可用物理内存 2,481,000,448 字节（约 2.31 GiB），提交余量 938,930,752 字节（约 0.87 GiB、2.34%），仍低于 2 GiB / 10% 提交余量门槛。此前 02:39:17 UTC 物理余量约 1.25 GiB、提交余量约 0.89%。原 2 GiB 物理、2 GiB 提交及 10% 提交比例门槛保持不变；本轮未启动 build09、新全量定向回归或新浏览器。

根代理已核对并关闭自有 build08 预览 PID 14644，执行会话 62758 终止，3151 监听为 0，本次浏览器已关闭；未操作其他任务进程。本轮有实际生产修复和实际运行记录，Goal 保持 active，没有标为 complete、paused 或 blocked。[工期规划](./mainline-a-art-remaining-plan-20261018.md)仍为既定 28–46h / 4–6 个有效开发日的范围估算，资源等待另计，不扩展 Beta 或承诺无条件日期。

**历史 build09 恢复入口（已被顶部 CURRENT_SNAPSHOT 取代）：先验证新源码，再继续同构建验收**

当时恢复身份、两处生产修复、工具与日志指纹、有限实拍证据、容量终态及自有进程清理记录见 [final09-ui-fix-handoff01.json](../../../output/playwright/mainline-a-m5-20261018/final09-ui-fix-handoff01.json)。下面五步是旧 build09 历史指令，不作为当前重建或重跑要求。

1. 容量持续满足原门槛后，先完成当前源码的 33 文件定向回归及必要 lint，再以新 run ID 执行 build09；确认构建前后源码稳定并保存真实 Build ID/runtime ID，不能预填成功。
2. 对实际成功的 build09 分别完成审阅开启与默认关闭 HTTP，复核运行身份、资产和候选边界；随后运行全新 orbitui04，覆盖桌面和移动设置、退出恢复与焦点内实际点击，并逐项查看原图。
3. 两处 UI 修复取得实际闭环后，以同一新构建重跑 M4、M3、M2 完整矩阵，使用独立输出目录和新 run ID；保留 build07 full05 与 build08 orbitui03 原始记录。
4. 生成同构建 A36 画廊并实际浏览器检查，再完成独立九张尺寸补充、桌面/移动 GL 丢失恢复及两次独立至少 30 分钟长测。306 张主清单与 9 张补充图的原范围不变。
5. 最后核对同一源码、构建、驱动、原图、时钟、资源与所有异常/返回证据，全部达到原门槛后才生成最终候选冻结清单。

**历史 build07/build08 发现与尝试**

build07 的 [M4 full05](../../../output/playwright/mainline-a-m4-20261015/attempts/20261018-m4full05/receipt.json)完成功能矩阵：24 组星座三视图 72 张、4 种配置旅程 40 张，共 112 张原图。[实际视觉复核](../../../output/playwright/mainline-a-m5-20261018/reviews/m4full05-visual-review.json)查看的 30 张中，移动 UMa、Sco、Cyg、Gem、Leo、Aql 出现太阳系注释与主图重叠，记录为 M4-VIS-01。build08 普通目录焦点展示修复已获[代码复核](../../../output/playwright/mainline-a-m5-20261018/reviews/m4-vis01-code-review.json)；其后 orbitui03 只提供上述有限实拍闭环，不能代表最终 A36 验收。

[orbitui01](../../../output/playwright/mainline-a-m5-20261018/orbit-layer-ui-20261018-orbitui01/failure.json)的按钮唯一性检查失败；补充可见性等待后，[orbitui02](../../../output/playwright/mainline-a-m5-20261018/orbit-layer-ui-20261018-orbitui02/failure.json)在资源预检时停止、没有启动浏览器。它们及当时关闭 PID 47460 的清理属于较早时点，不代表后来没有运行 orbitui03。所有失败记录保留。

**历史候选 build08：以下验证仅绑定 source08**

[构建收据](./mainline-a-r85-build-20261018-m5web08.json)记录成功且构建前后源码稳定；Build ID `U_EywbzEzUFCNjVX6eCop`，runtime ID `mainline-a-cd17c96b331faf39`，源码 SHA `cd17c96b331faf392a34091f34baadd36e1d5d745b246a9ba0f2e44a154b335a`。这些不替代修复后的浏览器及性能证据。

| 已完成项目 | 实际记录 | 验证范围 |
|---|---|---|
| 源码与素材预审 | [final08-preflight-audit.json](../../../output/playwright/mainline-a-m5-20261018/final08-preflight-audit.json) | 2465 项当前输入精确匹配 build08；相对 build07 两份生产文件修改、2463 项不变、0 删除；31 图、6 份元数据、117 个受保护文件匹配，失败项为空 |
| 应用定向测试与 lint | [final08-before-build.json](../../../output/playwright/mainline-a-m5-20261018/final08-before-build.json)及预审绑定日志 | 32 文件 / 461 项应用测试通过，23 文件 lint 退出 0；不是全仓测试通过 |
| 采集工具定向测试 | [final08-browser-tools-tests.log](../../../output/playwright/mainline-a-m5-20261018/final08-browser-tools-tests.log) | 9 文件 / 65 项通过；后续临时 orbitui 等待逻辑更改不由这份旧工具日志代签 |
| HTTP 审阅开启 | [m5http07](./mainline-a-m1-http-enabled-20261018-m5http07.json) | 40 次请求，构建、图像/hold 路由和元数据绑定核对通过 |
| HTTP 默认关闭 | [m5http08](./mainline-a-m1-http-default-off-20261018-m5http08.json) | 独立 40 次请求，默认关闭边界及构建绑定通过 |
| 保留运行包 | 预审的 `package` | build08 staging/standalone Build ID、入口、manifest 和 8 项目录联接一致；依赖工作区，非独立可搬运归档 |

**历史状态与 build07 证据（以下时点及待 build09 描述均已被顶部 CURRENT_SNAPSHOT 取代）**

**2026-10-17 历史状态：当时 Goal 已标记 blocked，未完成。** 同一容量不足已连续影响三个恢复回合。第三回合在实际预检通过后启动 build07 和 `20261017-m4full03`；桌面 Orion 三视图及精确返回通过，随后约 16 秒容量检查发现可用物理内存约 1.84 GiB、提交余量约 8.18%，触发原保护门槛。自有浏览器及本次 3151 预览已关闭，其他任务未操作；没有产生完整 M4 通过收据。见[第三回合阻断审计及恢复入口](../../../output/playwright/mainline-a-m5-20261017/resume-blocked03.json)。需外部工作负载释放足够且持续的内存余量后恢复 Goal，复核当前身份与容量，再以新的 M4 full04 运行编号续跑。下方 active 与 paused 的文字分别属于此前时点，不代表本次最终状态。

**2026-10-17 续跑补记：** 用户已恢复现有 M3–M5 Goal，状态为 active。当天[独立恢复审计](../../../output/playwright/mainline-a-m5-20261017/resume-independent-audit01.json)重新核对 2465 项源码输入、31 张本地图像、6 份元数据和 117 个受保护文件，均匹配已有指纹；未新增应用源码变更。M2/M3/M4/画廊采集脚本补齐浏览器启动前后和新 context 前的容量停止检查，[33 项定向工具测试及代码复核](../../../output/playwright/mainline-a-m5-20261017/capture-startup-guard-independent-review01.json)已完成；这不是动态启动故障注入或浏览器矩阵通过证据。下文 10 月 15 日的 paused 状态和进程清理属于当时交接，不能解释为本次仍暂停。最新容量采样保存在 `output/playwright/mainline-a-m5-20261017/capacity-resume01.jsonl`；完整同构建矩阵、GL、长测与最终冻结继续待实际完成。

2026-10-15 的历史交接将当时文件标记为 build07 交付草稿，不是最终通过收据，不宣告 M4/M5 完成，不批准冻结或发布。下列已验证事项来自实际保存的记录；尚未独立审计的浏览器矩阵、GL、画廊、尺寸补充图和两次独立长测继续标为 pending。旧构建的成功或失败都不自动转移为 build07 的验收结果。

2026-10-15 历史交接状态见 [final07-resource-blocked-handoff.json](../../../output/playwright/mainline-a-m5-20261015/final07-resource-blocked-handoff.json)。2026-10-15 10:54:21.006—10:59:27.351 UTC 连续 20 次容量观测中，0 次满足保护门槛、0 次达到重试就绪；末次空闲物理内存为 1,040,871,424 字节（约 0.969 GiB），提交余量为 1,591,734,272 字节（约 4.1943%）。原始 JSONL 已绑定 SHA，2 GiB 物理余量、2 GiB 提交余量和 10% 提交比例门槛保持不变。根代理已关闭本次 3151/3152 预览，未留下本次浏览器；未操作其他任务进程。该历史时点的源码再次精确匹配 build07，补充采集工具已固定指纹、确认启动后与新 context 前的容量停止检查，语法检查通过；这不代表其浏览器采集已运行。

以下为 2026-10-15 原交接的历史续跑顺序：当时 goal 为界面控制的 paused 状态。此历史清单及上方旧 build09 顺序均不作为当前命令入口；当前状态与剩余步骤以顶部 CURRENT_SNAPSHOT 为准：

1. 重启本机 3151 的保留 build07 预览，复核运行标识。
2. 全新 M4 full03 完整矩阵，保留 full02 的部分记录，不将其补签为通过。
3. M3 最终同构建矩阵。
4. M2 恒星与别名最终同构建矩阵。
5. 同构建主画廊及实际浏览器检查。
6. 独立九张尺寸补充图与视觉复核。
7. GL freeze01 丢失/恢复验收。
8. 桌面、移动模拟各一次独立真实 ≥30 分钟长测，顺序执行并保留 raw。
9. 最终源码、驱动、矩阵、原图、时钟和资源独立审计；全部实际门槛通过后才生成最终冻结清单。

**历史候选：build07 当时完成的验证**

[构建收据](./mainline-a-r85-build-20261015-m5web07.json)记录构建通过、退出码 0、构建前后源码稳定；Build ID 为 `_kwikaybvgcSE4HZMAowC`，runtime ID 为 `mainline-a-e76a519e987f6dd5`，源码 SHA 为 `e76a519e987f6dd56d9c51fe3ca14dad7672b5083a509d7a83d200e3740400ee`。构建本身是静态生产构建证据，不替代浏览器与性能证据。

| 已完成项目 | 实际记录 | 验证范围 |
|---|---|---|
| 独立源码预审 | [final07-preflight-audit.json](../../../output/playwright/mainline-a-m5-20261015/final07-preflight-audit.json) | 当前 `captureBuildInputs` 的 2465 项与构建逐项及总 SHA 完全一致；失败项为空；非最终验收 |
| 与 M2 的边界 | [final07-source-boundary.json](../../../output/playwright/mainline-a-m5-20261015/final07-source-boundary.json) | 25 项变化＝14 项修改＋11 项新增，2440 项不变，0 项删除；显式列出的 117 个受保护文件在 M2、当前、build07 和 staging 副本中一致 |
| 定向测试 | [final07-source-tests.json](../../../output/playwright/mainline-a-m5-20261015/final07-source-tests.json) | 29 个 Vitest 文件、423 个用例通过；22 个生产 TS/TSX 文件 lint 无输出、根代理报告退出码 0；9 个 Node 工具测试文件、63 个用例通过。日志和构建指纹已绑定，不称为全仓测试通过 |
| HTTP 审阅开启 | [m5http05](./mainline-a-m1-http-enabled-20261015-m5http05.json) | 40 次请求；31 条候选图像路由、5 条 hold 路由及其他构建/基础路由按既定规则验证，6 个本地元数据指纹匹配 |
| HTTP 默认关闭 | [m5http06](./mainline-a-m1-http-default-off-20261015-m5http06.json) | 独立的 40 次请求，默认关闭边界验证通过；本地临时预览由所属任务关闭 |
| 本地运行与回退路径 | 独立预审的 `packages` | build07 与已交付 M2 的 staging/standalone 入口、磁盘 Build ID、目录联接目标存在；各 142 个静态文件的源/目标路径和长度一致 |

HTTP 两份收据已离线重跑原有校验函数，并核对实际请求所得构建 manifest 与 build07 磁盘文件的字节数及 SHA。独立预审没有重新发出 HTTP 请求、启动浏览器或遍历全部图片字节。运行目录依赖本工作区的 `node_modules`、`public`、`data` 等目录联接，不能称为独立可搬运归档；M2 回退入口存在也不等于本轮启动并验收了回退服务器。

**历史 build09 时点的 M4 待验清单：星座选择与五站观测旅程（旧状态保留，当前结果见顶部快照）**

产品范围为 12 个星座的场景/图鉴视觉一致性，以及猎户座五站旅程。星座连线与 IAU 边界明确区分，主场景只显示选中对象的边界；原有目录、几何和标签不因展示统一而改写。旅程提供上一站、下一站、故事展开、外部选择打断后恢复、返回出发视角和结束。

以下表格保留旧 build09 时点的验收要求与状态；其中“未构建／pending／当前”均为历史，不覆盖顶部已完成的 build15 收据。验收要求继续适用，源码检查不替代实际运行结果：

| 待审项目 | 所需证据 | 状态 |
|---|---|---|
| 候选构建 | 当前源码对应的新 build09 receipt、Build ID、runtime ID、源码 SHA、构建前后稳定性 | 未构建；最终冻结 pending |
| 星座完整矩阵 | 12 个对象 × 桌面/移动 × 默认/图鉴/边界，共预期 72 张原图；逐图身份、样式与构建绑定 | build07 full05 功能通过但六张移动默认图存在视觉问题；当前源码的新构建重跑 pending |
| 旅程完整矩阵 | 桌面、移动、窄屏、减少动态效果 4 个配置；五站、故事、上一站、打断/恢复、返回的真实操作记录 | build07 full05 的 40 图功能记录已完成；当前源码的新构建重跑 pending |
| 返回安全区 | 书签位置与相机姿态核对；返回提示与面板不遮挡目标；视口变化按现有安全区重新处理 | pending |
| 生命周期边界 | provider 卸载、取消与恢复、旧相机书签失效、研究/尺度拒绝、监听与资源清理的定向测试 | 定向测试已记录；真实矩阵 pending |
| 代理视觉检查 | 只引用实际查看的原图及检查记录，保留未查看项与人工签核边界 | full05 已查看 30 图并发现 M4-VIS-01；source08 仅三张实拍视觉复核；当前两项 UI 修复后视觉 pending |
| 失败尝试 | 资源中止、视角未稳定、遮挡等原始记录及后续修复重跑关系 | 历史失败、full05 实拍问题和 orbitui01/02/03 均保留；当前修复闭环 pending |

预期旅程截图清单按现有采集协议为每配置 10 张、共 40 张；最终必须以通过验证的收据为准，不能只按文件数量计为完成。

移动端完整图鉴允许如实显示后台场景 `unobserved`，但仅在实际可见 canvas 扣除实测导航、面板、底部操作区和 8 CSS px 间距后，所有剩余矩形短边均小于 64 CSS px，且完整图卡可见、打开前半屏状态为 `ready`、同对象相机姿态和距离保持在 0.001 容差内时成立。该例外不能用于默认场景、桌面或有可用构图区的情况。关闭图鉴、恢复默认面板后仍须 `ready`、全部星座线段可见、恢复原选择及完整相机姿态；画廊会从观测字段重新计算，不能只信预存的 `allowed` 或 `ok`。

**M5 最终同构建验收与长测（下表状态为历史 build09 时点，当前结果见顶部快照）**

最终交付按以下顺序陈述：可见产品结果、可打开的实际运行画廊、构建与源码边界、定向测试、HTTP 与 GL、三类交互矩阵、两个长测的真实结果、失败记录、剩余人工及权利门槛。每项使用自身证据，不从构建通过推导浏览器或性能通过。

| 待审项目 | 独立审计要点 | 状态 |
|---|---|---|
| 最终源码 | 三类矩阵、GL、HTTP、长测与最终画廊使用同一 Build ID/runtime ID/source SHA；最终检查时源码和驱动未漂移 | build08 预审为历史；当前源码待构建，最终共同绑定 pending |
| 源码范围 | 延续已交付 M2 边界，核对各次新增/修改/删除、受保护合同、材质科学输入、目录及物理数据 | build08 相对 build07 两文件修改已审；当前相对 build08 新增 Nav/HUD 两文件修改，冻结前累计复核 pending |
| 运行路径 | staging/standalone 入口、静态资源和 M2 本机回退路径；工作区目录联接依赖 | 历史 build08 包已检查；当前新构建包待检查，M2 路径有留存复核；非独立归档 |
| HTTP | 本地审阅开启与默认关闭绑定当前源码的新构建；图片、hold 和元数据指纹检查 | build08 两组各 40 次请求仅为历史；build09 未执行 |
| GL | 最终构建的桌面/移动丢失与恢复、错误、旧 query 清理及恢复后指标；功能恢复与驱动崩溃恢复分开陈述 | pending |
| A36 矩阵 | 恒星、星座、星云各 12 个对象，两种视口；完整 alias、fault、journey 清单以及原图 SHA/尺寸 | pending |
| 离线画廊 | 所有输入收据同构建、完整清单和原图哈希核验；HTML 浏览器检查若未执行则明确写未执行 | pending |
| 冻结尺寸补充 | 1440×900、768×1024、430×932 三种视口各查看 Sirius A、Orion、M42；实际运行、稳定镜头、原图指纹和代理视觉记录 | pending，独立 9 张，不计入 306 张主清单 |
| 桌面长测 | 独立新浏览器和 context，真实墙钟和浏览器观察均 ≥30 分钟；原始 raw 与单会话收据 | pending |
| 移动模拟长测 | 桌面关闭后独立新浏览器和 context，390×844 / DPR 1；真实时长 ≥30 分钟；实体设备仍未验证 | pending |
| 长测离线验收 | v643/v648 原有验收、v650 raw/clock/resource 检查、v665 六个五分钟窗口以及额外预登记目标 | pending |
| 中断与容量 | 固定内存保护阈值、周期检查点、正常信号收尾、原始记录保存、只关闭自有浏览器；失败不改写通过 | pending |

三类主要视图的协议清单为恒星 48 张、星座 72 张、星云 120 张，共 240 张。另有目录别名 8 张、星云异常 18 张、旅程 40 张，共 66 张，合计 306 张；build15 当前已由顶部三类矩阵及画廊收据覆盖。冻结尺寸补充另外要求 9 张独立主视图，responsive15b 另保留 6 张辅助图；尺寸补充不能改变 306 张主矩阵分母或替代缺失主图。各项完成与否以自身实际收据为准。

[美术主线规划](./mainline-a-art-master-plan-20261014.md)要求首轮与 1280×720、390×844 历史视口对齐，冻结时加入 1440×900、窄至 360 px 和中间宽度。九图补充覆盖三类样板的较大桌面、中间尺寸与 430 px 移动宽度；既定旅程窄屏为 360×800，其范围仅是旅程配置，不能据此声称完整 A36 在 360 px 均已验收。尺寸补充与主矩阵须绑定同一候选构建，采集先后不是验收条件；同源码 build15 的 responsive15b 可继续作为该有限范围证据。

星云 120 张正常视图与 18 张故障流程图的用途分开陈述：正常视图须有锁定且稳定镜头证据；故障图用于加载身份隔离、取消、重试和迟到响应检查，不自动属于稳定构图验收。代理视觉复核只计实际打开并查看的图片，不能将工具通过等同于逐图人工签核。

每次正式长测使用新的浏览器进程和 context；桌面 1280×720 完成并关闭自有浏览器后，再启动 390×844 移动模拟，均为 DPR 1。两次真实墙钟和浏览器观察均须至少 30 分钟，并冻结各设备实际预检所得质量档位。当前登记的负载先预热完整五站 Orion 路线，以两次匹配的四秒完整资源探测确认预热基线；进入观察后，六个五分钟窗口各执行一次完整路线：Orion → M42（实际打开查看器、2× 查看并关闭）→ B33 → Betelgeuse → Rigel → 返回 Orion → 退出至基线。每轮在非模态阶段及返回检查点保留完整资源身份／kind／owner／字节快照，另留 DOM 计数及 renderer／heap 观察；查看器打开时不冒签被模态框阻止的完整资源探测。DOM 保留空闲预热计数，采用第一窗口实际 R65-running 返回检查点作为同状态参照，与后五窗比较；不把空闲与运行状态差值直接当作泄漏。该协议验证同一代表路线的六次完整生命周期，不扩大为 A36 全对象连续负载或实体手机验收；smoke03 短流程已完成并通过功能检查，不计长测资格；各次正式观察及补充裁决的当前状态以顶部 CURRENT_SNAPSHOT 为准；两端资格和最终冻结仍须完整验收。

预登记的全程帧间隔目标为桌面由中位数推导的频率 ≥55、p95 ≤33.3 ms；移动模拟 ≥30、p95 ≤50 ms。原始采样来自浏览器 `requestAnimationFrame`，报告全程 rAF 间隔及其派生频率，不将它称为实际渲染 FPS。每 15 秒附带记录的 R3F/GPU 指标来自有限滚动窗口；分别报告可用性、样本数和窗口值，不把窗口分位数再聚合为全程 p95。原有 v643/v648/v650/v665 更严格验收仍保留，不能在测后降低门槛。

长测 raw 必须保留独立桌面与移动文件的路径、字节数、SHA、运行 ID 和会话链，并关联预检质量基线、预热与逐窗负载 sidecar、六次完整路线的实际时钟、资源身份及 DOM／heap／renderer 曲线和驱动指纹。资源登记覆盖已注册的 geometry／material／subscription 等身份；DOM 计数补充观察浏览器对象与监听器趋势，不宣称独立枚举全部 THREE 对象或证明每个未注册监听器已释放。combined 文件明确标注为离线派生，不能冒充单一浏览器导出的原始记录。同步离线回放前保存容量记录与全部 raw／负载指纹；进程若被强制结束或内存耗尽，已存原始文件仍是未完成／待审证据，不能因此认定长测通过。

**历史证据与最终证据分列**

- [2026-10-18 full04](../../../output/playwright/mainline-a-m4-20261015/attempts/20261018-m4full04/failure.json)在启动前因约 0.97 GiB 可用物理内存停止，0 图、0 旅程。后来容量恢复并完成 full05；不能将早先 full04 受阻描述为今天未发生任何实际运行。
- [M3 历史交付](./mainline-a-m3-delivery-20261015.md)绑定 after03 / m4web02 / `034936bef2915f6a411f657ae2f4bab17d3c286b81828d0e5066f542b6ae7062`，包括 24 组、138 张 after 原图、8 个异常案例，以及 before 48 + after 138 的 186 张原图画廊。保留为阶段成果，不能充当新的最终同构建验证。
- build04 / `4732724219ceea2796b3073787d9a304d0969a749685eb8ef553a98bf4944ef8` 的构建、HTTP 与 GL 记录属于该候选的证据。后续 caption 或捕获条件修正后，新构建需要对应的新证据。
- [build05](./mainline-a-r85-build-20261015-m5web05.json) / `5fc00fe91784bfb02d4eef99c11d50f7a9b41bb9122896769a174864a3a65a84` 曾通过构建、HTTP、GL 和 M3 正常/异常流程检查；[build05 星云审计](../../../output/playwright/mainline-a-m5-20261015/final05-matrix-audit-draft.json)只绑定旧构建。随后 [M4 full01 原始失败](../../../output/playwright/mainline-a-m4-20261015/attempts/20261015-m4full01/failure.json)在移动 Orion 完整图鉴处停止，不能把已采集的前半矩阵称为完整通过。
- [真实视口诊断](../../../output/playwright/mainline-a-m4-20261015/diagnostics/20261015-m4mobileviewport01/receipt.json)复现：完整图鉴留下约 2 CSS px 边缝，镜头距离由 9553.313 退到 1916020.220；收起后仍为 38213.250，约为默认距离四倍。诊断是故障证据，不是通过收据；原图、原始记录和修复前源码均保留。
- [build06](./mainline-a-r85-build-20261015-m5web06.json) / `074bc2d85a2a105ead0f4728a6e56b0af889be10b1c694dec82d773535d0f948` 构建通过，加入不足 64 CSS px 的实测区域暂停与自动适配不覆盖用户距离意图。在启动该构建的浏览器验收前，自审发现首次显式缩放可能被新的距离上下限吞掉，因此被 build07 取代。它是“构建成功但审查发现交互反例”的阶段，不虚构 build06 真实浏览器失败或通过。
- build07 在当前布局范围内先限制用户缩放意图，再应用单次缩放比例并再次限制；反例覆盖半屏首次缩小、收起后首次放大、未完成缓动时连续操作、全屏暂停和返回恢复。与 build05 的生产源差异仅是相机桥与星座安全区求解器两文件，独立预审已核对；真实恢复结果仍待本轮矩阵。
- build07 的 [M4 full02 中止记录](../../../output/playwright/mainline-a-m4-20261015/attempts/20261015-m4full02/failure.json)属于资源保护中止。根代理报告 2026-10-15 10:53:14 UTC 时空闲物理内存约 1.46 GiB、提交余量约 9.66%，低于预设门槛，保护器关闭本次自有浏览器。已取得 24 组星座的 72 张图、桌面旅程 10 张和移动旅程 2 张仍是未完成尝试；没有 canonical receipt，不计为完整 M4 矩阵通过，也不归为应用功能故障。该草稿没有为了继续采集而降低保护阈值。
- HTTP 首次缺少 TypeScript loader 的命令在模块导入阶段失败，尚未发出 HTTP 请求；使用 `node --import tsx` 后完成上述两组测试，生产源未变化。该命令启动问题不记录为产品 HTTP 故障。
- build07 full05 后保留 112 张功能通过原图及六个移动默认场景的视觉问题；它没有完成整个 M5 最终冻结。build08 及其后两处 UI 修复形成待 build09 源码；新同构建矩阵、GL、画廊、额外九图和两次长测继续 pending，旧构建不能补位。

**最终冻结清单的填入条件**

只有收到所有实际收据后才生成最终冻结 manifest：逐项记录收据路径、字节数、SHA、运行 ID、Build ID/runtime ID/source SHA；核对 306 张主清单与独立 9 张补充清单，附实际视觉复核和画廊浏览器记录；保存两次独立 raw、时长、固定质量、六窗完整负载、资源／DOM／heap 趋势和时钟链、离线派生 combined 的来源；补齐当前 build15 体验入口、启动／停止指引、工作区依赖与回退指针；最后核对当前源码与冻结驱动无漂移，并确认原主计划的必需视觉、旅程和可用性缺陷已逐项处理。缺项时保留 pending 或失败状态，不用历史构建补位，不提前创建最终通过文件。

最终记录继续保留 `candidate-only`、`hold`、`not-admitted`、`scientificPayloadWriteback=false`。用户视觉签核、逐图权利签署、实体移动设备、科学有效性和公开发布批准由各自门槛决定，本草案不授予任何一项批准。

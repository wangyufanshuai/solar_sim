# A 线美术 · build15 本机审阅

当前候选包含 12 恒星、12 星座、12 星云。36 个对象的桌面／移动模拟矩阵及同构建 306 张原图画廊已完成。**桌面与移动模拟各自 ≥30 分钟、六窗完整观察已通过显式 DOM 补充裁决的双端配对验收，本地候选技术交付与冻结已完成。** 保持 `candidate-only`、`hold`、`not-admitted`、`scientificPayloadWriteback=false`。

[最终候选交付入口](./mainline-a-m5-candidate-delivery-20261028.md) · [冻结清单](./mainline-a-m5-candidate-freeze-20261028.json) · [打开 306 张运行图画廊](../../../output/playwright/mainline-a-m5-final15-20261023/gallery.html) · [Sirius A／Orion／M42 六图预览](./mainline-a-current-art-preview-20261019.md) · [完整矩阵清单](../../../output/playwright/mainline-a-m5-final15-20261023/gallery-manifest.json)

本机预览地址：[http://127.0.0.1:3151](http://127.0.0.1:3151)。地址只在下述服务运行时可用。

## 三步体验

1. 打开“恒星图集”，选择 Sirius A，点击“在星空中定位”。打开档案的“查看图鉴 / 比较”，再关闭档案、重开并退出聚焦。
2. 用底部搜索打开星座目录，选择 Orion／猎户座，开始五站旅程：猎户座 → M42 → 马头星云 B33 → 参宿四 → 参宿七。在 M42 打开观测图，切换 2× 局部后关闭，再返回出发视点。
3. 浏览星云候选，展开观测图说明、署名和来源。M20 保留原图阶梯边界；NGC2237 明确为局部视场。候选图片显示不代表逐图权利已获批准。

## 启动与停止

在工作区根目录打开 PowerShell，执行：

```powershell
Set-Location -LiteralPath 'E:\86137\myai\solar_sim\next-web\.next-mainline-a-r85-20261019-m5web15'
$env:PORT = '3151'
$env:HOSTNAME = '127.0.0.1'
$env:ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES = '1'
node --max-old-space-size=768 .next/standalone/server.js
```

该开关仅供本机审阅。停止时在启动服务的同一个终端按 **Ctrl+C**。如端口已被占用，先确认现有监听是否就是本候选；不要按端口批量结束其他进程。

默认关闭候选图片的回退方式：先停止自有服务，在同一终端清除开关后重新启动同一保留构建：

```powershell
Remove-Item Env:ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES -ErrorAction SilentlyContinue
node --max-old-space-size=768 .next/standalone/server.js
```

[同构建默认关闭 HTTP20](./mainline-a-m1-http-default-off-20261019-m5http20.json)验证了该受控状态。本文件不把旧版构建指针当成已验证的整站回滚包，也不执行 Git 回退。

## 构建与证据

| 项目 | 当前证据 |
|---|---|
| 候选冻结 | [最终交付入口](./mainline-a-m5-candidate-delivery-20261028.md)与[冻结清单](./mainline-a-m5-candidate-freeze-20261028.json)已形成；[最终共同指纹](../../../output/playwright/mainline-a-m5-20261028/final-common-binding04.json)17 项检查／717 项文件指纹通过，冻结清单保留 733 项证据指纹 |
| 双端配对 | [实际验收](../../../output/playwright/mainline-a-m5-pair-20261028-adjudication02/audit.json)为 `passed-with-explicit-DOM-adjudication`；两次完整独立观察及原 non-DOM 门槛、严格容量、桌面独立复核和移动同会话自然停留均已验证。[原机器分析](../../../output/playwright/mainline-a-m5-pair-20261028-adjudication02/original-machine-analysis.json)的 false／review-required 保留，不改写原始数据 |
| 构建 | [build15 收据](./mainline-a-r85-build-20261019-m5web15.json)，Build ID `qg3f2Z6WY5qYWfo3vEjmq` |
| 源码 | `183482b4a793d6d4e22ade276d3bfd301155f809a3618b5ed07102c0a1441b60`，2465 输入 |
| 全矩阵 | [M2 full05](../../../output/playwright/mainline-a-m5-stars-final15-20261023/after/receipt.json) 56 图；[M3 full04](../../../output/playwright/mainline-a-m5-nebulae-final15-20261023/after/receipt.json) 138 图；[M4 full10](../../../output/playwright/mainline-a-m4-final15-20261023/receipt.json) 112 图 |
| 画廊 | [桌面／移动模拟浏览器检查](../../../output/playwright/mainline-a-m5-final15-20261023/gallery-browser-check.json)通过；不代表逐张人工签核 |
| 字节绑定 | [306 原图与源码／资产复核](../../../output/playwright/mainline-a-m5-20261023/same-build-gallery-assets-audit01.json)；[117 受保护输入复核](../../../output/playwright/mainline-a-m5-20261023/protected-inputs-audit02.json) |
| UI | [orbitui08](../../../output/playwright/mainline-a-m5-20261018/orbit-layer-ui-20261023-orbitui08/receipt.json)，26 主状态＋8 补充；[三视口档案真实指针检查](../../../output/playwright/mainline-a-m5-20261023/20261023-pointer02/receipt.json)通过 |
| 原专项 | [WebGL 丢失／恢复独立复核](../../../output/playwright/mainline-a-m5-20261019/final15-webgl-audit.json)；[15 张响应式原图审阅](../../../output/playwright/mainline-a-m5-20261019/responsive15b-visual-audit.json) |
| 当前工具检查 | [当前单设备选项 48 项工具测试](../../../output/playwright/mainline-a-m5-20261028/single-device-tool-tests01.log)与[离线配对工具 8 项检查](../../../output/playwright/mainline-a-m5-20261028/pair-adjudicator-tests01.json)通过，原正式守卫不变，单设备自身仅采集；[此前 42 项定向测试与双端中断留账回归](../../../output/playwright/mainline-a-m5-20261028/interruption-repair-handoff01.json)保留当时版本范围；[37 项质量映射测试](../../../output/playwright/mainline-a-m5-20261023/longrun-quality-tests01.log)保留为此前版本，不代签当前驱动或长测资格 |
| 短流程 | 历史 [smoke03 两端完整路线](../../../output/playwright/mainline-a-m5-workload-smoke-20261024-smoke03/audit.json)通过；桌面 54,218 ms、移动模拟 53,658 ms，正常中止原始记录为 blocked；仅覆盖当时版本，不代签新驱动，不计 30 分钟资格 |
| 中断留账修复 | [双端真实回归与 42 项工具测试交接](../../../output/playwright/mainline-a-m5-20261028/interruption-repair-handoff01.json)通过；只覆盖保护中止的留账路径，不计正式长测 |
| 前次证据汇总 | [10 月 28 日 evidence audit02](../../../output/playwright/mainline-a-m5-20261028/current-evidence-audit02.json)记录 long01–long06 的保护停止与当时 pending 门槛；保留原失败，不覆盖后续 long07 |
| long07 桌面 | [独立复核](../../../output/playwright/mainline-a-m5-20261028/desktop07-review01.json)与[原始 raw](../../../output/playwright/mainline-a-m5-longrun-20261028-m5long07/desktop-browser-raw.json)：30:02.003，raw／clock、六窗完整路线、帧时、登记资源、heap／尾窗检查通过；原机器 DOM 结果仍为 false／review-required；[独立补充裁决](../../../output/playwright/mainline-a-m5-20261028/dom02-independent-review01.json)已在 build15／桌面代表路线范围解决生命周期风险，不证明原末窗精确 GC 因果，[最终两端配对](../../../output/playwright/mainline-a-m5-pair-20261028-adjudication02/audit.json)已显式引用该裁决并通过 |
| long07 移动模拟与整体 | [中断原始 raw](../../../output/playwright/mainline-a-m5-longrun-20261028-m5long07/mobile-interrupted-browser-raw.json)：25:59.594，仅完成五窗后触发原资源保护，为 blocked；[整体 attempt](../../../output/playwright/mainline-a-m5-longrun-20261028-m5long07/attempt.json)为 failed，不合成两端通过 |
| mobile08 移动模拟 | [单端采集收据](../../../output/playwright/mainline-a-m5-longrun-20261028-m5mobile08/capture-only-audit.json)为 `capture-complete-awaiting-paired-review`、`captureValid=true`；[原始 raw](../../../output/playwright/mainline-a-m5-longrun-20261028-m5mobile08/mobile-browser-raw.json)30:02.006、六窗完整路线，八项单端检查通过，自有浏览器已关闭。[正式容量 120 次采样](../../../output/playwright/mainline-a-m5-longrun-20261028-m5mobile08/resource-guard.json)均满足原门槛；[同会话自然停留](../../../output/playwright/mainline-a-m5-longrun-20261028-m5mobile08/mobile-dom-settle.json)60／120 秒均为 1661 nodes／4371 listeners、R65 持续 running，未请求 GC。原单端收据与 DOM advisory 保留；[双端显式配对裁决](../../../output/playwright/mainline-a-m5-pair-20261028-adjudication02/audit.json)已验证同会话材料并通过，单端收据本身仍不授予 qualified 或冻结 |
| DOM 复核 | [dom01 原始失败记录](../../../output/playwright/mainline-a-m5-dom-diagnostic-20261028-dom01/attempt.json)：四轮完整路线、九次 census，未完成自然停留；提交余量 975,740,928 bytes 触发开发保护，自有浏览器已关闭。[dom02 原始诊断](../../../output/playwright/mainline-a-m5-dom-diagnostic-20261028-dom02/audit.json)已完整结束并关闭自有浏览器：六轮真实路线、十三次 census、四次自然停留采样；连接树与监听器稳定，自然采样均为 1714 nodes／7524–7530 listeners，资源 27／96fe4503、R65 持续运行，源码／工具前后绑定一致，未请求 GC。仅为诊断，不计正式 30 分钟；[独立复核](../../../output/playwright/mainline-a-m5-20261028/dom02-independent-review01.json)解决 build15／桌面代表路线的生命周期风险。原 long07 机器 advisory 仍为 false／review-required，原计数与失败保留；两端通过来自单独的显式补充裁决及[配对验收](../../../output/playwright/mainline-a-m5-pair-20261028-adjudication02/audit.json)，非改判原机器结果 |

保留构建依赖工作区的 `node_modules` 与 `public` 链接，不是可独立搬移的安装包。启动前须保留这些目标；资产或依赖被改动后，应重新核对指纹，不能只依赖目录名称。

## 已知事项与待审

关闭档案后，移动端档案条会遮住本地视觉 A/B 工具条的一部分；三视口的“打开天体档案”和“退出聚焦”均已通过无强制点击的命中与实际操作。A/B 工具条属于本地审阅工具，可在退出聚焦后操作。初始太阳系地球标签靠近顶部徽标、部分星云中英文标题不一致、B33 移动标题省略号仍列为非阻断呈现问题。

| 门槛 | 状态 |
|---|---|
| 人工美术签核 | 待用户审阅；代理看图不代签 |
| 逐图权利与发布准入 | 待逐项批准，继续 hold／not-admitted |
| 实体手机与真实设备性能 | 未完成；移动视口为浏览器模拟 |
| 两次正式长测、尾窗与释放审核 | 已完成本地候选技术范围的两次独立观察：桌面 30:02.003、移动模拟 30:02.006，各六窗完整路线、独立浏览器已关闭；[双端配对及显式 DOM 补充裁决](../../../output/playwright/mainline-a-m5-pair-20261028-adjudication02/audit.json)通过。两端原机器 advisory 和失败记录保留；rAF 间隔 p95 分别 7.145／7.130 ms，不作为 renderer FPS 或实体手机性能 |
| 最终候选技术冻结 | [本地候选冻结已完成](./mainline-a-m5-candidate-freeze-20261028.json)，保留 candidate-only／hold／not-admitted／scientificPayloadWriteback=false |
| 科学有效性、公开发布、Beta 扩容 | 未授予；不由美术测试推导 |

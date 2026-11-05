# A 线美术 · build15 候选交付

12 恒星、12 星座、12 星云的 A 线技术交付已完成：统一星云观看与来源、五站猎户座旅程、桌面／移动模拟全矩阵、异常及释放检查、两次独立 30 分钟观察和共同字节绑定。此交付保持 **candidate-only／hold／not-admitted／scientificPayloadWriteback=false**。

[打开 306 张实际运行图画廊](../../../output/playwright/mainline-a-m5-final15-20261023/gallery.html) · [Sirius A／Orion／M42 桌面与移动六图](./mainline-a-current-art-preview-20261019.md) · [冻结清单](./mainline-a-m5-candidate-freeze-20261028.json)

| 交付 | 已验证结果 |
|---|---|
| A36 矩阵 | M2 恒星 56 图、M3 星云 138 图、M4 星座与旅程 112 图，共 306 张原图；另有 9 张响应式默认图与 6 张状态补充图 |
| 观看与路线 | 星云适配／2×／拖动／来源／重试与快速切换；Ori → M42 → B33 → Betelgeuse → Rigel，支持返回、外部中断、窄屏与减少动画 |
| 浏览器检查 | 桌面与移动模拟全矩阵、画廊、三视口必要按钮、WebGL 丢失恢复、轨道标签偏好恢复 |
| 桌面观察 | 30:02.003，六个五分钟窗口；rAF 间隔 p50 6.965 ms、p95 7.145 ms |
| 移动模拟观察 | 30:02.006，六个五分钟窗口；rAF 间隔 p50 6.955 ms、p95 7.130 ms |
| 当前工具 | 单端采集与既有工具定向检查 48/48；离线配对裁决工具 8/8。应用 30 项检查、lint 与生产构建按 build15 指纹继续适用 |
| 最终绑定 | 2465 源码输入、306＋15 张图、117 保护输入、31 资产及 6 metadata；原始观察、sidecar、工具、构建身份与依赖链接均已核对 |

帧时来自浏览器 rAF 间隔，不能作为渲染器 FPS 或实体手机性能。正式观察保留每 15 秒定时检查的原保护策略：物理余量至少 2 GiB、提交余量至少 2 GiB 且至少 10%；实际采样间隔随系统查询耗时记录在原始日志中。

**DOM 待审项已单独裁决。** 原机器结果中的 DOM review-required 保留。桌面通过同构建六轮诊断、连接树及监听器分布和自然停留的独立复核；移动端通过同一正式会话的 60／120 秒自然停留，总计数均回到首轮运行基线以内，未请求强制 GC。该结论覆盖代表路线的生命周期，不宣称不存在任何未观测泄漏，也不证明原桌面末窗的精确 GC 因果。

[双端配对验收](../../../output/playwright/mainline-a-m5-pair-20261028-adjudication02/audit.json) · [原始机器分析](../../../output/playwright/mainline-a-m5-pair-20261028-adjudication02/original-machine-analysis.json) · [最终共同指纹](../../../output/playwright/mainline-a-m5-20261028/final-common-binding04.json) · [桌面独立复核](../../../output/playwright/mainline-a-m5-20261028/dom02-independent-review01.json)

**本机体验。** 从恒星图集定位 Sirius A，打开并关闭比较档案；从星座目录选 Orion 开始五站旅程，在 M42 打开观测图并切换 2×；浏览星云的说明、署名和来源。

在 PowerShell 启动保留构建：

```powershell
Set-Location -LiteralPath 'E:\86137\myai\solar_sim\next-web\.next-mainline-a-r85-20261019-m5web15'
$env:PORT = '3151'
$env:HOSTNAME = '127.0.0.1'
$env:ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES = '1'
node --max-old-space-size=768 .next/standalone/server.js
```

打开 [本机预览](http://127.0.0.1:3151)。仅服务运行时可用；停止时在该终端按 Ctrl+C。保留构建通过链接依赖工作区 node_modules 和 public，不能作为可独立搬移的安装包。

受控回退：停止自有服务，执行 `Remove-Item Env:ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES -ErrorAction SilentlyContinue` 后重启同一构建，即恢复候选图片默认关闭状态；该状态已有 HTTP20 检查。此回退不执行 Git 操作。

**保留事项。** 移动档案重开条会遮住本地 A/B 审阅工具的一部分，必要主流程按钮已通过实际指针检查；部分星云中英文标题、B33 窄屏省略号及初始地球标签靠近顶部徽标作为非阻断呈现事项保留。

人工美术签核、逐图权利、实体设备、科学有效性和公开发布仍待各自审核；Beta 扩容不在本次目标内。所有旧失败、中断原始数据和未通过的机器结果保留，不能被本交付改写为成功。

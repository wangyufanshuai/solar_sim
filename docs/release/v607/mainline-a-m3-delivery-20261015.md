**Solar Sim · M3 星云观看与来源｜2026-10-15 历史阶段交付**

M3 已为 A 线 12 个星云加入完整构图观看、2 倍局部放大、平移、恢复完整构图和来源说明。下列成果绑定 `20261015-m3after03` 实际运行记录及当时的 `20261015-m4web02` 构建。后续 M4/M5 已继续修改源码；本文不宣称当前源码或最终版本已通过这些检查。最终同构建矩阵与长时检查由 M5 另行交付。

[打开实际运行对照画廊](../../../output/playwright/mainline-a-m3-20261015/comparison-gallery.html) · [机器可读交付记录](./mainline-a-m3-delivery-20261015.json) · [原图与构建清单](../../../output/playwright/mainline-a-m3-20261015/comparison-manifest.json)

观看器沿用主场景已解码的同一个图片节点。打开、缩放和关闭不新增图片请求，不更换资源 SHA；关闭归还图片节点，主场景继续持有唯一纹理租约。原图比例、边缘、已有水印和完整署名保留，局部放大明确标注为观看操作。键盘、桌面鼠标和移动模拟触摸可以平移；恢复完整构图、Escape 和关闭按钮均已实际检查。

覆盖对象为 M42、M1、M8、M16、M20、M57、NGC 7293、NGC 6543、NGC 2237、NGC 6960、Carina、B33。桌面视口为 1280×720，移动模拟视口为 390×844；移动模拟不代表实体手机验收。

| 历史证据 | 数量与结果 |
|---|---|
| 对象与视口组合 | 12 个对象 × 2 种视口，共 24 组 |
| after 常规原图 | 每组默认、完整观看、2 倍观看、观看器来源、场景来源 5 张，共 120 张 |
| after 异常原图 | 8 个受控异常案例，共 18 张 |
| after 原图合计 | 138 张；原图直接链接，未重绘、调色或替换 |
| before 原图 | 48 张，来自 `20261015-m3before03` 的 M2 构建基线 |
| 离线画廊 | 186 张原图 = before 48 + after 138；6 个重点对照区段 |

[after03 收据](../../../output/playwright/mainline-a-m3-20261015/after/receipt.json)中的 24 组观看检查全部通过：2 倍缩放、平移、完整构图复位、署名和许可可见、来源可聚焦、关闭后焦点恢复、同一图片节点归还、无额外图片请求、资源尝试编号不变以及场景选择保留。桌面另验证滚轮平移；移动使用浏览器原生触摸滚动。24 组常规检查的页面及控制台错误均为零。

| 异常路径 | 桌面与移动实际结果 |
|---|---|
| 慢加载 → 取消 → 重试 | 加载及取消有明确状态；未就绪时不能打开观看器，重试后显示正确对象 |
| HTTP 503 → 重试 | 失败有明确状态；重试后恢复正确对象 |
| 超时 → 重试 | 超时有明确状态；重试后恢复正确对象 |
| 延迟响应期间切换对象 | 旧图移除，最终身份正确，迟到响应未覆盖新选择 |

每条路径在两种视口执行，共 8 个案例。HTTP 503 注入在桌面和移动各产生一条预期网络控制台错误；全部异常案例的意外错误为零。不能将此写成“全程所有错误为零”。

M16 的说明已校准为鹰状星云及周围天区的巡天环境图，著名尘埃柱属于其中的局部结构，避免把当前宽视野图解释成尘埃柱特写。实际页面文本可对照 [before 移动记录](../../../output/playwright/mainline-a-m3-20261015/before/mobile-m16.json)与 [after 移动记录](../../../output/playwright/mainline-a-m3-20261015/after/mobile-m16.json)的 `sources.dimensionText`；[before 原图](../../../output/playwright/mainline-a-m3-20261015/before/mobile-m16-sources.png)和 [after 原图](../../../output/playwright/mainline-a-m3-20261015/after/mobile-m16-sources.png)保留。该调整只说明既有图片的观看范围，未替换图片或新增科学资料。

[代理视觉复核 JSON](../../../output/playwright/mainline-a-m4-20261015/visual-review-m2-card.json)包含 M3 after03 移动 M42、M16、Carina 的 12 张实拍检查：完整比例与图框可见，M42 水印保留，Carina 宽幅图的留白符合原比例，放大/关闭/恢复控件和完整来源可读；M16 环境巡天说明正确。该文件同时含 M4 检查，本文只引用其 M3 条目。代理抽查不代表全部原图均经过人工视觉签核。

[画廊静态验证](../../../output/playwright/mainline-a-m3-20261015/comparison-gallery-validation.json)核对了 186 张原图、195 个唯一引用以及文档 SHA，失败项为空。画廊 HTML 本身的浏览器渲染检查记录为 `not-run-resource-reserve`；这项静态检查不等同于再次运行画廊浏览器检查，亦不改变底层截图来自实际应用浏览器的事实。

历史定向测试日志保留：[15 文件、168 项 Vitest 通过](../../../output/playwright/mainline-a-m3-20261015/vitest.log)、[文案与说明相关 2 文件、10 项通过](../../../output/playwright/mainline-a-m3-20261015/caption-tests.log)、[ESLint 日志](../../../output/playwright/mainline-a-m3-20261015/eslint.log)。两个测试日志可能覆盖相同文件，数量不合并，也不作为后续源码的测试结论。

两次失败尝试没有改写为通过：

- [after01 失败记录](../../../output/playwright/mainline-a-m3-20261015/after/attempts/20261015-m3after01/failure.json)：B33 的 `pointerPan` 探针在已到达滚动边界时继续朝边界拖动，得不到位移。随后探针改为选择可滚动范围较大的轴并朝边界内侧移动，加入边界回归；这是探针操作条件的修正。after03 重新执行桌面与移动矩阵后通过。
- [after02 失败记录](../../../output/playwright/mainline-a-m3-20261015/after/attempts/20261015-m3after02/failure.json)：`build-source-binding-mismatch` 在开始时拒绝了不匹配的构建与源码，没有产生通过结论。

[输出目录澄清记录](../../../output/playwright/mainline-a-m3-20261015/after/output-directory-clarification-20261015-m3after03.json)保留了原始 `started.json`：它从复用的参数解析器继承了未使用的 M2 `outputDir` 字段。实际截图、attempt 副本和正式收据均写入 M3 目录。澄清记录重新核对了 24 组、8 个异常案例和 138 张截图的 SHA/视口；原始记录没有被覆盖。

| 绑定项 | after03 的历史值 |
|---|---|
| 构建收据 | [R84 / m4web02](./mainline-a-r84-build-20261015-m4web02.json)，`vercel-lite` 本地候选构建 |
| Build ID | `xbqJG1YAxMbPT6UBSpQS2` |
| Runtime Build ID | `mainline-a-034936bef2915f6a` |
| 源码 SHA256 | `034936bef2915f6a411f657ae2f4bab17d3c286b81828d0e5066f542b6ae7062` |
| 构建稳定性 | 当时构建 `sourceStable=true`、退出码 0；after03 捕获前后绑定同一源码 SHA |
| after 收据 SHA256 | `18e9f69bcda8fb4d8906f3e1e1b898477329a9db70bacc75f2c7697e34bdb3aa` |

构建编号含 M4，表示 M3 最终浏览器检查使用了当时已包含部分 M4 工作的候选构建；不能将 M3 证据解释为独立的 M3 专用源码构建，也不能据此认定 M4 完成。`sourceScope=current-source-before-and-after` 是 after03 收据产生当时的检查范围，不是本文写入时的当前源码声明。

本阶段保持 `candidate-only`、`hold`、`not-admitted`、`scientificPayloadWriteback=false`，图片权利状态继续为 `pending`。既有许可与署名的可见性不等于逐图权利签署。用户视觉签核、实体手机、科学有效性、公开发布批准和最终版本长时性能均未由本记录证明；M5 必须以最终冻结构建另行验证，不能沿用此阶段收据作为最终通过。

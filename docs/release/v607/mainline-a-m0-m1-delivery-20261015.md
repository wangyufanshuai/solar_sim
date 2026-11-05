**Solar Sim · M0 / M1 实际交付｜2026-10-15**

M0 基线固定、M1 三样板构图和移动面板已完成工程与代理视觉验收。交付 6 张前后对照图、12 张原始运行截图及 28 张交互过程截图。桌面为 1280×720，移动模拟视口为 390×844；均来自本地生产构建中的真实 Chrome 页面。

[打开六图对照画廊](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m1-20261014/comparison-gallery.html)

| 对象 | 桌面对照 | 移动对照 | 可见变化 |
|---|---|---|---|
| Sirius A | [桌面](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m1-20261014/comparisons/desktop-sirius-a.png) | [移动](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m1-20261014/comparisons/mobile-sirius-a.png) | 单一主球体；档案默认展示事实与艺术示意说明，第二肖像仅主动比较时打开 |
| Orion | [桌面](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m1-20261014/comparisons/desktop-Ori.png) | [移动](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m1-20261014/comparisons/mobile-Ori.png) | 主场景连线与关键星标签保留；重复星图默认收起，档案标题改为猎户座 |
| M42 | [桌面](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m1-20261014/comparisons/desktop-m42.png) | [移动](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m1-20261014/comparisons/mobile-m42.png) | 全幅观测图按比例适配安全区；说明收为一行，完整署名和许可可展开 |

对照图是两张完整视口原图的并排排版，未生成或修饰天体图像，也没有去掉运行界面。原图与对照图均记录 SHA-256。不同运行的底部模拟时钟及动态星点不要求逐像素一致；比较固定对象、选择入口、视口与默认聚焦状态下的构图。

**本轮实现。**

- 聚焦 Sirius A、星座、星云时，尺度导航默认缩成一行，展开后保留原尺度操作；Escape 收起并恢复按钮焦点。
- 桌面档案宽 336px，默认用摘要、数据、来源和比较入口组织内容；完整第二主图按需挂载。
- 移动档案具有折叠、半屏、详情三态，默认折叠高度实测 104px；半屏 45dvh，详情上限 80dvh 并可滚动。切换对象或视口会复位展示状态。
- M42 说明保留对象、2D、版权待审和来源入口；完整信用署名与许可可以展开。布局读取现有安全区，不改变目录坐标、物理尺度或科学载荷。
- 真实浏览器检查发现并修复了 M42 说明按钮的点击冒泡问题：此前 Enter 合成点击会触发场景空白点击并退出聚焦；现在说明区域隔离该事件，展开、收起与来源链接仍可使用。

**最终验证。** 以下结果均绑定最终源码及 build03，历史 R80 仅用于改动前对照。

| 检查 | 实测结果 | 范围 |
|---|---|---|
| Vitest | 13 文件、194 测试通过 | 档案生命周期与状态、尺度导航、星云加载/纹理/绘制/布局、相机焦点边界等定向回归 |
| Node | 6/6 通过 | 六视图捕获工具的构建绑定、对象/边界/交互检查逻辑 |
| ESLint | 12 个修改或新增 TS/TSX 文件通过，退出 0 | 定向检查，无诊断 |
| 网页版生产构建 | 编译、TypeScript、静态页面生成通过 | 原有 vercel-lite 构建范围，不代表完整科研路由构建 |
| HTTP | enabled 与 default-off 各 40 请求通过 | 31 张本地资产、5 个 hold、无效路径、主页/健康及当前构建 manifest；6 个元数据 pin 同时复核 |
| 真实浏览器 | 6/6 视图通过 | 单 Canvas，无横向溢出，无页面或控制台错误，运行构建身份一致 |
| 交互 | 档案关闭/重开、数据/摘要/详情、来源、主动比较、Escape 与尺度栏通过 | 操作后保持对象选择与 inspect 聚焦；M42 说明展开/收起没有重载影像或退出聚焦 |
| 连续选择 | 桌面键盘、移动触控均通过 4 步 | Orion → 参宿四 → Orion → M42 → Orion；不将其当作 M4 新旅程或精确历史相机恢复 |
| 触控 | M42 来源、说明、许可目标高度至少 44px | 窄屏实际 DOM 测量；新增档案操作使用至少 44px 目标 |
| 代理视觉 | 6 个默认视图逐张检查通过 | 主体完整、默认无重复主图、层级清楚、无主要遮挡；另抽查移动说明展开及详情 |

最终构建：`CrhZfK3iuN4QsWw94kTzP`；运行身份：`mainline-a-329571ee7cb34a03`；源码指纹：`329571ee7cb34a03701cac3eae882f9b402216611ebb24d5ae59c4aec130cbac`。

M0 基线源码与 R80 留存构建一致：`5197fc3dcc073ff95b859091da38415c596a85a28c44c32cd1b4f0530c238dd6`，构建 `OzXlBUCmLBXsMtceBdR7h`。已用该构建重新运行六个视图，未把旧截图冒充本轮实拍。

**变更与留存。** 相对本轮冻结基线，生产输入 6 项修改、4 项新增、0 删除，另外 2443 个原有输入字节不变。生产有效变更 529 行（+451/-78），测试 +374/-8，工具 +647；统计排除空行和独立注释，不包含原有 Git 脏差异。未修改物理内核、目录资源、包锁或科学准入数据。没有提交、推送或部署。

第一次构建槽 `20261014-m1web01` 没有完成收据，保留为中断记录；build02 构建通过，但浏览器 after01 暴露点击穿透，不能作为完成证据。最终采用 build03 / after02。所有既有成果、失败尝试与本轮修改前备份均保留。

**证据入口。**

- [最终交付收据](E:/86137/myai/solar_sim/next-web/docs/release/v607/mainline-a-m0-m1-delivery-20261015.json)
- [逐文件变更与基线哈希](E:/86137/myai/solar_sim/next-web/docs/release/v607/mainline-a-m1-code-change-20261015.json)
- [最终构建收据](E:/86137/myai/solar_sim/next-web/docs/release/v607/mainline-a-r81-build-20261015-m1web03.json)
- [改动前实拍收据](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m1-20261014/before/receipt.json) · [改动后实拍与交互收据](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m1-20261014/after/receipt.json)
- [六图哈希与配对清单](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m1-20261014/comparison-manifest.json)
- [HTTP 开启模式](E:/86137/myai/solar_sim/next-web/docs/release/v607/mainline-a-m1-http-enabled-20261015-m1http01.json) · [HTTP 默认关闭模式](E:/86137/myai/solar_sim/next-web/docs/release/v607/mainline-a-m1-http-default-off-20261015-m1http01.json)

本次完成的是 M0/M1 工程与代理视觉检查。用户视觉签核、逐图权利签核、实体手机和最终版本长时性能仍未完成；保持 candidate-only / hold / not-admitted 和 scientificPayloadWriteback=false。恒星材质统一、完整星云画廊、扩展旅程与全量冻结属于后续 M2–M5。本轮跨日包含执行中断，没有可靠有效工时记录，因此不以墙钟时间推算后续工期。

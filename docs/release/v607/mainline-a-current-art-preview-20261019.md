# 宇宙美术当前六图预览

2026-10-19 · build15 · 实际浏览器运行截图。桌面 1440 × 900，移动模拟视口 430 × 932。

本版修复了手机图层菜单裁切，以及平板和手机顶部徽标被工作台／资料面板遮挡的问题；两条星云图片说明也已修正。以下六图来自同一构建，未经图像加工。

| 对象 | 桌面实际运行 | 移动模拟视口实际运行 |
|---|---|---|
| Sirius A | ![Sirius A 桌面](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m5-responsive15-20261019/attempts/20261019-responsive15b/wide-1440-sirius-a-default.png) | ![Sirius A 移动](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m5-responsive15-20261019/attempts/20261019-responsive15b/mobile-430-sirius-a-default.png) |
| Orion / 猎户座 | ![Orion / 猎户座 桌面](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m5-responsive15-20261019/attempts/20261019-responsive15b/wide-1440-Ori-default.png) | ![Orion / 猎户座 移动](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m5-responsive15-20261019/attempts/20261019-responsive15b/mobile-430-Ori-default.png) |
| M42 / 猎户座大星云 | ![M42 / 猎户座大星云 桌面](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m5-responsive15-20261019/attempts/20261019-responsive15b/wide-1440-m42-default.png) | ![M42 / 猎户座大星云 移动](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m5-responsive15-20261019/attempts/20261019-responsive15b/mobile-430-m42-default.png) |

本版已通过 5 文件 / 30 项组件测试、9 文件 / 70 项工具测试、2 文件 lint、生产构建、两种模式各 40 次本地 HTTP 检查、两端图形上下文丢失／恢复，以及 9 张默认尺寸图和 6 张未选／关闭资料辅助图的实际浏览器检查。

本版完整 A36 矩阵尚未完成：恒星采集完成 36 张后被资源保护中止；星云采集在首个主视图前中止；星座最终矩阵、完整画廊和两次各至少 30 分钟长测仍待完成。build12 的完整 306 图画廊保留为历史版本，不作为 build15 全矩阵验收。

功能采集采用显式低内存开发档位，不能据此认定性能通过。仍为 candidate-only / hold / not-admitted，scientificPayloadWriteback=false。真实手机、人工美术审阅、逐项素材权利和公开发布未签署。

已保留的次要精修观察：未选太阳系时地球标签靠近顶部徽标；关闭资料后右下重开条覆盖部分外观预设条。没有从静态图推断这些控件不可达。

- [完整尺寸检查与独立看图记录](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m5-20261019/responsive15b-visual-audit.json)
- [当前交付状态与续做入口](E:/86137/myai/solar_sim/next-web/docs/release/v607/mainline-a-m4-m5-delivery-draft-20261015.md)
- [历史 build12 A36 完整运行画廊](E:/86137/myai/solar_sim/next-web/output/playwright/mainline-a-m5-final12-20261019/gallery.html)

构建：qg3f2Z6WY5qYWfo3vEjmq。源码：183482b4a793d6d4e22ade276d3bfd301155f809a3618b5ed07102c0a1441b60。

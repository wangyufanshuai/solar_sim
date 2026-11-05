**Solar Sim · M2 恒星视觉统一｜2026-10-15**

M2 已将 A 线 12 颗恒星的主场景和图鉴接入同一套颜色与形态参数。四个校准对象是 Sirius A、Betelgeuse、Vega、Achernar；蓝白细纹理、暖橙大尺度纹理、快速自转扁率与极区明暗现在有明确区别。默认页面继续保留 M1 的单一主舞台，用户主动展开比较时才出现图鉴。

[打开实际运行对照画廊](../../../output/playwright/mainline-a-m2-20261015/comparison-gallery.html) · [机器可读交付记录](./mainline-a-m2-delivery-20261015.json)

**可见变化**

| 对象 | 本轮结果 | 代理视觉检查 |
|---|---|---|
| Sirius A | 图鉴从偏灰噪声调整为与场景同族的蓝白色，保留细密表面纹理 | 桌面、移动默认与比较画面可读 |
| Betelgeuse | 暖橙色与大尺度起伏区别于热星，图鉴没有继续套用细颗粒外观 | 颜色族一致；二维纹理比三维更柔 |
| Vega | 使用共享模型的轴比，呈现较弱扁率、亮极区和暗赤道 | 目录 9,602 K 与展示模型 9,360 K 保留各自定义 |
| Achernar | 更明显的扁率和极区明暗；图鉴与主场景使用同一模型参数 | 模型 14,898.5 K、轴比 1.352；不覆盖目录数值 |

图鉴使用 v596 合同中的三层形态尺度和强度。噪声只调制亮度，遮罩保持不透明；研究模式关闭光晕。四个目录别名入口 Sirius、Alpha Centauri、Capella、Procyon 与对应恒星入口具有相同的展示签名。

二维 SVG 与三维 GPU 共享颜色基值和形态参数，不保证纹理、曝光或像素一致。快速自转星的二维暗带更规则，红巨星的二维细胞更柔；所有图形继续标明参数化艺术示意、非真实观测表面。

**实际运行图**

交付 16 张前后对照图：4 个重点对象 × 桌面/移动 × 默认/主动比较。画廊同时链接 A12 全量原图。桌面为 1280×720，移动模拟视口为 390×844，DPR 为 1；来自本地生产构建的 Chrome 页面。

| 对象 | 桌面图鉴前后对照 | 移动图鉴前后对照 |
|---|---|---|
| Sirius A | [查看](../../../output/playwright/mainline-a-m2-20261015/comparisons/desktop-sirius-a-comparison.png) | [查看](../../../output/playwright/mainline-a-m2-20261015/comparisons/mobile-sirius-a-comparison.png) |
| Betelgeuse | [查看](../../../output/playwright/mainline-a-m2-20261015/comparisons/desktop-betelgeuse-comparison.png) | [查看](../../../output/playwright/mainline-a-m2-20261015/comparisons/mobile-betelgeuse-comparison.png) |
| Vega | [查看](../../../output/playwright/mainline-a-m2-20261015/comparisons/desktop-vega-comparison.png) | [查看](../../../output/playwright/mainline-a-m2-20261015/comparisons/mobile-vega-comparison.png) |
| Achernar | [查看](../../../output/playwright/mainline-a-m2-20261015/comparisons/desktop-achernar-comparison.png) | [查看](../../../output/playwright/mainline-a-m2-20261015/comparisons/mobile-achernar-comparison.png) |

原始图为 M1 基线 48 张、M2 最终 56 张，其中最终包含 8 张目录别名入口图。对照图只是将原图并排放入 HTML 后截取，原图未重绘、调色或替换；SHA、对象、视口、构建绑定见 [对照清单](../../../output/playwright/mainline-a-m2-20261015/comparison-manifest.json)。

**本轮验证**

| 检查 | 结果 | 范围 |
|---|---|---|
| Vitest | 14 文件、186 项通过 | 共享配置、A12/别名/hold、模式、模型与目录边界、档案、原合同、场景材质及资源生命周期 |
| Node | 7 项通过 | 浏览器证据的对象、构建、可见性与共享签名拒绝条件 |
| ESLint | 7 个 TS/TSX 文件通过 | 本轮生产和测试改动 |
| 生产构建 | 通过，sourceStable=true | vercel-lite 本地候选；不是全科学路由发布构建 |
| HTTP | 2 种模式各 40 请求通过 | 31 图片、5 hold、6 本地元数据钉住；本地审阅开启及默认关闭分别验证 |
| 恒星浏览器矩阵 | 24 个 A12 对象/视口组及 4 个别名组通过 | 56 个默认/比较截图状态；纹理关闭与恢复、Escape 收起、选择保留、图鉴可见、无横向溢出、共享签名一致 |
| Orion / M42 回归 | 桌面、移动共 4 组通过，另存 10 张截图 | 来源展开、键盘聚焦、档案关闭重开；M42 说明鼠标点击与移动 tap 开合、署名可见、选择保留 |

浏览器矩阵控制台和页面错误均为零。四重点对象的桌面比较、移动默认及比较图已由代理实际查看；另外抽查了 Rigel。自动矩阵通过与代理视觉检查不替代用户审阅。

Orion / M42 使用同一最终构建，[独立回归收据](../../../output/playwright/mainline-a-m2-20261015/retained-scenes/receipt.json)不混入恒星矩阵计数。该回归确认 M1 交互仍可用，不代表 M3 星云画廊或 M4 扩展路线已经实施。

第一版实拍发现图鉴过暗：三层噪声 alpha 连乘导致亮度衰减。该版已中断并保留 [视觉拒绝记录](../../../output/playwright/mainline-a-m2-20261015/after/attempts/20261015-m2after01/visual-rejection.json)，没有发布通过收据。修复不透明遮罩和亮度映射后重新构建、重跑完整矩阵；只有 `m2after02` 为最终证据。

首次单测还发现两处陈旧预期：M1 图鉴轴比断言更新为共享模型，并继续核对原目录值；星座清理测试改为执行实际资源生命周期，验证 6 个几何和 6 个材质各释放一次、重复清理幂等，以及旧实例不释放新实例或其他所有者的资源。星座生产文件在 M1 基线与当前完全一致；原失败日志保留为 `vitest.log`。

**构建和源码边界**

- 最终 Build ID：`U3rlOMIYRwVtDCeQYy3k4`。
- 最终源码 SHA256：`483f941c9aa1bfbddd94dcae9eb10a4a72dd2d95f8a110c0d89583db10d9fb14`。
- 构建：[m2web02 收据](./mainline-a-r82-build-20261015-m2web02.json)；浏览器：[m2after02 收据](../../../output/playwright/mainline-a-m2-20261015/after/receipt.json)。
- HTTP：[开启](./mainline-a-m1-http-enabled-20261015-m2http03.json)、[默认关闭](./mainline-a-m1-http-default-off-20261015-m2http04.json)。复用了 M1 检查工具，文件前缀不代表沿用了旧通过结论。
- [源码边界审计](../../../output/playwright/mainline-a-m2-20261015/source-boundary-audit.json)确认生产输入仅修改 `MainlineAStellarPortraitV607.tsx`、`SelectedSkyTargetProxy.tsx`，新增 `mainlineAStellarPresentationM2.ts`；其余 2451 个基线输入未变。v594/v596 合同、v596 着色器、目录、身份、证据和物理相关文件均保持不变。

源码指纹不包含 public 资产和测试；测试日志、HTTP 资源钉住与截图 SHA 分别提供证据，不能由源码 SHA 推出所有资产都未变化。本轮未引入外部表面纹理，未操作上级仓库，未提交或推送。

M2 的工程与代理视觉检查完成，继续保持 candidate-only、hold、not-admitted、scientificPayloadWriteback=false。Acrux、Spica、Regulus、Polaris 四个待审对象没有晋级。用户视觉签核、权利签核、实体手机和最终版本长时性能仍待完成；M3 星云画廊、M4 旅程及 M5 全量冻结不计入本轮完成范围。

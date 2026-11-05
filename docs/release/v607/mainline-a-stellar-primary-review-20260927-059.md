# R61–R66 恒星候选材料复核 · 20260927-059

本次是证据采集与技术验收延续，不是新的开发轮。5 篇论文 PDF、2 份目录 TSV、2 份目录说明已按真实 HTTPS 响应保存；另一次 Acrux 组件附表查询的两次网络尝试均失败，`responseCaptured=0`。逐文件 SHA-256、请求 fingerprint、时间、状态、URL、重定向和错误记录见同名 JSON 与 capture/replay 收据。

所有材料保持 candidate-only、hold、not-admitted；4 个恒星组件确认仍为 pending，`scientificPayloadWriteback=false`。本文是候选来源审查记录，不是科学批准或人工签署。12 项星云版权签署按用户决定继续 pending。

| 对象 | 已取得的候选材料 | 仍需解决的归属和定义 |
| --- | --- | --- |
| Acrux | [Waisberg & Katz 2026 预印本](https://arxiv.org/pdf/2603.11194)，Table 1、Table 2、§3.2–3.4；[Hipparcos 主表](https://vizier.cds.unistra.fr/viz-bin/asu-tsv?-source=I%2F239%2Fhip_main&HIP=60718&-out.all=1)及重归算表 | A 包含 Aa+Ab。主表有正视差且 AstroRef=A，但也有 AB、双星解及组合测光标记，不能直接当成 Aa 的独立测量。论文动力学结果采用 C 的 Gaia 距离；Table 2 是等时线拟合。原 PDF 第 10 页已目视复核：Aa+Ab 组有上下两行，不能把下行温度当成 Aa 或一个合成温度。 |
| Spica | [Tkachenko et al. 2016](https://arxiv.org/pdf/1601.08069)，Table 4、Table 7 | 论文区分近双星 primary/secondary。须与现有 WDS 层级交叉对应，不能把 secondary 直接映射成广域伴星 B。光谱光贡献与宽带单分量星等不同。 |
| Regulus | [McAlister et al. 2005](https://chara.gsu.edu/files/papers/2005_McAlister_ApJ_628_439.pdf)，Table 5；[Gies et al. 2020](https://arxiv.org/pdf/2009.02409)，§3.4 | 极半径、赤道半径和不同温度定义需要保留。2020 文献中的热小半径对象是 pre-WD 伴星。原 PDF 第 2 页已目视复核：正文确实写 HIP 49699，与现有 HIP 49669 冲突；HD 87901、HR 3982 一致。此冲突保留待审，未静默改号。 |
| Polaris | [Evans et al. 2024](https://arxiv.org/pdf/2407.09641)，Table 2、3、5 | 角直径对象是 Aa，位置表描述 Ab 相对 Aa。线性半径及动力学质量使用 B 的 Gaia 距离；须保留脉动相位、轨道加权方案和距离依赖。该材料尚未关闭 Aa 的 Teff 来源缺口。 |

[I/239 官方说明](https://cdsarc.cds.unistra.fr/ftp/I/239/ReadMe)明确区分组件、光心、质心以及双星解；[I/311 官方说明](https://cdsarc.cds.unistra.fr/ftp/I/311/ReadMe)需要与实际 TSV 的单位行一起解读。不能仅按 `RArad/DErad` 字段名推断单位：本次 TSV 输出单位是 deg。正视差来源现在已取得，后续不得再将 Acrux 简单描述为“没有正视差来源”。

PDF 提取文本及两页本地渲染仅用于阅读原文，均绑定原 PDF 的 SHA；它们不是新的网络响应，也不是应用浏览器视觉证据。自动重算只能验证文件和记录的一致性，不能替代组件归属审查。

下一步：审查每个字段的目标层级、测量方法、误差定义与依赖；取得所缺的组件附表及 Polaris 温度来源后，再按既有候选审查流程处理。浏览器权限校验恢复后，在已固定的生产构建上执行 36 对象运行时验收与性能采样。当前发布门禁仍为 6/17；未生成签署、未晋级资产、未改写运行时或物理内核。

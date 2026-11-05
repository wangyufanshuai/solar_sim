# R61–R66 来源补充与 Browser Use 核查 · 20260927-060

本次是来源与验收延续，不是新开发轮，新增生产代码为 0 行。上一轮 059 已取得 9 份原始材料；本次新增 1 份 Acrux 组件表、2 篇 Polaris 温度论文，共 3 份真实 HTTPS 响应。旧失败记录和旧审查包均保留。新内容不写入 app 数据、运行时或科学载荷。

## Browser Use 结果

用户指定的 Browser Use 已实际执行并完成公开来源任务，run_id 为 `f41ad569-166a-4dc3-9335-bce3dbb351af`。它读取目录说明并报告了组件表的下载结果；TSV 导航触发下载而非 HTML 表格显示，不能描述为页面中已看到表格行。返回报告中的查询 URL 被工具标为 `[REDACTED]`，未尝试恢复该返回字段。独立 HTTPS collector 保存了任务中明确指定的公开查询原始字节。

此任务没有访问本机 Solar Sim，没有应用截图、DOM 身份、36 对象循环、移动 viewport 或 GPU 性能证据。公开来源任务完成不关闭本机应用的 browser/visual/performance 门禁。已询问是否有 Browser Use 可访问的现有测试网址；尚未据此上传或发布项目。

## Acrux 组件表

[CDS I/239 组件表](https://vizier.cds.unistra.fr/viz-bin/asu-tsv?-source=I%2F239%2Fh_dm_com&HIP=60718&-out.all=1)实际含 HIP60718 的 A、B 两行。两行均为 Type=L、Source=C、Qual=A，视差同为 10.17 mas。依据[官方 ReadMe](https://cdsarc.cds.unistra.fr/ftp/I/239/ReadMe)，L 解允许不同自行但采用共同视差；B 行的视差状态位为 0，约束到第一组件 A。不能把两行当作两个独立视差测量，也不能将目录组件 A 直接等同于 Aa。

## Polaris 温度候选

| 原始材料 | 本次保留 | 限制 |
| --- | --- | --- |
| [Usenko et al. 2020 官方 PDF](https://oap.onu.edu.ua/article/download/216289/218290)，§2、Table 1 | 53 行：原报 HJD、Teff、σ、相位；PDF 第 4 页已目视核对 | 作者将温度归于 Cepheid Aa，但来自系统光谱，不能声称已空间分辨 Aa/Ab。方法内部精度不是完整系统误差。保留原报相位。 |
| [Turner et al. 2013 原始 PDF](https://arxiv.org/pdf/1211.6103)，Table 1 | 23 行：原报 JD、相位、Teff、s.d.、n、s.e. | 标准差、标准误及线比数量分别保存。论文平均温度的 ±1 K 是平均值标准误；其距离和脉动模式解释不并入 2024 年距离链。 |

对原 PDF 的复核纠正了检索重排文本的遗漏：2020 Table 1 的 HJD2458791.6463 行为 5999 K、σ=24 K、phase=0.488，不是空白。该表 53 行的 10 个数值字段均存在；未填零或插值。完整逐行候选在同名 JSON 中，可回到原 PDF、提取文本和行号复查。

Polaris 的“尚未取得温度原始来源”已推进为“已取得逐观测候选，归属与科学准入待审”。四颗恒星仍 `componentConfirmed=false`；12 项版权签署仍 pending；`scientificPayloadWriteback=false`。6/17 发布门禁未因公开网页任务或候选表增加而晋级。

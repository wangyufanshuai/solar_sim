# 后验解释：粗网格 Hamiltonian 诊断对第二谐波的低估

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: bounded numerical interpretation
- Origin Date: 2026-10-07
- Verification Status: POST-HOC ANALYSIS; four completed spatial cases; aggregate scientific gate still FAILED
- Version Label: diagnostic_dispersion_note_v1

本说明最初在 nonlinear-remainder-v1 的七组演化尚未结束时撰写，
当时只分析已经完整写出的 9/13/17³ 三组八个非零时刻采样。
以下运行后补充 25³ 数据与完整门禁结果，明确仍为后验解释，
不更改[已冻结的协议](EXPERIMENT-20261007-nonlinear-remainder.md)或通过条件。

## 无拟合的诊断算子预测

在平直背景的平面、小扰动物理度规上，Hamiltonian 的线性曲率部分为
H=−∂x²(δgamma_yy+δgamma_zz)。现有 direct-metric 诊断通过一阶导数构造
Christoffel，再对 Christoffel 做一阶差分；线性主部使用的是 D1∘D1，
不是直接的三点二阶导数模板。

周期中心差分 D1 对 Fourier 模式 exp(ikx) 的符号为 i N sin(k/N)。
因此它相对精确 Fourier 二阶导数的幅值响应为

    transfer(N,k) = [N sin(k/N)/k]²

对单位周期的 mode 2，k=4π。这个倍率完全由算子给定，没有用演化结果拟合。
非线性全量 H 不应被无条件乘除这个倍率；它只解释此处由 mode 2 主导的小振幅残差。

| N | mode 2 理论响应 | 八时刻有符号 mode 2 预测的相对L2误差 | H_primary 窗口RMS | H_fourier 窗口RMS |
| --- | ---: | ---: | ---: | ---: |
| 9 | .4974715041 | 8.04692e-8 | 4.46858e-8 | 8.98260e-8 |
| 13 | .7248524631 | 1.81671e-8 | 3.07225e-8 | 4.23844e-8 |
| 17 | .8306261371 | 8.81874e-9 | 2.13835e-8 | 2.57438e-8 |
| 25（运行后补充） | .9185659873 | 3.01980e-9 | 1.09874e-8 | 1.19614e-8 |

预测误差比较的是 c_primary,2(t) 与 transfer*c_fourier,2(t) 的完整复数系数，
对 t=1/8,...,1 求时间L2后归一化，不是仅比较绝对值或只挑一个时刻。
原生 C++、初值和全部原始 checkpoint 均未被修改。

四档网格的相邻窗口 RMS 阶分别为：

- H_primary：1.01887、1.35082、1.72657，前两项低于预设1.5；这些失败保留。
- H_fourier：2.04254、1.85857、1.98751；这些窗口 RMS 阶不能代替完整空间总门禁。

因此“小网格误差数值小”并不总表示求解器更准确：诊断的高频响应本身会削弱残差，
并影响所见空间阶。不能删除粗网格，也不能用除以 transfer 的修正数值替代已冻结门禁。
后续应分别检验演化精度与诊断精度；提高诊断精度不等于改进了动力学方程。

完整续算还显示：独立 H_fourier 的 13→17 最大采样空间 L2 阶为 **1.30856**，
M_x、Theta 的粗网格门禁也失败。因而这个算子响应只能解释一部分现象，
不能把所有空间失败归因于诊断，更不能宣称只改诊断就修复了内核精度。

## 固定数据身份

目录：`E:/CodexData/nr-k3-nonlinear-remainder-v1-20261007/`

| 已完成行文件 | SHA-256 |
| --- | --- |
| space-n9-a0.0001-s512-row.json | ce00ddd9db5ffd48821edecd7cb65ac16e972d4d3ea5662626f66e8f5c76127f |
| space-n13-a0.0001-s512-row.json | caadb31dee1c127b811107fd3fddb72dba7a88092408c1efa2da162e7f9d03e8 |
| space-n17-a0.0001-s512-row.json | bed143fba755a460000b995177353092dfee624a27bf2e24505cf9c7c7efd9c4 |
| space-n25-a0.0001-s512-row.json | a06f686e30ff04f2b307bc7ac2e43736829214dc52f8d0933066b573dd0c9ea9 |

每行包含各时刻 checkpoint 哈希、完整 H 平面场和规范/网格信息。
源码和二进制的运行前绑定在同目录 frozen-input.json 中；原始超时收据和
[显式续算收据](EXPERIMENT-20261007-remainder-continuation.md)的运行后身份复核均一致。
合并证据支持本次七组控制内的二次振幅缩放和小时间步影响，但空间总门禁未通过。
长时稳定性、强场、物理边界、标准 AwA 和 live 仍未验证。

方法学参考：[Daverio 等的 Fourier 分析](https://ar5iv.labs.arxiv.org/html/1810.12346)
区分波形幅值、相位和高模态污染，但该文不能替本项目提供验证结论。
另核对了 [GRChombo 的纯 Ricci 约束路径](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/CCZ4/CCZ4Geometry.hpp)：
compute_ricci 使用零 dZ 系数去掉 Z 贡献；本项目仍保留自身独立度规/Fourier诊断，
没有执行或移植该代码。

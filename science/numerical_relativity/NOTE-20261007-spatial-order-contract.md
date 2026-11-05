# 下一阶段：空间精度升级的接口与验证边界

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; Exa Search
- Origin Mode: repository-grounded design with subsequent implementation-status annotation
- Origin Date: 2026-10-07
- Verification Status: contract implemented in 0.3.0; stencil/integration gates passed separately; nonlinear dynamics still open
- Version Label: spatial_order_contract_note_v1

## 起草时的阻碍与后续状态

起草时，Python 的 Grid3D、FO 辅助场和周期 RHS 已有二/四阶选择；但
`fo_ccz4_checkpoint.py` 明确拒绝四阶网格，恢复时固定为二阶。
当时原生求解器也是二阶。不能只替换 C++ 的 d1 模板，却继续输出旧检查点，
使 Python 在重启后静默使用不同的空间离散。

随后0.3.0已实现显式四阶选项、v3检查点及跨后端阶数契约，
模板/集成实测见[独立冻结协议与结果](EXPERIMENT-20261007-spatial-order.md)。
本设计说明不是实验收据；以下保留原始依赖，不以新模板结果替代动力学门禁。

0.2.1 的邻点缓存只处理索引开销，仍为原来的二阶差分；其运行结果一致性
不能关闭上一轮空间收敛失败，也不能当成高阶格式验证。

## 最小完整变更集

1. 新版本检查点明确记录 `spatial_order`，Python/C++ 同时读写；旧 v1/v2
   必须继续解释为二阶。错误、遗漏或矛盾的 order/profile 信息须拒绝，
   不允许从用户界面或视觉 LOD 推断物理离散。
2. 原生四阶选项显式 opt-in；二阶默认、旧输入和旧结果保持可回归。
   周期索引覆盖 ±2 邻点；所有主场、独立辅助场、初值构造和 RK 中间态
   使用同一固定 order，不在演化中重建辅助变量。
3. manifest 记录 order 和对应检查点版本，Python 恢复后的 Grid3D 与
   auxiliary.derivative_order 必须一致；Python→C++→Python 与反向续算都验证。
4. 独立三轴制造解先验证模板矩、正负号、周期边界和观测阶，再验证实际
   非平面 58 槽 RHS/一步演化及 1/4 线程、拆分重启。
5. 动力学精度另用事先冻结的多网格、多个采样时刻、时间步与振幅控制验证。
   同时保留物理 H/M、独立 Fourier H、Theta、辅助定义/curl/代数约束，
   不能只提高诊断阶数或修改显示倍率后宣称方程演化变准。
6. 小振幅约束低于预先约定可测下限时记“不可测”，不能算通过；
   收敛阈值和网格不能根据候选运行结果追调。

清单1–4现已在0.3.0实现并通过独立模板/短步集成验证；
5的非线性多网格时间窗口实验仍待执行，6的可测性和预声明原则继续适用。
上述实现不代表全时窗约束收敛、物理边界或强场验证已经通过。

## 一手实现核查

Exa 本轮检索得到 5 个候选。GitHub 随后定位并完整读取了
[GRChombo FourthOrderDerivatives.hpp，固定提交 37e6595](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/BoxUtils/FourthOrderDerivatives.hpp)。
该文件把中心一阶、直接二阶、混合二阶、按 shift 符号选择的输运以及耗散
分成不同算子。中心导数需要 ±2 邻点，输运/耗散路径还使用 ±3 邻点，
并依赖调用端提供正确 ghost cells。

对本项目的推论：高阶空间导数、输运格式、耗散和边界填充应分别声明和验证，
不能把“中心模板升到四阶”写成完整 NR 稳定性升级。
没有复制或执行 GRChombo 源码；其边界、AMR、黑洞和波形能力不是本项目证据。

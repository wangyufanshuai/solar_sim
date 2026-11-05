# 33 辅助约束的半离散余额通过；链项加密证据不等于演化收敛

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: semidiscrete component controls and saved-data audit
- Origin Date: 2026-10-11
- Verification Status: REGISTERED DISCRETE CONTROLS PASSED; FULL PHYSICS ADMISSION OPEN
- Version Label: nr-discrete-reduction-controls-v1

## 本轮进展

新增 A/B/D/P 四族共 33 个辅助定义约束的半离散诊断。它使用独立装配的稠密
SBP(4,2) 矩阵，直接区分连续余额与有限差分链式法则误差；不假定差分满足连续
乘积法则。既有 444 项资格源、生产 RHS、参数、边界与原生二进制均未修改。

设 r=aux-map(Dq_base)，实际变化率是 aux_rhs-map(D(base_rhs))。本次核对的拆分为：

`r_dot = continuum_balance(q,Dq) + map[J(F_base)Dq - D(F_base)]`。

末项在一般非多项式场中非零。诊断保留它，不通过投影、辅助重构或方程改写将它
消掉。11 个基率的 Jacobian 另与复步方向微分对照；矩阵系数、正范数及 SBP 恒等式
通过精确有理数检查。旧的 lapse 单族诊断不被修改或替代为伪造的全约束验收。

82 项新控制及 68 项指定 Python formal-profile 回归通过，零失败、错误、跳过。
回归明确筛除前批 6 项原生测试，没有将历史测试数计入本轮。新测试 6.58 秒、回归
2.40 秒、完整运行器 27.172 秒。N9/N13/N17 上的 12 次原生调用均返回 0。
本批原生只有单线程，不把上轮线程复现证据当作本轮新线程测试。

## 余额核对结果

| 对象 | 最大绝对差 | 事前上限 |
| --- | ---: | ---: |
| Python 11 基变量率 | 1.110223025e-16 | 2e-12 |
| Python 33 辅助率 | 6.522560270e-16 | 2e-12 |
| Python 33 半离散约束率 | 1.637578961e-15 | 2e-12 |
| C++ 三轴导数与独立稠密矩阵 | 3.395938045e-15 | 2e-12 |
| C++ 11 基变量率 | 7.771561172e-16 | 2e-12 |
| C++ 33 辅助率 | 6.557254739e-16 | 2e-12 |
| C++ 33 半离散约束率 | 6.723788193e-15 | 2e-12 |

全部比较 rtol=0。C++ 约束率核对残差在面、边、角的峰值分别为
6.722053469e-15、6.723788193e-15、4.933553566e-15。每个区域保存全部 33 槽误差，
没有仅检查平均值或少数中心点。

这些是两种计算方式的**核对残差**，不是约束本身、物理解误差或轨迹误差的大小。
例如正号制造场 N9 的四族链项全网格峰值约为 A=3.46e-5、B=5.03e-5、D=2.44e-5、
P=3.15e-5，显著非零。省略链项的四族负对照均按预期失败。

## 静态加密结果

固定非多项式制造场、固定域 [1,3]^3、两符号、N9/17/33；只计算瞬时差分与余额，
不积分时间。以下范围覆盖两个符号与两次二倍网格加密：

| 家族 | 链项全网格 L-infinity 观察阶 | 固定中心点观察阶 |
| --- | ---: | ---: |
| A | 2.0172–2.0240 | 3.9783–3.9946 |
| B | 2.0152–2.0223 | 3.9736–3.9962 |
| D | 2.0018–2.0807 | 3.9770–3.9948 |
| P | 1.9943–2.0019 | 3.9783–3.9946 |

全部落入事前窗口：全网格 1.6..2.4、中心点 3.6..4.4；参与比较的误差均高于
原定 2e-13 分辨底线。未事后换场、调频率、选符号或改变阈值。
结果符合这组算子的边界二阶/内部四阶截断机制，但只代表这里选定制造场上的
链项趋零；中心点不是全内部区域范数，更不是完整 Einstein 解或约束的收敛率。
N33 只有 Python 静态诊断，原生仍限定到 N17。

## 证据身份与预算

449 项当前源码、运行前后身份和保存快照一致。源码快照 3,972,700 字节，不超过
原 4 MiB 上限。548 项清单产物加最终回执共 549 文件、54,795,687 字节，约 52.26 MiB。
64 MiB/600 秒、2 MiB 收尾余量、单原生调用 30 秒，以及 C>=3 GiB、E>=4 GiB+32 MiB
底线均保留。没有清理文件、安装依赖、重新编译或修改美术/live。

结束后重新读取了全部 12 次原始输入、输出、进程/起止记录及保存的状态、导数、
基率、辅助率、余额与链项。输入与状态打包逐字节一致；从保存基率/辅助率重新构造
余额，与已保存独立预期的最大差为 6.939e-18。全部 33 槽区域误差与观察记录一致。
两套完整 XML、548 项产物哈希、449 项源码/快照、原生 exe、OpenMP runtime、7 个
组件源及 4 个生成片段均重新核验，不仅依赖运行器退出码。

证据目录：`tmp/nr-shadow-evidence/nr-k3-discrete-reduction-controls-v1-20261011`。

| 文件 | SHA256 |
| --- | --- |
| qualification-gate.json | 4d9d878631a32e3a10f148d14cf50fcc4daea823d9917a6a9a741800282b215b |
| tests.xml | c1f7133f4cbc0cb23c9f23e8b353835bd6ee29db48dbdfdcd897b25dcd559c3f |
| formal-python-regression.xml | 0b243c99e0d29a34d9ae012846b0ec882fa0d70030b256febf02845666e38497 |
| discrete-reduction-observations.json | b8ab55577073033d656b4084a5917106940759689ae4295fa25f023914cf94d2 |

## 剩余门禁与下一依赖

仅 discrete_reduction_identity_consistent 和 manufactured_chain_refinement_observed 为 true。
independent_einstein_rhs_validated、非线性约束稳定、正式空间/约束收敛、物理边界、
完整科学矩阵、physical_gate、live_admission、scientificPayloadWriteback 仍为 false。
没有黑洞长期演化、AMR、视界、ADM/Psi4 或 CUDA 新验收，也没有修改原 N13 结论。
N9 正式 14/28/56 步矩阵仍未启动，需单独人工确认。

下一可行依赖是把新诊断用于有完整状态/RHS/边界身份的已保存轨迹：分别辨识体积
离散源与 SAT 对定义约束的贡献。使用前必须核对轨迹的算子、参数及状态/RHS 对应
时刻；不能把本批 volume-only 恒等式直接套给带边界项的总 RHS 并误判为物理失稳。
之后仍需获批的正式时空/约束收敛、真实边界和长期稳健性实验。

## 来源与技能影响

Exa 一次 5 结果检索并读取 [Strand 1994 官方摘要](https://doi.org/10.1006/jcph.1994.1005)，
只核对 SBP 的内外阶数结构，未声称读取付费全文。GitHub 核对
[SBP 系数固定 blob](https://api.github.com/repos/ranocha/SummationByPartsOperators.jl/git/blobs/793d768b0bb39df2339c63901a7eb300ddbbc779)
及 [GRChombo 固定版本中央差分](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/BoxUtils/FourthOrderDerivatives.hpp)。
没有安装或执行外部求解器，也不将 ghost-cell 差分当作本项目边界验证。
科研与测试技能使场、加密层级、观察窗、预算及失败保留规则事先固定，详见
[事前协议](EXPERIMENT-20261011-discrete-reduction.md)。确定性公式/截断控制不作统计
显著性推断，也不能据此认定项目达到世界前沿。

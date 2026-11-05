# 当前规范的固定背景物理约束核通过；变背景与CPBC仍未验收

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: bounded deterministic diagnostics and controls
- Origin Date: 2026-10-11
- Verification Status: REGISTERED CONTROLS AND FIXED CASES PASSED; NONLINEAR PHYSICAL ADMISSION OPEN
- Version Label: nr-current-profile-constraint-closure-v1

## 本轮实质进展

上一批证明固定旧样本的SAT实现一致性，本批补入当前规范参数下的完整源项，
并检查事前固定的物理约束集合。新增诊断，不改已资格化460源、生产方程、
边界目标、原生文件、初值、步长或科学阈值。

53项新增测试、66项原谱SAT Python回归全部通过，零失败、错误和跳过；分别
用时1.02秒、1.73秒。整批35.531秒。没有新演化、原生调用、自动重跑或完整N9矩阵。
原N13 temporal screen的未分辨结论以及所有历史失败保持不变。

## 固定背景的物理约束核

检查L(k)=J+i k_j A^j，而非仅principal symbol。J显式包含11个ODE中的辅助变量
耦合、行列式/迹松弛及Theta/Z阻尼；参数与当前候选合同一致：f=3 alpha chi、
mu=.2 chi、tau^-1=1、kappa1=.1、kappa2=0、eta=0。完整58列源探测独立核对通过。

约束C共43行：33辅助定义、2代数约束、H/M四条、Theta/Z四条。没有追加CA、CA²
或删除约束来使系统闭合。完整复数C、L、诊断B、零空间和见证向量均落盘。
纯规范扰动和两种TT极化以显式构造检查，不由SVD生成；遗漏源项和错误辅助驱动
的负对照被检测。数值SVD右逆只用于审计，没有投影或修补任何演化状态。

三个常系数背景各配七个固定波向量，共21/21组合通过。非单位常量metric仍是
**平直背景**，不能称为曲率背景。零波约束秩39，其余秩43，在三档预定rank阈值
下均一致；所有候选零空间自由度保留。

| 指标 | 最大值 | 事前上限 |
| --- | ---: | ---: |
| 显式J与完整源探测的绝对差 | 1.171285291e-14 | 2e-12 |
| CL-BC归一化无穷范数 | 1.782908532e-14 | 2e-12 |
| CLN归一化无穷范数 | 6.732689095e-16 | 2e-12 |

这证明限定背景、限定波向量下的数值核不变性，不是整个波数域、变背景或非线性
subsidiary PDE的证明。B(k)是诊断矩阵，不能直接当作局部约束保持边界算子。
当前profile的空间变化在一般背景中产生的项仍须单独推导；本批明确拒绝把非零
动力学/辅助场静默清零后当成原背景。

## 全部初始边界节点的解析相容性

原N13 v2的reference.npy与独立Schwarzschild初始ADM解析jet一致。使用解析导数
计算13³网格全58率，并核对全部866个唯一边界节点（1014个面关联节点）。

| 指标 | 最大绝对值 |
| --- | ---: |
| 原静态目标与独立解析值之差 | 3.330669074e-16 |
| 静态全58率，全2197节点 | 9.092171867e-17 |
| 脉冲T=0边界全58率，866节点 | 6.619352096e-17 |
| 脉冲与静态目标的边界值之差 | 0 |
| 脉冲与静态目标的边界一阶导数之差 | 0 |
| 静态Hamiltonian约束 | 2.799103167e-17 |
| 静态Z与33辅助定义约束 | 0 |

内部脉冲率最大0.0279348250383，确认没有通过把内部脉冲也替换为静态目标来
制造零率。原目标比较低于既有2e-14初始值界，其余低于既有2e-12界，rtol=0。

这些是解析导数下的静态及T=0一阶相容性，不是SBP离散边界误差为零，也不是
演化后、脉冲到达边界时的相容性。脉冲正时间没有已知解析解，本批未制造这种
参考解。吸收性能、约束入射控制、共同能量估计、长期稳定均未由此获得验收。

## 身份、产物与资源

运行前后465项源一致，逐项与保存快照复核。快照4,118,677字节，低于既有4MiB
上限，剩余75,627字节；后续新增闭包须继续做启动前大小检查，不能默默扩大上限。
593项索引产物加最终回执，共594文件、17,653,973字节（约16.84MiB）。
包括105个物理核矩阵/向量、6个源矩阵、8个解析目标场/掩码及完整XML。

结束后重新核验完整产物清单、源码快照、53/66个XML测试、保存矩阵及解析场；
重算完整C/L与诊断闭合报告，核对原N13 v2科学清单、父门禁和原生身份，均通过。
控制通过与物理核闭合分为不同字段，没有将测试运行成功自动升级为物理验收。

证据目录：`tmp/nr-shadow-evidence/nr-k3-profile-constraint-controls-v1-20261011`。

| 文件 | SHA256 |
| --- | --- |
| qualification-gate.json | 7f7bfa4a25374288ab2ca463ad00ca27b482dd54db960a07cc6d1527c7ff1f13 |
| tests.xml | fbb2665313a5f475e06a4f58e1f82bef4866d9a989f8f28fa5f20a7927c68e94 |
| spectral-python-regression.xml | 8b1edb0ffaaa30dcba7ea2a32ee239034379fab3885f6b673a4e2c3db7da9dd7 |
| profile-constraint-observations.json | eafd9ce1e746fc11e97491b772b418592fe6a145a8e500352fa55b16d3799e23 |

原64MiB/600秒、2MiB收尾、C>=3GiB、E>=4GiB+32MiB不变。结束后一次测量C约
9.42GiB、E约18.01GiB；仅代表当时余量。无清理、安装、编译、美术或live改动。

## 下一依赖与门禁

本批只记录fixed_background_constraint_kernel_closed及
static_and_initial_target_consistent。变背景传播、非线性稳定、物理CPBC、共同
对称化子、正式约束收敛、黑洞/AMR/视界/ADM长期守恒/Psi4/GPU、physical_gate、
live_admission和scientificPayloadWriteback仍未验收，不得晋升。

下一步应在有空间变化的当前背景下推导物理约束传播，保留系数时空导数和
全部零阶项。先通过一般jet上的独立恒等式与已知解对照，再把约束入射信息接到
SAT设计与受控扰动实验；不能把本批数值B(k)直接移植成“CPBC”，也不能仅调
阻尼或修改旧目标掩盖定义缺陷。N9完整科学矩阵继续等待单独人工授权。

## 外部依据与技能影响

Exa一次有效检索请求5个结果，去重后主要为同一篇论文。arXiv HTML提取只返回
摘要，随后核读[作者论文HTML镜像](https://ar5iv.labs.arxiv.org/html/1707.09910)
II.2、II.3中辅助定义、ordering约束及Eq.12源/松弛项；
[出版记录](https://doi.org/10.1103/PhysRevD.97.084053)用于身份核验。
这不是独立论文五篇或完整边界文献综述。论文没有为本项目变系数合同及边界
提供现成准入证明。本轮未复制外部实现或修改GitHub。

科研与测试技能将43行约束、21组合、负对照、阈值与预算在首次执行前固定，详见
[事前协议](EXPERIMENT-20261011-profile-constraints.md)。没有统计显著性或“世界
前沿内核已经完成”的推断。上一goal轮及本轮均属有证据的实质进展；总目标保持active。

# FO-CCZ4 代数约束策略：外部核查与下一候选边界

## Material Passport

- Origin Skill: Exa Search; academic-research-suite / experiment-agent
- Origin Mode: targeted literature/source comparison and prospective method planning
- Origin Date: 2026-10-09
- Verification Status: SOURCES READ; HISTORICAL PROPOSAL, COMPONENT FOLLOW-UP LINKED BELOW
- Version Label: nr-algebraic-constraint-policy-analysis-v1

后续状态：独立局部映射现已实现并完成 30 状态修正预算的双进程复现；
其中动量约束存在变差反例，尚未接入演化。本文保留原始方法规划，最新证据见
[组件结果与下一方法门禁](RESULTS-20261009-algebraic-projection.md)。

## 查证范围

用 Exa 完成论文、实现两个方向的三次定向查询，共检查 15 条返回结果；
其中有重复与不相关编译器结果，不能称为 15 个独立科学证据。
进一步读取原始论文相关章节、Peano 官方接口文档，以及固定提交的 GitHub
Fortran 文件。没有下载／编译／运行外部求解器，也没有引入第三方源码。

## 1. 原文与当前分支并非同一数值方法

[Dumbser 等的 FO-CCZ4 原始论文](https://ar5iv.labs.arxiv.org/html/1707.09910)
区分弱松弛与代数约束强制满足。其第 IV 节所述测试在每步开始时处理
det(h)=1、tr_h(a)=0 和 h^ij D_kij=0 三类代数约束，而非在时空预测器中处理；
相应测试令 tau 趋于无穷，关闭该松弛源项。

该文的离散算法是 ADER-DG，并不是本项目的 SBP/SAT+RK4。当前分支
tau_inverse=1，明确不做投影。因此“有同名 FO-CCZ4 方程”不足以继承论文
的稳定性、黑洞或长期演化结论。原文也讨论允许代数约束偏离的扩展解空间；
不能把本项目 1e-10 的工程停机线误说成广义相对论本身的物理失稳边界。

[Peano 官方 CCZ4 接口文档](https://hpcsoftware.pages.gitlab.lrz.de/peano/db/dbd/namespaceapplications_1_1exahype2_1_1ccz4.html)
公开了局部状态约束处理和预估 Euler 步后修正时间导数两类接口。
这是实现存在的证据，不代表这些接口已在本机验证，也不决定本项目的 RK 阶段策略。

GitHub 核对的 [EinsteinConstraints.f90](https://github.com/iamholger/ccz5/blob/31e8ed262e1a065ad91381306859162e76402120/src/EinsteinConstraints.f90)
确实先规范化 h，再移除 a 和每个 D_k 子矩阵的迹。
读取提交 `31e8ed262e1a065ad91381306859162e76402120`，文件 blob
`71df73e714f7ebe4d230fb5e94867760266cd2ad`。这是公开实现的代码对照，未核实它
与所有原论文运行的版本对应关系，不能称为已执行的独立成熟后端。
其 59 槽布局也不同于本项目 58 槽，禁止直接复制索引。

## 2. 本地已有能力与缺口

- [现有松弛策略](fo_ccz4_constraint_control.py) 只处理 h 和 a 的 RHS；
  独立辅助场没有投影或重构，零松弛率仍保留 legacy 路径。
- [nr3d 的 BSSN 投影](nr3d.py) 已提供 h 单位行列式与 a 无迹处理，
  但没有覆盖 FO-CCZ4 独立 D 的三条迹约束。
- [边界 envelope 投影候选](fo_ccz4_constraint_envelope_boundary_shadow.py)
  是冻结入射特征振幅上的线性代数操作，不是体状态的上述三约束投影，
  更不是已经完成的非线性 CPBC。

因此下一工作应复用已有数学与测试经验，而不是把现有两个不同的“投影”
接口混为一谈。未投影延时探针已在第 12 步第二个 RK 阶段触发原有速度合同；
该失败及所有历史回执保持原样，详见
[延时探针结果](RESULTS-20261009-longer-window-probe.md)。

## 3. 建议的下一候选：显式、可计量、默认关闭

先只实现独立纯函数候选，不接 live，也不原地更改当前求解器。可研究的局部
映射为 h'=s h，s=det(h)^(-1/3)，随后按 h' 的逆矩阵分别移除 a 和 D_k 的迹。
必须明确其余场是否保持不变；不能声称这只是无损坐标重写。

需要依次关闭的门禁：

1. **独立代数控制**：非对角正定 h、非零 a/D，三约束残差、幂等性、
   输入不可变、拒绝非正定／非有限输入。没有调用 live 或改变旧默认。
2. **物理改变计量**：保存投影前后 58 场差、重建物理度规与 K_ij 的差、
   H/M 与差分约化约束；三条代数约束变小不等于 Einstein 约束变小。
3. **时间离散策略**：分别论证步边界／RK 阶段应用位置；不能从 ADER
   预测器策略直接推出 RK4 策略。松弛率与投影策略不得同时调参来掩盖原因。
4. **分清初值合同**：若投影了原离约束扰动，t=0 问题已改变，必须保存
   原始与处理后初值，不能宣传为“相同初值跑得更好”。另用共同满足代数
   约束的解析初值进行公平的空间／时间收敛对照。
5. **新的演化与后端验证**：旧无投影模式保持字节一致；新候选单独冻结
   稳健性、收敛和物理基准，记录每次修正量；通过后才考虑 native 移植。

本轮延时探针已经失败，保留失败而不是把这个候选用于回改它。
在新候选验证完成前，不调高 1e-10 上限、不自动减小扰动、不直接加大阻尼。
该路线是有来源支持的工程研究建议，不是保证能解决全部边界或强场问题的结论。

# 离约束完整 58 变量公式对照通过，科研演化验收仍开放

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: independent formal Taylor geometry controls and saved-data audit
- Origin Date: 2026-10-11
- Verification Status: REGISTERED COMPONENT CONTROLS PASSED; FULL PHYSICS ADMISSION OPEN
- Version Label: nr-formal-fo-profile-controls-v1

## 完成内容

新增形式二阶 Taylor 几何参考，补齐此前未独立覆盖的 a、K、Theta、GammaHat、b 共
14 个离约束率分量，结合前批 44 个度规/规范及辅助率，组成完整 58 槽瞬时参考。
参考不导入生产几何、RHS 或差分代码；通过通用逆矩阵微分、连接定义和 Ricci 收缩
构造几何，不复制生产 FO 展开式。既有 439 项资格源及原生二进制未修改。

这里的“完整”仅指本项目冻结规范/参数合同中的 58 槽，不指所有 CCZ4/BSSN 变体、
物质耦合或完整科研准入。此参考是结构独立的公式对照，不是第三方独立科学验收。

74 项新测试通过；66 项指定 reduction Python 回归通过，其 6 项原生测试明确筛除，
不冒称重跑了历史全部 72 项。所有已选测试均零失败、错误、跳过。
新测试 8.96 秒，回归 1.35 秒，完整运行器 34.328 秒，42 次新原生调用全部返回 0。
1/2/4 线程数值 payload 逐字节一致，6 组另起 1 线程进程的完整 stdout 逐字节一致。
没有运行时间步、SAT、检查点续算、新编译、N9 正式矩阵或 GPU。

## 数值结果

| 对象 | 最大绝对误差 | 事前上限 |
| --- | ---: | ---: |
| Python 全 58 槽，36 组场/松弛/阻尼组合 | 5.551115123e-17 | 2e-12 |
| C++ 全 58 槽，全网格 | 7.494005416e-16 | 2e-12 |
| C++ 全 58 槽，面 | 7.494005416e-16 | 2e-12 |
| C++ 全 58 槽，边 | 5.273559367e-16 | 2e-12 |
| C++ 全 58 槽，角 | 4.996003611e-16 | 2e-12 |
| C++ 三轴导数与解析 jet | 2.386979503e-15 | 2e-12 |

所有比较 rtol=0。原生场沿用 6 组至多二次的规范槽，N9、[1,3]^3；SBP(4,2) 包括
边界行都能精确微分至舍入误差。因此这些数据不测一般光滑场的截断误差或收敛阶。

另通过 12 组与独立物理 ADM/Z4 参考的一致面交叉检查、3 组通用几何检查、3 组
常截面曲率解析 Ricci 检查、A/B/D/P 四类反对称 ordering 扰动检查，以及遗漏项
反例、参数拒绝、只读结果与导入独立性检查。未运行任何正时间轨迹。

## 已澄清的几何边界

当 D、P 偏离真实度规导数时，论文定义的形式几何不是从采样度规重新求导得到的
几何。这里使用 dh=2D、对称化 dD、d(lnphi)=P、对称化 dP，按乘积法则构造
gamma=h/chi 的形式二阶 jet；这明确保留一阶扩展系统的离约束含义。

负对照显示，真实恒定度规的 Ricci 为零并不迫使离约束形式 Ricci 为零。
回到辅助/代数定义一致面时，新参考与独立物理 Z4 参考的 58 个率、度规两阶 jet
和 Ricci 恢复一致。不能将离约束形式曲率直接称为真实采样度规的物理曲率。

一般共形度规的收缩连接必须保留行列式导数项：
GammaTilde^i = -partial_j hInv^ij - hInv^ik partial_k log(sqrt(det(h)))。
首次运行前的静态复核修正了一个新负对照测试中该修正项的正负号；生产公式和
事前验收阈值未改，没有失败后重跑或改阈值求通过。非零迹的 trace-ordering 反馈
也显式保留。当前控制没有证明约束传播长期稳定。

## 证据复核与资源

新增 5 项资格文件，与原有 439 项组成 444 项闭包；当前源码、运行前后身份和保存
快照全部一致。完整证据有 729 个清单产物，加最终回执共 730 个文件、43,207,375
字节，约 41.21 MiB，低于 64 MiB 上限。600 秒、2 MiB 收尾余量、单原生调用 30 秒，
以及 C>=3 GiB、E>=4 GiB+32 MiB 底线均保持不变。没有清理用户数据。

运行后重新读取了 42 次保存的原始输入、输出、调用起止记录与独立预期数组，检查
输入与状态的字节一致性、每槽/每区域误差、线程与新进程重复。再次核验了全部
729 项产物哈希、444 项当前源码/快照、两套完整 XML，以及 exe、OpenMP runtime、
7 个组件源和 4 个生成片段身份，不仅依赖测试退出码。

证据目录：`tmp/nr-shadow-evidence/nr-k3-formal-profile-controls-v1-20261011`。

| 文件 | SHA256 |
| --- | --- |
| qualification-gate.json | 042729bd6d603d50f43daf10875fb30295ee773b58bf4a2c579b980486f3e48c |
| tests.xml | b2f8fbbeb2ad0dbe3003ab7465b41f6c6937e1a11729d1cd4877e7c6ef1bca8e |
| reduction-python-regression.xml | 4e2368e469cc6630e95f986f409af58f92b780447cb65d315d132704152493bd |
| formal-profile-observations.json | ab8d63cdbbaec791f10e70db6182af688be8e6ca7915058d5d4d22c482ebac85 |

Ruff 检查及格式检查通过。原 N13 v2 回执 SHA 仍为
`a7a7c8b7ebdc9447c31d4d70875e8b42f50a2a02d8b769a85457dce05e143583`；
其未分辨结论不重判，v1 中断文件保留且未作为父检查点使用。

## 仍未通过的门禁与下一依赖

仅 published_full58_profile_consistent 和 native_full58_profile_consistent 为 true。
independent_einstein_rhs_validated、非线性约束稳定、完整科学矩阵、空间收敛、物理
边界、physical_gate、live_admission 和 scientificPayloadWriteback 仍为 false。
瞬时制造场一致性不能替代独立科学轨迹与时空/约束收敛，也不验收黑洞长期演化、
AMR、视界、ADM/Psi4 或 CUDA。

接下来应检查真实离散差分下的乘积法则误差与约束传播、边界处理，并完成经批准的
轨迹和收敛实验；不能把本批多项式的舍入级一致性当作一般离散恒等式。
N9 的完整 14/28/56 步、T=1/8、832 MiB/40 分钟矩阵仍未启动，须单独人工确认；
自动 goal 续行或组件通过不替代该授权。

## 来源与方法披露

Exa 直接读取 [Dumbser 等的 FO-CCZ4 原作](https://ar5iv.labs.arxiv.org/html/1707.09910)，
重点为式 (12)-(28) 与 II.3；本轮无新搜索。GitHub 只读
[GRChombo 固定版本几何实现](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/CCZ4Geometry.hpp)，
blob `b03cfb37f0072c9289b33659d9765453bbf6a319`，用于明确二阶 CCZ4 与本项目一阶
离约束几何的区别；没有复制、执行或声称验收了外部后端。
科研与测试技能使案例、反例、预算与容差事先固定；详见
[执行前协议](EXPERIMENT-20261011-formal-fo-profile.md)。本批为确定性公式控制，不作
统计显著性或世界领先水平推断。

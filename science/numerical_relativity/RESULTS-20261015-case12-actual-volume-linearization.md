# 固定 case12 实际连续体体积方程：完整实数公式线性化通过

## Material Passport

日期：2026-10-15，Asia/Shanghai。Origin Skill：academic-research-suite / experiment-agent。AI-assisted。Verification Status：本地完整精确计算、独立标量算法重放及两路只读终态审计通过；不是外部团队复现。顶层科研目标未完成。

## 本批确认的结论

固定 case12 的实际 `_fo_ccz4_volume_rhs_3d`、几何、规范、状态装配和 RHS 装配，经公开登记的源码实数公式解释，在全部 **58 个独立离约束状态和 174 个独立空间梯度** 上的一阶 Fréchet 导数，与已接受的 J58、K58 多项式符号完全一致。基准平衡向量 F0 和四份完整差矩阵 RJ/Rx/Ry/Rz，共 **13,514 槽严格为零**。没有使用方向抽样、行删减、det/trace 投影或辅助变量重建。

固定背景为 α=17/20、χ=18/25、β=(3/100,−1/25,1/20)，h=LLᵀ，L=[[1,0,0],[3/25,1,0],[−2/25,3/50,1]]；其余动力学和辅助背景为零。完整参数见 [基准执行记录](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-actual-volume-linearization-controls-v1-20261015/baseline__execution.json)。原中心化状态坐标 q6=ln α、q10=(ln χ)/2 保持，实际链式系数分别为17/20和36/25。

本批只新增 `actual_volume_real_formula_linearization_validated=true`。这连接了前序固定常背景线性系统证书与实际连续体体积方程的实数公式；不证明 binary64 执行、实际物理约束诊断桥、SBP/SAT 离散能量、边界适定性、变背景或非线性稳定性。所有23项限制标志均保持false，含 physical/live/scientificPayloadWriteback。没有进行科学时间演化或GPU运行。

## 唯一运行与身份

目录：`tmp/nr-shadow-evidence/nr-k3-case12-actual-volume-linearization-controls-v1-20261015`。

| 项目 | 实际终态 |
|---|---|
| gate SHA256 | `ba5bff599828bf9185db40c72e6421c337fe89b60fab5acde4329f534b4502f0` |
| worker SHA256 | `816ea01a8870aee222aa829b100a852d6e19e4022bcd4a7de9e66e94c0f2539d` |
| replay SHA256 | `0a96abe07f82719030d6bf81e1a335ccada39047b5e6d13a814507e7c9a2d6af` |
| run ID | `418e12ff-777a-482c-9746-16358e0c9358` |
| worker / 完整监护 | 214.781 / 318.844 秒 |
| 外层会话 / worker PID | 66010 / 36748；exit0 |
| Job清理 | assigned=true；cleanup_verified=true；所属进程0→0 |
| 重试 / 中断 / 注入 | 0 / false / false |

[机器终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-actual-volume-linearization-controls-v1-20261015/qualification-gate.json)为 complete，passed/completed/computation_completed=true、errors=[]。原600秒、64 MiB磁盘输出、2 MiB终态预留、8 MiB来源快照限制和单数值线程保持。C/E磁盘保护保持。未在受限批次之前补跑数学或测试；未扩大资源预算。

| 阶段 | worker相对秒数 |
|---|---:|
| 输入、来源及历史完成 | 85.078 |
| 158项控制完成 | 90.593 |
| 全部36份生产证据保存 | 100.593 |
| 三组完整独立复算完成 | 108.968 |
| worker封存完成 | 214.750 |

## 完整输出与真实负控

每组 baseline、kappa1_mutant、ordering_mutant 均保存 F0、J、Ax、Ay、Az、RJ、Rx、Ry、Rz 九个完整矩阵及执行记录。三组共 **27矩阵、80,910槽**，含每个零槽。加来源、父证据、范围、变异、统计、接受记录，合计36份输出。任何桥差非零也会在判定失败之前保存全部候选及独立重放，不能只留下通过子集。

κ1从1/10改为1/5后，实际方程完整重算得到 J 的116个变化槽，与旧J符号的同槽非零差一致；三个空间矩阵保持相同。ordering_scale从1/5改为2/5后，Ax/Ay/Az各84个变化槽均产生同槽非零桥差，J不变。两种变更复用原符号均被拒绝，没有预填理论模式。

另实际执行三种错误中心化链式规则：漏α中心、漏χ中心、漏χ的因子2。正确系数减错误系数的实际差依次为 −3/20、−14/25、18/25，全部拒绝。这些是标量chart控制，不宣称是固定case12 RHS可观测反例。

## 源码解释与独立性的边界

11个源码文件、39项原AST绑定和140项显式适配均保存原始/适配AST。适配包括127个十进制字面量的精确有理解释、两次标量转换、一个类型门、一个对象数组门、两处中心化exp、一个形式载体摘要及六个未使用BSSN便利方法的省略。原 `_finite_array`、`state_from_slots`、三项对称装配和 `_rhs_components` 实际编译执行。

生产器使用精确稀疏前向jet及Gauss–Jordan/消元。独立重放使用精确反向标量图与独立3×3余子式/伴随矩阵公式；每组实际27,175节点、116次反向扫描、61,976条边访问。重放从原9份父输入和同一实际源码生成导数，不以生产器保存的Jacobian作为生成输入。

两种算法共享源码AST适配、对象数组路由、中心化chart和状态/结果装配；这部分是共同可信基础，不是完全独立物理实现或Python语义形式化证明。完整声明见 [独立重放记录](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-actual-volume-linearization-controls-v1-20261015/independent-replay.json)。

## 测试、来源与只读审计

| 项目 | 实际记录 |
|---|---|
| 控制测试 | 55函数、158实例，0失败/错误/跳过 |
| focused / 冻结整数控制 | 34/85 与 21/73 |
| 来源及快照 | 687文件、7,316,190字节；原678文件保持 |
| 历史保护 | 28目录、20,409文件、541,294,625字节 |
| 完整本批文件 | 789份产物摘要加gate，共790文件、18,433,425字节 |
| 父输入 | 9份、1,524,077字节 |
| 重放输入 | 45份、3,252,951字节 |
| 阶段回执 | 44份 |
| 实际加载的运行时文件记录 | 86份、6,409,713字节（85个NumPy文件与Python可执行文件） |

运行时清单不覆盖全部标准库、OS DLL或pytest子进程依赖；已安装版本信息不等于实际加载文件证明。

root与另一审查agent分别只读核对全量产物、当前来源/快照、全部历史文件集合与摘要、运行时、父输入/原始J/K归档、重放输入、XML测试身份与AST注册、全部矩阵槽和精确范围；最终均无未解决问题。root初次审计把排序后的XML列表与原顺序列表直接比较，产生一项审计脚本排序错误；针对该项按原序和集合分别复核，两者完全一致、158身份唯一。此项未改证据或重跑测试。旧energy-v1失败终态保持。

## 接续点

下一步把实际物理约束诊断完整线性化连接到已接受 C0+C1ζ+C2ζ，而后推进合法初边值、离散能量与可分辨收敛。69行辅助诊断不包含H/M/Z，不能代替43行物理约束。完整实际来源候选是 `fo_ccz4_relaxation_convergence.constraint_fields`；同一nonlinear driver的 `metric_constraints` 也须按真实输出核对，保留离约束迹项和对称冗余，不由公式相似推断通过。下一批尚未运行。

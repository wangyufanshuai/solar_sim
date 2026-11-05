# 固定 case12 实际物理约束诊断：完整连续体实数公式桥通过

## Material Passport

日期：2026-10-15，Asia/Shanghai。Origin Skill：academic-research-suite / experiment-agent。
AI-assisted。Verification Status：本地完整精确计算、独立标量算法重放及两路只读终态
审计通过。本记录不是外部团队复现，顶层科研目标未完成。

## 本批实际确认

固定 case12 下，实际 `fo_ccz4_relaxation_convergence.constraint_fields` 的完整物理
43 项诊断，经登记的连续体导数及实数公式解释，其一阶 Fréchet 变分与已接受的
C0/C1/C2 多项式系数逐槽完全一致。空间 jet 含 **58 个独立状态、174 个独立一阶空间
导数和348个独立对称 Hessian，共580种子**。未投影 det/trace、未重建辅助变量，
未限制辅助 curl，也未用有限方向或坐标轴抽样替代完整系数。

真实诊断从 metric/extrinsic curvature 计算 H/M，使用真实 contracted Christoffel；
原 Ghat 在完整 jet 上经 `Z_i=h_ij Ghat^j/2` 转成下标 Z。十个完整43×58目标块来自
C0、C1的x/y/z系数和C2的x²/xy/xz/y²/yz/z²系数。独立混合 Hessian 是实际二阶导数，
xy/xz/yz系数未除2。

同批实际执行 nonlinear driver 的 `metric_constraints`，保留 **49个原始标量**。
其40个独立量的背景/580导数与physical43对应行一致；九个 C_D 对称冗余的背景/导数差
全部为零。driver 原接口仍没有 Ghat/Z，本批没有给它增加或虚构该字段。

以下五份必零矩阵的 **53,501槽严格为零**：baselineF0的43槽、baselineR的24,940槽、
driverF0的49槽、driverAgreement的23,240槽和driverSymmetry的5,229槽。
实际 baselineC 有181个非零系数，driverC有160个非零系数；“必零门通过”不意味着
全部诊断矩阵或负控残差为零。

固定背景为α=17/20、χ=18/25、β=(3/100,−1/25,1/20)，h=LLᵀ，
L=[[1,0,0],[3/25,1,0],[−2/25,3/50,1]]，其余动力学和辅助背景为零。
q6=lnα、q10=(lnχ)/2 的中心化状态坐标保持。全部执行身份见
[基准执行记录](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-actual-constraint-diagnostic-controls-v1-20261015/baseline__execution.json)。

## 唯一受控运行

目录：`tmp/nr-shadow-evidence/nr-k3-case12-actual-constraint-diagnostic-controls-v1-20261015`。

| 项目 | 实际终态 |
| --- | --- |
| gate SHA256 | `285b84e81940b3465853a4752d1b7db4319a4bf2f6b4216998968e4669165c51` |
| worker SHA256 | `dcb8afa448456b9433612422cb97843015b2470e1e0278c4c11d6a85f5262964` |
| replay SHA256 | `efaf4b1b25de8bf0a614630416421a75a42b92de45924294206b6795aa5a737f` |
| run ID | `362c1ed1-c54d-4720-8a4b-8062955f5cfc` |
| worker / 完整监护 | 163.578 / 206.563秒 |
| 外层会话 / worker PID | 70850 / 50120；exit0 |
| owned清理 | cleanup_verified=true；进程0→0 |
| 自动重试 | 0 |

[机器终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-actual-constraint-diagnostic-controls-v1-20261015/qualification-gate.json)
passed/completed=true、errors=[]，worker phase=complete，独立重放
passed/computation_completed=true。原600秒、64 MiB证据磁盘输出、2 MiB终端预留、
8 MiB来源快照及C/E磁盘保护未扩大；单数值线程和owned进程控制保持。
没有预跑完整数学或测试来挑选候选，也没有停机后补算、拼接或重试。

| 阶段 | worker相对秒数 |
| --- | ---: |
| 来源、历史和父输入完成 | 62.047 |
| 138项控制完成 | 75.906 |
| 全部22份生产记录保存 | 83.265 |
| 完整独立重放完成 | 89.390 |
| worker完成阶段 | 163.562 |

## 完整输出与两种真实负控

baseline、momentum_trace_mutant、connection_target_mutant 各保存 F0(43×1)、
C(43×580)、R(43×580)及执行记录。另保存 driverF0(49×1)、driverC(49×580)、
driverAgreement(40×581)、driverSymmetry(9×581)。总计 **13张完整矩阵、206,707槽**，
其中基准/driver为106,861槽，两个负控为99,846槽。加三个执行记录及六份最终元数据，
共22份注册输出。零槽和目标外行全部保留。

| 真实源变异 | 实际变化槽 | 同槽非零原目标差 | 目标外变化 |
| --- | ---: | ---: | ---: |
| actual_trace赋值改stored K=q17 | 18 | 18 | 0 |
| contracted Christoffel改−∂j h^{ij} | 18 | 18 | 0 |

第一变异替换实际 `actual_trace` 赋值，因此也语法改变H中的平方项；本次完整线性化
实际确认变化仅在M的1–3行，不能据此宣称非线性H不变。第二变异保留完整h/2降低指标，
实际变化仅在Z的5–7行。两者均从变异后的真实源码完整重算，未手填理论delta。
每个拒绝槽同时相对baseline改变、相对未改原目标有非零差，未使用两个无关位置凑成因果。
完整记录见[变异回执](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-actual-constraint-diagnostic-controls-v1-20261015/mutations.json)。

## 源码解释和独立性的准确边界

新增来源桥有8项binding记录和12项适配：9个精确十进制字面量（含leading-dot）、
1个centered chi exp、2个centered log，完整保留父39项binding manifest。
binding区分执行体与仅作来源参照的节点，不能把数量当作全部函数已执行。

实际 relaxation 诊断体及driver metric_constraints体执行，但原FD2/FD4-FFT导数和
driver SBP轴导数被明确替换为continuous derivative callback。原driver.state仅绑定AST；
私有适配绕过field的float64转换并直接调用原已适配state_from_slots。常背景log常数在
被空间微分的确切节点中心化。三项错误chain gap继承已通过volume父；本批新增实际exp/log
小路径控制，没有把父gap重新冒充新执行记录。

生产使用稀疏580种子前向jet与原精确数组运算；独立重放使用精确反向标量图和独立3×3
余子式/伴随矩阵逆及行列式。三组真实反向计算记录为：

| case | 节点 | 反向扫描 | 边访问 |
| --- | ---: | ---: | ---: |
| baseline（含driver49） | 4,029 | 208 | 7,096 |
| momentum_trace_mutant | 2,347 | 108 | 4,434 |
| connection_target_mutant | 1,830 | 117 | 3,148 |

独立端重新执行实际三组诊断及baseline driver，不用生产保存的C作为导数生成输入；
重新提取父多项式系数，复算完整残差、driver映射、统计和负控因果。
两端共享原/适配AST、对象数组路由、chart、packing与编码器，构成明确共同可信基础。
这不是独立物理实现、Python语义形式化证明或binary64逐位执行验证。详见
[独立重放](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-actual-constraint-diagnostic-controls-v1-20261015/independent-replay.json)。

## 控制、来源和终态审计

| 项目 | 实际记录 |
| --- | --- |
| 测试注册与执行 | 49函数、138实例，0失败/错误/跳过 |
| focused / 冻结整数控制 | 28/65 与21/73 |
| 测试XML耗时 | 12.710秒 |
| 来源及快照 | 696文件、7,497,990字节；原687文件保持 |
| 历史保护 | 29目录、21,199文件、559,728,050字节 |
| 本批完整文件 | 774份产物摘要加gate，共775文件、22,354,132字节 |
| 父输入 | 13份、3,343,297字节 |
| 重放输入 | 35份、6,788,343字节 |
| 阶段回执 | 30份 |
| 实际运行时文件记录 | 86份、6,409,713字节 |

运行时清单不是全部标准库、OS DLL或测试子进程依赖的完整证明；已安装版本信息
也不能替代实际加载文件身份。父actual-volume、coordinate目标及更早失败证据保持原身份。

root与另一审查agent分别完成只读全量终态审计，errors=[] / issues=[]，覆盖来源/
快照及before/after、完整历史、父/重放输入、产物及运行时的集合和逐项SHA、AST与XML
测试身份、全部矩阵形状/槽、精确零门、同槽负控因果、接受范围与清理状态。
本文另外直接核对了三份终态摘要、完整矩阵统计、真实负控、反向计算计数及测试回执。
两路审计均未补算数学、运行测试或改写冻结证据。

## 本批提升与下一依赖

只新增两个精确限定标志：

* `actual_constraint_continuum_real_formula_bridge_validated=true`；
* `driver_metric_constraint_continuum_bridge_validated=true`。

其余24项限制标志保持false，包括笼统的actual_constraint_diagnostic_bridge_proved、
实际离散诊断执行、binary64 RHS、local_differential_constraint_pde_derived、SBP能量、
物理边界、约束收敛、非线性/变背景稳定性及physical/live/scientificPayloadWriteback。
没有科学时间演化或GPU执行；原C0的rank39和零频完整43逆缺口不变。

本结果补上固定背景一阶实际诊断到已接受physical43符号的来源桥。
后续路线拟推进真实binary64诊断/体积实现与周期Cauchy验证，再按依赖完成离散能量、
可分辨收敛和合法IBVP；下一候选尚未执行，不由本批符号一致性自动授予这些资格。

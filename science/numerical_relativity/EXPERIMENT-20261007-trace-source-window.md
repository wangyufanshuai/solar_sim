# 迹约束源的前瞻性对照 v1（执行前协议）

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: preregister, implement controls, run once
- Origin Date: 2026-10-07
- Verification Status: PREDECLARED, not yet executed
- Version Label: trace_source_prospective_v1

## 问题和不变项

检验事后提出的平直线性关系：`C_Ai(t)=C_Ai(0)-2t D_i T(0)`，
其中 `C_Ai=A_i-D_i ln(alpha)`，`T=A00+A11+A22` 是坐标迹。
观测直接使用存储的log变量、独立配对FD2/4差分和有符号场，不做拟合。

使用已通过元数据/确定性验收的0.3.2 Windows MSVC/OpenMP真实求解器：
`C:/Users/86137/NRShadowEvidence/nr-k3-auxiliary-manifest-v1-20261007/campaign-v2/native-build/Release/nr-k2-fo-ccz4-shadow.exe`。
SHA-256 `554c65d99590153f56e40c3943d18785658fef7ca53f2c25a5a3630f2806619b`。
不重编译、不改变任何旧源码、RK4、1+log、Gamma-driver、profile(scale3,.2)、
tau_inverse=0、阻尼、周期边界或无投影规则。所有正步数都运行真实exe。
旧独立噪声实验和增长记录保留，不用本次控制组替代旧数据。

## 冻结矩阵：62例、310时间样本

单位周期立方体，N8，dt=1/256，T=1，采样0/.25/.5/.75/1。
`f=epsilon sin(2pi k.x)`，k为x/y/z三轴和(1,1,1)；epsilon为1e-6、2e-6、4e-6。
除下列曲率扰动外，全部58槽为精确Minkowski初值，辅助槽为0：

- 纯迹：`Aij=deltaij*f/3`。
- 无迹：`A00=f/sqrt(6), A11=-f/sqrt(6), A22=0`。

两者初始曲率Frobenius范数平方均为f²/3。**两者都不是约束满足的物理波**；
不投影初值，不在演化中重构辅助量，不移除任何模态。

| 组 | 明确矩阵 | 数量 |
|---|---|---:|
| 主对照 | FD2/4 × 4波矢 × 2种曲率 × 3幅度 | 48 |
| 半时间步 | FD2/4 × 2曲率；斜向、epsilon2e-6、N8、dt1/512 | 4 |
| 空间加密 | FD2/4 × N12/16 × 2曲率；斜向、epsilon2e-6、dt1/256 | 8 |
| 精确平直 | FD2/4、N8、dt1/256 | 2 |

16个主对照中幅度为2e-6的例子，各在T1状态做一次Python/C++单步续算，
全58槽max abs差≤2e-12。这不是完整窗口跨后端验证。
其中4个斜向例子另做4线程直接256步及1线程直接256步，与原4段64步结果
比较完整checkpoint和manifest，须逐字节相同。
共288条runner命令：248分段演化、16原生单步、16 Python单步、8确定性控制。

## ADM诊断边界（新增诊断，不修改旧合同）

原文式3、5规定K为物理Kij的几何迹：[FO-CCZ4原文](https://arxiv.org/html/1707.09910v3)。
本仓库 `constraints3d.py` 的metric-only报告使用存储K。若 `tr_h A != 0`，
重建 `Kij=(Aij+hij*K/3)/chi` 的真实迹为 `K_actual=K+tr_h A`，故新增诊断：

`H_ADM = H_stored + K_actual² - K²`；`M_ADM_i = M_stored_i - D_i(tr_h A)`。

这里共享既有metric Ricci诊断，但不使用演化中的Gamma/33辅助梯度；不是一个
全新的独立Einstein求解器。旧H/M命名和历史数据不修改，收据区分两套指标。
初值另用闭式平直公式核验：纯迹H_ADM=2f²/3、M_ADM=-2Df/3；
H_stored=-f²/3、M_stored=Df/3。无迹H=-f²/3、M_i=diag(A)_i'。
各例初值闭式误差≤5e-13。此处是代数约束面外的诊断语义，不是修复物理演化。

本次只通过Exa读取1篇已知原文，不作广泛文献覆盖声明。当前获取内容核查了
式3/5/6/8/12；网页日期不作为该论文的新发表日期。GitHub实现参考沿用上一轮
已核实的GRChombo，未再次检索或复制代码。

## 执行前固定的判断

1. 每个采样保持有限、0<alpha<2、chi和h最小特征值>0；采样CFL和≤.45。
   两套H/M、代数和Gamma/Theta范数≤.01只是异常停止上限，不是约束收敛。
   RK中间stage的CFL没有本实验监控，不作该声明。
2. 纯迹的有符号误差∞≤1e-12+.005×匹配纯迹预测峰值，
   `dot(C,P)/dot(P,P)` 在[.995,1.005]；无迹采用同幅度纯迹响应为归一尺度，
   要求残差∞≤同一界。t0不计算斜率。精确平直所有槽须不变。
3. 16个FD/方向/曲率组在T1的误差，幅度每翻倍应表现二阶余项：
   两个log2误差比均在[1.7,2.3]。任一误差≤1e-12则记为inconclusive，
   不伪造阶数也不视为通过。异常和不确定均如实保留，不调幅度或门槛重跑。
4. 纯迹斜向epsilon2e-6的N8/12/16响应与连续预测
   `-4pi*t*epsilon*k_i*cos(2pi k.x)`比较；FD2阶[1.8,2.2]、FD4阶[3.5,4.3]，
   误差须>1e-12。这是源传播响应的空间收敛，不是约束趋零或物理解收敛。
5. 4个dt-halving对照T1全58有符号槽和C_A差∞≤1e-12+.01*epsilon。
   每套H/M的有符号场差∞≤1e-12+.01*max(粗细场峰值)。不报告未测量的时间阶。
6. 上述采样、尺度、空间、时间、跨后端和字节重放都满足，才报告本有限窗口
   `prospective_trace_source_screen_passed=true`，绝不等同于physical/live门禁。

## 冻结、资源和停止

计划输出新目录：`C:/Users/86137/NRShadowEvidence/nr-k3-trace-source-prospective-v1-20261007`。
先核验0.3.2收据(68b1a7c...)及608产物、事后分析(835ad088...)、150旧源码；
再把4份新增源码和全部旧源码共154份以及本协议复制进独立冻结快照。
运行前后逐项SHA，禁止覆盖/删除原证据。

总30分钟，单命令180秒，产物192MiB、每次预留8MiB；C盘保留4GiB、E盘1GiB。
首次采样门禁/命令/身份/容量异常立即停止并留完整失败收据，不自动重试。
余项尺度或收敛的总判断在62例完成后进行，inconclusive允许完成记录但总门禁false。
所有physical、完整dynamic constraint convergence、strong hyperbolicity、CPBC、
black-hole、AMR、CUDA、long-time、runtime和scientificPayloadWriteback保持false。

若本机制通过，下一协议才比较显式代数投影与有限tau松弛，分别绑定配置和恢复
格式；本批不启用任一方案，更不切换live。

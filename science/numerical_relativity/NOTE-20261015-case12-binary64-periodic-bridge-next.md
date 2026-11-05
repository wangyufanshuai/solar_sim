# 下一候选：固定 case12 的实际 binary64 周期线性化桥

## 状态、范围与父资格

日期：2026-10-15。本文是**待正式预注册的下一执行候选，尚未运行**。
编写仅使用源码、父记录的 JSON/字节摘要和纸面推导；未执行新的科学计算、数学导入或测试。
只新增本文，不改动 696 份已冻结来源或任何旧证据。

实际 constraint diagnostic 父目录为
`tmp/nr-shadow-evidence/nr-k3-case12-actual-constraint-diagnostic-controls-v1-20261015`。
本文只读确认 gate 的 passed/completed=true、errors=[]，并核对以下三个摘要；
完整来源/产物审计由本轮 owner 完成，不把这里的三个文件检查称为独立全量审计。

| 记录 | SHA256 |
| --- | --- |
| qualification-gate.json | `285b84e81940b3465853a4752d1b7db4319a4bf2f6b4216998968e4669165c51` |
| worker-result.json | `dcb8afa448456b9433612422cb97843015b2470e1e0278c4c11d6a85f5262964` |
| independent-replay.json | `efaf4b1b25de8bf0a614630416421a75a42b92de45924294206b6795aa5a737f` |

父链已经把实际 volume/constraint 的**实数公式解释**连接到固定 case12 的
J58、Ax/Ay/Az、C0/C1/C2。下一缺口是原 NumPy binary64 构造、真实周期导数、
实际数组装配和浮点消去是否在可分辨窗口内复现这些线性化。

本候选是实际离散程序的有限登记一致性实验，不是全方向精确证明的新版本。
本批不时间推进、不作网格收敛率结论；通过后紧接短窗周期 RK4/FD2/FD4 演化。
不加入第二个网格、第三个振幅或新的模式来追逐通过，也不先删 FD2。

## 1. 实际执行来源与坐标

生产必须直接执行以下原 binary64 路径，而不是执行已有 exact jet 的 AST 适配：

* `fo_ccz4_checkpoint.py:FOCheckpoint.to_state`、`state_slots`，或一条逐项等价且独立审核的
  原状态构造路径；实际 `np.exp`、`np.log`、float64 数组转换和 source metadata 检查均保留。
* `fo_ccz4_rhs.py:fo_ccz4_rhs_3d`，显式 `boundary_mode='periodic'`，及其原
  `_fo_ccz4_volume_rhs_3d`、`_geometry`、`bssn3d._d1`。
* `fo_ccz4_principal_symbol.py:_rhs_components` 的完整 58 输出装配。
* `fo_ccz4_relaxation_convergence.py:constraint_fields`、`derivative`、
  `symmetric`、`christoffel`，以原 FFT 实现的 centered FD2/FD4 导数执行。
* 显式登记的 43 行 wrapper：H、M3、Theta、Z3、A3、B9、D18、P3、det、trace，
  其中 `Z_i=0.5*h_ij*Ghat^j` 在实际浮点数组上计算，使用完整当前 h。

不以 `fo_ccz4_principal_symbol._constraint_components` 的 69 行替代 physical43。
本批也不执行 SBP driver 49 行；它的实数来源映射属于已接受父记录，不能写成本批运行证据。

固定 case12：

    alpha0=17/20, chi0=18/25, beta0=(3/100,-1/25,1/20),
    h0=L L^T, L=((1,0,0),(3/25,1,0),(-2/25,3/50,1)),
    Atilde=K=Theta=GammaHat=b=A_i=B_k^i=D_kij=P_i=0.

从父的精确有理条目逐项转换为 binary64 背景；保存实际 h、alpha、chi、shift 和日志槽，
不能把其舍入后的位模式称为精确有理背景。特别保存构造后
`exp(log(alpha0_float))`、`exp(2*(0.5*log(chi0_float)))` 的实际结果及与目标的差。

参数显式固定，并保存原 dataclass 的完整值及 identity：

    GaugeConfig(shift_coefficient=1, shift_damping=0, theta_coupling=2),
    advective=True, lapse_coefficient=2;
    FOCCZ4GaugeProfile(shift_scale=3, ordering_scale=0.2);
    FOCCZ4Config(kappa1=0.1, kappa2=0, kappa3=1, tau_inverse=1,
                cleaning_speed=1, ordering_mu=1, shift_strength=1, k0=0, c=1).

profile 的实际 f、mu 仍按原函数由 alpha、chi 求值；不能手填常数覆盖真实状态依赖。
`_mode_state` 的独立槽布局可作参考，但其默认 Minkowski 背景不能不改条件直接沿用。
旧 `probe_frozen_fo_ccz4_rhs_matrix_3d` 的默认 kappa1=0、FD2 中心点 principal probe
不是本题的 J/全诊断桥。

所有 58 槽独立，q6=ln(alpha)、q10=0.5 ln(chi)。每个非对角 h/Atilde/D 槽同时写其
两个对称位置，但仍只算一个独立变量。不重建辅助 A/B/D/P、不做 det/trace 投影，
不裁剪 lapse/chi。任何非有限值、非正定 metric 或原 valid_mask/profile 拒绝都保留为失败。

## 2. 一次完整而有限的登记矩阵

固定单位周期立方体、`N=8`、节点 `x_i=i/8`，同时登记 FD2 和 FD4。
只用一个固定多模态形状，空间相位不随 case 调参：

    W = ((1,0,0),(0,1,0),(0,0,1),(1,1,0),(1,0,1),(0,1,1)),
    f(x) = [1 + sum_{k in W} cos(2*pi*k.x)] / 8.

登记完整有向模式表为 `((0,0,0), W, -W)`，共 13 项，顺序在代码中冻结。
DC 区分低阶 J/C0；三轴模式区分 Ax/Ay/Az、C1 和 C2 对角系数；三个混合模式区分
C2 的 xy/xz/yz 系数。六个正模式及其负模式均保留，不只保留模长或实部。
这是可解析识别的设计理由；实际 FFT/直接投影、采样正交性和恢复条件仍须在 worker 中检查。
不得在本文宣称已经计算过离散设计矩阵的秩或数值条件数。

振幅预案固定为 `epsilon_H=2^-10`、`epsilon_L=2^-12`，各执行正负号。
列尺度 `s_a=max(1,abs(q0_a))` 从已保存背景按固定规则取得，不按观测残差调整。
第 a 列的输入为 `q=q0 +/- epsilon*s_a*f*e_a`，a=0..57。
实际 `f` 数组、q0、58 个 s_a 和输入槽 round-trip 差都保存；所有探针分别以自身
`epsilon*s_a` 归一。日志槽沿原 exp/log 路径进入实际状态，不能用线性替代 exp。

| 组 | 每条路径的 state evaluations |
| --- | ---: |
| 两阶、两振幅、58 列、两符号 | 464 |
| 两阶各一次完整背景 | 2 |
| 两个负控，各两阶、两振幅、单一登记列、两符号 | 16 |
| 生产合计 | 482 |
| 独立实际复算同一完整登记 | 482 |
| 两条路径总硬上限 | 964 |

一个 state evaluation 指一次实际 58 RHS 与一次实际 43 诊断，共 101 输出场；
因而完整科学函数调用总上限为 1928。小型 parser、装配、导数、投影和故障控制另有
有限登记，不得暗中再次执行完整 RHS/diagnostic。独立路径不靠复制生产结果节省这 482 次。
实现必须有调用计数断言；提前失败时记录计划数/开始数/完成数，未完成不能称全套通过。

此调用量在 600 秒内的可行性**尚未实测**。正式 worker 不做另一个未计数的 pilot，
不作自适应 epsilon/N/mode 搜索，不增加超时重试；阶段时间只用于解释实际成本。

## 3. 离散参考与全部系数恢复

对阶数 p、轴向整数波数 k，使用与原 stencil 对应的实数修正波数：

    theta=2*pi*k/N, h=1/N,
    ktilde_2 = sin(theta)/h,
    ktilde_4 = [8*sin(theta)-sin(2*theta)]/(6*h).

因此每个登记模态的已知线性符号为

    L58(k)=J58+i*sum_a ktilde_a*A_a,
    C43(k)=C0+i*sum_a ktilde_a*C1_a
                  -sum_{a<=b} ktilde_a*ktilde_b*C2_ab.

这里 C2_ab 是父 C2(v) 多项式的对应单项式系数；混合 xy 的系数**不再除二或乘二**。
两次实际 D1 的线性符号是修正波数的乘积，不能换成连续波数，也不能换成
`bssn3d._d2` 的另一套二阶 stencil。保持两个 D1 的实际顺序/空间轴，先在固定标量场上
交叉检查生产 stencil、原诊断 FFT 导数与独立 Fourier 符号的结果。

从正负输出形成中央一阶响应，并投影到全部 13 模式。以已保存实际 f 的对应非零
投影归一，保存其复数分母；不默认浮点采样的系数恰好等于理论 1/8 或 1/16。
恢复规则必须显式保存，不进行最小二乘后删小项：

* DC 恢复 J58 与 C0；
* 三轴模态虚部除以对应 ktilde，恢复三个 A 和三个 C1；
* C43 三轴实部与 C0 的差，恢复三个 C2 对角项；
* 混合模态实部减去 C0 与已恢复对角项，再除以两个 ktilde 的乘积，恢复 C2 混合项。

保留三轴 RHS 实部与 DC-J 的冗余差、正负模态共轭差、混合模态的全部 RHS/diagnostic
重构差。全数组反变换/直接线性预测还须检查全部 101 行和全部 512 节点的响应误差与
离登记模式残差；仅在挑选模态上吻合不足以通过。

每个 order/epsilon 保存 4 张 58x58 矩阵 J/Axyz 和 10 张 43x58 矩阵
C0/C1xyz/C2六项，包含所有零槽及完整误差矩阵，共 38396 个系数位置。
四组 order/epsilon 均保留，不能只留下较好的一组。额外的复数残差按各自完整 shape 保存。

## 4. 浮点误差、可分辨窗口和尺度门

本节是须在正式运行前代码化冻结的**数值验收预案**，不是已经测得的误差界。
独立审核可在运行前提出更正；启动后不得因结果更改振幅、阈值、行尺度或分类规则。

1. 原场、投影、矩阵和误差均为 finite binary64；不得字符串截断、阈值置零或隐去零行。
2. 背景实际值完整保存，并比较父零背景公式。背景偏差、日志 round-trip 偏差和已接受
   有理系数转 binary64 的差分别记账；不能把减去背景误写为背景原本精确零。
3. 每个矩阵块的行尺度预先取 `w_i=max(1,sum_j abs(Mref_ij))`；s_a 是独立输入尺度。
   既报逐槽绝对误差，也报按 w_i 归一误差及非零参考槽的相对误差，禁止只报一个全局相对范数。
4. 为识别舍入平台，预登记经验分辨指标
   `nu=4096*u*B/(epsilon*s_a*abs(fhat_k))`，其中 u=2^-53，
   `B=max(1,max_grid abs(Fplus_i),max_grid abs(Fminus_i),max_grid abs(Fbase_i))`。
   通过系数恢复的固定线性公式传播这些指标，包含 ktilde 除法；不得只用原 nu 充当恢复后的指标。
   这不是经过舍入分析证明的误差上界，不能据此作精确代数或区间认证声明。
5. 逐槽预案为 `abs(error)<=64*epsilon^2*w_i+8*nu_recovered`，并要求每个非零参考槽
   在细振幅下具有至少 32 倍分辨指标的信号和不超过 1e-3 的相对误差。
   参考零槽仍逐项执行绝对门；不把零槽的相对误差设成零。
6. 对粗振幅行误差明显高于分辨指标（大于其 64 倍）的行，细振幅行误差应不超过
   粗误差的 1/8 加传播后的舍入余量。理想中央差的四倍振幅缩小给二阶截断缩小16倍，
   1/8 是预案中的保守检测门。落在舍入平台的行标记 `roundoff_limited`，不虚报收敛阶。
   非零参考项无法达到信号条件则标记 `unresolved`，不能用大绝对容差放行完整桥资格。
7. 同步保存正负不对称的偶响应 `Fplus+Fminus-2*Fbase`、中央奇响应和完整线性重构误差。
   在未满足可分辨条件时，不能仅凭两振幅结果接近认定一致；也不允许再加更合适的振幅。

原始完整场检查采用与矩阵门一致的预登记尺度和振幅规则；若代码冻结时尚未写出从
矩阵/投影门到场重构门的具体传播公式，此候选仍未达到可启动状态。
不得用连续物理理论中很大的 C58 上界作为实际浮点误差容限或 CFL。

## 5. 两个真实输入/公式故障见证

两个故障各固定一个已知能激发目标的列，完整执行全部101输出，保存失败结果。
它们验证检测链，不能给基准增加通过票数。

* `kappa1_doubled`：只将原实际 RHS 配置 kappa1 从 0.1 改为 0.2，登记列18(Theta)，
  其余参数、state/profile identity、两个阶数/振幅/符号不变。实际诊断仍执行。
  对照原 kappa1=0.1 父 J/离散模态参考，要求实际目标 RHS 变化被检出。
* `stored_trace_diagnostic`：对原 constraint_fields 的唯一
  `actual_trace=trace(gamma_inverse@Kij)` assignment 作登记 AST 替换为 stored q17，
  运行原 NumPy 后端，登记列11(Atilde00)。这是整个 assignment 的替换，可能改变 H
  平方项以及 M，不声称非线性 H 不变。原 RHS 同时正常执行；记录完整目标内外变化。
  这不是手改预测矩阵，也不是给已算残差直接加数。

两者分别从实际变更重新取得 signed fields；不复用基准场伪造 mutant。
检测门要求真实输入/源变化、细振幅目标变化高于传播分辨指标64倍、偏离原参考超过
原验收门，并在两振幅及两阶数有一致的可检测结论。保存全部变化而非预填差值。
如果某个变异在当前登记下未被检出，本批控制失败；不更换列、放大变异或追加样本。

另外可以用便宜单元控制覆盖错日志链式因子、mixed-Hessian 的错误二倍数、
错误 continuum/D2 波数、sign/axis/row permutation、漏掉最后一槽、非法shape、NaN、
源/父漂移及中途写入失败；它们必须有独立手算预期，不额外执行完整 probe。

## 6. 紧凑但完整的保存与独立复算

数据层固定 little-endian float64、显式 shape/order/slot/mode/sign、SHA256；
复数用末轴 `[real,imag]`，不以 JSON 小数截断保存科学数组，不将小项归零。
可使用无 pickle 的 `.npy` 或严格受检二进制容器；是否压缩须在协议中冻结。

建议至少保存：

* 原背景、实际多模态 f、58 列尺度、精确父参考及其 binary64 转换、实际 stencil 符号；
* 主 signed 投影数组 shape `(2,2,58,2,101,13,2)`，其固定裸数据大小为 9,747,712 B；
  背景与两个负控同样保留所有101行、13模式及实/虚部；
* 四组完整14矩阵及其误差/解析恢复冗余，不省略零槽；
* 所有节点检查后的逐输出行 max/RMS/离模范数、最大误差节点索引和偶响应统计，
  用定长数组记录，不让数千个小 JSON 文件成为监护扫描的主要工作；
* 每个实际输入场、58 RHS 场、43诊断场的有序字节摘要及 shape；
* 调用清单与完成位图、每阶段时间、实际环境/线程数、source/parent identity、全部负控记录。

**原场摘要和离模范数不等于保存完整原始网格场。** 这里完整保存的是预登记输出投影、
全部恢复矩阵与覆盖全网格的误差统计；没有声称所有 signed 网格场均已归档。
独立复算必须实际重新构造/执行全部482个 state evaluations，重新检查全网格，
不能只读取摘要或由保存的投影反推“复算过原场”。若需要完整原场归档，必须另行登记
新的输出预算，不能把本批64MiB当作无上限储存。

生产可用原 FFT 投影；独立路径使用不同实现的显式离散 cos/sin 加权投影和独立系数恢复、
参考符号装配、误差统计及 acceptance。两者都调用原实际 RHS/diagnostic，这条共享源码、
NumPy binary64/BLAS/libm 及状态容器须作为共同可信基明示；不是两套独立 GR 方程实现。
独立路径不得调用生产的 projection/recovery/acceptance helper。
不能要求两种浮点求和顺序位相同；两者的科学结果按另行冻结的紧于主科学门的重放容差比较。
相同运行路径的原场字节摘要若不一致须保存差异并拒绝默认通过，不能悄悄忽略非确定性。

保存生产及独立投影、矩阵的体积可由固定 shape 在启动前计算；源快照、父记录、XML、
终态与负控也计入64MiB。正式协议应列逐文件预算并保留终态空间，不以预期压缩率担保。
不足则启动前拒绝；实际超限则保存失败终态，不删旧证据、删零阵或覆盖部分输出腾空间。

## 7. 父输入、资源及失败规则

正式 manifest 至少绑定：

* 已通过的 actual volume 与 actual constraint gate/worker/replay/source/domain；
* 实际 exact J/Axyz 与完整 C0/C1/C2，必要的 case12 背景/参数来源；
* 原实际 binary64 RHS、geometry、stencils、checkpoint、diagnostic、packing 及完整依赖字节；
* 本批生产/独立/测试/协议来源；旧父的成功身份不得替代变更后来源重新验证。

本批只拥有一个新输出目录、一次 owned worker，600秒总期限、64MiB输出上限。
生产与独立实际复算、focused controls、写入、正常封存均计入该预算。
完整 guard 覆盖阶段与写入，长循环用同一deadline检查；监护进程保留原清理和失败终态机制。
记录各阶、振幅、列及两条路径的实际调用耗时，不由本文预测完成时间。

先冻结全部数值门、数据schema、负控和调用上限，再运行；本批不得自动重试。
任何基准不匹配、不可分辨、负控漏检、父/来源漂移、资源超限或重放未完成都保留实际失败。
若仅一阶/部分列通过，报告完成矩阵和缺口，不发布“完整 binary64 bridge passed”。
失败不回滚已有实数公式父资格，也不通过调整物理参数/背景/辅助约束来制造通过。

## 8. 通过后的下一实际演化，以及继续保留的边界

只有本桥通过，才启动另一个固定预算的实际周期 RK4 短窗实验，复用
`fo_ccz4_rhs.py:advance_fo_ccz4_rk4_3d`。先以相同离散修正波数的
`J+i*sum ktilde_a*A_a` 线性 ODE 区分时间误差与小振幅非线性余项，再用连续波数参考
做预登记网格细化；FD2/FD4、时间步、幅度的误差来源不能混为一个观察阶数。
状态58项与实际43诊断都监测，保持离约束扰动及独立辅助字段。

旧 `run-nr-k3-relaxation-convergence.py` 的1800秒/384MiB完整 campaign 不直接重跑；
旧 gauge-wave-slice 的 Python/native 对照和细网格通过仅作为历史起点，不充当此case12实验。
本桥的单网格、两振幅一致性也不叫“FD2/FD4空间收敛已经通过”。

周期 Cauchy 没有物理入射边界，所以不必等待 P3 才验证真实周期演化。
有限边界、CPBC、SBP/SAT 能量通量、六面/棱/角兼容性仍是另一依赖链；
本批不晋级完整单黑洞、一般变背景非线性稳定性、长期无导数损失或生产物理内核。
所有结果继续留在 scientific shadow；不写回 live dynamics。

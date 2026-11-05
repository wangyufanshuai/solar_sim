# 下一候选：实际体积 RHS 与固定 case12 完整线性符号的来源桥

## Material Passport

Origin Skill: academic-research-suite / experiment-agent，现有来源绑定工作流的接续。
Artifact: 下一实验设计备忘录。Date: 2026-10-15，Asia/Shanghai。
Verification Status: **新候选未实现、未执行，未运行数学或测试**。
本文只读取实际源码、已有记录并作纸面推导。它不修改任何冻结来源，也不作为下一批通过证明。
AI-assisted；不等同外部专家审查或证明助手认证。

## 1. 新父资格及目前仍缺少的桥

新父目录为
`tmp/nr-shadow-evidence/nr-k3-case12-uniform-frequency-growth-controls-v1-20261015`。
主任务已报告该批终态 passed/completed=true、errors=[]，并完成全量终态摘要审计：

| 记录 | SHA256 |
| --- | --- |
| qualification-gate.json | `9b20396162fe62a9be2ef256c340c7d457a42e8578540ac9f4b7f6c9656f0d62` |
| worker-result.json | `6f3a9e9b3604e3de290ef98c121d7b7eafe176eb9b96341f5472e500bda4cea3` |
| independent-replay.json | `d868a751f653a07eb390a6c23c3253023627e0ac45d7c17d56f23275d1c61ff1` |

该父 worker 124.078 秒、监护 165.563 秒，退出码 0，owned 进程清理 0→0；
852 份 artifact 加 gate 共 853 文件、24,344,070 字节。
冻结来源 678 文件、7,120,849 字节；此前历史 27 目录 / 19,556 文件、
516,950,555 字节。下一批应完整保留本批，历史成为 **28 目录 / 20,409 文件**。
下一批新增来源数、字节数和完整父输入集合仍须按实际实现冻结，不能仅靠上述数量代替摘要核对。

该父证明的是原 full58 **已注册线性符号**的全频率 L2 增长界和 physical43
**已注册线性符号**的频率加权增长界。它不证明实际 nonlinear RHS 的线性化就是这些符号。
运行身份只记录了一个 Python executable（103,192 字节）；数学使用标准库，未加载
NumPy/SymPy。这也不构成当前实际 NumPy nonlinear RHS 的执行验证。

下一科学问题必须完整表述为：在固定 case12 常平衡背景、原 58 状态坐标以及实际
GAUGE/CONFIG/PROFILE 下，实际 **continuum volume RHS 的来源绑定实数公式解释**
是否满足

    F(q0,0)=0,
    dF(q0,0)[u,p] = J58 u + A_x p_x + A_y p_y + A_z p_z,
    x A_x+y A_y+z A_z = K58(x,y,z),

其中 J58 与 K58 是已经接受的完整精确矩阵。此题允许得到非零差或反例。
不得预先填零、改父矩阵、改背景、删独立扰动，或把 geometric=True/False 换标签当作修复。

## 2. 真实调用链与应绑定的源码

首先隔离实际体积方程：

    fo_ccz4_sbp_nonlinear.NonlinearSBPCube.rhs
      -> fo_ccz4_sbp_volume.SBPVolumeOperator.rhs
      -> fo_ccz4_rhs._fo_ccz4_volume_rhs_3d
      -> fo_ccz4_rhs._geometry 与三个 _sym_* helpers.

NonlinearSBPCube.rhs 还调用 CFL、六面 stage-local SAT 及数值特征分裂；这些部分不进入
本候选的 continuum volume 恒等式。应保留真实调用边作为来源说明，不能把它们一并标为已验证。

最小来源闭包必须覆盖并登记实际文件字节、原 AST 与适配 AST／后端映射：

* `science/numerical_relativity/fo_ccz4_rhs.py` 的
  `_fo_ccz4_volume_rhs_3d`、`_geometry`、`_sym_first`、`_sym_shift_gradient`、
  `_sym_metric_gradient`，以及相关 config/state/RHS 结构；
* `fo_ccz4_sbp_volume.py:state_from_slots` 和 `SBPVolumeOperator.rhs`；
* `fo_ccz4_principal_symbol.py:_rhs_components` 的完整 58 槽输出装配；
* `fo_ccz4.py` 的变量顺序、对称分量排列及辅助场含义；
* `ccz4_reference.py:GaugeConfig`、`fo_ccz4_gauge_profile.py` 的 profile/defaults/
  `coefficients`，以及 nonlinear driver 的实际 GAUGE/CONFIG/PROFILE 构造；
* 已冻结 `nr_profile_exact_coefficients.py:case12/principal_rates/matrix` 和
  `nr_constraint_full_symbol.py:source`，连同原 J/K 的通过父资格及实际 JSON 字节。

原 K 的 SHA 为
`e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283`；
原 J 的 SHA 为
`19addd44143b8c3d3b9a1829e4848b8b4631bdfd3f8b9502f496ef7d94cbcc8b`。
正式父 registry 必须指向它们实际接受的目录、归档路径及 gate artifact 关系。
同名文件或公式看似一致不是合法替代。

## 3. 固定背景、参数和全部离约束扰动

背景保持

    alpha0=17/20, chi0=18/25, beta0=(3/100,-1/25,1/20),
    h0=L L^T, L=[[1,0,0],[3/25,1,0],[-2/25,3/50,1]],
    Atilde=K=Theta=GammaHat=b=A_i=B_k^i=D_kij=P_i=0.

L 为单位对角三角矩阵，故 det(h0)=1 且 h0 正定。常 h0/alpha0/chi0/beta0
具有零空间梯度；所有辅助场的背景值也为零。纸面上此时源和几何项均消失，但正式运行仍须
保存 **F0 的全部 58 槽**，不把“平坦背景”作为省略平衡检查的理由。

锁定实际参数：advective 1+log，lapse_coefficient=2，theta_coupling=2；
shift_damping=0；tau_inverse=1，kappa1=1/10，kappa2=0，kappa3=1，
cleaning_speed=1，shift_strength=1，c=1，config.k0=0；
state-dependent profile 为 shift_scale=3、ordering_scale=1/5，故

    f=3 alpha chi, mu=chi/5.

不要把未启用 profile 时的 gauge.shift_coefficient 或 config.ordering_mu 误当实际系数。
profile 的状态依赖和 product-rule 项仍进入原方程解释。虽然其一部分变化乘零背景场、在一阶
可能消失，不能以此把 profile 静默换成另一个方程。

58 槽中 q6=ln(alpha)，q10=ln(phi)=0.5 ln(chi)；h 与 Atilde 各保存六个独立对称槽，
非对角槽同时改变两个对称位置。A/B/D/P 是独立状态，分别解释为定义约束可能偏离的
辅助场，不在这次离约束线性化中重构成基础场导数。
保留全部 det/trace、定义约束及 curl/ordering 方向，不施加 tr(D)=0、curl(D)=0、
det(h)=1 的切空间约束或 tr(Atilde)=0。否则正好会抹去需要检验的松弛源和排序主部。

## 4. 中心化 exact chart 与完整一阶 jet

不先用浮点 log/exp 生成背景。以形式 epsilon^2=0 定义中心化 chart：

    q6=ln(alpha0)+epsilon*u6,
    q10=0.5 ln(chi0)+epsilon*u10,
    alpha=alpha0*(1+epsilon*u6),
    chi=chi0*(1+2 epsilon*u10).

这是原 `state_from_slots` 的 exp(q6)/exp(2q10) 在该背景的**精确一阶解释**。
它不声称有限 epsilon 时指数函数等于一次多项式，也不把 log 背景伪装成有理数。
其余 h、beta、动力学场和辅助场按原槽作普通仿射一阶 chart。

建议一次稀疏一阶 jet 包含 **232 个独立系数**：58 个状态方向 u_a，
以及 3×58 个空间梯度方向 p_{i,a}。所有一阶种子的乘积均为二阶并被截断。
这是一份完整线性映射，不是 232 个有限幅度／方向样本，也不是特征向量探针。

空间导数回调对常数返回零，将状态种子 u_a 映到对应轴的梯度种子 p_{i,a}。
必须对 `field[...,component]` 等视图／切片保持正确种子编号，不能依赖原数组 id
来分配梯度。三个 `_sym_*` 的原 AST 必须真正参与解释，以保留 1/2 因子、指标排列和
非对角双计数。遇到对梯度种子再次求导，应明确拒绝未登记的二阶梯度请求，不能静默填零。

在 h0 可逆处，exact 后端可用已推导的一阶原语：

    inverse(h0+epsilon*dh)=u0-epsilon*u0*dh*u0,
    det(h0+epsilon*dh)=det(h0)*(1+epsilon*tr(u0*dh)).

这些原语、乘积规则、收缩、转置、切片、广播及原 58 槽 packing 都需要独立小控制。
不得因全 RHS 较长而只解释“容易的”行或固定 47 子块。完整输出从原 `_rhs_components`
装配，不能另写一个看似相同但未绑定的字段顺序。

原 constructor、RHS dataclass、NumPy dtype 与 `np.asarray(...,dtype=float64)`
可能强制丢失 jet；任何绕开／替换必须列入狭窄白名单并保留原 AST 摘要。
不得调用后发现结果被浮点化再猜回导数。第一批实现的 AST/原语支持、异常传播、适配节点次数和
全部被移除的验证条件应先完整列明，再冻结唯一候选。

## 5. 几何式与冻结 false 分支：候选恒等式而非默认等价

实际 `_geometry` 通过 physical/conformal Christoffel、Ricci 和 covariant Z
构造 R+2 nabla_(i Z_j)。冻结 `principal_rates(...,geometric=False)` 使用简化表达。
两个名字不能自动证明是同一算子。

纸面上线性常背景下，Ricci 的 contracted-connection 导数与 Z 部分相消，候选为

    delta RZ_ij = -u0^{kl} partial_k D_lij
                  +partial_(i P_j)
                  +h0_ij u0^{kl} partial_k P_l
                  +h0_{l(i} partial_{j)} GammaHat^l.

该相消只用原对称化、常 h0 和指标代数，不需 tr(D)=0 或 ordering 约束。
它提示可能连接冻结 false 分支，但不是本备忘录已经执行的系数证明。
正式候选必须解释实际几何 AST，保存全部 A_x/A_y/A_z 并与冻结 K 的 x/y/z 系数比较；
若不同，保留完整差及其来源定位，不能改成 geometric=True 名称后宣布桥接成功。

原低阶源也应从实际方程独立产生。主要敏感项包括 det(h) 松弛、trace(Atilde) 松弛、
GammaHat/b damping、beta 与 A/B/D/P 的代数输运，以及 ln(alpha)/ln(phi) 的规范项。
在 det(h0)=1 处，det 松弛的线性项为 -tau_inverse*h0*tr(u0*dh)；
Gamma/b damping 包含 tildeGamma(D)，不能把它误作只作用于 GammaHat 的对角项。
这些都是待完整 J_RHS 比较的来源解释，不能作为提前填写 J_RHS 的替代。

## 6. 必须保存的主证书与接受标准

从实际公式 jet 提取

    F0:58x1,
    J_RHS, A_x, A_y, A_z: 各58x58,
    R_J=J_RHS-J58,
    R_x=A_x-[x]K58, R_y=A_y-[y]K58, R_z=A_z-[z]K58.

`[x]K58` 等指完整保存的 degree-one 多项式系数抽取，不是坐标轴取样。
使用 RHS 约定，Fourier 符号是 J+i rho K(n)，不从别的 PDE 左端符号约定引入额外负号。
所有矩阵都是规范精确有理数；等价地可保存 K_RHS(v)=xA_x+yA_y+zA_z 的完整三变量
degree-one 系数，但注册时仍须保留三个轴的全系数覆盖，不隐去零槽。

主数据为一份 58 槽向量、四个完整 Jacobian 和四个完整差矩阵：

    58+4*3364+4*3364 = 26,970 槽。

若通过，平衡向量及四个差矩阵的 **13,514 槽**全部精确为零。
J/A 本身通常非零，不能把所有主产物称为零残差。零判定须 exact-zero-only，
非零候选与 oracle 比较须 exact-rational-equality；原物理阈值不得被替换或放宽。

任何平衡或桥差非零，均完整保存实际系数和统计并拒绝此范围的 qualification。
允许“actual volume source formula 与已接受符号不同”成为有价值的正式结果。
不得投影状态、消去不利扰动、只报告通过的块，或在停止后补算缺失列。

## 7. 两类真实变异及独立 chart 控制

变异仍调用同一实际方程 AST／jet，不手填理论差：

1. **source 变异**：只把 kappa1 从 1/10 改为 1/5，其他原参数与背景不动。
   实际重新产生 F0 和完整四个 Jacobian，与原已注册 J/K 比较。
   要求真实参数变化、实际 J 相对基准变化和相应非零桥差；不把基准已有失败算成变异成功。
2. **principal 变异**：只把 profile.ordering_scale 从 1/5 改为 2/5。
   实际重新解释完整 profile 和 RHS，保存完整四个 Jacobian 和桥差。
   预期敏感位置是 B 行的 P/D curl 主部，但不能只计算这些行、只选一个方向或预填非零模式。
   要求实际方向系数相对基准变化及非零主部桥差。

最明确的完整负控规格，是每个变异保留与主候选相同的九份数学记录，即每个 26,970 槽；
主候选加两个真实变异共 **80,910 槽**，另外保存参数和因果比较元数据。
实际差到基准的全部系数可由两个完整记录独立重建，统计必须真实计算。
若后续注册改用另一种同等完整编码，必须在运行前明确完整记录和槽覆盖，不能偷偷改成抽样负控。
成本和输出可行性尚未测量，不能以未验证的预计耗时保证这套实现能在预算内通过。

另设独立小型 chart 控制，直接验证 alpha0*exp(epsilon*u6) 与
chi0*exp(2epsilon*u10) 的一阶系数。故意漏掉 alpha0、chi0 或因子 2，须在该控制中留下
实际非零有理差。当前背景的动力学场为零，某些 chart 错误会乘背景零而在 RHS 一阶 Jacobian
中消失，所以**不能把 chart 错误默认视作本 case12 完整 J/K 比较可检测的真实负控**。
同样，非对角 h/A 槽的对称双计数、导数切片、det/inverse 和 profile product rule
需要有手算可独立核对的小例；这些小例不冒称 case12 反例。

## 8. 实数源码解释与 binary64 语义的边界

本文所提 exact bridge 是冻结源码的**实数公式解释**。如源码字面 `0.1` 解释为 1/10，
`2.0/3.0` 解释为 2/3，应登记原词法片段和白名单映射，而不是先得到 binary64 值后再
用 `Fraction(float_value)` 冒充十进制实数常量。

这种解释不等于 Python/NumPy binary64 路径逐位执行：浮点舍入、exp/log 的实现误差、
NumPy contraction/inverse/determinant 算法、数组转换和具体 SBP derivative 的舍入均未被
该 exact certificate 覆盖。禁止宣称逐位等价、已执行实际 FP64 RHS 或已证明离散误差界。
若将来需要 runtime 桥，应另行保存实际 binary64 输入、输出和独立误差合同，不能反向篡改
本精确公式证书来消除差异。

精确生产不得直接调用冻结 J/K 作为其输出；它应由实际 nonlinear volume AST 的
一阶解释产生。独立路线须用单独的标准库 Fraction 运算、明确原语/装配校验及原 oracle
逐槽复核。若两个后端共享 AST 或 codec，必须写清共同可信基，不能称为不同来源的独立物理模型。
单纯重读已保存零差、不重建新实际 Jacobian，不构成独立重放。

## 9. 下一正式批次的执行约束与停止条件

保留唯一 owned worker 的原合同：600 秒总预算、64 MiB 输出、原 2 MiB terminal reserve、
8 MiB source snapshot，C: 至少 3 GiB，E: 至少 4 GiB+32 MiB，并保留启动时完整输出预留。
Windows Job 只管理本批进程；所有 exact jet、负控、测试、父解释及独立重放均在这一批内。
不增加额度，不自动重试，不在停止后拼接计算，不借修改旧来源制造通过。

这些上限不代表可行性已经通过。下一步先完整冻结 AST/jet 支持、父路径／SHA／资格、
全部数学输出及 metadata schema、完整负控规模、测试数量／摘要和独立重放方法；
source/output 字节上限及检查成本须按实际实现预检。当前不预报父文件数、最终输出文件数、
测试通过数或耗时。不能把复杂部分留给运行后“再补”。

正式启动前仅可做源码／AST／lint／纯 metadata 审查，不提前执行一部分科学计算来试速度。
受控批次中的数学失败保留完整可完成候选和拒绝证据；资源／异常停止只保留实际 prefix。
finalizer 只核对已保存字节、来源、AST、父资格、终态和清理，不在预算外重算 jet 或残差。

即使完整通过，最初的新资格也只应命名为固定 case12 的实际 **continuum volume
real-formula linearization bridge**。它不证明 actual FP64 算法、SBP 半离散能量、SAT/CPBC、
时间积分、离散收敛、变背景／非线性适定性或黑洞演化。full58 与 physical43 的原范数区别、
零频 physical39 像以及所有 physical/live/scientificPayloadWriteback 门继续保留。
实际约束诊断器到已证明 C43 的实现桥也需要单独验证，不能由 RHS 桥自动获得。

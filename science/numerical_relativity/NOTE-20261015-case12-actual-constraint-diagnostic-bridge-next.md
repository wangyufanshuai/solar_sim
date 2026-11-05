# 下一候选：实际约束诊断与 physical43 完整二阶线性映射的来源桥

## Material Passport

Origin Skill: academic-research-suite / experiment-agent，接续已有来源绑定工作流。
Artifact: 下一候选的设计备忘录。Date: 2026-10-15，Asia/Shanghai。
Verification Status: **设计候选，尚未运行；本文未执行数学、科学导入或测试**。
本文依据现有源码、父记录元数据和纸面推导编写，不修改 687 份已冻结来源。
AI-assisted；不等同外部专家审查或证明助手认证。

## 1. 父资格与本次真正要补的缺口

实际 volume 父目录为
`tmp/nr-shadow-evidence/nr-k3-case12-actual-volume-linearization-controls-v1-20261015`。
本次只读其终态元数据并核对 gate 字节摘要，得到 passed/completed=true、errors=[]。
此处不宣称已经完成该父的全量终态审计。

| 记录 | SHA256 |
| --- | --- |
| qualification-gate.json | `ba5bff599828bf9185db40c72e6421c337fe89b60fab5acde4329f534b4502f0` |
| worker-result.json | `816ea01a8870aee222aa829b100a852d6e19e4022bcd4a7de9e66e94c0f2539d` |
| independent-replay.json | `0a96abe07f82719030d6bf81e1a335ccada39047b5e6d13a814507e7c9a2d6af` |

gate 报告 worker 214.781 秒、监护 318.844 秒，退出码 0，owned 进程清理 0→0。
这些时间是父记录，不是本候选的耗时预测。新批来源数、历史文件数、输入字节和预计成本
均须依据正式 registry 重新冻结，不能从父时间推断本批在预算内。

父已经把实际 continuum volume RHS 的**实数公式解释**与固定 case12 的 J58/K58
联系起来。它没有证明实际诊断函数的线性化等于已接受的 physical43 映射。
下一题必须同时检验两条实际来源：

1. 完整 43 项实际诊断在固定背景的常值和全部二阶空间线性化，是否等于原 C0/C1/C2。
2. nonlinear driver 的全部 49 个原始诊断标量，是否与其中 40 个独立约束及 9 个对称
   冗余一致；不能仅因两段公式相似而跳过 driver 的实际方法调用。

完整 43 项执行 baseline、momentum_trace_mutant、connection_target_mutant 三个真实
case；driver 执行完整 baseline。此 scope 已确定，不缩成方向抽样、单行示例或只比较 H/M。
下一批允许得到非零残差、反例或资源中止，不预期或预填全零。

## 2. 真实诊断来源及不能混用的对象

完整 43 项的最小实际来源是
`science/numerical_relativity/fo_ccz4_relaxation_convergence.py`：

* `require`、`symmetric`（101 行）、`christoffel`（108 行）、`constraint_fields`（119 行）；
* 原 `derivative`（85–98 行）的 AST 作为明确的替换边界；
* `fo_ccz4_checkpoint.py:SYMMETRIC` 的对称槽顺序及原 checkpoint 的 slots/header 接口。

`constraint_fields` 直接从物理 metric 与 extrinsic curvature 求 Christoffel、Ricci、H/M，
并返回 det_h、trace_a、Theta、Ghat 以及 A/B/D/P 定义缺陷。它没有以演化辅助 D/P
代替 metric 的真正空间导数。这一点必须在完整离约束扰动下保留。

同批必须实际执行
`fo_ccz4_sbp_nonlinear.py:NonlinearSBPCube.metric_constraints`（239–279 行），
连同 `state`（149 行）到 `fo_ccz4_sbp_volume.state_from_slots` 的来源闭包。
实际实现绑定原 state AST 但不执行其 float64 field 转换；私有 driver adapter 直接调用
原已适配 state_from_slots。必须把这条替换列为可信桥，不能写成原 state/field 已执行。
原方法通过 `self.volume.axes[axis].derivative` 求空间导数；本候选明确将该绑定解释为
continuum derivative callback。原 `.diagnostics`（281 行）进一步算离散范数，本批不执行
或验证该范数、norm_weights、SBP 边界闭合或网格收敛。

只读时三个关键源文件的摘要如下；正式 registry 必须补齐完整来源闭包及 AST：

| 文件 | SHA256 |
| --- | --- |
| fo_ccz4_relaxation_convergence.py | `b639d3e759ec6b75e95a4f44d842d64b61538a6cf3ebf29d1ca08ddc77bca60f` |
| fo_ccz4_checkpoint.py | `405dcd88a7a1d75757d7f34b4b69d42ba2bf2fc3d5e7b4de06d477a8cf40abdd` |
| fo_ccz4_sbp_nonlinear.py | `0f89d9a992d08f0dd6bd49ff1f8da75b5fb056ed9d9761d1157fa14ee3334af6` |

`fo_ccz4_principal_symbol._constraint_components` 的实际 69 行是 33 个定义、33 个 curl/order
以及 det/trace/Theta；它不含 H/M/Z。不能选取、截断或改名这 69 行来冒充 C43。
`fo_ccz4_ordering_constraints_3d` 也不是本候选的完整物理诊断来源。

原 relaxation `derivative` 是用 FFT 实现的 centered FD2/FD4 符号，而非 continuum 导数。
本批保留其源身份并显式替换调用绑定，**不执行 FFT/FD/SBP 导数，也不声称本批验证了它们**。
header 的 spatial_order 即使仍由原函数读取，也不能被用作本批离散精度标签。

## 3. 固定背景、58 槽及物理 43 行

使用与实际 volume 父相同的固定 case12：

    alpha0=17/20, chi0=18/25, beta0=(3/100,-1/25,1/20),
    h0=L L^T, L=[[1,0,0],[3/25,1,0],[-2/25,3/50,1]],
    Atilde=K=Theta=GammaHat=b=A_i=B_k^i=D_kij=P_i=0.

背景为常量，h0 正定且 det(h0)=1。58 槽沿用原状态排列；q6=ln(alpha)，
q10=ln(phi)=0.5 ln(chi)。h 和 Atilde 各有六个独立对称槽，顺序为
(00,01,02,11,12,22)。这里允许全部 58 个状态方向及其空间导数独立改变，不施加
det 切空间、trace-free、auxiliary definitions 或 curl 条件。

输出 43 行的次序固定为：

| 0-based 行 | 内容 |
| --- | --- |
| 0 | H |
| 1–3 | M_i |
| 4 | Theta |
| 5–7 | 下标 Z_i |
| 8–10 | C_A |
| 11–19 | C_B，按 (k,i) |
| 20–37 | C_D，按 k 与六个对称 (i,j) |
| 38–40 | C_P |
| 41 | det(h)−1 |
| 42 | tr_h(Atilde) |

实际 relaxation 返回的 `Ghat` 是反变连接差

    Ghat^i = GammaHat^i − h^{jk} Gamma(h)^i_jk.

必须由一个明确登记、独立复验的完整 wrapper 形成

    Z_i = (1/2) h_ij Ghat^j.

wrapper 应作用于完整 jet h 和 Ghat，不能默默只用背景矩阵或把 Ghat 原样称作 Z。
由于背景 Ghat=0，线性化中 δh·Ghat0 消失；这是检验后的背景性质，不能替代完整映射。
行装配表、原字段名、各字段 shape 与 flattened 槽顺序均必须保存。

## 4. 离约束 trace 与 determinant 的关键区别

实际两条来源均构造

    gamma_ij = h_ij / chi,
    K_ij = (Atilde_ij + h_ij K/3) / chi,
    actual_trace = gamma^{ij} K_ij = K + tr_h(Atilde).

H 使用 actual_trace²，M 使用 −partial_i(actual_trace)。在当前零 K/Atilde 背景，
H 中 trace 替换的差可能是二阶振幅，不能据其一阶不敏感宣称 off-constraint 公式一致。
M 的 −partial_i tr_h(Atilde) 则已经是一阶必要项。

同理，真实 contracted Christoffel 满足

    h^{jk} Gamma(h)^i_jk
      = −partial_j h^{ij} − (1/2) h^{ij} partial_j ln(det h).

仅用 −partial_j h^{ij} 的 shortcut 在 det(h)=1 恒等约束外不正确。
`constraints3d.constraint_report_3d` 使用 stored K 的 trace 口径及该连接 shortcut，
不能直接替代本候选。`fo_ccz4_trace_source_window.metric_constraints` 对 H/M 作过 trace
修正，但不足以使 shortcut 的 Ghat 自动成为本题的完整来源。FO `_geometry` 使用独立
辅助 D 构造的 Z 在定义约束外也不是这里的 metric Z。

以上差异是选择真实负控的理由，不能通过投影 trace、重定义目标 C 或删减扰动消除。

## 5. 同批 driver 的 49 原始标量与 40 独立行

driver 返回 H_metric(1)、M_metric(3)、det_h(1)、trace_a(1)、Theta(1)、C_A(3)、
C_P(3)、C_B(9)、C_D(27)，总共 **49 个原始标量**。它没有 Ghat/Z。
C_D 的最后两指标对称，因此 27 中含 18 个独立量和 9 个冗余；独立数才是 40。

本批保留上述全部 49 个原始量的背景值和 580 个导数系数。另明确保存两个对照：

* 40 个独立量按物理行顺序对应到 baseline43 的全部非 Z 行，即 0–4 与 8–42；
  保存背景值差和全部导数矩阵差。
* 对每个 k 及 (i,j)=(0,1),(0,2),(1,2)，保存
  C_D[k,i,j]−C_D[k,j,i] 的背景值差和全部导数矩阵差，共 9 行。

不得只复制 full43 的 40 行作为 driver 的结果。必须经过原 `metric_constraints`、
实际 state 构造和原字段计算，再按显式映射对照。完成这一步也不使 driver 拥有原本不存在的
Z 诊断接口；新增完整43 wrapper 与原 driver 的范围必须分别标记。

## 6. 580 种子的正确含义与导数算子

在一阶振幅的实数 dual algebra 中登记：

    u_a                        58 个状态种子，a=0..57；
    p_(i,a)                   174 个一阶空间种子，i=0..2；
    h_(ij,a), i<=j             348 个对称 Hessian 种子；
    总计                       580。

推荐固定索引为 u:a，p:58+58*i+a，h:232+58*pair_index(i,j)+a。
pair 顺序同 (00,01,02,11,12,22)。所有两个振幅种子的乘积为零；这仍是一次
Fréchet 导数，**不是二阶振幅微分**。二阶是空间导数的最高阶数。

580 是完整 58 状态的二阶局部 jet 的自然维数。它不是每个具体诊断表达式的最小活跃支持；
许多 auxiliary 梯度/Hessian 列应为零。本候选仍保存并验证这些零列，不能先手工删掉它们。

continuum 导数的线性作用必须为

    D_i(constant)=0,
    D_i(u_a)=p_(i,a),
    D_i(p_(j,a))=h_(min(i,j),max(i,j),a).

此处不乘 2。D_i 对二阶 Hessian 请求应拒绝三阶导数。应保存阶数溯源，常量/状态/
梯度/Hessian 可分别标为 −1/0/1/2；算术保留 max 阶数，即使某系数乘零或抵消也不丢失
请求来源，避免第三阶请求因为结果恰好为零而被静默接受。切片 `field[...,component]`
必须保留种子身份，不能按原 array id 猜测导数。
没有任何种子来源的纯常量保持阶数−1，可继续求导为零；第三阶拒绝针对状态种子路径。
由于背景所有空间梯度/Hessian 为零，Fréchet 一阶与两次 D 可交换；被丢弃的
(Dδq)(Dδq) 始终是幅度二阶。这不是一般非均匀背景的空间 Taylor 代数。

Hessian 对称是光滑 continuum 基态场的 mixed-partial 交换，不是对独立 FO 辅助
A/B/D/P 施加 curl=0。它不减少这些辅助场本身的独立状态、梯度或 Hessian 扰动。

已冻 actual-volume 的 232 种子后端不能只改一个 SEED_COUNT 或简单继承：其算术返回类、
种子上界和 gradient/taint 语义含具体限制；独立 reverse tape 也有相同扩展问题。
新实现必须显式完成 580 索引、两级空间路由、第三阶拒绝及原数组操作的完整支持。

## 7. 从已接受 C0/C1/C2 提取十张完整目标矩阵

令实际诊断的一阶变分为

    δD = L0 u + Lx p_x + Ly p_y + Lz p_z
         + Lxx h_xx + Lxy h_xy + Lxz h_xz
         + Lyy h_yy + Lyz h_yz + Lzz h_zz.

每张 L 为完整 43×58。有且只有十张目标矩阵：

    L0=C0；Lx,Ly,Lz 为 C1 中 x,y,z 的完整系数；
    Lxx,Lxy,Lxz,Lyy,Lyz,Lzz 为 C2 中 x²,xy,xz,y²,yz,z² 的完整系数。

**独立 h_xy 表示实际 partial_x partial_y u，故 Lxy 直接等于 C2 的 xy 总系数，不除 2。**
只有改成对所有有序 i,j 双重求和的约定时，两个有序混合系数才各取一半。
可用局部 Taylor 表示 u+p·x+(1/2)h_xx x²+h_xy xy+…解释本约定；不能把 Taylor
单项式系数、实际 Hessian 和有序张量系数混为一谈。

应严格解码父多项式，逐槽检查 C0 的 degree 0、C1 的 homogeneous degree 1、C2 的
homogeneous degree 2 与允许 monomial 集合，收集全部系数，包括零。
不得通过三个坐标轴、有限方向、Rayleigh 商或谱采样恢复矩阵；坐标轴会遗漏 xy/xz/yz。

目标父为 `nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015`：

| 记录 | SHA256 |
| --- | --- |
| qualification-gate.json | `466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708` |
| worker-result.json | `9a0af8284a5cdd35c3723d3be5141f2659b4ee1ba6c77b1ba78923dcf1446811` |
| C0.json | `87d85210d4d0bae1b77278657bc0277711778332de32c0cfde4b61958d5df053` |
| C1.json | `f396ff86998f987246af4a92844cae3944cc265418116f7f1a3dacfc3d7f4a65` |
| C2.json | `b54ada626e3fd69d337d2a7a1b8f04d10ea44e1c72533e81741b354b26acdd21` |

这些身份不能替代完整 parent registry。正式实现须绑定实际文件 bytes、gate artifact 关系、
replay 资格、domain、原 `nr_constraint_full_symbol.physical_coefficients` AST 和固定背景。
不得重新生成一个同名 C 矩阵代替已接受父输入。

## 8. 精确 chart、AST 适配与共同可信基

沿用中心化 exact chart：alpha=alpha0*(1+u6)，chi=chi0*(1+2*u10)，只取一阶振幅。
q6/q10 的非有理常背景 log 由显式中心化载体表示，不能先用浮点 log/exp 再转 Fraction。
relaxation 的 `exp(2*q[10])` 必须单独登记适配；旧 adapter 只处理 state_from_slots，
不会自动正确覆盖这个新调用位置。

driver 的 `np.log(b.lapse)` 与 `.5*np.log(b.chi)` 只出现在被空间微分的表达式内。
可针对这些确切节点使用 centered log：保留导数 δalpha/alpha0 与 δchi/(2*chi0)，
丢弃被空间微分消去的常背景 log。不能让一般 np.log 静默返回零，也不能遗漏导数比例。
父 actual-volume 已实际保存漏 alpha0、漏 chi0、漏因子 2 的三种 wrong-chain gap；
本批继承该已验身份，execution 保存正确 alpha/chi chain 与 log 适用范围，并新增实际
exp/log 小路径错误拒绝控制，不在本批 execution 重复三份 gap。当前零背景诊断是否
敏感不是 chart 正确性的替代证明。

原 `require`、有限性/对称性门、真实 state constructor、数组 packing 和公式 AST
应保留；确需 object dtype、返回载体或数组 dispatch 适配时逐节点登记原/适配摘要。
本题含 np.stack、matrix @、trace、einsum、inverse/det、切片和两级 derivative，均需
按原表达式实际执行。禁止将整段 H/M/Christoffel/Ricci 替换成手抄线性公式。

十进制字面量应按源文本解释为有理实数，适配必须支持 `.5` 等 leading-dot 写法；旧
只允许首字符为数字的门会拒绝实际源。所有白名单匹配要求确切节点及出现次数，未知节点失败。
这种解释是**来源绑定的实数公式语义**，不是 Python binary64 NumPy 运算逐位等价。

生产可采用新的稀疏 forward 580-jet；独立端采用完整 reverse differentiation 或另一套
独立精确导数实现，inverse/det 不共享生产消元。两端均须重新执行三份43和driver49的
实际诊断，不只复查保存矩阵的相减。若共享 AST、数组 routing、chart 或 packing，须明确
列出为共同可信基；“不同自动微分算法”不能自动排除共同源映射错误。

## 9. 完整证据规模与失败保存

以下是由指定 shape 得到的**设计计数**，不是已实现、已运行或已通过的产物统计。
每个43 case 保存背景值 F0(43×1)、十张导数矩阵与十张相对原父目标的残差矩阵：

    43 + 10*(43*58) + 10*(43*58) = 49,923 槽。

三个实际 case 共 149,769 槽。baseline 的 F0 与十残差共 24,983 槽必须精确为零。
两个负控仍保存全部 49,923 槽，不能仅保留预计受影响行或第一处反例。

driver baseline 的完整证据为：

| 证据 | 设计槽数 |
| --- | ---: |
| 49 个原始背景值与 10 组导数 | 49*(1+580)=28,469 |
| 40 个独立行对 baseline43 的背景/导数差 | 40*(1+580)=23,240 |
| 9 个 D 冗余对称性的背景/导数差 | 9*(1+580)=5,229 |
| driver 合计 | 56,938 |
| 全部三份43与driver证据 | **206,707** |

driver 的40差与9对称差共28,469槽必须精确为零。与 baseline43 的24,983槽及独立
driverF0 的49槽相加，正式必零门共 **53,501槽**。这49槽属于原始 driver 证据的另一
张矩阵，并非再次生成一份差值来扩大证据数。

正式保存可将十个43×58导数块按种子顺序拼成一张 C(43×580)，其残差同样拼为 R；
三 case 各保存 F0/C/R，共9张。driver 保存 F0(49×1)、C(49×580)、
Agreement(40×581)、Symmetry(9×581)，共4张；后两张的第0列为背景值差。
这13张完整矩阵仍覆盖同一206,707槽，不减少任何导数块。元数据、来源 manifest、
两端重放记录和 chart 小反例另计，正式冻结时需重新从实际 schema 检查所有数量。

所有矩阵保存完整 row-major 槽，包括零，使用 canonical reduced Fraction；禁止浮点、
bool 冒充整数、非规范符号或省略零槽。阶段完成即 sink，并保证之后不修改已保存对象。
主候选失败仍继续保存已注册负控和完整独立重放，最后明确失败；异常/超时则保留可用前缀。
绝不把前缀、部分归零或成功小测试写成完整诊断桥通过。

## 10. 两个真实全量负控与因果判据

第一负控 `momentum_trace_mutant`：实际实现对原 constraint_fields 中唯一
`actual_trace` 赋值作确切 AST 变异，改为 stored K=q[17]。因此 M 中被减的导数改变，
H 中 actual_trace² 子式也语法改变。当前零曲率背景下后者的一阶变化可为零，必须由
完整43输出及目标外变化计数实际检验，不能删掉 H。重新执行全部580种子；纸面预期遗漏
−partial_i tr_h(Atilde)，但结果矩阵、余差及非零槽数都由实际计算产生。

第二负控 `connection_target_mutant`：对原 metric_gamma 的 contracted-Christoffel
表达式作确切 AST 代入，改为各分量 −sum_j derivative(h_inverse[i,j],j)。其余诊断、
完整 h/2 的 Ghat→Z wrapper 均保留，再执行完整43及580种子。纸面上它会遗漏 determinant
梯度项；不得预填该差或通过 det=1 投影使它消失。

每个负控必须在同一注册约束行、同一状态/空间系数槽同时满足：

    mutant_coefficient != baseline_coefficient,
    mutant_coefficient − original_target_coefficient != 0.

保存实际 `causal_changed_residual_slots` 及完整差值来源。不能以两个无关位置分别非零
声称因果拒绝，不能预设 baseline 通过才允许保存负控。两个 backend 各自真实执行变异；
不可用手填的理论 delta 代替重算。源变异匹配不到或匹配多次都必须拒绝。

focused controls 还应包括：实际 xy/xz/yz Hessian 与因子2反例、两次非交换 slicing/
derivative routing、第三阶请求及抵消后的溯源、完整离约束 h/a/辅助方向、driver 49↔40
装配和九对称差、leading-dot rationalization、真实 chart 反例、guard/sink 失败传播、
父摘要/资格漂移及规范全槽解码。小控制不替代两个全43真实负控。

## 11. 唯一受控批次与冻结前检查

维持原 owned controller 与 single-scan 监护：**600 秒、64 MiB 证据上限、8 MiB
来源上限、原 2 MiB 终端/预留合同、原磁盘门槛，一次运行、零自动重试**。全部科学求值、
两个 backend、全部小控制和完整重放共享本批预算。静态 metadata 预检不运行候选数学。

内层操作需有明确 deadline callback 及阶段保存；解释器/库内部不可插入 callback 的区段
必须如实登记，仍受 owned 外部硬截止保护。不能在文档承诺尚未实现的每步检查或把预算外
补算拼接进结果。finalizer 只核来源/输入/产物 hash、AST 与回执完整性，不重做科学计算。

正式 EXPERIMENT 冻结前必须确定完整 parent bytes、全部 source/AST adaptation registry、
580 seed/schema、四次实际求值及输出顺序、两后端身份、focused 测试确切函数/实例数、
历史目录/文件/字节、输入输出数与清理合同。206,707 个系数槽必须全部纳入成本，不可
悄悄降为40或43的一部分；若预算不足，保留失败记录后提出一个新候选，不能本批改门槛。

## 12. 通过后可以连接什么，以及 IBVP 仍缺什么

仅当本批全量通过且与父使用同一 chart、背景和状态顺序，才能把实际 volume 的 J/K 桥、
本批实际诊断 C 桥与已接受的多项式关系

    C(zeta,v) (J + zeta K(v)) = Q(zeta,v) C(zeta,v)

连接成固定背景下一阶 continuum 实数公式的实际约束传播来源证据。多项式等式包含
零空间频率的取值，但 C0 的 rank39 事实不变；H/M 零模不会因此获得完整43右逆。
不得把原只在非零频率定义的 Laurent T/T_inverse 延拓到零频。

可新资格化的范围限于本固定 case12 的实际诊断线性化和 driver 对应关系。
仍不能宣称 nonlinear constraint propagation、binary64 诊断一致性、变背景能量、
43 无损失普通 L2 估计、实际演化收敛或完整 IBVP 已通过。原 full58 原状态 L2 增长界
与43加权增长界继续保持各自范围，不因诊断桥而合并成更强结论。

IBVP 至少还需要真实边界算子和数据的来源桥、约束/物理/gauge incoming 模式的耦合、
切向频率和角点处理，以及适用的统一边界稳定性与兼容性证明。方向依赖 Cauchy
symmetrizer 不能自动当作局部边界通量能量。当前 driver 的解析 incoming-target SAT
也不能自动改名为 constraint-preserving 或吸收辐射边界。
随后才是完整 SBP/SAT 离散能量、空间与时间一致性、稳定时间步和有限时间收敛门。
变背景和 nonlinear 稳定性需另行验证。

本 NOTE 固定完整科学问题与证据覆盖；后端具体实现、最终文件名/schema 和确切资源成本
仍由下一次正式预注册冻结。本 NOTE 本身没有执行资格，也不能替代下一批结果。

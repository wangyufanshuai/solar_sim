# Case12 完整线性约束符号：独立系数推导候选

## Material Passport

- Origin Skill: academic-research-suite / source verification -> experiment-agent.
- Origin Date: 2026-10-13.
- Verification Status: UNVALIDATED_IMPLEMENTATION；尚需独立授权的控制批次。
- Version Label: case12_full_linear_symbol_v1.
- AI-assisted derivation and implementation; no external expert signoff.

## 本轮发现与范围

已验收的上一批只核对43维主部和首阶状态映射，不能把其秩43结论用于
原始物理约束的零频矩阵。当前代码 `constraint_symbol_bridge.physical_rows`
在 k=0 时 H、M 四行严格为零；其他行包括33个定义约束、d、trace(a)、
Theta、Z，因此至多39维。新的验证必须证明剩余39行独立，并检查其像
空间在零频源算子作用下不泄漏，而非为43行补造右逆。

这一边界此前已由浮点 `constraint_symbol_controls.require_gates` 明确
区分。本轮不是发现了一个应偷偷修正的旧测试错误，而是补上独立精确
来源与证明证据。已验收代码不修改，旧零频结论不重评。

目标是在同一个 case12 平坦常背景/方向上独立推导完整线性符号：
包括低阶源项，不仅是高频主部；不包含非恒定背景、非线性闭合或边界。
保持 alpha=17/20、chi=18/25、h=L L^T、beta=(3/100,-1/25,1/20)、
v=(1,2,-1) 的冻结设计。另显式固定已有源项选择
tau_inverse=1、kappa1=1/10、kappa2=eta=0、c=e=s=1。
这是已注册实验 profile，不是声明所有运行时默认参数都相同。

## 来源核对

主来源是 Dumbser et al. 的
[FO-CCZ4 v2](https://arxiv.org/html/1707.09910v2)，
[元数据](https://arxiv.org/abs/1707.09910v2)：Eq.5/6/25 约束定义，
Eq.12a-m 演化和代数松弛源项。2026-10-13 本轮读取了这些公式与元数据。
HTML 页顶自动生成日期不能替代 arXiv v2 的2018-04-28版本日期。
它是原始理论文献，适合核对该公式来源，不是本项目正确性的证据。
未运行 S2/Crossref、期刊分区、COI 或撤稿穷举核查，不宣称已完成这些检查。

对照的本地路径：`profile_constraint_closure.source_matrix`、
`constraint_symbol_bridge.physical_rows/linear_symbol`，及前一批冻结的
`nr_profile_exact_coefficients`。本轮新参考不导入前两个生产比较路径；
它明确共享最后一个独立58维主部源，而不假称全套理论完全独立。

## 低阶58维源 J 的独立线性化

采用与上一批相同状态顺序及 q_t=A^j partial_j q+S 号约定。
在动力学场和辅助场都为零的常背景上线性化 Eq.12。令
u=h^-1、t=u:a、d=u:delta h、bdiv=B_k^k，得到：

```
delta h_t = 2 beta^k D_kij + h_ki B_j^k + h_kj B_i^k
            -2 h_ij bdiv/3 -2 alpha(a_ij-h_ij t/3) -h_ij d
delta ln(alpha)_t = beta^k A_k -2 K +4 Theta
delta beta^i_t = beta^k B_k^i +3 alpha chi b^i
delta ln(phi)_t = beta^k P_k +(alpha K-bdiv)/3
a_ij,t = -h_ij t
K_t = -3 alpha Theta/10; Theta_t = -alpha Theta/5
Gamma^i_t = b^i_t = -alpha [Gamma^i-u^ij C_j(D)]/10
C_i(D) = u^jl(2 D_jil-D_ijl).
```

上面列的是代数源的线性部分，不含已由 Kv 表达的空间主部。
其余辅助源在此背景的一阶变分为零。含两个消失扰动场的乘积不进入 J；
f 的背景变分乘以 b=0，因此该线性阶没有额外 delta f 项。
这些公式仅在明确的常背景成立，不能用于把弯曲背景的系数梯度删掉。

独立实现通过有理数基向量与完整指标求和组装 J，不调用源矩阵的数值
差分，也不复制比较路径的 einsum 表达式。J 的输入浮点版本必须在
2e-12 阈值内与其逐系数一致，才能继续后续验证。

## 物理约束多项式 C(z)

使用形式变量 z，使空间导数为 z v；实际 Fourier 比较时再代入
z=i rho/sqrt(v.v)，保留实、虚部和所有符号。记 p=u v、g=v.u.v。

```
H     = z^2 chi [p^i p^j delta h_ij -g d +4 g delta ln(phi)]
M_i   = z [p^j a_ji-v_i(t+2 K/3)]
Z_i   = [h_ij Gamma^j-z(p^j delta h_ij-v_i d/2)]/2
rA_k  = A_k-z v_k delta ln(alpha)
rB_k^i= B_k^i-z v_k delta beta^i
rD_kij= D_kij-z v_k delta h_ij/2
rP_k  = P_k-z v_k delta ln(phi)
d=u:delta h; t=u:a; Theta=Theta.
```

因此 C(z)=C0+z C1+z^2 C2，系数均为43×58有理矩阵。保留33个辅助
定义约束及两个代数约束；不令 off-definition 扰动为零。

## 全系数恒等式，而非采样拟合

独立全状态生成元是 L(z)=J+z Kv。按现有线性约束方程至多二阶空间
导数的合同，预先限定待推导 B(z)=B0+z B1+z^2 B2；不根据结果搜索
阶数。要求 C(z)L(z)=B(z)C(z)，逐幂写成：

```
C0 J             = B0 C0
C1 J + C0 Kv     = B0 C1 + B1 C0
C2 J + C1 Kv     = B0 C2 + B1 C1 + B2 C0
C2 Kv            = B1 C2 + B2 C1
0                = B2 C2.
```

特别是最后一条四次幂系数也保留，不能因为左边最高三次就丢掉。
令 X=[B0 B1 B2]，构造卷积块矩阵 D（129×290），第 i 个行块/
第 k 个列块为 C_(k-i)，越界为零；右边 Y（43×290）是上述左边。
以精确有理数消元求 D 的右逆 J_D，必须满足秩129及 D J_D=I。
定义 X=Y J_D 后，再检查 XD=Y 的全部43×290元素严格为零残差。
有右逆本身不保证 Y 属于 D 的行空间，后一个检查不可省略。

若存在两个解，它们之差满足 (X1-X2)D=0，乘 J_D 后得到 X1=X2。
另一选主元顺序必须生成不同右逆而相同 B0/B1/B2；原顺序的同批次
重建必须逐元素相同。这是预设方程的精确系数求解，不是对频率样本、
生产矩阵或特征速度做回归。即使有理数证据通过，也只证明该固定背景/
方向上的多项式恒等式，而非全方向统一稳定估计。

## 零频：39维像空间和未定的扩展

在 z=0，C0 的 H/M 四行消失。D39=C0[4:] 必须通过精确右逆证明行秩39。
检查 B0[:4,4:]=0，并核对 B0[4:,4:] D39=D39 J。
这是零频可实现物理约束振幅的封闭关系，没有删除实际可达的自由度。

取 E43 只有 E[4,0]=1，则 E C0=0，所以仅凭零频状态恒等式无法区分
B0 与 B0+E。这给出“零频整个43×43算子不能由状态映射唯一反演”的
显式反例。完整 B0 可以由上述全频多项式合同确定，但不因此获得
C0 的43维右逆；零频也不能直接代入含1/rho的原变换。

## 待运行的比较和不能得出的结论

未来获授权的单批将核对 rho=0,1/2,1,2,4,8 的物理约束、完整约束符号
和58维生成元，沿用原2e-12阈值；设计参考在 Decimal50/70 下分别求值。
保存每个实、虚部的逐元素差值；不替换旧二进制浮点输入。
原始浮点矩阵的完整状态传播关系也必须通过同一阈值。

尚未运行，不得据本推导或新文件的存在宣称任何测试通过。本批即使
通过，也不证明非线性约束传播、非恒定背景、全方向对称化、CPBC、
零频一致能量范数、演化收敛、黑洞物理、AMR、GPU或 live 准入。

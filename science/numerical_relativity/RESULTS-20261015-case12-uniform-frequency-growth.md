# 固定 case12 全频率增长界：完整受限批次通过

## Material Passport

日期：2026-10-15，Asia/Shanghai。Origin Skill：academic-research-suite / experiment-agent。Verification Status：本地完整精确证书与独立算法重放通过；不是外部团队复现。AI-assisted。顶层 goal 保持 active，实际RHS来源桥、初边值、收敛和演化门槛继续开放。

## 两项通过的结论

范围为固定case12、geometric=False、常背景、原58状态及已接受物理43符号。物理Fourier频率为ζ=iρ、ρ≥0，方向n为单位实向量，时间τ≥0。

**完整58维原状态。** 实际J58完整3,364槽的系数L1界为 `j=4454622161252753/61035156250000`。继承已验 `H58 K58=K58ᵀ H58`、`I/14≤H58≤C58 I`，精确计算并独立核对 `Γ58=28 C58 j`。非零频率使用 `y*H58(n)y`，零频使用 `y*y`，统一能量上界为 `max(C58,1)`。由此得到原固定常系数符号 `J58+iρK58(n)` 在全空间或周期Cauchy问题中的一致L2增长估计。原shift保留，没有把状态换成S58缩放坐标。

**物理43维约束。** 固定ρ*=1/2，低频使用 `c*c`，高频使用 `(Tc)*H43(n)(Tc)`，星号为复共轭转置。实际低阶Z及Q系数的完整L1界给出

`Γ43low=2(q0+q1/2+q2/4)`，`Γ43high=28 C43(c0+2c−1+4c−2)`。

两者及其max均已保存为求值后的规范有理数，独立重算完全一致。实际 `c−2=0`，`c−1=73683/5000`，`c0=2811265112121475881/3814697265625000`；没有删除非零ζ⁻¹项。

T2全部1,849槽精确为零，实际坐标常数为

`A_T=11130625773/19531250`，`A_i=10298102437/19531250`。

高频能量满足 `h/[A_i²(1+ρ)^4] |c|²≤E43≤C43 A_T²(1+ρ)² |c|²`，h=1/14。低频区间为0≤ρ<1/2，高频为ρ≥1/2；每个频率固定不随时间切换。这个结论是频率加权范数下的增长界。粗略转回原43变量会带三阶频率余量，既不证明plain-L2无损失，也不证明三个导数是必要或最优损失。

完整求值记录：[58增长界](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-uniform-frequency-growth-controls-v1-20261015/growth58.json)、[43增长界](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-uniform-frequency-growth-controls-v1-20261015/growth43.json)、[变换权重](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-uniform-frequency-growth-controls-v1-20261015/transform_bounds.json)。C58及增长上界很保守；有限正增长界不证明阻尼、实用误差容限或稳定时间步。

本批只将 `full58_uniform_frequency_l2_growth_validated`、`physical43_weighted_frequency_growth_validated` 置为true。原17个限制标志及新加的原43统一Euclidean增长、无导数损失、变背景能量三个标志仍false。笼统的 `full_frequency_energy_validated` 没有代替这两个精确范围标志。零频仍为39维物理像，T/Ti未在零频求值。科学载荷写回、physical/live、实际非线性RHS、物理边界、离散收敛和时间演化资格均未改变。

## 实际唯一运行与身份

目录：`tmp/nr-shadow-evidence/nr-k3-case12-uniform-frequency-growth-controls-v1-20261015`。

| 项目 | 实际记录 |
|---|---|
| gate SHA256 | `9b20396162fe62a9be2ef256c340c7d457a42e8578540ac9f4b7f6c9656f0d62` |
| worker SHA256 | `6f3a9e9b3604e3de290ef98c121d7b7eafe176eb9b96341f5472e500bda4cea3` |
| replay SHA256 | `d868a751f653a07eb390a6c23c3253023627e0ac45d7c17d56f23275d1c61ff1` |
| run ID | `c740048a-1845-4a64-ad21-a02555fbff71` |
| worker / 完整监护 | **124.078 / 165.563秒** |
| 外层会话 / worker PID | 7515 / 38756；实际exit0 |
| Job及清理 | assigned=true，cleanup_verified=true，所属进程0→0 |
| 重试 / 注入 / 中断 | 0 / false / false |

[机器终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-uniform-frequency-growth-controls-v1-20261015/qualification-gate.json)为complete，passed/completed均true、errors为空。原600秒、64 MiB磁盘输出上限、2 MiB终态预留、8 MiB来源快照限制、单数值线程及C/E磁盘底线保持。未先行执行数学或pytest，未扩预算、重跑旧失败或拼接结果。原物理阈值2e−12保持；本批有理数以精确相等验收，所需零项以严格精确零验收。

| 阶段 | worker相对秒数 |
|---|---:|
| 全部输入、来源及历史完成 | 43.000 |
| 160项控制完成 | 45.046 |
| 28份生产证据保存完成 | 61.625 |
| 完整独立重放完成 | 64.828 |
| worker封存完成 | 124.062 |

## 完整覆盖与真实反例

| 证据 | 数量 | 完整槽数 | 验收含义 |
|---|---:|---:|---|
| 主系数L1表 | 15 | 29,250 | J58、Q0..2、Z−2/−1/0、T与Ti全部−1..2系数，包含每个零槽 |
| 变异输入的L1表 | 2 | 5,213 | 从实际变异J和T2重新求和 |
| 实际变异矩阵 | 2 | 5,213 | 原矩阵完整保留，仅登记位置被修改 |
| 定量及元数据记录 | 9 | — | 三个增长/权重记录、负控、acceptance、stats、domain及两个来源记录 |
| 合计输出 | **28** | — | 100份解析输入完整独立消费 |

重新读取九个Z与主部残差，确认已接受的六个频率残差共11,094槽全零；T2另1,849槽全零。五份原零频物理像残差共8,771槽也完整解码并验零，同时核对C0/D39映射和像外歧义。它们属于已接受父证据的重新读取，未重做父矩阵乘积，不能记作新产生的主矩阵残差。

实际 `J58[57,57]+=1` 后完整重算系数界，完整3,364槽差表只有1槽改变，总界差1，复用原证书被拒绝。这不否定变异系统自身重新计算的增长界。实际 `T2[0,0]+=x²` 后得到1非零槽、1单项式，登记的一次T频率阶数被拒绝；没有放宽阶数或用抽样方向替代多项式检查。

两个独立小有理反例也实际执行并保存：漏掉1/h的增长公式产生正缺陷13/98；把T拉回能量误当统一Euclidean下界产生缺陷−3/4。它们是算法和推理控制，不是固定case12的物理反例。生产和独立重放均从实际系数求和及实际变更输入构造记录，没有预填预期结果。

## 来源、测试与封存

| 项目 | 实际记录 |
|---|---|
| 全部控制 | 49函数、160实例，0失败/错误/跳过 |
| focused / 冻结整数控制 | 28/87与21/73 |
| 来源闭包 | 678文件，7,120,849字节 |
| 历史保护 | 27目录，19,556文件，516,950,555字节 |
| 完整本批文件 | 852摘要加终态，共853文件、24,344,070字节 |
| 父输入 | 72份、8,946,161字节，绑定6组父资格 |
| 实际重放输入 | 100份、9,509,489字节 |
| 阶段回执 | 61份 |
| 本批运行时文件记录 | Python可执行1份、103,192字节 |

数学使用标准库Fraction。现有运行时记录器会记录Python可执行与已加载数值包模块；本批没有加载NumPy/SymPy，故实际只记录可执行文件。它不构成全部标准库、OS DLL或Python语义的完整证明；源码和已安装依赖版本记录分别保留。

| 冻结文件或输出 | SHA256 |
|---|---|
| producer | `34eaf076c5a8df03e2ac4f264f74ebbe60c720c9160af06c6519c5c09b98792c` |
| runner | `9d7198189e500d6e9a0e1396220216c1862d697cef29d557947a31c9ff2c08ae` |
| focused tests | `ecc38682238792b7276df016206092f05dd4c1286339576dcc4b5649d395ce53` |
| DERIVATION | `ecf1fe227bfbe516ac0001ff290ee2d4c6c1532166265acb69dbbafc53b1ca68` |
| EXPERIMENT | `a6425ad080aa6a2ab655370d87bd753c4c14227c25fe9c3ef446f8576118f17a` |
| growth58.json | `ba8fa85f174d7b4bed4c584df90efb514b60d0d23df8d1db031514f7b725e13e` |
| growth43.json | `d36d1ee26e675103c0912be6ba2d78d14959c114fff495aa717b28ad5a8431b5` |
| transform_bounds.json | `8b1fe8dbe2385371eea63aff1920b2e23d16db1d38a31de4d7dd95b122c96a8e` |

终态后root与另一审查agent分别只读全量核对全部产物、678当前来源与快照、27完整历史目录、运行时记录、72父输入及100重放输入、XML/AST测试身份和精确范围元数据，两路均errors=[]。这两路是本地证据审计，不是外部科学复现。终态后未加载科学库、重算增长常数、补跑测试或修改冻结来源。

## 下一科学门槛

当前证明连接到既有源码绑定的线性符号，尚未证明实际体积RHS在相同状态坐标与背景上的Fréchet线性化就是该符号。下一步完整比较实际平衡向量、代数Jacobian及三个空间方向Jacobian，保留所有离约束独立方向与可能的非零残差，先于合法IBVP与收敛推进。见[实际体积方程线性化候选](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/NOTE-20261015-case12-actual-volume-linearization-next.md)。该候选未执行，顶层目标不缩减、不完成。

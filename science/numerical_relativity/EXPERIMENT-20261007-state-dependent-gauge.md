# 状态依赖规范候选：实现、退化对照与短时约束实验

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: implement and validate
- Origin Date: 2026-10-07
- Verification Status: ANALYZED — bounded local numerical evidence; Hamiltonian gate incomplete
- Version Label: state_dependent_gauge_v2
- Scope: Python FO-CCZ4 shadow only; no art, live EIH, C++/CUDA or scientific payload changes

## 结论

本轮不只是更换谱审计参数：已将状态依赖的 Gamma-driver 和 ordering 系数接入
真实 Python 右端项以及 RK4 的每个阶段，补齐 shift 梯度方程中的乘积求导项。
这是独立、默认关闭的研究候选，不是对现有 live 内核的替换，也不是已获证明的新算法。

200 个预声明局部背景均得到完整的 58 维数值特征基；5 个必须保留的旧退化背景
在旧系数下仍被拒绝，在候选系数下通过。三档三维周期网格的短时演化有限、正定，
重复运行逐位一致。但 **Hamiltonian 约束第一组收敛阶为 1.49286，未达到 1.5**。
因此不能说全部独立约束通过，不能进入物理边界、黑洞长期演化或 live 推广。

当前水平仍是具备可追溯实验的数值相对论科研原型，不是世界前沿生产求解器。
与成熟软件相比，关键缺口仍是合法参数域上的连续适定性、约束保持边界、
黑洞长期演化、AMR/波形误差预算及独立后端的物理交叉验证，而不是代码量。

## 实际修改与兼容边界

- `fo_ccz4_gauge_profile.py`：不可变配置、显式适用域和版本身份。
- `fo_ccz4_rhs.py`：局部系数、乘积求导源项、RK4 各阶段显式传递。
- `fo_ccz4_frozen_symbol.py`：直接主部与实际 RHS 探针采用同一候选规范。
- `fo_ccz4_frozen_characteristics.py`：完整特征空间审计记录候选身份。
- `test_fo_ccz4_gauge_profile.py`：三轴求导、二/四阶收敛、退化反例、重放和拒绝路径。
- `scripts/run-nr-k3-fo-ccz4-state-dependent-gauge.py`：固定实验设计、源码哈希和只新增收据。
- `test_fo_ccz4_gauge_campaign.py`：不收敛、舍入下限、样本不足、覆盖写入和非有限收据防护。

只有显式传入 `gauge_profile=FOCCZ4GaugeProfile()` 才启用。
未指定时旧 RHS/积分分支不变。候选演化状态携带规范身份；缺失或不同的规范参数
会拒绝继续，避免静默换回旧系数。这只是**内存中的续算合同**，
不等于 Python/C++ 磁盘 checkpoint、manifest 或跨后端已经适配此规范。

修改前后对默认路径的 gauge-wave 和 Schwarzschild 外部场景分别比较
RHS、两步 RK4 主变量、两步 RK4 辅助变量，共六项数组 SHA-256 均相同。
该比较只针对本次会话中这两个固定输入，并非跨平台 bitwise 承诺。

## 方程与适用域

沿用 `gamma_ij=h_ij/chi`、`phi=sqrt(chi)`、`A_k=partial_k ln(alpha)`、
`P_k=partial_k ln(phi)`、物理迹 `K`、advective 1+log、`c=e=s=1`。
小写 `b^i` 是 Gamma-driver 辅助场，`B_k^i=partial_k beta^i` 是一阶 shift 梯度槽。

候选参数族为：

\[
 f=a\alpha\chi,\qquad \mu=k\chi,
 \qquad a>2,\quad 0<k<2,\quad 0<\alpha<2,\quad \chi>0.
\]

本轮固定 `a=3`、`k=0.2`，没有观测结果后调参。超出适用域直接拒绝，
不会裁剪 lapse、隐藏 NaN 或自动换规范。主变量 shift 方程包含 `f b^i`，
因此梯度方程必须包含：

\[
 \partial_k(fb^i)=f\partial_k b^i+f(A_k+2P_k)b^i.
\]

第二项是此次新增的真实源项，不是仅在诊断中修正。
`mu` 在一阶系统中乘 ordering 约束，不位于被微分的通量内，故这里不凭空添加
`partial mu` 通量项；但**对该系统再求导得到约束传播方程时会涉及系数导数**，
完整非线性 subsidiary system 尚未推导和验证。

令 `Hn=h^ij n_i n_j>0`。六类内禀速度平方除以光分支的
`alpha² chi Hn`，按从小到大排列为：

\[
 k/4 < k/2 < 1 < 2/\alpha < a/\alpha < 4a/(3\alpha).
\]

对应 ordering 横向、ordering 纵向、光/清理、lapse、shift 横向、shift 纵向。
这在上述开域内分开了六类速度，但每类仍有重复特征值。
PDE 的 `beta.n` 平移和独立的 11 个零速 ODE 槽也必须保留。
速度分离本身不证明重复特征空间完整、有界或光滑，更不证明强双曲性。

特别是 `alpha→0`、`alpha→2`、`chi→0` 的极限没有统一界。
本轮样本不覆盖视界/穿孔附近的 lapse 塌缩，不能将开域说明当成全黑洞计算域合同。

## 外部资料如何使用

Exa 本轮检索了两组主题、共 10 条候选记录；并非每条都完成全文审阅。
实际核对并用于方程边界判断的主要资料是：

1. [Dumbser 等，FO-CCZ4，附录 A.2](https://arxiv.org/html/1707.09910v3#A2)：
   原系统和局部波速家族；候选的变系数形式由本项目推导，不归为原论文结论。
2. [Beyer–Sarbach，BSSN 适定性论文](https://pure.mpg.de/rest/items/item_151562/component/file_151561/content)：
   动态规范可依赖场变量，但须检查特征退化及有界特征场。
   其 BSSN 定理不能直接移植为此 FO-CCZ4 候选的证明。
3. [GRChombo 的 MovingPunctureGauge 源码](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/CCZ4/MovingPunctureGauge.hpp)：
   核对 `F*b` 和 Gamma-driver 方程约定。该参考采用常系数规范；
   没有声称 GRChombo 使用或验证了本项目的新系数。

## 固定实验设计与结果

局部特征采样为 `alpha=(.2,.5,1,1.5,1.8)`、`chi=(.02,.1,.5,1)`，
两种单位行列式 SPD 共形度规、五个法向（x/y/z、斜向、相反斜向），
固定 `beta=(.15,-.08,.04)`，合计 200 点，各重放一次。
沿用 SVD 相对阈值 `1e-9,1e-10,1e-11`、基条件数上限 `1e6`，未放松门禁。

| 实验 | 结果 | 证据边界 |
|---|---|---|
| 局部完整数值基 | 200/200；最大条件数 104.33 | 有限采样，不是连续域证明 |
| 旧退化对照 | 5/5：旧方案拒绝、候选通过 | 包含两个 Schwarzschild 外部局部背景，不是黑洞演化 |
| 实际 RHS/直接主部 | 7/7 对照；最大差 `3.56e-15` | 代码方程一致性，不是外部物理真值 |
| 三轴二阶制造导数 | 1.98516、1.99629 | `partial(f*b)` 的独立解析 oracle |
| 三轴四阶制造导数 | 3.96467、3.99117 | 不代表整套演化已达四阶 |
| 三维周期短时演化 | 9³/13³/17³；11/16/21 步，重放一致 | 幅值 `1e-4`，同一物理终点 `t=.02` |

演化使用二阶空间差分、经典 RK4，`dt <= .05*h/3`；在初始和每个完成步检查场和速度。
最大坐标特征速度约 `2.000052`，低于预设上限 3。
尚未逐一记录 RK 子阶段的速度上限；收据明确保留这一限制。

Hamiltonian/动量诊断由物理度规独立计算，未用演化的 Gamma 直接替代度规连接。
四个约束结果全部保留：

| 约束 | 9³→13³ 阶 | 13³→17³ 阶 | 两组均 ≥1.5 |
|---|---:|---:|---|
| Hamiltonian L2 | 1.49286 | 1.70486 | **否** |
| 动量 L2 | 1.71669 | 1.85068 | 是 |
| 共形连接 L∞ | 1.96712 | 1.98282 | 是 |
| Theta L∞ | 1.82647 | 1.90991 | 是 |

Hamiltonian L2 分别为 `1.256e-9, 7.252e-10, 4.590e-10`，都高于预声明的
`1e-13` 舍入下限，因此不能用“数值太小”免除失败。
初版收据的 `bounded_campaign_passed=true` 只涵盖预声明的局部/制造导数/短时连接与 Theta，
不涵盖全部四个约束，容易被误读。因此 v2 在保留各分项结果的同时加严总门禁：
`bounded_components_passed=true`、`all_four_constraint_convergence=false`、
`bounded_campaign_passed=false`，并非零退出。没有修改数值方法、物理参数或收敛阈值。
两版的全部局部点、对照、制造导数、演化数组摘要和约束结果逐项完全相同。
这也不是 harmonic gauge-wave 精确时间演化误差测试：初始切片之后使用的是 1+log 规范。

## 收据、复现和回归

当前收据：`E:\CodexData\nr-k3-fo-ccz4-state-dependent-gauge-v2-20261007.json`。
实验耗时约 84.19 秒；运行前后源码摘要相同，并已再次与当前源文件比对。
v1 收据保留为历史记录，不覆盖、不删除。

- v2 收据 SHA-256：`866058bfa92e7d6bad0038a3c3978f4f11c16aebaf9ec2e09470a775744eaa89`
- v2 源码集合 SHA-256：`e5fc679b96552929fbdbd1242445dd1b23f5e6c3e887f36dfc2eac814549424c`
- 历史 v1 收据 SHA-256：`a669d5c054bf9f9bb6cee7e6a442b07c38acbc6bb08fe8e8783cc0a4714a8a70`

在项目根目录执行，输出必须选新文件名：

```powershell
python scripts/run-nr-k3-fo-ccz4-state-dependent-gauge.py --output E:\CodexData\nr-k3-fo-ccz4-state-dependent-gauge-replay-20261007.json
python -m pytest science/numerical_relativity/test_fo_ccz4_gauge_profile.py science/numerical_relativity/test_fo_ccz4_rhs.py science/numerical_relativity/test_fo_ccz4_frozen_symbol.py science/numerical_relativity/test_fo_ccz4_frozen_characteristics.py -q
python -m pytest science/numerical_relativity/test_fo_ccz4_gauge_campaign.py -q
python -m pytest science/numerical_relativity -q
```

定向内核测试为 **61 passed，62.83 秒**；收据防护测试为 **10 passed，2.31 秒**。
本轮完整回归在启动时收集的测试集为 **312 passed，787.19 秒**。
收据防护文件在该回归收集之后新增，故其 10 项由单独运行验证，不冒称它们属于
同一次 312 项回归。定向 Ruff 通过；已有的 pytest_asyncio fixture loop scope
弃用警告未作无关修改。前次 294 passed 只属于旧源码记录。
早期一次测试因数组广播写法失败，已修正测试的标量广播，未调整物理阈值。

两份收据的真实覆盖写入检查均在运行前被拒绝，检查前后文件 SHA-256 不变。
最终重新核对了 v2 的全部声明源文件，仍与运行前后记录完全一致。

此前冻结主部实验的 JSON 保留不动；由于当前已加入 opt-in 分支，旧收据的源码摘要
现在只对应历史快照。旧反例并未撤回，本轮直接在当前源码上重新执行了它们。

## 下一步与停止条件

1. 对 Hamiltonian 缺口单独做预声明的加密和时间步分离实验，区分前渐近区、
   时间误差、约束传播或实现问题。不得删除粗网格、改门槛或把小残差当作收敛证明。
2. 重新推导变系数辅助/ordering 约束传播及源项；固定紧致参数域，建立可检验的
   有界特征投影或能量估计。有限 SVD 扫描不能代替这一步。
3. 通过上述门禁后才恢复真实特征/约束保持外边界，并做长时 Schwarzschild。
4. 此候选尚无磁盘 checkpoint/manifest 合同、C++ 一致性或外部物理基准。
   这些应先于 AMR、双黑洞、GPU 扩展；未验证的 `nvcc` 不被计为 CUDA 可用。

所有推广标志继续为 false：强双曲性、解析一致有界基、非线性约束传播、CPBC、
物理边界、长期稳定性、黑洞演化、跨后端、live 和 scientific payload writeback。
顶级 goal 保持 active；此结果是一个有用但未获推广资格的内核增量。

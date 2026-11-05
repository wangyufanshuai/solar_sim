# NR-K1—K4 广义相对论科研内核建模与实施报告

本报告服务于 `solar_sim/next-web` 的科研内核 shadow 线，不是生产发布说明，也不是已完成的物理验证论文。当前唯一允许的运行身份是 `candidate-only / shadow / hold`；任何本地测试、短时积分、解析 gauge-wave replay 或跨语言误差都不能单独升级为物理有效性、黑洞稳定性、CPBC、GPU 可用性或 live-runtime 资格。

## 1. 总体建模框架

本项目按四个依赖阶段组织：

1. **NR-K1：Python 参考实现。** 明确 CCZ4/BSSN 的 25 个几何/规范变量和 FO-CCZ4 的 33 个一阶辅助变量；实现周期 gauge-wave、Minkowski、Schwarzschild 初值与独立约束诊断。
2. **NR-K2：C++17/OpenMP shadow。** 共享 58 槽 canonical manifest、二进制 checkpoint/restart 和确定性线程契约；先复现 Python，再逐步接入 FO-CCZ4 RHS。
3. **NR-K3：三维科研能力。** 在 CPU 线关闭约束、稳健性和基准门禁后，接入 AMR、视界查找、ADM 质量和 `Psi4` 波形提取，并把每项诊断与演化状态绑定。
4. **NR-K4：加速后端。** 只有 CPU 结果冻结、跨后端一致性和可复现实验闭合后，才评估 AMReX/CUDA；当前机器的 RTX 4060 不等于已有可验证 `nvcc`/GPU 后端。

数据流为：

```text
初值/参数合同 -> 58 槽状态 -> 空间离散与边界算子 -> RK4 方法线 ->
独立约束/守恒/稳健性诊断 -> checkpoint/manifest -> shadow 证据包
```

`next-web` 的前端展示层和 `web` 目录中的旧太阳系可视化不是同一数值 runtime；科研内核必须以 Python/C++ manifest 和稳定 API 为唯一交换边界，不能用视觉 LOD 或前端时间步替代物理步进。

## 2. 首个动力学场景与假设敏感性预检

### 模糊表述及解释

“世界前沿相对论模型”至少有三种口径：

- **动态真空时空。** 以 CCZ4/BSSN 数值相对论为核心，先做 gauge-wave/Minkowski，再做单黑洞，最后做双黑洞。
- **强场二体波形。** 直接以双黑洞轨道和 `Psi4` 为目标，需要成熟的 puncture 初值、辐射边界、视界和波形收敛套件。
- **物质耦合。** 中子星/磁流体会引入守恒律、状态方程和高阶 shock-capturing，不能与首个真空内核同时作为最小切片。

本阶段采用第一种解释，场景顺序为：

```text
Minkowski / exact gauge-wave
    -> 单 Schwarzschild（静态外部 + moving-puncture gauge seed）
    -> Brill–Lindquist 双 puncture 初值
    -> 双黑洞动力学与 Ψ4
    -> 物质耦合（另立状态/守恒变量合同）
```

### 快速验算与递进性检查

- gauge-wave 的解析解可把离散导数、RHS、checkpoint 和跨语言 parity 分开验收；它不含视界和辐射，因而不能替代黑洞验证。
- 单 Schwarzschild 可检验视界半径、ADM 质量、静态外部约束和 gauge seed；它不能证明双黑洞轨道稳定。
- 双 puncture 初值可检验总 ADM 质量、掩膜和初始约束；在零动量 Brill–Lindquist 状态上不能宣称 inspiral。
- FO-CCZ4 的主符号/约束地图必须与 58 槽顺序一致；只复制二阶 BSSN RHS 会丢掉 ordering constraints 和强双曲性所需的项。

### 最终采用的解释

首个可运行动力学目标是**周期 gauge-wave 的真空 FO-CCZ4 shadow RK4**，随后按单黑洞、双黑洞推进。所有外边界在 CPBC 真正实现前只能使用 periodic 或明确标记为 proxy 的边界。

## 3. 状态、符号与单位

采用几何单位 (G=c=1)，笛卡尔坐标 (x^i)，空间度规分解为

\[
\gamma_{ij}=\chi^{-1}h_{ij},\qquad \det h=1,
\]

并使用

\[
K=\gamma^{ij}K_{ij},\quad A_{ij}=\chi\left(K_{ij}-\tfrac13\gamma_{ij}K\right),\quad
\phi=\sqrt{\chi}.
\]

25 个基础槽为

\[
(h_{ij}^{\rm sym},\ln\alpha,\beta^i,\ln\phi,A_{ij}^{\rm sym},K,\Theta,\hat\Gamma^i,b^i),
\]

其中日志变量保证中间 RK4 阶段的 lapse 和 (phi) 为正。FO-CCZ4 追加 33 个 PDE 辅助槽：

\[
A_i=\partial_i\ln\alpha,\quad B_k{}^i=\partial_k\beta^i,
\quad D_{kij}=\tfrac12\partial_k h_{ij},\quad P_i=\partial_i\ln\phi=\tfrac12\partial_i\ln\chi.
\]

因此 canonical split 是 11 个 ODE 槽、47 个 PDE 槽、总计 58 槽。所有 checkpoint 必须记录变量名称、维度、场景、formulation、solver mode、(dt)、时间、源参数和 manifest schema。

## 4. NR-K1 参考模型

### 4.1 规范条件

采用 advective 1+log 与 Gamma-driver：

\[
(\partial_t-\beta^j\partial_j)\ln\alpha=-2(K-K_0-2c\Theta),
\]

\[
(\partial_t-\beta^j\partial_j)\beta^i=f_B b^i,\qquad
(\partial_t-\beta^j\partial_j)b^i=\hat\Gamma^{i}_{\rm nonadv}-\eta b^i.
\]

FO shadow 使用 (f_B=1,\eta=0,c=1) 以避免主符号审计中的 (f=3/4) 退化；现有 legacy 参考 API 的 (f=3/4) 保留，不得静默改写。

### 4.2 边界与约束

当前严格可用的是 fully-valid periodic 网格。Sommerfeld 和 characteristic penalty 仅为显式 proxy，不能标记为 CPBC。必须独立记录：

- 代数约束：(det h-1)、(h^{ij}A_{ij})、(h^{ij}D_{kij}-0)。
- FO ordering constraints：(partial_{[i}A_{j]})、(partial_{[i}P_{j]})、(partial_{[i}B_{j]}{}^k)、(partial_{[i}D_{j]kl})。
- 微分约束：Hamiltonian、momentum、(hat\Gamma^i-	ilde\Gamma^i) 及 Z4 变量。
- 数值指标：(L_1,L_2,L_\infty)、收敛阶、非有限值、det/trace 漂移、线程/重启 hash。

### 4.3 RHS 与积分

`fo_ccz4_rhs.py` 是独立 Python 参考：几何项由一阶 (D,P) 重建 Christoffel、Ricci 和 Z4 修正；(A/B/D/P) 方程保留 ordering terms 与 cleaning 参数；时间推进为确定性 classical RK4。它的状态转换以日志变量进行，不能把 `chi` 直接线性相加当作等价实现。

## 5. NR-K2 跨后端方案

### 5.1 C++ 设计

`nr_k2_fo_ccz4_shadow.cpp` 提供两个互斥模式：

- `analytic-contract`：只构造解析 gauge-wave 和辅助场，证明 58 槽顺序、checkpoint、manifest、线程与重启一致性。
- `fo-rhs-shadow`：执行与 Python 同一 58 槽 FO-CCZ4 RHS 的 periodic RK4 shadow；manifest 仍保持 `status=shadow`、`dynamic_evolution_validated=false`。

checkpoint 采用固定 little-endian binary64，头部含 `NRK2FO01`、版本、三维尺寸、scenario/formulation/solver mode、变量数、(dt,t,A,\lambda,step)。恢复时必须拒绝场景、formulation、solver mode 或波参数不匹配。

### 5.2 当前证据

- analytic-contract：跨 Python 最大绝对误差约 (3.68\times10^{-16})，1/4 OpenMP、直接/4+4 restart 均字节一致。
- fo-rhs-shadow：8 步、8³ gauge-wave 的 Python/C++ 最大绝对误差为 (5.63\times10^{-16})，在收紧后的默认容差 (1\times10^{-12}) 内通过，1/4 OpenMP 与直接/restart 均一致。另有故意违反辅助约束的非零 `P/D` curl fixture，最大误差为 (4.55\times10^{-17})，覆盖了 ordering 的导数次序与符号。该机器级 parity 结果来自 C++ GammaHat 方程的定向修正：显式补齐 conformal-connection advection，并移除重复计入的 (2 alpha \tilde\Gamma A) 项。该误差是跨语言数值 parity 门，不是物理收敛证明；receipt 为 `E:\\CodexData\\nr-k2-fo-ccz4-rhs-v9-ordering-fixture-20261003.json`。
- FO Python RHS 现在提供显式 `boundary_mode="sommerfeld-proxy"` 的非周期路径，对 25 个几何/规范槽和 33 个辅助槽执行统一标量径向 proxy；Minkowski Sommerfeld 短步测试保持有限且 lapse/chi 为正。这只关闭了边界工程路径缺口，不是 characteristic Einstein boundary，CPBC、物理外边界和 live 仍为 false。
- 新增 `run-nr-k1-fo-ccz4-gauge-wave-evolution.py`：9/13/17 周期网格、CFL `0.02`、两步 RK4 的二阶 FO-CCZ4 method-of-lines campaign；所有末态保持有限且 `chi/lapse/det(h)>0`，确定性 replay 通过，conformal-connection constraint 观测阶为 `1.96,1.98`，Theta 约束观测阶为 `2.83,2.91`。同一脚本切到四阶周期 stencil，在 9/13/17/21 网格得到 conformal-connection `3.92,3.96,3.97`、Theta `4.88,4.94,4.96`。Hamiltonian/momentum 单独记录并允许舍入主导。该 receipt 只证明真空 gauge-wave 的短程约束/收敛门，不证明精确时空演化、物理外边界或黑洞稳定性：`E:\\CodexData\\nr-k1-fo-ccz4-gauge-wave-evolution-v2-order2-20261005.json`、`E:\\CodexData\\nr-k1-fo-ccz4-gauge-wave-evolution-v2-order4-20261005.json`。
- 收敛证据更正：上述 v2 固定步数运行的不同分辨率对应不同物理终止时刻，保留为历史工程记录；v3 脚本改为按 CFL 上限自动选步数并对齐 `t=0.01`。同一物理时刻的二阶 conformal-connection/Theta 观测阶为 `1.9659,1.9821` 与 `1.8260,1.9097`；四阶为 `3.9178,3.9569,3.9735` 与 `3.8804,3.9412,3.9648`。v3 receipts 为 `E:\\CodexData\\nr-k1-fo-ccz4-gauge-wave-evolution-v3-same-time-order2-20261005.json`、`E:\\CodexData\\nr-k1-fo-ccz4-gauge-wave-evolution-v3-same-time-order4-20261005.json`，仍只证明短程周期 gauge-wave 收敛门。
- 新增 `fo_ccz4_robust_stability_campaign_3d` 与 `run-nr-k1-fo-ccz4-robust-stability.py`：9^3 周期 Minkowski、小噪声幅度 `1e-6`、固定 seeds `0/1/2`、checkpoint `1/3/6/10`，记录有限/正定状态、Hamiltonian/momentum/连接/Theta 约束、FO ordering curl、扰动增长和辅助场 hash；v2 还显式要求每个 checkpoint 的约束范数有限。三种子均通过增长上限 `10`，最大观测增长约 `1.87`，首种子 replay 完全一致；receipt 为 `E:\\CodexData\\nr-k1-fo-ccz4-robust-stability-v2-20261005.json`。这只是有界工程鲁棒性门，不是长时间稳定性、强双曲性、物理边界或黑洞精度证明。
- 新增 `fo_ccz4_analytic_contract.py` 与 `run-nr-k1-fo-ccz4-ode-block.py`：对平直、零 shift 背景的 11 槽 ODE 前缀 `(h_ij, ln_alpha, beta^i, ln_phi)` 建立显式零速单位基合同，并用独立 58×58 shadow symbol 在 x/y/z 三个法向重放。三方向均为 `11/11` 秩且 replay 一致；receipt 为 `E:\\CodexData\\nr-k1-fo-ccz4-ode-block-v1-20261005.json`。该局部合同不等于剩余 47 槽解析特征向量、连续 symmetrizer、强双曲性或 CPBC 证明，推广门继续关闭。
- 新增 `fo_ccz4_analytic_symbol.py` 与 `run-nr-k1-fo-ccz4-analytic-symbol.py`：独立按平直背景线性化方程的张量收缩直接装配 58×58 主符号，再与有限差分 Fourier shadow 在 x/y/z 三个法向交叉核对。三方向确定性 replay 通过，最大绝对差约 `1.00×10^-15`；该构造不复用 Fourier 矩阵装配，覆盖变量顺序、对称化度规/连接导数、Ricci/Z4、规范项和 `A/B/D/P` 辅助项的实现级一致性。receipt 为 `E:\\CodexData\\nr-k1-fo-ccz4-analytic-symbol-v1-20261005.json`。这是线性化实现交叉核对，不是 58 槽解析 eigenvectors、连续 symmetrizer、强双曲性、CPBC 或物理黑洞演化证明，promotion 继续 blocked。
- 新增 `fo_ccz4_characteristic_contract.py` 与 `run-nr-k1-fo-ccz4-characteristic-contract.py`：在同一非退化平直点 (`f=1, mu=1, e=c=1`) 记录直接 58×58 主矩阵的 exact-rational 特征多项式因子 `λ^26(λ−1)^8(λ+1)^8(2λ−1)^4(2λ+1)^4(λ²−2)(2λ²−1)^2(3λ²−4)/3072`。x/y/z 三方向系数重放通过，数值多项式求值误差约 `7.6×10^-12`，根速度误差约 `2.5×10^-15`；receipt 为 `E:\\CodexData\\nr-k1-fo-ccz4-characteristic-contract-v1-20261005.json`。该 exact factorization 只闭合特征值与代数重数合同，不等于解析 eigenvectors、symmetrizer、强双曲性、CPBC 或物理演化证明。
- 新增可选审计 `run-nr-k1-fo-ccz4-exact-eigenbasis.py`：不把 SymPy 引入 runtime，而是记录直接浮点主矩阵到有理矩阵的重建残差 `1.11×10^-16`，随后在该单一冻结点逐根精确计算 eigenspace。x/y/z 三方向均满足代数重数=几何重数，合并 eigenbasis 精确秩为 `58/58`；receipt 为 `E:\\CodexData\\nr-k1-fo-ccz4-exact-eigenbasis-v1-20261005.json`。这把单点的 frozen-coefficient diagonalizability 提升为可复核证据，但不等于参数域解析特征向量、连续 symmetrizer/energy estimate、非线性 CPBC、物理边界或黑洞演化验证，相关 promotion flags 仍为 false。
- 新增 `run-nr-k1-fo-ccz4-exact-eigenbasis-sweep.py`：对四个非退化有理参数点（含 `f=1,mu=1/2`、`f=5/4` 和 `g=5/4`）以及三个已知退化负对照（`mu=2`、`f=3/2`、legacy `f=3/4`）在 x/y/z 法向逐根精确检查。所有参数的特征多项式因子均匹配；四个正样本均为 `58/58` 完整 eigenbasis，三个负对照均按预期出现几何重数亏损；receipt 为 `E:\\CodexData\\nr-k1-fo-ccz4-exact-eigenbasis-sweep-v1-20261005.json`。这是有限参数样本与退化防回归门，不是全参数域解析强双曲性、连续 symmetrizer、CPBC 或物理演化证明。
- `validate_fo_ccz4_cpp_manifest` 已接入 K2 合同验证：独立检查 C++ manifest 的 58 槽顺序、11/47 分块、固定 gauge/FO 参数、周期网格、checkpoint flags 和 checksum 形状，并对参数或 solver-mode 漂移 fail-closed。该验证不替代当前机器上的 C++ 编译/运行收据，也不提升物理 promotion 状态。
- 新增 `run-nr-k2-toolchain-audit.py` 并生成 `E:\\CodexData\\nr-k2-toolchain-audit-v1-20261005.json`：当前 `g++` 路径可发现但 C++17/OpenMP sentinel 编译均失败，`cl`、`clang++`、`nvcc` 缺失。因此 2026-10-03 的 C++ parity receipt 只能作为历史构建证据，当前 checkout 不声称有新编译的 K2 可执行文件或 K4 CUDA backend。
- `run-nr-k1-fo-ccz4-schwarzschild-proxy.py` 已在 fully-valid 各向同性 Schwarzschild exterior block 上跑通 2 步 RK4：状态有限、lapse/chi 正、`min(det(h))` 约为 1。该 receipt 只证明短程边界/度规工程处理，不证明物理 Schwarzschild 演化或 characteristic boundary：`E:\\CodexData\\nr-k1-fo-ccz4-schwarzschild-proxy-v1-20261003.json`。
- 独立 metric-constraint campaign：8/16/24³、2 步后状态全有限且 `det(h)>0`；连接约束约二阶下降，动量约从一阶向二阶改善，Hamiltonian 已处于舍入主导区，因此不把后者伪装成正收敛阶。
- 新增 3-D Schwarzschild exterior CCZ4 shadow：17/25/33³ fully-valid 外部块、2 步 RK4，状态有限且度规行列式为正；由于外边界仍是 scalar Sommerfeld proxy，连接/Theta 残差不进入物理收敛门，promotion 继续 blocked。
- 当前 promotion 仍为 `blocked-pending-fo-ccz4-cpp-cross-backend-and-cpbc`；CPBC、强场物理和 live writeback 均为 false。
- 新增 `run-nr-k3-fo-ccz4-boundary-audit.py`：先前审计发现完整耦合 58x58 符号有缺陷 `3`，追踪后确认是 cosine 正 Fourier 模态与 constant 模态的 plus/minus 差分归一化不相同；主符号现使用 `wave_symbol - 0.5*zero_order_symbol`，并按 FO-CCZ4 Eq. (12k) 保持 `B_k{}^i` RHS 的 `curl_P-curl_D` 符号。重跑后 8/10/12 点分块与完整符号均为 58/58 秩、零速代数重数/零空间维数均为 26，传播速度、约束入/出模态平衡和确定性重放通过，最细网格仍为 16 个 incoming 与 16 个 outgoing 约束响应模态。该修复不等于强双曲性或 CPBC 证明：receipt 仍保持 `cpbc_ready=false`，脚本按未具备物理边界前的 fail-closed 约定退出 `2`，连续/物理边界特定的 eigenbasis、symmetrizer/energy estimate、incoming-data map 和物理边界证明均未完成；`f=3/4` 负对照另外因约 `4.8e8` 条件数失败。正/负 receipt 分别为 `E:\\CodexData\\nr-k3-fo-ccz4-boundary-audit-v15-isotropy-20261003.json` 和 `E:\\CodexData\\nr-k3-fo-ccz4-principal-symbol-v8-f0p75-source-sign-20261003.json`。
- 新增 `published_fo_ccz4_speed_family_contract`：把论文 Appendix-A 的 58 模式拆成 11 个 ODE 运动学零速模、15 个约化系统平流模，以及完整的 light-cleaning、1+log、Gamma-driver longitudinal/transverse、ordering longitudinal/transverse 有符号分支和重数；同时将平直背景的 Gamma-driver `f != 3/4` 简并条件写入报告。该契约是可审计的特征速度/重数层，不是解析特征向量或强双曲性证明；最新主符号 receipt 为 `E:\\CodexData\\nr-k3-fo-ccz4-principal-symbol-v15-isotropy-20261003.json`。
- 新增 `run-nr-k3-fo-ccz4-isotropy.py`：对 x/y/z 三个 Cartesian Fourier normal 重跑冻结系数 58x58 审计；三方向均通过 58 秩、16/16 入出模态、26 零速模和命名速度族合同，确定性 replay 也通过。该结果只支持当前离散实现的 Cartesian isotropy contract，不替代解析全法向 eigenvectors、连续 symmetrizer 或 CPBC；receipt 为 `E:\\CodexData\\nr-k3-fo-ccz4-isotropy-v1-20261003.json`。
- 新增 `run-nr-k3-fo-ccz4-cpbc-audit.py`：直接消费同一 58x58 raw symbol 和特征基，避免第二套有限差分装配。8/10/12 点均重建出完整 58 维数值特征基；最细点特征基条件数约 `2.29e2`，数值 symmetrizer 条件数约 `5.24e4`，能量恒等式残差约 `6.32e-15`，左右两侧 incoming constraint map 均为秩 16、拟逆残差低于 `1.1e-14`；receipt 同时携带命名速度族、速度误差和 `f != 3/4` 参数域标记。这是有限维数值 algebraic prerequisite，不是连续 symmetrizer、非线性 CPBC 或物理边界证明；`analytic_symmetrizer_validated=false`、`incoming_constraint_map_validated=false`、`cpbc_ready=false`，receipt 为 `E:\\CodexData\\nr-k3-fo-ccz4-cpbc-audit-v5-isotropy-20261003.json`。
- 新增 `run-nr-k3-fo-ccz4-cpbc-sweep.py`：在 8 点上固定三组预期通过参数（`f=1,mu=0.5`、`f=1,mu=1`、`f=1.25,mu=1`）和三组预期负对照（`mu=2`、`f=1.5`、legacy `f=0.75`）。分类合同通过；负对照特征基条件数约 `3.6e8/3.9e8/2.2e8`，说明当前 shadow 只在受限调参域内数值良态，不能把默认点推广为一般强双曲性。receipt 为 `E:\\CodexData\\nr-k3-fo-ccz4-cpbc-sweep-v5-isotropy-20261003.json`，CPBC 和 live 仍为 false。
- 同一审计还锁定 FO-CCZ4 论文要求的 11 槽 ODE/PDE 分块：归一化后的主符号前 11 行、前 11 列残差均低于 `1e-10`；这只是结构一致性门，不替代完整解析特征结构或 CPBC。
- 当前完整特征基的数值条件数在最细点约 `2.29e2`，逆基残差低于 `1e-14`，全模式计数为 16 incoming、16 outgoing、26 zero-speed；这些是冻结系数特征分解审计，不是非线性 CPBC 或 symmetrizer 证明。
- 2026-10-03 对照 FO-CCZ4 原论文 Eq. (12k) 后，已将 Python/C++ 的 `B_k{}^i` ordering RHS 统一为 `alpha^2*mu*(curl_P-curl_D)`，并加入纯 `P_1` 符号回归；8 步 C++/Python parity 仍为 `5.63e-16`，另有非零 `P/D` curl fixture 为 `4.55e-17`，checkpoint、线程和重启 hash 仍一致。随后修正冻结 Fourier 抽取的 plus/minus 归一化（波模差分已包含 cosine 的 `1/2` 抵消，constant 差分需除以 `2`），8/10/12 点完整矩阵回到纯虚特征谱，完整 Appendix-A 速度 multiset、16/16/26 模态计数通过，最细特征基条件数约 `2.29e2`。这些是离散冻结系数审计，不是 symmetrizer、CPBC 或物理演化证明；promotion 继续 `false`。

### 5.3 K2 关闭条件

1. 固定 RHS 参考版本、参数表和 source digest。
2. 在 8/16/32 等分辨率上对独立 constraint norms 做 refinement，而不是只比较状态字节。
3. 用 Minkowski、gauge-wave、Schwarzschild exterior 三类初值做 finite/robustness replay。
4. 加入长时间 CPU shadow、NaN/metric-positive-definite fail-closed 和可恢复 checkpoint。
5. 在 CPBC/视界/物理 benchmark 未闭合前，不切换 live。

## 6. NR-K3 计划

### 6.1 单黑洞

先以 isotropic Schwarzschild exterior 与明确 excision/guard mask 验证：

\[
r_H=M/2,\qquad M_{\rm ADM}\to M,\qquad \Psi_4\to0
\]

并分别报告静态 lapse 与 moving-puncture seed。最近邻 ghost fill、scalar Sommerfeld 和 proxy characteristic penalty 只能作为工程 shadow，不能充当物理内边界。

### 6.2 双黑洞与视界

从零动量 Brill–Lindquist 初值开始，先完成约束和 ADM 质量，再引入有动量 puncture 数据。视界查找至少应同时报告 expansion residual、角向不均匀度、掩膜相交和网格收敛；找到坐标球根不等于完成 apparent-horizon 物理验证。

### 6.3 AMR、ADM、Psi4

AMR 必须包含 ghost exchange、prolongation、restriction、refluxing、时间子循环和 regrid provenance；当前 transfer/subcycling contract 中 `reflux_applied=false`，不能升级。ADM 质量要从多半径外壳外推，不能只用单一有限半径。`Psi4` 要逐步关闭 tetrad、角向投影、(1/r) 外推、retarded time 和 CCE 差异。

## 7. NR-K4 加速路线

CPU 门禁关闭前不接 AMReX/CUDA。未来后端必须共享：

- 同一 58 槽 SoA/AoS layout、manifest 和 checkpoint schema；
- 同一有限差分 stencil、RK stage 顺序和约束诊断；
- GPU/CPU 数值误差预算、线程/块配置、设备信息和 source digest；
- 无 `nvcc` 验证时明确写 `gpu_backend_available=false`，不能由 RTX 型号推断可用。

## 8. 风险、P0 与代码任务清单

科研运行接入前的 P0 状态：

1. **已修正并有定向测试**：自适应 DP 超限现在报告真实
   `rk4-fallback`、`fallbackReason` 和拒绝步数，不再伪装成 `dp`；见
   `app/lib/solarSystemPhysics.ts`、`app/lib/solarSystemPhysicsMetrics.test.ts`。
2. **已修正并有 worker 合同测试**：主线程按 LOD 选择的银河势 regime
   通过 `PhysicsRuntime.integrateOneFrame(..., galacticMode)` 序列化到 worker，
   worker 在每步显式应用同一 regime；见
   `app/components/SolarSystemIntegrator.tsx`、`app/workers/physics.worker.ts`、
   `app/lib/physicsRuntime.test.ts`。
3. 根 manifest、权利、人类视觉、真实移动设备和长跑证据仍保持 pending；
   这些发布门禁不能由新增代码行替代。

| 任务 | 输入 | 输出 | 方法 | 校验 |
| --- | --- | --- | --- | --- |
| K1-FO 几何 | 58 槽 Python state | Ricci/Z4/RHS | 一阶辅助场 + RK4 | 独立 constraints、gauge-wave |
| K2-C++ envelope | Python state/manifest | binary checkpoint | C++17/OpenMP | byte parity、restart、线程 |
| K2-C++ RHS | FO state + (dt) | shadow RK4 state | fixed (f_B=1) | Python cross-backend、resolution |
| K3 单黑洞 | Schwarzschild/puncture | horizon/ADM/constraints | masked shadow then physical boundary | (r_H,M,\Psi_4) convergence |
| K3 双黑洞 | moving puncture data | trajectory/(\Psi_4) | AMR + horizon + extraction | independent baseline、长跑 |
| K4 GPU | CPU-frozen contract | AMReX/CUDA backend | same stencil/layout | CPU/GPU parity、device receipt |

## 9. 当前决策

当前最优先不是继续堆叠前端或视觉代码，而是把 `fo-rhs-shadow` 的误差预算、约束收敛和 CPBC 设计做成可复查的科研证据。任何一次 promotion 之前必须同时满足：

```text
58-slot contract
  ∧ deterministic checkpoint/restart
  ∧ independent constraint convergence
  ∧ robustness/long-run evidence
  ∧ formulation-specific CPBC
  ∧ physical single-/binary-hole benchmarks
  ∧ manifest/root identity parity
  ∧ human/release gates
```

其中任一项缺失，状态都应继续保持 shadow/hold。

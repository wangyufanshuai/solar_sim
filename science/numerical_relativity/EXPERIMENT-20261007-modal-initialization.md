# T=.75 异常：线性模态与初始连接一致性

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: implement and validate
- Origin Date: 2026-10-07
- Verification Status: completed; bounded causal-diagnosis gates passed; nonlinear/live promotion withheld
- Version Label: modal_initialization_v1
- Scope: flat-background analysis and opt-in initial-data controls; shadow only

## 已知问题与本轮假设

上一轮 T=.75 的 13→17 Hamiltonian 非单调下降和 mode 1 符号变化已经被观察到。
本轮对旧数据的模态解释属于追溯分析，不宣称是盲测。
当前 gauge-wave 将 GammaHat 初始化为连续解析连接，A/B/D/P 却由二阶中心差分构造。
故 GammaHat 与 D 构造的连接在有限网格上存在初始 Z 约束差异。
假设：这一差异激发的线性约束模态，经离散波速演化后，足以解释主要谐波的符号与非单调性。
这不表示连续初值错误，也不预设修改演化方程。

## 执行前固定的对照与阈值

1. 不从旧结果拟合系数。独立组装 Minkowski 上完整 58×58 线性源矩阵 B，
   与已有直接解析主矩阵 A 组成 L=B+i*k_fd*A，k_fd=N*sin(2*pi/N)。
   保留 kappa1=.1 的 K/Theta/Gamma/b 阻尼及 11 ODE 源项，不能只传播主部。
2. 源矩阵和完整离散 Fourier 算子逐列对照非线性 Python RHS 的中心微扰，
   58 槽最大绝对误差 <=1e-7。数值抽取只验证独立组装，不用于生成 B。
3. 对旧 wave 9/13/17³、T=.25/.5/.75/1 的 12 个 checkpoint，
   用解析的一阶初始 Fourier 系数及 RK4 放大矩阵预测 mode 1。
   全 58 槽 mode 1 相对 L2 误差 <=.1%；独立 Fourier H 的 mode 1 相对误差 <=1%。
   绝对值 <=1e-12 时不给相对误差通过判定。所有原网格和时刻必须保留。
4. 同时计算矩阵指数的半离散演化，区分时间积分误差；不能用它认证非线性强场。
   连续 k 与一致辅助初值的线性控制应保持 H 模态 <=1e-12。
   离散 k_fd 下，只令初始 Gamma 与 D 一致的线性控制也应保持 H <=1e-12。
5. 新的原生非线性对照，均保留原 C++ 0.2.0、dt=1/256、T=.75、4线程：
   (a) 13³ 原初始化，振幅降到 5e-5、2.5e-5；mode 1 的 H/振幅相对原值变化 <=1%。
   (b) 9/13/17³ 原振幅1e-4，只在 step=0 令 GammaHat=h^ij Gamma^k_ij(D)。
   其余 55 个槽必须逐字节不变。预测各网格末态 H 的 mode 1 至少降低100倍；
   完整非线性 H/M/curl/代数/定义约束仍报告，不预设它们全部消失。
6. 这个新初始化函数只允许 step=0/time=0，不得用于投影运行中状态。
   不修改既有初始化默认值，不重建每步辅助场，不覆盖历史 checkpoint。
7. 实验源码/旧收据/输入与新输出/binary 全部绑定 SHA-256；新目录、总超时1800秒、
   子进程180秒，每64步输出，预留磁盘1GiB，输出预算128MiB。
   失败保留，不改阈值挑网格，不自动重跑。

## 来源与边界

Exa 定向检索 5 条候选后核对
[FO-CCZ4 式12a–i](https://arxiv.org/html/1707.09910v3) 的 ODE 源项及阻尼。
GitHub 核对 [GRChombo CCZ4RHS](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/CCZ4/CCZ4RHS.impl.hpp)
和 [GammaCalculator](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/CCZ4/GammaCalculator.hpp)：
后者由度规的数值导数计算连接。只核对公式/策略，没有执行或移植 GRChombo。
矩阵指数采用已安装 SciPy 1.17.1 的 expm；
[官方 API](https://docs.scipy.org/doc/scipy/reference/generated/scipy.linalg.expm.html)
说明其使用 Padé 算法。这是浮点矩阵指数，不是严格区间证明。

此处 Minkowski 线性化仍不是本候选规范的全状态双曲性证明；新初始化控制也不是
一般 Einstein 初值约束求解器。CPBC、非周期边界、黑洞/AMR/波形/GPU/live 等门禁仍开放。
若假设得到支持，再决定后续初始化接口和空间精度改进，不能把定位原因等同于完整修复。

## 结果

实验在 2026-10-07 完成，耗时 355.01 秒；12 个旧 checkpoint 的无拟合预测、
6 个线性一致性控制和 5 个新原生非线性控制全部通过预先冻结的门禁。
没有根据结果修改阈值、剔除网格或重跑。这里只支持“小振幅周期平面波的主导误差诊断”。

- 全 58 槽 mode 1 的最大相对 L2 预测误差为 `4.27524e-8`。
- Fourier Hamiltonian 主模态的最大相对误差为 `4.67353e-5`，即 **0.004674%**。
  这包括 T=.75 时 9/13/17 网格的负/正/正符号变化。
- 连续一致初值和离散 Gamma 一致初值的线性控制，最大 H 模态为 `9.34394e-18`。
- 原初始化的 13³ 振幅降为 5e-5、2.5e-5 后，H 主模态/振幅分别变化
  0.003507%、0.004390%，低于预设 1% 上限。
- 三个 Gamma 初值控制的其余 55 槽逐值及其 binary64 表示保持不变；
  原输入未被修改，演化过程中未重建辅助场或重新投影连接。

以下均为 A=1e-4、T=.75、相同 C++ 0.2.0 的新初值对照。
“降低倍数”仅指 **Hamiltonian mode 1 的幅值**，不是完整约束的降低倍数。

| 网格 | H 主模态降低倍数 | 完整 H L2（度规差分） | 完整 H L2（独立 Fourier） | M L2 |
| --- | ---: | ---: | ---: | ---: |
| 9³ | 80,456 | 2.14108e-8 | 4.30399e-8 | 2.08020e-8 |
| 13³ | 22,007 | 3.55248e-8 | 4.90097e-8 | 9.12390e-9 |
| 17³ | 74,255 | 2.76142e-8 | 3.32450e-8 | 4.38897e-9 |

**仍保留负结果：完整 H 残差在 9→13 网格并非单调减小。** 新末态主要剩余
mode 2，而主模态已经大幅降低；本轮没有验证这些剩余项的振幅阶、空间渐近阶
或整个时间窗的收敛性。新初值也不能因此进入默认路径或成为一般约束求解器。
采样点保持有限正定，三组最大采样 CFL 分别为 .210956/.304714/.398472；
这不是对每个 RK 中间 stage 的 CFL 监控或稳定性证明。

### 解释性附注：为什么初始连接差异会影响 H

下面是同一平面、Minkowski 线性化的代数约化，不是新的强场验证门禁。
令 k=2π、κ=N sin(2π/N)，并在一阶定义约束和无迹约束成立的线性子空间中取
H_d=κ²(h_yy+h_zz−4 lnφ)、M_d=iκ(A_xx−2K/3)、
Z_x=(GammaHat_x−iκ h_xx)/2。则 κ1=.1、κ2=0 时有

    dH_d/dt = −2 iκ M_d
    dM_d/dt = −iκ H_d/2 + 2 κ1 iκ Θ
    dΘ/dt   = H_d/2 + iκ Z_x − 2 κ1 Θ
    dZ_x/dt = M_d + iκ Θ − κ1 Z_x

原解析 Gamma 配合离散辅助场给出初始 Z_x=−A(k−κ)/6，而 H_d/M_d/Θ
的一阶初值为零。这个 O(A h²) 的连接差异经过约束传播、阻尼耦合和离散相位演化，
可以产生后续 H；其 Fourier 诊断为 H_F=(k/κ)² H_d。
因此不能通过关闭约束阻尼来冒充修复：那会改变系统，并且不消除原始 Z 差异。
Gamma 一致控制恰好去掉这个初始线性来源，但不保证非线性离散乘积/链式法则精确。

另须区分两个有限网格的连接诊断：本控制由独立 D 与 h 的收缩构造连接，
现有 `constraints3d.py` 则使用逆度规的数值散度作为目标。它们在连续极限和此处
线性化中一致，在有限振幅/网格上不逐位相同，所以后者的残差不会被这个控制强制清零。
两类量不得混用来声称所有连接/定义/代数约束均已满足。

### 可复验记录

- 收据：[receipt.json](E:/CodexData/nr-k3-modal-initialization-v1-20261007/receipt.json)
- 收据 SHA-256：`1ff1383ba935ce15b368c19eb5615dd3cbd068478743ccb0fddda8abf07b4774`
- 运行前协议保存在同目录 `protocol.frozen.md`，SHA-256 为
  `636eb04310c3f090e7fd0cdc6f1ddb055faa6959dbda85008a33bd100311fde0`。
  本文件是在完成后追加结果的说明，不再冒充运行前原件。
- 116 个数值源码/驱动文件、二进制、基线收据的运行前后身份一致；
  73 个输出 artifact 的哈希重新核对无差异。旧基线的源码和全部 artifact 也未变。
  含收据共 74 个文件、23,160,803 bytes；无覆盖、删除或源码默认值切换。
- 二进制 SHA-256：`818b4421ad27b4e40135a75d863b2f0d8c7119eddc3700bfb3cb9b33c30962ef`。
- 22 个新增线性/初值测试和 19 个已有周期实验测试一起复验：**41 passed in 12.15 s**。
  Ruff 定向检查通过；这不是整个科研目录的全量测试结果。

复现时必须选择全新的输出目录；历史基线与源码哈希仍需匹配：

    python scripts/run-nr-k3-fo-ccz4-modal-initialization.py --baseline E:/CodexData/nr-k3-native-periodic-window-v1-20261007/receipt.json --output-directory <fresh-output-directory>
    python -m pytest science/numerical_relativity/test_fo_ccz4_linear_modes.py science/numerical_relativity/test_fo_ccz4_periodic_window.py -q

### 下一道门禁

先单独预注册 Gamma 一致初值下的振幅缩放与更细空间分辨率实验，区分剩余 mode 2
的非线性截断项、定义约束漂移和相位抵消。收敛评价应保留中间时刻并包含时间窗量，
不能只挑一个末态。完成之前保持初始化 opt-in、完整 H 收敛未验证。
随后仍需长时/独立后端/物理边界/黑洞等原有门禁；AMR、波形、GPU 和 live 未获准。

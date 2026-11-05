# 原生 FO-CCZ4：T=1 周期约束与三维随机扰动

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: implement and run
- Origin Date: 2026-10-07
- Verification Status: LOCAL_VERIFIED — predeclared bounded screening passed; intermediate-time anomaly remains open
- Version Label: native_periodic_window_v1
- Scope: CPU, periodic unit cubes, shadow only; no art/live changes

## 执行前冻结的协议

现有 C++ 0.2.0 与上一轮 v2 收据的 C++ 源码和 exe SHA-256 已重新核对。
单独容量探针 34³、8 步、4 线程花费 44.87 秒，只用于工作量估计，
输出保留在 `E:\CodexData\nr-k3-periodic-capacity-20261007`；不是稳定性验收。
不修改 RHS、规范系数或耗散参数。本轮固定候选 `f=3 alpha chi, mu=.2 chi`，
二阶中心空间差分、RK4、kappa1=.1，其余参数与 C++ manifest 一致。

1. 全立方体 9³ / 13³ / 17³；固定 dt=1/256、T=1、256 步、4 线程。
   每 64 步保存完整 58 槽 checkpoint、manifest 和诊断；初值另存。
2. 平滑轴向 gauge-wave 初始振幅 1e-4、波长 1。初始切片满足连续真空约束，
   但演化规范是 1+log，不与调和规范解析轨迹比较。
3. 真正三维的 off-constraint 随机扰动：从 Minkowski 出发，对所有 58 独立槽
   逐格施加 PCG64(seed=20261007) 均匀噪声，范围 +/-[1e-10*(9/N)^2]。
   不重建辅助量、不投影代数约束。它不是物理初值，也不是同一连续场的网格收敛测试。
4. 独立控制：17³ wave 将 dt 减半，仍到 T=1；5³ Minkowski 256 步应精确不变。
   noise 9³ 另做直接 256 步（4 线程）和直接 256 步（1 线程），必须与分段结果
   的 checkpoint/manifest 逐字节相同；末态再做 Python/C++ 一步对照，58 槽误差 <=2e-12。
5. 约束诊断由 Python 的物理度规/外曲率计算 H、M，不使用 C++ 演化 Gamma 替代几何。
   wave 附加严格平面对角 Fourier/闭式曲率诊断，不用于一般三维 noise，不替换主门禁。
   同时记录 Gamma、Theta、curl、代数约束及辅助量与主变量导数的偏离。
6. 预声明局部筛查阈值：所有采样点正定、有限，0<alpha<2，chi>0；
   采样坐标速度之和给出的 CFL <=.45。C++ 检查每个 RK 子阶段的有效域，
   但本轮 CFL 仅 checkpoint 采样，不宣称子阶段 CFL 或稳定性证明。
7. wave：H/M/Gamma/Theta 四项最终范数在相邻网格间的观测阶均 >=1.5，
   小于等于 1e-13 的范数不计为已验证收敛；采样最大四项范数 <=1e-3。
   17³ 减半 dt 后，H/M 场差的 L2 <=较细时间步残差 L2 的 1%，
   参考残差 <=1e-13 则该项不可验证。这个控制不证明 RK4 四阶时间精度。
8. noise：全 58 槽相对初始 Minkowski 距离的 L2 增长 <=100，H 最大范数增长 <=100；
   17³/9³ 最大状态增长比 <=2。这是单种子、有界经验筛查，不是网格一致能量估计。
9. 总硬超时 1800 秒，每次子进程 <=180 秒，保留失败/超时/未完成状态；
   输出上限 256 MiB、磁盘预留 1 GiB，不自动删除任何旧文件。
   先冻结 protocol/source/binary/prior receipt SHA-256，运行后逐一复核；新目录只写一次。
   一项数值门禁失败不改变阈值、不裁掉网格；独立预声明案例仍可继续，失败不自动重跑。

## 外部依据和适用限制

Exa 本轮检索 5 条候选，核对
[Apples with Apples 原始规范](https://ar5iv.labs.arxiv.org/html/gr-qc/0305023)：
周期边界用于隔离内部演化误差，标准 gauge-wave 使用调和切片，原始长跑目标
是 1000 crossing times。这里 T=1 只是一单位光穿越时间的本地筛查，不等同该标准。
[FO-CCZ4 原文](https://arxiv.org/html/1707.09910v3) 的标准系数双曲性结果
不能直接认证本项目的状态依赖候选。

GitHub 核对 [GRChombo NewConstraints](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/CCZ4/NewConstraints.impl.hpp)
的物理 H/M 定义；这是公式交叉核对，没有运行或移植 GRChombo，也不是独立成熟代码对照。
当前 Python 度规诊断独立于 C++ RHS，但两者仍属本项目；平面 Fourier 诊断只补充 wave。

无论本轮结果如何，strong_hyperbolicity / CPBC / physical boundaries / black-hole evolution /
AMR / CUDA / physical validation / runtime_writeback / scientificPayloadWriteback 都保持 false。
此前粗网格收敛失败、旧 C++ ODE 错误和其失败收据不被本轮覆盖。

## 结果

### 预声明验收已执行

收据：`E:\CodexData\nr-k3-native-periodic-window-v1-20261007\receipt.json`。
8 组案例完成，耗时 **985.28 秒**，无运行错误。
`completed=true`、`bounded_screening_passed=true`、`identity_unchanged=true`。
这三个状态只对应上述有限协议；所有物理推广和长期稳定性标志仍为 false。

T=1 的结果（9³ / 13³ / 17³）：

| 约束量 | 三档最终范数 | 相邻观测阶 |
| --- | --- | --- |
| H L2 | 1.21132e-5 / 6.45735e-6 / 3.86663e-6 | 1.711 / 1.912 |
| M L2 | 1.69493e-6 / 4.19714e-7 / 1.43116e-7 | 3.796 / 4.011 |
| Gamma L∞ | 2.78547e-5 / 1.49242e-5 / 8.93923e-6 | 1.697 / 1.911 |
| Theta L∞ | 6.74326e-6 / 1.66061e-6 / 5.83841e-7 | 3.811 / 3.897 |

M/Theta 在这个场景和终点的高观测阶不等于整个方法是四阶。空间算子仍是二阶。
采样四项最大范数 `3.32065e-5 < 1e-3`，采样最大 CFL 总和 `.398474692 < .45`。
有限性和正定检查通过；CFL 并非逐 RK 子阶段监测。

三维独立槽噪声的最大状态增长为 **2.7453 / 2.4645 / 2.2387**，
H L∞ 最大增长为 **1.1618 / 1.2214 / 1.2392**；细/粗状态增长比 `.81546`。
这是一个种子、三档奇数网格、T=1 的经验筛查，不能外推到偶数网格 Nyquist 模式、
任意种子、强场或无限时间的能量有界性。

17³ 的时间步控制（完整场差，非仅范数之差）：

- H L2 场差 `6.14855e-13`，相对较细时间步残差比例 `1.59016e-7`，即 `0.00001590%`。
- M L2 场差 `1.70222e-14`，比例 `1.18940e-7`，即 `0.00001189%`。
- 均通过预声明 1% 门槛；两档 dt 不足以验证时间收敛阶。

Minkowski 的全 58 槽保持精确不变。noise 9³ 的分段运行、直接 4 线程运行、
直接 1 线程运行，其 checkpoint 和 manifest 都逐字节相同。
从 noise 9³ 末态再续一步，Python/C++ 最大差异 `2.30102e-16 <= 2e-12`。
这不是不同硬件/编译器/版本之间的逐位可复现承诺。

### 必须保留的中途异常：探索性分析，不重写原门禁

终点收敛通过不代表整个窗口处处收敛。读取已保存的 T=.75 checkpoint 后发现：

| N | 主 H L2 | 独立平面 Fourier H L2 |
| --- | --- | --- |
| 9 | 1.4519581e-6 | 1.7128536e-6 |
| 13 | 1.8124296e-7 | 1.9842231e-7 |
| 17 | 3.1966288e-7 | 3.3503087e-7 |

主诊断 13→17 的观测阶为 **-2.115**。两种诊断都出现非单调性，不能将其简单
归咎于主诊断的有限差分公式。17³ 在同一 T=.75 减半 dt，主 H 场差占残差
`1.80597e-6`（`0.0001806%`），独立 Fourier 场差比例 `9.88208e-6`
（`0.0009882%`）。这个对照不支持时间步误差主导该现象。

对独立 Fourier H 的归一化变换 `fft(H)/N`，mode 1 虚部分别为
`-1.2110574e-6 / +1.3587737e-7 / +2.3572082e-7`，随网格发生符号变化。
这给出“空间色散/不同阶误差抵消”的待检验线索，**不是已证明的原因**。
原协议只对 T=1 定义收敛门槛，因此不事后改写其布尔结果；同时明确
**全时间窗口一致二阶收敛尚未验证**，不能删去这个反例后做更广泛声明。

下一轮应先冻结独立的 Fourier 模式/半离散误差分析或时间定位细化对照，
检验这个解释；随后扩大时间、网格和噪声覆盖。不要据本轮通过直接增加黑洞、
AMR、GPU 或 live 的已验证标签，也不要为让 T=.75 通过而事后选择输出时间。

### 复现、源码和保留范围

```powershell
python scripts/run-nr-k3-fo-ccz4-periodic-window.py --binary E:\CodexData\nr-k2-profile-cpp-20261007\campaign-v2\native\solver-build\Release\nr-k2-fo-ccz4-shadow.exe --binary-receipt E:\CodexData\nr-k2-profile-cpp-20261007\campaign-v2\receipt.json --output-directory E:\CodexData\nr-k3-native-periodic-window-replay
```

输出目录必须不存在；程序不重新编译或更改方程。它先核对上一轮通过的二进制、
C++ 源码和收据，再冻结本轮 Python/测试/驱动源码。所有输入和阶段输出完整保留。
运行后再次检查 **171 个已登记实验文件、113 个源码文件，差异均为零**。
包括最终收据的 172 个文件合计 `58,721,598 bytes`，低于 256 MiB 上限。

- 收据 SHA-256：`f762e1929558231a3da3efb4db226ea8570c19a4ad77b37faacbf4f5abd1765a`。
- 驱动 SHA-256：`db3479bcdf66bd3e879ef446719698cd6b1f43e3a63d76eff458678d18c97ae8`。
- 测试 SHA-256：`542a3efd865953221f50acdb9ae9ce94d6c0a5d79e77f038119e3b369b4f3edc`。
- exe SHA-256：`818b4421ad27b4e40135a75d863b2f0d8c7119eddc3700bfb3cb9b33c30962ef`。

本文件的结果章节在运行结束后追加；收据对应的执行前原文已按原字节保存在输出目录
`protocol.frozen.md`，由 `frozen-input.json` 与最终收据共同绑定，不能把本文件后来
追加的结果误认成事前协议。本轮没有改 Python/C++ RHS、编译器环境、EIH、前端或美术。

新增 **19 项**实验解释/防误报测试通过；另 **53 项** checkpoint、既有细化分离、
独立平面诊断测试通过。本轮合计 72 项定向测试，Ruff 和科研路径差异格式检查通过。
上一轮全量 385 项是历史完整运行，本轮未把它伪装为一次新的全量回归。
ARS 的事前冻结与失败保留规范促使本轮区分“终点门禁通过”和“中途异常未解决”。

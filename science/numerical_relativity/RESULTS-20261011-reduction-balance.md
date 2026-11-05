# 离约束辅助变量变化率：独立控制通过，不等于约束稳定性通过

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: continuum reduction-defect controls and saved-data audit
- Origin Date: 2026-10-11
- Verification Status: REGISTERED BALANCE CONTROLS PASSED; FULL PHYSICS ADMISSION OPEN
- Version Label: nr-reduction-balance-controls-v1

## 本轮实质进展

新增不依赖生产求解器的连续约束余额参考，直接从真实解析jet与乘积法则推导
A/B/D/P四类定义误差的33个变化率。它允许共形h的行列式、a的迹、四类辅助定义和
旋度约束同时偏离，不通过投影或重构将误差清零。

独立预期覆盖11个度规/规范率、33个辅助率及logdet/tr_h(a)两个收缩率，直接核对
冻结Python方程和Windows C++体积组件。这补充了上一批仅在辅助/代数定义一致面上的
非零Z4控制，但**未补齐另外14个槽的全分量离约束几何参考**。

72项新测试通过；上一批60项指定Python回归通过，明确排除了其4项原生测试，
不是声称重跑全部64项。所有已选测试零失败、错误、跳过。
新测试6.10秒，指定回归2.71秒，完整运行器25.218秒；42次原生调用均返回0。
1/2/4线程数值payload逐字节相同；6组另起1线程进程的完整stdout逐字节相同。
没有时间积分、SAT、checkpoint、新编译或新正式数值矩阵。

## 结果

| 对象 | 最大绝对误差 | 事前上限 |
| --- | ---: | ---: |
| Python 44个受检率分量 | 5.551115123e-17 | 2e-12 |
| Python logdet变化率 | 4.440892099e-16 | 2e-12 |
| Python几何迹变化率 | 1.110223025e-16 | 2e-12 |
| C++ 44个受检率分量 | 7.494005416e-16 | 2e-12 |
| C++重构33个定义误差变化率 | 2.688821388e-16 | 2e-12 |
| C++两个代数收缩率 | 1.998401444e-15 | 2e-12 |
| C++三轴导数与解析jet | 2.386979503e-15 | 2e-12 |

6种场分别为general-plus/minus、zero-shift、zero-driver、metric-consistent和
all-definitions。Python各用lambda=0/1/2，原生固定lambda=1。
规范58槽最多二次，SBP(4,2)所有行可精确微分至舍入误差；面、边、角和全网格分别
保留44分量误差。这不测一般光滑场的截断误差，也不证明空间或约束收敛。

## 新确认的限制：只使辅助定义一致仍不够

all-definitions制造场中，四类定义误差初始峰值全部为0，但det(h)-1峰值约0.182951、
tr_h(a)峰值约0.046079。它是故意离约束的组件控制，**不满足正式演化的准入条件**，
不能描述为真空初值或以此放宽任何阶段阈值。

lambda=1时，预测且由Python/C++核对的定义误差变化率峰值为：

| 约束家族 | 瞬时变化率峰值 |
| --- | ---: |
| A-d(lnalpha) | 0.0197900921441 |
| B-d(beta) | 0 |
| D-d(h)/2 | 0.00722743838425 |
| P-d(lnphi) | 0.00264905478799 |

基度规有限率松弛对D定义误差产生的独立驱动项峰值为0.00726925630710。
lambda=0/1差值控制验证了该项；辅助D本身并没有同步松弛。
因此“行列式/迹有阻尼项”不能推出“所有辅助误差都会衰减”。联合平直约束面上的
瞬时不变性另有0/1/2三组控制，不与这个离代数约束反例混淆。

此结果验证的是公式与实现的瞬时机制，未作长时实验，不能直接解释原N13轨迹的
误差来源，更不能由一个制造反例断言当前方法必然长期失稳。没有自动增大阻尼、
引入投影或辅助重构，也没有以对照通过为由切换live。

## 证据与身份

434项既有资格源未改，新增5项构成439项闭包；当前源码、前后哈希和保存快照全部一致。
742个清单产物加最终回执共743文件、44,714,523字节，约42.64 MiB，低于64 MiB。
原600秒/2 MiB收尾余量与C>=3 GiB、E>=4 GiB+32 MiB底线不变。
全部新产物在E盘，不生成pyc，不清理用户文件，不改变美术或legacy live。

运行后重新读取42次保存的原生输入/输出和独立预期数组，核对输入与状态逐字节一致、
44个率、33个缺陷率、两个代数率、三轴导数、线程/进程重复结果。439项当前/快照及
742项产物哈希、72与60项完整XML均重新验证，不只依据pytest退出码。

证据目录：`tmp/nr-shadow-evidence/nr-k3-reduction-balance-controls-v1-20261011`。

| 文件 | SHA256 |
| --- | --- |
| qualification-gate.json | eb6efc2b76b423bcef1911506eb786cb6dcb1dd6d31e76cdb1cf2ad9a18af631 |
| tests.xml | 89f15dca371aa07ca60cfb1b0bcd4dc2cbc95ca2eb6ea1d01f0dcee3aeb9215b |
| nonzero-z4-python-regression.xml | dc625b4f56d15e9d5b5d8ccdf67e6d1bacda94a77dafba42e12271045f8ed78d |
| reduction-observations.json | c1de3d98e1d16a3801a3d67472c0c5358d631daaf6d88a5f58bf2796e22420cd |

Ruff通过。原生exe、运行时、7个组件源和4个生成片段仍与历史资格一致；没有将旧
原生组件测试数量并入本轮。原N13 v2回执SHA仍为a7a7c8b7ebdc9447c31d4d70875e8b42f50a2a02d8b769a85457dce05e143583。

## 剩余门禁与来源

仅continuum_reduction_balances_consistent和native_reduction_balances_consistent为true。
完整58槽离约束独立验证、非线性约束稳定、离散乘积法则、时空/约束收敛、物理边界、
黑洞/AMR/视界/Psi4/GPU及live/writeback仍未由本批验收。N13原未分辨结论保留；
N9正式实验未启动，仍需此前要求的单独确认。

下一依赖是其余几何/Einstein分量的离约束核验，以及适用于真实差分的约束传播与
物理边界评估；不能把本轮连续乘积法则直接当作一般SBP离散恒等式。

公式核对依据为[Dumbser等的FO-CCZ4原作](https://ar5iv.labs.arxiv.org/html/1707.09910)，
经Exa一次5结果定向查询及原文读取。GitHub读取了
[GRChombo固定版本的trace移除实现](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/TraceARemoval.hpp)，
仅用于区分显式投影与本项目有限率松弛，没有执行或引入外部后端。
科研与测试技能使案例、遗漏项反例、预算和验收边界在执行前固定；详见
[事前协议](EXPERIMENT-20261011-reduction-balance.md)。本组确定性控制不作统计显著性推断。

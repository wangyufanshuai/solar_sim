# H 低阶误差机制复现；独立二阶 SBP 候选算子通过静态对照

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: exact rational operator analysis, analytic-geometry experiment, deterministic replay
- Origin Date: 2026-10-09
- Verification Status: STATIC MECHANISM AND CANDIDATE REPRODUCED; NO EVOLUTION OR PHYSICAL ADMISSION
- Version Label: nr-static-derivative-results-v1

## 结论与本轮实际改动

上一轮 H 空间收敛失败并不是只有一个难以解释的数值：现在已复现出当前诊断中
“先对度规求导、再对连接系数求导”的边界误差放大机制。三次多项式的精确有理数
计算给出全域加权误差的 h^(3/2) 定律；Schwarzschild 初值从 N33 到 N65 的旧 H
阶数为 1.49577，与这一低阶机制相符。

新增 [SBP42Second](sbp_second_derivative.py) 是独立的常系数、窄模板二阶导数候选，
没有接入 FO-CCZ4 的演化右端或替换旧诊断。它与现有一阶算子共用正对角范数；
边界导数 S 不等于 D1 的首行，因此不是 fully-compatible S=D1 算子。

按 [预先冻结的实验协议](EXPERIMENT-20261009-static-derivative-study.md)，
七档网格、两类解析场的 14 个静态案例全部完成；另有七档一维 exp(x) 对照和
N17/N33 的精确有理数控制。独立进程重跑的全部科学 JSON 除耗时外完全相同，
全部 612 项产物哈希复核一致。51 个相关测试文件合跑 **1599 项通过**。

科研验证技能在本轮具体落实为：先固定解析对照和判据、测试新算子与失败路径，
再运行静态矩阵和精确重放。没有改动旧实验、旧 H 定义、演化方程或验收阈值。

## 1. 可以明确证明的局部机制

在一维 [0,2] 上令 x_j=j*h、u=x^3。现有 SBP(4,2) 的第一次求导在四行边界模板
中留下 O(h^2) 误差；对该误差再次求导，会在每侧六行形成 O(h) 误差。
原始端点不是全部受影响区域。

对 N17 和 N33 用有理数精确计算，左侧六行的复合误差除以 h 为：

    (3259806/608923, 882/731, -38518/35819,
     -38/5117, 3539/25284, -11/588)

右侧是反序的相反数，内部严格为零。SBP 权重下的分量平均平方范数满足：

    RMS(error)^2 / h^3 = 20407812817325 / 1570392931464.

这给出该多项式控制的精确 1.5 阶全域范数律。它是导数算子的局部截断误差结论，
不是 Einstein 初边值问题的稳定性定理或所有数据的精确收敛阶。
独立的光滑 exp(x) 对照在 N33→65 测得 D1 复合的全域阶数 1.47070。

## 2. 与旧 H 实现对齐，而不是另换一个问题

对于 gamma_ij=f*delta_ij、f=psi^4、Kij=0，记 b_i=D1_i(f)/(2f)。
旧的一般张量 Ricci 收缩可代数化简为：

    R_old = (-4*sum(D1_i b_i) - 2*sum(b_i^2)) / f.

从原实验保存的 N9/N13/N17 初态重建该表达式，与原独立张量转写逐节点比较：
最大差为 9.22795e-14；直接解析网格版本的最大差为 9.94899e-14，均远低于
冻结的 2e-11 限值。所有三个输入数组先验证原始 SHA256。

随后将旧误差严格分成三个有符号场：解析连接系数经一次 D1 的误差、第一次求导
误差再次微分的贡献、连接系数二次项的贡献。三个场之和逐节点恢复旧误差；
没有将范数相减当作场的差，也没有删除边界数据。

Schwarzschild 静态 N65 的全域 RMS 为：

| 诊断或贡献 | RMS |
|---|---:|
| 旧 H 总误差 | 3.8231792532e-4 |
| 解析连接系数的单次求导误差 | 4.8966651098e-6 |
| 第一次求导误差再次微分的贡献 | 3.8049414269e-4 |
| 连接系数二次项误差贡献 | 4.5141601332e-7 |
| 新 D2 的共形标量曲率误差 | 1.0167650355e-5 |

这些贡献的范数不可直接相加：它们之间有交叉项。旧 H 的平方误差有超过 99.9999%
位于每轴首尾六行并集内；这是完整复合模板带的空间分布，不是反射系数。
该模板带的物理厚度随 h 缩小。N65 的旧 H 低阶项主要来自上述微分误差传播，
但这个静态结论不代表所有非线性演化误差都已解释。

## 3. 新候选算子的非零解析对照

候选采用 R_D2=-8*psi^(-5)*sum(D2_i psi)，目前仅用于共形平直的静态几何。
不能将它直接当作一般非共形三维度规的 Ricci 计算器。

两类解析场分别为 Schwarzschild 的 psi=1+1/(2r)，以及
psi=1+0.05*(sin(x)+cos(2y)+0.5*sin(3z))。后者有已知非零标量曲率，
用于避免仅在零目标上“通过”；它不是另一个真空 Einstein 演化解。
测试还包含非零二次多项式 psi 的精确曲率控制。

以下阶数统一使用冻结的 N33→65 对照；固定物理内部区域为 [1.75,2.25]^3。

| 解析场 | 旧 H 全域阶数 | 新 D2 全域阶数 | 新 D2 固定内部阶数 |
|---|---:|---:|---:|
| Schwarzschild | 1.49577 | 2.55242 | 4.00786 |
| 非零曲率控制 | 1.46678 | 2.66844 | 4.03230 |

新 D2 达到预设的全域 >=2.2、内部 >=3.5 静态比较标准；不是宣称全域四阶。
在 N9/N13，固定物理盒仍接触复合模板带，因此不把这两档称作纯四阶内部。
空区域记录为 null，低于 2e-13 测量底线的误差不计算通过阶数。

## 4. 验证、资源与精确重放

- 新算子／实验运行器：84 项测试通过，6.98 秒。
- 合并原 49 文件及新增 2 文件：1599 项通过，55.50 秒，非全项目测试总数。
- 四个新 Python 文件的 Ruff 通过；未改变已有 pytest-asyncio 配置提醒。
- 测试覆盖全行三次多项式、内部五次多项式、任意数组轴、左右 S 方向、输入不变、
  H D2=-M+B S 双线性恒等式，以及 N9/13/17/33/65 上 M 和 M-D1^T H D1 的谱检查。
  有限矩阵谱检查不等于任意网格或非线性系统稳定性证明。
- 主运行 7.5682881 秒、重放 2.3158386 秒；缓存和负载不同，不据此报告性能提升。
- 两次各 306 项产物（共 612 项）重新计算哈希；293 个源码键对应 292 个不同文件。
  全部科学 JSON 只排除根级耗时字段后完全一致，所有保存数组字节哈希相同。
- 单次目录约 37.259 MiB，低于原定 64 MiB；180 秒绝对截止未调整。
- 最新磁盘检查 C 约 11.198 GiB、E 约 10.767 GiB，仍高于 C>=3GiB、
  E>=4GiB+32MiB。共享机器的空间变化不能全归因于本轮；没有清理或安装。

## 5. 产物身份

| 产物 | SHA256 |
|---|---|
| [主实验](../../tmp/nr-shadow-evidence/nr-k3-static-derivative-v1-20261009/receipt.json) | `60a33cd2acac6f71b476d932f81b7677e2f05a40e2cb50936ba169b80084283a` |
| [独立进程重放](../../tmp/nr-shadow-evidence/nr-k3-static-derivative-replay-v1-20261009/receipt.json) | `17e56ae008fb4d003556033cabab983580d489e0377ef493ec13e7605507d0e2` |
| [84 项测试](../../tmp/nr-static-derivative-tests-v1-20261009.xml) | `4fc3272a590bd25908abc97448525e88a0abb72f4e0f56f0408ae28acb019e5f` |
| [1599 项回归](../../tmp/nr-static-derivative-regression-v1-20261009.xml) | `089f752b2ee98a59aea657dce1700e1db2b1549996832919227652fbe8a890f3` |
| [独立 D2 模块](sbp_second_derivative.py) | `563c5cdb0b2f470732d8fe335a6229174aa9af4c030dcac6970f1f39e2c587db` |

执行入口为 `scripts/run-nr-k3-static-derivative-study.py`，使用 Windows 原生
D:/python/python.exe -B，单线程 BLAS/OpenMP，E 盘 TEMP/TMP 和新的输出目录。

## 6. 外部核查与下一步开发

本轮通过 Exa 检索 5 个结果，采用出版方的
[2017 勘误原文](https://www.sciencedirect.com/science/article/pii/S0021999117307118)：
它修正的是六阶方法的 Q 系数，不是当前四阶 D2 表。
通过 GitHub 读取作者维护的
[系数实现](https://github.com/ranocha/SummationByPartsOperators.jl/blob/main/src/SBP_coefficients/MattssonNordstr%C3%B6m2004.jl)，
blob `793d768b0bb39df2339c63901a7eb300ddbbc779`，核对 order=4 的 D2、范数和边界 S；
[MIT 许可](https://github.com/ranocha/SummationByPartsOperators.jl/blob/main/LICENSE.md)
已核查，新增模块保留署名和许可文本。未运行第三方仓库代码。

下一步直接推进一般三维曲率诊断：使用度规的一／二阶导数构造 Ricci，纯二阶项
采用新 D2，混合项单独验证；必须覆盖非共形、非对角度规和已知曲率控制。
先与旧 H 并列重算保存状态，再冻结新的非线性空间／时间实验，保持旧诊断和失败记录。
一阶 FO-CCZ4 体方程不应仅为了让 H 报表变绿而被擅自改为另一套演化离散。

一般三维诊断、正时间约束收敛、边界返回和长时稳健性通过以后，才进入新 native
边界移植及含视界单黑洞阶段；AMR、ADM／视界／波形和 GPU 仍属于未完成目标。
当前结果不关闭上一轮 H>=1.5 或更早 T=1M H/Ricci 失败。
美术、旧 EIH、live dynamics 和科学 payload 未改；所有物理晋级标志仍为 false。

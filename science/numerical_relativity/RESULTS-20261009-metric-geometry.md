# 一般三维 Ricci／ADM 诊断：解析收敛和保存状态对照完成

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: analytic tensor geometry, parallel saved-state comparison, deterministic replay
- Origin Date: 2026-10-09
- Verification Status: STATIC GEOMETRY AND SAVED-STATE DIAGNOSTIC REPRODUCED; NO NEW EVOLUTION ADMISSION
- Version Label: nr-metric-geometry-results-v1

## 本轮结果

新增 [一般度规诊断模块](sbp_metric_geometry.py)，从完整物理度规和外曲率计算 Ricci 张量、
标量曲率、Hamiltonian 和动量约束，支持非对角、非共形度规，不再只适用于 psi^4 I。
新路径保持独立，没有替换原 H 或接入演化右端。

三个解析几何家族、每类 N17/25/33 的九个案例完成；全部 24 项冻结的静态收敛判据通过。
从旧非线性实验的 12 个保存状态并列重算新旧 H 后，新 H 的正时间空间阶数约为
2.41191、2.47704，旧 H 仍为 1.40250、1.44607。这是同一状态的诊断比较，不是新演化实验，
不能据此把旧失败回执改成绿色。

独立进程重放的科学 JSON 除耗时外完全一致，636 个产物哈希复核通过。
53 个相关测试文件合跑 **1623 项通过**。科研流程要求的解析对照、固定阈值、失败保留
和精确重放均已落实；所有物理晋级标志继续为 false。

## 1. 新路径的数学合同

纯二阶导数采用独立 SBP D2(4,2)，混合导数采用两个不同方向的 D1 张量积。
逆度规的导数使用链式法则 d(g^-1)=-g^-1*(dg)*g^-1；由度规的一／二阶导数构造
连接系数及其导数，再按标准符号约定收缩 Ricci。

直接计算：

    R = g^ij R_ij
    H = R + tr(K)^2 - K^i_j K^j_i
    M_i = partial_j K^j_i - partial_i tr(K)
          + Gamma^j_jl K^l_i - Gamma^l_ji K^j_l.

canonical58 适配器使用 g=h/chi、Kij=(aij+hij*K/3)/chi，计算完整物理迹，
不会假定离散 A 已经无迹。测试显式包含 trace(A) 非零的状态。
不投影 det(h)，不重构辅助变量，不强制对称化 Ricci，也不修复非法输入。
对不正定、非有限或过度病态的空间度规会拒绝处理。

模块可处理不同轴长度／间距；矩形 9×13×17 网格有独立单元测试。
此诊断模块本身没有时间推进、SAT 边界、AMR 或物理写回权限。

## 2. 解析控制不是仅检查零结果

按 [冻结协议](EXPERIMENT-20261009-metric-geometry.md)，网格覆盖 [1,3]^3，
全域采用 SBP 加权、分量平均 RMS，固定内部盒为 [1.75,2.25]^3。

- Schwarzschild：用解析的非零空间 Ricci 张量验证，标量曲率和 H 为零。
- 非线性平直坐标：X=x+0.17 sin(y+z)，Y=y，Z=z；度规非对角且连接系数非零、
  随空间变化，但 Ricci 为零。另有二次坐标剪切的精确多项式单元测试。
- 非共形各向异性控制：对 du^2+exp(2au)dv^2+exp(2bu)dw^2 作固定斜坐标变换，
  a=.2、b=-.15；其完整 Ricci 张量与标量均有解析式。设 Kij=c*gij，
  c=.02+.01x-.015y+.005z，同时检查非零 H 和 M=(-.02,.03,-.01)。
  这是制造的几何控制，不是真空 Einstein 演化解。

各向异性度规在 warped 坐标中的 Cotton 分量
C_vvu=-a*b*(a-b)*exp(2au) 非零，故不限于坐标上非对角的共形平直情况。
给定解析 metric jets 时，张量代数也被单独验证，以区分公式错误和离散误差。

## 3. 静态收敛结果

表中范围涵盖 N17→25 和 N25→33 两档；全域门槛为 >=2.2，固定内部门槛为 >=3.5。
每个误差须高于 2e-13 测量底线，未解析误差不能算通过。

| 几何 | Ricci 全域阶数 | H 全域阶数 | Ricci／H 固定内部阶数 |
|---|---:|---:|---:|
| Schwarzschild | 2.49089–2.50982 | 2.52019–2.53378 | 4.01442–4.02485 |
| 非线性平直剪切 | 2.48933–2.49400 | 2.49080–2.49672 | 4.07379–4.09214 |
| 非共形斜坐标 warped | 2.47482–2.48109 | 2.50122–2.50273 | 4.00021–4.00180 |

全部 24 项判据通过，但没有全域四阶声明。
所有静态／保存状态的 Ricci 非对称残差最大为 1.66534e-16，未作对称投影。
解析动量约束的最大逐点差为 1.85615e-15。

## 4. 保存终态的新旧诊断比较

输入仍为原实验 N9/N13/N17、T=1/32M 的静态初值演化终态；没有再积分一步。
旧诊断使用保留的独立张量转写重建，不将原回执中的数值直接当作新计算。
12 个初／末态输入记录均先验证原 SHA256。

| 网格 N | 原 H 全域 RMS | 新 Hessian-H 全域 RMS |
|---:|---:|---:|
| 9 | 8.0449580078e-3 | 2.4161320870e-3 |
| 13 | 4.5557036113e-3 | 9.0866471207e-4 |
| 17 | 3.0052836945e-3 | 4.4557928514e-4 |

对应空间阶数：旧 H 为 1.40250、1.44607；新 H 为 2.41191、2.47704。
新旧 M 的最大逐点差为 1.57209e-18。保存数组并列包含新 Ricci、标量曲率、H、M
和旧 H；回执另记录新旧 H 的有符号场差范数。

这支持新诊断在当前保存状态上的一致性和收敛表现，并不说明状态本身因后处理而变好。
本轮没有独立重新测量时间阶、长时稳定性或边界反射；原科学验收保持失败。

## 5. 测试、可复现性和资源

- 首轮模块测试 13 项通过；模块与运行器合并 24 项通过，4.96 秒。
- 最终 53 文件回归 1623 项通过，63.62 秒。测试集重叠，不累加计数。
- 四个新增 Python 文件的 Ruff 通过，既有 pytest-asyncio 弃用提醒未改动。
- 主实验 6.5089420 秒，重放 5.6056592 秒；不将时间差解释为性能变化。
- 两次各 318 项产物，共 636 项逐一重新哈希；298 个源码键对应 297 个不同文件。
- 科学 JSON 仅排除根级 seconds 后完全一致，保存数组字节哈希一致。
- 单次目录约 25.353 MiB，在 180 秒／64 MiB 预算内。
- 最近磁盘余量 C 约 10.485 GiB、E 约 10.364 GiB；原 C>=3GiB、
  E>=4GiB+32MiB 底线未变，新产物只写 E。没有安装、清理、暂存、提交或推送。

| 产物 | SHA256 |
|---|---|
| [主实验](../../tmp/nr-shadow-evidence/nr-k3-metric-geometry-v1-20261009/receipt.json) | `91d83db1eea622d95570b0760699204ae644beb4e545a5be95d7315a51bbb422` |
| [独立进程重放](../../tmp/nr-shadow-evidence/nr-k3-metric-geometry-replay-v1-20261009/receipt.json) | `437a21558bd235dd82236eb5923f278e07a7042461db87fa0fb3705c6ff64954` |
| [24 项定向测试](../../tmp/nr-metric-geometry-tests-v1-20261009.xml) | `75b7410b630dff8adf5a8e100589016781d97aaeb8c0c0d6fab4e676d658dde9` |
| [1623 项回归](../../tmp/nr-metric-geometry-regression-v1-20261009.xml) | `b49f541d2575ba190646d9106cef8da1db858cef982eab15f55d957df159d901` |
| [一般几何模块](sbp_metric_geometry.py) | `54de0e1fbe3821f686a305627f40f96da499751b6956240462937a0c85dfbfe0` |

入口为 `scripts/run-nr-k3-metric-geometry.py`，沿用 Windows 原生 Python、单线程
BLAS/OpenMP、E 盘 TEMP/TMP 和新输出目录。源文件、解析控制与资源协议已随实验快照保存。

## 6. 参考边界与下一步

通过 GitHub 核对 [SpECTRE 的 Ricci 数学约定](https://github.com/sxs-collaboration/spectre/blob/develop/src/PointwiseFunctions/GeneralRelativity/Ricci.hpp)，
blob `f18fe353dd3b50dc5a5e114630a8e3ee3f4e08e1`。
Exa 检索返回五个结果，其中 [Einstein Toolkit ADMBase 文档](https://einsteintoolkit.org/thornguide/EinsteinBase/ADMBase/documentation.html)
用于核对物理度规／外曲率接口的语义。未运行这些项目的求解器，没有跨代码物理一致性结论。

下一阶段冻结采用新旧双诊断的全新非线性实验：在演化过程中记录并检查新 H，继续报告
旧 H、M、约化约束、阶段安全界限和源身份；重新取得空间／时间收敛证据后才延长窗口，
研究扰动传播和边界返回。静态或后处理结果不能代替这一步。

原 FO-CCZ4 演化体方程、规范、SAT、native 0.5.0、旧短窗口及 T=1M 失败均保持不变。
含视界黑洞、物理辐射边界／CPBC、AMR、ADM／波形、GPU 和 live 晋级仍未完成。
美术、旧 EIH 路径和 scientificPayloadWriteback 未改，完整长期 goal 继续 active。

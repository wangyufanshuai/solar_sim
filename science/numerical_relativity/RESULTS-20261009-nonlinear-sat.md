# Nonlinear FO-CCZ4/SBP/SAT：短窗口重放与保存状态复算完成

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: deterministic replay, independent diagnostic transcription, failure-injection tests
- Origin Date: 2026-10-09
- Verification Status: BOUNDED COUPLING SCREEN REPRODUCIBLE; NO PHYSICAL ADMISSION
- Version Label: nr-nonlinear-sat-closure-v1

## 结论

真实非线性 58 变量体方程、六面逐 RK 阶段特征 SAT 与 RK4 的首个短窗口，
已完成独立进程重放和保存状态复算。两次科学记录除耗时外完全一致，分段续算
与连续演化的最终状态逐字节一致。独立转写诊断的最大差异为 6.45318e-16。

这关闭的是解析入射目标下的有限耦合与可复现性门槛，不是约束收敛、非线性稳定性、
物理辐射边界、CPBC、含视界单黑洞或双黑洞验证。旧 T=1M 的两项收敛失败保持失败。
AMR、波形、GPU、live、scientificPayloadWriteback 均仍为 false。

研究流程在本轮具体落实为：保留预设阈值、先测试审计拒绝路径、保留失败记录，
再作独立进程重放与独立诊断复算。未修改原实验方程、规范、源项、边界目标或运行器。

## 1. 实验范围没有扩大

沿用 [20261008 原实验协议](EXPERIMENT-20261008-nonlinear-sat.md)：

- 几何单位 G=c=1，M=1，外部立方体 [1,3]^3，9^3 网格。
- 静态初值与 1e-4 扰动；58 个变量独立演化，未重构辅助场或施加代数投影。
- 静态与扰动各四步 dt=1/1024，终点 T=1/256M。
- 半时间步为八步 dt=1/2048；另有两步加两步的保存／加载续算对照。
- 全部 80 个曲率背景 RK 阶段加四个 Minkowski 阶段均记录并验证。
- 入射特征量仍使用解析 Schwarzschild 目标。不是渐近辐射边界，不包含黑洞视界。
- 单线程 FP64 Python 参考路径；本轮没有重编译或运行新的 C++ 求解器。

最大阶段 CFL 为 0.0177089338234604，最大特征基条件数为 24.2002417453396，
最大特征残差为 1.89369e-13。扰动最大 SAT 为 0.00618983409989062，阶段系数哈希发生变化。
这些数值满足原耦合检查，但不构成连续系统的强双曲性或统一三维能量估计。

## 2. 独立复算的结果和局限

[审计协议](EXPERIMENT-20261009-nonlinear-sat-audit.md) 要求从七个保存数组的
58 个 canonical 槽重新构造 physical gamma=h/chi、Kij=(aij+hij*K/3)/chi，
使用完整物理迹，直接计算 Christoffel、Ricci、Hamiltonian 与 mixed-index Momentum。
另行计算 A/B/D/P 约束、det(h)-1、trace(a) 和 Theta。

审计器不导入生产演化、几何、状态构造或原实验运行器。SBP 矩阵采用保留的独立稠密转写。
这是独立算术／索引检查，不是第三方求解器或另一种连续物理解。

| 检查 | 实际结果 | 预设界限或含义 |
|---|---:|---|
| 保存状态数 | 7 | 初值与五个案例终态 |
| 诊断 RMS 最大绝对差 | 6.453171330633722e-16 | <=2e-12 |
| 解析初值独立重建最大差 | 4.718447854656915e-16 | <=2e-14 |
| 分段／连续最终字节 | 完全相同 | 确定性续算 |
| 半步／全步相对状态 RMS 差 | 2.0445251443904886e-16 | <=1e-4，仅实现筛查 |
| 两次产物校验 | 566 / 566 匹配 | 两次各 283 项 |
| 源码身份 | 277 个键、276 个不同文件 | 一项路径分隔符别名，未重复计文件 |

不能把接近舍入精度的半步差值称为 16 位物理精度，或当作测得四阶时间收敛。
中间 RK 完整状态与 Minkowski 最终状态没有由本实验保存，所以仅核对其记录及重放，
不声称已从保存数组独立重建它们。审计回执显式记录这两个覆盖限制。

### 约束没有被“通过”二字掩盖

以下为原协议的全域 SBP 加权、分量平均 RMS；不是相对物理误差：

| 案例 | 初始 H | 最终 H | 初始 M | 最终 M |
|---|---:|---:|---:|---:|
| 静态 | 0.00804179689851562 | 0.00804184719019341 | 0 | 5.24663909586944e-6 |
| 扰动 | 0.00804179474395920 | 0.00804189896202278 | 1.62531272441285e-4 | 1.57275302045659e-4 |

静态案例的动量约束从零增长，H 也略有增长；扰动 M 在该短窗口下降。
没有多分辨率与传播窗口证据，不能把这些变化称为约束控制成功、稳定性或失败根因定位。
静态／扰动的状态 departure RMS 分别为 4.68965e-7 和 4.10310e-5，仅满足原 <1e-2 有界筛查。

## 3. 测试与失败保留

- 原新增模块／运行器：此前 116 项通过，源文件保持不变。
- 新审计器初稿：26 项通过。
- 加固前故障注入：15 项通过、3 项失败、30 项未选；三项失败分别覆盖 det 上界、
  lapse 上界、同一回执假作独立重放，原 XML 保留。
- 加固后审计器：50 项通过。包括来源／范围篡改、布尔索引、未完成状态、失败落盘与拒绝覆盖。
- 当前三个相关测试文件合跑：**166 项通过**，Ruff 通过。

这些测试有重叠，不累加为新的全项目总数；合成坏数据只验证审计器，不是黑洞实验。
已有 pytest-asyncio 配置弃用提醒未在本轮改变。

更大范围的旧合并回归仍记录 **1298 通过、1 失败**。失败为旧
`test_total_time_cap_not_reset` 的 900 秒浮点截止边界。为保持本次原实验／重放的冻结源码
身份，旧运行器与测试未在本轮修改，也没有通过重跑、排除或放宽判据把它改成绿色。
后续修复必须显式记录源码版本转换并保留旧报告。

## 4. 资源与身份

本轮开始 C 盘约 11.581 GiB、E 盘约 24.505 GiB，均高于用户底线。
继续要求 C>=3 GiB、E>=4 GiB+32 MiB；新产物只写 E 盘，不清理、不安装。

- 首批实验：261.7483287 秒，既有回执保留。
- 本轮独立重放：294.7079535 秒，退出码 0；每批产物约 4.823 MiB。
- 独立诊断复算：1.7381933 秒，退出码 0。
- 166 项定向测试：pytest 报告 4.33 秒。

这些是本机执行记录，包含不同负载和验证工作，不能据此宣称性能提升或退化。
单批原预算 1200 秒、32 MiB 未变。native 0.5.0、旧 T=1M 失败回执和 legacy 路径保留。
未改美术、网页 live dynamics、科学 payload；未暂存、提交、推送或改变运行环境。

## 5. 可追溯产物

- [首批实验](../../tmp/nr-shadow-evidence/nr-k3-nonlinear-sat-v1-20261009/receipt.json)
  SHA256 `e51a2b6dd4ad3ec3ed613135ef67561dae2ba3c6d9f105f90ac1464ae6d7a281`
- [独立重放](../../tmp/nr-shadow-evidence/nr-k3-nonlinear-sat-replay-v1-20261009/receipt.json)
  SHA256 `bdacba46c4cb2ab04d3e80cc660ce242eaf4eb7e65604b6aaf5ab6495a5b39d4`
- [保存状态审计](../../tmp/nr-shadow-evidence/nr-k3-nonlinear-sat-audit-v1-20261009.json)
  SHA256 `1e6149bb69b53826b0dde9be17cbbba72b6b71b6a65226d52d847c45513be7c6`
- [166 项当前定向回归](../../tmp/nr-nonlinear-sat-closure-tests-v1-20261009.xml)
  SHA256 `8183299a3129c2356495de93ed1a1a6d94d49a5bd31be8dc490cef41897fbfa3`
- [加固前故障注入](../../tmp/nr-nonlinear-sat-audit-red-tests-v1-20261009.xml)
- [保留的 1298 通过／1 失败报告](../../tmp/nr-nonlinear-sat-regression-v1-20261009.xml)

执行入口为 `scripts/run-nr-k3-nonlinear-sat.py`；审计入口为
`scripts/audit-nr-k3-nonlinear-sat.py --receipt <primary> --replay <replay> --output <fresh-json>`。
使用 D:/python/python.exe -B，设置单线程 BLAS/OpenMP，TEMP/TMP 指向工作区 E 盘 tmp。
所有入口要求新输出路径；审计器也会保留终止失败，不能覆盖既有结果。

## 6. 下一步仍须推进真实科学目标

先将超时边界修复纳入显式的新源码身份，再冻结非线性空间／时间／区域与入射返回研究。
需要分别解释体内、边界和边角的收敛，测得真实时间阶，观察非零扰动传播后的约束行为。
当前 9^3、T=1/256M 结果不能替代这些实验，也不能直接据此向 live 或原生物理边界晋级。
之后仍有含视界黑洞、生产级 AMR、ADM／视界／波形误差预算、独立求解器对照和 GPU 门槛。
总 goal 保持 active，未缩减为当前短窗口的成功。

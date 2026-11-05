# 有限速率代数约束松弛：Python / Windows 原生 shadow 集成

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent + python-testing-patterns
- Origin Mode: run / deterministic verification
- Origin Date: 2026-10-07
- Verification Status: VERIFIED（仅以下有限实验与回放）
- Version Label: nr-k3-algebraic-relaxation-v1

## 结果与改动

本轮不再仅做机制审计，已把可选的有限 `tau_inverse` 接入原生求解器。
Python 原有数值项增加策略身份绑定，C++ 从硬编码零速率改为显式选择。
只有 h 和 a 的两个松弛源项改变，A/B/D/P 仍独立演化；没有代数投影。

依据 [FO-CCZ4 原论文](https://arxiv.org/html/1707.09910v3) 式 (12a)/(12e)，
设置 lambda=tau_inverse。零速率保持旧路径；非零速率只允许动态 shadow：

- checkpoint v4 储存空间阶数、gauge profile、策略编号和速率；旧 v1/v2/v3 保留。
- Python 状态元数据、检查点、C++ 命令行、manifest 0.4.0 必须一致。
- 恢复时遗漏/改错速率会拒绝执行，不自动猜测或切换。
- 策略明确不是投影，也不重建辅助变量；物理与 live 标志仍为 false。

完整协议在运行前冻结于
[EXPERIMENT-20261007-algebraic-relaxation.md](EXPERIMENT-20261007-algebraic-relaxation.md)。
一次实验耗时 **75.001 秒**，120 条外部命令：104 条退出 0，16 条预期拒绝退出 2。
completed=true、gates_passed=true、errors=[]。没有失败重跑或放宽阈值。

| 检查 | 本次证据 |
|---|---|
| 零速率回滚 | 6 组 FD2/FD4、解析/动态/profile；0.3.2 与 0.4.0 检查点逐字节相同 |
| 非零速率 | 12 组，lambda=0.25/1/4，FD2/FD4、两种 gauge；8 步演化 |
| 确定性 | 12 组 1/4 线程、直接8步/3+5步恢复的检查点与 manifest 均逐字节相同 |
| Python/C++ 演化差异 | 全58槽最大绝对误差 8.33684e-16；门限2e-12 |
| 实际 RHS 差异 | 最大2.66475e-15；24次原生检查确认实际1/4线程团队及字节一致 |
| 瞬时平衡式 | 最大3.46945e-18；门限2e-12 |
| 小扰动动力学 | 4组、20个采样，T=0至1；迹参考误差最大1.31300e-12，lapse残差参考误差最大1.05128e-11 |
| trace-free 零响应对照 | 最大4.53184e-14；预设门限1e-12 |
| 负例 | 16项，错误速率、格式、模式、profile或阶数全部拒绝，未生成输出 |

6组回滚的manifest仅允许版本号和两个策略字段变化，数值校验和相同。
12组有限速率实验只有 N=8、dt=1/256、T=1/32，不是长时间稳定性实验。
T=1 的4组使用幅度2e-6、(1,1,1)方向的迹/无迹曲率扰动，亦非物理引力波。

## 物理解释和不能越过的边界

在原七项 lapse 辅助约束恒等式不变的前提下，几何迹 T=tr_h(a) 的瞬时平衡
增加 `lambda*(det(h)-4)*T`。因此平直线性化下：

`T(t)=exp(-3 lambda t)*T0`

`C_i(t)=-2*d_i(T0)*(1-exp(-3 lambda t))/(3 lambda)`，其中初始 C=0。

这说明迹源受到松弛，但 C 可以积累到非零值，**不是所有约束都衰减到零**。
单独只读进程使用 FFT 离散频率符号重算紧凑平衡式，不复用七项差分拆分：
lapse误差2.16840e-18、迹误差3.46945e-18。仍不是第二套完整Einstein求解器。

同一只读复核补算了全部12组 A/B/D/P 的初末残差；这是描述性补充，不增加
或修改预设门禁。例如 FD4/profile/lambda=1：

| 残差无穷范数 | 初始 | 8步后 |
|---|---:|---:|
| A-d(log alpha) | 1.06531e-3 | 1.12830e-3 |
| B-d(beta) | 1.15447e-3 | 1.15788e-3 |
| D-0.5d(h) | 6.56976e-4 | 6.57696e-4 |
| P-d(log phi) | 1.16286e-3 | 1.18062e-3 |

这些增长未被隐藏。12组故意独立扰动全58槽，不在约束面上；最终metric-based
ADM H峰值0.129747、M峰值0.00316077，绝不能当作已收敛的Einstein解。
H/M使用实际重构K_ij的迹修正，保持旧stored-K诊断语义不变。

## 身份与验证

目录：`C:/Users/86137/NRShadowEvidence/nr-k3-algebraic-relaxation-v1-20261007`

- 收据SHA-256：`7398ecaa7563a0e1df58e45903721b6b21be3fe86b7dca74dec88c1e79133c80`
- 协议SHA-256：`470be63adb3310584dfc9d95aff0bd8970144824b5090f3b01da7779b25bdee7`
- 原生0.4.0：`20402d8e8ac65e1c24d87df4a5ad828846c40929c10af5f64b2c8b3ce1c27e38`
- RHS检查器：`365a48fcbcdf372c7a6dfb8830f4530ce8b970d9e117b221a39efbc7bd3ba033`
- 166份源码前后/快照身份一致，647份产物哈希；含收据共648文件、37,024,398 bytes。
- 原162份基线快照全部复核；仅4份既有源码改变，新增4份源码/测试/运行器。
- 单独只读进程复核全部源/产物/二进制/协议哈希和6组回滚字节。
- 定向回归 **401 passed in 17.76s**；包括新98项中的相关测试，不能累计相加。
- 7份受影响Python文件Ruff通过；已有pytest_asyncio弃用警告未修改。
- 这是定向测试，不是全项目测试，也未执行CUDA或浏览器验收。

## 后续依赖顺序

1. 固定同一初值，加入零速率对照、N和dt精化，独立评价 H/M、A/B/D/P、迹与
   determinant误差；区分松弛效果、有限差分缺陷和初始约束违反。
2. 检查更长时间窗及松弛带来的时间步限制，不通过就保留失败证据。
3. 将“全步前代数投影”作为另一个策略单独推导和绑定，尤其明确D约束如何处理；
   不把投影偷偷加入已验证路径。
4. 满足收敛与稳健性要求后，再推进动态单黑洞、物理边界以及AMR/视界/Psi4。

未修改美术、live EIH或科学payload。constraint propagation、strong hyperbolicity、
CPBC、黑洞物理、AMR、CUDA与live admission仍未获验证；完整NR goal保持active。

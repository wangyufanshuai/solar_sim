# 三项代数约束候选已实现；局部映射可复现，但不能作为直接恢复补丁

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: prospective deterministic component study and separate-process replay
- Origin Date: 2026-10-09
- Verification Status: COMPONENT REPRODUCIBLE; EVOLUTION POLICY AND PHYSICAL ADMISSION UNVERIFIED
- Version Label: nr-three-constraint-projection-results-v1

## 1. 本轮完成与没有完成的事

新增 [独立三约束映射](fo_ccz4_algebraic_projection.py)：单位行列式 h、无迹 a、
三个无迹 D_k。调用默认关闭；未连接到现有 RHS、SAT、RK4、native 或网页。
本轮对上一轮全部 29 个初始／接受状态与唯一拒绝阶段做了离线修正分析，
共 30 个状态，没有新增时间演化，没有覆盖原始数组。

两个独立进程均完成，科学 JSON 除根运行耗时外精确一致；不是仅比较几个摘要。
新的局部组件检查通过，但 [原延时实验](RESULTS-20261009-longer-window-probe.md)
仍然失败。原失败状态和它的映射副本都不是可恢复 checkpoint。

## 2. 数学合同

令 s=exp(-log(det(h))/3)，采用：

- h'=s h；
- a'=a-h' tr(h'^(-1) a)/3；
- D'_k=D_k-h' tr(h'^(-1) D_k)/3，k=0,1,2。

其余 28 个 canonical58 槽逐字节保持不变，包括 ln(phi)、K、GammaHat、
A_i、B_k^i、P_i。拒绝非 FP64、非有限、非正定、条件数超过 1e8 或不可表示的
lapse/chi；没有截断、伪逆或迭代修复。三条代数残差的舍入检查限为 2e-12，
迹残差按绝对收缩项尺度归一化，不能把它与 Einstein 约束物理精度混用。

这里固定 chi 和 K，因此一般会改变 g_ij=h_ij/chi 与
K_ij=(a_ij+h_ij K/3)/chi。特别是原来 a 不无迹时，实际物理 tr(K_ij)
为 K+tr_h(a)，并不等于存储的 K。代码和测试显式计量这些改变。

本轮通过 Exa 重新读取 [FO-CCZ4 原始论文](https://ar5iv.labs.arxiv.org/html/1707.09910)
相关代数约束，通过 GitHub 核对
[固定提交的 EinsteinConstraints.f90](https://github.com/iamholger/ccz5/blob/31e8ed262e1a065ad91381306859162e76402120/src/EinsteinConstraints.f90)
（blob `71df73e714f7ebe4d230fb5e94867760266cd2ad`）。
这是公式对照，不是外部求解器运行或论文结果复现；没有复制该 59 槽实现。

## 3. 关键反例：代数残差变小，动量约束可以变大

对原被拒绝阶段 T=0.044921875M 的同一保存状态：

| 指标 | 修正前 | 修正后 | 含义 |
|---|---:|---:|---|
| 最大 det(h) 偏差 | 约 1.08995e-10 | 4.44e-16 | 局部代数关系恢复到舍入量级 |
| H，Hessian 诊断，全域加权 RMS | 9.1318917e-4 | 9.1318770e-4 | 微小变化，不是收敛证据 |
| M，全域加权 RMS | 1.6647769e-4 | 2.0452508e-4 | 增大约 22.85% |
| C_D，全域加权 RMS | 4.6195676e-5 | 3.8628069e-5 | 下降约 16.38%，仍非零 |

同一受扰动轨迹的 13 个样本（包括初值、接受状态和拒绝阶段）中，9 个样本的
全域 M 范数增大。这些是相关时间样本，不是 13 次独立实验，也不是普遍误差率。

拒绝阶段的物理修正预算（全域加权 RMS）为：

- 58 场修正：1.90448e-5；
- 物理度规修正：1.00713e-11；
- 物理 K_ij 修正：3.52094e-5；
- 实际物理 tr(K_ij) 修正：1.05429e-4。

受扰动初值本身也被改变：58 场修正约 1.95568e-5、物理 K_ij 修正约 4.02896e-5。
所以之后若从这个候选初值重新演化，必须声明为新的初值问题；不能宣称
“同一轨迹修补后跑得更稳定”。静态解析初值则在本次映射下字节不变。

没有依据这些现象回改验收线：冻结协议原本就要求计量 H/M 变化，而不假定改善。
`component_passed=true` 只表示公式、输入保护和预算核验通过，不表示新演化法通过。

## 4. 独立核验与测试

| 检查 | 实际结果 |
|---|---|
| 30 状态，cofactor/cube-root 独立映射对照 | 最大归一化差 4.44e-16 |
| 二次应用映射 | 最大归一化修正 2.22e-16 |
| 全部 30 状态投影前后 H/M/约化约束，独立稠密/Riemann 诊断 | 最大范数差 4.34e-14，门槛 2e-12 |
| 原 29 个状态的旧诊断复算 | 与原保存值精确一致 |
| 默认关闭路径、输入保护 | 字节一致；未原地修改输入 |
| 两次进程科学结果 | 除根耗时外精确一致 |
| 两次产物清单 | 758 / 758 指纹核验通过（每次 379） |
| 源码身份 | 321 个键、319 个不同文件，当前/前后/快照匹配 |
| 定向测试 | 91 通过，3.29 秒 |
| 原有 60 文件加新 2 文件回归 | 1898 通过，42.88 秒；无失败/跳过 |
| 四个新增 Python 文件静态检查 | Ruff 通过 |

单元测试包括非对角/空间变化 SPD、独立余子式公式、无迹处理、幂等性、
非连续/只读输入、无效输入失败关闭、物理修正解析控制；运行器测试还覆盖
保留拒绝状态、共用原解析参考、超时、原磁盘底线、部分写入和失败回执。
1898 是本轮合并总数，不与 1807 或 91 重复累加。

## 5. 资源和可定位证据

两次状态分析耗时分别 9.6902092 秒、9.7144626 秒；各输出约 62.268 MiB，
低于冻结的 180 秒/96 MiB 上限。这不是演化性能基准。
交付前复核 C 约 8.822 GiB、E 约 20.029 GiB；C>=3 GiB、E>=4 GiB+32 MiB
保持不变。没有清理、安装或原生编译。原生回滚二进制指纹仍为
`fc7ffb4eb3b40fbe8547c7178eb3f274f5ccbc6f6fa5d5f1decd1e2f1f761cbc`。

| 证据 | SHA256 |
|---|---|
| [主回执](../../tmp/nr-shadow-evidence/nr-k3-algebraic-projection-v1-20261009/receipt.json) | `b06ae9e74fe3714d6fc582ba9996674d1fa7f9008b159549c9ab43dc0749c694` |
| [独立进程回放](../../tmp/nr-shadow-evidence/nr-k3-algebraic-projection-replay-v1-20261009/receipt.json) | `493cf1247f86d924789b20b17bacd659a1ed09f32312a983f38107def73c07b6` |
| [91 项定向测试](../../tmp/nr-algebraic-projection-tests-v1-20261009.xml) | `123fa445171100063f1c150d903f612c9e3053fa340485b7e3eed6abe4d0090c` |
| [1898 项合并回归](../../tmp/nr-algebraic-projection-regression-v1-20261009.xml) | `61c7f8838112b55d0b23788c2de0c2c68126de396fc97992781deefc1d5b6dc8` |
| [冻结实验协议](EXPERIMENT-20261009-algebraic-projection.md) | `68aeaf2e79f469769db52ee9d3d03140332003bb65dcfd524361941bb3b0d635` |

## 6. 下一阶段必须推进到演化方法验证

1. 新建明确的代数相容初值合同，保留处理前后数据；原无投影基线与候选
   必须从同一个新初值出发，不能拿不同初值的结果比较优劣。
2. 开发独立、默认关闭的时间积分策略，区分初值处理、整步边界处理和
   RK 阶段处理。逐次记录原始候选状态与修正量；旧模式继续字节一致。
3. 固定体方程、边界与 tau_inverse=1，不同时调阻尼或降低扰动。
   先检验时间方法的实际阶数和约束切向性，再启动新的短时/延时演化矩阵；
   不能把“用了 RK4”或“每阶段投影”直接等同于四阶收敛。
4. 以独立 H/M、约化约束、状态误差、修正预算、空间/时间收敛共同验收。
   局部映射让 det 变小不足以通过；失败仍保留，不能关闭原速度检查绕过它。

此组件使下一步方法试验成为可计量的实现，但没有完成三维强场内核。
实际含视界单黑洞、AMR、ADM/视界/Psi4 物理基准、native 新方法一致性、
GPU 与 live 门禁仍未关闭。完整 goal 保持 active，不缩小为本组件验收。

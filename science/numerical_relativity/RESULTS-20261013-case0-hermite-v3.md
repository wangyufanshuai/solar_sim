## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: run; bounded case0 v3 validation and post-run file-integrity audit
- Origin Date: 2026-10-13 (Asia/Shanghai)
- Verification Status: CASE0_V3_PASSED; GLOBAL_SCIENTIFIC_ADMISSION_FALSE
- Version Label: nr-case0-hermite-v3-controls-v1-results

## 结论

**v3 通过本轮 case 0 的全部预登记检查，包括两项原始端到端扰动。**
没有放宽原 `2e-12` 门槛，没有改动原输入或旧失败记录，也没有将
固定精确投影复用于扰动验收。

本结果只关闭这个候选在 case0 上的限定检查，不等于整个 NR 内核、
一般背景、时间演化、黑洞、AMR 或生产路径通过验收。完整矩阵仍未运行。

## 本次实际修改

仅新增独立
[v3 模块](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/constraint_projector_energy_v3.py)、
[受监督运行器](E:/86137/myai/solar_sim/next-web/scripts/run-nr-k3-case0-hermite-v3.py)、
[推导](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/DERIVATION-20261013-case0-hermite-v3.md)、
[执行前计划](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/EXPERIMENT-20261013-case0-hermite-v3.md)，
以及本报告。旧 v1/v2 和所有验收源码保持不变，未接入 live。

v3 使用带零一阶导数条件的25次 Hermite 基函数；每次从实际输入矩阵
重新计算投影。构造公式来源见
[Berkeley 的 Hermite 插值讲义](https://persson.berkeley.edu/math128a/slides/ch3math128a.html)，
矩阵函数背景见
[Higham 与 Lin](https://eprints.maths.manchester.ac.uk/2067/1/paper.pdf)。
文献不是本项目通过的证据，实际通过以以下原检查结果为准。

科研技能的具体影响：先登记候选方法、输入来源、完整联合检查及停止
条件，再执行唯一批次；看到结果后未改动计划、方法或阈值。

## 预算、终态与进程

- 用户授权：仅 case0，64 MiB / 600秒；完整矩阵暂缓。
- Run ID：`cc04c770-7b2c-4ddd-ab60-0217d664ad74`。
- 实际只执行一次，退出码0，`retries=0`。
- 工作进程记录124.015秒；监督层记录175.984秒，约176秒。
  监督记录在最终终态写入前采样，不称为精确端到端耗时。
- 批次共590个文件、9,169,139字节，约8.74 MiB。
- 521项源码快照共4,595,458字节，低于原8 MiB上限。
- C>=3 GiB、E>=4 GiB+32 MiB及2 MiB收尾余量保持不变。
- Windows监督器确认 `cleanup_verified=true`、`active_after_cleanup=0`；
  后续只读进程查询也未发现本批遗留计算进程。
- 收尾磁盘时点：C 15,769,276,416字节，E 19,667,374,080字节。
  这些时点值不替代未来实验的准入检查。

## 系数与特征速度来源

58维主矩阵的两路有理数曲率构造精确一致，全部3,364个条目及差异
见证与上一轮相同。旧保存矩阵相对精确来源的归一化差仍为
`2.7755575615628914e-17`；前11个 ODE 行列精确为零。
独立47维精确矩阵的固定消去多项式精确为零。

节点平方值由精确分数
`(mu/4,mu/2,1,2,f,4*f/3)=(1/20,1/10,1,2,3,4)` 产生，
其中本案例固定 `mu=1/5,f=3`。Decimal50/70 的最大平方残差分别为
`1e-49`、`1e-69`，通过预登记算术检查；舍入回 binary64 后都与原
保存节点逐位相同。70位节点还复现了旧独立诊断记录。

构造阶段使用这些高精度节点；验收始终使用原 binary64 节点和保存
矩阵。原矩阵转入 Decimal 后仍保留其原舍入误差，并未用精确来源
替换它。没有特征值拟合或分数猜测。

**来源覆盖限制：**新独立有理数来源覆盖58/47主系统。43维约束系统
仍使用冻结的旧约束约化系数，不虚称新推导了另一套独立43维理论；
其完整验收以及43/58状态映射检查均执行并通过。

## 控制与原始 case0

- 169对标量节点的值/导数条件通过：两项误差均为0。
- 4个非节点位置的单位分解误差为 `3.811e-67`，低于单独预登记的
  `1e-40` 算术检查限；物理残差门槛仍为 `2e-12`。
- 8项已知投影对照通过：43/47维、对角/非正规相似变换、50/70位。
- 8项非法输入全部拒绝。
- 原 case0 的全43/58联合检查通过，不只是下表中的三项。

| 原始输入指标 | v3 实测 |
| --- | ---: |
| 完整状态幂等残差 | 2.3174108974007753e-16 |
| 完整状态交叉残差 | 1.7950048349728467e-15 |
| 完整状态作用残差 | 2.664535259102381e-15 |
| 完整状态重构残差 | 1.780982768669522e-16 |
| 43/58投影状态映射残差 | 9.99200722162641e-16 |
| 对称化残差 | 2.486856981609552e-16 |
| 能量最小特征值 | 0.2927747904318013 |
| 能量条件数 | 50.216421503462946 |
| 能量1/14下界缺口 | 0 |
| 三档原阈值下的稳定秩和 | 约束32、完整47 |
| ODE秩 | 11 |

其余完整性、ODE泄漏、ODE状态映射、shift分解、能量定义和对称性
等检查均通过。秩门槛仍为 `1e-9,1e-10,1e-11`，没有改动。

## 正负扰动：保留原输入模式并重新构造

原47维矩阵的所有非零条目同时加/减其正的 binary64 spacing，零条目
保持不变。两个输入均与旧 v2 保存的扰动矩阵逐位相同。每个输入都
进入新的 Hermite 构造；不是复用原始案例或精确参考的投影。

| 输入 | v2 作用残差（旧记录） | v3 作用残差 | 原上限 |
| --- | ---: | ---: | ---: |
| 原保存矩阵 | 1.4173677881221384e-12 | 2.664535259102381e-15 | 2e-12 |
| 减一个 spacing | 1.1647090512384339e-11 | 5.0330110552730294e-15 | 2e-12 |
| 加一个 spacing | 8.812386161162718e-12 | 5.32907051821788e-15 | 2e-12 |

两项扰动的全部七项残差和原三档秩检查均通过，无违规项。
负扰动幂等/交叉残差约 `4.10e-16 / 2.82e-15`；
正扰动约 `1.28e-16 / 2.52e-15`。

重新构造后的输出分别有4,581和4,573个浮点条目不同于原始输入的
候选输出，最大差均约 `2.41e-15`。这些数字作为输入响应记录，
没有被用作新增或替代物理门槛。

这仍是两种人工数值扰动，不是新的物理背景，更不是所有输入扰动
的稳健性证明。v2 的原失败仍然是失败，没有事后改判。

## 精确回放与精度对照

- 原始候选14个数组及全部指标精确回放一致。
- 正、负扰动各独立重新构造一次，输出及全部指标精确回放一致。
- 50/70位投影对照最大相对差：约束系统 `2.3308549688262954e-17`，
  完整系统 `1.5596999999997534e-44`，均通过原 `2e-12` 门槛。
- 这些属于预登记的同批检查，不是失败后重试，也不是100/52项
  旧测试套件或66案例回归。

## 文件完整性与可追溯性

运行结束后的额外动作仅为只读文件哈希核对，没有再次计算科学指标。

- 终态及预备终态的内部校验有效，run ID一致，预备状态为未完成，
  最终状态为成功。
- 新产物清单覆盖589个非最终终态文件，文件集合及全部SHA-256核对
  通过；另核对最终终态本身。合计590个批次文件。
- 当前521项源码与已冻结快照/记录一致。
- 三个旧批次共1,681个文件（582+567+532）在本批前后及事后只读
  核对中一致。v2旧失败批次原本没有成功全量清单；这里证明其
  本批期间未变，不是倒推出它当时已通过全量验收。
- 原始输入在内存及文件中保持不变。

| 关键文件 | SHA-256 |
| --- | --- |
| [成功终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case0-hermite-v3-controls-v1-20261013/qualification-gate.json) | `953928814933c509fccd89de56a154891967db26117c5f2396560ba14235bed6` |
| [工作回执](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case0-hermite-v3-controls-v1-20261013/worker-result.json) | `137289cecb6f1c9ac4a32bed0dcd170f3204352413974436a5185e567891bcbb` |
| [端到端扰动](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case0-hermite-v3-controls-v1-20261013/end-to-end-sensitivity.json) | `910a1f3dd858857925e5037b468542b2799a6faabab4edd40984ab126ccb7d6e` |
| [特征速度来源](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case0-hermite-v3-controls-v1-20261013/analytical-node-source.json) | `78efa7a232a17dee2c2912245cf8dd79163503fb487e7f0b375ab6938857fd5f` |

本报告是在批次结束后新增，位于冻结证据目录之外，没有回写已验收
源码快照、旧报告、旧失败或任何终态。

## 状态与后续边界

本批 `case0_v3_validated=true`、`case0_rounding_robustness=true`、
`nominal_case0_gates_passed=true`、`case0_exact_replay=true`。

`fixed_projector_energy_validated=false`、`case0_v2_validated=false`、
`physical_gate=false`、`live_admission=false`、
`scientificPayloadWriteback=false`；其它全局科研门槛仍为false。
没有运行完整矩阵、N9/N13、时间演化、native/GPU，没有修改美术。

建议下一步先审查并推广高精度节点对其它背景、法向及shift的适用性，
保持全43/58状态映射和能量检查，再另行授权相应验证批次。
当前 `case0_nodes` 仅覆盖这一固定背景，不能直接冒充全部66个案例的
通用入口；本轮通过也不授权启动完整矩阵或切换生产路径。

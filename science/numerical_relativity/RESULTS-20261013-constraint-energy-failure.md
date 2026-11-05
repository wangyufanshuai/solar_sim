## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: run; fixed principal-symbol energy controls, followed by read-only evidence inspection
- Origin Date: 2026-10-13 (Asia/Shanghai)
- Verification Status: FAILED_GATE; full exact replay NOT RUN
- Version Label: nr-constraint-projector-energy-v1-failure

## 实验结果

**本次候选未通过：首个案例的完整 58 变量投影检查超限。没有重跑。**

用户在上一轮待授权提示后回复“继续”，本轮按原预登记的一次
64 MiB / 600 秒预算执行。冻结计划中的目录名含 20261012；实际执行
日期是 2026-10-13，未为修改日期而覆盖或更换原计划。

- 命令：`D:/python/python.exe -B scripts/run-nr-k3-constraint-energy-controls.py --output-directory tmp/nr-shadow-evidence/nr-k3-constraint-energy-controls-v1-20261012`
- 工作区：`E:/86137/myai/solar_sim/next-web`。
- Run ID：`4be28d75-f12e-41bd-a65f-c7ee23459ea6`。
- 状态：failed / exit code 1；不是超时或磁盘不足。
- 监督层记录时间：21.969 秒；工作进程记录时间：20.594 秒。
  时间采样在最终回执写入前，不称为精确端到端耗时。
- pytest：1 failed in 0.65s，按 `--maxfail=1` 立即停止。
- 实际执行：100 项候选测试中的第 1 项；0 passed、1 failed，余下
  99 项没有运行。52 项纵向回归、66 案例精确复算和三项 Decimal70
  精度对照均未开始。
- 原阈值：`2e-12`，未改变。
- 本轮没有改动求解器、投影算法、初值、方程、参数或判定条件。

## 失败证据

失败项为 `test_full43_and_full58_projectors_and_energy[0]`，抛出
`ValueError: idempotency_relative failed`。完整指标在抛出前已经保存；
因此还可看到同一案例另外两项超限，但它们并非另行运行的测试。

| 指标 | 43 维约束块 | 完整 58 变量系统 | 原上限 |
| --- | ---: | ---: | ---: |
| 投影幂等性 | 1.985350166374731e-16 | 6.425270957747944e-12 | 2e-12 |
| 不同投影间的乘积 | 6.44868251049929e-16 | 8.224912548713627e-12 | 2e-12 |
| 特征作用关系 | 2.4743936071385665e-16 | 1.9015920723901177e-11 | 2e-12 |

三项完整系统误差分别约为阈值的 3.21、4.11、9.51 倍。对应的
完整系统投影由 47 维 PDE 主块构造后嵌入 58 维状态；它与 43 维
约束块共享预设速度节点，但不是同一个矩阵。

同一案例还记录到：约束能量最小特征值 0.29277479043180155、
条件数 50.216421503462904、对称化残差 1.1012605205850772e-16。
这些单例数值不能抵消完整系统超限，也不能推广为 66 案例通过、
统一强双曲性、公共边界能量、约束收敛或科研准入。

## 能确定与不能确定的内容

已确定：

1. 当前固定构造不能通过既定联合验收，失败位置在完整系统的投影
   恒等式，而非本例 43 维约束块的对应三项指标。
2. 原构造使用 Decimal50 运算，但矩阵和预设节点先由 binary64
   转为 Decimal；代码中的这一路径未修改。高精度运算不是对输入
   误差或构造正确性的独立证明。
3. 失败后没有执行精度对照或精确回放，因此不能声称“提高精度仍失败”
   或“已复现同一失败”。本轮只有一次真实尝试及对持久文件的读取。

尚未确定：

- 输入矩阵、预设速度的舍入、多项式构造条件性、转回 binary64，
  或实际结构不一致，分别贡献了多少误差。
- 其它 65 个案例能否通过。
- 换一种实现能否在原阈值下满足全部性质。

不能通过调高阈值、清零小项、裁剪投影、重新拟合特征值，或只保留
约束块结果来改变本次失败结论。

## 资源、安全与证据保全

- 532 个文件，共 7,366,751 字节，低于 64 MiB。
- 保留首个案例的全部 14 个数组、观察记录、失败 XML、日志、工作
  进程结果、预备终态和带校验的最终失败终态。
- 507 项源码快照，共 4,454,247 字节，低于原 8 MiB 上限。
- 完成后只读确认 `source_before == source_after`，全部 507 项当前
  源码及新快照与记录哈希一致；没有重新执行数值计算。
- 已独立核对最终终态校验值及其与预备回执的 run ID 一致性。
- 监督层 `cleanup_verified=true`、最终活动进程数为 0；随后系统
  进程检查也未发现本批运行器或监督引导进程仍在运行。
- 自动重试数为 0；旧文件、旧失败记录未清理、未覆盖。
- 最后磁盘时点观测：C 15,998,521,344 字节、E 19,815,477,248 字节；
  原 C >= 3 GiB、E >= 4 GiB + 32 MiB 底线未放宽。
- 没有 native/GPU 调用、N9/N13、时间积分、美术修改或 live 切换。

`fixed_projector_energy_validated=false`、`physical_gate=false`、
`live_admission=false`、`scientificPayloadWriteback=false`。
本次失败没有推翻先前 44 项运行器控制测试；它表明运行器正确保留了
一次科学候选的失败，而不是表明物理内核已通过。

## 关键文件与 SHA-256

- [失败终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-constraint-energy-controls-v1-20261012/qualification-gate.json)：`786b3b86ae9d4fd9035ae05e0bc6058b03147c27e2c9dfbad336a85db673b370`
- [原始观察指标](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-constraint-energy-controls-v1-20261012/observations.json)：`4bab8f10b4aba5c0af54998af514f484f550cb1a57b9409c71a311af49ebf1a0`
- [工作进程结果](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-constraint-energy-controls-v1-20261012/worker-result.json)：`bbe9016ed01a0d359f662c50219e4dfa498d5ef9fced378245bf0e1b3f4a2651`
- [测试 XML](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-constraint-energy-controls-v1-20261012/tests.xml)：`cc7e8b51b8ee3ff4ea82e8e2738727e2239610734e4cd04ce267f6c1a6859291`
- [测试日志](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-constraint-energy-controls-v1-20261012/tests.log)：`9cdf6f609c9589343d68b48901513ed1c2b580659d416b21f17f401ff09e25c2`

失败终态自身没有写出成功批次的完整 artifact inventory；本报告只列出
实际校验过的关键文件哈希及全部源码/快照核对，不虚称完成了成功
批次的全量产物验收。本报告为批次结束后新增，未回写批次目录。

## 建议下一步（尚未执行）

先针对已保存的 case 0 及其 47 维主块做独立误差定位，区分输入、
预设速度和投影计算路径的贡献。保留原矩阵、全部旧文件和 2e-12
阈值；不立即重跑整套矩阵。任何新诊断计算、实现变更或 v2 批次应
单独登记并获得授权，不能把本次失败回执改写成成功。

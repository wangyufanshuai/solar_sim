# 同网格旧固定层四因素组合诊断：预先冻结协议

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective controlled simulation
- Origin Date: 2026-10-08
- Verification Status: PROTOCOL ONLY; NOT EXECUTED AT AUTHORING
- Version Label: nr-halo-intervention-coarse-v1

## 问题、范围与排除项

首步原始 RHS 一致，但 RK 后续阶段出现域间差异。旧域比较同时改变了网格范围、
活动点和固定层。本实验把四种固定层组合放在同一个网格上，补齐此前缺少的
“只释放低侧”条件，测量冻结干预的带符号效应及交互项。

这是测试工具，不修改 native 0.5.0、演化方程、默认规范、阈值、live 或科学写回。
人工固定面不是建议的物理边界。只有一个空间分辨率，不计算收敛阶，不重评
T=1M 的三份旧失败，也不把未固定组当成无边界影响的真解。

## 冻结输入与实现

- 唯一动力学初态：保留的两侧扩域 [.5,3.5]^3、N25、M=1、h=1/8、FD4、
  dt=1/256、tau_inverse=1、原 state-dependent profile、原两层解析外 halo。
- 父阶段收据 SHA256：cd1872626f3f572bf1f2a41b528794510ec08a21e7180c606a2cc3b61eedb0e1。
- 旧场定位清单 SHA256：482420cef8dbb07276c75da3a4456f3f73ddf9424cdfad4e55a4ea14cdfa9e3a。
- 对照初态、各时刻检查点均按清单核验，不插值、不改写。
- C++ 测试程序 include 冻结的原求解器源码；实际 fo_rhs 保持原样，然后在每个
  RK 阶段把指定网格点的全部58个 RHS 分量设零。RK 运算顺序保持原样。
- 索引以大网格为准：low 为任一坐标索引 <=5，high 为任一坐标索引 >=19。
  原 [1,3]^3 对应索引4..20，原两层 halo 对应4..5与19..20。额外区域也冻结，
  但两层模板隔离使其不应改变对应旧域内部离散演化；由实际字节对照验证。

| clamp 名称 | 附加冻结点 | 预声明旧域对照 |
|---|---|---|
| none | 无 | 两侧扩域 N25 |
| low | low | 只扩高侧 N21 |
| high | high | 新条件，无旧长期结果 |
| both | low 或 high | 原域 N17 |

四组均256步到T=1M，记录step=1,32,64,128,256。输出专用 NRHALO01 二进制，
含模式、节点数、变量数、记录数、步数与时间，不能作为标准检查点恢复或写回。

## 判据、测量与负对照

工程/算子一致性判据（不是物理准入）：

1. 四组第一步与Python相同RHS掩码操作对照，58槽最大差 <=2e-12。
2. 四组单线程第一步与四线程主运行的第一条记录数组逐字节相同。
3. none 第一条记录与父阶段实验的 both/N25/final 字节相同，并与实际 advance_fo 一步相同。
4. none、low、both 在T=.125,.25,.5,1的整个共同 [1,3]^3、58槽，分别与
   旧两侧扩域、只扩高侧、原域逐字节相同；12项对照全部必需。
5. 每一步（含未输出步）固定点与原输入字节相同；原生全状态验证每个RK阶段执行。
6. 输出碰撞、未知模式、非法步数和未知参数，拒绝且不产生新输出、不改变输入。
7. 四模式、五时刻、两类几何指标覆盖完整，所有输入、源码、产物有SHA256。

实际测量：共同125节点上度规重建的H和Ricci误差，保留带符号场。
对于每个时刻、每个指标y：

- 释放低侧：y_high-y_both。
- 释放高侧：y_low-y_both。
- 交互项：y_none-y_low-y_high+y_both。
- 总差：y_none-y_both。

前三项之和应等于总差，允许浮点恒等式残差 <=2e-12。报告各项RMS、最大值和
相对2e-12底限的状态，不要求效应非零、显著或朝某一方向改善。不把范数比解释
为反射系数、精度提升比例或唯一物理源。保留每例所有58槽状态数据。

## 资源与失败处理

入口：D:\python\python.exe -B scripts/run-nr-k3-halo-intervention.py --output-directory
E:\86137\myai\solar_sim\next-web\tmp\nr-shadow-evidence\nr-k3-halo-intervention-v1-20261008。

仅新建E盘实验子目录，TEMP/TMP亦在该目录。聚合上限1800s，单个原生调用600s，
输出上限512MiB，额外64MiB空间余量；C>=3GiB，E>=4GiB+32MiB。
长调用期间检查活动进程与资源；不并行启动第二个计算批次。无自动重试。
预设超时、坏数据、覆盖缺失、哈希变化或算子对照失败均保留失败收据与产物。

八项准入始终false：physical_validation、physical_boundary_validated、
black_hole_evolution_validated、amr_validated、waveform_validated、gpu_validated、
runtime_writeback、scientificPayloadWriteback。研究总目标不因本批完成而完成。

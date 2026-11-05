# 首个 RK4 步阶段局部性：实际对照完成，物理门禁不变

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: frozen simulation collection and scoped regression
- Origin Date: 2026-10-08
- Verification Status: STAGE CONSISTENCY PASSED; PHYSICAL VALIDATION NOT ADMITTED
- Version Label: nr-schwarzschild-rk-stage-locality-v1

## 结果与适用范围

沿用 [冻结协议](EXPERIMENT-20261008-rk-stage-locality.md)，九组初态覆盖原区域、
只扩高侧和两侧扩域，以及三档相同网格间距。每次只演化一步 dt=1/256，保留
k1、s2、k2、s3、k3、s4、k4、final 八组完整 58 变量数组。中间 RK 状态不是
相应时刻的独立物理解，诊断文件也不是可以恢复或写回 live 的检查点。

- 九例共 72 个 Python/native 阶段对照通过，最大绝对差 2.220495844523544e-16。
- 48 个域间阶段对照的差异均满足预先声明的离散模板支撑范围。
- 九例 k1 与上一批原始瞬时 RHS 字节相同；最终数组均与未修改的 advance_fo 一步一致。
- N17 单/四线程重放字节相同；输出碰撞、非法线程数和未知参数均无副作用地拒绝。
- native 固定 halo 在每个状态阶段保持原字节，RHS halo 为零。
- 执行收据 completed=true、stage_consistency_passed=true、errors=[]，耗时 165.0075641s。

一致性误差不是对真实时空的精度；模板支撑范围也不是物理因果域或传播速度测量。

## 首步已经出现域间差异，但不能据此解释完整 T=1 失败

在原网格 N17 的共同活动区，两对区域的 k1 完全一致；k2 开始不同：

| 对照 | k2 活动区最大差 | k3 核心最大差 | k4 核心最大差 | final 核心最大差 |
|---|---:|---:|---:|---:|
| 只扩高侧 − 原域 | 1.65732255e-9 | 2.71433942e-12 | 5.42521823e-12 | 7.06633924e-15 |
| 两侧扩域 − 只扩高侧 | 1.04946830e-7 | 6.04339984e-11 | 1.20805481e-10 | 1.57339504e-13 |

final 核心状态差低于 2e-12 底限，不代表重建几何诊断也严格相同。最粗网格
两侧扩域减只扩高侧的 final 核心 H/Ricci 场差 RMS 分别为 4.61146593e-11、
1.76952079e-11；只扩高侧减原域分别为 4.14274006e-12、1.35314073e-12。
这些诊断还使用周围导数模板，不能仅由同一点的状态差判断。

较细两档网格的核心阶段差均未超过底限。本实验不计算新的收敛阶，不以首步
结果重新评定旧 T=1M 窗口。低侧、较高曲率、新增活动点与冻结条件仍存在耦合。

## 身份、测试与下一项区分性实验

收集阶段重新核对 219 个冻结源、308 个声明产物、9 个初态及父收据，均匹配。
本次补跑合并定向回归：495 passed in 19.50s。它包含上一批 445 项与新阶段工具
50 项，不能再相加宣称 940 项。既存 pytest-asyncio loop-scope 弃用提示保留。
未运行全仓库测试、浏览器 E2E 或全 Next 构建。

下一步建议在同一扩域网格上，以四种旧边界层冻结组合构成受控诊断；其中三个
组合应重现已有域实验，第四个补齐交互对照。该干预不是建议的物理边界，也不
把固定层影响自动等同于反射系数或唯一错误来源。

原域、只扩高侧、两侧扩域的失败结果均保留。以下八项继续 false：
physical_validation、physical_boundary_validated、black_hole_evolution_validated、
amr_validated、waveform_validated、gpu_validated、runtime_writeback、scientificPayloadWriteback。
完整 goal 仍为 active。

- [阶段原始收据](../../tmp/nr-shadow-evidence/nr-k3-rk-stage-locality-v1-20261008/receipt.json)
  SHA256 `cd1872626f3f572bf1f2a41b528794510ec08a21e7180c606a2cc3b61eedb0e1`
- 父初始 RHS 收据 SHA256 `015b8b831c7a3b7042c2325279a611bfd943b0cc36abed07f1d1892187e7c9bf`
- 未修改的原生求解源码 SHA256 `6252ec9b2901f03e51081410a612b9b6ed9d1ddd3469663f8d8dd9663944e457`
- 回归独立目录 `tmp/nr-rk-stage-locality-regression-v1-20261008`，禁用 pytest 缓存与 pyc。

科研规范用于冻结判据、保留失败和限制结论；测试规范用于覆盖行为与拒绝路径。

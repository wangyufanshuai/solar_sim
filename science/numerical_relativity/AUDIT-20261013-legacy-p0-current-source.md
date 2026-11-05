# Legacy P0 当前源码与既有证据核对

日期：2026-10-13。方式：只读源码审查与文件哈希比较，未重新执行测试。
使用技能：code-review-excellence；聚焦实际调用链、失败路径和测试覆盖，
不因旧摘要仍列为待修复而重写已有实现。

状态：IMPLEMENTED_WITH_SOURCE_ALIGNED_HISTORICAL_TESTS；NOT_RERUN；
BROWSER_END_TO_END_PENDING；NR_PHYSICAL_ADMISSION_FALSE。

## 结论

总目标中两个 legacy P0 均已有修复代码，并有与当前受检源码匹配的
历史工程测试证据。本轮不再将它们列作尚未实现的阻塞项，也不将这次
核对计作新数值测试或动态 Einstein 内核的物理进展。

### 1. DP 超限不能继续伪报为 DP

- [交互模式的两个超限分支](E:/86137/myai/solar_sim/next-web/app/lib/solarSystemPhysics.ts:406)
  在调用剩余时间 RK4 前设置 `rk4-fallback` 及对应原因。
- scientific-shadow 模式在这两个分支先中止，不执行 RK4 降级。
  [事务保护](E:/86137/myai/solar_sim/next-web/app/lib/solarSystemPhysics.ts:331)
  恢复本次调用前的 SI 位置、速度和 AU 位置，并保留失败状态，拒绝继续。
- [worker 发布](E:/86137/myai/solar_sim/next-web/app/workers/physics.worker.ts:107)
  与 [主线程读取](E:/86137/myai/solar_sim/next-web/app/lib/physicsRuntime.ts:119)
  保留实际 mode、拒绝子步数和降级原因。
- 现有测试直接强制交互式 acceleration-budget 降级，检查 mode/reason；
  科研模式另覆盖 max-attempts 和 max-accel-evals 的真实接受子步后回滚。
  不把这些有限测试表述为穷尽全部数值边界情况。

### 2. 主线程与 worker 使用同一物理 regime

- [帧入口](E:/86137/myai/solar_sim/next-web/app/components/SolarSystemIntegrator.tsx:63)
  对交互模式决定银河势开关；主线程直接设置，worker 路径随每次步骤
  发送同一开关。科研模式固定为 N-body，不读取视觉 LOD。
- [消息发送](E:/86137/myai/solar_sim/next-web/app/lib/physicsRuntime.ts:147)
  包含 galacticMode；worker 收到后先校验科学策略，再设置对应 regime。
- [实际 worker 测试](E:/86137/myai/solar_sim/next-web/app/workers/physics.worker.policy.test.ts:94)
  按 N-body -> 银河势 -> N-body 切换并比较两条路径的位置/速度，
  不是仅断言消息中存在字段。
- scientific-shadow 的 EIH/Newton 四步对照使用实际 worker 处理器，
  比较状态字节、日历和完成序号。篡改模式、时间步和日历会停止运行。
  测试通过 Node worker_threads 执行，不是浏览器 Worker E2E。

## 本轮实际核对的证据

历史源回执：
[receipt.json](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/legacy-scientific-policy-v1-20261008/receipt.json)

当前 SHA-256：
`2b8ee6957a8d306016b8dab1b8c1097be8d624f6c0c3f9b6288e1a05d0d30ec3`。

本轮读取 sourceAfterFinalValidation 的全部31项，逐项计算当前文件
SHA-256：31一致、0缺失、0漂移。范围包括核心实现、调用链、相关数据、
测试与Vitest配置；不是整个工作树或所有安装依赖的完整指纹。

历史测试报告：
[vitest-final-v3.json](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/legacy-scientific-policy-v1-20261008/vitest-final-v3.json)

当前 SHA-256：
`062c9921546df1f7e68a4fc2d2662a9f12a87b620f9d94213288e649fd368447`，
与回执记录一致。实际读取 JSON 的结果为 success=true、72 passed、
0 failed，8个文件的状态均为passed。这是2026-10-08保留的执行结果，
不是本轮新增72项通过，也不与后来的子集测试计数相加。

本轮阅读了实际测试和 Node 适配器，确认适配器只提供消息传输与
TypeScript 加载，没有替换积分器。组件测试模拟帧调度而非渲染浏览器。

## 保留限制与下一步

源文件相同并不证明依赖版本、宿主环境和真实浏览器生命周期相同。
本轮没有重跑 Vitest、TypeScript、lint、构建或浏览器测试，也未新增
任何 CPU/GPU 科学运算。共享数组仍属于可变运行态，不是已验收结果包。
既有报告对传输失败后的未知执行状态、浏览器和长期运行的限制仍保留。

没有修改运行代码、美术、旧报告或失败记录；只新增本说明。
原 case0 v3 的通过结论不变，完整矩阵和所有更广泛 NR 门槛未改变。
case12 的64 MiB/600秒新实验仍待用户确认；自动目标续行不是这项确认。
不启动新案例、N9/N13、时间演化或完整矩阵，不把 legacy 工程安全改进
表述为强场精度、黑洞、AMR、波形、live 或科学 payload 准入。

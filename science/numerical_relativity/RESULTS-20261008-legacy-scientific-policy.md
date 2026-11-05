# Legacy 科研执行隔离：有界工程验证通过

日期：2026-10-08。范围仅为现有 EIH 1PN / Newton 的 opt-in scientific-shadow
执行策略；不是新的 Einstein 场方程结果、科学准入或产品发布。

上一目标轮次属于进展：独立进程完成了 31 份 Schwarzschild 匹配域样本复核，
复现了三组不通过的域差值收敛。本轮处理另一个明确 P0：科研运行的模型、时间步
和失败行为不得受展示层控制。完整 NR 目标继续 active。

## 实现

- 新增 `app/lib/physicsExecutionPolicy.ts`，仅接收明确的 `eih-1pn` 或
  `newton-nbody`；未接入的 CCZ4 等名称会被拒绝。策略复制、校验并冻结，worker
  收到结构化克隆后再次校验。未知字段、非法时间步及无界预算均拒绝。
- 科研模式锁定 N-body、精度档、相对论参数和物理步长，不读取视觉 LOD。
  帧率与播放倍率只影响执行调度，不改变每次已接受科研步的物理时间长度。
- 科研模式只允许当前自适应 DP 路径。显式或环境触发的固定 RK4 不可冒充该路径。
  DP 超预算不再进入 RK4：恢复该调用开始前的 SI 位置、速度及 AU 位置，记录
  失败前已尝试接受的子步/物理时间，并锁死该运行。下一次实验必须新建实例。
- 非有限初态、误差估计或终态不产生成功结果。重置、快照注入、worker 重新初始化
  不能复用一个科研运行。主线程与 worker 都检查请求身份。
- 科研 worker 最多一个未确认步骤。只有成功确认后才发布科学时钟；数值步失败不
  增加共享日历、完成序号或成功通知。暂停播放仍会同步最后一个已确认步骤。
- Worker 请求篡改、发送/传输失败及主动终止会使运行停止；失败后的迟到完成通知
  不再通知下游。初始化超时不自动切换科研后端。
- `useSolarSystemPhysics({ executionPolicy: ... })` 和 `SolarSystemIntegrator`
  已接入该策略。现有场景没有被自动改为科研模式；默认 interactive 模式保留原
  LOD 行为和原有积分路径。没有切换到 NR live、修改渲染/美术或写回科学 payload。

示例（不是准入声明）：

```ts
const executionPolicy = {
  mode: "scientific-shadow",
  model: "eih-1pn",
  stepSeconds: 60,
} as const;

const physics = new SolarSystemPhysics({
  executionPolicy,
  forceFixedRk4: false,
});
```

当前入口仍采用现有初态/变量结构，不是任意初始数据导入器。其公开数组及
SharedArrayBuffer 是执行状态，不是不可变的科学结果包；调用方必须遵守所有权并
等待完成，不能把执行中的数组直接作为已验收输出。

## 验证结果

使用 JavaScript Testing Patterns 的行为/错误路径方法，覆盖实际积分分支，而非
只检查消息字段。本轮最终源身份冻结前后 31 个相关源/测试/配置文件一致。

| 验证 | 结果与范围 |
|---|---|
| 定向 Vitest | 8 个文件，72 passed，0 failed；包含 49 个新增测试案例 |
| 实际 worker 处理器 | 在独立 Node worker_threads 中运行，TSX 只提供加载与消息适配，不替换求解器 |
| EIH / Newton | 两个模型分别四步主线程/worker 状态逐字节一致 |
| 交互模式回归 | N-body → 银河势 → N-body 的实际轨迹主线程/worker 一致 |
| 部分积分回滚 | 主线程与实际 worker 都覆盖“真实接受一个子步后耗尽预算”；数值状态恢复 |
| 拒绝行为 | 模型/精度/物理时间/日历篡改、非法策略、重启注入、非有限值及传输失败 |
| 帧接线 | mock 帧调度、真实物理实例；科研模式不读取 LOD、冻结时间步、失败不走日历 |
| TypeScript | 显式实现/测试入口及其导入通过，不是全仓库检查 |
| ESLint | 11 个显式变更/新增源与测试文件通过 |
| 浏览器 worker 打包 | ESM/browser 内存打包通过，86,175 bytes；不是浏览器执行 |

最终测试报告：
`tmp/nr-shadow-evidence/legacy-scientific-policy-v1-20261008/vitest-final-v3.json`

SHA256：`062c9921546df1f7e68a4fc2d2662a9f12a87b620f9d94213288e649fd368447`。

机器可读源身份、检查范围与限制：
`tmp/nr-shadow-evidence/legacy-scientific-policy-v1-20261008/receipt.json`。

## 保留失败与限制

开发时的第一版回滚测试错误假定完整太阳系的首个 2400 秒 DP 试步会被接受；
实际它被拒绝。现改为显式惯性合成初态，核验确有一个已接受子步后再耗尽预算，
并保留完整太阳系的正常多步对照。这些合成数据不能作为天文学或 NR 的物理证明。

独立线程最初的 ESM 测试适配器无法解析无扩展名 TypeScript 导入；使用本地已安装
TSX 的 CJS 适配后执行的是同一 worker 源码。没有安装新依赖。局部测试中的
body-count-mismatch 提示来自选用子集的旧/新 fixture，不是新一次物理验收。

没有运行浏览器端到端测试、完整 Next 生产构建或全项目测试。浏览器跨源隔离、
完整 UI 生命周期和长期运行仍需单独验收。传输失败的执行结果未知，处理是停止
并拒绝继续，不声称能够回滚已经失联的 worker；数值失败的回滚有单独证据。

## NR 门禁未改变

原匹配域实验的 198 个源身份均未漂移，native 0.5.0 二进制 SHA256 仍为
`fc7ffb4eb3b40fbe8547c7178eb3f274f5ccbc6f6fa5d5f1decd1e2f1f761cbc`。
原最终收据 SHA256 仍为
`7e8ed82d234b56309c54093298ec475da4f00a2e47eea5a052a48026bd2d2157`，
`study_completed=true`、`study_passed=false`。没有改写旧失败或物理阈值。

完整黑洞、物理边界、AMR、波形、GPU 和科学写回均未因本次工程验证而获准。
后续主线仍是分离 Schwarzschild 域差值误差的原因，随后验证可用于含视界演化的
规范与边界，而不是把本次执行安全改善算作强场精度提升。

本轮新产物均在 E 盘；最后记录 C 约 7.31 GiB、E 约 26.61 GiB 空闲，满足用户
指定的 C>=3 GiB、E>=4 GiB+32 MiB 保留量。未清理、提交、推送或修改父仓库。

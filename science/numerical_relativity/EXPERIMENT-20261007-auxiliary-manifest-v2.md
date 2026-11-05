# 0.3.2 辅助元数据修复：函数级零步检查与真实CLI分层验收

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: implement and run
- Origin Date: 2026-10-07
- Verification Status: COMPLETE; metadata/equivalence gates PASS; physical promotion remains false
- Version Label: auxiliary_manifest_v2

## 失败原因与不变项

v1收据SHA-256 `58f58c35f444a1005329ef4b21fff6b11167883411ad5e8d4285977aaae9a445`
始终保持 `completed=false / metadata_repair_gates_passed=false`。已核查：真实CLI
用正整数解析器处理 `--steps`，不支持0。v1的8号命令因这个测试接口假设错误
退出2，未进入数值演化，也未产生checkpoint/manifest。不是数值不稳定。

本批是明确修订的独立协议，不是v1自动重跑：保留原失败和所有产物、144份
原源码及其stopped快照。**这144份文件一字不改**；只新增4份测试基础设施。
0.3.2求解器、CLI、数值算法、schema、读取器和v1验收比较函数均保持不变。
继承v1的12例矩阵、2e-12 Python/C++门槛、完整checkpoint字节相等以及
manifest仅允许版本/辅助policy变更的白名单，不能通过删除零步要求来过关。

## 两层执行边界

1. **检查器层**：`native_inspector/inspect.cpp` 分别包含已绑定的0.3.1归档
   和0.3.2当前完整源文件，仅重命名原main以访问同一翻译单元内的函数。
   原源码不打补丁。检查器只消费一个明确的 `--steps 0`，其他参数由原解析器
   验证；调用 `initialize` 或 `read_checkpoint`，然后调用原checkpoint和
   manifest写出函数。绝不调用 `advance` 或原main。
2. **真实求解器层**：所有正步数仍调用归档0.3.1 exe / 新编译0.3.2 exe。
   检查器不取代该层，也不声称旧exe支持零步。12个真实CLI负例要求两版均
   拒绝零步，退出2并且不生成checkpoint/manifest。
3. 每条命令记录 `execution_kind` 与 `expected_rejection`，零步文件名含
   `function-inspection`。检查器stdout必须声明test_only且evolution_steps=0。
   它写出的manifest仍是原writer的状态/算法合同；额外执行来源记录在外部
   receipt，不向manifest注入破坏直接/分段确定性的路径或调用历史。

## 冻结矩阵

- 固定MSVC2022/x64/C++17/OpenMP，无安装或PATH修改；干净目录构建真实求解器、
  实际4线程探针和两版检查器，记录包含的源码SHA与各二进制SHA。
- 12个CLI负例：FD2/4 × 解析无profile、动态legacy、动态profile × 新旧2版。
- 10个检查器负例：新旧2版 × 非零步、缺少步数、重复步数、恢复元数据不符、
  输出已存在。要求精确错误原因、退出2、不新增输出且已有文件字节不变。
- 动态8例：FD2/4 × wave/noise × legacy/profile；N8、dt1/1024、wave幅度1e-4、
  独立58槽噪声PCG64种子20261007/幅度1e-5。每例两版零步检查器、两版真实
  8步、真实新版1线程8步、真实新版3+5步，以及Python全58槽8步≤2e-12。
- 解析4例：FD2/4 × flat/wave、无profile；同N/dt/wave参数。两版新建初值
  检查器、真实直接8步、1/4线程和3+5步，全部字节/metadata白名单检查不变。
- 解析FD4波33个辅助槽各加1e-6：两版检查器原样往返；真实下一步须匹配新建
  解析一步输出。对比证明的是不同算法规则，不混称为约束收敛。
- 原N8/种子20261007的T=10检查点验证SHA后复制，两版真实内核各继续一步并
  比较全部字节。这不是新的T=10长跑，也不把元数据检查升级为物理证明。
- 最后执行更新过的解析验证器，验收其真实辅助槽误差和shadow标记。

总计预定 **123条runner命令**：9条构建/探针、22个预期拒绝、84个矩阵调用、
5个解析扰动对照、2个T10后一步、1个解析验证器。工具链路径查询及解析
验证器的5个子调用另披露，不重复计入123条。预期22条退出2，其余101条退出0。

## 预算、冻结和停止

输出目录：`C:/Users/86137/NRShadowEvidence/nr-k3-auxiliary-manifest-v1-20261007/campaign-v2`。
保持C≥4GiB、E≥1GiB；192MiB产物上限，每命令预留8MiB，总1200s、单进程180s。
协议执行前冻结；148份源码、原v1失败、原0.3.1成功父收据及其产物分别绑定。
任何非预期拒绝、错误原因不符、输出副作用、身份漂移、数值差异或超预算均
立即停止本批并保留失败，不自动调整/重试。所有旧数据不覆盖、不删除。

通过仅代表所列控制中的元数据正确和数值等价。0.3.1有限T=10证据仍是
有限窗口，最大辅助约束增长46.48倍不能消失在报告中。解析强双曲性、CPBC、
物理边界、黑洞演化、AMR、CUDA、长期稳定性、live和科学写回全部保持false。

## 实际结果

一次完成，无非预期失败或重试。总耗时 **56.083651s**，123条runner记录：

| 执行范围 | 退出0 | 预期退出2 |
|---|---:|---:|
| 构建、探针、解析验证器 | 10 | 0 |
| 真实shadow求解器CLI | 65 | 12 |
| 函数级零步检查器 | 26 | 10 |

12组矩阵均完成，完整checkpoint新旧字节相同；新版1/4线程与3+5分段的
checkpoint、manifest均字节相同。动态8例Python/C++全槽最大误差
`1.335532094528906e-15`，小于未更改的2e-12门槛。解析验证器最大误差
`3.681950577760773e-16`，通过其原2e-13门槛。
33个解析辅助槽扰动在零步读写中保持原字节，下一解析步重构后与fresh一步
字节相同；原T=10状态新旧真实内核各继续一步的全部字节相同。

独立进程再次核对：27组跨版本完整checkpoint及metadata白名单、25组同版本
checkpoint+manifest、9组零步输入原样往返。已验证148份源码、608个产物哈希
和4个绑定二进制；旧v1失败收据不变。共609文件、30,686,869 bytes。
这148份源文件在执行前后相同；相较v1既有144份不变，只新增4份验收文件。

- 收据：`C:/Users/86137/NRShadowEvidence/nr-k3-auxiliary-manifest-v1-20261007/campaign-v2/receipt.json`
- 收据SHA-256：`68b1a7c1b2cb5579b9a4aaf7e85e95a49ed2d967694beade2b24b503ed308bbc`
- 冻结协议SHA-256：`19dad398a3905007b48079c59a1b93a8760d53a60d2faaf63d2268c0231af44a`
- 新0.3.2求解器SHA-256：`554c65d99590153f56e40c3943d18785658fef7ca53f2c25a5a3630f2806619b`
- 检查器old SHA-256：`abd28ed0d17bc9315585a015ff9e3a5bf0221aa894032ad46edf3987f192da17`
- 检查器new SHA-256：`20aeed83bd276f690b20a8aad5fecaf02252b90498b4da13625df811bc1a5715`

定向回归 **443 passed in 30.29s**，Ruff通过；不是全项目测试。114项早期子集
已含在443项内，不重复累计。已有pytest_asyncio弃用警告保留。执行后另做的
trace-source事后分析和15项新单测有独立来源记录，不属于本冻结验收矩阵。

结论：0.3.2现在是通过本元数据/确定性验收的shadow版本；未改变数值行为、
未提高物理成熟度、未转换live，也未抹去0.3.1和v1停止记录。下一步转向
[辅助约束增长的迹约束驱动机制](ANALYSIS-20261007-auxiliary-trace-source.md)，
先做前瞻性物理对照，不直接调阻尼或强制投影。

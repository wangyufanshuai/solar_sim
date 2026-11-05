# 0.3.2：辅助变量演化元数据语义修复

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: implement and run
- Origin Date: 2026-10-07
- Verification Status: STOPPED; CLI zero-step assumption rejected; native equivalence NOT validated
- Version Label: auxiliary_manifest_v1

## 原因与版本边界

0.3.1 的 `auxiliary_ordering_reconstructed=true` 对解析和动态模式无条件输出。
动态 RK4 实际独立更新全部58槽，检查点加载也不重构33个辅助量。
该旧字段不能作为演化时执行了重构或约束投影的证据。

0.3.2 删除该字段，新增 `auxiliary_evolution` 子合同
`nr-fo-auxiliary-evolution-v1`，明确范围是算法规则，不是单次执行历史：

- 新建初值：解析场及中心差分辅助变量。
- checkpoint 恢复：原样恢复58个已存储槽，不重构。
- 动态步进：独立58槽RK4，不重构辅助量、不做代数投影。
- 解析步进：重建解析场，再以同阶中心差分构造辅助量，不解动态RHS。

零步运行同样记录规则，不能据此声称执行过一个演化步。记录不添加路径、
线程数或启动方式，因此同一状态的直接运行/恢复及1/4线程仍须字节相同。
Python读取器严格检查0.3.2字段集合、类型及模式；未知版本拒绝。
旧0.1.0/0.2.0/0.2.1/0.3.0/0.3.1仅按历史合同读取，不回填新语义。
解析合同验证器改用Python/C++辅助槽实际误差，不再把旧writer布尔值当证据。

## 不可改写的基线

父收据：`C:/Users/86137/NRShadowEvidence/nr-k3-fd4-robust-continuation-v1-20261007/receipt.json`

- SHA-256 `bb4e8efb398c757a56ec1b35f2676d5d41490f6ebf0001fae965bb60e06c4e1b`
- 原0.3.1二进制SHA-256 `791bde6f0639a9b6be873c895a40a461f4473d0543b59a64600b5a8a7e768a1e`
- 141份源文件与二进制、父收据在编辑前复制到本批 `baseline-source` 等位置。
- 所有父产物保留；过去的资源停止和数值失败不覆盖、不删除、不改为通过。

## 冻结验收

1. 固定MSVC2022、x64、C++17/OpenMP，干净目录重新编译；实测4线程探针。
   C++数值代码必须逐字保持相同：只允许 `write_manifest` 函数内变更。
   其他现有源码仅允许修改manifest读取器、解析合同验证器、其原生门禁和测试。
2. 动态8例：FD2/FD4 × wave/独立58槽noise × legacy/profile。
   N=8、dt=1/1024、噪声PCG64种子20261007、幅度1e-5，wave幅度沿用1e-4。
   每例执行新旧零步恢复、新旧8步恢复、新版1线程8步、3+5步分段。
   零步checkpoint须与输入字节相同；新旧8步字节相同；新版线程/分段
   checkpoint和manifest字节相同。Python8步全58槽差≤2e-12。
3. 解析4例：FD2/FD4 × Minkowski/gauge-wave，无profile。相同N/dt/波参数。
   新旧直接初始化零步、新旧直接8步、新版1线程8步和3+5分段均检查。
4. 解析FD4波额外对照：在原零步checkpoint全部33辅助槽加1e-6；新旧零步
   恢复必须原样保留；下一解析步须恢复解析重构结果，并和新版全新一步字节相同。
5. 取父收据N8/种子20261007的T=10已存数据，验证SHA后复制到新目录；新旧
   各继续一步，checkpoint完全相等。它不是一次新的T=10稳定性试验。
6. 新旧manifest只允许版本号及辅助语义块变化；其余完整JSON逐项相等。
   新旧分别用严格验证器检查，不能先丢字段再把错误语义隐藏掉。
7. 执行更新后的解析Python/C++验证器，保留summary并通过原生读取门禁。
   运行元数据、checkpoint、旧窗口与新runner的定向回归；记录实际数量。

## 资源和停止规则

目录：`C:/Users/86137/NRShadowEvidence/nr-k3-auxiliary-manifest-v1-20261007/campaign-v1`。
源文件、协议、初值和所有命令均绑定SHA。新目录不可已存在。
保留C≥4GiB、E≥1GiB；产物≤192MiB，每命令预留8MiB；总1200s、单进程180s。
预计99个runner级命令（含构建、探针和验证器）。另有工具链路径查询，解析
验证器内部另启动5个已声明的原生子进程；不把子调用重复算入99个runner记录。
任何身份漂移、非零退出、超时、元数据差异或数值字节不等即停止并写失败收据，
不得自动重试、调参、减弱阈值或清理旧数据。旧收据永不改写。

本轮只证明元数据更正及限定矩阵下数值行为不变；不把0.3.1的窗口升级为
全局收敛/长期稳定性证明。约束最多增长46.48倍的问题继续保留。
物理验证、解析强双曲性、CPBC、黑洞、AMR、CUDA、live和科学写回全部false。

## 实际结果：接口假设错误，按冻结协议停止

执行一次，耗时26.932950s；没有重试。前7个runner命令退出0：两组配置和
编译，以及OpenMP、拓扑、空间差分探针。实际MSVC版本194435224，C++17，
OpenMP200203，4线程、worker mask=15、checksum=5559680。

第8个命令 `dynamic-fd2-wave-legacy-new-zero` 退出2，stderr：
`nr-k2-fo-ccz4-shadow: --steps must be positive`。
根因是已有 `parse_size` 拒绝0，`--steps` 使用该解析器；我在设计测试时
错误假设命令行支持零步。它没有进入数值演化，也没有输出checkpoint或manifest。
这不是数值崩溃、约束失败或新旧数值不一致；也**不是一次通过**。
12例新旧数值对照、解析重构对照、T=10后一步和解析验证器均尚未完成。

`completed=false`，`metadata_repair_gates_passed=false`；源码和旧档案不变。
0.3.2仅为已经编译但数值等价性尚待验收的metadata候选，不能替代0.3.1的
已绑定证据，更不能从shadow转入live。

### 身份和保存

- 收据：`C:/Users/86137/NRShadowEvidence/nr-k3-auxiliary-manifest-v1-20261007/campaign-v1/receipt.json`
- 收据SHA-256：`58f58c35f444a1005329ef4b21fff6b11167883411ad5e8d4285977aaae9a445`
- 冻结协议SHA-256：`fad5b0dcf08c95ec19a8186223fd36b481b018ae34eb0cc37cc82ce303951d15`
- 0.3.2候选二进制SHA-256：`95487d18fb3d54a3f4d6f68126ac7c7cc7dd6981cf5c5b6f78cc5560e7449cca`
- 144份源码身份、197个产物哈希；含收据198个文件，共3,731,758 bytes。
- 已用独立PowerShell路径/哈希检查复核197个产物；当前144份源码全部校验，
  并另存 `stopped-v1-source`，以便后续修订runner而不破坏本次源码身份。
- 0.3.1的141源文件、原二进制和父收据快照保留；无删除/覆盖旧证据。

Python定向回归 **414 passed in 40.37s**，涵盖旧318项及新manifest、原生
门禁和runner测试；Ruff通过。此前局部子集167项也通过，但不重复累计为
581项。不是全项目测试。已有pytest_asyncio作用域弃用警告未在本任务中处理。
这些Python单测没有实际执行零步原生CLI，故不能替代本次失败的集成检查。

## 下一批的必要修订（未执行）

1. 不修改已有 `--steps` 语义来迁就测试，也不删除“恢复不重构”的验收要求。
2. 单独建立测试专用原生检查器，从归档0.3.1/当前0.3.2的未改数值源编译，
   直接调用初始化、checkpoint读写和manifest写出，在不演化时检查全部槽字节。
   此证据必须标作函数级检查器，不能冒充旧留存exe支持零步。
3. 旧exe/新exe的零步CLI应单独验证“拒绝且无输出”；正步数8步、3+5步、
   线程和T=10后一步对照仍使用真实solver。不得降低字节相等和2e-12阈值。
4. 先写接口负例和检查器测试，再在新命名协议、新目录冻结并执行。明确关联
   本停止收据；本v1永远保持失败，不回填为通过。

遵守科研实验技能的失败保存规则，本批已经终止；顶层goal仍active，未标记
complete/blocked/paused，后续是明确修订后的新实验，不是本批自动重跑。

后续进展：独立的[v2分层验收](EXPERIMENT-20261007-auxiliary-manifest-v2.md)现已通过。
本v1收据仍保持失败，原先未执行的检查不回填到这里。

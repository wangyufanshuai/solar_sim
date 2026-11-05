# Schwarzschild 初始 RHS 局部性：实际对照通过，原收敛失败保留

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: run; frozen instantaneous operator comparison
- Origin Date: 2026-10-08
- Verification Status: EXECUTION COMPLETE; OPERATOR CONSISTENCY PASSED; PHYSICAL CAUSE UNRESOLVED
- Version Label: nr-schwarzschild-initial-rhs-locality-v1

上一目标轮次为项目水平评估，没有新增方程或实验。本轮完成此前尚未执行的
[初始导数对照协议](EXPERIMENT-20261008-initial-rhs-locality.md)。这是缩小下一步
诊断范围的新证据，不是原 T=1M 收敛异常已经修复，也不是完整 NR 目标完成。

## 1. 本轮实际完成的工作

- 读取并重核九份保留的 T=0 检查点，没有重写初态或时间演化。
- 原域 N17/25/33、高侧扩域 N21/31/41、两侧扩域 N25/37/49；同组间距分别为
  1/8、1/12、1/16，所有原有方程、规范、tau_inverse=1 和 FD4 设置保持不变。
- 使用现有 Windows MSVC/OpenMP 环境，从冻结源码快照构建已有只读 RHS 探针。
  构建日志标识 MSVC 19.44.35224.0；未安装工具链或修改全局环境。
- 九次四线程原生探针、九次 Python RHS 对照、一次 N17 单线程重放均完成。
  探针输出使用 NRFORHS1 导数格式，不能作为状态检查点重启。
- 每例保存共同核心的全部 58 槽范数；六对域间比较保留四个互斥原域分区以及核心子集，
  不挑选变量或舍弃小值。
- 收据 `completed=true / operator_consistency_passed=true / errors=[]`，
  用时 52.3817639 秒，进程退出码 0。`evolution_steps=0`。

共同核心仍为 `{1.5,1.75,2,2.25,2.5}^3` 的 125 个精确节点，不插值。
所谓 active 是原域去掉两层固定边界后的节点集合，不等于整个扩域活动区。

## 2. 关键结果：共同核心的初始导数完全相同

| 原域节点数 | 比较 | 全原域输入最大差 | 共同 active RHS 最大差 | 核心 RHS 最大差 |
|---|---|---:|---:|---:|
| 17 | upper-original | 0 | 0 | 0 |
| 17 | both-upper | 0 | 0 | 0 |
| 25 | upper-original | 0 | 0 | 0 |
| 25 | both-upper | 4.44089e-16 | 8.89944e-16 | 0 |
| 33 | upper-original | 0 | 0 | 0 |
| 33 | both-upper | 0 | 0 | 0 |

六对比较的核心 RHS 均逐字节相同；五对 active RHS 逐字节相同。
N25 的 both-upper 全活动区并非字节相同，但差值远低于预定 2e-12 对照容差，
同时存在上述微小输入差。不能把它记录成 exact replay。

九例 Python/C++ 的全网格、全 58 槽最大绝对差峰值为 **8.72398937e-18**。
九例各自的固定层在两个后端均为严格零 RHS。N17 原域一线程/四线程的完整 RHS
文件逐字节一致。上述是两套实现的数值一致性，不是 1e-18 的物理准确度。

因此，现有证据不支持“共同核心在初始时刻便因域身份、裁剪或算子接线不同而产生
可测 RHS 差异”这一具体假设。它不排除共享实现错误，也不验证后续 RK 阶段、
非线性耦合、辅助约束控制或物理边界。

## 3. 扩域释放的旧固定节点确有非零导数

原域分区始终按原来的两层 halo 定义：lower_only、upper_only、mixed_lower_upper
与 active 互斥且覆盖全原域。下表为全部 58 槽的最大绝对差，不是 H/Ricci 误差：

| 原域节点数 | upper-original 的 upper_only | both-upper 的 lower_only | both-upper 的 mixed |
|---|---:|---:|---:|
| 17 | 2.18194e-7 | 3.27273e-5 | 9.57506e-8 |
| 25 | 3.94660e-8 | 6.45578e-6 | 1.75505e-8 |
| 33 | 1.19869e-8 | 2.04147e-6 | 5.39585e-9 |

这些节点在某个小域中被规定为零 RHS，而扩域后部分节点成为可演化点。
非零差异符合这两种运行合同的区别，本身不是某个边界错误或反射率的证明。
每个完整分区的原始结果都在收据中；没有只保留上表的较大数值。

## 4. 导数模板支撑与“静态初态”的限制

对核心节点的几何支撑包络检查显示：

- 半径两格的 FD4 一阶导数包络，在全部九例中都不触及固定层。
- 半径四格的复合导数包络，在最粗原域可触及 98/125 个核心节点的固定层支撑；
  最粗高侧扩域为 61/125，两侧扩域为 0/125。
- 另两档间距的三个域均为 0/125。

这是保守的笛卡尔包络，不是非零模板系数的逐项清单，更不是测出的影响强度、
传播速度或因果依赖域。尤其不能用最粗网格的几何重叠，直接解释最细两档的
T=1M 收敛失败。

共同核心的初始 RHS 也不是全零。三档原域均有 14 个非零槽：六个 A_ij 分量、K、
Theta 和六个非对角 B_k^i；其余 44 槽严格为零。这里 B_k^i 是 shift 的导数辅助场，
不是 Gamma-driver 的向量 b^i。

例如原域 K/Theta 的核心 RMS 分别为：

| N | K RHS RMS | Theta RHS RMS |
|---|---:|---:|
| 17 | 8.73095e-7 | 6.24662e-7 |
| 25 | 1.72091e-7 | 1.23030e-7 |
| 33 | 5.44088e-8 | 3.88869e-8 |

这些是本次实际离散导数，不是精确静态解的非零物理演化。跨域相同不能被解释为
精确平衡保持。所有槽的范数已按协议保存；本节从中归纳，不增加或重评收敛门槛。

## 5. 下一步：区分后续传播与固定层干预

下一批不应再仅重复扩域或减小时间步。具体顺序为：

1. 在相同初态与既定设置下，记录首个 RK4 步各阶段的场差与 RHS 差，按到原固定层
   的网格距离定位差异首次出现的位置。离散模板跨阶段的扩展不能冒充物理信号速度。
2. 如果阶段对照支持固定层差异向内耦合，另立同一大域、相同曲率背景的固定层干预：
   对照只改变指定旧壳层是否参与演化，避免把“释放旧固定点”和“新增更高曲率区域”
   始终绑在一起。干预必须显式标为诊断，不混入标准运行合同或科学检查点。
3. 对非对角 B_k^i 等辅助场的初始源项逐项核对，区分离散 ordering 约束源与后续传播；
   本轮没有关闭该机制，也没有证明其导致最终 H/Ricci 异常。
4. 只有得到可区分机制的结果后，才修改算子或边界。不得删除辅助约束项、扣除解析残差、
   重注入内部解析状态、缩短验收窗口或降低旧门槛来追求通过。

以上是基于本轮结果的后续实验选择，尚未执行。原域与高侧扩域的 T=1M 细网格
H/Ricci 阶数仍分别为 2.63714/2.81285 与 2.68200/2.84553；三域旧失败均保留。

## 6. 工程验证、来源与资源

- 新工具首次 46 项测试通过；增加非整数输入拒绝覆盖和运行记录后，最终新子集为
  **50 passed**。它们包含在最终合并回归中，不能重复累加。
- 最终合并定向回归 **445 passed in 24.70s**：沿用 Schwarzschild 脚本测试集合，
  加 exterior_window、Schwarzschild、checkpoint、gauge_profile、Einstein constraints、
  FO RHS、manifest、旧误差定位以及本次两个测试文件。不是全项目或浏览器测试。
- 四个本次 Python 文件通过 Ruff。保留既存 pytest-asyncio loop-scope 弃用提醒，
  未修改无关配置。
- 212 个源文件前后身份一致；另用文件哈希重核全部 212 个当前源码、298 个声明产物
  （包括源码快照、原生探针、构建日志及十份 RHS）和九份输入检查点，无不匹配。
- 哈希复核不是重新推导几何方程。本轮没有声称外部求解器复核、另一套物理公式验证
  或独立进程重新计算全部 Python RHS；实际原生探针分别在独立进程执行。
- 产物目录含收据总计 **168,330,607 bytes**，低于预设 384 MiB。
  新产物、编译临时目录及两次子集/一次合并测试的临时目录均在 E 盘。
- 末次资源检查 C 约 6.474 GiB、E 约 11.744 GiB，满足用户保留线。
  实验与回归进程均已退出 0，无本轮遗留的运行句柄。
- 未修改原 207 个冻结源码、旧原生演化二进制、美术、live 路径或任何旧科学阈值。
  未清理、移动、安装、提交、推送或检查父仓库。

科研规范用于冻结对照条件、保留旧失败和限制归因；测试规范用于坐标、覆盖、坏输入和
资源拒绝检查。工具测试与瞬时一致性均没有提升物理准入。

physical_validation、physical_boundary_validated、black_hole_evolution_validated、
amr_validated、waveform_validated、gpu_validated、runtime_writeback、
scientificPayloadWriteback 仍全部为 false；完整 goal 保持 active。

## 7. 可追溯入口

- [本次实验收据](../../tmp/nr-shadow-evidence/nr-k3-initial-rhs-locality-v1-20261008/receipt.json)
  SHA256 `015b8b831c7a3b7042c2325279a611bfd943b0cc36abed07f1d1892187e7c9bf`。
- 协议 SHA256 `4368d885b8640d3ae51d2030444f2bce7d43c60f5ee8930edfcc7af5f5b6b1f6`。
- 本次探针 SHA256 `2e2b6e559c29abad80f129fce14149844bd6ef58cccbf29c9a11683b5fc16197`。
- 单线程/四线程 N17 RHS SHA256
  `cb797e111046ffdcbe945a3a6e344dbe065565b0dcf54c4aba192235404d26ac`。
- [前序误差定位](RESULTS-20261008-error-localization.md) 的分析 SHA256
  `482420cef8dbb07276c75da3a4456f3f73ddf9424cdfad4e55a4ea14cdfa9e3a`。
- [运行入口](../../scripts/run-nr-k3-initial-rhs-locality.py)，
  [纯诊断模块](schwarzschild_rhs_locality.py)。

本次执行：`D:\python\python.exe -B scripts/run-nr-k3-initial-rhs-locality.py`
加 `--output-directory E:\86137\myai\solar_sim\next-web\tmp\nr-shadow-evidence\nr-k3-initial-rhs-locality-v1-20261008`。
该目录已存在，不能覆盖重跑。

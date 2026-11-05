# 周期邻点缓存：保持结果的 Windows 原生 CPU 优化

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: implement and run, output-preserving optimization
- Origin Date: 2026-10-07
- Verification Status: BOUNDED OUTPUT-PRESERVATION AND LOCAL SPEEDUP VERIFIED; physical gates unchanged
- Version Label: topology_cache_v1

## 问题与不变项

上一轮七组剩余误差实验的空间门禁失败，并触及 30 分钟执行上限。
本轮只降低周期邻点寻址成本，为后续更高空间精度实验提供 CPU 容量，
不改变 FO-CCZ4 方程、二阶空间模板、RK4 运算顺序、规范、初值或物理验收阈值。
不能用本轮性能/兼容性通过代替上一轮失败的空间精度门禁。

候选 0.2.1 为每格预计算六个邻点索引，由全部 RK 中间态共享不可变表。
在检查点元数据和完整 payload 验证后重建缓存，不序列化地址或缓存。
物理状态 checkpoint v1/v2 保持不变；manifest 只允许 kernel_version 从 0.2.0 到 0.2.1。

## 冻结基线与验收

基线 121 个源码文件与原二进制已在修改前逐项复核并归档：
`E:/CodexData/nr-k3-topology-cache-v1-20261007/baseline-source/`。
原收据 SHA-256 为
`86202287af446853ade39ac06d8c6ce710e4c56929ee32900fc91fcbfbc80f48`，
原可执行文件 SHA-256 为
`818b4421ad27b4e40135a75d863b2f0d8c7119eddc3700bfb3cb9b33c30962ef`。
以相同已安装 MSVC/CMake Release 配置分别新编译归档基线和候选，不安装工具。

1. C++ 单元入口直接包含实际求解器：5/6/8/9/13/17/25³ 全格、三轴、两方向邻点
   与独立坐标取模参考完全一致；58 槽导数逐位一致；RK 状态复制共享缓存；
   缺失/错误网格缓存必须拒绝。实测 OpenMP 线程组必须为 4。
2. 同一输入下，基线新编译结果与保留旧二进制比较；候选与新基线的完整 checkpoint
   必须逐字节相等。manifest 仅允许上述版本差异，其他字段均须相等。
3. 功能集覆盖 legacy analytic (5³)、legacy 动态波 (5³)、profile 动态波 (9³)、
   profile Minkowski (6³)，以及 legacy (5³)/profile (8³) 两种 58 槽三维独立扰动
   （固定 PCG64 seed=20261007、1e-5）；dt=1/512、元数据振幅1e-4。
   每个 case 比较 1/4 线程、直接8步/4+4重启、旧→新与新→旧重启。
4. v1/v2 坏输入覆盖截断、尾随字节、错误点数、非有限场、负定度规、错误 profile，
   必须非零退出且不产出 checkpoint/manifest。保留失败日志。
5. profile 非平面扰动做独立 Python/C++ 一步比较，58 槽最大绝对差 <=2e-12。
6. 性能测量使用预定网格 13³ 与 25³，profile gauge-wave、dt=1/512、
   16步、4线程。每个网格两版本各预热1次，再做6组配对、AB/BA交替次序；全部运行
   含进程启动、初始化和文件输出，保留原始墙钟时间，不选择最快样本。
   每个网格中位数比值（旧/新）>=1.10，且至少5/6配对候选更快才声称本机有限提速。
   所有计时输出也必须保持逐字节状态一致。不是通用/HPC/长跑性能结论。
7. 验收脚本拒绝缺样本、意外版本/字段差异和非有限计时，测试覆盖这些拒绝路径。

新实验目录下保留冻结协议、源码、编译日志、所有结果与收据。
总运行上限1200秒，单进程上限180秒，输出预算256MiB、磁盘预留1GiB。
执行失败不自动重试；更改设计必须另起实验身份，旧记录保留。

## 结果

### 完成与数值兼容性

新旧双构建、全部验证和配对计时在 **332.941 秒** 内完成，112 条命令，
`completed=true`、`passed=true`、`errors=[]`。这里的 passed 仅指本协议的
输出保持与本机短跑提速，不是动态 Einstein 物理验证。

- 实际 C++ 入口完成 **145,902** 次邻点索引比较和 **4,231,158** 次 58 槽
  导数逐位比较；缓存共享、坏缓存拒绝和真实四线程探针通过。
- 六类功能 case 全部通过：归档二进制与新编译基线一致，候选完整检查点
  逐字节一致，1/4 线程、直接/拆分、旧→新和新→旧重启均一致。
  manifest 只有预定的 0.2.0→0.2.1 版本变化；不能称全部 manifest 字节也未改变。
- 12 类 v1/v2 坏输入分别在新旧版本中执行，共 24 次拒绝；均无输出文件。
- 8³ 三维、58 槽独立扰动的 Python/C++ 一步最大绝对差 **2.62635e-16**，
  小于 2e-12。它是实现一致性，不是独立物理解基准。

### 本机配对计时

环境为 i9-13900HX（24 核/32 逻辑处理器）、Windows 11 10.0.26200，
MSVC 19.44.35224、Windows SDK 10.0.26100、OpenMP 2.0，实际使用 4 线程；
Python 3.12.3、NumPy 2.2.6。未设置核亲和性、锁定频率或隔离其他桌面负载。

| 网格 | 旧版中位秒数 | 候选中位秒数 | 中位数比值 | 候选更快配对数 | 配对比值范围 |
| --- | ---: | ---: | ---: | ---: | --- |
| 13³ | 5.524771 | .863501 | **6.3981×** | 6/6 | 5.9118–6.5436 |
| 25³ | 28.177498 | 4.295142 | **6.5603×** | 6/6 | 6.4120–6.7228 |

每组均是预定16步，时间包含原生进程启动、初始化和输出，不包含随后 Python 读回验证。
每个网格的两个预热样本排除于统计，12 个配对样本全部保留。
原始六组时间如下，顺序为配对0到5，并不是从小到大选出的样本：

| 网格/版本 | 六组墙钟秒数 |
| --- | --- |
| 13³ 旧 | 5.576426, 5.545905, 5.580277, 5.503637, 5.502897, 5.416766 |
| 13³ 候选 | .862535, .864467, .854482, .841070, .908090, .916257 |
| 25³ 旧 | 28.049547, 27.911599, 28.305449, 27.823064, 36.883169, 36.385259 |
| 25³ 候选 | 4.309212, 4.246286, 4.210381, 4.281072, 5.752182, 5.637980 |

25³ 最后两组两版本共同变慢，原因未测定，不能写成已确认的温度或后台负载问题。
配对比例仍满足预定门禁，且全部计时 checkpoint 都逐字节一致。
这些数据不能外推为持续长跑、其他硬件、GPU 或大规模 HPC 性能。

### 证据身份与回归

| 证据 | SHA-256 / 状态 |
| --- | --- |
| `campaign-v1/receipt.json` | `23c2cf755c475019f35af6efdc4798605508d0eba83649bdacb01b96785fd34b` |
| 冻结协议 | `0512f6e26ac1d815a4393ce8dcde51fa1eceacf523825715cfd0d52b45f536b2` |
| 0.2.1 C++ 源文件 | `719bc9aef232c02399238da9bf163bb71fb4eabccc6dfb50b3dbb276619ff651` |
| 0.2.1 原生可执行文件 | `fe8cc287618fb6fb82e59aafb3ca26ae5dbbd99baa958bbb88620260b14d705d` |
| 新编译 0.2.0 基线可执行文件 | `fc10fd27b38961a6a25588ded7a844a4b41f0981db502d78d4fd7ba86ba8e84f` |
| 补充 legacy 回归收据 `regression-v1/receipt.json` | `761e4def5dfb428890a0826645e7aa465778b31a14cb0da9c1a6dd524644ec16` |
| 本次源身份 | 124 个文件，运行前后不变；旧 121 个源码归档及原二进制也不变 |
| 本次 artifact | 459 个清单项；含收据共460个文件、128,414,967 bytes |

以上路径以 `E:/CodexData/nr-k3-topology-cache-v1-20261007/` 为根。
新编译与保留的旧二进制文件哈希不同，因此不声称可执行文件可复现构建；
六类功能输出的逐字节重现已单独验证。更新本报告不改变目录中的冻结协议。

补充 legacy analytic/动态 RHS 两个既有验证入口均通过，涵盖各自 Python 对照、
辅助排序 fixture、线程/重启与 manifest 检查；其临时输出由既有入口管理，
补充收据和日志保留，不能与本协议中完整保留的 checkpoint 混为一谈。

Python 定向回归 **91 passed in 12.86 s**（其中23个新入口测试）；相关 Ruff 检查通过：

```text
python -m pytest scripts/tests/test_nr_topology_cache.py science/numerical_relativity/test_fo_ccz4_checkpoint.py science/numerical_relativity/test_manifest.py science/numerical_relativity/test_native_msvc_audit.py science/numerical_relativity/test_fo_ccz4_gauge_profile.py -q
```

这是定向测试，不是全科学套件的新结果。既有 pytest_asyncio 配置警告未修改。
复现主入口需选全新输出目录，不覆盖 `campaign-v1`：

```text
python scripts/run-nr-k3-topology-cache.py --archive E:/CodexData/nr-k3-topology-cache-v1-20261007 --output-directory <fresh-directory> --vs-install "C:/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools"
```

### 不变的科研边界

此前七组剩余误差实验的空间失败完整保留，没有重新打分、删粗网格或缩放诊断。
本次只提升可用 CPU 容量，不改变任何方程。下一阶段必须把四阶空间选项与
checkpoint/manifest/辅助场 order 一并版本化，见
[源码与一手实现核查后的接口清单](NOTE-20261007-spatial-order-contract.md)。
空间收敛、强双曲性、物理边界、黑洞、AMR、CUDA、长时稳定性仍未通过；
live 与 scientificPayloadWriteback 保持 false，美术层未修改。

# 原始非线性剩余误差实验的显式检查点续算

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: bounded checkpoint continuation, only after confirmed termination
- Origin Date: 2026-10-07
- Verification Status: EXECUTION COMPLETE; spatial aggregate FAILED; shadow only
- Version Label: remainder_continuation_v1

## 不改变的科学问题与门禁

完整继承 nonlinear-remainder-v1 的七个case、九个时刻、源代码、C++0.2.0二进制、
初值、规范与全部振幅/空间/时间阈值。不得更换指标、删去不通过的粗网格，
也不得把较低残差或一次小步跨后端一致性当成物理验证。

## 续算前提与行为

1. 原始执行必须已经权威确认停止。Windows OpenProcess/GetExitCodeProcess
   仍显示活动或状态查询失败时拒绝启动；有收据文件本身不等于旧进程停止。
2. 显式提供原始终态收据的 SHA-256。只接受 completed=false、纯时间上限错误、
   前后源码/二进制身份一致且上游证据未变的收据；其他失败需要先调查。
3. 验证全部原始 artifact 哈希；case必须是预定顺序的连续前缀，只有末case可以不完整，
   每case已记录时刻也必须是无缺口前缀。重新解码每个接受的 checkpoint 并核对元数据。
4. 只从收据明确记录的最后有效 checkpoint 继续；未记录的尾部/失败输出不作为输入。
   完成的case不重跑，已接受片段不重算。未开始的case按同一固定初值策略创建。
5. 写入全新目录，原收据、错误日志、checkpoint和其 completed=false 状态原样保留。
   新收据指向原始收据并记录继承样本与新增命令。合并证据后仍使用原 assess_remainder。
6. 新增一次9³末态Python/C++续步检查（若原轮尚未执行），不把它当成一般物理基准。
7. 独立资源上限600秒、单段180秒、输出预算32MiB、磁盘预留1GiB。
   没有自动循环重试；失败保留并报告。这个补充执行不把原1800秒运行改写成成功。

该入口在原实验仍运行时仅创建为独立脚本/测试/协议，不修改原实验冻结的119个源码文件。
实际启动必须等旧进程终止，并再次核对当前源码与原始输出；新的控制脚本和测试也单独入哈希。
所有 physical/black-hole/CPBC/AMR/CUDA/default-initializer/live/writeback 标志仍保持 false。

## 结果

### 执行、继承与身份

原进程 PID 37960 权威确认停止，原始超时收据及 208 个 artifact 的哈希复核通过后，
才启动本补充执行。前六个完整 case 原样继承；只计算最后时间控制的八个 128 步片段，
再做一次 9³ Python/C++ 续步，共九条新原生命令。七个 case 现均有九个采样，
原收据仍为 `completed=false`，其超时错误在新收据中保留。

新执行耗时 **267.959 秒**，`completed=true`、`errors=[]`，但
**`bounded_remainder_gates_passed=false`**。这是执行完成，不是科研准入通过。
时间控制与对应空间基线的初始 58 槽完全一致。

| 证据 | 值 |
| --- | --- |
| 原始收据 SHA-256 | `94ebbfeb83bc8df0af286b1d21fdd333e14ca5518ad97af09a68fa535fe81ca5` |
| 新收据 | `E:/CodexData/nr-k3-remainder-continuation-v1-20261007/receipt.json` |
| 新收据 SHA-256 | `86202287af446853ade39ac06d8c6ce710e4c56929ee32900fc91fcbfbc80f48` |
| 新运行前冻结协议 SHA-256 | `615ea4b62b862c3a7de15d8a2d3c651ba3d91ded5b76b9f4c027dca075bc6497` |
| 源码身份 | 121 个文件，运行前后均一致；包含两个新增控制/测试文件 |
| 新 artifact 清单 | 38 个，无漂移；含收据共 39 个文件、9,151,983 bytes |
| C++ 版本 | 0.2.0，未修改 RHS、差分、规范或默认初始化 |
| C++ 源文件 SHA-256 | `081e934f666325e57fc82e940c80ca5f1aa106c0d772d2d9d3e07995adfaf8ce` |
| 可执行文件 SHA-256 | `818b4421ad27b4e40135a75d863b2f0d8c7119eddc3700bfb3cb9b33c30962ef` |

### 空间门禁：四个场均有失败项

以下每格依次为 9→13 / 13→17 / 17→25 的观测阶。
预定条件是窗口 RMS 和采样峰值的全部相邻网格对均达到 1.5；不删除粗网格。

| 场 | 窗口 RMS 阶 | 最大采样空间 L2 阶 | 总判定 |
| --- | --- | --- | --- |
| H_primary | 1.018867 / 1.350816 / 1.726569 | 1.215094 / 0.800807 / 1.656426 | 未通过 |
| H_fourier | 2.042544 / 1.858569 / 1.987507 | 2.238771 / 1.308560 / 1.917364 | 未通过 |
| M_x | 1.009794 / 1.769814 / 1.872814 | 0.951730 / 2.198895 / 1.610287 | 未通过 |
| Theta | 1.371995 / 1.970728 / 2.022268 | 1.217340 / 2.582612 / 1.866426 | 未通过 |

独立 Fourier H 的窗口 RMS 接近二阶，但其 13→17 采样峰值阶仍失败。
因此不能把全部失败归因于 primary 诊断的高频衰减；M_x 和 Theta 的粗网格阶
也未通过。完整逐时刻场、点态阶、范数及模态保存在收据关联的行文件中。
部分时刻仍非单调，不能由窗口平均量推出连续时间窗收敛。

### 振幅、时间与跨后端检查

四个场的两个相邻振幅阶均在 **[1.999991, 2.000004]** 内，
完整有符号场的二次振幅缩放最大相对差为 **0.0808471%**，低于 5% 阈值。
这支持所测小振幅剩余项的二次缩放，不是非线性强场验证。

时间步 1/512→1/1024 的完整场差异如下；比例均以细时间步场为参考，
不是两次范数之差。

| 场 | 窗口差异 / 参考 RMS | 各采样时刻的最大相对差 | 1% 门禁 |
| --- | ---: | ---: | --- |
| H_primary | 9.17363e-6 | 3.94090e-5 | 通过 |
| H_fourier | 2.73422e-5 | 2.00305e-4 | 通过 |
| M_x | 2.64060e-8 | 8.81609e-8 | 通过 |
| Theta | 2.43060e-8 | 4.79569e-8 | 通过 |

最大单采样相对差为 **0.0200305%**；此检查只说明本控制中的时间步影响很小，
没有测定非线性 RK4 的四阶时间精度。9³ 末态独立 Python/C++ 一步续算，
全部 58 槽最大绝对差 **1.83081e-16**，低于 2e-12；两后端共享方程，
这不等于独立物理解验证。

全部采样点有限、正定，最大采样 CFL **0.292996**，
最大采样约束绝对值 **2.08808e-7**。这是九个采样点的检查，不是全部 RK stage
监控或长时稳定性证明。

### 测试、限制与下一步

以下定向回归 **78 passed in 7.81 s**；没有失败或跳过，相关 Ruff 检查通过：

```text
python -m pytest science/numerical_relativity/test_fo_ccz4_remainder.py science/numerical_relativity/test_fo_ccz4_linear_modes.py science/numerical_relativity/test_fo_ccz4_periodic_window.py scripts/tests/test_nr_remainder_continuation.py -q
```

覆盖剩余误差门禁、模态分析、周期窗口与续算拒绝路径。这不是新的全科学测试套件结果，
也不与历史 385 项结果相加。既有 pytest_asyncio fixture-loop-scope 警告保留，
本次没有为消除警告修改全局配置。

当前仍是周期、小振幅、短时间、特定初值的 CPU shadow。
连续时间窗收敛、强双曲性、物理边界、标准 AwA、黑洞、AMR、CUDA、
长时稳定性和默认初始化提升均未验证；live 与科学 payload 写回保持 false。

下一步应把两个问题分开：先做保持输出的 CPU 实现优化，验证所有状态和重启/线程结果
不变，再以新版本、新冻结协议研究更高空间精度。不得用改诊断倍率、删粗网格、
更换通过阈值或降低阻尼来把本轮失败改成通过。优化尚未实施、提速尚未测量。
修改数值源码前，应保存当前 0.2.0 原始源文件与可执行文件，保留此轮证据可复核性。

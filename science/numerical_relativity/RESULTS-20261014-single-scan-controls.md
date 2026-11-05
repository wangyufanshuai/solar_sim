**单次全量扫描候选：等价、故障与性能控制结果**

日期：2026-10-14，Asia/Shanghai。方法 nr-single-scan-controls-v1。Origin Skill: academic-research-suite / experiment-agent。Verification Status: VERIFIED for this bounded control batch only。

**结论**

新增扫描器和明确注入该扫描器的独立入口已经实现。本批一次执行完成，42/42控制通过，正常静态域路径/文件/目录/逻辑字节逐项相同；故障关闭、原资源保护和Windows所属进程清理控制通过。候选具备在明示正常域内接入后续受限实验的控制证据，不代表物理、全方向、时间演化或live准入。

性能不是全面加速：旧超时完整目录的guard中位耗时132.81365 ms→104.52675 ms，旧/新比1.27062；已接受父目录则74.09710 ms→77.35700 ms，候选略慢。不能将旧诊断的309.481 ms与本批104.52675 ms拼成候选提速比，也不能用本批推断原600秒中各阶段的实际占比。

**执行与完整性**

- 唯一批次：[nr-k3-single-scan-controls-v1-20261014](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-single-scan-controls-v1-20261014/qualification-gate.json)。passed=true、completed=true、errors=[]；外层退出码0，无重试。
- 监护总时长94.813秒；工作进程80.312秒；测试日志42 passed in 4.65s。600秒预算没有改变。
- 26个测试函数经显式参数表登记为42项，JUnit逐函数数量匹配，无失败/错误/跳过；继承的pytest筛选和外部插件参数清空。另保存20个预热、120个正式计时样本，全部身份/返回值/时间/汇总通过finalizer核验。
- 570个来源文件完整快照，5,034,697字节；源码、快照及前后来源表相同。10个历史目录/6,858文件摘要前后相同，包含旧失败批次与成功诊断。
- 产物清单728项另加最终终态，729文件共9,820,721字节（9.36577 MiB）。运行后另用独立stdlib读取逐项重算728个SHA-256，全部匹配。
- Windows Job已分配，所属进程清理确认，最终active_after_cleanup=0。原监护源码SHA-256仍为58d535413f7aca0c088c085994bb7eaf507dd41a1dd6b1df1f2a471d41e5bba1。
- 终态SHA-256：376eaea8e34fe4b1c9adac48b1e620ae39afc6dadba919df8f65c886ad9c17f2；工作回执SHA-256：f9ca6f5f65e39575f83f5e6225c90a4797f10e7479a4c47f84f548d32d66e9f1。

冻结前四个新增Python文件的AST与Ruff检查通过。此次没有重跑项目全套测试，也没有修改旧数值方法源码。复现环境为当前Windows机器与D:/python/python.exe；这不是独立机器复现。

**同批性能结果**

每格是6个正式样本的中位数，单位ms。guard包含新鲜扫描、限额及磁盘检查；scan单独测遍历。元数据已预热，机器未隔离其他负载。奇偶轮反转操作/目标顺序；原始线程CPU和墙钟数据全部保留。旧/新比大于1表示候选较快。

| 目标 | 文件/子目录 | 旧scan | 新scan | 旧guard | 新guard | guard旧/新 |
|---|---:|---:|---:|---:|---:|---:|
| 空目录 | 0/0 | 0.20035 | 0.18730 | 0.30055 | 0.27335 | 1.09951 |
| 旧失败源码快照 | 558/17 | 13.15095 | 14.04370 | 16.72945 | 15.72770 | 1.06369 |
| 旧ray-0 | 99/91 | 21.77890 | 15.79080 | 23.12700 | 15.71220 | 1.47191 |
| 旧完整失败目录 | 1087/482 | 140.89955 | 113.43765 | 132.81365 | 104.52675 | 1.27062 |
| 已接受低阶能量父目录 | 1035/231 | 75.03225 | 61.38785 | 74.09710 | 77.35700 | 0.95786 |

guard与scan是不同独立采样，不将两列相减当成精确开销分解。每目标只有6个样本；不宣称置信区间、冷缓存或长期机器无关加速。候选增加了目录身份和扫描中截止保护，这些工作也计入新guard。尚不能保证完整八射线在600秒内完成。

**故障与适用边界**

保留64 MiB总输出、600秒、2 MiB终态预留、8 MiB源码快照及C>=3 GiB、E>=4 GiB+32 MiB的保护，启动另留完整输出预算。64 MiB不是内存上限。additional/headroom和读写前检查不删除，磁盘查询结束再检查截止。

四个真实嵌套控制分别留下：成功终态；超时失败终态（清理前6个所属活动进程，清理后0）；退出码7崩溃失败终态；退出码9内层资源拒绝失败终态。这三种失败是预登记负控的预期结果，不是被删除或改为成功的实验失败。外层实际磁盘/时间保护始终启用，未真实耗尽磁盘。

真实文件覆盖追加、截断、创建、硬链接、Unicode、深目录；删除可见性、根消失/替换、读取错误与异常元数据通过测试进程内受控注入完成，底层条目保留，避免与外层监护刻意竞争。没有证明任意并发真实删除、对抗性路径替换或原子快照安全。每次新鲜遍历；不跨次缓存大小。异常域比旧glob更严格，不能宣称所有失败分支行为等价。

原物理阈值2e-12、integration_steps=0、matrix_evaluations=0、native_calls=0；eight_ray_rerun/full_scientific_matrix_executed/new_scientific_evolution/gpu_executed/old_failure_regraded/physical_gate/live_admission/scientificPayloadWriteback均为false。后续方向v2必须有单独协议、新输出目录和完整验收，不能把扫描控制结果直接计为方向或能量结论。

相关实现：[候选扫描器](E:/86137/myai/solar_sim/next-web/scripts/nr_single_scan_control.py)、[控制入口](E:/86137/myai/solar_sim/next-web/scripts/run-nr-k3-single-scan-controls.py)、[控制测试](E:/86137/myai/solar_sim/next-web/scripts/tests/test_nr_single_scan_control.py)、[冻结协议](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/EXPERIMENT-20261014-single-scan-controls.md)。

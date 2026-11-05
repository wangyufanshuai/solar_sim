# 只读复算证据完整性复查通过（2026-10-13）

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: read-only file and recorded-terminal integrity verification
- Origin Date: 2026-10-13
- Verification Status: FILE INTEGRITY VERIFIED; NO NEW NUMERICAL EXECUTION
- Version Label: nr-constraint-symbol-readonly-integrity-20261013

## 本次范围与结论

2026-10-12的独立只读复算已经完成并保存终态。其后恢复会话时的附加文件
哈希核查因E盘低于用户规定底线而中止，不能把那次不完整的文件核查算作
全部通过。2026-10-13重新确认C/E余量充足且未发现相关运行器进程后，完成
了文件完整性核查。没有重跑复算程序、pytest、N9/N13、原生/GPU程序或时间
演化；没有清理、移动、改写旧证据或修改科研方程。

本次核对的是当前文件与已固定回执的SHA-256、目录条目及逐例进度记录，
不是新数值实验，也不是不同实现的独立物理验证。哈希核查命令退出码0，
核查段用时1.9851134秒；这不是原只读复算的耗时。

| 核查对象 | 当前结果 |
| --- | --- |
| 原控制批次索引产物 | 770/770 哈希一致 |
| 独立只读复算索引产物 | 516/516 哈希一致 |
| 原资格化源码 | 489项当前文件与复算快照均一致 |
| 复算审计来源 | 2项当前文件与复算快照均一致 |
| 逐例进度与最终回执 | 21/21 内容一致，每例记载13个数组 |
| 原生身份 | 7项源文件、4项生成文件及可执行文件哈希一致；未执行 |
| 原批次实际文件数 | 771，等于770项索引加最终回执 |
| 复算批次实际文件数 | 517，等于516项索引加最终回执 |
| 复算目录总字节数 | 4,546,947，按逐文件Length求和 |
| 复算源码快照 | 491文件、4,328,272字节，低于已授权8MiB上限 |

以上共2279次清单哈希比较（包括同一来源在当前文件、快照及不同清单中
重复出现的比较），另核对两个顶层回执和原生可执行文件身份。不能把2279
当成独立源码数量。原始数组属于原批次索引，已包含于770项哈希核查中；
本次没有再次求值这些数组。

## 固定回执身份

原控制批次：
`tmp/nr-shadow-evidence/nr-k3-constraint-symbol-controls-v1-20261011`

- `qualification-gate.json` SHA-256：
  `46199dc7bf8e710bd8dc1261f368c50b41a848980e901660cfdb36ce109c7dfd`

独立只读复算批次：
`tmp/nr-shadow-evidence/nr-k3-constraint-symbol-readonly-v1-20261012`

- `replay-terminal.json` SHA-256：
  `2cccb52dfdc6bb336a0e3881fbc7e93b89b8e88f71fd3d7e31610886aed66dbc`

只读复算回执仍为`completed=true`、`passed=true`、
`independent_replay_passed=true`，记录21例/273数组精确复算一致，用时
22.532秒。它仍记录`tests_reexecuted=0`、`native_calls=0`、
`integration_steps=0`。这些数值属于2026-10-12的原复算，不是本次新跑。

更早的附加复核句柄49295终态仍为`unconfirmed-preserved`；本次成功核查
不追认其成功，也不能补出旧执行的未知耗时。以前因磁盘底线中止的文件
检查同样保留为中止，不改写历史。

## 资源与科学边界

本次开始时C约15.30GiB、E约19.16GiB；核查段结束时C约15.42GiB、
E约19.16GiB。原C>=3GiB、E>=4GiB+32MiB底线未变；哈希检查每100项
以及开始、结束均检查底线和600秒上限。没有启动新的64MiB数值批次。
本报告是冻结闭包外的新增说明，旧快照、回执及失败记录不变。

科研复现技能在本次用于区分文件完整性、相同实现的数值复算与物理验收，
并保留中止及未知终态。没有统计推断、效应量或显著性分析。

`physical_gate=false`、`live_admission=false`、
`scientificPayloadWriteback=false`继续保持。共同能量估计、约束边界、
非线性稳定、科学收敛及最终NR目标均未因此完成。

现有方向能量矩阵草稿和其100项新测试/52项回归计划不在本次只读资格范围
内，本次没有运行该新批次。进一步控制测试或物理实验须遵守其单独范围、
资源预算和所需授权，不能复用本次只读核查作为启动许可。

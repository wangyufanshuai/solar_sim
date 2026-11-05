# N13原生续算v1：运行已中断，未产生新验收轨迹

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: read-only stopped-run evidence collection
- Origin Date: 2026-10-11
- Verification Status: PARTIAL ARTIFACT INTEGRITY CHECKED; SCIENTIFIC RUN INCOMPLETE
- Version Label: nr-native-gauge-continuation-v1-interruption-observation

## 当前事实与未知项

用户确认后，v1于2026-10-10 17:36:56 +08:00启动，采用冻结的396项来源、
原832MiB/2400秒预算和三档各追加7/14/28步的T=1/8合同。
2026-10-11恢复检查时，原执行会话45369已不存在，原驱动PID43140及相关
原生子进程均未运行。不能把会话缺失单独当作失败；此处同时核对了当前
进程状态和保存文件，确认该批已停止且没有最终回执。

现存最后文件是首段的`trace.attempt.json`，修改时间为2026-10-10
17:37:46.5615848 +08:00。未发现对应trace终止记录、原始阶段文件、接受点
日志、完成段日志、最终`receipt.json`或原拟定外层日志。

驱动退出码、确切停止时刻和原因均未知；不能声称为预算超时、数值门槛
失败、断电或用户终止。两个已结束检查点子进程的退出码均为0，但这不
代表驱动或完整实验成功。文件时间只标识最后保存活动，不是完整运行时长。

## 保留产物与验收边界

| 项目 | 现存证据 |
| --- | --- |
| 全批文件 | 422个，30832927字节 |
| 当前/保存来源 | 396项，逐项一致 |
| 父级快照 | 8项，逐项与固定父证据一致 |
| 已发布检查点 | 粗档绝对步8、9，共2个 |
| 原生线程 | 第一步2线程；新进程恢复后第二步4线程 |
| 新增已验收科学步 | 0/49 |
| 保存的完整RK阶段 | 0；缺少首段独立复算 |
| 到达T=1/8的案例 | 0/3 |
| 新时间阶数分析 | 未计算，不归类为passed/unresolved/failed |
| 完整回执审计 | 无回执，不能执行或声称通过 |

只读检查重新验证了完整父级与两组控制证据，独立重建三案例注册和入口测试
资格，核对396项当前源码/快照及8项父快照。两个检查点通过原二进制读取器
和manifest一致性检查，包括校验和、状态/计划/运行库身份、绝对步号、时间、
有限性、正定度量、原规范域与2→4线程恢复输入。首段初态逐字节连接到已
验收父粗档绝对步7；全部边界目标与原reference一致。

这些是产物完整性与协议检查，不是独立Einstein RHS或阶段演化验证。缺少
trace使两点仍未验收，不能从它们接续科学轨迹，也不能将父49步改记为本批
进展。原T=1/16面区域unresolved及历史失败均不变。

## 指纹与证据

- [只读中断观察及完整422文件索引](../../tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v1-interruption-observation-20261011.json)
- [原全局注册](../../tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v1-20261010/global-plan.json)
- [首段尝试记录](../../tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v1-20261010/native-gauge-continuation-13-7/segment-0007/segment-attempt.json)
- [未完成的复算尝试](../../tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v1-20261010/native-gauge-continuation-13-7/segment-0007/trace.attempt.json)

全局计划SHA256：`f10cf3db336248e93fb2a7f1e767a0bad1175c127e2373322bc1bfe7e04ae560`。
396项来源表SHA256：`aacd3b540cfaab8d751abc1942c154f012aab111d39a516b6e5f018820f2b218`。
422项产物表SHA256：`b62e861f7daf7072f85192b04ba856a5d52f8cc6090458962e88d568a6e52edc`。
表摘要均按原`native_campaign.json_bytes`规范计算。

## 后续处置

没有补造原实验的最终回执，没有修改、删除、覆盖或提升旧产物。中断观察
单独保存于旧目录之外，不冒充科学回执。

获用户再次明确确认后，v2于2026-10-11 09:34:29 +08:00在新目录
`tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v2-20261011`启动。
仍从原已验收T=1/16父末点开始，各追加7/14/28步；不使用本次未验收点，
不修改初值、步长、阈值、预算或396项冻结代码。v2随后完成49步和独立保存
数据审计，时间筛查仍未整体分辨，详见[独立v2结果](RESULTS-20261011-native-gauge-continuation-v2.md)。
它不补完或重新评级本v1批次。

始终shadow-only，physical_gate=false、live_admission=false、
scientificPayloadWriteback=false。美术、live dynamics和旧科学结论未改动。

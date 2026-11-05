**case12 八射线 v2：600秒停止，整批未通过**

日期：2026-10-14，Asia/Shanghai。Origin Skill: academic-research-suite / experiment-agent。Verification Status: FAILED / INCOMPLETE bounded batch；失败原因是运行截止，不是已观察到数学反例。

**结论与当前门槛**

新v2入口已开发并实际执行一次：8项入口结构控制和原16项数学控制通过；8个登记探针中4条完整、第5条部分、其余3条未运行。600秒监护截止后停止所属进程，整批passed=false、completed=false。没有自动重试、续算或补写成功标记。

P0扫描器控制通过仍有效，但候选扫描器未使本次八射线批次在原预算内完成。v1旧批完成5条而v2完成4条，两次负载、缓存和新增证书保存范围不同，不能据此单独归因扫描器快慢；可以明确的是本次完整性门槛没有关闭。当前不能宣称八射线全通过、全方向证明或科学准入。

**运行回执**

- [最终失败终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-direction-section-controls-v2-20261014/qualification-gate.json)：错误ResourceLimit: registered control deadline reached。监护记录600.0秒，所属worker退出码125；外层命令退出码1。
- Windows Job已分配；清理前4个所属活动进程，清理后0，cleanup_verified=true。原64 MiB/600秒/2 MiB终态与C/E底线保持不变。
- 终态文件SHA-256：161f8bfbe6bbad1a0842399238aa280bcdc412b24447e8291bafadbf0085a292；独立只读重算终态自摘要一致。
- 8项入口控制为1个有效结构接受、7个预登记变异拒绝，明确标记synthetic_contract_fixtures=true、mathematical_cases_executed=0。原数学JUnit为16项、0失败/错误/跳过；日志16 passed in 0.67s。
- 停止后共1,129文件、10,422,338字节（9.93952 MiB）。这不是成功终态的最终产物清单；失败终态artifact_hashes为空。

| 探针索引及向量 | 当前状态 | worker开始/完成秒数 | 该探针已保存文件数 |
|---|---|---:|---:|
| 0：(1,2,-1) | 完整局部记录 | 23.063 / 70.391 | 112 |
| 1：(1,0,0) | 完整局部记录 | 70.485 / 141.797 | 110 |
| 2：(0,1,0) | 完整局部记录 | 141.907 / 267.125 | 110 |
| 3：(0,0,1) | 完整局部记录 | 267.391 / 440.703 | 110 |
| 4：(-1,-2,1) | 部分；没有result.json | 441.032 / 未完成 | 82 |
| 5：(2,4,-2) | 未运行 | — | 0 |
| 6：(1,1,1) | 未运行 | — | 0 |
| 7：(1,-1,0) | 未运行 | — | 0 |

表中的时间是worker阶段日志相对时间，不能与监护600秒直接相减作为精确数学计算耗时。前三类时间、文件数量与局部布尔记录均不能替代整批finalizer验收。八个向量包含反向和同向倍尺度控制，不是八个独立几何方向。

**保留了什么、缺少什么**

完整局部记录保留原构造、右逆、闭合、反向主元商、能量内部恒等式、阈值比较和负控流程；新增zero、6个pair、6个action矩阵的保存。冻结前AST比较确认：移除纯证书保存语句后，v2逐射线数学循环与v1结构完全一致；AST语法与Ruff检查通过。这些检查只证明对应工程属性。

没有worker-result.json、ancestry-after.json、最终exact-checks.json或exact-mutations.json；682条残差和104份新增证书的完整集合未验收。独立finalizer没有完成，不能把前4条局部result或历史v1部分结果拼成新成功。

停止后进行一次独立、只读文件核对：573份源码快照与当前对应文件逐项SHA-256一致，快照5,088,067字节；ancestry-before登记的11目录/7,587历史文件全部仍匹配，包括P0成功和v1失败。这个事后完整性检查没有修改失败终态，也不补造本批未完成的前后闭合或科学资格。

**下一步决策**

保持顶层goal为active，P0局部控制已完成，P1完整有限方向仍未完成。不得自动再跑同一批、延长时限、删掉未运行方向、降低2e-12或重写旧失败。

性能工作应先区分精确计算、证据写入、全树检查与封存成本；这次没有采集这些阶段的可分离剖析，不能宣称某一项占全部600秒。若改成较少文件的证据容器，需要单独证明追加预算、异常中断前缀、非零负控残差、独立重放和来源恢复保持完整。仅更换扫描API不足以关闭当前运行成本问题。

可并行推进固定case12全实方向右逆的公式级证书：完整多项式系数验证与源表达式映射，范围先限制Dhat(v)S(v)=I43；它不能替代Dhat·K·(I−S·Dhat)=0、统一能量、谱或边界。具体后续边界见[goal状态](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/GOAL-20261014-top-tier-gr-development.md)。

本次无时间演化、native/GPU、完整科学矩阵或live接入；physical_gate=false、live_admission=false、scientificPayloadWriteback=false。现有Python/C++及全部失败记录保留。

相关文件：[v2冻结协议](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/EXPERIMENT-20261014-case12-direction-section-v2.md)、[v2入口](E:/86137/myai/solar_sim/next-web/scripts/run-nr-k3-case12-direction-section-v2.py)、[P0结果](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/RESULTS-20261014-single-scan-controls.md)。

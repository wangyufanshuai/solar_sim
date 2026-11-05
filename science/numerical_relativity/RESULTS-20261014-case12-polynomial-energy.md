# case12 完整能量：生产证书已保存，独立重放超时，整批未通过

日期：2026-10-14，Asia/Shanghai。Origin Skill: academic-research-suite / experiment-agent。
Verification Status: FAILED / INCOMPLETE bounded batch。失败原因是原 600 秒运行截止；本批没有完成科学资格验收，也没有观察到已完成比较中的数学反例。

本次已开发完整能量模块、独立 Fraction 重放、39 项控制以及冻结推导/协议，并实际运行唯一批次。生产算法保存全部 15 个主矩阵和 2 个负控矩阵，四项残差在生产结果中均为精确零。但是独立算法未完成全部重建和比较，最终 `passed=false`、`completed=false`。不能把生产 `acceptance.json` 的 true 当作最终资格。

## 运行与来源

- [失败终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-polynomial-energy-controls-v1-20261014/qualification-gate.json)：`ResourceLimit: registered control deadline reached`。
- run_id：`7a7891e9-8666-458a-ba26-bfdc313d6f56`；监护耗时 600.015 秒，所属 worker 返回码 125，外层命令退出码 1，重试 0。
- Windows Job 清理前 4 个所属活动进程、清理后 0；`cleanup_verified=true`。未停止其他工作负载。
- 原 64 MiB 输出、2 MiB 终态预留、8 MiB 来源快照及 C/E 空间底线保持；64 MiB 是磁盘输出限制，不是内存限制。
- 39 个唯一 JUnit 实例全部通过，21 个测试函数；0 失败、错误或跳过，日志 `39 passed in 2.66s`。没有在受控批次外补跑测试或数学。
- 来源快照 616 项、5,780,957 字节；父历史 18 目录、12,701 文件。生产输入包含 17 份 compression 父输入和单独绑定的 2 份 projectors 祖先 X/Pt。
- 终态文件 SHA-256：`f86f9a4f8d38bdb46cbe2e5e86ee75ae4e58d94a4b6ea0649c9986eede9f742e`。

冻结实现 SHA-256：

| 文件 | SHA-256 |
| --- | --- |
| scripts/nr_case12_polynomial_energy.py | 41e703c4c9f3c0186c64c4d847272f68c2d029ffe3e87fb3ac84ed6936eada6e |
| scripts/run-nr-k3-case12-polynomial-energy.py | e42e89b2e1920287f54b34237a180c51387bbb748dcd87791b8d726338c7cbeb |
| scripts/tests/test_nr_case12_polynomial_energy.py | 3c9d4d4f92ed0c898b622dfba17ea9c585d24296fef520929b6071704acfc510 |

## 已保存的生产结果

本节只描述生产记录，不代表独立验收通过。所有计算保持固定 case12 的 43 维约束商主部范围。

以已接受约分分子构造 Gt、八个 Fi、Hbar、Cgram、Hsym/HL/HP/Gram；主矩阵完整覆盖 27,735 槽。Hbar 与 Cgram 各有 981 个非零槽、180,061 项，最高次数 18，低于登记上限 20。四项残差的 7,396 槽全部为生产算法保存的精确零；阈值没有放宽。

生产 Cgram 来自每个实际 Fi Gram 的双线性展开，未设成 Hbar 减预期下界。三个零谱分支仍各自保留非零 Fi。Hbar[0,1] 加常数 1 的真实负控保存完整两矩阵，得到两个非零常数槽并在生产算法中拒绝；独立负控重放尚未到达。

生产算法另保存全部 1,849 个逐项系数绝对值界，给出候选单位球下界 1/14 以及候选上界

    C = 284697652602679297661770635172980193521320414461822369607942746629939710449
        / 4418505017704695003732950908670318312942981719970703125000000000000

这是生产 `bounds.json` 中的具体有理数，尚未完成独立复核，不能据此开启方向统一能量或强双曲资格。

## 独立重放到达的位置

| 阶段 | worker 相对秒数 | 已形成的证据 |
| --- | ---: | --- |
| 来源与历史入口完成 | 27.843 | 616 来源、12,701 历史文件 |
| 控制测试完成 | 31.234 | 全部 39 项通过 |
| 八个 Fi 全部保存 | 55.625 | 三个缺席谱分支也保留 |
| Hbar / Cgram 保存 | 175.703 / 177.703 | 两个完整生产矩阵 |
| 四项生产残差保存完成 | 206.406 | 7,396 精确零槽 |
| 生产候选及负控全部保存 | 209.922 | 15 主矩阵、2 负控与元数据 |
| Gt 和八个 Fi 独立比较完成 | 216.734 | 九个矩阵逐项一致 |
| NO/N0/N1/N2/N3 Gram 重建完成 | 222.703 / 303.750 / 357.859 / 450.828 / 491.797 | 各分支内部累计计算阶段记录 |
| N4/N5/N6 Gram 重建完成 | 499.343 / 504.468 / 510.468 | 三个缺席分支差分 Gram 未省略 |
| M1 / M2 action Gram 重建完成 | 535.703 / 569.047 | 前两作用分支阶段记录 |
| M3 及后续 | 无完成记录 | 未形成完整独立重放 |

阶段时间为 worker 相对时间；监护时间具有自己的起点，不应直接混作逐算子精确耗时。Gram 阶段记录表示计算推进，未保存这些内部累计矩阵，也未完成最终 Hbar/Cgram 的逐系数比较，不能将它们视为可独立续算的检查点。

缺少 `independent-replay.json`、`worker-result.json`、`dependencies.json` 和 `history-after.json`；独立 Hbar/Cgram、四项残差、系数上下界、负控及最终来源/依赖/历史闭合未完成。42 份重放输入完整集合的验收也未完成。

## 停止后的证据保护

停止后目录共 710 文件、48,195,623 字节。失败终态 `artifact_hashes` 为空，因此这些文件不能称作成功终态验收过的产物清单。

另行保存[只读事后核对回执](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/RECEIPT-20261014-case12-polynomial-energy-post-stop-audit.json)，在原失败目录之外固定当前 710 文件摘要，并逐项确认：

- 终态自摘要正确；来源快照 616 项与当前对应来源逐项一致。
- `history-before.json` 登记的全部 18 目录 / 12,701 历史文件仍匹配，包括旧成功与失败批次。
- 所属活动进程已清理为 0，缺失的验收记录保持缺失。

回执 SHA-256：`d200b35730e1a7d8e976ce45f81f2eeb4d29f25eed4f8b8b6b078ffbcc82e16d`。该操作只读取文件和既有 JSON、计算摘要，在目录外写审计报告；没有补算数学、修改失败终态或代替未完成的受控封存。

## 后续边界

顶层 goal 保持 active。现有成功的全方向右截面、主部闭合、分块、谱、投影与分子约分证书保持；本次能量资格仍未关闭。`attempt.json` 的方向统一能量/强双曲标记仍为 false；没有新资格晋级。

下一步先针对已观察到的重放成本制定独立、可复核的改进方案。当前日志能够把长耗时定位到完整 Gram 重建阶段，但没有足够剖析把全部耗时归因于卷积、缓存、内存或文件 guard 中某一项。不得靠补算剩余矩阵、拼接未验收中间量、降低系数验收、删除零分支或增加预算完成原批次；不自动重跑本 v1。

若另行设计计算表示或证据分层，必须先说明其数学等价性、完整输入/输出绑定、异常前缀、独立算法和合计资源范围，再登记独立候选；不能仅把同一工作拆开计时来规避原截止。

后续科学链仍需完整 58 维主部及其约束核的谱/能量，物理约束的全方向 Laurent 映射、低阶频率一致界和零频可达像，之后才是合法 IBVP、收敛、完整单黑洞、AMR、非零波形和外部复现。现有 H43 的拉回矩阵秩不足 58，不能直接称作全系统能量。

本批没有时间演化、native/GPU 或 live 接入；`physical_gate=false`、`live_admission=false`、`scientificPayloadWriteback=false`。Python/C++、旧失败与脏工作树均保留。

相关文件：[冻结推导](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/DERIVATION-20261014-case12-polynomial-energy.md)、[冻结协议](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/EXPERIMENT-20261014-case12-polynomial-energy.md)、[goal 状态](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/GOAL-20261014-top-tier-gr-development.md)。

**固定 case12 全实非零方向主部约束闭合：完整受限批次通过**

日期：2026-10-14。协议：EXPERIMENT-20261014-case12-polynomial-closure.md。目录：tmp/nr-shadow-evidence/nr-k3-case12-polynomial-closure-controls-v1-20261014。一次执行、无重试，所有前批来源与证据保持原样。

本地已验证结论：固定case12、geometric=False、含shift的原主符号有理公式延拓满足Dhat(v)K(v)(I−S(v)Dhat(v))=0，对所有实数v≠0成立。结合已通过的Dhat S=I43，可得主部约束核不变，以及唯一约束商算子Khat=Dhat K S。该结论不等于KS=SKhat或投影与K对易，不含方向统一能量或强双曲性证明。

复用父证书d=rDhat、s=σS，σ=chi·r·g²、Δ=rσ，构建T=dK、A=T s、N=ΔT−A d。全部2494个N槽逐系数精确为零；N=(rΔ)Dhat K(I−S Dhat)，rΔ≥r⁵/2>0保障非零实方向上的清分母有效。没有抽样方向替代多项式恒等式。

| 验收项 | 本批实测 |
|---|---|
| 终态 | worker/supervisor passed=true、completed=true、errors=[] |
| 用时 | worker 63.485秒，完整监护79.187秒 |
| 单元控制 | 27函数/63实例全部通过；pytest 1.81秒，无失败/错误/跳过 |
| K | 58×58，854非零槽、1617单项式，最高次数1；前11行/列为零 |
| T=dK | 43×58，725非零槽、4122单项式，最高次数4 |
| A=T s | 43×43，596非零槽、25852单项式，最高次数10 |
| N | 43×58共2494槽，所有系数精确零 |
| 模型负控 | δK[18,22]=x；完整δN仅[4,22]非零，66单项式，精确等于rΔx |
| 独立复验 | 标准库Fraction从保存文件完整重算T/A/N/δN、分母及统计；13份实际输入字节绑定SHA |
| 来源 | 586项，快照5265373字节，当前/前后/快照一致 |
| 历史 | 13目录/9337文件，包含父成功批和全部更早失败证据；前后及终态后复核一致 |
| 产物 | 621项非终态摘要；含终态622文件、11800150字节 |
| 清理 | 退出码0，清理前0、后0，cleanup_verified=true |

完整闭合构建约9.828秒；保存后独立复算约8.969秒。其他时间包含来源快照、写入、完整历史/依赖摘要和最终验收。这里没有等精度演化速度或八射线等工作量性能结论。

负控的约束商变化δA=0，而完整闭合δN非零。这直接检验了“只计算section上的商矩阵”可能漏掉的核方向错误；与小矩阵DS=I但闭合失败的控制互相补充。非零多项式不意味着在x=0的方向上也非零。

原Q.principal_rates与Q.matrix的函数AST无公式编辑，固定背景、几何分支、坐标索引、Fraction基向量及每列guard均保留；shift_ray调用原属性getter。父d/s通过固定成功终态与文件摘要加载，没有重构右截面。finalizer仅执行JSON/哈希/AST与证据完整性核对；CAS和独立卷积均在受监护worker内。

600秒、64 MiB输出、2 MiB终态预留、8 MiB快照、磁盘余量和单线程规则保持不变。数值依赖版本沿用Python3.12.3/SymPy1.13.3/NumPy2.2.6，保存557项已加载运行文件摘要。完整终态后只读重算621项产物、586项当前源码与快照、9337项历史文件，全部匹配；未重跑数学。

**身份摘要**

- qualification-gate.json：3ac920ab18b8e647dbe85c5abec09319c9251ce7841c3da4873530041e12bcb1
- worker-result.json：c063637c0ac86336611dc08303d7b027de2cc0ea3fa37f8050b71981a192fca2
- scripts/run-nr-k3-case12-polynomial-closure.py：ddb30b6cb6445b8412161bf88d1cc2faef1b43d3c6214ce2ccf7119e18eb6ec3
- independent-replay.json：1dbb0840dda60ca0c7e9958807998031325421e60623ab1f66407d2fe625bde9

本批all_direction_closure_validated=true仅指固定case12上述公式。direction_uniform_energy_validated、uniform_strong_hyperbolicity_validated、physical_gate、live_admission、scientificPayloadWriteback均false；integration_steps/native_calls=0。旧八射线v2仍是600秒失败，未重新分级。本机两套精确算法不是外部团队复现或证明助理认证。

顶层goal保持active。下一门槛为约束商的全方向谱/零模结构与正定能量的统一上下界，随后才可逐级推进适用域、边界和可分辨收敛。全58系统、一般背景、非线性演化与完整黑洞/AMR/波形仍未由本批验证。

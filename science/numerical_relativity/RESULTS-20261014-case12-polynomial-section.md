**固定 case12 全实非零方向右截面：受限批次通过**

日期：2026-10-14。协议：EXPERIMENT-20261014-case12-polynomial-section.md。执行目录：tmp/nr-shadow-evidence/nr-k3-case12-polynomial-section-controls-v1-20261014。一次执行，无重试。

本地结论：冻结case12有理公式延拓满足 Dhat(v)S(v)=I43，适用于所有实数v≠0，因此Dhat行秩为43。完整1,849个多项式残差精确为零；不是有限方向抽样。分母独立验算：h=LLᵀ为SPD，g≥(5/6)r，chi·r·g²≥r³/2，delta≥r⁴/2。此结论只适用于固定背景与登记公式延拓，不是完整Python语义形式化证明。

| 检查 | 实测 |
|---|---|
| 工作/监护终态 | passed=true，completed=true，errors=[] |
| 时间 | worker 56.375秒；含最终验收的supervisor 71.875秒 |
| 单元控制 | 28函数、55实例全部通过，无跳过/失败/错误；pytest报告1.61秒 |
| Dtilde | 43×58，235非零槽、657单项式，实测最高次数3 |
| Stilde | 58×43，302非零槽、6,029单项式，实测最高次数6 |
| 恒等式残差 | 43×43共1,849槽，全部系数为零 |
| 真实因子/符号负控 | 4种全部给出非零残差；非零槽分别3、1、1、3，单项式84、45、45、135 |
| 独立复核 | 标准库Fraction稀疏卷积从保存文件复算；18份实际解析输入字节绑定SHA |
| 来源 | 580项，快照5,183,737字节；当前/前后/快照一致 |
| 历史 | 12目录、8,716文件，前后及终态后只读复查均一致 |
| 完整产物 | 620项非终态摘要；含终态621文件、10,145,603字节 |
| 清理 | 子树退出码0，清理前0、清理后0，cleanup_verified=true |

构建完整符号矩阵及零残差阶段约6.203秒；独立重放阶段约3.328秒。其余包含来源快照、产物写入、依赖/历史哈希和监护验收；不是纯算子基准，也不能与旧八射线整批作等工作量性能比较。

数学计算及独立重放均在Windows Job受监护worker中；finalizer不重复矩阵计算，仅核对实际验证过的输入摘要、完整报告、纯AST来源、依赖和历史。原64 MiB/600秒及磁盘保护未放宽。保存Python3.12.3、SymPy1.13.3、NumPy2.2.6、pytest8.3.4、mpmath1.3.0及557项已加载运行文件摘要；不声称覆盖每个系统DLL。

终态后只读重算全部620项产物摘要、580项当前源码/快照、8,716项历史文件，均匹配。这次复查没有重跑数学或修改批次证据。

**证据身份**

- qualification-gate.json：d438a7db90fd6485aa7c4e9d9a40b41a14f033e9eacf932cf97d18e1b9a9e5be
- worker-result.json：2bc75c134af3a7fab1de92cddf2671f09f85b9ef6e9b90c399114659b7476f4d
- scripts/run-nr-k3-case12-polynomial-section.py：f9cba84d97f79fe663d24b3fd487dc886778cc3eaebb3cbadd0483064da373ef
- independent-replay.json：5b9bef59ed458795d457230aeecd974b62993e0a41e202d9e86eb995d98ad0f9

此前八射线v2仍为600秒失败；未重跑、未重新分级。all_direction_closure_validated、direction_uniform_energy_validated、uniform_strong_hyperbolicity_validated、physical_gate、live_admission、scientificPayloadWriteback全部保持false。时间演化、native和GPU调用均为0。

顶层goal仍active。下一独立门槛为全部43×58槽的 Dhat K(I−S Dhat)=0；右逆本身不能推出此式，更不能推出统一能量、物理边界、黑洞或波形成熟度。

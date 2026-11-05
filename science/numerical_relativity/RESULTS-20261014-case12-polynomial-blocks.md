**固定 case12 全方向 ODE 分块与精确约分：完整受限批次通过**

日期：2026-10-14。协议：EXPERIMENT-20261014-case12-polynomial-blocks.md。目录：tmp/nr-shadow-evidence/nr-k3-case12-polynomial-blocks-controls-v1-20261014。一次执行，无重试。Origin Skill: academic-research-suite / experiment-agent。Verification Status: 本地完整精确证书与独立算法重放通过，未完成外部复现。

固定 case12、任意实数 v≠0，已验证约束商的 ODE/PDE 分块恒等式，并逐槽证明父闭合分子 A 的公共因子可精确消去。由此把 Khat=A/Δ 化简为 Ab/r；本批不包含谱结构或方向统一能量证明。

令 r=vᵀv、g=vᵀh⁻¹v、σ=chi·r·g²、Δ=rσ、b=β·v，Ot=rO、Pt=rI−Ot、B=A−bσPt。完整验证 Ot²−rOt=0、B Ot=0、Ot B=0，以及 trace(Ot)=11r。结合 r>0，得到 ODE 投影秩 11、互补 PDE 投影秩 32，L=B/Δ 满足 LO=OL=0。该秩结论不分类 PDE 子空间内的零速 Jordan 结构。

逐槽精确除法得到 A=σAb+R；全部 1849 个 R 槽精确为零，A−σAb 的全部槽也为零。因此 L=(Ab−bPt)/r。父域证书的 g≥(5/6)r 和 chi=18/25 给出 σ≥r³/2>0，保证在所有非零实方向上约分合法。验收采用有理多项式逐系数精确零，没有方向抽样或阈值取整。

| 验收项 | 本批实测 |
|---|---|
| 终态 | worker 与 supervisor 均 passed=true、completed=true、errors=[] |
| 用时 | worker 144.015 秒，完整监护 198.797 秒 |
| 单元控制 | 28 个函数 / 53 个实例全部通过，pytest 3.06 秒，无错误、失败或跳过 |
| 三项分块残差 | 3×43×43，共 5547 槽全部精确零 |
| Ot | 43×43，99 非零槽、99 单项式，最高次数 2 |
| Pt | 43×43，109 非零槽、162 单项式，最高次数 2 |
| B | 43×43，487 非零槽、21243 单项式，最高次数 10 |
| 精确商 Ab | 43×43，596 非零槽、2823 单项式，最高次数 4 |
| 除法证书 | 全部 1849 余式槽为零；除法恒等式及独立乘回的完整残差为零 |
| 模型负控 | δOt[8,8]=x²；完整幂等残差 5 个非零槽、7 个非零单项式 |
| 独立重放 | 标准库 Fraction 从保存文件重建分块、乘回、正规余式条件、trace、负控及统计；19 份实际输入绑定 SHA |
| 来源 | 592 项，快照 5356964 字节，当前源码 / 快照 / 运行前后全部一致 |
| 历史 | 14 目录 / 9959 文件，运行前后及终态后复核一致 |
| 产物 | 633 项非终态摘要；含终态共 634 文件、12747101 字节 |
| 进程清理 | 退出码 0；清理前 0、清理后 0，cleanup_verified=true |

主构建从 39.125 秒至 53.687 秒，约 14.562 秒；完整候选文件在 67.281 秒保存，独立重放在 89.484 秒完成。其余时间包括来源快照、全部历史与依赖摘要及终态验收。父 A 有 25852 个单项式、最高次数 10；Ab 保持 596 个非零槽，降为 2823 个单项式、最高次数 4。这是后续代数表达式规模的下降，不是等精度演化速度或端到端性能结论。

原 ode_projector 的函数 AST、GROUPS、SCALED_ROWS 和 shift 来源均有固定摘要与结构守卫；intrinsic 关系通过源码绑定并清分母，未声称对 Python 全语义做形式化验证。父闭合 A、固定域及分母直接从已接受证据加载，未重建 K 或右截面。负控从原投影系数产生真实错误，不是手写任意非零残差。小矩阵测试另覆盖非整除候选，但没有把未运行的整矩阵约分扰动记作端到端负控。

所有数学与独立卷积均在受 Windows Job 监护的 worker 内。finalizer 仅检查 JSON、摘要、AST 和证据完整性。600 秒、64 MiB 磁盘输出、2 MiB 终态预留、8 MiB 快照、磁盘余量与单数值线程规则保持不变；64 MiB 不是 RAM 限额。记录 Python 3.12.3、SymPy 1.13.3、NumPy 2.2.6 及 557 项已加载运行文件摘要。终态后只读复核全部 633 项产物、592 项当前来源与快照、9959 项历史文件均匹配，未重新执行数学。

**身份摘要**

- qualification-gate.json：426016d3bc774df001f10bbdab81475a1ad498ff6fbd43f76bd3d67d071e02c7
- worker-result.json：6c6ee2e00809d64111c900a4eb61a0eb864e9ba8686988fdef4c944f3f003c1e
- scripts/run-nr-k3-case12-polynomial-blocks.py：c67cea634973b9dcb2f37de5151d46a43807d4b48ba1d28b39e54acfd0563dc2
- independent-replay.json：b02a9efc391df7920856c9cd7a1fcd1d2e1e5f3544adacfb6f5b3502894d5ec1
- 父闭合终态：3ac920ab18b8e647dbe85c5abec09319c9251ce7841c3da4873530041e12bcb1

ode_blocks_validated=true、exact_quotient_cancellation_validated=true；direction_uniform_energy_validated、uniform_strong_hyperbolicity_validated、physical_gate、live_admission、scientificPayloadWriteback 均为 false；integration_steps/native_calls=0。旧八射线 v2 的超时失败原样保留。本机两套算法不等于外部团队复现或证明助理认证。

顶层 goal 仍 active。下一受限单元应使用已约分分子验证全方向谱消去多项式，包含单次零根以排除零速 Jordan 块，并核对全部六个原登记谱分支。随后再构造投影、显式正定能量与方向统一上下界。完整 58 维系统、低阶项、合法边界、收敛、黑洞、AMR 和波形仍须各自证据。

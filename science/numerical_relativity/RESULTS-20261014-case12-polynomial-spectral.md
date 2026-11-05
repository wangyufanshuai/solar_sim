**固定 case12 全方向七次谱消去：完整受限批次通过**

日期：2026-10-14。协议：EXPERIMENT-20261014-case12-polynomial-spectral.md。目录：tmp/nr-shadow-evidence/nr-k3-case12-polynomial-spectral-controls-v1-20261014。Origin Skill: academic-research-suite / experiment-agent。Verification Status: 本地完整精确证书与独立算法重放通过；未完成外部复现。

本批在固定 case12、任意实数 v≠0 上，验证了 43 维约束商的 intrinsic 算子 L 满足

    L(L²−c1 g I)(L²−c2 g I)(L²−c3 g I)=0,

其中 r=vᵀv、g=vᵀh⁻¹v、L=(Ab−bPt)/r，前三个 c 为 2601/100000、2601/50000、2601/5000。g≥(5/6)r>0，故该消去多项式有互异实根，包含一个单次零根。由此得到每个非零实方向上 L 实可对角化，并排除零速 Jordan 块。其谱包含于 0、±√(c1g)、±√(c2g)、±√(c3g)；未证明这些根全部出现或各自重数，也未声称这是最小多项式。

原六个分支全部保留，后三个常数仍为 153/125、459/250、306/125。其配对投影为零由完整的一元商余式证书支持，不是从少量方向观测推断。方向统一能量、完整 58 维系统及低阶项结论均未在本批登记通过。

**主计算与完整保存**

令 X=Ab−bPt、Q=X²、Z0=X，按原前三分支递推 Zj=Z(j−1)Q−cj g r² Z(j−1)。四次完整矩阵乘法得到 Z3=r⁷L∏(L²−cjgI)。r>0 保证清分母有效。每阶段保存全部 43×43 槽，包括所有零项；独立标准库 Fraction 算法从父输入重新计算五阶段，而非只检查已保存的零矩阵。

| 矩阵 | 非零槽 | 单项式数 | 实际最高次数 | 登记次数上限 |
|---|---:|---:|---:|---:|
| X | 487 | 2337 | 4 | 4 |
| Q | 657 | 12312 | 7 | 8 |
| Z1 | 517 | 21669 | 10 | 12 |
| Z2 | 154 | 20847 | 16 | 20 |
| Z3 | 0 | 0 | 零多项式 | 28 |

完整链共 9245 显式矩阵槽，其中最终残差 1849 槽全部逐系数精确为零。没有方向抽样、浮点拟合、阈值取整或失败后追加谱因子。

**六分支与零根证书**

保存并独立重算原七节点 (0,c1,…,c6) 的全部 Lagrange 多项式，将其模 m4(y)=y(y−c1)(y−c2)(y−c3) 约化。前三配对分支与零支化为四节点插值公式，后三支完整余式为零。同时验证完备性、全部 49 个有序 PDE 投影乘积关系、六个平方速度关系、t·rem0(t²) 模 p7(t)=t∏前三(t²−cj) 的零余式，以及 p7 与其导数的 Bezout=1 和非零线性项。

这些一元恒等式通过 Y=L²/g、Ej=ej(Y)P 与父证书 P²=P、LP=PL=L 移植到原配对投影公式；此处没有展开保存六套完整 43 维方向投影或 H。ODE 组件及其交叉关系另由父分块恒等式控制，不把 49 项 PDE 关系写成全部八组件的 64 项矩阵验算。

端到端逻辑负控为真实 N=[[0,1],[0,0]]，r=g=1。保存并独立验证 N²=0、m4(N²)=0，但 p7(N)=−c1c2c3N≠0，且恰有一个非零槽。它证明平方消去测试会漏过的零 Jordan 块被本批奇次证书拒绝；该负控不是物理 58 状态扰动。

**执行与证据完整性**

| 项目 | 本批实测 |
|---|---|
| 终态 | worker 与 supervisor 均 passed=true、completed=true、errors=[] |
| 用时 | worker 263.547 秒；完整监护 300.594 秒 |
| 测试 | 24 个函数 / 60 个实例全部通过；pytest 2.59 秒，无失败、错误或跳过 |
| 主构建 | 43.547 秒开始；Z3 在 118.203 秒保存；完整候选在 119.250 秒保存 |
| 独立复算 | X 在 120.750 秒核对；全链、六支与负控在 222.328 秒完成 |
| 实际重放输入 | 15 份同字节 SHA：5 父输入、5 矩阵、stats/scalars/acceptance/univariate/nilpotent |
| 来源 | 598 项，快照 5456259 字节；当前 / 前后 / 快照一致 |
| 历史 | 15 目录 / 10593 文件，包含全部旧失败；前后及终态后复核一致 |
| 产物 | 644 项非终态摘要；含终态共 645 文件、13590986 字节 |
| 依赖 | Python 3.12.3、SymPy 1.13.3、NumPy 2.2.6；557 项已加载运行文件摘要 |
| 清理 | 退出码 0；清理前 0、清理后 0；cleanup_verified=true |

60 项测试覆盖原速度/分支源码、小矩阵手算、六个 companion 分支、非单位 r/g、幂零陷阱、非零候选保存、阶段中断、完整坐标、类型/次数约束，以及独立一元验证器的证书篡改拒绝。该计数只代表本批控制，不等于完整科学验收。

所有数学与独立卷积都在所属 Windows Job worker 内，finalizer 仅做摘要、JSON、AST 和完整性验收。600 秒、64 MiB 磁盘输出、2 MiB 终态预留、8 MiB 快照、磁盘余量和单数值线程规则不变；一次执行、无重试。终态后只读复核 644 项产物摘要、598 项来源与快照、10593 项历史摘要均匹配，没有再次执行数学。阶段时间不构成等精度演化性能结论。

**身份摘要**

- qualification-gate.json：67e2eda4ab922a09390ff8207a709ede327ac1619caca5a1322c16fd3825b0e6
- worker-result.json：6b320f7812c754dd8a8ebfdf06168af9d90719e851e5391e047203641c1f7e9e
- scripts/run-nr-k3-case12-polynomial-spectral.py：d4772efb2d7c247834e79a939e65c2693a61271ef8afcb2b56b9f32ff6c3ac6e
- independent-replay.json：d89a549b920bcb4cd15823bbecc3c479e3ea74e50615f3c82f24c47178a7e521
- 父 blocks 终态：426016d3bc774df001f10bbdab81475a1ad498ff6fbd43f76bd3d67d071e02c7

spectral_annihilator_validated=true、six_branch_reduction_validated=true。direction_uniform_energy_validated、uniform_strong_hyperbolicity_validated、physical_gate、live_admission、scientificPayloadWriteback 仍为 false，integration_steps/native_calls=0。原物理阈值 2e-12 保留，代数验收只接受精确零。旧八射线 v2 的 600 秒失败原样保留。

顶层 goal 保持 active。下一步构造与原 paired_energy 一致的方向投影及 action，独立验证保存矩阵，然后构造 H、对称化和 Gram 强制性恒等式，并给单位球统一上下界与光滑性。三个零配对分支在原 1/14 强制性分解中的差因子仍有贡献，不能删除。边界、收敛、完整黑洞、AMR、非零波形及外部复现仍有独立门槛。

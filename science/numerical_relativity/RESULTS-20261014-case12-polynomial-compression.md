**固定 case12 投影与作用分子精确约分：完整受限批次通过**

日期：2026-10-14。协议：EXPERIMENT-20261014-case12-polynomial-compression.md。目录：tmp/nr-shadow-evidence/nr-k3-case12-polynomial-compression-controls-v1-20261014。Origin Skill: academic-research-suite / experiment-agent。Verification Status: 本地完整精确证书与独立算法重放通过；未完成外部复现。

已逐槽证明全部八个投影分子 Ni 可整除 r⁵、全部六个作用分子 Mj 可整除 r⁴。这里只执行预登记的这一组因子，没有搜索、拟合、更换因子或重跑旧失败。生产算法与独立标准库 Fraction 长除法一致，全部来源、历史证据与清理验收通过。

定义 Nbar_i=Ni/r⁵、Mbar_j=Mj/r⁴、r=vᵀv、g=vᵀh⁻¹v。固定 case12 的任意实数 v≠0 上，r>0，约分后仍精确表示相同的原投影和作用：

    Ei = Nbar_i / (r g³),     LEj = Mbar_j / (r g²).

此处 Ei 的八个组件仍为 O、E0、E1,…,E6；六个配对分支未被删除。多项式约分证据不能去掉上述实数非零方向适用域，不能用来宣称物理零频可逆。

**完整矩阵证书**

14 份输入共 25886 个位置。每个位置保存 lex 精确长除法的商 q、正规余式 rho 和乘回残差 a−fq；验证 a=fq+rho，并独立检查余式不含可被除数领先单项式整除的项。42 个主矩阵共 77658 槽，其中 28 个余式/乘回残差矩阵的 51772 槽全部逐系数为零。77658 是覆盖槽数，不是零残差数。

| 分子 | 非零槽 | 原单项式数 | 商单项式数 | 原最高次数 | 商最高次数 |
|---|---:|---:|---:|---:|---:|
| NO | 99 | 15147 | 2772 | 18 | 8 |
| N0 | 516 | 85572 | 17052 | 18 | 8 |
| N1 | 513 | 77595 | 13800 | 19 | 9 |
| N2 | 612 | 100107 | 19737 | 19 | 9 |
| N3 | 135 | 25008 | 5733 | 19 | 9 |
| N4、N5、N6 | 各 0 | 各 0 | 各 0 | 零多项式 | 零多项式 |
| M1 | 432 | 49263 | 10455 | 16 | 8 |
| M2 | 468 | 52185 | 11121 | 16 | 8 |
| M3 | 154 | 20847 | 5479 | 16 | 8 |
| M4、M5、M6 | 各 0 | 各 0 | 各 0 | 零多项式 | 零多项式 |
| 合计 |  | 425724 | 86149 |  |  |

商矩阵文件合计 3599899 字节，父 14 个分子文件合计 19516566 字节，减少约 81.6%。这是同一数学对象的精确表示压缩，不是浮点近似，也不是等精度演化性能测试。商的登记次数上限为 N≤9、M≤8；完整零分支的所有坐标均保留。

负控复制真实父 N1，在 [0,0] 加 1，然后仍除以 r⁵。保存三份完整 43×43 输出；余式与乘回残差均恰为 [0,0] 的常数 1，其余槽为零。两种算法确认除法恒等式和正规性成立，但整除验收拒绝该变异。正确的除法恒等式本身不等于整除成立。

**执行与证据完整性**

| 项目 | 本批实测 |
|---|---|
| 终态 | worker 与 supervisor 均 passed=true、completed=true、errors=[] |
| 用时 | worker 182.078 秒；完整监护 211.766 秒 |
| 控制测试 | 27 个函数 / 75 个实例全部通过，无失败、错误或跳过 |
| 主要阶段 | 25.110 秒开始构建；94.438 秒完整候选保存；134.297 秒独立重放完成 |
| 来源 | 610 项，快照 5665042 字节；当前 / 前后 / 快照一致 |
| 历史 | 17 目录 / 11943 文件，含全部旧失败；前后及终态后复核一致 |
| 产物 | 757 项非终态摘要；含终态共 758 文件、35487136 字节 |
| 独立重放输入 | 67 份：17 父输入、42 主矩阵、3 负控矩阵、5 元数据 |
| 依赖 | Python 3.12.3、SymPy 1.13.3、NumPy 2.2.6；557 项已加载运行文件摘要 |
| 清理 | 退出码 0；清理前 0、清理后 0；cleanup_verified=true |
| 执行身份 | 9921b70c-44d2-4587-9432-55542271feb4；retries=0 |

终态后只读复核 757 项产物摘要及完整文件集合、610 项来源/快照、11943 项历史、557 项依赖和 67 项重放输入，全部一致。该复核没有重新计算多项式。75 项控制覆盖固定因子注册、混合可整除/不可整除小矩阵、正规余式、非单位因子、次数边界、零分支、真实常数扰动、浮点等值篡改拒绝、来源/父记录漂移，以及中断和保存顺序；计数不是完整科学验收。

全部数学和独立重放都在所属 Windows Job worker 中。每行及每次保存进行原有完整资源检查；独立 Fraction 重放中，无文件写入的内层长除法在入口、出口及每 32 步检查同一截止时间。生产 SymPy 除法使用行级完整检查并受原监护控制。finalizer 仅执行 JSON、摘要、AST 与完整性验收。600 秒、64 MiB 磁盘输出、2 MiB 终态预留、8 MiB 来源快照、磁盘余量、单数值线程及失败不自动重试的规则未变。

**身份摘要**

- qualification-gate.json：04e3db7e90ff93ce0c9ba24f81a0cc3d7f3490e80a21b5930b97b95d7edd2fda
- worker-result.json：fd52af65137038fc8e3910c83a3312bfbb9014be67d9c58d5b412180d7fb50b6
- independent-replay.json：fcb2eb8f30f948347a637085f18d1df46ed74775f4eaadca6d102d2b0f94f78b
- scripts/run-nr-k3-case12-polynomial-compression.py：3e221e127f0ba6e22a251da0a322909d853cb076180897dc4e2390f03aa05cdf
- scripts/nr_case12_polynomial_compression.py：b1f46b6cff721fc242cbca152380d6b940935206458e626c195d5f74df5a6054
- 父 projectors 终态：a1ca636503cca3f3b94107e44d010adebc33b0497c61e73e3f47343bdca157e1

numerator_compression_validated=true、fixed_factors_validated=true。direction_uniform_energy_validated、uniform_strong_hyperbolicity_validated、physical_gate、live_admission、scientificPayloadWriteback 仍为 false，integration_steps/native_calls=0。原物理阈值 2e-12 保留，代数验收只接受精确零；旧八射线超时证据保留。

**下一单元：完整原能量、对称化与 Gram 强制性**

已证明的约分使原能量可以精确表示为 H=Hbar/τbar，其中 Dbar=rg³、ηbar=rg²、τbar=r³g⁶，G=Gt/r，且

    Hbar = Σ_i wi Nbar_iᵀGtNbar_i + Σ_j=1..3 [g/(2cj)] Mbar_jᵀGtMbar_j.

八组件权重仍为 (1,1,1/2,…,1/2)。作用 Gram 系数为 g/(2cj)，不能沿用未约分表示的 r²g/(2cj)。本批尚未计算 Hbar，故尚未证明能量门通过。

下一批须实际保存 Hbar、Hbar−Hbarᵀ、Hbar X−XᵀHbar、Hbar Pt−PtᵀHbar，以及完整八个 Fi=Nbar_i−Dbar I/(14wi)、Cgram 和 Hbar−Dbar²Gt/14−Cgram。次数上限依次为 Hbar/Hsym/Gram 残差 20、HL 残差 24、HP 残差 22、Fi 9。三份零谱投影对应的 Fi 仍非零，原强制性分解中各贡献 G/98，不能删除。

可通过分别展开 FiᵀGtFi、共享已求出的 Nbar_iᵀGtNbar_i 降低重复计算，但不能将 Cgram 赋值为 Hbar 减预期下界来制造零残差；独立算法应从实际 Fi 重建 Gram。随后计算保存系数给出的具体单位球统一上界及光滑性，才有资格登记固定 43 维主部的方向统一能量。完整 58 维系统、低阶项、零频、边界、收敛、黑洞演化、AMR、波形及外部复现仍需独立证据，顶层 goal 保持 active。

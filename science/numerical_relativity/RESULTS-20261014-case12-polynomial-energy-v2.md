# case12 完整能量 v2：原预算内完整通过

## Material Passport

Origin Skill: academic-research-suite / experiment-agent。日期：2026-10-14，Asia/Shanghai。
Verification Status: VERIFIED local exact certificate，范围仅为固定 case12 的 43 维约束商主部。
本报告基于实际受控运行、完整独立重放和终态文件；不属于外部团队复现、专家审稿或 Python 语义形式化证明。

## 结论

新的独立整数卷积重放候选已在原 600 秒 / 64 MiB 输出限制内完整通过。生产算法不变；新批次重新构造所有矩阵，再独立重建全部结果，没有接续失败批次的内部累加量。旧能量 v1 的超时终态及证据完整保留，仍为失败。

已验完整 H、两个主部对称化关系、原八项 Gram 强制性、具体统一上界和正分母适用域。对应终态：

- `passed=true`、`completed=true`、`direction_uniform_energy_validated=true`。
- `uniform_strong_hyperbolicity_validated=true`，限定 `principal_scope="fixed-case12 43-dimensional principal quotient only"`。
- `full58_principal_energy_validated=false`；物理、live 与科学载荷写回均为 false。

这关闭了已登记固定 43 维主部的全方向能量门槛，未完成顶层广义相对论开发目标。

## 实际运行

[资格终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-polynomial-energy-controls-v2-20261014/qualification-gate.json)、[worker 结果](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-polynomial-energy-controls-v2-20261014/worker-result.json)、[独立重放](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-polynomial-energy-controls-v2-20261014/independent-replay.json)。

| 项目 | 实际结果 |
| --- | --- |
| run_id | 6d3c6204-05c0-4069-a019-92f11f7922b7 |
| worker / 完整监护 | 506.282 / 533.265 秒 |
| 控制测试 | 42 个函数、112 个实例；0 失败、错误或跳过；日志 4.27 秒 |
| 来源快照 | 623 项，6,052,317 字节 |
| 历史保护 | 19 目录，13,411 文件，包括失败能量 v1 的 710 文件 |
| 封存产物 | 732 份摘要及终态本身，共 733 文件、50,637,343 字节 |
| 独立重放输入 | 全部 42 份实际解析输入逐字节绑定 |
| 已加载运行依赖 | 557 份文件摘要；SymPy 1.13.3、NumPy 2.2.6、pytest 8.3.4 |
| 所属进程清理 | 0→0，cleanup_verified=true，返回码 0，重试 0 |

继续使用原 Windows Job、单数值线程、2 MiB 终态预留、8 MiB 来源快照上限及 C/E 空间底线。64 MiB 指磁盘输出，不是内存。没有延长预算或在终态后补算矩阵。

终态 SHA-256：`df247bc18a9366efa076382ad0ecf350e807277dd0fb6d59296a45a68ec07ee1`。

worker SHA-256：`69fde64c207c93010fa6d0e1818fe29847e15521810d7ac83b8acc1b9bb3ebbd`。

独立重放 SHA-256：`fe9957094c2a8bb44613773f80cccdd2c8e1e4a2d49fd16cd3aa062fb5bd8ee9`。

## 数学覆盖

保留原八组件权重 `(1,1,1/2,...,1/2)` 和六个速度常数。采用已验约分分子，令

    r=vᵀv, g=vᵀh⁻¹v, Dbar=rg³, taubar=r³g⁶,
    Hbar=Σ wi Nbar_iᵀGtNbar_i + Σ g/(2cj) Mbar_jᵀGtMbar_j,
    Fi=Nbar_i−Dbar I/(14wi),
    Cgram=Σ wi FiᵀGtFi + Σ g/(2cj) Mbar_jᵀGtMbar_j.

全部 15 个主矩阵包含 27,735 个显式槽；Hbar 和 Cgram 各有 981 非零槽、180,061 项，最高次数 18。独立算法直接由八个实际 Fi 重建 Cgram，并直接计算对称化等式两边；没有将 Cgram 定义成 Hbar 减所需下界。

以下四个完整矩阵的 7,396 槽全部独立验为精确零：

    Hbar−Hbarᵀ,
    HbarX−XᵀHbar,
    HbarPt−PtᵀHbar,
    Hbar−Dbar²Gt/14−Cgram.

三个恒零谱分支对应的 Fi 仍非零，全部纳入原 Gram 恒等式；没有删支或更换 1/14 下界。对实际 Hbar[0,1] 加 1 的负控另保存两完整矩阵，独立重建得到两个非零常数槽并拒绝。

令 H=Hbar/taubar，L=X/r、P=Pt/r。固定正域 g≥(5/6)r>0 与上述残差给出 H=Hᵀ、HL=LᵀH、HP=PᵀH，以及 H≥G/14。原主部 J=L+bP 因此也由同一方向相关 H 对称化。

在实单位球 nᵀn=1 上，Gt=G=I，完整验证得到

    (1/14) I₄₃ ≤ H(n) ≤ C I₄₃,

    C = 284697652602679297661770635172980193521320414461822369607942746629939710449
        / 4418505017704695003732950908670318312942981719970703125000000000000.

C 来自新保存 Hbar 的全部 1,849 项系数绝对值和，再除以 `(5/6)^6`；该具体有理界已独立重算。它是保守的代数上界，不是最优条件数、误差或时间演化性能估计。r、g 的正性以及有理多项式公式给出实 v≠0 上的光滑性；不把这些有理坐标延伸到物理零频。

## 新算术与实际耗时

[新算术模块](E:/86137/myai/solar_sim/next-web/scripts/nr_integer_polynomial_replay.py) 对每个输入多项式清除系数分母、提取整数公因子，以 Python 整数进行全部稀疏卷积，再对每个非零输出项恢复 Fraction。上层矩阵求和仍为精确有理数。未使用浮点、采样、有限域猜测、系数截断或科学库乘法；生产模块保持原 SHA。

原 39 项能量控制重新执行，新增 73 项覆盖异分母与负号、精确消去、严格类型、多变量项、大整数与指数、无别名更新、截止异常、缓存边界和 v2 接线。65×65 的 4,225 对积控制跨越内部 4,096 对检查间隔，验证完整 129 项手算三角系数。测试通过之外，本批还完成了实际全矩阵独立重放。

| 阶段 | worker 相对秒数 |
| --- | ---: |
| 入口 / 控制完成 | 52.985 / 58.266 |
| 全部生产候选保存 | 293.141 |
| Gt 与八 Fi 独立比较完成 | 300.688 |
| Hbar / Cgram 独立比较完成 | 402.344 / 403.250 |
| HL / HP / Gram 独立比较完成 | 449.047 / 463.047 / 465.391 |
| 完整独立重放完成 | 469.375 |
| worker 封存完成 | 506.282 |

生产候选保存至完整独立重放的区间约 176.234 秒，包含解析、guard、矩阵计算、比较及元数据工作，不是单独卷积基准。旧 v1 未完成且两次运行负载不同，不能从这里推导完整科学演化加速比；本次已证实的是完整候选能够在原预算内通过。

停止后的只读摘要比较另确认，新鲜生产的 17 个主/负控矩阵与 v1 保存的对应矩阵字节一致。这个比较说明表示优化没有改变生产产物，不是复用 v1 的科学资格；新资格来自本批完整独立验收。

终态后的独立只读审计还确认正式/预备终态自摘要有效，worker 与 gate 一致；全部 732 项产物摘要、623 项当前来源/前后记录/快照、19 棵历史树的 13,411 文件、557 份记录的运行依赖和 42 份实际重放输入均匹配。未发现缺失、新增或漂移。该事后审计没有运行测试或数学，也不扩大既有运行时依赖清单的证明范围。

## 来源与后续门槛

新算术 SHA：`5b4f8e7510cd32064cef2266d6d1d472bb1bde2f842f0836b37bcc0c74ddef7f`；新测试 SHA：`228da96b19e86f0f251751e2d76161cb58feb9a587aca201539a7d0e5fd20548`；新入口 SHA：`e6fea2b590941bceb4a15e7ebf7af83288cde7d44eb505f59f9e5020e74c0600`。

数学输入仍取成功 compression 父证据及另行绑定的 projectors 祖先 X/Pt。失败 v1 仅作为不可变来源/历史保护对象，未作为已通过的数学父证据。新入口没有全局替换冻结的生产或旧 Fraction 实现。

全 58 维主系统及其约束核仍需自己的谱与统一能量证书；DᵀH43D 的秩只有 43，不能作为 H58。物理约束的全方向 Laurent 映射、低阶一致估计、明确的频率范数与零频可达像也是独立必需门。随后才是合法初边值、收敛、完整单黑洞、AMR、非零波形、等精度性能和独立外部复现。

已新增[下一 full58 谱候选备忘录](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/NOTE-20261014-case12-full58-spectral-next.md)，仅包含来源和未执行公式设计，不是本次已验矩阵或来源快照的一部分。下一候选需另行预登记、实现与运行。

顶层 goal 保持 active。无时间演化、native/GPU、非线性或物理边界新验收；`physical_gate=false`、`live_admission=false`、`scientificPayloadWriteback=false`。没有改写原失败、物理阈值、Python/C++ 主线或美术代码。

相关文件：[新推导](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/DERIVATION-20261014-case12-polynomial-energy-integer-replay.md)、[新协议](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/EXPERIMENT-20261014-case12-polynomial-energy-integer-replay.md)、[goal 状态](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/GOAL-20261014-top-tier-gr-development.md)。

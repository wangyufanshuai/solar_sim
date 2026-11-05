# Case12 完整线性约束符号：授权批次结果

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent (run); Python control tests.
- Origin Date: 2026-10-13 (Asia/Shanghai).
- Verification Status: VERIFIED_LOCAL_CASE12_LINEAR_SYMBOL_ONLY.
- Version Label: case12_full_symbol_controls_v1_result.
- AI-assisted implementation/report; no independent human or external-code qualification.
- This additive post-run report is outside the batch's frozen544-source closure.

## 结论与授权

用户通过问题 `call_32a04711b1ef43eba2421be9dd7bc780` 明确授权的一次新批次
已完成并通过。仅提升 `case12_full_linear_symbol_checked=true`；不改变任何
旧失败、物理阈值或全局科研准入。没有第二次运行或自动重试。

这次从“43维主部系数核对”推进到同一平坦常背景、同一方向上的完整
线性约束符号：包括低阶源项、所有多项式幂次及零频可达像空间。
它不是非线性 Einstein 演化、边界稳定性或黑洞模拟验收。

预登记文件：[EXPERIMENT-20261013-case12-full-symbol.md](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/EXPERIMENT-20261013-case12-full-symbol.md)。
方程和适用边界：[DERIVATION-20261013-case12-full-symbol.md](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/DERIVATION-20261013-case12-full-symbol.md)。

## 运行身份与资源

- ID: `nr-k3-case12-full-symbol-controls-v1-20261013`.
- Run ID: `5788a047-1cf5-4ebb-8ca4-7e27ada803a8`.
- Working directory: `E:/86137/myai/solar_sim/next-web`.
- Command:

```text
D:/python/python.exe -B scripts/run-nr-k3-case12-full-symbol.py --output-directory tmp/nr-shadow-evidence/nr-k3-case12-full-symbol-controls-v1-20261013
```

| 项目 | 结果 |
|---|---|
| 终态 | passed=true, completed=true, errors=[]，退出码0 |
| 总监督时间 | 32.109 s / 600 s |
| 工作进程时间 | 26.157 s，包含控制测试、推导、复算与完整性检查 |
| 批次产物 | 652文件，11,696,696 bytes（约11.15 MiB）/64 MiB |
| 源码快照 | 544文件，4,778,155 bytes（约4.56 MiB）/8 MiB |
| 收尾空间 | 原2 MiB预留，未改动 |
| 环境 | Windows原生Python3.12.3，NumPy2.2.6，单线程 |
| 进程收尾 | cleanup_verified=true，active_after_cleanup=0 |
| 数值演化/原生调用/重试 | 全部0；GPU未运行 |

原资源监督器持续执行 C>=3 GiB、E>=4 GiB+32 MiB 的底线，启动时另计
64 MiB批次空间。启动前读取 C=15,360,339,968、E=14,264,238,080 bytes；
最终只读复核时 C=15,422,140,416、E=14,191,845,376 bytes。这些是当时
的空闲量，不是未来运行许可，也不能把其他进程造成的空间变化算成本批产物。

## 科学与控制门槛

| 门槛 | 当前证据 |
|---|---|
| 单元/反例控制 | 22/22 passed，0失败、0错误、0跳过 |
| 独立低阶58维源J | 相对系数误差6.70931614533334e-17，原阈值2e-12 |
| 物理约束多项式 | 独立有理系数C0/C1/C2，未投影或替换原始输入 |
| 完整闭合 | C(z)L(z)=B(z)C(z)的0至4次幂全部保留 |
| 系数系统 | 129×290，精确行秩129；两个不同右逆给出相同B0/B1/B2 |
| 精确恒等式残差 | 43×290有理矩阵全部严格为零，不是“足够小” |
| 零频可达空间 | C0[4:]精确行秩39；39×58传播残差严格为零 |
| 零频歧义 | 保存非零E且E C0=0的证据；未构造43维右逆 |
| 高精度求值 | 六个频率、三个矩阵的实/虚部，共36组Decimal50/70求值，舍入结果全部一致 |
| 输入系数对照 | 36组全部满足原2e-12相对最大行和阈值 |
| 故意扰动对照 | 18/18被同一比较器拒绝，最小相对误差1.9771388612160245e-9 |
| 同批次复算 | J、C、B系数、选主元与右逆全部精确一致 |

各频率原浮点输入的完整传播恒等式相对残差：

| rho | ||BC-CL||inf / max(1,||CL||inf) |
|---|---:|
| 0 | 8.003373268609062e-17 |
| 1/2 | 1.2550540370720248e-16 |
| 1 | 2.892150053079471e-16 |
| 2 | 3.3337488965331593e-16 |
| 4 | 4.429698898475212e-16 |
| 8 | 6.631696433618923e-16 |

物理约束、附属约束符号、全状态生成元的系数对照最大相对误差分别为
3.6361771995319604e-16、3.405056449039308e-16、1.5796470836918427e-16。
这些是逐实/虚部的矩阵相对误差，不是物理轨迹或引力波精度。

独立性边界：新J及物理约束C由有理数指标收缩构造；B由完整多项式
系数恒等式推导，没有从生产矩阵或频率采样回归系数。58维主部Kv和
精确线性代数帮助函数明确复用已冻结的独立参考，因此不是两套完全
独立的理论/代码体系，也不是成熟第三方NR程序的对标。

控制边界：18个扰动只改变比较输入副本的实部[0,0]，属于比较器反例，
不能当作物理稳健性或一般ULP敏感性证据。非闭合单元反例验证了异常
携带精确残差；实际case12没有发生闭合失败，所以本批没有执行真实
失败诊断文件写入分支或磁盘/进程故障注入。

## 证据与完整性

证据目录：`E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-full-symbol-controls-v1-20261013`。

- [终态回执](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-full-symbol-controls-v1-20261013/qualification-gate.json)
  SHA-256: `e2d64d53023f1ca0f6a100333f6ebe9ff73de24de80bf420453c800e947be3a4`。
- [工作进程回执](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-full-symbol-controls-v1-20261013/worker-result.json)
  SHA-256: `393903039481482178fac4d57b5a85e6f0465c3f3fb92af631896f12309377e6`。
- [精确闭合残差](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-full-symbol-controls-v1-20261013/coefficient-residual.json)
  与[零频残差](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-full-symbol-controls-v1-20261013/zero-frequency/residual.json)
  的稀疏非零元素列表均为空。
- 六个历史目录共3,465个文件，在批次前、后和终态收尾检查中均未改变。
- 终态结束后只读复核了651个登记产物哈希，全部匹配；加终态回执共652文件，
  未发现额外产物。544个当前源码均与冻结摘要一致。
- 监督器确认所有所属进程已退出；后续只读进程查询也未发现本批残留。

后续检查仅读取回执、文件与哈希；没有在600秒批次之外补跑数值复算，
没有修改预登记/冻结源码、旧证据或本批证据。本报告单独追加。

## 仍未验收的目标

`physical_gate=false`、`live_admission=false`、`scientificPayloadWriteback=false`。
非恒定背景/非线性约束传播、全方向统一能量估计、一般profile、物理边界、
独立约束收敛、长期黑洞演化、真实AMR、双黑洞波形和GPU均没有因此升级。
全频有理恒等式是在固定背景/固定方向上成立，不是对所有背景和方向的证明。

建议下一步先衔接这一完整低阶符号与现有主部能量构造，明确频率权重、
rho趋零时的可达空间以及低阶增长界，再决定推广背景/方向和边界验证的
预登记命题。新数值批次需另行授权；本次一次性授权已经执行完毕。
完整总目标尚未完成，不能据本报告标记为世界领先或允许shadow切入live。

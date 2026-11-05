# 固定 case12 完整58维全方向主部谱：完整通过

日期：2026-10-14。顶层广义相对论开发 goal 仍为 active。本结果属于固定背景、`geometric=False` 有理公式延拓的本地精确证书；未执行新的物理时间演化。

本批在原 600 秒、64 MiB 输出限制内完成唯一一次受监护运行。138 项控制、主计算、完整58维独立重放、来源与历史核对全部通过。worker 326.266 秒，完整监护 390.781 秒，exit 0；进程清理核对 0→0，重试 0。

## 结果与来源

- [机器终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-full58-spectral-controls-v1-20261014/qualification-gate.json)：`passed=true, completed=true, errors=[]`。
- [独立重放](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-full58-spectral-controls-v1-20261014/independent-replay.json)：26 份实际解析输入，完整58维计算。
- [预登记](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/EXPERIMENT-20261014-case12-full58-spectral.md)、[推导](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/DERIVATION-20261014-case12-full58-spectral.md)、[运行入口](E:/86137/myai/solar_sim/next-web/scripts/run-nr-k3-case12-full58-spectral.py)。

| 项目 | 已观察结果 |
|---|---|
| 单元控制 | 45 函数、138 实例；无失败、错误或跳过 |
| 主矩阵 | 11 个完整58×58矩阵，37,004 显式槽 |
| 必须为零的残差 | shift、embedding、Z6 共10,092槽全部精确为零 |
| 核心13次谱残差 | Z6全部3,364槽精确为零 |
| 真实证书扰动 | 两个完整58×58负控矩阵、6,728槽；实际mutant为1非零槽/1系数，拒绝成立 |
| 零模Jordan负控 | N²=0但奇消去非零；1非零槽/91系数，独立重放一致 |
| 来源 | 630项，快照6,159,831字节；运行前后及快照一致 |
| 历史 | 20目录/14,144文件，包含旧失败，前后不变 |
| 运行依赖 | 557项已加载文件摘要；SymPy1.13.3、NumPy2.2.6、pytest8.3.4 |
| 产物 | 701项artifact摘要，加终态共702文件，22,659,390字节 |

run_id：`976bf531-dfb7-4cdf-979c-3aaf3dbe74e6`。

终态后另由只读审计全量核对701项产物、630项当前源码/快照/前后记录、20目录14,144历史文件、557运行依赖及26重放输入，错误列表为空。138个JUnit实例也与AST登记、保存JSON一致。审计只读取字节、JSON、XML及摘要，没有补算数学、重跑候选或改动原终态。

## 实际核验的恒等式

使用已接受主部闭合批的K，不重建K或右截面。令 `r=x²+y²+z²`、`g=vᵀh⁻¹v`、`b=β·v`、`Pi=diag(0_11,I_47)`。原 `intrinsic` 的完整58结果实际与 `K0=K−bPi` 逐项一致。原法向度量getter及六个平方速度函数的AST保持公式不变，实际验证 `r*squared_speeds=c_j*g`。

六常量按原顺序为 `2601/100000,2601/50000,2601/5000,153/125,459/250,306/125`，没有多乘r²、删除后面三个分支或进行拟合。

先验收完整58零行/列、移位与嵌入恒等式，再执行47块生产递推并逐阶段完整嵌回58。标准库独立重放直接计算完整58矩阵：

`Q=K0²; Z0=K0; Zj=Z(j−1)Q−c_j*g*Z(j−1), j=1..6`。

因此本批验证了 `K0∏(K0²−c_j*g*I58)=0`。这是消去多项式，未认定最小多项式或各分支重数。全部非零单项式也已核验其登记齐次次数。

| 矩阵 | 非零槽 | 系数项数 | 实际最高次数 |
|---|---:|---:|---:|
| Pi | 47 | 47 | 0 |
| K0 | 807 | 1,476 | 1 |
| Q | 1,107 | 4,344 | 2 |
| Z1 | 966 | 7,011 | 3 |
| Z2 | 966 | 15,729 | 5 |
| Z3 | 774 | 21,825 | 7 |
| Z4 | 729 | 32,784 | 9 |
| Z5 | 729 | 46,926 | 11 |
| Z6 | 0 | 0 | 零多项式 |

生产和重放使用不同矩阵维度路线及不同多项式算术实现。重放绑定已通过控制的精确整数卷积模块；完整链条于268.860秒保存通过结果，随后完成依赖、来源、历史和终态检查。

负控之一为 `N=x E01`，N²=0，但同一六阶段奇多项式得到 `(+∏c_j)g⁶N≠0`，防止仅检查平方谱遗漏零模Jordan链。另一个对实际Z6的[11,11]添加x¹³，保存delta与实际mutant；这属于证书扰动，没有声称重新运行错误物理K。

## 结论范围

固定域内h正定，所有实v≠0均有g>0。六常量正且互异，13次消去多项式具有互异实根，因此固定case12的K0逐方向实可对角化。结合已验证ODE/PDE直和，原含shift的K也逐方向实可对角化。

本批 `full58_principal_spectral_validated=true`、`pointwise_real_semisimplicity_validated=true`。完整58统一能量和统一强双曲性资格仍为false，待单独证书；既有43维能量成功不替代该门。低阶项、零频约束、变背景、非线性演化、合法边界、收敛、单黑洞、AMR、波形及外部复现仍未由本批完成。

`physical_gate=false`、`live_admission=false`、`scientificPayloadWriteback=false`；积分步数、native调用、GPU运行均为零。原物理阈值2e-12未改变，本代数证书只接受精确零。旧失败结果未重跑或重评。

## 冻结身份

- gate：`b1f20875989575329e37267a8ff8eb45e57d761e34063b53df077bb007ee209f`
- worker：`57059edd39496954067c33edb8ff62e9b1432a8f0ce1de2659888105200888a2`
- replay：`6d5b41b3beedd01b961cecf069a31082e1b64934c7aec7a600cc5568981b1433`
- runner：`f9f8470c2d9c28ddb034f70912cbf381caed49f0fbf70da8e3bce224d36a8483`
- 生产模块：`7a5511bcb877e88175143096c0f789eee19b6f723df6f6c7390c97d59e05d5a8`
- 新测试：`1a6915d7aba4490f38d79edcaba58fbbdc8bb8ca14bf77575d8a01801b1b5bae`
- 整数算术：`5b4f8e7510cd32064cef2266d6d1d472bb1bde2f842f0836b37bcc0c74ddef7f`

本结果文档在终态后新增，不回写本批冻结630项来源。下一候选见[完整58分解式能量备忘录](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/NOTE-20261014-case12-full58-factorized-energy-next.md)。

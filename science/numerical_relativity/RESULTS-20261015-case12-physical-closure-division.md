# 固定 case12 物理闭合精确约分：完整受限批次通过

日期：2026-10-15，Asia/Shanghai。Origin Skill：academic-research-suite / experiment-agent，沿用现有工作流。性质：已完成的本地精确证书及独立算法重放；不是外部团队复现。顶层 goal 仍 active。

## 结果与范围

固定除数 `f=Δ²=χ²r⁴g⁴` 对已接受物理闭合的三个系数 `Bbar0/1/2` 均可精确整除。实际得到 `Q0/Q1/Q2`，逐单项式方向次数分别为0/1/2；完整直接恒等式 `Q(ζ)C(ζ)=C(ζ)(J58+ζK58)` 的0..4五幂全为零。原shift保留，geometric=False与固定case12背景保持。

因此 `ζ^j Qj(v)=Qj(ζv)`，新算子是原固定常背景线性约束模型的局部多项式符号。多项式恒等式可延拓到方向原点；旧Laurent坐标与右逆没有在零频求值，C0的可达像仍为39维，没有恢复43维零频右逆或像外唯一性。

本批不证明实际非线性RHS来源桥、变背景、统一频率能量、阻尼、合法IBVP、离散收敛或黑洞演化。`physical_direction_polynomial_generator_validated`、`fixed_background_local_symbol_validated` 为true；原17项限制标志仍false，包括 `local_differential_constraint_pde_derived`、`physical_gate`、`live_admission`、`scientificPayloadWriteback`。

## 唯一实际运行

目录：`tmp/nr-shadow-evidence/nr-k3-case12-physical-closure-division-controls-v1-20261015`。

- [资格终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-physical-closure-division-controls-v1-20261015/qualification-gate.json) SHA：`7fb40ea60452cd0c81e932802dfb5a2295a1375f3eda85c0c1cd5fda51270fe6`。
- worker SHA：`d1f3655acbcc2ad2933c203d34162fe4720fa3526d434a75d9bdbf730e6017b6`。
- independent-replay SHA：`bd21c592008bf3b432267b355ee6f34948d7b00a3ef09500ff3afc7cc4ba9deb`。
- run ID：`74a58395-d1e0-4783-9c05-f3ebac49a05f`。
- worker **126.312秒**；完整监护 **174.484秒**。外层会话8351实际exit0，worker PID3052退出；终态passed/completed均true、errors为空。
- Windows Job绑定成功，所属进程清理前后0→0，cleanup_verified=true；重试0，无注入或中断。

原600秒/64 MiB磁盘输出上限、2 MiB终态预留、8 MiB来源快照限制、单数值线程与C/E磁盘底线保持。生产复用冻结SymPy长除，入口/每行/出口有完整guard，内部没有逐步回调；外部Job仍强制截止。独立Fraction长除每32步检查deadline，逐行完整guard。不存在提前数学试跑、预算扩张或失败结果拼接。

| 阶段 | worker相对秒数 |
|---|---:|
| 输入、来源及历史完成 | 44.406 |
| 137控制完成 | 48.906 |
| 全部生产证据保存 | 63.172 |
| 完整独立重放完成 | 75.297 |
| worker完成封存 | 126.281 |

## 完整数学覆盖

QQ[x,y,z]、lex次序，固定除数的领先指数为(16,0,0)，领先系数为 `526714450291093018406195601/931322574615478515625000000`。生产与独立长除均使用实际非首一系数，不作单项式或首一假设。

每个原分子保存 `A=fQ+R` 与 `M=A−fQ` 的完整商、正规余式及乘回残差。独立算法重新长除，验证正规余式及 `M=R`，再要求R/M全部精确为零。商按cap6完整保存后才检查次数j；没有用cap=j丢弃错误高次项。

| 矩阵族 | 完整矩阵数 | 显式位置 | 结果 |
|---|---:|---:|---|
| Qj/Rj/Mj，j=0..2 | 9 | 16,641 | 三商逐槽一致；六R/M全零 |
| bad_A/bad_Q/bad_R/bad_M | 4 | 7,396 | 实际扰动与完整长除被独立重建 |
| direct_closure，0..4 | 5 | 12,470 | 五幂全部精确零，包括最高幂 |
| 合计 | **18** | **36,507** | 全部独立验收 |

六个R/M加五个direct矩阵共 **11个矩阵、23,564个必需零位置**，全部精确为零。direct按cap8完整保存，失败分支也不截断。

| 商 | 非零位置 | 单项式数 | 实际次数 | 保存上限 |
|---|---:|---:|---:|---:|
| Q0 | 58 | 58 | 0 | 6 |
| Q1 | 568 | 795 | 1 | 6 |
| Q2 | 113 | 450 | 2 | 6 |

Q0/Q1/Q2的全部1,303项均满足对应齐次次数，错误次数位置数均0。这里的表示缩减不构成时间演化加速比。

真实负控固定 `bad_A=Bbar0+E00`，实际重做全部43×43长除。bad_R和bad_M各恰有1个非零位置、1个常数项，并被拒绝；其除法恒等式和正规余式检查通过。没有把理论预期余式写入结果。

## 来源、控制与封存

| 项目 | 实际记录 |
|---|---|
| 测试 | 43函数、137实例；0失败、错误或跳过 |
| focused / 冻结整数控制 | 22/64与21/73 |
| 新来源闭包 | 664文件，6,807,905字节 |
| 历史保护 | 25目录，17,995文件，473,039,362字节 |
| 完整本批文件 | 768摘要加终态，共769文件，24,328,510字节 |
| 已加载运行时 | 557文件，17,244,821字节 |
| 父输入 | 16份，9,280,154字节 |
| 实际重放输入 | 42份，10,276,408字节 |
| 阶段回执 | 49份 |

生产SHA：`81bb46b7bf42cbf63cd09c6bb17b5b8b7fe55311431624c7a38915d9a7c03344`。

runner SHA：`ff9db28a40dedeca8836431353cf287aba11d09a583177143bd79f3a1557efb6`。

focused测试SHA：`60d035d56dfda5f5c2f977a95c9e9656a344c8c66768cd199a947642ec34325c`。

新结果身份：

| 文件 | SHA256 |
|---|---|
| Q0.json | 3cddc74765ece71528acd71ac9242a5a9561ffccb9c938f16c759e83adf688f7 |
| Q1.json | 9a372062e712650085372790768bd62fe26f1e74b84511fe0712f9ca82734a08 |
| Q2.json | 411902fe63bd4662fc432d7a42dfb379835126bb8d970bb629c5cdaf557c4bbb |
| scalars.json | 316b1c6553f9d912cf22d55fd9d6b24d919c8e9a58148ca64171e427bf5785a5 |

终态后root只读核对所有产物、当前来源及快照、全部历史、运行时、42解析输入与XML测试身份，errors=[]；该审计只用JSON/XML/AST和字节摘要，未加载NumPy/SymPy或补算科学矩阵。第二路独立审计覆盖相同完整集合，亦errors=[]，并核对bad_A唯一新增常数、bad_Q等于Q0、bad_R=bad_M且唯一[0,0]=1。两路审计均未补算科学矩阵；运行时摘要覆盖Python可执行与已加载模块，不代表全部OS DLL。

## 接续

下一步完整计算 `Z=(rT)Q(rTi)=r²TQTi` 的−2..6九幂，验证全部高于一阶的项为零，并比较一阶项与已接受43维主部。通过后再用实际低阶系数构造全方向高低频增长界，保持S43缩放与零频39像。见[下一候选备忘录](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/NOTE-20261015-case12-physical-frequency-reduction-next.md)。该候选尚未执行，不改变当前低阶能量或边界资格。

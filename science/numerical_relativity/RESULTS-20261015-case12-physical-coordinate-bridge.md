# 固定 case12 全方向物理43坐标桥与零频39像：完整通过

日期：2026-10-15，Asia/Shanghai。唯一受监护批次已完整完成，顶层广义相对论goal仍active。本批补齐物理约束定义与已接受全方向主部之间的坐标桥，没有执行时间演化。

71项控制、78个完整矩阵、101份输入的独立精确重放和来源/历史/依赖核对均通过。worker79.562秒，完整监护113.750秒，exit0；Job清理0→0、cleanup_verified=true、重试0。原600秒/64 MiB输出限制、2 MiB终态余量、磁盘保留、单数值线程和2e-12物理阈值保持；代数验收只接受精确零。

## 证据和计数

- [机器终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015/qualification-gate.json)：passed=true、completed=true、errors=[]。
- [独立重放](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015/independent-replay.json)、[逐矩阵统计](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015/stats.json)。
- [预登记](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/EXPERIMENT-20261015-case12-physical-coordinate-bridge.md)、[推导](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/DERIVATION-20261015-case12-physical-coordinate-bridge.md)、[入口](E:/86137/myai/solar_sim/next-web/scripts/run-nr-k3-case12-physical-coordinate-bridge.py)。

| 项目 | 已观察结果 |
|---|---|
| 控制 | 27函数、71实例，失败/错误/跳过均0 |
| 矩阵证据 | 74主矩阵149,555槽；4负控矩阵8,686槽；总78矩阵158,241槽 |
| 完整主残差 | 42矩阵82,569槽，全部精确零 |
| 解析输入 | 16父输入3,696,666字节、78矩阵、7元数据，共101份 |
| 来源 | 643项，快照6,440,283字节；前后、当前文件和快照一致 |
| 历史 | 22目录15,534文件，全量保持，旧失败未重评 |
| 依赖 | 557项加载文件摘要；SymPy1.13.3、NumPy2.2.6、pytest8.3.4 |
| 产物 | 852项artifact摘要，加终态共853文件18,483,243字节 |

run_id：`c12ab299-a46f-469e-b529-88218e6ea24e`。生产证据于40.672秒完整保存，独立重放于47.609秒完成，随后完成来源/历史/依赖及终态核对。

终态后纯标准库审计全量核验产物文件集及摘要、643份实时来源/快照、22历史树、557运行文件、101重放输入和71个JUnit实例，errors=[]。该审计没有重新执行数学或测试，没有补写受控目录。

## 实际核验的全方向关系

方向v=(x,y,z)为实非零，r=vᵀv>0；频率使用独立Laurent索引ζ。原物理约束C(ζ)=C0+ζC1+ζ²C2和原代数源J严格绑定冻结公式，保持所有对称非对角倍数和行列索引。C0/J与原已资格化常数输入逐槽一致；C1/C2和W/U由独立标准库指标公式重建。

| 矩阵 | 非零槽 | 系数项 | 最高方向次数 |
|---|---:|---:|---:|
| C0 | 55 | 55 | 0 |
| C1 | 72 | 99 | 1 |
| C2 | 7 | 27 | 2 |
| J | 302 | 302 | 0 |
| [rTC]−1 | 99 | 99 | 2 |
| [rTC]0 | 235 | 657 | 3 |
| [rTC]1..4 | 0 | 0 | 零多项式 |

W/Wi完整频率支持−1..1，U/Ui为0..1，T=WU与Ti=UiWi为−1..2。W/T方向分母统一清r，双逆清r²；U双逆残差也统一乘r²。六个双向逆的全部登记幂被保存和独立重算，包括极端幂的显式零矩阵。

完整保存rTC的−1..4系数，证明其零次系数等于已接受Dtilde=rDhat，正幂1..4全部为零。负一次系数实际非零并保留，故关系为

`T(ζ)C(ζ)=Dhat+ζ⁻¹R`，`R=[rTC]−1/r`。

本批不能把负一次项删去后将Dhat的右截面直接作为物理C的右逆。Laurent变换只在非零频率使用；没有在ζ=0求逆或代入奇异变换。

## 零频物理像和真实负控

原C0的前四行完整为零，剩余D39为39×58。复用原接受的S39和B39，实际重新计算并独立验收D39S39−I39=0、B39D39−D39J=0、C0下39行−D39=0以及前四零行。因此零频可达像秩39、在J下不变。

像外歧义E=E40完整保存，确实非零而EC0=0；full43_right_inverse_exists=false。该结论不把物理像上的唯一作用扩展为任意43维约束向量上的唯一延拓。

两负控都修改实际rW0系数，再用完整乘积计算受影响的一次幂：

`[rTC]1_mut=[rTC]1+δW0 U0 C1+δW0 U1 C0`。

| 扰动 | δW0非零槽 | 实际残差非零槽/系数 | 结果 |
|---|---:|---:|---|
| 删除determinant补偿行的18个系数位置 | 18 | 6 / 36 | 拒绝 |
| 将真实对称非对角倍数减半 | 1 | 1 / 3 | 拒绝 |

这两项属于实际坐标公式扰动，没有直接给残差填非零常数。完整四个负控矩阵和独立重算均保留。单位控制另确认首次C0输出发生sink错误时立即抛出，后续Laurent乘法不执行。

## 资格范围

physical_coordinate_bridge_validated=true、zero_frequency_physical39_validated=true。固定case12源公式、实非零方向和相应非零Laurent频率范围明确；完整Python语义形式化或外部人工复现未成立。

本批未构造全方向B0/B1/B2，未证明C(J+ζK)=BC的全部频率幂，未计算TBTi的低阶系数或方向一致增长界。原固定射线低阶结果不被推广。geometric=True/实际非线性RHS来源桥、变背景、合法IBVP、离散收敛、黑洞、AMR和波形仍为后续门槛。

physical_gate、live_admission、scientificPayloadWriteback、full_frequency_closure_validated和full_frequency_energy_validated均false。integration_steps、native_calls、retries均0。源文件和全部旧成功/失败证据保持。

## 冻结身份

- gate：`466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708`
- worker：`9a0af8284a5cdd35c3723d3be5141f2659b4ee1ba6c77b1ba78923dcf1446811`
- replay：`7751521463cdade0039d8e36b405dac40f8faca3b98c9b02100c75165e370104`
- runner：`79777e3b5e71f4998236f6b71f57e38d4ff79eb039d0002decf11a3975bdd787`
- producer：`b69ec375a81ed04b22b438e90e56083afb706702d67a70fcef5eff032bff96f0`
- tests：`3f697c234c795165b19481761f1089c09224325e6ba6bf688d535c6752e05a30`

本结果在终态后新增，不改写本批643项冻结来源。后续候选先处理非零频率物理右截面和完整闭合，再衔接低阶范数与合法边界。

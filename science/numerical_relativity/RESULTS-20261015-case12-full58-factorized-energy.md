# 固定 case12 完整58维主部：方向统一分解式能量通过

实际执行日期：2026-10-15，Asia/Shanghai。推导、协议和输出目录沿用2026-10-14预登记身份，没有因跨日修改冻结来源。顶层广义相对论开发goal保持active。

本批已完成唯一一次受监护运行：100项控制、完整证书生产、独立标准库精确重放、来源/历史/依赖核对全部通过。worker 60.140秒，完整监护87.359秒，exit 0；清理核对0→0，重试0。原600秒/64 MiB输出上限、2e-12物理阈值及精确零代数验收均未改变。

## 证据与实际结果

- [机器终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-full58-factorized-energy-controls-v1-20261014/qualification-gate.json)：passed=true、completed=true、errors=[]。
- [独立重放](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-full58-factorized-energy-controls-v1-20261014/independent-replay.json)、[实际系数与定量界](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-full58-factorized-energy-controls-v1-20261014/bounds.json)。
- [冻结推导](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/DERIVATION-20261014-case12-full58-factorized-energy.md)、[冻结协议](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/EXPERIMENT-20261014-case12-full58-factorized-energy.md)、[运行入口](E:/86137/myai/solar_sim/next-web/scripts/run-nr-k3-case12-full58-factorized-energy.py)。

| 项目 | 已观察结果 |
|---|---|
| 控制 | 28函数、100实例；无失败、错误、跳过 |
| 一元关系 | 69条实际关系，商、余式及乘回残差由独立Fraction算法重建 |
| 形式能量系数 | 九个14×14表及八个14分量差向量，共1,876槽 |
| 形式残差 | 对称性、主部、Pi和Gram四项，共784精确零槽 |
| 实际算子界 | 完整K0的3,364槽逐一扫描；保存每槽绝对系数和、七个投影界和已求值有理上界 |
| 负控 | 非零零速Jordan块与实际zero-action关系加1扰动均被独立识别 |
| 来源 | 637项，快照6,298,864字节；当前文件、前后记录及快照一致 |
| 历史 | 21目录、14,846文件，包含旧失败，前后不变 |
| 重放/依赖 | 21份实际解析输入；472项已加载运行文件摘要；SymPy1.13.3、NumPy2.2.6、pytest8.3.4 |
| 产物 | 687项artifact摘要，加终态共688文件、13,146,441字节 |

run_id：`4c99eff0-ed2a-4e58-a9d7-19f54abc33dc`。完整候选于27.703秒保存，独立重放于30.890秒完成；其后核对依赖、来源、历史及终态。

终态后只读全量复核所有产物、637项来源/快照、21历史目录、472依赖、21重放输入及100个JUnit实例，errors=[]。该审计只处理文件、摘要、JSON和XML，没有终态外补算数学或重新运行测试。

## 实际证明的能量

固定case12、原58坐标顺序、geometric=False和实非零方向v。父谱证书已接受K0=K−bPi、Pi=diag(0_11,I47)，以及K0乘六个平方速度因子的完整13次消去恒等式。本批按父摘要复用该证明，重新核对实际K0/Pi结构和零残差，没有重跑七次大型矩阵乘法。

令g=vᵀh⁻¹v、T=K0/√g，使用原六个正常数cj和七节点Lagrange多项式ej。Ej=ej(T²)Pi，E0=Pi−ΣEj，Aj=K0Ej，O=I−Pi。实际能量以完整分解式指定：

`H=O+E0ᵀE0+(1/2)Σ[j=1..6](EjᵀEj+AjᵀAj/(cj*g))`。

69条商余式关系包括所有49个有序投影关系、完备性、六个action、六个speed、六个transfer和关键的零模一次作用；不能用平方谱代替最后一项。14个实际58×58算子因子的右作用与形式Gram系数共同证明H=Hᵀ、HT=TᵀH、HPi=PiᵀH，因而HK=KᵀH。八组件权重保留(1,1,1/2,…,1/2)，直接构造全部八个差向量Gram，得到H≥I58/14。

从实际K0完整系数得到

`B=9555297973036586957/35762786865234375`，`g≥(5/6)|v|²`。

以七个实际插值多项式的绝对系数和计算qj，再完整计算

`C=1+q0²+(1/2)Σqj²+[B²/(2m)]Σ(qj²/cj), m=5/6`。

具体已约分有理数C保存在bounds.json的upper，并与独立重放uniform_upper逐字一致；没有以未求值公式代替验收。因方向分母仅为正g的幂和固定非零节点差，H在v≠0光滑、齐次零度，单位球上下界延拓至所有非零方向：`I58/14≤H(v)≤C I58`。该上界保守，不证明良好实际条件数、阻尼或离散稳定步长。

## 资格范围与未完成项

本批四项资格为true：full58_principal_factorized_energy_validated、full58_principal_energy_validated、direction_uniform_energy_validated、uniform_strong_hyperbolicity_validated。范围严格为fixed-case12 full58 principal rational direction extension; geometric=False。

证据形式是完整分解式Gram及其多项式作用、二次型系数证书。14×14表是实际58×58因子的系数表，不是14变量物理系统。本批没有展开或保存完整58×58的H或HK多项式；expanded_full58_energy_validated和full58_expanded_matrix_residuals_validated均false。它也不是方向无关的共同对称化矩阵。

物理43约束的全方向Laurent变换、完整低阶闭合、频率范数及零频39维像仍需衔接；原固定射线结果不自动推广。变背景、非线性、合法边界、收敛、单黑洞、AMR、波形与外部复现未由本批完成。physical_gate、live_admission、scientificPayloadWriteback均false；integration_steps、native_calls、retries均0。所有旧失败资格保持。

## 冻结身份

- gate：`64bd6ca11c1ba12efa3f5e437be91aef46780c747a751f1d1706ff44786618d4`
- worker：`35321c15846f5e47524e744a9da966f3bbb0ea24c1957a3c5ddda51283e00357`
- replay：`6408ac4ce3891266f2c0c571f92daeb8d33354a621f3e78a459221933948480d`
- bounds：`9359dc3a5b36e6ed267a88a31eb3198b1e1fc163d723814faf96251706f0a607`
- runner：`b29bc5d541fff761a351e163dfce99c03f63a9cc198dbe600341f09dc5e90fb4`
- producer：`0c31512044e9a748533146c8feeec1c8efa196310678c51ad9025edd7bbe38b8`
- tests：`60a679f4fae57571d4fbb24c4c3911a7b334905b7830e8b1173dbf2ecd2270a8`

本结果在终态后新增，不回写本批637项冻结来源。

# 下一候选：固定 case12 全频率增长界与明确的频率范数

状态：**未实现、未执行、未计算任何新增长常数**。本备忘录于2026-10-15根据已接受来源、JSON记录和纸面代数编写；只进行了文件、摘要和元数据读取。它不属于前一批671项冻结来源，也不回写任何旧证据。下一候选须先冻结实现、完整控制及协议，再进行唯一一次 owned worker；仍为600秒、64 MiB输出上限，失败保存、不自动重试。

## 1. 已接受父证据与两项独立目标

物理频率降阶父目录为 `tmp/nr-shadow-evidence/nr-k3-case12-physical-frequency-reduction-controls-v1-20261015`：

- gate `5817e42e5c38ff682146acf3ce8eb5afe439b5cfadddf0dc1e27f91c6ab2688d`；
- worker `c2739fbb4c40365cecb700c73522349bdcff0e116542b3d5ef2aa5280c3d9296`；
- replay `7df5f34321f744a41dce72687ad3f0511627bd0ac064a34be6d8a2f362f7802b`。

该父已完成20个矩阵、36,980槽以及6项残差的11,094个精确零槽；worker92.312秒、监护129.453秒。终态后来源/历史全量审计由主任务负责，下一批仍须重新绑定其通过终态及实际输入摘要。本备忘录不替代运行入口的父资格校验。

下一批分别建立：

1. **完整58维原状态、固定常背景的频率一致L2增长估计**，使用已接受H58与实际常数J58；
2. **物理43维约束系统的频率加权增长估计**，高频使用T拉回的H43，低频直接使用物理多项式Q。

两项资格必须独立命名。第二项不得记作物理43维plain-L2一致能量、无导数损失或方向无关的共同对称化矩阵。两项均不晋级geometric=True、变背景、实际非线性RHS集成、边界或时间演化资格。

## 2. 能量父身份与严格读取字段

完整58能量父：`tmp/nr-shadow-evidence/nr-k3-case12-full58-factorized-energy-controls-v1-20261014`。

| 文件 | SHA256 |
|---|---|
| qualification-gate.json | `64bd6ca11c1ba12efa3f5e437be91aef46780c747a751f1d1706ff44786618d4` |
| worker-result.json | `35321c15846f5e47524e744a9da966f3bbb0ea24c1957a3c5ddda51283e00357` |
| independent-replay.json | `6408ac4ce3891266f2c0c571f92daeb8d33354a621f3e78a459221933948480d` |
| bounds.json | `9359dc3a5b36e6ed267a88a31eb3198b1e1fc163d723814faf96251706f0a607` |

严格读取 `bounds.json` 的schema=`nr-case12-full58-factorized-bound-v1`、shape=[58,58]、lower=`1/14`、upper、m=`5/6`、sphere=`r=1`、accepted=true；记实际upper为C58。还需绑定其source bridge、domain及终态/独立重放所接受的完整分解式能量、HK与HPi关系，而非仅拷贝一个上界数。

43主部能量父：`tmp/nr-shadow-evidence/nr-k3-case12-polynomial-energy-controls-v2-20261014`。

| 文件 | SHA256 |
|---|---|
| qualification-gate.json | `df247bc18a9366efa076382ad0ecf350e807277dd0fb6d59296a45a68ec07ee1` |
| worker-result.json | `69fde64c207c93010fa6d0e1818fe29847e15521810d7ac83b8acc1b9bb3ebbd` |
| independent-replay.json | `fe9957094c2a8bb44613773f80cccdd2c8e1e4a2d49fd16cd3aa062fb5bd8ee9` |
| bounds.json | `476c0141567c4b8ec8dd04423f68b934bb0b8d33975c4054d209731447ec17ca` |

严格读取schema=`nr-case12-energy-coefficient-bound-v1`、shape=[43,43]、lower_energy=`1/14`、upper、g_lower=`5/6`、consistent_lower_upper=true；记upper为C43。绑定实际完整Hsym/HL/HP/Gram及域父证据。两份upper均必须重新以规范有理数字符串解析并核验 `C>=1/14`；不依赖Python数值相等来容许bool/float或非规范分数。巨大有理数直接从已绑定字段读取，本备忘录不抄写或重新计算。

原J58取坐标桥已接受的 `J.json`，SHA256=`19addd44143b8c3d3b9a1829e4848b8b4631bdfd3f8b9502f496ef7d94cbcc8b`。原shift K58的SHA256=`e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283`。下一实现须冻结完整父路径/资格/产物关系；存在同名副本不构成授权替换。

## 3. 原58坐标与频率归一，不引入状态S58

下文Fourier状态允许复数，星号 `*` 一律表示复共轭转置；上标 `^T` 表示实系数矩阵的转置。物理拉回能量矩阵是 `T(n,i*rho)* H43(n) T(n,i*rho)`，不得将复T的普通转置代入。

`scripts/nr_profile_exact_coefficients.py` 的 `principal_rates` / `matrix` 使用原58槽顺序；`normalized`仅将K(v)整体除以sqrt(r)，r=v·v，并未作状态相似变换。`scripts/nr_constraint_full_symbol.py:source`使用同一槽顺序，只读取固定h、h逆、beta、alpha、chi，完全不读取ray。因此n=v/sqrt(r)、rho=|xi|时，原主系统的Fourier矩阵为

`M58(n,rho)=J58+i*rho*K58(n)`。

K58保留原shift；不能替换成K0。H58虽通过K0构造，但父HPi和K=K0+bPi已给出HK58=K58^T H。

`nr_constraint_exact_coefficients.py:leading`中的B58仅解释43维leading-map的有理缩放。本候选不把B58施加到完整58状态，也不把J换成B58^-1 J B58。若未来另选该状态坐标，J及范数须重新推导。

固定单位球r=1时，43维S43也是单位阵。使用原H43与Khat43=Ab/r的既有对称化即可；不再漏乘或多乘sqrt(r)。离开单位球时须明确使用旧 `normalized` / `normal_coordinates` 的S43转换，不能把单位球公式直接解释成另一套状态坐标。

## 4. 完整系数L1证书

对每个实际输入矩阵A(n)，令

`ell_ij(A)=sum_alpha |a_ij,alpha|`，`ell(A)=sum_ij ell_ij(A)`。

每一槽都保存[i,j,canonical-rational]，包括零槽；严格检查原多项式shape、每个幂三元组、全部有理系数和次数合同。由于单位球上每个|n_i|<=1，`||A(n)||2<=ell(A)`，不需要取方向样本、拟合特征值或重新展开H。独立重放须直接从实际父多项式逐系数重算每槽及总数。

建议15份主表：J58一份；Q0/Q1/Q2三份；Z[-2]/Z[-1]/Z[0]三份；t[-1..2]四份；u[-1..2]四份。共14个43×43表及一个58×58表，**29,250个完整槽**。这是系数绝对值和表，不是29,250个新矩阵残差或方向样本。

J须逐槽验证为常数；Qj须逐项验证方向齐次次数j。Z、t、u依父预登记cap解析，不错误要求整张矩阵方向齐次。父Z[-2]实测全零，Z[-1]为18非零槽/54项/degree3，Z[0]为764/5529/degree5；这些统计只帮助设计，下批仍须读取实际全部槽。保留Z[-2]完整表和其零结果，不从公式中暗删该支。

## 5. 完整58维增长估计

记h=1/14，j=ell(J58)。对rho>0及原状态y，令E58=y*H58(n)y。父证据给出hI<=H58<=C58 I和HK58=K58^T H58，因此

`E58'=y*(H58 J58+J58^T H58)y <= 2*C58*j*|y|² <= Gamma58*E58`，

`Gamma58=2*C58*j/h=28*C58*j`。

i*rho主部恰好消去，不必计算新的H58J58矩阵或放大成完整展开能量。这里的定量界保守，不声称阻尼或sharp条件数。C58是很大的保守系数界；有限增长证明不等于可用误差容限、实际条件数或稳定时间步，不在本备忘录报告未计算的新数值。

rho=0时直接使用Euclidean零模能量Ezero=|y|²及增长率 `Gamma58zero=2*j`。保存两项及其max；C58>=h保证统一增长率等于Gamma58。若将零模和非零模写为一个全频率能量，零模采用I，故统一上界取 **C58global=max(C58,1)**，下界仍h。不能仅凭C58>=h把零模上界写成C58。

可据此给出固定常背景Cauchy系统的统一L2增长估计。rho=0无需指定方向n，也不需要Laurent映射。空间无边界或周期解释与IBVP必须区分。

## 6. 物理43维低频与高频增长

固定cutoff `rho_star=1/2`，始终rho>=0。令qj=ell(Qj)。对0<=rho<rho_star，直接使用已接受物理符号

`Q(n,i*rho)=Q0(n)+i*rho*Q1(n)-rho²*Q2(n)`，

得到Euclidean平方范数增长率

`Gamma43low=2*(q0+q1/2+q2/4)`。

高频rho>=rho_star时令w=T(n,i*rho)c；父t=rT、u=rTi及r=1给出T=t、Ti=u，均可逆。固定背景下T不随时间变化，已接受降阶给出

`w'=[i*rho*Khat43(n)+Z0(n)+(i*rho)^-1*Z[-1](n)+(i*rho)^-2*Z[-2](n)]w`。

下批必须绑定九个Z的完整保存范围，重验2..6全零及leading_residual=Z1-rAb全零，不能只相信一个flag。取cp=ell(Z[p])，E43=w*H43(n)w，得到

`Gamma43high=28*C43*(c0+2*c[-1]+4*c[-2])`。

保存实际c[-2]及其零检查，即使最终为0仍保留该项来源。统一加权能量的增长率为max(Gamma43low,Gamma43high)。此能量按固定频率分段定义；无需在cutoff对状态作时间切换，也不据此宣称频率乘子在cutoff光滑。

## 7. T/Ti频率权重不可省略

父坐标桥已保存t[-1..2]、u[-1..2]全部系数及两侧逆。其实际t2完整为零，u2非零；下一批须重新解码t2全部1,849槽并核验零，再启用一次/二次阶数结论。记ap=ell(tp)、bp=ell(up)，则rho>=1/2时

`||T|| <= A_T*(1+rho)`，`A_T=2*a[-1]+a0+a1`；

`||Ti|| <= A_i*(1+rho)^2`，`A_i=2*b[-1]+b0+b1+b2`。

实际非零可逆父保证A_T、A_i为正，但仍须在运行时核验，禁止除以未验正的数。若t2非零，候选失败；不得自动改成二次阶或搜索另一权重。

因此高频物理约束能量满足

`h/[A_i²*(1+rho)^4] * |c|² <= E43 <= C43*A_T²*(1+rho)^2 * |c|²`。

这是具体的频率加权范数合同。粗略转回同一Euclidean频率范数时，流上界带 `(1+rho)^3`，平方范数带六次权重；可解释为一条保守的有限Sobolev阶数余量估计，**不能宣称三个导数是必要或最优损失**，更不能写无导数损失。更精细分量权重、等价Sobolev空间或plain-L2一致界仍是另外的证明单元。

## 8. 零频物理像

低频Q0多项式延拓可在全43坐标书写，但实际C0只有既有39维可达像。下一候选须绑定坐标桥的C0、旧D39/S39/B39及通过的右截面/传输/像外歧义证据，明确实际零频约束只在该像中解释。不得将全43多项式延拓或本次增长估计称为C0的43维逆或像外唯一生成元。T/Ti不在rho=0求值。

## 9. 输出、负控与独立重放建议

主输出建议：上述15份完整系数表；58增长、43低/高频增长、变换权重三组定量记录；严格域/归一说明；父身份、来源AST桥、完整输入摘要、acceptance与统计。所有求值常数保存规范已约分有理数；不只保存待求值公式。父C58/C43的upper保留精确字段引用及实际解析值。实际矩阵及父残差全部列入冻结输入清单。

真实输入扰动至少保留两类，不重跑大型谱或能量矩阵：

1. 对实际J58的[57,57]加1。先验证该原槽为零，保存实际变异矩阵、完整变异L1表及原表复用被拒绝的逐槽差。重新求和，不预填“总数加1”。该控证明系数证书能识别实际源变化，不能误称它推翻了变异系统自己的重新计算增长界。
2. 对实际零t2的[0,0]加x²。保存实际变异矩阵及完整L1表，必须拒绝已登记的一次T频率阶数。该多项式在x=0平面可消失，拒绝标准是完整多项式非零，不是每个方向都非零。不得为了通过而放宽T阶数。

便宜精确手算控制还应直接反驳错误推论：标量H=h=C=1/14、J=1、K=0，在t=0比较实际E'与漏掉1/h的错误增长率；2×2 T=diag(rho,rho^-1)、Ti反向、H=I，在rho=2及第二基向量上反驳把pullback误写为统一Euclidean下界I。保留实际有理残差；这些是算法/推理控制，不冒称固定case12的反例。

独立实现直接用标准库Fraction重算全部系数表、各有理常数和负控差，不调用生产求界函数，不展开H，不重新运行父谱/投影乘法。父资格、严格codec、完整槽和实际输入hash验证是计算前置门。任何缺表、非规范分数、错误维度/次数、缺失频率幂、T2非零、C<h、父漂移或负控未被拒绝均保存证据后失败。

## 10. 下一步执行顺序与范围

先冻结父输入manifest、15表及负控schema；新增唯一生产模块、独立重放入口、focused控制和正式推导/协议；只做静态AST/lint与纯metadata预检；随后唯一owned600秒/64 MiB运行，完整终态审计后才写结果。

不进行方向采样、浮点拟合、阈值放宽、旧失败覆盖或自动重试。不再运行任何原大型矩阵乘法。所有资格以固定case12、geometric=False、常背景、原58坐标及已经接受的物理43符号为边界。actual_nonlinear_rhs_bridge、variable_background_energy、boundary_well_posedness、physical_gate、live_admission与scientificPayloadWriteback继续为false。

接续来源基线为本批671文件、6,933,761字节；本批792份完整证据合计19,582,683字节。下一批历史保护须在原26目录/18,764文件上完整加入本批，成为27目录/19,556文件；新来源数待新增实现、测试、推导、协议和本批结果/备忘录的完整清单冻结后确定。不得把可变GOAL进度页加入旧冻结清单，或反向修改旧DERIVATION/EXPERIMENT来更新其当时的候选状态。

**固定 case12 ODE分块与精确约分：一次受限证书实验**

## Material Passport

日期：2026-10-14。Origin Skill: academic-research-suite / experiment-agent。Artifact: code experiment protocol。Verification Status: UNVERIFIED before execution。方法nr-case12-polynomial-blocks-controls-v1。授权：用户直接要求“创建顶级goal快速开发并运行”及持续active goal，范围依完整开发路线；本批为已通过闭合之后的独立证明单元，不重跑历史失败。

**父证据与边界**

父目录tmp/nr-shadow-evidence/nr-k3-case12-polynomial-closure-controls-v1-20261014；终态SHA 3ac920ab18b8e647dbe85c5abec09319c9251ce7841c3da4873530041e12bcb1，worker SHA c063637c0ac86336611dc08303d7b027de2cc0ea3fa37f8050b71981a192fca2。父已验证2494个全方向闭合残差，保持结论及全部来源不变。本批复用父A=quotient_numerator、固定域及分母，不重建K或section。

验收仅涉及固定case12、任意实数v≠0上的ODE/PDE分块和登记约分候选。分块通过不能排除PDE零速Jordan块，不证明谱投影、能量、强双曲性、低阶估计、边界、非线性或演化。物理/live/科学payload门槛均false，原相对阈值2e-12保留；代数验收exact-zero-only。

**唯一命令与资源合同**

    D:/python/python.exe -B scripts/run-nr-k3-case12-polynomial-blocks.py --output-directory tmp/nr-shadow-evidence/nr-k3-case12-polynomial-blocks-controls-v1-20261014

目录必须不存在，一次执行，无自动重试。总600秒、64 MiB输出、2 MiB终态预留、8 MiB来源快照；C至少3 GiB，E至少4 GiB+32 MiB，启动另预留完整输出预算。64 MiB为磁盘输出而非RAM。单数值线程、原Windows Job所属进程监护与清理不变。所有数学计算和独立卷积均在worker；finalizer只验证摘要/JSON/AST/来源，不做矩阵计算。

来源592项：父586项加新模块、测试、runner、推导、本协议和父结果报告6项。历史14目录/9959文件，包含父成功批次622文件和所有旧失败。当前源码/快照/运行前后及完整历史均须闭合。

**方程与保存合同**

固定原R.ode_projector、GROUPS、SCALED_ROWS、intrinsic关系和原Background.shift_ray。记r=vᵀv、g=vᵀh⁻¹v、σ=chi·r·g²、Δ=rσ、b=β·v，Ot=rO、Pt=rI−Ot，B=A−bσPt。保留并独立验算：

- Ot²−rOt，43×43，次数≤4。
- B Ot，43×43，次数≤12，记录为left_annihilation。
- Ot B，43×43，次数≤12，记录为right_annihilation。
- trace(Ot)−11r，完整标量零恒等式。

三矩阵共5547个槽全部逐系数零。结合r>0与投影恒等式，trace给出ODE秩11和PDE秩32；不把它当作PDE零特征空间的完整分类。原group索引及所有零坐标均显式记录。

逐槽在QQ[x,y,z]、lex顺序计算A=σAb+R，保存1849个商/余式；Ab最高次数≤4，R≤10。保存division_identity=A−σAb−R及multiplication_residual=A−σAb，各43×43、次数≤10，均不得仅存布尔值。σ正性沿用已通过固定域，单位球σ≥1/2。

候选通过要求全部R为零且乘回精确成立。非零余式还须每个单项式均不能被LT(σ)整除，才可作为该lex单除式的正规余式；独立重放重新检查这个条件。若R不为零，候选失败，不得假定约分或修改父闭合结论。若约分成功，可将Khat=A/Δ写成Ab/r，为后续高次谱多项式减少分母与次数。

无论候选的主残差或余式是否为零，先保存完整主矩阵、所有残差、商/余式、统计和acceptance，再独立重放并保存其结果，最后决定候选gate。类型/来源/结构等无法定义合法证书的错误可提前失败并保存已有前缀。超时/硬预算可能截断计算，必须报告partial，不能伪称完整失败见证。

**控制与独立重放**

新测试整文件执行；冻结AST登记28个函数/53个显式参数实例并锁入入口，JUnit必须完整唯一，无失败/错误/跳过。覆盖来源、原ODE小块/固定索引、左右消去不互推的反例、精确division成功/非零余式、类型/次数/guard/序列化及坐标轴上不可见的非零多项式。测试使用廉价context、小矩阵及原赋值型ODE矩阵，不重复完整43维A或高维乘法。

端到端负控：原Ot[8,8]=x²，添加δOt[8,8]=x²模拟纵向投影系数翻倍；保存完整δOt与(Ot+δOt)²−r(Ot+δOt)，43×43。独立算法必须从原组定义重建同一扰动，并验证保存的非零见证；不能用任意写入残差代替模型错误。

独立标准库Fraction算法从保存文件重建Ot/Pt/B、三项完整分块残差、商乘回、lex余式正规性、trace和所有统计。无需用同一CAS重新做除法：零余式与独立乘回已足以验证成功约分。19份实际解析输入字节同时绑定SHA：3份父输入、10份主矩阵、2份负控矩阵、stats/scalars/acceptance/mutation；finalizer核对其同字节摘要与完整报告。CAS版本固定SymPy1.13.3、NumPy2.2.6；记录Python及已加载数值模块文件摘要。

**通过、失败与后续**

通过须同时满足全部登记控制、5547零槽、trace、逐槽精确商乘回与零余式、真实投影负控、独立重放、来源/历史/依赖完整性、双终态成功、完整产物清单及所属进程清理。非零候选、预算、漂移或异常保留失败，不自动重试；历史八射线v2仍为600秒失败。

顶层goal仍active。后续依次登记谱/零模作用、全部六支投影关系、Gram能量恒等式及方向统一上下界。不得从本分块实验直接进入物理边界或科学live晋级。

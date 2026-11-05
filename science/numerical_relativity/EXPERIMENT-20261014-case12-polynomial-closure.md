**固定 case12 全实非零方向主部约束闭合：一次独立受限证书实验**

日期：2026-10-14。Origin Skill: academic-research-suite / experiment-agent。执行前UNVERIFIED。方法nr-case12-polynomial-closure-controls-v1。用户直接指令“创建顶级goal快速开发并运行”与active goal授权本后续证明单元；不重试旧失败。

**父证据与目标**

上一右截面批次已完整通过：55项控制、1849精确零多项式、四个负控和标准库独立重放，监护71.875秒。父目录tmp/nr-shadow-evidence/nr-k3-case12-polynomial-section-controls-v1-20261014；终态SHA d438a7db90fd6485aa7c4e9d9a40b41a14f033e9eacf932cf97d18e1b9a9e5be，worker SHA 2bc75c134af3a7fab1de92cddf2671f09f85b9ef6e9b90c399114659b7476f4d。

该父批次只给出Dhat S=I43。本批单独检查Dhat K(I−S Dhat)=0，K为原Q.matrix(geometric=False)含shift的固定case12主符号公式延拓。若完整通过，仅支持固定背景、任意实数非零方向的主部约束核不变及唯一43维商算子，不推出能量、强双曲性、低阶项、非线性、零频逆、边界、离散收敛或演化。

**唯一执行与保护**

    D:/python/python.exe -B scripts/run-nr-k3-case12-polynomial-closure.py --output-directory tmp/nr-shadow-evidence/nr-k3-case12-polynomial-closure-controls-v1-20261014

新目录必须不存在。一次执行、无自动重试。原600秒、64 MiB磁盘输出、2 MiB终态预留、8 MiB快照不变；C>=3 GiB，E>=4 GiB+32 MiB，启动另留全输出预算。单数值线程，原Windows Job启动握手/独立监护/所属后代清理。64 MiB不是内存限制。所有CAS和独立矩阵计算在worker内；finalizer不计算矩阵，仅验证报告、实际已解析输入字节哈希、纯AST、依赖和全历史。

来源586项，即父580项加新模块/测试/runner/推导/本协议/父结果报告6项。历史13目录/9337文件，包含父批次全部621文件。前后及最终验收核对全历史，源码与快照全部对应；旧八射线v2始终保持600秒失败。

**计算合同**

复用父证书实际同字节Dtilde=d、Stilde=s、domain和denominators，复制4份输入并绑定父终态清单；不重新构造右截面。原profile源码及此前精确模块均固定SHA。Q.principal_rates和Q.matrix与所需辅助函数/PAIRS/PAIR_INDEX经无公式编辑AST编译；符号背景明确保留shift_ray。保存可纯AST重建的source_bridge与parent_provenance。

记r=vᵀv、g=vᵀh⁻¹v、σ=chi·r·g²、Δ=rσ，d=rDhat，s=σS。构造T=dK、A=T s、N=ΔT−A d。必须保存并检查K 58×58次数≤1、T 43×58次数≤4、A 43×43次数≤10、N 43×58次数≤13。全部2494个N槽逐系数精确零；不建58×58稠密投影后再抽取部分槽。

N=(rΔ)Dhat K(I−S Dhat)，rΔ=chi·r³·g²≥r⁵/2>0，因此清分母不会改变非零实方向上的结论。独立重建分母多项式次数≤10，并复核父固定域的SPD/逆/常量/范数。A/Δ给出约束商主符号；不将其误认成KS=SKhat或投影与K对易。

**控制与独立重放**

完整新测试文件按冻结AST登记27个函数、63个显式参数实例，与JUnit唯一身份核对，任何错误/失败/跳过均失败。只做小矩阵、廉价符号context/单列、源码类型与次数、正负控制；不在单元测试重复完整K或2494残差。DS=I但闭合失败的小反例与坐标轴上消失的非零多项式反例，防止右逆/方向采样偷换闭合验收。入口固定27/63合同，并在运行前由静态检查再次核对。

唯一端到端模型负控：δK[18,22]=x，其余0，刻意将约束核内的driver分量反馈至Theta。保存完整58×58 δK、43×58 δN；独立重算δT=dδK、δA=δT s、δN=ΔδT−δA d，必须与保存一致，且只有[4,22]非零，值为rΔx。它是非零多项式见证，不声称对x=0的每个方向都非零。

第二套标准库Fraction卷积从规范文件复算所有T/A/N、负控完整δN、统计和分母；拒绝缺失/重复坐标、未约分/浮点系数与超次数。13份独立重放输入的实际解析字节同时记录SHA：4份父输入、6份矩阵、stats、closure-denominator、mutation；finalizer逐份核对同字节摘要和完整报告。独立算法是本机算术复核，不等于外部团队复现或证明助理认证。

**验收和停止**

成功要求：所有登记测试通过、2494精确零残差、真实K负控非零且预测吻合、完整独立复算、父证据/源码/历史闭合、依赖身份、worker/supervisor双成功、产物清单及所属进程清理成立。任一异常/超时/预算/漂移保留失败前缀和终态，不自动重跑，不降低门槛。

physical_gate=false、live_admission=false、scientificPayloadWriteback=false；原物理相对阈值2e-12保留，当前代数验收exact-zero-only。integration_steps/native_calls/retries=0。顶层goal保持active；后续方向统一能量与合法初边值仍需独立推进。

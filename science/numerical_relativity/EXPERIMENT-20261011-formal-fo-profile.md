# 离约束完整58变量FO配置：形式Taylor几何独立控制协议

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: independent published-profile controls with formal metric Taylor jets
- Origin Date: 2026-10-11
- Verification Status: UNVERIFIED at registration; result recorded separately
- Version Label: nr-formal-fo-profile-controls-v1

## 范围与问题

上一批独立核验11个度规/规范与33个辅助率，本批补齐a、K、Theta、GammaHat和b的14个
分量。在同一受限规范/参数合同下拼合完整58槽，核对Python及已验收C++体积组件。
目标是检查论文定义的一阶离约束扩展，不是证明任意离约束状态仍是Einstein真空解。

生产求解器和439项资格源不变。新模块只导入NumPy/标准库及独立reduction参考，
不导入生产FO几何/RHS/差分。此参考不积分时间，不处理SAT，不新建原生构建或检查点。

## 形式二阶jet合同

输入为58变量值与其真实解析一阶空间导数。但几何构造采用论文规定的形式导数：

- h的一阶jet为2D；二阶jet为partial_k D_l+partial_l D_k。
- lnphi的一阶jet为P；二阶jet为对称化partial P。
- 以普通乘积法则构造gamma=h/chi的两阶jet，包含D-P交叉项和P的二次项。
- 对此局部二阶jet用通用逆矩阵微分、Christoffel定义及Ricci收缩计算几何，不复制
  生产代码的FO展开式。off-constraint时这些jet不是真实网格gamma的空间导数。
- GammaTilde由逆共形度规与连接收缩求得，不使用仅在单位行列式条件下才成立的
  -partial_j hInv^ij捷径。其形式导数由乘积法则计算，Z协向量与covD(Z)再从定义求得。
- lapse协变Hessian使用alpha、A、对称化partial A和物理连接；保持冻结的alpha*kappa1阻尼。

剩余演化率以论文式(12)的矩阵/张量收缩实现。kappa3=1时GammaHat的shift伸缩项合并为
GammaHat自身，仍保留2 alpha hInv*T的trace-ordering反馈，不因tr(a)非零而丢弃该项。
参数范围固定c=e=s=kappa3=1、advective 1+log、f=3 alpha chi、mu=.2 chi、eta=0。
提供tau_inverse与kappa1/kappa2检查；不支持通过其他参数偷偷改变规范或方程。

## 固定控制集

74项新测试：

1. 36组Python全58槽离约束场：沿用6个资格多项式场，tau_inverse=0/1/2，
   (kappa1,kappa2)=(.1,0)/(.2,.25)，使用精确解析导数回调。
2. 12组物理一致面交叉核验：两种非对角曲度规、两种符号、Theta-only/Z-only/both。
   独立物理ADM/Z4参考给出全58率、真实物理metric两阶jet及Ricci；新参考须回到该结果。
3. 3组通用Taylor几何与已验收独立物理几何对照，3组常截面曲率解析Ricci检查。
4. A/B/D/P四族反对称ordering导数扰动：不得进入14个几何/Einstein率，仍须影响辅助率。
5. 三个负对照：真实恒定度规的Ricci为零不等于离约束形式Ricci为零；单位行列式捷径
   不可用于一般GammaTilde；trace-ordering反馈不可漏去。
6. 6组原生全58对照，5项参数拒绝、1项只读快照、1项导入独立性。

6个原生场仍为N9、[1,3]^3、全部规范槽至多二次，SBP(4,2)包括面边角均可精确求导至
舍入误差。每场三轴导数及1/2/4/1线程RHS，共42调用，保存原始输入/输出及独立预期。
全58逐槽/全网格/面/边/角绝对误差<=2e-12、rtol=0；线程payload逐字节一致，另起
1线程完整stdout逐字节一致。通用几何与物理约束面检查也用2e-12，不调阈值求通过。

另重跑前批66项非原生reduction控制，明确筛去其6项原生测试；历史72项不冒充重跑。
所有已选测试须零失败/错误/跳过。不重判旧N13，不执行仍待单独确认的N9完整矩阵。

## 资源、身份与停止

新增5项文件，439旧源形成444项前后/快照闭包。既有exe、OpenMP runtime、组件源与
生成片段保持身份；复用已验收native调用夹具，只将输出定向至本批新目录。
64 MiB/600秒、2 MiB收尾余量、原生单调用30秒。C>=3 GiB、E>=4 GiB+32 MiB，启动
预留整个64 MiB；E盘产物/临时目录，禁pyc，BLAS/MKL单线程，OMP登记1/2/4线程。
所属进程/资源每0.5秒守护，失败/超时/身份漂移即保留停止，不自动重试或清理用户数据。

命令：`D:\python\python.exe -B scripts/run-nr-k3-formal-profile-controls.py --output-directory tmp/nr-shadow-evidence/nr-k3-formal-profile-controls-v1-20261011`。

即使通过，也仅设published_full58_profile_consistent与native_full58_profile_consistent。
independent_einstein_rhs_validated仍为false：这些瞬时制造场不替代完整科学轨迹与独立
时空/约束收敛、真实边界、长期稳定、黑洞/AMR/视界/波形/GPU或live/writeback验收。

## 来源

Exa直接读取[Dumbser等2018](https://ar5iv.labs.arxiv.org/html/1707.09910)，
DOI10.1103/PhysRevD.97.084053，重点式(12)-(28)及II.3说明；本轮0次新搜索。
论文说明离代数约束的扩展解空间，且不用单位行列式捷径计算收缩连接。
本项目f(alpha,chi)及相应辅助乘积项保持前批受限配置，不称原论文默认数值算法复现。

GitHub只读[GRChombo CCZ4Geometry.hpp](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/CCZ4Geometry.hpp)
1-175行，blob b03cfb37f0072c9289b33659d9765453bbf6a319。
其二阶共形Ricci/Z组合实现与本项目FO离约束几何不同，仅作实现边界核对；没有执行、
复制引入或宣称运行GRChombo。无外部上传/远端写入，无统计显著性推断。

# 当前规范的固定物理约束核与静态目标相容性：事前协议

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: bounded deterministic diagnostics and controls
- Origin Date: 2026-10-11
- Verification Status: UNVERIFIED at registration; outcome recorded separately
- Version Label: nr-current-profile-constraint-closure-v1

## 目的和不可跨越的范围

旧 `fo_ccz4_constraint_propagation.py` 仅检查 principal symbol，默认参数不能代替
当前 f=3 alpha chi、mu=.2 chi、tau^-1=1、kappa1=.1、kappa2=0、eta=0 的完整发生器。
本批检查该参数合同在三个**常系数平直背景**上的完整线性发生器
L(k)=J+i k_j A^j；非单位常量 metric 也仍是平直背景，不能叫做曲率背景。
不将保存的非线性场抹去其导数后冒充“当前变系数传播闭合”。完整变背景需要
系数的时空导数、下阶项及边界传播方程，仍是后续必要依赖。

新模块只增加诊断。已资格化460源、生产主部/RHS、原生可执行文件、初边值、
步长、阈值不改。不得追加 CA、CA^2 等约束行来制造“闭合”，不得投影状态。
不会调用原生求解器，不做演化，不执行需另行批准的N9完整矩阵。

## 固定算子

从原方程代数源显式求 J，包括11个ODE中的辅助变量耦合、行列式/迹松弛、
Theta/Z阻尼；不是只留阻尼对角元。主部复用上一批独立Taylor-jet构造。
J以完整58列、固定eps=1/64与1/128的中心探测及三次项消去交叉核对。
在本批零动力学/辅助背景，这些单列源探测的奇次余项至多三次；不是一般
非线性背景的数值Jacobian算法。原谱SAT核查和本批均不声称符号恒等证明。

43行事前固定：33条A/B/D/P定义、det(h)与tr(a)两条代数约束、物理ADM H/M四条、
Theta与Z_i四条。M采用off-trace定义 div(a)-d tr(a)-2/3 dK；在tr(a)=0时与旧
M行相同。curl及代数约束导数在单个傅里叶模式上由这些行导出，不靠增加独立
约束剔除物理自由度。K是物理trace槽，非Z4c K-hat。

分别报告 C L-B C 和 C L N，其中N为C的完整数值零空间。SVD右逆仅用于审计，
不进入求解器或修补状态；rank在1e-9/1e-10/1e-11相对阈值下须相同，否则拒绝。
保留复数矩阵、零空间及可复核的泄漏见证向量。不把数值B(k)认作推导完成的
局部非线性subsidiary PDE，更不能据此构造已验收CPBC。

## 固定案例、阈值和负对照

使用上一批三个系数fixture：Minkowski，单位行列式剪切h配alpha=.85/chi=.72/
beta=(.03,-.04,.05)，置换h配alpha=1.4/chi=1.1/beta=(.4,-.35,.2)。
波向量固定为(0,0,0)、三坐标单位向量、(1,2,-1)、(.25,-.5,.75)、(4,-2,1)，
共21组合。全物理C秩预期零波39、非零波43，禁止通过删行避开失败。
矩阵/构造性物理零空间控制abs<=2e-12，rtol=0；闭合判据为两种无量纲残差均
<=2e-12。闭合结果逐项保留，即使失败也不改阈值、不重新定义约束集；控制通过
和物理核闭合是两个字段。

53项控制：3完整源交叉核对、21固定物理核测量及独立构造的lapse/shift纯规范
零空间、3显式平直H/M公式、6 TT极化保留、3错误辅助驱动见证、3遗漏源项负例、
3非平直/动力学种子拒绝、4非法波向量、3非法/未分辨矩阵、1已知闭合/不闭合
系统、1全部静态边界相容、1目标篡改、1独立导入边界。再运行66项上一批Python
谱SAT回归，不触发其产物写入或任何原生调用。

## 边界目标：只验证初始相容

从原N13 v2科学清单读取并校验reference.npy；用已资格化独立Schwarzschild
初始ADM解析jet，构造静态和amplitude=.001脉冲的全58场/一阶导数。全13^3网格
计算完整率，单列866个唯一边界节点（1014个面关联节点）。核对静态目标值、
静态全58率为零，脉冲初态的边界值/导数等于静态目标、边界全58率为零，另核对
静态H、Z与定义约束。内部脉冲率必须非零，不能把全部初态替换成静态使测试通过。

解析导数下的零率不是离散SBP边界截断误差为零。脉冲没有已知正时间解析解，
因此这些控制不证明演化后数据相容、吸收、约束保持、长期稳定、视界/波形有效。
原N13 unresolved及全部旧失败保持原结论。

## 资源、身份与停止

新增5源接入冻结460源，共465项，源快照沿用4MiB上限。新产物64MiB/600秒，
收尾2MiB；C>=3GiB，E>=4GiB+32MiB，启动预留全部64MiB。单线程、禁pyc，临时
产物在E。开始和结束核对父资格清单、源码快照、原N13科学清单及原生身份；
落盘后重新读取所有矩阵/场并校验。过程/硬预算/磁盘保护沿用用户授权；失败
保留、不自动重跑、不清理、安装、编译或修改live。

命令：`D:\python\python.exe -B scripts/run-nr-k3-profile-constraint-controls.py --output-directory tmp/nr-shadow-evidence/nr-k3-profile-constraint-controls-v1-20261011`。

## 外部依据与技能影响

Exa定向请求5个结果，主要是同一论文的不同入口。arXiv HTML提取仅得到摘要，
未冒充完整公式；随后核读[作者论文HTML镜像](https://ar5iv.labs.arxiv.org/html/1707.09910)
II.2的33辅助定义及ordering约束、II.3的Eq.12与代数松弛说明。
[原出版记录](https://doi.org/10.1103/PhysRevD.97.084053)确认文章身份。论文本身不为
本项目变系数profile或边界提供准入证明。外部代码未下载或复制；本轮无需修改
GitHub状态。科研与测试技能用于事前固定约束集、案例、负对照、阈值及预算；
确定性诊断不作统计显著性、因果占比或世界前沿水平推断。

# 曲率背景的物理约束传播通过独立恒等式检查；完整FO闭合仍待验证

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: bounded deterministic reference implementation and controls
- Origin Date: 2026-10-11
- Verification Status: REGISTERED CONTROLS PASSED; DEFINITION-SURFACE IDENTITIES ONLY
- Version Label: nr-curved-physical-constraint-propagation-v1

## 本轮交付与实际范围

新增物理三维度规上的H/M约束传播参考，不改原有465项资格化源码、生产方程、
原生可执行文件、初值、步长、阈值或美术。上批仅覆盖常系数平直背景；本批保留
空间变化的度规、lapse、shift、外曲率与Theta/Z，补入梯度、连接、逆度规的时间
变化和零阶阻尼。原N13 v2的未分辨结论、旧中止与失败记录全部保持原样。

两条路径分别实现：

1. 从H=R+K²-KijK^ij、Mi=DjK^j_i-DiK定义出发，直接求时间变化。
2. 使用标准ADM的约束传播式，加上物理Z4对Kij演化的修正Eij所引入的H/M变化。

两条路径不相互调用，也不调用生产求解器。完整物理率另外与原有continuum_z4
对照，并以全部58个率与formal_fo_geometry对照。后者是本仓库另一套参考，
不是与外部成熟NR程序的完整跨代码演化比对。

新增Taylor工具使用三维、三阶的20个归一化系数；求导降低可用阶数，缺失导数
直接拒绝，不能默认为零。保留gamma_t的二阶空间导数、Kij_t的一阶空间导数。
没有通过网格差分估计这些输入，也没有剪裁度规、拟合闭合矩阵或投影物理模态。

## 固定测试结果

事前固定22案例：Minkowski 1例、静态Schwarzschild M=1的3个坐标点，以及
3组曲率jet×K/Theta/Z两个符号×3组阻尼参数，共18例。(.1,0)是当前候选参数；
(0,0)和(.2,.25)仅用于诊断，没有改动求解器。3个静态点半径相同、方向不同，
不能当成多个半径的覆盖。制造案例故意带有非零H/M，不是假定的精确真空解。

| 比较 | 最大绝对差 | 原定上限 |
| --- | ---: | ---: |
| 直接H/M时间变化与传播方程 | 1.908195824e-17 | 2e-12 |
| 物理值/率与既有物理Z4参考 | 5.551115123e-17 | 2e-12 |
| 物理映射与完整58率参考 | 2.775557562e-16 | 2e-12 |

67项新增测试、53项原固定profile回归全部通过，零失败、错误、跳过。
测试套件分别0.87秒、0.93秒，包含身份检查的整批36.750秒。12项遗漏项负对照
覆盖lapse梯度、协变shift伸缩、完整Z4修正和阻尼，均检测到>1e-8的差异。
解析齐次缩放验证直接求导中的逆度规时间项；Taylor乘法、逆矩阵、分数幂、
混合三阶导数、非法输入和缺阶拒绝也经过控制测试。

静态Schwarzschild案例的Ricci张量最大分量约0.006656，确认不是平直背景；
H最大1.735e-18、M=0，物理率最大1.302e-18，H/M率差最大6.876e-19。
制造案例的|H|约0.412—0.436、最大|M_i|约0.00178—0.00995，确有非零约束。
这些极小的恒等式残差是同一点解析jet的代数一致性，不代表网格离散精度、
演化误差、精度提升倍数或物理系统已达到这些误差水平。

## 明确未完成的部分

本批的输入用物理场及其导数构造，所以辅助定义与代数约束成立；H/M/Theta/Z
则允许不为零。它不能表示实际FO演化中独立出现的33项辅助定义误差与2项代数
误差，也未验证这些误差如何反向驱动物理约束。Eij在Mi_t中还产生Z的二阶
空间导数，不能直接把本模块当成八变量一阶边界系统。

因此只开启definition_surface_physical_identities_validated。以下均保持false：
off_definition_fo_closure_validated、physical_boundary_validated、共同对称化子、
非线性稳定、正式约束收敛、physical_gate、live_admission、scientificPayloadWriteback。
没有新科学演化、原生调用、黑洞长跑、AMR、视界、ADM守恒或波形/GPU验收。

下一依赖是把当前FO ordering/辅助定义/代数松弛项加入变背景传播，核对离开
定义约束面时的独立反馈。之后才能设计可验证的约束入射SAT及受控扰动测试。
不能把本轮物理连续方程直接写成“CPBC已完成”。N9完整科学矩阵仍须单独授权。

## 身份、保存与资源

证据目录：`tmp/nr-shadow-evidence/nr-k3-curved-constraint-controls-v1-20261011`。
保存全部22例输入20×29系数、直接/传播H/M率、6组贡献、物理比较、58率比较、
Ricci和gamma/K率jet，共198个数组，以及XML、日志、源快照和门禁。
471项源的启动/结束身份一致。678项索引产物加最终回执，共679个文件，
4,592,895字节。源快照4,167,655字节，4MiB上限仅余26,649字节；后续新增
闭包必须继续预检，不能静默增加预算或删除旧源/产物。

| 文件 | SHA256 |
| --- | --- |
| qualification-gate.json | ac804c25099ccc73470e135dd60ac185a3473326c4ea77000bc662d3cd3d2567 |
| tests.xml | ceaa7938793251bb47dc373cbfaa6a3384c39827ded21ddba3607ac77ba07331 |
| profile-python-regression.xml | 08f1c11479d0f1d48ccf74dbb98399729c4d0794dcc6c18e848c29e81e46c0c0 |
| curved-constraint-observations.json | 6ea8bf2d4986e7065f1ae6f40f178d7781f2d36073880379279f93928045340d |

资源仍是64MiB/600秒、2MiB收尾、C>=3GiB、E>=4GiB+32MiB及完整预留量。
原生文件只做身份读取，不调用、不重编译。所有新临时/证据文件在E盘；没有
清理或自动重跑。说明文档不参与执行源闭包，6个新资格化源执行后冻结。

批次完成后另行只读复核678项完整产物索引、471项源及保存快照、两个XML的
67/53项计数、全部22案例数组及报告；由保存输入精确重算数组并逐项比较通过。
原N13 v2父科学清单与原生身份也再次核验通过；不是只凭进程退出码判定成功。

## 外部依据与技能影响

Exa共检索5+5候选，并核读[标准ADM约束传播原文](https://arxiv.org/html/gr-qc/0103032)
III.1 Eq.8—11与[物理Z4原文](https://ar5iv.labs.arxiv.org/html/1106.2254) Eq.6—9。
前者给出标准ADM恒等式，后者给出物理Z4演化修正；本仓库仍需自行验证FO约束
缺陷与离散边界。检索返回数不等于独立论文数，也不是全面边界文献综述。

只读核查[GRChombo约束诊断](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/CCZ4/Constraints.impl.hpp)，
固定blob 4deb585c9d2781d0bfc2babd21ddeee84196a6e4。只参考其H/M诊断归一化；
未复制它的chi下限处理，未调用它运行本案例，也未修改任何GitHub内容。

科研与测试技能使案例、双路径比较、负对照、资源、阈值和停止条件在首次运行
前登记，见[事前协议](EXPERIMENT-20261011-curved-constraints.md)。本轮是可复核
的新增参考能力，不是统计推断或“顶级NR内核完成”。总目标保持active。

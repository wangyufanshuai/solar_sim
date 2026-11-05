**Exa 来源记录：Solar Sim 广义相对论开发规划**

日期：2026-10-14，Asia/Shanghai。

共七次查询，每次请求并返回5条，合计35条候选记录；按完全相同URL去重为34个链接。另有已知URL全文抓取；抓取不算新增搜索结果。候选包含镜像和索引，34个链接不代表独立论文数，也不代表完整文献综述。没有将未发表项目源码、数据或精确案例参数上传给搜索服务。

**检索设计**

| 查询 | 目标 | 返回记录 |
|---|---|---:|
| Q1 | FO-CCZ4原始方程、强双曲性、排序约束 | 5 |
| Q2 | Z4/CCZ4约束保持边界与冻结系数稳定性 | 5 |
| Q3 | SXS波形误差、外推、比较合同 | 5 |
| Q4 | Sarbach–Tiglio方向能量定义与一致界 | 5 |
| Q5 | 成熟NR框架、AMR和可复现黑洞基准 | 5 |
| Q6 | SpECTRE GH边界与CCE | 5 |
| Q7 | Apples with Apples原始测试与限制 | 5 |

**实际采用的一手资料及适用边界**

| 来源 | 用途/限制 |
|---|---|
| [FO-CCZ4 原始论文](https://journals.aps.org/prd/abstract/10.1103/PhysRevD.97.084053) | 58变量、特定规范下强双曲性、排序约束；不能直接认证项目离散与约束商。 |
| [Sarbach–Tiglio 定义4](https://arxiv.org/html/1203.6443v1) | 已抓取并定位定义4，核对光滑方向能量、一致上下界与对称双曲性的区别。 |
| [Z4c 约束保持边界原始论文](https://arxiv.org/html/1010.0523v2) | 冻结系数/边界稳定适用范围；不同方程体系不直接继承证明。 |
| [Apples with Apples 修订测试](https://arxiv.org/abs/0709.3559) | 原始全文经MPG PDF核对；全变量噪声、网格、CFL、规范与范数限制。 |
| [AwA 原始全文镜像](https://pure.mpg.de/rest/items/item_28186_6/component/file_28188/content) | 上项同一作品，不重复计数。 |
| [Einstein Toolkit GW150914](https://www.einsteintoolkit.org/gallery/bbh/index.html) | 官方可复现示例；网页声明Hypatia/2026-06-30测试，未在本机运行。 |
| [ET 示例参数](https://bitbucket.org/einsteintoolkit/einsteinexamples/raw/master/par/GW150914/GW150914.rpar) | BSSN/Carpet/TwoPunctures等配置；移动分支URL只作发现，实际复现需固定提交。 |
| [CarpetX 官方仓库](https://github.com/eschnett/CarpetX) | AMReX基础设施候选；声明能力不等于本机工具链验证。 |
| [SpECTRE GH CPBC](https://spectre-code.org/classgh_1_1BoundaryConditions_1_1ConstraintPreservingBjorhus.html) | GH特征场及球形边界条件，不能直接作为FO-CCZ4证明。 |
| [SpECTRE CCE 原始论文](https://arxiv.org/pdf/2110.08635) | worldtube度规及导数、null初值与提取误差的独立合同。 |
| [SXS 波形数据说明](https://data.black-holes.org/waveforms/documentation.html) | 单位、模态、多半径/外推与参考系；网页各段可能不同年代，不据此宣称最新目录版本。 |
| [SXS Ext-CCE](https://data.black-holes.org/waveforms/extcce_catalog.html) | CCE初值/规范影响与外推比较，作后续设计参考。 |

抓取粒度：Sarbach–Tiglio长文定位到定义4和相关定理；FO-CCZ4部分HTML入口只给摘要，结合原始全文镜像搜索摘录；Z4c正文核对边界理论范围；AwA与CCE补读原始PDF。未阅读每篇论文的每一个附录，也未重新推导其全部结论。所有项目特定公式/阈值来自项目已有推导，外部论文不是本项目的资格证书。

**主代理查询候选台账（20条，保留重复查询记录）**

| 序号 | 查询 | 来源 |
|---|---|---|
| 1 | Q1 | [Phys. Rev. D 97, 084053 (2018)  -  Conformal and covariant Z4 formulation of the Einstein equations: Strongly hyperbolic first-order reduction and solution with discontinuous Galerkin schemes](https://journals.aps.org/prd/abstract/10.1103/PhysRevD.97.084053) |
| 2 | Q1 | [[1707.09910] Conformal and covariant Z4 formulation of the Einstein equations: strongly hyperbolic first-order reduction and solution with discontinuous Galerkin schemes](https://ar5iv.labs.arxiv.org/html/1707.09910) |
| 3 | Q1 | [Conformal and covariant Z4 formulation of the Einstein equations: strongly hyperbolic first-order reduction and solution with discontinuous Galerkin schemes - INSPIRE](https://inspirehep.net/literature/1613645) |
| 4 | Q1 | [Conformal and covariant Z4 formulation of the Einstein equations: Strongly hyperbolic first-order reduction and solution with discontinuous Galerkin schemes](https://iris.unitn.it/handle/11572/222949) |
| 5 | Q1 | [Conformal and covariant Z4 formulation of the Einstein equations: Strongly hyperbolic first-order reduction and solution with discontinuous Galerkin schemes - ADS](https://ui.adsabs.harvard.edu/abs/2018PhRvD..97h4053D/abstract) |
| 6 | Q2 | [Constraint preserving boundary conditions for the Z4c formulation of general relativity](https://arxiv.org/html/1010.0523v2) |
| 7 | Q2 | [Phys. Rev. D 97, 084053 (2018)  -  Conformal and covariant Z4 formulation of the Einstein equations: Strongly hyperbolic first-order reduction and solution with discontinuous Galerkin schemes](https://journals.aps.org/prd/abstract/10.1103/PhysRevD.97.084053) |
| 8 | Q2 | [[1003.3328] Constraint-preserving boundary conditions in the 3+1 first-order approach](https://ar5iv.labs.arxiv.org/html/1003.3328) |
| 9 | Q2 | [[gr-qc/0411110] Constraint-preserving boundary conditions in the Z4 Numerical Relativity formalism](https://ar5iv.labs.arxiv.org/html/gr-qc/0411110) |
| 10 | Q2 | [gnuplot plot](https://www.dam.brown.edu/ACCGR/ACCGR_posters/Milton_poster.pdf) |
| 11 | Q3 | [SXS Waveform Database Help and Documentation](https://data.black-holes.org/waveforms/documentation.html) |
| 12 | Q3 | [SXS Waveform Database Help and Documentation](https://data.black-holes.org/waveforms/extcce_catalog.html) |
| 13 | Q3 | [SXS Gravitational Waveform Database](https://data.black-holes.org/waveforms/) |
| 14 | Q3 | [Waveform differences and mismatches for v3.0.0 of the SXS Collaboration's catalog of binary black hole simulations / Zenodo](https://zenodo.org/records/15465745) |
| 15 | Q3 | [N/A](https://arxiv.org/pdf/2505.13378) |
| 16 | Q4 | [[1203.6443] Continuum and Discrete Initial-Boundary-Value ...](https://arxiv.org/abs/1203.6443) |
| 17 | Q4 | [Strongly hyperbolic systems in General Relativity](https://arxiv.org/html/gr-qc/0403007) |
| 18 | Q4 | [[1707.05011] A necessary condition for strong hyperbolicity of general first order systems.](https://ar5iv.labs.arxiv.org/html/1707.05011) |
| 19 | Q4 | [HYPERBOLICITY OF HIGH ORDER SYSTEMS OF EVOLUTION EQUATIONS](https://arxiv.org/html/1412.6034) |
| 20 | Q4 | [Finite Speed for Symmetrizable Hyperbolic Systems](https://sites.lsa.umich.edu/jbrauch/wp-content/uploads/sites/1356/2024/09/speed3.pdf) |

同一FO-CCZ4论文的APS、ar5iv、INSPIRE、大学库和ADS按一项作品处理。poster未作为关键依据；Q4其他数学论文只是背景候选，主要结论已回到Sarbach–Tiglio原文核查。SXS旧数据库网页和较新的论文/数据集分别按版本使用，不把滚动网页当作单一时间快照。

**并行研究查询候选台账（15条）**

| 序号 | 查询 | 来源与处理 |
|---|---|---|
| 21 | Q5 | [ET BBH 示例](https://www.einsteintoolkit.org/gallery/bbh/index.html)：采用 |
| 22 | Q5 | [ET 复现步骤](https://einsteintoolkit.org/gallery/bbh/cr.html)：参考；资源口径与首页区分 |
| 23 | Q5 | [实际参数](https://bitbucket.org/einsteintoolkit/einsteinexamples/raw/master/par/GW150914/GW150914.rpar)：采用 |
| 24 | Q5 | [CarpetX 2021演讲](https://einsteintoolkit.org/seminars/2021_03_18/CarpetX.pdf)：历史材料，不支持当前能力声明 |
| 25 | Q5 | [CarpetX 仓库](https://github.com/eschnett/CarpetX)：采用 |
| 26 | Q6 | [GH CPBC](https://spectre-code.org/classgh_1_1BoundaryConditions_1_1ConstraintPreservingBjorhus.html)：采用 |
| 27 | Q6 | [CCE HTML](https://arxiv.org/html/2110.08635v1)：与30同论文，抓取只有摘要 |
| 28 | Q6 | [GH 原始论文](https://arxiv.org/html/gr-qc/0512093)：框架背景 |
| 29 | Q6 | [SpECTRE gallery](https://spectre-code.org/gallery)：官方概览，不替代运行 |
| 30 | Q6 | [CCE PDF](https://arxiv.org/pdf/2110.08635)：采用并核查全文 |
| 31 | Q7 | [AwA 第一版](http://www.arxiv.org/abs/gr-qc/0305023)：原始背景 |
| 32 | Q7 | [AwA 聚合镜像](https://arxiv.science/abs/0709.3559)：不用，转35 |
| 33 | Q7 | [AwA Exa聚合页](https://exa.ai/library/publication/fc4z41qgd20)：不用，与31同论文 |
| 34 | Q7 | [规范模式原始分析](http://www.arxiv.org/abs/gr-qc/0404092)：参考 |
| 35 | Q7 | [AwA 修订原文](https://pure.mpg.de/rest/items/item_28186_6/component/file_28188/content)：采用并核查全文 |

此组15条记录按同论文镜像合并为12个来源作品；不与主代理的URL数相加后称作独立论文总量。额外抓取的 [AwA arXiv HTML](https://arxiv.org/html/0709.3559v2) 与35是同一作品，未增加搜索条数。

**决策边界**

本轮只完成研究与规划，没有安装成熟代码、下载大数据、启动新数值批次或发布。ET历史资源成本不外推为本项目预算；框架官方能力说明不证明当前本机可用；所有预期性能/精度是待验证的工程目标。


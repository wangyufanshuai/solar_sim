# 独立特征 SAT 多项式核对与旧轨迹固定抽样：事前协议

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: bounded algebra controls and immutable saved-stage probes
- Origin Date: 2026-10-11
- Verification Status: UNVERIFIED at registration; results recorded separately
- Version Label: nr-spectral-sat-controls-v1

## 问题与独立性

上一批的边界项只是总 RHS 减独立体积参考。本批不更改生产内核，而从已资格化
Taylor-jet 完整 58 率参考的空间导数槽逐一探测主部矩阵，包含 11 个 ODE 列检查。
只保留当前基变量用于主部系数，其他场作为零阶项不参与主部系数；控制包含相应
变异检查。不导入生产主部装配、速度表、SVD split 或特征向量。

固定原 profile：f=3 alpha chi，mu=0.2 chi，advective 1+log，c=e=s=kappa3=1；
不变更阻尼、初值、SAT、时间步或任何科学验收阈值。以六对固有速度和 PDE 零速
构成 13 个不同节点，将 abs(lambda+beta_n) 用 Newton 差商多项式作用于居中主部。
使用标准库 Decimal 的 50 位运算避免高阶插值累积消去，持久化抽样项再用 70 位复核；
输入与输出仍是原 FP64。重复 PDE 模式共享同一节点，但不把 11 个独立 ODE 零模
加入有 beta_n 平移的 PDE 插值。不剪裁微小平流速度，不合并未分辨的相近速度；
固有节点间隔必须大于原 1e-12 相对速度分辨界，超界拒绝，不推断整个系数域的强双曲性。

q_t=A q_x 的左面惩罚为 (A-|A|)jump/(2w)，右面为 (-A-|A|)jump/(2w)，
w=17 dx/48。所有相接面的贡献相加，不在边、角平均。常系数单方向已知相似变换
系统另检查能量通量与惩罚的和为 -u^T H |A|u；这里的 H 只属于该合成系统，
不代表 FO-CCZ4 三方向共同对称化子、非线性估计、物理 CPBC 或辐射边界。

## 固定控制与验收

66 项新控制：9 个系数/轴的完整主部与绝对值矩阵对照（含两面惩罚、半权重、
50/70 位及矩阵代数核对）；10 个已知相似系统/方向能量控制；2 个微小平流零模；
3 个零阶场变异；26 个面中心/边/角且各面目标不同的求和控制；1 个内部无惩罚；
9 个非法输入；1 个只读；1 个生产 split/特征向量隔离；3 个固定旧阶段选择；
1 个抽样分层完整性。另运行前批 65 个 Python 轨迹余额控制，没有原生调用。

系数组为 Minkowski、单位行列式剪切 metric 配 alpha=.85/chi=.72，以及置换该
metric 配 alpha=1.4/chi=1.1；非零 shift 固定为 (.03,-.04,.05) 与 (.4,-.35,.2)。
三轴全部覆盖。已知相似系统以固定上三角基变换、根 [-2,-.2,0,.7,2] 和
shift -4,-.3,0,.3,4 覆盖全入射、混合及全出射模式。
所有比较仍 abs<=2e-12、rtol=0，不观察后改阈值。矩阵比较覆盖全部 58×58 元素。

## 保存轨迹抽样

控制通过后，仅从已验收 N13 v2 原回执
a7a7c8b7ebdc9447c31d4d70875e8b42f50a2a02d8b769a85457dce05e143583
及原审计 60f60e1f989aabb2e987d44d74bf8a57bcf189b625ba9d66210ed2e3b8d1e40e
读取三档 dt=1/112、1/224、1/448 的首步 k1 与末步 k4，共 6 个保存阶段。
末步 k4 是该 RK 阶段状态，不冒充已完成的末端检查点。

每阶段固定坐标集合 {0,6,12}^3 除中心，共 26 个边界点：6 面中心、12 边中点、
8 角。每阶段 54 个面关联项，合计 156 点、324 面项。固定选择不因结果增删。
独立 SBP 稠密导数加完整 Taylor-jet RHS 计算体积率，全严格内部的 58 槽先与
保存总 RHS 核对；边界抽样点核对独立 SAT 与“保存总 RHS - 独立体积率”。
保存每项系数主部、跳跃、贡献、状态/导数、体积率、总 RHS 和哈希/时钟/来源。
不是全部 196 阶段或全部边界网格点验收，不给出约束保持或长期稳定结论。

## 运行与停止

新 6 源加冻结 454 源构成 460 项闭包；源快照仍不超过 4 MiB。总预算64 MiB/600 秒，
2 MiB 收尾；C>=3 GiB，E>=4 GiB+32 MiB，启动预留全部64 MiB。单线程、禁 pyc，
新产物及临时目录在 E。硬预算与磁盘保护沿用用户授权；只管理本批 Python 子进程。
任何控制、抽样、身份或资源失败均保存并停止，不自动重试。不运行完整科学矩阵、
新演化、原生求解器、安装或重新编译。N9 正式实验仍需单独人工确认。

命令：`D:\python\python.exe -B scripts/run-nr-k3-spectral-sat-controls.py --output-directory tmp/nr-shadow-evidence/nr-k3-spectral-sat-controls-v1-20261011`。

通过仅代表 independent_sat_action_consistent、sampled_boundary_rhs_consistent。
物理边界、共同对称化子、正式收敛、非线性稳定、完整轨迹边界复算、live/writeback
均不晋升。原 N13 未分辨与所有历史失败结论不变。

## 来源与技能影响

Exa 单次 5 结果检索（同一论文的多个版本），读取
[Sarbach–Tiglio 2012 开放原文](https://pmc.ncbi.nlm.nih.gov/articles/PMC5256023/)
第 10.1.3 节关于入射特征惩罚、面/边/角处理的正文。首次提取180000字符未到该节，
扩大提取后定位正文；网页转换未呈现部分公式图片，不声称已逐式核验这些缺失公式。
左右号及常系数能量恒等式在本项目按 q_t=A q_x 单独推导。
谱多项式使用本项目原已核查的固定速度族，不导入外部代码或宣称论文验收了本程序。
科研与测试技能要求事前固定抽样、负对照、阈值、预算和失败保留。确定性控制不作
统计显著性推断。本批不是新的完整物理实验，也不是世界前沿水平认证。

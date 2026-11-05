# 已保存 N13 轨迹的 33 辅助约束累计余额：事前协议

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: bounded controls and saved-data diagnostic audit
- Origin Date: 2026-10-11
- Verification Status: UNVERIFIED at registration; results recorded separately
- Version Label: nr-trajectory-reduction-controls-v1

## 固定问题和范围

在已验收的 N13 v2 续算数据中，连续辅助约束余额、离散链项和已保存边界差值的
RK 加权累计，能否重现 33 个定义约束的实际变化？本批不重新积分，不调用原生程序，
不改变初值、方程、差分、边界、步长、分辨底线、阈值或旧验收状态。

唯一科学数据源为 `tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v2-20261011`，
receipt SHA256 为 a7a7c8b7ebdc9447c31d4d70875e8b42f50a2a02d8b769a85457dce05e143583；
原审计 SHA256 为 60f60e1f989aabb2e987d44d74bf8a57bcf189b625ba9d66210ed2e3b8d1e40e。
固定 N13、域 [1,3]^3、T=1/16 至 1/8、三档 dt=1/112、1/224、1/448，分别读取
7/14/28 个已完成续算步，共 49 步、196 个 RK 阶段以及 3 个起点/49 个新端点。
不选择性排除阶段。v1 未验收检查点不作为输入；N9 完整科学矩阵不执行。

## 定义和可声称范围

令 L(q)=q_aux-map(Dq_base)，这是固定网格的线性定义映射。独立已资格化体积诊断给出
连续项、离散链项和体积基率/辅助率。保存总 RHS 减去这两组体积率得到 base_residual
与 auxiliary_residual；边界贡献定义为 auxiliary_residual-map(D base_residual)。
检查全部 11 个基率差值及严格内部的 33 个辅助率差值不超过 2e-12；不得截断舍入误差。
检查总辅助差值不超过保存的六面 SAT 最大值之和加 2e-12，此项只是宽松包络检查，
不是六面惩罚公式的独立复算。面、边、角重叠贡献相加，不求平均。

逐阶段验证 L(saved_rhs)=continuum+chain+boundary_residual，逐步用原 RK4 权重
dt*(1,2,2,1)/6 检查三项累计与 L(q_end)-L(q_start) 一致，并验证每个累计前缀。
这是一项线性映射/离散记账恒等式，不是约束小量、Einstein 误差、收敛或稳定性验收。
另外 14 个几何 RHS 槽不由此诊断验证。边界项是定义差值，不是独立 SAT/CPBC 正确性证明。
连续项、链项、边界项分开报告，不将范数比值当作因果百分比，也不假定各项范数可相加。

固定 SBP 加权 RMS 区域：全域、中心盒 [1.5,2.5]^3、仅一面、仅两面边、三面角。
A/B/P 按 3/9/3 分量归一；D 的 18 个规范存储槽按对角 1/非对角 2 的张量重数、
共 27 分量归一，以匹配旧端点报告。全部比较 abs<=2e-12、rtol=0，不事后改变。
所有端点辅助范数与旧报告逐项比较；检查点、计划、状态、RHS、阶段时刻、边界时钟、
固定解析面目标、源/二进制/清单身份均先核对并于分析结束复核。

## 控制测试与产物

65 个新控制：24 个面/家族注入、3 个面边角相加、5 个内部/ODE 非法差值、1 个其余
14 槽范围反例、2 个带符号 RK 线性记账（含权重错序反例）、1 个损坏端点、3 个非法
dt、1 个缺阶段、3 个非法 RHS、1 个只读、5 个张量重数/区域归一、6 个压缩数据拒绝、
1 个精确解压、5 个科学合同变异、3 个原合同及 1 个求解/子进程调用隔离检查。
另运行前批 79 个 Python 离散余额回归，显式排除其 3 个原生测试；不计入历史运行数。
控制通过后才读取整个保存区间。保存 196 个阶段记录、3 个全区间汇总及每档 6 个
33 槽数组：初始、最终、差值及三类累计贡献。运行器重新读取持久化数组核对余额和范数。

新 5 源加冻结 449 源构成 454 项资格闭包，源快照仍限 4 MiB。本批64 MiB/600 秒，
其中2 MiB 收尾；启动预留全部64 MiB，C>=3 GiB、E>=4 GiB+32 MiB。禁 pyc，
BLAS/MKL/OMP 单线程，所有新产物及临时目录位于 E 工作区。只管理自身启动的 Python
子进程；用户指定的硬时限/磁盘门禁优先。失败或身份漂移保留全部产物并停止，不自动重试。
不做统计显著性推断，也不将确定性代数诊断描述为新物理实验。

命令：`D:\python\python.exe -B scripts/run-nr-k3-trajectory-reduction-controls.py --output-directory tmp/nr-shadow-evidence/nr-k3-trajectory-reduction-controls-v1-20261011`。

即使通过，只有 saved_reduction_budget_consistent 和 boundary_residual_localized 可为 true。
新演化、完整科学矩阵、独立完整 Einstein RHS、独立 SAT、物理边界、非线性稳定、
旧失败改级、physical_gate、live_admission、scientificPayloadWriteback 仍为 false。
原 N13 temporal screen 的 unresolved 不变；N9 完整时间矩阵仍需单独人工确认。

## 依据与技能影响

本批沿用已固定的离散参考和 [上一批协议](EXPERIMENT-20261011-discrete-reduction.md)，
不新增文献结论或外部实现。科研与测试技能用于事前固定范围、负对照、独立输出核验、
资源监控、失败保留及证据边界。用户已授权科研开发和控制测试；执行与磁盘保护按用户
原授权，禁止自动重试仍保留。最终结果另写文档，不回写本协议或已冻结源。

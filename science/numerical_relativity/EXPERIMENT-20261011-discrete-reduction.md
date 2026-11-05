# 33 辅助约束的半离散余额与链式法则误差：事前协议

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: bounded semidiscrete component controls, no positive-time experiment
- Origin Date: 2026-10-11
- Verification Status: UNVERIFIED at registration; results recorded separately
- Version Label: nr-discrete-reduction-controls-v1

## 问题与固定合同

上一批已完成冻结配置的 58 槽连续公式对照，本批不再将解析导数等同于真实差分。
新增独立稠密 SBP(4,2) 诊断，覆盖 A/B/D/P 全 33 个定义约束。444 项资格源不变，
不修改公式、阻尼、SAT、投影、演化器、live、检查点或原生二进制。

令 r=aux-map(Dq_base)，实际半离散变化率为 aux_rhs-map(D(base_rhs))。
连续余额参考将 Dq 作为局部一阶 jet，给出 r_cont_dot 和 J(F_base)Dq。
精确离散余额为 r_cont_dot + map[J(F_base)Dq-D(F_base)]。
第二项必须保留；它不是可以假定为零的连续乘积法则。两项分开报告，不将有符号
贡献称为因果百分比。诊断不修正约束或推进状态。

系数以有理数独立装配，逐项检查 HD+D^T H=diag(-1,0,...,1)、正范数、低阶矩、
不同轴可交换。生产 stencil 只用于对照，不在诊断模块导入。11 个基变量率的
Jacobian 另以复步方向导数核对，避免仅由相同展开式重组得出自洽结论。

## 固定测试集与阈值

82 项新测试：3 项精确 SBP，15 项多项式矩，3 项轴交换，9 项生产/稠密导数对照，
18 组 Python 实际差分余额（N9/13/17、tau=0/1/2、两符号），9 项复步 Jacobian，
1 项定义映射线性变化率，2 组制造场静态加密，4 项遗漏链项反例，3 项平直场，
10 项非法输入/未分辨检查，1 项只读，1 项导入隔离，3 组原生对照。
另选前批 68 项 Python formal-profile 回归，明确排除其 6 项原生测试。

制造场取前批 general-plus 在 (2,2,2) 的常量基值，加逐槽
sign*0.015*(1+0.25*sin(s+1))*sin(0.8*(x-2)-0.6*(y-2)+0.4*(z-2)+0.17*(s+1))，
s=0..57。它是故意离约束的光滑非多项式场，不是真空初值。

所有公式、差分对照与 33 槽余额误差用 abs<=2e-12、rtol=0；不根据结果改阈值。
N9/17/33 同一固定域 [1,3]^3 的静态加密单独测链项趋零，不推进时间。
四个家族分别记录全网格与固定中心点 L-infinity。每次二倍加密的事前观察窗：
全网格阶 1.6..2.4、中心点阶 3.6..4.4；误差任一低于 2e-13 则未分辨，不能记为通过。
这些只检验制造场上的局部截断机制，不替代 Einstein 解或约束的收敛验收。

原生只取正号场 N9/13/17，每档 dx/dy/dz/rhs 各一次，单线程，共 12 调用。
保存 q、Dq、11 基率、33 辅助率、33 余额与 33 链项，以及所有原始调用输入/输出。
原生导数与稠密矩阵、原生 44 率与独立参考、从真实原生 RHS 重构的 33 余额逐项比较。
全网格/面/边/角分别记录，不把旧线程一致性结果冒充本批新线程测试。

## 资源与停止

新增 5 项源构成 449 项资格闭包，保存快照必须不超过原 4 MiB 源快照上限。
本批总额 64 MiB/600 秒，2 MiB 收尾，单原生调用 30 秒；C>=3 GiB，
E>=4 GiB+32 MiB，启动预留全部 64 MiB。所有产物与临时目录在 E，禁 pyc，
BLAS/MKL/OMP 单线程。只管理本批所属进程。失败/超时/身份或资源漂移保留并停止，
不自动重试或清理用户数据。N33 只有 Python 静态诊断，不超越原生 N17 上限。

命令：`D:\python\python.exe -B scripts/run-nr-k3-discrete-reduction-controls.py --output-directory tmp/nr-shadow-evidence/nr-k3-discrete-reduction-controls-v1-20261011`。

即使通过，仅登记 discrete_reduction_identity_consistent 与
manufactured_chain_refinement_observed。正式时空/约束收敛、物理边界、长期稳定、
完整 Einstein 轨迹、黑洞/AMR/视界/Psi4/GPU 与 live/writeback 均不由本批通过。
N13 旧结论不改；N9 正式时间矩阵仍等待单独人工确认。

## 来源

Exa 一次 5 结果定向检索并读取 [Strand 1994 官方摘要](https://doi.org/10.1006/jcph.1994.1005)，
只据摘要核对内外阶数，未声称读到付费全文。GitHub 读取
[SBP 系数固定 blob](https://api.github.com/repos/ranocha/SummationByPartsOperators.jl/git/blobs/793d768b0bb39df2339c63901a7eb300ddbbc779)
的一阶 order=4 表；首次按猜测路径读取返回 404，随后改用既有已知 blob 成功。
只使用数学系数，没有运行/安装 Julia 或复制外部实现。
另核对 [GRChombo 固定版本差分](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/BoxUtils/FourthOrderDerivatives.hpp)，
blob 5363b1c8313630fefa7554931b3210f44b9c4f98；其内部中央差分依赖 ghost cells，不能
当作本项目物理边界实现。离散链项为本项目按定义推导，不声称上述文献验收了本代码。

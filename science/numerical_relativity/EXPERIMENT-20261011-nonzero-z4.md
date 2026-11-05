# 非零 Z4 场与原生体积方程：独立瞬时控制协议

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: implementation controls; independent physical Z4 equations
- Origin Date: 2026-10-11
- Verification Status: UNVERIFIED at registration; results recorded separately
- Version Label: nr-nonzero-z4-controls-v1

## 问题、独立性与范围

在上一批独立物理 ADM 参考上加入非零 Theta、Z_i 及其解析空间导数，检查冻结的
58 变量 Python FO-CCZ4 方程，再直接检查已验收的 Windows C++ SBP 体积组件。
新参考只导入独立 continuum_adm、NumPy 和标准库，不调用生产 FO 几何、RHS 或差分。
测试中的槽适配和精确导数回调只连接被测系统，不作为预期物理变化率的来源。

全部场满足共形代数定义与辅助变量定义；H/M 可以非零，制造场不称为约束有效真空初值。
本批不推进时间、不调用 SAT、不新建原生构建、不写 checkpoint，不运行 N9 完整矩阵。
独立辅助/代数约束违反下的 ordering 与松弛项不在该参考的适用范围内。

## 物理推导合同

固定无物质、kappa3=1、c=e=s=1；使用原论文带 alpha*kappa1 的阻尼形式。
从物理度规 gamma、外曲率 K_ij 和物理协向量 Z_i 出发，在独立 ADM 变化率上加：

- delta(K_ij_dot) = alpha*(D_i Z_j+D_j Z_i-2 Theta K_ij-kappa1*(1+kappa2)*Theta*gamma_ij)。
- Theta_dot = beta^i partial_i Theta + alpha*(H/2+div Z-Theta K)
  - Z^i partial_i alpha - alpha*kappa1*(2+kappa2)*Theta。
- Z_i_dot = Lie_beta Z_i + alpha*(M_i+partial_i Theta-2 K_i^j Z_j-kappa1 Z_i)
  - Theta partial_i alpha。协向量 Lie 导数保留 Z_j partial_i beta^j。

由 GammaHat=GammaTilde+2 hInv Z 对时间求导，保留 2 hInv_dot Z，不直接复写展开后的
生产 Gamma 方程。由 chi、h、a 的定义求变化率；使用既有 advective 1+log、
f=3 alpha chi、eta=0 规范，lnalpha_dot 加 4 Theta，A_i_dot 加 4 partial_i Theta。
driver 变化率须扣除新 GammaHat 项的 shift 平流；B/D/P 仍从各自定义求导。

## 登记控制集、阈值与产物

64 项新测试：

1. 24 组 Python 全58槽非线性对照：两种稠密旋转、两种符号、Theta-only/Z-only/both，
   两组 (kappa1,kappa2)=(.1,0)/(.2,.25)。物理 gamma/K/Z 变化率另外重构核对。
2. 3 个零Z4极限、6 个均匀场阻尼/alpha因子控制。
3. 9 个解析槽空间导数及3个lapse辅助链式法则控制，五点四阶数值微分间隔 .001。
4. 3 个漏项负对照：逆度规时间导数、协向量 Lie 项、阻尼 alpha 因子。
5. 10 项非法输入拒绝、1项只读快照、1项独立导入审计。
6. 4 个原生多项式场：zero/Theta-only/Z-only/both。物理 gamma 是固定稠密正定矩阵，
   K_ij 为常数非对角矩阵；lnalpha、beta、Theta/Z 为最多二次多项式，driver 一次。
   所有被差分的规范58槽最多二次，SBP(4,2)边界和内部行均可精确求导至舍入误差。
   每场保存独立预期 RHS/三轴导数；3次导数调用及1/2/4/1线程RHS，共28次原生调用。
   逐槽记录全网格、面、边、角的误差；线程数值payload逐字节一致，重复1线程完整stdout一致。

全58 RHS、物理变化率、原生导数的绝对误差必须 <=2e-12，rtol=0。
只有五点有限精度数值微分控制使用原定2e-11阈值。不改变任何正式物理验收阈值。
64项新测试及54项上一批独立ADM回归须全过、零跳过；测试项不是物理基准数。
不将同一实现的相互一致性扩大成任意时空/时间积分/边界有效性证据。

## 资源与身份

保存429项既有资格源，新增5项控制文件形成434项前后身份与快照。
原生组件保持已验收的 exe、OpenMP runtime、7个组件源、4个生成片段及旧回执不变。
不重新运行历史68项原生组件测试或历史160项参考套件，不拼接成新总数。

单批64 MiB/600秒，2 MiB收尾余量；单次原生调用最多30秒。C>=3 GiB，
E>=4 GiB+32 MiB，启动还须预留整个64 MiB。E盘临时目录，禁pyc，BLAS/MKL单线程，
原生OMP仅按登记的1/2/4线程。父运行器每0.5秒检查资源；只停止本批所属进程树。
任一错误、超时、身份变化或触及资源底线即保留证据停止，不自动重试、不改阈值。

命令：`D:\python\python.exe -B scripts/run-nr-k3-nonzero-z4-controls.py --output-directory tmp/nr-shadow-evidence/nr-k3-nonzero-z4-controls-v1-20261011`。

预期产物：tests.xml、continuum-adm-regression.xml、nonzero-z4-observations.json、
全部28次原生输入/输出/进程记录、独立预期数组、源码快照及qualification-gate.json。
即使通过，仅 nonzero_z4_continuum_consistent 与 native_polynomial_component_consistent
可以为true；independent_einstein_rhs_validated、physical/live/writeback保持false。
空间/约束收敛、真实辐射边界、长时稳定、黑洞/AMR/视界/Psi4/GPU门禁仍未由此关闭。
N13 v2未分辨结论不重判；N9完整实验仍待单独确认。

## 核实来源

- [Alic等，2012，CCZ4](https://arxiv.org/html/1106.2254)，DOI 10.1103/PhysRevD.85.064040。
  本轮Exa直接抓取已知原作URL，读取式(6)-(10)、(20)-(23)；0次新搜索，不把HTML生成日期当发表日期。
- [GRChombo固定源码](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/CCZ4RHS.impl.hpp)，
  GitHub只读150-235行，blob3246fbb18d6c0bd1e79370ca1c95a4b29bd0527d。
  核对Theta/K/Gamma结构及可选阻尼重标度。其covariantZ4选项存在取消lapse因子的实现；
  本批坚持冻结内核的原始alpha*kappa1约定，不声称等同GRChombo默认设置或运行过其后端。

这是一组确定性微分/实现控制，不作抽样统计推断、p值检验或论文级复现声明。
无外部数据上传、源码执行、远端仓库变更或科学payload写回。

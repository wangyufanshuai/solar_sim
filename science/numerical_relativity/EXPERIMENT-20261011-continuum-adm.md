# 非零外曲率与规范场：独立物理度规 ADM/Z4 瞬时控制协议

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: implementation controls with independent second-order continuum equations
- Origin Date: 2026-10-11
- Verification Status: UNVERIFIED at registration; result recorded separately
- Version Label: nr-continuum-adm-controls-v1

## 科学问题及范围

从物理 gamma_ij、K_ij、alpha、beta、b 及解析空间导数出发，独立求得 ADM
瞬时演化，再通过共形变量定义和乘积法则转换，能否复现冻结FO-CCZ4的58变量RHS？
与上一控制不同，这里K/A、非对角空间度规、shift、driver及其导数均非零。
固定Theta=Z_i=0以及全部辅助定义约束为零；允许H/M不为零，并检查其Z4反馈。
这不是一般非零Z4状态验证，也不是黑洞、宇宙学或新的正时间物理实验。

独立模块只导入NumPy和标准库。几何从物理度规的二阶导数构造，不调用求解器的
初始化、FO几何、SBP/SAT、导数或RHS函数。槽映射及导数回调仅用于对照。

## 推导合同

使用 d_t gamma=-2 alpha K+Lie_beta gamma、
d_t K_ij=-D_iD_j alpha+alpha(R_ij+K K_ij-2 K_ik K^k_j)+Lie_beta K_ij。
先从此计算gamma/K的物理变化率，再**微分共形变量定义**，不照抄展开后的FO源项。

令chi=(det gamma)^(-1/3)、h=chi gamma、a=chi K_ij-h K/3、lnphi=lnchi/2。
独立计算H=R+K²-K_ij K^ij和M_i=D_j K^j_i-D_i K。本切片
Theta_dot=alpha H/2、Z_i_dot=alpha M_i，因此
GammaHat_dot=GammaTilde_dot+2 alpha h^ij M_j。
GammaTilde_dot通过对GammaTilde^i=-partial_j h^ij直接求导得到。

规范严格限定现有advective 1+log、f=3 alpha chi、eta=0；beta的空间导数演化必须
包含partial_i(f) b^j。A/B/D/P的变化率从其定义及base变化率的空间导数计算。
不支持独立辅助约束违背，也不测试本切片消失的阻尼/ordering项。

## 固定控制集与阈值

1. 六个N9密集抽样场：三种固定旋转度规、两种外曲率符号。使用固定多项式/
   指数制造数据，不解约束；H/M必须非零并如实记录，不能称为有效真空初值。
2. 三个常截面曲率度规，k=-.05/0/.05：gamma=4I/(1+k r²)²，R_ij=2k gamma_ij。
3. 九个Kasner瞬时物理切片：指数(-1/3,2/3,2/3)、(0,0,1)、(-2/7,3/7,6/7)，
   t=.5/1/2，固定稠密旋转。核对gamma/K的解析时间导数及H/M为零。
   proper-time Kasner的恒定lapse不是当前1+log的正时间解；只验证瞬时物理率。
4. 所有58槽的解析空间导数和A/B/D/P变化率的链式法则，用五点四阶差分独立检查；
   固定间隔.001，比较阈值2e-11。此阈值仅用于有限精度数值微分控制，不改物理阈值。
5. 漏动量反馈、漏规范乘积项、漏外曲率二次项必须检出；非法数据和回调拒绝测试。

全58 RHS和物理gamma/K变化率绝对误差必须<=2e-12、rtol=0；54新测试及78项
初始ADM回归须全过、零跳过。先登记再运行，不调整案例/时间/阈值以获取通过。
不积分时间，不运行N9正式批次、N17时间步或任何原生程序。

## 来源核实

本轮Exa两个定向查询各5结果，共10条候选；排除百科作技术依据，原作镜像去重。
只依赖下列论文方程及固定版本源码；没有外部代码下载执行、数据上传或外部写操作。

- [Alic等，2012，CCZ4](https://arxiv.org/html/1106.2254)，式(6)-(10)、(20)-(23)，
  Exa抓取并读取。Z/Theta为零时的源项由(8)-(9)化简，GammaHat定义来自(23)。
  页面自动生成日期不当作论文发表日期；对应DOI 10.1103/PhysRevD.85.064040。
- [Vulcanov与Alcubierre，Testing the Cactus code](https://ar5iv.labs.arxiv.org/html/gr-qc/0110031)，
  式(17)-(18)的Kasner度规和指数关系，Exa抓取核对；未复现该文的演化实验。
- [GRChombo固定版本](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/CCZ4RHS.impl.hpp)，
  只读167-239行，Git blob3246fbb18d6c0bd1e79370ca1c95a4b29bd0527d，核对Theta/K/Gamma结构。
  本模块的物理ADM到共形导数映射为独立推导，不宣称运行了GRChombo对拍。

## 资源、身份与停止条件

保留424项既有资格源和旧结果，新增5项控制源单独快照，前后核验429项身份。
单批64 MiB/600秒，2 MiB收尾余量，C>=3 GiB，E>=4 GiB+32 MiB且启动预留整批64 MiB。
临时目录和产物仅E盘，禁止pyc，BLAS/OMP/MKL单线程；0.5秒检查所属进程/磁盘/时间。
错误/超时/资源限额即停止并保存原证据，不自动重试，不清理数据或降低底线。

命令：`D:\python\python.exe -B scripts/run-nr-k3-continuum-adm-controls.py --output-directory tmp/nr-shadow-evidence/nr-k3-continuum-adm-controls-v1-20261011`。

即使通过，也只设zero_z4_continuum_adm_consistent=true。
independent_einstein_rhs_validated、physical/live/writeback保持false；空间/约束收敛、
实际SBP差分截断、SAT/物理边界、长期稳定、非零Z4场、AMR/视界/Psi4/GPU仍未据此验收。
N13原未分辨结果不重判，N9完整批次仍待单独确认。

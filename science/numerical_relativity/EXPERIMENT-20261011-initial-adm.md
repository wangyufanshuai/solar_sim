# 初始时刻独立 ADM 张量核验：预注册控制协议

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: implementation controls; independent continuum oracle
- Origin Date: 2026-10-11
- Verification Status: UNVERIFIED at registration; results reported separately
- Version Label: nr-initial-adm-controls-v1

## 研究问题和精确范围

给定现有 Schwarzschild 对数 lapse 脉冲初态，把解析空间导数直接供给冻结的
FO-CCZ4 **volume** RHS，其初始物理外曲率变化率是否等于独立 ADM 方程？
原有 boundary-compatibility 标量 Q 源检查已经存在；本控制将初始对照扩展到
完整对称 K_ij 张量及其 trace / conformal trace-free 分解，不重做静态标量研究。
这不是演化实验，也不是独立完成了一个通用 Einstein 求解器。

固定 G=c=M=1、[1,3]^3、K_ij=0、beta=0、h_ij=delta_ij、Theta=GammaHat=0。
psi=1+1/(2r)，chi=psi^-4，alpha0=(2r-1)/(2r+1)，alpha=alpha0 exp(a B)。
B 是中心 (2,2,2)、半宽 .75、单轴 (1-u²)_+^6 的乘积；不是 C-infinity。
离散抽样 N=9/13/17，a=0,+.001,-.001。N17 仅代数求值，无时间步和 CFL 放行。

## 方程和独立性

符号采用 d_t gamma_ij=-2 alpha K_ij+Lie_beta gamma_ij，故本初态
d_t K_ij=-D_i D_j alpha+alpha R_ij。
R_ij=(delta_ij-3 n_i n_j)/(r³ psi²)，Gamma^k_ij 为 psi^4 delta 的解析连接。
令 L0=ln(alpha0)，利用 D_iD_j alpha0=alpha0 R_ij，还可独立写出消去静态项的形式：

`Kdot_ij = -alpha [a (B_,ij-Gamma^k_ij B_,k+L0_,i B_,j+L0_,j B_,i)+a² B_,i B_,j]`。

两式逐项比较。再以 Kdot=chi delta^ij Kdot_ij 和
Adot_ij=chi Kdot_ij-delta_ij Kdot/3 映射到58槽合同；其余51槽初始应为零。
独立模块只依赖 NumPy/标准库，不导入 solver 的初始化、曲率、差分或 RHS。
80位 Decimal 直接对标量 alpha 和 ln(phi) 做中心差分，检查解析梯度/Hessian；
固定差分间隔1e-8、固定离轴/中心/支撑边界/支撑外点，不从 solver 生成真值。

测试 adapter 对冻结 RHS 传入局部 first_derivative 参数，不改全局函数；只接受
这个初态的已登记数组/视图、对应 base 对象和三个轴。未知/复制/被改动数组拒绝，
不把任意零数组默认为常数场。实际 RHS 与独立预测的58槽及重建 K_ij 都比较。
包括符号反转、漏 chi、漏 trace-free 项的反例；不得通过改阈值消除失败。

## 主来源与读取边界

1. [Gourgoulhon, 3+1 Formalism and Bases of Numerical Relativity](https://arxiv.org/pdf/gr-qc/0703035)，
   2007，印刷第60页，式(4.63)-(4.66)。Exa 搜索发现原作，PDF 抓取只返回摘要；
   随后网页 PDF 读取核实了具体方程。镜像不计为独立来源。
2. [GRChombo CCZ4RHS.impl.hpp](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/CCZ4RHS.impl.hpp)，
   固定 commit `37e659523830418b210acea1661dac0e00bb1b75`，读取95-240行；
   Git blob `3246fbb18d6c0bd1e79370ca1c95a4b29bd0527d`。仅核对 A/K/Theta 源项约定，
   未运行该软件，不宣称跨代码对拍，也未复制第三方实现。

本协议中的 Schwarzschild 化简为本项目独立推导，不能说参考文献直接测试过本代码。

## 验收、运行和停机

- 初始化身份比较绝对误差 <=2e-14；方程/导数/张量比较绝对误差 <=2e-12，rtol=0。
- 非零脉冲预测 K_ij 变化率必须非零，三个反例必须明显超过2e-12，防止全零假通过。
- 419项既有资格源和旧产物不修改；5项新控制源一并快照、前后哈希核验。
- 新测试及既有70项空间预检回归须全部通过，零跳过；保留失败日志，不自动重试。
- 单批64 MiB/600秒、2 MiB收尾余量；C>=3 GiB，E>=4 GiB+32 MiB，启动额外预留64 MiB。
- 所有产物/临时目录在E盘，禁写 pycache，BLAS/OMP/MKL单线程，无原生程序调用。
- 仅监视本批目录和所属子进程，0.5秒资源检查，超时或磁盘底线触及即停止；不清理旧文件。

入口：`D:\python\python.exe -B scripts/run-nr-k3-initial-adm-controls.py --output-directory tmp/nr-shadow-evidence/nr-k3-initial-adm-controls-v1-20261011`。

## 不得提升的结论

即使通过，`independent_einstein_rhs_validated=false`。没有验证非零 K/A/shift/Z4
状态中的一般耦合项、约束传播、SBP差分截断、SAT/物理边界、强双曲性、长时稳定、
空间收敛、C++独立物理正确性、AMR、视界、波形、双黑洞、GPU或live/writeback。
仅可记录 `analytic_initial_adm_acceleration_consistent=true`；不重判任何旧失败或未分辨结果。
N9完整物理批次仍需要单独人类确认。这里是确定性代数/实现控制，不适用统计推断认证。

# FO-CCZ4 离约束辅助变量：独立连续变化率控制协议

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: independent continuum reduction-defect implementation controls
- Origin Date: 2026-10-11
- Verification Status: UNVERIFIED at registration; outcome recorded separately
- Version Label: nr-reduction-balance-controls-v1

## 为什么需要本批

上一批非零Z4参考要求共形代数与辅助定义约束一致。实际演化会偏离此约束面；
因此不能用上一批结果证明离约束的FO扩展正确。本批独立推导四类定义误差
A-d(lnalpha)、B-d(beta)、D-d(h)/2、P-d(lnphi)的瞬时变化率，保留非零误差。
已有行列式和tau=0 lapse诊断仅作历史参考，不重复宣称其为本轮新增证据。

新模块仅依赖NumPy/标准库，不导入生产FO函数。输入为任意正定共形h和完整58槽
及真实解析一阶jet；输出11个度规/规范率、33个辅助率与对应约束率、logdet与tr_h(a)率。
其余14个槽没有新的全分量离约束几何参考，不能设完整Einstein独立验证为true。

## 推导合同

记G=h逆、C=G:a、delta=det(h)-1、lambda=tau_inverse；rA/rB/rD/rP为上述定义误差。
T_k=partial_k C-2(G rD_k G):a，是FO的trace-gradient代理，不偷换成真实partial_k C。
curlX(k,l)=partial_k X_l-partial_l X_k，保留剩余张量指标。固定c=e=s=kappa3=1，
advective 1+log，f=3 alpha chi、mu=.2 chi、eta=0，与冻结内核相同。

直接对论文的11个基变量ODE作真实乘积求导，然后以独立约束余额还原辅助率：

- rA_k_dot = beta^l curlA(l,k) + rB_k^l A_l - 2 T_k。
- rB_k^i_dot = beta^l curlB(l,k)^i + rB_k^l B_l^i
  + f(rA_k+2rP_k)b^i + alpha² mu G^im[curlP(k,m)-G^nl curlD(k,l)_mn]。
- rP_k_dot = beta^l curlP(l,k) + rB_k^l P_l + alpha(K rA_k+T_k)/3
  + sum_l curlB(k,l)^l/6。
- rD_k_dot包括D旋度输运、rB·D、B·rD、散度权重、A约化误差、rD与raised(a)收缩、
  B旋度对称化修正，并明确保留两项：-alpha*C*partial_k h/3，以及
  lambda/2*[partial_k(det h)*h+delta*partial_k h]。

最后一项来自基度规ODE的松弛源，而辅助D方程没有同步松弛。因此这不是对所有
定义误差的自动阻尼；即使瞬间rD=0，空间变化的代数误差仍可产生非零rD_dot。
全部D索引/系数在独立模块中完整列出，以直接Python/C++检查和乘积微分负对照约束。

独立代数收缩为：logdet_dot=2 beta^k G:D_k-3 lambda delta；
C_dot=beta^k T_k+[alpha(K-2Theta-2C/3)+lambda(delta-3)]C。
不从生产RHS先计算这些预测，再声称是独立参考。

## 固定案例与验收

6种N9、[1,3]^3二次规范槽多项式：general-plus/minus、zero-shift、zero-driver、
metric-consistent、all-definitions。h为稠密SPD，a含非零迹；全部变量及导数显式登记
于测试的确定性系数函数。后两组保留其他误差，尤其all-definitions不强制代数约束。
所有槽至多二次，SBP(4,2)全网格（包括面边角）可精确微分至舍入误差。

72项新控制：18组Python余额(6场×lambda=0/1/2)、6组C++余额、6组基ODE乘积微分、
18组解析jet微分、2组仅定义一致时的代数驱动、3组联合平直约束面不变性、1组松弛
驱动差值、4组遗漏项负对照、12个非法输入拒绝、1个只读快照、1个导入独立性。
另重跑上一批60项非原生Z4测试；明确筛去该文件的4项原生测试，旧完整64项仍由其
历史固定回执证明，不能把本次筛选说成64项重跑。

每个原生场运行三轴导数和1/2/4/1线程RHS，共42次组件调用，lambda固定1。
保存输入、完整输出、解析导数、独立预期率及进程记录。44个被检查槽逐区域记录误差，
两个代数收缩另验；线程数值payload逐字节一致，另起1线程完整stdout逐字节一致。
绝对误差<=2e-12、rtol=0；五点数值微分的专用阈值2e-11、间距.001沿用前批。
零失败/错误/跳过；不为通过改案例、阈值或求解器。不推进时间、不调用SAT/新构建。

## 资源、身份、停止条件

434项既有资格源冻结，新增5项形成439项前后/快照闭包；历史原生二进制、运行时及
7个组件源/4个生成片段不变。单批64 MiB/600秒，2 MiB收尾余量，原生单调用30秒。
C>=3 GiB，E>=4 GiB+32 MiB，启动预留整批64 MiB；全部产物/临时文件E盘，禁pyc，
BLAS/MKL单线程，OMP只用登记1/2/4线程。每0.5秒守护所属进程与资源限额。
错误/超时/身份漂移/磁盘底线即保存并停止，不自动重试，不清理用户数据。

命令：`D:\python\python.exe -B scripts/run-nr-k3-reduction-balance-controls.py --output-directory tmp/nr-shadow-evidence/nr-k3-reduction-balance-controls-v1-20261011`。

即使通过，也仅登记continuum_reduction_balances_consistent和native_reduction_balances_consistent。
完整Einstein、离约束全58槽、非线性约束稳定性、离散乘积法则、物理边界、时空收敛、
黑洞/AMR/视界/波形/GPU与live/writeback均不据此验收。原N13 v2未分辨不重判，N9正式
实验待单独确认。本组是确定性微分/实现控制，不作统计抽样显著性推断。

## 来源与不同方法的边界

Exa一次定向搜索返回5项，均指向同一原作或其索引；去重后只以
[Dumbser等2018 FO-CCZ4](https://ar5iv.labs.arxiv.org/html/1707.09910)，
DOI10.1103/PhysRevD.97.084053的式(6)-(9)、(12)、(28)和II.3说明为公式依据。
直接抓取读取相关原文；没有称5条返回为5个独立科学证据。变量f的乘积项是当前
f(alpha,chi)配置所需扩展，论文常数f时该项为零。原文不把第一阶定义约束当显式
阻尼源加入其ODE/PDE拆分；本批不擅自增加新的阻尼或周期重构策略。

[GRChombo TraceARemoval](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/TraceARemoval.hpp)
经GitHub只读核对，blob50d3147cf02c2626d6065b8d70e9e87b9a3174f5，明确调用trace-free映射。
这与本批保留非零迹、仅分析有限率松弛不同；没有运行其后端或引入该投影。
无外部代码执行/上传/远端写入，无美术层或legacy live更改。

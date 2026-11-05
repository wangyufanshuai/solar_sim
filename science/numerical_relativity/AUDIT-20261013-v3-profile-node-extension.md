## Material Passport

- Origin Skill: academic-research-suite / deep-research fact-check; Exa Search
- Origin Mode: read-only equation/source verification after the completed v3 batch
- Origin Date: 2026-10-13 (Asia/Shanghai)
- Verification Status: SOURCE_AUDIT_ONLY; NO_NEW_NUMERICAL_VALIDATION
- Version Label: v3-profile-node-extension-audit-v1

## 结论与本轮边界

v3 的 case0 成功结论保持不变，但其 `case0_nodes` 不能直接用于其它
背景。本轮把论文速度、当前状态依赖 gauge、法向约定和 shift 的关系
逐项对齐，找到下一步扩展必须保留的条件；没有运行新案例或完整矩阵。

本轮仅新增本审查文件。没有修改冻结的 v3、旧算法、阈值、输入、失败
证据或成功回执，也没有计算新的矩阵、投影、特征值或时间演化。
上一轮属于实质进展；本轮新增的是可追溯的公式适用性检查，不是新增
科研通过项。总目标仍是动态时空 NR，不以通过有限矩阵集合代替它。

## 1. 文献与当前方程的对应关系

核对的原始论文是 Dumbser 等人的 FO-CCZ4 工作，
[arXiv:1707.09910v2](https://arxiv.org/abs/1707.09910v2)，
期刊信息为 Physical Review D 97, 084053 (2018)。本轮读取
[全文 Appendix A.2、式64–68](https://ar5iv.labs.arxiv.org/html/1707.09910#A1.SS2)。
其设置包括 advective 1+log、Gamma-driver、e=c=1 和单位行列式
共形度规；不能把这些条件省略后引用为任意配置的证明。

以下是将文献式子映射到本项目记号后的代数核对，不是对本项目
所有系数和背景的独立证明。定义

`h = conformal metric, chi = phi^2, g_n = n^T h^(-1) n, beta_n = beta dot n`。

六个正的本征速度幅值的平方及47维 PDE 块的每侧重数如下。序号按
当前 profile 的幅值升序排列，不沿用论文的本征向量编号。

| 分支 | 原公式映射后的平方 | 代入当前 profile 后 | 每个正/负分支重数 |
| --- | --- | --- | ---: |
| ordering-T | alpha^2 mu g_n / 4 | alpha^2 chi g_n / 20 | 4 |
| ordering-L | alpha^2 mu g_n / 2 | alpha^2 chi g_n / 10 | 2 |
| light | alpha^2 chi g_n | alpha^2 chi g_n | 6 |
| lapse | 2 alpha chi g_n | 2 alpha chi g_n | 1 |
| shift-T | f g_n | 3 alpha chi g_n | 2 |
| shift-L | 4 f g_n / 3 | 4 alpha chi g_n | 1 |

另有15重的内禀零节点，故重数合计 `15+2*(4+2+6+1+2+1)=47`。
这不是43维约束系统的重数表；该系统的约束约化、秩和状态映射必须
独立保留，不能借用47维表来判定通过。

### 当前 profile 不是一个任意常数 f、mu 的实现

[FOCCZ4GaugeProfile](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/fo_ccz4_gauge_profile.py:38)
默认规定 `f=3*alpha*chi, mu=chi/5`，并要求 `0<alpha<2, chi>0`，
以及 advective 1+log、c=e=s=1。本轮逐项代入发现，与旧
[nodes 函数](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/constraint_projector_energy.py:21)
的六个平方根相符。该函数并没有接收任意 profile 参数的接口；
未来接口不能接受其它 shift_scale/ordering_scale 后仍返回这些固定分支。

对于真正的变系数演化，还要保留乘积求导项
`partial_k(f)*b^i = f*(A_k+2*P_k)*b^i`，其中 P=partial ln(phi)。
[当前 RHS](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/fo_ccz4_rhs.py:831)
已有此项。恒定、零辅助场的主矩阵检查看不到其完整非线性作用；
本轮确认源码存在，不等于独立验证此项或约束传播已通过。

## 2. shift 与法向：不能混淆的三个约定

### 2.1 论文速度与代码矩阵的符号

论文采用 `q_t+B(n) q_n=S`，本项目采用
[`q_t=A(n) q_n+S`](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/fo_ccz4_frozen_symbol.py:3)。
因此 `A=-B`：论文写作 `-beta_n +/- c` 的族，对应代码矩阵的
本征值集合 `+beta_n +/- c`。当前
[speeds](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/constraint_energy_controls.py:48)
使用后者。它们不是同符号的物理传播速度；入射/出射判定须遵守
已有 SAT 的符号约定，不能照搬论文的负 shift 到当前验收数组。

### 2.2 构造内禀投影时，只在 PDE 补空间移除 shift

令 P 为 PDE 补空间投影，O=I-P。需要先满足已有的分解
`A=K+beta_n*P, KP=PK=K`，再用对称内禀节点在 K 上求 Hermite 投影。
不是 `K=A-beta_n*I`；后者会错误移动11个 ODE 模式。

当前 v3 要求节点关于零对称。未来不能把平移后的 speeds 直接送入
这个接口，也不能把58维 ODE 与某个零速 PDE 分支合并以满足秩检查。
`beta_n+r_j=0` 是 PDE 模式穿过零坐标速度，不是两个内禀节点相撞。
原39个 shift 案例正是在检查13个分支各自的负/零/正穿越，必须保留。

### 2.3 法向归一化约定不同

冻结58维算子允许未归一化的坐标协向量；当前43维约束和 energy
入口使用[欧氏单位法向](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/constraint_order_reduction.py:14)。
在这个接口内，`g_n=n^T h^(-1)n`，不能替换为1，也不能只取某个
对角元。将其换成物理单位法向会同时改变算子、速度和验收输入，
不能作为隐式数值优化。任意法向推广仍需独立旋转/张量映射检查。

## 3. 严格分离不等于一致稳定性

在当前默认 profile、正定 h、chi>0、0<alpha<2 下，上表六个幅值
确实严格有序。这个结论由正数之间的比值直接推出，不需要拟合谱。

但该开区间没有保证统一的最小间隔：

- alpha 趋近2时，light 与 lapse 的平方差为
  `alpha*(2-alpha)*chi*g_n`，趋于零。
- alpha 趋近0或 chi*g_n 趋近0时，多个节点靠近内禀零节点。
- Hermite 因子含节点差的倒数；单点13节点不相等不等于存在覆盖
  整个运行域的稳定上界。把 Decimal 位数提高也不构成这种证明。

若今后要声明某个紧运行域上的一致强双曲性，应另外给出正的参数
余量、度规界、完整特征子空间/最小多项式条件以及能量上下界。
不得为通过检查自行裁剪 lapse、合并节点、拟合速度或放宽原门槛。
尤其不能用一个避开 lapse 塌缩的局部测试域替代最终黑洞目标。

## 4. 原66案例究竟覆盖什么

[fixture 定义](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/constraint_energy_controls.py:14)
可直接追溯到
[三个恒定背景](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/profile_constraint_closure.py:46)
和九个法向：

| 案例 | 真实覆盖 | 不支持的外推 |
| --- | --- | --- |
| 0–26 | 3个恒定平坦背景 × 9个法向 | 曲率随空间变化、动态时空 |
| 27–65 | 固定背景/法向下13个分支 × 3种 shift 穿越 | 黑洞演化、物理边界稳定性 |

`flat_cell` 明确要求动态量和辅助量为零。非单位且有非对角项的
恒定度规仍是本测试中的平坦背景，不应在报告中简称为曲率背景。

因此，后续即使66例全部通过，也只是迈过一个固定系数能量检查点。
变系数完整约束传播、物理初边值问题、独立约束收敛、Schwarzschild /
gauge-wave 演化、跨后端一致性仍是原目标所需工作。AMR、视界、ADM、
Psi4 和 GPU 准入不能从这个代数检查点推出。

## 5. GitHub 对照：可借鉴，但不是同一个离散系统

GitHub 查询确认 GRChombo 的规范仓库现在为 GRTLCollaboration/GRChombo。
本轮固定读取提交
[`37e659523830418b210acea1661dac0e00bb1b75`](https://github.com/GRTLCollaboration/GRChombo/commit/37e659523830418b210acea1661dac0e00bb1b75)。

- [MovingPunctureGauge.hpp](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/MovingPunctureGauge.hpp)
  中 shift_Gamma_coeff 默认0.75；lapse_power=1、lapse_coeff=2。
  本项目的状态依赖 f 不是这个默认常数设置。
- [CCZ4RHS.impl.hpp](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/CCZ4RHS.impl.hpp)
  明确调用二阶空间导数。它不是这里58变量的一阶约化及其43维约束
  系统，故不能把其中 Gamma-driver 的设置直接用作本项目特征结构
  或边界验收的依据。代码可作为后续方程项级对照的来源之一。
- [LICENSE](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/LICENSE)
  标示 BSD-3-Clause；本轮仅阅读，没有复制或并入上游代码，也没有
  克隆、构建、安装依赖或声称 Windows 工具链兼容已验证。

本轮没有发现应据此改判 case0 的证据，也没有把方法差异误报成
GRChombo 或本项目的数值错误。

## 6. 下一步建议：一个非平凡恒定案例，尚未授权或执行

建议优先申请原 case12（mode1、wave3），保持64 MiB/600秒的单批上限，
完整矩阵继续暂缓。它同时覆盖非单位 lapse/chi、非对角共形度规、
斜法向和非零 shift，能检验 case0 特殊条件掩盖的系数依赖。
这是目标依赖中的一次局部排错，不是缩减最终动态时空目标。

其原始 fixture 设计可写成精确的独立参数：

`alpha=17/20, chi=18/25, beta=(3/100,-1/25,1/20)`；

`L=[[1,0,0],[3/25,1,0],[-2/25,3/50,1]], h=L L^T`；

`v=(1,2,-1), n=v/sqrt(6), g_n=(v^T h^(-1)v)/6`；

`f=459/250, mu=18/125, beta_n=-1/(10*sqrt(6))`。

这些是由 fixture 源码直接辨认的设计参数，不是从数值谱猜分数。
它们尚未与下一案例的实际 binary64 数组做数值核对。

扩展前必须区分三层来源：设计的精确参数；原 `log/exp`、度规乘法和
法向归一化所产生的浮点输入；Decimal50/70 的独立公式计算。
后两者不能因使用高精度而假称等于第一层。case0 的逐位节点回转
成立也不能推定所有案例都成立；若新来源检查不一致，须保留差异并
停止准入，不能事后修改输入或将不一致改称通过。

建议的新候选保留全部43/58门槛、原节点/矩阵身份、ODE/shift、秩、
状态映射、能量、原正负 spacing 端到端重构及精确回放。构造可使用
独立高精度来源，但验收仍针对原浮点矩阵和节点。系数审计须扩大到
该案例，不能只换节点后借用 case0 的独立系数结论；43维来源覆盖
若仍有限，继续明确披露。具体预登记和执行须等新的案例授权。

本轮没有创建或运行这一批，也不保证它能在600秒内完成或通过。
原 C>=3 GiB、E>=4 GiB+32 MiB、2 MiB收尾余量、8 MiB源码快照上限
保持不变；启动前还需重新做磁盘和预计产物准入。没有自动重试权限。

## 7. 本轮证据核对与检索局限

- 当前工作根和分支仍为独立 next-web / codex/solar-sim-mainline-a。
  没有检查父仓库；发现的无关脚本修改未触碰。
- 当前 v3 成功终态 SHA-256 仍为
  `953928814933c509fccd89de56a154891967db26117c5f2396560ba14235bed6`。
  读取其工作回执仍显示 case0_v3_validated=true，完整矩阵、physical、
  live、scientificPayloadWriteback 均为false。
- 本轮选择性核对的14项当前源码/计划均与该工作回执的 source_after
  一致：v3/v1投影、energy controls、profile closure、gauge profile、
  frozen symbol、RHS、order reduction/controls、symbol bridge、
  longitudinal reduction、spectral SAT、v3 runner、v3预登记计划。
  没有把它写成再次完整核验521项源码或1,681个历史文件。
- 没有启动科学计算进程。本轮磁盘只读时点为C 15,768,461,312字节、
  E 19,662,520,320字节；不是下一批准入凭据。
- Exa 一次有效搜索返回5条结果，4条为同一论文的期刊/作者存档/全文
  镜像记录，另1条是聚合页，排除后只有1篇独立论文，不是5份独立
  证据。首次调用参数校验失败，没有实际检索；后续定向读取不计为
  新独立论文。未进行穷尽文献检索或前沿排名。
- arXiv与作者所在大学的[机构记录](https://iris.unitn.it/handle/11572/222949)
  的作者、题名、年份和期刊编号相符。DOI直接抓取返回406，故不标记
  DOI解析检查成功；未运行S2/Crossref自动审查或全面撤稿/COI数据库
  检查。机构记录与论文镜像是元数据交叉核验，不是独立物理论证。

来源适配性：FO-CCZ4论文为该公式的原始研究，作为公式出处可用；
GitHub固定提交为所读实现的直接证据，作为代码行为出处可用。
按科研技能的技术类框架，分别记录为III类原始方法研究、VII类工程
来源；这些等级不能用于把代码或作者主张提升成本项目科学验证。
作者研究有自身方法评价的潜在智识偏向，维护者代码也不是独立第三方
复现。未发现来源身份冲突，但不声称完成全面利益冲突排查。

本说明由AI辅助完成源码和来源审查，无人类专家签署。科研技能的
具体作用是把出处、代数推论、当前测试证据和待验证部分分开记录。
没有新增数值复现结果；所有全局科研、live 和 payload 门禁保持关闭。

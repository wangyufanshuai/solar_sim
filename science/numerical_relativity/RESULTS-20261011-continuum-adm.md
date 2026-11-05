# 非零外曲率与三维规范场的独立 ADM/Z4 瞬时核验通过

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: implementation controls and independent second-order continuum comparison
- Origin Date: 2026-10-11
- Verification Status: ZERO-Z4 INSTANTANEOUS CONTROLS VERIFIED; GENERAL EVOLUTION UNVERIFIED
- Version Label: nr-continuum-adm-results-v1

## 科研内核的实际推进

新增独立物理度规参考模块 `continuum_adm.py`。它从gamma_ij、K_ij及其解析空间
导数计算ADM物理变化率，再微分共形定义，得到现有58变量的瞬时变化率。
此模块不导入任何求解器初始化、曲率、差分、SBP/SAT或演化辅助函数。

与上一轮K_ij=0的Schwarzschild初态不同，本轮对照场具有非零K/A、非对角度规、
三维shift、Gamma-driver变量及其导数。在Theta=Z_i=0时独立算出H/M，并包含
Theta_dot=alpha H/2及GammaHat_dot中的动量约束反馈；规范空间导数也包含
partial_i(3 alpha chi) b^j。映射通过物理定义的乘积法则实现，不复制FO展开式。
来源依据是[Alic等的CCZ4方程(6)-(10)、(20)-(23)](https://arxiv.org/html/1106.2254)。

冻结的FO-CCZ4 volume RHS在六个N9制造场上接受精确导数回调，与该独立参考
比较全部58槽，并重新组合出物理gamma/K的变化率。制造场故意不满足H/M约束，
用于激发反馈通道，**不是已验收的真空初始数据**。H约为0.00385–0.00825，
M最大约0.02033；这些是制造数据的约束量，不是本轮实现差，也不是演化精度指标。

## 控制结果

| 项目 | 本轮直接证据 |
| --- | --- |
| 新控制测试 | 54通过，0错误/失败/跳过，1.481秒 |
| 旧初始ADM回归 | 78通过，0错误/失败/跳过，1.811秒 |
| 整批含身份核验及快照 | 20.516秒，低于600秒 |
| 六场全部58槽最大差 | 6.869504964868156e-16，阈值2e-12 |
| 重建物理度规变化率最大差 | 7.142723912334503e-16，阈值2e-12 |
| 重建物理外曲率变化率最大差 | 3.382710778154774e-17，阈值2e-12 |
| 动量反馈量级 | 约0.0366–0.0375，明确非零 |
| 规范乘积项最大量级 | 约0.004116，明确非零 |
| 源身份 | 424项既有资格源未改，新增5项；429项当前/快照一致 |
| 产物 | 438文件、437索引项、4001085字节，低于64 MiB |
| 新演化/原生调用 | 0步 / 0次 |

参考模块自身还通过三个常曲率几何基准和九个Kasner瞬时物理率基准。
Kasner度规及指数关系根据[Vulcanov与Alcubierre式(17)-(18)](https://ar5iv.labs.arxiv.org/html/gr-qc/0110031)
核对。这九例检查的是**独立参考模块**，FO求解器直接对照的是上述六制造场；
没有执行Kasner长时间轨迹。proper-time Kasner的恒定lapse也不是当前1+log规范
的正时间解，不能把瞬时一致性当作完整规范演化成功。

五点数值微分控制检查了58槽空间导数以及A/B/D/P变化率的链式法则，使用固定
.001间隔和2e-11控制阈值。该阈值只属于有限精度数值微分，未改2e-12的RHS
对照阈值，更没有改变历史科学实验的任何门槛。
漏动量反馈、漏规范乘积项、漏外曲率二次项的负例都被检出；负例构造在对照端，
未修改冻结求解器。非法物理数据、未知/被修改缓冲区和错误回调状态均被拒绝。

## 源与证据

本轮Exa两次定向查询共10条候选，镜像去重，百科不作技术依据；读取CCZ4及
Kasner原作方程。GitHub只读核对[GRChombo固定版本](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/CCZ4RHS.impl.hpp)
167–239行，未运行或安装第三方代码，没有外部写操作。

目录：`tmp/nr-shadow-evidence/nr-k3-continuum-adm-controls-v1-20261011`。

- 资格回执：`b1f0e195d80c4dc6d074707725c120609f5e74f36dd7c7b721f7d21f7b2f0803`
- 新测试XML：`f02aaf9d74a4a322046e4e978c4c5a53643fb84764093ceaf6685fd50312998a`
- 回归XML：`e02a5bbd3d2b7c5cadc9e89ea6632a18d56a7cb60a46f5f47f94f1c75d44b49c`
- 六场完整逐槽观测：`dbc994f4e347193357b80a8e6cdd1a76c709207f1a11328830d2c2e4b76f2228`

Ruff格式/静态检查通过。末次磁盘检查C约9.67 GiB、E约19.39 GiB；原底线不变。
无清理、无美术/线上代码修改、无提交/推送。完整阈值和方程范围见
[预注册协议](EXPERIMENT-20261011-continuum-adm.md)。

## 仍不能宣称什么

这是更一般几何与外曲率上的连续方程实现核验，仍不是通用数值相对论认证。
本轮Theta/Z本身恒为零，辅助变量满足定义约束，因此阻尼项、ordering-constraint
项、非零Z4场的一般耦合尚未在本参考模块验证。输入解析导数也绕过了实际SBP
差分误差；SAT/物理边界、空间约束收敛、长期稳定与C++独立物理对照仍需闭合。
AMR、视界、ADM/Psi4、双黑洞和GPU不能因此晋级。

只记录 `zero_z4_continuum_adm_consistent=true`；
`independent_einstein_rhs_validated=false`、`nonzero_z4_validated=false`，
physical/live/writeback都保持false。旧N13边区未分辨结论保留，N9完整批次仍
等待人类确认；本轮的N9代数抽样不计作其98步科学矩阵。

下一项独立验证应覆盖非零Theta/Z及其导数和辅助约束偏离，并把独立物理参考
用于原生组件；这些不能用本次较小的代数差替代。另一方面，正式空间收敛路线
仍依赖待确认的N9批次及单独修正/授权的N17步长方案。
科研技能约束了证据外推，测试技能落实了独立参考、解析基准和关键项反例。

# 三项代数约束候选：局部映射与保留状态修正预算

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: prospective deterministic component experiment
- Origin Date: 2026-10-09
- Verification Status: PLANNED; NOT EVOLUTION VALIDATION
- Version Label: nr-three-constraint-projection-study-v1

## 问题与方法边界

上轮未投影分支在第 12 步第二个 RK 阶段触及原 det(h) 速度合同。
本实验不重跑或修补该轨迹，研究一个显式、默认关闭的纯局部映射：

1. s=exp(-log(det(h))/3)，h'=s h。
2. a'=a-h' tr(h'^(-1) a)/3。
3. 对 k=0,1,2，D'_k=D_k-h' tr(h'^(-1) D_k)/3。

其余 28 个 canonical58 槽保持逐字节不变，包括 ln(phi)、K、GammaHat、
A_i、B_k^i、P_i。它没有重构辅助导数，没有求解 Einstein 初值约束，
也不是保持物理度规及 K_ij 不变的重新参数化。

来源是 [原始 FO-CCZ4 论文](https://ar5iv.labs.arxiv.org/html/1707.09910)
的代数约束与 [固定提交的公开实现](https://github.com/iamholger/ccz5/blob/31e8ed262e1a065ad91381306859162e76402120/src/EinsteinConstraints.f90)。
仅核对公式，未复制或运行该 59 槽 Fortran 实现。当前 58 槽索引必须由本地
变量合同绑定。本轮不决定 RK 步边界／阶段应用策略，不接 RHS/SAT/live。

## 冻结输入与矩阵

- 保留失败回执：`tmp/nr-shadow-evidence/nr-k3-longer-window-probe-v1-20261009/receipt.json`，
  SHA256 `b0b37e728425ee9b47b3cdec828ff137003d14df07d28d1601b6edb108f9b6df`。
- 独立失败审计：`tmp/nr-shadow-evidence/nr-k3-longer-window-probe-audit-v1-20261009.json`，
  SHA256 `73057c38465deebe2cf47242fca42ace8cca8d7365e1b9ef2681ff1be6643173`。
- 全部 29 个初始／接受状态，加唯一拒绝阶段状态，不能挑选成功的状态。
- 非对角 SPD、非零 a/D、非均匀 58 场等独立代数控制由专门测试覆盖。
- 同一 FP64/Windows/Python 单线程环境，两次独立进程结果除根 elapsed time 外
  精确一致；保存候选状态及 58 场修正数组。不保存覆盖原始输入。

## 验收与不作出的结论

必需：输入不变；默认关闭字节一致；其余槽字节一致；有限正定输出；
单点 cofactor/显式逐分量独立公式与候选归一化误差 <=2e-12；二次应用的
相对修正 <=2e-12。代数残差除以对应张量尺度后 <=2e-12。
拒绝非 FP64／非有限／非 SPD／条件数 >1e8／不可表示的 lapse 或 chi，
不截断、不伪逆、不悄悄修复输入。

每个状态记录以下投影前、后和差值的全域／内部／面／棱／角加权 RMS：
58 场修正、物理度规、物理 K_ij、实际物理 tr(K)、旧 H、新 Hessian-H、M、
C_A/C_B/C_D/C_P、Theta、det(h)-1、tr_h(a)、tr_h(D_k)。
H/M/约化约束由已有独立稠密算子／Riemann 诊断逐项交叉核对，差 <=2e-12。
本实验不要求 H/M 或 C_D 改善：如变差必须如实报告，不能修改门槛。
所有比值仅在分母 >2e-14 时报告，其余标为未分辨。

成功只表示局部映射及修正预算通过组件检查，不表示演化稳定、四阶、
CPBC、黑洞、AMR、波形、GPU、native 或 live 验证通过。
拒绝状态的映射产物仍不允许作为 checkpoint/restart 使用。

## 执行、资源与失败策略

工作目录：`E:\86137\myai\solar_sim\next-web`；Python：`D:\python\python.exe`。
先定向测试和回归，再执行：

```powershell
& D:\python\python.exe -B scripts/run-nr-k3-algebraic-projection.py --output-directory tmp/nr-shadow-evidence/nr-k3-algebraic-projection-v1-20261009 --test-report tmp/nr-algebraic-projection-tests-v1-20261009.xml
```

新目录仅在 `tmp/nr-shadow-evidence/` 下创建，已存在即拒绝；回放使用另一新目录。
每批上限 180 秒、96 MiB，预留 8 MiB 回执空间；原底线 C>=3 GiB、
E>=4 GiB+32 MiB 保持不变。临时文件也放 E 盘，无安装、清理或 native 重建。
运行前后核验完整父源码、输入及产物指纹。异常保留部分状态、失败原因和
已写产物清单；不自动重试失败科学实验，不回改父级失败结论。

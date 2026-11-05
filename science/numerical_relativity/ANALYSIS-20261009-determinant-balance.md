# det(h) 的演化平衡：事后机制线索，不改变验收门槛

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: post-hoc source derivation and synthetic algebraic controls
- Origin Date: 2026-10-09
- Verification Status: INSTANTANEOUS ALGEBRA TESTED; TRAJECTORY ATTRIBUTION NOT YET VERIFIED
- Version Label: nr-determinant-balance-analysis-v1

## 为什么检查这个问题

旧非线性实验的受扰动案例在 T=1/32M 达到约 5.35e-11 的最大阶段
det(h) 偏差，三档时间步结果很接近，已经占原 1e-10 阶段上限的一半以上。
这不能单凭时间步接近就判定“物理稳定”或“数值错误”。在延长窗口之前，
需要知道哪些方程项在驱动偏差。本分析在观察到这些结果之后提出，
不属于当前双诊断实验的预先验收标准，不允许回改任何失败或阈值。

## 当前方程的精确代数关系

当前 [FO-CCZ4 体方程](fo_ccz4_rhs.py) 的 h 演化为：

    hdot_ij = 2 beta^k D_kij
              + h_li B_j^l + h_lj B_i^l - (2/3) h_ij B_k^k
              - 2 alpha (a_ij - h_ij tr_h(a)/3)
              - tau_inverse (det(h)-1) h_ij.

令 ell=log(det(h))。由 Jacobi 恒等式 ell_dot=tr(h^-1 hdot)，
shift-gradient 的三项相消，a 的无迹组合也相消，得到：

    ell_dot = 2 beta^k h^ij D_kij - 3 tau_inverse (det(h)-1).

这里的 D 是独立演化的辅助场，不是自动用 h 的导数替换的数值。
本项目的特征 SAT 不修改 canonical 槽位 0..10，因此 h 的这一瞬时关系
也不因该 SAT 直接增加边界项。此结论不等于 SAT 对后续辅助场没有影响。

若用相同的离散一阶算子 d_k 定义：

    C_Dkij = D_kij - (d_k h_ij)/2
    delta_k = h^ij d_k h_ij - d_k log(det(h)),

则可以进一步逐项写成：

    ell_dot = beta^k d_k ell
              + 2 beta^k h^ij C_Dkij
              + beta^k delta_k
              - 3 tau_inverse (det(h)-1).

delta 是离散链式法则缺陷，不能假定为零。这个分解同时保留输运、
约化约束驱动、离散链式法则缺陷和现有阻尼。没有代数投影、截断、
重构 D 或调整 tau。即使初始 det(h)=1，非零 beta 和不一致的 D
仍可以在这一方程中产生非零 ell_dot。

## 已完成的有限验证

[新增测试](test_fo_ccz4_determinant_balance.py) 使用 9³ 体算子和构造的
非对角正定度规，组合有／无 shift、有／无辅助 D，以及有／无行列式偏离，
共 8 个案例。a 和 B 均非零，以显式检查其收缩项相消。

度规由固定下三角矩阵构造，lapse=.8、chi=.6；有偏离的控制并不满足
本次演化阶段的 1e-10 限值，所以它只用于体方程代数测试，**没有进行
特征边界构造或时间演化，也不是可接纳的演化案例**。

直接收缩实际体方程输出，要求与上面的 forcing+damping 在 2e-14
绝对误差内一致，并检查输入字节未改变。8 项全部通过，5.06 秒。
报告：[代数测试 XML](../../tmp/nr-det-balance-tests-v1-20261009.xml)。

这证明当前实现中的瞬时收缩关系被这些控制覆盖；它没有重建实际
实验轨迹的误差预算，也没有证明 5.35e-11 全部由某一项造成。
更不能据此把达到阶段上限后的中止当成“可忽略”。

## 下一阶段的依赖顺序

1. 当前双诊断实验完成并通过独立端点审计后，冻结一个新的平衡分解协议：
   对保留的每个接受状态分别计算上述四项和直接 RHS 收缩，检查恒等式、
   区域分布与输入不变性。独立重算采用明确的算子和源码身份。
2. 区分瞬时恒等式与时间积分误差。若仅使用接受状态做时间求积，必须
   记录求积阶和残差，不能假称重建了未保存的中间 RK 场；必要时在新实验
   中保存选定 RK 场。不可把端点梯形积分误差当成物理约束增长。
3. 在不放宽原限制的前提下，单独预注册更长窗口。若触发 det(h) 上限，
   如实保留失败，先判断是约束驱动、边界返回还是积分／离散误差。
   任何改变方程、阻尼、初值扰动或边界的修正，都必须成为新方法分支，
   重新验证空间／时间收敛与基准，不能原地修改已冻结的实验。

这些步骤完成前，不把短窗口或上述 8 项测试升级为黑洞、CPBC、AMR、
波形、GPU 或 live 的验证。美术、legacy EIH 和 native 回滚版本不变。

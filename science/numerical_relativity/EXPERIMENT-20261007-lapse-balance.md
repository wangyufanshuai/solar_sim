# 非线性lapse约束平衡：瞬时原生/Python RHS审计 v1

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: derive, preregister and inspect instantaneous RHS
- Origin Date: 2026-10-07
- Verification Status: PREDECLARED; execution pending
- Version Label: lapse_balance_v1

## 为什么不是直接放大扰动或降低旧门槛

上轮62例实验已完整执行，但8个无迹组因响应低于固定1e-12下限而无法判阶。
该收据 `55ed425f...` 永久保持总门禁false。本批不重新演化这62例，不提高
幅度以追求旧门禁通过，也不把旧误差比重新标为“可靠二阶”。

需要先核查理论对象：无迹控制在满足相关辅助约束的连续极限中，本来可能
保持零lapse约化响应。要求每一个零响应对照出现可测的非零二阶余项，可能
把离散缺陷的大小错误地当成模型正确性的必要条件。下面的推导是条件关系，
不是全部约束传播的证明；其离散版本必须与两种后端的实际RHS核对。

## 连续条件关系与完整半离散恒等式

采用当前内核的s=c=1、advective 1+log、常数K0、tau_inverse=0。
用h代表共形度规，a代表共形曲率，A为lapse梯度辅助量，B/D为shift/metric
梯度辅助量。这里a、A是不同对象。令：

`C_i=A_i-d_i ln(alpha)`，`T=h^{mn}a_mn`（几何迹，不是坐标迹），
`C_Bi^l=B_i^l-d_i beta^l`，`C_Diab=D_iab-(1/2)d_i h_ab`。

离散乘积缺陷 `L_i(u,v)=d_i(uv)-(d_i u)v-u(d_i v)`；逆矩阵链式缺陷
`I_i^{mn}=d_i(h^{mn})+h^{ma}h^{nb}d_i(h_ab)`。

从原文已核查的式12b/12j和本地未改动RHS，逐项重排得：

```
C_i,t = beta^l(d_l A_i-d_i A_l)                  [curl_transport]
      + C_Bi^l A_l                             [shift_reduction]
      - sum_l L_i(beta^l,A_l)                   [shift_product_defect]
      - 2 d_i T                                [geometric_trace_source]
      + 2 I_i^{mn} a_mn                        [inverse_chain_defect]
      + 2 sum_mn L_i(h^{mn},a_mn)               [trace_product_defect]
      + 4 C_Diab a^{ab}                        [metric_reduction]
```

这里七项全部保留。不能在中心差分上擅自套用连续乘积/逆矩阵链式法则。
实际左边直接取内核 `RHS(A_i)-d_i RHS(ln alpha)`，不是从右边反造。

同时核查tau=0时的瞬时几何迹平衡：

```
T_t = h^{-1}:RHS(a) - (h^{-1} a h^{-1}):RHS(h)
    = beta^k [h^{mn} d_k a_mn - 2 D_k^{mn} a_mn]
      + alpha*(K-2Theta-2T/3)*T.
```

在连续极限且C_B=C_D=0、curl(A)=0时，第一式化为`C_t=-2 partial_i T`；
第二式为齐次迹传播 `T_t=beta.grad(T)+alpha*(K-2Theta-2T/3)*T`。
因此在这些条件持续成立时，T=0、C=0是零响应解；没有“必须出现非零二阶项”
的理论要求。这个条件推论**没有证明**C_B/C_D/curl约束在完整系统中持续为零，
也没有证明有限差分与RK演化恰好保留它们。

来源：[FO-CCZ4作者原文](https://arxiv.org/html/1707.09910v3)，沿用上轮已读取的
式12，而七项离散缺陷分解属于本仓库的代数推导，不能冒充原论文的验证结果。

## 冻结矩阵与门槛

1. 原62例的全部310个留存checkpoint。仅只读计算瞬时RHS，不增加时间步。
   每个输入核对外部SHA、原profile、FD2/4、完整58槽。
2. 16个新平直初值：FD2/4 × 三轴/斜向 × 纯迹/无迹，N8、epsilon=1e-3。
   沿用原匹配Frobenius初值并明确放大500倍；**不进行时间演化**。
   这是较大初值的瞬时零响应/迹源检查，不是旧幅度实验重跑。
3. 4个独立全槽非线性输入：FD2/4 × PCG64种子20261007/20261008；N8。
   每槽加.01乘以4个基波的随机振幅/相位组合除以4；所有槽独立，度规/alpha
   仍需通过checkpoint正定检查，不裁剪。用于确保七项都被实际激发。
4. 所有330例原生/Python全58个RHS槽max abs差≤2e-12；两边各自的C/T
   平衡式绝对误差分别≤2e-12。不能以两个后端互相一致替代恒等式检查。
5. 新16例中8个无迹初值，实际C_t和T_t峰值分别≤1e-12；只要求零响应上界，
   不要求出现非零余项。4个全槽非线性输入的每一项峰值都须>1e-10，避免
   只验证平直退化情况。它们另各比较1/4线程全部RHS输出字节，必须相同。
6. 6个负例：输出已存在、解析checkpoint、截断输入、未知选项、重复选项、
   不允许的线程数。退出2、无新输出，原有文件不变。

瞬时检查器编译时直接包含冻结的0.3.2完整源文件，仅重命名原main；调用
原`read_checkpoint`和`fo_rhs`，绝不调用advance、重构或投影。它不是现有
CLI新增功能。输出使用独立`NRFORHS1`格式，明确是58槽导数，不能拿来恢复
状态。stdout声明test_only、evolution_steps=0和实际OpenMP团队人数。

总342条runner命令：2构建、330四线程检查、4串行复算、6预期拒绝。
Python RHS在runner内逐例计算，另记跨后端误差；并非342次新的时间演化。

## 可重复性、边界和停止

输出新目录：`C:/Users/86137/NRShadowEvidence/nr-k3-lapse-balance-v1-20261007`。
原154源码、1438产物、0.3.2二进制及旧不确定收据先绑定；6份新增源码/测试
形成160份执行前冻结快照。原求解器源码、二进制、旧协议和收据不修改。
VS2022/C++17/OpenMP，原生Windows，不安装工具、不改变PATH。

总30分钟，每个原生命令180秒；逐输入前后检查总预算；输出192MiB并预留
8MiB，C≥4GiB、E≥1GiB。首个身份/计算/门禁/资源异常保留失败并停止，不调参
或自动重试。所有产物只新增，禁止覆盖。输入大小和正定域严格检查。

通过只证明列出的**瞬时**半离散平衡、跨后端和重放，不能将旧v1改成通过。
没有新的时间演化，full constraint propagation、physical、strong hyperbolicity、
黑洞、CPBC、AMR、CUDA、long-time、live和scientificPayloadWriteback保持false。

如果本次确认条件零响应与完整离散缺陷关系，后续协议应使用零响应误差上界、
被激发项的独立验证和约束传播收敛作为判据，再比较显式投影与有限tau；不再
把“必须产生可测非零噪声”作为零响应控制的普适要求。后续仍需新的演化验收。

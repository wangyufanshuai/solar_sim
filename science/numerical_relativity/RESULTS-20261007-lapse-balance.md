# 非线性lapse/迹约束平衡审计：证据链通过，物理晋级仍未获准

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: derive, inspect native/Python RHS, retain failure, complete remaining controls
- Origin Date: 2026-10-07
- Verification Status: VERIFIED for listed instantaneous identities and probe controls only
- Version Label: lapse_balance_results_v1

## 这次改变了什么判断

无迹初值应被视为**条件零响应对照**，不能普遍要求它必须产生一个可测量的
非零二阶余项。新增诊断与330个实际状态的RHS检查，支持了这一点。
因此后续实验应区分“零响应误差上界”和“非零误差的收敛阶”，而不是放大
无迹组噪声来争取通过旧门槛。

上轮62例演化实验的总门禁仍false，本次没有重判它、没有降低1e-12下限、
没有新的时间演化。新的通过只属于本次瞬时平衡/跨后端/检查器合同审计。
所有物理有效性和live晋级标记保持false。

## 方程与验证范围

[冻结推导和首轮协议](EXPERIMENT-20261007-lapse-balance.md)给出：

`C_i=A_i-d_i ln(alpha)`，`T=h^{mn}a_mn`，并将`C_i,t`分为七项：
curl输运、shift约化误差、shift乘积缺陷、几何迹源、逆矩阵链式缺陷、迹乘积
缺陷、metric约化误差。离散乘积/链式缺陷全部保留，不能在有限差分中删除。

还验证了当前tau逆为0时：

```
T_t = beta^k [h^{mn} d_k a_mn - 2 D_k^{mn} a_mn]
      + alpha*(K-2Theta-2T/3)*T.
```

在连续极限且相关辅助约束为零时，它化为齐次迹传播，而`C_t=-2 grad(T)`。
所以在这些条件持续成立时，T=0、C=0构成零响应解。**这里没有证明**所有
其他约束在完整离散演化、边界或强场中持续为零。H/M可以仍不满足，不能把
lapse零响应当成Einstein约束满足。

公式基础沿用已核查的[FO-CCZ4原文式12b/12j](https://arxiv.org/html/1707.09910v3)；
七项离散分解是本仓库的代数推导，下面的数值证据来自本地实际RHS，并非借用
论文强双曲性或黑洞结果。本轮没有新增外部数据上传或上游代码复制。

## 数值结果

原生检查器包含冻结的完整0.3.2 C++源文件，直接调用`read_checkpoint`和
`fo_rhs`，从未调用advance。输出`NRFORHS1`明确是导数，不能作为状态恢复。
全部330个输入包括310个旧演化状态和20个新构造状态；后者不进行积分。

| 项目 | 实际结果 | 范围 |
|---|---|---|
| Python/C++全58槽RHS | 最大差1.38778e-16 | 330状态，原门槛2e-12 |
| C平衡：原生 / Python | 最大误差5.55112e-17 / 4.16334e-17 | 七项完整离散恒等式 |
| T平衡：原生 / Python | 最大误差6.29447e-17 / 5.89128e-17 | 几何迹，不是坐标迹 |
| 新无迹初值 | 8/8的C_t、T_t峰值均为0 | FD2/4 × 三轴/斜向，epsilon1e-3 |
| 非线性全槽输入 | 每例七项都被激发 | 各项峰值的最小值3.17169e-7，要求>1e-10 |
| 全RHS 1/4线程重放 | 4/4逐字节相同 | FD2/4 × 两种独立种子 |
| 补验新正例 | 2/2逐字节复现原RHS | FD2/4各一个 |
| 补验负例 | 6/6精确预期拒绝 | 退出2，无新RHS输出、已有输出不变 |

单独只读进程对全部330状态使用独立FFT离散频率符号（Nyquist显式设零），
以另一种紧凑表达式验证：C平衡误差最大6.93889e-17，T平衡误差最大
6.29515e-17。它不复用七项拆分的差分实现，但仍使用相同输入和同一物理
公式；不是独立完整Einstein求解器。

## 失败不能被成功补验抹去

首轮完成336条命令（全部退出0）、330个数值行及4个串行复算后，在构造
解析负例时触发Python错误：`checkpoint profile requires dynamic solver`。
原因是测试fixture错误地保留了仅供动态模式使用的profile。6个原生负例当时
尚未执行。这不是实际RHS误差、时间演化不稳定或工具链故障。

首轮运行62.593419s，completed=false、audit_passed=false，原0字节
negative-analytic.bin、全部日志和源码快照均保留。没有修改这160份源码。

[单独补验协议](EXPERIMENT-20261007-lapse-balance-completion.md)新增两个文件：
解析fixture明确无profile，FD2/v1和FD4/v3分别合法；先编码、校验再落盘。
全部330行Python RHS和平衡重新计算并精确匹配；仅追加2个原生正例和6个
原先未执行的负例，没有重编译或重算330个原生RHS。

补验耗时21.961407s，8条命令：2条退出0、6条预期退出2，完成且通过。
完整链为**原336条+补验8条**，不是一次连续342条执行，也不是两个完整实验。

## 身份、测试与可复算性

首轮目录：
`C:/Users/86137/NRShadowEvidence/nr-k3-lapse-balance-v1-20261007`

- 失败收据SHA：`68884a3e941f6acd37167af6669e30357d59b93a6c5397e5c91c022a03db18a1`
- 协议SHA：`25dc9a684082c4f85128f3634fd98eedc6681fc741dc1388d64828be7d7a4f3e`
- 检查器SHA：`0166937949dcda2b583a4201dbbc77eabcdef6818271a11736baec2b3ab5fe3d`
- 160源码、1247产物哈希；总1248文件、133,604,579 bytes。

补验目录：
`C:/Users/86137/NRShadowEvidence/nr-k3-lapse-balance-completion-v1-20261007`

- 成功收据SHA：`95447ede8a9b9ed52e285506f1bd3005febe824bc5babe227404d6e3e8d7252b`
- 协议SHA：`ca7d77faefe39e3220a9ccbdb158791ba79fcc619816ad7dcad71f1aeccd3a7d`
- 162源码、176产物哈希；总177文件、2,600,534 bytes。

两套源码当前/快照/执行前后哈希、全部产物哈希、二进制及协议已由另一个
只读进程核验。旧62例收据也保持原SHA及总门禁false。

定向回归 **490 passed in 20.96s**，不是全项目测试；包括此前29项与5项新
测试，不能重复累计。Ruff通过；初次3个代码风格/未用导入问题在冻结前修复。
已有pytest_asyncio配置弃用警告保留，未改无关配置。

## 下一步：真正的约束控制实现

本结果消除了“零响应对照必须产生非零余项”的不适用前置要求，但没有关闭
完整动力学的物理门禁。下一批应新增明确绑定的shadow约束控制合同和实验：

1. 将有限tau松弛与显式代数投影视为不同算法，明确它们的阶段、状态改变及
   对A/B/D/P辅助约束的影响，不静默插入既有演化步骤。
2. Python/C++配置、checkpoint/restart和manifest必须绑定同一策略；默认
   tau逆为0、不投影的旧路径须保持可回滚及数值等价。
3. 有限松弛的平直线性参考预测应包含 `T_t=-3 lambda T`，lambda=tau逆；
   当初始C为0时，`C_i(t)=-2 d_i T0*(1-exp(-3lambda t))/(3lambda)`。
   这是下一实验的理论预测，尚未运行；它预言有限累计响应，**不是所有约束
   都自动衰减到零**。还必须单独检查D等辅助约束、H/M、时间/空间收敛。
4. 之后再进入单黑洞动态、物理边界与更长窗口；不能用当前瞬时恒等式跳过。

未修改美术、live EIH、既有求解器数值方程或科学payload。physical、完整
constraint propagation、strong hyperbolicity、CPBC、黑洞、AMR、CUDA、长期
稳定性、runtime与scientificPayloadWriteback保持false。完整NR goal仍active。

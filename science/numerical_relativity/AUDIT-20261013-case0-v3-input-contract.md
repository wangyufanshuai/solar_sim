## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; Exa Search
- Origin Mode: validate; read-only source and receipt audit, no numerical rerun
- Origin Date: 2026-10-13 (Asia/Shanghai)
- Verification Status: ANALYZED; v3 NOT IMPLEMENTED / NOT EXECUTED
- Version Label: case0-v3-input-contract-audit-v1

## 本轮结论与边界

v2 的失败结论不变。本轮只读核对源码、已保存结果和理论来源，并新增
本说明；没有执行 Python 科学代码、重算矩阵、提高预算、修改冻结源码
或回写旧证据。没有创建 v3 批次，也没有取得新批次的人工确认。

上一轮取得了实质诊断进展；本轮新增的是对下一步输入与验收设计的
两项约束，不是新增科学通过证据。总 NR 目标仍未完成，仍为 shadow-only。

## 发现一：构造输入的精度问题有两部分

[v2 第54–55行](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/constraint_projector_energy_v2.py:54)
将矩阵、PDE 补空间和节点都从 binary64 精确转换到 Decimal。
`Decimal.from_float` 保留的是已经舍入的值，不会恢复方程原始系数。
[节点生成第21–25行](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/constraint_projector_energy.py:21)
在进入 Decimal 之前就使用 binary64 和 `math.sqrt`。

已保存的旧诊断将这两种节点表示分开测量；本轮没有重新计算：

- 来源目录：`tmp/nr-shadow-evidence/nr-k3-case0-energy-diagnostic-v1-20261013`。
- `node-input-comparison.json` 同时保存原 binary64 节点和由精确平方值
  `1/20, 1/10, 1, 2, 3, 4` 在 Decimal70 中开方的节点。
- `arithmetic-comparison.json` 的
  `saved_to_analytic_nodes_decimal_relative` 约为 `9.93865e-13`。
- 这个数比较的是同一个保存矩阵上的两组旧式 factored 投影；
  **不是 v2 的残差，不是 v3 的结果，也不能直接当作门槛的误差预算相加。**
- 对应的消去多项式矩阵差的无穷范数约为 `2.43136e-14`。

因此，下一步不能只把原 float 转成更多位 Decimal 后称为“恢复精确系数”。
若选择方程驱动的 v3，构造阶段应从原方程独立生成系数和解析特征速度，
验收阶段则仍使用冻结的原保存矩阵、原 binary64 节点和原阈值。
这一区分必须公开记录，不能隐式替换验收对象。

## 发现二：固定投影验收不等于原端到端扰动测试

[v2 运行器第452–461行](E:/86137/myai/solar_sim/next-web/scripts/run-nr-k3-case0-exact-v2.py:452)
对保存的47维矩阵作预登记扰动后，会重新调用候选：

`changed matrix -> rebuild candidate projectors -> original residual/rank checks`。

如果 v3 先从精确方程生成固定投影 E，再仅把验收矩阵换成 A+delta，
幂等性 `E^2-E` 和交叉乘积 `E_i E_j` 并没有随输入重新计算。
这种检查仍有价值，但它测的是**固定投影与邻近矩阵的相容性**，
不是原来“矩阵输入改变后整个构造算法”的稳健性。

后续必须明确区分：

| 检查 | 能支持什么 | 不能替代什么 |
| --- | --- | --- |
| 方程精确系数与解析节点的构造检查 | 固定背景的代数一致性 | 原保存矩阵验收 |
| 固定候选对原矩阵及其扰动验收 | 邻近输入下的作用/重构相容性 | 端到端构造稳健性 |
| 相同扰动进入候选后重新构造并验收 | 对已登记输入误差模式的构造稳健性 | 其它背景、约束收敛、时间演化 |

如候选接口改为只接收方程参数而不接收矩阵，旧矩阵扰动的含义就必须
重新说明；不能把“无法接收该输入”或“复用了固定投影”记成原测试通过。
v2 的两项原扰动失败必须保留。不能新增一个更容易的检查覆盖原失败，
也不能仅靠本表重新命名标志来获得科研准入。

## 理论解释：精确算术不自动消除输入的代数不匹配

只对47维、P=I 的直接 Lagrange 构造，令互异固定节点为 a_i，

`m(z) = product_j(z-a_j)`，

`L_i(z) = product_{j != i}(z-a_j) / product_{j != i}(a_i-a_j)`。

直接相乘得到精确恒等式：

`(A-a_i I) L_i(A) = m(A) / m'(a_i)`。

这不要求 A 已经可对角化。它说明：即使多项式求值算术是精确的，
只要保存矩阵不满足固定节点对应的 `m(A)=0`，作用残差通常仍非零。
非零残差是否超过 `2e-12` 还取决于数值大小与原检查的归一化方式；
不能仅凭此恒等式宣称必然超限或预言 v3 通过。

这是对现有直接构造的代数解释，旧
[残差恒等式检查](E:/86137/myai/solar_sim/next-web/scripts/nr_case0_energy_diagnostic.py:178)
已有对应逻辑；本轮不把它虚称为新执行的数值证明。
43维补空间另有 P 的相容性条件，本段没有替代该系统的完整验证。

通过 Exa 搜索返回5项结果，选择作者在大学仓库存放的
[Higham 与 Lin，Matrix Functions: A Short Course](https://eprints.maths.manchester.ac.uk/2067/1/paper.pdf)
阅读相关部分。第3.1.2节解释矩阵函数的插值与最小多项式联系，
第3.3节区分输入敏感性和计算问题；上面的专用恒等式由本项目多项式
定义直接推出，不声称文献验证了本项目实现或任何 NR 科学门槛。

## 对下一批的修正建议：尚待确认

建议仍只申请64 MiB / 600秒、仅case 0，不运行完整矩阵。

1. 先把 v3 的构造输入、验收输入和扰动重新构造路径写清楚。
   精确系数与解析速度必须来自方程，不读旧矩阵后拟合或猜分数。
2. 验收保留原矩阵、节点、状态映射、ODE/shift 分解，以及全43/58系统
   的投影、秩、能量、正定性和对称化检查；不只验47维的三个残差。
3. 保留原正负 spacing 扰动和原门槛；若不能提供同口径的端到端
   构造检查，不授予原 `case0_rounding_robustness` 资格。
4. 所有旧失败保留；高精度构造或固定投影相容性即使通过，也不能
   自动关闭原失败、进入完整矩阵、时间演化或 live。
5. 本轮没有实现上述候选，没有新数值结果，也不保证它能通过。

C>=3 GiB、E>=4 GiB+32 MiB、原收尾余量与8 MiB源码快照上限不变。
实际新批次仍须人工确认和再次磁盘准入检查，不能复用本轮时点读数。

## 本轮只读证据核对

以下6项当前源码与 v2 `worker-result.json` 中的冻结哈希一致：

- `constraint_projector_energy_v2.py`
- `constraint_projector_energy.py`
- `constraint_energy_controls.py`
- `run-nr-k3-case0-exact-v2.py`
- `run-nr-k3-case0-energy-diagnostic.py`
- `nr_case0_energy_diagnostic.py`

旧诊断的3项引用文件与 v2 保存的 ancestry 哈希一致：

| 文件 | SHA-256 |
| --- | --- |
| `worker-result.json` | `8cad3208cf07ae1f8d73323fcde76d2fa6fad9ba58c70fcab51a8541b4e64369` |
| `node-input-comparison.json` | `f9af0df0ca6aaf90e80e1e7fb9b667757d9325ab2137bfeb064b4a3168df74fb` |
| `arithmetic-comparison.json` | `4990a247429985d8bab0655bd9253a7b933c9971c2af29ee658573d3a4f9e75f` |

v2 失败终态文件的当前 SHA-256 为
`9c54c0b6bbdcc2674209f95ec64726f66ba9d219f536cfd90572608caad37772`，
与上一轮报告一致。本轮没有再次执行全515源码/1099旧文件核验，
也不把这些选择性核对写成全量重新验收。

只读进程查询未发现匹配本批运行器或 `nr_owned` 的 Python 进程。
本轮没有启动新进程作科学运算；磁盘时点C为15,908,851,712字节、
E为19,505,160,192字节，均高于原底线，不代表后续批次已被授权。

## 方法学检查

科研技能用于限制外推、区分已保存结果与新实验，并阻止把改变的测试
口径称为原稳健性通过。11/11类型作了适用性检查：

- Simpson、ecological、Berkson、collider、base-rate、regression-to-mean、
  reverse-causality：本案无统计抽样/群体推断，均不适用。
- Survivorship：保留原输入通过和两项扰动失败，不只报告通过项。
- Look-elsewhere：没有追加数值搜索或选择性报告新尝试。
- Forking-paths：v3 为探索建议，尚未执行；改变构造输入必须披露。
- Correlation/causation：代数恒等式和静态源码分析不被外推为非线性
  时空稳定性、一般背景正确性或全内核的因果验证。

本轮复现状态：未重跑；只读证据复核。v2 验收、物理准入、live 和
`scientificPayloadWriteback` 仍为 false。

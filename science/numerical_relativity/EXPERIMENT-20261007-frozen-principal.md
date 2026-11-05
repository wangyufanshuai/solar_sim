# 冻结背景主部修正与局部特征空间退化实验

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: validate
- Origin Date: 2026-10-07
- Verification Status: ANALYZED — local code and algebra evidence only
- Version Label: frozen_principal_v1
- Scope: Python FO-CCZ4 shadow; no art, EIH/live, C++/CUDA or payload changes

## 结论与科研边界

已实现保留共形变量分解的 58 槽主部矩阵，且与实际演化右端项逐列对照。
这修复了主部审计中的错误近似，并不等于修复了整个 Einstein 求解器。
新的特征空间检验反而明确暴露了三组局部退化点，因此当前实现仍是
可审计的数值相对论科研原型，不能声称强双曲性、物理边界或生产级黑洞演化已验证。

研究流程采用先声明阈值、保留失败对照、固定源码摘要和重放的方式。
不再以同一相似变换两侧相等作为正确实现物理主部的证据。

## 方程约定与独立对照

`gamma_ij = h_ij / chi`，`phi = sqrt(chi)`；矩阵约定为
`q_t = sum_i A^i partial_i(q) + S`，`A(n) = sum_i n_i A^i`。
法向是坐标协向量，不隐式归一化。11 个度规/规范主变量按纯 ODE 演化，
其主部行列为零；不能把 `beta.n * I` 加到整个 58 槽矩阵上。

对照途径：

1. 按方程的张量缩并直接组装主部，保持每个 lapse、chi、shift、ordering 因子。
2. 在 5³ 网格中心对独立槽施加正负扰动；中心函数值为零，中心差分梯度等于指定法向，
   因而低阶源项相消。辅助变量不重新从主变量构造，以免消掉独立的一阶槽。
3. 使用仿射与正弦两种剖面、半幅扰动和确定性重放，并与旧平直解析组装交叉比较。

这几条路径检验实现一致性，但共享该项目的方程约定；它们不能替代外部物理基准。

## 主资料与波速

原始依据为 [FO-CCZ4 论文，附录 A.2，式 64–68](https://arxiv.org/html/1707.09910v3#A2)。
当前局部特征检验限制于 `det(h)=1`、advective 1+log、`e=c=s=1`；
其他规范参数直接拒绝，不外推此合同。论文用左端主部，我们用右端主部，符号相反。

令 `Hn = h^ij n_i n_j`，六组内禀速度及单个符号的重数为：

| 分支 | 内禀速度 | 每个正/负号的重数 |
|---|---|---:|
| 光/清理 | `alpha sqrt(chi Hn)` | 6 |
| 1+log | `sqrt(2 alpha chi Hn)` | 1 |
| Gamma-driver 纵向 | `sqrt(4 f Hn / 3)` | 1 |
| ordering 纵向 | `alpha sqrt(mu Hn / 2)` | 2 |
| Gamma-driver 横向 | `sqrt(f Hn)` | 2 |
| ordering 横向 | `alpha sqrt(mu Hn) / 2` | 4 |

另有 15 个 `beta.n` 的 PDE 模态与 11 个零速度 ODE 模态。
该分支结构说明统一乘 `alpha sqrt(gamma^nn)` 不适用于 Gamma-driver。
[GRChombo 的 MovingPunctureGauge 实现](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/CCZ4/MovingPunctureGauge.hpp)
也用于核对 shift 演化中 `F * B` 的规范约定；这是参考，不是跨后端验证。

## 本次测量

- 主部对照：8/8 个预声明场景通过；最大绝对系数误差 `8.881784197001252e-16`。
- 特征空间：7 个普通样本点完整，3 个退化对照被拒绝；10/10 个预声明预期结果复现。
- 所有主部/特征实验均记录源码摘要，运行期间源码未漂移。
- 每组重复特征值先合并重数，再在相对阈值 `1e-9, 1e-10, 1e-11` 下检查零空间维数；
  完整性、残差与规范槽缩放下的条件数分别设门禁。局部条件数上限预设 `1e6`。

以下反例均取 `h=I, alpha=1, beta=0, n=(1,0,0), mu=e=c=s=1`：

| 共形因子/shift 参数 | 碰撞分支 | 合并特征空间总秩 | 决策 |
|---|---|---:|---|
| `chi=1, f=3/4` | 光/纵向 shift | 56/58 | 拒绝 |
| `chi=2/3, f=1` | lapse/纵向 shift | 56/58 | 拒绝 |
| `chi=1/2, f=1` | 光/纵向 ordering | 54/58 | 拒绝 |

局部普通点的通过不能消除这些反例。尤其 `f=1` 只绕开平直背景的一个碰撞，
不是整个动态系数域的强双曲性修复。在 `chi=2/3 ± 1e-6` 附近，虽然数值秩仍为 58，
基的条件数已约为 `8.92e6`，同样不能通过预声明条件数门禁。
重复特征值本身不是错误：平直 `f=1` 的光/横向 shift 相遇仍有完整数值基。

### 有理重建的精确秩证据

在三组有理参数点，将浮点主部重建成分母不超过 144 的有理矩阵。
最大重建差约 `1.11e-16`，小于预声明 `2e-14`；不满足阈值就拒绝重建。
用 SymPy 精确计算 `p(A)` 与 `p(A)^2` 的核维数：

| 反例 | `p(x)` | `dim ker p(A)` | `dim ker p(A)^2` |
|---|---|---:|---:|
| 光/shift | `x²−1` | 12 | 14 |
| lapse/shift | `x²−4/3` | 2 | 4 |
| 光/ordering | `x²−1/2` | 12 | 16 |

这些平方无重根多项式的核维数增长，证明**重建有理矩阵**含非平凡 Jordan 块。
它是独立于浮点 SVD 阈值的代数复核，不是从连续 Einstein 方程独立推导出的全域证明。
在非退化平直 `f=1` 对照中，`p=x²−4/3` 的核维数保持 `2→2`。

### 对首个 Schwarzschild 场景的直接影响

额外只读核查使用本项目时间对称、各向同性 Schwarzschild 初始切片：
`u=M/(2r)`、`h=I`、`chi=(1+u)^-4`、`alpha=(1-u)/(1+u)`、`beta=0`。
在本次审计采用的 `f=mu=e=c=s=1` 参数下，外部区域会遇到
（这不表示已将演化默认参数改成该组合）：

| 条件 | 各向同性坐标 `r/M` | lapse | chi | 局部基秩 |
|---|---:|---:|---:|---:|
| `chi=mu/2`，光/ordering 相遇 | 2.64260675394 | 0.681792830507 | 0.5 | 54/58 |
| `2 alpha chi=4f/3`，lapse/shift 相遇 | 7.23997410449 | 0.870800601333 | 0.765579015042 | 56/58 |

第一处用 `u=2^(1/4)-1` 得到；第二处对 `(1-u)/(1+u)^5=2/3` 在 `(0,1)`
内二分求根。两点的实际 RHS/直接主部差分别约 `1.11e-16`、`4.44e-16`。
这是上述函数的额外只读测量，未计入 10 项固定收据，也不是单黑洞时间演化实验。
它说明这些系数不是仅为测试捏造的不相关值；当前规范下首个物理场景也需要处理。

## 撤回与保留的历史证据

- 旧 local-principal v1 仅证明内部相似恒等式，不能认定实际主部正确。
- v2 RHS 比较把物理 `gamma` 当作共形 `h` 且固定 `chi=1`；
  其约 `0.13555` 误差不是同一背景的可靠比较，已被 v3 取代。
- v3 保留真实 `h/chi` 分解，六个面中心的旧近似误差最大为 `0.735428989131446`；
  `candidate=false`。缺少系数梯度不能解释或修复这些常系数块错误。
- 原 variable-coefficient speed v1 把有限数值误标为已验证特征速度；
  新 v2 保留原值供追溯，但 `local_characteristic_speed_validated=false`。
- 旧文件未删除、未覆盖；非零退出是拒绝旧模型的预期结果。

## 复现与证据

工作目录：`E:\86137\myai\solar_sim\next-web`。每次选择新的输出路径，脚本拒绝覆盖收据。

```powershell
python scripts/run-nr-k3-fo-ccz4-frozen-symbol.py --output E:\CodexData\nr-k3-fo-ccz4-frozen-symbol-v1-final-20261007.json
python scripts/run-nr-k3-fo-ccz4-frozen-eigenspaces.py --output E:\CodexData\nr-k3-fo-ccz4-frozen-eigenspaces-v1-20261007.json
python scripts/run-nr-k3-fo-ccz4-local-principal-proxy.py --output E:\CodexData\nr-k3-fo-ccz4-local-principal-proxy-v3-final-20261007.json
python scripts/run-nr-k3-fo-ccz4-variable-coefficient-boundary-audit.py --output E:\CodexData\nr-k3-fo-ccz4-variable-coefficient-rejected-speed-proxy-v2-20261007.json
python -m pytest science/numerical_relativity -q
```

前两个实验成功退出；后两个保留已拒绝模型并以非零退出。
本次最终完整测试集：**294 passed，669.62 秒，退出码 0**。
新增及相关定向测试：**36 passed，30.27 秒**；定向 Ruff 检查通过。
测试出现已有的 `pytest_asyncio` 默认 fixture loop scope 配置弃用警告，未更改无关设置。
旧的 261 passed 记录不作为本次源码的验证结果。

四份收据均重新核对了当前源码摘要；覆盖同名收据的四项负向检查全部拒绝写入，
检查前后 SHA-256 不变。前两份主要实验收据的文件摘要为：

- 主部系数：`8ab38923fbe8d82189ca8c9b4c25469a83f94b8fe1b5bf3a1d280a877f08a277`
- 特征空间：`41427e772c496c5147f37c95661bf5434deaa6b0f4d024c7e0e34d69d944fa65`

## 下一道门禁

1. 将连续规范/ordering 参数域写成明确合同，推导碰撞点的实际耦合与可对角化条件。
   不通过改变容差、只选成功网格点或排除失败样本来宣称修复。
2. 若引入空间/状态依赖的规范参数，必须重新推导其导数项、主部、源项和约束传播；
   不能只在谱审计中换数，也不能擅自修改现有 live 模式。
3. 在合法参数域内建立方向一致、有界的特征基或能量估计，之后才继续变量系数边界。
4. 独立约束收敛、非线性稳健性、长时间 Schwarzschild、外部代码物理基准、
   checkpoint/restart 与跨后端一致性仍未关闭；C++ 工具链与 CUDA 也未获本次可用性证明。

整体推广策略维持 `strong_hyperbolicity_validated=false`、`cpbc_ready=false`、
`physical_boundary_validated=false`、`runtime_writeback=false` 和
`scientificPayloadWriteback=false`。目标继续有效，尚未完成。

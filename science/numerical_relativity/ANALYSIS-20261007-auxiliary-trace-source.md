# 辅助约束增长的迹约束源：事后机制诊断

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: read-only analysis of retained numerical data
- Origin Date: 2026-10-07
- Verification Status: ANALYZED; independently encoded linear identities checked; prospective causal validation pending
- Version Label: auxiliary_trace_source_posthoc_v1

## 结论边界

T=10原始58槽独立噪声实验中的最大辅助约束增长（最高46.48倍），在7个
非平凡样本组里都由lapse梯度辅助量 `A0/A1/A2` 主导。一个由现有方程直接
导出的**无拟合**平直线性预测，在全部88个留存checkpoint上与相应有符号
残差吻合，最大绝对误差 `6.237128893817164e-16`。

这是在看到原数据后提出的机制诊断，不是预注册的因果验证，不是新T=10模拟，
不是约束衰减、整体长期稳定性或强双曲性的证明。没有更改求解器、参数、初值、
约束投影或旧门槛，也不把旧增长记录改为“约束通过”。

## 局部推导：区分两个不同的A

令 `A_i` 是lapse梯度辅助场，`A_ij` 是共形外曲率的trace-free张量槽。
在Minkowski附近、shift=0、1+log、s=c=1及当前 `tau_inverse=0` 的线性化中，
定义坐标迹 `T=A00+A11+A22` 和约化残差 `C_i=A_i-D_i ln(alpha)`。
这里T只是平直线性化的迹；非线性几何迹应是 `h^{ij} A_ij`，不能混为一谈。

从当前ODE块、辅助PDE和曲率TF项得：

\[
\partial_t\ln\alpha=-2K+4\Theta,\qquad
\partial_t A_i=-2D_iK+4D_i\Theta-2D_iT,\qquad
\partial_t T=0.
\]

因此，在恒定系数、可交换的周期离散导数下，

\[
\partial_t C_i=-2D_iT,\qquad
C_i(t)=C_i(0)-2tD_iT(0).
\]

独立手写的58×58主部/源矩阵在零、三轴及两个斜向波矢上给出同一关系：
`R_i L + 2 i k_i e_T` 最大残差为0；`e_T L` 最大残差为
`3.552713678800501e-15`（浮点消去尺度）。这仍不是全谱本征结构证明。

## 与留存数据的逐场对照

分析器直接读取checkpoint中存储的 `ln_alpha`，独立实现配对FD4差分，计算
三方向有符号残差，而非只比较范数。旧报告用过 `log(exp(ln_alpha))` 的
round-trip路径，因此两个残差范数有约1e-16级差别，均保留，不强制相等。

| 数据组 | N | 主导槽/T=10 | 记录的残差峰值 | 线性预测最大绝对误差 |
|---|---:|---|---:|---:|
| seed20261007 | 8 | A2 | 4.47092951e-8 | 5.578951e-16 |
| seed20261007 | 12 | A2 | 3.50673488e-8 | 2.254111e-16 |
| seed20261007 | 16 | A1 | 2.76094818e-8 | 1.002772e-16 |
| seed20261008 | 8 | A0 | 5.16377198e-8 | 6.237129e-16 |
| seed20261008 | 12 | A2 | 3.32121818e-8 | 2.145170e-16 |
| seed20261008 | 16 | A2 | 2.80199218e-8 | 1.260518e-16 |
| 半时间步/seed20261007 | 12 | A2 | 3.50673487e-8 | 2.254111e-16 |
| 精确Minkowski | 6 | 所有槽恒零 | 0 | 0 |

非零组中预测误差/观测峰值为3.63e-9至1.25e-8（这是比值，不是百分数）。
坐标迹T在整个窗口内漂移最多9.144e-18。现有数据很符合上述线性驱动机制；
不能据此断言所有其他约束增长、所有频率或强场情况都已经解释。

## Exa与GitHub核查

本轮Exa使用1次定向搜索、5个返回结果，去重为同一篇FO-CCZ4原文，另读取
作者版HTML中的式12b/12e/12j、松弛参数说明和数值实验设置：
[Dumbser等：FO-CCZ4](https://arxiv.org/html/1707.09910v3)。
其中lapse辅助方程包含迹约束梯度项；tau用于代数约束松弛。原文实验设
tau逆为0时，会在每个时间步开始对离散解强制代数约束，时空预测器中不做。
这与本项目“全部58槽独立噪声、无投影且tau逆为0”的测试流程不同。
原文的长时基准和双曲性结论不能直接移植为本项目的验收结论。

GitHub读取了[GRChombo的CCZ4 RHS](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/CCZ4/CCZ4RHS.impl.hpp)：
它在曲率RHS中构造trace-free项，并使用一、二阶空间导数。这里只作为
“RHS的TF操作”和“状态约束处理”应分清的实现参考，不是同一58变量一阶
离散方案的跨代码验证；没有复制上游代码，也未声称该文件证明了逐步状态投影。

## 可复算性

- 分析器：`scripts/analyze-nr-auxiliary-trace-source.py`，只读输入，输出文件必须新建。
- 原数据收据SHA：`bb4e8efb398c757a56ec1b35f2676d5d41490f6ebf0001fae965bb60e06c4e1b`。
- 当前148源身份来自0.3.2元数据验收收据，另绑定分析器和测试，共150份源码。
- 88个输入checkpoint逐项核验SHA；报告包含每组全部11个时间样本、源身份、
  输入身份及6组线性矩阵检查。所有物理/因果前瞻验证和写回标记保持false。
- 输出：`C:/Users/86137/NRShadowEvidence/nr-k3-auxiliary-manifest-v1-20261007/trace-source-posthoc-v1.json`
- 输出SHA：`835ad088d0d51fd9db48a9261545edefecf1a5e8afa339b2368ce2d3db06f04c`。
- 15项新测试通过（3.08s），覆盖差分频率/常数、预测系数与符号、时间校验和
  独立矩阵关系；Ruff通过。它们不是新增物理基准。

## 下一步：先验证机制，再决定生产约束策略

1. 预先冻结纯迹正弦扰动与trace-free对照，覆盖三轴/斜向、多个幅度与时间步；
   预测符号、线性斜率和非线性余项尺度，保持原无投影噪声数据作对照。
2. 保留跨Python/C++、FD2/4、checkpoint确定性和独立几何约束检查。
3. 若机制得到前瞻验证，再分别设计显式代数投影与有限松弛参数的shadow实验；
   两者不是同一算法，必须各自绑定配置/checkpoint/manifest，并检查约束
   传播与物理解的收敛。不能在原二进制或旧收据里隐式打开其中任何一个。
4. 在约束控制、边界和单黑洞动态门禁关闭前，不提升到AMR/双黑洞/波形的
   科学有效性声明。CPU门禁、物理验证仍是CUDA/live前提。

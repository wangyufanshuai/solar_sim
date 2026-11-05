# 首个边界阶段差异已分解：B源单独不足，K/Theta耦合必须保留

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: frozen retained-trace analysis and separate-process replay
- Origin Date: 2026-10-08
- Verification Status: RESTRICTED SOURCE-CHANNEL PREDICTION PASSED; NO PHYSICAL ADMISSION
- Version Label: nr-boundary-stage-channels-v1

上一目标轮次主要是水平评估，没有新增科学验收。本轮按预先写入的
[实验协议](EXPERIMENT-20261008-boundary-stage-channels.md)实现并执行了源项分解，
完成新的区分性证据；完整数值相对论目标仍active，不能以此替代强场/边界验收。
同时补齐了已经完成的[初始B源审计结果记录](RESULTS-20261008-initial-ordering-source.md)。

## 1. 实际范围与推导

读取九份初态与九份原生RK阶段文件，没有重新演化或编译求解器。对原N17/25/33
的共同节点分别比较upper-original和both-upper，共六对、全部活动节点及58个输出槽。
两组对照分别沿用此前的高侧/低侧释放比较；并未新增一个lower-only轨迹。

在这些案例的s2阶段，局部h=I、beta=b=GammaHat=D=0，alpha/chi/A_k/P_k尚未演化；
两域共同活动点的局部值匹配至声明容差。由
[原始FO-CCZ4论文的方程12](https://ar5iv.labs.arxiv.org/html/1707.09910)
独立约化其空间项，直接四点加权FD4计算`u=dt*(k1_left-k1_right)/2`的导数，
而非调用生产RHS、导数或主符号矩阵。

四类输入为conformal extrinsic curvature a_ij、K、Theta、shift-gradient B_k^i。
它们对GammaHat、b、A_k、D_kij、P_k的响应逐项保留；另28槽的预测为零。
例如lapse辅助场的响应是

`delta k2[A_k] = -2*d_k(u_K - 2*u_Theta + tr(u_a))`。

这里包含常被忽略的trace-ordering项。该约化只适用于相匹配的这一个RK阶段，
不是通用线性化，也不是非线性边界实现。原论文的证明不自动适用于项目自定义规范。

## 2. 全六组真实预测通过，B-only假设均不足

冻结的全活动区最大绝对残差门槛为2e-12，未更改旧收敛门槛。

| 原N | 域间对照 | 原生k2最大差 | 四通道预测最大残差 | B-only判定 |
|---|---|---:|---:|---|
| 17 | upper-original | 1.65732255e-9 | 2.06795153e-24 | 不足 |
| 17 | both-upper | 1.04946830e-7 | 5.29395592e-23 | 不足 |
| 25 | upper-original | 4.45423646e-10 | 3.10192730e-25 | 不足 |
| 25 | both-upper | 4.38327620e-8 | 8.89698844e-16 | 不足 |
| 33 | upper-original | 1.78858648e-10 | 2.58493941e-25 | 不足 |
| 33 | both-upper | 2.20891393e-8 | 1.65436123e-23 | 不足 |

N25的both-upper初态与s2局部值已有4.44089210e-16差异；其活动区k1差
8.89944060e-16。它通过容差，但不是逐位相同的输入/预测。
其余五对的三个匹配检查均严格零。这里的极小预测误差是离散实现一致性，
不是对真实时空达到1e-23精度的声明。

在所有六对中，B-only残差的最大值与原生差异最大值相同，且远超2e-12。
因此可以排除“只用初始B源就能解释全部首个k2差异”这个限定假设。
不能由此推断B在后续非线性演化中无关或应该删除。

## 3. 通道量级与抵消

低侧比较（both-upper）在整个原活动区、58个坐标槽上的RMS如下。
这是诊断范数，不是协变能量，也不是各通道的贡献百分比。

| 原N | 原生合计 | a通道 | K通道 | Theta通道 | B通道 |
|---|---:|---:|---:|---:|---:|
| 17 | 1.28695690e-9 | 1.56590086e-10 | 3.14923987e-9 | 4.29640189e-9 | 4.35470881e-11 |
| 25 | 3.55914505e-10 | 4.55047706e-11 | 8.56685798e-10 | 1.17580682e-9 | 1.12942468e-11 |
| 33 | 1.40065315e-10 | 1.83297448e-11 | 3.34026362e-10 | 4.59998824e-10 | 4.28879388e-12 |

K和Theta单独响应的范数均明显大于合计响应，其他两通道较小，必须保留带符号场的
抵消。不能把这些范数相加成误差预算，或把B范数/总范数写成物理贡献率。
收据保存所有六对的全部通道、输出族、58槽范数及125个共同核心节点的带符号值。
没有针对本次结果新增空间阶门槛，也没有将不同网格上的不同活动区范数当作共同
测区的收敛证明。

## 4. 独立重放、测试及身份

- 首次分析退出0，completed=true、prediction_passed=true、errors=[]，9.1083092s。
- 独立Python进程重复分析退出0，9.3374856s。两份解析收据仅seconds不同，其余
  所有字段完全一致；它不是第三方物理求解器交叉验证。
- 新测试115 passed，包含三方向多项式导数、K/Theta分离、trace-ordering项、
  B张量方向、四通道线性叠加、58槽逐项错误、非法输入/不完整覆盖及输出碰撞拒绝。
- 一项独立控制在曲率背景的合成壳层扰动上调用实际Python RHS；其结果与推导匹配。
  该合成扰动用于算子验证，不能冒充真实黑洞演化。
- 最终合并回归785 passed in28.55s，含之前670项及这115项，不能重复累加。
  范围为Schwarzschild脚本测试、FO/checkpoint/manifest与此前局部性/干预/源项测试。
  不是全仓库测试、浏览器E2E或Next构建。
- 四个新Python文件Ruff通过；首次发现的lambda样式问题已在真实数据执行前修正。
  既有pytest-asyncio loop-scope弃用提示保留，未更改无关配置。
- 两次各241个冻结源及快照、18份保留输入重新哈希，无不匹配。
  241个产物条目是源码快照，不是241份独立科学样本。
- 每次产物目录9,944,547bytes（含收据）；大阶段文件只读且未复制。新输出均在E盘。

首次收据：
[receipt.json](../../tmp/nr-shadow-evidence/nr-k3-boundary-stage-channels-v1-20261008/receipt.json)
SHA256 `79aded076b8b6638f09fc23ae900a5b9dbd380cd68252274c297f379a4fb0172`。

独立进程收据：
[receipt.json](../../tmp/nr-shadow-evidence/nr-k3-boundary-stage-channels-replay-v1-20261008/receipt.json)
SHA256 `7a347a8960312de7f0f8da5bbd2a61d27250826149dcf6c3032d3e5865d10dff`。

未修改的生产FO源SHA256：
`6252ec9b2901f03e51081410a612b9b6ed9d1ddd3469663f8d8dd9663944e457`。

## 5. 下一步决策与限制

下一项的重点应是规范组合`K-2Theta+tr(a)`及其导数辅助场与固定层的相容性，
同时保留GammaHat/D/P的耦合，而不是单独修改B的ordering项。至多再做一个有明确
排他判据的实验，就进入边界/规范路线决策；不再扩展同类域矩阵来推迟决策。

本结果仍只解释首个k2的离散传递，没有证明原T=1M的H/Ricci失败由某个通道唯一
导致，更没有验证物理反射率、因果速度、全局双曲性或完整黑洞稳定性。
原域、上/下侧及双侧扩域的失败收据与科学阈值不变。

physical_validation、physical_boundary_validated、black_hole_evolution_validated、
amr_validated、waveform_validated、gpu_validated、runtime_writeback、
scientificPayloadWriteback全部false。没有美术编辑、生产方程改动、安装、删除、
提交、推送或父仓库操作。完整goal保持active，未宣称完成。

科研技能用于冻结分析范围、保留失败与限制因果推断；测试技能用于独立系数控制、
实际RHS对照、全输出错误注入及拒绝路径，而不是用测试数替代物理验收。

# Schwarzschild 保留场误差定位：分析完成，物理门禁未改变

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: run; declared post-hoc retained-checkpoint analysis
- Origin Date: 2026-10-08
- Verification Status: ANALYSIS COMPLETE; ARITHMETIC CHECKED; PHYSICAL CAUSE UNRESOLVED
- Version Label: nr-schwarzschild-error-localization-v1

上一目标轮次为现状评估，没有新增物理实验结果。本轮执行此前已准备、尚未运行的
[定位协议](EXPERIMENT-20261008-error-localization.md)，不再重复原生演化。
本结果改变下一步诊断重点，但不是方程修复、黑洞验收或完整目标完成。

## 1. 执行结果与范围

- 新读取 45 份不同的保留检查点：三个区域、三档相同间距、五个时刻。
- 形成 72 组域内误差分布和 48 组带符号域间差值分布；没有漏行或事后删点。
- 三种区域的初始 H/Ricci 在共同节点上完全相同，12 对初态指标比较通过。
- 每组保留全部 125 个共同节点、三个不重叠子区和每轴五张坐标平面。
- 分量平方范数、正负交叉项、分区加权重建及独立标量求和核验通过。
- 分析耗时 39.2268943 秒，退出码 0，`completed=true / errors=[]`。
- 207 个源码身份、207 份源码快照、45 个检查点哈希再次核对，均无漂移。
- 输出目录共 208 个文件、3,739,398 bytes，低于 16 MiB；没有复制原始检查点。

所有诊断仍由原有度规几何定义重建，不使用演化辅助场替代 Einstein 约束。
标量 `math.fsum` 是同一进程内另一种求和实现，不是第三方求解器或独立几何公式。
本轮没有另跑独立进程重算全部定位量；此前的独立进程复核只覆盖其原声明范围。

## 2. 几何位置标签，不是因果分区

区域始终相对于原立方体 `[1,3]^3` 定义：

`d_low=min(x,y,z)-1`，`d_high=3-max(x,y,z)`。

| 子区 | 定义 | 节点数 |
|---|---|---:|
| 低侧较近 | d_low < d_high | 44 |
| 两侧等距 | d_low = d_high | 37 |
| 高侧较近 | d_low > d_high | 44 |

扩域后仍使用这些原坐标标签，而不是重新选择更有利的测点。
平方范数份额是坐标分量诊断的份额，不是引力能量、边界能流或反射率。

## 3. 新发现：移动两类面的差值分布明显不同

原域为 `[1,3]^3`，高侧扩域为 `[1,3.5]^3`，两侧扩域为 `[.5,3.5]^3`。
因此 `upper-original` 只移动高侧面；`both-upper` 只移动低侧面，
但后一对照同时增加了更靠近黑洞、曲率更强的活动区域，不能据此单独归因。

最细间距 h=1/16、T=1M 的带符号场差值：

| 差值 | 指标 | 全部共同节点 RMS | 低侧份额 | 等距份额 | 高侧份额 |
|---|---|---:|---:|---:|---:|
| upper-original | H | 8.46720e-9 | 18.003% | 34.232% | 47.765% |
| upper-original | Ricci | 2.92294e-9 | 18.693% | 36.539% | 44.767% |
| both-upper | H | 1.03686e-7 | 95.678% | 3.501% | 0.821% |
| both-upper | Ricci | 3.91252e-8 | 96.350% | 3.019% | 0.630% |

这里先逐点相减，再计算范数，未用两个 RMS 的差替代场差。
低侧扩域的差值在低侧子区占主导，为优先检查该侧固定层与内部算子的衔接提供了依据。
但这不能证明某个边界实现错误、测出特征传播速度，或排除内部离散误差。

完整 48 组比较中，一项位于旧实验的 2e-12 可测底限以下：最细间距、T=.125M 的
`upper-original` Ricci 差 RMS 为 1.48249e-12。其位置百分比只作数值记账，
不作为可解析物理差异证据。本分析不新增底限判据、不重新评判旧实验。

## 4. 不能忽略初始误差本身的空间偏重

低侧子区只有 35.2% 的节点，却在最细间距的初始误差平方范数中占：

- H：87.6001%。
- Ricci：89.2880%。

所以“误差主要位于低侧”本身不足以证明边界污染。为避免仅报告集中度，另比较
各子区演化变化 RMS 与该子区初始诊断 RMS 的比值。最细间距、T=1M：

| 区域 | H 低侧 | H 高侧 | Ricci 低侧 | Ricci 高侧 |
|---|---:|---:|---:|---:|
| 原域 | 0.40523 | 0.23760 | 0.40583 | 0.27610 |
| 只扩高侧 | 0.40091 | 0.15070 | 0.40211 | 0.20122 |
| 两侧扩域 | 0.09208 | 0.05282 | 0.17347 | 0.14349 |

这些比值也不是相对于精确时空解的全局相对误差。它们仅描述本次诊断分解。
只扩高侧后，低侧的归一化演化变化与原域接近；两侧扩域后发生明显改变，
与域间差值的位置分布一致，但仍保留新增曲率区域等混杂因素。

## 5. 抵消是随分辨率、时间和位置变化的

沿用恒等式：`总诊断误差 = 初始离散诊断误差 + 演化引入的诊断变化`。
这不是唯一的边界/时间/物理误差分解。以下是 T=1M 的 H 低侧子区夹角余弦：

| 间距 | 原域 | 只扩高侧 | 两侧扩域 |
|---|---:|---:|---:|
| 1/8 | +0.80907 | +0.80554 | -0.85344 |
| 1/12 | -0.35711 | -0.35257 | -0.99411 |
| 1/16 | +0.95844 | +0.95028 | -0.99882 |

负号表示带符号诊断场的抵消，不代表耗散或负能量。
原域和高侧扩域的中间网格低侧抵消、最细网格低侧叠加，并非只发生在高側。
最细网格的原域和高侧扩域在 T=.25M 仍是负夹角，到 T=.5M 转正；
中间网格在 T=.5M 为正，到 T=1M 又转负。不能用单一时刻的大小排名判断渐近阶。

所有坐标平面均留存在原始分析中。最细间距、T=1M，三域五张 x 平面的 H
交叉项符号分别全部为正、全部为正、全部为负，与子区结论一致。
平面覆盖相同节点，因此它们不是额外的独立样本；不能据此做显著性或置信区间声明。

## 6. 下一项可区分机制的诊断

不再仅重复扩域，也不通过加耗散、调阈值或缩短窗口追求通过。
下一批先比较三域解析初态上的**实际离散 RHS**：

1. 在相同物理节点对齐 58 槽输入、间距和规范参数，逐槽比较 RHS。
2. 分开检查完整内部模板、靠近解析固定层的模板以及诊断的复合导数支撑。
3. 若共享完整模板处初始 RHS 已不同，优先查索引、边界闭合和算子合同；
   若内部一致、差异局限于固定层邻域，再设计同背景、同大域下的固定层干预对照。
4. 所有干预都明确标记为诊断，不把“扣掉解析残差”或重新注入解析内部状态当成物理解法。
5. 在获得可证伪结果后，才决定是否修改边界、差分或演化实现；保留全部旧失败。

这是基于新分布证据选择的下一步，不是已执行的新 RHS 实验或已证明的根因。
当前高侧扩域实验 H/Ricci 的 T=1M 细网格观测阶仍为 2.68200/2.84553，
原三个区域的科学失败状态全部保留。

## 7. 验证、资源与准入

本轮运行合并定向回归：**395 passed in 22.53s**。包含
`scripts/tests/test_nr_schwarzschild_*.py`，以及 exterior_window、Schwarzschild、
checkpoint、gauge_profile、Einstein constraints、FO RHS、manifest 和新定位模块
的八个科研测试文件。新定位测试包含在这 395 项中，不与旧 347 项累加。
四个定位相关 Python 文件通过 Ruff。保留原有 pytest-asyncio loop-scope 弃用提醒，
未修改无关配置。本轮不声称全项目测试、浏览器验证或新的黑洞物理验证。

使用新 E 盘 basetemp `tmp/nr-localization-regression-v1-20261008`，禁用 pytest 缓存及 pyc。
分析和测试进程均已退出 0；没有后台遗留的本轮实验。
末次资源检查 C 约 6.661 GiB、E 约 23.505 GiB，满足用户保留量。
未删除、移动、安装、提交、推送或检查父仓库；未修改美术、方程、现有阈值及 live 路径。

physical_validation、physical_boundary_validated、black_hole_evolution_validated、
amr_validated、waveform_validated、gpu_validated、runtime_writeback、
scientificPayloadWriteback 全部保持 false。完整 goal 保持 active。

科研规范在本轮的作用是固定分析覆盖、记录探索性性质和限制归因；测试规范用于检查
分区、算术、坏输入和来源拒绝行为。测试通过没有提升任何物理准入。

## 8. 可追溯入口

- [完整分析结果](../../tmp/nr-shadow-evidence/nr-k3-error-localization-v1-20261008/analysis.json)
  SHA256 `482420cef8dbb07276c75da3a4456f3f73ddf9424cdfad4e55a4ea14cdfa9e3a`。
- 本次协议 SHA256 `a5c79b02d0b464a1216a1dace53b82f7b8d84fe6c58a22bc8d5f04d30b24fb02`。
- [上游失败实验](../../tmp/nr-shadow-evidence/nr-k3-upper-domain-replay-v1-20261008/receipt.json)
  SHA256 `ac35d3e159b9c0ad603f7bde4068171f2a396a4a690799b5c0ccc42462e33da7`。
- [上游独立进程复核](../../tmp/nr-shadow-evidence/nr-k3-upper-domain-audit-v1-20261008/audit.json)
  SHA256 `37cf4c470b614fbfa226999eaefa62b0162fa7fcc7b1c28de0c18ef2ad7813ff`。
- 原生 0.5.0 二进制 SHA256 `fc7ffb4eb3b40fbe8547c7178eb3f274f5ccbc6f6fa5d5f1decd1e2f1f761cbc`。
- [分析入口](../../scripts/analyze-nr-k3-schwarzschild-error-localization.py)，
  [纯诊断模块](exterior_error_localization.py)。

执行入口为 `D:\python\python.exe -B scripts/analyze-nr-k3-schwarzschild-error-localization.py`
加 `--output-directory E:\86137\myai\solar_sim\next-web\tmp\nr-shadow-evidence\nr-k3-error-localization-v1-20261008`。
该目录已存在，禁止覆盖重跑；需要重放时必须使用新目录并显式保留本次结果。

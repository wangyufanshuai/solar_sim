## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: run; pre-registered saved-case arithmetic diagnosis
- Origin Date: 2026-10-13 (Asia/Shanghai)
- Verification Status: DIAGNOSTIC_COMPLETED; original candidate FAILED_GATE unchanged
- Version Label: nr-case0-energy-diagnostic-v1-results

## 结论

**已定位一个可复现的误差放大机制，不是“Decimal50 位数不够”。**

原成对投影构造在非零速度处，比直接拉格朗日表示多一个 `K/lambda`
因子。两者在精确谱条件成立时等价；对于当前保存的双精度矩阵，
该谱条件存在小残差，这个额外因子放大了它，尤其影响低速度投影。
本次多项式残差恒等式核对支持这一解释。

尚未独立构造精确主矩阵，因而**不能进一步断言底层矩阵残差全部来自
正常浮点舍入，而不是某个方程/组装缺陷**。也不能称完整科研内核已修复。

直接拉格朗日表示在 case 0 的三项诊断指标中低于原 `2e-12`，但仅是
候选修正方向：没有替换原实现，没有重新运行完整联合验收，也没有
回写原失败。直接表示的最大作用残差仍为阈值的约 71%，余量并不宽。

## 本次执行

- 用户明确授权：只诊断 case 0，64 MiB / 600 秒，保留原阈值和旧证据，
  不重跑完整矩阵。
- 技能影响：按 academic-research-suite 的实验流程先预登记对照、
  解释边界和停止条件，再执行单批受监督计算；用户的磁盘硬底线优先。
- 命令：`D:/python/python.exe -B scripts/run-nr-k3-case0-energy-diagnostic.py --output-directory tmp/nr-shadow-evidence/nr-k3-case0-energy-diagnostic-v1-20261013`
- 工作区：`E:/86137/myai/solar_sim/next-web`。
- Run ID：`eb76f1c6-298f-46de-83cb-f7579f7bb83f`。
- 只执行一次，exit code 0；无自动重试。
- 工作进程记录 35.485 秒；监督层记录 43.593 秒。这是回执采样时间，
  不称为包含最终写盘的精确端到端时长。
- 6 项新诊断自检通过：已知精确对角矩阵、整数相似变换矩阵，各检查
  展开式、因式式和直接拉格朗日式。不是 6 项物理基准。
- 精确重现原 case 0 的全部保存指标；原 Decimal50 投影与旧保存数组
  逐位一致。仅加载旧数组，没有重新生成主符号矩阵。
- 原 507 项源码加 3 个诊断文件形成 510 项冻结快照；未修改旧源码。
- 100/52 项测试套件、66 案例矩阵、N9/N13、时间积分、native/GPU
  运行均未执行。美术、live dynamics 和科学 payload 未改动。

## 对照结果

下表是转回 binary64 后，嵌入完整 58 变量系统并采用原指标计算函数
得到的数值。全部继续使用 `2e-12` 阈值。

| 计算路径 | 幂等残差 | 不同投影乘积残差 | 特征作用残差 |
| --- | ---: | ---: | ---: |
| 原 Decimal50（旧失败，精确复现） | 6.425270957747944e-12 | 8.224912548713627e-12 | 1.9015920723901177e-11 |
| 原展开式 Decimal70 | 6.425270957747944e-12 | 8.224912548713627e-12 | 1.9015920723901177e-11 |
| 同一成对多项式，改因式顺序，Decimal70 | 6.425270957747944e-12 | 8.224912548713627e-12 | 1.9015920723901177e-11 |
| 直接 12 次拉格朗日，原矩阵/原节点 | 1.1003962779664754e-12 | 9.195731783977208e-13 | 1.4173677881221384e-12 |
| 原成对表示，解析节点对照 | 6.4373914975020914e-12 | 8.224912548713517e-12 | 1.901592072390118e-11 |

“解析节点对照”保持保存矩阵不变，仅将平直背景的正速度平方设为
`[1/20, 1/10, 1, 2, 3, 4]`，用 Decimal70 求根。它不是拟合特征值，
也不算原节点输入通过。该对照仍失败，说明仅提高节点精度不够。

四条 Decimal70 路径分别完整测量了 13 个幂等/作用关系、156 个有序
交叉乘积，以及完整性和重构；没有选择性省略失败项。

## 误差来源分层

### 1. 高精度运算位数与求值顺序不是主要来源

- Decimal50 与 Decimal70 的投影相对差约 `2.10e-43`。
- Decimal70 展开式与同一多项式的因式式相对差约 `2.01e-63`。
- 50/70 转回 binary64 的全数组并非逐位完全一致，因此不声称二者
  所有元素相等；但上述三个最大残差与旧失败完全一致。

### 2. 转回 binary64 不是主要来源

原展开式在转回双精度**之前**，幂等、交叉、作用残差已经分别为
`6.425276071376345e-12`、`8.224912548713623e-12`、
`1.9015950045770334e-11`，三项均超限。

转回 binary64 的投影相对变化约 `9.80e-17`；由该转换单独引入的
作用残差矩阵变化最大无穷范数约 `3.05e-15`，不足以解释 `1.90e-11`
的失败。这里的变化范数与归一化指标明确分列，没有当作可相加的占比。

`Decimal.from_float` 精确保留原浮点值，而不是恢复其预期实数值，
见 [Python 官方说明](https://docs.python.org/3/library/decimal.html#decimal.Decimal.from_float)。

### 3. 保存矩阵的谱条件残差被原表示放大

令 `K` 为保存的 47x47 主块，六个正速度为 `a_j`，并定义

\[
m(z)=z\prod_{j=1}^{6}(z^2-a_j^2).
\]

直接拉格朗日投影多项式记作 `L_lambda`，则

\[
(K-\lambda I)L_\lambda(K)=\frac{m(K)}{m'(\lambda)}.
\]

原成对构造在非零速度处满足

\[
E_\lambda(K)=\frac{K}{\lambda}L_\lambda(K),\qquad
(K-\lambda I)E_\lambda(K)=\frac{K m(K)}{\lambda m'(\lambda)}.
\]

零速度处 `E_0=L_0`。当 `m(K)=0` 时两种表示的差异消失；当前保存
输入并非如此。原代码位置为
[constraint_projector_energy.py:74](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/constraint_projector_energy.py:74)。

测量结果：

- 原节点 `||m(K)||_inf = 1.5297823848580734e-13`。
- 原节点 `||K m(K)||_inf = 4.5893413645699003e-13`。
- 在 `lambda=-sqrt(0.05)` 的保存节点处，
  `1/[lambda m'(lambda)]` 约为 `41.435`，预测作用残差与实际
  `1.9015950045770334e-11` 一致。
- 原展开式残差恒等式的最大核对误差约 `6.42e-63`；直接式约
  `5.19e-62`，均满足预登记的诊断算术自检 `1e-50`。
  该 `1e-50` 仅用于新恒等式核对，原物理阈值仍是 `2e-12`。
- 解析节点下 `||m(K)||_inf = 1.5297814354258041e-13`，仍非零；
  原节点/解析节点两种残差矩阵之差的范数约 `2.43e-14`。
  不将这些可能相消的矩阵范数强行转换成误差贡献百分比。

这证明了当前有限精度输入上的放大机制，但 Decimal70 计算不等于
形式化精确证明，也未单独证明矩阵中的每个系数正确。

### 4. 可复查的最坏位置

索引均为零基完整 58 状态索引，不是代码行号：

- 最大作用残差：投影 5（保存负速度约 -0.2236068），最大行 28
  `B[0,0]`，该行最大单项列 18 `Theta`。
- 最大交叉乘积：投影 0（-2）与投影 5，最大行/列同为 28/18。
- 最大幂等残差：投影 5，最大行 19 `GammaHat[0]`、列 18 `Theta`。

正低速度投影也出现相同量级。这里定位的是**残差矩阵位置**，不能
据此把原主矩阵的对应单个元素直接判为错误并清零。

## 证据和资源核验

- 新批次 567 文件，10,944,109 字节，约 10.44 MiB，低于 64 MiB。
- 源码快照 4,490,777 字节，低于 8 MiB。
- 原批次所有 532 个文件的前后哈希一致；旧失败终态保持原 SHA-256。
- 监督层 `cleanup_verified=true`、`active_after_cleanup=0`。
  随后只读进程检查未发现本批运行器或监督引导进程仍运行。
- 结束后仅做持久证据核验，没有补跑数值计算：终态校验、预备/最终
  run ID 一致、566 项产物哈希全部通过，清单之外只有终态自身。
- 磁盘结束后时点：C 15,919,341,568 字节；E 20,014,804,992 字节。
  原 C >= 3 GiB、E >= 4 GiB + 32 MiB 底线未放宽。
- `diagnostic_completed=true` 仅表示诊断流程完成；
  `original_candidate_passed=false`、`fixed_projector_energy_validated=false`、
  `physical_gate=false`、`live_admission=false`、
  `scientificPayloadWriteback=false`。

本报告在批次后新增，不回写已冻结批次目录或旧报告。

| 文件 | SHA-256 |
| --- | --- |
| [诊断终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case0-energy-diagnostic-v1-20261013/qualification-gate.json) | `4407d9c2fa7d6ddfd2c627b524c5cf2d31611e3e64778c34038ca8ed4049584f` |
| [算术对照](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case0-energy-diagnostic-v1-20261013/arithmetic-comparison.json) | `4990a247429985d8bab0655bd9253a7b933c9971c2af29ee658573d3a4f9e75f` |
| [工作进程回执](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case0-energy-diagnostic-v1-20261013/worker-result.json) | `8cad3208cf07ae1f8d73323fcde76d2fa6fad9ba58c70fcab51a8541b4e64369` |

## 建议下一步，尚未授权或执行

1. 先为 case 0 从明确的平直背景方程独立构造精确系数主矩阵，逐项
   对照当前保存矩阵；不以 `limit_denominator` 猜测或拟合矩阵。
   区分正常系数舍入、组装误差和真实结构错误。
2. 将直接 12 次拉格朗日表示作为**独立 v2 shadow 候选**，保留原 v1。
   先在 case 0 检查完整43/58、状态映射、能量和全部原门槛；不能只
   挑这次改善的三个指标。补充输入微扰和病态性控制，关注约 29%
   的剩余阈值余量。
3. 只有上述小批通过并另获授权后，再申请完整矩阵回归；此次没有
   完整矩阵重跑授权，更没有 live 切换授权。

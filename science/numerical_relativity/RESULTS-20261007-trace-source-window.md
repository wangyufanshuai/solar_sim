# 迹约束源前瞻性对照：完成，但总门禁未通过

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: frozen numerical experiment, followed by read-only verification
- Origin Date: 2026-10-07
- Verification Status: COMPLETE; partial gates PASS; aggregate INCONCLUSIVE / false
- Version Label: trace_source_prospective_v1_results

## 结论先行

保持0.3.2真实Windows原生内核、初值规则、阻尼、tau逆为0、周期边界和无投影
演化不变，完成了[执行前协议](EXPERIMENT-20261007-trace-source-window.md)全部
62例、310个采样、288条runner命令，耗时 **459.645741s**。所有288条子命令
退出0，没有异常、重试或调整门槛。聚合程序最终退出1，是因为总门禁false，
不是求解器崩溃或观察到发散。

结果支持本弱扰动/周期/有限T1范围内的迹源机制：纯迹扰动产生预期的lapse
辅助约束响应；匹配强度的无迹对照显著抑制响应。但是原协议同时要求无迹组
余项可测量并呈二阶缩放，而它们全部低于固定的1e-12可测量下限，因此：

`completed=true`，`prospective_trace_source_screen_passed=false`。

不能把“响应很小”改写成“余项阶数已证明”。收据中的
`inconclusive-roundoff-floor` 是预定义标签，表示低于保守可测量下限；
并不证明这些小响应实际上由舍入噪声主导。

## 实测门禁

| 检查 | 实际结果 | 解释 |
|---|---|---|
| 全部采样源预测、无迹抑制与域检查 | 310/310通过 | 仅所列采样点，非所有RK stage |
| 纯迹有符号斜率 | 最大偏离1为2.9645e-11 | 不仅比较范数 |
| 纯迹预测相对误差 | 最大8.49544e-6（比值） | 绝对误差最大4.21995e-10 |
| 纯迹幅度翻倍余项 | 8/8组通过；阶2.000000315–2.000001154 | 仍是离散弱扰动响应，不是物理解收敛 |
| 无迹幅度翻倍余项 | 8/8组inconclusive | T1误差8.28812e-17–2.39722e-13，均低于1e-12 |
| 无迹全部采样峰值 | 5.40792e-13 | 相对匹配纯迹预测峰值最高4.77997e-8 |
| FD2源响应空间阶 | 1.95770、1.97914 | N8/12/16与连续源公式比较 |
| FD4源响应空间阶 | 3.89928、3.95034 | 不等同于全部Einstein约束趋零 |
| 4组半时间步 | 通过 | 58槽最大差2.63688e-12；H/M有符号差最大3.67272e-12 |
| Python/C++续算 | 16/16通过；最大差1.60585e-16 | T1后一步全58槽，不是完整T1双后端窗口 |
| 直接/分段、1/4线程 | 4/4组通过 | 完整checkpoint及manifest逐字节相同 |
| 精确Minkowski | FD2/4所有采样槽不变 | 无重构或投影掩盖误差 |

采样CFL峰值0.375000490（门槛.45）；重建ADM H/M峰值6.5624377e-4，
旧存储K指标总峰值6.5624360e-4。它们只是低于.01异常停止上限，绝非
“约束满足”或“约束衰减”。本次故意加入了约束不满足的初值。

## 新增的诊断区分

Exa本次读取1篇已知作者原文，核查变量分解和约束定义：
[FO-CCZ4式3、5、6、8、12](https://arxiv.org/html/1707.09910v3)。
没有声称是新发表论文、广泛文献综述或来自多个独立源的交叉证明。
GitHub参考沿用上一轮已读取的GRChombo；本次未复制或修改上游代码。

在 `tr_h(A)!=0` 时，重建Kij的几何迹是 `K_actual=K_stored+tr_h(A)`。
既有metric-only报告代入K_stored，本批另记：

`H_ADM=H_stored+K_actual²-K_stored²`，`M_ADM=M_stored-D(tr_h A)`。

二者在代数约束面上相同，面外不同。新字段名称明确区分；旧报告、manifest
合同、旧T10结果均未修改。这套新增诊断共享既有metric Ricci实现，但不依赖
演化的Gamma或33个辅助梯度，不能称为一个独立完整Einstein求解器。
62例初值与平直闭式H/M公式的最大差 **5.08220e-21**。

## 身份与独立复核

- 收据：`C:/Users/86137/NRShadowEvidence/nr-k3-trace-source-prospective-v1-20261007/receipt.json`
- 收据SHA-256：`55ed425f00fdddbda227b6ad7af0f75a3002cf237baa1b2f752b54affbc7ec1c`
- 冻结协议SHA-256：`ae0c0dfa43e2468cf1ea334e1483e0f2e0f15f00e0b6e02760afc86e80487b19`
- 二进制SHA-256：`554c65d99590153f56e40c3943d18785658fef7ca53f2c25a5a3630f2806619b`
- 总1439个文件、132,478,296 bytes；收据绑定1438个其他产物哈希。
- 150份既有源码保持不变，仅新增4份实验/测试源码；154份完整冻结快照及当前
  源文件逐项一致。README和本文是执行后说明，不改冻结协议或收据。

另一个只读进程重新核对全部源/快照、产物、二进制及协议身份，逐个重算310个
采样诊断、16个跨语言误差、4组完整字节重放和聚合决策。再用独立FFT实现
中心差分的离散频率符号（Nyquist显式为0）计算有符号预测；与配对差分诊断
的预测误差差异最大 **2.71051e-20**。此处独立的是导数计算路径；约束报告
重算仍使用同一metric诊断库，不混称完全独立几何实现。

定向回归 **456 passed in 18.76s**，含首次48项新测试，不重复累计；Ruff通过。
不是全项目测试。既有pytest_asyncio配置弃用警告仍在，未改无关配置。

## 下一步，不修改本次门槛

1. 保留本次“不确定”的总结果。先分析无迹控制的对称性、非线性余项大小和
   数值分辨率，判断预先假设“每个控制都必须显现非零二阶项”是否合理。
2. 如需更大幅度或更高精度确认余项，必须设计新的、独立编号和冻结的协议，
   同时约束弱场范围、H/M上限和离散误差；不得修改本次收据、降低原下限或
   把分析中可算出的极小数比值当作已经验收的阶数。
3. 在无迹余项门禁处理清楚之前，不开启原本后续的代数投影/有限tau生产比较。
   两种约束控制是不同算法，之后必须分别绑定配置、manifest和恢复身份。
4. 后续应单独处理旧“存储K”诊断在代数约束面外的合同说明/新字段，不能静默
   改变历史H/M数值语义。

本批没有改美术、live EIH、科学payload、任何旧演化方程或外部服务。
physical、完整dynamic constraint convergence、strong hyperbolicity、CPBC、
单黑洞、AMR、CUDA、长期稳定性、runtime和scientificPayloadWriteback全为false。
顶层NR goal仍active；完成一次实验不等于完成整个科研内核目标。

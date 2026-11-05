# 初始 B ordering 源项：独立预测相符，旧收敛失败未解除

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: retained-state source audit and independent-process replay
- Origin Date: 2026-10-08
- Verification Status: INITIAL SOURCE CONTRACT PASSED; NO PHYSICAL ADMISSION
- Version Label: nr-initial-ordering-source-v1

本记录补齐已完成实验的结果文档，不表示本轮重新运行该实验。
依据冻结的 [协议](EXPERIMENT-20261008-initial-ordering-source.md)，读取九个初态/RHS对，
没有时间推进或生产方程修改。源项预测不调用生产初始化器或导数算子，另在125个
共同节点用60位Decimal核对，80位结果转为float64后与60位完全一致。

原始FO-CCZ4论文的[方程12系统](https://ar5iv.labs.arxiv.org/html/1707.09910)给出
B方程ordering项的符号。在本静态初态下，它化为
`alpha^2*(.2chi)*(FD4_k P_i-FD4_i P_k)`，固定两层RHS为零。
其中mu=.2chi是项目自定义候选，不受原论文常系数规范证明的自动保障。

九例全部通过，全网格九个B分量预测的最大绝对误差为4.85642940e-17；
125节点上原生/Decimal最大差为2.80621083e-17。这是数值实现一致性，不是物理精度。

| 间距 | 共同核心九B分量合并RMS |
|---|---:|
| 1/8 | 8.357997035563478e-9 |
| 1/12 | 1.6433426382503097e-9 |
| 1/16 | 5.191119975992044e-10 |

原域、只扩高侧和两侧扩域的共同核心相同，探索性观测阶均约4.011409/4.005700。
对角分量、固定层为严格零；B源反对称。连续解析Hessian是对称的；binary64计算的
curl仍有至多1.11e-16舍入残差，不能写成浮点逐位为零。

两个独立进程的完整解析收据仅seconds不同，其余字段相同：

- 首次5.2586471s，receipt SHA256
  `c3f893b626740ae2eeb333c5ece73be26abbe2631c91161050bda483eeccf9f8`；
- 第二次4.6012159s，receipt SHA256
  `c1ab418f3afa736704079572bd9ed32ef9d0313e4ec5855aff1c93322e5d9776`。

两目录各2,804,086bytes，235个源快照及18份输入身份匹配。上一实现轮定向合并回归
670 passed（含63项新测试），4个新Python文件Ruff通过；不是全仓库/浏览器测试。

这不支持删除ordering项或强制离散curl为零。它只排除了所测初态下B源公式的一类
错误，未解释T=1M的非线性/边界耦合。下一步应分离固定层源项如何进入后续阶段。
原域、上下侧扩域及两侧扩域失败保留；physical、boundary、black-hole、AMR、waveform、
GPU、runtime/scientific writeback八项准入仍false，完整goal仍active。

- [首次收据](../../tmp/nr-shadow-evidence/nr-k3-initial-ordering-source-v1-20261008/receipt.json)
- [独立进程收据](../../tmp/nr-shadow-evidence/nr-k3-initial-ordering-source-replay-v1-20261008/receipt.json)

# Gamma 一致初值：非线性剩余误差与采样时间窗

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: implement and run
- Origin Date: 2026-10-07
- Verification Status: ORIGINAL EXECUTION TIMED OUT; explicit continuation complete; aggregate scientific gate FAILED
- Version Label: nonlinear_remainder_v1
- Scope: full-cube periodic CPU shadow, small-amplitude diagnostic only

## 问题与事先固定的设计

上一轮已观察到初始 Gamma 与 D 一致后，mode 1 大幅降低，但完整 H 的
9→13 网格残差仍非单调。本轮检验剩余项是否以振幅二次阶缩放，以及空间精度
能否在固定采样时间窗中得到支持。旧结果只用于提出问题，不是本轮盲验证数据。

不改变 RHS、规范、阻尼、默认初始化或 C++ 0.2.0。每个新 case 都从新初值起步，
仅 opt-in 将初始 Gamma 改为 D/h 收缩连接，其余 55 个初始槽逐字节检查不变。
整个演化不投影中间态、不重建辅助场。三维周期单位立方体、1+log、profile-v1、
4线程、波长1；这些仍不是谐和切片标准 gauge-wave 的精确轨迹测试。

七个预定 case：

| 系列 | N | 振幅 | dt | 末时刻 |
| --- | --- | --- | --- | --- |
| 空间 | 9,13,17,25 | 1e-4 | 1/512 | 1 |
| 振幅 | 13 | 5e-5,2.5e-5 | 1/512 | 1 |
| 时间 | 13 | 1e-4 | 1/1024 | 1 |

输出 t=0,1/8,...,1 的九个完整 checkpoint；只使用 t>0 八个样本进行窗口度量。
保留每个时刻的有符号 H、M_x、Theta 平面场，并严格拒绝不平面的输入，禁止静默平均。
H 同时采用现有物理 ADM 度规差分诊断和独立平面曲率/Fourier 诊断。
报告 Fourier 的0/1/2模态、完整约束、辅助定义/代数/curl约束和各采样点 CFL。

## 预先固定的门禁

1. 对 H_primary、H_fourier、M_x、Theta 四个场，窗口 RMS 定义为
   sqrt(mean_{8 sampled times, N grid sites}(field²))，另外记录各时刻空间L2的最大值。
   这是离散采样度量，不是时间积分的误差估计或连续时间上确界。
2. 空间阶 p=ln(E_N/E_M)/ln(M/N)：上述两类窗口量的三个相邻网格对均要求 p>=1.5。
   所有9/13/17/25数据、点态时间阶都报告；即使粗网格失败，也不得删掉重算总门禁。
3. 振幅窗口阶要求 1.8<=p_A<=2.2，两个振幅相邻对均须通过。
   同时，较小振幅的完整有符号场乘回 (1e-4/A)² 后，相对基线窗口L2差异<=5%。
   相同范数但符号/相位不同不能通过。
4. 时间步减半的四个场差异，相对细时间步参考的窗口 RMS 及每个采样时刻L2均<=1%。
   比较场，不只比较范数；不由此宣称非线性RK4四阶已验证。
5. 绝对参考量<=1e-12记为不可测，不给收敛/相对误差通过判定。
   采样点有限正定、CFL<=.45，四个约束场的最大绝对值<=1e-3。
   不能把采样CFL宣称为RK每个stage的CFL监控。
6. 9³末态独立做一次 Python/C++ 续步，全部58槽最大绝对差<=2e-12。
   这是一小步的跨后端一致性，不是独立物理参考解。
7. 七个case和九个时刻必须齐全；科学、强双曲性、物理边界、标准AwA、黑洞、
   AMR、长时稳定性、GPU、默认初始化提升、live与写回标志仍保持false。

## 资源与溯源

新输出目录；总时限1800秒，单段180秒；每段最多128步。磁盘预留1GiB、
输出预算192MiB。保留所有失败日志/已完成片段，不自动重试，不清理历史证据。
冻结当前源码/二进制、上一轮收据、输入和协议 SHA-256；完成后重新验证全部哈希。
本轮前序收据为 `nr-k3-modal-initialization-v1-20261007/receipt.json`，
SHA-256 `1ff1383ba935ce15b368c19eb5615dd3cbd068478743ccb0fddda8abf07b4774`。

## 外部核查与适用边界

Exa 本轮检索5条候选，原始AwA、其实现论文和后续比较论文去重后为不同参考。
直接阅读 [Daverio/Dirian/Mitsou 1810.12346](https://ar5iv.labs.arxiv.org/html/1810.12346)
的规范和方法部分：其频谱分析区分相位/幅值/高模态污染；采用的标准分辨率、
规范、耗散和投影策略与本候选不同，不可挪用其通过结论。该文使用解析 Gamma 初值，
因此本轮的离散一致初值只能作为明确标记的诊断变体，不能替代标准测试。
GitHub 查看旧 Constraints.hpp 的弃用标记后，核对
[GRChombo NewConstraints](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/CCZ4/NewConstraints.impl.hpp)
的物理H/M计算路径；没有移植或运行GRChombo，也不等于跨代码物理验证。

## 结果

原始运行在 1800.602 秒达到总时间上限，`completed=false`、
`bounded_remainder_gates_passed=false`。前六个 case 均有九个完整采样；
最后的时间步控制只完成初始 checkpoint，首个 128 步片段因剩余运行预算
12.373 秒而触发 `TimeoutExpired`。这是执行容量超限记录，不是数值失稳的证据。
没有重跑已完成 case，也没有改写原收据的失败状态。

原进程确认终止后，按独立预先冻结的
[检查点续算协议](EXPERIMENT-20261007-remainder-continuation.md)
补齐最后一组及一次跨后端续步；新执行耗时 267.959 秒。合并证据七组齐全，
但四个场的空间总门禁均未通过；振幅、时间步控制和小步跨后端检查通过。
完整空间阶、失败项、测试覆盖和解释边界见该续算记录。
两次执行分别保留，不能合写为原 1800 秒预算内成功。

| 原始证据 | 值 |
| --- | --- |
| 收据 | `E:/CodexData/nr-k3-nonlinear-remainder-v1-20261007/receipt.json` |
| 收据 SHA-256 | `94ebbfeb83bc8df0af286b1d21fdd333e14ca5518ad97af09a68fa535fe81ca5` |
| 运行前冻结协议 SHA-256 | `a32c2de78b56bfd5f6d75c1bf54bcb2bb636076fdbaabb121992474baedd0724` |
| 冻结源码 | 119 个，运行前后身份一致 |
| artifact 清单 | 208 个，复核无漂移；含收据共 209 个文件、118,628,328 bytes |

这里补写的是运行后结果；运行目录中的原始冻结协议及其哈希不变。
所有 physical/black-hole/strong-hyperbolicity/CPBC/AMR/CUDA/standard-AwA/
long-time/default-initializer/live/writeback 门禁继续保持 false。

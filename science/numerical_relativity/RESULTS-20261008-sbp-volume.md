# 非线性 SBP 体积算子：独立重算、进程重放及当前回归通过

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: implementation closure, independent tensor reconstruction, exact replay
- Origin Date: 2026-10-08
- Verification Status: VOLUME GATE CLOSED; NONLINEAR BOUNDARY/Evolution NOT ADMITTED
- Version Label: nr-sbp-volume-v2-closed

真实非线性 FO-CCZ4 方程已经通过显式空间导数接口接入 SBP(4,2)。全部58变量
和非线性源项保留。旧公开 RHS 继续应用原来的边界；新 `sbp-volume` 路径不能
被旧演化或检查点入口误认作周期/固定层状态。该体积模块自身没有 SAT 或时间驱动。

M=1、[1,3]^3、N17/25/33 静态曲率实验：固定125节点核心区的 RHS/Ricci 误差
约4.003--4.006阶；全域范数约2.500--2.570阶，六面约2.334--2.369阶。没有
宣称边界处处四阶。全58扰动的稠密/紧凑空间算术差异1.87350e-16；五个曲率
背景点的主部/源项分解通过；平直极限中心幅度余项约2.000阶。四组旧 RHS 和
两步RK4对照均逐字节一致。

独立审计没有导入生产 RHS、几何、SBP实现或实验运行器；从保存的静态输入按
共形平直张量恒等式重建全部58 RHS和Ricci。三网格最大 RHS差1.20585e-15、
Ricci差2.75474e-15，诊断范数最大差1.17419e-16。全部12项空间收敛判定复现。
这个静态独立代数检查不等于对任意非线性演化或物理边界的第三方验证。

单独进程重放除耗时外完全一致；268份当前源码和两次运行共558份产物身份匹配。
当前合并定向回归1183 passed，0 failed，0 skipped，耗时45.40s；其中独立审计
测试35项。不是浏览器或全项目测试。既有 pytest-asyncio 配置提醒未修改。

保留 v1 失败：非周期旧路径对照误用了只允许周期边界的 gauge-wave 构造器。
该尝试未完成旧路径矩阵，也未执行曲率实验。v2只修正该合成对照，原物理方程、
曲率/幅度/主部实验和阈值保持不变，失败收据及267份快照保留。

## 证据

- 原运行：`tmp/nr-shadow-evidence/nr-k3-sbp-volume-v2-20261008/receipt.json`
  SHA256 `4bf230893494e98eeea5f60d6405ee90c1d4dd90e579b3ad0676d6c2c32039b5`。
- 重放：`tmp/nr-shadow-evidence/nr-k3-sbp-volume-replay-v2-20261008/receipt.json`
  SHA256 `28d04fe52b14052280b5cfdc7da4e0c8f52ece80546b79d138cd3178034644f1`。
- 审计：`tmp/nr-shadow-evidence/nr-k3-sbp-volume-audit-v1-20261008.json`
  SHA256 `cd40eb247972a021a7e48bda4b5f7debe36b009584bc2b37d5539670e283a446`。
- 当前回归：`tmp/nr-sbp-volume-regression-v1-20261008.xml`。

下一步必须进入真实曲率系数下的阶段局部 SAT/演化接入，不再增加同一静态体积
算例的审计范围。旧 Schwarzschild T=1M失败没有被修复或重新评级。物理边界、
强双曲性、CPBC、完整黑洞、AMR、波形、GPU、live及科学写回门禁继续为false。

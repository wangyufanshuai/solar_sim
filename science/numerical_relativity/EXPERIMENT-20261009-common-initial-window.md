# N13 共同初值：三策略跨越旧失败时间窗的预注册试验

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective deterministic simulation and independent accepted-prefix audit
- Origin Date: 2026-10-09
- Verification Status: PLANNED; NO PHYSICAL ADMISSION
- Version Label: nr-common-initial-window-v1

## 研究问题及固定条件

上一轮 N9/T=1/256 的真实时间误差低于预注册分辨下限。本轮不估计时间阶数，
先问：在 N13、共同的代数相容新初值下，三种方法能否到达 T=1/16M，
越过旧 off-constraint 扰动轨迹在第12步/RK2触及 det(h) 合同的时间？

固定顺序 `none`、`endpoint`、`stages-and-endpoint`，各 N=13，
dt=1/256，最多16步，区域 [1,3]^3，SBP(4,2)，旧 gauge/config，
六面静态解析入射目标、同一个默认关闭的投影适配器；不改 RHS/SAT/映射公式。
这三项是事先注册的独立方法试验，不是同一失败轨迹的自动重试。

新初值来源仅是原失败批次的 T=0 扰动数组：
`perturbed-13-long-point-0000.npy`，SHA256
`d1e70bc8e22efbb83a25b09948809b63b8f4c194bf3bee41767425da7433d1d2`。
静态参考为 `static-13-long-point-0000.npy`，SHA256
`683a3540c7247aab2d57c9846cabdf6f42396d63f21a58540c01fafb6e14f0ae`。
只映射一次，结果必须与已冻结离线映射批次中的同一初值映射数组逐字节一致。
三个方法读取共同新初值的副本；保存原始/共同初值及差值、物理改变量。
没有读取旧拒绝阶段作为新初值，没有重启旧失败轨迹，没有求解 Einstein 初值约束。

## 指标、接收与停止

沿用全部旧特征合同、CFL<=0.25、正 lapse/chi、lapse<2、det偏差<=1e-10。
投影有效状态须通过原2e-12代数舍入合同，不缩小扰动、不调阻尼、不放宽速度检查。
每个阶段保存 raw/effective/RHS，步末保存 raw/effective；先登记阶段，再做可失败的保存。
保存候选点前核对完整4阶段/6面顺序；独立 H/M/约化约束诊断差<=2e-12。

每次观测记录代数误差、完整 RHS 链式率、物理度规/K_ij/实际tr(K)修正、
五区域加权范数。初始和每个接受点的旧H、新Hessian-H、M、约化约束及场误差
均保存。三策略的逐点对照只作差异和修正预算，不把它们当作三档时间分辨率。

任何方法内部数值/合同异常：该案例停止，不缩小dt、不投影后重试、不自动恢复；
保留最后接受点、失败阶段原始/有效数组、已有RHS及异常位置。随后仅启动尚未
尝试的其他预注册策略。磁盘、绝对时限、文件保存、源码漂移、独立诊断/记录结构
异常：中止整个批次。所有部分输出保留，未尝试项明确 not-attempted。

若任一案例失败，root completed/window_passed 均 false，即使其他策略走完。
只有三项都完成且来源/产物核验通过，才在新进程和新目录回放。确定性科学数据
（含所有数组、阶段记录及诊断）须精确一致，根 elapsed time 除外。
无 native checkpoint、物理边界、稳定性、黑洞、AMR、波形、GPU 或 live 准入。

## 来源与资源

冻结父回执 `nr-k3-projected-rk-v1-20261009/receipt.json` SHA256
`14f3ac404750a5f21540f5c8209e6cfbbe0cea85c2bb406e4a58f98124c81ccc`；
回放 SHA256 `2f793a52a972163ed7a178a1a8c6d8715a89fbb90e262d8987f243c291d381fc`；
独立审计 SHA256 `211e86e0b469671cc730c18c1df164b5c6576b1b6dd032edf7a17a21397e869d`。
回归基线1971项；先新运行器/审计测试和完整回归，再新批次。

每批绝对上限2400秒、768MiB（预留32MiB回执）；两个完成批次预计约1.3GiB。
这个上限因 N13/48步/完整阶段数组在运行前预注册，不在失败后提高。
保持用户原底线 C>=3GiB、E>=4GiB+32MiB，预检还要求E能容纳整个批次上限。
新输出/临时文件均在E盘；不安装、清理、原生重编译、修改父仓库或美术。

入口：`scripts/run-nr-k3-common-initial-window.py`。工作目录为
`E:\86137\myai\solar_sim\next-web`，Python为`D:\python\python.exe`。
运行前后验证完整父来源与所有冻结输入。独立保存数组审计不调用生产RHS，
仅核对已接受前缀的时间算术/映射、失败阶段记录及独立诊断，不伪称跨求解器验证。

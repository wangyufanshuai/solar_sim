# N13 共同初值的同终点时间加密合同

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective deterministic simulation and independent convergence audit
- Origin Date: 2026-10-09
- Verification Status: PLANNED; NO PHYSICAL ADMISSION
- Version Label: nr-common-time-refinement-v1

## 问题和控制

上一轮三策略在 N13/T=1/16M 都完成，最终状态差远低于2e-13，但只使用同一个dt。
本轮测量原 `none` 时间方法在同一新初值上的步长自收敛，不选择或启用持续投影。
固定 N13、[1,3]^3、SBP(4,2)、旧规范/RHS/六面静态解析入射目标。
共同初值 SHA256 为 `413c4f4b614e68456420c0ccb37070455fffa9d77f452e6eb4d62800c3f576b5`。
仍从原 T=0 数组做一次已冻结映射，保留其物理 K_ij 改变量；不是 Einstein 初值求解。

预先固定三案例顺序：7/14/28 步，dt分别1/112、1/224、1/448，到共同T=1/16M。
每档dt精确减半。选择7步最粗档基于已有最大CFL的线性估计0.242867，低于旧0.25上限；
估计不是保证，实际每阶段仍检查全部原门槛。49总步数适合既有2400秒/768MiB资源合同。
不缩小扰动、不修改阻尼、速度合同、方程、阈值或测量下限；不使用旧拒绝状态。

## 测量与评价

保存全部raw/effective/RHS阶段、步末、初值和独立H/M/约化约束诊断。
冻结旧窗口运行器的 `prepare`、`run_case` 和资源guard，不修改其实现或运行时全局变量。
仅新建案例矩阵和同终点分析/审计。阶段算术与初值在新审计中独立核对。

每个区域计算58槽、节点优先的SBP加权RMS差：粗-中、中-细。
固定区域 whole、central_box、faces、edges、corners，与既有定义完全一致。
若任一差<=2e-13，则该区域unresolved且order=null；否则p=log2(E_coarse/E_fine)。
继承时间屏幕范围3.5<=p<=4.5，且误差必须随加密下降；否则该区域failed。
aggregate仅全部五区域passed时为passed；任一区域failed则failed；否则unresolved。
另记录较小差/固定下限的倍数，便于识别仅勉强分辨的结果，不改变门槛。
只有三档，不能声称普适四阶、连续极限误差或长期稳定；单网格不能关闭空间收敛。

软件执行完成 `completed` 与 `temporal_screen_passed` 独立。科学屏幕failed/unresolved
不抹去完整计算；不改阈值、不重跑求通过。方法内部数值失败停该案例，随后只尝试其余
预注册案例；资源/存储/来源/诊断结构错误终止整批。保留已接受前缀和失败阶段。
完整计算且来源核验通过后，在另一进程/目录重复一次，即便阶数结果为failed/unresolved；
这是预先声明的复现检查，不是失败轨迹重试。崩溃/部分批次不自动重跑。

独立审计器不导入或执行生产RHS/积分器。它核对保存RK组合、独立H/M重建，并用
显式SBP边界权重和独立求和重新计算全部时间差/阶数/分类；科学JSON除根耗时精确回放。

## 来源、测试、资源

父首轮/回放/独立审计SHA256依次为：
`f6598b941dfc1215b94dfe7748730e3d734de0962c35a1b19476209b7b951c1f`；
`428922957c3b4f5ef052f4f024a0306a2090ff149fa3fd934fac0cf38236901d`；
`e144264d7c7dd33fa82f4d5bf71d7b99c1d2658b1a5962c50fba9872ad8fbf94`。
父2002项回归SHA256：`2c6131c97e5cbd6dc13c1e153095df6647088fb90bc439435fa89ad9860f5b7d`。
必须先通过新运行器/审计器控制测试和全部继承回归，才运行新矩阵。

每批绝对2400秒、768MiB，含32MiB回执余量；预计约25秒/步、49步。
C>=3GiB，E>=4GiB+32MiB，预检E另保留全部768MiB。全部新输出和临时文件在E。
不安装、不清理、不改native、不改父仓库、不改美术、不切live、不写回科学payload。
保留旧失败；physical、CPBC、AMR、black-hole、waveform、GPU等准入均false。

入口：`scripts/run-nr-k3-common-time-refinement.py`；独立审计：
`scripts/audit-nr-k3-common-time-refinement.py`。工作目录为next-web，Python为
`D:\python\python.exe -B`，NumPy/BLAS/OpenMP均以已确认的单线程环境运行。

# N13 共同初值三策略窗口：完成、精确回放、独立审计

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective bounded simulation; independent saved-state audit
- Origin Date: 2026-10-09
- Verification Status: WINDOW PASS; NO PHYSICAL ADMISSION
- Version Label: nr-common-initial-window-v1

## 结论

三种策略均从同一个新初值完成 N13、dt=1/256、16 步到 T=1/16M。
两个新进程各完成 48 步 / 192 个 RHS 阶段；完整科学 JSON 除根耗时外精确一致。
独立审计通过，但这**不证明时间阶数、约束改善、长期稳定或完整黑洞有效性**。
当前没有支持持续投影优于不投影的可分辨证据，默认策略与 live 均未改变。

预注册条件见 [实验合同](EXPERIMENT-20261009-common-initial-window.md)。
项目整体定位与工程轮次见 [水平评估和依赖路线](ANALYSIS-20261009-kernel-maturity-roadmap.md)。

## 本轮实现与验证范围

新增共同初值窗口运行器、独立审计器及两组失败注入/正常控制测试。
运行器在演化前登记三案例，保存每阶段 raw/effective/RHS 和每步末状态；
方法内部数值失败只停止该案例，资源/证据错误停止整个批次，不自动重试。
独立审计可检查失败案例的已接受前缀，且永不将原失败案例改为成功。

本轮没有修改旧体积 RHS、SAT、代数映射、投影适配器、native、app 或美术。
单元测试覆盖了失败路径；本次真实三案例未触发失败路径。

- 继承验证链的 67 个 Python 文件：2002 passed，38.29 秒。
- 新窗口定向测试：31 passed，2.11 秒，是上述 2002 的子集。
- 独立审计专项测试：14 passed，1.71 秒，也是上述测试的子集，不累加总数。
- 四个新 Python 文件的 Ruff 检查通过。
- 现有 pytest-asyncio 默认 loop scope 弃用提示保留；本轮未改变测试环境。

## 初值改变必须与时间策略分开

原始 T=0 扰动数组 SHA256：
`d1e70bc8e22efbb83a25b09948809b63b8f4c194bf3bee41767425da7433d1d2`。
共同映射初值 SHA256：
`413c4f4b614e68456420c0ccb37070455fffa9d77f452e6eb4d62800c3f576b5`，
与旧离线映射批次的 T=0 映射数组逐字节一致。

本例初始物理度规没有改变，但物理 K_ij 全域加权 RMS 改变量为
`4.0289572485531345e-5`，实际 tr(K) 改变量为 `1.2064039055715602e-4`。
初始 tr_h(a)、tr_h(D_k) 的最大误差从约 `2.72e-4`、`2.88e-4` 降到舍入级。
这不是 Hamiltonian/momentum 初值约束求解，也不是旧拒绝状态的 restart。

旧未映射轨迹仍在第12步/RK2、T=0.044921875M 触及原 det 合同，旧失败保持不变。
新的 `none` 策略只做一次初值映射，此后不投影，也走过该时刻；因此不能把
本轮窗口通过归因于持续投影，更不能称为同一个初值问题的修复。

## 实际数值结果

下表 H 为物理度规 Hessian 诊断的全域 SBP 加权范数，M 为独立物理动量约束范数。
原 D1-compose-D1 H 诊断也完整保存在回执中，没有被替换或改判。

| 策略 | 接受步数 | 最终 H | 最终 M | 步末 det(h) 最大误差 |
| --- | ---: | ---: | ---: | ---: |
| none | 16/16 | 9.20183151269402e-4 | 1.66273240495922e-4 | 1.11022302462516e-15 |
| endpoint | 16/16 | 9.20183151268736e-4 | 1.66273240495418e-4 | 3.33066907387547e-16 |
| stages-and-endpoint | 16/16 | 9.20183151268898e-4 | 1.66273240495404e-4 | 3.33066907387547e-16 |

共同初始 H=`9.049406754761464e-4`，M=`1.3985505572751858e-4`。
三策略全域 H 均增长约 **1.68436%**，M 均增长约 **18.88969%**。
以 none 为例，角区域 M 从 `1.3940592476388377e-4` 增至 `4.2924408828774686e-4`；
中心区域 H 从 `1.9570852246104394e-5` 增至 `6.176818163861381e-5`。
全域范数没有掩盖区域增长；短窗增长本身也不足以证明长期不稳定或唯一误差机制。

全部 raw 阶段/步末 det 误差最大为 `9.470202400052585e-13`，低于未改变的 `1e-10` 上限。
raw tr_h(a)/tr_h(D_k) 最大分别约 `1.71e-11`/`1.06e-11`；不能用步末舍入值
冒充所有未投影阶段都满足投影后的 `2e-12` 合同。
最大 CFL=`0.10625438408545176`，最大特征基条件数约24.20，
最大特征残差=`1.4500368651896048e-13`。全部原门槛保持不变。

单次映射的最大全域物理 K_ij RMS 修正：none 为0，endpoint 为
`9.841305767103e-17`，stages-and-endpoint 为 `2.500942872643119e-13`。
这些是**单次修正上界**，不是累计轨迹误差，更不包括上述一次初值物理改变量。

对保存的最终数组直接相减，得到以下事后描述量，不用于新增通过门槛：

| 最终状态对照 | 全58槽最大绝对差 | 非加权全槽 RMS 差 |
| --- | ---: | ---: |
| none / endpoint | 1.4368050477685246e-14 | 8.751464169027773e-16 |
| none / stages-and-endpoint | 5.2173218002826705e-14 | 9.093075289547818e-16 |
| endpoint / stages-and-endpoint | 3.780516752514146e-14 | 1.8040704960813056e-16 |

计算定义分别为 `max(abs(q_i-q_j))` 和 `sqrt(mean((q_i-q_j)**2))`，输入为
每个案例 `trajectory[-1].array`，以 NumPy binary64 读取，未改动保存数组。
这是方法间差异，**不是**三档步长误差；本轮 `temporal_order_validated=false`。

## 独立审计与来源

每批51条初始/接受点记录（3条共享初值记录，48条不同步末记录）接受独立
密集算子/Riemann 诊断重建，最大差异 `4.240011119982512e-14`，低于原 `2e-12` 合同。
每个已接受 RK 组合与保存 raw 数组逐字节一致；独立 cofactor 映射的最大相对差
`4.4408920740354315e-16`。三策略共同初值的独立映射差为0。

两批各1007个产物、333个源码键（331个不同源码文件）全部匹配。
审计器未重新执行生产 RHS；它验证保存数组的算术、映射、诊断、来源和精确回放，
不冒充独立 Einstein 求解器、跨编译器或跨后端物理基准。

| 证据 | 路径（相对 next-web） | SHA256 |
| --- | --- | --- |
| 首轮 | `tmp/nr-shadow-evidence/nr-k3-common-initial-window-v1-20261009/receipt.json` | `f6598b941dfc1215b94dfe7748730e3d734de0962c35a1b19476209b7b951c1f` |
| 回放 | `tmp/nr-shadow-evidence/nr-k3-common-initial-window-replay-v1-20261009/receipt.json` | `428922957c3b4f5ef052f4f024a0306a2090ff149fa3fd934fac0cf38236901d` |
| 独立审计 | `tmp/nr-shadow-evidence/nr-k3-common-initial-window-audit-v1-20261009.json` | `e144264d7c7dd33fa82f4d5bf71d7b99c1d2658b1a5962c50fba9872ad8fbf94` |
| 2002项回归 | `tmp/nr-common-window-regression-v1-20261009.xml` | `2c6131c97e5cbd6dc13c1e153095df6647088fb90bc439435fa89ad9860f5b7d` |
| 31项定向测试 | `tmp/nr-common-window-focused-v2-20261009.xml` | `fe3cdf96c52f9709303544ae9bd56442dba75adb69004729237391c55b57573c` |
| 14项审计测试 | `tmp/nr-common-window-audit-focused-v1-20261009.xml` | `1760e744ebe20b9ea23e8cfbddb7b49a35eb768f3b42f991e4013419eebf2e0f` |

首轮/回放耗时分别1199.9613/1167.6894秒，每批约661.452MiB，均在事前
2400秒/768MiB限制内。首轮含记录和预检平均每接受步约25秒，不是纯 RHS 吞吐。
结束时 C/E 可用约8.33/17.53GiB；用户底线 C>=3GiB、E>=4GiB+32MiB 保持不变。

## 下一门槛与不变的禁区

下一轮应事先冻结**同初值、同终点的至少三档步长**，先检查 CFL、资源预算
和误差可分辨性，再计算时间阶数；若仍低于原测量下限，就记录 UNRESOLVED。
随后做对应的空间/区域约束收敛，不能将 SBP(4,2) 直接宣称为全域四阶。
当前不需要据此启用持续投影。选定方法闭环后，才移植到对应 C++ 后端，
再推进物理边界、完整单黑洞、AMR、波形和 GPU。

旧失败回执、旧 native 二进制均保留；没有安装、清理、提交或发布。
physical/CPBC/black-hole/AMR/waveform/GPU/strong-hyperbolicity/long-time
准入均为 false；新方法 native checkpoint 未支持；
`runtime_writeback=false`、`scientificPayloadWriteback=false`。总 goal 仍在推进，未完成。

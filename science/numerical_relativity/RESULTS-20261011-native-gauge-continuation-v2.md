# N13续算至T=1/8完成：保存数据审计通过，时间阶数仍未整体分辨

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: explicitly authorized fixed continuation and independent saved-data audit
- Origin Date: 2026-10-11
- Verification Status: MATRIX AND SAVED-DATA AUDIT COMPLETE; TEMPORAL UNRESOLVED; SHADOW ONLY
- Version Label: nr-native-gauge-continuation-v2-results

## 结论

用户在v1中断后明确同意新建v2并保持原预算和全部阈值，随后才启动此批次。
三档均从已验收父末点T=1/16接续至T=1/8，新49步、196个RK阶段全部完成，
74次原生调用全部退出0。独立保存数据审计通过。运行器与审计器一致判定
整体时间阶数仍为`unresolved`：面区域由未分辨变为通过，但边区域由通过
变为未分辨。不能跨两个终点挑选通过项拼成整体通过。

本轮未修改396项冻结科研源码、原生二进制、初值、步长、规范、SBP/SAT/RK4
或验收门槛。新增的结果文档与事后只读分析位于该冻结集合之外，不回改科学
注册或实验回执。更早的52项组件控制、60项入口控制与208项旧控制均为继承
资格，本轮没有把它们加总或冒称重新执行。

## 运行与恢复链

原问题仍为N13、Schwarzschild外域[1,3]^3、G=c=mass=1、幅度.001的C5规范
脉冲，1+log/Gamma-driver、SBP(4,2)、解析目标SAT和无投影RK4均不变。
三档拥有共同T=0初值，但T=1/16恢复场包含不同离散误差，不是三个相同新初值。

| 档 | 父绝对步 | 新接受步 | 子末绝对步 | 不变dt | 共同终点 | 子RK阶段 |
| --- | --- | --- | --- | --- | --- | --- |
| 粗 | 7 | 7/7 | 14 | 1/112 | 1/8 | 28 |
| 中 | 14 | 14/14 | 28 | 1/224 | 1/8 | 56 |
| 细 | 28 | 28/28 | 56 | 1/448 | 1/8 | 112 |

25个局部计划包含24个两步段和1个单步段。49次检查点推进/恢复与25次原生
完整阶段复算共同产生证据，但不重复计为额外科学步。段内保持2→4线程新
进程恢复，阶段复算使用1线程；49个检查点端点与对应复算端点逐字节一致，
原始RK组合也逐字节成立。连同原父批次才是98步/392阶段，不包含v1未验收点。

运行从2026-10-11 09:34:29至09:59:50 +08:00。回执计时1519.531秒，外层
观测1521.171秒，约25.3分钟，低于原2400秒。审计从10:00:11至10:00:21，
外层观测10.404秒。两条命令退出码均为0；时间不是受控性能或加速比证据。

```powershell
& 'D:/python/python.exe' -B scripts/run-nr-k3-native-gauge-continuation.py --output-directory tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v2-20261011 --entry-test-gate tmp/nr-shadow-evidence/nr-k3-native-continuation-entry-controls-v1-20261010/qualification-gate.json --confirm-fixed-experiment
& 'D:/python/python.exe' -B scripts/audit-nr-k3-native-gauge-continuation.py --receipt tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v2-20261011/receipt.json --output tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v2-audit-20261011.json
```

工作目录为`E:/86137/myai/solar_sim/next-web`。使用E盘TEMP/TMP、禁止pyc写入，
BLAS环境线程数固定为1；科学程序的2/4线程由原生参数控制。

## 独立审计及其边界

独立审计检查878项子批次索引产物、857项父批次产物、396项当前/保存来源，
重新验证60项入口控制资格、原生程序/运行库、父连接和三档绝对终点。
从原始58槽重建全部196个RK阶段的几何与CFL，逐端点重建独立诊断，并重算
五区域时间阶数；49点均通过。最大诊断实现差为`4.062722380737682e-14`，
低于原`2e-12`；原始几何/CFL摘要最大差为`3.3306690738754696e-16`。

这些差值不是Einstein约束残差，也不是相对解析正时间解的物理误差。细档
全域独立Hessian约束范数随本次续算的变化为：

| 量 | T=1/16 | T=1/8 |
| --- | --- | --- |
| H_metric_hessian | 9.195261252894273e-4 | 9.609746455791668e-4 |
| M_metric_hessian | 4.185112901899376e-5 | 7.536201443636344e-5 |

同一终点三档约束范数接近，不等于约束场误差有同样上界；范数之差不能替代
场之差的范数。固定N13更不能证明空间或约束收敛。另一个离散H诊断
`H_metric=0.004586642243057864`保留，不与Hessian诊断混用或隐去两者差异。

新增T=1/16到1/8区间没有Python参考。审计不重算Einstein RHS，且没有从头
进行第二次完整科学回放：`rhs_recomputed=false`、`new_interval_python_parity=false`、
`exact_scientific_replay=false`。这些限制不因保存数据审计通过而消失。

## 五区域时间筛查

保留原分辨下限2e-13、允许阶数3.5..4.5。下表来自独立审计。量为原SBP
空间加权、58槽平方平均的整体状态差；不是58个变量逐项都达四阶的声明。

| 区域 | 粗/中差 | 中/细差 | 观测阶数 | 最小差/分辨下限 | 判定 |
| --- | --- | --- | --- | --- | --- |
| 全域 | 4.7792607588219995e-11 | 2.9842231055370737e-12 | 4.001360 | 14.921116 | passed |
| 中心 | 1.0445326296902903e-10 | 6.5219308925349005e-12 | 4.001415 | 32.609654 | passed |
| 面 | 3.9403640902334655e-12 | 2.4298213895674e-13 | 4.019407 | 1.214911 | passed，裕量有限 |
| 边 | 2.762393205701388e-12 | 1.6273454294332056e-13 | 不报告 | 0.813673 | unresolved |
| 角 | 1.3204407780598778e-11 | 7.793048937819438e-13 | 4.082688 | 3.896524 | passed |

边的细差低于预定下限：没有可靠可报告阶数，不是已证明降阶，也不是误差小
就可自动通过。面的细差仅高于下限约21.5%。旧T=1/16的面未分辨结论保留；
本次`temporal_screen_passed=false`、`status=unresolved`同样保留。

## 资源和原始证据

原832MiB/2400秒、32MiB收尾、单原生子进程120秒合同均未改变。最后879个
文件含最终回执，合计611824507字节，约583.48MiB；原保守上界848056576字节
低于872415232字节上限。C>=3GiB、E>=4GiB+32MiB底线持续执行，未清理旧文件。
子目录仍依赖完整外部父证据，不声称独立自包含。

- [完整续算回执](../../tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v2-20261011/receipt.json)：SHA256 `a7a7c8b7ebdc9447c31d4d70875e8b42f50a2a02d8b769a85457dce05e143583`。
- [独立保存数据审计](../../tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v2-audit-20261011.json)：SHA256 `60f60e1f989aabb2e987d44d74bf8a57bcf189b625ba9d66210ed2e3b8d1e40e`。
- [运行日志](../../tmp/nr-native-gauge-continuation-v2-20261011.log)：SHA256 `116231e7cd84c9f5390413c0a0535c5f8e28a91c0d879a8624339fe81264d489`。
- [审计日志](../../tmp/nr-native-gauge-continuation-v2-audit-20261011.log)：SHA256 `8fddf83f167eecbb77364d44133258191648190b46dbdd83090bd2480c10ca08`。
- [v1中断记录](RESULTS-20261011-native-gauge-continuation-interrupted.md)：422个旧文件全部保留，没有补造终止回执。v2与v1重合的两个检查点SHA一致，但不追认v1完成。

## 下一步与项目水平

这是可追溯的三维原生NR shadow研发原型取得的一次完整续算证据，不是成熟
科研生产求解器或世界前沿物理模型认证。现有外域小网格短窗没有覆盖长期
单黑洞稳定性、真实辐射/约束保持边界、AMR、视界、ADM/Psi4或双黑洞验收。

依据冻结协议，未分辨后不自动加倍终点、放大脉冲、降低下限或删区域。先做
[已保存状态的信号定位及下一验证设计](ANALYSIS-20261011-native-continuation-signal.md)，
再建立空间与独立约束收敛的控制合同。新的科学矩阵须另行冻结与确认预算。

physical_gate、live_admission、scientificPayloadWriteback、spatial_order_validated、
constraint_convergence_validated均false。美术和旧live EIH未动，整体goal保持未完成。

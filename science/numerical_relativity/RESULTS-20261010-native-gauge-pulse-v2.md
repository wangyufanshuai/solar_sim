# 原生三档矩阵完成：移植对照通过，整体时间收敛仍未分辨

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: authorized frozen-matrix execution and saved-state audit
- Origin Date: 2026-10-10
- Verification Status: MATRIX AND SAVED-STATE AUDIT COMPLETE; TEMPORAL UNRESOLVED; SHADOW ONLY
- Version Label: nr-native-gauge-pulse-v2-result

## 结论与授权

用户明确回复“同意”，解除此前“仅控制测试”的限制后，才启动全新的原生v2批次。
N13、7/14/28步全部完成，49个端点接受，196个RK阶段保存并审计。原生程序与
Python首轮的49端点、58槽、五区域对照通过；整体时间收敛仍为`unresolved`。
这关闭了本问题的完整原生矩阵及保存数据审计门槛，不是单黑洞物理验收或前沿
求解器认证。所有旧失败/中止保留，没有自动重跑、追认或放宽门槛。

本轮没有修改方程、参数、运行器、审计器、测试、已资格化二进制、legacy EIH
或美术层。383个源文件在运行前后及保存快照中一致；文档更新位于该冻结集合之外。
输入仍为已通过的v6控制报告：208项，并非本轮又重跑208项。

## 实际执行

固定问题：Schwarzschild外域`[1,3]^3`、`G=c=mass=1`、振幅`.001`的规范脉冲；
原1+log/Gamma-driver、SBP(4,2)、解析目标SAT、无投影RK4均不变。

| 时间档 | 网格 | 步长 | 接受/计划步数 | 局部计划数 | 保存/审计RK阶段 | 共同终点 |
| --- | --- | --- | --- | --- | --- | --- |
| 粗 | 13³ | 1/112 | 7/7 | 4 | 28 | 1/16 |
| 中 | 13³ | 1/224 | 14/14 | 7 | 56 | 1/16 |
| 细 | 13³ | 1/448 | 28/28 | 14 | 112 | 1/16 |

74次真实原生调用全部退出0：49次检查点推进，加25次独立进程阶段轨迹复算。
25个局部计划包含24个两步段和1个单步段；前驱状态从持久化文件读取。段内
检查点进程按2→4线程推进/恢复，阶段轨迹程序使用1线程。49个检查点端点与
对应原生阶段轨迹逐字节一致，原始RK组合也逐字节成立。这不是一次新的全矩阵
逐位回放，更不证明任意线程数、任意问题或掉电恢复均成立。

工作目录为`E:/86137/myai/solar_sim/next-web`，实际运行入口：

```text
D:/python/python.exe -B scripts/run-nr-k3-native-gauge-pulse.py
  --output-directory tmp/nr-shadow-evidence/nr-k3-native-gauge-pulse-v2-20261010
  --test-report tmp/nr-native-campaign-tests-v6-20261010.xml
  --test-receipt tmp/nr-shadow-evidence/nr-k3-native-campaign-tests-v6-20261010/receipt.json

D:/python/python.exe -B scripts/audit-nr-k3-native-gauge-pulse.py
  --receipt tmp/nr-shadow-evidence/nr-k3-native-gauge-pulse-v2-20261010/receipt.json
  --output tmp/nr-shadow-evidence/nr-k3-native-gauge-pulse-v2-audit-20261010.json
```

两个入口均退出0。完整运行回执计时1470.078秒，外层进程观测1472.994秒，约
24.5分钟，未触及2400秒上限；保存数据审计外层观测8.238秒。时间只描述本次
执行，不是受控跨后端性能测试，不能由此宣称OpenMP加速比。

## 独立保存数据审计与Python对照

独立审计核对857个索引产物、383个当前/保存源文件、初值/边界、计划前驱、
49个检查点、25份完整无损RK轨迹和全部196个阶段；从原始58槽逐阶段重建几何量
与CFL，逐端点（另含每档初值）重建H/M诊断。独立诊断最大绝对差
`4.4162590251417555e-14`，低于原`2e-12`；
原始状态摘要最大绝对差`4.440892098500626e-16`。

这些差值是两种诊断实现之间的差，不是Einstein约束残差本身。细档全域H范数
从`9.0493896493515e-4`到`9.195261252894273e-4`，M从0到
`4.185112901899376e-5`；本次固定空间网格，不能据此证明独立约束收敛。

运行器对49个原Python端点做逐槽/区域归一化比较，最大差为
`2.2204459099313105e-16`，低于原`2e-11`门槛。随后只读复核重新读取两端
原始数组、校验来源摘要并重算全部区域比较，与保存的比较数组完全一致：

| 区域 | 49端点/58槽中的最大归一化差 |
| --- | --- |
| 全域 | 2.2204459099313105e-16 |
| 中心 | 2.2204459099313105e-16 |
| 面 | 2.220445829733557e-16 |
| 边 | 2.2204457081950492e-16 |
| 角 | 2.1641691802347374e-19 |

Python与原生端点逐位相同数是**0/49**；这是容差内移植一致性，不是逐位相同，
更不是对另一套独立Einstein RHS或解析正时间解的物理误差验证。

审计器本身不重算RHS、测试入口或Python端点对照；其`rhs_recomputed`、
`test_gate_revalidated`、`python_endpoint_parity_recomputed`保持false。上面的
测试入口重验和Python数组复核是独立的事后只读检查，没有改写审计输出。
`exact_scientific_replay=false`；旧Python完整回放仍未完成。

## 时间收敛：四区域通过，一区域未分辨

原分辨下限`2e-13`、允许阶数`3.5..4.5`不变。独立审计重算的结果为：

| 区域 | 粗/中差 | 中/细差 | 观测阶数 | 最小差/分辨下限 | 判定 |
| --- | --- | --- | --- | --- | --- |
| 全域 | 1.936239301448974e-11 | 1.2406187886187399e-12 | 3.964125 | 6.203094 | passed |
| 中心 | 4.221421849299507e-11 | 2.7056569558229814e-12 | 3.963678 | 13.528285 | passed |
| 面 | 2.640326364668833e-12 | 1.6248947618721688e-13 | 不报告 | 0.812447 | unresolved |
| 边 | 3.9587098275282114e-12 | 2.313089412797844e-13 | 4.097137 | 1.156545 | passed，裕量小 |
| 角 | 1.7803558060372728e-11 | 1.0447992351896721e-12 | 4.090868 | 5.223996 | passed |

面的细差低于原分辨下限，因此没有可报告的有效阶数；不是已观察到降阶，也
不是“误差小所以自动通过”。边仅高于下限约16%，不能忽略分辨裕量。总体
`temporal_screen_passed=false`、`status=unresolved`，与旧Python问题的边界一致；
不把另一个初值问题的面区域通过结果拼接到本问题。

## 资源、身份与证据

开始前C可用`7145148416`字节，E可用`22653206528`字节；高于C>=3GiB与
E>=4GiB+32MiB，且E额外留足832MiB整批预算。未压缩保守上界仍为
`814502144`字节，输出上限`872415232`字节，保留32MiB收尾空间；未清理文件。

最终批次858文件（含回执），`592536636`字节；加独立审计JSON和两份执行日志
合计`592552592`字节，约565.10MiB。没有因压缩节省空间而扩步或删减阶段数据。

- [完整矩阵回执](../../tmp/nr-shadow-evidence/nr-k3-native-gauge-pulse-v2-20261010/receipt.json)：
  SHA256 `6cc32e3c34d4a86ac6f1a6e75bf596e5ae1cb4c120dd95210f23df72d2359341`。
- [独立审计](../../tmp/nr-shadow-evidence/nr-k3-native-gauge-pulse-v2-audit-20261010.json)：
  SHA256 `35cc5a9beb5aa2f219099339941c38f7f3ff26fb584694bd158f11eb21a07537`。
- [运行日志](../../tmp/nr-native-gauge-pulse-v2-20261010.log)：
  SHA256 `53a43b6bf0ea285afc656e080eeed09c8449662a2469010a673fec182b6a1d28`。
- [审计日志](../../tmp/nr-native-gauge-pulse-v2-audit-20261010.log)：
  SHA256 `88d3953ee49e35e2a818689c99aa60b1e243d06ee149e853db2e57e7f6ec778c`。
- 全局计划SHA256 `c023567331ddd1eac3dda637b16a25ecf5afa3129c6603f24d525ddd55761618`；
  383文件来源表SHA256 `b03d9e2848d20fc8a54000b0f0e956aae32057a84ddf5198c68fce03abec8847`。
- 原v1启动失败回执仍为
  `047ced6d50656aa9ec8d02b61c09a233fc58bca5248bd45842ad8a065d3244c9`。

## 下一门槛

本批没有授权live晋级。`physical_gate=false`、`live_admission=false`、
`scientificPayloadWriteback=false`；AMR、波形、GPU与整体goal均未验收完成。

下一主线仍是：先为可分辨时间误差另立前瞻问题与预算，保持本批原始结果不变；
再做共同物理初值的空间与独立Hamiltonian/动量约束收敛。不得为取得通过而
降低分辨下限、删除面区域、沿用本批结论宣称新参数已验，或直接跳到双黑洞/GPU。
长期单黑洞稳定性、真实外边界、AMR、非零波形、外部代码复现与最终live准入
仍需各自证据。本轮没有启动另一批物理实验。

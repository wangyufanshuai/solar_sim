# Schwarzschild 约束相容规范脉冲：初值与动态时间筛查

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: deterministic gauge-pulse evolution and independent saved-state audit
- Origin Date: 2026-10-09
- Verification Status: PRIMARY AND TIMEOUT PREFIX AUDITED; FULL REPLAY INCOMPLETE; AGGREGATE UNRESOLVED
- Version Label: nr-schwarzschild-gauge-pulse-v1

## 本轮新增内容

新增独立科研初值组件`fo_ccz4_gauge_pulse.py`、实验运行器、独立审计器及三组测试。
物理三度量与K_ij保持原静态各向同性Schwarzschild数据不变，只修改log-lapse
及其三个解析梯度槽位。脉冲幅度0.001，支撑[1.25,2.75]^3，C5多项式拼接。
这不是旧扰动的代数投影，不是椭圆初值求解，也不是物理引力波注入。

这样设计的依据是Hamiltonian/动量约束不含lapse和shift，见
[Gourgoulhon第2.1节](https://arxiv.org/html/0704.0149v2)。
GitHub固定提交的[GRChombo约束接口](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/NewConstraints.hpp)
也使用无规范变量的几何输入。没有复制外部代码或宣称外部代码复现通过。

保存的真实初值经独立因式分解公式核验，脉冲最大差6.94e-18，静态参考
最大差3.33e-16；未修改的54槽及六面初值逐字节一致。初始离散H仍有原
空间截断误差，没有填零。连续初值相容不意味着离散演化约束自动保持。

## 验证与方法边界

新定向测试84项通过，独立审计专项33项通过；完整继承回归72个文件，
2126 passed / 42.95秒。84和33均为2126的子集，不相加；这些不是2126个
物理基准。六个新Python文件Ruff通过。保留原pytest异步循环范围的弃用警告。

实际演化沿用既有3D FO-CCZ4体积RHS、SBP(4,2)、六面静态解析入射目标及RK4，
无投影。沿用advective 1+log和实验性的场依赖Gamma-driver/ordering系数
f=3 alpha chi、mu=0.2 chi，不是本轮验证了全部规范参数或连续强双曲性。
此正八分体区域不包含完整黑洞/视界；静态边界目标不是物理辐射边界。

N13、7/14/28步均从新初值开始，到同一T=1/16M。时间筛查仍采用五区域、
2e-13固定测量下限、3.5–4.5阶范围；计算完成、精确复现、局部时间筛查和
物理准入必须分开报告。`state_error`旧字段只表示相对静态背景的离开量，
不是新规范下已知精确正时间解的误差。

## 数值结论

首轮三档均完成49步/196个RHS阶段，独立保存数组审计通过；另一个进程的
回放因磁盘储备不足中止；获准恢复后的新批次又触及原40分钟上限，均未完成
完整精确复现。后一次前缀已独立审计，详见后文。首轮五区域时间自收敛如下：

| 区域 | 粗-中差 | 中-细差 | 较小差/2e-13 | 观测阶数 | 分类 |
| --- | ---: | ---: | ---: | ---: | --- |
| whole | 1.93623930112e-11 | 1.24061879113e-12 | 6.2031 | 3.96413 | passed |
| central_box | 4.22142184900e-11 | 2.70565696426e-12 | 13.5283 | 3.96368 | passed |
| faces | 2.64032636372e-12 | 1.62489478310e-13 | 0.81245 | null | unresolved |
| edges | 3.95870982738e-12 | 2.31308940695e-13 | 1.15654 | 4.09714 | passed |
| corners | 1.78035580616e-11 | 1.04479923825e-12 | 5.2240 | 4.09087 | passed |

整体仍为unresolved，temporal_screen_passed=false。尤其边区域仅略高于
分辨下限，不能把形式上的passed说成分辨裕量充分。边界面不能报阶数。
旧共同初值扰动问题也仍为unresolved；不能把旧问题通过的faces和新问题通过的
central_box拼成某一个问题的全区域通过，更不能合并成全局物理准入。

三档初始全域Hamiltonian范数H（度量Hessian重建）均为9.0493896493515e-4，初始M为0；最终H约
9.1952612e-4，M约4.185113e-5。约束残差并未因时间加密消失，本轮没有测量
这些残差的空间收敛。初始M为零，不计算相对百分比增长。

最粗档最大CFL为0.24286522230501342，最大阶段det误差1.7423840148467207e-12；
三档最大特征残差2.2705329188961697e-13，最大基条件数24.200237618746282。
所有原阶段门槛保持不变。独立诊断最大差4.4162590251417555e-14，保存的
raw RK组合逐字节一致；独立时间范数最大相对差1.81490365948577e-16。
这些是算术/诊断一致性，不是对真实Einstein解的绝对误差保证。

首轮耗时1618.7335秒，706914640字节；1032个受审计产物，加回执共1033个文件，
其中689个数组。345个源码键对应343个不同文件。回执SHA256为
`ffa0b0a5e81388138daa835508a1ec3cbd74c87f718a0043931c542f86546ee0`；
首轮独立审计SHA256为
`d7f2131088d1059b17df260030773a69a3153d073f26872193ff0a4a5216d28d`。

## 历史：首个回放的磁盘中止与保留记录

独立进程回放在297.1189秒后以资源错误退出，`completed=false`、
`matrix_executed=false`；错误为`ResourceLimit: C/E storage reserve reached`。
粗档7/7步完成，中档3/14步接受（最后接受T=0.013392857142857142M），
细档0/28未启动，共保留10个接受步及部分阶段数组。这不是完整回放通过。

回放目录保留492个文件、154367651字节，其中148个数组，清单列出491个产物。
只读哈希核对显示：所有已保存产物均符合清单，并匹配首轮的对应产物；
345个源码键/343个不同文件无漂移。这个结论仅为不完整前缀的文件一致性，
不是完整回放、独立数值审计或物理验证。未在低于磁盘底线时运行数值审计。
回放回执SHA256为
`8f3756543341065883ad64ba515d119647f3163e5193161936ef25e325931133`。

中止后首次数值为C约7.82GiB、E约3.81GiB；本次文档收尾的只读检查为
C约7.78GiB、E约3.80GiB。E低于原定4GiB+32MiB底线；C的3GiB底线不变。
E此前约13.38GiB，回放保留目录仅约147MiB，不能单凭该目录解释全部余量变化；
本轮未调查其他进程或归因。未清理任何文件、降低阈值或自动重试。

启动另一个完整回放前，按原768MiB批次预算，E应至少有
4GiB+32MiB+768MiB=4.78125GiB空闲（向上取4.79GiB并建议另留余量），
同时C>=3GiB。须等用户处理空间并确认，再核对源码与预算，使用新输出目录；
当前中止批次原样保留，不能续填后伪称为完整单进程复现。

## 获准恢复后的新回放：时间中止，不是数值失败

用户处理空间并确认恢复后，按原底线复查C约10.01GiB、E约16.94GiB，
先重跑测试：定向84项、完整72文件2126项、审计专项33项均通过。
84/33仍是2126的子集；报告写到新的recovery路径，未覆盖旧报告。
完整回归控制台93.91秒，六个原脉冲Python文件Ruff通过；保留pytest配置警告。

新批次`nr-k3-schwarzschild-gauge-pulse-replay-v2-20261009`使用相同原方程、
初值、三档步长、原2400秒/768MiB预算和原冻结测试身份，没有延长时限。
它在2421.8052秒后以`2400s absolute common-initial window deadline reached`
结束；检查位于阶段边界，所以总耗时略超过2400秒，不代表新增预算。
已确认无该批次存活进程，未自动重试。

粗档7/7、中档14/14、细档20/28接受，共41步；细档最后接受T=0.04464285714285714M，
在第21步尝试期间中止。completed=false、matrix_executed=false，没有时间筛查输出。
这是资源超时而不是物理方程或数值门槛失败，也不能视为完整精确回放通过。

在余量高于原底线时，对这一不完整批次执行独立保存数组审计：
audit_completed=true，345个源码键、931个产物全部检查通过；
三档H/M独立诊断最大差4.4162590251417555e-14，已接受raw RK组合逐字节一致。
细档另检查11个部分阶段数组，结果仅为prefix-only；没有补造未执行的时间筛查。
另行只读比较显示931个产物均匹配首轮同名产物，没有差异或缺项。
exact_replay_except_root_seconds仍为false，所有物理门槛保持false。

新批次回执SHA256：
`eede80e3c9015a69d1cd7e91b3d9e2ad739ca529b4b1eff4356f6919622833f3`。
超时前缀独立审计SHA256：
`8f15e5bcb87cd06a210d8030a42977b05fb11639396b68ed28b828a7b4bfb2e5`。

用户随后明确选择**先推进C++对等移植**，而不是另立60分钟Python回放预算。
当前磁盘阻塞已解除，旧磁盘失败与新超时记录均保留；不再以历史低余量状态
描述当前环境。本批之后的原生组件进展见
[谱分解组件](RESULTS-20261009-native-characteristic-component.md)与
[原生FO主部](RESULTS-20261009-native-fo-principal-component.md)，不能替代本问题的
完整回放、可分辨全区域时间误差、空间/约束收敛或科学准入。

## 证据入口

- 合同：[EXPERIMENT-20261009-schwarzschild-gauge-pulse.md](EXPERIMENT-20261009-schwarzschild-gauge-pulse.md)
- 定向测试：`tmp/nr-gauge-pulse-focused-v2-20261009.xml`
- 完整继承回归：`tmp/nr-gauge-pulse-regression-v1-20261009.xml`
- 独立审计测试：`tmp/nr-gauge-pulse-audit-focused-v1-20261009.xml`
- 首轮输出目录：`tmp/nr-shadow-evidence/nr-k3-schwarzschild-gauge-pulse-v1-20261009/`
- 首轮独立审计：`tmp/nr-shadow-evidence/nr-k3-schwarzschild-gauge-pulse-primary-audit-v1-20261009.json`
- 资源中止回放：`tmp/nr-shadow-evidence/nr-k3-schwarzschild-gauge-pulse-replay-v1-20261009/receipt.json`
- 恢复后超时回放：`tmp/nr-shadow-evidence/nr-k3-schwarzschild-gauge-pulse-replay-v2-20261009/receipt.json`
- 超时前缀独立审计：`tmp/nr-shadow-evidence/nr-k3-schwarzschild-gauge-pulse-timeout-prefix-audit-v1-20261009.json`
- 恢复测试：`tmp/nr-gauge-pulse-focused-recovery-v1-20261009.xml`、`tmp/nr-gauge-pulse-regression-recovery-v1-20261009.xml`、`tmp/nr-gauge-pulse-audit-recovery-v1-20261009.xml`

最终测试报告SHA256：

| 报告 | SHA256 |
| --- | --- |
| 定向84项 | `c96778c445cf75ea0ce476ecbc21f005c0ecd0dc21aef83befd437655d67cfaf` |
| 完整2126项 | `cd07fad70d6be90b776086388f980f755129c4c7cbb03feeed0d8d7cd03b02c9` |
| 审计专项33项 | `9a62d2367ee7074b9de01b40128ff021dc9bc5fc69ff9755745161b580e53017` |
| 恢复定向84项 | `e5f2a9b299159b1c35a2c8186120b9c9c448eda4e58e49506bd295af4113c9d1` |
| 恢复完整2126项 | `7d132e2462dd67d3904c70ce2875111f88f1a4a71ad4ae4ca3fcc31ffe5857f7` |
| 恢复审计33项 | `36da0b86676aa5df3d75064ba3178b73ad867f2c9b8282f162d7004d92ddea19` |

## 不变边界与后续

没有修改旧方程、原生后端、app或美术；没有切换live或写回科学payload。
所有物理/边界/AMR/黑洞/波形/GPU准入仍false，总目标未完成。
本批首轮已完成并审计，完整回放仍缺失；失败前缀不自动重试。
按用户最新选择，先完成对应方法的C++移植和跨后端一致性，再拟定后续预算。
仍需这个物理初值相容问题的可分辨全区域时间筛查、空间/约束收敛、适当边界
及更长演化。新问题不能自动关闭旧问题不可分辨的门槛。

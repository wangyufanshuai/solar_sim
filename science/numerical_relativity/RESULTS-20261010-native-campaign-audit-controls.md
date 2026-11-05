# 原始状态审计控制：v6测试与科研报告入口均通过

> 本文保留v6控制批次结果。随后用户明确同意恢复完整矩阵，新原生v2已完成
> 49步和独立保存数据审计，但整体时间收敛仍未分辨；见
> [完整原生v2结果](RESULTS-20261010-native-gauge-pulse-v2.md)。控制报告本身不追认物理通过。

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: bounded control-test recovery and source-linked artifact verification
- Origin Date: 2026-10-10
- Verification Status: 208 CONTROL TESTS PASSED; RUNNER TEST-INPUT GATE ACCEPTED; SHADOW ONLY
- Version Label: nr-native-campaign-audit-controls-v6

## 结论与本轮授权

用户完成空间处理后，仅授权恢复原64MiB/600秒运行器控制测试；在v5报告被拒收后，
再次以“继续”确认新建v6控制批次。完整N13物理矩阵仍明确暂缓。v6与v5及中止的
v4使用完全相同的五个源文件；没有改变方程、阈值、原生二进制、legacy EIH、美术
或科学准入。没有覆盖或删除任何旧批次。

v6 **85项运行器/审计控制 + 123项参考回归 = 208项全部通过**，零失败、错误、
跳过。原生五步链、故障接受前缀和新增的原始状态/完整回执入口控制已重新执行。
随后直接调用未修改的科研运行器 `verify_tests`，新XML及当前源码绑定回执均被
接受。关闭的是本轮控制测试的报告入口问题，**不是完整物理实验或科学准入**。

v5此前虽然208项断言通过，但启动未固定pytest根目录，XML模块名多出
`solar_sim.next-web.` 前缀，被严格入口拒收。v6使用独立本地配置、显式rootdir
和confcutdir，并清空本次进程的PYTEST_ADDOPTS；先只收集并验证全部208个唯一
节点及五个预期模块，再正式运行。原v5报告不裁剪、不改写，入口校验不放宽。

## 本次确认的审计修复

此前只核对报告中的det上限，负数报告可能被接受。保留的旧v2审计器反例证明：
同步把端点两份det误差报告改为-1、完全不改状态数组，旧审计器接受，新审计器
拒绝。这是报告核查缺口，不代表观察到原生方程实际产生非法状态。

当前审计器直接从全部58槽的保存状态独立重建：

- 正定三度量、行列式、lapse和chi；
- 六个特征速度族的逐轴最大值及CFL；
- 端点归一化A/D迹与det残差。

新增36项控制包含伪造摘要、负残差、真实非法状态、解析各向异性CFL锚点、原物理
上限附近的拒绝测试，以及完整审计入口的来源/预算/准入/登记篡改测试。
报告比较容差仍为2e-12，实际det<=1e-10与CFL<=.25*(1+1e-14)门槛不放宽。
这不是另一套独立Einstein RHS演化算法，也不建立非线性稳定性或物理收敛。

| 实际控制 | 原生发布点 | 接受点 | 保存RK阶段 | 独立约束诊断最大绝对差 | 原始状态摘要最大绝对差 |
| --- | ---: | ---: | ---: | ---: | ---: |
| N9五步链，2+2+1步，dt=1/1024 | 5 | 5 | 20 | 9.5513874587283e-15 | 1.6322651088773745e-22 |
| 第二端点诊断故意失败 | 2 | 1 | 8 | 5.0147467558700476e-15 | 1.1274859530377393e-24 |

两组原始RK算术均逐字节成立；11次真实原生子进程调用退出0。第二组的诊断失败
由测试明确注入，上层拒绝接受第二端点。不能把7个原生点拼成科学物理轨迹。

完整回执入口另使用N13解析初值和三个全部未尝试的案例登记夹具：核对383个
源文件与388个夹具产物，审计演化步数为0。它不执行N13演化，明确返回
`physical_experiment_completed=false`、`test_gate_revalidated=false`、
`python_endpoint_parity_recomputed=false`。入口夹具通过不是完整科学批次通过。

## v6证据与恢复范围

- 测试报告：`tmp/nr-native-campaign-tests-v6-20261010.xml`。
  SHA256 `fb37550a182c1440f1a406eab2332f076d59f9874a4de26cd88cdc32fe684e04`。
- 测试回执：`tmp/nr-shadow-evidence/nr-k3-native-campaign-tests-v6-20261010/receipt.json`。
  SHA256 `d9978b2bde802d96281a971a0e831a38555ef1851da270d9644abaf468c9142a`。
- 真实入口与来源复核：`tmp/nr-native-campaign-tests-v6-20261010-gate.json`。
  SHA256 `c9173f3cc9e6c6cbbe555490888aa214c6514699f4b15dbcd1ab7f7626591735`。
  `runner_test_input_accepted=true`，physical/live/writeback仍为false。
- 851个索引产物逐项校验通过，无遗漏或额外文件；加回执852文件、37018789字节。
  全部报告、配置、收集日志及pytest临时文件一并计入，共37084669字节，低于64MiB。
  五个直接源文件前后/快照/当前一致；383个完整来源、原生程序与运行库身份未变。
- 208项模块分布仍为85/27/28/5/63；收集检查2.40秒，未执行fixture或原生计算。
  正式XML时间113.900秒，fixture112.203秒，外层监控115.484秒，退出0，未超600秒。
  这些耗时不构成跨后端性能或加速比证据。
- 17个原始产物与v5逐字节一致：7个检查点、4个局部计划、4份无损压缩RK轨迹、
  2份注册夹具初始数组。五步控制、故障控制和注册夹具的三个审计JSON也逐字节一致。
  对照范围仅是这两组受限控制和零演化夹具，不是完整科学矩阵回放。
- v6同时保存完整pytest输出：`tmp/nr-native-campaign-tests-v6-20261010.log`，
  SHA256 `3f9e85e1ff9128abc07465ad4f794ce2069ea0c7dcc33decc28542f417ce0f3b`。
  存在未配置asyncio默认fixture作用域的插件弃用警告；本组没有异步测试，208项
  均实际执行且无跳过，未为消除警告改变冻结测试源码或安装依赖。

本次启动边界参数为：

```text
-c E:/86137/myai/solar_sim/next-web/tmp/nr-native-campaign-tests-v6-20261010.ini
--rootdir=E:/86137/myai/solar_sim/next-web
--confcutdir=E:/86137/myai/solar_sim/next-web
```

配置只含显式`[pytest]`与空`addopts`；SHA256为
`8d43f0cac69f063682eaec323c6e432d399d0d98254da976979e39f5f26e08db`。
收集日志为`tmp/nr-native-campaign-tests-v6-20261010-collect.log`，SHA256为
`3ee36f5b4fb837d01db8f767d4216791f1fc7298cce048a5d25038687dcee688`。
五个测试文件、禁写pyc/pytest缓存、单线程Python库及原生1/2/4线程合同均与v5相同；
输出、XML和basetemp分别改为全新v6路径。完整实际参数记录在正式日志首行。
本地配置只约束测试启动，不改变NR源文件/科学合同；其身份由上述运行日志和
事后入口复核单独记录，没有给已有科学源闭包偷偷增加或移除条目。

本轮开始时C约6.87GiB、E约21.29GiB；复核时C约6.67GiB、E约21.16GiB，
仍在原底线以上。没有清理文件、放宽预算或启动完整N13矩阵。

## 历史v5证据与执行条件（原报告仍被拒收）

- 测试报告：`tmp/nr-native-campaign-tests-v5-20261010.xml`。
  SHA256 `206ad10e1871e062fd1dcc809a56e8268af081bc71e4d0bfef5e86ee3ff713ac`。
- 测试回执：`tmp/nr-shadow-evidence/nr-k3-native-campaign-tests-v5-20261010/receipt.json`。
  SHA256 `1a8d6df2aebd2b8485cad7cb4c0d0296a4b6dfe82090d6d93fa8f66fdb4afef1`。
- 851个索引产物，加回执共852个文件、37018788字节；逐项SHA核对无差异，
  无未登记额外文件。五个源文件的执行前、执行后、保存快照及当前内容一致；
  已资格化原生程序、运行库和378个继承源文件身份未变。
- 模块分布：运行器85、非线性SBP27、规范脉冲28、manifest5、auxiliary manifest63。
  XML时间199.105秒；fixture182.312秒；启动监控墙钟206.125秒，退出0。
- `tmp/nr-native-campaign-tests-v5-20261010.log`只保留启动监控的PID/退出摘要，
  不含完整pytest标准输出；通过项数以完整XML为依据，不将该日志称为完整测试日志。
- 用户确认恢复时C约7.13GiB、E约14.75GiB。测试全过程保留C>=3GiB、
  E>=4GiB+32MiB与启动额外64MiB预算检查；临时文件、产物和报告均在E盘。

实际pytest参数（外层监控600秒硬时限；本条不是完整物理运行器命令）：

```text
D:/python/python.exe -B -m pytest -q -x -p no:cacheprovider
  scripts/tests/test_nr_native_campaign.py
  science/numerical_relativity/test_fo_ccz4_sbp_nonlinear.py
  science/numerical_relativity/test_fo_ccz4_gauge_pulse.py
  science/numerical_relativity/test_manifest.py
  science/numerical_relativity/test_auxiliary_manifest.py
  --basetemp=tmp/nr-native-pytest-v5-20261010
  --junitxml=tmp/nr-native-campaign-tests-v5-20261010.xml
```

`NR_NATIVE_CAMPAIGN_TEST_EVIDENCE`指向上述新v5证据目录；禁写pyc和pytest缓存，
TMP/TEMP位于仓库tmp，Python的OPENBLAS/OMP/MKL线程数固定1。原生测试仍按
合同显式使用1/2/4线程。入口实际拒收信息为 `new controls plus four reference modules required`。

## 旧失败与中止记录：不追认、不合并通过数

| 批次 | 原始结果 | 原因与保留边界 |
| --- | --- | --- |
| v2 | 历史172项通过 | 旧审计缺少原始状态摘要独立核查；不代表当前修复已验 |
| v3 | 68通过、1失败 | 解析CFL测试夹具使用NumPy标量，被严格普通数字类型校验拒绝；v4只把夹具显式转为float |
| v4 | 24通过、1失败、1收尾错误 | E盘跌破原底线，计算与最终回执写入均被拒绝；不是方程阈值失败 |
| v5 | 208通过，科研报告入口拒收 | 模块名多出根目录前缀；原XML与回执保持不动，不追认为入口通过 |
| v6 | 208通过，科研测试报告入口接受 | 用户确认后固定启动边界重验；未改方程/阈值，未运行完整物理矩阵 |

v3 XML SHA `748060cbf84336ad56c81618fc9f866b1058b248c17b315dcf891bce153d9dfd`；
v3回执SHA `0e17ec3925f5a9fecd52aa10f803b9068a8ede76628f9cd9112173fee052429f`。
v4 XML SHA `1291b20bafe6ca3b78c3a0151b7af02f8a9c616c6713ee55d7fd9b2f70620b11`。
v4证据目录仍是61文件、21593161字节，**不存在最终receipt.json**；本报告只是
恢复后的事后说明，没有给原目录补造回执或重新评级。磁盘空间骤降的具体外因未查明。

## 仍未完成

v6控制批次按当时授权止于控制验证。之后用户已单独同意恢复矩阵；新原生v2在
原832MiB/2400秒预算内完成N13三档、独立保存数据审计与Python逐端点对照，
见页首新报告。旧Python超时回放、faces未分辨问题、空间/独立约束收敛、黑洞
长期稳定、真正物理边界、AMR、非零波形、GPU与外部复现仍未关闭。
所有physical/live/writeback准入保持false，整体goal未完成。

# N13续算完整入口：60项控制通过，科学长跑待确认

后续状态（2026-10-11）：用户已确认并启动v1，但它在首段独立复算前缀
中断，未留下最终回执或新增验收步。详见
[独立中断记录](RESULTS-20261011-native-gauge-continuation-interrupted.md)。
用户再次确认后，独立[v2批次已完成和审计](RESULTS-20261011-native-gauge-continuation-v2.md)，
整体时间筛查仍为unresolved。下文保留本控制批次结束时的历史状态，
不将后续运行启动改写成科学完成。

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: bounded full-entry qualification and read-only evidence verification
- Origin Date: 2026-10-10
- Verification Status: VERIFIED FOR ENTRY CONTROLS; NEW SCIENTIFIC EVOLUTION NOT EXECUTED
- Version Label: nr-native-continuation-entry-controls-v1-results

## 本轮完成

已补齐完整N13三档续算的科学入口、固定注册、父/子来源快照、控制资格接入、
绝对时间分析、失败前缀计数和完整回执独立审计。新增60项控制全部通过、
零跳过。没有新增原生轨迹，没有新T=1/8物理结果。

该入口使用已资格化续算组件，不改变Einstein RHS、规范、解析SAT、SBP/RK4、
物理参数或验收阈值。原383项科研来源及上轮389项组件来源均未改动，新增
7项入口/协议/测试来源，总计396项。旧面的unresolved结论及旧失败保留。

## 测试覆盖与限制

- 完整注册fixture包含真实固定父级、共同T=0初值、三档末检查点及来源快照，
  但新演化为0。只有显式fixture审计入口可检查它；默认科学审计拒绝它，
  不能由“注册审计通过”推导“物理实验完成”。
- 25种完整回执/注册篡改即使同步重算摘要，也被拒绝，包括时间、案例、预算、
  父依赖、源码、准入、完成声明、假时间分析、遗漏快照和混算父子步数。
- 合成数组仅验证时间阶数算法的passed/unresolved/failed分类、原2e-13下限、
  3.5..4.5阶数区间，以及T=1/8绝对终点；不是物理时间收敛证据。
- 检验三档未齐、非有限数组或终点不一致时拒绝分析；检验测试XML缺失、
  重复、跳过、错误模块及失败；检验旧组件资格漂移、禁止覆盖和未确认CLI。
- 合成调用故障检验首个失败后停止后续案例、父49步不计入新增。真实非零起点
  及真实故障前缀仍引用上轮52项组件控制，本轮不冒称重新执行。

这是测试层和完整入口的工程资格；真正N13演化及其完整成功/失败回执审计，
仍需下一次获确认的科学批次执行后才能核验。

## 资源与复核

| 项目 | 实测 |
| --- | --- |
| 新测试 | 60 passed，0 skipped |
| pytest时间 | 45.03秒 |
| 外层批次时间 | 48.766秒，上限600秒 |
| 新产物 | 819文件，818索引产物 |
| 占用 | 22653190字节，约21.60MiB，上限64MiB |
| 当前来源 | 396项；3535117字节，低于4MiB快照限额 |
| 科学批次父快照 | 13080144字节，低于32MiB预留 |
| 科学批次保守上界 | 848056576字节，低于原872415232字节预算 |
| 新原生调用/科学步数 | 0 / 0 |

批次后只读复核已完成：完整818项产物/396项来源重验，注册fixture审计重算
与保存结果一致；科学运行器及独立审计各自接受新的60项测试资格；三档父
检查点由两条验证路径重新读取。没有因复核创建新的科学批次或数值轨迹。
C/E底线不变，未清理、移动或覆盖旧数据。

## 证据

- [完整入口资格回执](../../tmp/nr-shadow-evidence/nr-k3-native-continuation-entry-controls-v1-20261010/qualification-gate.json)，
  SHA256 `8d313d07a7bcc72ca066124c921c6701356b02e6d14282166887fa5ea8b332f2`。
- [测试XML](../../tmp/nr-shadow-evidence/nr-k3-native-continuation-entry-controls-v1-20261010/tests.xml)，
  SHA256 `62453a07466d8e2d6ad481fb947f7c45f7bfc2915079b085aadb94eaf4ec6626`。
- [测试日志](../../tmp/nr-shadow-evidence/nr-k3-native-continuation-entry-controls-v1-20261010/pytest.log)，
  SHA256 `eb45e71921b285ed1ebac6aecb9f1da2d5631bacd8a15d7bc5637e17849ba8ac`。
- [零演化注册审计](../../tmp/nr-shadow-evidence/nr-k3-native-continuation-entry-controls-v1-20261010/registration-fixture-audit.json)，
  SHA256 `4021320be783b2223b456c84d36e9dad2dc3f21bcb00bc4b03a7bd5aca55642a`。
- [冻结协议](EXPERIMENT-20261010-native-gauge-continuation.md)、
  [科学入口](../../scripts/run-nr-k3-native-gauge-continuation.py)、
  [完整回执审计](../../scripts/audit-nr-k3-native-gauge-continuation.py)。

冻结协议的“尚未执行”是事前状态，未回写。本结果文件记录控制已执行，
科学演化仍未执行。上轮52项及更早208项只作为继承资格，不与本轮60项相加
冒称一次统一执行的回归总数。

## 等待确认的下一步

若用户确认，在新目录执行原40分钟/832MiB预算的固定续算：

| 档 | 父绝对步 | 追加 | 子末绝对步 | 不变dt | 共同终点 |
| --- | --- | --- | --- | --- | --- |
| 粗 | 7 | 7 | 14 | 1/112 | T=1/8 |
| 中 | 14 | 14 | 28 | 1/224 | T=1/8 |
| 细 | 28 | 28 | 56 | 1/448 | T=1/8 |

拟定命令如下，仅在收到确认且重新通过磁盘/来源门槛后执行：

```powershell
& 'D:/python/python.exe' -B scripts/run-nr-k3-native-gauge-continuation.py --output-directory tmp/nr-shadow-evidence/nr-k3-native-gauge-continuation-v1-20261010 --entry-test-gate tmp/nr-shadow-evidence/nr-k3-native-continuation-entry-controls-v1-20261010/qualification-gate.json --confirm-fixed-experiment
```

正式执行时继续设置E盘临时目录和单线程BLAS环境，监控所属进程及原预算。
完成或有可审计前缀后再运行独立完整回执审计，不能把控制结果当作此步完成。
若失败或仍unresolved，不自动再加倍终点、放大扰动、改阈值或重试。
新时间区间没有Python参考，跨后端物理验证与空间/约束收敛仍是独立后续门槛。

shadow-only、physical_gate=false、live_admission=false、scientificPayloadWriteback=false
全部保持。美术层、旧live EIH和已资格化原生程序未改动；整体科研目标未完成。

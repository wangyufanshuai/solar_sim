# 非零时间原生续算组件：52项控制通过，完整N13续算仍未运行

后续状态：完整入口及其[60项控制已资格化](RESULTS-20261010-native-continuation-entry-controls.md)，
但新的N13科学续算仍未运行。下文保留本组件批次的实际范围与当时下一门槛。

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: bounded implementation qualification and saved-data validation
- Origin Date: 2026-10-10
- Verification Status: VERIFIED FOR THE REGISTERED COMPONENT CONTROLS ONLY
- Version Label: nr-native-continuation-controls-v1-results

## 结论

新增的续算组件可从已验检查点建立新局部计划，保留绝对步号、时间及半步边界
tick。偶数/奇数起点的全部原始RK阶段与既有控制参考逐字节一致。人为诊断
失败不会把“原生已发布”误记成“科学已验收”。52项测试全部通过，零跳过。

这不是新的N13物理矩阵、T=1/8时间收敛、独立Einstein RHS验证或live准入。
旧N13 T=1/16面的unresolved结论及所有旧失败保持不变。没有改动方程、
数值方法、规范、边界、阈值、已资格化C++程序或美术层。

## 实际控制结果

父级为已保存的v6 N9 Schwarzschild五步控制，dt=1/1024；没有重算父级。

| 控制 | 父绝对步号 | 本批发布/验收步数 | 末总验收步号 | 审计RK阶段 | 结果 |
| --- | --- | --- | --- | --- | --- |
| 偶数起点续算 | 2 | 3 / 3 | 5 | 12 | 所有原始状态/斜率/组合与参考逐字节相同 |
| 奇数起点续算 | 3 | 2 / 2 | 5 | 8 | 新计划身份；绝对tick及全部阶段与参考相同 |
| 诊断失败注入 | 2 | 2 / 1 | 3 | 8 | 保留第4步已发布检查点，但拒绝提升验收前缀 |

合计11个原生子进程，全部exit0：7个单步检查点调用、4个完整阶段复算。
28个保存RK阶段均可审计；其中20阶段属于成功对照，8阶段属于故障控制。
两成功控制重叠于同一父轨迹，不是5个独立物理实验。故障是预定Python
诊断注入，不是原生崩溃、重试或数值阈值放宽。

独立H/M诊断实现之间最大差为9.5513874587283e-15；原始几何/CFL汇总
最大差为1.6322651088773745e-22。这些是诊断实现差异，不是H/M残差本身，
也不是物理解误差。此审计重建保存状态的几何、CFL、RK组合和约束诊断，
不重算Einstein RHS；没有新Python区间对照。

## 资源与来源

- 测试XML：52 passed，0 skipped，pytest耗时111.48秒。
- 外层受限批次耗时112.453秒；上限仍为600秒，没有重试。
- 471个文件、470个索引产物，共32543783字节，约31.04MiB；低于64MiB。
- 383个继承源文件加6个新增源/协议/配置文件，共389项前后指纹及保存快照
  一致；原生程序/运行库、旧v6控制、旧N13 v2回执/审计均未改变。
- 原C/E磁盘底线未降低；收尾只读检查C约6.68GiB、E约20.45GiB。
- 测试后另作只读复核：470项产物重哈希，3个保存结果的独立审计重新计算后
  与批次记录完全相同；无新增演化。

测试按事前[控制协议](EXPERIMENT-20261010-native-continuation-controls.md)运行。
协议中的“尚未执行”是冻结的事前状态；本文件单独记录实际结果，不回写协议。
历史v6的208项只作为继承资格重新验证，没有算入本轮52项执行数量。

## 可核对证据

- [完整资格回执](../../tmp/nr-shadow-evidence/nr-k3-native-continuation-controls-v1-20261010/qualification-gate.json)，
  SHA256 `01b6ce1863b556ad7fc084bcfad17943bf931117808cd5c4166484c24386f01d`。
- [源绑定控制回执](../../tmp/nr-shadow-evidence/nr-k3-native-continuation-controls-v1-20261010/control-receipt.json)，
  SHA256 `9b0f536263c464a7baad43861934b639be0731988bfffa6955287210b246254b`。
- [测试XML](../../tmp/nr-shadow-evidence/nr-k3-native-continuation-controls-v1-20261010/tests.xml)，
  SHA256 `4701340176cec2430b57d69cdb81976a34eb7bddc44d2eb81af472c95d75b086`。
- [测试日志](../../tmp/nr-shadow-evidence/nr-k3-native-continuation-controls-v1-20261010/pytest.log)，
  SHA256 `bb43c8fafd5978302ff0b847595c35f6c1150cadf08141d9bd56e4cf02fd00f6`。

新增入口仅为[受限控制测试](../../scripts/run-nr-k3-native-continuation-controls.py)，
核心是[续算组件](native_continuation.py)和
[非零起点独立审计](../../scripts/audit-nr-k3-native-continuation.py)。
运行目录必须全新；禁止对本结果目录覆盖或重跑。

## 尚未关闭的门槛

1. 完整N13续算的三档全局注册、父/子引用总清单、控制测试资格接入及失败收尾。
2. 完整回执入口审计和对应负向测试；不能只用组件audit_case代替。
3. 固定T=1/8的三档时间分析、父/子时间一致性与预算上界入口核验。
4. 上述通过且新实验获得用户确认后，才启动原预算内的7/14/28追加步。
5. 新区间仍须独立跨后端验证；空间/约束收敛、物理边界、AMR、视界、ADM、
   Psi4、双黑洞和GPU没有因控制通过而开放。

未来N13追加仍可能失败或unresolved，不自动延长终点、放大扰动、调整阈值
或资源。当前始终为shadow-only，physical_gate=false、live_admission=false、
scientificPayloadWriteback=false；整体科研目标未完成。

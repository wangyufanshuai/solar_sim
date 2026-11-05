# N9 科学入口控制通过；完整物理矩阵尚未运行

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: implementation controls and saved-stage verification
- Origin Date: 2026-10-11
- Verification Status: ENTRY CONTROLS VERIFIED; FULL SCIENTIFIC MATRIX NOT EXECUTED
- Version Label: nr-native-n9-entry-results-v1

## 本轮实际推进

新增固定N9入口、独立保存数据验收程序、合同模块、测试、控制运行器、ini及协议。
科学入口只接受14/28/56步，dt=1/112、1/224、1/448，从相同T=0初值至T=1/8。
禁止缺少确认时执行，必须绑定当前完整测试门禁；不支持任意网格/步长/父检查点。
内部继续使用已资格C++程序和原方程，没有重编译或修改396项冻结科研源。

独立验收除了完整58变量阶段、RK组合、检查点、初态和约束诊断外，新增核对
实际启动参数、退出码、原始输出摘要、六个有序阶段边界面，以及落盘point/segment
日志与回执的一致性。完整矩阵任一档失败时停止后续；绝不自动重试。

## 控制结果

| 项目 | 本轮证据 |
| --- | --- |
| 新入口控制 | 61通过，0跳过，pytest104.06秒 |
| 原预检回归 | 70通过，0跳过，pytest0.45秒 |
| 控制总运行 | 111.046秒，低于600秒 |
| 产物 | 905文件、904索引项、28067173字节，低于64 MiB |
| 源身份 | 当前/快照419项一致，原412项资格来源及396项科研来源未改变 |
| 短原生调用 | 8次均退出0，不是完整矩阵或性能基准 |

Ruff格式/静态检查通过。后验重新验证完整入口门禁、904项产物、419项当前与快照
源码、零演化注册夹具和调用日志。控制后C约9.68 GiB、E约19.61 GiB，原底线保留。
未清理旧文件、未改美术、未暂存/提交/推送。

### 真实短控制，而非完整科学结果

1. N9规范脉冲3步，dt=1/112，跨2+1局部段。3个端点、12个RK阶段保存并审计，
   检查点2/4线程调用与1线程trace一致，原始RK组合逐字节一致。独立几何/CFL摘要
   最大差2.220446049250313e-16，独立约束诊断最大差4.867634073590921e-15。
2. 同N9初值的2步控制，故意在第二个端点诊断时失败。保留2个已验证原生检查点，
   但只计1个验收端点；保存数据检查涵盖8个阶段，独立诊断最大差
   4.726457398206152e-15。失败控制是预期负例，不是失败的正式科学批次。
3. 全98步计划另以零演化注册夹具检查合同。默认科学审计拒绝该夹具，不能把
   注册文件、mock调度或人造误差序列称为完成了科学演化。

这些控制共执行5个短原生步，但只有4个控制端点被验收；二者都不计入计划的
98个科学步。未计算N9完整T=1/8轨迹，也未复用或改级N13结果。

## 可追溯证据

目录：`tmp/nr-shadow-evidence/nr-k3-native-n9-entry-controls-v1-20261011`

- 资格门禁：`efa38fec98554a93c709cbcd3532e5a43450ee854c2479d4699a2cf8f5cc9d6e`。
- 新测试XML：`6627664f1589ad963dfe1fa1815155b65097aa6528dd4ab729da1a807f8ff725`。
- 预检回归XML：`b4dccbb42980d4ede4943f8d715dc0501a450bf8ed58f8083d6348e479908c56`。
- 三步控制：`03a4f20af9103e0faf1bf8c81cba00f9e174b97a9ba29b34839cf51c2b2b219b`。
- 诊断失败控制：`db43c4150ce5c4b1ad38a830255373796c76950ed557e3c4980b49788304a6ae`。
- 419项源表摘要：`144e7a9e54a6b5d924a437bef192755252ba82ed55456a2e02380164137850d6`。

## 下一步的准确边界

科学矩阵仍等待人类确认，仅N9一批，不运行N17；保持832 MiB/2400秒、原C/E
底线、全部物理阈值与旧失败。下面是待确认后的命令，本轮没有执行：

```powershell
D:\python\python.exe -B scripts/run-nr-k3-native-n9-gauge-pulse.py --output-directory tmp/nr-shadow-evidence/nr-k3-native-n9-gauge-pulse-v1-20261011 --entry-test-gate tmp/nr-shadow-evidence/nr-k3-native-n9-entry-controls-v1-20261011/qualification-gate.json --confirm-fixed-n9-experiment
```

结束后无论成功或失败都保留证据；成功也需要在新目录独立审计保存的数据。
若运行超时/资源不足/物理门禁失败，停止，不自动重新分批或重试。
完整运行成功与时间收敛通过是不同结论；后者仍需所有五区域超过2e-13下限、
阶数在[3.5,4.5]，不能删掉不利区域或选择更有利时刻。

当前仍是小网格外域动态时空科研原型。N13边区域未分辨、空间约束收敛、独立
Einstein演化RHS、真实物理边界、AMR、视界、ADM/Psi4、双黑洞及GPU均未因
本控制晋级。科研技能将新增科学矩阵挡在授权边界；测试技能落实反例和原生短控制。
所有physical/live/writeback资格持续为false。

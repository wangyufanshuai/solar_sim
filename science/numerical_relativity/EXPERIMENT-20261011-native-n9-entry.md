# N9 规范脉冲：固定科学入口及控制协议

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective implementation and bounded controls
- Origin Date: 2026-10-11
- Verification Status: IMPLEMENTATION CONTROL PROTOCOL; SCIENTIFIC MATRIX REQUIRES SEPARATE APPROVAL
- Version Label: nr-native-n9-entry-v1

## 科学问题、范围与当前权限

为同一 Schwarzschild 外域 lapse 脉冲增加第二个空间网格N9，终点固定T=1/8。
只调用已资格C++原生程序，不修改方程、积分器、规范、边界、阈值或美术。
本轮允许开发入口和做64 MiB/600秒实现控制；完整98步科学矩阵等待人类另行同意。
原八批方案已因N17最粗档初始CFL超限撤回，不复活、不偷偷替换它。

固定三档：N9，步数14/28/56，dt=1/112、1/224、1/448；各从相同T=0初态
独立开始，均至1/8。58变量、[1,3]^3、G=c=M=1、原C5 compact log-lapse
脉冲(.001,中心2,半宽.75,幂6)、原实验性规范剖面、SBP42和analytic incoming
SAT均不变。每个原生局部段1或2步，经落盘检查点连接，绝不重置物理时间。
N13旧结果不计入本批新增步数，也不在本批重新验收；不存在跨批任意父续算。

## 原资源与安全门禁

科学批832 MiB/2400秒，含32 MiB收尾；启动C>=3 GiB，
E>=4 GiB+32 MiB+832 MiB，执行中保留原C/E底线，全部新产物与临时文件写E。
保守未压缩上界663852768字节，保留上一预检32 MiB额外来源允许量，不依赖压缩率。
单原生进程仍限最多120秒或批剩余时间。不自动重试、改步长、延时或切换其他网格。
首次失败停止剩余所有档次，分别保留已发布原生点和已经科学诊断验收的点。

原阶段CFL<=.25*(1+1e-14)、det(h)误差<=1e-10、特征残差<=2e-11、
特征基条件数<=1e6、正lapse/chi/度规和阶段lapse<2全部保留。
初值CFL通过不是全程稳定证明。动态阶段、边界和最后端点仍逐项检查。

## 科学结果与独立检查

每条轨迹保留完整58变量检查点、原生原始RK阶段、原始组合一致性、2/4线程
检查点与1线程trace交叉一致、独立几何/CFL及Hessian-H、旧H、M诊断。
另核对每次调用实际命令/退出码/输出摘要及落盘point/segment日志；不能只信回执。
独立初态核验使用因式分解紧支撑多项式与解析Schwarzschild表达式，FP64容差
2e-14，不改变生产初值。它是独立初态/诊断路径，不是第二套Einstein演化RHS。

时间筛查为58分量均方的原SBP加权RMS，保留whole/central_box/faces/edges/corners
五区域、两组连续dt场差，原2e-13分辨下限及[3.5,4.5]阶数区间不变。
全局固定T=1/8，不能根据结果择时/择区域。任一区域未分辨不能汇总为通过。
静态背景差仍只称departure，不称正时间真误差。即使N9时间筛查通过，也不自动
证明空间约束收敛、真实物理边界、黑洞/AMR/波形/GPU或live准入；旧N13边区域
未分辨和所有旧失败不改级。

## 本轮实现控制：64 MiB/600秒

仅新增7个源文件，继承原412项资格来源，不修改396项冻结科研源码。
先保存419项源码快照，再运行61项新控制和70项预检回归，必须零跳过：

- 完整零演化注册夹具的独立审计；默认科学审计拒绝夹具。
- 全局计划/来源/初值/预算/时间/档次/计数/测试证明被一致重算摘要后仍须拒绝篡改。
- 人造时间误差验证2/4/6阶、低于分辨下限、单独边区域未分辨；明确不是物理解。
- 真实短N9脉冲3步、dt=1/112，跨2+1局部段，保留12个RK阶段并独立审计。
- 真实N9两步，故意在第二个端点诊断注入失败；应保留2个原生点但仅1个验收点。
- 对实际调用terminal/command/point journal做负例，验证不同记录不能相互矛盾。
- 模拟三种失败位置，不能启动后续档或重试；CLI无确认时须在读取门禁/写文件前拒绝。

短控制有真实数值运算，但标为fixture-only，不计入98步科学矩阵，不称已验证T=1/8。
控制失败目录一律保留；仅允许修复实现后在新目录重验控制，不自动重跑科学矩阵。
科研技能要求在新增科学批次授权前停下；用户已授权的开发与资源自动停止规则优先。

控制入口（工作目录 E:\86137\myai\solar_sim\next-web）：

```powershell
D:\python\python.exe -B scripts/run-nr-k3-native-n9-entry-controls.py --output-directory tmp/nr-shadow-evidence/nr-k3-native-n9-entry-controls-v1-20261011
```

后续科学入口为 `scripts/run-nr-k3-native-n9-gauge-pulse.py`，必须给出通过且与当前
419源码逐字节一致的完整控制门禁，以及人类明确确认后才可使用的
`--confirm-fixed-n9-experiment`。该开关是操作护栏，不是密码学意义的人类授权证明。
科学批全部产物由独立 `scripts/audit-nr-k3-native-n9-gauge-pulse.py` 在另一个
新审计目录读取复核；审计本身64 MiB/600秒，不做演化RHS重算或完整科学回放。
任何物理、live、writeback资格保持false，完成运行与通过收敛判据必须分别报告。

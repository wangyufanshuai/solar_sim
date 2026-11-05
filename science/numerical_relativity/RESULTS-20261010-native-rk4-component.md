# 原生SBP/SAT/RK4四阶段与短轨迹：验收结果

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: bounded native trajectory parity and reproducibility audit
- Origin Date: 2026-10-10
- Verification Status: VERIFIED SHORT-TRAJECTORY PARITY; SHADOW / NO PHYSICAL ADMISSION
- Version Label: nr-native-rk4-component-v1

## 本轮实际完成

原生C++现已把完整58槽FO-CCZ4、SBP(4,2)、六面阶段局部SAT接入经典RK4，
并通过短轨迹逐阶段对照。不是只比较端点，也不是把Python RHS传给C++积分。
51项新测试全部通过，零失败/错误/跳过；相关Python两模块回归55项通过。
本批首次定向运行即通过，没有修改验收阈值或重跑失败科学轨迹。

方法ID：`nr-fo-ccz4-sbp42-analytic-sat-rk4-no-projection-v1`。

- [核心RK4](cpp/rk4_component/rk4.hpp)保存q1/k1/q2/k2/q3/k3/q4/k4及原始端点。
- [原生入口](cpp/rk4_component/main.cpp)使用有界canonical58小端FP64协议，
  显式grid/dt/起始步骤/1..4步和连续整数半步边界表；不接受旧周期/halo/restart别名。
- 每阶段重新构造状态/体积导数，运行当前场值CFL、局部特征分解与RHS内缓存。
  步骤n的边界标签精确为`[2n,2n+1,2n+1,2n+2]`，没有浮点时间键或步内冻结。
- 端点执行有限、正lapse/chi及SPD检查；不投影、不重建辅助场，不附加一次
  隐藏RHS或新的单位det/alpha<2/CFL检查。下一RHS仍执行全部原阶段门槛。
- 任一阶段拒绝都不自动缩步、回退或宣称得到恢复点。stderr记录具体步骤、
  阶段、半步标签和失败阶段；计算失败时stdout为空。

旧C++方程和已验收体积/主部/特征/SAT组件文件均未改动。此前归一化差和
测试总数不是本轮重跑数字，本轮证据如下。

## 逐阶段实测

前瞻合同：[EXPERIMENT-20261010-native-rk4-component.md](EXPERIMENT-20261010-native-rk4-component.md)。
测试：[test_nr_native_rk4_component.py](../../scripts/tests/test_nr_native_rk4_component.py)。

8条Python参考轨迹共14步、56个完整RHS阶段。每步9个完整数组均保存，
共126个数组；实际调用的是`NonlinearSBPCube.step`，仅外加记录器。
逐槽/whole/interior/closure_band/faces/edges/corners全部对照。

| 比较对象 | 固定最大归一化差门槛 | 实测最大值 |
| --- | --- | --- |
| 四阶段输入 | 2e-11 | 2.22044602720059e-16 |
| 四阶段完整RHS | 2e-11 | 6.66127038511516e-16 |
| 每步原始端点 | 2e-11 | 2.22044590993131e-16 |

归一化分母为max(1,该槽该区域参考maxabs)，不是无条件相对误差，更不是
物理解误差。所有原生阶段输入与端点另由独立NumPy算术从保存q0/k1..k4
重组，**逐字节一致**；步间输入等于前一原始端点，没有投影或重建。
每阶段系数SHA与实际保存场值一致，缓存数对照该场的精确字节键。

| 控制/场景 | 网格 | 步数 | dt | 最大逐区域/逐槽归一化差 |
| --- | --- | --- | --- | --- |
| 平直真空，非零起始步骤 | 9立方 | 4 | 1/1024 | 0 |
| 网格上限的平直控制 | 17立方 | 1 | 1/1024 | 0 |
| 时间变化六面目标 | 9立方 | 2 | 1/1024 | 2.2204534607886e-16 |
| 非等距长方体/时变目标 | 9x10x11 | 1 | 1/2048 | 1.11023189200132e-16 |
| Schwarzschild外域 | 9立方 | 2 | 1/1024 | 2.22048287533118e-16 |
| 既有规范脉冲初值 | 13立方 | 2 | 1/448 | 4.44090903915957e-16 |
| 既有N13保存端点，步骤28继续 | 13立方 | 1 | 1/448 | 6.66127038511516e-16 |
| 最大精确半步标签控制 | 9立方 | 1 | 1/1024 | 0 |

时变/长方体目标是算法控制，不是物理边界。最后一项的起始步骤为2^52-1，
验证半步标签到2^53的精确性，不代表进行了如此多步或长物理时间演化。
保存端点只多推进了一小步，不等于完成旧三分辨率全程回放或长期稳定性实验。

23个成功原生调用累计38个步骤/152个RHS阶段（含重复控制），不是38个独立基准。
8组独立进程复测stdout逐字节一致；时变边界与长方体两条非平凡轨迹的
OpenMP1/2/4数值payload逐字节一致。边界分解仍固定顺序、OpenBLAS1线程；
只对体积逐点RHS使用OpenMP。Python与C++共用同一OpenBLAS，不是独立算法证明。

各成功原生阶段最大局部基条件数26.2223226530459，最大特征/对称代数残差
1.57126235784961e-13，最大CFL0.0607163055762534。原门槛未改变。

## 分段与失败控制

时变边界两步：单进程1线程连续推进，与新进程2线程推进第一步、再以原始
端点交给另一个4线程进程推进第二步，完整阶段数组和报告均精确相同。
这证明**原始状态/整数时序的分段调用一致性**；它没有文件来源校验、损坏检测、
原子保存、方法/编译器拒配等checkpoint合同，不能称为已完成确定性重启。

65次调用中42次为预期拒绝。三个真实中间场失败由Python和C++定位到同一阶段：

| 控制 | 拒绝位置 | 原因 |
| --- | --- | --- |
| 非零A分量使阶段场偏离单位det合同 | 步骤7、K2、half-step15 | 边界det超原1e-10限值 |
| lapse随原方程增长超规范范围 | 步骤7、K4、half-step16 | alpha不再满足0<alpha<2 |
| 初始CFL通过，中间速度增大 | 步骤7、K2、half-step15 | 当前阶段CFL超过原上限 |

另覆盖格式/维度/步数/索引/dt、边界标签缺失/重复/错序/多余、截断和非有限输入、
第一阶段metric/CFL非法、错误模式和线程。拒绝没有成功stdout或回退。
这不是完整故障恢复系统：被拒绝调用保存输入、目标和错误定位，不保存尚未
输出的接受前缀；未来科学runner/checkpoint必须补齐持久化前缀与原子恢复证据。
只在端点失败的专项注入尚未独立覆盖，应随checkpoint状态验证补上。

## 可复核身份与资源

Windows x64、MSVC19.44.35224.0、WindowsSDK10.0.26100.0、CMake4.4.0，
C++17 `/fp:strict`、OpenMP2.0。未新增工具链或声称GPU可用。

- exe：`tmp/nr-native-rk4-build-v1-20261010/Release/nr-rk4-component.exe`
  SHA256 `3cd7bab4373ed24631bdcd81185debb9d2ce9f96385fee2c52a1598fc8399142`。
- 回执：`tmp/nr-shadow-evidence/nr-k3-native-rk4-component-v1-20261010/receipt.json`
  SHA256 `5e85b50615d3e3f4113c177a880d0808e5b4be48fc7e1507fc3b26592293c44c`。
- 新测试XML：`tmp/nr-native-rk4-component-v1-20261010.xml`
  SHA256 `5bd02b06bf1e2aa30adf09ab4da9ea280313fc98f3e3a804b89679176f6c1337`。
- Python参考回归XML：`tmp/nr-native-rk4-reference-v1-20261010.xml`
  SHA256 `9bf9e795136d9cfbbc3a6ce4cdb81b9e3da63b903c46a64b162df2e838b50ef0`。
- 实际OpenMP：`C:/Windows/System32/vcomp140.dll`，SHA256
  `95d4ce4a6802d1e18b5e0e1722cc30ea72ca7e033f83828f05c0b7b993fe7cbf`。
- 实际OpenBLAS：`D:/python/Lib/site-packages/numpy.libs/libscipy_openblas64_-13e2df515630b4a41f92893938845698.dll`，SHA256
  `6547e9fb966e9773caee2755e91a8bf4d6f3a2f0eebf9646b0158f8675ea4ab5`。

新测试XML299.657秒，fixture证据区间298.547秒；参考回归2.700秒。
耗时是本批记录，不是生产速度或与旧40分钟回放的加速比。
292个索引产物加回执共293文件、349662725字节，低于768MiB合同。
逐一重算292个产物SHA，零不符；5个新源码/合同、4个生成方程片段、
369个继承源码键和exe/运行库运行前后无漂移，完成后再核对来源与产物。
测试后磁盘约C8.76GiB、E15.22GiB，仅为当时快照；下一批重新核对原保护线。

复跑必须指定新的E盘输出目录及XML，使用`NR_NATIVE_RK4_EXE`和
`NR_NATIVE_RK4_EVIDENCE`，不覆盖当前回执。新测试51与参考回归55单独报告，
历史160、72、68、134、46、2126等不是本轮重跑总数，不能相加宣传。

## 下一依赖与未通过项

1. 方法/来源/配置绑定的checkpoint：原子保存、校验和、损坏/拒配、断点和
   端点状态验证、跨线程分段恢复；保存失败前缀而不把未接受阶段当成恢复点。
2. 然后按实测成本另立完整同终点时间/空间/独立约束收敛实验，不降低旧阈值。
3. 再推进强场长期黑洞、AMR/视界/ADM/非零Psi4闭环；CPU通过后才评估GPU。

旧Python规范脉冲完整回放未完成，faces低于原分辨底线、整体时间阶数仍unresolved。
没有因本批移植对等而重新评分。CPBC、真实辐射边界、非线性稳定性、完整黑洞、
生产级AMR、波形、GPU和live均未准入。科研评级仍是研究原型。
`scientificPayloadWriteback=false`；美术、live EIH与父仓库均未修改。

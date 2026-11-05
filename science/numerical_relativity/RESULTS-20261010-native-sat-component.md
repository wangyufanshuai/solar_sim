# 原生六面阶段局部SAT：组件验收结果

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: bounded native implementation parity, regression and artifact audit
- Origin Date: 2026-10-10
- Verification Status: VERIFIED COMPONENT PARITY ONLY; SHADOW / NOT PHYSICALLY ADMITTED
- Version Label: nr-native-sat-component-v2

## 结论

Windows原生C++现在可以计算**当前58槽场值驱动的完整单阶段SBP体积+六面SAT RHS**。
不是Python提供惩罚矩阵的壳，也不是冻结旧边界的近似。阶段局部缓存、左右符号、
独立面权重、边角累加、CFL和失败路径已通过本批对照。

新定向测试72 passed / 0 failed / 0 errors / 0 skipped，相关Python参考回归
160 passed / 0 failed / 0 errors / 0 skipped。两套单独报告，不是232个独立物理基准。
新组件仍没有RK4时间轨迹或checkpoint；不改变科研评级、live或科学payload权限。

## 实现与明确边界

- 新入口：[sat_component/main.cpp](cpp/sat_component/main.cpp)，核心：[sat.hpp](cpp/sat_component/sat.hpp)。
- 完整复用已验证的SBP体积、FO主矩阵/速度族、ILP64分解组件；这些源文件和旧
  `nr_k2_fo_ccz4_shadow.cpp`均未改动。四个生成方程片段与已验收体积版本的指纹一致。
- `q_t=A_n d_n q`：左面加`A_minus jump/H`，右面加`-A_plus jump/H`；
  `H=17 dx_axis/48`。六面固定axis/side顺序，边与角分别累加两面与三面。
- 11个ODE槽保持bulk原字节。目标只作为入射数据，即便目标ODE几何不合法，
  也不能拿目标替代当前场值计算传播系数。所有目标仍必须有限且形状正确。
- 每次RHS新建缓存；键为axis与当前cell前11槽原始字节，区分tiny shift和signed zero。
  零跳跃仍验证边界特征分解，不允许绕过边界行列式门槛。
- CFL扫描全部网格节点的六个速度族，使用每轴实际间距；阈值不变。
  边界要求`|det(h)-1|<=1e-10`；内部没有偷偷增加单位行列式投影/门禁。
- 一次进程最多接受三个**独立RHS请求**，用于A/B/A缓存测试，不代表连续时间演化。
  所有请求成功后才输出；第二个请求失败时也不输出已算好的第一个结果。
- OpenMP1/2/4仅并行体积方程；特征分解/面累加固定顺序，OpenBLAS固定1线程。
  未测加速比。Python/C++共用同一OpenBLAS二进制，不是独立线性代数算法验证。

## 预先固定的门槛与实测

合同：[EXPERIMENT-20261010-native-sat-component.md](EXPERIMENT-20261010-native-sat-component.md)。
测试：[test_nr_native_sat_component.py](../../scripts/tests/test_nr_native_sat_component.py)。

| 对照 | 固定阈值 | 实测最大值 |
| --- | --- | --- |
| bulk RHS，逐槽/逐区域归一化差 | 2e-11 | 4.44089209850063e-16 |
| coupled RHS，逐槽/逐区域归一化差 | 2e-11 | 1.76247905159244e-15 |
| 六面独立惩罚，逐槽归一化差 | 2e-11 | 1.54737334057131e-15 |
| CFL对照尺度误差 | 2e-13 | 0（本次样本） |
| 单特征入射/出射解析控制绝对差 | 入射2e-11、出射2e-12 | 1.41975084601529e-17 |
| 局部特征残差/能量代数对称残差 | 2e-11 | 1.45060658725318e-13 |
| 局部基条件数 | <=1e6 | 26.2223226530459 |

这些是**实现差与局部代数控制**，不是Einstein解的物理误差。
区域分别为whole、interior、closure_band、faces、edges、corners，不能用
全域大范数掩盖小槽或边界误差。完整58槽与全部六面数组均保存。

覆盖12种完整状态：flat零跳跃、ODE-only目标改变、非平凡常系数、平滑非对角、
9x10x11非等距、17立方、Schwarzschild、既有N13脉冲初值/端点、tiny shift、
内部非单位det、内部速度峰值。合成58槽是软件控制，不是物理约束初值。
另有12个单特征控制、A/B/A同进程缓存、signed-zero原字节键和临界CFL检查。

107次原生调用：61次成功，46次预期拒绝；无未终结调用。
26组成功独立进程复测stdout逐位一致。四个完整状态（flat、非等距、17立方、
N13保存端点）的OpenMP1/2/4数值payload逐字节一致；不宣称跨编译器逐位一致。
A/B/A三次各重建3个基，A返回时结果/报告精确相同；三轴signed-zero夹具重建6个。
各面输出按声明顺序重组后与原生coupled数组逐字节一致，包含边角。

## 首批失败透明保留

v1：24 passed、1 failed后停止，60次原生调用均正常完成。
失败是测试夹具而非方程或数值门槛：单轴正负零条纹在两个轴各有两个键，
在条纹法向轴只有一个键，因此Python与C++均返回5，测试却错误预期6。

只把夹具改为三轴棋盘格，确保每个面确有两种符号。仍要求6个精确字节键，
未调整数值阈值、原生代码或任何方程；同一原生exe重新在全新v2证据目录运行。
旧XML、285个已索引产物/回执，以及与旧测试源码SHA一致的单独快照均保留。

- 旧回执：`tmp/nr-shadow-evidence/nr-k3-native-sat-component-v1-20261010/receipt.json`
  SHA256 `f2b5c0e3bf2cc587c81a6dceb85171d570391ca2c11516656c2af4e8e778617f`。
- 旧XML：`tmp/nr-native-sat-component-v1-20261010.xml`
  SHA256 `3209d9967a6ea35dee7b1fb993700666deb0783a1ce3c62bc2288e5b7222fd30`。
- 旧测试源码快照：`tmp/nr-native-sat-test-source-v1-20261010.py`
  SHA256 `4cc442ab22af122c10896154e77996914523163a257c3bad38c68eb123aa2e7b`。

不得把v1写成通过，也不得把v1旧测试指纹冒充当前测试指纹。

## 身份、资源与复核

构建：Windows x64、MSVC19.44.35224.0、WindowsSDK10.0.26100.0、C++17、
`/fp:strict`、OpenMP2.0（`_OPENMP=200203`），CMake4.4.0。未安装新工具链。

- exe：`tmp/nr-native-sat-build-v1-20261010/Release/nr-sat-component.exe`
  SHA256 `7f826a8f4e2087364fbd70350d9b0cd99db385fc4c71cd6ada76fe9c68d639cf`。
- 实际OpenMP：`C:/Windows/System32/vcomp140.dll`
  SHA256 `95d4ce4a6802d1e18b5e0e1722cc30ea72ca7e033f83828f05c0b7b993fe7cbf`。
- 实际OpenBLAS：`D:/python/Lib/site-packages/numpy.libs/libscipy_openblas64_-13e2df515630b4a41f92893938845698.dll`
  SHA256 `6547e9fb966e9773caee2755e91a8bf4d6f3a2f0eebf9646b0158f8675ea4ab5`。
  OpenBLAS0.3.29、USE64BITINT；加载路径与请求路径核对，未复制/分发该库。
- v2回执：`tmp/nr-shadow-evidence/nr-k3-native-sat-component-v2-20261010/receipt.json`
  SHA256 `5a6056364965e69bc8f2b98aa396918257b6faeacab12fd8f480786c6caf52b0`。
- v2 XML：`tmp/nr-native-sat-component-v2-20261010.xml`
  SHA256 `e155c50fa0ad650c7844f99e6ea6eb16ac4d13cf9cc32ff8ab7a1674a86bc378`。
- 参考回归XML：`tmp/nr-native-sat-reference-v1-20261010.xml`
  SHA256 `4147e10c2cf8f5e0147f1b28346931098684c40ad133a15971f45a5d61cb9c2e`。

v2测试XML耗时136.338秒；证据fixture区间134.704秒。参考回归24.122秒。
不是生产性能测量，也没有与旧40分钟回放作不对等速度比较。
v2目录475个索引产物加回执，共476文件、173493993字节，低于512MiB预算。
所有475产物重新逐一哈希，零不符；5个本批源码/合同文件、4个生成片段、
364个继承源码键及exe/运行库在测试前后无漂移，结束后再核对源码和继承键。
v1的285产物也全部复核一致。测试后的磁盘约C8.85GiB、E15.71GiB；
这是当时快照，不保证后续可用空间，下一批仍需重新执行原保护线。

复跑须另设全新E盘证据/pytest/XML目录；不能覆盖v1/v2。入口环境变量为
`NR_NATIVE_SAT_EXE`与`NR_NATIVE_SAT_EVIDENCE`，BLAS/OMP单线程环境先固定，
测试内部再显式验证1/2/4线程。使用`python -B -m pytest`、禁缓存，并遵守
900秒整批、120秒单调用、C>=3GiB、E>=4GiB+32MiB及额外完整批次预算。

## 尚未关闭的门槛

下一依赖是**原生RK4各阶段/短轨迹对等**，然后是方法绑定的确定性checkpoint/
restart及跨线程分段恢复。此后再根据实际成本拟定共同终点时间/空间/约束收敛批次。

Python完整脉冲回放仍因旧资源超时未闭合；faces低于原分辨底线、整体时间阶数
仍unresolved。没有通过本批修复、替代或重新评分这些历史结果。
空间/约束收敛、真实辐射边界/CPBC、非线性稳定性、完整单黑洞长期演化、
双黑洞、AMR、视界/ADM/非零Psi4动态闭环、GPU和live仍未准入。
`scientificPayloadWriteback=false`；美术层与legacy EIH live均未改动。

# 四阶常量保持修复：0.3.1 与独立非线性时间窗

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: implement and run
- Origin Date: 2026-10-07
- Verification Status: PASS for repair and frozen sampled-window gates; continuous-time/physical promotion remains false
- Version Label: fd4_constant_preserving_v1

## 已观察的问题与明确变更

0.3.0四阶窗口第一次运行在N9的64步后被严格平面对角Oracle拒绝。
它不是超时或进程崩溃：原生退出0，独立诊断拒绝非零非对角分量。
原收据 `a878c19d253076b35bbd792cbad35a2ef8cf3d56438268218a887518e8bc328c`
保持 `completed=false`；原始checkpoint、日志和协议全部保留。

读取初态发现横向度规导数最大约3.33e-16，虽然横向各点逐字节相等。
64步后h/A非对角峰值约1.29e-17/7.03e-17，横向平移对称仍精确成立。
常数c=1.23456789的旧模板在N9得到约−5e-16，而先求差的等价模板精确为零。

0.3.1只改四阶**一阶空间导数**的浮点计算顺序：

```text
旧：(q[-2] - 8*q[-1] + 8*q[+1] - q[+2]) / (12*dx)
新：(8*(q[+1] - q[-1]) - (q[+2] - q[-2])) / (12*dx)
```

Python演化、Python诊断与C++同步。不修改差分系数、RHS方程、规范、阻尼、
二阶路径、直接二阶导数算子或平面Oracle；没有epsilon截断或投影。
checkpoint仍为v3，数学离散相同；跨版本浮点演化不承诺逐字节相等，
身份通过kernel_version=0.3.1及源码/二进制SHA明确区分。

修改前132个源码和0.3.0二进制已归档到
`E:/CodexData/nr-k3-fd4-constant-preserving-v1-20261007/`。

## 预定修复验证

1. 使用已安装Windows MSVC/C++17/OpenMP全新编译；旧二阶拓扑位检查仍通过。
2. 实际C++ FD4在N5/6/8/9/13/17/25、三轴、五种非整数/正负/尺度常数上
   完成364,755个精确零导数检查；另做145,902个三种平面方向的横向精确零检查。
   ±2邻点和0–4次多项式矩测试保留。独立3D斜向模式N16/24/32的全部三轴
   二阶观测阶1.8–2.2、四阶3.5–4.3，误差>1e-12。
3. 四类FD2（wave/noise × legacy/profile，N8、8步、dt1/1024）与归档0.3.0
   全checkpoint字节相等，manifest只允许kernel_version差异。
4. 四类FD4同样的58槽独立演化与Python相差<=2e-12。
5. 预定因果对照：同一份新的清洁四阶Gamma一致初值（N9、A1e-4、dt1/512）
   分别由旧/新算子运行64步。初态非对角峰值=0，旧结果>0，新结果=0；
   新结果必须通过原封不动的严格Oracle。此为有预测的旧算子失败对照，
   不是静默重跑原失败科学实验。

## 非线性窗口：门禁不变

修复检查通过后，从新初值运行完整七组：N9/13/17/25、A1e-4、dt1/512、T1；
N13的A/2和A/4；N13的dt1/1024。每组保留t=0,1/8,...,1九个状态。
所有阈值与[首次四阶窗口协议](EXPERIMENT-20261007-fd4-window.md)相同：

- 四场H_primary/H_fourier/M_x/Theta的窗口RMS和峰值L2，全部相邻网格对p>=3.0。
- 振幅阶1.8–2.2，完整有符号场A²缩放差<=5%；时间步减半窗口及逐时刻差<=1%。
- 参考<=1e-12不可测、不能通过。有限正定、采样CFL<=.45，主/辅助约束界1e-3。
- 所有时刻严格平面/对角，不投影；33个辅助残差完整。N9不拆分1/4线程
  与8段重启checkpoint/manifest字节相同；末态Python/C++续一步<=2e-12。
- 模板/修复门禁与科学窗口门禁分别记录；即使修复成功，也不能替失败的窗口评分。

相同20分钟总上限、180秒单原生进程、192MiB输出上限和1GiB磁盘预留；
新目录，不覆盖、不删除、不自动重试。全部源码/归档/产物运行后重新核对。
保持物理、连续窗口收敛、长时、标准AwA、CPBC、黑洞、AMR、CUDA和写回为false。
冻结前的新增入口测试曾有6项因跨测试文件使用相对导入而失败（86项通过）；
改为显式路径加载fixture，没有改变求解器或判据。这是开发回归，不是候选演化重试。

## 结果

新实验在512.7388秒完成77条命令，全部原生/构建命令退出0；
`completed=true`、`repair_gates_passed=true`、`sampled_fd4_window_gates_passed=true`，
`errors=[]`。原0.3.0失败收据仍为失败，两个实验没有合并为一次成功。

### 常量保持、兼容性与重启

实际C++测试通过364,755次常量精确零、145,902次横向精确零及145,902次±2索引检查。
多项式矩最大误差4.440892098500626e-16；三轴斜向制造解观测阶仍符合冻结范围。
旧二阶4,231,158次导数位检查和实际4线程拓扑测试保留通过。

同一份清洁初值64步因果对照：旧0.3.0的h/A非对角峰值分别为
1.012243999930017e-22 / 1.4784023607539085e-21；新0.3.1两者精确为0。
这比原失败中带有不清洁辅助初值的约1e-17分量更小，说明初值和演化算子都会
贡献舍入误差，不能把两个对照数值混写。严格平面Oracle未修改，所有新窗口状态均通过。
这是常量保持/对称性修复，不是已观察到物理失稳后恢复稳定的证据。

四类二阶全checkpoint仍与0.3.0逐字节相等；manifest只有版本号改变。
四类四阶8步全58槽Python/C++最大差分别为
1.909246e-16、5.593518e-16、1.302958e-15、1.335532e-15。
N9的512步不拆分1/4线程与8段重启checkpoint和manifest全部逐字节相同。
T=1末态独立Python/C++续一步最大差为2.8740844339875116e-16。
跨版本四阶输出不声明位一致；同一版本的重启与线程确定性有上述实测。

### 七组非线性约束窗口

七组各九个采样完整，未删除粗网格或中间时刻。下列相邻对依次是9→13、13→17、17→25。

| 约束场 | 窗口RMS观测阶 | 采样峰值L2观测阶 | 25³窗口RMS |
| --- | --- | --- | ---: |
| H_primary | 3.267811, 3.744225, 3.885420 | 3.233922, 3.812736, 3.912745 | 7.141452e-10 |
| H_fourier | 3.699807, 3.871060, 3.923213 | 3.665918, 3.939571, 3.950556 | 7.171239e-10 |
| M_x | 3.466076, 3.749041, 3.882773 | 3.221237, 3.793732, 3.905175 | 3.065988e-10 |
| Theta | 3.713991, 3.835278, 3.908860 | 3.424291, 3.782697, 3.901876 | 1.007820e-10 |

24个窗口/峰值阶全部满足预定>=3.0。**逐时刻并非全都>=3.0**：
最粗9→13对，t=.375的H_primary为2.137550、H_fourier为2.569549；
t=.25的M_x为2.631971。它们完整保留，不属于本协议的窗口/峰值门禁，
也不被平均后隐藏为“任意时刻四阶”。连续时间一致收敛仍未验证。

振幅阶为1.999959–2.000011；A²缩放后全有符号场最大相对差0.28905%，小于5%。
时间步减半的窗口相对差最大0.025944%，逐采样时刻最大0.095255%，均小于1%。
这只支持本窗口的时间误差控制，不证明完整非线性RK4时间阶。
最大采样CFL为0.29299543，主四场最大绝对值9.061575e-8。
辅助定义残差峰值5.472645e-8、Gamma峰值1.579659e-8、代数排序峰值9.584850e-10、
det(h)-1峰值3.352874e-14、tr(A)峰值5.116845e-13；本平面族curl精确为0。
不由平面curl=0推断一般三维扰动的稳健性。

作为事后描述，与原二阶七组收据
`86202287af446853ade39ac06d8c6ce710e4c56929ee32900fc91fcbfbc80f48`
相比，25³窗口RMS的旧/新比为H_primary 15.3853、H_fourier 16.6797、
M_x 15.4160、Theta 16.3148。primary诊断本身也随空间阶数改变；
独立Fourier算子没有换成新FD4模板，故它的改善不能仅归因于更换primary诊断。
此对比不是新的验收阈值，旧二阶失败状态不变。

### 溯源和回归

| 证据 | SHA-256 / 状态 |
| --- | --- |
| `campaign-v1/receipt.json` | `687bfd0b27bd509e0f9c1b29c66f83d81005097c415d7cc62e9021616c300158` |
| 冻结协议 | `1a5db419a882776d0562c59cbcb24c59e779e23dfa82da128a1deb8db8c8749d` |
| 0.3.1 C++源码 | `b95be34b5eddc261eef0827b79f499b325c92819d4807fb173999b4379797478` |
| 0.3.1原生二进制 | `791bde6f0639a9b6be873c895a40a461f4473d0543b59a64600b5a8a7e768a1e` |
| 当前源码 | 135个，运行前后及事后复查无漂移 |
| 归档源码 | 132个，全部复查匹配原失败收据 |
| 新产物 | 424个清单项；含收据425文件，共136,693,677 bytes |
| 原失败产物 | 6个清单项及原收据再次核对，无漂移 |

上述相对路径以 `E:/CodexData/nr-k3-fd4-constant-preserving-v1-20261007/` 为根。
还从独立保存的七份row文件重新计算整个assessment，结果逐项与收据一致；
每个采样checkpoint均再次匹配其SHA-256。此为诊断复算，不是另一轮物理演化。

最终扩大定向回归 **249 passed in 22.56 s**，覆盖改动的演化/诊断导数、
BSSN/NR3D/FO辅助场、几何约束、严格Oracle、checkpoint、manifest和两个新实验入口。
相关静态检查通过；非全科学套件运行，不与历史测试数相加。
中间92项回归通过，开发导入错误的6次失败见冻结前记录；既有pytest_asyncio警告未修改。

```text
python -m pytest science/numerical_relativity/test_bssn3d.py science/numerical_relativity/test_nr3d.py science/numerical_relativity/test_constraints3d.py science/numerical_relativity/test_fo_ccz4.py science/numerical_relativity/test_plane_constraint_oracle.py science/numerical_relativity/test_fo_ccz4_spatial_checkpoint.py science/numerical_relativity/test_fo_ccz4_checkpoint.py science/numerical_relativity/test_fo_ccz4_linear_modes.py science/numerical_relativity/test_manifest.py science/numerical_relativity/test_fd4_constant_preserving.py science/numerical_relativity/test_fo_ccz4_fd4_window.py scripts/tests/test_nr_fd4_window.py scripts/tests/test_nr_fd4_constant_preserving.py -q
```

复现须使用新目录，保留现有证据：

```text
python scripts/run-nr-k3-fd4-constant-preserving.py --archive E:/CodexData/nr-k3-fd4-constant-preserving-v1-20261007 --output-directory <fresh-directory> --vs-install "C:/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools"
```

### 尚未关闭

本证据仅为A=1e-4附近、周期全立方体内的平面族、T=1有限采样窗口。
四阶非平面扰动长窗口、标准解析轨迹基准、强双曲性、物理边界、单黑洞演化、
动态AMR、波形物理验证和CUDA仍开放。下一步应冻结四阶非平面稳健性/更长窗口，
而不是把本次小振幅窗口成功直接提升到黑洞或live。
结束时E盘约余1.16GiB；新的大实验必须重新检查预算，不得为腾空间清理历史证据。
现有EIH、美术和科学payload未改动，目标继续active，所有物理/live/writeback准入仍为false。

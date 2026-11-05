# 显式四阶空间离散与跨后端检查点

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: implement and run
- Origin Date: 2026-10-07
- Verification Status: PASS for the frozen stencil/integration gates; physical and dynamic-constraint gates remain open
- Version Label: spatial_order_v1

## 科学与工程范围

C++ 0.3.0 新增显式 `--spatial-order 4`；默认仍为二阶。
模板为 [1,-8,0,8,-1]/(12 dx)，覆盖所有主场、独立辅助场、初值与 RK4 阶段。
中心输运、无额外数值耗散、周期边界不变。方程、规范与阻尼未改动。
本轮验证模板精度与集成，不把制造解四阶或短步一致性当作非线性约束收敛、
长时稳定性或黑洞基准。上一轮空间失败不得撤销。

## 格式冻结

公共 little-endian 头与 58 槽排列不变。v1=二阶legacy，v2=二阶profile；
v3只代表四阶，公共头后追加 `<QQdd>`：order=4、profile_id、shift_scale、ordering_scale。
profile_id=0 时两个系数必须为0；profile_id=1须有合法系数且使用动态模式。
新头共136字节。旧二阶字节不变，旧程序拒绝v3。
Python decode 默认期待二阶；四阶必须显式指定 expected_spatial_order=4。
原生重启要求 CLI 阶数与文件一致。恢复后的 Grid3D 与辅助阶数一致，不重建辅助变量。

所有0.3.0 manifest增加 grid.spatial_order、诊断 checkpoint_version、
spatial_order_bound_to_checkpoint、spatial_operator=centered-periodic、numerical_dissipation=none。
跨版本二阶比较只允许这些已声明的字段和 kernel_version 变化，其余字段完全一致。

## 预定门禁

1. 归档0.2.1的124个源码与原二进制，绑定上一轮收据
   `23c2cf755c475019f35af6efdc4798605508d0eba83649bdacb01b96785fd34b`。
   相同Windows MSVC/CMake设置新编译0.3.0，并运行旧拓扑单元测试。
2. 实际C++ d1在5/6/8/9/13/17/25³网格检查全部三轴±2索引；
   三轴0到4次多项式矩误差<=2e-13；拒绝order/cache不一致。
3. 三维斜向模式 sin(2π(x+2y−z))，N=16/24/32，三轴分别比较解析导数：
   二阶相邻观测阶>=1.8且<=2.2，四阶>=3.5且<=4.3；L2必须有限且>1e-12。
   18个原始误差全部报告，不丢弃轴或网格。
4. 四类二阶回归：legacy/profile × wave/58槽独立三维扰动，N=8，dt=1/1024，8步；
   相同输入下0.2.1与0.3.0全检查点逐字节相等，manifest仅允许冻结差异。
5. 四类四阶跨后端对照：legacy/profile × wave/独立扰动，N=8，dt=1/1024，8步；
   波幅1e-4，扰动PCG64 seed=20261007、均匀[-1e-5,1e-5]。
   所有58槽Python/C++最大绝对差<=2e-12。每类1/4线程、8步/4+4重启字节一致。
   每类从C++末态经Python一步写回v3、再由C++续步，与纯C++对应时刻比较<=5e-12。
6. 独立native冷初始化运行四阶波两步，然后Python/C++各续一步，58槽差<=2e-12。
   profile四阶Minkowski N5八步保持精确平直状态。
7. v3错误阶数、未知profile、非法profile系数、截断、尾随、NaN、错误CLI阶数和
   缺失CLI四阶选项全部拒绝且不写输出；旧0.2.1拒绝合法v3，不静默降阶。
8. 定向回归覆盖旧v1/v2、新v3、manifest、检测脚本的缺样本/非有限误差拒绝路径。
   从完整输出字节独立重算manifest的checkpoint/state校验和，包含v3扩展与所有槽。
   保留项目历史FNV offset basis；真实性绑定仍使用外部SHA-256。

协议、输入、源码、原始输出及收据完整保留。新目录，1200秒总上限、180秒单进程、
192MiB输出上限、1GiB磁盘预留；失败不自动重跑。协议冻结前的开发测试曾有3项
manifest fixture失败，原因是旧样本省略实际输出的版本字段；已补齐而未放松新格式要求。

## 外部方法来源

上一轮已通过Exa定位并完整核对
[GRChombo固定提交的差分实现](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/BoxUtils/FourthOrderDerivatives.hpp)。
本项目使用自己的模板实现，未复制外部代码，未引入其upwind/耗散/ghost/AMR实现。
离散阶数、输运稳定性和物理边界应分别验证。

## 结果

冻结后的原生实验完成，`completed=true`、`passed=true`、`errors=[]`。
50条受控命令在26.8277秒内完成8类演化/回归与11类拒绝路径。
此次 PASS 仅对应上面的模板和集成门禁，**不撤销此前二阶非线性剩余误差的空间失败**。
输出位于 `E:/CodexData/nr-k3-spatial-order-v1-20261007/campaign-v1/`；
目录中的 `protocol.frozen.md` 保留运行前内容，本报告追加结果并不改写冻结协议。

### 实际 C++ 模板

旧二阶拓扑测试保留145,902个±1索引检查、4,231,158个导数位模式检查，
并实际观察到4个OpenMP线程。新测试完成145,902个±2索引检查；
三轴0到4次多项式矩的最大误差为 `4.440892098500626e-16`，
低于预定 `2e-13`。不匹配的order/cache被拒绝。

下表给出斜向制造解全部18个原始L2误差（显示舍入；全精度值保留在收据）。
观测阶按相邻网格的误差比和网格比计算。

| 模板/轴 | N=16 | N=24 | N=32 | 两个相邻观测阶 |
| --- | ---: | ---: | ---: | --- |
| 二阶 x | .113314136988791 | .050578092745102 | .028492869631280 | 1.989432, 1.994788 |
| 二阶 y | .885765876316741 | .400484502078169 | .226628273977604 | 1.957696, 1.979143 |
| 二阶 z | .113314136988791 | .050578092745102 | .028492869631280 | 1.989432, 1.994788 |
| 四阶 x | .003457869932264 | .000690039980443 | .000219113845440 | 3.974839, 3.987590 |
| 四阶 y | .104717292814191 | .021547120115150 | .006915739864530 | 3.899280, 3.950341 |
| 四阶 z | .003457869932265 | .000690039980443 | .000219113845440 | 3.974839, 3.987590 |

全部有限且可测，满足各自冻结范围。这里验证的是**空间导数模板的制造解精度**，
不是演化后Einstein约束的四阶收敛，也不是全NR解的独立精度认证。

### 演化与重启

四类二阶输出与归档0.2.1的完整checkpoint逐字节相等；
manifest只出现事先允许的版本与空间阶数元数据差异。
四类四阶演化均通过1/4线程和8步/4+4拆分运行的checkpoint、manifest逐字节一致性。
所有58个槽参与跨后端比较，包括独立三维辅助扰动；辅助场没有被重建为主场导数。

| 四阶场景 | Python/C++ 8步最大绝对差 | C++→Python→C++续算最大绝对差 |
| --- | ---: | ---: |
| wave / legacy | 1.909314e-16 | 1.510361e-16 |
| wave / profile | 5.593518e-16 | 1.629132e-16 |
| noise / legacy | 1.302958e-15 | 2.987373e-16 |
| noise / profile | 1.335532e-15 | 3.652440e-16 |

相应上限分别为 `2e-12` 与 `5e-12`，未根据结果调整。
原生四阶/profile冷初始化后的独立Python/C++续一步差为 `1.404516e-16`；
N5四阶/profile Minkowski八步保持逐槽精确平直。

11类坏输入均以非零状态退出且不写checkpoint/manifest：截断、尾随、v3中order=2、
未知profile、非法profile系数、非零legacy预留值、NaN、错误/遗漏/非法CLI阶数，
以及旧0.2.1读取合法v3。最后一项还核对了明确的checkpoint版本拒绝原因，
不是把旧程序不认识新CLI选项误记成格式安全验证。

每份有效输出还从全字节独立复算manifest的checkpoint/state校验值；
state覆盖 `raw[24:56] + raw[64:]`，包括v3扩展及全部场。
项目历史FNV初值为 `1469598103934665603`，与标准FNV offset basis不同；
此处为兼容性保留，不称其为标准FNV实现，证据身份另用SHA-256绑定。

### 证据身份与回归

| 证据 | SHA-256 / 状态 |
| --- | --- |
| `campaign-v1/receipt.json` | `cfa93ce5617ebf7f78a7ed42e4563e6668c4e23bea9da5b3b65f77ad71a26cb7` |
| 冻结协议 | `f225600c8a5d943e56449b3c9839160e8191b69e5d7427911d7e10239161a2f3` |
| 0.3.0 C++ 源文件 | `aa8a1dde249819b7e2ee4b8e6cda59e9ec9d96584499a55e36c5abdff99c0f07` |
| 0.3.0 原生可执行文件 | `9279637d343cd3562b30cf73ac64adf759a2c4a012af0d34ef76d92a03555360` |
| 归档0.2.1可执行文件 | `fe8cc287618fb6fb82e59aafb3ca26ae5dbbd99baa958bbb88620260b14d705d` |
| 源码身份 | 128个文件运行前后不变；修改前归档的124个源码及旧二进制也不变 |
| 实验产物 | 262个清单项；含收据共263个文件、15,899,407 bytes |

上表相对路径以 `E:/CodexData/nr-k3-spatial-order-v1-20261007/` 为根。
收据、128个源码与262个产物在回归后再次核对，无哈希漂移。
这是Windows原生MSVC/C++17/OpenMP实测，不使用MinGW，不代表CUDA可用。

最终定向回归为 **200 passed in 7.07 s**，其中包含31项新空间格式测试和18项新实验入口测试；
相关Python静态检查通过。协议冻结前曾有3项旧manifest fixture失败，修复历史见上文。
既有pytest_asyncio配置警告保留。这不是全科学套件的新结果，也不与历史测试数相加。

```text
python -m pytest science/numerical_relativity/test_fo_ccz4_spatial_checkpoint.py science/numerical_relativity/test_fo_ccz4_checkpoint.py science/numerical_relativity/test_manifest.py science/numerical_relativity/test_fo_ccz4_linear_modes.py science/numerical_relativity/test_fo_ccz4_remainder.py science/numerical_relativity/test_fo_ccz4_periodic_window.py science/numerical_relativity/test_native_msvc_audit.py scripts/tests/test_nr_topology_cache.py scripts/tests/test_nr_remainder_continuation.py scripts/tests/test_nr_spatial_order.py -q
```

复现入口必须选全新目录，不覆盖现有证据：

```text
python scripts/run-nr-k3-spatial-order.py --archive E:/CodexData/nr-k3-spatial-order-v1-20261007 --output-directory <fresh-directory> --vs-install "C:/Program Files (x86)/Microsoft Visual Studio/2022/BuildTools"
```

### 下一道门禁

下一实验应显式采用v3/四阶状态，另行冻结多网格非线性约束时间窗口及振幅、时间步控制。
初始Gamma一致性工具和诊断入口也必须携带空间阶数，不能让旧入口隐式按二阶解释v3。
保留旧二阶失败、不删粗网格、不改事后阈值；低于测量下限应记为不可测。

物理、动态约束收敛、强双曲性、CPBC、黑洞、AMR、GPU、长时稳定性、
live和科学payload写回均未准入。美术与现有EIH运行未修改。

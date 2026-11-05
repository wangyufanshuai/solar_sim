# Windows C++ SBP体积方程：完整58槽与线程对照

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: native nonlinear volume implementation and reproducibility controls
- Origin Date: 2026-10-10 (protocol/build preparation began 2026-10-09)
- Verification Status: VOLUME COMPONENT PASSED; SAT/RK/RESTART NOT YET PORTED
- Version Label: nr-native-sbp-volume-component-v1 / qualification-v2

## 结论与实际范围

新增Windows原生SBP(4,2)体积算子，已连接完整FO-CCZ4非线性RHS，
包括全部58个独立状态槽、几何与规范源项、显式tau_inverse松弛项及所有表面节点。
支持每轴9..17节点、不同方向的尺寸和间距，不再使用周期索引或固定Dirichlet halo。
先校验输入，再计算不可变导数缓存，最后用OpenMP逐点计算方程；没有共享数值归约。

本批68项原生组件测试通过，零失败、零错误、零跳过；控制台4.53秒、XML4.527秒。
另行重跑相关Python参考的5个测试文件，160 passed / 12.47秒。
68与160属于不同测试集合；此前46项谱组件、134项主部组件和2126项继承回归
本轮没有重新执行，不拼成新的全量测试总数。测试数量不是物理基准数量。

这一步关闭的是**原生体积方程对等**，还没有六面SAT、RK4时间步或新方法的restart。
没有完整黑洞/真实边界/AMR/波形/GPU或live准入，也没有实测加速比声明。

## 固定方程的适配方式

旧`cpp/nr_k2_fo_ccz4_shadow.cpp`未修改。构建先核对固定SHA256，然后从该文件
提取变量布局、几何函数、参数常数及完整RHS正文到新的构建目录。
四个生成片段接受逐字节审计；RHS仅有三处公开适配：

1. 输出按长方体总cell数分配。
2. 全网格循环按总cell数遍历。
3. 删除旧Dirichlet-halo跳过分支，所有SBP节点参与体积方程。

实际导数由新的SBP策略提供，源项和方程项不重写。辅助A/B/D/P按输入保存，
不从基变量重新计算；不投影行列式、不裁剪lapse、不回退旧差分。
该复用方式与Python是不同实现路径，但不是独立推导Einstein方程的证据。

规范/参数保持当前合同：advective 1+log、theta=2、c=e=s=1、
f=3 alpha chi、mu=0.2 chi，kappa1=0.1、kappa2=0、kappa3=1。
本组件不宣称其他规范受支持；原生逆矩阵非奇异门槛及正正规lapse/chi检查明确保留。

## 验证覆盖与数值结果

| 检查 | 实测最大差/残差 | 事先上限 |
| --- | ---: | ---: |
| 58槽三轴导数与Python差 | 0 | 2e-13归一化 |
| SBP恒等式HD+D^T H=B | 2.22045e-16 | 2e-13 |
| 边界二次/内部四次多项式控制 | 1.06581e-14 | 2e-11 |
| 完整非线性RHS逐区域/逐槽差 | 6.69603e-16 | 2e-11归一化 |
| 独立解析tau松弛差分 | 8.67362e-19 | 2e-13绝对差 |

RHS比较按whole、SBP interior、closure band、faces、edges、corners分别记录全部58槽；
每个槽每个区域用max(1,maxabs参考)归一化，不能以大幅值变量掩盖其他槽的误差。
interior指三个方向均不在四行闭合带内。所有网格点同时纳入whole检查。
这些差值衡量**相同离散方程的实现一致性**，不是对真实时空解的误差上界或收敛阶。

十组完整RHS状态包括：两个平直网格、两个常数非平凡58槽/tau控制、
三个平滑非对角场（含9×10×11非等间距长方体及17^3）、Schwarzschild解析初值，
以及既有N13规范脉冲的保存初值/终点。常数但独立的辅助场用于发现错误重建，
合成场允许约束违反，不能描述为物理可接受初值。

十组状态均以1/2/4线程运行，数值payload逐字节一致；1线程另起进程重复，
完整stdout逐字节一致。算子/导数也有重复进程控制，共31个成功重复对。
另有两次解析源项调用；合计119次原生调用：84成功、35预期拒绝。
拒绝覆盖schema/网格/坐标/长度/非有限/非SPD/log字段/tau/线程/模式错误，
以及导数和源项中间运算溢出；失败stdout为空，无静默替代算法。

曲率数据表面RHS非零：Schwarzschild N9约1.21643e-2，保存N13初值约5.85816e-3，
保存终点约5.88755e-3。这验证没有沿用旧halo清零逻辑；并不证明物理边界有效。
本批仅在保存状态上求RHS，未用C++重演其轨迹。

## 保留的首批失败与修正

首个资格批次v1在第一个生成代码审计测试失败，1 failed / 1.77秒，原生数值调用0次。
原因是Windows下默认文件生成产生CRLF，而固定原文及审计合同使用LF。
未改方程、比较测试或任何数值阈值；只把CMake生成方式改为明确UNIX换行，
最低CMake版本相应声明为3.20（本机4.4.0）。随后在全新v2构建/证据目录重测通过。
首批构建、生成代码副本、回执和XML均保留，不把它抹去或改记为数值成功。

| 首批失败记录 | SHA256 |
| --- | --- |
| `tmp/nr-shadow-evidence/nr-k3-native-sbp-volume-component-v1-20261010/receipt.json` | `f7482875eedacef4c0374020b71bbc3bcdacf9b2d12b2d4dcf20a1af34174ff9` |
| `tmp/nr-native-sbp-volume-component-v1-20261010.xml` | `84ebfb07ac026f29be44e783cc0fce01aeb766a736f7543ce64a0299884843df` |

## 环境、来源与证据

Windows x64 / MSVC19.44.35224.0 / C++17 / 严格浮点，实际OpenMP版本标识200203。
运行时加载路径为`C:/Windows/System32/vcomp140.dll`，路径由原生进程报告并核验指纹。
没有安装新依赖；此体积组件不使用OpenBLAS。保留MSBuild临时目录增量构建警告
MSB8029及pytest异步配置弃用警告，未宣称零警告。

7个本批源码/依赖文件、4个生成片段、358个继承参考键及exe/OpenMP运行时前后无漂移。
514个清单产物加回执共515文件、142238030字节；测试后514个产物全部重新核验哈希。
产物约135.65MiB，低于本批256MiB上限；C>=3GiB、E>=4GiB+32MiB底线未降低。

| 证据 | 路径/身份 |
| --- | --- |
| 前瞻合同 | `science/numerical_relativity/EXPERIMENT-20261009-native-sbp-volume-component.md` |
| C++工程 | `science/numerical_relativity/cpp/sbp_volume_component/` |
| 测试 | `scripts/tests/test_nr_native_sbp_volume_component.py` |
| 68项XML | `tmp/nr-native-sbp-volume-component-v2-20261010.xml` |
| 68项XML SHA256 | `68b2f2d9c8d0171aa0e4795da0c989943f6383cfa2dd73fe5b3878edd64ee4da` |
| 160项参考XML | `tmp/nr-native-sbp-reference-v1-20261010.xml` |
| 160项XML SHA256 | `a030e7afeab73bba637070f11a3f6b9faa81992e78384a9a5e5f0532e414669e` |
| 回执 | `tmp/nr-shadow-evidence/nr-k3-native-sbp-volume-component-v2-20261010/receipt.json` |
| 回执SHA256 | `a9f55559c01fbdb982436283272ef5cbb811768f15273269c0bfa3be3abe8816` |
| exe | `tmp/nr-native-sbp-volume-build-v2-20261010/Release/nr-sbp-volume-component.exe` |
| exe SHA256 | `b7459bdb251702ec51e6cf16282daaa05f835b4b624a1a494fb30c3753d01251` |
| 固定方程SHA256 | `6252ec9b2901f03e51081410a612b9b6ed9d1ddd3469663f8d8dd9663944e457` |
| OpenMP运行时SHA256 | `95d4ce4a6802d1e18b5e0e1722cc30ea72ca7e033f83828f05c0b7b993fe7cbf` |

Ruff与定向差异检查通过。全部新增内容限定在科研目录、测试和E盘产物目录；
美术、app、legacy live及旧方程未改，scientificPayloadWriteback=false。

## 下一依赖

下一步把已经分别验证的主矩阵/谱分解和体积RHS接入**六面阶段局部SAT**：
左面负谱、右面正谱符号、面权重、边/角累加、当前系数缓存、CFL和失败路径均需对照。
之后才接RK4全阶段、短轨迹、约束诊断及方法身份绑定的checkpoint/restart。
新二进制输入输出只是组件传输协议，不是可用于继续演化的checkpoint。

原Python完整回放超时及其未闭合科学门槛仍保留；本批没有启动新的长时回放。
科研评级仍为shadow研究原型，不因体积对等通过而升为成熟黑洞求解器。

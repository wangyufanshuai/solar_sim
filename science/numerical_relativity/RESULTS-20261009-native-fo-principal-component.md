# Windows C++ FO-CCZ4 主部：原生生成与实际方程对照

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: native coefficient-to-symbol port and independent code-path controls
- Origin Date: 2026-10-09
- Verification Status: 134 COMPONENT TESTS PASSED; NO SBP/SAT EVOLUTION ADMISSION
- Version Label: nr-native-fo-principal-component-v1

## 本次关闭的依赖

现在C++可以仅从局部h、chi、alpha、beta及坐标轴，自行生成58维FO-CCZ4
主矩阵、47维PDE速度族及正负谱矩阵，不再从Python接收主矩阵或特征根。
新代码位于独立`cpp/fo_principal_component/`项目，复用上一组件的ILP64适配器
与谱分解。旧Python、旧C++ RHS、既有特征分解六文件和回滚二进制均未修改。

合同仍是当前实验性f=3 alpha chi、mu=0.2 chi，advective 1+log、c=e=s=1，
0<alpha<2、chi>0、对称正定且|det(h)-1|<=1e-10的h。没有修复行列式、
裁剪特征根、使用伪逆或悄悄外推到其他规范参数。

另一个独立测试可执行文件直接调用未改动的旧C++实际FO RHS，逐一扰动58个
状态槽，在5^3网格中心提取主矩阵。它不包含新主矩阵组装头文件，不调用
新组装/速度生成函数，正负扰动具有相同中心状态，使零阶源抵消。
这属于不同代码路径的主部核对，不是另一种独立物理理论或完整时间演化。

## 验证结果

134 passed，零失败、零错误、零跳过；控制台85.31秒，XML84.961秒。
36组主矩阵/速度/谱对照，72组实际RHS探针，26个拒绝测试。
共262次子进程调用，其中216次成功组成108对逐字节相同的重复输出；
46次为预期拒绝。不是262次物理演化，也不是性能加速基准。

几何样本包括平直、对角曲率、非对角h、三组固定种子det=1度量、
正负强平移、1e-13量级微小平移，以及首轮真实规范脉冲端点的角/面/中心，
均检查三个轴。RHS探针针对前六类样本，各检查FD2/FD4、两档epsilon。
保存端点只贡献局部系数，不能表述为C++已重演该轨迹。

| 指标 | 实测最大值 | 事先门槛 |
| --- | ---: | ---: |
| 原生/Python主矩阵归一化差 | 1.85037e-17 | 2e-13 |
| 根值归一化差 | 1.79457e-16 | 2e-13 |
| 正谱矩阵归一化差 | 2.15621e-15 | 2e-11 |
| 负谱矩阵归一化差 | 2.16080e-15 | 2e-11 |
| 两侧规定jump的SAT代数作用差 | 6.24321e-15 | 2e-11 |
| 实际C++ RHS探针与Python主矩阵差 | 1.01200e-16 | 5e-10 |

主矩阵和谱差归一化分母为max(1,参考主矩阵无穷范数)。根值用根尺度；
jump作用同时除去边界权重，定义见前瞻合同和测试。**这些不是物理解的误差。**
11个ODE行/列精确零，PDE根重数精确匹配，总计47；没有把ODE零根随beta平移。

最大基条件数42.23190，最大特征残差5.18205e-16，最大对称化残差9.18867e-14，
最小能量矩阵本征值0.2147992。三档空度阈值1e-9/1e-10/1e-11和原上限均保持。
局部正定矩阵和有限样本一致性不是连续强双曲性、统一能量估计或非线性稳定性证明。
谱分解两侧依然共享OpenBLAS，不构成独立线性代数算法核验。

## 构建与完整性

Windows x64、MSVC19.44.35224.0、C++17、`/fp:strict`，编译退出0。
两个新程序均为本批组件测试工具；没有注册为live或生产后端。
Ruff和定向差异检查通过。保留MSB8029临时目录增量构建警告、pytest异步配置警告。

本批冻结10个源码/依赖文件，另核对345个原参考键和6个上一组件源码键，
共351个参考键无漂移；两个exe与DLL前后指纹一致。
1157个清单产物加回执共1158文件、10752915字节。测试后再次重算全部1157个
产物和10个源码哈希，无差异。资源仍执行C>=3GiB、E>=4GiB+32MiB；未清理文件。

| 证据 | 路径/身份 |
| --- | --- |
| 前瞻合同 | `science/numerical_relativity/EXPERIMENT-20261009-native-fo-principal-component.md` |
| C++工程 | `science/numerical_relativity/cpp/fo_principal_component/` |
| 测试 | `scripts/tests/test_nr_native_fo_principal_component.py` |
| XML | `tmp/nr-native-fo-principal-component-v1-20261009.xml` |
| XML SHA256 | `b6594b4b3b58f7148d26a23060d2544727c2d774b59bd715204fd54a45f97bef` |
| 回执 | `tmp/nr-shadow-evidence/nr-k3-native-fo-principal-component-v1-20261009/receipt.json` |
| 回执 SHA256 | `e216b8e83513dc23c4b4835a3c71b20144aed200686ee5a16c6eba27186a46b1` |
| 原生主部exe SHA256 | `815426e1fc7085629e365037499bd9ac3ed5a1fa93a07766315ba1e3dc4975d3` |
| 实际RHS探针exe SHA256 | `062d5ff2f1b3b1714473d650e8678fabc01abdad838bf38b74f5fd7952ff5488` |
| DLL SHA256 | `6547e9fb966e9773caee2755e91a8bf4d6f3a2f0eebf9646b0158f8675ea4ab5` |

两个exe位于`tmp/nr-native-fo-principal-build-v1-20261009/Release/`，名称分别为
`nr-fo-principal-component.exe`和`nr-fo-rhs-principal-probe.exe`。
原46项ABI/谱控制和本134项各有独立回执；不合并冒称完整求解器验收。

## 剩余C++移植顺序

1. **SBP体积算子与真实源项。** 逐轴迁移SBP(4,2)全行及边界权重；验证SBP恒等式、
   常数/多项式控制、58槽体积RHS与Python逐项一致。保留旧FD/固定halo方法身份。
2. **六面阶段局部SAT。** 原生主矩阵接入真实面节点；准确处理左负谱/右正谱、
   角/边多面累加、同阶段精确字节缓存和CFL。此处仅测试过局部SAT代数作用，
   尚未实现或验证全网格边界演化。
3. **RK4全阶段与确定性重启。** 先单步再短轨迹，对照全部58槽、阶段数组、
   约束诊断和失败位置；checkpoint记录方法/规范/边界/布局/版本，拒绝合同错配。
   旧后端restart通过不能直接用于新SBP/SAT方法。
4. **再做有预算的共同终点实验。** 先跨后端通过，再估算长跑时间/产物预算；
   不自动延长旧Python40分钟批次，不删除失败记录，不降低物理阈值。

当前仍是shadow研究原型。新方法的原生完整演化、物理边界、约束空间收敛、
完整单黑洞/AMR/波形/GPU尚未获准；scientificPayloadWriteback=false。

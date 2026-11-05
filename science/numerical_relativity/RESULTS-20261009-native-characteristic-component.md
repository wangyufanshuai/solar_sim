# Windows C++ 特征分解组件：验证结果

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: native ABI qualification and cross-language spectral controls
- Origin Date: 2026-10-09
- Verification Status: COMPONENT CONTROLS PASSED; NOT AN EVOLUTION BACKEND
- Version Label: nr-native-characteristic-component-v1

## 结论

Windows x64 / MSVC 19.44.35224.0 / C++17严格浮点组件编译成功。
显式启用的测试46 passed，零失败、零跳过；77次子进程调用，31个正控制均
通过重复进程stdout逐字节一致检查。XML记录6.020秒，控制台总计6.19秒，
不是后端性能基准。Ruff与定向差异检查通过。

这一步输入的58维主矩阵、去平移根和advection仍由Python提供。
C++独立执行SVD、完整基逆、正/负谱矩阵和正定性/残差检查，未生成Einstein
主矩阵，未实现SBP/SAT/RK演化。后续主部生成结果见
[原生FO主部组件](RESULTS-20261009-native-fo-principal-component.md)。

## 已覆盖的控制

- 解析非对称矩阵SVD奇异值与重构、逆矩阵、对称本征值、奇异逆拒绝。
- 12组解析谱控制：对角/非正规相似变换，正负/零/微小advection及速度穿越。
- 18组真实FO主矩阵：平直、曲率、非对角h和保存端点角/面/中心，各三个轴。
- 15个拒绝控制：错误重数、ODE耦合、缺陷Jordan块、病态基、非法输入/依赖/模式。
- 11个ODE行/列精确零；47维PDE中才去平移；无伪逆或微小速度裁剪。

最大原生基条件数42.23190，最大特征残差2.22230e-15，
最大对称化残差9.18867e-14，最小能量矩阵本征值0.2147992。
正负谱矩阵及规定jump作用通过2e-11归一化比较门槛。
这些有限样本不能证明连续系数域上的一致强双曲性或边界稳定性。

## 构建、依赖与保留证据

复用现有NumPy ILP64 OpenBLAS 0.3.29，配置包含USE64BITINT，固定BLAS单线程。
Windows long实测4字节，LAPACK整数显式int64_t为8字节；布局参数仍为int。
DLL从明确绝对路径载入，仅使用DLL目录与System32的依赖搜索范围。
Python和C++使用同一个OpenBLAS二进制，因此不是独立线性代数算法。
没有安装、下载或再分发DLL，也没有OpenMP/GPU演化就绪声明。

保留MSBuild MSB8029临时目录增量构建警告与原pytest异步配置弃用警告，
未把警告隐藏为零警告构建。前后六个组件源码、345个冻结参考键、exe和DLL
均无漂移；309个清单产物加回执共310文件、6097220字节，全部产物哈希复核通过。

| 证据 | 路径/身份 |
| --- | --- |
| 前瞻合同 | `science/numerical_relativity/EXPERIMENT-20261009-native-characteristic-component.md` |
| C++工程 | `science/numerical_relativity/cpp/characteristic_component/` |
| 测试 | `scripts/tests/test_nr_native_characteristic_component.py` |
| XML | `tmp/nr-native-characteristic-component-v1-20261009.xml` |
| XML SHA256 | `04576d921cb1c753f60d138dbf698a65433ffdc9e19af46611dd9021bb065a52` |
| 回执 | `tmp/nr-shadow-evidence/nr-k3-native-characteristic-component-v1-20261009/receipt.json` |
| 回执 SHA256 | `7a6094ddfbae5685f5d6cd9dde9dc47bcccdb910d78a5281d15d77569f3b59fb` |
| exe | `tmp/nr-native-characteristic-component-build-v1-20261009/Release/nr-characteristic-component.exe` |
| exe SHA256 | `6257ea99038fe0024988c8288ff4c382d8e8319bc6780ebd558602d75804b28e` |
| DLL SHA256 | `6547e9fb966e9773caee2755e91a8bf4d6f3a2f0eebf9646b0158f8675ea4ab5` |

接口核对使用[Netlib LAPACKE](https://www.netlib.org/lapack/lapacke.html)、
[OpenBLAS ILP64分发资料](https://www.openmathlib.org/OpenBLAS/docs/distributing/)
及前瞻合同中固定blob的NumPy/LAPACKE官方GitHub源文件；未引入外部算法代码。

本批46项与继承Python回归2126项分开报告，不称为新增物理基准。
shadow-only、candidate-only、not-admitted、scientificPayloadWriteback=false。

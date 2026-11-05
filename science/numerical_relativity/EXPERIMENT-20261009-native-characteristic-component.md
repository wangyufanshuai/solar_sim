# Windows C++ 特征分解组件：前瞻合同

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: isolated native component implementation and cross-language controls
- Origin Date: 2026-10-09
- Verification Status: PLANNED; NOT AN EVOLUTION BACKEND
- Version Label: nr-native-characteristic-component-v1

## 问题与边界

当前Python实际SBP/SAT演化每个阶段都在曲率相关47维PDE主矩阵上做SVD，
拼接完整特征基并构造正/负谱分裂。既有C++演化尚未实现这个方法。
本组件只关闭原生线性代数ABI与谱分裂这一个移植依赖，不修改任何旧源码、
正在回放的345个冻结键、原生回滚可执行文件或live路径。

输入58维主矩阵和去平移后的速度族由Python提供，C++自己执行SVD、解线性系统、
正定性检查与谱投影。因此不是原生Einstein主矩阵生成、SBP体积算子、
SAT/RK演化、跨后端完整轨迹或checkpoint准入。Python/C++使用同一现有
OpenBLAS二进制；这种比较不构成独立线性代数算法的验证。

## 固定方法

- Windows x64 / C++17独立小项目，MSVC严格浮点，不安装新依赖。
- 动态装载明确绝对路径的现有NumPy ILP64 OpenBLAS；记录其SHA256和配置。
- LAPACK整数使用int64_t，不使用Windows long；布局参数仍为int，字符为char。
- LAPACKE dgesdd使用完整U/VT；dgesv求完整逆矩阵，不允许伪逆；dsyev检查对称化矩阵。
- 11个ODE行/列必须精确为零；仅47维PDE块移除beta.n平移。
- 保持Python三档空度阈值1e-9/1e-10/1e-11、基条件数上限1e6、
  特征/对称化/分裂残差上限2e-11；不裁剪根或修复矩阵。
- 同一根的基可有符号/旋转歧义，比较正负谱矩阵与SAT作用，不要求基逐元素相同。
- 跨语言正/负谱矩阵的最大绝对差除max(1,主矩阵无穷范数)不超过2e-11。
- 同一二进制、输入、依赖与单线程设置的重复进程输出须逐字节一致。

## 控制与停止

覆盖解析对角/非正规相似变换、重根、零根、平移穿越、三坐标方向，
并比较曲率/非对角度量及已保存Schwarzschild规范脉冲端点的真实主矩阵。
坏尺寸、非有限值、ODE耦合、重复/无序根、错误重数、缺陷Jordan块、
过大基条件数或残差必须拒绝；不得用替代算法重试数值失败。
SVD奇异值及重构、线性解、对称本征值另用小型解析控制检查。

全部输出留在E的新目录。编译单次120秒、单个组件子进程30秒，
本批测试总计600秒、额外产物上限64MiB；C>=3GiB，E>=4GiB+32MiB。
同时运行的规范脉冲回放仍保有原768MiB预算，不拿它的余量分配给本组件。
该批不是性能测量，不声称速度提升或OpenMP/GPU演化已验证。

## 原始资料与检索范围

Exa单一接口检索请求5条候选，实际采用Netlib与OpenBLAS官方接口资料，
排除镜像重复；没有做广泛库排名。

- [Netlib LAPACKE接口](https://www.netlib.org/lapack/lapacke.html)：整数/布局与INFO规则。
- [OpenBLAS ILP64分发约定](https://www.openmathlib.org/OpenBLAS/docs/distributing/)：
  64位符号后缀存在不同约定，必须核对实际二进制，不能仅凭DLL文件名推断ABI。
- [NumPy v2.2.6调用层](https://github.com/numpy/numpy/blob/v2.2.6/numpy/linalg/umath_linalg.cpp)，
  GitHub blob `ead6d84a73a27b172ff6bcc55654dee203fc74ab`。
- [LAPACKE声明](https://github.com/Reference-LAPACK/lapack/blob/master/LAPACKE/include/lapacke.h)，
  本次GitHub读取blob `4b9647e077b1e687f797d2c87e794dedbf96e7aa`；网页分支会更新，
  上述blob为实际核查身份。没有复制外部算法实现或再分发DLL。

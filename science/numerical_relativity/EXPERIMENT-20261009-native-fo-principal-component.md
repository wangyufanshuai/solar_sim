# Windows C++ FO-CCZ4 主部移植：前瞻合同

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: native principal assembly, speed generation and actual-RHS controls
- Origin Date: 2026-10-09
- Verification Status: PLANNED; COMPONENT ONLY; NOT AN EVOLUTION BACKEND
- Version Label: nr-native-fo-principal-component-v1

## 范围与不变量

用户选择先推进C++对等移植，不启动新的长时Python回放。本批关闭主部生成这一
依赖：输入局部h、chi、alpha、beta及Cartesian轴，C++自己生成58维主矩阵、
去平移的47维PDE速度族，再调用已验证的原生谱分解组件。Python不提供矩阵或根。
仍用q_t=A^i d_i q+S的符号、canonical58布局、11个精确零ODE行/列。

只支持当前合同：advective 1+log、theta coupling=2、c=e=s=1、
f=3 alpha chi、mu=0.2 chi、0<alpha<2、chi>0、对称正定h且|det(h)-1|<=1e-10。
这是实验性场依赖规范的代码级移植，不声称连续强双曲性、完整Einstein方程推导
已获独立证明或任意规范参数受支持。不做行列式修复、谱裁剪、伪逆或容错替换。

新增独立C++17/MSVC项目。原Python方程、345个冻结源码键、既有C++ RHS、
已验证的ILP64/谱分解六文件及旧回滚二进制保持不动。不安装/下载/复制DLL。
所有输出在E盘；不修改app、美术、live路径或科学payload。

## 事先比较合同

1. 原生生成的完整主矩阵，与Python方程收缩组装结果比较：
   maxabs差/max(1,Python矩阵无穷范数)<=2e-13；ODE行/列精确零。
2. 速度重数精确一致，总计47；合并阈值仍为1e-12乘根尺度；
   根值差/max(1,最大根幅值)<=2e-13。
3. 正/负谱矩阵及确定性jump作用的归一化差<=2e-11；
   空度三阈值、条件数上限、能量/残差门槛沿用已验证组件，不放宽。
4. 独立测试可执行文件通过include未改动的旧C++实际FO RHS提取58列：
   5^3周期网格中心，独立槽位的正负仿射扰动，相同中心状态使零阶源抵消。
   FD2和FD4、epsilon=1e-5和2e-5分别控制；
   maxabs差/max(1,闭式主矩阵无穷范数)<=5e-10。
   该检验不经过新主矩阵组装函数，也不演化时间。
5. 覆盖平直、对角曲率、非对角h、正负/微小平移、固定种子的det=1度量，
   以及首轮规范脉冲真实保存端点的角/面/中心，均检查三个轴。
6. 同一二进制/依赖/输入重复进程stdout须逐字节一致。不是跨编译器逐位承诺。
7. 非有限、非对称、非SPD、非单位行列式、越界alpha/chi、非法轴、错布局、
   多余/缺失输入及错误模式必须拒绝。不以重试或降低阈值把失败改为通过。

当前Python与原生SVD仍使用同一个已验证OpenBLAS二进制；跨语言谱比较不是
独立线性代数算法。实际RHS探针与闭式组装是不同代码路径，但共享既有方程选择。
已保存端点只提供局部系数，不等于原生重演了该轨迹。

## 资源与完成标准

编译每个阶段120秒；单个组件进程30秒；测试批次600秒；测试产物64MiB上限。
每次调用检查C>=3GiB，E>=4GiB+32MiB并预留完整测试产物预算。
记录输入、stdout/stderr、调用状态、源码/二进制/DLL/父回执指纹和比较指标。
部分失败记录保留，后续修改需新目录；最终资格要求零失败、零跳过。

本批没有SBP体积离散、六面SAT、RK4时间推进或新方法checkpoint/restart，
这些是下一依赖而非本批隐含完成项。没有性能、OpenMP加速或GPU就绪声明。
所有物理、真实边界、黑洞、AMR、波形和live准入保持false。

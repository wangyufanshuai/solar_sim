# 原生六面阶段局部SAT：前瞻合同

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: native single-stage coupling parity and deterministic controls
- Origin Date: 2026-10-10
- Verification Status: PLANNED; NO TIME EVOLUTION OR PHYSICAL ADMISSION
- Version Label: nr-native-sat-component-v1

## 实现边界

将已分别验证的SBP(4,2)全58槽体积方程和局部特征分解接合。旧组件文件、
Python方程、历史回执和失败目录保持原样。复用原生主矩阵/速度族，不输入
Python生成的矩阵、特征根或惩罚矩阵。只支持当前Cartesian规范合同：
f=3 alpha chi、mu=0.2 chi、0<alpha<2；不投影、不重建辅助场、不回退legacy。

六个显式目标按axis0左右、axis1左右、axis2左右排列，面内切向轴升序。
q_t=A_n d_n q；左面加A_minus(q-target)/H_endpoint，右面加
-A_plus(q-target)/H_endpoint。面权重为各轴17 dx/48；边、角按六面顺序累加。
11个ODE槽不可受惩罚。每次RHS内部新建缓存，键为axis及当前cell前11槽
的原始FP64字节；绝不复用目标场、前一阶段、舍入键或平直近似系数。
即使跳跃为零也构造/验证特征分解，不能绕过边界det(h)门禁。

CFL与Python相同：dt乘三轴(max_cell[abs(beta_axis)+最大内禀速度]/dx)之和，
内禀速度包含全部六族；上限0.25(1+1e-14)，dt必须有限且正。
全域接受体积组件的有限、正定、可逆状态；|det(h)-1|<=1e-10仅施加在
构造边界特征分解的节点，不能偷偷改成全域投影或全域单位行列式门禁。

新入口一次接受1..3个独立RHS请求，用A/B/A序列检查同一进程内缓存作用域。
不是时间步、restart或批处理求解器。输出每个请求的完整bulk、coupled RHS、
六面独立惩罚，以及CFL、各轴最大速度、当前系数字节SHA256、缓存构建数、
条件数/残差和几何极值。输入/所有请求均成功后才输出，失败stdout为空。
严格C++17浮点；OpenMP仅并行体积，边界特征循环固定顺序；BLAS固定1线程。

## 预先固定的验收

1. 对照Python实际NonlinearSBPCube.rhs，不用仅主矩阵的替代测试。
   full58、bulk及coupled逐槽/whole/interior/closure_band/faces/edges/corners的
   maxabs差/max(1,maxabs该槽该区域参考)<=2e-11。各面惩罚独立同阈值对照；
   不以全域大范数掩盖小槽或边界错误。
2. 单独按Python当前场特征分解复算六面惩罚，逐面累加C++输出，必须逐字节
   等于原生coupled RHS；ODE保持bulk字节，严格内点等于bulk。
3. 平直零跳跃、ODE-only目标变化惩罚精确零；非零特征入射/出射控制逐面
   核对符号和17 dx/48权重（残差<=2e-11、出射绝对<=2e-12）。
4. 非对角/空间变化h且det=1、不同lapse/chi/shift、tiny shift、9x10x11非等距、
   17立方上限、Schwarzschild及既有N13保存初值/端点。合成场并非物理初值。
5. 同进程A/B/A：B改变当前系数、目标不变；三次缓存构建数/系数SHA对照
   当前输入，A两次输出逐位相同。signed-zero键必须保持原始字节区别。
6. CFL相对/绝对尺度误差<=2e-13；测试内部速度峰值、边界附近可接受/拒绝dt、
   非单位内部det可接受、边界det超限拒绝。统计条件数对照误差<=2e-10尺度，
   原有特征残差/条件数门禁不变。所有缓存构建数精确匹配Python。
7. 正控制独立进程复测stdout逐位一致；选定完整状态在OpenMP1/2/4线程
   数值payload逐位一致。非法形状/schema/数量/长度、非有限状态/目标、
   lapse/chi/metric、dt、线程、模式、库路径拒绝，stdout空；晚批次错误亦如此。
8. 源码、生成片段、运行库和历史来源指纹运行前后不变，零失败零跳过才记
   本组件通过。不把组件一致性、同一OpenBLAS结果当作独立物理或独立算法验证。

## 资源、来源和后续

构建每阶段120秒；本批900秒、512MiB产物预算，原生单次最多120秒。
C>=3GiB；E>=4GiB+32MiB并另留完整512MiB。越线停止，不清理、降阈值或
覆盖旧证据。所有新输出/临时文件写E盘；记录每次输入/输出、调用状态、
来源/二进制/实际加载OpenMP和OpenBLAS身份、测试XML与对照记录。

本批没有RK4时间轨迹、checkpoint、空间/约束收敛、CPBC、真实辐射边界、
非线性稳定性、完整黑洞、AMR、波形、GPU或live准入。上述标志仍false。
后续为全阶段RK4/短轨迹及方法绑定的确定性checkpoint/restart，然后按实测成本
另立共同终点时间/空间/约束实验。用户选择C++优先，不启动扩展Python回放。

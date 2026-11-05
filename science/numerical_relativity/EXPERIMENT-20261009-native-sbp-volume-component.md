# Windows C++ SBP体积方程：前瞻合同

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: native nonlinear volume parity and deterministic thread controls
- Origin Date: 2026-10-09
- Verification Status: PLANNED; VOLUME COMPONENT, NOT TIME EVOLUTION
- Version Label: nr-native-sbp-volume-component-v1

## 问题与实现边界

本批把现有Python的SBP(4,2)体积离散接到Windows C++，不启动新的长时Python回放。
目标是全网格58槽非线性RHS与Python一致，包含所有面、边、角的差分行和零阶源。
不是只迁移主矩阵，不冻结旧halo，也不把表面导数填零。

旧C++文件`cpp/nr_k2_fo_ccz4_shadow.cpp`保持原样，SHA256固定为
`6252ec9b2901f03e51081410a612b9b6ed9d1ddd3469663f8d8dd9663944e457`。
构建时提取其canonical布局、几何函数、参数常数和完整FO RHS正文，生成在E盘
独立构建目录中；只作三个公开的适配：RHS数组以总cell数分配、循环用总cell数、
删除旧Dirichlet-halo跳过分支。方程项不改写。源文件指纹或提取标记不符即拒绝构建。
生成片段再由测试逐字节对照固定原文及三处规定替换，禁止悄悄换方程。

新的State持有只读58槽和预先计算的三轴SBP导数，禁止缓存之后修改字段。
支持每轴9..17节点的长方体，独立坐标范围/间距；OpenMP并行仅逐点计算RHS，
没有跨点归约，不调用BLAS。规范仍为advective 1+log、theta=2、c=e=s=1、
f=3 alpha chi、mu=0.2 chi；kappa1=0.1、kappa2=0、kappa3=1，tau_inverse显式传入。
这是本方法的体积分支，不是legacy周期/固定halo或checkpoint的新别名。

所有槽有限、h正定且满足旧C++逆矩阵非奇异下限、lapse/chi为正正规FP64数，
0<lapse<2，规范系数有限；非法状态不裁剪或投影。先校验状态与导数再进入并行区，
完整RHS非有限则拒绝输出。独立A/B/D/P保持输入值，不从基变量重建。

## 预先固定的测试

- SBP权重/矩阵逐轴对照Python；HD+D^T H=B残差<=2e-13。
  常数导数精确零，边界至二次、内部至四次多项式控制误差<=2e-11。
- 58槽批量导数对照：maxabs差/max(1,maxabs参考)<=2e-13。
- 完整体积RHS逐槽、分whole/interior/face/edge/corner报告：
  maxabs差/max(1,maxabs该槽该区域参考)<=2e-11。
- 平直真空RHS精确零；空间常数但非平凡58槽验证非线性源和独立辅助场；
  非单位det(h)/非零trace(A)的tau=0/1差分另用解析松弛公式核对，不能靠投影通过。
- 平滑非对角58槽、长方体非等间距网格、Schwarzschild解析初值，以及既有N13
  规范脉冲保存初值/端点，对照完整RHS并要求曲率数据的表面RHS非零。
- 同一输入在OpenMP 1/2/4线程的数值payload逐字节一致，1线程另起进程复测。
  元数据线程数字允许不同。此处不声称跨编译器逐位一致或加速效果。
- 错schema/尺寸/坐标/数据长度、非有限值、非SPD、过大/过小log字段、非法tau、
  线程数和模式必须拒绝，stdout为空。不吞掉错误或回退旧离散方法。

代码级对等不证明Einstein解正确；合成58槽允许辅助约束违反以检测源项，
不是物理初值。保存状态的RHS对照也不等于C++已重演整段轨迹。

## 资源与输出

Windows x64 / MSVC C++17严格浮点，使用现有工具链，不安装依赖。
输入输出采用明确的小端FP64二进制payload加版本化文本头，避免大数组JSON膨胀；
这不是checkpoint。保存每次完整输入/输出、调用状态、对照指标、生成代码、
来源/二进制/OpenMP依赖指纹与测试XML；旧回执及失败目录不覆盖。

编译每阶段120秒，原生单次30秒，本批测试600秒、产物256MiB上限。
C>=3GiB，E>=4GiB+32MiB并另留完整256MiB批次预算。越线停止，不清理或降阈值。
零失败、零跳过且来源无漂移才记为本组件通过。

本批不接六面SAT、不做RK时间步或restart，不改变任何物理验收阈值。
所有物理、真实边界、完整黑洞、AMR、波形、GPU及live准入仍false。
后续依赖为阶段局部SAT、RK4全阶段/短轨迹与方法绑定的确定性checkpoint。

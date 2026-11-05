# 原生SBP/SAT/RK4阶段与短轨迹：前瞻合同

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: bounded native RK4 implementation and trajectory parity
- Origin Date: 2026-10-10
- Verification Status: PLANNED; NO PHYSICAL OR RESTART ADMISSION
- Version Label: nr-native-rk4-component-v1

## 方法不变

复用已验收原生全58槽SBP(4,2)+六面当前场值SAT，不改此前方程/组件源文件。
按Python `NonlinearSBPCube.step`的算术顺序实现经典RK4，无投影、辅助重建、
halo冻结、自动缩步或失败回退。固定f=3 alpha chi、mu=.2 chi、tau_inverse=1。
每个中间状态均重新构造体积导数、执行CFL与当前系数特征分解/阶段内缓存。

步骤n的边界输入标签严格为整数半步[2n,2n+1,2n+1,2n+2]，K2/K3共享同一
显式目标记录，不能在步内冻结或用浮点时间查找。所有请求预先提供连续标签表，
错序/重复/漏项/多余项拒绝。每轴9..17点，一批1..4步；起始步骤n非负且
n+steps<=2^52，防止半步标签溢出/转浮点不精确。dt有限正且不自动改动。

输出每步四阶段输入、四个完整RHS、原始RK4端点及四阶段SAT报告，均canonical58
小端FP64。方法ID固定`nr-fo-ccz4-sbp42-analytic-sat-rk4-no-projection-v1`。
各端点只执行Python状态构造同类的有限/正lapse与chi/SPD检查，不额外施加
单位det、alpha<2或CFL门槛；这些属于下一次RHS的门槛。不得用端点投影改变方法。

失败stderr报告attempted step/stage/half-step/phase，stdout为空。本组件失败保存
完整输入/边界目标与错误定位，不声称保存了未输出的接受轨迹前缀。
后续长实验与checkpoint runner必须另有持久化前缀合同。本批不是restart格式。

## 预先固定的比较与控制

- Python实际`NonlinearSBPCube.step`记录全部阶段，不以简化ODE代替完整FO测试。
  每阶段输入/RHS及各端点逐槽、whole/interior/closure_band/faces/edges/corners
  比较，maxabs差/max(1,maxabs该槽区域参考)<=2e-11。
- 从原生保存的q0/k1..k4，用独立NumPy算术重组四阶段与端点，要求原字节一致。
  每步下一个q0等于前一个原始端点，无投影；当前系数SHA与保存阶段输入一致。
  每阶段缓存构建数必须等于该原生阶段边界精确字节键的实际数，不假设Python
  与C++非逐位相同的中间数组具有相同重复键数。
- 边界回调标签/阶段数/六面顺序必须精确匹配；CFL/几何报告尺度差<=2e-13，
  特征残差/条件数沿用2e-11/1e6门槛。短轨迹对等不是时间阶数测量。
- 平直零源保真（含4步上限与非零起始步骤）、时间变化六面目标、非等距长方体、
  Schwarzschild外域N9、已有N13规范脉冲初值和保存端点。合成目标不是物理边界。
  N13脉冲使用原dt=1/448，最多两步，不启动扩展Python全程回放。
- 正控制独立进程复测stdout逐字节一致，至少两个非平凡短轨迹在1/2/4线程
  payload逐位一致。不比较跨编译器字节、不宣称加速。
- 原始端点传给新进程继续，分段轨迹必须与同进程连续轨迹逐字节一致，包含
  非零起始步骤和后续边界标签；这不是具备来源/方法验证的checkpoint恢复。
- 原始阶段里制造真实det/profile/CFL失败，要求在正确阶段拒绝，不能只测试
  程序启动失败。非法schema、尺寸、步数/索引/dt、目标标签/数据/长度也须拒绝。
  输出不会伪装成成功步或恢复点。
- 源码/旧组件/生成方程/运行库指纹运行前后不变，零失败零跳过才记本组件通过。
  首次测试失败保留；任何实现/夹具修正均使用新证据目录重验，不改旧物理阈值。

## 资源和待办

Windows原生MSVC C++17 `/fp:strict`，OpenMP1/2/4，OpenBLAS1；不安装新工具。
构建每阶段120秒、每次原生调用120秒、定向测试整批1200秒、产物768MiB。
C>=3GiB，E>=4GiB+32MiB且另留完整768MiB预算。新临时文件/证据均写E。
保存全部调用输入/输出、Python阶段参考、比较与错误、运行身份、来源SHA、XML。
越线停止，不清理、不降低底线、不擅自延长超时。

后续先做方法绑定checkpoint/restart及分段/跨线程恢复，然后再定真实科学实验
预算和共同终点时间/空间/约束收敛。仍不证明CPBC、真实辐射边界、非线性稳定、
完整黑洞、AMR、非零波形、GPU或live准入；scientificPayloadWriteback=false。

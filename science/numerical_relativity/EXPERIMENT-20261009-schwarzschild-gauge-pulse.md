# Schwarzschild 约束相容 lapse 脉冲：前瞻实验合同

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: prospective simulation and independent saved-state audit
- Origin Date: 2026-10-09
- Verification Status: PLANNED; SHADOW ONLY
- Version Label: nr-schwarzschild-gauge-pulse-v1

## 科学问题和不替代的旧结论

上一轮全域/面/边/角时间筛查约四阶，但中心低于2e-13下限，整体unresolved。
它还使用会改变K_ij且没有解Einstein约束的扰动初值。本轮新增规范基准，
不是为了替换旧问题或追求通过：用同一Schwarzschild物理初值，单独激发lapse，
考查现有3D FO-CCZ4+SBP/SAT+RK4的实际时间自收敛及约束演化。
旧问题保持unresolved；新问题无论结果如何，都不能回填旧门禁。

理论依据为Gourgoulhon初值讲义第2.1节的Hamiltonian/动量约束：它们只涉及
空间度量与外曲率，不含lapse/shift。来源：
[原文](https://arxiv.org/html/0704.0149v2)。Exa一次定向检索请求5条候选，
返回同一作者论文/讲义的重复载体；只作为这一个理论依据，不称五份独立支持。
GitHub读取固定提交
`37e659523830418b210acea1661dac0e00bb1b75` 的
[NewConstraints.hpp](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/NewConstraints.hpp)，
其约束输入使用无规范变量的类型。旧Constraints.hpp已弃用，仅用于发现新入口；
没有复制外部代码，也未安装或运行GRChombo。

## 固定初值

M=1，正八分体立方体[1,3]^3，N=13。原静态各向同性Schwarzschild
gamma_ij=psi^4 delta_ij、psi=1+1/(2r)、K_ij=0保持逐字节不变。
令u_i=(x_i-2)/(3/4)，B=product(max(1-u_i^2,0)^6)：

- log(alpha_new)=log(alpha_Schwarzschild)+0.001 B；
- A_i,new=A_i,Schwarzschild+0.001 partial_i B，使用解析导数；
- 只修改canonical槽6、25、26、27；其余54槽不变；六面全部58槽初值不变；
- B在[1.25,2.75]^3以外为零，拼接为C5而非C-infinity；
- 不投影、不解椭圆方程、不修改物理K_ij或metric；不是注入物理引力波。

因此连续初始H/M与原真空解相同；离散H仍有原空间截断误差，不能填零。
这个新规范初值的正时间坐标解未知，静态reference只作背景差和边界目标，
不能把相对它的state_error标签解释为已知精确演化误差。

## 数值实验与评价

原规范参数、RHS、SBP(4,2)、静态解析入射SAT目标、RK4均不变，none策略，
无持续投影。固定7/14/28步，dt=1/112、1/224、1/448，共同T=1/16M。
各阶段保持CFL<=0.25、det误差<=1e-10及所有既有局部特征门槛。
原观察器与run_case直接复用，不替换运行时全局对象。保存全部raw/effective/RHS
阶段和接受点，对初值与每个接受点重建独立H/M。

五区域whole/central_box/faces/edges/corners分别计算58槽SBP加权RMS的
粗-中/中-细差；两项差都必须>2e-13才报p=log2(E_coarse/E_fine)。
3.5<=p<=4.5且差下降才passed；可分辨但不满足为failed；不可分辨为unresolved。
只有全五区域passed才通过这个单网格短窗时间筛查。计算完成和筛查通过分开。
不验证普适时间阶数、空间收敛、物理边界、强场长期稳定、视界或波形。

所有三案例事先登记。数值方法失败停止该案例、不重试；资源或证据失败终止全批，
保留已接受前缀和失败阶段。只有完整且来源有效的计算才在另一个进程/新目录
精确复现一次，包括筛查failed/unresolved的完整计算；不自动重试部分/崩溃批次。
独立审计不执行生产初值生成器、RHS或积分器，用因式分解形式的脉冲及独立
Schwarzschild公式核验初值，用已有独立几何审计和显式SBP权重复核保存数组。

## 门槛、来源与资源

父首轮/回放/审计SHA256：
`c86f57d76b656b19b73118204c210a1c217428de490463eec8f0f7aa50dc8c56`；
`1c4afb196ee5c882bcd9f28330ca18240dcd32c8b98ee3fef94b214a3cafa08e`；
`508dada74add44933a90d24cd88f83f6e57b603ae92c5f9152ea055e0db50530`。
继承2042项回归XML SHA256：
`1e3bf68f3dbe09ee559666f99aeb9a293284d35ecce1e00fca2f263e8e27e76f`。
先通过新初值/运行器/审计器测试及全部继承回归，方能启动新数值矩阵。
启动和结束都验证父回执、父产物及冻结源码，保留native回滚身份。

每批49步/196RHS阶段，参照上一轮约1212秒/675MiB，保持2400秒/768MiB
原上限（含32MiB回执余量），不扩大资源合同。C>=3GiB，E>=4GiB+32MiB；
启动前另预留768MiB。新产物和临时文件全部在E。不安装、不清理、不改父仓库、
不改美术、不切live。所有物理/边界/AMR/黑洞/波形/GPU准入仍false。

入口：scripts/run-nr-k3-schwarzschild-gauge-pulse.py；审计：
scripts/audit-nr-k3-schwarzschild-gauge-pulse.py。使用D:\python\python.exe -B，
BLAS/OpenMP单线程、关闭字节码写入；工作目录为独立next-web。

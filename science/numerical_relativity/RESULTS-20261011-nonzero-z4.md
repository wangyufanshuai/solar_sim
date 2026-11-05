# 非零 Z4 与 C++ 独立瞬时方程控制：通过，科学演化门禁不变

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: bounded implementation controls and saved-data verification
- Origin Date: 2026-10-11
- Verification Status: NONZERO Z4 / POLYNOMIAL NATIVE COMPONENT CONTROLS PASSED; NOT FULL PHYSICS ADMISSION
- Version Label: nr-nonzero-z4-controls-v1

## 结论

新增独立物理 Z4 参考，将上一批 Theta=Z_i=0 的限制扩展至非零 Theta/Z_i 及其空间导数。
从物理 gamma、K_ij 的几何与 Z4 方程出发，对共形变量定义求导，核验冻结 Python 的
全部58槽；不调用生产 FO 几何、差分或 RHS 来生成预期变化率。

本轮还**直接调用既有 C++ 体积组件**与独立物理参考比较，不仅是 Python/C++互相对拍。
原生测试的物理度规和K_ij为常数、规范58槽为最多二次多项式，SBP所有行可精确求导至
浮点舍入误差。这是瞬时体积方程的受限独立控制，不是一般曲率场下的离散误差验收。

64项新测试、54项前批ADM回归全过，零失败、错误或跳过。新测试控制台6.10秒，
完整运行器22.593秒；28次原生调用全返回0，没有时间步、SAT、checkpoint或新编译。
所有1/2/4线程数值payload逐字节相同；4组另起进程的1线程完整stdout逐字节相同。
测试数量与原生调用数量均不应称作独立物理基准数。

## 实测结果与覆盖

| 核验对象 | 最大绝对差 | 事先上限 |
| --- | ---: | ---: |
| 24组Python完整58槽RHS | 6.869504965e-16 | 2e-12 |
| 重构物理gamma变化率 | 7.142723912e-16 | 2e-12 |
| 重构物理K_ij变化率 | 3.642919300e-17 | 2e-12 |
| 重构物理Z_i变化率 | 2.602085214e-17 | 2e-12 |
| 4组C++完整58槽RHS | 9.367506771e-17 | 2e-12 |
| C++三轴SBP导数与解析导数 | 7.771561172e-16 | 2e-12 |

Python测试覆盖两种稠密旋转、两种符号、Theta-only/Z-only/both、两组阻尼参数。
原生四组场使用固定(.1,0)阻尼，分别为zero/Theta-only/Z-only/both。
全网格、面、边、角的全部58槽分别记录误差；没有只选中心区域或大幅值变量。
零Z4极限、均匀阻尼与lapse因子、解析空间导数及辅助链式法则、非法输入拒绝、
只读快照均通过；故意漏去逆度规变化率、协向量Lie项或阻尼lapse因子均能检出。

H/M允许非零；这些制造场不是求解约束后的真空初始数据。共形代数约束和辅助定义
约束则按定义一致，因此独立违反这些约束时的ordering/松弛项仍没有被该物理参考覆盖。
有限差分检查解析jet的专用2e-11阈值沿用前批，未用于放宽任何正式物理验收标准。

## 身份、资源与保存数据复核

429个既有资格源未改；新增5项构成434项源码闭包，当前文件、前后身份和保存快照全部一致。
原生exe、OpenMP运行时、7个组件源、4个生成片段保持历史已验收身份；未重新编译。
旧原生组件68项XML与完整514项清单重新读取核验，但没有重新运行其历史测试。

623项清单产物加最终回执共624个文件，29,880,741字节，约28.50 MiB。
低于64 MiB/600秒上限，保留2 MiB收尾空间及C>=3 GiB、E>=4 GiB+32 MiB底线。
全部新产物在E盘；没有自动重试、清理用户文件、修改美术或live dynamics。

测试后再次独立读取保存数组及28次原生输入/输出：输入payload与保存状态逐字节一致，
输出与保存独立预期逐槽比较，线程/进程复现重新通过；不是仅信任pytest退出码。
434项当前/快照哈希、623项产物哈希和两份完整零跳过XML再次核验。

证据目录：`tmp/nr-shadow-evidence/nr-k3-nonzero-z4-controls-v1-20261011`。

| 证据 | SHA256 |
| --- | --- |
| qualification-gate.json | 679d5b69be2177b384bfa2beb0294a8da70df8e376c0140e37f75e3beca147a9 |
| tests.xml | b5c1042325de838357486a9a1a9777a7bfd56e0be116e0230f9d9f4fa6ea89f3 |
| continuum-adm-regression.xml | 3f818c56976b14a1d9a2e340de28b990b58c6535d1fc5a966ff0d9740badaf36 |
| nonzero-z4-observations.json | 6c580262be9037e0d266ab2b6250cd63f507a37c857d4296411ba7907e390aa4 |
| 既有C++ exe | b7459bdb251702ec51e6cf16282daaa05f835b4b624a1a494fb30c3753d01251 |

## 仍未关闭的科学门禁

本轮仅将nonzero_z4_continuum_consistent和native_polynomial_component_consistent置true。
independent_einstein_rhs_validated、auxiliary_constraint_violations_validated、
spatial_convergence_validated、physical_boundary_validated、physical_gate、live_admission、
scientificPayloadWriteback仍为false。瞬时代数一致不证明正时间误差、非线性稳定性、
物理辐射边界、约束收敛、黑洞/AMR/视界/波形或GPU正确性。

原N13 v2的边区域时间收敛未分辨结论保留；本轮不重判或替换该实验。
N9正式14/28/56步矩阵未执行，仍等待单独的人类确认，不把控制测试通过视为授权。
下一条独立验证依赖是辅助/代数约束违背下的完整FO扩展、实际离散截断和边界验证；
正式空间/约束收敛需要独立的前瞻数值实验，不能由本批浮点级差值替代。

## 来源与实现约定

[Alic等原作](https://arxiv.org/html/1106.2254)的物理Z4式(6)-(9)和定义/规范式(10)、
(20)-(23)经Exa核对；使用alpha*kappa1阻尼，GammaHat变化率由定义推得。
[GRChombo固定源码](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/CCZ4RHS.impl.hpp)
经GitHub只读核对，注意其可选阻尼重标度不同；没有声称运行GRChombo或等同其默认配置。
详见[事前协议](EXPERIMENT-20261011-nonzero-z4.md)。科研与测试技能用于固定案例、
负对照、预算和证据边界；本组确定性控制不作统计显著性或论文级复现声明。

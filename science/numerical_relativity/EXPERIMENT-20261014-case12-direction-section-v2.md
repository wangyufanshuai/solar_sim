**case12 八射线 v2：使用已资格化扫描器的一次受限完整验证**

日期：2026-10-14，Asia/Shanghai。Origin Skill: academic-research-suite / experiment-agent。Verification Status: UNVERIFIED before execution。方法 nr-case12-direction-section-controls-v2。

**授权与继承**

用户在本聊天直接要求“创建顶级goal快速开发并运行”，顶层goal按2026-10-14续接规划覆盖扫描控制、有限方向验证及后续依赖。该新指令晚于旧规划只授权扫描控制的状态。P0已经完成一批控制且通过；据此新增本协议和v2入口，在原预算内执行一次完整八射线。不是自动续跑旧失败批，也不把旧完成的五条与新部分结果合并。

P0监护94.813秒，42项控制通过；来源570项、历史6,858项；当前控制证据显示混合性能结果。必须绑定成功P0终态376eaea8e34fe4b1c9adac48b1e620ae39afc6dadba919df8f65c886ad9c17f2、worker f9ca6f5f65e39575f83f5e6225c90a4797f10e7479a4c47f84f548d32d66e9f1、全部来源与完整产物清单。候选扫描器源码身份不得变化。

v1原入口、数学模块、测试、失败目录和全部历史保持原样。v2通过显式SingleScanBudget工作进程与父监护注入，保留原supervise。新增来源仅本协议、v2入口和P0结果报告，总来源573项；历史包括P0完整729文件，共11目录/7,587文件。

**唯一命令与资源合同**

    D:/python/python.exe -B scripts/run-nr-k3-case12-direction-section-v2.py --output-directory tmp/nr-shadow-evidence/nr-k3-case12-direction-section-controls-v2-20261014

输出目录必须不存在。一次执行，无续算、无自动重试。总输出64 MiB、600秒、2 MiB终态预留、8 MiB来源快照；C>=3 GiB、E>=4 GiB+32 MiB，启动另留完整输出预算。64 MiB不是RAM限制。单数值线程；所有后代纳入Windows Job，启动握手、定时监护与失败终态保留。

成本可行性尚不确定。v1前五条用时约39.4、74.5、98.4、139.8、180.0秒，伴随产物树增长；这不能单独分离数学、扫描和背景负载。P0同批旧失败完整目录guard旧/新比仅1.27062，且有目标稍慢。没有足够数据保证v2在600秒完成；将600秒视作硬停止边界，完整性优先，不能降低判据、删方向、拼接历史或自动加预算。

**数学范围不变**

固定case12物理背景、变量/约束顺序、公式和精确有理数实现。八射线按原顺序：(1,2,-1)、(1,0,0)、(0,1,0)、(0,0,1)、(-1,-2,1)、(2,4,-2)、(1,1,1)、(1,-1,0)。每条从头构造leading D、主矩阵K、显式section S与约束主矩阵Ac。

每条要求精确右逆 D S=I43、完整核闭合 Ac D=D K、反向主元独立商矩阵一致、能量对称化、projector/paired-energy内部恒等式、section精确回放。固定秩[11,12,8,4,8,0,0,0]、分母14、原始下界min(1,1/ray_squared)/14、归一化下界1/14；保存未约简残差与中间矩阵，并补齐每条的zero、6个pair和6个action矩阵，共104个额外证书文件。方向度规界5/6至964403/781250、速度平方间隙下界867/40000保持原值。

ray-0同时与冻结父矩阵比较：70/50位转换舍入一致、原始binary64输入不修复、相对阈值2e-12不改；1e-6浮点扰动必须被拒绝。每条section与principal各施加1/1000000精确扰动，必须保留非零残差，共16个不同的端到端见证。

原16项数学控制整文件运行并核对唯一函数身份，无失败/错误/跳过；禁用conftest、缓存、外部插件及继承筛选，使用-s防止捕获临时文件与外层目录监护竞争。另登记8个轻量入口结构控制：有效结构接受，以及P0失败、未资格化、来源漂移、缺失/重复射线、缺失/重复负控见证分别拒绝。后七项是隔离的内存结构变异；不改真实P0文件，不构造新数值结果，也不与16项数学控制混为一谈。

**验收与停在哪里**

完整验收要求：8/8有序射线完成；16数学控制；16个独立精确扰动见证；两类浮点扰动拒绝；冻结输入、保存残差/逐射线结果、来源/快照、历史前后闭合；独立finalizer与成功工作/监护终态一致；完整产物清单；所属进程清理完成。任一项缺失均不能称整批通过。最终source与input身份变化直接失败。

若超时、资源拒绝、数值不一致或任意异常，保留新失败前缀与终态，停止本批所属进程，不自动重试。旧v1仍是TIMEOUT，不能被v2结果改写。

成功结论最多为固定case12背景的八个登记方向上显式section、约束闭合与局部主部能量实现成立。不构成全方向机器证明、方向统一能量/强双曲性、低阶统一界、一般规范/曲背景、非线性稳定性、CPBC、物理边界、约束收敛、零频完整43逆或阻尼证明。此次不执行时间演化、完整科学矩阵、native/GPU、黑洞、AMR或波形；physical_gate/live_admission/scientificPayloadWriteback保持false。

来源：[原方向推导](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/DERIVATION-20261013-case12-direction-section.md)、[原失败报告](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/RESULTS-20261013-case12-direction-section.md)、[P0结果](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/RESULTS-20261014-single-scan-controls.md)。

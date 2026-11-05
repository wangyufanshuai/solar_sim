# 独立初始 ADM 张量核验通过；一般 Einstein RHS 仍未认证

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: implementation controls and independent analytic verification
- Origin Date: 2026-10-11
- Verification Status: INITIAL-SLICE CONTROLS VERIFIED; GENERAL EVOLUTION UNVERIFIED
- Version Label: nr-initial-adm-results-v1

## 这次真正新增了什么

新增一个不导入求解器初始化、差分、曲率或演化代码的连续 ADM 解析模块。
它针对既有 Schwarzschild lapse 脉冲，在 T=0 从物理三维度规推导完整 K_ij
变化率，再映射到 conformal A_ij 和 K；原来的独立静态标量源检查仍保留。
直接 ADM 表达式与消去静态 Schwarzschild 项的表达式相互核对。

控制把精确解析导数作为局部参数供给冻结的 FO-CCZ4 volume RHS，比较全部58槽
和重建的物理 K_ij 变化率。固定 N9/N13/N17、零/正/负脉冲共9个初始状态。
这使用了 RHS 进行初始代数求值，但未积分时间、未调用原生程序、未执行 SAT。
N17 的代数求值不构成对其不合格步长的 CFL 放行。

符号根据 [Gourgoulhon 的3+1方程(4.63)-(4.66)](https://arxiv.org/pdf/gr-qc/0703035)
核对；另只读对照 [GRChombo 的固定版本实现](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Source/CCZ4/CCZ4RHS.impl.hpp)。
未运行 GRChombo，不声称与成熟代码完成数值对拍。详细推导、检索边界和预注册阈值见
[控制协议](EXPERIMENT-20261011-initial-adm.md)。

## 结果

| 项目 | 测量结果 |
| --- | --- |
| 新控制测试 | 78通过，0失败/错误/跳过，1.621秒 |
| 空间预检回归 | 70通过，0失败/错误/跳过，0.432秒 |
| 包括来源核验和快照的整批时间 | 16.031秒 / 600秒上限 |
| 独立初值与原初值最大差 | 3.3306690738754696e-16 / 2e-14阈值 |
| 全58槽初始 RHS 最大差 | 9.736417764052882e-17 / 2e-12阈值 |
| 物理 K_ij 变化率最大差 | 7.719519468096792e-17 / 2e-12阈值 |
| 两种独立代数表达式最大差 | 6.245004513516506e-17 / 2e-12阈值 |
| 应为零的其余51槽最大残差 | 5.798213070316863e-17 |
| 非零正/负脉冲最大变化率 | 0.0159676617 / 0.0159357583，非全零假通过 |
| 文件 | 433个文件、432项索引、3949227字节 / 64 MiB上限 |
| 源码 | 419项既有资格源不变，新增5项；424项当前源码与快照一致 |

80位 Decimal 对原始标量函数的数值导数检查通过，涵盖中心、离轴、支撑边界和
支撑外位置；该比较仍是固定间隔的数值控制，不是形式化数学证明。
符号反转、漏 chi、漏 trace-free 三个错误映射被检出。未知缓冲区、复制数组、
改动后的已登记数据及错误 base/轴被回调明确拒绝。
Ruff格式与静态检查通过；未放宽阈值或修改419项资格源。

## 证据身份

目录：`tmp/nr-shadow-evidence/nr-k3-initial-adm-controls-v1-20261011`。

- 资格回执 SHA256：`0cbaf529b95641a2c47e0522e8b82e5609c4f26b7af869dca06649de6bd81329`
- 新测试 XML：`2da15e7484cd4ffc8899888fe98282aa3913985ce9f52c786f2e7cef9e92960f`
- 回归 XML：`db1a29ade571429292254e1ab227e840d3f9633ce5eeb86408930e4c8e88b165`
- 九状态观测：`5990d4da0c04efe51df7d6ca1a01bc54a44ccd25207796a2172fc7187eba4ca5`

运行后重新计算全部432项产物和424项当前源哈希，无不一致。
Windows PowerShell默认JSON对象不区分A/a名称，首次只读汇总遇到解析错误；
改用保留大小写的哈希表后读取成功，原始JSON、测试和回执均未修改。
结束时C约9.68 GiB、E约19.45 GiB，高于原底线；没有清理旧产物或更改预算。

## 当前项目水平与下一个门槛

这把项目推进到“可审计的3D FO-CCZ4 shadow原型，具备原生确定性检查点和
一个非平凡初始切片的独立物理演化核验”。不能据此称为已达前沿的通用数值相对论代码。

本控制刻意绕开差分截断，用于隔离检查连续方程实现；它不能证实真实离散 RHS
在给定分辨率下足够准确，也不检查正时间的非零K/A/shift/Z4一般耦合。
下一层独立验证仍应覆盖这些一般状态、空间约束收敛、物理边界及长期稳定性，
之后才有依据推进黑洞/AMR/波形资格。已有诊断或AMR代码不等于这些门禁通过。

原N13 v2到T=1/8的结果保持不变：边区域信号低于2e-13下限，整体时间收敛门禁
仍未通过，不以本次约1e-16的解析一致性误差替代该门禁。
N9 14/28/56步完整批次仍待人类单独确认，原832 MiB/2400秒预算不变，N17不运行。
科研技能要求限制证据外推，测试技能落实独立参考和错误映射反例；两者均不授权
新的完整科学批次。`independent_einstein_rhs_validated`、physical/live/writeback持续false；
只有限定为初始解析切片的 `analytic_initial_adm_acceleration_consistent` 为true。

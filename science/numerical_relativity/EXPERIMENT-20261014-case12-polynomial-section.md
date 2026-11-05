**case12 全实非零方向右截面：一次有界多项式证书实验**

日期：2026-10-14，Asia/Shanghai。Origin Skill: academic-research-suite / experiment-agent。执行前状态 UNVERIFIED。方法 nr-case12-polynomial-section-controls-v1。

**授权与结论范围**

直接用户指令“创建顶级goal快速开发并运行”及当前active goal授权依完整路线开发、运行新的合理受限实验。本批处理固定case12有理公式延拓的 Dhat(v)S(v)=I43，v为任意实数非零三维向量。此前八射线v2的600秒失败完整保留，不重跑、不续算、不拼接为成功。

本批只验证右截面和对应行秩，不验证 Dhat K(I−S Dhat)=0、统一能量、强双曲性、零频逆、非线性稳定性、边界、收敛或演化。不是完整Python语义形式化证明。physical_gate、live_admission、scientificPayloadWriteback保持false；shadow-only、legacy可回滚，原物理阈值2e-12不变，本批多项式判据为精确零。

**唯一执行与资源合同**

    D:/python/python.exe -B scripts/run-nr-k3-case12-polynomial-section.py --output-directory tmp/nr-shadow-evidence/nr-k3-case12-polynomial-section-controls-v1-20261014

目录必须不存在。一次执行，失败无自动重试。沿用资格化SingleScanBudget及原Windows Job监护：总600秒、输出64 MiB、终态预留2 MiB、来源快照8 MiB、C至少3 GiB、E至少4 GiB+32 MiB；启动额外预留完整输出预算。64 MiB是磁盘输出上限，不是RAM限制。数值线程为1，进程归属与清理独立核验。

来源580项：冻结v2的573项加本批模块、独立重放器、测试、入口、推导、本协议、v2结果报告7项。历史12目录/8,716文件，含失败v2的1,129文件；前后及finalizer核对完整历史。v2终态SHA为161f8bfbe6bbad1a0842399238aa280bcdc412b24447e8291bafadbf0085a292，完整树规范摘要为c9176c3198d590a5bd77af516afb0ac2f25a5511dd92f2a64ce45acb0c95a37b。

**固定来源与计算**

固定三份原始源码SHA后，从AST复制原lift、section、leading和rational/determinant/inverse/Background/case12/zeros辅助定义。只移除symbolic输入不适用的Background类型、r/g/chi正性入口检查及leading末尾Fraction数组转换；保留约束向量Fraction检查，原公式、索引、函数体和常量不作代数改写。正性由固定实数域的独立证据补回。保存全部适配与未改辅助AST摘要，finalizer只用AST重建并比对。候选不接受外部context注入。

使用安装环境SymPy1.13.3、NumPy2.2.6构建QQ(x,y,z)公式，再清分母到QQ[x,y,z]：r=vᵀv，g=vᵀh⁻¹v，Dtilde=rDhat，Stilde=chi·r·g²S，delta=chi·r²·g²。实际检查Dtilde为43×58且次数≤3，Stilde为58×43且次数≤6，delta次数≤8，全部43×43残差Dtilde·Stilde−deltaI次数≤9且每个系数精确为零。拒绝未清除的分母、浮点、布尔或错误系数域。

固定背景h=LLᵀ，L为单位下三角，独立有理数验算h h⁻¹=I、常量与行范数。由||h||∞=6/5得到g≥(5/6)r，chi=18/25，因此chi·r·g²≥r³/2、delta≥r⁴/2。只有v≠0可除；单位球上的两个分母均至少1/2。本批不推广到所有SPD背景。

**测试与独立验收**

完整测试文件预登记28函数/55参数化实例，无失败、错误、跳过；从冻结AST登记实例数量并与JUnit唯一身份核对。覆盖源码漂移/未知适配拒绝、固定域/常量、精确类型、分母/次数、完整零矩阵、规范序列化与错误格式、独立卷积、精确小量、guard传播。包含在坐标轴消失但系数非零的xy反例。测试不重复构建整份43×58/58×43证书，仅使用轻量context和4个原lift列。

整份证书只构建一次。四个登记的物理因子/符号变异为metric-base-factor-two、hamiltonian-factor-four、gamma-factor-two、momentum-trace-sign，分别扰动保留Stilde的登记列/行。每种必须保存58×1改变量及43×1非零残差；受监护工作进程中的独立重放器从原保存Stilde重新构造改变量并验算。

所有矩阵按严格行优先保存每个坐标，包含零；系数为约分后的整数分子/正分母字符串，幂次严格排序唯一。第二套仅依赖标准库Fraction的稀疏多项式卷积从文件重放全部1,849个残差及四个负控，独立核对分母与统计。独立重放仅在受Windows Job硬截止保护的worker中执行，逐份绑定实际解析字节的SHA；finalizer核对18份输入的同字节摘要、完整报告、AST及来源，不在父进程重复矩阵计算。独立重放不依赖SymPy残差声明，也不以抽样方向代替多项式系数检验。

保存Python版本/可执行文件摘要、依赖版本、已加载数值模块文件摘要；finalizer重新计算这些文件摘要。此身份记录不声称覆盖全部操作系统DLL。验收同时要求source当前/快照/前后表一致、12份历史树不变、完整测试与负控、工作进程和监护终态成功、完整产物清单及清理成立。

**停止规则**

超时、预算、测试失败、精确残差非零、来源或历史漂移、未知异常任一触发失败，保存本批前缀与终态，只清理所属进程，不自动重试。不得把预期次数、推导、已写代码或部分矩阵当作执行通过。成功后仍保持顶层goal active，下一科学门槛为独立的全方向闭合残差及能量适用域。

推导：DERIVATION-20261014-case12-polynomial-section.md。旧失败：RESULTS-20261014-case12-direction-section-v2.md。总路线：PLAN-20261014-top-tier-gr-development.md。

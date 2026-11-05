# 固定 case12 物理频率变换与主部连接：完整受限批次通过

日期：2026-10-15，Asia/Shanghai。Origin Skill：academic-research-suite / experiment-agent，沿用现有工作流。性质：本地完整精确证书与独立算法重放；外部团队复现仍未完成。顶层 goal 保持 active。

## 结果与范围

固定 case12、geometric=False、实方向 v≠0、复频率参数 ζ≠0，已完整计算

`Z=(rT)Q(rTi)=r²TQTi`，其中 `r=x²+y²+z²`。

Z 的完整 −2..6 九幂均已保存并独立重算。高于一阶的五个系数全部精确为零，完整主部残差 `Z1−rAb` 也精确为零。因此变换后的一阶系数确为既有 `Khat43=Ab/r`，保持原 shift。这里的 Ab 是已接受的43维主部商，与58维代数源 J58 不同。

实际 Z−2 也为零；Z−1 保留18个非零位置，不能删除低阶项或据此声称无条件能量守恒。单位方向 r=1、ζ=iρ 时，本批实际结果给出 `TQTi=iρKhat43+Z0+(iρ)⁻¹Z−1`。该式不用于ρ=0，零频仍单独保留39维物理像。

本批只将 `physical_frequency_reduction_validated`、`physical_reduced_principal_bridge_validated` 两项置为true。原17项限制标志保持false，包括全频率能量、实际非线性RHS桥、阻尼、合法物理边界、收敛、演化、外部复现、physical/live及科学载荷写回。未恢复43维零频右逆，也未证明原物理约束的无损失L2估计。

## 唯一实际运行

目录：`tmp/nr-shadow-evidence/nr-k3-case12-physical-frequency-reduction-controls-v1-20261015`。

- [资格终态](E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/nr-k3-case12-physical-frequency-reduction-controls-v1-20261015/qualification-gate.json) SHA：`5817e42e5c38ff682146acf3ce8eb5afe439b5cfadddf0dc1e27f91c6ab2688d`。
- worker SHA：`c2739fbb4c40365cecb700c73522349bdcff0e116542b3d5ef2aa5280c3d9296`。
- independent-replay SHA：`7df5f34321f744a41dce72687ad3f0511627bd0ac064a34be6d8a2f362f7802b`。
- run ID：`f28f81d3-2ec1-49be-babd-46b76ee6b75f`。
- worker **92.312秒**；完整监护 **129.453秒**。外层会话48439实际exit0，worker PID13412退出；终态phase=complete、passed/completed均true、errors为空。
- Windows Job绑定成功，所属进程清理前后0→0，cleanup_verified=true；重试0，无注入或中断。

原600秒、64 MiB磁盘输出上限、2 MiB终态预留、8 MiB来源快照限制、单数值线程及C/E磁盘底线保持。测试和数学只在唯一owned worker中执行；无提前科学试算、自动重试、扩大预算或失败结果拼接。原物理阈值2e−12不变，本批多项式接受条件为严格精确零。

| 阶段 | worker相对秒数 |
|---|---:|
| 输入、来源及历史完成 | 43.656 |
| 131项控制完成 | 46.203 |
| 全部生产证据保存 | 51.859 |
| 完整独立重放完成 | 56.937 |
| worker完成封存 | 92.297 |

这些阶段耗时不构成演化求解器加速比。

## 完整覆盖与真实负控

生产结合顺序为 `(tQ)u`；独立标准库Fraction/整数卷积使用 `t(Qu)`，其中t=rT、u=rTi。两者都保留端点及完整零矩阵。所有矩阵明确保存43×43全部1849个位置。

| 矩阵族 | 矩阵数 | 显式位置 | 结果 |
|---|---:|---:|---|
| Z，−2..6 | 9 | 16,641 | 九幂逐槽独立一致；2..6全零 |
| leading_residual | 1 | 1,849 | 全部精确零 |
| bad_Q2 | 1 | 1,849 | 实际修改43个对角位置 |
| mutated_Z，−2..6 | 9 | 16,641 | 由实际变更输入独立重算 |
| 合计 | **20** | **36,980** | 全部独立验收 |

五个高阶Z与主部残差共 **6矩阵、11,094必需零位置**，全部精确为零。Z−2的全零是额外实际结果，不替代任何必需残差检查。

| Z频率幂 | 非零位置 | 单项式数 | 实际方向次数 | 保存上限 |
|---|---:|---:|---:|---:|
| −2 | 0 | 0 | 零多项式 | 2 |
| −1 | 18 | 54 | 3 | 4 |
| 0 | 764 | 5,529 | 5 | 5 |
| 1 | 596 | 6,819 | 6 | 6 |
| 2..6 | 各0 | 各0 | 零多项式 | 7/8/9/10/10 |

真实负控固定 `bad_Q2=Q2+x²I43`，保持输入齐次2。生产实际计算变更贡献并加回实际baseline；独立重放直接使用bad_Q做完整三因子乘积。mutated_Z2实际出现43个非零位置、258单项式，变更的高阶位置数也为43，故被拒绝；其他高于二阶系数仍完整保存并验零。没有将理论预期 `ζ²x²r²I43` 直接填作结果。负控证实的是多项式非零，不能声称它在x=0的方向也非零。

## 来源与封存

| 项目 | 实际记录 |
|---|---|
| 测试 | 40函数、131实例；0失败、错误或跳过 |
| focused / 冻结整数控制 | 19/58与21/73 |
| 新来源闭包 | 671文件，6,933,761字节 |
| 历史保护 | 26目录，18,764文件，497,367,872字节 |
| 完整本批文件 | 791摘要加终态，共792文件，19,582,683字节 |
| 已加载运行时 | 557文件，17,244,821字节 |
| 父输入 | 28份，4,135,852字节 |
| 实际重放输入 | 55份，5,195,618字节 |
| 阶段回执 | 52份 |

生产SHA：`b561643f42cf90e8b1429c2a4fef6212e98c6895d9cdbf5be02cb266e3985927`。

runner SHA：`7c98a8929d07f6c5916e9369e60eef86d944a257f117ece7e7c7e9a1a64c4ae8`。

focused测试SHA：`08dbe75bec51cccabb0f460548be9ad46cbb4963e27697f3c1246f0de16575b5`。

实际运行绑定的EXPERIMENT SHA：`20277d85ffabf0613e2384d7bf559e95cfd3e8963d1eff1809d8858310f6e493`。执行前的最终文档含完整测试注册；先前静态检查时的旧文档摘要不是该运行身份。

| 下一阶段输入 | SHA256 |
|---|---|
| Z__p_m2.json | 9a5bab51be9e8db6d2ead1d3f204b4bbee8c040b611c9db1748dd486ef715e3f |
| Z__p_m1.json | 372952de2a403cf386375268e769eb71ff29ff446c77ca0ce13dde8611ece60e |
| Z__p_0.json | f5fea9f8a8afdc3d19998c9a8c76c69fdf26978c8a4da89d78d919f031f5bfae |
| Z__p_1.json | 63db06601fcb9955d3d9f7ed2492aa54c0139d81f9afb1c0b05ed2fd72d0c811 |
| domain.json | 159df33b73c256708f93ee79755ea49495d3337ecab1495ae07c1cef6fd9b3b9 |
| source_bridge.json | 31c07259adf22fc5239f8655e53d2051f54f1c422ba2efaa749bdc17284fa84e |

终态后root只读核对全部产物、当前来源及快照、完整历史、运行时、55解析输入及XML/AST测试身份，errors=[]。第二路独立完整审计同样errors=[]，还逐一对照28份父输入与原历史路径、父产物清单及provenance摘要，确认真实bad_Q2只改43个对角位置、mutated_Z2的43个非零位置及258项完整保存。两路核验只用JSON/XML/AST和字节摘要，未加载NumPy/SymPy/pytest或补算科学矩阵。运行时覆盖Python可执行和已加载模块，不代表全部OS DLL。

## 接续

下一候选分别构造完整58维原状态的常背景统一L2增长界，以及43维物理约束经T变换后的频率加权增长界。实际T/Ti的多项式频率权重必须完整保留，不能把加权结论当作原43变量的无损失L2结论。ρ=0使用原多项式符号及39维物理像，不对Laurent坐标求值。

具体设计见[全频率增长界候选](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/NOTE-20261015-case12-uniform-frequency-growth-next.md)。新界及其真实负控尚未执行；实际RHS对应、变背景、合法初边值、可分辨收敛、黑洞、AMR、波形和外部复现仍依原路线逐级推进。

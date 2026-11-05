# 固定层相容性诊断结束；进入 SBP/SAT 边界实现路线

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: frozen diagnostic, separate-process replay, boundary-operator implementation
- Origin Date: 2026-10-08
- Verification Status: RESTRICTED PREDICTION AND OPERATOR TESTS PASSED; PHYSICAL GATES OPEN
- Version Label: nr-boundary-compatibility-and-route-v1

上一目标轮次是水平评估，没有关闭新物理门禁。本轮完成最后一个事先约定的
区分性诊断，执行独立进程重放，作出边界优先的路线决策，并新增实际可调用的
SBP(4,2)参考算子。不是重新规划替代开发；完整NR目标仍active。

## 1. 独立预测及实际证据

按[冻结协议](EXPERIMENT-20261008-boundary-compatibility.md)，读取已有9份T=0状态和
9份真实原生RK阶段文件。没有新时间演化、重新编译或大数组文件复制。

在这个静态、共形平直、零shift初态上，由
[FO-CCZ4原始论文方程12](https://ar5iv.labs.arxiv.org/html/1707.09910)的K、Theta和a方程
独立约化得：

`Qdot = Kdot - 2*Thetadot + tr(adot) = -Lap(alpha)`。

对解析Schwarzschild的A_i、P_i使用独立的直接加权FD4，构造离散Lap(alpha)；
另用解析散度检验连续值为零，使用60位Decimal在125个固定共同节点交叉检查。
预测不读取生产RHS、生产差分或原生k1来生成源项。

- **9/9初态源预测通过**：原生Qdot与遮罩后预测的最大误差6.63802780e-16。
- 原生tr(adot)最大8.77617289e-18，实际保留而不是强设为零。
- 连续Laplace恒等式最大残差2.40100081e-17。
- 原生/Decimal共同核心最大差2.51416531e-16；double/Decimal最大差3.95146961e-16。
- 独立解析初态与保存的初态最大差6.66133815e-16，低于冻结2e-14。
- 固定层自身的原生源严格为零；把同一离散算子自由延拓到这些点时，解析输入产生
  非零截断源。该自由延拓不是建议使用的边界数据，不会写回状态。

随后由`delta k2[A_i]=-dt*d_i(delta Qdot)`预测整个原活动区的三分量响应：

| 原N | 对照 | 原生A响应最大值 | 独立预测最大误差 |
|---|---|---:|---:|
|17|upper-original|1.65732255e-9|1.70472784e-18|
|17|both-upper|1.04946830e-7|2.73264740e-18|
|25|upper-original|4.45423646e-10|6.07267156e-18|
|25|both-upper|4.38327620e-8|1.95880521e-17|
|33|upper-original|1.78858648e-10|9.34663789e-18|
|33|both-upper|2.20891393e-8|1.13719947e-17|

**6/6通过**，各响应均高于2e-12的预定可测底限。固定层源差单独预测的残差最大
2.33528638e-17。唯一非零的坐标/浮点剩余来自N25的both-upper，响应最大
2.12715347e-17；它没有被抹零。其余五对该剩余严格零。
距原固定层超过两层活动点后的A响应，五对严格零，该N25对为5.00580383e-18。
这是FD4模板的离散作用范围，不是物理因果速度。

结论限于：固定层把本应出现的离散初态源置零，能够预测这个特定首个k2响应。
不能据此断定它是T=1M失败的唯一原因，也不能声称真实时空精度达到1e-17。
K/Theta中的曲率项在本组合中相消，不意味着应从完整方程删除它们。

## 2. 独立重放与身份

两次分别在独立Python进程分析；首次10.5193538s，重放15.3356372s，均退出0、
completed=true、prediction_passed=true、errors=[]。两份解析收据除seconds外
全部字段相同。耗时不作为性能比较；这不是第三方求解器交叉验证。

两次各247个源及247个快照重新哈希均匹配；18份输入在运行前后被校验。
247个快照不是247个科学样本。每次分析目录2,674,157bytes（含收据），不包含
另外的pytest临时目录；新产物与临时目录均在E盘。

- [首次收据](../../tmp/nr-shadow-evidence/nr-k3-boundary-compatibility-v1-20261008/receipt.json)
  SHA256 `6db4c07fc63e9ed13ec569e5306cb2588ab264a5371818cc5831b1cb2dc8dd6a`。
- [独立重放](../../tmp/nr-shadow-evidence/nr-k3-boundary-compatibility-replay-v1-20261008/receipt.json)
  SHA256 `f177d3986dce69db4348b129f7fcf9de0b379d6a38f1078b519ab7c8469d9fa0`。
- 未改动的生产FO源SHA256
  `6252ec9b2901f03e51081410a612b9b6ed9d1ddd3469663f8d8dd9663944e457`。

原域、高侧、低侧、双侧扩域失败回执均再次核对原SHA256，没有修改或重新判为通过。

## 3. 路线决策已经落实到新的算子代码

[路线决策](DECISION-20261008-boundary-gauge-route.md)结束固定初态源排查线，选择
diagonal-norm SBP/SAT作为下一个显式shadow边界离散候选。保留58变量FO方程与
Windows原生回滚基线，不在同一次边界比较中偷偷修改规范系数。

新增[sbp_boundary_operator.py](sbp_boundary_operator.py)：

- 无ghost的节点对齐一阶导数，支持任意数组轴及58槽三维布局。
- **内部四阶、边界二阶**，每面四个边界闭合行；元数据分别记录两个阶数。
- 正定对角积分权重；成对差分保持常量严格不变，不是数值截断/过滤。
- 有界的小网格矩阵诊断，不在应用中组装大稠密矩阵。
- 独立标量线性对流SAT，用于检查左右入射方向与离散能量关系。

数学系数通过GitHub核读[原始实现表](https://github.com/ranocha/SummationByPartsOperators.jl/blob/main/src/SBP_coefficients/MattssonNordstr%C3%B6m2004.jl)，
对应Git blob793d768b0bb39df2339c63901a7eb300ddbbc779；不是安装或调用Julia包。
先前无变音符号的文件路径返回404，随后按仓库目录找到实际路径，没有把404当依据。

该算子**尚未接入生产RHS或完整58变量特征/约束边界**。标量SAT能量检查仅说明
常系数半离散控制正确，不证明任意RK步长、变系数、黑洞或非线性CPBC稳定。

SBP源SHA256 `ea2568b0399fe93fe4cf7354c5718bd1eb2ed77e8f60f800d310699b0bc71ed6`；
测试SHA256 `1f84767647597074a8e77475fbb9712e8f23cdfe693f543d06cb426ed36e1ee7`；
决策SHA256 `07ef7b6212bd91b489b5c7f33bdc977e7c3abbdd9cfd6f7339a390a881a2e4a3`。
三者在最终回归前后相同；它们是源分析冻结之后的独立新增内容，不冒充247源快照的一部分。

## 4. 验证范围及保留的开发失败

- 相容性新测试58项通过，包括实际Python初态RHS与独立几何对照。
- SBP新测试67项通过，包括9节点精确有理数SBP恒等式、正定范数、内部degree4/
  边界degree2矩条件、所有数组轴、58槽常量保持、正/负速度与非齐次入射SAT能量式。
- 最终合并定向回归 **910 passed in29.20s，0失败、0跳过**。包含旧785项及新增
  58+67项，不再把中间843项重复累加。范围是此前Schwarzschild/FO/局部性测试集合
  加两个新模块；不是全仓库、浏览器或Next构建。
- 六个新Python文件Ruff通过。
- [最终JUnit报告](../../tmp/nr-boundary-route-regression-v1-20261008.xml)
  SHA256 `6e6cfc914737a30aa0939aac51af1ef7f80babc7932d24f8952ffa36447b89d4`。

首次单元测试57通过、1失败：质量3的独立坐标/差分计算有6.66378607e-16舍入差，
大于最初测试写的2e-16绝对界限。真实数据运行前，将该测试改为由machine epsilon、
差分尺度和A场量级计算的保守舍入界限；没有修改oracle公式或任何科学验收阈值。
不是隐瞒一次科学失败或事后放宽2e-12/2e-14门槛。原pytest-asyncio弃用提示保留。

## 5. 下一实现门槛与限制

下一项是把SBP范数和SAT配对到**实际58变量的特征/约束结构**，先完成有明确入射
数据、源项、方向和时间步条件的冻结系统能量/传播控制，再进入曲率与变系数。
不沿用旧的错误速度代理；不把Minkowski特征基无条件复制到弯曲边界。
不能仅增加标量测试就把耦合边界标为完成。

物理黑洞的穿刺/切除、含视界长期演化、AMR、双黑洞与波形验收仍未完成。旧FD4
门槛不变；SBP边界的低阶闭合必须进入新的明确误差预算，不能改写旧实验的阶数标签。

physical_validation、physical_boundary_validated、black_hole_evolution_validated、
amr_validated、waveform_validated、gpu_validated、runtime_writeback、
scientificPayloadWriteback继续全部false。没有live切换、美术改动、安装、删除、
提交、推送或父仓库操作。最近资源核查C约4.06GiB、E约18.45GiB，仍保留用户
指定的C>=3GiB、E>=4GiB+32MiB底限。

科研技能用于预先冻结预测和结束诊断分支；测试技能用于独立算子与拒绝路径，
没有用测试总数替代物理准入。完整goal保持active。

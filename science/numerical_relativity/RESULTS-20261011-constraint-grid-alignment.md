# 跨网格约束场对齐通过控制；仍不能单凭共同节点判定空间收敛

## 本轮结果

新增非周期、节点中心的完整约束场对齐模块，71项新控制和77项原有同网格比较器
回归测试全部通过，均为零跳过、退出0。没有运行新的科学演化或历史空间矩阵，
没有改变原T=1/8时间阶数未分辨结论。全目标仍未完成，保持shadow-only。

本次不是把已有周期AMR改名复用。原周期传递包含代数投影，而新模块只处理已在各自
网格上算出的H/M诊断场；没有状态投影、RHS调用或演化入口连接。

新增文件：

- [诊断场对齐](constraint_grid_alignment.py)
- [解析与反例测试](../../scripts/tests/test_nr_constraint_grid_alignment.py)
- [有界控制入口](../../scripts/run-nr-k3-constraint-alignment-controls.py)
- [执行前固定协议与来源](EXPERIMENT-20261011-constraint-grid-alignment.md)
- [隔离测试配置](../../scripts/nr-constraint-alignment-tests.ini)

## 实现与精度合同

每轴固定六点、五次局部Lagrange多项式，有理数网格索引构造权重。端部移动模板，
不外推、不周期绕回；重合节点直接复制原值。三维张量积按轴进行，保留标量与三分量
笛卡尔向量的布局，不接受canonical58演化状态作为“诊断场”自动处理。

低层6..65点仅是有界诊断算子的输入范围，不扩大求解器/H/M重构的资格范围。
约束入口严格要求既有N9/N13/N17、[1,3]^3、G=c=mass=1、相同有理数时间、
同诊断方法/单位/归一化。全部三对差异采样到固定N9坐标和SBP权重，报告五个原物理区域。

| 来源网格 → 共同N9网格 | 每轴重合节点 | 操作 | 每轴最大绝对权重和 |
| --- | ---: | --- | ---: |
| N9 → N9 | 9 | 恒等复制 | 1 |
| N13 → N9 | 5 | 重合点复制，其余局部插值 | 1.625 |
| N17 → N9 | 9 | 嵌套节点精确取点 | 1 |

N13的三维最大范数扰动放大上界为1.625³=4.291015625。它只是算子权重界，
不是插值截断误差界、SBP能量稳定性或AMR保守性证明；这些资格明确保持false。
未知约束场高阶导数没有独立界，不能把五次多项式精确性升级为任意场的精度保证。

输入不改写，缓存系数与返回场使用不可写底层字节；合法网格填入缓存后，再输入浮点、
布尔或错误网格也不会绕过检查。没有使用浮点“近似相等”来混淆不同物理时间。

## 控制真正覆盖了什么

- 0..5次多项式和三维混合多项式，与独立Vandermonde求解对照，绝对容差2e-12。
- 六次多项式不要求虚假的精确重现，而核验其误差等于已知Lagrange余项。
- 非多项式exp函数在固定目标节点上随源网格加密的传递误差降低；这只检验该解析函数。
- 恒等与嵌套取点逐字节一致，包括负零；N13/N9共有节点原值精确保留。
- 轴次序、向量分量、端部不wrap、不可变缓冲区、非有限/复数/错误布局/身份/时刻拒绝。
- 平直度规加常数K的解析约束H=(2/3)K²，在K=h、h²时分别形成已知h²、h⁴误差。
  测试的是非均匀h下比较代数，不是实际Einstein求解器的空间收敛。
- 专门的合成高频反例：N17奇数位置非零，全部N9共节点恰好为零。
  对齐后场差可接近零，但N17原始场范数显著非零。原网格范数因此始终保留。

该反例是有意注入的合成诊断场，不是实际Einstein状态生成的物理结果。
它证明共同节点比较存在漏检可能，不证明当前实际轨迹一定含此类高频误差。

## 两项会影响下一步实验设计的结论

### 1. 不能使用统一二倍细化公式

三档h为1/4、1/6、1/8，相邻细化比3/2、4/3。已知纯h²误差的相邻场差比为
2.857142857；纯h⁴误差的场差比为5.942857143，而不是4与16。
因此把这些差比直接取log₂会得到错误阶数。当前模块不估阶、不产生收敛通过标志。

### 2. 共同粗节点差异不能作为唯一空间门禁

插值误差尚未定界，粗节点也可能漏掉细尺度信号。后续空间实验应保留各原网格
H/M对连续真空零约束的残差，隔离时间误差，并将共同网格完整场差作为带有限制的
附加诊断。原网格权重/物理区域、边界影响、误差地板和阶数判据都需在新实验前固定。
不能用本轮人工误差或反例选择让实际结果过关的阈值。

## 来源核查及技能如何影响实现

Python测试技能推动了反例、不可变输入、错误拒绝和独立数值预期，而非只检验正常路径。
Exa本轮定向查询5个候选、选读2个一手来源，并通过GitHub只读核查SciPy文件：

- [CarpetProlongateTest](https://einsteintoolkit.org/thornguide/Carpet/CarpetProlongateTest/documentation.html)
  的多项式测试与误差范数提供了传递控制设计参考。
- [Einstein Toolkit维护者说明](https://lists.einsteintoolkit.org/hyperkitty/list/users@lists.einsteintoolkit.org/message/XGQBEDPMUOHJWO2XB5YYGVBTZZNVTECN/)
  明确区分单元平均值和节点/中心采样值，提示必须核实坐标与边界对齐。
- [SciPy插值源码](https://github.com/scipy/scipy/blob/main/scipy/interpolate/_polyint.py)
  中重合节点返回原值的逻辑用作交叉参考；本次读取650–890行，blob SHA
  `739e5c83fa1d26e4172cbe28035b30380c1bb6e1`。我们的系数由有理数公式独立实现，
  没有复制该代码，也未下载/安装任何外部求解器。

上述旧官方文档/讨论是方法来源，不是对2026年最新发布能力或本项目物理水平的认证。

## 执行与证据

```powershell
& 'D:/python/python.exe' -B scripts/run-nr-k3-constraint-alignment-controls.py --output-directory tmp/nr-shadow-evidence/nr-k3-constraint-alignment-controls-v1-20261011
```

这是已执行命令；目录不可覆盖。71项新控制用时1.27秒，77项回归用时1.36秒；
整个受控批次7.313秒。416个文件共3,854,233字节，415个文件进入哈希索引，
407项源码在运行前后及当前/快照间一致。396项原科研源和上一轮402项比较器资格
集合均没有改变；本次仅加5项。耗时不是正式性能或加速比基准。

资源低于64 MiB/600秒预算。结束后C约9.71 GiB、E约19.73 GiB，超过原底线。
新3个Python文件Ruff通过；没有安装工具、启用GPU或运行原生演化进程。

- [控制门禁](../../tmp/nr-shadow-evidence/nr-k3-constraint-alignment-controls-v1-20261011/qualification-gate.json)
  SHA256 `87a34882b6afa831b2423d9d5e7242a10692952961c0cc977b5ca845ed8d62bb`
- [解析控制观测](../../tmp/nr-shadow-evidence/nr-k3-constraint-alignment-controls-v1-20261011/control-observations.json)
  SHA256 `697ebe781f61cd303a6e20b4151a40948fa4c7773c3e6fc11046040ba03027c8`
- [71项新测试XML](../../tmp/nr-shadow-evidence/nr-k3-constraint-alignment-controls-v1-20261011/alignment.xml)
  SHA256 `7739842eb6b444ea4d204b796a87485cbfdb00fe1cba31c3e05d75e8eac4e407`
- [77项回归XML](../../tmp/nr-shadow-evidence/nr-k3-constraint-alignment-controls-v1-20261011/same-grid-regression.xml)
  SHA256 `fd7fc9201e036d76390180968d2739c34ab26a3273503fd2c369e31dc6aa149f`
- [上一轮完整场结果](RESULTS-20261011-constraint-field-comparison.md)

## 仍未完成的真实目标

新的比较方法已具备受控基础，但独立空间约束收敛、时间误差隔离、真实边界稳健性、
黑洞长时演化、AMR物理闭环、视界/ADM/Psi4、CUDA和live准入均不能据此记为完成。
下一步先审计可执行空间矩阵与原预算、注册误差分离和物理验收条件，再取得必要的新
科学计算批准；不自动追加长跑，也不改变历史未分辨/失败结论。

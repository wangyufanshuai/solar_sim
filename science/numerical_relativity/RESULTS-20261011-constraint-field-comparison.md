# 完整约束场比较器控制通过：范数接近不能替代场接近

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: additive diagnostic implementation, controls and saved-endpoint analysis
- Origin Date: 2026-10-11
- Verification Status: 77 CONTROLS PASSED; SAVED-FIELD ANALYSIS COMPLETE; SHADOW ONLY
- Version Label: nr-constraint-field-controls-v2-results

## 结论

新增比较器可从已保存 canonical58 状态提取完整 H_metric、H_metric_hessian、M_metric
数组，在同网格、同物理时间计算真正的场差。77项新控制测试全部通过、零跳过。
随后只读分析已验收v2的三个T=1/8末点，完成粗-中、中-细、粗-细三对比较、五区域、
三种场，共45组比较。没有新科学演化、RK阶段计算或检查点推进。

关键发现：中-细两档的全域 Hessian-H 范数之差约5.39e-13，但实际场差RMS约1.32e-11，
约为前者24.46倍；面区域约73.85倍。这不是证明演化错误，而是证实仅比较标量范数会
漏掉空间结构的差异。旧T=1/8状态时间阶数整体 `unresolved` 保持不变，不能把本次
事后约束场分析新增为通过门禁。

## 本次新增的科研能力

- [完整场适配器](constraint_field_comparison.py)：暴露旧独立dense-SBP审计器的H/M场，
  保留D1-on-connection旧H，并单列独立lower-index Riemann / D2 Hessian-H。
- [反例与张量控制](../../scripts/tests/test_nr_constraint_field_comparison.py)：等范数反号、
  空间重排、向量分量归一化、mask/权重/非有限/广播拒绝、不可变数据、身份拒绝、
  非对角度规、非trace-free A、Theta与物理K区分、解析H/M和生产完整场逐点对照。
- [有界控制入口](../../scripts/run-nr-k3-constraint-field-controls.py)与
  [只读末点分析](../../scripts/analyze-nr-k3-constraint-fields.py)：控制全绿后才读取实际末点。
- [预注册控制协议](EXPERIMENT-20261011-constraint-field-controls.md)：固定范围、数值定义、
  实现对等容差、资源预算和不可升级的物理声明。

没有修改396项冻结科研源码或原生二进制。以上6项新增源码/协议在冻结集合外，
本次402项总源码在执行前后、当前文件与快照间均相符。没有修改美术、网页live动力学、
初值、步长、SBP/SAT/RK4、物理门槛或旧回执。

## 方法与限制

变量重构使用完整物理外曲率：`g=h/chi`、`Kij=(Aij+hij*Kslot/3)/chi`，无代数投影；
保留非零A迹，Theta不混入物理K。诊断为 `H=R+tr(K)^2-tr(Kmixed^2)` 与
`Mi=Dj(Kmixed^j_i)-Di(trK)`。M沿用原离散混合张量求导，不以连续乘积法则偷换离散定义。

适配器只覆盖继承的N9/N13/N17立方网格、[1,3]^3、G=c=mass=1。不同时间、网格、
坐标、单位、诊断方法、归一化拒绝比较；当前没有跨网格插值/限制功能。

五区为全域、固定中心盒[1.5,2.5]^3和codimension 1/2/3面/边/角。
SBP体积权重与旧诊断一致；每节点先平均平方分量，M向量明确除以3。
这是固定笛卡尔坐标的分量RMS，不是物理逆度规收缩的协变向量范数。
区域不是五个互斥的整体分割，不可把五项相加当全域。

适配器独立于演化RHS，但复用了已冻结的独立审计器，不能称为第三套独立Einstein实现。
2e-12仅是继承的诊断实现绝对一致性容差，不是物理残差或新收敛门槛。

## 控制执行与保留失败

首轮v1在第三项空间重排控制处失败：2项通过、1项失败、其余未执行。
NumPy求和归约对同一组数不同次序产生1.7763568394e-15范数差。原失败目录、XML、
日志与源码快照全部保留，未追补通过结果。失败门禁SHA256：
`5cd3cbbeaa666bb034a8b27beca355f735412c31ed2de9dd00cf9dd9ca5cd712`。

修复仅针对新增比较器：最终加权累加使用math.fsum；原反例精确相等断言保留，
没有放宽任何门槛。v2新目录77项全部通过，测试用时2.81秒；整个有界控制及实际末点
分析8.969秒，两个子进程均退出0。末点分析用时1.219秒。

新v2共410文件、3,823,759字节（约3.647 MiB），409项入哈希索引；包含402项源码快照。
低于64 MiB/600秒合同，保留2 MiB收尾空间。运行后观测C约9.69 GiB、E约19.76 GiB，
仍高于C=3 GiB、E=4 GiB+32 MiB底线。该耗时不构成受控性能或加速比证据。

```powershell
& 'D:/python/python.exe' -B scripts/run-nr-k3-constraint-field-controls.py --output-directory tmp/nr-shadow-evidence/nr-k3-constraint-field-controls-v2-20261011
```

以上是已执行命令；目录已存在，入口会拒绝覆盖。重做控制需另用新目录并通过同一资源检查。
后续源码改动应重新控制验证，不可复用旧绿色门禁冒充新源码资格。

## 实际保存数据：T=1/8中-细差异

三档均是原N13、相同原初值、原dt=1/112、1/224、1/448，到绝对步14、28、56。
核验父/子及独立审计回执、binding、global plan、三个检查点SHA与其嵌入plan/state/grid/time；
没有重新复算全部历史RHS，也没有重新审计整个父子878/857项数据索引。

| 区域与场 | 两范数之差 | 真实场差RMS | 后者/前者 |
| --- | ---: | ---: | ---: |
| 全域 H_metric_hessian | 5.392019296e-13 | 1.318907015e-11 | 24.46 |
| 面 H_metric_hessian | 7.762627346e-14 | 5.732614904e-12 | 73.85 |
| 全域 M_metric | 1.804769035e-13 | 4.209666111e-13 | 2.33 |

完整JSON保留所有区域、三对比较及旧H；没有选择有利时刻或忽略不利区域。
重构完整H/M与生产诊断的最大逐点绝对差3.355226931e-14，
重构区域范数与保存值的最大绝对差2.749883654e-14，均小于继承的2e-12实现对等容差。
新表采用独立实现重新归约，末尾位可能与旧生产范数表不同；这不覆盖旧记录。

这些量是时间步细化下、同一空间网格上的离散场差，不是相对真解误差。没有拟合新时间
阶数、没有承诺空间约束收敛，也没有据上述比值认定舍入误差或某个方程项是旧未分辨的根因。

## 可核查产物

- [v2控制门禁](../../tmp/nr-shadow-evidence/nr-k3-constraint-field-controls-v2-20261011/qualification-gate.json)
  SHA256 `747c73712890e759103b3d74ef91fb31555857ce762dc15a295f735d5bcbd07b`
- [v2完整场报告](../../tmp/nr-shadow-evidence/nr-k3-constraint-field-controls-v2-20261011/endpoint-field-report.json)
  SHA256 `97d5cba2246336e1cbcd0dde2a7ba22ab923d61c10f9574526473e08e8fa6e96`
- [v2零跳过XML](../../tmp/nr-shadow-evidence/nr-k3-constraint-field-controls-v2-20261011/tests.xml)
  SHA256 `1e9a990f9163fa4e0a32e079bcc7b08512b3dd1d7f97e74a483de388ddfed6ae`
- [保留的v1失败](../../tmp/nr-shadow-evidence/nr-k3-constraint-field-controls-v1-20261011/qualification-gate.json)
- [原续算结果与未分辨结论](RESULTS-20261011-native-gauge-continuation-v2.md)

执行后额外只读检查验证409项新控制文件、402项源码及快照、所用输入SHA和XML，全部一致。
另用生产Hessian-H/M完整场、旧独立H场及直接平方加权归约，重新计算全部45组场差RMS，
与本报告输出最大差1.904569179e-14（小于继承的2e-12实现容差）；此项仍是诊断对等，
不是独立演化复算。报告10个本地链接检查通过，新增四个Python文件Ruff检查通过。
没有新的原生演化进程。

## 项目定位与下一步

当前增加的是可验证的科研诊断基础设施，并非达成顶级黑洞模型或新的物理验收。
依然是有限小网格、短时、真空外域shadow研究内核；不能称为成熟双黑洞、AMR或波形代码。

1. 先控制验证跨网格共同物理位置/区域与限制或插值方法，避免把网格错位、插值误差、
   范数归一化变化当作物理空间收敛。N9/N13/N17并非统一二倍嵌套序列，不可直接下采样假装对齐。
2. 明确将时间误差与空间误差分开；新H/M空间矩阵需预注册独立物理门槛、边界检查、
   固定终点和原资源约束，再请求必要的新计算批准。不要用本次事后45组结果选择通过门槛。
3. 原T=1/8边区域未分辨仍单列保留。不能自动延长时间、挑选中间通过时刻或替换主指标。
4. 在空间约束、稳健性、跨后端与物理基准关闭前，live、scientificPayloadWriteback、
   black-hole/AMR/waveform/GPU等物理资格全部保持未通过。

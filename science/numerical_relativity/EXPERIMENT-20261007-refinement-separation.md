# Hamiltonian 缺口：空间/时间误差分离实验

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: implement and validate
- Origin Date: 2026-10-07
- Verification Status: LOCAL_VERIFIED — 14-case separation complete; general solver validation remains open
- Version Label: refinement_separation_v1
- Scope: Python shadow only; no runtime/art changes or scientific payload writeback

## 预声明设计

前一轮是实质进展：真实 RHS 增加可选规范并暴露了 Hamiltonian 的粗网格门禁缺口。
本轮开始时已核对 v2 收据源码集合仍与当前实现一致；不重新定义原验收为成功。

待区分的假设是：9³→13³ 的 1.49286 阶主要来自空间离散的前渐近行为，
不是时间步过大。不得在看到新结果后删除粗网格或调低原来的 1.5 阈值。

固定幅值 `1e-4`、物理终点 `t=.02`、二阶空间差分、RK4、周期立方体、
`f=3 alpha chi`、`mu=.2 chi`、原有 gauge/config。所有正式演化仍使用完整三维立方网格。

1. 时间实验：9³ 使用 11/22/44 步，13³ 使用 16/32/64 步，17³ 使用 21/42/84 步。
   每组三档只改变时间步；最粗档须逐位重现旧收据。
2. 空间实验：9³/13³/17³ 与 18³/26³/34³，全部固定为 64 步，即 `dt=.02/64`。
   两个三档组分别报告四项约束的阶，同时记录 9→18、13→26、17→34 的配对结果。
3. 时间影响判据：每组最粗与最细时间步的**约束场差异范数**相对最细档约束残差
   ≤1%，才支持“此窗口时间误差影响小”。不是仅比较两个相似的总范数。
4. 原始组和加密组都保留，收敛阶门槛均为 1.5，测量下限仍是 `1e-13`。
   任意低于下限的观测不被伪造为可测阶数。细组通过不撤销原组失败。
5. 独立辅助诊断：对严格 x 平面对称、对角度规，用闭式 Ricci 标量和 Fourier 导数
   再计算 Hamiltonian；拒绝任意非零横向变化或非对角分量，不做投影和平均。
   原有有限差分约束仍是主诊断器，不能用新诊断较小的数值替换它。

一共 14 个不重复的网格/步数组合，13³/64 步由两项实验共享。
每个完成案例另存不可覆盖的行收据；运行中每四步输出进度。
预计单次批处理在 30 分钟上限内；若超时保留已完成结果，不以缺失案例做完整结论。

## 独立几何公式

对 `ds²=A(x)dx²+B(x)dy²+C(x)dz²`，空间 Ricci 标量为

\[
R=-\frac{B''}{AB}-\frac{C''}{AC}
 +\frac{(B')^2}{2AB^2}+\frac{(C')^2}{2AC^2}
 +\frac{A'}{2A^2}\left(\frac{B'}B+\frac{C'}C\right)
 -\frac{B'C'}{2ABC}.
\]

从独立 Christoffel/Ricci 符号缩并验证该恒等式，并用共形平直解析曲率、
精确初始 gauge-wave 和已解析 Fourier 模式检查实现。
再以 `H=R+K²-K_ij K^ij` 形成诊断，不依赖演化的 Gamma 或旧有限差分 Ricci。
该公式只覆盖平面对角几何，不是任意三维物理真值。

## 外部方法核对

Exa 单个针对性检索返回 5 条候选记录；核对了
[Apples with Apples 原始测试设计](https://ar5iv.labs.arxiv.org/html/gr-qc/0305023)
关于隔离规范、边界、数值方法和保留失败实验的原则。本实验并不是其标准
harmonic gauge-wave 长期测试：演化采用 1+log，时间窗口也远短于标准长期测试。

GitHub 核对了
[GRChombo NewConstraints 实现](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/CCZ4/NewConstraints.impl.hpp)
的曲率/外曲率分组；这仅是公式约定核查，不是运行了 GRChombo 或完成跨后端验证。
旧 `Constraints.hpp` 已标记弃用，未以旧接口作为当前实现依据。

## 测量与决策

正式收据：`E:\CodexData\nr-k3-fo-ccz4-refinement-separation-v1-20261007.json`。
14/14 个完整立方体案例完成，耗时 `1353.55 s`，运行中源码和旧基线未变。
原 9³/13³/17³、11/16/21 步三个案例的最终状态摘要逐位重现旧收据，
所有输入状态均未被就地修改。旧 v2 收据的 `bounded_campaign_passed=false` 保留。

固定 `dt=.02/64` 的实际观测阶：

| 约束及主范数 | 9³→13³→17³ | 18³→26³→34³ | 加密组预声明门槛 |
| --- | --- | --- | --- |
| Hamiltonian L2 | 1.492554 / 1.704951 | 1.849355 / 1.917083 | 通过 |
| Momentum L2 | 1.716688 / 1.850684 | 1.928371 / 1.962364 | 通过 |
| Gamma L∞ | 1.967117 / 1.982822 | 1.991816 / 1.995716 | 通过 |
| Theta L∞ | 1.826474 / 1.909911 | 1.940904 / 1.969135 | 通过 |

Hamiltonian 粗组仍失败；没有调低 1.5 门槛。加密组的 H L2 为
`4.1469955e-10 / 2.1008255e-10 / 1.2561430e-10`。
独立 Fourier/闭式曲率诊断在同一加密组得到
`4.4401095e-10 / 2.1746706e-10 / 1.2930977e-10`，阶为 `1.941131 / 1.937780`。
新诊断并不比主诊断更小，也没有被用于替换主门禁。

三个时间细化组的 H 约束场变化占残差比例分别为
`0.006994% / 0.046468% / 0.114880%`，均小于预设 1%。
但时间自收敛阶没有可靠地呈现四阶：9³ 低于测量下限，13³/17³ 分别为
`-1.139254 / -0.884481`。小差值可能受舍入与导数放大影响，原因尚未独立证明；
不能宣称本次验证了 RK4 时间阶。

**限定结论**：在这个幅值、短时间和周期平面波窗口，证据支持空间离散的前渐近行为
主导粗网格缺口，而不是时间步过大。它既不是一般误差上界，也没有排除全部 RHS 错误。
每个完成步的最小 lapse/chi/度规特征值分别约 `0.999949 / 0.999967 / 0.999933`；
最大记录坐标速度约 `2.000052`。没有声称每个 RK 子阶段的速度上限均被监控。

强双曲性、CPBC、真实黑洞长期演化、新规范 C++/checkpoint 一致性和 live 推广
仍需各自独立的证据。旧固定规范的 Windows 原生 C++ 复跑见
[原生工具链记录](EXPERIMENT-20261007-native-msvc.md)，不混作新规范的证据。

## 源码与复验边界

- 原运行源码集合 SHA-256：`1f4ffe255f50e1444702aac2594e1f32e6e5baabc2be6b555d2c0e608484b988`。
- 原收据 SHA-256：`d66770e071baecc5efcd7c04f619ed4e5f632131816bce7432cbcc34b59f9943`。
- 运行后仅在符号验证测试中将求和下标 `l` 改名为 `ell`，消除两项 E741 警告；
  逐文件摘要确认这就是原源码集合中唯一变化，全部数值实现/驱动文件未变。
- 原测试副本保存在行收据目录的 `test_plane_constraint_oracle.frozen.py`，
  SHA-256 `5ef73dc69807d267ae050f959b0cd65d99f9f0cd4a26242b4d778dcdd3d5c9e3`；
  当前测试 SHA-256 `abdf3067be7706958d39e96e21ea67302f9c07c102b7f9d0f7a088f36aeb7c10`。
  原文本执行单一单词替换后与当前文本完全相同（换行规范化后）。
- 18 项几何/实验守卫测试与 10 项原生构建守卫合计 **28 passed**，相关 Ruff 全部通过。
  不声称运行后的整个源码集合仍与原收据逐字节一致。
- 已启动的全套科研回归为 **340 passed in 1084.45 s**，没有失败或跳过；它在新增
  10 项原生守卫之前收集测试。当前共收集 350 项，覆盖证据是“原 340 项完整通过
  + 新增 10 项通过 + 相关 18 项改名后重验”，不是一次 350 项全量运行。

当前源码复跑须使用新输出名称：

```powershell
python scripts/run-nr-k3-fo-ccz4-refinement-separation.py --baseline E:\CodexData\nr-k3-fo-ccz4-state-dependent-gauge-v2-20261007.json --output E:\CodexData\nr-k3-fo-ccz4-refinement-separation-replay.json
```

下一门禁应预先固定较长时间、非平凡三维扰动和规范域边缘的失败条件，再开展实验；
不要因本次短窗口通过加密门槛就直接接物理边界或切换 live。

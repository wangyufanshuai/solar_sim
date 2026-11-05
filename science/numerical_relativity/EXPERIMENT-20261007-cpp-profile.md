# 新状态依赖规范：C++ / checkpoint 跨后端实验

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: implement and validate
- Origin Date: 2026-10-07
- Verification Status: LOCAL_VERIFIED — corrected six-case profile campaign passed; physical promotion blocked
- Version Label: cpp_profile_v2_ode_erratum
- Scope: periodic CPU shadow only; legacy/live/art defaults unchanged

## 目标和预声明门禁

将已有 Python 候选 `f=a alpha chi, mu=k chi` 实际接入 C++ RHS，包含
`partial_i(f) b^j = f (A_i+2P_i) b^j`。保留原固定参数模式为默认。
`a>2, 0<k<2, 0<alpha<2, chi>0` 是候选的受限域；不裁剪，不以局部谱分离
替代强双曲性证明。所有 RK4 子阶段检查候选域。

新 checkpoint v2 必须记录规范 id 与 a/k；旧 v1 只允许旧模式，禁止静默跨模式续算。
Python 解码后恢复完整 58 槽及规范标签，继续演化仍要显式匹配规范。
manifest 将变量系数标为非恒定，另附与 Python 相同的规范身份，不伪装成旧常数。

固定验收：

1. 原生 MSVC 重新构建，旧合同/RHS 验证继续通过；与上一轮保留的旧 exe 对比，
   相同运行的旧 checkpoint/manifest 逐字节不变。
2. 默认 `(a,k)=(3,.2)` 和 `(4,.4)`、`(2.5,1.2)` 两个非默认合法配置。
   周期 gauge-wave 8³、8 步、dt=1e-5；非平凡三维 off-constraint 状态 7³、4 步、dt=1e-4。
   所有 58 槽最大绝对差异须 <=2e-12，不把同一模型的跨语言一致解释成物理真值。
3. 直接/分段重启、1/4 线程的 checkpoint 和 manifest 均逐字节相同。
4. 保留输入和输出 checkpoint；Python 格式解码/再编码须逐字节相同，Python 重建状态
   后继续一个时间步与 C++ 续算比较，仍用 2e-12 阈值。
5. 对非零 b、A/P 和 ordering curls 的合成场独立覆盖乘积求导与 mu 系数；
   普通 gauge-wave 的小 shift 不能单独承担这项回归。
6. 必测拒绝：遗漏/错误规范、a/k 改变、v1/v2 交叉重启、未知版本/id、截断/尾随字节、
   非有限参数/状态、alpha>=2、chi 下溢、非正定度规。失败不得生成输出 checkpoint/manifest。
7. 冻结源码与二进制 SHA-256；每个子进程设有硬超时，使用新输出目录，保留失败记录。

## 研究边界

本轮前的源码与原生收据已核对一致，上一轮属实质进展而非等待。
Exa 定向检索 5 条候选，并通过 GitHub 核对
[GRChombo BinaryBH 参数](https://github.com/GRTLCollaboration/GRChombo/blob/main/Examples/BinaryBH/params.txt)
中规范与 restart 的配置分离。其示例使用固定 shift 系数，不支持本仓库新增函数的正确性主张；
不把 GRChombo 的成熟度、外部参数或代码阅读算作本项目的物理验证。

强双曲性、约束保持物理边界、长期单黑洞/双黑洞、AMR 稳定性、波形准确性、CUDA 和
live 推广都仍未完成。本次不修改 Python 演化公式、不改美术、不改系统环境。

## 实际结果

### v1 失败与事前修订后的 v2 协议

原始 6 案例协议的 v1 已失败并保留：
`E:\CodexData\nr-k2-profile-cpp-20261007\campaign-v1\receipt.json`。
默认规范的 gauge-wave 差异 `6.14e-16`，但三维合成场差异 `5.35104e-6`，
Python 从 C++ checkpoint 继续一步差异 `1.35228e-6`。阈值仍是 `2e-12`，不删案例。

逐槽定位显示最大偏差来自 `ln_phi` 与 `ln_alpha`。旧 C++ 的两处平流项重新差分主变量，
而 [FO-CCZ4 原文式 12b/12d](https://arxiv.org/html/1707.09910v3) 要求
`beta^i A_i`、`beta^i P_i`，以维持 11 ODE / 47 PDE 分离。Python 已使用正确形式。
本轮修正两种 C++ 系数模式的这两行，并把 kernel_version 升为 `0.2.0`。
旧 EIH/live 运行没有修改；不为保持错误内核逐位输出而保留此缺陷。

因此，原“旧 C++ checkpoint/manifest 全部逐位相同”的兼容性门禁**不能宣称通过**。
v2 在执行前增加独立反例：5³ 常量主标量、shift=(.2,-.1,.05)、
A=(.03,-.04,.02)、P=(.05,.02,-.03)、K=Theta=0。
式 12b/12d 初始导数严格为 `.011 / .0065`；dt=1e-7 的单步变化率与该值误差
须 <=5e-7，旧 exe 误差须 >1e-3。这个容差仅用于单步导数估计，
六个跨后端案例的 2e-12 阈值不变。

v2 继续记录旧/新实际字节差异；非演化解析模式的 checkpoint 必须不变。
已修正的固定系数模式仍须通过独立旧合同/RHS 验证。所有六个原案例与全部拒绝测试保留，
旧版本兼容性与修正后的方程一致性分开报告。

### v2 实测结果

收据：`E:\CodexData\nr-k2-profile-cpp-20261007\campaign-v2\receipt.json`。
源码冻结运行耗时 `59.39 s`，前后源码/二进制未变，六个案例及 16 个拒绝检查完成。
跨后端阈值仍为 `2e-12`：

| (a,k) | gauge-wave 8 步最大差异 | 三维混合场 4 步最大差异 |
| --- | --- | --- |
| (3,.2) | 6.14160e-16 | 4.16334e-16 |
| (4,.4) | 5.05618e-16 | 3.88578e-16 |
| (2.5,1.2) | 6.29352e-16 | 4.16334e-16 |

所有案例的直接/分段重启及 1/4 线程 checkpoint/manifest 逐字节相同，
Python 解码/编码 checkpoint 也逐字节相同。Python 读取 C++ checkpoint 后继续一步，
与 C++ 继续一步最大差异 `2.08167e-16`。不承诺不同编译器、版本或方程间逐位复现。

独立 ODE 反例：旧 exe 两项变化率约 `2.8e-10 / -1.7333e-10`，
与目标 `.011 / .0065` 最大偏差约 `.011`，明确失败。
修正后为 `.011000000280000007 / .006499999826666673`，最大误差 `2.80000e-10`，
通过预定 `5e-7` 门槛。混合场差异因此从 `5.35e-6` 降至舍入量级。

本次短 gauge-wave 上旧/新 checkpoint 恰好逐位相同，但 manifest 因 kernel_version
从 `0.1.0` 升至 `0.2.0` 而不同；一般 off-constraint 状态的动态行为已经改变。
收据保留 `original_bitwise_compatibility_gate_passed=false`，
不能把修正验证通过说成原始全部兼容性要求通过。

16 个错误输入全部失败且没有输出 checkpoint/manifest，包括丢失/错配规范、
参数变更、跨格式模式、非法尺寸/版本/id、NaN、截断/尾随、lapse 越界、chi 下溢、
正行列式但非正定度规。候选域检查在状态和每个 RK 子阶段执行，不做裁剪。

- C++ 源码 SHA-256：`081e934f666325e57fc82e940c80ca5f1aa106c0d772d2d9d3e07995adfaf8ce`。
- 新 exe SHA-256：`818b4421ad27b4e40135a75d863b2f0d8c7119eddc3700bfb3cb9b33c30962ef`。
- v2 收据 SHA-256：`93a9a3f988198e1e550e8bbc09f99e15d1369b61ddec4e6a04937d745bc34abd`。
- v1 失败收据、旧 exe 和原 C++ 源码副本均保留，没有覆盖或删除。
- 40 项格式/manifest 定向测试通过；随后全套 **385 passed in 717.46 s**，
  没有失败或跳过。Python 源码在该次全量运行期间未变；C++ 修正另由上述原生编译
  和真实可执行文件实验覆盖。定向 Ruff 与科研路径的差异格式检查通过。

复跑（输出目录必须不存在）：

```powershell
python scripts/verify-nr-k2-fo-ccz4-profile.py --legacy-binary E:\CodexData\nr-k2-native-msvc-audit-20261007\solver-build\Release\nr-k2-fo-ccz4-shadow.exe --output-directory E:\CodexData\nr-k2-profile-cpp-replay
```

### 格式与保留边界

v2 在原 104 字节头后增加 `<Qdd>`：profile id=1、shift_scale、ordering_scale，
随后是 58 槽 little-endian binary64 数组。v1 的常数规范格式不变。
Python codec 仅接受二阶、周期、完整单位立方体，不默默丢弃网格或掩码语义。
变量系数在 manifest 的旧常数字段写 `null`，完整函数身份单独记录。

格式验证不是任意有限数值位损坏的完整性校验，也不绑定编译器/方程实现摘要；
科研重现必须同时保留收据中外部 SHA-256 和实际源码/二进制。
旧 `auxiliary_ordering_reconstructed` 字段不能被当作约束已满足或每步重建辅助量的证明。
本次只闭合有界的跨语言、格式和同一二进制重启检查；长期/物理验证仍为 false。

下一步使用已校验的新原生后端，预声明更长周期窗口、网格细化和非平凡三维扰动的
约束/稳健性实验；随后才评估物理边界与单黑洞长期演化。不能因为跨语言对齐就跳过这些门禁，
也不提前引入 CUDA 或连接 live。

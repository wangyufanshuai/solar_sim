# NR-K1—K4 外部基准与实现边界（2026-10-05）

本文是 `solar_sim/next-web` 科研内核 shadow 线的外部设计参考，不是对外部软件的性能或物理结果背书，也不改变当前 `candidate-only / shadow / hold` 状态。资料通过 Exa 检索后，再读取论文、官方文档或 GitHub 官方仓库内容核对；外部结果只用于确定工程边界，不替代本地 receipt。

## 1. 已核对的高信号来源

| 来源 | 可直接支撑的事实 | 对本项目的约束 |
|---|---|---|
| [FO-CCZ4 原论文](https://arxiv.org/abs/1707.09910) | FO-CCZ4 是 58 变量的一阶时空系统；论文给出所选规范下的完整解析特征结构，并在 ADER-DG 中配合 AMR、局部时间步进和黑洞奇异性子单元 limiter 做 3-D 测试。 | 当前 58×58 数值谱、速度族和 11/47 分块只能算离散审计；不能替代解析 eigenvectors、symmetrizer 或边界证明。K1/K3 必须保留完整特征结构的未关闭门。 |
| [SpECTRE 官方文档](https://spectre-code.org/) | 高阶谱有限元、强并行、多尺度多物理；官方建议记录代码版本并保留 YAML 输入和必要的附加 C++ 源，便于结果重现。 | manifest 必须绑定 solver/source digest、参数文件和输入版本；不能只保存一个 build ID 或最终场数组。 |
| [GRChombo 官方仓库](https://github.com/GRTLCollaboration/GRChombo) | C++ 数值相对论代码，使用混合 MPI/OpenMP、向量化和 Chombo block AMR；仓库包含 BinaryBH、KerrBH、checkpoint/restart 和后处理路径。 | K2 的 OpenMP shadow 只是跨语言基线；K3 AMR 需要真正的 ghost exchange、regrid、restriction/prolongation、checkpoint/restart 与黑洞案例，不能把当前周期 transfer contract 当作生产 AMR。 |
| [Einstein Toolkit CarpetX](https://github.com/EinsteinToolkit/CarpetX) | CarpetX 基于 AMReX 的 block-structured AMR driver，定位为 Einstein Toolkit 的驱动；源码/参数中可见 checkpoint recovery 和 GPU 条件分支。 | K4 应沿 CPU→AMReX 适配层推进，不把“有 RTX”当作 GPU solver 已验证；checkpoint 语义要在 CPU/CUDA 之间保持一致。 |
| [Einstein Toolkit SpacetimeX](https://github.com/EinsteinToolkit/SpacetimeX) | 基于 CarpetX 的时空初值、演化和分析 thorns；官方源码检索可见 AHFinderDirect、ADM 变量以及 `Weyl::Psi4` 多极提取配置。 | K3 的视界、ADM 和 Ψ₄ 必须是独立分析模块并有各自的误差/半径/角向收敛 receipt，不能把“场已演化”当作波形有效。 |
| [AMReX GPU 支持文档](https://amrex-codes.github.io/amrex/docs_html/GPU.html) | AMReX 采用 MPI+X；CPU 使用 OpenMP，NVIDIA 路径使用 CUDA；CUDA 构建需要 `nvcc` 和 host compiler，常见配置是一 MPI rank 对一 GPU。 | 当前环境没有可验证的 `nvcc` 或 MSVC `cl`，所以 K4 只能停在设计和 CPU 适配准备，禁止声称 CUDA 可用或 RTX 性能。 |
| [constraint-preserving Sommerfeld 论文](https://arxiv.org/abs/gr-qc/0612051) | 约束保持边界不是把所有场统一施加标量 Sommerfeld；边界数据要按约束传播层级构造，并在解析/非线性波测试中比较约束误差。 | 现有 `sommerfeld-proxy` 和 characteristic-proxy 只能留作 shadow 工程路径；必须实现 formulation-specific characteristic/constraint data 后才能关闭 CPBC 门。 |

## 2. 对现有内核的判断

### 已有的正确方向

- FO-CCZ4 的 58 槽 canonical order、`A/B/D/P` 一阶辅助场、1+log/Gamma-driver、RK4、checkpoint/restart 和 Python/C++ parity 已形成可回放的 shadow 基线。
- 2026-10-05 的 gauge-wave method-of-lines 收敛 receipt 已分别覆盖二阶和四阶周期 stencil；新增的小噪声 campaign 固定 3 个 seed、4 个 checkpoint，并记录 perturbation growth、约束和 ordering curl。
- 物理边界、黑洞演化、解析特征向量、连续 symmetrizer、CPBC、长时间稳定性和 live writeback 均仍为 false；这与外部成熟代码的分层验证方式一致。

### 不能从现有证据推出的结论

1. 58×58 数值矩阵满秩不等于 FO-CCZ4 的连续强双曲性定理；数值 symmetrizer `H=(R^{-1})^*R^{-1}` 也不等于解析、参数域一致的 symmetrizer。
2. 周期 gauge-wave 收敛和 Minkowski 小噪声有限性不等于 Schwarzschild、双黑洞、视界、ADM 质量或 Ψ₄ 正确。
3. scalar Sommerfeld proxy 不等于 Einstein characteristic boundary，更不等于 CPBC。
4. C++ OpenMP 可执行不等于高性能 solver；没有 toolchain lock、跨后端误差预算、长跑和 I/O 复现，不能进入 CUDA 或 live。

## 3. 依赖顺序（按关闭门禁，而非代码行数）

### NR-K1：Python reference

1. 固定 58 槽变量合同、日志变量转换、规范参数、空间阶数和 boundary label。
2. 加入同一物理时间的 gauge-wave convergence，而不是用“固定步数、不同分辨率对应不同物理时间”的比较。
3. 完成解析特征结构的可审计子集：先把 11 个 ODE block 的零速 basis 与符号残差独立锁定，再逐项实现论文 Appendix-A 的 PDE eigenvectors；每一步都保留数值谱负对照。
4. CPBC 前只允许 periodic 或显式 `*-proxy`，所有 proxy receipt 都要带 `physical_boundary_validated=false`。
5. 物理 gate：Minkowski、gauge-wave、robust stability、单黑洞 moving-puncture seed；长跑必须和短跑 receipt 分开。

### NR-K2：C++17/OpenMP shadow

1. 用 K1 的 source digest、参数 envelope 和 58 槽 order 生成 language-neutral manifest。
2. checkpoint header 除网格和步数外，必须含 formulation、gauge/config、boundary operator、source digest、endianness、floating-point contract 和场数组 hash。
3. 先逐槽 Python/C++ RHS parity，再做 3 个分辨率的独立约束收敛；OpenMP 线程数、直接运行和 restart 必须得到确定性 hash。
4. 只要 manifest、参数或 source digest 不匹配，restart 必须 fail-closed；禁止“尽量恢复”。

### NR-K3：3-D physics/analysis

1. 先完成外部可验证的单黑洞 moving-puncture evolution，再做双黑洞；Brill–Lindquist 初值不含轨道动量，不能提前称为 merger。
2. AMR 必须包含 ghost exchange、prolongation、restriction、refluxing、时间子循环、regrid provenance、跨 level constraint norms。
3. apparent horizon 需要 expansion residual、球面分辨率/半径收敛、掩膜/内边界关系和多种初猜；单个坐标球根只能算 oracle。
4. ADM 质量需多半径外壳外推并报告外推阶/系统误差；Ψ₄ 需锁定 tetrad、球面投影、角向模式、`1/r` 外推、retarded time，并保留与 CCE/替代提取器的差异项。

### NR-K4：AMReX/CUDA

1. 先记录本机 `nvcc --version`、host compiler、CUDA runtime/device capability、CMake/AMReX commit；当前 `nvcc` 与 `cl` 均未找到，且最新 C++17/OpenMP sentinel 编译失败，故本阶段未启动。详见 `E:\\CodexData\\nr-k2-toolchain-audit-v1-20261005.json`。
2. CPU/OpenMP 通过所有 K1/K2/K3 gate 后，先移植一个无物理分歧的 periodic gauge-wave kernel，再做 CUDA/CPU bitwise-or-tolerance parity。
3. GPU 性能只能在固定网格、固定时长、固定 I/O 和温度/功耗边界下报告；一张 RTX 4060 不构成跨平台性能结论。

## 4. 下一步建议

当前最有价值的工作不是再增加一个视觉层或更多“完成行数”，而是按以下顺序推进：

1. 修正并重跑同一物理时间的 gauge-wave 收敛 receipt；旧 receipt 保留为历史工程记录，不覆盖。
2. 为解析特征结构建立独立符号/数值交叉检查，至少先关闭 11 槽 ODE block 和一个非简并 Gamma-driver 分支。
3. 让 K2 C++ 读取同一 source/config manifest，并增加 manifest mismatch 的 fail-closed 测试。
4. 在 CPBC 未关闭前，不把 Schwarzschild proxy 继续扩展为“黑洞演化”；下一物理目标应是移动穿刺单黑洞的短时、外边界和约束收敛组合测试。
5. 只有上述 CPU gates 全部通过，且本机 CUDA 工具链确实安装并完成最小 kernel parity 后，才建立 K4 分支。

## 5. 外部来源与代码使用边界

本文件只记录公开论文、官方文档和公开仓库的事实与设计启示，没有复制外部源码到本项目。真正接入任何外部代码前，仍需单独审查许可证、版本、依赖、贡献者声明、数据/模型来源和与当前 58 槽合同的可证明等价性。

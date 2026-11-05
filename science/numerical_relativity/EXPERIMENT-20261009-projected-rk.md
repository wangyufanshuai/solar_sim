# 显式投影 RK 策略：同初值、阶数控制与真实 RHS 切向缺陷

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: prospective deterministic method-component experiment
- Origin Date: 2026-10-09
- Verification Status: PLANNED; NOT PHYSICAL VALIDATION
- Version Label: nr-projected-rk-policy-v1

## 方法与不可跨越的边界

新适配器仅用于 shadow，默认 `none` 直接调用冻结的原始 step。
另有 `endpoint`（只映射步末）与 `stages-and-endpoint`（每次 RHS 前及步末）。
后者四个阶段均在原始 q_n 上构造 RK 加权和，求 F(P(raw))，不把映射后的
阶段误当作新的步起点。映射是上一轮固定的三约束公式，28 个其他槽不变。
不得放宽 det(h) 速度合同、CFL、正定性、特征残差或任何物理门槛。

[GRChombo 固定提交的 BinaryBHLevel.cpp](https://github.com/GRTLCollaboration/GRChombo/blob/37e659523830418b210acea1661dac0e00bb1b75/Examples/BinaryBH/BinaryBHLevel.cpp)
在 RHS、子步及步末处理 A 的迹；[原始论文](https://arxiv.org/abs/1503.03436)
还明确区别手动强制行列式和去迹。这不是本项目独立 D_k 场的三约束方法，
不能借用其验证结论。[Munthe-Kaas 的流形 RK 论文](https://doi.org/10.1016/S0168-9274(98)00030-0)
涉及特定 Lie 代数构造，也不证明任意投影加 RK4 自动保留四阶。未复制外部源码。

## 解析控制（使用候选同一个 RK 核心，不另写假驱动）

1. 在单位圆上的非自治切向旋转，角速度 1+0.3t，T=1。
2. canonical58 中非对角 SPD 度规和 trace-free a/D 同时正交旋转，
   精确解为 R(theta) T0 R(theta)^T；theta=t+0.15t^2，T=1。
3. 反例：单位圆初值，F(y)=J y+0.4y，F 不切于单位圆。
   无投影的精确解为 exp(0.4t)(cos t,sin t)；另外单独测量投影方法对
   期望约束轨道 (cos t,sin t) 的误差。这两个参考解不能混为同一 ODE。

每项、每策略都跑 N=8,16,32,64 步，记录绝对误差及分辨出的阶数。
切向控制末两个阶数应在 [3.7,4.3]，否则策略不能通过解析精度门禁；
反例只要求诚实记录，不把降低阶数当作被修好的测试。误差 <=2e-13
或相邻误差比 <=1 时阶数标未分辨，不输出虚假高阶。
对非切向反例的特定预测：阶段投影的切向目标误差为一阶，需观测
末两个阶数 [0.8,1.2]；这验证负控制有效，不提升该策略的科学等级。

## 真实 FO-CCZ4 有界预实验

固定 N=9、[1,3]^3、SBP(4,2)、解析静态外部面数据，保持旧 gauge/config。
从已冻结失败批次的解析初值公式生成 N9 初值；扰动公式和幅度 1e-4 不变，
随后一次显式三约束映射生成共同新初值。原始与映射后初值、物理改变量、
指纹均保存。这是新初值问题，不是恢复旧失败轨迹或求解 Einstein 初值约束。

矩阵不可挑选：静态每策略 1 步 dt=1/256；共同扰动初值每策略分别
1、2、4 步，dt=1/256、1/512、1/1024，均到 T=1/256 M。
共 12 案例 / 24 RK 步。另用旧类独立重算 `none` 静态 1 步作精确对照。
这个短窗口只检查连接、切向缺陷、修正预算、时间自收敛的可分辨性，
不回答长期稳定性或黑洞有效性，不外推四阶。

每个阶段保存 raw、effective、RHS，步末保存 raw 与 mapped；输入不变。
每个初始/接受状态保存旧 H、新 Hessian-H、M、C_A/B/D/P、Theta、场误差
及五区域范数，并由已有独立稠密 Riemann 诊断核对（差 <=2e-12）。
阶段记录映射修正、物理度规/K_ij 改变量及代数残差。
完整 RHS 的切向缺陷按解析链式法则计算：

- d log det(h) = tr(h^-1 hdot)
- d tr(h^-1 a) = tr(h^-1 adot) - tr(h^-1 hdot h^-1 a)
- D_k 的迹同理。

初始阶段用两档中心方向差分独立检查链式率；差分容差独立于物理门槛。
原生求解器、所有旧 source hash/产物/失败判断保持不变。没有 live 写回。

## 证据和资源

上一轮固定回执 SHA256 b06ae9e74fe3714d6fc582ba9996674d1fa7f9008b159549c9ab43dc0749c694；
其独立进程回放 SHA256 493cf1247f86d924789b20b17bacd659a1ed09f32312a983f38107def73c07b6。
回归基线 1898 项；先新增测试，再全范围回归，再启动新实验。
输出仅用 E 盘新目录，每批最多 1200 秒、192 MiB（含 16 MiB 回执余量）。
C>=3 GiB、E>=4 GiB+32 MiB 不变；到线即停止，保留部分产物和失败回执。
成功批次才在另一进程/新目录回放；不自动重试失败的科学实验。
不改 frozen map/RHS/SAT/旧驱动；新适配器有单独方法 identity。

组件成功必须区分“运行完成”“解析控制通过”“真实时间阶数已分辨”，
全程 physical_validation / native checkpoint / AMR / waveform / GPU / live 均为 false。

# 核心模拟中文说明文档

## 1. 项目核心模拟总览

本文档描述 `solar_sim/next-web` 的**核心模拟内核**，聚焦数学、物理与算法实现，不展开 UI 交互细节。系统总体由四层组成：

1. **物理模型层**：N 体引力（牛顿）+ EIH 1PN 修正 + 局部 J2 扰动。
2. **数值积分层**：自适应 Dormand–Prince 5(4)（默认）与固定步长 RK4（可选）。
3. **控制与任务层**：飞船变质量推进、发射/变轨/着陆；卫星 TLE/SGP4、链路预算。
4. **运行时与渲染耦合层**：主线程/Worker + SAB，渲染插值与 LOD。

核心代码入口：

- `app/lib/physicsEngine.ts`
- `app/lib/solarSystemPhysics.ts`
- `app/components/SolarSystemIntegrator.tsx`
- `app/lib/useSolarSystem.ts`

---

## 2. 单位体系与常量定义（SI / AU / day）

常量定义于 `app/lib/physicalConstants.ts`：

- 万有引力常数：`G_SI = 6.6743e-11` (m^3 kg^-1 s^-2)
- 光速：`C_LIGHT = 299792458` (m/s)
- 天文单位：`AU_METERS = 1.495978707e11` (m)
- 一天秒数：`DAY_SECONDS = 86400`
- 光速 AU/day：`C_AU_PER_DAY = (C_LIGHT * DAY_SECONDS) / AU_METERS`

状态换算（`physicsEngine.ts -> stateAuToSi`）：

- 位置：`posM = posAu * AU_METERS`
- 速度：`velMS = velAuPerDay * AU_METERS / DAY_SECONDS`

实现上以 **SI 制** 完成动力学积分，`posAu` 仅作为显示/接口侧的并行缓存。

---

## 3. 动力学模型

### 3.1 牛顿 N 体引力

代码位置：`app/lib/physicsEngine.ts -> calculateAcceleration`

对第 `i` 个天体，牛顿项写成：

$$
\mathbf{a}_i^{(N)}=\sum_{j \neq i} G m_j \frac{\mathbf{r}_{ji}}{\left(\lVert \mathbf{r}_{ji}\rVert^2+\varepsilon^2\right)^{3/2}}
$$

其中：

- \(\mathbf{r}_{ji}=\mathbf{x}_j-\mathbf{x}_i\)
- \(\varepsilon^2\) 为软化项，代码默认 \(\varepsilon=10^{-4}\,\mathrm{AU}\)（`defaultEps2Meters`）

### 3.2 EIH 1PN 修正

代码位置：`app/lib/physicsEngine.ts -> calculateAcceleration`（`invC2 > 0` 时启用）

系统实现为：先算牛顿加速度 `aNewt` 与势 `phi`，再叠加 EIH 1PN 项，最后 `out += aNewt`。  
`invC2` 即 `1/c^2`，当精度档为 `newton` 时强制置 0。

该实现采用 EIH 形式的矢量分解（包含速度交叉项、势项、尾项），并与牛顿项共同作为积分器右端函数。

### 3.3 J2 非球对称修正（近地）

代码位置：

- 通用内核内局部近地修正：`physicsEngine.ts`（Earth index 路径）
- 卫星独立示例：`app/lib/satelliteDynamics.ts`

卫星模块中使用形式：

$$
k=\frac{3}{2}\frac{J_2 \mu R_e^2}{r^5},\qquad f=\frac{5z^2}{r^2}
$$
$$
a_x \leftarrow a_x + kx(f-1),\quad
a_y \leftarrow a_y + ky(f-1),\quad
a_z \leftarrow a_z + kz(f-3)
$$

### 3.4 引力时间膨胀与原时

代码位置：

- `physicsEngine.ts -> weakFieldTauDt / gravitationalTimeDilationVsBarycenter`
- `solarSystemPhysics.ts -> accumulateSpacecraftProperTime / getBodyProperTimeSeconds`

弱场近似：

$$
\frac{d\tau}{dt}\approx 1-\frac{\Phi}{c^2}-\frac{v^2}{2c^2}
$$

用于累计飞船原时 `spacecraftProperTimeS`，并在遥测中展示。

---

## 4. 数值积分算法

### 4.1 RK4（经典四阶）

代码位置：`physicsEngine.ts -> rk4Step`

状态方程：

$$
\dot{\mathbf{x}}=\mathbf{v},\qquad \dot{\mathbf{v}}=\mathbf{a}(\mathbf{x},\mathbf{v})
$$

RK4 更新：

$$
y_{n+1}=y_n+\frac{h}{6}(k_1+2k_2+2k_3+k_4)
$$

用于固定步长路径或 DP 自适应失败后的余步兜底。

### 4.2 Dormand–Prince 5(4) 自适应步长

代码位置：

- 试探与误差范数：`physicsEngine.ts -> dp54TrialStepErrorNorm`
- 提交：`physicsEngine.ts -> dp54Commit`
- 调度：`solarSystemPhysics.ts -> stepSimulatedSeconds`

参数（`solarSystemPhysics.ts`）：

- `DEFAULT_RTOL = 1e-10`
- `ECONOMY_RTOL = 1e-8`
- `ADAPTIVE_ATOL_POS_M = 1.0`
- `ADAPTIVE_ATOL_VEL_MS = 1e-4`
- 步长边界：`ADAPTIVE_DT_MIN_S = 0.5`, `ADAPTIVE_DT_MAX_S = 2400`
- 安全系数：`ADAPTIVE_SAFETY = 0.9`

### 4.3 精度分档策略

代码位置：`solarSystemPhysics.ts -> setPrecisionTier`

- `full`：高精度 rtol、较高加速度评估预算
- `economy`：放宽 rtol、降低预算
- `newton`：将 `invC2` 置 0，仅牛顿引力

---

## 5. 飞船模拟

### 5.1 变质量推进模型

代码位置：`solarSystemPhysics.ts`

核心状态：

- `spacecraftDryMassKg`
- `spacecraftFuelMassKg`
- `spacecraftSpecificImpulseS`
- `thrustVecN`

推力质量流率：

$$
\dot{m}=\frac{T}{I_{sp}g_0},\qquad g_0=9.80665
$$

离散更新（每积分步）：

- `burned = min(fuel, mdot * dt)`
- `fuel -= burned`
- `mass = dry + fuel`
- 燃料耗尽后推力向量归零

动力学耦合：

$$
\mathbf{a}_{thrust}=\frac{\mathbf{F}_{thrust}}{m(t)}
$$

并在 `calculateAcceleration` 中与引力叠加。

### 5.2 发射自动驾驶（Launch Sequence）

代码位置：`app/lib/spacecraftAutopilot.ts`

阶段机：

- `prelaunch`
- `verticalRise`
- `gravityTurn`
- `circularization`
- `coast`

关键逻辑：

- 发射台锚定：按经纬度放置到地球表面
- 自转速度注入：\(\mathbf{v}_{rot}=\boldsymbol{\omega}\times\mathbf{r}\)
- 重力转向：`turn = clamp((alt - 12000)/130000, 0, 1)`，在“向上”与“顺轨”方向之间插值
- 入轨判据：高度达到目标 + 速度达到目标圆轨道速度

### 5.3 Δv 脉冲与着陆控制

代码位置：

- 脉冲入口：`UniversePage.tsx -> onApplyDeltaV`
- 着陆自动控制：`spacecraftAutopilot.ts -> descent`

三类脉冲方向：

- 顺轨：\(+\hat{\mathbf{v}}\)
- 逆轨：\(-\hat{\mathbf{v}}\)
- 法向：\(\hat{\mathbf{n}}=\frac{\mathbf{r}\times\mathbf{v}}{\lVert\mathbf{r}\times\mathbf{v}\rVert}\)

下降控制（启发式）：

- 垂直速度：\(
v_{vertical}=\mathbf{v}_{rel}\cdot \hat{\mathbf{n}}
\)
- 制动需求与节流由高度函数和速度差给出
- 落地判据：`alt <= 4 m && |vVertical| < 2 m/s`

---

## 6. 卫星模拟

### 6.1 J2 + RK4 卫星粒子

代码位置：`app/lib/satelliteDynamics.ts`

- 地心引力 + J2 扰动
- 高频子步 RK4：`integrateWithSubsteps(dtS, maxSubstepS)`

### 6.2 TLE / SGP4 数据链路

代码位置：

- TLE 获取：`app/api/tle/route.ts`
- 解析与传播：`app/lib/satelliteTle.ts`

流程：

1. 服务端拉取 CelesTrak（`stations/qzss/starlink`），TTL 缓存 60 秒
2. `parseTleText` 解析三行 TLE
3. `satellite.js` 的 `twoline2satrec + propagate` 得到轨道位置

### 6.3 TEME / ECI 实现现状

当前代码中卫星传播输出字段命名为 `posEciKm`，但没有看到显式 TEME→ECI 转换矩阵流程（如 GMST 旋转显式步骤）。文档应将该点视为**实现现状说明**，而非已经完整显式实现的坐标变换链。

### 6.4 覆盖与链路预算（FSPL）

代码位置：`app/components/SatelliteConstellationOverlay.tsx`

自由空间路径损耗：

$$
L_{FSPL}(\mathrm{dB})=20\log_{10}(d_{km})+20\log_{10}(f_{MHz})+32.44
$$

Tokyo 覆盖判定：

- 构造卫星->Tokyo 与卫星->地心方向夹角
- 与波束半角 `22°` 比较，满足即命中覆盖

---

## 7. 运行时架构（Main Thread / Worker / SAB）

### 7.1 运行时选择

代码位置：`app/lib/useSolarSystem.ts`

- 若 `crossOriginIsolated && SharedArrayBuffer` 成立：
  - 建立 SAB + `physics.worker.ts`
  - 主线程通过 `PhysicsRuntime` 读取视图
- 否则回退主线程 `SolarSystemPhysics`
- Worker 初始化 4 秒超时则自动降级

### 7.2 Worker 侧物理推进

代码位置：`app/workers/physics.worker.ts`, `app/lib/physicsRuntime.ts`

- 指令：`init / step / applySnapshot / setThrust / setThrottle`
- 主线程通过 `integrateOneFrame` 投递步进请求
- `stepDone` 事件用于渲染侧同步

### 7.3 渲染插值解耦

代码位置：`app/context/PhysicsRenderInterpolationContext.tsx`

机制：

- 监听 `META_I32_SEQ`（物理步序号）
- 保持 `prevAu` / `currAu`
- 根据墙钟估计步间 `alpha`
- 渲染时用 \((1-\alpha)\cdot prev + \alpha\cdot curr\) 进行平滑

作用：弱化 Worker 固定步与渲染帧率不一致导致的视觉抖动。

---

## 8. 可视化与性能策略（核心部分）

### 8.1 屏幕空间 LOD

代码位置：`app/lib/screenSpaceBodyLod.ts`

球面屏幕投影直径近似：

$$
\alpha=\arctan\!\left(\frac{R}{d}\right),\qquad
\mathrm{discPx}\propto \frac{\alpha}{\tan(\mathrm{vFov}/2)}
$$

并使用 `smoothstep` 进行轨道/标签淡入淡出。

### 8.2 卫星批渲染与分级显示

代码位置：`app/components/SatelliteConstellationOverlay.tsx`

- `InstancedMesh` 最多 500 颗
- 每帧分批更新实例矩阵（`batch <= 120`）
- 距离阈值 LOD（远处点状，近处细节模型）
- TLE 传播放入独立 Worker，降低主线程压力

---

## 9. 物理公式库（LaTeX 展示版）

本节分为两部分：

- **A. 项目已实现并使用的公式**（直接映射代码）
- **B. 扩展公式**（用于理论展示与论文表达）

### 9.1 引力与动力学（已用）

代码映射：`app/lib/physicsEngine.ts`

1) 牛顿 N 体加速度

$$
\mathbf{a}_i^{(N)}=\sum_{j \neq i} G m_j \frac{\mathbf{r}_{ji}}{\left(\lVert \mathbf{r}_{ji}\rVert^2+\varepsilon^2\right)^{3/2}}
$$

2) 合加速度分解

$$
\mathbf{a}_i=\mathbf{a}_i^{(N)}+\mathbf{a}_i^{(1PN)}+\mathbf{a}_i^{(J2)}+\mathbf{a}_i^{(thrust)}
$$

3) 推力加速度

$$
\mathbf{a}_{thrust}=\frac{\mathbf{F}_{thrust}}{m(t)}
$$

### 9.2 J2 摄动（已用）

代码映射：`app/lib/physicsEngine.ts`, `app/lib/satelliteDynamics.ts`

$$
k=\frac{3}{2}\frac{J_2 \mu R_e^2}{r^5},\qquad f=\frac{5z^2}{r^2}
$$

$$
a_x \leftarrow a_x + kx(f-1),\quad
a_y \leftarrow a_y + ky(f-1),\quad
a_z \leftarrow a_z + kz(f-3)
$$

### 9.3 相对论与时钟（已用）

代码映射：`app/lib/physicsEngine.ts`, `app/lib/solarSystemPhysics.ts`

1) 1PN 小参数量级

$$
\epsilon_{PN}\sim \frac{v^2}{c^2}\sim \frac{GM}{rc^2}
$$

2) 弱场原时比

$$
\frac{d\tau}{dt}\approx 1-\frac{\Phi}{c^2}-\frac{v^2}{2c^2}
$$

### 9.4 推进与控制（已用）

代码映射：`app/lib/solarSystemPhysics.ts`, `app/lib/spacecraftAutopilot.ts`

1) 质量流率

$$
\dot{m}=\frac{T}{I_{sp}g_0}
$$

2) 法向机动方向

$$
\hat{\mathbf{n}}=\frac{\mathbf{r}\times\mathbf{v}}{\lVert\mathbf{r}\times\mathbf{v}\rVert}
$$

3) 下降段垂向速度

$$
v_{vertical}=\mathbf{v}_{rel}\cdot \hat{\mathbf{n}}
$$

### 9.5 卫星链路与覆盖（已用）

代码映射：`app/components/SatelliteConstellationOverlay.tsx`

1) FSPL

$$
L_{FSPL}(\mathrm{dB})=20\log_{10}(d_{km})+20\log_{10}(f_{MHz})+32.44
$$

2) 覆盖角判定

$$
\theta=\arccos\left(
\frac{\mathbf{u}\cdot\mathbf{v}}{\lVert\mathbf{u}\rVert\lVert\mathbf{v}\rVert}
\right),\quad
\theta \le \theta_{beam} \Rightarrow \text{covered}
$$

### 9.6 数值积分（已用）

代码映射：`app/lib/physicsEngine.ts`, `app/lib/solarSystemPhysics.ts`

1) 状态方程

$$
\dot{\mathbf{x}}=\mathbf{v},\qquad
\dot{\mathbf{v}}=\mathbf{a}(\mathbf{x},\mathbf{v})
$$

2) RK4 更新

$$
y_{n+1}=y_n+\frac{h}{6}(k_1+2k_2+2k_3+k_4)
$$

3) DP5(4) 步长调节思想（示意）

$$
h_{new}=h\cdot \mathrm{clip}\!\left(
s\cdot \mathrm{err}^{-\frac{1}{5}},
f_{min},f_{max}
\right)
$$

---

### 9.7 轨道力学扩展公式（展示用）

1) 开普勒第三定律（两体）

$$
T=2\pi\sqrt{\frac{a^3}{\mu}}
$$

2) 维斯-维瓦公式

$$
v^2=\mu\left(\frac{2}{r}-\frac{1}{a}\right)
$$

3) 轨道比能

$$
\varepsilon=\frac{v^2}{2}-\frac{\mu}{r}
$$

4) 轨道角动量

$$
\mathbf{h}=\mathbf{r}\times\mathbf{v}
$$

### 9.8 相对论扩展公式（展示用）

1) 史瓦西半径

$$
r_s=\frac{2GM}{c^2}
$$

2) 引力红移近似

$$
z \approx \frac{\Delta\Phi}{c^2}
$$

3) 特殊相对论洛伦兹因子

$$
\gamma=\frac{1}{\sqrt{1-\frac{v^2}{c^2}}}
$$

4) 低速展开

$$
\gamma \approx 1+\frac{1}{2}\frac{v^2}{c^2}+O\!\left(\frac{v^4}{c^4}\right)
$$

### 9.9 屏幕空间与可视化扩展（展示用）

代码映射：`app/lib/screenSpaceBodyLod.ts`

$$
\alpha=\arctan\!\left(\frac{R}{d}\right),\qquad
\mathrm{discPx}\propto \frac{\alpha}{\tan(\mathrm{vFov}/2)}
$$

该式用于轨道/标签 LOD 的屏幕可见性估计。

---

## 10. 代码映射附录（文件 -> 责任）

- `app/lib/physicalConstants.ts`：单位与基础常量
- `app/lib/physicsEngine.ts`：加速度模型（牛顿/EIH/J2）与 RK4/DP54 算法核
- `app/lib/solarSystemPhysics.ts`：状态容器、精度分档、步进调度、变质量与原时累计
- `app/components/SolarSystemIntegrator.tsx`：每帧积分驱动与自动驾驶调用点
- `app/lib/spacecraftAutopilot.ts`：发射阶段机、下降与着陆判据
- `app/lib/satelliteDynamics.ts`：卫星 J2 + RK4 粒子模型
- `app/lib/satelliteTle.ts`：TLE 解析、SGP4 传播接口
- `app/api/tle/route.ts`：CelesTrak 拉取与缓存
- `app/components/SatelliteConstellationOverlay.tsx`：卫星可视化、覆盖、FSPL、LOD
- `app/lib/useSolarSystem.ts`：主线程/Worker 运行时选择
- `app/lib/physicsRuntime.ts`：主线程对 SAB 物理状态的只读门面
- `app/context/PhysicsRenderInterpolationContext.tsx`：渲染插值桥
- `app/lib/screenSpaceBodyLod.ts`：屏幕空间 LOD 公式与阈值

---

## 11. 已实现与未显式实现边界说明

- 已实现：
  - N 体牛顿 + EIH 1PN + 局部 J2
  - DP5(4)/RK4
  - 飞船变质量推进与发射/着陆阶段机
  - 卫星 TLE/SGP4、FSPL、覆盖可视化
  - Worker + SAB + 渲染插值解耦
- 需谨慎表述：
  - TEME→ECI 显式矩阵变换在当前代码中未见完整独立实现流程，应在学术文稿中标注为“现状/待显式化”。

---

## 12. 符号表与变量对照

### 12.1 数学符号

- \(\mathbf{x}_i,\mathbf{v}_i\)：第 \(i\) 个天体位置、速度
- \(m_i\)：第 \(i\) 个天体质量
- \(G\)：万有引力常数
- \(c\)：光速
- \(\mu\)：标准引力参数（典型 \(\mu=GM\)）
- \(\varepsilon\)：软化长度
- \(J_2\)：二阶带谐项系数（扁率主导项）
- \(R_e\)：地球赤道半径
- \(I_{sp}\)：比冲
- \(T\)：推力
- \(g_0\)：标准重力加速度
- \(\tau\)：原时
- \(\Phi\)：引力势
- \(\Delta v\)：脉冲速度增量

### 12.2 代码字段映射（高频）

- `posM / velM / mass`：SI 状态主量（积分输入输出）
- `posAu`：用于渲染与 UI 的 AU 位置缓存
- `thrustVecN`：三维推力向量（N）
- `spacecraftFuelMassKg / spacecraftDryMassKg / spacecraftSpecificImpulseS`
- `spacecraftProperTimeS`
- `invC2`：相对论修正开关量（`1/c^2` 或 `0`）

---

## 13. 关键算法伪代码（与实现同构）

### 13.1 每帧主流程

对应：`SolarSystemIntegrator.tsx` + `solarSystemPhysics.ts`

```text
for each render frame:
  dtSimS = wallDelta * daysPerSecond * DAY_SECONDS
  updateLaunchAutopilot(physics, simDays, dtSimS)   // 飞船控制层
  integrateOneFrame(dtSimS, invC2, tier, simDeltaDays) // 物理层
  collectTelemetryAndDiagnostics()
```

### 13.2 自适应 DP5(4) 步进

对应：`stepSimulatedSeconds` + `dp54TrialStepErrorNorm` + `dp54Commit`

```text
remaining = dtTotal
h = clamp(initialGuess, dtMin, dtMax)

while remaining > 0:
  hTry = min(h, remaining)
  err = dp54TrialStepErrorNorm(state, hTry)
  if err <= 1:
    dp54Commit(state, hTry)
    remaining -= hTry
    h = hTry * clamp(safety * err^(-1/5), facMin, facMax)
  else:
    h = hTry * clamp(safety * err^(-1/5), facMin, facMax)
    if h < dtMin:
      fallbackRK4(remaining)
      break
```

### 13.3 飞船下降段控制（启发式）

对应：`spacecraftAutopilot.ts -> descent`

```text
n = normalize(r_sc - r_target)        // 局部法向
vVertical = dot(v_rel, n)             // 垂向速度
alt = |r_sc - r_target| - R_target
needBrake = max(0, |vVertical| - max(1.3, sqrt(alt * k)))
throttle = clamp(needBrake / K, 0, 1)
thrustDir = -n

if alt <= 4 and |vVertical| < 2:
  state = landed
```

---

## 14. 数值稳定性与误差讨论

### 14.1 软化项与近距离奇异性

在 N 体场景中，距离趋近于零会导致加速度项发散。实现通过
`|r|^2 + eps^2` 软化核抑制尖峰，提高稳定性，代价是极近场精度损失。  
本工程目标是“可交互天体系统仿真”，该折中是合理的。

### 14.2 DP5(4) 自适应与性能上限

自适应算法能在“剧烈段”自动加密时间采样，但 CPU/worker 预算是硬约束。  
因此实现中设置了：

- 每步最大加速度评估次数
- 最小步长阈值
- 达到极限后的 RK4 兜底

这样可避免某一帧陷入“无限拒步”。

### 14.3 渲染抖动来源与解法

当物理步频与渲染帧频不同步时，直接用离散物理态渲染会有“台阶跳动”。  
`PhysicsRenderInterpolationContext` 用 `prevAu/currAu/alpha` 插值，在视觉上等价于连续轨迹近似，从而降低抖动感。

---

## 15. 参数调优建议（工程实践）

### 15.1 物理精度

- 追求准确性：使用 `full` 精度档，保持 1PN 打开
- 追求流畅度：使用 `economy` 档，必要时降为牛顿模式
- 出现能量漂移上升：优先降低 `daysPerSecond` 而不是盲目加大渲染帧率

### 15.2 飞船控制

- 发射段目标速度/高度是任务风格参数，不是物理常数
- 若出现振荡：先调小下降段 `needBrake` 对 `throttle` 的映射增益
- 若出现“推力不生效”观感：检查燃料是否耗尽（质量已经回落到干重）

### 15.3 卫星与链路

- 星座规模上升优先优化 `InstancedMesh` 批更新频率
- FSPL 对频率和距离是对数敏感，UI 滑块步长宜兼顾可读性与稳定性
- 若要强化轨道平面长期演化分析，建议将 J2 模型切换到统一生产路径并补显式坐标系转换说明

---

## 16. 验证建议与实验模板

### 16.1 物理一致性最小测试集

1. **两体近圆轨道守恒测试**：检查能量与角动量相对漂移
2. **相对论开关对比测试**：比较 `invC2=0` 与 `invC2=1/c^2` 的长期差异
3. **推力脉冲测试**：在同一轨道上施加固定 \(\Delta v\)，核验轨道参数变化方向

---

## 17. 相对论深入说明（扩展）

本节给出本项目相对论处理的物理背景、工程近似与适用边界，便于你写课程报告或论文说明。

### 17.1 为什么用 1PN，而不是全 GR 数值相对论

太阳系尺度、弱场、低速（相对 `c`）条件下，完整爱因斯坦场方程数值求解成本远高于工程需求。  
因此本项目采用 **后牛顿近似（Post-Newtonian）** 的 1PN 阶：

- 0PN：牛顿引力
- 1PN：加入 `O(v^2/c^2)` 量级修正

这能在成本可控的前提下，表达“牛顿偏差”的主要效应（如长期轨道相位上的细微差异）。

### 17.2 1PN 量级估算

判据来自无量纲小参数：

```text
epsilon_PN ~ v^2/c^2 ~ GM/(r*c^2)
```

在太阳系常见轨道上该量远小于 1，因此 1PN 截断是合理近似。  
若进入强场（黑洞近旁）或高速度（接近相对论速度）场景，需更高阶 PN 或全 GR 方案。

### 17.3 项目中的 1PN 实现结构

代码 `physicsEngine.ts -> calculateAcceleration` 的逻辑是：

1. 计算 Newton 项 `aNewt`
2. 计算势项与速度相关项
3. 叠加 EIH 1PN 修正到 `out`
4. 最后再加回 `aNewt`

工程意义：

- 你可以通过 `invC2` 开关在同样初值上对比 Newton 与 1PN 差异。
- 该设计也方便做诊断图（如相对论开启前后偏差随时间增长曲线）。

### 17.4 原时（Proper Time）在工程中的解释

项目用弱场公式累计飞船钟：

```text
\frac{d\tau}{dt}\approx 1-\frac{\Phi}{c^2}-\frac{v^2}{2c^2}
```

两个贡献项：

- `-Phi/c^2`：引力势差导致的钟速差（越深势阱，钟越慢）
- `-v^2/(2*c^2)`：运动学时间膨胀（速度越大，钟越慢）

注意：这是弱场近似，不包含高阶潮汐项、旋转体完整时空项（例如 Kerr 全项）。

### 17.5 与卫星工程的关系

在 GNSS/精密测轨背景中，相对论校正对长期误差控制非常关键。  
本项目虽不是导航级模型，但已具备以下教学价值：

- Newton 与 1PN 的可切换对比实验
- 轨道与时钟效应可视化
- 可与链路预算（FSPL）一同构成“动力学 + 通信”联合实验框架

### 17.6 局限与后续可扩展方向

当前局限：

- 1PN 截断（未到 2PN/2.5PN）
- 弱场原时近似（非完整测地线积分）
- 卫星坐标链路中 TEME->ECI 未做显式独立矩阵流程说明

后续可扩展：

1. 增加 2PN 或辐射反作用近似（研究型）
2. 将原时积分改为更严格的世界线参数化形式
3. 建立严格坐标系转换模块（TEME/ITRF/ECI）并做误差预算
4. 增加和公开基准（例如 STK/GMAT）对比的验证章节

---

## 18. 论文写作模板附录（可直接复用）

本附录给出一套可直接用于课程论文/项目报告的结构化模板。你只需把其中的占位参数替换为你实际运行结果。

### 18.1 摘要模板（中文）

```text
本文实现并验证了一个面向太阳系场景的交互式动力学仿真系统。模型采用 SI 单位制，
在牛顿 N 体引力基础上引入 Einstein-Infeld-Hoffmann 一阶后牛顿（EIH 1PN）修正，
并在卫星近地场景中加入 J2 摄动项。数值积分默认使用 Dormand-Prince 5(4) 自适应步长，
并在预算受限条件下使用 RK4 兜底。系统支持飞船变质量推进、发射与着陆自动控制，
以及基于 TLE/SGP4 的卫星传播与 FSPL 链路预算可视化。

实验结果表明：在 [仿真时长] 与 [时间倍率] 条件下，系统可保持 [守恒漂移指标]，
并且相对论开关在 [目标轨道/目标天体] 上体现出可观测但稳定的长期偏差。
本文进一步讨论了弱场近似、坐标系转换与高阶后牛顿项的适用边界。
```

### 18.2 引言模板

```text
研究背景：传统牛顿轨道演示难以体现相对论微效应与工程控制闭环。
研究目标：构建“可交互 + 可解释 + 可扩展”的核心模拟框架。
主要贡献：
1) 统一 N 体引力、1PN 修正与飞船推进控制于同一积分框架；
2) 引入卫星链路预算（FSPL）与覆盖判定，形成动力学-通信联合展示；
3) 通过 Worker/SAB 与渲染插值实现较高交互流畅度。
```

### 18.3 方法章节模板

#### 18.3.1 动力学方程

```text
系统状态定义为 y = [x, v, m]。其中 x,v 为位置速度，m 为飞船质量（其他天体质量可视为常量）。
加速度由三部分构成：
a_total = a_newton + a_1pn + a_j2 + a_thrust

其中：
- a_newton 由 N 体万有引力给出；
- a_1pn 为 EIH 一阶后牛顿修正；
- a_j2 在近地条件下启用；
- a_thrust = F_thrust / m(t)。
```

#### 18.3.2 数值积分策略

```text
默认积分器为 DP5(4) 自适应步长。误差范数小于阈值时接受步进并更新状态，
否则缩小步长重试；在步长下限或评估预算触发时切换 RK4 兜底。
该策略在精度与实时性之间取得折中。
```

#### 18.3.3 控制策略

```text
飞船发射采用阶段机控制（prelaunch -> verticalRise -> gravityTurn -> circularization -> coast），
着陆采用启发式制动节流映射；轨道机动通过顺轨/逆轨/法向 Delta-v 脉冲实现。
```

### 18.4 实验设计模板

#### 18.4.1 实验环境

```text
硬件：CPU/GPU/内存
软件：Node/浏览器版本，运行模式（主线程或 Worker/SAB）
参数：daysPerSecond、precisionTier、是否启用 1PN、是否启用 J2
```

#### 18.4.2 指标定义

```text
物理一致性：
- 相对机械能漂移 relEnergyDrift
- 相对角动量漂移 relAngMomDrift

数值性能：
- stepsLastFrame
- simSecondsAdvanced
- 帧时间统计（平均/95分位）

任务指标：
- 着陆瞬时 |v_vertical|
- 飞船剩余燃料
- FSPL 曲线稳定性与覆盖命中率
```

#### 18.4.3 对比实验建议

```text
组 A：Newton（invC2=0）
组 B：1PN（invC2=1/c^2）
组 C：1PN + J2（卫星近地）

比较项：
1) 长时轨道相位偏差
2) 守恒漂移
3) 实时性能开销
```

### 18.5 结果与讨论模板

```text
结果 1：在 [时长] 内，relEnergyDrift 保持在 [数值]，relAngMomDrift 为 [数值]。
结果 2：1PN 相较牛顿模型在 [对象] 上出现 [量级] 的长期偏差，符合弱场预期。
结果 3：启用 Worker/SAB 后，平均帧耗时由 [A] 降至 [B]，但在 [场景] 存在抖动风险，
通过渲染插值机制可显著缓解。

讨论：
- 近地卫星 J2 项对轨道长期演化有可见影响；
- TEME->ECI 显式转换流程仍需单独模块化，以提升工程可审计性；
- 若进入强场/高速场景，1PN 精度可能不足。
```

### 18.6 结论与展望模板

```text
本文完成了一个面向教学与工程演示的核心模拟系统，实现了 N 体+1PN+J2 的统一建模，
并通过自适应积分与并行运行时获得可用的实时交互性能。后续将重点推进：
1) 更高阶后牛顿项与严格原时积分；
2) 坐标转换链路显式化与误差预算；
3) 与 STK/GMAT 等基准系统的定量对标验证。
```

### 18.7 图表清单建议

- 图 1：系统架构图（物理层-控制层-渲染层）
- 图 2：积分流程图（DP5(4) + RK4 fallback）
- 图 3：Newton vs 1PN 轨道偏差曲线
- 图 4：FSPL 随距离/频率变化曲线
- 表 1：常量与单位
- 表 2：实验参数配置
- 表 3：守恒与性能指标汇总

---

## 19. 教学风格公式页（Step-by-Step）

本节采用“步骤推导 + 结论框”的展示方式，适合直接截图用于汇报。

### 19.1 牛顿 N 体加速度（推导页）

**Step 1：两体引力基本式**

$$
\mathbf{F}_{ij}=G\frac{m_i m_j}{r_{ij}^2}\hat{\mathbf{r}}_{ji}
$$

**Step 2：转为单位质量加速度**

$$
\mathbf{a}_{ij}=\frac{\mathbf{F}_{ij}}{m_i}=G m_j \frac{\hat{\mathbf{r}}_{ji}}{r_{ij}^2}
$$

**Step 3：写成向量分量形式并加入软化项**

$$
\mathbf{a}_{ij}=G m_j \frac{\mathbf{r}_{ji}}{(r_{ij}^2+\varepsilon^2)^{3/2}}
$$

**答案（项目实现形式）**

$$
\boxed{
\mathbf{a}_i^{(N)}=\sum_{j\neq i}Gm_j\frac{\mathbf{r}_{ji}}{(\lVert\mathbf{r}_{ji}\rVert^2+\varepsilon^2)^{3/2}}
}
$$

---

### 19.2 推力项与变质量（推导页）

**Step 1：牛顿第二定律**

$$
\mathbf{F}_{thrust}=m(t)\mathbf{a}_{thrust}
$$

**Step 2：得到推力加速度**

$$
\mathbf{a}_{thrust}=\frac{\mathbf{F}_{thrust}}{m(t)}
$$

**Step 3：质量流率由比冲定义**

$$
\dot{m}=\frac{T}{I_{sp}g_0}
$$

**答案（动力学耦合）**

$$
\boxed{
\mathbf{a}_{total}=\mathbf{a}^{(N)}+\mathbf{a}^{(1PN)}+\mathbf{a}^{(J2)}+\frac{\mathbf{F}_{thrust}}{m(t)}
}
$$

---

### 19.3 弱场原时比（推导页）

**Step 1：弱场度规近似下时间分量展开**

$$
d\tau \approx dt\left(1-\frac{\Phi}{c^2}\right)
$$

**Step 2：叠加低速运动学项**

$$
d\tau \approx dt\left(1-\frac{\Phi}{c^2}-\frac{v^2}{2c^2}\right)
$$

**答案（工程使用）**

$$
\boxed{
\frac{d\tau}{dt}\approx 1-\frac{\Phi}{c^2}-\frac{v^2}{2c^2}
}
$$

---

### 19.4 J2 扰动（推导页）

**Step 1：中心引力项**

$$
\mathbf{a}_g=-\mu\frac{\mathbf{r}}{r^3}
$$

**Step 2：引入二阶带谐系数**

$$
k=\frac{3}{2}\frac{J_2\mu R_e^2}{r^5},\qquad
f=\frac{5z^2}{r^2}
$$

**Step 3：分量修正**

$$
a_x\leftarrow a_x+kx(f-1),\ 
a_y\leftarrow a_y+ky(f-1),\ 
a_z\leftarrow a_z+kz(f-3)
$$

**答案（近地卫星扰动）**

$$
\boxed{
\mathbf{a}=\mathbf{a}_g+\mathbf{a}_{J2}
}
$$

---

### 19.5 FSPL 链路预算（推导页）

**Step 1：自由空间传播损耗定义（工程常用形式）**

$$
L_{FSPL}=20\log_{10}(d)+20\log_{10}(f)+C
$$

**Step 2：选择单位 \(d_{km}, f_{MHz}\)**

$$
C=32.44
$$

**答案（项目实现）**

$$
\boxed{
L_{FSPL}(\mathrm{dB})=20\log_{10}(d_{km})+20\log_{10}(f_{MHz})+32.44
}
$$

---

### 19.6 DP5(4) 自适应步长（算法公式页）

**Step 1：计算误差范数 \(\mathrm{err}\)**

$$
\mathrm{err}=\left\lVert \frac{y^{(5)}-y^{(4)}}{\mathrm{atol}+\mathrm{rtol}\cdot |y|}\right\rVert
$$

**Step 2：接受/拒绝判据**

$$
\mathrm{err}\le 1 \Rightarrow \text{accept},\qquad \mathrm{err}>1 \Rightarrow \text{reject}
$$

**Step 3：步长更新**

$$
h_{new}=h\cdot \mathrm{clip}\!\left(s\cdot \mathrm{err}^{-1/5},f_{min},f_{max}\right)
$$

**答案（工程意义）**

$$
\boxed{
\text{在误差受控前提下自动调节步长，以平衡精度与性能}
}
$$

4. **下降落地测试**：统计着陆瞬时 `|v_vertical|` 是否满足阈值

### 16.2 卫星链路测试

1. 固定频率扫描不同距离，验证 FSPL 单调性
2. 固定卫星轨道，跨越 Tokyo 方向检查覆盖判定跳变点
3. 对比不同组（stations/qzss/starlink）的传播更新稳定性

### 16.3 建议记录指标

- 物理：`stepsLastFrame`, `simSecondsAdvanced`, `relEnergyDrift`, `relAngMomDrift`
- 控制：飞船剩余燃料、推力占空比、下降段触地速度
- 卫星：传播延迟、实例更新吞吐、FSPL 曲线平滑性


# Three.js 可视化（Universe Sandbox 风格）

## 开发（热更新）

1. 安装 Python 可视化依赖：`pip install -r ../requirements-viz.txt`
2. 启动仿真服务（另开终端，仓库根目录）：

   ```bash
   uvicorn solar_sim.viz_server:app --host 127.0.0.1 --port 8765
   ```

3. 本目录执行：

   ```bash
   npm install
   npm run dev
   ```

浏览器打开 Vite 提示的地址（默认 `http://127.0.0.1:5173`）。WebSocket、`/textures`、`/observation.*` 会通过代理转发到 `8765`。

## 界面说明

- **底部控制台**：播放/暂停（WebSocket `{"paused": true/false}`）、**TDB 近似**日历时间、**天/秒**（`timeScale × (3600/86400)`，与后端每步 `dt = 3600s × timeScale` 一致）、缩放与复位视角；中部为占位按钮（视角/视图/工具）。
- **右上角 `i`**：展开诊断面板（相对论偏差、WebSocket、观测图）。
- **中文标签**：CSS2D 标注 ten 天体。
- **轨线**：`Line2` 长历史尾迹 + Bloom。
- **天球**：默认可程序着色银河带；若在 `public/textures/milkyway_equirect.jpg` 放置 **equirect 全景**则自动替换（见 `public/textures/README.md` 版权说明）。

## WebSocket 二进制协议 v2

魔数 `SSIM`，小端序：

| 偏移 | 类型 | 含义 |
|------|------|------|
| 0 | `char[4]` | `SSIM` |
| 4 | `uint32` | 版本 `2` |
| 8 | `uint32` | `n_bodies`（10） |
| 12 | `uint32` | `n_particles` |
| 16 | `float64` | `epoch_jd_tdb`（历元儒略日） |
| 24 | `float64` | `sim_elapsed_s`（自历元起仿真秒） |
| 32 | `float64` | 相对论偏差标量 |
| 40 | `float32[3*n_bodies]` | 日心 AU 位置 |
| … | `float32[3*n_particles]` | 小行星日心 AU |

JSON 控制帧：`{"timeScale": number}`、`{"paused": boolean}`。

客户端仍兼容 **v1**（无历元字段时使用占位 JD）。

## 观测图片

将照片保存为 `public/observation.jpg`（或 `.png` / `.webp`）。若缺失，界面会回退到 `observation_placeholder.svg`。

可将 Universe Sandbox 类参考截图保存为 `public/reference_ui_inspiration.png` 仅供设计对照（不参与运行时渲染）。

## 生产构建（由 FastAPI 托管）

```bash
npm run build
```

然后：

```bash
uvicorn solar_sim.viz_server:app --host 127.0.0.1 --port 8765
```

访问 `http://127.0.0.1:8765/`。

## 无网络 / CI

设置环境变量 `SOLAR_SIM_OFFLINE=1` 可跳过 Horizons，使用合成初始轨道；历元 JD 退化为 J2000（`2451545`）。

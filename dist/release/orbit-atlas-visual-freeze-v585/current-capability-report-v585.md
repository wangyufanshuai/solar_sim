# Orbit Atlas v585 current capability report

Generated: 2026-08-04T00:00:00Z

## 结论

Legacy V9 五件套已经从历史 Git/Lite 对象按原字节恢复，Stable 普通首页重新绑定 `ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY`。v562 与 hero 视觉已迁移到独立 candidate namespace，普通 `/`、standalone 和 Lite 的静态 import graph 不再触达 v562/local-shadow。

当前达到 Preview 技术资格但仍不具备 production alias 切换授权：浏览器矩阵=通过，视觉回归=通过，v585 Preview 构建=READY，v585 Preview HEAD=29/29 通过，用户晋级确认=未提供。

## 哪些美术曾被改变

- 提交 `1eecca0f` 将 `GalaxyEnvironmentSphere` 默认天空从 Legacy V9 改成 v562 runtime candidate。
- 同一提交删除了 source/Lite 中的 V9 base-8K/base-4K，导致 formal pointer 虽仍为 v263，普通运行时视觉却不能严格复现。
- v562 manifest 还直接复用了 `orbit-atlas-v9-*` URL 身份。v585 已把这些绑定全部拆开。

## 哪些只是候选

- `candidate-v562` 只允许由 `/local-shadow-v562` 显式启用。
- `experimental-hero` 是 presentation-only，Science 使用线性显示，Cinematic 不得写回 classification、redshift、EVPA、intensity、Stokes 或 coordinates。
- v585 Vercel deployment 继续按 Preview 对待，不是正式 v263/Legacy V9 发布。

## Legacy V9 恢复

状态：**完整、原字节、SHA/尺寸/provenance 全匹配**。没有生成、重压缩、相似图或 v562 替代。

## 当前部署

v585 Preview `dpl_9ixwYBCfWxeYg2ytgsbwxcG5sUt9` 已在 `preview` 目标构建为 `READY`：https://next-7nlewylfj-wyufan43-3383s-projects.vercel.app。内置浏览器已直接打开根页并确认默认视觉为 Legacy V9、桌面观测无控制台错误；这只证明 Preview 可访问，不替代逐资源 HEAD 门。

本机 Node fetch 与 Vercel curl 传输均失败，但内置浏览器 CDP 已对固定 29 项各发送一次 HEAD；Vercel 平台日志恢复出精确 29/29 HTTP 200、0 项 404，Preview HEAD 门已闭合。v585 没有切换 production alias，也没有删除当前 deployment。

Git 分支保留本地提交，但仓库 remote 数量为 0，状态为 `blocked-no-remote-configured`；没有猜测或添加 remote。

## 构建资格

standalone、Lite、local-shadow 三个 8 GiB 构建均通过并保留 rollback slot。本机 native SWC 二进制不可加载，使用 Next 官方 WASM fallback；这是 runner warning，`nativeQualified=false`，不冒充 native qualification。

## 科研执行状态（与正式指针分离）

- Formal evidence：v263-current-product-evidence-pointer；默认 kernel `legacy-eih-1pn`。
- v579 dense：complete，49/49；aggregate SHA 6b949ee6a813aa48c35e8d2c4a0eedc84693c3173ea12486f9c79f281351d50e。
- v580 GPU shadow：qualified-gpu-shadow，不改变 CPU authority。
- v581 measured authority：false；真实 acquisition 不等于 measured admission。
- 旧 v567 gate 与这些后续执行 artifact 存在时间线差异；v585 不重写旧 gate。

## 下一步

1. 保持已通过的三构建、双 viewport、资源生命周期、soak 与 29/29 HEAD evidence 不变。
2. 由用户提供或确认精确 Git remote 后 push；当前不猜测仓库地址。
3. 若要晋级 production alias，必须由用户单独明确确认；v585 不自动 promotion。

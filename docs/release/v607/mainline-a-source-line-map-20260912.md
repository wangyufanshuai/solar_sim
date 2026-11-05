# Mainline A source-line map（2026-09-12）

本文件是 Mainline A 第一轮执行基线。它只记录源码身份与证据边界，不把本地候选线的结果宣称为 GitHub `main` 的结果。

## 身份

| 项目 | 当前值 | 证据/含义 |
|---|---|---|
| 远端仓库 | `https://github.com/wangyufanshuai/solar_sim` | public、未归档、默认分支 `main` |
| 远端 `main` | `82af1d751989714d930393e163dce4614083a1af` | Deep Universe v4 合并提交；root app 布局 |
| 远端开放 PR | [#5 AAA Interface v5](https://github.com/wangyufanshuai/solar_sim/pull/5) | draft，head `7918fa2`；UI/审计线，不含 Mainline A 资产身份 |
| 本地 Git 根 | `E:/86137/myai` | 当前工作树的 Git 根，不是 `next-web` 子目录 |
| 本地实现目录 | `E:/86137/myai/solar_sim/next-web` | Mainline A 历史实现与 v607 receipt 所在目录 |
| 本地分支 | `codex/kerr-polarization-transport-v586` | 当前 HEAD `6ab0609bb76fb2787223f889e60714281907728a` |
| 关系判定 | 未证明同源 | 本地分支与远端 `main`/PR #5 不是同一 commit 或已验证移植结果 |

只读逐 blob 比对得到：远端树约 706 项（`app` 220、`public` 352、`scripts` 100），本地 `next-web` 约 1498 个 tracked app 文件；同路径同内容 103、同路径但内容不同 99、远端路径在本地缺失 469。远端依赖 Next 14/React 18/R3F 8，而本地是 Next 16/React 19/R3F 9，并包含 Tauri、SQLite 与大量 vXXX 证据层。`git merge-base main HEAD` 无结果，`git rev-list --left-right --count main...HEAD` 为 `37 21`；由于对象缺失，不能证明两线同源。

## 目录映射

远端产品线在仓库根目录使用 `app/`、`public/`、`scripts/`、`docs/`；本地 Mainline A 在 `solar_sim/next-web/` 下拥有同名目录及 v607 专属 receipt。两者不能仅凭目录同名视为可替换。

架构层也已漂移：远端 `app/UniversePage.tsx` 是约 863 行的实际编排器；本地 `next-web/app/UniversePage.tsx` 仅做 re-export，真实运行时由 `AtlasRuntimeWorkbench`、`AtlasRuntimeWorkbenchSurface` 与 `SceneHost` seam 组成。因此后续若迁移，必须在 Atlas seam 建 adapter，不能直接覆盖 `UniversePage`。

| Mainline A 责任 | 本地候选线 | 远端产品线处理 |
|---|---|---|
| 12 张星云来源、权利和字节身份 | `next-web/docs/release/v607/mainline-a-stage-a3-extension-delivery.json`、`next-web/public/textures/mainline-a/` | 尚未证明已移植到 `main` 或 PR #5 |
| 星云场景 resolver/portrait/texture | `next-web/app/lib/mainlineANebulaSceneV607.ts`、`next-web/app/lib/mainlineANebulaSceneTextureV607.ts`、`next-web/app/components/MainlineANebulaScenePortraitV607.tsx` | 需逐文件比较后再决定移植 |
| 星座关系和观测路线 | `next-web/app/data/mainlineAObservationRoutesV607.ts` | 需与远端 Sky Atlas/Deep Universe 关系模型建立显式适配层 |
| A1–A6 receipts 与验证器 | `next-web/docs/release/v607/`、`next-web/scripts/` | 远端 CI 可作流程参考，不能替代本地 A 线 receipt |

## 当前候选线的文件指纹

以下 SHA-256 来自当前工作树，只用于后续构建输入绑定的起点：

| 文件 | SHA-256 |
|---|---|
| `docs/release/v607/mainline-a-six-stage-goals-v607.json` | `378038b1d31a00965142e1324c7d53caec650fb6a5bd74d87dba8f820900fc81` |
| `docs/release/v607/mainline-a-stage-a3-extension-delivery.json` | `87ccf16bec61ad3a2214e307e8ffe39691e39e10962c8c1d794474e94a0c8118` |
| `app/components/MainlineANebulaScenePortraitV607.tsx` | `96dbb3f9e6169d5b3a5b986cb60db3c3012a218896ff7e807f7a91e13ad6735f` |
| `app/lib/mainlineANebulaSceneTextureV607.ts` | `147deadb1fd58ebea1f2e67f36b2224a6603fe3884dee0001bcb97208781f965` |

## 执行决策

当前采用**路线 L（候选线先闭环）**：继续在 `next-web` 完成 A3/A2/A4/A5/A6 的可复验缺口，同时把远端 root app 和 PR #5 作为发布移植参考。只有在 12 张星云运行时、浏览器矩阵、构建输入绑定和性能门槛完成后，才进行一次受控迁移到远端 root app；迁移前不把本地结论写入 GitHub PR。

路线 L 的下一步是 A3：从 `mainline-a-stage-a3-extension-delivery.json` 生成唯一 12 条资产 registry，接入 resolver、信用 UI、加载/释放测试，并重新生成覆盖矩阵。当前扩展 delivery 仍是 6 张已清权本地资产、运行时整合分离，不能提升阶段状态。

## 证据限制

- 本地工作树存在大量未提交改动；禁止 reset、checkout、全量 staging 或删除。
- GitHub Actions 的通过只覆盖基础 CI，不能证明 Mainline A 的视觉、浏览器交互、设备性能或真实用户体验。
- 当前浏览器连接需要 OAuth 重新认证；在恢复前，A2/A4/A5 浏览器项保持 pending。
- 全工作树 TypeScript 仍受缺失的 `dist/science/kerr-sparse-observation-envelope-v560/manifest.json` 阻塞；不能用空文件或排除规则伪造通过。
- 远端 root app 的 `deep-sky/pack-v3` 与本地版本化 `v562…v592`/`mainline-a` 资产路径不同；后续迁移必须使用显式 adapter，禁止直接 cherry-pick 或按同名目录覆盖。

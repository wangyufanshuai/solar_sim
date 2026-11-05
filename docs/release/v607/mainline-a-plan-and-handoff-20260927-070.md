# Solar Sim Mainline A：剩余批次与当前交接

日期：2026-09-27。070 是规划和状态交接，不是开发轮、验收通过记录或代码量收据。保留 067、069 及全部历史输出。当前状态以本文件引用的 068b 构建和对应检查为准；069 中尚未修复、测试失败、尚未构建的描述已经过时。

## 当前判断

项目已有可运行的本地生产构建和较完整的来源、候选审核及验收工具，处于候选版整合验收阶段，尚未完成最终发布验收。B1/V637 已有 066 收口记录；B2/V638 已完成本批生产实现和静态修复，新构建通过，36 对象的完整浏览器矩阵与最终收据仍未完成。

展示目录的既有口径是 20 颗恒星、12 个星座、12 张星云；A 线 canonical 子集是 12/12/12，共 36 项。Beta 固定目标仍是 24 颗 hero stars、12 个重点星座、24 张有来源和清晰版权记录的观测图。来源候选、原始下载、生成 manifest 和展示项目数量都不能当作最终验收数量。

最终 Beta 覆盖集必须是 60 项。canonical36 加新增四星、十二图仅得 52 项，还需纳入八颗既有非 canonical 恒星。B3/B4 应沿用同一观察协议扩充完整 60 项覆盖索引，B5 在最终构建上核对全部 60 项并回归 canonical36。这是在完成原固定目标，不扩张目录规模。

当前顶级 goal 已存在且 active，不创建重复目标。规划不关闭、不暂停该目标。

## 剩余工作包与完成条件

| 顺序 | 工作包 | 需要完成 | 收口条件 | 轮次预算 |
|---|---|---|---|---|
| 1 | B2：A 线 36 对象冻结 | 在 068b 生产预览上完成 12 星、12 星座、12 星云的选择、呈现、返回、取消/重试与资源观察，导出真实批次并离线验证 | 当前构建绑定的 36 项覆盖，失败保留、修复后重验，桌面视觉与可用移动 viewport 分别报告，round/code-change 收据封存 | 当前一轮收完 |
| 2 | B3：四颗 Beta 恒星 | Acrux、Spica、Regulus、Polaris 的候选呈现，系统/分量身份、单位、缺失值和不确定性逐字段追溯；消费既有真实 raw 与审核输入；补入八颗既有非 canonical 恒星的覆盖索引 | 20 到 24 的候选展示范围落实；24 星全部列入验收；身份错配、伪造及 fixture 不可晋级；未确认保持 hold/not-admitted | 约一轮 |
| 3 | B4：十二张新增星云 | 按两组六张接入既有真实原图与衍生资产，统一裁切、尺寸、署名、加载失败/重试和释放；逐图验证 HTTP 字节与显示来源 | 24 项目标的候选展示/技术验证覆盖；逐图 SHA、尺寸、来源闭合；未签署继续 pending | 1–2 轮，两个完整六图批次分别达到代码门槛才分轮 |
| 4 | B5：多设备性能和生命周期 | 在最终运行时版本上做重复切换、帧时间、内存与资源观测；至少两次独立 30 分钟运行；桌面和可用移动 viewport；核对 Beta60 完整覆盖并回归 canonical36 | 单独 performance receipt，重复运行可复核；资源登记释放与实际 GPU 释放区别报告；无真机就记 not-run | 约一轮；仅执行现有工具不独立计轮 |
| 5 | B6：只读对齐与候选交付 | 消费可信 root 输入及审核输入，对齐代码/构建/资产/来源/版权身份，生成候选包、回滚和未关闭门禁 | 最后通过的构建与包一一绑定；缺 root 权威 manifest 或真实签署继续 pending | 0–1 轮；纯封包并入前一轮 |

合计按 5 个工作包、4–6 个实际开发轮规划，包含当前 B2；B2 封口之后约 3–5 轮。画面与交互主体集中在 B2–B4，约 3–4 轮。R47–R59 和已完成管线不重做；B 编号用来说明 R66 延续阶段的剩余工作包，不重复宣称旧 R61–R66 全部验收通过。

排期预算：构建盘空间恢复、范围保持不变且没有重大回归时，画面/交互收尾约 2–4 个专注工作日，技术候选交付合计约 4–6 个专注工作日。此为规划估计，不是已测得的交付速度或固定上线日期。来源/版权人工审核、真机、root 权威输入和远端权限等待另计，不能通过多写代码消除。

每轮至少 1000 行有效生产/数据接入/工具代码，测试另列。不足则合并相关完整功能，不复制既有管线、机械填数据或新增孤立面板凑数。Node、Vitest、定向 ESLint、生产构建、HTTP、桌面浏览器及可用移动 viewport 仍为完整轮要求。B6 的可信输入消费应提前并入 B3/B5，避免封包时改运行时而使已有证据失效。

## 当前实查与证据分层

### static

- Git root：`E:/86137/myai/solar_sim/next-web`；分支 `codex/solar-sim-mainline-a`；HEAD `156ec7790a99be2f89f5d8f44831cb118c9437e1`。dirty 工作树全部保留。
- B2 068 基线已存在，继续复用：`tmp/mainline-a-b2-baseline-20260927-068/inventory.json`；SHA-256 `039b247ae888d453374a8628afd5bd20532fcead68111890cfa59b5904e072bb`。不可重建。
- 本次只读重算 `node tmp/count-mainline-a-b2-068.cjs`：1599 行有效生产代码，19 个生产/工具文件。全部变更统计为新增 3714、删除 195、修改配对 135，其中包含测试；它们不能替代有效生产行。计数尚未 seal。`next.config.mjs` 另有变更但未计入这 1599 行。
- 复核既有测试产物：`tmp/mainline-a-b2-vitest-068.json` 为 357/357；`tmp/mainline-a-b2-eslint-068.json` 为 31 文件、0 errors/0 warnings；Node intake 9/9、build-tool 13/13。后续类型窄化修复的 48 项定向测试和 lint 已通过，不能和原 357 项重复累计。本次规划没有重跑整套测试。
- 成功构建：`docs/release/v607/mainline-a-r66-build-20260927-068b.json`，status passed、sourceStable true，buildId `MWJ1kKt8d99rWccDdaqO5`，runtimeBuildId `mainline-a-adab7be926b0c871`，source SHA-256 `adab7be926b0c87159346ebab4420987c28cbd75fca76edf9e51cce6190aa51f`。
- 原失败构建 `068` 保留；不得覆盖。新构建采用 4096 MiB heap、CPU 1、`--disk-cache off`。这只关闭该保留构建的 Webpack disk cache，普通构建行为不变。
- V619 `--check` 本次 verified、4/4 pending。它是冻结历史契约，不能据此否认后续已经存在的真实 raw capture。

### HTTP

- `docs/release/v607/mainline-a-b2-http-20260927-068.json` 绑定上述 runtimeBuildId，首页和 health 为 200，8 个入口 JS/CSS 字节与构建 SHA 匹配。
- 十二张 canonical 星云逐图 HTTP SHA/尺寸验证及最终批次 intake 仍待收口，不把入口资源校验当成全部资产验收。

### browser

- 本次复用内置 Browser 成功读取标签 2，URL `http://127.0.0.1:3068/`，页面可见太阳系、恒星图集、星云候选及工具入口。
- 公开 DOM 构建身份为 `mainline-a-adab7be926b0c871`，branch/head 与本地一致。
- 当前本地监听为 127.0.0.1:3068、PID 55556；已有 server exec session 85063。后续先验证是否仍存活，不盲目重启或复制运行时。
- 本次仅为状态/身份核对。068b 的 36 对象矩阵、批量原始导出和代表性移动 viewport 操作尚未完成。

### visual

本次规划没有新增截图或视觉通过结论。B2 最终需实际检视桌面和移动 viewport 截图，保留失败，不沿用 B1 图像冒充 B2。

### performance

本次没有新增性能运行。首屏 DOM、页面可见和单次截图不能充当稳定帧率、长时运行或生产用户性能；资源登记释放不等于物理 GPU 释放。真机证据继续未执行。

### external-source

- `mainline-a-stellar-primary-review-20260927-060.json` 为 candidate-review-pending，componentConfirmed=false。
- `mainline-a-nebula-source-artifact-closure-20260927-053.json` 为 raw-evidence-complete-review-pending：raw images 12、source pages 12、rightsSigned 0、rightsPending 12、sceneAssetAdmissions 0。这些是既有收据数据，本次未重新下载。
- 本次 Exa 单次检索返回 3 个官方政策页面，检索可用。NASA 与 JPL 都有来源署名/第三方内容条件；政策页面不等于逐图批准。参考：https://www.nasa.gov/nasa-brand-center/images-and-media/ 与 https://www.jpl.nasa.gov/jpl-image-use-policy/ 。
- 本次 Vercel list_projects 仍为 403 Forbidden，scope `wyufan43-3383s-projects` 未获授权。只读检查未部署、未输出凭据。远端发布证据未取得，不阻止已有本地预览验收。

## 优先问题

1. 构建盘容量：本次 E 盘依次仅有 82,255,872 与 76,136,448 字节空闲，不足 100 MiB，已经低于新构建关闭缓存模式的 256 MiB 预检门槛。禁止直接再次构建或复制整套 runtime。256 MiB 只是拒绝过低空间的门槛，不是峰值容量保证。后续开发前应恢复足够余量；建议多 GiB 的工作余量，仍按实际产物预算复核。不删除任何历史文件、不清理其它项目、不改页文件。
2. B2 验收完整性：36 个对象每项至少 30 秒，观察下限 18 分钟，另加实际交互、截图、失败复核和导入时间。不得用点击、解码或静态投影替代渲染和往返。
3. 四星身份与新增十二图审核：用户已选择保持 pending 并继续技术验收，不再次询问同一版权选项，不自动签署。
4. 最终外部输入：root 权威 manifest、真机与签署材料、Vercel 权限独立保留。root 只能消费被允许的只读输入，不操作父 Git。

## 会话建议与继续入口

现在不需要强制新开会话。当前 goal、生产预览和浏览器已接通，B2 完整验收结束后是更清晰的交接边界；这更新 069 对立即切换的建议。没有可可靠读取的剩余上下文百分比，不能宣称上下文已满。

若用户主动切换，新会话用同一个 dirty 目录，先读本文件和 worktree boundary；不要仅按 HEAD 创建干净 worktree覆盖进度。不要假定 goal、浏览器绑定、进程控制句柄或子代理状态自动迁移；先读取并核对。本文没有创建新会话、重复 goal、暂停或关闭原 goal。

下一步：先核对空间及 3068 身份，保留已通过构建；从恒星、星座、星云各一项真实 UI 往返验证开始，再完成 canonical36 矩阵。原始导出独占写入新文件，绑定 068b 后离线 intake/replay，完成桌面/可用移动 viewport 证据和 B2 round/code-change receipt，再进入 B3。

继续提示：

> 继续 Solar Sim Mainline A，目录 E:/86137/myai/solar_sim/next-web。先读 docs/release/v607/mainline-a-worktree-boundary-20260914.json 和 mainline-a-plan-and-handoff-20260927-070.md。B1 已收口，B2/V638 已有 1599 行有效生产代码、静态检查和 068b 成功构建，当前待完成的是 3068 上的 36 对象实际浏览器矩阵、原始批量导出/回放、桌面与可用移动 viewport、最终收据。069 里列出的实现缺陷已经修复，不重做。保留 068 基线和所有 dirty 工作、旧构建及证据。E 盘上次不足 100 MiB，先核对空间，不盲目构建或复制产物。确认已有 goal 状态，不重复创建。B2 后按 B3 四星、B4 两组六图、B5 性能与设备、B6 只读对齐和候选发布推进。每实际轮至少 1000 有效生产/工具行，测试另计；签署 pending、candidate-only/hold/not-admitted、scientificPayloadWriteback=false、物理内核及父 Git 边界不变。

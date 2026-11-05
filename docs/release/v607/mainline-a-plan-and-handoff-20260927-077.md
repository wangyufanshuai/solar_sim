# Solar Sim Mainline A：整体排程与会话交接检查点

核验日期：2026-09-27（Asia/Shanghai）。本文件响应“先整体规划、还要多少轮、当前上下文是否要新开会话”。这是规划与交接更新，不是新增开发轮、B2 完成收据或发布批准。075 保留为历史记录；继续入口改为本文件及 068d 实测收据。

## 当前结论

- B1/V637 已完成有边界的实现与技术验证；B2/V638 仍在验收返修，未完成 A 线冻结。
- 当前项目属于可运行候选版，尚不能宣布美术主线或最终发布完成。
- 余下按六个交付批次排程，包含当前 B2。实际开发约 4–6 轮：前四批是核心开发；B5/B6 是否独立成开发轮取决于是否存在实质功能工作。
- 顶级 goal 已核验为 active，继续复用，不创建重复 goal、不标记 complete/blocked。
- 当前会话和浏览器连接可继续工作。建议 B2 的新构建、canonical36、原始导出/回放和收据闭合后再切换；无需因已有长历史立即新开。

## 仓库及会话边界

当前 Git root：`E:/86137/myai/solar_sim/next-web`；分支 `codex/solar-sim-mainline-a`；HEAD `156ec7790a99be2f89f5d8f44831cb118c9437e1`。本次从该目录核验 root/status/branch/HEAD，保留大量既有未提交内容。

不操作父 Git，不 reset/clean/checkout/删除/stage/commit，不覆盖历史工作树、原始证据或构建。不得修改 EIH、Newton N-body、2PN/Lense–Thirring、Kerr 物理内核。不改写冻结 V616/V619/V620/V621 数据来制造完成状态，不向运行时科学载荷写回候选证据。

版权逐项签署按用户明确选择继续 pending，技术验收照常推进，无需重复询问。始终保持 candidate-only、hold、not-admitted、scientificPayloadWriteback=false。

## 剩余六批与结束条件

| 顺序 | 功能批次 | 必须交付的结果 | 主要依赖 |
| --- | --- | --- | --- |
| 1 / B2 | A 线 12 星云 / 12 星座 / 12 恒星冻结 | 修复鼠标恢复面板的遮挡；新生产构建；同一构建的 36 项真实 UI 往返、加载/失败恢复、资源观察、原始导出及离线重算；完整桌面视觉检查；移动 viewport 限制明确列出 | 当前 dock 返修与新构建；不得拼接旧构建记录为新构建 36/36 |
| 2 / B3 | Beta 24 颗 hero stars | 四颗待核恒星的真实来源、组件身份、单位/缺失值/不确定性、候选呈现；八颗既有非 canonical 恒星补齐证据与运行时验收；24 星矩阵 | 公共交互与观察器稳定；身份未确认时保持 hold |
| 3 / B4a | 新增星云第一组六图 | 原图/官方页、SHA-256、尺寸、raw 与派生映射、署名、裁切/展示、加载失败和释放；候选展示范围 12→18 | 现有真实来源材料；签署 pending 不自动晋级 |
| 4 / B4b | 新增星云第二组六图 | 同样逐图闭合，使候选展示范围 18→24；无合成补位、无未经批准的准入 | 第一组接入路径经过浏览器验证 |
| 5 / B5 | Beta60 多设备性能与生命周期 | 最终 60 项覆盖与 canonical36 回归；移动端档案/场景切换修复；重复加载、取消、重试、释放；两次独立且连续至少 30 分钟观察；指标与缺失能力如实报告 | B3/B4 的最终对象及资产集合稳定；可用移动 viewport 与真机证据分开 |
| 6 / B6 | root/next-web 只读对齐与最终候选包 | 可信 root 输入比较、代码/构建/manifest/来源/版权闭包；绑定最终构建的候选包、恢复/回滚信息与门禁清单 | B5 的最终实测构建、可信 root 输入；正式发布仍受外部门禁约束 |

B 编号是当前 R66 延续中的完整功能批次，用于安排剩余工作，不表示重做 R47–R59，也不表示历史 R61–R66 已全部验收。

美术画面及交互主体集中在前四批。完成可复核的技术候选还需要 B5/B6。若 B5/B6 只运行已有工具、测试或打包，归入相关轮次验收，不灌水开发以凑行数；若发现实质工具或产品缺口，才作为完整开发轮处理。按六批预留，不能把“再六轮”解释为外部科学/版权/权限一定闭合。

每个实际开发轮继续遵守已有 goal 的至少 1000 行有效生产/数据接入/工具代码要求，测试另计；不计格式化、注释、收据、截图、机械数据复制或纯文档。每轮包含实质测试、Node、Vitest、定向 ESLint、生产构建、HTTP、桌面浏览器、可用移动 viewport、round receipt 与 code-change receipt。小修复继续归原批次。

## Beta60 的完整范围

Beta60 = 24 颗恒星 + 12 个星座 + 24 张星云图。canonical36 + 四颗待核恒星 + 十二张新增星云图 = 52，不能漏掉八颗既有非 canonical 恒星。

已按当前 `stellarHeroesV592.generated.ts` 和 `mainlineACanonicalCoverageV622.generated.json` 核对 B3 增量清单：

- 四颗待核：`acrux`、`spica`、`regulus`、`polaris`。
- 八颗已有待补验：`alpha-centauri-b`、`hadar`、`altair`、`pollux`、`fomalhaut`、`deneb`、`bellatrix`、`alnilam`。

来源存在与组件身份确认是不同门禁。四星已有真实 raw/补充来源，不应再笼统描述为“没有来源”。V619 `--check` 本次仍 verified、4/4 pending，这是冻结计划状态，不代表后来没有获取记录。

## 最新构建与证据

最新成功的保留生产构建为 068d：

- buildId：`iKoGl6qEAF6z0z7ouSq06`。
- runtimeBuildId：`mainline-a-280138c149008279`。
- sourceSha256：`280138c149008279dff06dca2330250154911de8d3406f9a83141920044b2aae`。
- 目录：`.next-mainline-a-r66-20260927-068d`；预览：`http://127.0.0.1:3070/`；已知服务 exec session：`83064`。
- 构建收据：`docs/release/v607/mainline-a-r66-build-20260927-068d.json`。
- 预检收据：`docs/release/v607/mainline-a-b2-preflight-browser-20260927-068d.json`，SHA-256 `874ef9bdeae7e34d6a12abb69832e15631143f8f07676cdcae65f5a2a7a71960`。

| 证据类别 | 068d 已记录结果 | 当前限制 |
| --- | --- | --- |
| static | 550/550 Vitest（26 文件）；13+63 Node 测试；59 文件 ESLint 无 error/warning；生产构建及其 TypeScript 检查通过 | 这些数字绑定 068d 源码，不覆盖随后 dock 新修改；不宣称全历史测试/脚本 TypeScript 均通过 |
| HTTP | 入口/健康检查及构建资源成功；12/12 canonical 星云 JPEG 的 HTTP、SHA、尺寸核验成功 | 新 068e 必须重新采集，不能套用此结果 |
| browser | M42 观察保留原始 JSON，离线重算 measured-local；本次读取当前页面仍显示 1/36、长测 0 | 通过键盘恢复保存了观察；鼠标恢复门禁失败；完整 canonical36 尚未跑完 |
| visual | 三颗恒星盘面旧亮点在新截图未见，外轮廓与 halo 保留；Orion 桌面完整取景 | 这是 AI 对有限静帧的检查；dock 遮挡仍需新构建验证；不等于人工签署 |
| performance | M42 约 161 秒短时本地 RAF/资源观察；时钟字段与绝对窗口校验修复已进入 068d | RAF 间隔不是 GPU renderer 帧耗时；两次 30 分钟长测未完成；不等于生产或真实用户性能 |
| external-source | 四星组件身份仍 pending；新增 12 图原图/官方页材料已有，签署 0/12 | 科学与版权批准未获得，保持候选边界 |

移动 390×844 viewport 已执行，但档案覆盖场景，关闭档案会清除选择并回到太阳系。`tmp/mainline-a-b2-orion-mobile-scene-068d.jpg` 记录的是关闭后的太阳系画面，不是 Orion 移动场景通过。完整移动场景验收未完成，physical-mobile 为 not-run；该产品问题明确纳入 B5。

旧 068c 缺少新时钟字段的 raw 保留为历史证据，不应重写或晋级满足新规则。不能从旧 M42 失败记录缺少的时间戳反推历史原因已被证明。

## 当前 B2 返修与下一步

068d 的浏览器失败根因是裸 `[data-celestial-object-passport-open="true"]` 同时匹配整页 root 遥测镜像与真实 ASIDE；布局把 root 当作全屏障碍及内联宿主，恢复按钮被工具入口遮挡。最新补丁由已有代理 `/root/b2_material_lifecycle` 负责，限制在其原五个 dock 文件内。代理在本文件封存前明确 stopped-writing，报告最新 4 测试文件 86/86 tests、5 文件 ESLint、strict targeted TypeScript 通过。仍需主代理复核、整合检查及新生产构建浏览器验证。

上述五个文件均为 untracked；scoped `git diff --check` 虽退出 0，但没有读取这些文件的正文，不作为独立内容验收。068d 的鼠标失败结论不变；代理未运行 068e、构建或浏览器，没有改动旧证据。

修复范围包括：真实语义面板选择器；排除 root/观察器祖先/canvas 容器；实际 footer/workspace 几何；portal 提交后的恢复按钮命中验证；圆角按钮采用中心及边中点检查，避免角点误判。不能用键盘恢复或命中宿主任意后代代替鼠标按钮通过。

下一步固定顺序：

1. 复核原代理交回的最终五文件与自测命令；代理已经 stopped-writing，圆角采样风险已补回归，仍需主代理复核；不重建重复代理任务。
2. 完成新源码对应的定向及整合检查；重新检查磁盘，生成新的保留构建 068e，使用独立预览端口 3071。
3. 采集新 HTTP 与 DOM 构建身份，先验证 M42/档案/星云说明卡叠放下的真实鼠标恢复；移动 viewport 单列。
4. 鼠标门禁通过后再执行 canonical36，每项至少 30 秒，保存原始记录与截图；失败尝试同样保留。
5. 完整 UI 批次导出、核对长度/哈希、离线 intake/replay，才封存 B2 round/code-change 与分层验收收据。
6. 按 B3→B4a→B4b→B5→B6 推进，goal 保持 active。

原基线不得重建：`tmp/mainline-a-b2-baseline-20260927-068/inventory.json`，本次复算 SHA-256 仍为 `039b247ae888d453374a8628afd5bd20532fcead68111890cfa59b5904e072bb`。计数器 `tmp/count-mainline-a-b2-068.cjs` 无参数为只读；只有闭合时才使用 `--seal`。

本次 14:54 UTC 的中间统计为有效生产/数据/工具代码 2297 行，新增 5954 行、删除 255 行、修改配对 195 行；测试另计，修改配对不再次加总，CSS/generated/docs/receipt 不计入。统计时 dock 代理尚在写入，仅作规划参考，不是最终 code-change receipt；next.config 的变更需另行披露。

新构建预备命令（需先完成上述检查，不能边改边构建）：

```powershell
$env:ATLAS_NODE_HEAP_MB='4096'
$env:ATLAS_BUILD_CPUS='1'
node scripts/build-mainline-a-preserved.mjs --round 66 --run-id 20260927-068e --disk-cache off
```

`tmp/collect-mainline-a-b2-http-068e.mjs` 已准备，尚未运行。068c/068d 及其他历史服务、失败产物都保留，不用其证据证明 068e。

## 排期与外部依赖

当前没有可靠的完整批次吞吐可据此承诺日历交付日。按六批排程；B2 收口后用实测工时校准剩余排期。单是 canonical36 的 30 秒下限已需至少 18 分钟，另加真实操作、加载、截图、检查、构建与返修；两次独立连续 30 分钟长测至少需要一小时，不能用短记录拼接。

技术工作可以继续；正式发布另受四星身份、逐项版权签署、可信 root 输入及云端权限约束。最近允许范围内的 root 审计仍缺可信 manifest，本次未进入父 Git。最近 Vercel 只读调用对 scope `wyufan43-3383s-projects` 返回 403；没有部署，不为本地 B2–B5 等待该权限。Exa 可以辅助官方来源发现，不能代替 raw 哈希、身份核验或版权签署。

E 盘本次只读检查剩余 1,415,811,072 字节。历史缓存压缩已有 076 保留字节收据，构建前重新检查；不得为腾空间删除历史证据或盲目重复压缩。

## 是否新开会话

不必现在新开。现有 goal active；浏览器会话本次可读取，观察器 finished、基线 Alpha Centauri A ready。不存在可验证的上下文剩余百分比，不能声称上下文“已经满了”。上下文压缩本身不取消当前工作。

B2 完整验收收据落盘后是更清晰的切换点。若用户选择更早切换，应从同一个 dirty 目录继续，先读本文件、边界文件、B1 收据与 068d 预检；禁止仅从 HEAD 创建干净 worktree，避免丢下未提交成果。新会话不能假定旧 goal、代理授权、Node REPL 变量或进程句柄自动迁移；先核验现有状态再复用。本次未创建新会话。

当前浏览器继续注意：保留原 observer 挂载；完整批次导出字符串可能被工具输出截断，应核对长度、JSON 与哈希；使用已准备的 `runCycleNext068` 及实际新 build ID，避免旧 helper 的硬编码文件名写错版本。当前没有进行中的观察。

建议继续提示：

> 继续 Solar Sim Mainline A，目录 E:/86137/myai/solar_sim/next-web。先读 worktree boundary 与 mainline-a-plan-and-handoff-20260927-077.md，再读 068d 预检。B1 已交付；B2 clock/stellar paint 修复已进入成功构建 068d，但真实鼠标 dock 恢复失败。最新 dock 补丁代理已 stopped-writing，报告86 tests/ESLint/strict targeted TypeScript通过，先复核差异与整合检查，再构建 068e、采集新 HTTP/DOM 身份、完成 canonical36/raw/replay/收据。不得把旧构建 1/36 或键盘恢复当鼠标及全覆盖通过。保留 dirty 目录、原 068 基线、所有历史成功/失败构建和证据。后续 B3 四星加已有八星、B4 两组六图、B5 Beta60 多设备及两次连续30分钟、B6 可信输入只读对齐与候选包。版权签署继续 pending，技术验收继续；候选边界及 scientificPayloadWriteback=false 不变，不改物理内核、不操作父 Git。先检查既有 goal，不重复创建；goal 未完成。

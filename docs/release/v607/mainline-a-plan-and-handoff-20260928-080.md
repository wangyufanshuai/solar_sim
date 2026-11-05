# Solar Sim Mainline A：剩余批次、工期与会话交接

核验日期：2026-09-28，Asia/Shanghai。本检查点更新 079 的状态与估算，保留 079 和历史证据。本文件不是新增开发轮、B2 完成收据、版权批准或发布批准。

## 当前结论

项目是可运行、已有生产构建和部分真实浏览器证据的技术候选。B1/V637 已交付；B2/V638 的生产代码与本轮静态检查已完成，但 canonical36 浏览器验收尚未闭合，A 线尚未冻结。

剩余共六个完整交付批次：当前 B2 加五个后续批次。实际开发约四至六轮，包含 B2。仅测试、截图、收据或打包不单独计开发轮；发现的小缺陷在所属批次内解决。

美术可见内容集中在前四批。保守规划为美术内容约四至八个集中开发日，最终技术候选约六至十二个集中开发日。此估算假设现有材料可用、环境稳定、返修有限，是工作量预算，不是后台连续运行承诺或日历交付保证。079 的四至八日整体估算只作乐观情形保留；B2 闭合后按实际耗时校准。

无需现在新开会话。优先完成 B2 的完整批次导出、回放和收据，再交接到下一批。没有可读的上下文剩余百分比；不能据长聊天推断上下文已满。

## 当前边界

- Git root：`E:/86137/myai/solar_sim/next-web`。
- 分支：`codex/solar-sim-mainline-a`；HEAD：`156ec7790a99be2f89f5d8f44831cb118c9437e1`。
- 顶级 goal 仍为 active，目标为 R61–R66 延续；不新建重复 goal，不标记完成。
- 保留大量未提交成果、原始下载、失败记录、历史构建和原计数基线。
- 只操作 next-web Git，不操作父 Git；不 reset、clean、checkout、删除、覆盖工作树、整体暂存、提交或部署。
- 不改 EIH、Newton N-body、2PN/Lense–Thirring、Kerr 物理内核。
- 继续 candidate-only、hold、not-admitted、`scientificPayloadWriteback=false`。
- 用户已决定逐项版权签署保持 pending、继续技术验收，不重复询问签署。
- V619 `--check` 本次为 verified、4/4 pending；该冻结契约不代表不存在后续 raw，也不能改写它制造准入。

## 剩余六批

| 顺序 | 批次 | 完整交付内容 | 完成条件 |
| --- | --- | --- | --- |
| 1 | B2：A 线冻结，当前在途 | 12 恒星、12 星座、12 星云；当前修复构建的真实路由、加载、往返、释放与说明布局 | 同一构建 36 项真实 UI 原始记录、逐项视觉检查、完整 UI bundle、离线重算、分层证据及 round/code-change 收据；移动限制单列 |
| 2 | B3：Beta 24 星 | 四颗待核星的候选 inspector 和来源 ledger；已有八颗非 canonical 星的整合；Beta24 独立 producer、观察和回放 | 24 星呈现与交互矩阵、来源/单位/缺失值/组件语义负例、构建与浏览器证据；未确认的科学归属保持 hold |
| 3 | B4a：第一组六图 | 12→18 图候选呈现；原图、官方页、署名、哈希、尺寸、派生关系、取消/失败/释放 | 六图逐项技术证据与接入回归；签署 pending 不自动准入 |
| 4 | B4b：第二组六图 | 18→24 图候选呈现，复用经验证的管线 | 第二组六图逐项证据与全部 24 图回归；不使用合成补位 |
| 5 | B5：多设备与生命周期 | Beta60 与 canonical36 回归；移动档案/场景切换；帧间隔、可用内存指标、纹理释放和重复运行 | 两次独立连续至少 30 分钟观察及重算；桌面、移动 viewport、物理移动设备分别记录；能力缺失明确 not-run |
| 6 | B6：只读对齐与技术候选包 | 可信 root 输入、代码/构建/manifest 对齐、来源版权闭包、恢复和回滚资料 | 包绑定最终构建并列出全部未关闭门禁；缺可信 root 输入则对齐 pending，不操作父 Git |

每个实际开发轮至少 1000 行有效生产、数据接入或工具代码，测试另计。排除格式化、注释、收据、截图、纯文档、机械复制。每轮包含实质测试、Node、Vitest、定向 ESLint、生产构建、HTTP、桌面浏览器、可用移动 viewport 及两类收据。B5/B6 若无实质开发缺口，只作为验收/打包批次，不凑行数；B5 已知移动交互缺口应预留修复量。

Beta60 = 24 恒星 + 12 星座 + 24 星云。24 颗 V592 参数光球已有旧名录定位入口；20 颗指 Mainline A 来源/metadata 就绪清单。B3 不能描述为重造四颗 shader，也不能把四条候选数据塞入需要已确认参考距离的旧清单。

## 最新构建与证据分层

构建收据：`docs/release/v607/mainline-a-r66-build-20260928-068f.json`。

- buildId：`8MJ7mMMfLI8PvgmwKuNpU`。
- runtimeBuildId：`mainline-a-5b7be2f948fa9171`。
- source SHA-256：`5b7be2f948fa9171fb582401bfbc9d57bf95fc64eb221aea6279a58bad442ba3`。
- 构建目录：`.next-mainline-a-r66-20260928-068f`；status passed、sourceStable=true。
- 本次确认服务 PID 41892 在 `http://127.0.0.1:3072/` 监听，浏览器实际页面正常。恢复时仍需重新核对，不重复启动。

| 证据层 | 当前证据 | 尚不能得出的结论 |
| --- | --- | --- |
| static / build | 586/586 Vitest，76/76 Node，61 文件定向 ESLint 0 错误/警告；068f 生产构建与 TypeScript 通过 | 不是全仓测试、浏览器验收或科学有效性 |
| HTTP | 068f 入口/健康/资源 passed；12/12 原有 JPEG 字节、SHA、解码尺寸通过，总计 3,324,626 B | 不能证明浏览器 draw 或视觉质量 |
| browser | 首颗 Achernar 实际往返 raw 与真实 UI bundle 已保存，离线校验为 1/36，行状态 measured-local | 整批 intake=incomplete-local，完整回放因缺 35 项 blocked；A 线没有冻结 |
| visual | 068f Helix 桌面和短高度说明布局已保存截图/几何；短高度实际滚动后两来源链接可命中 | 尚未完成 36 项视觉矩阵；实际链接点击未观察到新标签，不声称外部页访问成功；不是人工签署 |
| performance | Achernar 为约 31 秒本地 RAF/资源短测 | RAF 不是 GPU 帧耗时，登记字节不是物理显存；两次连续 30 分钟尚未闭合，不代表生产或真实用户性能 |
| external-source | Exa 官方来源查询可用；四星归属仍待确认；新增十二图签署 0/12、场景正式准入 0；Vercel 项目访问仍 403 | raw、搜索、通用版权条款与哈希一致均不替代逐项签署、科学确认或部署批准 |

静态日志：`tmp/mainline-a-b2-vitest-068f.json/.log`、`tmp/mainline-a-b2-eslint-068f.json/.log`、`tmp/mainline-a-b2-node-068f.log`、`tmp/mainline-a-b2-node-replay-068f.log`。138 项 caption 子集包含于 586 项，不能重复累加。

HTTP 收据：`docs/release/v607/mainline-a-b2-http-20260928-068f.json` 与 `docs/release/v607/mainline-a-b2-nebula-http-20260928-068f.json`。

原始浏览器检查点：

- `tmp/mainline-a-b2-browser-star-achernar-01-068f.json`，50,206 B，SHA-256 `6524e7affc0be41fa546566ad3d97c0a2f66314aa7d39d48ef873af67b75f574`。
- `tmp/mainline-a-b2-batch-01-068f.json`，56,885 B，SHA-256 `33c28c97148f616c17f5c1d2bac6788b57ab28cb91f2ca3e18a8416c17fd7522`。
- `tmp/mainline-a-b2-intake-01-068f/intake.json`、`index.json`、`replay.json`；命令 exit 1 表示矩阵未齐，记录本身无校验问题。
- 实际浏览器绑定检查点：`docs/release/v607/mainline-a-b2-browser-checkpoint-01-068f.json`。

B2 原基线仍为 `tmp/mainline-a-b2-baseline-20260927-068/inventory.json`，SHA-256 `039b247ae888d453374a8628afd5bd20532fcead68111890cfa59b5904e072bb`。本次无参只读计数：2604 有效生产/工具行；范围内总新增 6672、删除 262、修改配对 202，配对不重复计数，测试不计有效行。`next.config.mjs` 不在此计数范围，需最终单列。尚未执行 `--seal`，不能把它当最终 code-change receipt。

## 优先级与外部门禁

先完成 B2 同一构建的剩余 35 项矩阵和收据，再做 B3，不交叉扩张内容后重跑整条冻结验收。每六项保存真实 UI batch 检查点，最后保存完整导出；不能从散落 raw 拼接冒充 UI bundle。保留 068e 的 29 项为历史预检，不并入 068f 的通过数。

第二优先级是 B3 的独立候选来源和 Beta24 观察链，随后两组六图。B5 解决已知移动档案覆盖场景/关闭影响选中对象的问题，并完成长时间重复观察。最终做可信输入对齐和包绑定。

正式发布日期受四星组件科学归属、逐项版权签署、可信 root 输入与云端权限制约。最新允许范围内审计缺可信 root 输入；本次没有进入父目录或父 Git。它们保持 pending 时，可继续完成标明门禁的技术候选，不能宣布正式发布完成。

本次 Exa 搜索返回 ESA/Hubble、ESA/Webb 官方版权条款及 ESA Open Access 条款。材料要求完整、可见署名，且许可适用范围和例外应按各图核对；不将 ESA 不同站点许可统一套用。参考：`https://esahubble.org/copyright/`、`https://esawebb.org/copyright/`、`https://open.esa.int/image-usage-creative-commons/`。

Vercel `list_projects` 对 `wyufan43-3383s-projects` 再次返回 403，需要该 scope 的授权连接；未部署。这不阻塞本地 B2–B5。

## 会话恢复

建议 B2 完整收据封存后换会话。当前原始记录已落盘，可继续使用现有会话和 active goal。上下文压缩不等于重新开始，但任何新会话都需重新核验 goal、代理、生产服务和浏览器状态；不能假定动态变量、页面队列或旧目标自动迁移。

若提前换：沿用这个含未提交成果的目录，不仅从 HEAD 建干净工作树；先读 boundary、080、079 和 068f 构建/检查点。不要两个主会话同时写同一批。不要自动关闭或重载含队列的页面。

当前页为 3072，基线 Alpha Centauri A、面板已展开，首项 Achernar 已保存，1/36。连接内可复用 `iab` 与 `solar068f`；新会话不得假定这些变量存在。旧 3071 服务、旧构建与旧失败页全部保留。本次没有创建新会话。

接续提示：

> 继续 Solar Sim Mainline A，目录 E:/86137/myai/solar_sim/next-web。先读 mainline-a-worktree-boundary-20260914.json 与 mainline-a-plan-and-handoff-20260928-080.md。复用现有 active goal；B1已交付，B2/V638未闭合。068f构建、586Vitest、76Node、61文件ESLint和HTTP通过；实际canonical36首项Achernar raw与真实batch已保存，离线1/36，整批incomplete。检查现有3072服务/浏览器后继续剩余35项，每6项保存真实batch，完成后回放并封存B2。保留dirty目录、原068计数基线与历史证据，不重复构建或伪造bundle。后续B3 Beta24来源/候选整合，B4两组六图，B5 Beta60和两次30分钟及移动修复，B6可信root只读对齐和候选包。签署保持pending，scientificPayloadWriteback=false，不改物理内核，不操作父Git，不并行写同一批。

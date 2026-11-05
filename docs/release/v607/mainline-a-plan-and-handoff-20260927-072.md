# Solar Sim Mainline A：剩余批次与会话交接

日期：2026-09-27。本文件是用户要求的整体规划与状态交接，不是新增开发轮、验收通过或代码量收据。保留 070、071 和全部历史产物。070 的总体范围与轮次预算仍可参考，但其中“在 068b 上直接完成完整矩阵”的下一步已经过时。

## 当前结论

项目处于可运行候选版的整合验收阶段。B1/V637 已完成有边界的技术交付；B2/V638 尚未封口。顶级 goal 已存在且 active，本次没有新建、暂停或关闭 goal。

工作目录只限 `E:/86137/myai/solar_sim/next-web`。本次实查 Git root 正确、分支 `codex/solar-sim-mainline-a`、HEAD `156ec7790a99be2f89f5d8f44831cb118c9437e1`。大量 dirty 工作全部保留，未访问父 Git，未 reset/clean/checkout/delete/stage/commit/deploy。

最近的 068b 浏览器预检发现三项实际缺陷：性能观察面板遮挡页脚搜索；常驻 Relativity workbench 遮挡搜索结果与星云说明；星座镜头把 Orion 放大到裁切，但旧 readiness 仍报告 ready。前两项已修复源码并有定向测试；星座修复代理报告核心实现完成、中间版本 106/106 定向测试通过、9 文件 ESLint 通过、定向 strict tsc 通过。随后独立复核发现 body focus 的 sky lock 与中断过渡时 maxDistance 恢复两个边缘，代理正在补修复和回归；106 项结果因此不代表最新全部改动已通过。这些是 static 进度，尚未经过新生产构建及浏览器验证。

068b 仍是旧成功构建：buildId `MWJ1kKt8d99rWccDdaqO5`、runtimeBuildId `mainline-a-adab7be926b0c871`。它不能代表当前修复后的源码。先完成修复复核，再生成新的保留构建 068c；不覆盖 068 或 068b。

## 剩余范围和轮次

按 5 个工作包、4–6 个实际开发轮规划，包含当前 B2；B2 收口后约 3–5 轮。排程预留 6 轮，关联功能足够紧密且达到代码门槛时合并。B 编号是 R66 延续中的剩余功能包，不能当作旧 R61–R66 已全部通过。

| 顺序 | 完整功能批次 | 明确交付与收口条件 | 轮次预算 |
|---|---|---|---|
| B2 | A 线 canonical36 冻结 | 完成三项展示修复；新构建中验证鼠标搜索/结果点击、面板开合、完整星座取景；12 星、12 星座、12 星云逐项真实 UI 往返、资源观察、失败恢复、原始导出与离线回放；桌面与可用移动 viewport 分列 | 当前 1 轮收完 |
| B3 | Beta 四星与全部恒星覆盖 | Acrux、Spica、Regulus、Polaris 的候选呈现、系统/分量身份、单位、缺失值与不确定性来源追溯；消费已有真实 raw；同时补入 8 颗既有非 canonical 恒星的覆盖；身份未确认保持 hold/not-admitted | 约 1 轮 |
| B4 | 十二张新增星云 | 按两组六图接入已有真实原图与派生展示资产，逐图 SHA、尺寸、来源、署名、裁切、失败重试与资源释放验证；12 到 24 的候选范围闭合，未签署保持 pending | 1–2 轮 |
| B5 | 最终版本的性能与生命周期 | 核对 Beta60 并回归 canonical36；重复切换、取消/重试、帧间隔与可取得的渲染/内存指标；至少两次独立 30 分钟运行；桌面及可用移动 viewport；真机缺失明确 not-run | 约 1 轮；纯执行现有工具并入关联轮 |
| B6 | root/next-web 只读对齐与候选交付 | 消费可信 root 输入，比较代码、构建、manifest、来源与版权；绑定最后通过的构建、候选包、回滚与未关闭门禁；可信输入接口提前开发，避免封包时再改运行时 | 0–1 轮；纯封包并入前轮 |

最终 Beta 固定范围为 **60 项 = 24 颗恒星 + 12 个星座 + 24 张星云图**。从 A 线 36 项增加四星和十二图只得到 52 项，还必须覆盖八颗既有非 canonical 恒星。不得漏掉这八项，也不扩张原目标目录。

画面与交互主体集中于 B2–B4，约 3–4 个完整批次；技术候选交付还要包括 B5/B6。轮次是范围预算，不是速度测量。当前缺少稳定、可复核的整轮吞吐数据，070 的“2–4 / 4–6 个专注工作日”只能作为旧低置信度估计，不能作为当前交付承诺。完成新构建的 B2 矩阵后再据实校准日历排期。

每个实际开发轮至少 1000 行有效生产/数据接入/工具代码，测试另列；不计空白、注释、生成收据、机械复制数据、截图与纯文档。不足则合并同阶段完整功能，不拆成微小开发轮。每轮 Node、Vitest、定向 ESLint、生产构建、HTTP、桌面浏览器、可用移动 viewport、round/code-change receipt 均保留。规划及审计本身不触发凑代码。

## 本次核验与证据边界

| 类别 | 已知结果 | 仍然不能宣称 |
|---|---|---|
| static | Git root/branch/HEAD 当前已核对；V619 `--check` verified、4/4 pending；B1 有 066 收据；B2 旧综合检查与新增修复定向检查各自保留 | 修复后的整体生产构建通过、科学字段已准入 |
| HTTP | 068b 十二张 canonical 星云 HTTP 收据 passed：200、字节/SHA、解码尺寸校验；入口资源亦有构建绑定 | 这些旧构建结果已验证 068c |
| browser | 本次复用标签 2，`http://127.0.0.1:3068/` 仍可读取实际页面；预检已保存并离线核验 3/36 条生命周期记录 | 36 项完整验收、真实用户验收 |
| visual | 预检检查过桌面截图并发现三项缺陷；移动 390×844 的部分面板适配有观察记录 | 修复后画面已通过、全部对象或真机已通过 |
| performance | 预检保留了原始 RAF 间隔，期间包含 UI 调试与磁盘压缩干扰，只能诊断 | GPU 帧时、生产性能、长期稳定性、物理 GPU 释放 |
| external-source | 已有四星真实 raw/补充资料及十二图原图/官方页；本次 Exa 返回官方 NASA/JPL 政策；Vercel 再次只读查询仍为 403 | 搜索结果等于科学有效性、逐图版权批准、远端部署成功 |

本次没有重跑整套构建/测试或新建截图，未把规划作为开发收口。B2 此前未 seal 的有效生产代码计数为 1599 行/19 文件；新增修复完成后需要从原 068 基线重新计数，不能拿全 dirty diff 或把重复测试相加充数。

V619 的历史 4/4 pending 不能解释为“四星没有来源”；后续确有原始捕获和补充资料。身份与字段审核尚未完成，Polaris 等资料不得自动写回科学载荷。

## 当前优先级与依赖

1. 完成星座真实几何取景复核，并确保 transition、locked、zoom 与所有原始 anchors 的 safeRect 检查一致。保留恒星和星云原有镜头行为。
2. 复核构建空间。E 盘本次空闲 474,877,952 字节，约 453 MiB；此前 ENOSPC 的失败输出保留。071 记录了不删除文件的 NTFS 压缩和字节哈希验证。256 MiB 仅是 cache-off 构建的最低拒绝阈值，不保证峰值容量足够；不要重复盲目压缩或构建。
3. 确认所有实现代理停止写入后，生成 068c；先重验三项缺陷，再执行 canonical36。每项至少 30 秒，单纯观察下限 18 分钟，另外预算交互、截图、失败复核及导入时间。
4. B3/B4 保持独立审核门禁。用户已选择“版权签署暂时 pending，继续技术验收”，不重复要求选择，也不自动代签。十二图当前签署为 0/12；有官方页面和署名不等于已经签署。
5. 可信 root manifest、真机记录、逐项审核、Vercel scope 权限独立管理。Vercel 当前 `wyufan43-3383s-projects` 403；发布前需要有权的 scope，但不阻止本地技术验收。未操作上级仓库。

## 会话建议

**现在不必强制新开；建议 B2 封口后再开新会话。** 现有 goal、修复代理、预览与 Browser 仍接通；B2 的新构建、canonical36 原始导出和完整收据会形成较清晰的交接点。没有可靠的上下文剩余百分比，不能声称已满。

若提前切换，必须沿用同一个 dirty 目录并先读本文件与 worktree boundary。不能仅依据 HEAD 创建干净 worktree，因为当前有效进度主要在未提交文件内。不要假定 goal、浏览器绑定、代理状态和进程句柄自动迁移；重新核对后复用，避免重复任务与重复启动。本次没有创建新会话。

## 继续入口

先读：

- `docs/release/v607/mainline-a-worktree-boundary-20260914.json`
- 本文件 `mainline-a-plan-and-handoff-20260927-072.md`
- `docs/release/v607/mainline-a-b2-preflight-browser-20260927-068.json`
- `docs/release/v607/mainline-a-build-storage-preservation-20260927-071.json`

保留：

- B1：`docs/release/v607/mainline-a-art-round-66-v637-20260927-066.json`
- B2 原基线：`tmp/mainline-a-b2-baseline-20260927-068/inventory.json`，不可重建。
- 旧成功构建：`docs/release/v607/mainline-a-r66-build-20260927-068b.json`
- 旧 HTTP12：`docs/release/v607/mainline-a-b2-nebula-http-20260927-068b.json`
- 预检导出：`tmp/mainline-a-b2-preflight-batch-068.json`
- 预检离线核验：`docs/release/v607/mainline-a-b2-preflight-intake-20260927-068/intake.json`
- 恒星来源：`docs/release/v607/mainline-a-stellar-primary-review-20260927-060.json`
- 十二图来源：`docs/release/v607/mainline-a-nebula-source-artifact-closure-20260927-053.json`

继续提示：

> 继续 Solar Sim Mainline A，目录 E:/86137/myai/solar_sim/next-web。先读 worktree boundary 和 mainline-a-plan-and-handoff-20260927-072.md。B1/V637 已收口，B2/V638 正在完成真实浏览器预检发现的两处遮挡及星座取景修复。先查询已有 b2_material_lifecycle 代理的最终复核状态，勿重复实现；修复源码尚未进入旧成功构建 068b。确认磁盘余量与代理停止写入后构建新的 068c，再验证三项缺陷、canonical36、原始批次回放、桌面/可用移动 viewport 并封存 B2 收据。不要把旧构建证据归到新源码。保留 068 基线和所有 dirty 工作、旧构建、失败输出。已有 goal active，不重复创建。B2 后按 B3 四星加既有八星覆盖、B4 两组六图、B5 Beta60性能/生命周期、B6只读对齐与候选包推进。每实际轮至少1000有效生产/接入/工具行，测试另计。版权签署 pending；candidate-only/hold/not-admitted、scientificPayloadWriteback=false；不改物理内核，不操作父 Git。

官方政策参考：

- https://www.nasa.gov/nasa-brand-center/images-and-media/
- https://www.jpl.nasa.gov/jpl-image-use-policy/

本次 Exa 检索仅用于来源政策复核；仍按逐图 credit、第三方权利和项目审核记录判断，不由一般政策自动晋级。

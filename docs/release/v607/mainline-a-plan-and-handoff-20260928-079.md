# Solar Sim Mainline A：剩余批次与会话交接

核验日期：2026-09-28，Asia/Shanghai。079 更新 077 的当前状态，077 和全部历史证据保留。本文件是规划与交接检查点，不是新增开发轮、B2 完成收据或发布批准。

## 当前结论

- 项目是可运行的技术候选版。B1/V637 已交付；B2/V638 正在修复与验收，A 线尚未冻结。
- 剩余按 **6 个完整交付批次** 排程，包含当前 B2；美术画面与内容主体集中在前 4 批。实际开发约 4–6 轮，B5/B6 只有测试、观察或打包时不另计开发轮。
- 顶级 goal 已核验为 active，复用现有 goal，不另建或标记完成。不得把此次规划当作完成其中任一批。
- 无需因长上下文立即换会话。建议 B2 完整收据封存后切换到后续批次；现有页面已恢复可操作，原始文件仍在。
- 版权逐项签署按用户决定保持 pending，技术验收继续；不重复询问签署。

## 仓库边界

本次核验 Git root 为 `E:/86137/myai/solar_sim/next-web`，分支 `codex/solar-sim-mainline-a`，HEAD `156ec7790a99be2f89f5d8f44831cb118c9437e1`。大量未提交成果保留在当前目录。

只操作 next-web 内部 Git。不进入父 Git，不 reset、clean、checkout、删除、覆盖历史工作树、整体暂存或提交。保留原始下载、失败记录、历史构建。禁止改动 EIH、Newton N-body、2PN/Lense–Thirring、Kerr 物理内核。所有候选继续 candidate-only、hold、not-admitted、scientificPayloadWriteback=false。

本次重跑 V619 `--check` 为 verified、4/4 pending；这是冻结契约的状态，不等于四星没有后续真实 raw。不得改写 V616 snapshot/projection 或冻结 manifest 来制造进度。

## 剩余交付计划

| 顺序 | 批次 | 完整范围 | 结束条件 |
| --- | --- | --- | --- |
| 1 | B2：A 线冻结 | 12 星云、12 星座、12 恒星；星云长说明、来源链接、布局与鼠标操作 | 修复后新生产构建；同一构建 36 项真实 UI 往返和资源观察；原始 UI 批次导出、离线重算、桌面视觉检查、HTTP 与 round/code-change 收据闭合。移动限制单列 |
| 2 | B3：Beta 24 星 | 20→24 候选呈现；四星组件身份/来源；八颗现有非 canonical 星；独立 Beta24 观察/导出/回放 | 24 项呈现与交互矩阵、来源和单位/缺失值/不确定性校验、负例测试、构建及浏览器证据。身份未确认继续 hold |
| 3 | B4a：第一组六张星云 | 12→18；真实原图、官方页、SHA-256、尺寸、署名、派生映射、失败恢复和释放 | 六张逐图接入候选预览并完成技术验收；签署 pending 不自动准入 |
| 4 | B4b：第二组六张星云 | 18→24；复用经过验证的接入链完成另一组六张 | 第二组六张逐图证据与 24 图回归；不使用合成补位 |
| 5 | B5：多设备与生命周期 | Beta60 覆盖、canonical36 回归、移动场景/档案切换、取消/重试/释放、帧间隔及可用内存指标 | 两次独立连续至少 30 分钟实测，保存原始记录与重算；桌面、移动 viewport、物理移动设备分开；缺失能力 not-run |
| 6 | B6：对齐与候选包 | 可信 root 只读输入、构建身份、manifest、来源/版权闭包、恢复与回滚信息 | 最终候选包绑定最终构建；形成明确门禁清单；缺少可信 root 输入时保持对齐 pending，不操作父 Git |

B 编号描述当前 R66 延续中的剩余批次，不重做 R47–R59，也不把历史 R61–R66 的代码存在等同于技术验收全部通过。

每个实际开发轮继续按已有 goal 要求至少 1000 行有效生产、数据接入或工具代码，测试另计。排除格式化、注释、截图、收据、纯文档、机械复制。每轮有实质测试、Node、Vitest、定向 ESLint、生产构建、HTTP、桌面浏览器、可用移动 viewport 与两类收据。小缺陷修复归原批次，不单独增加轮号；B5/B6 没有实质开发缺口时作为验收批次，不凑代码行数。

## 范围不能遗漏

Beta60 = 24 恒星 + 12 星座 + 24 星云。

当前运行时参考 ready 清单实际为 20 星，即 canonical12 加八颗已有星；目录中存在 24 条不代表 24 星均已接入验收。

- 四颗待核：Acrux、Spica、Regulus、Polaris。有真实 raw 和候选解析材料，组件身份仍需闭合，不能宣称科学准入。
- 八颗已有但需补验：alpha-centauri-b、hadar、altair、pollux、fomalhaut、deneb、bellatrix、alnilam。
- 新增十二张星云已有原图、官方页和哈希材料；签署 0/12，sceneAssetAdmissions=0。素材已收集与场景接入完成是不同状态。
- V635/V638 当前 canonical36 观察路径不能直接宣称覆盖 Beta24/Beta60。B3 需版本化扩展并保留 canonical 回归。

## 最新证据：068e

最新成功构建为 `.next-mainline-a-r66-20260927-068e`：

- buildId：`2qCr6JELHQvvPyn3Xa7HZ`。
- runtimeBuildId：`mainline-a-f76f0b86bf596198`。
- source SHA-256：`f76f0b86bf59619827886da267798ef9453c49e4885e41eeff595c8c23d3907a`。
- 构建收据：`docs/release/v607/mainline-a-r66-build-20260927-068e.json`，status passed，sourceStable=true（构建时）。后续 caption 源码修改不在该构建中。

| 证据层 | 已核验或已保存的结果 | 限制 |
| --- | --- | --- |
| static | 068e 的 558/558 Vitest、76/76 Node、59 文件 ESLint 0 error/0 warning，生产构建通过 | 对应日志已重新读取；不覆盖随后 caption 修改，不宣称全仓测试通过 |
| HTTP | 068e 入口/健康/资源收据 passed；12/12 JPEG 字节、SHA、尺寸通过，合计 3,324,626 图像字节；本次入口重新返回 200 | HTTP 成功不证明浏览器 draw 或视觉可接受 |
| browser | 29 个单项 raw 在盘，均同一 runtimeBuildId、finished、durationSatisfied=true、session issues=[]；12 星+12 星云+5 星座 | 这是文件字段检查，未新增完整离线批次验证；原页面丢失，没有原页面完整 29 项 UI bundle；最终新构建需完整 36 项 |
| visual | 068e 真实鼠标 dock 恢复已通过；保存了桌面与移动 dock 证据；星云 caption/footer 遮挡有实测几何 | Helix 两个来源链接 bottom 676.53，footer top 662，仍有遮挡；B2 视觉未通过；既有静帧观察不等于人工验收 |
| performance | 29 项为本地短时资源/RAF 观察 | RAF 不是 GPU draw 耗时；两次独立连续 30 分钟尚未闭合；不等于生产或真实用户性能 |
| external-source | 四星仍待组件确认；新增十二图来源材料已有，签署 0/12；Exa 官方来源查询本次成功 | 搜索命中、raw、测试和 manifest 均不能替代科学、版权或用户签署 |

068e 原始记录位置：`tmp/mainline-a-b2-browser-<kind>-<id>-01-068e.json`。仅五个星座有记录：Ori、UMa、Cas、Sco、Cyg；剩余 Gem、Leo、Cru、Lyr、Aql、Tau、Sgr 未记录。保留现有 29 项为预检证据。下一批优先在修复后构建执行完整 36 项，不把旧记录拼接为新构建通过。

关键收据及校验值：

- HTTP：`docs/release/v607/mainline-a-b2-http-20260927-068e.json`，SHA-256 `f9c0c2b3c7fadcbce059aa3a54584e18b7156baa8de7454ef7882922758c9825`。
- 星云 HTTP：`docs/release/v607/mainline-a-b2-nebula-http-20260927-068e.json`，SHA-256 `f56ea3e927d284c9e9b5e8586186b3ab514c54ada6a9c186344de68268515db6`。
- 视觉缺陷：`tmp/mainline-a-b2-caption-clip-068e.json`，Helix 截图 `tmp/mainline-a-b2-nebula-ngc7293-01-desktop-068e.jpg`。
- Carina 初始截图捕捉到相机过渡；`tmp/mainline-a-b2-carina-steady-068e.json` 和对应 JPG 是后来稳定画面。保留两者，不能把初始左侧裁切当作已证明的永久相机缺陷。

移动 390×844 的 dock 鼠标操作通过，但档案覆盖场景的问题仍在，完整移动场景验收未完成；physical-mobile 为 not-run。该产品缺口纳入 B5，B2 不宣称全设备完成。

## 当前 caption 修复检查点

`/root/caption_finish` 已收束并明确 stopped-writing，三个文件为：

- `app/lib/mainlineANebulaCaptionLayoutV638.ts`
- `app/components/MainlineANebulaScenePortraitV607.tsx`
- `app/lib/mainlineANebulaCaptionLayoutV638.test.ts`

范围为实测 header/footer 安全区、图像与自然说明高度、短窗口滚动、同深度纵向坐标换算、observer/ref 清理。另修复 Html suppression 时无 figure 导致图像隐藏的回归。未改相机横向定位或物理内核。

2026-09-28 09:42 后代理报告不再写源码：5 文件 Vitest 138/138（主代理已读日志），3 文件 ESLint exit 0、strict scoped TypeScript exit 0（代理命令结果；对应日志无错误）。日志为 `tmp/mainline-a-b2-caption-068f-vitest.log`、`-eslint.log`、`-tsc.log`；strict config 为 `tmp/mainline-a-b2-caption-068f-tsconfig.json`。独立只读二审未发现新增阻塞。138 项包含已有测试，不能与 068e 的 558 直接相加。这些是静态检查，实际短窗滚动、完整来源链接可点击仍待新构建验证。

主代理下一步复核交回差异，完成对应整合检查后再建新的保留构建。拟用 068f 标签，日期使用实际执行日，先检查目录/收据不存在。源文件变化必须重新绑定构建及证据。

## B2 收口顺序

1. 收束 caption 修复及实质测试，复核差异和运行整合检查。
2. 检查磁盘及新 run-id，保留式生产构建、HTTP 与 DOM 构建身份核验。
3. 先验证 Helix 完整署名和来源链接、短窗口滚动/重试、稳定后的 Carina、真实鼠标恢复。先关闭已知缺陷再开始完整矩阵。
4. 新构建完整 canonical36；每项保存原始 JSON 与截图，每完成 6 项保存一次真实 UI 批次导出并核对长度/哈希。最后保存完整 bundle，执行 intake/replay。不能从单项文件伪造 UI bundle。
5. 分别封存 static、HTTP、visual、browser、performance、external-source 结论，最后才封存 B2 round/code-change。
6. 按 B3、B4a、B4b、B5、B6 推进；正式科学/版权批准仍单独记 pending。

原计数基线：`tmp/mainline-a-b2-baseline-20260927-068/inventory.json`，本次 SHA-256 仍为 `039b247ae888d453374a8628afd5bd20532fcead68111890cfa59b5904e072bb`。不得重建。计数器 `tmp/count-mainline-a-b2-068.cjs` 无参只读；仅闭合时 `--seal`。2297 有效生产行是 caption 前的历史暂计值，不是最终统计。

## 工期和外部依赖

以六个交付批次排程。若需预算，可先按 **4–8 个集中开发日**预留：B2 约 0.5–1 日，B3 约 1–2 日，B4a/B4b 合计约 1–2 日，B5 约 1–2 日，B6 约 0.5–1 日。这是材料现成、返修有限、执行环境稳定的规划假设，不是已测吞吐或交付保证；B2 收口后用实际耗时校准。

最终技术候选与正式发布分开：四星组件身份、逐项版权签署、可信 root 输入和云端权限没有可靠固定完成日期。最近允许范围内的 root 审计缺可信 manifest；本次未检查父目录或父 Git。即使这些门禁未齐，也可以完成有明确 pending 清单的技术候选包。

本次连接核验：

- Exa 查询 3 个官方结果，随后读取 [NASA Images and Media Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)。用于来源发现能力核验；NASA 的通用说明保留第三方版权例外，不能一键批准十二图。
- Vercel `list_projects` 对 `wyufan43-3383s-projects` 仍为 403，提示需重新认证到该 scope 或提供有权令牌。没有部署；此问题不阻塞本地 B2–B5。
- E 盘本次剩余 9,603,407,872 字节，构建前仍需重查；本次未删除或压缩任何文件，不把容量变化原因归因于未经检查的操作。

## 会话建议与恢复入口

不必现在新开；B2 收据封存后切换最清楚。当前上下文没有可读的剩余百分比，不能宣称已满。上下文压缩不会撤销目标，但运行时页面、变量与进程句柄需要逐项核验。

本次已核验：独立生产服务 PID 40704 在 127.0.0.1:3071 监听，入口 HTTP 200。旧浏览器标签 1 仍是历史网络错误的 data 页面；直接操作该页触发 URL policy，保留原状态。新标签 2 成功加载正常 Orbit Atlas 界面。没有继续旧矩阵、没有进行中的观察。不能恢复原页面的 29 项内存队列或伪造其完整导出。

继续当前会话时复用浏览器连接；新可用标签的当前绑定为 `planningTab079`。这些绑定只作恢复提示，新会话不得假定自动存在。先检查进程/端口，不重复启动服务。

若换会话，使用同一个含未提交成果的目录，先读 boundary、079、B1 收据和 068e 证据。不要只从 HEAD 新建干净 worktree。检查现有 goal/代理/进程后决定如何接续，避免两个主会话同时写同一批文件；新会话不会自动继承旧 goal 和动态状态。本次未创建新会话。

可用的接续提示：

> 继续 Solar Sim Mainline A，目录 E:/86137/myai/solar_sim/next-web。先读 mainline-a-worktree-boundary-20260914.json 与 mainline-a-plan-and-handoff-20260928-079.md。B1 已交付；B2/V638 未完成。068e 构建通过，有29项原始短测记录；caption/footer遮挡仍需修复后新构建完整36项，旧页面完整bundle缺失，不得伪造或拼接新构建证据。确认 caption_finish 的落盘和检查状态，复核后继续。保留 dirty 目录、068 原计数基线、历史构建及成功/失败证据。后续 B3含四星与既有八星、B4两组六图、B5 Beta60与两次连续30分钟、B6可信root只读对齐及候选包。签署保持pending，scientificPayloadWriteback=false，不改物理内核、不操作父Git。先检查现有goal，不重复创建，不标记完成。

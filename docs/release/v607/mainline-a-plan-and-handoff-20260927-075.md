# Solar Sim Mainline A：整体排程与当前交接

核验日期：2026-09-27（Asia/Shanghai）。本文件响应用户“先整体规划、剩余轮次、是否需要新会话”的请求，是规划更新，不是新增开发轮、验收通过或代码量收据。保留 070–074 和所有历史产物。本文件替代 072 中已过时的当前状态与继续入口，不改写历史收据。

## 当前判断

项目处于可运行候选版的美术整合与验收阶段。B1/V637 已完成有边界的技术交付；B2/V638 仍未完成完整验收。已有顶级 goal 保持 active，不重复创建、不标记 complete/blocked。

本次核对 Git root 为 E:/86137/myai/solar_sim/next-web，分支 codex/solar-sim-mainline-a，HEAD 为 156ec7790a99be2f89f5d8f44831cb118c9437e1。工作树包含大量既有未提交进度，全部保留。没有操作父 Git、reset、clean、checkout、删除、stage、commit 或部署。

当前成功构建是 068c：buildId 2ilObVfOFkSeWEfzc7oSL，runtimeBuildId mainline-a-21d29a851e728824，源码摘要 21d29a851e7288241483e003932339702946506ec4b22527318706e239721af8。预览为 http://127.0.0.1:3069/ 。新 dock、stellar composition、frame-clock 源码修复尚未进入该构建，不能拿 068c 结果证明当前源码通过。

当前 B2 原基线计数：有效生产/数据/工具代码 2223 行，测试另列；总增加 5543 行、删除 245 行、修改配对 185 行。这是只读中间统计，尚未封存 code-change receipt；修改配对不能再次加总。达到代码门槛不等于完成浏览器验收。

## 六个完整交付批次

按六个批次排程，包含当前 B2；实际开发约 4–6 轮。B5/B6 若只需运行已有工具，可并入关联开发轮的验收，不能为行数新造功能，也不能把纯测试或封包算新开发轮。排程预留六轮，不承诺轮数可以消除外部待签和权限依赖。

| 顺序 | 功能批次 | 交付与结束条件 |
| --- | --- | --- |
| 1 / B2 | A 线 12/12/12 冻结 | 关闭遮挡、恒星盘面绘制和采样校验问题；新保留生产构建；36 项真实 UI 往返、加载失败恢复、资源观察、原始导出、离线重算；桌面及可用移动 viewport 分列 |
| 2 / B3 | Beta 全部恒星 | Acrux、Spica、Regulus、Polaris 的真实来源、分量身份、单位/缺失值/不确定性与候选呈现；补验八颗既有非 canonical 恒星，使恒星范围达到 24；未确认身份保持 hold/not-admitted |
| 3 / B4a | 新增星云第一组六图 | 使用已有真实原图及官方页；逐图校验 SHA-256、尺寸、派生展示、来源/署名、裁切、加载失败与释放；候选展示范围由 12 到 18；未签署保持 pending |
| 4 / B4b | 新增星云第二组六图 | 同样逐项闭合，候选展示范围由 18 到 24；维护 raw 与派生资产对应，不填合成资产，不自动准入 |
| 5 / B5 | 多设备性能与生命周期 | 最终 Beta60 覆盖和 canonical36 回归；重复切换/取消/重试、可取得的帧间隔/内存/纹理指标；至少两次独立连续 30 分钟观察；桌面与移动 viewport 分列，无真机标记 physical-mobile not-run |
| 6 / B6 | 只读对齐与候选发布包 | 可信 root 输入与 next-web 的代码、构建身份、manifest、来源、版权比较；绑定最终构建与候选包、回滚信息和未关闭门禁；缺可信输入不能宣称两线一致 |

固定 Beta 范围为 60 项 = 24 颗恒星 + 12 个星座 + 24 张星云图。canonical36 + 新四星 + 新十二图 = 52，必须补入八颗既有非 canonical 恒星。B 编号是 R66 延续中的功能包，不代表重做 R47–R59，也不代表历史 R61–R66 全部验收通过。

美术画面和交互主体集中于前四批；完整技术候选还需要 B5/B6。日历时间暂缺可靠整轮吞吐依据：仅一次 canonical36 每项 30 秒观察已需至少 18 分钟，另有真实操作、截图检查、构建和返修；两次 30 分钟长测至少一小时，不能拼接短记录。B2 结束后再按实测校准排期，旧“若干工作日”估计不作为交付承诺。

每个实际开发轮遵守现有 goal：至少 1000 行有效生产/数据接入/工具代码，测试另计；不计格式、注释、收据、截图、机械复制数据和纯文档。不足则合并同阶段功能。每轮 Node、Vitest、定向 ESLint、生产构建、HTTP、桌面浏览器、可用移动 viewport、round/code-change receipts 必须归到对应源码与构建。

## B2 当前必须先处理的问题

1. 已完成源码的 dock 避让修复：避开档案、对象浏览器、展开工作台、工具菜单和星云说明卡；紧凑入口及无空间时的正常排版回退保留观察挂载。负责代理已停止写入，报告 74 tests、5 文件 ESLint、定向 strict TypeScript 通过。尚需新构建实际视觉与交互验证。
2. 已完成源码的恒星绘制修复：解决透明背景点绘制到选中恒星盘面上的问题，同时保留 halo/corona。负责代理已停止写入，报告 40 tests、3 文件 ESLint、定向 TypeScript 通过。CPU 绘制队列检查不是 GPU/浏览器验收。
3. RAF clock 独立复核发现两项仍待修复：删除可选 frameClock 字段可以绕过新计数校验；整体向未来平移采样时间仍可保持摘要一致。需要新记录明确要求时钟诊断、旧记录区别处理，并把绝对采样端点约束在实际观察窗口内，增加对应负例。
4. 以上全部关闭后才生成 068d（本次核验尚不存在）。当前源码不可直接沿用 068c 的通过证据。先在新构建复验 M42、Vega/Capella/Aldebaran、Orion 和 dock，再执行完整 canonical36。

旧 M42 原始失败记录缺少异常时间戳，不能反推其历史原因已被证明是首帧早于会话开始。保留 frame-timestamp-invalid 的失败结论。

## 分层证据

| 类别 | 当前实际状态 | 限制 |
| --- | --- | --- |
| static | V619 --check verified，4/4 pending；068c 综合测试/构建已存收据；新增修复各有定向测试；B2 中间有效代码 2223 行 | 当前源码尚未完成新整体验证；测试数量不相加冒充独立总数 |
| HTTP | 068c 入口、构建资源及 12 张 canonical 星云的 200、SHA、解码尺寸已有收据 | 不覆盖新源码、新构建或真实用户性能 |
| browser | 本次复用了已连接的 in-app Browser；旧构建面板显示 13 条原始记录，12/36 对象往返通过、1 条失败，30 分钟记录 0 | 不是 36/36；新修复需要新构建重跑 |
| visual | 068c 桌面 Orion 已完整取景；恒星截图审查发现 dock 遮住正文和部分盘面亮点，已安排上述修复 | 移动端曾只看到档案页，不能宣称完整移动场景已视觉通过；截图审查不是用户签署 |
| performance | 已有短时本地诊断；长时测试尚未完成 | RAF 间隔不是 GPU renderer 帧耗时，不是生产/真机/真实用户性能 |
| external-source | 四星已有真实捕获与补充材料，身份复核 pending；053 收据记录新增 12 图 raw/官方页已校验，签署 0/12 | raw 获取、一般来源政策、fixture 或回放不构成科学/版权批准 |

Exa 本次读取 MDN requestAnimationFrame 文档，确认 RAF 回调时间戳表示前一帧渲染结束，与 performance.now 不相同，后台标签通常暂停；只支持采样设计的语义判断，不证明历史失败原因：https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame

Vercel 本次只读 list_projects 再次返回 403 Forbidden，scope 为 wyufan43-3383s-projects；云端发布依赖该 scope 的访问权限。没有部署。此项不阻止本地 B2–B5。可信 root 输入按最近允许范围内的审计仍未闭合，本次未进入父仓库核验。

磁盘本次读取 E 盘剩余 1,092,083,712 字节，约 1.02 GiB。历史缓存已做保留字节的 NTFS 压缩并有 073 收据；新构建前需再次检查。不得为腾空间删除旧构建、失败输出或覆盖工作树。

## 会话建议

现在不需要强制新开会话：当前 goal 和浏览器会话可用，代码修改已保存，现有代理已交回修复。没有可验证的上下文剩余百分比，不宣称上下文已满。建议 B2 的新构建、canonical36、原始导出/回放和收据完成后再新开，便于明确交接边界。本次没有创建新会话。

若现在切换，也必须从同一个 dirty 目录继续，并先读本文件；不能仅由 HEAD 新建干净 worktree。浏览器变量、进程句柄、goal 和代理状态不能假定自动迁移，应先查现有状态再复用。保留原 068 基线，不重新制作基线，不重复实现已完成修复。

继续入口：

- docs/release/v607/mainline-a-worktree-boundary-20260914.json
- 本文件 mainline-a-plan-and-handoff-20260927-075.md
- docs/release/v607/mainline-a-art-round-66-v637-20260927-066.json
- docs/release/v607/mainline-a-b2-preflight-browser-20260927-068c.json
- docs/release/v607/mainline-a-b2-stars-visual-review-20260927-068c.json
- docs/release/v607/mainline-a-r66-build-20260927-068c.json
- docs/release/v607/mainline-a-build-storage-preservation-20260927-073.json
- tmp/mainline-a-b2-baseline-20260927-068/inventory.json（不可重建；SHA-256 039b247ae888d453374a8628afd5bd20532fcead68111890cfa59b5904e072bb）
- tmp/mainline-a-b2-preflight-batch-recovered-068c.json（13 条记录，含保留失败）
- docs/release/v607/mainline-a-b2-preflight-intake-20260927-068c/intake.json（12 通过、13 保留，incomplete-local）

继续提示：

> 继续 Solar Sim Mainline A，目录 E:/86137/myai/solar_sim/next-web。先读 worktree boundary 与 mainline-a-plan-and-handoff-20260927-075.md。B1/V637 已收口；B2/V638 dock 与 stellar paint 修复已保存、代理已停笔，RAF verifier 尚有两项独立审查问题待关闭。成功构建 068c 不能证明当前新源码。保留所有 dirty 进度、原 068 基线、旧成功/失败产物；先修复并测试时钟字段绕过与绝对窗口边界，再完成新保留构建 068d 和 canonical36 全验、桌面/可用移动 viewport、raw 导出回放及 B2 收据。已有 goal active，先核验后复用，不新建重复 goal。后续 B3 四星加既有八星、B4 两组六图、B5 Beta60 多设备/长测、B6 可信输入只读对齐与候选包。版权签署按用户决定保持 pending，继续技术验收。candidate-only/hold/not-admitted，scientificPayloadWriteback=false；不修改 EIH/Newton/2PN/Lense–Thirring/Kerr，不操作父 Git。

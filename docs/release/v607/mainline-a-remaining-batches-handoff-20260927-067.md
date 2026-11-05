# Solar Sim Mainline A：B1 完成后的剩余计划与会话交接

日期：2026-09-27。067 是规划交接编号，不是新开发轮。本文件更新 065 的当前状态；旧文件、构建、收据和工作树全部保留。

## 当前判断

当前是可运行、已有局部浏览器验收的候选版。B1/V637 已完成；B2 已做首读和启动核验，尚无 B2 代码变更。剩余 B2–B6 五个工作包，按约 4–6 个实质开发轮安排。五个工作包不等于必须五轮：工作不足一轮时合并相关包，纯矩阵执行、资产登记、截图、收据或运行已有打包脚本均不计开发轮。

这是基于当前已知缺口的规划估算，不是完成承诺。跨路由资源泄漏、新增图像格式不兼容或 root 权威输入揭示较大差异时再调整。不要预造第七轮或重写已有管线来满足行数。

可见画面和交互的主要收尾集中在 B2、B3、B4；稳定性和候选交付集中在 B5、B6。技术收尾可以在签署 pending 时继续。正式发布仍受四星成分确认、十二图逐项版权审核、root 权威 manifest 和设备证据影响；这些等待时间不能折算成开发轮，也不能给出未经依据的完成日期。

## 已核验的 B1

- 轮次标记 R66-continuation，版本 V637，工作包 B1。
- 有效生产／数据工具代码 1245 行、13 个文件；测试和样式不计入有效代码目标。
- 066 收据记录 Node 8 通过、Vitest 221 通过、18 个文件 ESLint 零错误零警告、生产构建成功。本次规划没有重跑这些测试或构建。
- 066 收据区分 HTTP、visual、browser 和 performance：八个入口文件哈希匹配，七张截图已在 B1 检视，桌面与移动 viewport 有有限交互记录。
- 两次四秒 rAF 回调间隔记录仅是局部观测，不能代替渲染器帧时间、真实用户性能、移动真机或三十分钟运行。
- 本次重新计算主收据引用的 23 份工件的字节数／SHA-256，23/23 匹配。
- B1 修复了顶栏遮挡、面板互斥和焦点返回、缺失值伪零、候选类型／目录匹配与既有星云预览失败重试。性能观察器保持独立，切换前景面板不清空观察。

当前展示目录按 20 颗星／12 个星座／12 张星云统计；A 线 canonical 清单为其中 12／12／12，共 36 项。Beta 目标为 24 星／12 星座／24 张星云观测图。星云来源面板 30 条记录不等于目标完成数量。

四颗待补星为 Acrux、Spica、Regulus、Polaris，已有真实 raw capture 与解析／补充来源，成分身份确认仍 pending。十二张新增星云已有原图和官方页，当前签署 0/12，完整接入与发布准入未完成。

## 剩余工作包和退出条件

| 次序 | 工作包 | 主要实现与检查 | 退出条件 |
|---|---|---|---|
| 1 | B2：A 线 36 对象冻结 | 复用 canonical producer、registry、resource session 和 replay；逐项查进入、实际 ready、切换、关联路由、返回、取消、失败恢复、释放；只针对发现的真实缺陷补实现 | 当前生产构建绑定 36 项完整矩阵，12 星／12 星座／12 星云均可复核；ready 来自渲染器，不能由按钮点击推定；未签署保持 pending |
| 2 | B3：四星候选呈现与身份 | 复用 collector/parser；消费最新来源 sidecar，区分恒星系统／分量、单位、缺失和不确定值；明确历史 V619 与最新 attempt ledger；完成错配／伪造／fixture 晋级负例 | 四星候选视图与来源逐项可追溯；错误身份不能晋级；无可信成分确认继续 hold／not-admitted；V616–V621 保持原字节 |
| 3 | B4：十二张新增星云呈现 | 复用已下载原图、衍生资产与纹理加载器；完善候选预览、裁切、尺寸、署名、加载取消／重试／清理及准入边界 | 按两组六张验证全部十二图，逐图核验字节、SHA、尺寸和来源；技术预览不等于版权签署或正式 runtime admission |
| 4 | B5：多设备性能与生命周期 | 主要运行时修改完成后固定候选构建；接入可信设备记录，实测并修复重复切换、释放和长时问题 | 同一候选版本上两次独立至少三十分钟记录；注明设备／viewport／分辨率／条件与可观测限制；真机无证据仍 not-run |
| 5 | B6：可信审核、对齐与交付 | 消费经过验证的成分、版权和设备输入；只读 root 权威 manifest；复核既有打包、还原、回滚能力 | 源码／构建／资产／来源／候选包一致；缺输入仍 pending，伪造输入失败关闭；最终包绑定最后通过验证的构建 |

B6 的可信输入设计前移到 B3/B5 实施，最终封包在运行时修改和长时验证完成后执行。当前 release evaluator 仍固定部分 pending／not-run，V633 对 physical-mobile attestation 直接拒绝；应增加真实可信输入消费路径，不能把常量直接改成 passed。

建议以五轮作中位预算：B2 缺陷修复与矩阵；B3 四星与可信来源消费；B4 十二图整合；B5 设备与生命周期；B6 必要对齐修复与交付。若 B2 或 B6 只有验收，合并相关轮可降至四轮；独立运行时／泄漏缺陷需要完整修复批次时可增至六轮。两组六张只是 B4 验收分组，不自动拆成两轮。

## 下一步的具体执行入口

1. 在本目录核对内部 Git 根、分支和状态；创建新的 B2 基线快照及唯一工件后缀，不能覆盖 066 基线或收据。
2. 已首读 `app/lib/mainlineACanonicalProducerV635.ts`、`app/lib/mainlineACanonicalRuntimeV635.ts`；接着读 V622 coverage、V633 资源观察面板和 session、V635 replay/index 脚本以及真实场景导航消费者。
3. 用现有 3066 生产预览先走星／星座／星云各一个代表流程，确定具体入口、渲染器 ready 与返回缺口。全量矩阵在完成修复后的新生产构建执行。
4. 复用实际 renderer hooks 和 lease/revision 校验；不能用静态 manifest 或 DOM 按钮存在代替成功加载，注册表计数归零不能证明 GPU 已释放。
5. 读相关 `node_modules/next/dist/docs/` 后实施代码；每轮同时交付生产行为、工具和实质性负例测试。

## 工作树、目标和运行身份

- 唯一操作仓库：`E:/86137/myai/solar_sim/next-web`。
- 本次 `git rev-parse --show-toplevel` 与该目录一致；分支 `codex/solar-sim-mainline-a`，HEAD `156ec7790a99be2f89f5d8f44831cb118c9437e1`。
- 规划开始时 `git status --short` 为 1642 项；保留全部既有未提交工作。本交接新增后数量会变化，不能把历史 clean 字段当当前状态。
- 禁止父级 Git、reset、clean、checkout、删除文件、覆盖历史工作树或已有工件；没有授权提交／部署。
- 不修改 EIH、Newton N-body、2PN/Lense–Thirring、Kerr；保持 candidate-only／hold／not-admitted、`scientificPayloadWriteback=false`。
- `get_goal` 本次实际返回 active；原顶级目标仍未完成。065 中 blocked 是历史状态，不能作为当前阻塞证据。
- 生产预览 `http://127.0.0.1:3066/`，本次监听 PID 44080，loopback 地址 127.0.0.1。
- 构建路径 `.next-mainline-a-r66-20260927-066b/.next/standalone`；buildId `GYRGfmHS7ipvhzqC7nOUU`；runtimeBuildId `mainline-a-1a7efa4d339d80a7`。
- sourceSha256 `1a7efa4d339d80a7727f079b306fa46432fbf365eb6e1d43d33327814a9c5ac3`，2365 个来源输入；public 资产单独验哈希。
- 本次浏览器 DOM 在 1280×720 显示该 mainline buildId；旧 V595 属性仍为 `unbound-production`，在 B6 的身份一致性检查中核实其适用范围，不能把 legacy 属性当作 mainline 指纹。
- `/api/health` 本次 HTTP 200；checkedAt `2026-09-27T11:36:02.991Z`。健康接口没有 deploymentId／commitSha，不能凭 health 200 推断远端部署或 root parity。
- 本次 E 盘可用 4,537,421,824 字节，约 4.23 GiB。新保留构建前检查空间预算，避免无必要的整包复制；不得删除历史工件来腾空间。
- 旧 3057 预览和历史输出继续保留。PID、端口存活、容量都是瞬时事实，下一会话重新核对。

## 每轮门槛

以当前 goal 为准，每个实际开发轮目标至少 1000 行有效生产／数据接入／工具代码，测试除外；不足时合并相关功能，不灌水。空白、注释、格式化、生成数据、锁文件、收据、截图、纯文档、机械复制与孤立标记不计。

每轮运行 Node、Vitest、定向 ESLint、生产构建、HTTP 和桌面浏览器；可用时执行移动 viewport，真机不可用标明 not-run。生成 round/code-change receipt，记录实际基线、新增／修改／删除与有效文件。static、HTTP、visual、browser、performance、external-source 分开，不把测试、截图、合成 fixture 或政策页面冒充科学有效性、真实用户验证或版权审核。

## 当前插件状态

- Browser：本次复用既有标签成功，页面为 3066 的 Orbit Atlas，可读 DOM，mainline 构建身份匹配。此处只做存活和身份复核，没有新 36 项、截图或长时验收。
- Exa：本次检索成功，返回三条 NASA／JPL 官方政策结果。065 中的 402 已不是本次状态。政策可供逐项来源审核参考，不是图像原始 bytes、raw collector 结果或任何签署；本次未更新科学／版权 ledger。
- Vercel：`list_deployments` 本次仍 403 Forbidden，提示需要重新授权 `wyufan43-3383s-projects` scope 或使用有权访问该 scope 的凭据。本地开发继续；未取得远端构建证据，未部署，不读取／输出凭据。

Exa 本次返回的官方参考：

- https://www.nasa.gov/nasa-brand-center/images-and-media/
- https://www.jpl.nasa.gov/jpl-image-use-policy/
- https://gpm.nasa.gov/image-use-policy

## 交接首读与 SHA-256

以下均相对唯一工作目录。先读 boundary，再读本文件与 066；065 仅作较早规划背景，不使用它的 B1 启动提示。

| 文件 | 用途 | 本次核验／已有收据 SHA-256 |
|---|---|---|
| docs/release/v607/mainline-a-worktree-boundary-20260914.json | Git 和目录边界 | 131a023bf0747759f406fee9a1060b948a95f7f6c7286ba7c0ebf1f5ae6509a8（065 记录） |
| docs/release/v607/mainline-a-art-round-66-v637-20260927-066.json | 最新完整开发批次 | ea49f37371026d0addbb451e2ca1ad25c56077bb999412bfb6411b2bf4b91ace（本次重算） |
| docs/release/v607/mainline-a-r66-v637-code-change-20260927-066.json | B1 有效行统计与文件 | 5c3ba88df6c8b055c7988896e6ad192b0f3d9705956183707add93378376379c（本次重算） |
| docs/release/v607/mainline-a-r66-build-20260927-066b.json | 成功生产构建与身份 | 373d89b588a5e877b6190e1d0e43670d440e2da770240a7c35c652903e375458（本次引用校验） |
| docs/release/v607/mainline-a-b1-browser-20260927-066.json | B1 浏览器范围与局限 | 2471bc7df4002fe622907e19b304dc8cf934de56b6820d92e5593910eb45756d（本次引用校验） |
| docs/release/v607/mainline-a-b1-performance-20260927-066.json | 四秒局部观测，非长期验收 | f49ad018708fed2fb99f2dd28d5752867817ad7f5a03534baba16475af7d3333（本次引用校验） |

来源后续首读：`mainline-a-stellar-primary-review-20260927-060.json`、`mainline-a-nebula-source-artifact-closure-20260927-053.json`、`mainline-a-nebula-technical-assets-20260927-053.json`、`mainline-a-root-source-20260927-055.json` 和 `mainline-a-root-manifest-probe-20260927-055-corrected.json`，均位于 `docs/release/v607/`。

本次 V619 `--check` verified、4/4 pending，检查的是封存契约；不能用它否定后来实际完成的 raw capture。V616/V619/V620/V621 在 066 引用重算中均与收据匹配。

## 会话建议

当前可继续工作，没有证据表明必须因上下文已满而重开，也无法准确读取剩余上下文比例。鉴于会话跨度长、已存在多个过时状态，建议在开始 B2 的新代码批次前新开同项目的普通本地会话，以本交接和收据恢复上下文。

新会话仍使用同一 dirty 目录，不能只从 HEAD 新建干净 worktree 来替代现有工作。新会话不保证自动继承旧目标状态、浏览器连接或进程管理关系，先核验再复用。这里没有创建新会话、暂停目标或迁移目标。

可在新会话粘贴：

> 继续 Solar Sim Mainline A，工作目录 E:/86137/myai/solar_sim/next-web。先读 docs/release/v607/mainline-a-worktree-boundary-20260914.json、mainline-a-remaining-batches-handoff-20260927-067.md 和 mainline-a-art-round-66-v637-20260927-066.json。B1/V637 已完成，从 B2 的 36 对象全流程与必要修复开始；B2 尚无代码变更。先核对内部 Git、当前 3066 生产预览和构建身份，再创建新的 B2 基线。按剩余 B2–B6 五包推进，每个实际开发轮至少 1000 行有效生产／数据工具代码，测试除外，不足合并相关批次；复用现有采集、回放、资源观察、打包、还原工具。保持四星／版权 pending、candidate-only／hold／not-admitted 与 scientificPayloadWriteback=false；不动父 Git、物理内核、封存 V616–V621，不 reset/clean/checkout/删除或覆盖历史工作。每轮完整测试、构建、HTTP、桌面／可用移动 viewport 和分层证据。不要从 B1 或 R47–R59 重新开发，也不要把旧 goal 的状态假定为已迁移。

本次只新增这份规划交接，未修改生产代码，未计新开发轮，未新增 round/code-change receipt。

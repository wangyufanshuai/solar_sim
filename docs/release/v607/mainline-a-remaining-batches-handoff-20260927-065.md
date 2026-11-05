# Solar Sim Mainline A 剩余批次与会话交接

日期：2026-09-27。065 是本次规划文件编号，不是新增开发轮。本文件基于 064 浏览器恢复后的状态，替代旧交接中仍把应用浏览器访问列为当前阻塞的描述；历史收据保留。

## 当前结论

按 6 个完整工作包安排，预计 5–7 轮实质开发。这个范围包含常规复测后的修复；重大新回归需要重新估算。工作包不是自动计数的开发轮：纯审阅、录入资产、跑测试、截图、收据或执行已有打包命令，不单独递增开发轮。功能不足时合并相邻、相关工作，不为达到行数灌水。

最近实质工程批次是 058：1098 行有效生产／工具代码，测试不计；Node 141、Vitest 173、定向 ESLint 无错误（1 条已有警告），生产构建通过。这些是 058 记录的结果，本规划未重跑测试或构建。

当前展示目录为 20 星／12 星座／12 星云；A 线冻结清单是其中 12／12／12，共 36 项。Beta 目标是 24 星／12 星座／24 张星云观测图。4 星仍为候选；补足目标的 12 张星云真实原图及官方页已取得，但不能视为已完成场景和版权准入。

064 已在固定生产构建完成桌面 1280×720 和移动 viewport 390×844 的有限浏览器检查：太阳系加载、20 条恒星图集、Altair→Achernar 切换、30 条星云来源审阅记录的面板与返回场景。30 是该面板的记录数，不是 Beta 24 张图的完成数。没有完成 36 项全流程、性能、生命周期、真机或长时验收。

064 复现了桌面和移动 viewport 顶部操作栏覆盖尺度导航；也观察到候选星云角尺寸显示 0′。本次只读源码确认 app/lib/mainlineANebulaAtlasV609.ts 的候选距离、银经纬和尺寸均使用缺失时填 0 的逻辑，需要在展示模型、排序、格式化和消费者一起修复。

062 的 6/17 是历史门禁计数。064 明确没有重算门禁。新浏览器观察既不能被忽略，也不能直接推成全量通过。

## 剩余工作包

| 工作包 | 范围 | 退出条件 |
|---|---|---|
| B1：布局、面板与数据展示一致性 | 统一导航与审阅入口的布局；处理移动断点、面板互斥、焦点恢复、关闭和返回；修复缺失数值在展示、排序、筛选中的语义 | 桌面与移动 viewport 不遮挡；键盘和点击均可完成操作；未知值不再显示成测量零值；不修改科学原始载荷 |
| B2：A 线 36 对象冻结 | 逐项检查进入、加载、切换、关联路由、返回、取消、失败恢复和释放；修复检查中发现的实现缺陷 | 当前生产构建绑定的 36 项矩阵完整；截图与路由记录可复核；未签署对象仍 pending。纯矩阵执行不计代码，不足独立轮时并入 B1 |
| B3：Beta 4 星呈现与成分映射 | 复用已有 collector、parser、replay 和 review panel；将最新真实来源审核与系统／分量身份、单位、缺失和不确定值正确关联；补展示接入和负例 | Acrux、Spica、Regulus、Polaris 的候选视图与来源可追溯，错误身份和伪造输入不能晋级。没有外部确认时保持 candidate-only／hold／not-admitted；不重写 V616–V621 封存输入 |
| B4：新增 12 星云接入与视觉 | 复用原图、官方页、衍生资产和纹理加载器；完善共用预览、尺寸／裁切、信用呈现、取消、加载失败与清理；按 6 张一组检查两组 | 12 张有逐项字节、哈希、尺寸、来源及状态证据；技术预览与发布准入分开。两组六张不自动构成两轮，机械登记不计有效代码；仅少量配置时与 B3 合并 |
| B5：多设备性能与生命周期 | 用同一候选生产构建实测帧时间、资源计数、内存可观测范围、反复切换与释放；依据结果修复；补可信真机证据的接入能力 | 两次独立至少 30 分钟的记录绑定同一候选版本，报告分辨率／设备／运行条件／限制。移动 viewport 与真机分开；没有真机证据继续 not-run，不自动推断 GPU 已释放 |
| B6：可信审核输入、对齐与交付 | 共用审核输入验证层，消费可信的成分审核／版权记录／真机证明；只读比较 root 权威 manifest；复核现有运行包、还原与回滚，修复必要差异 | 缺输入继续 pending；禁止自签或自动科学写回。源码／构建／资产／证据与候选包一致。若只剩运行既有封包命令，则作为最终验收并入前轮，不另算开发轮 |

顺序：B1 → B2 → B3 → B4 → B5 → B6。来源审核材料和 root 权威输入可并行准备。两批星云仍各 6 张验收；共享生产实现，不重复造采集器或闭合工具。

B5/B6 存在真实实现缺口：scripts/mainline-a-release-evidence.mjs 当前把 rightsClosure 固定 pending、恒星门禁固定 blocked/pending、physical-mobile 固定 not-run；app/lib/mainlineAResourceObservationV633.ts 拒绝 physical-mobile attestation。后续应让经过可信验证的输入有正式消费路径，缺输入和伪造输入继续失败关闭。不能仅把常量改成 passed，也不能用工具开发代替实际签署和设备观测。

正式发布时间不能仅由轮数承诺。4 星成分确认、12 项版权签署、root 权威 manifest 与设备条件属于独立输入；等待时间不计作新开发轮。用户已选择版权暂时 pending、继续技术验收，不重复询问这个决定。

## 每个实际开发轮的门槛

- 以用户最新目标执行：至少 1000 行有效生产／数据接入／运行工具代码，测试不计入此目标；低于要求合并同阶段相关功能。旧文件中的 500 行是历史要求。
- 同时交付生产行为、数据或接入工具、实质性测试。空白、格式化、锁文件、生成 manifest、收据、截图、文档、机械数据复制和孤立 marker 不计数。
- Node、Vitest、定向 ESLint、生产构建、HTTP、桌面浏览器证据均必需；移动 viewport 可用时执行，真机不可用明确 not-run。
- round receipt 与 code-change receipt 记录本轮基线、新增／修改／删除及有效文件；static、HTTP、visual、browser、performance、external-source 分开。
- 已有 package／restore／collector 能力直接复用；只为修真实缺陷或补缺失能力编写代码，不因工作包数量而扩展范围。

## 工作树与构建身份

- 唯一工作目录：E:/86137/myai/solar_sim/next-web。
- 本次核对分支：codex/solar-sim-mainline-a；HEAD：156ec7790a99be2f89f5d8f44831cb118c9437e1。
- 读取时 git status 有 1603 条；这是大量未提交工作的现有工作树，不能从 HEAD 重建来替代当前内容，也不能据历史 boundary 的 clean 字段宣称干净。
- 禁止父仓库 Git、reset、clean、checkout、删除文件、覆盖历史工作树；本次没有创建新分支、工作树、提交或部署。
- EIH、Newton N-body、2PN/Lense–Thirring、Kerr 内核不修改；scientificPayloadWriteback=false。
- 058 buildId：zs_6RqmgRa52VqlcUfxeZ；runtimeBuildId：mainline-a-607a1a089e56459a。
- 064 的 2359 项 app/config/package 输入摘要：607a1a089e56459aa84dd30452d7c85c3c7811e2b1f30702ff58252398138314。这个摘要不覆盖 public 资产或测试，资产仍须单独验哈希。
- 构建目录：.next-mainline-a-r66-20260927-058；当前预览运行目录：.mainline-a-restored-r66-20260927-058。
- 地址：http://127.0.0.1:3057/。本次核对监听 PID 为 23580，只监听 loopback；PID 和服务存活状态是瞬时事实，新会话必须重新核对，不能误停别人的进程。
- 启动的是既有 restored server.js，Node 24.14.0、production、NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE=vercel-lite，使用 Node permission 将文件读取限制在 restored runtime。不要重建或覆盖该恢复副本。

## 首读材料与证据指纹

以下路径均相对唯一工作目录。先读工作树边界，再读最新 064；不要按日期顺序从 R47 重放所有历史。

| 文件 | 用途 | SHA-256 |
|---|---|---|
| docs/release/v607/mainline-a-worktree-boundary-20260914.json | 仓库边界；clean/旧基线仅历史参考 | 131a023bf0747759f406fee9a1060b948a95f7f6c7286ba7c0ebf1f5ae6509a8 |
| docs/release/v607/mainline-a-browser-smoke-20260927-064.json | 最新浏览器恢复、缺陷、截图和未完成项 | b51c4bceea858f86d864c713375862834d46b873e055decb76ee6971acd0ff71 |
| docs/release/v607/mainline-a-r66-http-20260927-064.json | 当前本机页面／健康检查 200，6 脚本匹配 | 19b9162ee5c609fdfe3db63950569d0ff24e7633206e6946b4a81bf45707c086 |
| docs/release/v607/mainline-a-art-round-66-v636-20260927-058.json | 最近实际代码批次、测试、构建、运行包与回滚 | bca17735071944b9a3e5b6b068c2c3031f157cb4149cd80f873d40f4f183fd5b |
| docs/release/v607/mainline-a-stellar-primary-review-20260927-060.json | 最新四星原始来源审查材料 | 417b0515141a55aeb688696b6d577e9984efeef30a1ebaaf017d493889671f68 |
| docs/release/v607/mainline-a-nebula-source-artifact-closure-20260927-053.json | 新增十二图及官方页的来源闭包 | a2927a93ebf4faa2aed2648cf8750657d92c6455f1c8fe42c5e010012df74113 |
| docs/release/v607/mainline-a-nebula-technical-assets-20260927-053.json | 原图与衍生资产静态技术核验，非 GPU 证明 | 2ebfd1bbdce703af9eb76645ec1007d43dd6d2dd94dd4f84f321a4caa69ce5ce |
| docs/release/v607/mainline-a-root-source-20260927-055.json | root 已授权只读输入 | afc9c36e822dc40529c1390322e5da0c5c93c44774a758b8fd57f700c230888c |
| docs/release/v607/mainline-a-root-manifest-probe-20260927-055-corrected.json | 明列路径的 manifest 缺失情况，非无限范围扫描 | b8a8cbe4a8f8eb343efb7dffe500527d25241375a17b75d3800f2c1ca5d02b4e |
| docs/release/v607/mainline-a-goal-blocked-audit-20260927-062.json | 历史 17 项门禁定义；不得忽略后续 064 | a201c695f2f3a23f2503b16926ad0875f89e2bb21afa1c22a7342670e5c5fb98 |

V616–V621 的四个封存文件保持原字节；本次只读复核仍与 058 的 protectedFiles 指纹一致。后续新审核输入使用明确的新版本或 sidecar，不重写既有 snapshot/projection digest。

## 插件与会话交接

本次实际复查：内置 Browser 的现有标签页仍为 Orbit Atlas，DOM buildId=mainline-a-607a1a089e56459a，1280×720；Vercel list_deployments 仍 403 团队权限错误；Exa 仍 402 额度耗尽（服务时间 2026-09-27T10:40:49.423Z）。没有新部署、上传、来源抓取或凭据读取。Vercel／Exa 不再是本机美术批次的前置条件。

建议在下一个完整代码批次开始前换新会话以减少历史状态混淆，但不是技术必需，也没有证据表明当前上下文已耗尽。无法准确读取剩余上下文比例。此处未创建新会话。

新会话使用同一工作目录，保留全部 dirty 内容和旧收据。浏览器连接与进程不能假定自动继承：先核对监听及构建，再按 Browser 技能重新连接。如果工具句柄已经存在就复用，不因换回合重启或另建浏览器。

主会话 get_goal 在本次仍返回 blocked；这是工具状态，不代表已恢复的浏览器仍有故障。交接应保留原目标、查询新会话实际 goal 状态，不宣称目标迁移或完成。不要为了继续技术开发重复创建旧主会话的顶级 goal。

下一会话可直接粘贴：

> 继续 Solar Sim Mainline A。工作目录 E:/86137/myai/solar_sim/next-web。先读取 docs/release/v607/mainline-a-remaining-batches-handoff-20260927-065.md 和其中的工作树边界，再核对内部 Git、064 浏览器与 058 构建。按交接从 B1 完整功能批次实施，生产／工具有效代码目标至少 1000 行，测试除外；不足合并相关工作，禁止灌水。浏览器已恢复，先修复桌面／移动工具栏遮挡与缺失值显示，再推进 36 对象验收。保持版权 pending、候选边界与科学载荷不写回；不操作父 Git，不 reset/clean/checkout/删除或覆盖历史内容，不修改物理内核，不重新执行 R47–R59。复用现有运行包与采集管线，按每轮测试、构建、HTTP、浏览器与分层证据要求交付。

本规划只新增此交接文件，不修改生产代码，不计有效代码量，不新增 round receipt 或代码轮次。

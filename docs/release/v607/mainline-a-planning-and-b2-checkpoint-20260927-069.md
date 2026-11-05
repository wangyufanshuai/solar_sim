# Solar Sim Mainline A：剩余计划与 B2 实施中交接

日期：2026-09-27。069 是规划和未完成工作检查点，不是开发轮，也不是通过验收的 round receipt。本文件更新 067 的当前状态；067 的阶段顺序仍适用，但其中“B2 尚无代码变更”“创建新的 B2 基线”已过时。保留所有旧文件、工作树、构建和证据。

## 当前结论

项目是已有本地生产预览、部分浏览器验收的候选版，尚未达到最终发布验收。B1/V637 完成；B2/V638 已有生产代码和测试，但仍有明确缺陷、失败测试，尚未生产构建或完成当前版本 36 对象矩阵。不能把 B1 的构建和浏览器结果归给 B2。

当前展示目录的既有统计是 20 颗恒星、12 个星座、12 张星云；A 线 canonical 集是其中 12/12/12，共 36 项。Beta 目标仍为 24 颗恒星、12 个重点星座、24 张观测图。四颗恒星的成分身份审核、十二张新增星云的逐项审核签署仍 pending。来源面板的历史候选总条数不等于完成数量。

顶级 goal 本次实查仍为 active，未创建重复目标，未标记 complete、blocked 或 paused。最新用户要求先整体规划剩余轮次并判断是否需要新会话，因此本次把进行中的工作整理成可接续检查点，不把规划当作新开发轮。

## 剩余轮次

按五个工作包、约 4–6 个实际开发轮安排，中位预算为五轮，包含正在实施的 B2。工作包与轮次不强制一一对应；仅验收、来源登记、截图、政策检索或执行现有打包脚本不独立计轮。

| 顺序 | 工作包 | 主要工作 | 完成条件 | 轮次预算 |
|---|---|---|---|---|
| 1 | B2：A 线 36 对象冻结 | 修复焦点、尺度归还、星座导航和真实绘制状态；完成加载、切换、关联、返回、取消、重试、释放及批量导出/回放 | 新生产构建绑定的 12 星/12 星座/12 星云矩阵，失败保留并重验；ready 不由点击或解码单独推定 | 当前一轮收完 |
| 2 | B3：四星候选呈现与来源消费 | Acrux、Spica、Regulus、Polaris 的系统/分量身份、单位、缺失和不确定值；接入最新真实来源及可信审核输入 | 候选呈现与逐字段来源可追溯；身份错配、伪造、fixture 无法晋级；未确认继续 hold | 约一轮 |
| 3 | B4：十二张新增星云整合 | 复用原图和衍生资产，两组六张完成候选预览、裁切、尺寸、署名、加载取消/重试及清理 | 每图 SHA、尺寸、来源与显示一致；技术预览不自动进入正式 runtime admission | 一轮，确有独立完整功能量时两轮 |
| 4 | B5：多设备性能与生命周期 | 最后运行时版本上观察重复切换、资源释放、帧时间、内存和长时运行；修复发现的问题 | 两次独立至少 30 分钟，桌面与可用移动 viewport；真机证据缺失保持 not-run | 约一轮；纯执行不另计 |
| 5 | B6：只读对齐与候选交付 | 消费可信审核/设备输入，比较 root 权威 manifest，绑定代码/构建/资产/来源，复核还原与回滚 | 最后通过构建对应的候选包与门禁清单；缺外部输入继续 pending | 0–1 轮；仅封包时合并到前一轮 |

画面和交互主体主要还有 B2–B4，约 3–4 轮；最终技术交付合计约 4–6 轮。时间不能仅按代码行数推算：B2 的 36 个对象单次最短 30 秒观察就至少 18 分钟，不含操作、重试和构建；B5 的两次长时记录至少一小时，不能由短截图替代。当前还存在构建盘容量约束，因此不承诺固定上线日期。真实审核、root 权威输入、真机材料与远端权限等待不计入开发轮。

B6 的可信输入消费路径应提前放入 B3/B5；避免等最终封包才改运行时而使前面的证据失效。若某包不足 1000 行有效生产/数据/工具代码，则与相关包合并，不重写现有管线凑数。

## B2 已有实现：必须保留并继续

B2 基线已经建立：`tmp/mainline-a-b2-baseline-20260927-068/inventory.json`，包含 5510 个 app/scripts 源文件记录。不得以当前未完成文件重建同名基线。inventory SHA-256：`039b247ae888d453374a8628afd5bd20532fcead68111890cfa59b5904e072bb`。

已有生产修改分为六组，最终行数尚未封存：

1. 星云：`app/lib/mainlineANebulaLoadV638.ts`、`app/lib/mainlineANebulaSceneTextureV607.ts`、`app/components/MainlineANebulaScenePortraitV607.tsx`。共享 15 秒 fetch/body/decode 截止时间、错误分类、取消/重试、延迟结果清理；解码与实际绘制 ready 分开。
2. 星座：`app/lib/mainlineAConstellationSelectionV638.ts`、`app/components/ConstellationLines.tsx`、`app/components/UniverseSandboxHud.tsx`。独立选中图形几何与材质、投影视口校验、真实选中对象 ready、对象浏览器入口和 A 线筛选。坐标适配尚未修复。
3. 材质生命周期：`app/lib/mainlineAScaleMaterialLifecycleV638.ts`、`app/components/AtlasScaleLayerGroupV273.tsx`。监听对象增删和材质替换，处置后移除登记，退场只恢复自己拥有的属性，不处置共享材质/几何/纹理。
4. 焦点可见尺度：`app/lib/mainlineAFocusPresentationV638.ts`、`app/lib/useAtlasFocusController.ts`。临时进入可见 stellar/galactic 尺度，以 request/revision 所有权保证用户手动尺度选择不被旧焦点回滚；仍有下述接线缺陷。
5. 渲染可见性：`app/lib/mainlineARenderVisibilityV638.ts`、`app/components/SelectedSkyTargetProxy.tsx`。祖先 visibility、camera layer、opacity、drawRange、frustum 检查可撤销旧 ready；回调顺序尚需修复。
6. 批量观察：`app/lib/mainlineACanonicalBatchV638.ts`、`app/components/MainlineACanonicalBatchExportV638.tsx`、`app/components/MainlineAResourceObservationPanelV633.tsx`、`scripts/import-mainline-a-canonical-batch-v638.ts`。保存最多 48 次实际 rawJson，保留失败重试，最后一次尝试控制对象状态；导出和文件导入复用 V633/V635 校验链，仍有下述缺陷。

批次测试已收口：`app/lib/mainlineACanonicalBatchV638.test.ts` 为 Vitest 28/29 通过；`scripts/import-mainline-a-canonical-batch-v638.test.ts` 为 Node 7/9 通过，两文件定向 ESLint 通过。失败对应顶层 synthetic 来源未拒绝和导入缺少 V635 index artifact 两项生产缺陷，尚未修复。新增测试 422 行，不计入生产代码目标。测试文件写读、SHA 和回放使用明确标注的静态夹具，不是浏览器证据；夹具保留于 repo `tmp/v638-batch-static-test-*`。

## B2 优先修复与审查发现

| 优先级 | 位置/问题 | 影响与最小后续动作 |
|---|---|---|
| P1 | `useAtlasFocusController.ts` 使用 `atlasRuntimeStore.getState` | 真实导出的 API 为 `getSnapshot`，首次 release 可异常；改接真实 API，并补真实 store 接线测试 |
| P1 | constellation 目录焦点和图形坐标手性不一致 | 目录导航负 Z，星座图形/标签正 Z；静态实际目录投影在桌面与移动比例均有 9/12 无可见线段。应审查仅 constellation 分支的展示适配，禁止全局翻转 nearbyStars 或科学数据 |
| P2 | `focusEarthMoon()` 未释放临时尺度/清空相关星图选择 | 从恒星进入地月仍可能处在 stellar，solar 图层被隐藏；补入口归还与集成验证 |
| P2 | 焦点 hook 未在卸载时归还仍拥有的尺度 | global store 遗留 stellar，ref 所有权丢失；增加 ownership-safe cleanup |
| P2 | 恒星 surface `onAfterRender` 无条件调用 rendered | Three 的零/无效 drawRange 也可触发回调，覆盖同帧 unobserved；在回调内再次验证可见且有效绘制，并测试回调顺序 |
| P2 | 导入脚本读取 `replay.index` | 现有 index 工具返回 `{artifact, replay, sourceFilesMutated}`；修正字段引用并测试实际文件导入结果 |
| P2 | `safeOrigin` 没有拒绝顶层 `origin: "synthetic"` | 批次来源负例缺口；补拒绝逻辑并维持 sourceAuthenticityProven=false |
| 待审查 | 星云退到隐藏图层/视口外及重新进入 | 确认旧 ready 被撤销、重新实际绘制可恢复；不能因首次 decoded 后只触发一次而留下过时状态 |
| 待更新 | `mainlineACanonicalProducerV635.test.ts` 的旧源码接线断言 | 星云加载参数与 ready 条件已变、星座资源 hook 为 10；按实际行为更新，不能把断言改绿代替缺陷修复 |

坐标检查来自本地静态 Three 投影，并非浏览器验收。临时内存中仅反转 constellation direction 的 Z 后 12/12 有线段，是修复假设对照，不代表已经修改或通过实际导航。

现有分支混用正负 Z：星座图形/标签、Gaia 与部分 hero 使用正 Z，而 BrightStarCatalog、MajorStarBeacons、StellarPickController、nearbyStars 使用负 Z。不能全局修改 `starToDirection`。

已报告的聚焦检查：星云 3 文件 30 测试通过；材质 11 测试及定向 lint/类型检查通过；焦点/可见性相关 4 文件 24 测试通过，但未覆盖已发现的真实接线和回调缺陷；星座最新 27 测试仅 26 通过，实际 Orion 方向回归失败，四文件 ESLint 通过。加上批次测试，本检查点有四项失败测试仍待修复。这些是分项运行，不能相加当作整批最终通过。

已有旧 B1 构建预探：`tmp/mainline-a-b2-preflight-star-068.json` 记录 Alpha Centauri A → Achernar → Alpha Centauri A，登记取得 3/释放 3、基线恢复。只能作为 B1 构建上的预探，不能计入 B2 新构建 36 对象矩阵，也不能证明物理 GPU 释放。

## 恢复执行顺序

1. 先读 boundary、本文件、B1 的 066 receipt，再看已有 B2 文件和 068 基线。不要从 B1 或 R47–R59 重做，不要采信 067 的“B2 尚无代码”启动段。
2. 核对 next-web 内部 Git、当前磁盘容量、3066 监听、所有子代理是否已 idle。保留 dirty 工作树、旧构建和预览，不从 HEAD 新建干净 checkout 替换这些成果。
3. 修复上表 P1/P2，先验证真实 store 接线、实际 constellation 目录方向、可见性回调顺序和批次导入负例；再做整合 Node、Vitest、定向 ESLint。
4. 相对已有 068 基线统计有效生产代码。可复用 `tmp/count-mainline-a-b1-066.cjs` 的算法，另建 B2 统计入口；不要覆盖 B1 统计与收据。
5. 空间预算足够后用新的保留构建槽：`node scripts/build-mainline-a-preserved.mjs --round 66 --run-id 20260927-068`。如失败保留全部输出，改用 068b；不得覆盖已有槽。本次未找到 068 build receipt。
6. 启动新生产预览并绑定真实构建身份，完成 HTTP、36 对象实际 UI 往返、桌面截图检视及可用移动 viewport。现有 3066 仍是 B1，不要混用。
7. 导出只读 textarea 的真实 rawJson/整批 bundle，SHA 绑定成功构建后离线 intake/replay；保留失败、取消、重试，不用 fixture 补齐矩阵。
8. 最终记录有效代码新增/修改及文件、测试、构建与分层证据，生成 B2 round/code-change receipt；然后继续 B3–B6。尚缺签署对象继续 pending，不重新询问用户已决定的版权处理方式。

## 本次现场复核

- 工作目录与 Git root：`E:/86137/myai/solar_sim/next-web`；分支 `codex/solar-sim-mainline-a`；HEAD `156ec7790a99be2f89f5d8f44831cb118c9437e1`。
- 规划核验时 `git status --short` 1664 项；子代理收口测试/新增本交接后会变化。全部保留。
- E 盘可用空间在本次两次采样中为 929,083,392 和 865,906,688 字节，已不足 1 GiB。不要沿用 067 的 4.23 GiB。新保留生产构建前必须重算预算；不删除历史工件、不移动仓库边界、不擅自清理其它项目。
- 3066 监听 PID 44080，URL `http://127.0.0.1:3066/`；浏览器标签 2 可读现有 Orion 档案。
- DOM 本次确认 `data-mainline-build-id=mainline-a-1a7efa4d339d80a7`，branch/head 与本地一致；这是 B1 构建。legacy V595 的属性仍为 unbound-production，后续 B6 按适用范围审核。
- `/api/health` HTTP 200，checkedAt `2026-09-27T12:06:43.051Z`；deploymentId/commitSha 为 null，不能推断远端部署身份。
- B1 运行槽 `.next-mainline-a-r66-20260927-066b/.next/standalone`；buildId `GYRGfmHS7ipvhzqC7nOUU`，sourceSha256 `1a7efa4d339d80a7727f079b306fa46432fbf365eb6e1d43d33327814a9c5ac3`，引用 066 构建记录。
- Node V619 `--check` 本次 verified，4/4 pending；是封存历史契约，不能由此否认后续真实 raw capture。
- 066 round 与 code-change receipt SHA 本次重算匹配；B1 为 1245 有效生产行/13 文件，Node 8、Vitest 221、ESLint 18 文件及生产构建通过，均来自已封存 B1 收据，未在规划轮重跑。

本次插件检查：

- Browser：既有标签、DOM、公开构建属性读取成功；没有新增截图检视、36 对象或长时性能验收。
- Exa：一次请求三个结果，返回 NASA、JPL、Spitzer/Caltech 官方使用政策。这里只验证检索可用并提供审核参考，没有图像级批准或签署。参考 `https://www.nasa.gov/nasa-brand-center/images-and-media/`、`https://www.jpl.nasa.gov/jpl-image-use-policy/`。
- Vercel：list_deployments 本次仍 403 Forbidden，scope `wyufan43-3383s-projects` 需要重新授权。没有远端部署证据，未部署、未读取或输出凭据。

证据分类：static 是本地代码/收据/哈希及分项测试；HTTP 是本地现有构建 health；browser 是现有页面和 DOM 身份；visual 本次未新增；performance 本次未新增；external-source 为现有真实来源收据与本次政策检索。各类不可相互替代。

## 外部门禁与固定边界

- `mainline-a-stellar-primary-review-20260927-060.json` 仍 candidate-review-pending；已有真实 raw 和补充来源不能自动确认系统/分量身份。
- `mainline-a-nebula-source-artifact-closure-20260927-053.json` 明确原图 12、官方页 12、rightsSigned=0、rightsPending=12、sceneAssetAdmissions=0；技术资产解码/哈希通过不等于版权审批。
- root 权威 manifest 在 055-corrected 记录所检查位置仍缺失；本次只读该既有记录，没有重新扫描父级或操作父级 Git。最终需要可信只读输入。
- 用户已经决定“暂时保持 pending，继续技术验收”。无需再次征求同一项许可，也不能代替用户签署。
- 只操作 next-web Git；禁止 reset、clean、checkout、删除、覆盖历史工作树、批量暂存和未授权提交/部署。
- 不改 EIH、Newton N-body、2PN/Lense–Thirring、Kerr；保持 candidate-only、hold、not-admitted、scientificPayloadWriteback=false。
- 每个实际开发轮至少 1000 行有效生产/数据接入/工具代码，测试除外。空白/注释/格式化、锁文件、自动生成数据或收据、截图、文档、机械复制、孤立 marker 不计；不足合并相关完整功能，禁止凑数。
- Node、Vitest、定向 ESLint、生产构建、HTTP、桌面浏览器和可用移动 viewport 为完整轮门槛；真机不可用必须 not-run。

封存字节本次重新核验均保持：V616 `bd307be6b47077a317adae1662a0bcc1ebd6c897291006567991238792f77310`；V619 `73b89dc9e58ec7b0b2de0e93ce714b57f5ae68ad48f4fc2b1909c1a9c7b621dd`；V620 `9a759b27bc306486f517346cd381cec8fe2d6c9d7474605714b2c4a81b886ab2`；V621 `b9682813f7f28ad84a8e6f266babf32b06a10c6808a3e8108a50d90da745500c`。

## 是否新会话

建议在这个检查点新开同项目普通本地会话，利于把很长历史中的过时状态与当前 B2 未完成成果分清；不是因已确认上下文耗尽。当前没有可核对的剩余上下文百分比，也不需要为了继续而强制重开。

新会话必须使用同一 dirty 目录和 068 基线；不得只按 HEAD 创建干净 worktree。旧 goal、子代理状态、浏览器对象及进程控制关系不会被假定为自动迁移。这里没有代用户创建新会话或暂停/关闭旧 goal。

新会话入口文本：

> 继续 Solar Sim Mainline A，目录 E:/86137/myai/solar_sim/next-web。先读 docs/release/v607/mainline-a-worktree-boundary-20260914.json、mainline-a-planning-and-b2-checkpoint-20260927-069.md 和 mainline-a-art-round-66-v637-20260927-066.json。B1 已完成，B2/V638 已有未完成生产代码，复用 tmp/mainline-a-b2-baseline-20260927-068，不重建同名基线。先核对当前工作树、磁盘空间与旧3066预览，再修复交接列出的 store 接线、星座导航坐标适配、尺度归还、绘制状态与批次导入缺陷，完成当前 B2 的整合测试/生产构建/36对象矩阵和收据后继续 B3–B6。保持真实来源、签署 pending 和所有物理/父Git/封存数据边界；每个实际开发轮1000有效生产行，测试除外；不得把规划、截图或旧B1证据计为B2通过。核查是否已有当前会话goal，不能假定旧goal已迁移或重复创建。

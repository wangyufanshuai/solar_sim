# R66 SIMBAD TAP 交叉标识审核补充

状态：`candidate-only`、`hold`、`not-admitted`、`scientificPayloadWriteback=false`。本补充只记录结构化来源证据；没有晋级恒星物理组件身份，也没有更改 V616 snapshot/projection、运行时或科学载荷。

四次真实 HTTPS SIMBAD TAP CSV 响应及请求尝试信息保存在 [原始捕获 ledger](stellar-component-tap-v646/ledger-r66-tap-20261007-001.json)，[离线回放](stellar-component-tap-v646/replay-r66-tap-20261007-001.json) 重算原始文件 SHA-256；[交叉标识分析](stellar-component-tap-v646/analysis-r66-tap-20261007-001.json) 绑定这些输入和先前的 [WDS 组件审核包](mainline-a-r66-stellar-component-review-packet-20261007.json)。四份响应均为 HTTP 200、`text/csv`，回放通过；错误 SHA-256 的负例被拒绝。它们是外部结构化来源捕获，不是科学有效性、版权批准或真实用户验证。

| Hero | SIMBAD hero `oidref` | 对应 WDS A 标识 | 交叉标识结论 | 仍需审核的物理对象范围 |
| --- | ---: | --- | --- | --- |
| Acrux | `11606360` | `WDS J12266-6306A` | 同一 SIMBAD 对象；B、C 分属其他对象 | 产品 hero 是 A 的单颗成员、未分辨子系统，还是多星系统？ |
| Spica | `2140887` | `WDS J13252-1110A` | 同一 SIMBAD 对象；本次有界查询未找到独立 Aa/Ab 对象 | WDS Aa,Ab 成对行不能单独确认 hero 的某个物理成员。 |
| Regulus | `1689590` | `WDS J10084+1158A` | 同一 SIMBAD 对象；B、C、D 分属其他对象 | `A` 交叉标识对应产品 hero 的对象范围仍需裁决。 |
| Polaris | `317713` | `WDS J02318+8916A` | hero、A 和 `WDS J02318+8916Aa,Ab` 共用同一 SIMBAD 对象 | 别名折叠不能证明 hero 唯一对应 Aa 或 Ab。 |

因此，本批次增加了 **4/4 数据库交叉标识匹配**，但 **0/4 物理组件身份确认**。审核人须逐项记录 hero 预期层级、组件专属标识与可回溯来源、WDS 记法/坐标/历元的一致性，以及日期和结论。未完成前继续 `pending`。SIMBAD [标识说明](https://simbad.cds.unistra.fr/Pages/guide/sim-fid.htx)和 [内容说明](https://simbad.cds.unistra.fr/Pages/guide/ch15.htx)用于解释数据库标识；本批次的具体匹配以保存的 CSV 字节及回放为准。

这份补充位于 `docs`，不在 V645 保留生产构建的 `app`/配置输入范围内。它不会更新既有不可变发布包；发布门禁须在身份、root manifest、版权签署和实体移动设备条件具备后重算。

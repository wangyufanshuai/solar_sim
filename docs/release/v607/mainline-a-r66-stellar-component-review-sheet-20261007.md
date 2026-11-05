# R66 恒星组件身份审核单（候选证据）

状态：`candidate-only`、`hold`、`not-admitted`、`scientificPayloadWriteback=false`。这份审核单只收束待裁决问题，不确认任何一颗恒星的物理组件身份，也不构成版权批准。

可重算输入是 [V634 HTTPS 捕获 ledger](mainline-a-stellar-components-v634-20260927-056.json)、[V634 组件候选 ledger](stellar-component-candidate-ledger/v634/6644a8ac1fa31536f68ba747a932e8b6215d7f39a53e624cc2696448ecc131cb.json) 和 [本次审核包](mainline-a-r66-stellar-component-review-packet-20261007.json)。4 份 WDS TSV 和目录 ReadMe 已捕获；25 条成对观测的原始字节位置、哈希和组件标签均在审核包中。另一个历史候选 ledger `c28e342e...json` 未通过当前原始捕获重算，不能用于晋级。

| Hero 对象 | SIMBAD 候选 WDS 标识 | WDS 成对记录 | 需要裁决的身份问题 |
| --- | --- | ---: | --- |
| Acrux | `WDS J12266-6306A` | 11 | `A` 出现在 AB、AC、AG、AH、AI、AJ、AK 等相对测量中；尚无证据说明产品 hero 表示单颗 A、A 子系统还是整个多星系统。 |
| Spica | `WDS J13252-1110A` | 4 | 同一系统有 Aa,Ab、Aa,Ac、AB、AC；Aa,Ab 行的最后分离角无效且观测均数为 0。需区分 A 合成对象和具体物理成员。 |
| Regulus | `WDS J10084+1158A` | 4 | AB、AD 与 BC、BD 描述不同相对关系；`A` 交叉标识尚未独立绑定到产品 hero 的具体对象范围。 |
| Polaris | `WDS J02318+8916A`、`WDS J02318+8916Aa,Ab` | 6 | 候选标识同时涉及 A 与 Aa,Ab；需要明确 hero 是 A 合成对象、Aa 还是其他成员。 |

WDS 的 `Comp` 列表示成对组件关系，原始 [CDS 目录 ReadMe](https://cdsarc.cds.unistra.fr/ftp/B/wds/ReadMe) 第 99–113 行说明近距子组件和混合分辨率记录可能产生不同命名；[USNO WDS FAQ](https://crf.usno.navy.mil/wdscfaq) 也说明 AB、AC、Aa/Ab 是相对测量与层级组件记法。因此，系统级或成对标识不能直接等同于某个 hero 的唯一物理恒星身份。

逐项关闭组件身份门禁时，审核记录必须给出：产品 hero 意图表示的对象层级；独立、可回溯的组件专属标识；该标识与 WDS 行的组件记法、坐标和历元的一致性；审核人、日期及结论。任一项缺失即继续 `pending`。完成后再重算原始 SHA-256、候选 ledger 和发布门禁，不改写既有 V616 科学 snapshot/projection 或运行时载荷。

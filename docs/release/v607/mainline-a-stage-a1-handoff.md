# Mainline A — A1 handoff

阶段 1 已交付统一的星座、星云、恒星数据—美术—叙事—来源合同和首批对象登记。

## 消费入口

- 合同类型：`app/lib/celestialObjectContractV607.ts`
- 首批 metadata：`app/data/mainlineAMetadataV607.ts`
- 稳定注册表：`app/data/mainlineARegistryV607.ts`
- 资产覆盖：`app/data/mainlineAAssetCoverageV607.ts`
- IAU 边界：`app/data/mainlineAConstellationBoundaryDataV607.ts`
- 星云来源候选：`app/data/mainlineAFirstSetNebulaCandidatesV607.ts`

## 当前事实

- 首批对象：4 个星座、12 个星云、6 颗恒星。
- IAU J2000 正式边界已接入 Ori、UMa、Cas、Sco。
- M42、M1、M8、M16、M20、M57 已完成逐图 CC BY 4.0 核验与本地影像交付，均为 `licensed` 和 `cleared`。
- 其余首批星云保持 `catalog-marker`；已授权影像数量为 6。
- 恒星肖像是参数化光球展示模型，不是观测纹理。
- M1 通过 `relatedCatalogIds` 连接现有目录中的 `pulsar:b0531+21`；外部目录关系只驱动导航，不加入主线物理状态。

## 验证

```text
node scripts/verify-mainline-a1.mjs
npx vitest run app/data/mainlineAMetadataV607.test.ts app/data/mainlineAConstellationBoundaryV607.test.ts app/data/mainlineAFirstSetNebulaCandidatesV607.test.ts --exclude tmp/** --exclude **/.next*/**
```

本地影像、逐图署名、四幅星座图和六颗恒星肖像已接入天体档案。下一步完成当前构建的浏览器交互、设备性能与资源回收验收。主线 A 不向 EIH、Newton N-body、2PN/Lense–Thirring 或 Kerr 内核写入展示数据。

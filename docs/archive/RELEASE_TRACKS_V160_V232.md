# Orbit Atlas v160–v232 release-track archive

本文件保存 v160–v232 阶段的高层时间线。逐版本实现细节仍可在 `docs/TECHNICAL_OVERVIEW.md` 和各版本 checksummed dossier 中复核。

## v160–v174

- 建立 6 个本地内容包、单 Canvas 架构、V9 资产解析和 standalone/Lite 双交付。
- 将运行控制器、store、panel coordinator、mission、focus、launch 和 evidence facade 分离。
- 默认内核保持 `legacy-eih-1pn`，V2 只作为 shadow。

## v175–v192

- 收敛 Workbench、Canvas 输入、Desktop Tauri 服务和发布 dossier。
- 完成 React 19、R3F 9、Next 16 兼容路径。
- 建立 DOP853/IAS15、逐天体回归、科学 promotion decision 和桌面构建链。

## v193–v208

- 建立 36 帧视觉旅程矩阵、805/805 内容包恢复和 v200 Web/Desktop Beta RC。
- 扩展弱场 V9 研究、Kerr Carter/Mino 与 Kerr–Schild 参考实现、红移和偏振证据。

## v209–v224

- 增加 reference bundle、batch fit、Variational STM、dense Kerr 采样和强场交叉验证。
- 继续保持实时内核、Worker physics、V9、旧 fixtures 和科学 gate 冻结。

## v225–v232

- 加固 current/previous 双槽构建、安全边界、CSP/SRI、内容下载和桌面 token。
- 完成本地主机双构建、674/674 回归、805/805 内容包、RTX 4060 性能和未签名 MSI/NSIS。
- v232 状态为本地 Web GA 候选；云端迁移、签名、外部安装 QA、Kerr 49 shards 和十年 STM 尚未完成。

历史证据不能替代当前 manifest。v233 起，动态发布状态统一由 `AtlasCurrentEvidenceManifestV233` 派生。

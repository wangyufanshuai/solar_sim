# 运行器开销诊断 v1：目录扫描热点已复现

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns.
- Origin Mode: run，随后读取已保存数据并作性能解释。
- Origin Date: 2026-10-13，Asia/Shanghai。
- Verification Status: ANALYZED；单次诊断完整收集并通过终态核验，不是物理内核资格化。
- Version Label: nr_guard_overhead_diagnostic_v1_result.
- 性能数字受运行环境影响；不是独立机器复现、冷缓存测试或置信区间估计。

## 结论与边界

确认了一个实测性能问题：**现有 guard 的开销由递归目录扫描主导**。
在旧超时目录上，未剖析的完整检查中位耗时约 309.481 ms，
单独目录扫描约 285.969 ms，真实磁盘余量检查约 0.238 ms。
调用剖析显示，同一完整检查中的目录求和区段占其累计时间约 99.88%。

这支持“高频重复全目录扫描是旧运行器的重要开销来源”，但不能精确证明
旧 600 秒批次中扫描占多少时间，也不能据此认定是唯一超时原因。
本轮没有重跑物理矩阵，因而没有直接测量精确算术的耗时占比。

诊断完整通过，只代表测量和证据核验完成。旧八射线 v1 仍是 TIMEOUT，
未补算、未重试、未重新评级。全方向能量、物理演化或科研准入均未获得。

## 执行与资源

用户授权内容、固定目标和采样顺序见
[预登记计划](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/EXPERIMENT-20261013-guard-overhead-diagnostic.md)。

```text
D:/python/python.exe -B scripts/run-nr-k3-guard-overhead.py --output-directory tmp/nr-shadow-evidence/nr-k3-guard-overhead-diagnostic-v1-20261013
```

- 工作目录：`E:/86137/myai/solar_sim/next-web`。
- 文件时间：2026-10-13 23:00:36 至 23:02:53，UTC+08:00。
- 监护耗时 137.015 秒，工作进程耗时 110.422 秒，退出码 0。
- 终态 `passed=true`、`completed=true`、`diagnostic_completed=true`。
- 进程清理已验证，清理后活动数 0；`retries=0`。
- 原 64 MiB／600 秒、2 MiB 收尾预留、8 MiB 源码快照上限全部保留。
- 原 C>=3 GiB、E>=4 GiB+32 MiB（启动另留本批 64 MiB）不变。
- 启动前 C/E 可用字节：14,815,256,576 / 23,758,757,888。
- 输出 619 个文件，共 8,930,451 字节，约 8.52 MiB。
- 源码快照 562 份，共 4,961,567 字节。
- Python 3.12.3，Windows；计时使用 perf_counter_ns / thread_time_ns。
- 只新增诊断入口、自检及文档；原监护函数和物理代码没有修改。

12 项自检全部通过，无失败、错误、跳过或预期失败。完成 15 个预热观测、
135 个未剖析计时样本和 15 次完整 guard 剖析调用。所有检查和计时都在
原 Windows Job Object 所属进程树内进行；独立监护和工作进程保护同时生效。

没有数值内核导入、矩阵计算、八射线回放、完整背景矩阵、时间演化、
原生后端或 GPU 调用。`original_threshold=2e-12` 未变；
physical/live/scientificPayloadWriteback 均为 false。

## 未剖析计时结果

每项中位数来自 9 次观测；保留全部原始样本，没有按结果去除离群值。
“子目录数”不含目标根目录。各操作分开计时，不能将不同列相减当作
某一次完整调用的精确耗时分解。

| 只读目标 | 文件 / 子目录 | 完整 guard 中位数 | 扫描中位数 | 磁盘检查中位数 |
|---|---:|---:|---:|---:|
| 新空目录 | 0 / 0 | 0.739 ms | 0.580 ms | 0.222 ms |
| 旧源码快照 | 558 / 17 | 34.281 ms | 34.085 ms | 0.242 ms |
| 旧第一射线目录 | 99 / 91 | 50.339 ms | 50.445 ms | 0.230 ms |
| 旧完整超时目录 | 1,087 / 482 | 309.481 ms | 285.969 ms | 0.238 ms |
| 已验收父批次 | 1,035 / 231 | 154.399 ms | 155.542 ms | 0.241 ms |

旧完整超时目录的完整 guard 范围为 280.181–328.729 ms，
扫描范围为 278.727–328.834 ms。部分目标的扫描中位数略高于完整检查，
反映独立测量的波动，不表示完整检查跳过了扫描。

99 个文件但 91 个子目录的射线目录，比 558 个文件、17 个子目录的快照
检查更慢。这提示目录数量和布局很重要；不同目标同时改变了多个因素，
不能将差异解释成严格隔离变量的因果实验。

## 调用剖析和源码机制

旧超时目录的三次完整 guard 剖析累计：

- guard：1.076938 秒。
- 内部 builtins.sum 扫描区段：1.0756424 秒，约为同次 guard 累计的 99.88%。
- disk_check：0.0011055 秒，约 0.103%。
- nt.scandir：2,898 次；nt.stat：7,974 次。

不把这些重叠的累计时间相加。剖析自身会改变绝对耗时，因此绝对延迟
使用上一节未剖析样本，剖析只用于定位调用关系。

每次完整 guard 的实际调用数：

| 目标 | nt.scandir | nt.stat |
|---|---:|---:|
| 空目录 | 2 | 2 |
| 源码快照 | 36 | 1,135 |
| 第一射线目录 | 184 | 291 |
| 完整超时目录 | 966 | 2,658 |
| 已验收父批次 | 464 | 2,303 |

五组都吻合：目录枚举数 = 2×(子目录数+1)，状态查询数 =
2×文件数+子目录数+2。这是本机当前实现的实测规律，不是跨版本通用承诺。

读取本机 `D:/python/Lib/pathlib.py` 后确认其机制：rglob("*") 组合递归
选择器和通配选择器；递归选择器先通过 walk 找目录，通配选择器又对
每个目录进行枚举。原 guard 还先调用 p.is_file()，随后对文件再调用
p.stat()，产生重复状态查询。这些读取均未修改 Python 安装。

放大点：

- `scripts/nr_owned_control.py:110`：每次 guard 都进行全树扫描。
- `scripts/nr_constraint_exact_coefficients.py:39`：43 行乘法在
  0、8、16、24、32、40 行各调用 guard，共 6 次；这里只做源码解释，未运行乘法。
- 独立监护循环也执行完整 guard，再等待 50 ms；不能把它称为固定 20 Hz。

因此，既有设计把随目录增大的全量文件系统开销放在了细粒度计算检查点上。
真实盘余量检查在本次观测中不是主要成本，没有依据去降低它的频率。

## 完整性与局限

终态自摘要通过。终态列出的 618 个其他产物全部重新核对哈希，无额外或
缺失文件。562 份当前源码和快照一致；9 个历史目录共 6,239 个文件与
诊断前后清单一致；旧失败终态仍保持原摘要。无本批残留进程。

关键 SHA-256：

| 文件 / 摘要类型 | SHA-256 |
|---|---|
| qualification-gate.json 整文件 | `d7d17e5799b2d86ffe1d2c9f6c036ebabf82ae9c1e66b24c9002a1ac4e14639c` |
| 终态 canonical body 自摘要 | `90612bdbec41b6a1dba3b8868a423092d2de2bc70668f69a72117f4d9bcac2a5` |
| worker-result.json | `767f0ffa6a2aa35a578b24f45b22df80418ac21ed2a5d1da474bc99963abacd3` |
| timing-summary.json | `d599cefa5088e301b6909c3baa74fde74ad9fbd07766f5d7e2e113826666c619` |
| profiles/failed-full.json | `4805e8161c12203f74d5374ab953ac9400f4c90615159c13bbb69248a169017d` |
| history-before.json 与 history-after.json | `d5aac69e979a030e813e13fd82eee1129c2f3fc41a46125851a4e72b57177326` |

局限：先前的哈希读取已预热元数据缓存；没有隔离后台负载；只有一台
机器、一个诊断批次；未测冷缓存，也未重放旧运行。不能据此报告旧超时
的精确时间占比、预测确定加速倍数或声称八射线已经能够在 600 秒内通过。

academic-research-suite 使本轮保留了预登记采样、单次授权、独立终态和
证据边界；python-testing-patterns 用于计时/覆盖/错误传播自检。
本报告在冻结诊断批次外新增，不修改其源码或原始数据。

## 等价优化建议

优先保持调用位置和频率，改进一次完整扫描的内部实现，而不是先缓存
整棵目录的大小或降低检查频率。详见
[单次遍历候选与验收方案](E:/86137/myai/solar_sim/next-web/science/numerical_relativity/PLAN-20261013-guard-scan-equivalence.md)。

Python 官方资料说明 scandir 提供目录项信息，但 DirEntry 会缓存状态，
不适合长期保留；需要最新状态时应重新 stat。方案因此要求每次检查重新
遍历，且对可能增长的文件读取新状态，不跨检查复用目录项缓存。
[Python 3.12 scandir / DirEntry 文档](https://docs.python.org/3.12/library/os.html#os.scandir)

当前 `optimization_implemented=false`。任何优化验证和八射线新批次均需
新的明确授权；旧失败、物理阈值和长期 shadow-only 边界保持不变。

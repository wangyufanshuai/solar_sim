# 原生 SBP/SAT/RK4：受限检查点与真正进程恢复验收

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: implementation, bounded restart/fault qualification and provenance audit
- Origin Date: 2026-10-10
- Verification Status: VERIFIED BOUNDED RESTART; SHADOW / NO PHYSICAL ADMISSION
- Version Label: nr-native-checkpoint-component-v2

## 结论

新 SBP/SAT/RK4 分支现已具有**方法/源码/程序/运行库绑定的文件检查点与恢复**，
不再只是把原始数组传给另一进程。每个接受端点保存全部 58 槽和原始计划，
在另一个进程、另一个已验证线程数下继续，最终文件与连续计算逐字节相同。

新定向测试 **60 passed，0 failed / error / skipped**；另外独立运行 Python
参考方程与旧 manifest 合同四模块回归 **123 passed**。两者单独报告。
第一批在 Windows 文件发布处失败；已定位并修复，失败批次、原程序、源码
快照和 partial 均保留，第二批新目录完整复验通过。没有降低科学阈值。

限制仍是每轴 9..17 点、一个原始计划 1..4 步。本批不是完整规范脉冲回放、
长期稳定、时间/空间/约束收敛、生产级恢复系统或科学准入。

## 实现与保存合同

- [原生格式/读写](cpp/checkpoint_component/checkpoint.hpp)：小端 canonical58
  FP64，自包含原始计划（初态、几何、dt、整数半步、全部未来六面目标）及已接受
  端点，SHA-256 完整性校验。外部还必须给出预期原计划摘要，不能静默换计划。
- [原生入口](cpp/checkpoint_component/main.cpp)：逐步检查原磁盘底线；每个接受
  端点独立发布；后续错误记录最后有效文件及 attempted step/stage/tick/phase。
  `advance=0` 仅校验检查点，不是进行物理演化。
- [独立 Python 读者与新 manifest 校验器](native_checkpoint.py)：独立解析二进制、
  端点有限/正正常值 lapse/chi/SPD、计划/身份/通用 envelope 及具体方法字段。
  旧周期/固定 halo 的 `manifest.py` 校验合同未扩张或重命名。
- 构建身份固定 19 个文件、编译器版本与关键构建策略，实际 exe/加载 BLAS/
  OpenMP 的摘要另行绑定。完整变量顺序和 release `solar-sim-mainline-a` 纳入身份。
  线程数、路径和时间戳不进入检查点字节，使同程序 1/2/4 线程恢复可确定复现。
- 新 kernel 为 `nr-k3-cpp-sbp42-sat-rk4-shadow` / `0.1.0`，沿用
  `nr-run-manifest-v1` 字段结构，但与旧 FO checkpoint v1..5 有独立魔数/方法身份。
- 只写仓库 tmp 内的 E: 本地 NTFS 非 reparse 路径；CREATE_NEW 同目录 partial，
  flush 后 no-replace rename，随后核对实际文件句柄路径。已有目标和中断文件
  不覆盖、不删除。stdout manifest 是派生报告，不是和 checkpoint 的二文件事务。

SHA-256 **不是身份认证或轨迹证明**。显式重算哈希可以制造结构合法的状态；
本批有这种负控制。科学信任仍来自独立初值/演化/约束与来源审计，不来自文件
“能加载”。也不宣称断电、存储硬件故障、网络盘或恶意目录竞态已验证。

## 六组短轨迹对照

前瞻合同：[EXPERIMENT-20261010-native-checkpoint-component.md](EXPERIMENT-20261010-native-checkpoint-component.md)。
测试：[test_nr_native_checkpoint_component.py](../../scripts/tests/test_nr_native_checkpoint_component.py)。

| 场景 | 网格 | 参考步数 | C++ / Python 端点最大归一化差 |
| --- | --- | --- | --- |
| 非零起点、时间变化六面目标 | 9³ | 2 | 1.2705494208814505e-21 |
| 非等距长方体、时间变化目标 | 9×10×11 | 2 | 1.110223024461231e-16 |
| Schwarzschild 外域 | 9³ | 2 | 8.470329472543003e-21 |
| 既有规范脉冲初值 | 13³ | 2 | 2.2204459099313105e-16 |
| 平直四步上限 | 9³ | 4 | 0 |
| 网格上限平直控制 | 17³ | 1 | 0 |

共 13 个 Python 参考步、52 次实际完整 RHS，不是 13 个独立物理基准。逐 58 槽、
whole/interior/closure_band/faces/edges/corners 对比，固定门槛 2e-11。
归一化分母 max(1,对应槽/区域参考 maxabs)，这些差不是物理误差估计。

所有保存端点另与旧已资格化 RK4 可执行文件逐字节一致。每组连续 1 线程与
第一步 2 线程、随后新进程 4 线程恢复的最终文件一致；17³ 一步控制的恢复
调用只做校验。时变立方体和长方体另外在完整 1/2/4 线程各运行，文件一致，
包括独立 1 线程复测。没有跨编译器/跨机器一致性或加速比声明。

86 次原生程序调用中，新 checkpoint 程序 80 次：35 成功、42 预期拒绝、3 次
预先指定的 ExitProcess(86) 中断；另 6 次旧 RK4 对照成功。35 成功中 5 次只
校验，成功调用总计推进 49 步/196 RHS，包含重复控制，**绝不等于**旧三档
49 步科学实验/完整 Python 回放已完成。

## 失败、中断和损坏控制

1. 写到一半、flush 后未发布、发布并核对路径后三处主动结束本工具拥有的子
   进程。每次保留第一步文件；前两处仅有第二步 partial，发布后则第二步文件
   完整可校验。新进程从有效前缀继续，最终字节等于不中断控制。
2. 第二步的半步 3 输入有限但极大 K 目标，实际 SAT 产生非有限 penalty，
   在 step=1、K2、phase=stage-rhs 被拒绝；step=1 的接受检查点仍存在。
   从该文件再次继续也在同一位置拒绝，无隐式缩步/回退。
3. 翻转/截断/追加、错误魔数、来源/exe/库/方法/变量顺序改动后重新哈希、非法
   步号和字段长度、错误计划、旧格式、边界标签、线程/dt/步数等按合同拒绝。
   .partial 不允许恢复；已有 final/partial 的 sentinel 原字节保持不变。
4. 非有限/负定度量/异常 lapse 或 chi 的恢复状态拒绝；alpha>=2 与非单位 det
   的结构合法端点可做纯加载，下一 RHS 按原门槛拒绝。没有给端点偷偷加入
   原方法不存在的限制，也没有为恢复修补/投影状态。
5. 新 manifest 的方法、来源、计划、状态/文件摘要、步数/时间、变量序以及
   物理/writeback/持久性标记的篡改均被独立校验器拒绝。

这里补齐的是**端点加载校验**；尚未构造“RK4 四次 RHS 均成功、仅新端点失败”
的动态专用测试。后续还需要磁盘满/真实写失败、竞争发布、掉电与更大规模
长程重启等资格化，不能把三个人为进程中断位置覆盖成所有故障。

## 首批失败与可核查修复

v1 首项测试在计算出第一个端点后、发布前失败，0 项通过 / 1 项失败，没有
已发布恢复点。根因是 FILE_RENAME_INFO 的名字缓冲区未包含 NUL 结束字符；
原代码虽然传了 FileNameLength，Win32 仍要求 NUL 结尾。

通过 Exa 查阅 [Microsoft FILE_RENAME_INFO 合同](https://learn.microsoft.com/en-us/windows/win32/api/winbase/ns-winbase-file_rename_info)，
并运行 [独立小文件接口探针](../../scripts/probe-nr-checkpoint-rename.py)。8 组组合
分离目录锁、斜线形式和结束字符：四组有结束字符都正确落到指定文件名；
四组缺失结束字符产生非预期后缀。探针文件全部留在独立 tmp 目录，没有涉及
科学状态或旧证据。修复增加 NUL 空间、具体 Win32 错误码、发布后句柄路径核验。
沿用 [no-replace 设置](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfileinformationbyhandle)
和 [文件缓冲刷新](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers)，
不据此声称所有硬件断电持久性。

- v1 回执 SHA：`e640a0aeecb4a92653d519603d1a1f67ea9581bafa43ea00b22e013c888fb488`。
  `tmp/nr-shadow-evidence/nr-k3-native-checkpoint-component-v1-20261010/receipt.json`。
  18 个索引产物逐项复核无损坏，包含旧源快照和完整未发布 partial。
- v1 XML SHA：`2ff2d271dea5914828225e395fb6b83d4af3a3ece9e70b95262fde1893865c93`。
- v1 exe SHA：`d9e217587fc7e987770278c0c07604c73f9b4fd9a50d739bdd4aae24382cdcdf`。
- 探针结果：`tmp/nr-checkpoint-rename-probe-v1-20261010/results.json`，SHA
  `e953674d1858d337eea88537b6d19c4676f55004efff39a2a9c251fc2b81f9f8`。

## v2 资格化身份与资源

- exe：`tmp/nr-native-checkpoint-build-v2-20261010/Release/nr-checkpoint-component.exe`，
  SHA `05d06d9e19146681a27e3c6b64c420c0497adf7ae720c7ecc90db2ca8f9f688a`。
- 构建来源表：`tmp/nr-native-checkpoint-build-v2-20261010/source-identity.txt`，
  SHA `283c6279d4447860f4e34872bd056203ac5f9c286c532c1800360dee6f9c5af5`。
- 回执：`tmp/nr-shadow-evidence/nr-k3-native-checkpoint-component-v2-20261010/receipt.json`，
  SHA `27cd78270b28d7f526e5bdde0b11bcfa66bebe9e4f53a0ae0c9fb8ad8b1db74e`。
- XML：`tmp/nr-native-checkpoint-component-v2-20261010.xml`，
  SHA `63465e20fab3c5fe3448446292dc2394116768152f55a6c31a055f87a631fc45`；
  60 项，XML 507.305 秒，fixture 505.531 秒。
- 独立参考 XML：`tmp/nr-native-checkpoint-reference-v1-20261010.xml`，
  SHA `ead3d941bbb722cfff980e0d0474cab4b22f3a32942c77c067db21a9778a0fd6`；
  123 项，2.204 秒。模块为 SBP nonlinear、gauge pulse、manifest、auxiliary manifest。

Windows x64 / MSVC 19.44.35224.0 / SDK 10.0.26100.0 / C++17 /fp:strict，
OpenMP2.0，固定 OpenBLAS1。实际 OpenBLAS SHA `6547e9fb966e9773caee2755e91a8bf4d6f3a2f0eebf9646b0158f8675ea4ab5`，
OpenMP SHA `95d4ce4a6802d1e18b5e0e1722cc30ea72ca7e033f83828f05c0b7b993fe7cbf`。
未安装新工具，未验证 GPU。

448 个索引产物加回执共 449 文件 / 377434583 字节，低于 768 MiB；全部重算
SHA 无不符。19 个当前来源、4 个生成片段、374 个继承来源键，合并去重 380 个
当前来源键（后续Windows路径别名归一确认对应378个物理文件），before/after
与事后核对均无漂移；exe、两个运行库及旧 RK4 exe
同样未变。没有把历史 51/72/68/134/46/2126 等测试数算成本轮重跑。

测试中 E 盘空闲量曾明显下降，批次始终未跨越原底线及额外完整预算。最后
只读快照 C≈7.37 GiB、E≈5.03 GiB，随其他工作变化，不视为下一批预算批准。
没有清理文件。以后复跑必须选新证据/XML/build 路径，显式配置
`NR_NATIVE_CHECKPOINT_EXE` 与 `NR_NATIVE_CHECKPOINT_EVIDENCE`，不可覆盖本批。

## 下一步和仍未关闭的门槛

1. 将受限组件接入有完整阶段/约束诊断、前缀审计和计划链来源绑定的原生科学
   runner。当前完整计划只 1..4 步，不能直接冒充 7/14/28 步全程资格化。
2. 在当前磁盘余量下先做前瞻产物/运行预算，再拟定原生共同终点时间、空间和
   独立约束收敛实验；任何分段计划都必须核验初值、dt、边界计划和前驱摘要。
3. 原规范脉冲 faces 差仍低于旧分辨底线、完整 Python 回放仍未完成。移植对等
   不修复这两点，不自动把整体科研评级提升或把预计轮次机械减一。
4. 强场长程黑洞、生产级 AMR、视界/ADM/非零 Psi4 闭环、独立外部基准和 GPU
   仍在后续。美术和 live EIH 未改；scientificPayloadWriteback/live/physical=false。

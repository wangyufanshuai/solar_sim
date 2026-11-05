# 原生 SBP/SAT/RK4 检查点：前瞻合同

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: bounded implementation and deterministic restart validation
- Origin Date: 2026-10-10
- Verification Status: PLANNED; NO PHYSICAL ADMISSION
- Version Label: nr-native-checkpoint-component-v1

## 不改变已验证方法

复用原生 RK4、SAT、SBP、FO 方程源文件，不编辑已资格化组件。每轴 9..17 点，
原始计划仍为 1..4 步，整数半步标签和全部未来六面目标随计划原字节保存。
不扩大科学运行、不重启完整 Python 回放。每次只推进计划内请求步数；advance=0
仅允许校验已有检查点。全部 58 槽恢复，不投影、不重建辅助量、不自动缩步。

新 kernel_id 为 nr-k3-cpp-sbp42-sat-rk4-shadow，version=0.1.0；方法 ID 沿用
nr-fo-ccz4-sbp42-analytic-sat-rk4-no-projection-v1。沿用 nr-run-manifest-v1
通用字段，但不改/不冒用旧周期/固定 halo 的 FO checkpoint v1..5 校验器。
所有物理/live 门禁保持 false，scientificPayloadWriteback=false。

## 格式与发布

小端文件：16 字节 NR-SBP42-CKPT-1\n，u64 binding 长度，ASCII binding，
u64 已接受全局步号，u64 原始计划长度，计划，u64 状态字节数，canonical58
FP64 槽优先状态，32 字节此前全部字节的 SHA-256。总长度上限 32 MiB。
binding 固定顺序记录 release、method、kernel/version、源码集合 SHA、实际 exe
SHA、实际加载 BLAS/OpenMP SHA、固定参数合同和完整变量顺序。不绑定线程数、
输出路径、时钟；同程序 1/2/4 线程分段计算的检查点必须逐位一致。
启动/恢复要求外部提供原计划 SHA，绑定错误计划不得继续。源码集合包含新代码、
测试、本协议、所有原生依赖和共享 manifest；由构建时生成身份文件逐项列出。
哈希是未加密的完整性/错配检测，不是身份认证或物理正确性证书。

仅输出到本仓库 tmp 下已存在、无 reparse point 的 E: 本地 NTFS 目录。
每个接受端点先用已验证端点规则检查，写 CREATE_NEW 同目录 .partial，
FlushFileBuffers，再用 FileRenameInfo 的 ReplaceIfExists=false 发布为 .nrck。
不覆盖已有终点，不删除中断文件；已发布前缀在后续失败后保留。失败报告最后
检查点、尝试步骤/阶段/半步和 phase。checkpoint 自包含；stdout manifest 是
派生报告，与文件不构成二文件事务。恢复不依赖旧 stdout 或 sidecar。

Windows API 依据（Exa 查阅官方资料，2026-10-10）：

- [SetFileInformationByHandle](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfileinformationbyhandle)
- [FILE_RENAME_INFO](https://learn.microsoft.com/en-us/windows/win32/api/winbase/ns-winbase-file_rename_info)
- [FlushFileBuffers](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers)

本批验证进程中断时的完整文件发布，不声称所有硬件断电、目录元数据持久化、
网络盘或恶意并发目录替换具有同样保证。测试故障钩子只终止本工具启动的子进程，
在写到一半、flush 后、rename 后触发 ExitProcess(86)，不终止用户其他进程。

## 固定验收门槛

- 非平凡时间变化边界、长方体、Schwarzschild/规范脉冲：连续和真实新进程
  恢复及 1/2/4 线程最终文件逐字节相同。至少一次独立重复进程。
- 原生端点与已资格化 RK4 可执行文件逐位相同；与 Python 实际完整方程短轨迹
  按 58 槽、whole/interior/closure_band/faces/edges/corners 误差 <=2e-11。
- 独立 Python 格式/manifest 校验；原始计划、几何、步数、时间、状态、方法、
  源码、exe、运行库、变量顺序均与文件对应。改错元数据再重算总哈希仍拒绝。
- 翻转/截断/额外尾字节、非法步号/长度/标签、错误计划摘要、旧格式、.partial、
  非有限/非 SPD/非法 lapse/chi 端点必须拒绝。端点 alpha>=2 或非单位 det 本身
  不拒绝；下一次 RHS 按原规则拒绝，不添加端点物理限制。
- 后续真实 RHS 失败保留首个接受点；三处进程中断验证有效前缀、partial 保留，
  发布后文件可由新进程校验/继续。已有目标或 partial 不覆盖，旧字节不变。
- before/after 所有源/依赖/库/可执行文件不变；零失败、零跳过才资格化。
  测试失败留存，修正后使用新批次，不改旧阈值。

## 预算与停止条件

Windows MSVC C++17 /fp:strict，OpenMP 1/2/4，BLAS 1。构建每阶段 120 秒，
单原生调用 120 秒，整批 1200 秒，证据 768 MiB。C>=3 GiB；E>=4 GiB+32 MiB
并另留完整批次预算。原生每步检查底线加本次完整文件预算。全部新产物/temp 在 E。
不足/超时停止并保留前缀，不清理、不放宽阈值。本批仍不是长程重放、时间/空间/
约束收敛、物理边界、AMR、黑洞波形、GPU 或 live 验证。

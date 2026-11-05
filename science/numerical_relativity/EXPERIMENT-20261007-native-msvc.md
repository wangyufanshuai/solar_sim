# Windows 原生科研后端：工具链恢复与复跑

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: implement and validate
- Origin Date: 2026-10-07
- Verification Status: LOCAL_VERIFIED — native build/probe/legacy replays passed; scientific promotion blocked
- Version Label: native_msvc_v1
- Scope: legacy fixed-gauge CPU shadow; no live/art/scientific payload changes

## 用户选择与环境诊断

用户明确选择 Windows 原生后端，优先配置已有工具链，不先安装新工具。
普通 PATH 中的旧 `C:\mingw64\bin\g++.exe` 8.1.0 能报告版本，但 C++ 前端
`cc1plus.exe` 启动返回 `0xC0000135`；仅把其 bin 加入本进程 PATH 未解决。
没有删除、覆盖或修复该安装，也没有推断出具体缺失 DLL 的名字。

之前工具链收据中的 `cl` 缺失只是 **PATH 查找结果**，不等于未安装。
通过已安装的 `vswhere` 查到：

`C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools`

其原生 CMake 生成器识别 MSVC `19.44.35224.0`、Windows SDK `10.0.26100.0`、
OpenMP `2.0`。所有配置均限于新建的构建目录，没有修改系统 PATH、注册表或 Codex 配置。

## 可复跑入口

```powershell
python scripts/run-nr-k2-native-msvc.py --output-directory E:\CodexData\nr-k2-native-msvc-audit-20261007
```

必须使用**不存在的新目录**；脚本不覆盖旧收据，不清理历史产物，不安装软件。
自动发现 VS 2022，也可用 `--vs-install` 明确指定已有安装；固定 x64 目标、
v143/x64 host 工具集与具体 VS instance，避免静默使用损坏的 MinGW。

1. 独立 C++17/binary64 探针要求 OpenMP，不允许串行降级。
2. 实际运行 4 个 worker，核对 team 大小、各线程参与位图和整数运算结果。
3. 重新构建原有三个 shadow C++ 可执行文件。
4. 复跑 58 槽解析合同及旧固定规范的 FO-CCZ4 动态 RHS 对照。
5. 核对直接/分段重启、1/4 线程 checkpoint 字节与 manifest、错误场景拒绝。
6. 保留源码前后 SHA-256、可执行文件 SHA-256、构建日志、验证 JSON 与失败状态。

探针的 `/fp:strict` 只适用于探针；没有改变已有求解器的浮点编译选项。
源码一致性检查涵盖科研 Python/C++ 源码、CMake 与本次两个验证脚本。
它只证明一次冻结构建的边界，不是可在不同编译器间逐位复现的承诺。

## 已测结果与边界

初次独立构建目录 `E:\CodexData\nr-k2-native-msvc-20261007` 已生成三个 exe。
58 槽解析状态与 Python 最大绝对差异 `3.681950577760773e-16`；
旧固定规范 8 步动态状态差异 `5.633785538777802e-16`；
off-constraint ordering fixture 差异 `4.546198141267652e-17`。
两类检查的 checkpoint/manifest 重启与 1/4 线程一致性、场景不匹配拒绝均通过。

正式打包审计也已通过，耗时 `27.44 s`，源码前后指纹一致，输出为
`E:\CodexData\nr-k2-native-msvc-audit-20261007\receipt.json`。
收据 SHA-256：`6825dd9f4b6d2540edd560cdbb68d708904b637de579f2ba920a3edc3a006ed7`。
实测 `__cplusplus=201703`、`_OPENMP=200203`、`_MSC_FULL_VER=194435224`、
64 位指针、4/4 个 worker，参与位图 `15`，整数校验和 `5559680` 正确。
旧固定规范的两个 replay 均通过，误差与上面初次构建相同。
正式 FO solver exe 的 SHA-256 为
`1315df888bba62a66dee9e134a5c64e9ffaa6ef1959d59d4e9dab540c7c39558`。
10 项新增审计守卫测试通过，静态检查通过；不存在自动安装和系统配置修改。

以下仍然为 false：

- 新 `f=3 alpha chi, mu=.2 chi` 规范的 C++/磁盘 checkpoint 支持与验证；
- 强双曲性、CPBC、长期黑洞演化与物理科学有效性；
- CUDA 可用性、live 推广、`scientificPayloadWriteback`。

没有声称修好了旧 MinGW；当前采用已安装且能真实运行的 MSVC。

## 外部依据

[CMake 的 VS 2022 生成器文档](https://cmake.org/cmake/help/latest/generator/Visual%20Studio%2017%202022.html)
说明 instance、目标架构与 host toolset 的显式选择。
[Microsoft 原生命令行工具文档](https://learn.microsoft.com/en-us/cpp/build/building-on-the-command-line?view=msvc-170)
区分直接编译器环境与 MSBuild 原生项目环境；本次使用后者，不手工拼接系统级变量。
这些文档只是配置依据，不替代本机实际构建和执行证据。

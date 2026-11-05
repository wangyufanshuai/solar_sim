# Orbit Atlas v192 异机安装 QA

目标：在另一台 Windows 11 x64 电脑上完成 MSI 与 NSIS 的安装、启动、退出、卸载和重装验证。两种安装器必须分开测试；完成一种并卸载后，再测试另一种。

## 待测文件与 SHA-256

- NSIS：`Solar Atlas_1.0.0_x64-setup.exe`
  - 字节数：`93330897`
  - SHA-256：`5d1d8ed926fa081c22f10cca1a33648296b7fe8af2f325ac7b64bb374a88cf3a`
- MSI：`Solar Atlas_1.0.0_x64_en-US.msi`
  - 字节数：`113135824`
  - SHA-256：`449b1f5085809f9ed4078f74b8dd14239371d549527fe81ab43f3a055f643d87`

在测试电脑上先运行：

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath '.\Solar Atlas_1.0.0_x64-setup.exe'
Get-FileHash -Algorithm SHA256 -LiteralPath '.\Solar Atlas_1.0.0_x64_en-US.msi'
```

哈希不一致时立即停止，不要安装。

## 推荐测试环境

- Windows 11 x64，优先使用一个新建的一次性本地用户；用户名可包含中文，安装器所在路径可包含中文和空格。
- 测试前记录系统版本、WebView2 Runtime 版本、GPU 和可用内存。
- 安装器未签名，Windows SmartScreen 警告属于已知限制；仅在哈希完全匹配时继续。
- 不启用自动更新，不连接任何非必要账户。

## 每个安装器的测试步骤

1. 安装：记录是否出现 WebView2 bootstrap、安装耗时、安装目录与任何错误码。
2. 首次启动：确认主窗口出现、单 Canvas 正常、V9 天空与行星纹理加载、无 Renderer Fault。
3. 核心旅程：依次打开图谱、对象检查、发射控制、相对论核心、Scene Lab；发射只做本地开始与中止。
4. 缺包降级：不要手工删除冻结资产；只验证 UI 对未安装可选包的能力说明与降级提示。
5. 正常退出：等待 5 秒，确认没有残留 `solar-atlas-desktop.exe`，没有由应用启动的残留 `node.exe`，本地服务端口已释放。
6. 卸载：确认安装目录被移除；保留或删除用户数据的行为需记录。检查临时目录、快捷方式和开始菜单项。
7. 重装：再次安装并启动，确认不依赖上一次残留状态。
8. 卸载完成后，再测试另一种安装器。

进程与端口检查示例：

```powershell
Get-Process solar-atlas-desktop,node -ErrorAction SilentlyContinue
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.OwningProcess -in (Get-Process solar-atlas-desktop,node -ErrorAction SilentlyContinue).Id }
```

## 回传结果模板

```text
Windows 版本：
WebView2 版本：
GPU / RAM：
测试路径：

NSIS 哈希：通过/失败
NSIS 安装：通过/失败
NSIS 首启与旅程：通过/失败
NSIS 退出清理：通过/失败
NSIS 卸载：通过/失败
NSIS 重装：通过/失败

MSI 哈希：通过/失败
MSI 安装：通过/失败
MSI 首启与旅程：通过/失败
MSI 退出清理：通过/失败
MSI 卸载：通过/失败
MSI 重装：通过/失败

错误码、截图和日志路径：
```

只有上述两套矩阵都通过后，才能清除 `desktop-install-qa` blocker 并考虑应用最终 v192 双端 RC 标签。

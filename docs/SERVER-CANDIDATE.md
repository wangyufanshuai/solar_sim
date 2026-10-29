# Ubuntu / Debian：Node.js + Nginx 候选部署

此分支承载 A 线 12 恒星、12 星座、12 星云的服务器候选源码，基于远端 main 创建。应用文件取自 Build15 已验收的 formal-lite 运行目录，连同该构建原有的运行依赖按原字节保存；没有对原工作区的并行改动执行提交、重置或覆盖。来源见 deploy/source-snapshot.json。

Build15 原本的桌面／移动模拟矩阵、两次独立 30 分钟观察属于原 Windows 构建。Linux 重建会产生新的构建身份，需要重新验证；本分支不继承服务器性能、实体设备、人工美术、最终权利或公开发布批准。candidate-only / hold / not-admitted / scientificPayloadWriteback=false 保留。

## 文件与资源

- 源码：分支 codex/mainline-a-server-candidate；必须固定提交后构建。
- 静态资源：solar-mainline-a-public-20261029.tgz，约 2.12 GB 原始数据的压缩包，另行传输。完整 SHA-256 见 deploy/public-archive.json；逐文件清单为 deploy/public-assets.json。
- 静态包保留当前候选运行所需资源；普通 Git clone 只有历史仓库资源及 A 线图片，不能当作完整资源安装。
- Node.js 使用 24.x。建议构建主机至少 8 GiB 内存、至少 15 GiB 可用磁盘；这是部署容量建议，不是已测得的服务器性能。
- 不上传 .env.local、node_modules 或 Windows .next 到 Linux；服务器运行 npm ci 和专用构建命令。

## 服务器准备

以下操作在具有管理员权限的 Ubuntu / Debian 服务器执行。先按 Node.js 官方安装途径安装 24.x，并确认 node 与 npm；systemd 示例默认 node 位于 /usr/bin/node，若不同，修改 ExecStart 的路径。

```bash
sudo apt-get update
sudo apt-get install -y git nginx ca-certificates
sudo useradd --system --create-home --home-dir /srv/solar --shell /usr/sbin/nologin solar
sudo install -d -o solar -g solar /srv/solar/releases
sudo -u solar git clone --branch codex/mainline-a-server-candidate --single-branch https://github.com/wangyufanshuai/solar_sim.git /srv/solar/releases/candidate-01
```

若 solar 用户已经存在，跳过 useradd。用 scp 将资源包传到服务器可读位置，按清单 SHA-256 核对后，在候选目录解压：

```bash
cd /srv/solar/releases/candidate-01
sha256sum /path/to/solar-mainline-a-public-20261029.tgz
sudo -u solar tar -xzf /path/to/solar-mainline-a-public-20261029.tgz -C /srv/solar/releases/candidate-01
sudo -u solar npm ci
sudo -u solar npm run verify:server-assets
sudo -u solar npm run build:server-candidate
```

资源验证不通过时停止构建，补齐清单中的文件。专用构建启用 TypeScript 检查，采用与原 formal-lite 相同的研究路由排除范围；不会伪造缺失的科学 manifest，也不会忽略 TypeScript 错误。构建成功后生成 deploy/linux-build-receipt.json，复制 public 和 .next/static 为实际文件目录，运行时不依赖原 Windows 链接。

每次升级在新的 release 目录构建。构建完成再建立 current 链接；保留上个 release，回退时恢复链接并重启服务。

```bash
sudo ln -s /srv/solar/releases/candidate-01 /srv/solar/current
sudo cp deploy/solar-sim.service /etc/systemd/system/solar-sim.service
sudo systemctl daemon-reload
sudo systemctl enable --now solar-sim
sudo cp deploy/solar-sim.nginx.conf /etc/nginx/sites-available/solar-sim
sudo ln -s /etc/nginx/sites-available/solar-sim /etc/nginx/sites-enabled/solar-sim
sudo nginx -t
sudo systemctl reload nginx
curl --fail http://127.0.0.1:3151/ > /dev/null
curl --fail http://127.0.0.1:8080/ > /dev/null
```

示例仅监听服务器回环地址，不改变其他站点配置。若 current 或 sites-enabled 链接已经存在，先核对其用途，勿直接覆盖。用 SSH 隧道从本机预览：

```bash
ssh -L 8080:127.0.0.1:8080 your-ssh-alias
```

随后在本机打开 http://127.0.0.1:8080。本地候选图片默认关闭；需要在私有预览中查看图片时，在 /etc/solar-sim.env 写入 ATLAS_MAINLINE_A_LOCAL_REVIEW_IMAGES=1 后重启 solar-sim。不要将该文件加入 Git。

## 服务器验收

通过隧道检查 Sirius A、Orion、M42 的桌面与移动视口，完成猎户座五站旅程，核对星云放大、来源、署名、关闭与返回。检查网络面板中的静态文件请求和浏览器错误，并记录 deploy/linux-build-receipt.json 中的新 buildId。仅 HTTP 200 或服务启动不代表这些流程通过。

systemd 故障查看 journalctl -u solar-sim -n 100 --no-pager；Nginx 修改先运行 nginx -t。HTTPS、域名及公开访问在确定实际服务器与域名后配置。本次没有操作远端服务器，也没有开启公开发布。

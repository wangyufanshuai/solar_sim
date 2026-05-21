# Solar Sim Next Web

这是 Solar Sim 的主前端应用，基于 Next.js、React Three Fiber、Three.js 和 TypeScript 构建。完整项目技术说明见仓库根目录 [`README.md`](../README.md)。

## 快速运行

```powershell
npm install
npm run dev
```

打开：

```text
http://127.0.0.1:3001/
```

## 常用命令

```powershell
npm run dev
npm run dev:3000
npm run dev:3002
npm run build
npm run start
npm run build-sky
```

## 技术重点

- Next.js App Router + TypeScript
- React Three Fiber + Three.js 太阳系场景
- Web Worker + SharedArrayBuffer 物理运行时
- Newton / Economy / Full 1PN 物理精度档位
- 8K 本地天球背景，支持 4K fallback
- 高清行星贴图、近景锁定、自转、轨道和标签
- 本地发射流程、火焰尾迹、目标线和发射相机
- 科学遥测面板和导出能力

## 背景资源

8K 背景由以下命令生成：

```powershell
npm run build-sky
```

构建脚本会下载 NASA SVS Deep Star Maps 2020 与 ESO/S. Brunier Milky Way panorama，输出：

```text
public/textures/sky/universe-sandbox-sky-8k.jpg
```

大型源文件缓存在 `.cache/sky-sources`，不会进入仓库。

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";
import { M2_FOCUS_IDS } from "./capture-mainline-a-m2-browser.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "output/playwright/mainline-a-m2-20261015");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const html = (text) => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const json = async (name) => JSON.parse(await readFile(path.join(output, name), "utf8"));
const before = await json("before/receipt.json");
const after = await json("after/receipt.json");
const status = "passed-a12-two-viewports-default-and-comparison-candidate-only";
if ([before, after].some((receipt) => receipt.status !== status || receipt.items.length !== 24)) {
  throw new Error("Both complete A12 browser receipts are required");
}
const key = (item) => `${item.device}-${item.id}`;
const originals = new Map(before.items.map((item) => [key(item), item]));
if (originals.size !== 24 || new Set(after.items.map(key)).size !== 24) throw new Error("Duplicate stellar views");
const comparisons = path.join(output, "comparisons");
await mkdir(comparisons, { recursive: true });
const names = { "sirius-a": "Sirius A · 天狼星 A", betelgeuse: "Betelgeuse · 参宿四", vega: "Vega · 织女星", achernar: "Achernar · 水委一" };
const manifest = { schema: "mainline-a-m2-browser-comparisons-v1", createdAt: new Date().toISOString(),
  sourceImages: "actual-browser-viewport-captures", processing: "unmodified-source-images-placed-side-by-side-in-html",
  beforeBuild: before.build, afterBuild: after.build, beforeReceiptSha256: sha(await readFile(path.join(output, "before/receipt.json"))),
  afterReceiptSha256: sha(await readFile(path.join(output, "after/receipt.json"))), comparisons: [],
  claims: { humanVisualSignoff: false, physicalDevice: false, scientificValidity: false, publicReleaseApproved: false } };
const { chromium } = await import("playwright");
const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
try {
  for (const item of after.items.filter((item) => M2_FOCUS_IDS.includes(item.id))) {
    const original = originals.get(key(item));
    if (!original) throw new Error(`Missing baseline ${key(item)}`);
    for (const view of item.views) {
      const baseline = original.views.find((entry) => entry.mode === view.mode);
      if (!baseline || baseline.observed.selectedId !== view.observed.selectedId
        || JSON.stringify(baseline.observed.viewport) !== JSON.stringify(view.observed.viewport)) {
        throw new Error(`View identity mismatch ${key(item)}:${view.mode}`);
      }
      const [width, height] = view.observed.viewport;
      const sources = [];
      for (const entry of [baseline, view]) {
        const filename = path.resolve(root, entry.screenshot.path);
        if (!filename.startsWith(output + path.sep)) throw new Error("Image outside M2 evidence directory");
        const bytes = await readFile(filename);
        const metadata = await sharp(bytes).metadata();
        if (sha(bytes) !== entry.screenshot.sha256 || metadata.width !== width || metadata.height !== height) {
          throw new Error(`Source image binding mismatch ${filename}`);
        }
        sources.push({ path: entry.screenshot.path, sha256: sha(bytes), url: pathToFileURL(filename).href });
      }
      const stem = `${key(item)}-${view.mode}`;
      const title = `${names[item.id]} · ${item.device === "desktop" ? "桌面" : "移动模拟视口"} · ${view.mode === "default" ? "默认场景" : "主动展开比较"}`;
      const body = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${html(title)}</title>
<style>*{box-sizing:border-box}body{margin:0;width:${width * 2 + 64}px;background:#080e14;color:#e8edf3;font:14px "Segoe UI","Microsoft YaHei",sans-serif}header{height:92px;padding:20px 24px}h1{margin:0 0 10px;font-size:21px}header p{margin:0;color:#99aabd}main{display:flex;gap:16px;margin:0 24px}section{width:${width}px}h2{margin:0;height:36px;font-size:14px;color:#b9cad9}img{display:block;width:${width}px;height:${height}px}footer{height:46px;padding:14px 24px;font-size:12px;color:#93a4b4}</style>
<header><h1>${html(title)}</h1><p>真实运行画面 · 左：M1 基线 / 右：M2 共享恒星表现 · 原图保持 ${width} × ${height} 像素</p></header>
<main>${sources.map((source, index) => `<section><h2>${index ? "M2 · 改动后" : "M1 · 改动前"}</h2><img src="${html(source.url)}" alt="${index ? "改动后" : "改动前"}"></section>`).join("")}</main>
<footer>候选效果 · 参数化艺术示意，非真实观测表面 · 未进行人工视觉签收、真机验收或公开发布</footer></html>`;
      const filename = path.join(comparisons, `${stem}.html`);
      await writeFile(filename, body, { flag: "wx" });
      const page = await browser.newPage({ viewport: { width: width * 2 + 64, height: height + 174 }, deviceScaleFactor: 1 });
      try {
        await page.goto(pathToFileURL(filename).href, { waitUntil: "load" });
        await page.locator("img").evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
        const png = await page.screenshot({ type: "png" });
        const imagePath = path.join(comparisons, `${stem}.png`);
        await writeFile(imagePath, png, { flag: "wx" });
        manifest.comparisons.push({ id: item.id, device: item.device, mode: view.mode, title,
          path: path.relative(root, imagePath).replaceAll("\\", "/"), sha256: sha(png), width: width * 2 + 64,
          height: height + 174, sources: sources.map(({ url, ...source }) => source) });
      } finally { await page.close(); }
    }
  }
} finally { await browser.close(); }
if (manifest.comparisons.length !== 16) throw new Error("Incomplete focus comparison matrix");
const gallery = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M2 恒星主线实际运行对照</title>
<style>body{margin:0;background:#080e14;color:#e8edf3;font:15px/1.7 "Segoe UI","Microsoft YaHei",sans-serif}main{max-width:1440px;margin:auto;padding:28px}h1{font-size:28px;margin:0}p{color:#9eafc0}a{color:#9fd5f5}section{margin:32px 0}img{display:block;max-width:100%;height:auto;border:1px solid #263542}details{margin-top:16px}summary{cursor:pointer;padding:10px;border:1px solid #263542}table{width:100%;border-collapse:collapse}td,th{text-align:left;border-bottom:1px solid #263542;padding:9px}code{overflow-wrap:anywhere}</style>
<main><h1>M2 · 恒星主线实际运行对照</h1><p>Sirius A、Betelgeuse、Vega、Achernar 的桌面与移动模拟视口。每张对照保持原始截图像素；默认场景与主动比较分别展示。</p>
<p>构建 ${html(before.build.buildId)} → ${html(after.build.buildId)}。A12 两视口共 48 个场景/比较状态通过浏览器检查，另检查 4 个目录别名入口。候选效果；人工视觉、真机、权利签核未完成。</p>
${manifest.comparisons.filter((entry) => entry.mode === "default").map((entry) => {
  const detail = manifest.comparisons.find((candidate) => candidate.id === entry.id && candidate.device === entry.device && candidate.mode === "comparison");
  const relative = path.relative(output, path.resolve(root, entry.path)).replaceAll("\\", "/");
  const detailRelative = path.relative(output, path.resolve(root, detail.path)).replaceAll("\\", "/");
  return `<section><h2>${html(entry.title)}</h2><a href="${relative}"><img loading="lazy" src="${relative}" alt="${html(entry.title)}"></a><details><summary>展开：同一对象的图鉴比较前后对照</summary><a href="${detailRelative}"><img loading="lazy" src="${detailRelative}" alt="${html(detail.title)}"></a></details></section>`;
}).join("")}
<section><h2>A12 全量原图</h2><table><thead><tr><th>对象 / 视口</th><th>默认场景</th><th>主动比较</th></tr></thead><tbody>${after.items.map((item) => `<tr><td>${html(item.id)} / ${html(item.device)}</td>${item.views.map((view) => `<td><a href="${html(path.relative(output, path.resolve(root, view.screenshot.path)).replaceAll("\\", "/"))}">改动后原图</a> · <a href="before/${item.device}-${item.id}-${view.mode}.png">改动前原图</a></td>`).join("")}</tr>`).join("")}</tbody></table></section>
<p><a href="comparison-manifest.json">对照图与原图 SHA256 清单</a> · <a href="after/receipt.json">浏览器检查记录</a></p></main></html>`;
await writeFile(path.join(output, "comparison-gallery.html"), gallery, { flag: "wx" });
await writeFile(path.join(output, "comparison-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify({ status: "rendered-actual-browser-comparisons", comparisons: 16,
  gallery: path.join(output, "comparison-gallery.html") }));

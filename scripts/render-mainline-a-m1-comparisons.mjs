import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(root, "output/playwright/mainline-a-m1-20261014");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const escape = (text) => String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const json = async (name) => JSON.parse(await readFile(path.join(directory, name), "utf8"));
const names = { "sirius-a": "Sirius A · 天狼星", Ori: "Orion · 猎户座", m42: "M42 · 猎户座大星云" };
const before = await json("before/receipt.json");
const after = await json("after/receipt.json");
if ([before, after].some((r) => r.status !== "passed-six-real-browser-views-candidate-only" || r.items.length !== 6)) {
  throw new Error("Both complete six-view browser receipts are required");
}
const key = (item) => `${item.device}-${item.scene.name}`;
const baseline = new Map(before.items.map((item) => [key(item), item]));
if (baseline.size !== 6 || new Set(after.items.map(key)).size !== 6) throw new Error("Duplicate views");
const output = path.join(directory, "comparisons");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true, args: ["--disable-background-networking"] });
const comparisons = [];
try {
  for (const item of after.items) {
    const original = baseline.get(key(item));
    if (!original || original.scene.selectedId !== item.scene.selectedId
      || JSON.stringify(original.observed.viewport) !== JSON.stringify(item.observed.viewport)) {
      throw new Error(`Pair identity mismatch: ${key(item)}`);
    }
    const [width, height] = item.observed.viewport;
    const sources = [];
    for (const entry of [original, item]) {
      const absolute = path.resolve(root, entry.screenshot.path);
      if (!absolute.startsWith(directory + path.sep)) throw new Error("Screenshot outside M1 evidence");
      const bytes = await readFile(absolute);
      const metadata = await sharp(bytes).metadata();
      if (sha(bytes) !== entry.screenshot.sha256 || metadata.width !== width || metadata.height !== height) {
        throw new Error(`Screenshot hash or dimensions changed: ${key(entry)}`);
      }
      sources.push({ url: pathToFileURL(absolute).href, ...entry.screenshot });
    }
    const title = names[item.scene.name];
    const content = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${escape(title)} · M0 / M1</title>
<style>*{box-sizing:border-box}body{margin:0;padding:24px;background:#0b1118;color:#e9eef3;font-family:"Segoe UI","Microsoft YaHei",sans-serif}header{display:flex;align-items:center;justify-content:space-between;height:44px}h1{margin:0;font-size:20px;font-weight:600}header span{font-size:13px;color:#9ab2c2}.pair{display:grid;grid-template-columns:${width}px ${width}px;gap:16px}figure{margin:0}figcaption{height:36px;display:flex;align-items:center;font-size:13px;color:#bdd2df}img{display:block;width:${width}px;height:${height}px}footer{height:46px;display:flex;align-items:center;font-size:12px;color:#9eb0bc}</style>
<header><h1>${escape(title)}</h1><span>${item.device === "desktop" ? "桌面" : "移动视口"} · ${width} × ${height}</span></header>
<div class="pair"><figure><figcaption>改动前 · M0 复现的 R80 构建</figcaption><img src="${escape(sources[0].url)}" alt="改动前真实浏览器截图"></figure><figure><figcaption>改动后 · M1 生产构建</figcaption><img src="${escape(sources[1].url)}" alt="改动后真实浏览器截图"></figure></div>
<footer>两侧均为实际运行的完整视口截图；原图像素未修改。此图是对照排版，候选状态与版权待审边界保持。</footer></html>`;
    const htmlPath = path.join(output, `${key(item)}.html`);
    await writeFile(htmlPath, content, { flag: "wx" });
    const context = await browser.newContext({ viewport: { width: width * 2 + 64, height: height + 174 }, deviceScaleFactor: 1 });
    try {
      const page = await context.newPage();
      await page.goto(pathToFileURL(htmlPath).href);
      await page.locator("img").evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
      const bytes = await page.screenshot({ fullPage: true, animations: "disabled" });
      const screenshot = path.join(output, `${key(item)}.png`);
      await writeFile(screenshot, bytes, { flag: "wx" });
      comparisons.push({ key: key(item), title, viewport: [width, height],
        path: path.relative(root, screenshot).replaceAll("\\", "/"),
        bytes: bytes.length, sha256: sha(bytes), sourceScreenshots: sources.map(({ url: _url, ...pin }) => pin),
        composition: "browser-rendered-side-by-side-original-pixels-unmodified" });
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
const gallery = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Solar Sim · M0 / M1 实拍对照</title><style>body{margin:0;padding:32px;background:#0b1118;color:#dfeaf1;font:15px/1.7 "Segoe UI","Microsoft YaHei",sans-serif}main{max-width:1600px;margin:auto}h1{font-size:26px}p{color:#a8bdcb}nav{display:flex;flex-wrap:wrap;gap:16px}a{color:#bce7f0}section{margin:40px 0}img{display:block;max-width:100%;height:auto;border:1px solid #324350}h2{font-size:18px}small{color:#98afbf}</style><main><h1>Solar Sim · 三场景实拍对照</h1><p>2026-10-14—15 · 六组桌面 / 移动视口。左侧为改动前复现，右侧为 M1 生产构建。可点击图像查看原尺寸。</p><nav>${comparisons.map((c) => `<a href="#${c.key}">${escape(c.title)} · ${c.key.startsWith("desktop") ? "桌面" : "移动"}</a>`).join("")}</nav>${comparisons.map((c) => `<section id="${c.key}"><h2>${escape(c.title)} · ${c.key.startsWith("desktop") ? "桌面" : "移动视口"}</h2><a href="comparisons/${c.key}.png"><img src="comparisons/${c.key}.png" alt="${escape(c.title)}改动前后对照"></a><small>真实浏览器原图并排排版；模拟移动视口，不代表实体设备验收。</small></section>`).join("")}<p>工程与代理视觉检查不代替逐项人工签核。候选、版权待审、科学载荷不回写边界保留。</p></main></html>`;
await writeFile(path.join(directory, "comparison-gallery.html"), gallery, { flag: "wx" });
await writeFile(path.join(directory, "comparison-manifest.json"), JSON.stringify({
  createdAt: new Date().toISOString(), status: "six-verified-browser-screenshot-pairs",
  beforeRunId: before.runId, afterRunId: after.runId, comparisons,
}, null, 2), { flag: "wx" });
console.log(JSON.stringify({ comparisons: comparisons.length, gallery: path.relative(root, path.join(directory, "comparison-gallery.html")) }));

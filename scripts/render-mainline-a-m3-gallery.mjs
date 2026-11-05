import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = "output/playwright/mainline-a-m3-20261015";
const A12 = ["m42", "m1", "m8", "m16", "m20", "m57", "ngc7293", "ngc6543", "ngc2237", "ngc6960", "carina", "b33"];
const NAMES = { m42: "M42 · 猎户座星云", m1: "M1 · 蟹状星云", m8: "M8 · 礁湖星云", m16: "M16 · 鹰状星云",
  m20: "M20 · 三裂星云", m57: "M57 · 环状星云", ngc7293: "NGC 7293 · 螺旋星云", ngc6543: "NGC 6543 · 猫眼星云",
  ngc2237: "NGC 2237 · 玫瑰星云", ngc6960: "NGC 6960 · 面纱星云", carina: "Carina · 船底座星云", b33: "B33 · 马头星云" };
const MODES = { default: "默认场景", sources: "场景来源", "viewer-fit": "1× 完整构图", "viewer-2x": "2× 局部", "viewer-sources": "放大页来源与署名" };
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const ensure = (value, message) => { if (!value) throw new Error(`m3-gallery:${message}`); };
const deviceLabel = (device) => device === "desktop" ? "桌面 · 1280 × 720" : "移动模拟视口 · 390 × 844";

/** Read original bytes; never resize, repaint, transcode or synthesize an evidence image. */
export async function verifyGalleryImage(image, viewport, outputDirectory = OUTPUT) {
  const output = path.resolve(ROOT, outputDirectory);
  const filename = path.resolve(ROOT, image.path);
  ensure(filename.toLowerCase().startsWith(`${output.toLowerCase()}${path.sep}`), "image-outside-evidence-directory");
  const bytes = await readFile(filename);
  ensure(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "source-is-not-png");
  const dimensions = [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  ensure(sha(bytes) === image.sha256 && bytes.length === image.bytes, `image-byte-binding:${image.path}`);
  ensure(JSON.stringify(dimensions) === JSON.stringify(viewport), `image-viewport-binding:${image.path}`);
  return { path: image.path, href: path.relative(output, filename).replaceAll("\\", "/"), sha256: sha(bytes),
    bytes: bytes.length, width: dimensions[0], height: dimensions[1], verified: true };
}

function inspectRoster(receipt, stage) {
  ensure(receipt.items.length === 24, `${stage}-matrix-size`);
  const keys = new Set(receipt.items.map((item) => `${item.device}-${item.id}`));
  ensure(keys.size === 24 && A12.every((id) => ["desktop", "mobile"].every((device) => keys.has(`${device}-${id}`))), `${stage}-roster`);
}

export async function renderM3Gallery() {
  const output = path.join(ROOT, OUTPUT);
  const manifest = { schema: "mainline-a-m3-gallery-v1", createdAt: new Date().toISOString(), sourceImages: "actual-browser-viewport-captures",
    processing: "original-png-files-linked-directly-no-image-processing", offline: true, browserRenderCheck: "not-run-resource-reserve",
    claims: { humanVisualSignoff: false, physicalDevice: false, scientificValidity: false, copyrightApproval: false, publicReleaseApproved: false },
    receipts: [], images: [], comparisons: [], faultImages: [] };
  const receiptMap = {};
  for (const stage of ["before", "after"]) {
    const relative = `${OUTPUT}/${stage}/receipt.json`; const bytes = await readFile(path.join(ROOT, relative)); const receipt = JSON.parse(bytes);
    ensure(receipt.status === (stage === "before" ? "passed-a12-baseline-scenes-and-sources-candidate-only"
      : "passed-a12-nebula-viewer-and-faults-candidate-only"), `${stage}-receipt-status`);
    inspectRoster(receipt, stage); receiptMap[stage] = receipt;
    manifest.receipts.push({ stage, path: relative, sha256: sha(bytes), build: receipt.build, runId: receipt.runId });
    for (const item of receipt.items) {
      ensure(item.errors.length === 0, `${stage}:${item.id}:browser-errors`);
      const modes = stage === "before" ? ["default", "sources"] : ["default", "sources", "viewer-fit", "viewer-2x", "viewer-sources"];
      ensure(item.views.length === modes.length && modes.every((mode) => item.views.filter((view) => view.mode === mode).length === 1), "missing-or-duplicate-views");
      for (const view of item.views) {
        ensure(view.issues.length === 0 && view.observed.selectedId === `nebula:${item.id}`
          && view.observed.runtimeBuildId === receipt.build.runtimeBuildId && view.observed.nebula.id === item.id
          && view.observed.nebula.rights === "pending" && view.observed.nebula.admission === "candidate-only", "view-identity-or-boundary");
        const asset = receipt.assets.find((candidate) => candidate.id === item.id);
        ensure(asset?.sha256 === view.observed.nebula.sha256, "asset-identity");
        const image = await verifyGalleryImage(view.screenshot, view.observed.viewport);
        manifest.images.push({ stage, id: item.id, device: item.device, mode: view.mode, assetSha256: asset.sha256, ...image });
      }
    }
  }
  const { before, after } = receiptMap;
  ensure(after.faults.length === 8 && after.items.every((item) => Object.values(item.viewer.checks).every(Boolean)), "after-journey-incomplete");
  for (const fault of after.faults) {
    ensure(Object.values(fault.checks).every(Boolean), "fault-check-incomplete");
    for (const image of fault.screenshots) manifest.faultImages.push({ device: fault.device, scenario: fault.scenario, state: image.state,
      ...await verifyGalleryImage(image, fault.device === "desktop" ? [1280, 720] : [390, 844]) });
  }
  const find = (stage, id, device, mode) => {
    const image = manifest.images.find((entry) => entry.stage === stage && entry.id === id && entry.device === device && entry.mode === mode);
    ensure(image, `missing-view:${stage}:${device}:${id}:${mode}`); return image;
  };
  const image = (entry, label) => `<figure><figcaption>${escape(label)} <a href="${escape(entry.href)}" target="_blank" rel="noopener">打开原图 ↗</a></figcaption><a href="${escape(entry.href)}" target="_blank" rel="noopener"><img loading="lazy" src="${escape(entry.href)}" width="${entry.width}" height="${entry.height}" alt="${escape(label)}"></a></figure>`;
  const sections = ["m42", "m16", "carina"].flatMap((id) => ["desktop", "mobile"].map((device) => {
    const prior = find("before", id, device, "default"); const current = find("after", id, device, "default");
    ensure(prior.width === current.width && prior.height === current.height && prior.assetSha256 === current.assetSha256, "comparison-identity-mismatch");
    manifest.comparisons.push({ id, device, before: prior.path, after: current.path,
      viewer: ["viewer-fit", "viewer-2x", "viewer-sources"].map((mode) => find("after", id, device, mode).path) });
    return `<section class="comparison" id="${device}-${id}"><div class="section-heading"><h2>${escape(NAMES[id])}</h2><span>${deviceLabel(device)}</span></div>
      <div class="pair">${image(prior, "改动前 · M2 默认场景")}${image(current, "改动后 · M3 + M4 build02 默认场景")}</div>
      <div class="viewer-list">${["viewer-fit", "viewer-2x", "viewer-sources"].map((mode) => `<details><summary>${escape(MODES[mode])}<span>展开运行原图</span></summary>${image(find("after", id, device, mode), `${NAMES[id]} · ${MODES[mode]}`)}</details>`).join("")}</div></section>`;
  })).join("");
  const table = ["desktop", "mobile"].map((device) => `<details class="roster"><summary>${deviceLabel(device)} · A12 全部原图</summary><div class="table-wrap"><table><thead><tr><th>对象</th><th>改动前 · M2</th><th>改动后 · M3 + M4 build02</th></tr></thead><tbody>${A12.map((id) => `<tr><th>${escape(NAMES[id])}</th><td>${["default", "sources"].map((mode) => `<a href="${escape(find("before", id, device, mode).href)}">${escape(MODES[mode])}</a>`).join(" · ")}</td><td>${["default", "viewer-fit", "viewer-2x", "viewer-sources", "sources"].map((mode) => `<a href="${escape(find("after", id, device, mode).href)}">${escape(MODES[mode])}</a>`).join(" · ")}</td></tr>`).join("")}</tbody></table></div></details>`).join("");
  const faults = after.faults.map((fault) => `<li>${deviceLabel(fault.device)} · ${escape(fault.scenario)}：${manifest.faultImages.filter((entry) => entry.device === fault.device && entry.scenario === fault.scenario).map((entry) => `<a href="${escape(entry.href)}">${escape(entry.state)}</a>`).join(" · ")}</li>`).join("");
  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>M3 星云 · 实际运行对照</title>
<style>*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#080e16;color:#dfe8ee;font:15px/1.7 "Segoe UI","Microsoft YaHei",sans-serif}main{max-width:1600px;margin:auto;padding:40px 28px 64px}a{color:#a5d7ed;text-underline-offset:3px}h1{font-size:clamp(28px,4vw,42px);font-weight:500;letter-spacing:.015em;line-height:1.25;margin:10px 0 16px}h2{font-size:22px;font-weight:500;margin:0}h3{font-size:18px;font-weight:500}.eyebrow{font:12px "Segoe UI",sans-serif;letter-spacing:.2em;color:#b9a477}.intro{max-width:880px;color:#a9bac8}.badge{display:inline-block;border:1px solid #6c6044;border-radius:5px;padding:4px 10px;color:#d4c39b;font-size:12px}.nav{display:flex;flex-wrap:wrap;gap:9px;margin:24px 0 36px}.nav a{padding:7px 13px;border:1px solid #2a404e;border-radius:6px;text-decoration:none}.comparison{scroll-margin-top:20px;margin:38px 0 56px}.section-heading{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:10px;padding-bottom:14px;border-bottom:1px solid #2c3a47}.section-heading span{color:#9bb0c2;font-size:13px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:14px}figure{margin:0;min-width:0}figcaption{display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;margin:0 0 8px;font-size:13px;color:#b4c6d4}figcaption a{font-size:12px}img{display:block;width:100%;height:auto;background:#02060a;border:1px solid #2c3a47;border-radius:4px}.viewer-list{margin-top:18px}.viewer-list details{margin:9px 0}.viewer-list figure{max-width:1280px;margin:16px auto}.viewer-list img{max-height:none}.viewer-list figure:has(img[width="390"]){max-width:390px}details{border:1px solid #2a3b49;border-radius:7px;padding:0 14px;background:#0d1721}summary{cursor:pointer;padding:12px 0;color:#cfdee8;min-height:48px}summary span{float:right;color:#839bae;font-size:12px}details[open]>summary{border-bottom:1px solid #243642}.roster{margin:16px 0}.table-wrap{overflow-x:auto;padding:8px 0}table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;border-bottom:1px solid #263847;padding:12px 10px;vertical-align:top}th{font-weight:500}td a{display:inline-block;margin:2px 0}code{font-family:Consolas,monospace;font-size:12px;overflow-wrap:anywhere;color:#acbfd0}.evidence{margin-top:32px}.evidence p,.evidence li{color:#a9bdcb}.evidence dl{display:grid;grid-template-columns:100px 1fr;gap:8px 12px}.evidence dt{color:#9db1c2}.evidence dd{margin:0}.note{color:#96aabb;font-size:13px}footer{border-top:1px solid #283947;margin-top:36px;padding-top:18px;color:#8fa4b5;font-size:13px}@media(max-width:700px){main{padding:24px 14px 40px}.pair{gap:9px}figcaption{font-size:11px}.section-heading span{font-size:12px}summary span{float:none;margin-left:10px}.evidence dl{grid-template-columns:1fr}.nav{gap:6px}.nav a{padding:6px 9px;font-size:13px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}</style></head>
<body><main><span class="eyebrow">MAINLINE A / M3</span><h1>星云观测，从场景到完整构图</h1><p class="intro">M42、M16、Carina 的桌面和移动模拟视口，共六组实际运行对照。左右原图展示默认场景变化；下方可展开完整构图、2× 局部和来源署名。所有图像均直接引用已保存的浏览器截图。</p><span class="badge">本地候选预览 · 逐图权利签署与人工视觉验收待完成</span>
<nav class="nav" aria-label="对照页导航"><a href="#desktop-m42">M42</a><a href="#desktop-m16">M16</a><a href="#desktop-carina">Carina</a><a href="#a12">A12 全部原图</a><a href="#evidence">构建与核验记录</a></nav>
${sections}<section id="a12"><h2>A12 全部运行原图</h2><p class="note">包含 12 个星云、两种视口的默认场景、完整来源，以及改动后的放大页。链接打开原始 PNG。</p>${table}</section>
<details class="evidence"><summary>慢加载、失败与切换 · 8 个真实浏览器流程</summary><p>受控网络测试包含取消后重试、HTTP 503 后重试、超时后重试和旧请求晚返回时切换对象。两条 HTTP 503 错误是有记录的故障输入。</p><ul>${faults}</ul></details>
<details class="evidence" id="evidence"><summary>构建与核验记录</summary><dl><dt>改动前</dt><dd>M2 build02 · <code>${escape(before.build.buildId)}</code><br>source <code>${escape(before.build.sourceSha256)}</code></dd><dt>改动后</dt><dd>M3 + M4 build02 · <code>${escape(after.build.buildId)}</code><br>source <code>${escape(after.build.sourceSha256)}</code></dd><dt>浏览器流程</dt><dd>改动前 24 组默认与来源；改动后 24 组完整观看流程，以及 8 个异常流程。移动端为浏览器模拟视口。</dd><dt>图片核验</dt><dd>${manifest.images.length + manifest.faultImages.length} 张原图逐一验证 SHA-256、原始尺寸与记录身份；没有裁切、调色、缩放另存或生成替代图。</dd></dl><p><a href="comparison-manifest.json">图片与记录 SHA-256 清单</a> · <a href="before/receipt.json">改动前浏览器记录</a> · <a href="after/receipt.json">改动后浏览器记录</a> · <a href="after/output-directory-clarification-${escape(after.runId)}.json">输出目录澄清与原图复核</a></p><p class="note">页面不依赖网络服务。此次未另开浏览器渲染画廊，以保留当前内存余量；上述浏览器记录来自应用的实际运行。</p></details>
<footer>二维观测合成图不表示三维深度、目录角径或肉眼色彩。来源与许可文本已留存；本页不代替逐图权利签署、人工视觉验收、物理移动设备测试或公开发布批准。</footer></main></body></html>`;
  const galleryBytes = Buffer.from(html); const galleryRelative = `${OUTPUT}/comparison-gallery.html`;
  manifest.gallery = { path: galleryRelative, sha256: sha(galleryBytes), bytes: galleryBytes.length };
  manifest.validation = { comparisons: manifest.comparisons.length, canonicalImages: manifest.images.length,
    faultImages: manifest.faultImages.length, verifiedImageReferences: manifest.images.length + manifest.faultImages.length, issues: [] };
  await writeFile(path.join(output, "comparison-gallery.html"), galleryBytes, { flag: "wx" });
  await writeFile(path.join(output, "comparison-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  return manifest.validation;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await renderM3Gallery(), null, 2));
}

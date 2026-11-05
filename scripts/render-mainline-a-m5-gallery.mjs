import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { M2_A12, M2_ALIASES } from "./capture-mainline-a-m2-browser.mjs";
import { M3_A12 } from "./capture-mainline-a-m3-browser.mjs";
import { M4_A12, inspectM4ComparisonReturn, inspectM4Constellation } from "./capture-mainline-a-m4-browser.mjs";
import { verifyGalleryImage } from "./render-mainline-a-m3-gallery.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FAMILY = {
  stars: { title: "恒星", roster: M2_A12, modes: ["default", "comparison"], prefix: "stellar-hero:", status: "passed-a12-two-viewports-default-and-comparison-candidate-only" },
  constellations: { title: "星座", roster: M4_A12, modes: ["default", "comparison", "boundary"], prefix: "constellation:", status: "passed-constellations-and-journey-candidate-only" },
  nebulae: { title: "星云", roster: M3_A12, modes: ["default", "viewer-fit", "viewer-2x", "viewer-sources", "sources"], prefix: "nebula:", status: "passed-a12-nebula-viewer-and-faults-candidate-only" },
};
const MODES = { default: "默认场景", comparison: "图鉴比较", boundary: "IAU 边界", "viewer-fit": "完整构图", "viewer-2x": "2× 局部", "viewer-sources": "放大页来源", sources: "场景来源" };
const DEFAULTS = {
  stars: "output/playwright/mainline-a-m5-stars-20261015/after/receipt.json",
  constellations: "output/playwright/mainline-a-m4-20261015/receipt.json",
  nebulae: "output/playwright/mainline-a-m5-nebulae-20261015/after/receipt.json",
  outputDir: "output/playwright/mainline-a-m5-20261015",
};
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const ensure = (condition, message) => { if (!condition) throw new Error(`m5-gallery:${message}`); };
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const empty = (value) => Array.isArray(value) && value.length === 0;
const allTrue = (value) => value && Object.keys(value).length > 0 && Object.values(value).every((item) => item === true);
const viewportFor = (device) => device === "desktop" ? [1280, 720] : [390, 844];

export function parseM5GalleryOptions(args) {
  const options = { ...DEFAULTS }; const used = new Set();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index]; const key = flag === "--output-dir" ? "outputDir" : flag.slice(2);
    ensure(flag.startsWith("--") && Object.hasOwn(options, key) && args[index + 1] && !used.has(key), "invalid-or-duplicate-option");
    used.add(key); options[key] = args[index + 1];
  }
  ensure(/^output\/playwright\/[a-zA-Z0-9-]+$/.test(options.outputDir), "unsafe-output-directory");
  for (const family of Object.keys(FAMILY)) ensure(/^output\/playwright\/[a-zA-Z0-9-]+\/(?:after\/)?receipt\.json$/.test(options[family]), "unsafe-receipt-path");
  return options;
}

/** This gate only combines completed capture evidence. It never upgrades release or human-review claims. */
export function inspectM5Matrix(receipts) {
  const common = receipts.stars?.build;
  ensure(common && /^[a-f0-9]{64}$/.test(common.sourceSha256), "missing-build-identity");
  for (const [family, contract] of Object.entries(FAMILY)) {
    const receipt = receipts[family];
    ensure(receipt?.status === contract.status && empty(receipt.errors), `${family}:incomplete-receipt`);
    ensure(["buildId", "runtimeBuildId", "sourceSha256", "branch", "head"].every((key) => common[key] && receipt.build?.[key] === common[key]), "mixed-build-identity");
    ensure(receipt.binding?.sourceScope === "current-source-before-and-after"
      && receipt.binding.sourceAfterSha256 === common.sourceSha256
      && /^[a-f0-9]{64}$/.test(receipt.binding.buildReceiptSha256)
      && receipt.binding.buildReceiptSha256 === receipts.stars.binding.buildReceiptSha256, "source-or-build-binding");
    ensure(receipt.physicalDevice === false && ["humanVisualSignoff", "publicReleaseApproved", "copyrightApproval", "scientificValidity", "productionPerformance"]
      .every((key) => receipt.claims?.[key] === false), `${family}:claim-boundary`);
    ensure(receipt.items?.length === 24, `${family}:matrix-size`);
    const keys = new Set(receipt.items.map((item) => `${item.device}:${item.id ?? item.code}`));
    ensure(keys.size === 24 && contract.roster.every((id) => ["desktop", "mobile"].every((device) => keys.has(`${device}:${id}`))), `${family}:roster`);
    for (const item of receipt.items) {
      const id = item.id ?? item.code;
      ensure(empty(item.errors), `${family}:${id}:browser-errors`);
      ensure(item.views?.length === contract.modes.length && contract.modes.every((mode) => item.views.filter((view) => (view.mode ?? view.name?.split("-").at(-1)) === mode).length === 1), `${family}:${id}:missing-or-duplicate-view`);
      for (const view of item.views) {
        const observed = view.observed;
        ensure(empty(view.issues) && observed.selectedId === `${contract.prefix}${id}`
          && observed.runtimeBuildId === common.runtimeBuildId && observed.branch === common.branch && observed.head === common.head
          && observed.releaseBoundary === "candidate-only-hold-not-admitted" && observed.scientificPayloadWriteback === "false"
          && JSON.stringify(observed.viewport) === JSON.stringify(viewportFor(item.device)), `${family}:${id}:view-identity-or-boundary`);
        if (family === "nebulae") ensure(observed.nebula?.id === id && observed.nebula.rights === "pending"
          && observed.nebula.admission === "candidate-only" && receipt.assets?.find((asset) => asset.id === id)?.sha256 === observed.nebula.sha256, `${family}:${id}:asset-identity`);
        if (family === "constellations") ensure(inspectM4Constellation(observed, id, item.device === "mobile",
          view.mode ?? view.name.split("-").at(-1), item.preChart?.observed).length === 0, `${family}:${id}:scene-or-measured-chart-occlusion`);
      }
      if (family === "stars") ensure(allTrue(item.behaviors), `${family}:${id}:behaviors`);
      if (family === "nebulae") ensure(allTrue(item.behaviors) && allTrue(item.viewer?.checks), `${family}:${id}:viewer-checks`);
      if (family === "constellations") {
        ensure(item.preChart?.cameraStability?.status === "actual-focus-locked-and-pose-stable"
          && item.preChart.observed?.runtimeBuildId === common.runtimeBuildId, `${family}:${id}:pre-chart-evidence-missing`);
        const restored = item.comparisonReturn;
        ensure(restored?.validation?.ok === true && empty(restored.validation.issues)
          && restored.cameraStability?.status === "actual-focus-locked-and-pose-stable"
          && restored.observed?.runtimeBuildId === common.runtimeBuildId, `${family}:${id}:comparison-return-missing-or-failed`);
        const initial = item.views.find((view) => view.name === `${item.device}-${id}-default`).observed;
        ensure(inspectM4ComparisonReturn(initial, restored.observed, id, item.device === "mobile").ok,
          `${family}:${id}:comparison-return-not-restored`);
      }
    }
  }
  const aliases = receipts.stars.aliasItems;
  ensure(aliases?.length === 4 && M2_ALIASES.every((alias) => aliases.filter((item) => item.id === alias.id && item.selectedId === alias.selectedId && item.device === "desktop").length === 1), "alias-roster");
  for (const item of aliases) {
    ensure(empty(item.errors) && allTrue(item.behaviors) && item.views?.length === 2, "alias-incomplete");
    for (const mode of ["default", "comparison"]) {
      const matches = item.views.filter((view) => view.mode === mode); ensure(matches.length === 1, "alias-view-roster");
      const view = matches[0]; const hero = receipts.stars.items.find((entry) => entry.device === "desktop" && entry.id === item.id).views.find((entry) => entry.mode === mode);
      const key = "data-mainline-a-stellar-presentation-sha256";
      ensure(empty(view.issues) && view.observed.selectedId === item.selectedId && view.observed.runtimeBuildId === common.runtimeBuildId
        && view.observed.proxy?.[key] && view.observed.proxy[key] === hero.observed.proxy?.[key], "alias-hero-contract");
    }
  }
  const faults = receipts.nebulae.faults;
  const scenarios = ["slow-cancel-retry", "http-failure-retry", "timeout-retry", "late-response-switch"];
  ensure(faults?.length === 8 && scenarios.every((scenario) => ["desktop", "mobile"].every((device) => faults.filter((fault) => fault.scenario === scenario && fault.device === device).length === 1)), "fault-roster");
  ensure(faults.every((fault) => allTrue(fault.checks) && empty(fault.unexpectedErrors) && fault.final?.runtimeBuildId === common.runtimeBuildId), "fault-incomplete");
  ensure(faults.reduce((count, fault) => count + (fault.screenshots?.length ?? 0), 0) === 18, "fault-screenshot-count");
  const journeys = receipts.constellations.journeys;
  ensure(receipts.constellations.scope === "full" && journeys?.length === 4
    && ["desktop", "mobile", "narrow", "reduced-motion"].every((profile) => journeys.filter((journey) => journey.profile === profile).length === 1), "journey-roster");
  for (const journey of journeys) {
    ensure(allTrue(journey.checks) && empty(journey.errors) && journey.poseReturn?.ok === true
      && journey.returnVisibility?.ok === true && empty(journey.returnVisibility.issues), "journey-incomplete");
    const names = ["station-0", "station-1", "station-2", "station-3", "station-4", "story-expanded-1", "previous-1", "external-sirius-paused", "resumed-2", "returned"];
    ensure(journey.views.length === 10 && names.every((name) => journey.views.filter((view) => view.name === `${journey.profile}-journey-${name}`).length === 1), "journey-screenshot-roster");
    ensure(journey.views.every((view) => empty(view.issues) && view.observed.base?.runtimeBuildId === common.runtimeBuildId), "journey-view-identity");
  }
  return { objects: 36, deviceGroups: 72, canonicalImages: 240, aliasGroups: 4, faultFlows: 8, journeyProfiles: 4, build: common };
}

export async function renderM5Gallery(options) {
  // Validate even direct callers before reading or creating files.
  options = parseM5GalleryOptions(Object.entries(options).flatMap(([key, value]) => [key === "outputDir" ? "--output-dir" : `--${key}`, value]));
  const receipts = {}; const references = [];
  for (const family of Object.keys(FAMILY)) {
    const bytes = await readFile(path.join(ROOT, options[family])); receipts[family] = JSON.parse(bytes);
    references.push({ family, path: options[family], sha256: sha(bytes), bytes: bytes.length, runId: receipts[family].runId });
  }
  const matrix = inspectM5Matrix(receipts); const output = path.join(ROOT, options.outputDir);
  for (const filename of ["gallery.html", "gallery-manifest.json"]) {
    try { await access(path.join(output, filename)); } catch (error) { if (error.code === "ENOENT") continue; throw error; }
    throw new Error(`m5-gallery:output-exists:${filename}`);
  }
  const images = []; const additional = [];
  const verify = async (screenshot, viewport, metadata, family = metadata.family) => {
    const image = await verifyGalleryImage(screenshot, viewport, path.posix.dirname(options[family]));
    return { ...metadata, ...image, href: path.relative(output, path.join(ROOT, image.path)).replaceAll("\\", "/") };
  };
  for (const family of Object.keys(FAMILY)) for (const item of receipts[family].items) for (const view of item.views) {
    images.push(await verify(view.screenshot, view.observed.viewport, { family, id: item.id ?? item.code, device: item.device, mode: view.mode ?? view.name.split("-").at(-1) }));
  }
  ensure(images.length === matrix.canonicalImages && new Set(images.map((image) => image.path)).size === images.length, "canonical-image-count-or-path-reuse");
  for (const item of receipts.stars.aliasItems) for (const view of item.views) additional.push(await verify(view.screenshot, view.observed.viewport, { category: "alias", label: `${item.selectedId} · ${MODES[view.mode]}` }, "stars"));
  for (const fault of receipts.nebulae.faults) for (const image of fault.screenshots) additional.push(await verify(image, viewportFor(fault.device), { category: "fault", label: `${fault.device} · ${fault.scenario} · ${image.state}` }, "nebulae"));
  for (const journey of receipts.constellations.journeys) for (const view of journey.views) additional.push(await verify(view.screenshot, [journey.viewport.width, journey.viewport.height], { category: "journey", label: view.name }, "constellations"));
  ensure(new Set([...images, ...additional].map((image) => image.path)).size === images.length + additional.length, "supplementary-image-path-reuse");
  const href = (filename) => escape(path.relative(output, path.join(ROOT, filename)).replaceAll("\\", "/"));
  const find = (family, id, device, mode) => images.find((image) => image.family === family && image.id === id && image.device === device && image.mode === mode);
  const figure = (image, title) => `<figure><figcaption>${escape(title)} · <a href="${escape(image.href)}">原图 ↗</a></figcaption><a href="${escape(image.href)}"><img src="${escape(image.href)}" alt="${escape(title)}" width="${image.width}" height="${image.height}" loading="lazy"></a></figure>`;
  const featured = { stars: ["sirius-a", "betelgeuse"], constellations: ["Ori", "Sco"], nebulae: ["m42", "carina"] };
  const sections = Object.entries(FAMILY).map(([family, contract]) => `<section id="${family}"><h2>${contract.title} · 12 个对象</h2>${featured[family].map((id) => `<h3>${escape(id)}</h3><div class="pair">${figure(find(family, id, "desktop", "default"), "桌面 1280 × 720")}${figure(find(family, id, "mobile", "default"), "移动模拟视口 390 × 844")}</div>`).join("")}<details><summary>全部 ${contract.title} · 两种视口与所有观看状态</summary><div class="scroll"><table><thead><tr><th>对象</th><th>桌面</th><th>移动模拟视口</th></tr></thead><tbody>${contract.roster.map((id) => `<tr><th>${escape(id)}</th>${["desktop", "mobile"].map((device) => `<td>${contract.modes.map((mode) => `<a href="${escape(find(family, id, device, mode).href)}">${MODES[mode]}</a>`).join(" · ")}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details></section>`).join("");
  const supplemental = [["journey", "五站观测旅程与返回"], ["fault", "加载、失败与切换"], ["alias", "真实目录入口一致性"]].map(([category, title]) => `<details><summary>${title}</summary><ul>${additional.filter((image) => image.category === category).map((image) => `<li><a href="${escape(image.href)}">${escape(image.label)}</a></li>`).join("")}</ul></details>`).join("");
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>Mainline A · 36 个天体实际运行图册</title><style>:root{--bg:#080e16;--panel:#101a25;--text:#dfe8ee;--muted:#9fb2c2;--line:#2a3b49;--link:#aed9ed;--accent:#d4c39b}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.7 "Segoe UI","Microsoft YaHei",sans-serif}main{max-width:1500px;margin:auto;padding:36px 28px 60px}h1{font-size:clamp(26px,4vw,40px);font-weight:500;line-height:1.3}h2{font-size:24px;font-weight:500;border-bottom:1px solid var(--line);padding-bottom:12px}h3{font-size:18px;font-weight:500}p{max-width:900px;color:var(--muted)}a{color:var(--link);text-underline-offset:3px}a:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:4px}.badge{color:var(--accent);font-size:13px}nav{display:flex;flex-wrap:wrap;gap:20px;margin:24px 0 40px}section{margin:48px 0}.pair{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px;align-items:start}figure{margin:0}figcaption{font-size:13px;color:var(--muted);margin:0 0 8px}img{display:block;width:100%;height:auto;border:1px solid var(--line)}details{margin:20px 0;padding:0 16px;background:var(--panel);border:1px solid var(--line);border-radius:6px}summary{min-height:48px;padding:12px 0;cursor:pointer}details[open]>summary{border-bottom:1px solid var(--line)}.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;padding:12px;border-bottom:1px solid var(--line);vertical-align:top}th{font-weight:500}code{overflow-wrap:anywhere;color:var(--muted);font-size:12px}footer{color:var(--muted);font-size:13px;border-top:1px solid var(--line);padding-top:20px}li{margin:6px 0}@media(max-width:700px){main{padding:24px 14px 40px}.pair{grid-template-columns:1fr;gap:16px}.pair figure:last-child{max-width:390px;margin:auto}table{min-width:620px}}@media print{body{background:white;color:black}details{display:block}img{break-inside:avoid}a{color:black}}</style></head><body><main><span class="badge">MAINLINE A · 本地候选图册</span><h1>36 个天体，同一构建的实际运行</h1><p>恒星、星座与星云各 12 个对象，覆盖桌面和移动模拟视口。默认场景置于前台，图鉴比较、完整星云构图、来源署名与五站旅程可继续展开查看。所有图片均直接引用浏览器保存的原始 PNG。</p><p class="badge">权利签署、人工视觉验收与真实移动设备测试仍待完成；本页不是发布批准。</p><nav aria-label="图册导航"><a href="#stars">恒星</a><a href="#constellations">星座</a><a href="#nebulae">星云</a><a href="#flows">交互流程</a><a href="#evidence">证据记录</a></nav>${sections}<section id="flows"><h2>从观看到操作</h2>${supplemental}</section><section id="evidence"><h2>构建与原图核验</h2><p>36 个对象、72 组设备视口、240 张主要视图；另有 ${additional.length} 张目录入口、异常流程和旅程截图。每张图的 SHA-256、字节数和原始视口尺寸均已重新核对。</p><p>构建 <code>${escape(matrix.build.buildId)}</code><br>source <code>${escape(matrix.build.sourceSha256)}</code></p><ul>${references.map((entry) => `<li><a href="${href(entry.path)}">${FAMILY[entry.family].title}浏览器记录</a> · ${escape(entry.runId)}</li>`).join("")}</ul><p><a href="gallery-manifest.json">完整图片与记录 SHA-256 清单</a></p><p>此图册仅聚合已完成的运行记录。长时间运行、GL 恢复、帧间隔及冻结审批应查看各自独立记录；本页不替代这些验收。</p></section><footer>恒星形态为参数驱动的呈现模型；二维星云合成图不表示三维深度、目录角径或肉眼色彩。移动端使用浏览器模拟视口。图册与原图可离线打开。</footer></main></body></html>`;
  const bytes = Buffer.from(html);
  const manifest = { schema: "mainline-a-m5-gallery-v1", createdAt: new Date().toISOString(), matrix,
    status: "same-build-a36-capture-evidence-aggregated-candidate-only", offline: true,
    sourceImages: "actual-browser-viewport-captures", imageProcessing: "none-original-png-links",
    galleryBrowserCheck: "not-run", claims: { humanVisualSignoff: false, physicalDevice: false, copyrightApproval: false,
      scientificValidity: false, publicReleaseApproved: false, longRunAcceptance: false, freezeApproved: false },
    references, images, additional, gallery: { path: `${options.outputDir}/gallery.html`, sha256: sha(bytes), bytes: bytes.length } };
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, "gallery.html"), bytes, { flag: "wx" });
  await writeFile(path.join(output, "gallery-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  return { ...matrix, supplementaryImages: additional.length, gallery: manifest.gallery.path };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await renderM5Gallery(parseM5GalleryOptions(process.argv.slice(2))), null, 2));
}

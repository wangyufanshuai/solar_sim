import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Acquire only these six individually reviewed official screen JPEGs. Existing
// assets and receipts are verified, never replaced. Runtime promotion is separate.
// Usage: node scripts/acquire-mainline-a3-extension.mjs
//        node scripts/acquire-mainline-a3-extension.mjs --verify-local
const root = process.cwd();
const receiptPath = "docs/release/v607/mainline-a-stage-a3-extension-delivery.json";
const evidenceDirectory = "docs/release/v607/mainline-a3-extension-sources";
const candidates = [
  {
    objectId: "ngc7293", imageId: "opo0432d", nameZh: "螺旋星云",
    sourcePage: "https://esahubble.org/images/opo0432d/",
    expectedImageUrl: "https://cdn.esahubble.org/archives/images/screen/opo0432d.jpg",
    expectedCredit: "NASA, ESA, C.R. O'Dell (Vanderbilt University), and M. Meixner, P. McCullough, and G. Bacon ( Space Telescope Science Institute)",
    identityText: "Helix Nebula, NGC 7293", scope: "nebula-wide-composite",
    notes: ["螺旋星云的环状发光气体，由 Hubble ACS 与智利 CTIO 4 米望远镜 Mosaic II 影像合成；环形外观不等于其真实三维结构。", "源页滤镜表列出 Hubble 的 O III 502 nm 和 H-alpha 658 nm；CTIO 补充数据的逐滤镜信息未在此页完整列出。", "科学滤镜合成影像，不代表肉眼颜色；保留官方发布图的方向与完整画幅。"],
    bandUnknowns: ["CTIO Mosaic II supplemental filter list", "Hubble filter colour assignments are not specified by the source table"],
  },
  {
    objectId: "ngc6543", imageId: "potm2602b", nameZh: "猫眼星云",
    sourcePage: "https://esahubble.org/images/potm2602b/",
    expectedImageUrl: "https://cdn.esahubble.org/archives/images/screen/potm2602b.jpg",
    expectedCredit: "ESA/Hubble & NASA, Z. Tsvetanov",
    identityText: "NGC 6543", scope: "nebula-core-detail",
    notes: ["2026 年发布的 Hubble ACS 高分辨率通道影像，展示猫眼星云中心恒星、重叠气泡、喷流与同心气壳。", "画面聚焦核心区域，不覆盖整个暗弱外晕。源页记录 N III 388 nm、O III 502/505 nm 与 N II 658 nm，并分别映射为蓝、青、绿、红。", "保留源页对滤镜的原始标注；这里不据影像推断距离、物理尺度或三维几何。"],
    bandUnknowns: [],
  },
  {
    objectId: "ngc2237", imageId: "potw1847a", nameZh: "玫瑰星云",
    sourcePage: "https://www.eso.org/public/images/potw1847a/",
    expectedImageUrl: "https://cdn.eso.org/images/screen/potw1847a.jpg",
    expectedCredit: "ESO",
    identityText: "Rosette Nebula", scope: "rosette-nebula-local-field",
    notes: ["ESO VLT/FORS2 拍摄的玫瑰星云局部，呈现发光气体、暗尘埃与年轻恒星；视场约 7.44×7.19 角分。", "官方页将目标命名为 Rosette Nebula；项目 ngc2237 条目代表玫瑰星云复合体，本图不声称覆盖完整玫瑰环，也不额外认定这一局部等同于单独的 NGC 2237 目录边界。", "源页滤镜为 b 440 nm、v 557 nm、R 655 nm、H-alpha 660 nm，颜色为发布时的多滤镜映射，不代表肉眼视觉。"],
    bandUnknowns: [],
  },
  {
    objectId: "ngc6960", imageId: "heic1520a", nameZh: "面纱星云",
    sourcePage: "https://esahubble.org/images/heic1520a/",
    expectedImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic1520a.jpg",
    expectedCredit: "NASA, ESA, Hubble Heritage Team",
    identityText: "NGC 6960", scope: "western-veil-shell-detail",
    notes: ["Hubble WFC3 展示面纱星云西部 NGC 6960（女巫扫帚）外壳的一小段纤维结构，不是整个天鹅座环的全景。", "源页记录 O III 502 nm、V 555 nm、S II 673 nm、I 814 nm、H-alpha 657 nm 五组数据，并映射为蓝、青、绿、橙、红。", "源页将 I 814 nm 列作 Optical；本记录保留来源的命名，不把彩色合成视作肉眼颜色或真实三维壳层。"],
    bandUnknowns: [],
  },
  {
    objectId: "carina", imageId: "heic0707a", nameZh: "船底座星云",
    sourcePage: "https://esahubble.org/images/heic0707a/",
    expectedImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0707a.jpg",
    expectedCredit: "NASA, ESA, N. Smith (University of California, Berkeley), and The Hubble Heritage Team (STScI/AURA)",
    identityText: "Carina Nebula, NGC 3372", scope: "central-region-panorama",
    notes: ["船底座星云中心区域的宽幅拼接影像，含 Hubble ACS 的 48 帧观测，气体和尘埃云受恒星风与紫外辐射雕刻。", "Hubble 的 H-alpha + N II 658 nm 提供细节；CTIO 地面观测补充颜色，红对应硫、绿对应氢、蓝对应氧。", "保留官方约 2.06:1 宽幅构图；这是中心区域的科学合成全景，不代表整个星云的范围或肉眼颜色。"],
    bandUnknowns: ["Ground-based instrument is only labelled Other in the source filter table; CTIO is identified by the caption"],
  },
  {
    objectId: "b33", imageId: "heic0105a", nameZh: "马头星云",
    sourcePage: "https://esahubble.org/images/heic0105a/",
    expectedImageUrl: "https://cdn.esahubble.org/archives/images/screen/heic0105a.jpg",
    expectedCredit: "NASA, NOAO, ESA and The Hubble Heritage Team (STScI/AURA)",
    identityText: "Barnard 33, Horsehead Nebula", scope: "horsehead-detail",
    notes: ["马头星云 Barnard 33 的局部，暗冷气体和尘埃在发光背景 IC 434 前形成轮廓；亮边及年轻恒星附近的结构由辐射侵蚀塑造。", "使用 Hubble WFPC2 的 B 439 nm、V 555 nm、H-alpha 656 nm、I 814 nm 数据，并包含 Nigel A. Sharp 提供的 Kitt Peak 0.9 米地面数据。", "发布图包含可见光与近红外 I 波段合成；这不是纯肉眼视图，也不是 2013 年 WFC3 红外马头版本。"],
    bandUnknowns: ["Kitt Peak supplemental filter list is not specified on the source page"],
  },
];

const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const entities = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", deg: "°", ndash: "–", mdash: "—" };
const decode = (value) => value.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (all, key) => key.startsWith("#") ? String.fromCodePoint(Number.parseInt(key.replace(/^#x?/i, ""), /^#x/i.test(key) ? 16 : 10)) : (entities[key] ?? all));
const textOnly = (html) => decode(html.replace(/<br\s*\/?\s*>/gi, " ").replace(/<\/(?:p|li|tr|h\d)>/gi, " ").replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
const assert = (condition, message) => { if (!condition) throw new Error(message); };

function jpegDimensions(bytes) {
  assert(bytes[0] === 0xff && bytes[1] === 0xd8, "Not JPEG bytes");
  for (let offset = 2; offset + 9 < bytes.length;) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1]; offset += 2;
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) break;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
    }
    offset += length;
  }
  throw new Error("JPEG dimensions not found");
}

function storeImmutable(relativePath, bytes) {
  const target = path.resolve(root, relativePath);
  assert(target.startsWith(`${path.resolve(root)}${path.sep}`), "Output escapes project");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target)) assert(sha256(fs.readFileSync(target)) === sha256(bytes), `Refusing to replace existing bytes: ${relativePath}`);
  else fs.writeFileSync(target, bytes, { flag: "wx" });
}

async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45_000), redirect: "follow" });
  assert(response.ok, `${url}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return { bytes, html: bytes.toString("utf8"), status: response.status, url: response.url, contentType: response.headers.get("content-type"), retrievedAt: new Date().toISOString() };
}

function parsePage(html, candidate) {
  const pageText = textOnly(html);
  assert(pageText.includes(candidate.identityText), `${candidate.objectId}: source identity not found`);
  const creditHtml = html.match(/<div\b[^>]*class=["']credit["'][^>]*>([\s\S]*?)<\/div>/i)?.[0];
  assert(creditHtml && textOnly(creditHtml) === candidate.expectedCredit, `${candidate.objectId}: full credit changed; review required`);
  const imageUrl = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>\s*Screensize JPEG\s*<\/a>/gi)]
    .map((match) => new URL(decode(match[1]), candidate.sourcePage).href)
    .find((url) => url === candidate.expectedImageUrl);
  assert(imageUrl, `${candidate.objectId}: reviewed screen JPEG is not linked from its image page`);
  const usageHtml = html.match(/<div\b[^>]*class=["']copyright["'][^>]*>([\s\S]*?)<\/div>/i)?.[0];
  const rightsHref = usageHtml?.match(/href=["']([^"']*copyright\/)["']/i)?.[1];
  assert(rightsHref, `${candidate.objectId}: item usage policy link missing`);
  const rightsPage = new URL(decode(rightsHref), candidate.sourcePage).href;
  assert(["https://esahubble.org/copyright/", "https://www.eso.org/public/outreach/copyright/"].includes(rightsPage), `${candidate.objectId}: usage policy changed; review required`);
  const bandsHtml = [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map((match) => match[0]).find((table) => /<th[^>]*>Band<\/th>/i.test(table));
  assert(bandsHtml, `${candidate.objectId}: source filter table missing`);
  const bandDetails = [...bandsHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) => {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => cell[1]);
    if (cells.length !== 3) return null;
    return { band: textOnly(cells[0]), wavelength: textOnly(cells[1]) || "unknown", telescope: textOnly(cells[2]) || "unknown", colourAssignment: cells[0].match(/class=["']band_(?!instrument)(\w+)["']/i)?.[1] ?? "unknown" };
  }).filter(Boolean);
  assert(bandDetails.length >= 2, `${candidate.objectId}: filter rows incomplete`);
  return { credit: textOnly(creditHtml), creditHtml, imageUrl, rightsPage, pageUsageText: textOnly(usageHtml), bandDetails, bandsHtml };
}

function verifyLocal() {
  const receipt = JSON.parse(fs.readFileSync(path.join(root, receiptPath), "utf8"));
  assert(receipt.schema === "mainline-a3-extension-delivery-v1", "Unexpected receipt schema");
  assert(receipt.objects.length === 6, "Expected six extension records");
  for (const candidate of candidates) {
    const row = receipt.objects.find((entry) => entry.objectId === candidate.objectId);
    assert(row && row.imageId === candidate.imageId && row.sourcePage === candidate.sourcePage && row.imageUrl === candidate.expectedImageUrl && row.credit === candidate.expectedCredit, `Receipt identity mismatch: ${candidate.objectId}`);
    assert(row.rightsStatus === "cleared" && row.license === "CC BY 4.0", `Asset not cleared: ${candidate.objectId}`);
    const bytes = fs.readFileSync(path.join(root, row.localPath));
    assert(bytes.length === row.byteSize && sha256(bytes) === row.sha256, `Asset bytes mismatch: ${candidate.objectId}`);
    assert(JSON.stringify(jpegDimensions(bytes)) === JSON.stringify(row.dimensions), `Asset dimensions mismatch: ${candidate.objectId}`);
    const pageBytes = fs.readFileSync(path.join(root, row.sourceEvidence.localPath));
    assert(sha256(pageBytes) === row.sourceEvidence.sha256, `Source evidence mismatch: ${candidate.objectId}`);
    const parsed = parsePage(pageBytes.toString("utf8"), candidate);
    assert(JSON.stringify(parsed.bandDetails) === JSON.stringify(row.bandDetails) && parsed.rightsPage === row.rightsPage, `Source metadata mismatch: ${candidate.objectId}`);
  }
  for (const policy of receipt.policies) assert(sha256(fs.readFileSync(path.join(root, policy.localPath))) === policy.sha256, `Policy evidence mismatch: ${policy.rightsPage}`);
  console.log(JSON.stringify({ status: "verified-local-no-network", assetCount: receipt.objects.length, totalByteSize: receipt.totalByteSize, receipt: receiptPath }, null, 2));
}

if (process.argv.includes("--verify-local") || fs.existsSync(path.join(root, receiptPath))) {
  verifyLocal();
  process.exit(0);
}

const policies = new Map();
const objects = [];
for (const candidate of candidates) {
  try {
    const page = await get(candidate.sourcePage);
    const parsed = parsePage(page.html, candidate);
    if (!policies.has(parsed.rightsPage)) {
      const response = await get(parsed.rightsPage);
      const policyText = textOnly(response.html);
      const linkedLicenseUrl = response.html.match(/href=["'](https?:\/\/creativecommons\.org\/licenses\/by\/4\.0\/)["']/i)?.[1];
      assert(linkedLicenseUrl && /Creative Commons Attribution 4\.0 International [Ll]icense/.test(policyText), `Published CC BY 4.0 grant missing: ${parsed.rightsPage}`);
      assert(policyText.includes("unless explicitly stated otherwise, cleared for reuse without needing to contact the individuals or organisations listed"), `Third-party reuse clarification missing: ${parsed.rightsPage}`);
      const localPath = `${evidenceDirectory}/${parsed.rightsPage.includes("esahubble") ? "esahubble" : "eso"}-copyright-${sha256(response.bytes).slice(0, 12)}.html`;
      storeImmutable(localPath, response.bytes);
      policies.set(parsed.rightsPage, {
        rightsPage: parsed.rightsPage, resolvedUrl: response.url, httpStatus: response.status,
        license: "CC BY 4.0", licenseUrl: linkedLicenseUrl.replace(/^http:/, "https:"), linkedLicenseUrl,
        reviewedAt: response.retrievedAt, localPath, sha256: sha256(response.bytes),
        licenseGrantExcerpt: textOnly(response.html.match(/<h2>Summary<\/h2>([\s\S]*?)<h2>Conditions<\/h2>/i)?.[1] ?? "").replace(/^Conditions\s*/, ""),
        creditRequirementExcerpt: "The full image or footage credit must be presented in a clear and readable manner to all users, with the wording unaltered",
        thirdPartyExcerpt: `Images and videos published on ${parsed.rightsPage.includes("esahubble") ? "esahubble.org" : "eso.org"} are, unless explicitly stated otherwise, cleared for reuse without needing to contact the individuals or organisations listed. Their names must not be removed from the credit, however.`,
      });
    }
    const policy = policies.get(parsed.rightsPage);
    const response = await get(parsed.imageUrl);
    assert(response.contentType?.split(";")[0] === "image/jpeg", `${candidate.objectId}: expected image/jpeg`);
    const dimensions = jpegDimensions(response.bytes);
    assert(dimensions.width === 1280 && dimensions.height > 400 && response.bytes.length < 2_000_000, `${candidate.objectId}: unexpected screen rendition`);
    const localPath = `public/textures/mainline-a/${candidate.imageId}.jpg`;
    const sourceLocalPath = `${evidenceDirectory}/${candidate.imageId}-${sha256(page.bytes).slice(0, 12)}.html`;
    storeImmutable(sourceLocalPath, page.bytes);
    storeImmutable(localPath, response.bytes);
    objects.push({
      objectId: candidate.objectId, imageId: candidate.imageId, nameZh: candidate.nameZh,
      src: `/textures/mainline-a/${candidate.imageId}.jpg`, localPath,
      sourcePage: candidate.sourcePage, imageUrl: parsed.imageUrl, credit: parsed.credit,
      license: policy.license, licenseUrl: policy.licenseUrl, rightsPage: parsed.rightsPage,
      rightsStatus: "cleared", reviewedAt: response.retrievedAt, rightsReviewedAt: response.retrievedAt, retrievedAt: response.retrievedAt,
      rightsBasis: "The individually reviewed image page links the published CC BY 4.0 usage policy. Its caption, credit, download section and item usage notice contain no explicit exception. The policy explicitly covers listed third-party contributors.",
      explicitException: null, policyLinkedFromImagePage: true, pageUsageText: parsed.pageUsageText,
      sourceIdentityText: candidate.identityText, displayScope: candidate.scope,
      bands: parsed.bandDetails.map((row) => `${row.band} (${row.wavelength})`), bandDetails: parsed.bandDetails,
      bandEvidenceStatus: "published-filter-table", bandUnknowns: candidate.bandUnknowns,
      notes: candidate.notes, dimensions, byteSize: response.bytes.length, sha256: sha256(response.bytes),
      httpStatus: response.status, contentType: response.contentType, resolvedImageUrl: response.url,
      rendition: "official-screen-jpeg", modifications: "none; official screen JPEG bytes retained", nakedEyeRepresentationClaimed: false,
      sourceEvidence: { localPath: sourceLocalPath, resolvedUrl: page.url, httpStatus: page.status, retrievedAt: page.retrievedAt, sha256: sha256(page.bytes), creditElementHtmlSha256: sha256(parsed.creditHtml), bandsTableHtmlSha256: sha256(parsed.bandsHtml), imageUrlParseMethod: "source-page-screensize-jpeg-anchor-href" },
    });
    console.log(`${candidate.objectId}: cleared, downloaded ${response.bytes.length} bytes, ${dimensions.width}x${dimensions.height}`);
  } catch (error) {
    objects.push({ objectId: candidate.objectId, imageId: candidate.imageId, sourcePage: candidate.sourcePage, rightsStatus: "pending", status: "not-delivered", reason: error.message });
    console.error(`${candidate.objectId}: pending — ${error.message}`);
  }
}

const receipt = {
  schema: "mainline-a3-extension-delivery-v1", deliveredAt: new Date().toISOString(),
  status: objects.every((row) => row.rightsStatus === "cleared") ? "six-licensed-local-assets-delivered-runtime-integration-separate" : "partial-delivery-with-pending-items",
  method: "Exa discovery and official-page reading, item-level original-HTML review, published-license review, and exact official JPEG download",
  searchAudit: { provider: "Exa", workstreams: 6, webSearchCalls: 7, requestedResultCount: 35, directSourcePagesReviewed: 6, note: "Search-result count is discovery coverage, not a claim that every result met selection criteria." },
  script: "scripts/acquire-mainline-a3-extension.mjs", historicalReceiptsModified: false,
  requirements: ["Show each full unaltered credit clearly and visibly beside its image.", "Keep source and license links active online.", "Mention later modifications; these delivered JPEGs retain the official bytes.", "Do not imply ESA/Hubble or ESO endorsement; controlled logos are not included."],
  totalByteSize: objects.reduce((sum, row) => sum + (row.byteSize ?? 0), 0),
  sourceEvidenceDirectory: evidenceDirectory, policies: [...policies.values()], objects,
};
storeImmutable(receiptPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`));
if (objects.every((row) => row.rightsStatus === "cleared")) verifyLocal();
else process.exitCode = 1;

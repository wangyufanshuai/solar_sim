import { createHash } from "node:crypto";

export const R74_SCHEMA_V661 = "mainline-a-r74-official-alternatives-v661";
export const R74_USER_AGENT_V661 = "SolarSim-MainlineA-R74-PageEvidence/1.0";
export const R74_TIMEOUT_MS_V661 = 30_000;
export const R74_MAX_HTML_BYTES_V661 = 1_000_000;
export const R74_RAW_DIR_V661 = "docs/release/v607/nebula-r74-v661/raw";
export const R74_LICENSE_PATH_V661 = "docs/release/v592/nebula-item-license-review-v592.json";
export const R74_PRIOR_OVERLAY_PATH_V661 = "app/data/mainlineANebulaR72SourceV659.generated.json";
export const R74_OVERLAY_PATH_V661 = "app/data/mainlineANebulaR74AlternativesV661.generated.json";

export const R74_SOURCES_V661 = Object.freeze([
  Object.freeze({ key: "ring-photojournal", targetId: "ring-nebula", kind: "photojournal",
    url: "https://science.nasa.gov/photojournal/ring-beholds-a-delicate-flower/",
    expectedTitle: "Ring Beholds a Delicate Flower", nasaId: "PIA07343",
    expectedTarget: "Ring Nebula", expectedObjectName: null }),
  Object.freeze({ key: "dumbbell-spitzer", targetId: "dumbbell-nebula", kind: "photojournal",
    url: "https://science.nasa.gov/photojournal/weighing-in-on-the-dumbbell-nebula/",
    expectedTitle: "Weighing in on the Dumbbell Nebula", nasaId: "PIA14417",
    expectedTarget: "Dumbbell Nebula", expectedObjectName: null }),
  Object.freeze({ key: "dumbbell-hubble", targetId: "dumbbell-nebula", kind: "hubble-asset",
    url: "https://science.nasa.gov/asset/hubble/the-dumbbell-nebula-m27/",
    expectedTitle: "The Dumbbell Nebula (M27)", nasaId: null,
    expectedTarget: null, expectedObjectName: "Dumbbell Nebula, M27, NGC 6853" }),
  Object.freeze({ key: "bubble-hubble", targetId: "bubble-nebula", kind: "hubble-asset",
    url: "https://science.nasa.gov/asset/hubble/mosaic-image-of-the-bubble-nebula/",
    expectedTitle: "Mosaic Image of the Bubble Nebula", nasaId: null,
    expectedTarget: null, expectedObjectName: null }),
  Object.freeze({ key: "cats-eye-photojournal", targetId: "cats-eye-nebula", kind: "photojournal",
    url: "https://science.nasa.gov/photojournal/galactic-dust-bunnies-found-to-contain-carbon-after-all/",
    expectedTitle: "Galactic Dust Bunnies Found to Contain Carbon After All", nasaId: "PIA11827",
    expectedTarget: "NGC 6543", expectedObjectName: null }),
  Object.freeze({ key: "omega-photojournal", targetId: "omega-nebula", kind: "photojournal",
    url: "https://science.nasa.gov/photojournal/celestial-sea-of-stars/",
    expectedTitle: "Celestial Sea of Stars", nasaId: "PIA12071",
    expectedTarget: "M17", expectedObjectName: null }),
]);

export const R74_TARGET_IDS_V661 = Object.freeze([
  "ring-nebula", "dumbbell-nebula", "bubble-nebula",
  "cats-eye-nebula", "omega-nebula",
]);

const SHA = /^[a-f0-9]{64}$/;

export function sha256R74V661(input) {
  return createHash("sha256").update(input).digest("hex");
}

export function sourceR74V661(key) {
  return R74_SOURCES_V661.find((source) => source.key === key) ?? null;
}

export function safePageUrlR74V661(url, source) {
  const canonical = sourceR74V661(source?.key);
  if (typeof url !== "string" || !canonical
    || source?.url !== canonical.url
    || source?.targetId !== canonical.targetId
    || source?.kind !== canonical.kind) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:"
      && parsed.hostname === "science.nasa.gov"
      && parsed.username === "" && parsed.password === ""
      && parsed.port === "" && parsed.hash === ""
      && parsed.href === source.url && url === source.url;
  } catch {
    return false;
  }
}

export function requestFingerprintR74V661(source) {
  if (!safePageUrlR74V661(source?.url, source)) {
    throw new Error("r74-source-v661:request-not-allowlisted");
  }
  return sha256R74V661(JSON.stringify({ method: "GET", url: source.url,
    headers: { accept: "text/html,application/xhtml+xml;q=0.9",
      "user-agent": R74_USER_AGENT_V661 }, redirect: "manual" }));
}

export function rawPathR74V661(source, hash) {
  if (!sourceR74V661(source?.key) || !SHA.test(hash ?? "")) {
    throw new Error("r74-source-v661:raw-identity-invalid");
  }
  return `${R74_RAW_DIR_V661}/${source.key}-${hash}.html`;
}

export function decodeHtmlR74V661(value) {
  const named = { amp: "&", quot: '"', apos: "'", nbsp: " ", lt: "<", gt: ">",
    ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", times: "×" };
  return String(value ?? "").replace(/&#(?:x([a-f0-9]+)|([0-9]+));/gi, (_, hex, decimal) => {
    const code = hex ? Number.parseInt(hex, 16) : Number.parseInt(decimal, 10);
    return Number.isInteger(code) && code > 0 && code <= 0x10ffff
      ? String.fromCodePoint(code) : "";
  }).replace(/&([a-z]+);/gi, (whole, key) => named[key.toLowerCase()] ?? whole);
}

export function textContentR74V661(html) {
  return decodeHtmlR74V661(String(html ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

export function normalizeTextR74V661(value) {
  return textContentR74V661(value).replace(/[‘’]/g, "'")
    .replace(/[\u00ad\u200b]/g, "").replace(/\s+/g, " ").trim();
}

function firstCapture(html, pattern) {
  return html.match(pattern)?.[1] ?? null;
}

function firstHeading(html) {
  const heading = firstCapture(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return heading ? normalizeTextR74V661(heading) : null;
}

function pageTitle(html) {
  const title = firstCapture(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return title ? normalizeTextR74V661(title).replace(/\s*[-–]\s*NASA Science\s*$/i, "") : null;
}

function photojournalTarget(html) {
  const segment = firstCapture(html,
    /<span\b[^>]*>\s*Target:\s*<\/span>([\s\S]{0,800}?)<\/ul>/i);
  return segment ? normalizeTextR74V661(firstCapture(segment,
    /<a\b[^>]*>([\s\S]*?)<\/a>/i)) : null;
}

function photojournalCredit(html) {
  const segment = firstCapture(html,
    /<div\b[^>]*class="[^"]*hds-credits[^"]*"[^>]*>([\s\S]{0,800}?)<\/div>/i);
  if (!segment) return null;
  const value = normalizeTextR74V661(segment).replace(/^Credits?:\s*/i, "");
  return value || null;
}

function labeledAssetValue(html, label) {
  const marker = new RegExp(`<span\\b[^>]*class="[^"]*stma-label[^"]*"[^>]*>\\s*${label}\\s*<\\/span>`, "i");
  const found = marker.exec(html);
  if (!found) return null;
  const slice = html.slice(found.index + found[0].length, found.index + found[0].length + 2200);
  const element = firstCapture(slice,
    /<div\b[^>]*class="[^"]*stma-title[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const value = element ? normalizeTextR74V661(element) : "";
  return value || null;
}

function photojournalId(html) {
  const item = firstCapture(html, /<figcaption>\s*(PIA[0-9]{5})\s*<\/figcaption>/i);
  return item?.toUpperCase() ?? null;
}

function downloadSection(html, source) {
  const marker = source.kind === "hubble-asset"
    ? '<div class="stma-downloads-wrapper'
    : '<div class="hds-list-row hds-file-list-row">';
  const heading = html.indexOf(">Downloads<", 190_000);
  const start = source.kind === "hubble-asset" ? 190_000 : Math.max(190_000, heading);
  const at = html.indexOf(marker, start);
  if (at < 0) return "";
  return html.slice(at, at + (source.kind === "hubble-asset" ? 80_000 : 45_000));
}

function downloads(html, source) {
  const segment = downloadSection(html, source);
  const rows = [];
  if (source.kind === "hubble-asset") {
    const blocks = segment.split(/<li\b/).slice(1, 15);
    for (const block of blocks) {
      const name = normalizeTextR74V661(firstCapture(block,
        /<div\b[^>]*class="[^"]*stma-download-name[^"]*"[^>]*>([\s\S]*?)<\/div>/i));
      const format = normalizeTextR74V661(firstCapture(block,
        /<span\b[^>]*class="[^"]*stma-download-details[^"]*"[^>]*>([\s\S]*?)<\/div>/i));
      const href = decodeHtmlR74V661(firstCapture(block,
        /<a\b[^>]*href="([^"]+)"[^>]*>/i));
      if (name && format && href) rows.push({ name, format, url: href });
    }
  } else {
    const blocks = segment.split(/<div\b[^>]*class="hds-list-row hds-file-list-row"[^>]*>/i).slice(1, 12);
    for (const block of blocks) {
      const href = decodeHtmlR74V661(firstCapture(block,
        /<a\b[^>]*aria-label="Download[^"]*"[^>]*href="([^"]+)"[^>]*>/i));
      const label = normalizeTextR74V661(firstCapture(block,
        /<h2\b[^>]*>([\s\S]*?)<\/h2>/i));
      const format = normalizeTextR74V661(firstCapture(block,
        /<div\b[^>]*class="[^"]*hds-file-list-filetype[^"]*"[^>]*>([\s\S]*?)<\/div>/i));
      const imageTag = firstCapture(block, /(<img\b[^>]*>)/i) ?? "";
      const width = Number(firstCapture(imageTag, /\bwidth="([0-9]+)"/i));
      const height = Number(firstCapture(imageTag, /\bheight="([0-9]+)"/i));
      const size = Number.isInteger(width) && Number.isInteger(height)
        && width > 0 && height > 0 ? `${width} × ${height}` : null;
      if (href) rows.push({ name: label || "download", format: format || null,
        size, url: href });
    }
  }
  return rows.filter((row) => {
    try { return new URL(row.url).protocol === "https:"; }
    catch { return false; }
  });
}

export function inspectPageR74V661(bytes, source) {
  const issues = [];
  if (!sourceR74V661(source?.key)) issues.push("source-not-allowlisted");
  const body = Buffer.from(bytes);
  if (body.length < 10_000 || body.length > R74_MAX_HTML_BYTES_V661) {
    issues.push("html-size-outside-official-page-window");
  }
  const html = body.toString("utf8");
  if (!/^\s*<!doctype html/i.test(html)) issues.push("html-doctype-missing");
  if (!html.includes("science.nasa.gov") || !html.includes("NASA")) {
    issues.push("nasa-page-shell-missing");
  }
  const title = firstHeading(html) ?? pageTitle(html);
  const browserTitle = pageTitle(html);
  const nasaId = source.kind === "photojournal" ? photojournalId(html) : null;
  const target = source.kind === "photojournal" ? photojournalTarget(html) : null;
  const objectName = source.kind === "hubble-asset"
    ? labeledAssetValue(html, "Object Name") : null;
  const credit = source.kind === "photojournal"
    ? photojournalCredit(html) : labeledAssetValue(html, "Credit");
  const availableDownloads = downloads(html, source);
  if (normalizeTextR74V661(title).toLowerCase()
    !== normalizeTextR74V661(source.expectedTitle).toLowerCase()) {
    issues.push("title-identity-mismatch");
  }
  if (source.kind === "photojournal" && nasaId !== source.nasaId) {
    issues.push("photojournal-id-mismatch");
  }
  if (source.kind === "photojournal" && !target) issues.push("target-field-missing");
  if (source.expectedObjectName && normalizeTextR74V661(objectName).toLowerCase()
    !== normalizeTextR74V661(source.expectedObjectName).toLowerCase()) {
    issues.push("object-name-mismatch");
  }
  if (!credit) issues.push("credit-missing");
  if (availableDownloads.length === 0) issues.push("downloads-missing");
  const targetConflict = source.kind === "photojournal" && target != null
    && normalizeTextR74V661(target).toLowerCase()
      !== normalizeTextR74V661(source.expectedTarget).toLowerCase();
  if (targetConflict) issues.push("target-identity-conflict");
  const partnerMarkers = ["STScI", "AURA", "ESA", "CSA", "Harvard-Smithsonian",
    "Univ. of Wisc.", "University of Wisconsin"].filter((token) =>
    credit?.toLowerCase().includes(token.toLowerCase()));
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), sourceKey: source.key, targetId: source.targetId,
    title, browserTitle, nasaId, target, objectName, credit,
    partnerMarkers: Object.freeze(partnerMarkers),
    downloads: Object.freeze(availableDownloads),
    identityState: targetConflict ? "identity-conflict"
      : issues.some((issue) => /identity|target-field|object-name/.test(issue))
        ? "identity-unverified" : "page-identity-confirmed",
    rightsStatus: "pending", imageRequestExecuted: false,
    imageResponseCaptured: 0, runtimeAdmission: "candidate-only", hold: true,
    notAdmitted: true, scientificPayloadWriteback: false });
}

export function validatePriorPolicyR74V661(license, priorOverlay) {
  const issues = [];
  if (license?.version !== "v592-nebula-item-license-review-v1"
    || license?.policy?.automaticRetryAllowed !== false
    || license?.policy?.visualAssetAdmissionGranted !== false) {
    issues.push("license-policy-boundary-invalid");
  }
  if (priorOverlay?.schema !== "mainline-a-r72-expansion-overlay-v659"
    || priorOverlay?.counts?.blockedImageRequestsUnexecuted !== 5
    || priorOverlay?.counts?.rightsSigned !== 0
    || priorOverlay?.counts?.runtimeAdmitted !== 0) {
    issues.push("prior-overlay-boundary-invalid");
  }
  const blocked = new Set(license?.blockedTargets ?? []);
  for (const id of R74_TARGET_IDS_V661) {
    const row = priorOverlay?.rows?.find((item) => item.id === id);
    if (!blocked.has(id) || row?.imageAcquisitionAllowed !== false
      || row?.imageRequestExecuted !== false || row?.imageRaw !== null
      || row?.rightsStatus !== "pending" || row?.hold !== true
      || row?.notAdmitted !== true || row?.scientificPayloadWriteback !== false) {
      issues.push(`${id}:prior-hold-drift`);
    }
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}

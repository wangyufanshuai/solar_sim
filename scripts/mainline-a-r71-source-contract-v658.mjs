import { createHash } from "node:crypto";

export const R71_SCHEMA_V658 = "mainline-a-r71-official-source-v658";
export const R71_ACCEPT_HTML_V658 = "text/html,application/xhtml+xml;q=0.9";
export const R71_ACCEPT_JPEG_V658 = "image/jpeg";
export const R71_USER_AGENT_V658 = "SolarSim-MainlineA-R71-SourceAudit/1.0";
export const R71_MAX_HTML_BYTES_V658 = 2_000_000;
export const R71_MAX_JPEG_BYTES_V658 = 60_000_000;
export const R71_TIMEOUT_MS_V658 = 30_000;
export const R71_RETRIES_V658 = 1;
export const R71_RAW_DIR_V658 = "docs/release/v607/nebula-r71-v658/raw";
export const R71_LEDGER_DIR_V658 = "docs/release/v607";

export const R71_TARGETS_V658 = Object.freeze([
  Object.freeze({ id: "w40-nebula", nasaId: "PIA23121", catalog: "W40",
    title: "Space Butterfly", credit: "NASA/JPL-Caltech",
    slug: "space-butterfly" }),
  Object.freeze({ id: "sh2-235-nebula", nasaId: "PIA13995", catalog: "Sh2-235",
    title: "WISE Eyes Evolution of Massive Stars",
    credit: "NASA/JPL-Caltech/UCLA",
    slug: "wise-eyes-evolution-of-massive-stars" }),
  Object.freeze({ id: "flaming-star-nebula", nasaId: "PIA13447", catalog: "IC 405",
    title: "WISE Catches a Runaway Star in Flames",
    credit: "NASA/JPL-Caltech/UCLA",
    slug: "wise-catches-a-runaway-star-in-flames" }),
  Object.freeze({ id: "spider-nebula", nasaId: "PIA20357", catalog: "IC 417",
    title: "The Spider Nebula", credit: "NASA/JPL-Caltech/2MASS",
    slug: "the-spider-nebula" }),
  Object.freeze({ id: "tarantula-nebula", nasaId: "PIA23646", catalog: "NGC 2070",
    title: "Tarantula Nebula Spitzer 2-Color Image",
    credit: "NASA/JPL-Caltech",
    slug: "tarantula-nebula-spitzer-2-color-image" }),
  Object.freeze({ id: "tadpole-nebula", nasaId: "PIA13110", catalog: "IC 410",
    title: "Asteroid Caught Marching Across Tadpole Nebula",
    credit: "NASA/JPL-Caltech/UCLA",
    slug: "asteroid-caught-marching-across-tadpole-nebula" }),
]);

const SHA = /^[a-f0-9]{64}$/;
const NASA_IMAGE_PREFIX =
  "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/";

export function sha256R71V658(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function targetByIdR71V658(id) {
  return R71_TARGETS_V658.find((target) => target.id === id) ?? null;
}

export function pageUrlR71V658(target) {
  return `https://science.nasa.gov/photojournal/${target.slug}/`;
}

export function legacyPageUrlR71V658(target) {
  return `https://photojournal.jpl.nasa.gov/catalog/${target.nasaId}`;
}

function recognizedTarget(target) {
  const canonical = targetByIdR71V658(target?.id);
  return Boolean(canonical && target.nasaId === canonical.nasaId
    && target.slug === canonical.slug && target.title === canonical.title
    && target.credit === canonical.credit);
}

export function officialImageUrlR71V658(target) {
  const group = target.nasaId.slice(0, 5).toLowerCase();
  const folder = target.nasaId.toLowerCase();
  return `${NASA_IMAGE_PREFIX}${group}/${folder}/${target.nasaId}.jpg`;
}

function plainHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      && !url.port && !url.search && !url.hash && url.href === value;
  } catch {
    return false;
  }
}

export function safePageUrlR71V658(url, target) {
  return Boolean(plainHttps(url) && recognizedTarget(target)
    && (url === pageUrlR71V658(target)
      || url === pageUrlR71V658(target).slice(0, -1)
      || url === legacyPageUrlR71V658(target)));
}

export function safeImageUrlR71V658(url, target) {
  return Boolean(plainHttps(url) && recognizedTarget(target)
    && url === officialImageUrlR71V658(target));
}

export function safeArtifactPathR71V658(id, kind, sha) {
  const target = targetByIdR71V658(id);
  if (!target || !["page", "image"].includes(kind) || !SHA.test(sha ?? "")) {
    throw new Error("r71-source-v658:artifact-identity-invalid");
  }
  const extension = kind === "page" ? "html" : "jpg";
  return `${R71_RAW_DIR_V658}/${target.id}-${kind}-${sha}.${extension}`;
}

export function fingerprintR71V658(url, kind, target) {
  const safe = kind === "page" ? safePageUrlR71V658(url, target)
    : kind === "image" && safeImageUrlR71V658(url, target);
  if (!safe) throw new Error("r71-source-v658:unsafe-request");
  return sha256R71V658(JSON.stringify({ method: "GET", url,
    headers: { accept: kind === "page" ? R71_ACCEPT_HTML_V658
      : R71_ACCEPT_JPEG_V658, "user-agent": R71_USER_AGENT_V658 } }));
}

export function validateR71InputsV658(review, rights) {
  const issues = [];
  const records = Array.isArray(review?.records) ? review.records : [];
  const rightsRows = Array.isArray(rights?.records) ? rights.records : [];
  if (review?.schema !== "mainline-a-nebula-review-pack-v612"
    || rights?.schema !== "mainline-a-nebula-rights-pack-v613"
    || records.length !== 18 || rightsRows.length !== 18) {
    issues.push("source-manifests-invalid");
  }
  const rows = [];
  for (const target of R71_TARGETS_V658) {
    const record = records.find((row) => row?.id === target.id);
    const right = rightsRows.find((row) => row?.candidateId === target.id);
    if (!record || !right || record.nasaId !== target.nasaId
      || record.catalogName !== target.catalog || record.source?.credit !== target.credit
      || record.source?.sha256 !== record.localEvidence?.sha256
      || record.source?.sha256 !== right.sourceSha256
      || record.source?.url !== right.sourceUrl
      || record.source?.localPath !== right.sourceLocalPath
      || record.localEvidence?.status !== "verified"
      || record.localEvidence?.bytes !== record.source?.bytes
      || !SHA.test(record.source?.sha256 ?? "")
      || right.evidence?.status !== "pending"
      || right.evidence?.reviewer !== null
      || record.runtime?.candidateOnly !== true
      || record.runtime?.visualAssetAdmitted !== false
      || record.runtime?.scienceImagePayloadAllowed !== false) {
      issues.push(`${target.id}:identity-rights-or-local-pin-invalid`);
      continue;
    }
    rows.push(Object.freeze({ ...target,
      pageUrl: pageUrlR71V658(target),
      legacyPageUrl: legacyPageUrlR71V658(target),
      officialImageUrl: officialImageUrlR71V658(target),
      original: Object.freeze({ path: record.localEvidence.path,
        sha256: record.localEvidence.sha256,
        bytes: record.localEvidence.bytes,
        width: record.localEvidence.dimensions.width,
        height: record.localEvidence.dimensions.height }),
      rightsStatus: "pending", runtimeAdmission: "candidate-only",
      scientificPayloadWriteback: false }));
  }
  if (rows.length !== 6 || new Set(rows.map((row) => row.id)).size !== 6) {
    issues.push("six-distinct-targets-required");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), rows: Object.freeze(rows) });
}

function decodeEntities(input) {
  return String(input).replace(/&#(x[0-9a-f]+|\d+);?/gi, (match, raw) => {
    const code = raw[0]?.toLowerCase() === "x"
      ? Number.parseInt(raw.slice(1), 16) : Number.parseInt(raw, 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff
      ? String.fromCodePoint(code) : match;
  }).replace(/&(amp|lt|gt|quot|apos|nbsp|rsquo|lsquo|ldquo|rdquo);/gi,
    (match, entity) => ({ amp: "&", lt: "<", gt: ">", quot: '"',
      apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘",
      ldquo: "“", rdquo: "”" })[entity.toLowerCase()] ?? match);
}

function normalizeText(value) {
  return decodeEntities(value).replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, " ").trim();
}

function visibleText(html) {
  return normalizeText(html.replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " "));
}

export function inspectOfficialPageR71V658(bytes, row) {
  const html = Buffer.from(bytes ?? []).toString("utf8");
  const target = targetByIdR71V658(row?.id);
  const issues = [];
  if (!target || row?.nasaId !== target.nasaId
    || row?.pageUrl !== pageUrlR71V658(target)) issues.push("target-invalid");
  if (Buffer.byteLength(html) < 1_000
    || Buffer.byteLength(html) > R71_MAX_HTML_BYTES_V658) issues.push("html-size-invalid");
  const title = normalizeText(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "");
  const text = visibleText(html);
  if (!target || title !== `${target.title} - NASA Science`) issues.push("title-mismatch");
  if (!target || !new RegExp(`\\b${target.nasaId}\\b`, "i").test(text)) {
    issues.push("nasa-id-not-visible");
  }
  if (!target || !text.includes(`Credits: ${target.credit}`)) {
    issues.push("credit-mismatch");
  }
  const urls = new Set();
  for (const match of html.matchAll(/https:\/\/assets\.science\.nasa\.gov\/content\/dam\/[^"'<>\s]+?\.jpg/gi)) {
    const url = decodeEntities(match[0]);
    if (target && safeImageUrlR71V658(url, target)) urls.add(url);
  }
  if (urls.size !== 1) issues.push("official-jpeg-link-missing-or-ambiguous");
  if (/\b(?:synthetic response|test fixture|mock nasa page)\b/i.test(text)) {
    issues.push("fixture-marker-present");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), title, visibleNasaId: target?.nasaId ?? null,
    officialCredit: target?.credit ?? null, officialImageUrl: urls.size === 1
      ? [...urls][0] : null, rightsStatus: "pending",
    runtimeAdmission: "candidate-only", scientificPayloadWriteback: false });
}

export function inspectJpegR71V658(bytes) {
  const value = Buffer.from(bytes ?? []);
  const issues = [];
  if (value.length < 100 || value.length > R71_MAX_JPEG_BYTES_V658) {
    issues.push("jpeg-size-invalid");
  }
  if (value[0] !== 0xff || value[1] !== 0xd8
    || value.at(-2) !== 0xff || value.at(-1) !== 0xd9) {
    issues.push("jpeg-signature-invalid");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), sha256: sha256R71V658(value), bytes: value.length });
}

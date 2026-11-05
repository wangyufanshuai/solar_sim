import { createHash } from "node:crypto";

export const R72_SCHEMA_V659 = "mainline-a-r72-expansion-source-v659";
export const R72_USER_AGENT_V659 = "SolarSim-MainlineA-R72-SourceAudit/1.0";
export const R72_TIMEOUT_MS_V659 = 30_000;
export const R72_MAX_JSON_BYTES_V659 = 1_000_000;
export const R72_MAX_HTML_BYTES_V659 = 2_000_000;
export const R72_MAX_IMAGE_BYTES_V659 = 60_000_000;
export const R72_RAW_DIR_V659 = "docs/release/v607/nebula-r72-v659/raw";
export const R72_EXPANSION_PATH_V659 =
  "app/data/mainlineABetaNebulaExpansionV617.generated.json";
export const R72_LICENSE_PATH_V659 =
  "docs/release/v592/nebula-item-license-review-v592.json";

export const R72_TARGETS_V659 = Object.freeze([
  Object.freeze({ id: "ring-nebula", nasaId: "GSFC_20171208_Archive_e001464",
    title: "Hubble reveals the Ring Nebula’s true shape", pageKind: "library-shell" }),
  Object.freeze({ id: "dumbbell-nebula", nasaId: "PIA04249",
    title: "Close-up of M27, the Dumbbell Nebula", pageKind: "photojournal",
    slug: "pj-close-up-of-m27-the-dumbbell-nebula" }),
  Object.freeze({ id: "california-nebula", nasaId: "PIA23650",
    title: "Spitzer California Nebula Mosaic", pageKind: "photojournal",
    slug: "spitzer-california-nebula-mosaic" }),
  Object.freeze({ id: "bubble-nebula", nasaId: "GSFC_20171208_Archive_e000382",
    title: "Hubble Sees a Star ‘Inflating’ a Giant Bubble", pageKind: "library-shell" }),
  Object.freeze({ id: "cats-eye-nebula", nasaId: "GSFC_20171208_Archive_e002155",
    title: "Cat's Eye Nebula", pageKind: "library-shell" }),
  Object.freeze({ id: "omega-nebula", nasaId: "PIA23409",
    title: "SOFIA Reveals How the Swan Nebula Hatched", pageKind: "photojournal",
    slug: "sofia-reveals-how-the-swan-nebula-hatched" }),
]);

const SHA = /^[a-f0-9]{64}$/i;
const ID = /^[A-Za-z0-9_]+$/;

export function sha256R72V659(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function targetR72V659(id) {
  return R72_TARGETS_V659.find((target) => target.id === id) ?? null;
}

export function canonicalPageUrlR72V659(target) {
  return target.pageKind === "photojournal"
    ? `https://science.nasa.gov/photojournal/${target.slug}/`
    : `https://images.nasa.gov/details/${target.nasaId}`;
}

export function initialPageUrlR72V659(target) {
  return target.pageKind === "photojournal"
    ? `https://photojournal.jpl.nasa.gov/catalog/${target.nasaId}`
    : canonicalPageUrlR72V659(target);
}

export function searchUrlR72V659(target) {
  return `https://images-api.nasa.gov/search?nasa_id=${target.nasaId}`;
}

export function assetUrlR72V659(target) {
  return `https://images-api.nasa.gov/asset/${target.nasaId}`;
}

export function officialImageUrlR72V659(target) {
  return `https://images-assets.nasa.gov/image/${target.nasaId}/${target.nasaId}~orig.jpg`;
}

function plainHttps(url) {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.username === ""
      && parsed.password === "" && parsed.port === ""
      && parsed.hash === "" && parsed.href === url;
  } catch {
    return false;
  }
}

export function safeRequestUrlR72V659(kind, url, row) {
  const target = targetR72V659(row?.id);
  if (!target || row?.nasaId !== target.nasaId || !plainHttps(url)) return false;
  if (kind === "page") return url === initialPageUrlR72V659(target)
    || url === canonicalPageUrlR72V659(target)
    || target.pageKind === "photojournal"
      && url === canonicalPageUrlR72V659(target).slice(0, -1);
  if (kind === "search") return url === searchUrlR72V659(target);
  if (kind === "asset") return url === assetUrlR72V659(target);
  if (kind === "image") return row.imageAcquisitionAllowed === true
    && url === officialImageUrlR72V659(target);
  return false;
}

export function acceptForR72V659(kind) {
  if (kind === "page") return "text/html,application/xhtml+xml;q=0.9";
  if (kind === "search" || kind === "asset") return "application/json";
  if (kind === "image") return "image/jpeg";
  throw new Error("r72-source-v659:kind-invalid");
}

export function maxBytesR72V659(kind) {
  if (kind === "page") return R72_MAX_HTML_BYTES_V659;
  if (kind === "search" || kind === "asset") return R72_MAX_JSON_BYTES_V659;
  if (kind === "image") return R72_MAX_IMAGE_BYTES_V659;
  throw new Error("r72-source-v659:kind-invalid");
}

export function fingerprintR72V659(kind, url, row) {
  if (!safeRequestUrlR72V659(kind, url, row)) {
    throw new Error("r72-source-v659:unsafe-request");
  }
  return sha256R72V659(JSON.stringify({ method: "GET", url,
    headers: { accept: acceptForR72V659(kind),
      "user-agent": R72_USER_AGENT_V659 } }));
}

export function artifactPathR72V659(id, kind, sha) {
  if (!targetR72V659(id) || !["page", "search", "asset", "image"].includes(kind)
    || !SHA.test(sha ?? "")) {
    throw new Error("r72-source-v659:artifact-identity-invalid");
  }
  const extension = kind === "page" ? "html" : kind === "image" ? "jpg" : "json";
  return `${R72_RAW_DIR_V659}/${id}-${kind}-${sha}.${extension}`;
}

export function validateInputsR72V659(expansion, license) {
  const issues = [];
  const records = Array.isArray(expansion?.records) ? expansion.records : [];
  const reviews = Array.isArray(license?.reviews) ? license.reviews : [];
  if (expansion?.schema !== "mainline-a-beta-nebula-expansion-v617"
    || expansion?.counts?.baseCandidates !== 18
    || expansion?.counts?.expansionCandidates !== 6
    || expansion?.counts?.candidateTotal !== 24
    || expansion?.counts?.runtimeAdmitted !== 0
    || expansion?.sourceBoundary?.visualAssetAdmission !== false
    || expansion?.sourceBoundary?.scienceImagePayloadWriteback !== false
    || expansion?.sourceBoundary?.legalDecision !== "not-granted"
    || license?.version !== "v592-nebula-item-license-review-v1"
    || license?.policy?.automaticRetryAllowed !== false
    || license?.policy?.visualAssetAdmissionGranted !== false
    || records.length !== 6) issues.push("input-pack-boundary-invalid");
  const rows = [];
  for (const [index, target] of R72_TARGETS_V659.entries()) {
    const record = records[index];
    const review = reviews.find((item) => item?.target === target.id);
    const eligible = target.id === "california-nebula";
    if (record?.candidateId !== target.id || record?.expansionRank !== index + 1
      || record?.source?.nasaId !== target.nasaId
      || record?.source?.sourceUrl !== officialImageUrlR72V659(target)
      || record?.source?.previewUrl !== record?.source?.sourceUrl
      || record?.source?.licenseUrl !== expansion?.sourceBoundary?.policyUrl
      || !SHA.test(record?.source?.metadataSha256 ?? "")
      || review?.nasaId !== target.nasaId || review?.title !== target.title
      || review?.status !== record?.acquisitionDecision
      || review?.visualAssetAdmitted !== false
      || record?.receipts?.licenseReviewSha256 !== license?.receiptSha256
      || record?.runtime?.candidateOnly !== true
      || record?.runtime?.visualAssetAdmitted !== false
      || record?.runtime?.scienceImagePayloadAllowed !== false
      || !record?.blockers?.includes("rights-review-pending")
      || (eligible && (record?.acquisitionDecision
        !== "eligible-for-explicit-single-request-visual-source-acquisition"
        || record?.payload?.state !== "local-payload-present"
        || !SHA.test(record?.payload?.sha256 ?? "")))
      || (!eligible && (record?.acquisitionDecision
        !== "blocked-item-license-identity-or-texture-suitability-review"
        || record?.payload?.state !== "payload-acquisition-pending"
        || record?.payload?.localPath !== null))) {
      issues.push(`${target.id}:source-policy-or-rights-invalid`);
      continue;
    }
    rows.push(Object.freeze({ id: target.id, nasaId: target.nasaId,
      title: target.title, rank: index + 1, pageKind: target.pageKind,
      pageUrl: canonicalPageUrlR72V659(target),
      initialPageUrl: initialPageUrlR72V659(target),
      searchUrl: searchUrlR72V659(target),
      assetUrl: assetUrlR72V659(target),
      imageUrl: officialImageUrlR72V659(target),
      expectedCredit: record.source.credit,
      imageAcquisitionAllowed: eligible,
      acquisitionDecision: record.acquisitionDecision,
      blockers: Object.freeze([...record.blockers]),
      historicalLocal: eligible ? Object.freeze({ path: record.payload.localPath,
        bytes: record.payload.bytes, sha256: record.payload.sha256,
        width: record.payload.width, height: record.payload.height }) : null,
      metadata: Object.freeze({ path: record.source.metadataPath,
        sha256: record.source.metadataSha256 }),
      rightsStatus: "pending", runtimeAdmission: "candidate-only",
      scientificPayloadWriteback: false }));
  }
  if (rows.length !== 6 || new Set(rows.map((row) => row.id)).size !== 6) {
    issues.push("six-distinct-targets-required");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), rows: Object.freeze(rows) });
}

function normalizeText(value) {
  return String(value ?? "").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
}

export function inspectSearchR72V659(bytes, row) {
  const issues = [];
  let parsed = null;
  try { parsed = JSON.parse(Buffer.from(bytes).toString("utf8")); }
  catch { issues.push("json-invalid"); }
  const items = parsed?.collection?.items;
  if (parsed?.collection?.version !== "1.1" || !Array.isArray(items)
    || items.length !== 1) issues.push("one-nasa-item-required");
  const item = items?.[0];
  const data = item?.data?.[0];
  if (data?.nasa_id !== row?.nasaId || data?.media_type !== "image"
    || normalizeText(data?.title) !== normalizeText(row?.title)) {
    issues.push("nasa-id-title-or-media-mismatch");
  }
  const actualCredit = data?.secondary_creator || data?.creator || "";
  const creditVerified = normalizeText(actualCredit)
    === normalizeText(row?.expectedCredit);
  if (row?.pageKind === "photojournal" && !creditVerified) {
    issues.push("credit-mismatch");
  }
  if (item?.href !== `https://images-assets.nasa.gov/image/${row?.nasaId}/collection.json`) {
    issues.push("collection-link-mismatch");
  }
  if (!Array.isArray(item?.links) || !item.links.some((link) =>
    link?.href === row?.imageUrl && link?.render === "image")) {
    issues.push("original-link-not-listed");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), nasaId: data?.nasa_id ?? null,
    title: data?.title ?? null, credit: actualCredit || null,
    creditVerified,
    creditLimitation: creditVerified ? null
      : "current-structured-record-omits-item-credit",
    center: data?.center ?? null, itemCount: items?.length ?? 0,
    originalLinkListed: Array.isArray(item?.links)
      && item.links.some((link) => link?.href === row?.imageUrl),
    rightsStatus: "pending", scientificPayloadWriteback: false });
}

export function inspectAssetR72V659(bytes, row) {
  const issues = [];
  let parsed = null;
  try { parsed = JSON.parse(Buffer.from(bytes).toString("utf8")); }
  catch { issues.push("json-invalid"); }
  const items = parsed?.collection?.items;
  if (parsed?.collection?.version !== "1.1" || !Array.isArray(items)) {
    issues.push("asset-collection-invalid");
  }
  const original = items?.filter((item) => typeof item?.href === "string"
    && item.href.endsWith("~orig.jpg")) ?? [];
  const normalized = original.map((item) => item.href.replace(
    /^http:\/\/images-assets\.nasa\.gov\//, "https://images-assets.nasa.gov/"));
  if (normalized.length !== 1 || normalized[0] !== row?.imageUrl) {
    issues.push("asset-original-link-mismatch");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), originalImageUrl: normalized[0] ?? null,
    originalLinkProtocol: original[0]?.href?.startsWith("http:")
      ? "http-listed-normalized-to-https" : "https-listed",
    rightsStatus: "pending", scientificPayloadWriteback: false });
}

export function inspectPageR72V659(bytes, row) {
  const html = Buffer.from(bytes).toString("utf8");
  const issues = [];
  if (Buffer.byteLength(html) < 10_000
    || Buffer.byteLength(html) > R72_MAX_HTML_BYTES_V659
    || !/^\s*<!doctype html/i.test(html)) issues.push("html-shape-invalid");
  if (/\b(?:synthetic response|test fixture|mock nasa page)\b/i.test(html)) {
    issues.push("fixture-marker-present");
  }
  const visible = normalizeText(html.replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " "));
  const title = normalizeText(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]);
  const identityVerified = row?.pageKind === "photojournal"
    && title === `${row.title} - NASA Science`
    && visible.includes(row.nasaId)
    && visible.includes(`Credits: ${row.expectedCredit}`);
  if (row?.pageKind === "photojournal" && !identityVerified) {
    issues.push("photojournal-identity-or-credit-mismatch");
  }
  if (row?.pageKind === "library-shell"
    && (!html.includes("NASA Image and Video Library")
      || !html.includes("<app-root"))) {
    issues.push("library-shell-marker-missing");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), title,
    identityVerified, sourcePageKind: row?.pageKind ?? null,
    limitation: identityVerified ? null : "generic-library-shell-not-item-identity-evidence",
    rightsStatus: "pending", scientificPayloadWriteback: false });
}

export function inspectJpegR72V659(bytes) {
  const body = Buffer.from(bytes ?? []);
  const issues = [];
  if (body.length < 100 || body.length > R72_MAX_IMAGE_BYTES_V659) {
    issues.push("jpeg-size-invalid");
  }
  if (body[0] !== 0xff || body[1] !== 0xd8
    || body.at(-2) !== 0xff || body.at(-1) !== 0xd9) {
    issues.push("jpeg-signature-invalid");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), bytes: body.length,
    sha256: sha256R72V659(body) });
}

export function validNasaIdR72V659(value) {
  return typeof value === "string" && ID.test(value)
    && R72_TARGETS_V659.some((target) => target.nasaId === value);
}

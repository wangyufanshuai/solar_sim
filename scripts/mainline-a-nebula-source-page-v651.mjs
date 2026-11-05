import { createHash } from "node:crypto";

export const V651_BATCH_PATH = "app/data/mainlineANebulaBatchV628.generated.json";
export const V651_ARTIFACT_DIR = "docs/release/v607/nebula-source-pages/v651";
export const V651_EVIDENCE_DIR = "docs/release/v607";
export const V651_ACCEPT = "text/html,application/xhtml+xml;q=0.9";
export const V651_USER_AGENT = "SolarSim-MainlineA-NebulaSourcePage/1.0";
export const V651_MAX_BYTES = 2_000_000;
export const V651_TIMEOUT_MS = 20_000;
export const V651_RETRIES = 1;
export const V651_SOURCE_PAGES = Object.freeze([
  Object.freeze({ id: "jellyfish-nebula", nasaId: "PIA13449",
    title: "An Explosion of Infrared Color",
    url: "https://science.nasa.gov/photojournal/an-explosion-of-infrared-color/" }),
  Object.freeze({ id: "cocoon-nebula", nasaId: "PIA13441",
    title: "Cosmic Cocoon",
    url: "https://science.nasa.gov/photojournal/cosmic-cocoon/" }),
  Object.freeze({ id: "rho-ophiuchi-cloud", nasaId: "PIA10182",
    title: "Young Stars in Their Baby Blanket of Dust",
    url: "https://science.nasa.gov/photojournal/young-stars-in-their-baby-blanket-of-dust-2/" }),
  Object.freeze({ id: "cepheus-c-nebula", nasaId: "PIA23127",
    title: "Cepheus C and Cepheus B Region by Spitzer (One-Instrument)",
    url: "https://science.nasa.gov/photojournal/cepheus-c-and-cepheus-b-region-by-spitzer-one-instrument/" }),
  Object.freeze({ id: "dragon-lair-nebula", nasaId: "PIA13240",
    title: "Dragon's Lair",
    url: "https://science.nasa.gov/photojournal/dragons-lair/" }),
  Object.freeze({ id: "monkey-head-nebula", nasaId: "PIA19836",
    title: "Seeing Beyond the 'Monkey Head'",
    url: "https://science.nasa.gov/photojournal/seeing-beyond-the-monkey-head/" }),
]);

export function sha256V651(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
export function sourcePageByIdV651(id) {
  return V651_SOURCE_PAGES.find((entry) => entry.id === id) ?? null;
}
export function validateSourcePageUrlV651(value, expected) {
  try {
    const canonical = sourcePageByIdV651(expected?.id);
    if (!canonical || expected?.url !== canonical.url
      || expected?.nasaId !== canonical.nasaId
      || expected?.title !== canonical.title) return false;
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "science.nasa.gov"
      && url.port === "" && url.username === "" && url.password === ""
      && url.search === "" && url.hash === ""
      && url.href === expected?.url;
  } catch {
    return false;
  }
}
export function validateBatchRowsV651(batch) {
  const issues = [];
  const rows = Array.isArray(batch?.rows) ? batch.rows : [];
  if (batch?.schema !== "mainline-a-nebula-batch-v628" || rows.length !== 6
    || batch?.boundary?.scientificPayloadWriteback !== false) {
    issues.push("batch-contract-invalid");
  }
  if (new Set(rows.map((row) => row?.id)).size !== 6) issues.push("batch-ids-duplicate");
  for (const source of V651_SOURCE_PAGES) {
    const row = rows.find((candidate) => candidate?.id === source.id);
    if (!row || row.source?.nasaId !== source.nasaId
      || !row.source?.credit || !row.source?.url?.startsWith(
        `https://images-assets.nasa.gov/image/${source.nasaId}/`)
      || row.network?.responseCaptured !== 1
      || row.rights?.signoffStatus !== "pending"
      || row.scientificPayloadWriteback !== false) {
      issues.push(`${source.id}:batch-link-invalid`);
    }
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues) });
}
export function fingerprintSourcePageRequestV651(source) {
  if (!validateSourcePageUrlV651(source?.url, source)) {
    throw new Error("source-page-v651:unsafe-request-url");
  }
  return sha256V651(JSON.stringify({ method: "GET", url: source.url,
    headers: { accept: V651_ACCEPT, "user-agent": V651_USER_AGENT } }));
}
export function artifactPathV651(source, digest) {
  if (!sourcePageByIdV651(source?.id)
    || source.nasaId !== sourcePageByIdV651(source.id).nasaId
    || !/^[a-f0-9]{64}$/.test(digest ?? "")) {
    throw new Error("source-page-v651:artifact-identity-invalid");
  }
  return `${V651_ARTIFACT_DIR}/${source.id}-${source.nasaId.toLowerCase()}-${digest}.html`;
}

function decodeHtmlV651(input) {
  return String(input).replace(/&#(x[0-9a-f]+|\d+);?/gi, (match, value) => {
    const code = value[0]?.toLowerCase() === "x"
      ? Number.parseInt(value.slice(1), 16) : Number.parseInt(value, 10);
    return Number.isFinite(code) && code > 0 && code <= 0x10ffff
      ? String.fromCodePoint(code) : match;
  }).replace(/&(amp|lt|gt|quot|apos|nbsp|rsquo|lsquo|ldquo|rdquo|ndash|mdash);/gi,
    (_, entity) => ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
      nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
      ndash: "–", mdash: "—" })[entity.toLowerCase()] ?? _);
}
function normalizeTextV651(value) {
  return decodeHtmlV651(value).replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, " ").trim();
}
function visibleTextV651(html) {
  const withoutCode = html.replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
  return normalizeTextV651(withoutCode.replace(/<[^>]*>/g, " "));
}
function titleV651(html) {
  const match = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? normalizeTextV651(match[1]) : null;
}
function linkedAssetIdsV651(html) {
  const ids = new Set();
  for (const match of html.matchAll(/https:\/\/assets\.science\.nasa\.gov\/[a-z0-9/%._~-]+/gi)) {
    const decoded = decodeHtmlV651(match[0]);
    for (const idMatch of decoded.matchAll(/\bPIA\d{5}\b/gi)) ids.add(idMatch[0].toUpperCase());
  }
  return [...ids].sort();
}

export function inspectOfficialSourcePageV651(html, source, expectedCredit) {
  const issues = [];
  if (typeof html !== "string" || html.length < 1_000
    || html.length > V651_MAX_BYTES) issues.push("html-size-invalid");
  if (!sourcePageByIdV651(source?.id)
    || !validateSourcePageUrlV651(source?.url, source)
    || !/^PIA\d{5}$/.test(source?.nasaId ?? "")) issues.push("source-identity-invalid");
  const title = titleV651(html ?? "");
  const text = visibleTextV651(html ?? "");
  const normalizedTitle = normalizeTextV651(source?.title ?? "");
  const normalizedCredit = normalizeTextV651(expectedCredit ?? "");
  if (!title || !title.includes(normalizedTitle) || !title.endsWith("NASA Science")) {
    issues.push("official-title-mismatch");
  }
  if (!new RegExp(`\\b${source?.nasaId ?? "PIA00000"}\\b`, "i").test(text)) {
    issues.push("nasa-id-not-visible");
  }
  if (!normalizedCredit || !text.includes(`Credits: ${normalizedCredit}`)) {
    issues.push("official-credit-mismatch");
  }
  const linkedAssetIds = linkedAssetIdsV651(html ?? "");
  if (!linkedAssetIds.includes(source?.nasaId)) issues.push("official-image-link-missing");
  if (/\b(?:synthetic response|test fixture|mock nasa page)\b/i.test(text)) {
    issues.push("fixture-marker-present");
  }
  return Object.freeze({ status: issues.length === 0
    ? "verified-official-source-page-candidate" : "blocked",
    issues: Object.freeze(issues), pageTitle: title,
    nasaId: source?.nasaId ?? null, officialCredit: normalizedCredit,
    linkedAssetIds: Object.freeze(linkedAssetIds),
    rightsSignoff: "pending", runtimeAdmission: "candidate-only",
    scientificPayloadWriteback: false });
}

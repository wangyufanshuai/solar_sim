import { createHash } from "node:crypto";
import {
  extractOfficialJpegUrlV652, safeOfficialJpegUrlV652,
} from "./mainline-a-nebula-page-image-link-v652.mjs";

export const B1_BATCH = "app/data/mainlineANebulaBatchV624.generated.json";
export const B1_DISCOVERY = "docs/release/v607/mainline-a-r66-nebula-first-six-page-discovery-20261011.json";
export const B1_PAGE_DIR = "docs/release/v607/nebula-source-pages/v654";
export const B1_IMAGE_DIR = "docs/release/v607/nebula-page-image-artifacts/v654";
export const B1_ACCEPT = "text/html,application/xhtml+xml;q=0.9";
export const B1_USER_AGENT = "SolarSim-MainlineA-B1OfficialPage/1.0";
export const B1_TIMEOUT_MS = 20_000;
export const B1_MAX_PAGE_BYTES = 2_000_000;
export const B1_MAX_JPEG_BYTES = 60_000_000;
export const B1_RETRIES = 1;
const NASA_PAGE_HOST = "science.nasa.gov";
const NASA_IMAGE_API_HOST = "images-assets.nasa.gov";
const ID = /^PIA\d{5}$/;
const SHA = /^[a-f0-9]{64}$/;
const SAME = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function sha256B1V654(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
export function nasaIdFromImageApiV654(value) {
  try {
    const url = new URL(value);
    const match = /^\/image\/(PIA\d{5})\/\1~orig\.jpg$/.exec(url.pathname);
    return url.protocol === "https:" && url.hostname === NASA_IMAGE_API_HOST
      && url.username === "" && url.password === "" && url.port === ""
      && url.search === "" && url.hash === ""
      ? match?.[1] ?? null : null;
  } catch {
    return null;
  }
}
export function safeOfficialPageUrlB1V654(value, expected) {
  try {
    const url = new URL(value);
    return value === expected && url.protocol === "https:"
      && url.hostname === NASA_PAGE_HOST && url.port === ""
      && url.username === "" && url.password === ""
      && url.search === "" && url.hash === ""
      && /^\/photojournal\/[a-z0-9-]+\/$/.test(url.pathname);
  } catch {
    return false;
  }
}
export function bindB1DiscoveryToBatchV654(discovery, batch) {
  const issues = [];
  const pages = discovery?.rows;
  const images = batch?.rows;
  if (discovery?.schema !== "mainline-a-r66-nebula-first-six-page-discovery"
    || discovery.counts?.pageUrlsLocated !== 6
    || discovery.counts?.rawPageCaptured !== 0
    || discovery.counts?.rightsSigned !== 0
    || batch?.schema !== "mainline-a-nebula-batch-v624"
    || batch.boundary?.scientificPayloadWriteback !== false
    || !Array.isArray(pages) || pages.length !== 6
    || !Array.isArray(images) || images.length !== 6) {
    issues.push("six-row-input-contract-invalid");
  }
  const candidates = [];
  for (const [index, item] of (pages ?? []).entries()) {
    const image = images?.[index];
    const nasaId = nasaIdFromImageApiV654(image?.source?.url);
    const url = item?.officialPageUrl;
    if (!image || !ID.test(item?.nasaId ?? "")
      || item.id !== image.id || item.nasaId !== nasaId
      || !safeOfficialPageUrlB1V654(url, url)
      || typeof item.pageTitle !== "string" || item.pageTitle.length < 5
      || item.rawPageCaptured !== false
      || !image.source?.credit
      || image.network?.responseCaptured !== 1
      || !image.network?.artifact?.path
      || !SHA.test(image.network.artifact.sha256 ?? "")
      || image.rights?.status !== "pending"
      || image.runtimeAdmission !== "candidate-only"
      || image.scientificPayloadWriteback !== false) {
      issues.push(`${item?.id ?? index}:discovery-image-binding-invalid`);
      continue;
    }
    candidates.push(Object.freeze({ id: image.id, nasaId,
      pageTitle: item.pageTitle, pageUrl: url,
      expectedCredit: image.source.credit,
      imageApiUrl: image.source.url,
      candidateImageArtifact: image.network.artifact }));
  }
  if (candidates.length !== 6
    || new Set(candidates.map((item) => item.id)).size !== 6
    || new Set(candidates.map((item) => item.nasaId)).size !== 6
    || new Set(candidates.map((item) => item.pageUrl)).size !== 6) {
    issues.push("six-distinct-candidates-missing");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), candidates: Object.freeze(candidates) });
}

function decodeEntities(value) {
  return String(value).replace(/&#(x[0-9a-f]+|\d+);?/gi, (raw, code) => {
    const number = code[0]?.toLowerCase() === "x"
      ? Number.parseInt(code.slice(1), 16) : Number.parseInt(code, 10);
    return number > 0 && number <= 0x10ffff
      ? String.fromCodePoint(number) : raw;
  }).replace(/&(amp|lt|gt|quot|apos|nbsp|rsquo|lsquo|ldquo|rdquo|ndash|mdash);/gi,
    (raw, entity) => ({ amp: "&", lt: "<", gt: ">", quot: '"',
      apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘",
      ldquo: "“", rdquo: "”", ndash: "–", mdash: "—" })[entity.toLowerCase()] ?? raw);
}
export function normalizeOfficialTextB1V654(value) {
  return decodeEntities(value).replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
}
function visibleText(html) {
  return normalizeOfficialTextB1V654(html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " "));
}
function pageTitle(html) {
  const match = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? normalizeOfficialTextB1V654(match[1]) : null;
}
function itemCredit(html, nasaId) {
  const idLocation = html.search(new RegExp(`>\\s*${nasaId}\\s*<`, "i"));
  if (idLocation < 0) return null;
  const section = html.slice(idLocation, idLocation + 2_000);
  const match = /class="[^"]*hds-credits[^"]*"[^>]*>[\s\S]*?<span[^>]*>\s*Credits:\s*<\/span>\s*<span[^>]*>([\s\S]*?)<\/span>/i.exec(section);
  return match ? normalizeOfficialTextB1V654(match[1].replace(/<[^>]*>/g, " ")) : null;
}
export function inspectB1OfficialPageV654(html, candidate) {
  const issues = [];
  if (typeof html !== "string" || html.length < 1_000
    || html.length > B1_MAX_PAGE_BYTES) issues.push("html-size-invalid");
  if (!candidate || !ID.test(candidate.nasaId ?? "")
    || !safeOfficialPageUrlB1V654(candidate.pageUrl, candidate.pageUrl)) {
    issues.push("candidate-identity-invalid");
  }
  const title = pageTitle(html ?? "");
  const expected = normalizeOfficialTextB1V654(candidate?.pageTitle ?? "");
  const text = visibleText(html ?? "");
  const officialCredit = itemCredit(html ?? "", candidate?.nasaId ?? "PIA00000");
  const directJpegUrl = extractOfficialJpegUrlV652(html ?? "",
    candidate?.nasaId);
  if (!title || !title.endsWith(" - NASA Science")
    || !title.includes(expected)) issues.push("official-title-mismatch");
  if (!new RegExp(`\\b${candidate?.nasaId ?? "PIA00000"}\\b`, "i").test(text)) {
    issues.push("nasa-id-not-visible");
  }
  if (!officialCredit || officialCredit !== normalizeOfficialTextB1V654(
    candidate?.expectedCredit ?? "")) issues.push("official-item-credit-mismatch");
  if (!directJpegUrl || !safeOfficialJpegUrlV652(directJpegUrl,
    candidate?.nasaId)) issues.push("official-direct-jpeg-missing");
  if (/\b(?:synthetic response|test fixture|mock nasa page)\b/i.test(text)) {
    issues.push("fixture-marker-present");
  }
  return Object.freeze({ status: issues.length === 0
    ? "verified-official-page-candidate" : "blocked",
    issues: Object.freeze(issues), title,
    nasaId: candidate?.nasaId ?? null,
    officialCredit, directJpegUrl,
    rightsSignoff: "pending", runtimeAdmission: "candidate-only",
    scientificPayloadWriteback: false });
}
export function fingerprintB1PageRequestV654(candidate) {
  if (!safeOfficialPageUrlB1V654(candidate?.pageUrl, candidate?.pageUrl)) {
    throw new Error("b1-source-v654:unsafe-request-url");
  }
  return sha256B1V654(JSON.stringify({ method: "GET",
    url: candidate.pageUrl,
    headers: { accept: B1_ACCEPT, "user-agent": B1_USER_AGENT } }));
}
export function b1PageArtifactPathV654(candidate, digest) {
  if (!/^[a-z0-9-]+$/.test(candidate?.id ?? "")
    || !ID.test(candidate?.nasaId ?? "") || !SHA.test(digest ?? "")) {
    throw new Error("b1-source-v654:artifact-identity-invalid");
  }
  return `${B1_PAGE_DIR}/${candidate.id}-${candidate.nasaId.toLowerCase()}-${digest}.html`;
}
export function sameB1CandidateV654(left, right) {
  return SAME(left, right);
}

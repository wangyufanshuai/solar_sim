import { createHash } from "node:crypto";

export const V652_PAGE_LEDGER =
  "docs/release/v607/mainline-a-r66-nebula-source-page-ledger-20261011-v651page01.json";
export const V652_PAGE_AUDIT =
  "docs/release/v607/mainline-a-r66-nebula-source-page-audit-20261011-v651page01.json";
export const V652_IMAGE_BATCH = "app/data/mainlineANebulaBatchV628.generated.json";
export const V652_ARTIFACT_DIR = "docs/release/v607/nebula-page-image-artifacts/v652";
export const V652_ACCEPT = "image/jpeg";
export const V652_USER_AGENT = "SolarSim-MainlineA-OfficialImageByteLink/1.0";
export const V652_MAX_BYTES = 60_000_000;
export const V652_TIMEOUT_MS = 30_000;
export const V652_RETRIES = 1;
const NASA_ASSET_HOST = "assets.science.nasa.gov";

export function sha256V652(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
export function safeOfficialJpegUrlV652(value, nasaId) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== NASA_ASSET_HOST
      || url.username !== "" || url.password !== "" || url.port !== ""
      || url.search !== "" || url.hash !== "") return false;
    const folder = nasaId.toLowerCase();
    const shard = `pia${nasaId.slice(3, 5)}`;
    return /^PIA\d{5}$/.test(nasaId)
      && new RegExp(`^/content/dam/science/psd/photojournal/pia/${shard}/`
        + `pia\\d{5}/${nasaId}\\.jpg$`, "i").test(url.pathname)
      && url.pathname.toLowerCase().includes(`/${folder}/`);
  } catch {
    return false;
  }
}
export function extractOfficialJpegUrlV652(html, nasaId) {
  if (typeof html !== "string" || !/^PIA\d{5}$/.test(nasaId ?? "")) return null;
  const urls = new Set();
  const pattern = new RegExp(`https://assets\\.science\\.nasa\\.gov/`
    + `content/dam/[^"'<>\\s]*${nasaId}\\.jpg`, "gi");
  for (const match of html.matchAll(pattern)) {
    if (safeOfficialJpegUrlV652(match[0], nasaId)) urls.add(match[0]);
  }
  return urls.size === 1 ? [...urls][0] : null;
}
export function fingerprintOfficialJpegRequestV652(url, nasaId) {
  if (!safeOfficialJpegUrlV652(url, nasaId)) {
    throw new Error("page-image-link-v652:unsafe-official-jpeg-url");
  }
  return sha256V652(JSON.stringify({ method: "GET", url,
    headers: { accept: V652_ACCEPT, "user-agent": V652_USER_AGENT } }));
}
export function officialJpegArtifactPathV652(id, nasaId, digest) {
  if (!/^[a-z0-9-]+$/.test(id ?? "") || !/^PIA\d{5}$/.test(nasaId ?? "")
    || !/^[a-f0-9]{64}$/.test(digest ?? "")) {
    throw new Error("page-image-link-v652:artifact-identity-invalid");
  }
  return `${V652_ARTIFACT_DIR}/${id}-${nasaId.toLowerCase()}-${digest}.jpg`;
}
export function inspectJpegBytesV652(bytes, maximumBytes = V652_MAX_BYTES) {
  const value = Buffer.from(bytes ?? []);
  const issues = [];
  if (value.byteLength < 100 || value.byteLength > maximumBytes) {
    issues.push("jpeg-size-invalid");
  }
  if (value[0] !== 0xff || value[1] !== 0xd8
    || value.at(-2) !== 0xff || value.at(-1) !== 0xd9) {
    issues.push("jpeg-magic-invalid");
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues),
    sha256: sha256V652(value), bytes: value.byteLength });
}
export function validatePageImageInputsV652(pageLedger, pageAudit, batch) {
  const issues = [];
  if (pageLedger?.schema !== "mainline-a-r66-nebula-source-page-ledger-v651"
    || pageLedger.counts?.officialPageCandidateVerified !== 6
    || pageLedger.counts?.rightsSigned !== 0
    || pageAudit?.schema !== "mainline-a-r66-nebula-source-page-audit-v651"
    || pageAudit.status !== "verified-six-official-pages-candidate"
    || pageAudit.issues?.length !== 0
    || batch?.schema !== "mainline-a-nebula-batch-v628"
    || batch.rows?.length !== 6
    || batch.boundary?.scientificPayloadWriteback !== false) {
    issues.push("input-contract-invalid");
  }
  const candidates = [];
  for (const page of pageLedger?.rows ?? []) {
    const image = batch?.rows?.find((entry) => entry.id === page.id);
    const pin = pageAudit?.artifacts?.find((entry) => entry.id === page.id);
    if (!image || !pin || page.nasaId !== image.source?.nasaId
      || page.imageArtifactSha256 !== image.network?.artifact?.sha256
      || page.artifact?.sha256 !== pin.sha256
      || page.artifact?.path !== pin.path
      || image.rights?.signoffStatus !== "pending"
      || image.scientificPayloadWriteback !== false) {
      issues.push(`${page.id}:cross-source-link-invalid`);
      continue;
    }
    candidates.push({ id: page.id, nasaId: page.nasaId,
      pageArtifact: page.artifact,
      imageArtifact: image.network.artifact,
      sourcePageUrl: page.sourcePageUrl,
      expectedCredit: page.expectedCredit });
  }
  if (candidates.length !== 6 || new Set(candidates.map((entry) => entry.id)).size !== 6) {
    issues.push("exact-six-candidates-missing");
  }
  return Object.freeze({ ok: issues.length === 0, issues: Object.freeze(issues),
    candidates: Object.freeze(candidates) });
}

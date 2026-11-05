import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const definitions = JSON.parse(readFileSync(resolve(root, "scripts/v592-nasa-photojournal-detail-probes.json"), "utf8"));
const probeId = process.argv[2];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function writeSealed(path, unsigned) {
  const document = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, `${JSON.stringify(document, null, 2)}\n`);
  rmSync(path, { force: true });
  renameSync(partial, path);
  return document;
}
function verifySealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-nasa-photojournal-detail-existing-seal:${path}`);
  return document;
}

assert(definitions.version === "v592-nasa-photojournal-detail-probes-v1", "v592-nasa-photojournal-detail-version");
assert(definitions.policy.singleRequestPerUrl === true && definitions.policy.automaticRetryAllowed === false && definitions.policy.visualPayloadDownloadAllowed === false, "v592-nasa-photojournal-detail-policy");
const probe = definitions.probes.find((entry) => entry.id === probeId);
assert(probe, `v592-nasa-photojournal-detail-probe:${probeId}`);
const outputPath = resolve(root, `docs/release/v592/metadata-probe-major-moon-jpl/details/${probe.id}.json`);
const rawPath = resolve(root, `source-cache/v592/major-moons/jpl-photojournal/details/${probe.id}.html`);
if (existsSync(outputPath)) {
  const existing = verifySealed(outputPath);
  const bytes = readFileSync(rawPath);
  assert(bytes.byteLength === existing.metadataRequest.responseBytes && sha256(bytes) === existing.metadataRequest.responseSha256, `v592-nasa-photojournal-detail-existing-drift:${probeId}`);
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", probeId, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(rawPath), `v592-nasa-photojournal-detail-untracked-existing:${probeId}`);
const url = new URL(probe.url);
assert(url.protocol === "https:" && definitions.policy.allowedHosts.includes(url.hostname), `v592-nasa-photojournal-detail-host:${url.hostname}`);
const response = await fetch(url, {
  method: "GET",
  redirect: "manual",
  headers: { "user-agent": `Orbit-Atlas-v592-${probe.id}-nasa-photojournal-detail-probe/1.0` },
  signal: AbortSignal.timeout(60_000),
});
const bytes = Buffer.from(await response.arrayBuffer());
const redirectLocation = response.headers.get("location");
const passed = response.status === 200 && response.url === url.href && !redirectLocation;
mkdirSync(dirname(rawPath), { recursive: true });
const partial = `${rawPath}.part`;
writeFileSync(partial, bytes);
renameSync(partial, rawPath);
const html = bytes.toString("utf8");
const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replaceAll(/\s+/g, " ").trim() ?? null;
const description = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? null;
const assetUrls = [...new Set([...html.matchAll(/https:\/\/assets\.science\.nasa\.gov\/[^"'<>\s]+/gi)].map((match) => match[0].replaceAll("&amp;", "&").replaceAll("&#038;", "&")))].slice(0, 200);
const downloadLinks = [...new Set([...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1].replaceAll("&amp;", "&").replaceAll("&#038;", "&")).filter((href) => /download|assets\.science\.nasa\.gov|PIA03456/i.test(href)))].slice(0, 200);
const imageDimensionText = [...new Set([...html.matchAll(/\b\d{3,6}\s*[x×]\s*\d{3,6}\b/gi)].map((match) => match[0]))].slice(0, 100);
const piaIds = [...new Set([...html.matchAll(/PIA\d{5}/g)].map((match) => match[0]))].sort();
const receipt = writeSealed(outputPath, {
  version: "v592-nasa-photojournal-detail-probe-v1",
  probedAt: new Date().toISOString(),
  status: passed ? "nasa-photojournal-detail-probe-complete-no-visual-payload" : "blocked-no-automatic-retry",
  probeId: probe.id,
  target: probe.target,
  expectedNasaId: probe.nasaId,
  policy: {
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    visualPayloadDownloaded: false,
    redirectFollowed: false,
    itemLevelLicenseReviewRequired: true,
    metadataDoesNotGrantVisualAssetAdmission: true
  },
  metadataRequest: {
    url: url.href,
    finalUrl: response.url,
    status: response.status,
    contentType: response.headers.get("content-type") ?? "unreported",
    responseBytes: bytes.byteLength,
    responseSha256: sha256(bytes),
    outputPath: `source-cache/v592/major-moons/jpl-photojournal/details/${probe.id}.html`,
    redirectLocation
  },
  item: { title, description, piaIds, assetUrls, downloadLinks, imageDimensionText },
  visualAssetAdmission: false
});
console.log(JSON.stringify({ status: receipt.status, probeId, item: receipt.item, receiptSha256: receipt.receiptSha256 }, null, 2));

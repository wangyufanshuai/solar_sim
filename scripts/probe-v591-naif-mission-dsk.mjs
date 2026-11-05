import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const requestedId = process.argv[2];
const definitions = Object.freeze({
  "tempel-1": Object.freeze({ mission: "DEEPIMPACT", target: "tempel-1", identity: /tempel|9p|deep.?impact/i }),
  ceres: Object.freeze({ mission: "DAWN", target: "ceres", identity: /ceres|dawn/i }),
});
const definition = definitions[requestedId];
if (!definition) throw new Error("v591-naif-mission-dsk-id");
const requestUrl = new URL(`https://naif.jpl.nasa.gov/pub/naif/${definition.mission}/kernels/dsk/`);
const outputPath = resolve(root, `docs/release/v591/metadata-probe-${requestedId}-naif-${definition.mission.toLowerCase()}-dsk.json`);
const rawPath = resolve(root, `source-cache/celestial-convergence-v591/${requestedId}/naif-${definition.mission.toLowerCase()}-dsk-index.html`);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function writeSealed(path, unsigned) { const value = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`); return value; }
function readSealed(path) { const value = JSON.parse(readFileSync(path, "utf8")); const unsigned = { ...value }; delete unsigned.receiptSha256; assert(value.receiptSha256 === canonicalSha(unsigned), `v591-naif-mission-dsk-seal:${path}`); return value; }

assert(requestUrl.protocol === "https:" && requestUrl.hostname === "naif.jpl.nasa.gov" && !requestUrl.username && !requestUrl.password && !requestUrl.port, "v591-naif-mission-dsk-url");
if (existsSync(outputPath)) {
  const existing = readSealed(outputPath);
  assert(existing.request.url === requestUrl.href && existing.requestCount === 1, "v591-naif-mission-dsk-existing");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", target: requestedId, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

let response = null;
try {
  response = await fetch(requestUrl, { method: "GET", redirect: "manual", headers: { accept: "text/html,application/xhtml+xml", "user-agent": `Orbit-Atlas-v591-${requestedId}-naif-dsk/1.0` }, signal: AbortSignal.timeout(120_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  const location = response.headers.get("location");
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  const redirect = [301, 302, 303, 307, 308].includes(response.status);
  if (redirect || location || response.url !== requestUrl.href) {
    const receipt = writeSealed(outputPath, { version: "v591-naif-mission-dsk-metadata-probe-v1", probedAt: new Date().toISOString(), status: "blocked-redirect-not-followed", target: definition.target, mission: definition.mission, requestCount: 1, request: { url: requestUrl.href, finalUrl: response.url, httpStatus: response.status, location, mediaType, bytes: bytes.length, sha256: sha256(bytes), rawPath: null }, candidates: [], payloadDownloaded: false, sciencePayloadDownloaded: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, license: { id: "NASA-JPL-NAIF-public-data", url: "https://naif.jpl.nasa.gov/naif/rules.html" } });
    console.log(JSON.stringify({ status: receipt.status, target: requestedId, location, receiptSha256: receipt.receiptSha256 }, null, 2));
    process.exit(0);
  }
  atomicWrite(rawPath, bytes);
  const html = bytes.toString("utf8");
  const candidates = [...new Set([...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]))]
    .filter((href) => /\.(?:bds|dsk|obj|stl|ply)(?:$|\?)/i.test(href) || definition.identity.test(href))
    .map((href) => ({ href, resolvedUrl: new URL(href, requestUrl).href, extension: href.split("?")[0].split(".").pop()?.toLowerCase() ?? null }));
  const receipt = writeSealed(outputPath, { version: "v591-naif-mission-dsk-metadata-probe-v1", probedAt: new Date().toISOString(), status: response.ok ? candidates.length > 0 ? "official-dsk-candidates-present-no-payload" : "official-dsk-directory-empty-or-no-target-candidate" : "blocked-http-response", target: definition.target, mission: definition.mission, requestCount: 1, request: { url: requestUrl.href, finalUrl: response.url, httpStatus: response.status, location: null, mediaType, bytes: bytes.length, sha256: sha256(bytes), rawPath: `source-cache/celestial-convergence-v591/${requestedId}/naif-${definition.mission.toLowerCase()}-dsk-index.html` }, candidates, payloadDownloaded: false, sciencePayloadDownloaded: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, license: { id: "NASA-JPL-NAIF-public-data", url: "https://naif.jpl.nasa.gov/naif/rules.html" } });
  console.log(JSON.stringify({ status: receipt.status, target: requestedId, httpStatus: response.status, candidates, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  if (response === null) {
    const receipt = writeSealed(outputPath, { version: "v591-naif-mission-dsk-metadata-probe-v1", probedAt: new Date().toISOString(), status: "blocked-network-no-retry", target: definition.target, mission: definition.mission, requestCount: 1, request: { url: requestUrl.href, finalUrl: null, httpStatus: null, location: null, mediaType: null, bytes: 0, sha256: null, rawPath: null }, candidates: [], payloadDownloaded: false, sciencePayloadDownloaded: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, error: error instanceof Error ? error.message : String(error), license: { id: "NASA-JPL-NAIF-public-data", url: "https://naif.jpl.nasa.gov/naif/rules.html" } });
    console.error(JSON.stringify({ status: receipt.status, target: requestedId, receiptSha256: receipt.receiptSha256 }, null, 2));
  }
  throw error;
}

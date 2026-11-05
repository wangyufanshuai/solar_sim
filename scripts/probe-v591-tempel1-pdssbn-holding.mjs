import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const datasetSlug = "di-c-hrii_hriv_mri_its-6-derived-tempel1-shape-v1.0";
const requestUrl = new URL(`https://pdssbn.astro.umd.edu/holdings/${datasetSlug}/`);
const outputPath = resolve(root, "docs/release/v591/metadata-probe-tempel-1-pdssbn-holding.json");
const rawPath = resolve(root, "source-cache/celestial-convergence-v591/tempel-1/pdssbn-holding-index.html");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function writeSealed(path, unsigned) { const value = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`); return value; }
function readSealed(path) { const value = JSON.parse(readFileSync(path, "utf8")); const unsigned = { ...value }; delete unsigned.receiptSha256; assert(value.receiptSha256 === canonicalSha(unsigned), `v591-tempel1-pdssbn-seal:${path}`); return value; }

assert(requestUrl.protocol === "https:" && requestUrl.hostname === "pdssbn.astro.umd.edu" && !requestUrl.username && !requestUrl.password && !requestUrl.port, "v591-tempel1-pdssbn-url");
if (existsSync(outputPath)) {
  const existing = readSealed(outputPath);
  assert(existing.request.url === requestUrl.href && existing.requestCount === 1, "v591-tempel1-pdssbn-existing");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

let response = null;
try {
  response = await fetch(requestUrl, { method: "GET", redirect: "manual", headers: { accept: "text/html,application/xhtml+xml", "user-agent": "Orbit-Atlas-v591-tempel1-pdssbn-holding/1.0" }, signal: AbortSignal.timeout(120_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  const location = response.headers.get("location");
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  const redirect = [301, 302, 303, 307, 308].includes(response.status);
  if (redirect || location || response.url !== requestUrl.href) {
    const receipt = writeSealed(outputPath, { version: "v591-tempel-1-pdssbn-holding-metadata-probe-v1", probedAt: new Date().toISOString(), status: "blocked-redirect-not-followed", target: "tempel-1", datasetSlug, requestCount: 1, request: { url: requestUrl.href, finalUrl: response.url, httpStatus: response.status, location, mediaType, bytes: bytes.length, sha256: sha256(bytes), rawPath: null }, candidates: [], payloadDownloaded: false, sciencePayloadDownloaded: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, license: { id: "NASA-PDS-public-data", url: "https://pdssbn.astro.umd.edu/about.shtml" } });
    console.log(JSON.stringify({ status: receipt.status, location, receiptSha256: receipt.receiptSha256 }, null, 2));
    process.exit(0);
  }
  atomicWrite(rawPath, bytes);
  const html = bytes.toString("utf8");
  const candidates = [...new Set([...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]))]
    .filter((href) => href !== "../" && !href.startsWith("?") && !href.startsWith("#"))
    .map((href) => ({ href, resolvedUrl: new URL(href, requestUrl).href, kind: /\/$/.test(href) ? "directory" : "file" }));
  const identityMatched = /tempel\s*1|tempel1|deep\s*impact|derived[-_ ]tempel/i.test(html) || candidates.some((entry) => /catalog|data|document|index|voldesc/i.test(entry.href));
  const receipt = writeSealed(outputPath, { version: "v591-tempel-1-pdssbn-holding-metadata-probe-v1", probedAt: new Date().toISOString(), status: response.ok && identityMatched ? "official-holding-present-no-payload" : response.ok ? "holding-response-identity-unconfirmed" : "blocked-http-response", target: "tempel-1", datasetSlug, requestCount: 1, request: { url: requestUrl.href, finalUrl: response.url, httpStatus: response.status, location: null, mediaType, bytes: bytes.length, sha256: sha256(bytes), rawPath: "source-cache/celestial-convergence-v591/tempel-1/pdssbn-holding-index.html" }, identityMatched, candidates, payloadDownloaded: false, sciencePayloadDownloaded: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, license: { id: "NASA-PDS-public-data", url: "https://pdssbn.astro.umd.edu/about.shtml" } });
  console.log(JSON.stringify({ status: receipt.status, httpStatus: response.status, identityMatched, candidateCount: candidates.length, candidates: candidates.slice(0, 30), receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  if (response === null) {
    const receipt = writeSealed(outputPath, { version: "v591-tempel-1-pdssbn-holding-metadata-probe-v1", probedAt: new Date().toISOString(), status: "blocked-network-no-retry", target: "tempel-1", datasetSlug, requestCount: 1, request: { url: requestUrl.href, finalUrl: null, httpStatus: null, location: null, mediaType: null, bytes: 0, sha256: null, rawPath: null }, identityMatched: false, candidates: [], payloadDownloaded: false, sciencePayloadDownloaded: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, error: error instanceof Error ? error.message : String(error), license: { id: "NASA-PDS-public-data", url: "https://pdssbn.astro.umd.edu/about.shtml" } });
    console.error(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
  }
  throw error;
}

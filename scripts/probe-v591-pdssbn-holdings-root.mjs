import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const requestUrl = new URL("https://pdssbn.astro.umd.edu/holdings/");
const outputPath = resolve(root, "docs/release/v591/metadata-probe-pdssbn-holdings-root.json");
const rawPath = resolve(root, "source-cache/celestial-convergence-v591/tempel-1/pdssbn-holdings-root.html");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function writeSealed(path, unsigned) { const value = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`); return value; }
function readSealed(path) { const value = JSON.parse(readFileSync(path, "utf8")); const unsigned = { ...value }; delete unsigned.receiptSha256; assert(value.receiptSha256 === canonicalSha(unsigned), `v591-pdssbn-root-seal:${path}`); return value; }

if (existsSync(outputPath)) {
  const existing = readSealed(outputPath);
  assert(existing.request.url === requestUrl.href && existing.requestCount === 1, "v591-pdssbn-root-existing");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
if (process.argv.includes("--reconcile-observed-timeout")) {
  const receipt = writeSealed(outputPath, {
    version: "v591-pdssbn-holdings-root-metadata-probe-v1",
    reconciledAt: "2026-08-13T17:00:00.000Z",
    status: "blocked-response-timeout-no-retry",
    requestCount: 1,
    request: {
      url: requestUrl.href,
      finalUrl: null,
      httpStatus: null,
      location: null,
      mediaType: null,
      bytes: 0,
      sha256: null,
      rawPath: null,
      timeoutMilliseconds: 120000,
    },
    tempelCandidates: [],
    ceresCandidates: [],
    payloadDownloaded: false,
    sciencePayloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    reconciliationBasis: "captured-process-timeout;no-response-bytes-committed",
    license: { id: "NASA-PDS-public-data", url: "https://pdssbn.astro.umd.edu/about.shtml" },
  });
  console.log(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(requestUrl.protocol === "https:" && requestUrl.hostname === "pdssbn.astro.umd.edu", "v591-pdssbn-root-url");
let response = null;
try {
  response = await fetch(requestUrl, { method: "GET", redirect: "manual", headers: { accept: "text/html,application/xhtml+xml", "user-agent": "Orbit-Atlas-v591-pdssbn-root/1.0" }, signal: AbortSignal.timeout(120_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  const location = response.headers.get("location");
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  const redirect = [301, 302, 303, 307, 308].includes(response.status);
  if (redirect || location || response.url !== requestUrl.href) {
    const receipt = writeSealed(outputPath, { version: "v591-pdssbn-holdings-root-metadata-probe-v1", probedAt: new Date().toISOString(), status: "blocked-redirect-not-followed", requestCount: 1, request: { url: requestUrl.href, finalUrl: response.url, httpStatus: response.status, location, mediaType, bytes: bytes.length, sha256: sha256(bytes), rawPath: null }, tempelCandidates: [], ceresCandidates: [], payloadDownloaded: false, sciencePayloadDownloaded: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, license: { id: "NASA-PDS-public-data", url: "https://pdssbn.astro.umd.edu/about.shtml" } });
    console.log(JSON.stringify({ status: receipt.status, location, receiptSha256: receipt.receiptSha256 }, null, 2));
    process.exit(0);
  }
  atomicWrite(rawPath, bytes);
  const html = bytes.toString("utf8");
  const links = [...new Set([...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]))]
    .map((href) => ({ href, resolvedUrl: new URL(href, requestUrl).href }));
  const tempelCandidates = links.filter((entry) => /tempel|deep.?impact|di-c-/i.test(entry.href));
  const ceresCandidates = links.filter((entry) => /ceres|dawn/i.test(entry.href));
  const receipt = writeSealed(outputPath, { version: "v591-pdssbn-holdings-root-metadata-probe-v1", probedAt: new Date().toISOString(), status: response.ok ? "official-holdings-index-read-no-payload" : "blocked-http-response", requestCount: 1, request: { url: requestUrl.href, finalUrl: response.url, httpStatus: response.status, location: null, mediaType, bytes: bytes.length, sha256: sha256(bytes), rawPath: "source-cache/celestial-convergence-v591/tempel-1/pdssbn-holdings-root.html" }, linkCount: links.length, tempelCandidates, ceresCandidates, payloadDownloaded: false, sciencePayloadDownloaded: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, license: { id: "NASA-PDS-public-data", url: "https://pdssbn.astro.umd.edu/about.shtml" } });
  console.log(JSON.stringify({ status: receipt.status, httpStatus: response.status, linkCount: links.length, tempelCandidates, ceresCandidates, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  if (response === null) {
    const receipt = writeSealed(outputPath, { version: "v591-pdssbn-holdings-root-metadata-probe-v1", probedAt: new Date().toISOString(), status: "blocked-network-no-retry", requestCount: 1, request: { url: requestUrl.href, finalUrl: null, httpStatus: null, location: null, mediaType: null, bytes: 0, sha256: null, rawPath: null }, tempelCandidates: [], ceresCandidates: [], payloadDownloaded: false, sciencePayloadDownloaded: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, error: error instanceof Error ? error.message : String(error), license: { id: "NASA-PDS-public-data", url: "https://pdssbn.astro.umd.edu/about.shtml" } });
    console.error(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
  }
  throw error;
}

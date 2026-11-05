import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const mode = process.argv[2] ?? "index";
const modes = {
  index: {
    url: "https://science.nasa.gov/photojournal/",
    output: "docs/release/v592/metadata-probe-major-moon-jpl/nasa-photojournal-index.json",
    raw: "source-cache/v592/major-moons/jpl-photojournal/nasa-photojournal-index.html"
  },
  search: {
    url: "https://science.nasa.gov/photojournal/search/",
    output: "docs/release/v592/metadata-probe-major-moon-jpl/nasa-photojournal-search-index.json",
    raw: "source-cache/v592/major-moons/jpl-photojournal/nasa-photojournal-search-index.html"
  },
  callisto: {
    url: "https://science.nasa.gov/photojournal/search/?search_query=Callisto+global+map",
    output: "docs/release/v592/metadata-probe-major-moon-jpl/nasa-photojournal-callisto-global-map.json",
    raw: "source-cache/v592/major-moons/jpl-photojournal/nasa-photojournal-callisto-global-map.html"
  }
};
const selectedMode = modes[mode];
if (!selectedMode) throw new Error(`v592-nasa-photojournal-index-mode:${mode}`);
const outputPath = resolve(root, selectedMode.output);
const rawPath = resolve(root, selectedMode.raw);
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-nasa-photojournal-index-existing-seal:${path}`);
  return document;
}

if (existsSync(outputPath)) {
  const existing = verifySealed(outputPath);
  const bytes = readFileSync(rawPath);
  assert(bytes.byteLength === existing.metadataRequest.responseBytes && sha256(bytes) === existing.metadataRequest.responseSha256, "v592-nasa-photojournal-index-existing-drift");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(rawPath), "v592-nasa-photojournal-index-untracked-existing");
const url = new URL(selectedMode.url);
let response;
let bytes = Buffer.alloc(0);
let networkError = null;
try {
  response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": "Orbit-Atlas-v592-nasa-photojournal-index-metadata-probe/1.0" },
    signal: AbortSignal.timeout(60_000),
  });
  bytes = Buffer.from(await response.arrayBuffer());
} catch (error) {
  networkError = error instanceof Error ? error.message : String(error);
}
const redirectLocation = response?.headers.get("location") ?? null;
const passed = !networkError && response?.status === 200 && response.url === url.href && !redirectLocation;
const html = bytes.toString("utf8");
if (bytes.byteLength > 0) {
  mkdirSync(dirname(rawPath), { recursive: true });
  const partial = `${rawPath}.part`;
  writeFileSync(partial, bytes);
  renameSync(partial, rawPath);
}
const forms = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].map((match) => match[0].replaceAll(/\s+/g, " ").slice(0, 4000)).slice(0, 20);
const scripts = [...new Set([...html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/gi)].map((match) => match[1]))].slice(0, 100);
const links = [...new Set([...html.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]).filter((href) => /photojournal|search|api/i.test(href)))].slice(0, 200);
const receipt = writeSealed(outputPath, {
  version: "v592-nasa-photojournal-index-probe-v1",
  probedAt: new Date().toISOString(),
  status: passed ? "nasa-photojournal-index-probe-complete-no-visual-payload" : "blocked-no-automatic-retry",
  target: "photojournal-index",
  policy: {
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    visualPayloadDownloaded: false,
    redirectFollowed: false,
    metadataDoesNotGrantVisualAssetAdmission: true
  },
  metadataRequest: {
    url: url.href,
    finalUrl: response?.url ?? null,
    status: response?.status ?? null,
    contentType: response?.headers.get("content-type") ?? "unreported",
    responseBytes: bytes.byteLength,
    responseSha256: sha256(bytes),
    outputPath: bytes.byteLength > 0 ? selectedMode.raw : null,
    redirectLocation,
    networkError
  },
  forms,
  scripts,
  candidateLinks: links,
  mode,
  visualAssetAdmission: false
});
console.log(JSON.stringify({ status: receipt.status, forms: receipt.forms, scripts: receipt.scripts, candidateLinks: receipt.candidateLinks, receiptSha256: receipt.receiptSha256 }, null, 2));

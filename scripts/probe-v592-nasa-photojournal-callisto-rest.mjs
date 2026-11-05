import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const inputPath = resolve(root, "source-cache/v592/major-moons/jpl-photojournal/nasa-photojournal-search-index.html");
const mode = process.argv[2] ?? "exact";
const modes = {
  exact: {
    query: '"Callisto global map"',
    output: "docs/release/v592/metadata-probe-major-moon-jpl/nasa-photojournal-callisto-rest.json",
    raw: "source-cache/v592/major-moons/jpl-photojournal/nasa-photojournal-callisto-rest.json"
  },
  broad: {
    query: "Callisto",
    output: "docs/release/v592/metadata-probe-major-moon-jpl/nasa-photojournal-callisto-rest-broad.json",
    raw: "source-cache/v592/major-moons/jpl-photojournal/nasa-photojournal-callisto-rest-broad.json"
  }
};
const selectedMode = modes[mode];
if (!selectedMode) throw new Error(`v592-nasa-photojournal-rest-mode:${mode}`);
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-nasa-photojournal-rest-existing-seal:${path}`);
  return document;
}

if (existsSync(outputPath)) {
  const existing = verifySealed(outputPath);
  const bytes = readFileSync(rawPath);
  assert(bytes.byteLength === existing.metadataRequest.responseBytes && sha256(bytes) === existing.metadataRequest.responseSha256, "v592-nasa-photojournal-rest-existing-drift");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(rawPath), "v592-nasa-photojournal-rest-untracked-existing");
const htmlBytes = readFileSync(inputPath);
const html = htmlBytes.toString("utf8");
const settingsMatch = html.match(/var ContentListSettings = (\{[^;]+\});/);
assert(settingsMatch, "v592-nasa-photojournal-rest-settings");
const settings = JSON.parse(settingsMatch[1]);
assert(settings.restUrl === "https://science.nasa.gov/wp-json/smd/v1/content-list/" && typeof settings.nonce === "string" && settings.nonce.length > 0, "v592-nasa-photojournal-rest-settings-identity");
const startingMatch = html.match(/class="hds-content-lists[^>]+data-starting-query="([^"]+)"/);
assert(startingMatch, "v592-nasa-photojournal-rest-starting-query");
const decodedStarting = startingMatch[1]
  .replaceAll("&quot;", '"')
  .replaceAll("&#039;", "'")
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">");
const query = JSON.parse(decodedStarting);
query.search_query = selectedMode.query;
query.current_page = 1;
query.number_of_items = 100;
const params = new URLSearchParams();
for (const [key, value] of Object.entries(query)) {
  if (value === "" || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) continue;
  const encodedValue = (key === "meta_fields" || key === "base_terms") && typeof value === "object"
    ? JSON.stringify(value)
    : Array.isArray(value)
      ? value.join(",")
      : String(value);
  params.set(key, encodedValue);
}
const url = new URL(settings.restUrl);
url.search = params.toString();
assert(url.protocol === "https:" && url.hostname === "science.nasa.gov", "v592-nasa-photojournal-rest-url");
const response = await fetch(url, {
  method: "GET",
  redirect: "manual",
  headers: {
    "user-agent": "Orbit-Atlas-v592-callisto-nasa-photojournal-rest-metadata-probe/1.0",
    "X-WP-Nonce": settings.nonce
  },
  signal: AbortSignal.timeout(60_000),
});
const bytes = Buffer.from(await response.arrayBuffer());
const redirectLocation = response.headers.get("location");
const passed = response.status === 200 && response.url === url.href && !redirectLocation;
let document = null;
if (passed) {
  document = JSON.parse(bytes.toString("utf8"));
  assert(typeof document.content === "string", "v592-nasa-photojournal-rest-response-shape");
}
mkdirSync(dirname(rawPath), { recursive: true });
const partial = `${rawPath}.part`;
writeFileSync(partial, bytes);
renameSync(partial, rawPath);
const content = document?.content ?? "";
const links = [...new Set([...content.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]).filter((href) => /\/photojournal\//i.test(href)))];
const piaIds = [...new Set([...content.matchAll(/PIA\d{5}/g)].map((match) => match[0]))].sort();
const titles = [...content.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)]
  .map((match) => match[1].replaceAll(/<[^>]+>/g, " ").replaceAll(/\s+/g, " ").trim())
  .filter(Boolean);
const receipt = writeSealed(outputPath, {
  version: "v592-nasa-photojournal-callisto-rest-probe-v1",
  probedAt: new Date().toISOString(),
  status: passed ? "nasa-photojournal-rest-probe-complete-no-visual-payload" : "blocked-no-automatic-retry",
  target: "callisto",
  query: selectedMode.query,
  mode,
  policy: {
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    visualPayloadDownloaded: false,
    redirectFollowed: false,
    itemLevelLicenseReviewRequired: true,
    metadataDoesNotGrantVisualAssetAdmission: true
  },
  sourcePage: {
    path: "source-cache/v592/major-moons/jpl-photojournal/nasa-photojournal-search-index.html",
    bytes: htmlBytes.byteLength,
    sha256: sha256(htmlBytes),
    restUrl: settings.restUrl,
    nonceSha256: sha256(Buffer.from(settings.nonce, "utf8"))
  },
  metadataRequest: {
    url: url.href,
    finalUrl: response.url,
    status: response.status,
    contentType: response.headers.get("content-type") ?? "unreported",
    responseBytes: bytes.byteLength,
    responseSha256: sha256(bytes),
    outputPath: selectedMode.raw,
    redirectLocation
  },
  result: {
    candidateCount: links.length,
    links,
    titles,
    piaIds
  },
  visualAssetAdmission: false
});
console.log(JSON.stringify({ status: receipt.status, result: receipt.result, receiptSha256: receipt.receiptSha256 }, null, 2));

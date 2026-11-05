import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v592/metadata-probe-major-moon-jpl/nasa-photojournal-content-list-client.json");
const rawPath = resolve(root, "source-cache/v592/major-moons/jpl-photojournal/nasa-photojournal-content-list-client.js");
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-nasa-photojournal-client-existing-seal:${path}`);
  return document;
}

if (existsSync(outputPath)) {
  const existing = verifySealed(outputPath);
  const bytes = readFileSync(rawPath);
  assert(bytes.byteLength === existing.metadataRequest.responseBytes && sha256(bytes) === existing.metadataRequest.responseSha256, "v592-nasa-photojournal-client-existing-drift");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(rawPath), "v592-nasa-photojournal-client-untracked-existing");
const url = new URL("https://science.nasa.gov/wp-content/plugins/smd-blocks/build/content-list/index.js?ver=1784657070");
const response = await fetch(url, {
  method: "GET",
  redirect: "manual",
  headers: { "user-agent": "Orbit-Atlas-v592-nasa-photojournal-client-metadata-probe/1.0" },
  signal: AbortSignal.timeout(60_000),
});
const bytes = Buffer.from(await response.arrayBuffer());
const passed = response.status === 200 && response.url === url.href && !response.headers.get("location");
mkdirSync(dirname(rawPath), { recursive: true });
const partial = `${rawPath}.part`;
writeFileSync(partial, bytes);
renameSync(partial, rawPath);
const source = bytes.toString("utf8");
const absoluteUrls = [...new Set([...source.matchAll(/https?:\/\/[^"'`\s)]+/g)].map((match) => match[0]))].slice(0, 200);
const apiFragments = [...new Set([...source.matchAll(/[^"'`\s]{0,120}(?:wp-json|admin-ajax|content-list|rest_route)[^"'`\s]{0,180}/gi)].map((match) => match[0]))].slice(0, 200);
const receipt = writeSealed(outputPath, {
  version: "v592-nasa-photojournal-content-list-client-probe-v1",
  probedAt: new Date().toISOString(),
  status: passed ? "nasa-photojournal-client-probe-complete-no-visual-payload" : "blocked-no-automatic-retry",
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
    finalUrl: response.url,
    status: response.status,
    contentType: response.headers.get("content-type") ?? "unreported",
    responseBytes: bytes.byteLength,
    responseSha256: sha256(bytes),
    outputPath: "source-cache/v592/major-moons/jpl-photojournal/nasa-photojournal-content-list-client.js",
    redirectLocation: response.headers.get("location")
  },
  absoluteUrls,
  apiFragments,
  visualAssetAdmission: false
});
console.log(JSON.stringify({ status: receipt.status, absoluteUrls: receipt.absoluteUrls, apiFragments: receipt.apiFragments, receiptSha256: receipt.receiptSha256 }, null, 2));

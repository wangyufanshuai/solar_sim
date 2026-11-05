import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = new Date().toISOString();
const outputPath = "docs/release/v592/acquisition-receipt-major-moon-usgs-labels-v592.json";
const definitions = [
  { target: "io", url: "https://planetarymaps.usgs.gov/mosaic/Io_GalileoSSI-Voyager_Global_Mosaic_1km.lbl" },
  { target: "europa", url: "https://planetarymaps.usgs.gov/mosaic/Europa_Voyager_GalileoSSI_global_mosaic_500m.lbl" },
  { target: "ganymede", url: "https://planetarymaps.usgs.gov/mosaic/Ganymede_Voyager_GalileoSSI_global_mosaic_1km.lbl" },
  { target: "callisto", url: "https://planetarymaps.usgs.gov/mosaic/Callisto_Voyager_GalileoSSI_global_mosaic_1km.lbl" },
];

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function seal(body) {
  return { ...body, receiptSha256: canonicalSha(body) };
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function atomicWrite(path, bytes) {
  const absolute = resolve(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  const partial = `${absolute}.part`;
  writeFileSync(partial, bytes, { flag: "wx" });
  rmSync(absolute, { force: true });
  renameSync(partial, absolute);
}
function allowedUrl(value) {
  const url = new URL(value);
  return url.protocol === "https:"
    && (url.hostname === "usgs.gov" || url.hostname.endsWith(".usgs.gov"))
    && !url.username
    && !url.password
    && !url.port;
}

if (existsSync(resolve(root, outputPath))) {
  const existing = JSON.parse(readFileSync(resolve(root, outputPath), "utf8"));
  const unsigned = { ...existing };
  delete unsigned.receiptSha256;
  assert(existing.receiptSha256 === canonicalSha(unsigned), "v592-usgs-label-existing-seal");
  for (const asset of existing.assets ?? []) {
    const bytes = readFileSync(resolve(root, asset.outputPath));
    assert(bytes.byteLength === asset.bytes && sha256(bytes) === asset.sha256, `v592-usgs-label-existing-source:${asset.target}`);
  }
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

const assets = [];
const failures = [];
const requestedUrls = new Set();
async function requestOnce(url) {
  assert(allowedUrl(url), `v592-usgs-label-host:${url}`);
  assert(!requestedUrls.has(url), `v592-usgs-label-duplicate-request:${url}`);
  requestedUrls.add(url);
  return fetch(url, { method: "GET", redirect: "manual", headers: { Accept: "text/plain,application/octet-stream;q=0.8" } });
}

for (const definition of definitions) {
  let response;
  let finalUrl = definition.url;
  let redirectUrl = null;
  try {
    response = await requestOnce(definition.url);
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      assert(location, `v592-usgs-label-redirect-location:${definition.target}`);
      redirectUrl = new URL(location, definition.url).toString();
      assert(allowedUrl(redirectUrl), `v592-usgs-label-redirect-host:${definition.target}:${redirectUrl}`);
      finalUrl = redirectUrl;
      response = await requestOnce(redirectUrl);
    }
    assert(response.status === 200, `v592-usgs-label-http:${definition.target}:${response.status}:${finalUrl}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert(bytes.byteLength > 64 && bytes.byteLength < 4 * 1024 * 1024, `v592-usgs-label-bytes:${definition.target}:${bytes.byteLength}`);
    const text = bytes.toString("utf8");
    assert(/PDS_VERSION_ID|OBJECT\s*=\s*IMAGE|MAP_PROJECTION_TYPE/i.test(text), `v592-usgs-label-identity:${definition.target}`);
    const output = `source-cache/v592/major-moons/usgs-labels/${definition.target}.lbl`;
    atomicWrite(output, bytes);
    assets.push({
      target: definition.target,
      sourceUrl: definition.url,
      redirectUrl,
      finalUrl,
      requestCount: [definition.url, redirectUrl].filter((url) => url && requestedUrls.has(url)).length,
      outputPath: output,
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      contentType: response.headers.get("content-type"),
      payloadType: "PDS-label-metadata-only",
    });
  } catch (error) {
    failures.push({
      target: definition.target,
      sourceUrl: definition.url,
      finalUrl,
      redirectUrl,
      requestCount: redirectUrl ? 2 : 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const body = {
  version: "v592-major-moon-usgs-label-acquisition-v1",
  generatedAt,
  status: failures.length === 0 ? "committed-four-labels-single-request-per-url-no-retry" : "partial-label-metadata-with-terminal-failures-no-retry",
  policy: {
    metadataOnly: true,
    requestCountPerUrl: 1,
    whitelistRedirectValidation: true,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    atomicWrite: ".part-to-final",
    visualPayloadDownloaded: false,
    visualAssetAdmissionGranted: false,
    scientificAuthorityGranted: false,
  },
  sourceDefinitions: definitions,
  requestedUrls: [...requestedUrls],
  assets,
  failures,
};
const receipt = seal(body);
atomicWrite(outputPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
console.log(JSON.stringify({
  status: receipt.status,
  requestedUrlCount: receipt.requestedUrls.length,
  assetCount: receipt.assets.length,
  failureCount: receipt.failures.length,
  assets: receipt.assets.map(({ target, finalUrl, bytes, sha256: digest }) => ({ target, finalUrl, bytes, sha256: digest })),
  failures: receipt.failures,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
if (failures.length > 0) process.exitCode = 1;

import { createHash } from "node:crypto";
import { closeSync, createReadStream, createWriteStream, existsSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const root = process.cwd();
const definitionsPath = "scripts/v592-major-moon-usgs-final-visual-sources.json";
const redirectAdmissionPath = "docs/release/v592/major-moon-usgs-redirect-admission-v592.json";
const receiptPath = resolve(root, "docs/release/v592/acquisition-receipt-major-moon-usgs-final-visual-sources-v592.json");
const definitions = JSON.parse(readFileSync(resolve(root, definitionsPath), "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function verifySealed(path) {
  const document = JSON.parse(readFileSync(resolve(root, path), "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-usgs-final-source-seal:${path}`);
  return document;
}
function writeSealed(path, unsigned) {
  const document = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, `${JSON.stringify(document, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
  return document;
}
async function fileSha(path) {
  const hash = createHash("sha256");
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
    bytes += chunk.byteLength;
  }
  return { bytes, sha256: hash.digest("hex") };
}
function directoryBytes(path) {
  if (!existsSync(path)) return 0;
  let total = 0;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = resolve(path, entry.name);
    total += entry.isDirectory() ? directoryBytes(child) : entry.isFile() ? statSync(child).size : 0;
  }
  return total;
}

assert(definitions.version === "v592-major-moon-usgs-final-visual-sources-v1", "v592-usgs-final-definition-version");
assert(definitions.sources.length === 4 && new Set(definitions.sources.map((source) => source.target)).size === 4, "v592-usgs-final-source-count");
assert(
  definitions.policy.singleRequestPerUrl === true
  && definitions.policy.automaticRetryAllowed === false
  && definitions.policy.automaticReplacementAllowed === false
  && definitions.policy.atomicWrite === ".part-to-final"
  && definitions.policy.visualAssetAdmissionGrantedByAcquisition === false
  && definitions.policy.scientificAuthorityGranted === false
  && definitions.policy.presentationOnly === true,
  "v592-usgs-final-policy",
);

if (existsSync(receiptPath)) {
  const existing = verifySealed("docs/release/v592/acquisition-receipt-major-moon-usgs-final-visual-sources-v592.json");
  for (const asset of existing.assets) {
    const observed = await fileSha(resolve(root, asset.outputPath));
    assert(observed.bytes === asset.bytes && observed.sha256 === asset.sha256, `v592-usgs-final-existing-drift:${asset.target}`);
  }
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", assetCount: existing.assets.length, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

const redirectAdmission = verifySealed(redirectAdmissionPath);
assert(redirectAdmission.status === "admitted-exact-usgs-pds-s3-host-for-four-label-metadata-requests", "v592-usgs-final-redirect-admission");
assert(redirectAdmission.exactRedirectHost === definitions.policy.exactHost, "v592-usgs-final-redirect-host");
const requestedUrls = new Set();
const assets = [];
const failures = [];
for (const source of definitions.sources) {
  const metadata = verifySealed(`docs/release/v592/metadata-probe-major-moon-usgs-direct/${source.metadataProbeId}.json`);
  assert(metadata.status === "usgs-direct-metadata-probe-complete-no-visual-payload", `v592-usgs-final-metadata:${source.id}`);
  assert(metadata.target === source.target && metadata.candidateHrefs.includes(source.originalUrl), `v592-usgs-final-original-identity:${source.id}`);
  const url = new URL(source.url);
  assert(url.protocol === "https:" && url.hostname === definitions.policy.exactHost && url.pathname.endsWith(".tif"), `v592-usgs-final-url:${source.id}`);
  assert(!requestedUrls.has(url.href), `v592-usgs-final-duplicate:${source.id}`);
  requestedUrls.add(url.href);
  const outputPath = `source-cache/v592/major-moons/usgs-final-visual/${source.target}.tif`;
  const output = resolve(root, outputPath);
  const partial = `${output}.part`;
  assert(!existsSync(output) && !existsSync(partial), `v592-usgs-final-untracked-existing:${source.id}`);
  assert(directoryBytes(resolve(root, "source-cache/v592")) < definitions.policy.sourceCacheMaximumBytes, "v592-usgs-final-source-cache-preflight");
  mkdirSync(dirname(output), { recursive: true });
  console.log(JSON.stringify({ status: "request-start", target: source.target, id: source.id, url: url.href }));
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": `Orbit-Atlas-v592-${source.id}-single-request-visual-source-acquisition/1.0` },
      signal: AbortSignal.timeout(900_000),
    });
    assert(response.status === 200 && response.url === url.href, `v592-usgs-final-http:${source.id}:${response.status}:${response.url}`);
    assert(!response.headers.get("location") && response.body, `v592-usgs-final-response:${source.id}`);
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength)) {
      assert(declaredLength > 10 * 1024 * 1024 && declaredLength <= definitions.policy.maximumBytesPerAsset, `v592-usgs-final-length:${source.id}:${declaredLength}`);
    }
    const hash = createHash("sha256");
    let bytes = 0;
    const meter = new Transform({
      transform(chunk, _encoding, callback) {
        bytes += chunk.byteLength;
        if (bytes > definitions.policy.maximumBytesPerAsset) {
          callback(new Error(`v592-usgs-final-size-limit:${source.id}:${bytes}`));
          return;
        }
        hash.update(chunk);
        callback(null, chunk);
      },
    });
    await pipeline(response.body, meter, createWriteStream(partial, { flags: "wx" }));
    assert(bytes > 10 * 1024 * 1024 && (!Number.isFinite(declaredLength) || bytes === declaredLength), `v592-usgs-final-bytes:${source.id}:${bytes}:${declaredLength}`);
    const signatureBytes = Buffer.alloc(4);
    const descriptor = openSync(partial, "r");
    readSync(descriptor, signatureBytes, 0, signatureBytes.byteLength, 0);
    closeSync(descriptor);
    const signature = signatureBytes.toString("hex");
    assert(signature === "49492a00" || signature === "4d4d002a", `v592-usgs-final-tiff-signature:${source.id}:${signature}`);
    renameSync(partial, output);
    const asset = {
      target: source.target,
      id: source.id,
      originalUrl: source.originalUrl,
      url: url.href,
      finalUrl: response.url,
      host: url.hostname,
      requestCount: 1,
      httpStatus: response.status,
      contentType: response.headers.get("content-type") ?? "unreported",
      contentLengthHeader: Number.isFinite(declaredLength) ? declaredLength : null,
      outputPath,
      bytes,
      sha256: hash.digest("hex"),
      metadataProbeId: source.metadataProbeId,
      metadataReceiptSha256: metadata.receiptSha256,
      redirectAdmissionReceiptSha256: redirectAdmission.receiptSha256,
      expectedProjection: source.expectedProjection,
      expectedBands: source.expectedBands,
      expectedResolutionMetersPerPixel: source.expectedResolutionMetersPerPixel,
      coverageDisclosure: source.coverageDisclosure,
      licenseBasis: source.licenseBasis,
      textureSuitabilityReview: "required",
      derivedRuntimeAssetAdmission: false,
      scientificAuthorityGranted: false,
      presentationOnly: true
    };
    assets.push(asset);
    console.log(JSON.stringify({ status: "request-complete", target: source.target, bytes, sha256: asset.sha256 }));
  } catch (error) {
    rmSync(partial, { force: true });
    failures.push({
      target: source.target,
      id: source.id,
      url: url.href,
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
const finalSourceCacheBytes = directoryBytes(resolve(root, "source-cache/v592"));
assert(finalSourceCacheBytes <= definitions.policy.sourceCacheMaximumBytes, `v592-usgs-final-source-cache-limit:${finalSourceCacheBytes}`);
const receipt = writeSealed(receiptPath, {
  version: "v592-major-moon-usgs-final-visual-source-acquisition-v1",
  generatedAt: new Date().toISOString(),
  status: failures.length === 0 ? "committed-four-usgs-pds-tiffs-single-request-each-no-retry" : "partial-usgs-pds-tiffs-with-terminal-failures-no-retry",
  definitionPath: definitionsPath,
  redirectAdmissionReceiptSha256: redirectAdmission.receiptSha256,
  policy: {
    exactHost: definitions.policy.exactHost,
    requestCountPerUrl: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    redirectFollowed: false,
    atomicWrite: ".part-to-final",
    sourceCacheMaximumBytes: definitions.policy.sourceCacheMaximumBytes,
    finalSourceCacheBytes,
    visualAssetAdmissionGrantedByAcquisition: false,
    scientificAuthorityGranted: false,
    presentationOnly: true,
  },
  requestedUrls: [...requestedUrls],
  assets,
  failures,
});
console.log(JSON.stringify({
  status: receipt.status,
  assetCount: receipt.assets.length,
  failureCount: receipt.failures.length,
  finalSourceCacheBytes,
  assets: receipt.assets.map(({ target, bytes, sha256: digest }) => ({ target, bytes, sha256: digest })),
  failures: receipt.failures,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
if (failures.length > 0) process.exitCode = 1;

import { createHash } from "node:crypto";
import { closeSync, createReadStream, createWriteStream, existsSync, mkdirSync, openSync, readFileSync, readSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const root = process.cwd();
const definitions = JSON.parse(readFileSync(resolve(root, "scripts/v592-major-moon-usgs-visual-sources.json"), "utf8"));
const receiptPath = resolve(root, "docs/release/v592/acquisition-receipt-major-moon-usgs-visual-sources-v592.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function verifySealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-major-moon-usgs-source-input-seal:${path}`);
  return document;
}
function writeSealed(path, unsigned) {
  const document = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, `${JSON.stringify(document, null, 2)}\n`);
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

assert(definitions.version === "v592-major-moon-usgs-visual-sources-v1", "v592-major-moon-usgs-source-version");
assert(
  definitions.policy.singleRequestPerUrl === true
  && definitions.policy.automaticRetryAllowed === false
  && definitions.policy.automaticReplacementAllowed === false
  && definitions.policy.atomicWrite === ".part-to-final"
  && definitions.policy.presentationOnly === true
  && definitions.policy.scientificAuthorityGranted === false
  && definitions.policy.visualAssetAdmissionGrantedByAcquisition === false,
  "v592-major-moon-usgs-source-policy",
);

if (existsSync(receiptPath)) {
  const existing = verifySealed(receiptPath);
  for (const asset of existing.assets) {
    const actual = await fileSha(resolve(root, asset.outputPath));
    assert(actual.bytes === asset.bytes && actual.sha256 === asset.sha256, `v592-major-moon-usgs-source-existing-drift:${asset.target}`);
  }
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", assetCount: existing.assets.length, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

const assets = [];
const failures = [];
for (const source of definitions.sources) {
  const metadata = verifySealed(resolve(root, `docs/release/v592/metadata-probe-major-moon-usgs-direct/${source.metadataProbeId}.json`));
  assert(metadata.status === "usgs-direct-metadata-probe-complete-no-visual-payload", `v592-major-moon-usgs-source-metadata:${source.id}`);
  assert(metadata.candidateHrefs.includes(source.url), `v592-major-moon-usgs-source-url-not-in-metadata:${source.id}`);
  const url = new URL(source.url);
  assert(url.protocol === "https:" && definitions.policy.allowedHosts.includes(url.hostname), `v592-major-moon-usgs-source-host:${source.id}:${url.hostname}`);
  assert(!url.username && !url.password && !url.port && !url.hash, `v592-major-moon-usgs-source-url-policy:${source.id}`);
  const outputPath = `source-cache/v592/major-moons/usgs-visual/${source.id}.tif`;
  const output = resolve(root, outputPath);
  const partial = `${output}.part`;
  assert(!existsSync(output) && !existsSync(partial), `v592-major-moon-usgs-source-untracked-existing:${source.id}`);
  mkdirSync(dirname(output), { recursive: true });
  console.log(JSON.stringify({ status: "request-start", target: source.target, id: source.id, url: url.href }));
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": `Orbit-Atlas-v592-${source.id}-single-request-visual-source-acquisition/1.0` },
      signal: AbortSignal.timeout(300_000),
    });
    assert(response.status === 200 && response.url === url.href, `v592-major-moon-usgs-source-http:${source.id}:${response.status}:${response.url}`);
    assert(!response.headers.get("location"), `v592-major-moon-usgs-source-redirect:${source.id}`);
    assert(response.body, `v592-major-moon-usgs-source-body:${source.id}`);
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength)) {
      assert(declaredLength > 0 && declaredLength <= definitions.policy.maximumBytesPerAsset, `v592-major-moon-usgs-source-content-length:${source.id}:${declaredLength}`);
    }
    const hash = createHash("sha256");
    let bytes = 0;
    const meter = new Transform({
      transform(chunk, _encoding, callback) {
        bytes += chunk.byteLength;
        if (bytes > definitions.policy.maximumBytesPerAsset) {
          callback(new Error(`v592-major-moon-usgs-source-size-limit:${source.id}:${bytes}`));
          return;
        }
        hash.update(chunk);
        callback(null, chunk);
      },
    });
    await pipeline(response.body, meter, createWriteStream(partial, { flags: "wx" }));
    assert(bytes > 8 && (!Number.isFinite(declaredLength) || bytes === declaredLength), `v592-major-moon-usgs-source-bytes:${source.id}:${bytes}:${declaredLength}`);
    const signatureBytes = Buffer.alloc(4);
    const descriptor = openSync(partial, "r");
    readSync(descriptor, signatureBytes, 0, signatureBytes.byteLength, 0);
    closeSync(descriptor);
    const signature = signatureBytes.toString("hex");
    assert(signature === "49492a00" || signature === "4d4d002a", `v592-major-moon-usgs-source-tiff-signature:${source.id}:${signature}`);
    renameSync(partial, output);
    const asset = {
      target: source.target,
      id: source.id,
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
    console.log(JSON.stringify({ status: "request-complete", target: source.target, id: source.id, bytes, sha256: asset.sha256 }));
  } catch (error) {
    rmSync(partial, { force: true });
    const failure = {
      target: source.target,
      id: source.id,
      url: url.href,
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      error: error instanceof Error ? error.message : String(error)
    };
    failures.push(failure);
    console.error(JSON.stringify({ status: "request-blocked-no-retry", ...failure }));
  }
}

const receipt = writeSealed(receiptPath, {
  version: "v592-major-moon-usgs-visual-source-acquisition-v1",
  generatedAt: new Date().toISOString(),
  status: failures.length === 0
    ? "committed-three-usgs-visual-sources-single-request-each-no-retry"
    : "partial-committed-with-terminal-failures-no-retry",
  policy: {
    requestCountPerUrl: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    redirectFollowed: false,
    atomicWrite: ".part-to-final",
    sourceCacheMaximumBytes: 2_147_483_648,
    visualAssetAdmissionGrantedByAcquisition: false,
    scientificAuthorityGranted: false,
    presentationOnly: true
  },
  requestCount: assets.length + failures.length,
  assets,
  failures
});
console.log(JSON.stringify({ status: receipt.status, requestCount: receipt.requestCount, assetCount: assets.length, failureCount: failures.length, assets: assets.map(({ target, bytes, sha256 }) => ({ target, bytes, sha256 })), receiptSha256: receipt.receiptSha256 }, null, 2));

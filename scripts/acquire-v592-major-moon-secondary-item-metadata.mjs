import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const definitions = JSON.parse(readFileSync(resolve(root, "scripts/v592-major-moon-secondary-asset-probes.json"), "utf8"));
const receiptPath = resolve(root, "docs/release/v592/acquisition-receipt-major-moon-secondary-item-metadata-v592.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function verifySealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-major-moon-secondary-item-input-seal:${path}`);
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

async function fetchOnce(url, target) {
  assert(url.protocol === "https:" && url.hostname === "images-assets.nasa.gov", `v592-major-moon-secondary-item-url:${target}`);
  assert(!url.username && !url.password && !url.port && !url.hash, `v592-major-moon-secondary-item-url-policy:${target}`);
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": `Orbit-Atlas-v592-${target}-secondary-item-metadata-acquisition/1.0` },
    signal: AbortSignal.timeout(60_000),
  });
  assert(response.status === 200 && response.url === url.href, `v592-major-moon-secondary-item-http:${target}:${response.status}:${response.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  JSON.parse(bytes.toString("utf8"));
  return { response, bytes };
}

assert(definitions.version === "v592-major-moon-secondary-asset-probes-v1", "v592-major-moon-secondary-item-definition-version");
assert(
  definitions.policy.singleRequestPerUrl === true
  && definitions.policy.automaticRetryAllowed === false
  && definitions.policy.automaticReplacementAllowed === false
  && definitions.policy.payloadDownloadAllowed === false,
  "v592-major-moon-secondary-item-policy",
);

if (existsSync(receiptPath)) {
  const existing = verifySealed(receiptPath);
  for (const asset of existing.assets) {
    const bytes = readFileSync(resolve(root, asset.outputPath));
    assert(bytes.byteLength === asset.bytes && sha256(bytes) === asset.sha256, `v592-major-moon-secondary-item-existing-drift:${asset.probeId}`);
  }
  console.log(JSON.stringify({
    status: "existing-receipt-verified-no-network",
    requestCount: existing.requestCount,
    receiptSha256: existing.receiptSha256,
  }, null, 2));
  process.exit(0);
}

const assets = [];
for (const probe of definitions.probes) {
  const manifest = verifySealed(resolve(root, `docs/release/v592/metadata-probe-major-moon-secondary-assets/${probe.id}.json`));
  assert(manifest.status === "secondary-asset-manifest-probe-complete-no-payload", `v592-major-moon-secondary-item-manifest:${probe.id}`);
  const url = new URL(`https://images-assets.nasa.gov/image/${probe.nasaId}/metadata.json`);
  const outputPath = `source-cache/v592/major-moons/secondary-metadata/${probe.target}-${probe.nasaId}.json`;
  assert(!existsSync(resolve(root, outputPath)), `v592-major-moon-secondary-item-untracked-existing:${probe.id}`);
  const { response, bytes } = await fetchOnce(url, probe.id);
  const output = resolve(root, outputPath);
  mkdirSync(dirname(output), { recursive: true });
  const partial = `${output}.part`;
  writeFileSync(partial, bytes);
  renameSync(partial, output);
  const metadata = JSON.parse(bytes.toString("utf8"));
  assets.push({
    probeId: probe.id,
    target: probe.target,
    nasaId: probe.nasaId,
    url: url.href,
    finalUrl: response.url,
    host: url.hostname,
    requestCount: 1,
    httpStatus: response.status,
    contentType: response.headers.get("content-type") ?? "unreported",
    outputPath,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    identity: {
      nasaId: metadata["AVAIL:NASAID"] ?? null,
      title: metadata["AVAIL:Title"] ?? null,
      center: metadata["AVAIL:Center"] ?? null,
      credit: metadata["AVAIL:SecondaryCreator"] ?? null,
      imageWidth: Number(metadata["File:ImageWidth"]) || null,
      imageHeight: Number(metadata["File:ImageHeight"]) || null,
      fileType: metadata["File:FileType"] ?? null
    }
  });
}

const receipt = writeSealed(receiptPath, {
  version: "v592-major-moon-secondary-item-metadata-acquisition-v1",
  generatedAt: new Date().toISOString(),
  status: "committed-six-secondary-metadata-files-single-request-each-no-retry",
  policy: {
    metadataOnly: true,
    visualPayloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    redirectFollowed: false,
    itemLevelLicenseReviewStillRequired: true,
    visualAssetAdmissionGranted: false
  },
  requestCount: assets.length,
  requestCountPerUrl: 1,
  assets,
  failures: []
});

console.log(JSON.stringify({
  status: receipt.status,
  requestCount: receipt.requestCount,
  assets: receipt.assets.map(({ probeId, target, nasaId, identity }) => ({ probeId, target, nasaId, identity })),
  receiptSha256: receipt.receiptSha256,
}, null, 2));

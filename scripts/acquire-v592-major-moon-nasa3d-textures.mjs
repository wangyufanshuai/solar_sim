import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-21T00:00:00Z";
const receiptPath = resolve(
  root,
  "docs/release/v592/acquisition-receipt-major-moon-nasa3d-textures-v592.json",
);
const nasaTreePath = resolve(root, "docs/release/v591/metadata-probe-nasa-3d-tree.json");
const allowedHost = "raw.githubusercontent.com";
const repositoryPath = "nasa/NASA-3D-Resources/master";

const assets = Object.freeze([
  {
    target: "triton",
    sourcePath: "Images and Textures/Neptune - Triton/Neptune - Triton.tif",
    expectedBytes: 3_135_664,
    expectedGitBlobSha1: "0c667c814fe31a2df80f3fdbd2a28bb2ba030160",
    outputPath: "source-cache/v592/major-moons/nasa-3d-resources/triton-global.tif",
  },
  {
    target: "miranda",
    sourcePath: "Images and Textures/Uranus - Miranda/Uranus - Miranda.tif",
    expectedBytes: 3_136_484,
    expectedGitBlobSha1: "d0bfaefb16bd86cc14fea4a2465cb367067c38a8",
    outputPath: "source-cache/v592/major-moons/nasa-3d-resources/miranda-global.tif",
  },
  {
    target: "titania",
    sourcePath: "Images and Textures/Uranus - Titania/Uranus - Titania.tif",
    expectedBytes: 3_136_428,
    expectedGitBlobSha1: "f02412641fff082d7f1b9b0aba5479e6bbdd3d48",
    outputPath: "source-cache/v592/major-moons/nasa-3d-resources/titania-global.tif",
  },
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const gitBlobSha1 = (bytes) => {
  const header = Buffer.from(`blob ${bytes.byteLength}\0`, "utf8");
  return createHash("sha1").update(Buffer.concat([header, bytes])).digest("hex");
};
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, bytes, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function assertUrl(raw) {
  const url = new URL(raw);
  if (
    url.protocol !== "https:"
    || url.hostname !== allowedHost
    || url.username
    || url.password
    || url.port
    || !url.pathname.startsWith(`/${repositoryPath}/`)
  ) {
    throw new Error(`v592-nasa3d-url-policy:${raw}`);
  }
  return url;
}
function verifyTreeMetadata() {
  if (!existsSync(nasaTreePath)) throw new Error("v592-nasa3d-tree-metadata-missing");
  const document = JSON.parse(readFileSync(nasaTreePath, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  if (document.receiptSha256 !== canonicalSha(unsigned)) throw new Error("v592-nasa3d-tree-metadata-seal");
  if (document.status !== "metadata-probe-complete-no-model-payload" || document.policy.payloadDownloaded !== false) {
    throw new Error("v592-nasa3d-tree-metadata-policy");
  }
  return document;
}

if (existsSync(receiptPath)) throw new Error("v592-nasa3d-acquisition-receipt-exists-no-repeat");
const treeMetadata = verifyTreeMetadata();
const requestedUrls = new Set();
const acquired = [];
const failures = [];

for (const asset of assets) {
  const encodedPath = asset.sourcePath.split("/").map(encodeURIComponent).join("/");
  const url = assertUrl(`https://${allowedHost}/${repositoryPath}/${encodedPath}`);
  if (requestedUrls.has(url.href)) throw new Error(`v592-nasa3d-duplicate-url:${asset.target}`);
  requestedUrls.add(url.href);
  const output = resolve(root, asset.outputPath);
  const partial = `${output}.part`;
  if (existsSync(output) || existsSync(partial)) throw new Error(`v592-nasa3d-existing-output:${asset.target}`);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        accept: "image/tiff,application/octet-stream;q=0.9,*/*;q=0.1",
        "user-agent": `Orbit-Atlas-v592-${asset.target}-NASA-3D-single-request/1.0`,
      },
      signal: AbortSignal.timeout(180_000),
    });
    const bytes = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type")?.split(";")[0] ?? "unreported";
    const actualSha256 = sha256(bytes);
    const actualGitBlobSha1 = gitBlobSha1(bytes);
    const valid = response.status === 200
      && response.url === url.href
      && !response.headers.get("location")
      && bytes.byteLength === asset.expectedBytes
      && actualGitBlobSha1 === asset.expectedGitBlobSha1;
    if (!valid) {
      failures.push({
        target: asset.target,
        url: url.href,
        httpStatus: response.status,
        finalUrl: response.url,
        contentType,
        bytes: bytes.byteLength,
        sha256: actualSha256,
        gitBlobSha1: actualGitBlobSha1,
        expectedBytes: asset.expectedBytes,
        expectedGitBlobSha1: asset.expectedGitBlobSha1,
        requestCount: 1,
        automaticRetryPerformed: false,
        automaticReplacementPerformed: false,
        error: "source-byte-contract-failed",
      });
      continue;
    }
    atomicWrite(output, bytes);
    acquired.push({
      target: asset.target,
      sourcePath: asset.sourcePath,
      sourceUrl: url.href,
      finalUrl: response.url,
      sourceHost: url.hostname,
      contentType,
      outputPath: asset.outputPath,
      bytes: bytes.byteLength,
      sha256: actualSha256,
      gitBlobSha1: actualGitBlobSha1,
      expectedBytes: asset.expectedBytes,
      expectedGitBlobSha1: asset.expectedGitBlobSha1,
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      license: "NASA public-domain media provenance via official NASA 3D Resources repository; source attribution retained",
      licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
      repositoryUrl: "https://github.com/nasa/NASA-3D-Resources",
      scientificPayload: false,
      presentationOnly: true,
      visualAssetAdmission: "candidate-analysis-required",
    });
  } catch (error) {
    rmSync(partial, { force: true });
    failures.push({
      target: asset.target,
      url: url.href,
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const unsigned = {
  version: "v592-major-moon-nasa3d-visual-acquisition-v1",
  generatedAt,
  status: failures.length === 0
    ? "three-nasa3d-tiffs-acquired-single-request-each-analysis-required"
    : `partial-${acquired.length}-of-three-nasa3d-tiffs-no-retry`,
  policy: {
    allowedHost,
    repositoryPath,
    requestCount: assets.length,
    requestCountPerUrl: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    redirectFollowed: false,
    atomicWrite: ".part-to-final",
    sourceCacheOnly: true,
    visualPayloadDownloaded: acquired.length > 0,
    scientificPayloadDownloaded: false,
    visualAssetAdmissionGranted: false,
    proceduralFallbackAllowed: false,
    syntheticCoverageFillAllowed: false,
  },
  provenance: {
    archive: "NASA 3D Resources official GitHub repository",
    repositoryUrl: "https://github.com/nasa/NASA-3D-Resources",
    metadataTreePath: "docs/release/v591/metadata-probe-nasa-3d-tree.json",
    metadataTreeReceiptSha256: treeMetadata.receiptSha256,
    license: "NASA-public-domain",
    licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
  },
  requestedUrls: [...requestedUrls],
  assets: acquired,
  failures,
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(receiptPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
console.log(JSON.stringify({
  status: receipt.status,
  acquiredCount: acquired.length,
  failureCount: failures.length,
  assets: acquired.map(({ target, bytes, sha256: digest }) => ({ target, bytes, sha256: digest })),
  failures,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
if (failures.length > 0) process.exitCode = 1;

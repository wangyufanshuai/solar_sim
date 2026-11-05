import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const requestUrl = new URL("https://science.nasa.gov/3d-resources/ceres/");
const outputPath = resolve(root, "docs/release/v591/metadata-probe-ceres-nasa3d-page.json");
const rawPath = resolve(root, "source-cache/celestial-convergence-v591/ceres/nasa3d-ceres-page.html");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, bytes, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function writeSealed(unsigned) {
  const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicWrite(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}
function readSealed() {
  const value = JSON.parse(readFileSync(outputPath, "utf8"));
  const unsigned = { ...value };
  delete unsigned.receiptSha256;
  assert(value.receiptSha256 === canonicalSha(unsigned), "v591-ceres-nasa3d-existing-seal");
  return value;
}

assert(requestUrl.protocol === "https:" && requestUrl.hostname === "science.nasa.gov" && !requestUrl.username && !requestUrl.password && !requestUrl.port, "v591-ceres-nasa3d-url");
if (existsSync(outputPath)) {
  const existing = readSealed();
  assert(existing.request.url === requestUrl.href && existing.requestCount === 1, "v591-ceres-nasa3d-existing-identity");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

let response = null;
try {
  response = await fetch(requestUrl, {
    method: "GET",
    redirect: "manual",
    headers: { accept: "text/html,application/xhtml+xml", "user-agent": "Orbit-Atlas-v591-ceres-nasa3d-probe/1.0" },
    signal: AbortSignal.timeout(120_000),
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  const location = response.headers.get("location");
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  const redirected = [301, 302, 303, 307, 308].includes(response.status) || Boolean(location) || response.url !== requestUrl.href;
  if (redirected) {
    const receipt = writeSealed({
      version: "v591-ceres-nasa3d-page-metadata-probe-v1",
      probedAt: new Date().toISOString(),
      status: "blocked-redirect-not-followed",
      target: "ceres",
      requestCount: 1,
      request: { url: requestUrl.href, finalUrl: response.url, httpStatus: response.status, location, mediaType, bytes: bytes.length, sha256: sha256(bytes), rawPath: null },
      candidates: [],
      payloadDownloaded: false,
      automaticRedirectFollowed: false,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      license: { id: "NASA-public-domain", url: "https://www.nasa.gov/nasa-brand-center/images-and-media/" },
    });
    console.log(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
    process.exit(0);
  }
  atomicWrite(rawPath, bytes);
  const html = bytes.toString("utf8");
  const candidates = [...html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)]
    .map((match) => new URL(match[1], requestUrl).href)
    .filter((url) => /(?:ceres|dawn)/i.test(url) && /\.(?:glb|gltf|obj|stl|fbx|zip|tif|tiff|png|jpe?g)(?:\?|$)/i.test(url))
    .filter((url, index, values) => values.indexOf(url) === index);
  const receipt = writeSealed({
    version: "v591-ceres-nasa3d-page-metadata-probe-v1",
    probedAt: new Date().toISOString(),
    status: response.ok ? candidates.length > 0 ? "metadata-candidates-present-no-payload" : "metadata-page-present-no-asset-candidates" : "blocked-http-response",
    target: "ceres",
    requestCount: 1,
    request: { url: requestUrl.href, finalUrl: response.url, httpStatus: response.status, location: null, mediaType, bytes: bytes.length, sha256: sha256(bytes), rawPath: "source-cache/celestial-convergence-v591/ceres/nasa3d-ceres-page.html" },
    candidates,
    payloadDownloaded: false,
    automaticRedirectFollowed: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    license: { id: "NASA-public-domain", url: "https://www.nasa.gov/nasa-brand-center/images-and-media/" },
  });
  console.log(JSON.stringify({ status: receipt.status, httpStatus: response.status, candidates, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  if (response === null) {
    const receipt = writeSealed({
      version: "v591-ceres-nasa3d-page-metadata-probe-v1",
      probedAt: new Date().toISOString(),
      status: "blocked-network-no-retry",
      target: "ceres",
      requestCount: 1,
      request: { url: requestUrl.href, finalUrl: null, httpStatus: null, location: null, mediaType: null, bytes: 0, sha256: null, rawPath: null },
      candidates: [],
      payloadDownloaded: false,
      automaticRedirectFollowed: false,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      error: error instanceof Error ? error.message : String(error),
      license: { id: "NASA-public-domain", url: "https://www.nasa.gov/nasa-brand-center/images-and-media/" },
    });
    console.error(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
  }
  throw error;
}

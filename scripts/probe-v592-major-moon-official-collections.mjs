import { createHash } from "node:crypto";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-20T00:00:00Z";
const receiptPath = resolve(root, "docs/release/v592/metadata-probe-major-moon-official-collections-v592.json");
const allowedHosts = new Set(["astrogeology.usgs.gov"]);
const probes = Object.freeze([
  {
    id: "jupiter-voyager-galileo-global-mosaics",
    url: "https://astrogeology.usgs.gov/search/map/jupiter-voyager-and-galileo-global-mosaics",
    outputPath: "source-cache/v592/major-moons/official-collections/jupiter-voyager-galileo-global-mosaics.html",
  },
  {
    id: "saturn-voyager-airbrush-global-products",
    url: "https://astrogeology.usgs.gov/search/map/saturn-voyager-airbrush-global-products",
    outputPath: "source-cache/v592/major-moons/official-collections/saturn-voyager-airbrush-global-products.html",
  },
  {
    id: "new-horizon-global-mosaics",
    url: "https://astrogeology.usgs.gov/search/map/new-horizon-global-mosaics",
    outputPath: "source-cache/v592/major-moons/official-collections/new-horizon-global-mosaics.html",
  },
  {
    id: "planetary-globes",
    url: "https://astrogeology.usgs.gov/search/map/planetary-globes",
    outputPath: "source-cache/v592/major-moons/official-collections/planetary-globes.html",
  },
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = path + ".part";
  writeFileSync(partial, bytes, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function assertUrl(raw) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.port || !allowedHosts.has(url.hostname)) {
    throw new Error("v592-major-moon-collection-url:" + raw);
  }
  return url;
}

if (existsSync(receiptPath)) throw new Error("v592-major-moon-collection-receipt-exists-no-repeat");
for (const probe of probes) {
  if (existsSync(resolve(root, probe.outputPath)) || existsSync(resolve(root, probe.outputPath + ".part"))) {
    throw new Error("v592-major-moon-collection-output-exists-no-repeat:" + probe.id);
  }
}

const assets = [];
const failures = [];
for (const probe of probes) {
  const url = assertUrl(probe.url);
  try {
    const response = await fetch(url, {
      redirect: "manual",
      headers: { "user-agent": "Orbit-Atlas-v592-" + probe.id + "-metadata-probe/1.0" },
      signal: AbortSignal.timeout(45_000),
    });
    if (response.status >= 300 && response.status < 400) {
      failures.push({
        id: probe.id,
        url: url.href,
        httpStatus: response.status,
        finalUrl: url.href,
        redirectLocation: response.headers.get("location"),
        requestCount: 1,
        automaticRetryPerformed: false,
        payloadDownloaded: false,
        error: "redirect-not-followed",
      });
      continue;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type");
    if (response.status !== 200 || response.url !== url.href || !contentType?.toLowerCase().includes("text/html") || bytes.byteLength < 1024) {
      failures.push({
        id: probe.id,
        url: url.href,
        httpStatus: response.status,
        finalUrl: response.url,
        contentType,
        bytes: bytes.byteLength,
        sha256: sha256(bytes),
        requestCount: 1,
        automaticRetryPerformed: false,
        payloadDownloaded: false,
        error: "metadata-response-contract",
      });
      continue;
    }
    atomicWrite(resolve(root, probe.outputPath), bytes);
    assets.push({
      id: probe.id,
      url: url.href,
      finalUrl: response.url,
      host: url.hostname,
      httpStatus: response.status,
      contentType,
      outputPath: probe.outputPath,
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      requestCount: 1,
      automaticRetryPerformed: false,
      payloadDownloaded: false,
    });
  } catch (error) {
    failures.push({
      id: probe.id,
      url: url.href,
      requestCount: 1,
      automaticRetryPerformed: false,
      payloadDownloaded: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const unsigned = {
  version: "v592-major-moon-official-collection-metadata-probe-v1",
  generatedAt,
  status: failures.length === 0
    ? "four-official-usgs-collection-pages-acquired-no-visual-payload"
    : "partial-" + assets.length + "-of-four-official-collection-pages-no-retry",
  requestCount: probes.length,
  requestCountPerUrl: 1,
  automaticRetryPerformed: false,
  automaticReplacementPerformed: false,
  redirectFollowed: false,
  assets,
  failures,
  policy: {
    metadataOnly: true,
    payloadDownloaded: false,
    visualAssetAdmissionGranted: false,
    scientificAuthorityGranted: false,
    scientificPayloadWriteback: false,
  },
};
const document = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(receiptPath, Buffer.from(JSON.stringify(document, null, 2) + "\n", "utf8"));
console.log(JSON.stringify({
  status: document.status,
  acquiredCount: assets.length,
  failureCount: failures.length,
  receiptSha256: document.receiptSha256,
}, null, 2));

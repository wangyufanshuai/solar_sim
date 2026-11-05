import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v591/metadata-probe-venus-nasa-cloud.json");
const blockedPath = resolve(root, "docs/release/v591/metadata-probe-venus-nasa-cloud-blocked.json");
const metadataUrl = "https://images-api.nasa.gov/search?q=Venus%20clouds%20global%20mosaic&media_type=image&page_size=100";
const allowedHosts = new Set(["images-api.nasa.gov", "images-assets.nasa.gov"]);

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
function readSealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v591-venus-cloud-metadata-seal:${path}`);
  return document;
}
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
  return sealed;
}
function validateUrl(rawUrl, expectedHost) {
  const url = new URL(rawUrl);
  assert(url.protocol === "https:" && allowedHosts.has(url.hostname) && (!expectedHost || url.hostname === expectedHost), `v591-venus-cloud-metadata-url:${url.hostname}`);
  assert(!url.username && !url.password && !url.port, "v591-venus-cloud-metadata-url-credentials");
  return url;
}

if (existsSync(outputPath)) {
  const existing = readSealed(outputPath);
  assert(existing.status === "metadata-probe-complete-no-payload", "v591-venus-cloud-metadata-existing-status");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", candidateCount: existing.candidates.length, receiptSha256: existing.receiptSha256 }, null, 2));
} else {
  assert(!existsSync(blockedPath), "v591-venus-cloud-metadata-terminal-block-exists");
  const url = validateUrl(metadataUrl, "images-api.nasa.gov");
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Orbit-Atlas-v591-venus-cloud-metadata-probe/1.0" },
      signal: AbortSignal.timeout(60_000),
    });
    assert(response.status === 200 && response.url === metadataUrl, `v591-venus-cloud-metadata-http:${response.status}:${response.url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const document = JSON.parse(bytes.toString("utf8"));
    const items = document.collection?.items;
    assert(Array.isArray(items), "v591-venus-cloud-metadata-items");
    const candidates = items.map((item) => {
      const data = Array.isArray(item.data) ? item.data[0] : null;
      const nasaId = data?.nasa_id;
      const assetManifestUrl = item.href;
      assert(typeof nasaId === "string" && nasaId.length > 0, "v591-venus-cloud-metadata-nasa-id");
      validateUrl(assetManifestUrl, "images-api.nasa.gov");
      const preview = (item.links ?? []).find((link) => link.rel === "preview" && typeof link.href === "string")?.href ?? null;
      if (preview) validateUrl(preview);
      return {
        nasaId,
        title: String(data?.title ?? "").slice(0, 240),
        description: String(data?.description ?? "").replaceAll(/\s+/g, " ").slice(0, 800),
        dateCreated: data?.date_created ?? null,
        center: data?.center ?? null,
        photographer: data?.photographer ?? null,
        keywords: Array.isArray(data?.keywords) ? data.keywords.slice(0, 24) : [],
        assetManifestUrl,
        previewUrl: preview,
      };
    });
    const receipt = writeSealed(outputPath, {
      version: "v591-venus-nasa-cloud-metadata-probe-v1",
      probedAt: new Date().toISOString(),
      status: "metadata-probe-complete-no-payload",
      policy: {
        requestCount: 1,
        automaticRetryPerformed: false,
        automaticReplacementPerformed: false,
        payloadDownloaded: false,
        redirectPolicy: "manual-no-redirect-accepted",
      },
      provenance: {
        archive: "NASA Image and Video Library API",
        host: "images-api.nasa.gov",
        license: { id: "NASA-public-domain", url: "https://www.nasa.gov/nasa-brand-center/images-and-media/" },
      },
      metadataRequest: {
        url: metadataUrl,
        finalUrl: response.url,
        status: response.status,
        contentType: response.headers.get("content-type") ?? "unreported",
        responseBytes: bytes.byteLength,
        responseSha256: sha256(bytes),
      },
      totalHits: document.collection?.metadata?.total_hits ?? null,
      candidates,
      cloudTextureAdmission: "pending-human-readable-product-identity-and-equirectangular-suitability",
    });
    console.log(JSON.stringify({ status: receipt.status, totalHits: receipt.totalHits, candidates, receiptSha256: receipt.receiptSha256 }, null, 2));
  } catch (error) {
    const blocked = writeSealed(blockedPath, {
      version: "v591-venus-nasa-cloud-metadata-probe-blocked-v1",
      failedAt: new Date().toISOString(),
      status: "blocked-no-automatic-retry",
      metadataUrl,
      requestCount: 1,
      payloadDownloaded: false,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(JSON.stringify({ status: blocked.status, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
    throw error;
  }
}

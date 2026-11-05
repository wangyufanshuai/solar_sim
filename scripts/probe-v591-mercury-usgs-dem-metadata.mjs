import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v591/metadata-probe-mercury-usgs-dem.json");
const blockedPath = resolve(root, "docs/release/v591/metadata-probe-mercury-usgs-dem-blocked.json");
const historicalBlockPath = resolve(root, "docs/release/v591/acquisition-blocked-mercury.json");
const metadataUrl = "https://asc-pds-services.s3.us-west-2.amazonaws.com/?list-type=2&prefix=mosaic%2FMercury_Messenger_USGS_DEM_Global_665m_v2.tif&max-keys=20";
const expectedKey = "mosaic/Mercury_Messenger_USGS_DEM_Global_665m_v2.tif";
const sourcePage = "https://astrogeology.usgs.gov/search/map/mercury_messenger_global_dem_665m";
const originUrl = "https://planetarymaps.usgs.gov/mosaic/Mercury_Messenger_USGS_DEM_Global_665m_v2.tif";

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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v591-mercury-metadata-seal:${path}`);
  return document;
}
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  renameSync(partial, path);
  return sealed;
}
function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}
function field(block, name) {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? decodeXml(match[1].trim()) : null;
}

if (existsSync(outputPath)) {
  const existing = readSealed(outputPath);
  assert(existing.status === "metadata-identity-confirmed-no-payload", "v591-mercury-metadata-existing-status");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256, object: existing.object }, null, 2));
} else {
  assert(!existsSync(blockedPath), "v591-mercury-metadata-terminal-block-exists");
  const historicalBlock = readSealed(historicalBlockPath);
  assert(historicalBlock.status === "blocked-no-automatic-retry", "v591-mercury-metadata-historical-block");
  const url = new URL(metadataUrl);
  assert(url.protocol === "https:" && url.hostname === "asc-pds-services.s3.us-west-2.amazonaws.com", "v591-mercury-metadata-url");
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Orbit-Atlas-v591-mercury-metadata-probe/1.0" },
      signal: AbortSignal.timeout(60_000),
    });
    assert(response.status === 200, `v591-mercury-metadata-http:${response.status}`);
    const body = await response.text();
    const contents = [...body.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)].map((match) => match[1]);
    const exact = contents.filter((block) => field(block, "Key") === expectedKey);
    assert(exact.length === 1, `v591-mercury-metadata-key-count:${exact.length}`);
    const bytes = Number(field(exact[0], "Size"));
    const etag = field(exact[0], "ETag")?.replace(/^"|"$/g, "") ?? null;
    const lastModified = field(exact[0], "LastModified");
    assert(Number.isSafeInteger(bytes) && bytes > 1_048_576, `v591-mercury-metadata-bytes:${bytes}`);
    assert(typeof etag === "string" && etag.length > 0 && typeof lastModified === "string" && lastModified.length > 0, "v591-mercury-metadata-fields");
    const receipt = writeSealed(outputPath, {
      version: "v591-mercury-usgs-dem-metadata-probe-v1",
      probedAt: new Date().toISOString(),
      status: "metadata-identity-confirmed-no-payload",
      policy: {
        requestCount: 1,
        automaticRetryPerformed: false,
        automaticReplacementPerformed: false,
        payloadDownloaded: false,
      },
      sourcePage,
      originUrl,
      historicalBlockedReceiptSha256: historicalBlock.receiptSha256,
      metadataRequest: {
        url: metadataUrl,
        finalUrl: response.url,
        status: response.status,
        contentType: response.headers.get("content-type") ?? "unreported",
        responseBytes: Buffer.byteLength(body, "utf8"),
        responseSha256: sha256(Buffer.from(body, "utf8")),
      },
      object: {
        bucket: "asc-pds-services",
        host: url.hostname,
        key: expectedKey,
        directUrl: `https://${url.hostname}/${expectedKey}`,
        bytes,
        etag,
        lastModified,
        identity: "USGS Astrogeology Science Center PDS object for Mercury MESSENGER Global DEM 665m v2",
        license: {
          id: "USGS-public-domain",
          url: "https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits",
        },
      },
    });
    console.log(JSON.stringify({ status: receipt.status, object: receipt.object, receiptSha256: receipt.receiptSha256 }, null, 2));
  } catch (error) {
    const blocked = writeSealed(blockedPath, {
      version: "v591-mercury-usgs-dem-metadata-probe-blocked-v1",
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

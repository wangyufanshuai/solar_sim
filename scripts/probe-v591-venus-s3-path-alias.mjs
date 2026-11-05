import { createHash } from "node:crypto";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const metadataUrl = new URL("https://s3.us-west-2.amazonaws.com/asc-pds-services?list-type=2&prefix=mosaic%2FVenus_Magellan_C3-MDIR_ClrTopo_Global_Mosaic_6600m.cub&max-keys=10");
const outputPath = resolve(root, "docs/release/v591/metadata-probe-venus-s3-path-alias.json");
const blockedPath = resolve(root, "docs/release/v591/metadata-probe-venus-s3-path-alias-blocked.json");
const rawPath = resolve(root, "source-cache/celestial-convergence-v591/venus/metadata/s3-path-alias-listing.xml");
const targetKey = "mosaic/Venus_Magellan_C3-MDIR_ClrTopo_Global_Mosaic_6600m.cub";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.${process.pid}.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function writeSealed(path, unsigned) { const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(path, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8")); return receipt; }

assert(metadataUrl.protocol === "https:" && metadataUrl.hostname === "s3.us-west-2.amazonaws.com" && metadataUrl.pathname === "/asc-pds-services", "v591-venus-s3-alias-metadata-url");
try {
  const response = await fetch(metadataUrl, { method: "GET", redirect: "manual", headers: { "user-agent": "Orbit-Atlas-v591-Venus-S3-Path-Alias-Metadata/1.0" }, signal: AbortSignal.timeout(45_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  assert(response.status === 200 && response.url === metadataUrl.href && !response.headers.get("location"), `v591-venus-s3-alias-metadata-http:${response.status}:${response.url}`);
  assert(mediaType === "application/xml" || mediaType === "text/xml", `v591-venus-s3-alias-metadata-media:${mediaType}`);
  const xml = bytes.toString("utf8");
  const key = xml.match(/<Key>([^<]+)<\/Key>/)?.[1] ?? null;
  const size = Number(xml.match(/<Size>(\d+)<\/Size>/)?.[1]);
  const etag = (xml.match(/<ETag>&quot;([^<]+)&quot;<\/ETag>/)?.[1] ?? xml.match(/<ETag>"([^<]+)"<\/ETag>/)?.[1] ?? "").trim();
  assert(key === targetKey && size === 49_841_063 && etag === "31030252e464d93233aab6265efba449-6", `v591-venus-s3-alias-metadata-identity:${key}:${size}:${etag}`);
  atomicWrite(rawPath, bytes);
  const receipt = writeSealed(outputPath, {
    version: "v591-venus-s3-path-alias-metadata-probe-v1",
    probedAt: new Date().toISOString(),
    status: "metadata-candidate-confirmed-no-payload",
    target: "venus",
    archiveIdentity: "USGS Astrogeology PDS public S3 bucket via AWS regional path-style endpoint",
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    payloadDownloaded: false,
    request: { url: metadataUrl.href, finalUrl: response.url, httpStatus: response.status, mediaType, bytes: bytes.byteLength, sha256: sha256(bytes), rawPath: "source-cache/celestial-convergence-v591/venus/metadata/s3-path-alias-listing.xml" },
    candidate: {
      bucket: "asc-pds-services",
      key,
      bytes: size,
      etag,
      directUrl: `https://s3.us-west-2.amazonaws.com/asc-pds-services/${key}`,
      identityRelation: "same-USGS-object-key-bytes-etag-as-terminal-virtual-host-attempt-new-url-not-retry",
    },
    license: { id: "USGS-public-domain", url: "https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits" },
  });
  console.log(JSON.stringify({ status: receipt.status, candidate: receipt.candidate, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  const blocked = writeSealed(blockedPath, {
    version: "v591-venus-s3-path-alias-metadata-probe-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    target: "venus",
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    url: metadataUrl.href,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}

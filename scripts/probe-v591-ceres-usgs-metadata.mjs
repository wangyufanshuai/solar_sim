import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v591/metadata-probe-ceres-usgs.json");
const blockedPath = resolve(root, "docs/release/v591/metadata-probe-ceres-usgs-blocked.json");
const metadataUrl = "https://asc-pds-services.s3.us-west-2.amazonaws.com/?list-type=2&prefix=mosaic%2FCeres&max-keys=1000";
const allowedHost = "asc-pds-services.s3.us-west-2.amazonaws.com";

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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v591-ceres-metadata-seal:${path}`);
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
  assert(existing.status === "metadata-candidates-confirmed-no-payload", "v591-ceres-metadata-existing-status");
  console.log(JSON.stringify({
    status: "existing-receipt-verified-no-network",
    candidateCount: existing.candidates.length,
    receiptSha256: existing.receiptSha256,
  }, null, 2));
} else {
  assert(!existsSync(blockedPath), "v591-ceres-metadata-terminal-block-exists");
  const url = new URL(metadataUrl);
  assert(url.protocol === "https:" && url.hostname === allowedHost && !url.username && !url.password && !url.port, "v591-ceres-metadata-url");
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Orbit-Atlas-v591-ceres-metadata-probe/1.0" },
      signal: AbortSignal.timeout(60_000),
    });
    assert(response.status === 200 && response.url === metadataUrl, `v591-ceres-metadata-http:${response.status}:${response.url}`);
    const body = await response.text();
    const contents = [...body.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)].map((match) => match[1]);
    const candidates = contents.map((block) => {
      const key = field(block, "Key");
      const bytes = Number(field(block, "Size"));
      const etag = field(block, "ETag")?.replace(/^"|"$/g, "") ?? null;
      const lastModified = field(block, "LastModified");
      assert(typeof key === "string" && key.startsWith("mosaic/Ceres"), `v591-ceres-metadata-key:${key}`);
      assert(Number.isSafeInteger(bytes) && bytes > 0, `v591-ceres-metadata-bytes:${key}:${bytes}`);
      assert(typeof etag === "string" && etag.length > 0 && typeof lastModified === "string" && lastModified.length > 0, `v591-ceres-metadata-fields:${key}`);
      return {
        key,
        bytes,
        etag,
        lastModified,
        directUrl: `https://${allowedHost}/${key.split("/").map(encodeURIComponent).join("/")}`,
      };
    });
    assert(candidates.length > 0, "v591-ceres-metadata-no-candidates");
    const receipt = writeSealed(outputPath, {
      version: "v591-ceres-usgs-metadata-probe-v1",
      probedAt: new Date().toISOString(),
      status: "metadata-candidates-confirmed-no-payload",
      policy: {
        requestCount: 1,
        automaticRetryPerformed: false,
        automaticReplacementPerformed: false,
        payloadDownloaded: false,
        redirectPolicy: "manual-no-redirect-accepted",
      },
      provenance: {
        archive: "USGS Astrogeology / NASA PDS object storage",
        host: allowedHost,
        license: {
          id: "USGS-public-domain",
          url: "https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits",
        },
      },
      metadataRequest: {
        url: metadataUrl,
        finalUrl: response.url,
        status: response.status,
        contentType: response.headers.get("content-type") ?? "unreported",
        responseBytes: Buffer.byteLength(body, "utf8"),
        responseSha256: sha256(Buffer.from(body, "utf8")),
        isTruncated: /<IsTruncated>true<\/IsTruncated>/.test(body),
      },
      candidates,
    });
    console.log(JSON.stringify({
      status: receipt.status,
      candidateCount: candidates.length,
      candidates,
      receiptSha256: receipt.receiptSha256,
    }, null, 2));
  } catch (error) {
    const blocked = writeSealed(blockedPath, {
      version: "v591-ceres-usgs-metadata-probe-blocked-v1",
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

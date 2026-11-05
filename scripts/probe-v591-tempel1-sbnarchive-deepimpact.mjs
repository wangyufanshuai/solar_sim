import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const url = new URL("https://sbnarchive.psi.edu/pds3/deepimpact/");
const outputPath = resolve(root, "docs/release/v591/metadata-probe-tempel-1-sbnarchive-deepimpact.json");
const blockedPath = resolve(root, "docs/release/v591/metadata-probe-tempel-1-sbnarchive-deepimpact-blocked.json");
const rawPath = resolve(root, "source-cache/celestial-convergence-v591/tempel-1/sbnarchive-deepimpact-index.html");
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
  const part = `${path}.${process.pid}.part`;
  rmSync(part, { force: true });
  writeFileSync(part, bytes, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(part, path);
}
function writeSealed(path, unsigned) {
  const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicWrite(path, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
  return receipt;
}
function readSealed(path) {
  const receipt = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...receipt };
  delete unsigned.receiptSha256;
  assert(receipt.receiptSha256 === canonicalSha(unsigned), "v591-tempel1-sbnarchive-existing-seal");
  return receipt;
}

assert(url.protocol === "https:" && url.hostname === "sbnarchive.psi.edu" && url.pathname === "/pds3/deepimpact/", "v591-tempel1-sbnarchive-url");
if (existsSync(outputPath)) {
  const receipt = readSealed(outputPath);
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", candidates: receipt.candidates, receiptSha256: receipt.receiptSha256 }, null, 2));
} else {
  assert(!existsSync(blockedPath), "v591-tempel1-sbnarchive-terminal-block");
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Orbit-Atlas-v591-Tempel1-SBNArchive-Metadata/1.0" },
      signal: AbortSignal.timeout(60_000),
    });
    const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
    const bytes = Buffer.from(await response.arrayBuffer());
    assert(response.status === 200 && response.url === url.href && !response.headers.get("location"), `v591-tempel1-sbnarchive-http:${response.status}:${response.url}`);
    assert(mediaType === "text/html", `v591-tempel1-sbnarchive-media:${mediaType}`);
    const html = bytes.toString("utf8");
    const candidates = [...html.matchAll(/href=["']([^"']+)["']/gi)]
      .map((match) => match[1])
      .filter((href) => /tempel|shape|derived/i.test(href))
      .map((href) => ({ href, resolvedUrl: new URL(href, url).href }));
    atomicWrite(rawPath, bytes);
    const receipt = writeSealed(outputPath, {
      version: "v591-tempel-1-sbnarchive-deepimpact-metadata-probe-v1",
      probedAt: new Date().toISOString(),
      status: candidates.length > 0 ? "metadata-candidates-present-no-payload" : "metadata-complete-no-tempel-1-shape-candidate",
      target: "tempel-1",
      archiveIdentity: "NASA PDS Small Bodies Node PDS3 archive hosted by Planetary Science Institute",
      requestCount: 1,
      request: { url: url.href, finalUrl: response.url, httpStatus: response.status, mediaType, bytes: bytes.byteLength, sha256: sha256(bytes), rawPath: "source-cache/celestial-convergence-v591/tempel-1/sbnarchive-deepimpact-index.html" },
      candidates,
      payloadDownloaded: false,
      sciencePayloadDownloaded: false,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      license: { id: "NASA-PDS-SBN-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" },
    });
    console.log(JSON.stringify({ status: receipt.status, candidates, receiptSha256: receipt.receiptSha256 }, null, 2));
  } catch (error) {
    const blocked = writeSealed(blockedPath, {
      version: "v591-tempel-1-sbnarchive-deepimpact-metadata-probe-blocked-v1",
      failedAt: new Date().toISOString(),
      status: "blocked-no-automatic-retry",
      target: "tempel-1",
      url: url.href,
      requestCount: 1,
      payloadDownloaded: false,
      sciencePayloadDownloaded: false,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(JSON.stringify({ status: blocked.status, receiptSha256: blocked.receiptSha256 }, null, 2));
    throw error;
  }
}

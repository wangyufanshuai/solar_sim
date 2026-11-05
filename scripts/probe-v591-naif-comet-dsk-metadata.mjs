import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const url = "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/dsk/comets/";
const outputPath = resolve(root, "docs/release/v591/metadata-probe-tempel-1-naif-comet-dsk.json");
const blockedPath = resolve(root, "docs/release/v591/metadata-probe-tempel-1-naif-comet-dsk-blocked.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const part = `${path}.part`;
  rmSync(part, { force: true });
  writeFileSync(part, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(part, path);
  return sealed;
}
function verifySealed(path) {
  const receipt = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...receipt };
  delete unsigned.receiptSha256;
  assert(receipt.receiptSha256 === canonicalSha(unsigned), "v591-naif-comet-dsk-existing-seal");
  return receipt;
}

if (existsSync(outputPath)) {
  const receipt = verifySealed(outputPath);
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", candidateCount: receipt.candidates.length, receiptSha256: receipt.receiptSha256 }, null, 2));
} else {
  assert(!existsSync(blockedPath), "v591-naif-comet-dsk-terminal-block-exists");
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": "Orbit-Atlas-v591-tempel-1-naif-metadata/1.0" },
      signal: AbortSignal.timeout(60_000),
    });
    assert(response.status === 200 && response.url === url && !response.headers.get("location"), `v591-naif-comet-dsk-http:${response.status}:${response.url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const html = bytes.toString("utf8");
    const candidates = [...html.matchAll(/href=["']([^"']+)["']/gi)]
      .map((match) => match[1])
      .filter((href) => /tempel|deep.?impact|9p/i.test(href))
      .map((href) => ({ href, resolvedUrl: new URL(href, url).href }));
    const receipt = writeSealed(outputPath, {
      version: "v591-tempel-1-naif-comet-dsk-metadata-v1",
      probedAt: new Date().toISOString(),
      status: candidates.length > 0 ? "metadata-candidates-present-no-payload" : "metadata-complete-no-tempel-1-candidate",
      target: "tempel-1",
      archive: "NASA/JPL NAIF generic kernels DSK comets",
      request: { url, finalUrl: response.url, status: response.status, bytes: bytes.length, sha256: sha256(bytes), count: 1 },
      candidates,
      payloadDownloaded: false,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      license: { id: "NASA-JPL-public-data", url: "https://naif.jpl.nasa.gov/naif/rules.html" },
    });
    console.log(JSON.stringify({ status: receipt.status, candidates, receiptSha256: receipt.receiptSha256 }, null, 2));
  } catch (error) {
    const blocked = writeSealed(blockedPath, {
      version: "v591-tempel-1-naif-comet-dsk-metadata-blocked-v1",
      failedAt: new Date().toISOString(),
      status: "blocked-no-automatic-retry",
      target: "tempel-1",
      url,
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

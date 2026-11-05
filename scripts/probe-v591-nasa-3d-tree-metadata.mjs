import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v591/metadata-probe-nasa-3d-tree.json");
const sourceUrl = "https://api.github.com/repos/nasa/NASA-3D-Resources/git/trees/master?recursive=1";
const allowedHost = "api.github.com";
const capturedResponsePath = process.env.ATLAS_V591_NASA_TREE_RESPONSE_PATH
  ? resolve(root, process.env.ATLAS_V591_NASA_TREE_RESPONSE_PATH)
  : null;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function atomicWrite(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}

const parsed = new URL(sourceUrl);
if (parsed.protocol !== "https:" || parsed.hostname !== allowedHost || parsed.username || parsed.password || parsed.port) {
  throw new Error("v591-nasa-3d-tree-url-policy");
}
let bytes;
let responseMeta;
if (capturedResponsePath) {
  bytes = readFileSync(capturedResponsePath);
  responseMeta = { status: 200, url: sourceUrl, contentType: "application/json", capture: "system-http-single-request" };
} else {
  const response = await fetch(parsed, {
    redirect: "manual",
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "Orbit-Atlas-v591-NASA-3D-metadata-probe/1.0",
    },
    signal: AbortSignal.timeout(60_000),
  });
  bytes = Buffer.from(await response.arrayBuffer());
  if (response.status !== 200 || response.url !== sourceUrl || response.headers.get("location")) {
    throw new Error(`v591-nasa-3d-tree-http:${response.status}:${response.url}`);
  }
  responseMeta = { status: response.status, url: response.url, contentType: response.headers.get("content-type")?.split(";")[0] ?? "unreported", capture: "node-fetch-single-request" };
}
const tree = JSON.parse(bytes.toString("utf8"));
if (tree.truncated !== false || !Array.isArray(tree.tree)) throw new Error("v591-nasa-3d-tree-payload");
const targets = ["ceres", "eros", "kleopatra", "tempel-1"];
const patterns = {
  ceres: /(?:^|\/)(?:dwarf planet )?ceres(?:\/|\.|$)/i,
  eros: /(?:^|\/)asteroid 433 eros(?:\/|\.|$)/i,
  kleopatra: /(?:^|\/)asteroid 216 kleopatra(?:\/|\.|$)/i,
  "tempel-1": /(?:^|\/)(?:comet )?tempel ?1(?:\/|\.|$)/i,
};
const candidates = Object.fromEntries(targets.map((body) => [
  body,
  tree.tree
    .filter((entry) => entry.type === "blob" && patterns[body].test(entry.path))
    .map((entry) => ({ path: entry.path, bytes: entry.size, gitBlobSha1: entry.sha, apiUrl: entry.url })),
]));
const unsigned = {
  version: "v591-nasa-3d-tree-metadata-probe-v1",
  probedAt: new Date().toISOString(),
  status: "metadata-probe-complete-no-model-payload",
  policy: {
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    payloadDownloaded: false,
    redirectPolicy: "manual-no-redirect-accepted",
  },
  provenance: {
    archive: "NASA 3D Resources official GitHub mirror",
    repository: "https://github.com/nasa/NASA-3D-Resources",
    license: {
      id: "NASA-public-domain",
      url: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
    },
  },
  metadataRequest: {
    url: sourceUrl,
    finalUrl: responseMeta.url,
    status: responseMeta.status,
    contentType: responseMeta.contentType,
    capture: responseMeta.capture,
    responseBytes: bytes.byteLength,
    responseSha256: sha256(bytes),
    treeTruncated: false,
  },
  candidates,
  admissionSummary: Object.fromEntries(targets.map((body) => [
    body,
    candidates[body].length > 0 ? "official-model-metadata-present" : "asset-blocked-no-official-model-in-tree",
  ])),
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(outputPath, receipt);
console.log(JSON.stringify({
  status: receipt.status,
  candidates: Object.fromEntries(targets.map((body) => [body, candidates[body].length])),
  receiptSha256: receipt.receiptSha256,
}, null, 2));

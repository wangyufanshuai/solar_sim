import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const sourcePath = "docs/release/v592/acquisition-receipt-major-moon-usgs-labels-v592.json";
const outputPath = "docs/release/v592/major-moon-usgs-redirect-admission-v592.json";
const exactRedirectHost = "asc-pds-services.s3.us-west-2.amazonaws.com";
const expectedTargets = ["io", "europa", "ganymede", "callisto"];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, text) {
  const absolute = resolve(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  const partial = `${absolute}.part`;
  writeFileSync(partial, text, { flag: "wx" });
  rmSync(absolute, { force: true });
  renameSync(partial, absolute);
}

const sourceBytes = readFileSync(resolve(root, sourcePath));
const source = JSON.parse(sourceBytes.toString("utf8"));
const sourceUnsigned = { ...source };
delete sourceUnsigned.receiptSha256;
assert(source.receiptSha256 === canonicalSha(sourceUnsigned), "v592-usgs-redirect-source-seal");
assert(source.status === "partial-label-metadata-with-terminal-failures-no-retry", "v592-usgs-redirect-source-status");
assert(source.assets.length === 0 && source.failures.length === 4, "v592-usgs-redirect-source-count");
assert(source.requestedUrls.length === 4, "v592-usgs-redirect-original-request-count");

const redirects = source.failures.map((failure) => {
  assert(expectedTargets.includes(failure.target), `v592-usgs-redirect-target:${failure.target}`);
  assert(failure.requestCount === 1 && source.requestedUrls.includes(failure.sourceUrl), `v592-usgs-redirect-request-ledger:${failure.target}`);
  const sourceUrl = new URL(failure.sourceUrl);
  const redirectUrl = new URL(failure.redirectUrl);
  assert(sourceUrl.protocol === "https:" && sourceUrl.hostname === "planetarymaps.usgs.gov", `v592-usgs-redirect-source-host:${failure.target}`);
  assert(redirectUrl.protocol === "https:" && redirectUrl.hostname === exactRedirectHost, `v592-usgs-redirect-exact-host:${failure.target}`);
  assert(sourceUrl.pathname === redirectUrl.pathname, `v592-usgs-redirect-path-identity:${failure.target}`);
  assert(redirectUrl.pathname.endsWith(".lbl"), `v592-usgs-redirect-label-role:${failure.target}`);
  assert(!source.requestedUrls.includes(failure.redirectUrl), `v592-usgs-redirect-final-already-requested:${failure.target}`);
  return {
    target: failure.target,
    sourceUrl: failure.sourceUrl,
    redirectUrl: failure.redirectUrl,
    sourceRequestCount: 1,
    redirectRequestCountBeforeAdmission: 0,
    provenance: "exact Location header returned by single-request planetarymaps.usgs.gov response",
  };
});
assert(new Set(redirects.map((entry) => entry.target)).size === 4, "v592-usgs-redirect-unique-targets");

const body = {
  version: "v592-major-moon-usgs-exact-redirect-admission-v1",
  generatedAt: "2026-08-20T06:20:00Z",
  status: "admitted-exact-usgs-pds-s3-host-for-four-label-metadata-requests",
  source: { path: sourcePath, bytes: sourceBytes.byteLength, sha256: sha256(sourceBytes), receiptSha256: source.receiptSha256 },
  exactRedirectHost,
  redirects,
  admission: {
    targetCount: 4,
    originalUrlRequestsComplete: 4,
    finalRedirectUrlRequestsBeforeAdmission: 0,
    labelMetadataRequestsAuthorized: 4,
    visualPayloadRequestsAuthorized: 0,
    broaderAmazonAwsHostAdmission: false,
    exactHostOnly: true,
  },
  policy: {
    provenanceDerivedFromUsgs302LocationHeader: true,
    requestCountPerUrl: 1,
    automaticRetryAllowed: false,
    automaticReplacementAllowed: false,
    labelMetadataOnly: true,
    visualAssetAdmissionGranted: false,
    scientificAuthorityGranted: false,
  },
};
const receipt = { ...body, receiptSha256: canonicalSha(body) };
atomicWrite(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ status: receipt.status, targetCount: redirects.length, exactRedirectHost, receiptSha256: receipt.receiptSha256 }, null, 2));

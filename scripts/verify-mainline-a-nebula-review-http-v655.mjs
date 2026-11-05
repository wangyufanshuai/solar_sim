import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "http://127.0.0.1:3097";
const BUILD = "docs/release/v607/mainline-a-r68-build-20261012v655review03.json";
const MANIFEST = "app/data/mainlineANebulaCandidateReviewV655.generated.json";
const OUTPUT = "docs/release/v607/mainline-a-r68-v655-http-20261012v655review03.json";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const assert = (condition, code) => {
  if (!condition) throw new Error(`review-http-v655:${code}`);
};

async function request(route, options = {}) {
  const started = performance.now();
  const response = await fetch(new URL(route, ORIGIN), {
    redirect: "manual", signal: AbortSignal.timeout(20_000),
    ...options,
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { route, status: response.status,
    contentType: response.headers.get("content-type"),
    contentLength: response.headers.get("content-length"),
    cacheControl: response.headers.get("cache-control"),
    shaHeader: response.headers.get("x-artifact-sha256"),
    rawShaHeader: response.headers.get("x-candidate-raw-sha256"),
    rights: response.headers.get("x-mainline-a-rights"),
    review: response.headers.get("x-mainline-a-review-only"),
    scientificWriteback: response.headers.get("x-scientific-payload-writeback"),
    finalUrl: response.url, bytes: bytes.byteLength,
    sha256: hash(bytes), elapsedMs: performance.now() - started,
    body: bytes };
}

const [build, pack] = await Promise.all([
  readFile(path.join(ROOT, BUILD), "utf8").then(JSON.parse),
  readFile(path.join(ROOT, MANIFEST), "utf8").then(JSON.parse),
]);
assert(build.status === "passed" && build.sourceStable === true
  && build.exitCode === 0 && build.round === 68,
"production-build-not-passed");
assert(pack.rows?.length === 12
  && pack.counts?.rightsSigned === 0
  && pack.boundary?.scientificPayloadWriteback === false,
"candidate-manifest-invalid");
const home = await request("/");
const html = home.body.toString("utf8");
assert(home.status === 200 && html.includes(build.buildId),
"home-build-identity-invalid");
const health = await request("/api/health");
assert(health.status === 200
  && JSON.parse(health.body.toString("utf8")).status === "ok",
"health-invalid");

const records = [];
for (const row of pack.rows) {
  const variants = ["thumb", "detail", "raw"];
  const observed = await Promise.all(variants.map(async (variant) => {
    const pin = variant === "raw" ? row.candidateRaw
      : row.preview[variant];
    const mime = variant === "raw" ? "image/jpeg" : "image/webp";
    const route = `/api/atlas/mainline-a-nebula-review/${row.id}/${variant}`;
    const answer = await request(route);
    const local = await readFile(path.join(ROOT, pin.path));
    assert(answer.status === 200
      && answer.finalUrl === `${ORIGIN}${route}`
      && answer.contentType === mime
      && answer.contentLength === String(pin.bytes)
      && answer.bytes === pin.bytes
      && answer.sha256 === pin.sha256
      && answer.sha256 === hash(local)
      && answer.shaHeader === pin.sha256
      && answer.rawShaHeader === row.candidateRaw.sha256
      && answer.rights === "pending"
      && answer.review === "candidate-hold"
      && answer.scientificWriteback === "false"
      && answer.cacheControl?.includes("no-store"),
    `${row.id}:${variant}:served-byte-or-boundary-mismatch`);
    return { variant, route, status: answer.status,
      bytes: answer.bytes, sha256: answer.sha256,
      elapsedMs: answer.elapsedMs, mimeType: answer.contentType };
  }));
  records.push({ id: row.id, batchId: row.batchId,
    sourcePageUrl: row.sourcePageUrl,
    variants: observed });
  console.log(JSON.stringify({ stage: "local-candidate-image-http",
    id: row.id, matched: observed.length }));
}
const unknown = await request(
  "/api/atlas/mainline-a-nebula-review/unknown-nebula/thumb");
assert(unknown.status === 404
  && !unknown.body.toString("utf8").includes("docs/release"),
"unknown-candidate-must-fail-closed");
const foreignOrigin = await request(
  `/api/atlas/mainline-a-nebula-review/${pack.rows[0].id}/thumb`,
  { headers: { origin: "https://example.invalid" } });
assert(foreignOrigin.status === 404,
"foreign-origin-must-fail-closed");

const report = { schema: "mainline-a-r68-nebula-review-http-v655",
  status: "passed-local-http", observedAt: new Date().toISOString(),
  origin: ORIGIN, buildReceipt: BUILD, manifestPath: MANIFEST,
  manifestSha256: hash(await readFile(path.join(ROOT, MANIFEST))),
  buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
  sourceSha256: build.inputBefore.sha256,
  home: { status: home.status, bytes: home.bytes,
    sha256: home.sha256 },
  health: { status: health.status, bytes: health.bytes,
    sha256: health.sha256 },
  imageRoutes: records,
  counts: { candidates: records.length,
    candidateRawMatched: records.length,
    derivedPreviewsMatched: records.length * 2,
    responsesMatched: records.length * 3,
    negativeRoutesRejected: 2,
    rightsSigned: 0 },
  claims: { realUserValidation: false,
    productionPerformance: false, copyrightApproval: false,
    scientificValidity: false, publicWebReleaseApproved: false } };
await writeFile(path.join(ROOT, OUTPUT),
  `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify({ status: report.status,
  buildId: report.buildId, counts: report.counts,
  output: OUTPUT }, null, 2));

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD_PATH = "docs/release/v607/mainline-a-r70-build-20261012v657web02.json";
const REVIEW_PATH = "app/data/mainlineANebulaCandidateReviewV655.generated.json";
const SKY_PATH = "app/data/mainlineAWebSkyAtlasV656.generated.json";
const OUTPUT = "docs/release/v607/mainline-a-r70-v657-http-20261012v657web02.json";
const ENABLED = "http://127.0.0.1:3101";
const DISABLED = "http://127.0.0.1:3102";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function fail(code) { throw new Error(`r70-http-v657:${code}`); }
function check(condition, code) { if (!condition) fail(code); }

export function verifyR70BuildIdentityV657(build, sourceSha256) {
  const issues = [];
  if (build?.status !== "passed" || build?.exitCode !== 0
    || build?.sourceStable !== true || build?.round !== 70)
    issues.push("build-not-passed");
  if (!/^[a-f0-9]{64}$/.test(sourceSha256)
    || build?.inputBefore?.sha256 !== sourceSha256
    || build?.inputAfterSha256 !== sourceSha256
    || build?.runtimeBuildId !== `mainline-a-${sourceSha256.slice(0, 16)}`)
    issues.push("source-identity-drift");
  if (!build?.buildId || !build?.distDir?.includes("r70-20261012v657web02"))
    issues.push("build-slot-drift");
  return Object.freeze({ ok: issues.length === 0, issues });
}

export function verifyR70ImageResponseV657(row, variant, answer, localBytes) {
  const pin = variant === "raw" ? row?.candidateRaw : row?.preview?.[variant];
  const mime = variant === "raw" ? "image/jpeg" : "image/webp";
  const expectedRoute = `/api/atlas/mainline-a-nebula-review/${row?.id}/${variant}`;
  const issues = [];
  if (!pin || !/^[a-f0-9]{64}$/.test(pin.sha256)
    || pin.bytes < 100 || hash(localBytes) !== pin.sha256
    || localBytes.length !== pin.bytes)
    issues.push("local-pin-mismatch");
  if (answer?.status !== 200 || answer.route !== expectedRoute
    || answer.finalUrl !== `${ENABLED}${expectedRoute}`
    || answer.contentType !== mime
    || answer.bytes !== pin?.bytes || answer.sha256 !== pin?.sha256
    || answer.contentLength !== String(pin?.bytes))
    issues.push("http-image-byte-mismatch");
  if (answer?.shaHeader !== pin?.sha256
    || answer.rawShaHeader !== row?.candidateRaw?.sha256
    || answer.rights !== "pending"
    || answer.review !== "candidate-hold"
    || answer.writeback !== "false"
    || !answer.cacheControl?.includes("no-store"))
    issues.push("http-boundary-header-mismatch");
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), route: expectedRoute,
    sha256: answer?.sha256 ?? null });
}

async function request(origin, route, options = {}) {
  const started = performance.now();
  const response = await fetch(new URL(route, origin), {
    redirect: "manual", signal: AbortSignal.timeout(30_000), ...options,
  });
  const body = Buffer.from(await response.arrayBuffer());
  return Object.freeze({ route, status: response.status,
    finalUrl: response.url, contentType: response.headers.get("content-type"),
    contentLength: response.headers.get("content-length"),
    cacheControl: response.headers.get("cache-control"),
    shaHeader: response.headers.get("x-artifact-sha256"),
    rawShaHeader: response.headers.get("x-candidate-raw-sha256"),
    rights: response.headers.get("x-mainline-a-rights"),
    review: response.headers.get("x-mainline-a-review-only"),
    writeback: response.headers.get("x-scientific-payload-writeback"),
    bytes: body.length, sha256: hash(body), body,
    elapsedMs: performance.now() - started });
}

export async function captureR70HttpV657() {
  const [build, review, sky, source] = await Promise.all([
    readFile(path.join(ROOT, BUILD_PATH), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, REVIEW_PATH), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, SKY_PATH), "utf8").then(JSON.parse),
    captureBuildInputs(),
  ]);
  const buildCheck = verifyR70BuildIdentityV657(build, source.sha256);
  check(buildCheck.ok, `build:${buildCheck.issues.join(",")}`);
  check(review.rows?.length === 12 && review.counts?.rightsSigned === 0
    && review.boundary?.scientificPayloadWriteback === false,
  "review-manifest-invalid");
  check(sky.stars?.length === 24 && sky.constellations?.length === 12
    && sky.boundary?.scientificPayloadWriteback === false,
  "sky-manifest-invalid");

  const home = await request(ENABLED, "/");
  check(home.status === 200 && home.body.toString("utf8")
    .includes(build.buildId), "home-build-id");
  const health = await request(ENABLED, "/api/health");
  check(health.status === 200 && JSON.parse(health.body.toString("utf8"))
    .status === "ok", "health");
  const skyHttp = await request(ENABLED, "/api/atlas/mainline-a-web-sky");
  const skyBody = Buffer.from(JSON.stringify(sky));
  check(skyHttp.status === 200 && skyHttp.bytes === skyBody.length
    && skyHttp.sha256 === hash(skyBody)
    && skyHttp.cacheControl?.includes("no-store")
    && skyHttp.writeback === "false", "sky-http-drift");

  const imageRecords = [];
  for (const row of review.rows) {
    const variants = [];
    for (const variant of ["thumb", "detail", "raw"]) {
      const pin = variant === "raw" ? row.candidateRaw : row.preview[variant];
      const route = `/api/atlas/mainline-a-nebula-review/${row.id}/${variant}`;
      const [answer, localBytes] = await Promise.all([
        request(ENABLED, route), readFile(path.join(ROOT, pin.path)),
      ]);
      const verified = verifyR70ImageResponseV657(row, variant,
        answer, localBytes);
      check(verified.ok, `${row.id}:${variant}:${verified.issues.join(",")}`);
      variants.push({ variant, route, bytes: answer.bytes,
        sha256: answer.sha256, elapsedMs: answer.elapsedMs,
        sourcePinSha256: pin.sha256 });
    }
    imageRecords.push({ id: row.id, batchId: row.batchId,
      nasaId: row.nasaId, sourcePageUrl: row.sourcePageUrl,
      rightsStatus: row.rightsStatus, variants });
    console.log(JSON.stringify({ stage: "verified-candidate-image-routes",
      id: row.id, routes: variants.length }));
  }
  const unknown = await request(ENABLED,
    "/api/atlas/mainline-a-nebula-review/unknown-nebula/thumb");
  const foreign = await request(ENABLED,
    `/api/atlas/mainline-a-nebula-review/${review.rows[0].id}/thumb`,
    { headers: { origin: "https://example.invalid" } });
  const disabled = await request(DISABLED,
    `/api/atlas/mainline-a-nebula-review/${review.rows[0].id}/thumb`);
  check(unknown.status === 404 && foreign.status === 404
    && disabled.status === 404, "negative-route-leak");
  const after = await captureBuildInputs();
  check(after.sha256 === source.sha256, "source-changed-during-http");
  return Object.freeze({ schema: "mainline-a-r70-web-http-v657",
    status: "passed-local-http-current-build", buildReceipt: BUILD_PATH,
    buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
    sourceSha256: source.sha256, enabledOrigin: ENABLED,
    disabledOrigin: DISABLED,
    home: { status: home.status, bytes: home.bytes },
    health: { status: health.status },
    sky: { status: skyHttp.status, bytes: skyHttp.bytes,
      sha256: skyHttp.sha256 },
    imageRecords, counts: { candidates: 12,
      servedCandidateVariants: imageRecords.reduce((total, row) =>
        total + row.variants.length, 0),
      servedCandidateShaMatches: 36 },
    negative: { unknownStatus: unknown.status,
      foreignOriginStatus: foreign.status,
      defaultDisabledStatus: disabled.status },
    claims: { externalSourceCapture: false, copyrightApproval: false,
      scientificValidity: false, productionPerformance: false,
      publicWebReleaseApproved: false } });
}

if (process.argv[1] && path.resolve(process.argv[1]) ===
    fileURLToPath(import.meta.url)) {
  const report = await captureR70HttpV657();
  await writeFile(path.join(ROOT, OUTPUT),
    `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: report.status, buildId: report.buildId,
    imageRoutes: report.counts.servedCandidateVariants,
    output: OUTPUT }, null, 2));
}

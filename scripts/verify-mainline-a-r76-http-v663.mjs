import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { R76_OUTPUT_V663, safePathR76V663 } from
  "./build-mainline-a-r76-readiness-v663.mjs";
import { inspectR76ReadinessShapeV663 } from
  "./verify-mainline-a-r76-readiness-v663.mjs";

const PREVIOUS_MATRIX_PATH =
  "docs/release/v607/mainline-a-r75-v662-matrix-20261013v662r75web02.json";
const PREVIOUS_MATRIX_SHA256 =
  "1bdd94664b755c72125c003710d67904bbce997c2e45a487748731edcbd606ce";

function check(value, code, detail) {
  if (!value) throw new Error(`r76-http:${code}${detail
    ? `:${JSON.stringify(detail)}` : ""}`);
}
export function parseR76HttpOptionsV663(argv) {
  check([4, 6].includes(argv.length) && argv[0] === "--run-id"
    && argv[2] === "--port"
    && (argv.length === 4 || argv[4] === "--build-run-id"),
  "usage");
  const port = Number(argv[3]);
  const buildRunId = argv[5] ?? argv[1];
  check(/^20261013v663r76web0[1-9]$/.test(argv[1])
    && /^20261013v663r76web0[1-9]$/.test(buildRunId)
    && Number.isInteger(port) && port >= 1024 && port <= 65535,
  "run-id-or-port");
  return { runId: argv[1], buildRunId,
    origin: `http://127.0.0.1:${port}` };
}
async function get(url) {
  const response = await fetch(url, { redirect: "manual",
    cache: "no-store", signal: AbortSignal.timeout(20_000) });
  const body = Buffer.from(await response.arrayBuffer());
  let json = null;
  try { json = JSON.parse(body.toString("utf8")); }
  catch { /* Non-JSON pages remain HTTP observations only. */ }
  return { status: response.status, finalUrl: response.url,
    contentType: response.headers.get("content-type"),
    candidateOnly: response.headers.get("x-mainline-a-candidate-only"),
    admission: response.headers.get("x-mainline-a-release-admission"),
    writeback: response.headers.get("x-scientific-payload-writeback"),
    bytes: body.length, json };
}
export function verifyR76HttpV663(snapshot, observation, origin,
  reviewRoutes) {
  const issues = [...inspectR76ReadinessShapeV663(snapshot).issues];
  const state = observation?.readiness;
  if (observation?.home?.status !== 200
    || observation?.health?.status !== 200
    || state?.status !== 200
    || state.finalUrl !== `${origin}/api/atlas/mainline-a-web-readiness`
    || !state.contentType?.startsWith("application/json")
    || state.candidateOnly !== "true"
    || state.admission !== "hold"
    || state.writeback !== "false") {
    issues.push("http-route-or-boundary-invalid");
  }
  const body = state?.json;
  if (body?.schema !== "mainline-a-r76-web-readiness-http-v663"
    || body.status !== "candidate-hold"
    || body.sourceFingerprint !== snapshot?.fingerprint
    || body.publicWebReleaseAllowed !== false
    || body.scientificPayloadWriteback !== false
    || body.gates?.length !== 6
    || body.items?.length !== 9
    || body.items.some((item) => item.runtimeAdmission !== "candidate-only"
      || item.rightsSigned !== false || item.requestExecuted !== false)
    || body.claims?.publicWebReleaseApproved !== false
    || JSON.stringify(body).includes("rawArtifact")) {
    issues.push("http-payload-promoted-or-leaked");
  }
  const expectedHeld = snapshot?.nebulae?.map((row) => row.id) ?? [];
  if (observation?.heldImages?.length !== 5
    || expectedHeld.some((id) => !observation.heldImages.some((item) =>
      item.id === id && item.status === 404
      && item.finalUrl === `${origin}/api/atlas/mainline-a-nebula-review/${id}/detail`))) {
    issues.push("held-image-routes-exposed");
  }
  if (!Array.isArray(reviewRoutes) || reviewRoutes.length !== 19
    || new Set(reviewRoutes.map((row) => row.id)).size !== 19
    || observation?.reviewDefaultOff?.length !== 19
    || reviewRoutes.some((row) => !observation.reviewDefaultOff.some(
      (item) => item.id === row.id && item.status === 404
        && item.finalUrl === origin + row.route))) {
    issues.push("review-default-off-routes-exposed");
  }
  return { ok: issues.length === 0, issues,
    items: body?.items?.length ?? 0,
    gates: body?.gates?.length ?? 0,
    heldImagesDenied: expectedHeld.length,
    reviewImagesDefaultOff: reviewRoutes?.length ?? 0 };
}
export async function runR76HttpV663(config) {
  const buildPath =
    `docs/release/v607/mainline-a-r76-build-${config.buildRunId}.json`;
  const [build, snapshot, previousMatrixBytes, source] = await Promise.all([
    readFile(safePathR76V663(buildPath), "utf8").then(JSON.parse),
    readFile(safePathR76V663(R76_OUTPUT_V663), "utf8")
      .then(JSON.parse),
    readFile(safePathR76V663(PREVIOUS_MATRIX_PATH)),
    captureBuildInputs(),
  ]);
  const previousMatrix = JSON.parse(previousMatrixBytes.toString("utf8"));
  const previousMatrixSha256 = createHash("sha256")
    .update(previousMatrixBytes).digest("hex");
  check(build.status === "passed" && build.sourceStable
    && build.inputAfterSha256 === source.sha256
    && previousMatrixSha256 === PREVIOUS_MATRIX_SHA256
    && previousMatrix.schema === "mainline-a-r75-web-acceptance-matrix-v662"
    && previousMatrix.status === "verified-static-candidate-hold"
    && previousMatrix.rows?.length === 96
    && previousMatrix.boundary?.scientificPayloadWriteback === false,
  "build-source-identity");
  const startedAt = new Date().toISOString();
  const home = await get(config.origin);
  const health = await get(`${config.origin}/api/health`);
  const readiness = await get(`${config.origin}/api/atlas/mainline-a-web-readiness`);
  const heldImages = [];
  for (const row of snapshot.nebulae) {
    const route = `/api/atlas/mainline-a-nebula-review/${row.id}/detail`;
    heldImages.push({ id: row.id, ...await get(config.origin + route) });
  }
  const reviewRoutes = previousMatrix.rows.filter((row) =>
    row.group === "beta-nebula" && row.imageRoute)
    .map((row) => ({ id: row.id, route: row.imageRoute }));
  const reviewDefaultOff = [];
  for (const row of reviewRoutes) {
    reviewDefaultOff.push({ id: row.id,
      ...await get(config.origin + row.route) });
  }
  const observations = { home, health, readiness, heldImages,
    reviewDefaultOff };
  const verification = verifyR76HttpV663(snapshot,
    observations, config.origin, reviewRoutes);
  check(verification.ok, "http-verification-failed",
    verification.issues);
  check((await captureBuildInputs()).sha256 === source.sha256,
    "source-changed-during-http");
  const output = `docs/release/v607/mainline-a-r76-v663-http-${config.runId}.json`;
  const receipt = { schema: "mainline-a-r76-http-v663",
    status: "passed-local-production-build-candidate-hold",
    startedAt, endedAt: new Date().toISOString(),
    origin: config.origin, buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId,
    appSourceSha256: source.sha256,
    buildReceipt: buildPath, observations,
    previousCandidateRouteMap: {
      path: PREVIOUS_MATRIX_PATH,
      bytes: previousMatrixBytes.length,
      sha256: previousMatrixSha256,
      evidenceClass: "historical-static-route-reference",
    },
    verification,
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false },
    claims: { copyrightApproval: false, scientificValidity: false,
      productionPerformance: false, realUserValidation: false,
      publicWebReleaseApproved: false } };
  await writeFile(safePathR76V663(output),
    `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  return { status: receipt.status, verification, output };
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR76HttpV663(
    parseR76HttpOptionsV663(process.argv.slice(2)))));
}

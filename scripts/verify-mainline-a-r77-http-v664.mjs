import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { inspectR77FreezeV664 } from
  "./verify-mainline-a-r77-web-freeze-v664.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes)
  .digest("hex");
function check(value, code, detail) {
  if (!value) throw new Error("r77-http:" + code
    + (detail ? ":" + JSON.stringify(detail) : ""));
}
export function parseR77HttpOptionsV664(argv) {
  check(argv.length === 10 && argv[0] === "--run-id"
    && argv[2] === "--port"
    && argv[4] === "--build-run-id"
    && argv[6] === "--freeze-run-id"
    && argv[8] === "--mode", "usage");
  const port = Number(argv[3]);
  check(/^20261013v664r77web0[1-9]$/.test(argv[1])
    && /^20261013v664r77web0[1-9]$/.test(argv[5])
    && /^20261013v664r77freeze0[1-9]$/.test(argv[7])
    && ["enabled", "default-off"].includes(argv[9])
    && Number.isInteger(port) && port >= 1024 && port <= 65535,
  "run-id-port-or-mode");
  return { runId: argv[1], buildRunId: argv[5],
    freezeRunId: argv[7], mode: argv[9],
    origin: "http://127.0.0.1:" + port };
}
async function read(relative) {
  return JSON.parse(await readFile(safeWorkspacePathV662(relative),
    "utf8"));
}
async function request(url, init = {}) {
  const response = await fetch(url, {
    redirect: "manual", cache: "no-store",
    signal: AbortSignal.timeout(20_000), ...init });
  const body = Buffer.from(await response.arrayBuffer());
  let json = null;
  if (response.headers.get("content-type")?.startsWith(
    "application/json")) {
    try { json = JSON.parse(body.toString("utf8")); }
    catch { json = null; }
  }
  return { status: response.status, finalUrl: response.url,
    contentType: response.headers.get("content-type"),
    bytes: body.length, sha256: sha256(body),
    artifactSha256: response.headers.get("x-artifact-sha256"),
    reviewBoundary: response.headers.get(
      "x-mainline-a-review-only"),
    rights: response.headers.get("x-mainline-a-rights"),
    candidateOnly: response.headers.get(
      "x-mainline-a-candidate-only"),
    releaseAdmission: response.headers.get(
      "x-mainline-a-release-admission"),
    admission: response.headers.get("x-mainline-a-admission"),
    writeback: response.headers.get(
      "x-scientific-payload-writeback"),
    json };
}
function betaRoutes(freeze) {
  return freeze.matrixRows.filter((row) =>
    row.group === "beta-nebula");
}
function aNebulaAssets(freeze) {
  return freeze.matrixRows.filter((row) =>
    row.group === "a-nebula");
}
export function verifyR77HttpV664(freeze, observations,
  origin, mode) {
  const issues = [...inspectR77FreezeV664(freeze).issues];
  if (!["enabled", "default-off"].includes(mode)) {
    issues.push("mode-invalid");
  }
  const readiness = observations?.readiness;
  if (observations?.home?.status !== 200
    || observations?.health?.status !== 200
    || observations?.webSky?.status !== 200
    || observations.webSky.candidateOnly !== "true"
    || observations.webSky.admission !== "hold"
    || observations.webSky.writeback !== "false"
    || readiness?.status !== 200
    || readiness.releaseAdmission !== "hold"
    || readiness.candidateOnly !== "true"
    || readiness.writeback !== "false"
    || readiness.json?.items?.length !== 9
    || readiness.json?.gates?.length !== 6
    || readiness.json?.publicWebReleaseAllowed !== false
    || readiness.json?.scientificPayloadWriteback !== false) {
    issues.push("home-health-or-gate-route");
  }
  const aAssets = aNebulaAssets(freeze);
  if (aAssets.length !== 12
    || observations?.aAssets?.length !== 12
    || aAssets.some((row) => !observations.aAssets.some(
      (item) => item.id === row.id && item.status === 200
        && item.sha256 === row.imageSha256))) {
    issues.push("canonical-a-image-http");
  }
  const beta = betaRoutes(freeze);
  const review = beta.filter((row) => row.imageRoute);
  const held = beta.filter((row) => !row.imageRoute);
  if (review.length !== 19
    || observations?.reviewImages?.length !== 19
    || review.some((row) => !observations.reviewImages.some(
      (item) => item.id === row.id
        && item.finalUrl === origin + row.imageRoute
        && (mode === "enabled"
          ? item.status === 200
            && item.sha256 === row.imageSha256
            && item.artifactSha256 === row.imageSha256
            && item.reviewBoundary === "candidate-hold"
            && item.rights === "pending"
            && item.writeback === "false"
          : item.status === 404)))) {
    issues.push("candidate-review-image-http");
  }
  if (held.length !== 5
    || observations?.heldImages?.length !== 5
    || held.some((row) => !observations.heldImages.some(
      (item) => item.id === row.id && item.status === 404
        && item.finalUrl === origin
          + "/api/atlas/mainline-a-nebula-review/"
          + row.id + "/detail"))) {
    issues.push("held-nebula-route-exposed");
  }
  if (observations?.invalidReview?.status !== 404
    || (mode === "enabled"
      && observations?.foreignOrigin?.status !== 404)) {
    issues.push("negative-route-exposed");
  }
  return { ok: issues.length === 0, issues,
    aAssets: aAssets.length,
    reviewImages: review.length,
    heldImages: held.length,
    readinessItems: readiness?.json?.items?.length ?? 0,
    mode };
}
export async function runR77HttpV664(config) {
  const buildPath = "docs/release/v607/mainline-a-r77-build-"
    + config.buildRunId + ".json";
  const freezePath = "docs/release/v607/mainline-a-r77-v664-freeze-"
    + config.freezeRunId + ".json";
  const [build, freeze, source] = await Promise.all([
    read(buildPath), read(freezePath), captureBuildInputs(),
  ]);
  check(build.status === "passed" && build.sourceStable
    && build.inputAfterSha256 === source.sha256
    && freeze.appSourceSha256 === source.sha256
    && inspectR77FreezeV664(freeze).ok,
  "build-or-freeze-source-invalid");
  const startedAt = new Date().toISOString();
  const home = await request(config.origin);
  const health = await request(config.origin + "/api/health");
  const webSky = await request(
    config.origin + "/api/atlas/mainline-a-web-sky");
  const readiness = await request(config.origin
    + "/api/atlas/mainline-a-web-readiness");
  const aAssets = [];
  for (const row of aNebulaAssets(freeze)) {
    const route = "/" + row.imageRoute.replace(/^public\//, "");
    aAssets.push({ id: row.id, route,
      ...await request(config.origin + route) });
  }
  const reviewImages = [];
  const heldImages = [];
  for (const row of betaRoutes(freeze)) {
    const route = row.imageRoute
      ?? "/api/atlas/mainline-a-nebula-review/"
        + row.id + "/detail";
    const received = { id: row.id, route,
      ...await request(config.origin + route) };
    if (row.imageRoute) reviewImages.push(received);
    else heldImages.push(received);
  }
  const invalidReview = await request(config.origin
    + "/api/atlas/mainline-a-nebula-review/not-an-object/detail");
  const foreignOrigin = config.mode === "enabled"
    ? await request(config.origin
      + reviewImages[0].route, {
      headers: { Origin: "https://example.invalid" } })
    : null;
  const observations = { home, health, webSky, readiness,
    aAssets, reviewImages, heldImages, invalidReview,
    foreignOrigin };
  const verification = verifyR77HttpV664(freeze,
    observations, config.origin, config.mode);
  check(verification.ok, "http-gates-failed",
    verification.issues);
  check((await captureBuildInputs()).sha256 === source.sha256,
    "source-drift-during-http");
  const output = "docs/release/v607/mainline-a-r77-v664-http-"
    + config.mode + "-" + config.runId + ".json";
  const receipt = {
    schema: "mainline-a-r77-http-v664",
    status: "passed-local-production-build-candidate-hold",
    mode: config.mode, startedAt,
    endedAt: new Date().toISOString(),
    origin: config.origin,
    buildReceipt: buildPath, freezeReceipt: freezePath,
    buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId,
    appSourceSha256: source.sha256,
    freezeFingerprint: freeze.fingerprint,
    observations, verification,
    publicDeployment: "not-run",
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false },
    claims: { scientificValidity: false,
      copyrightApproval: false,
      productionPerformance: false,
      realUserValidation: false,
      publicWebReleaseApproved: false },
  };
  await writeFile(safeWorkspacePathV662(output),
    JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
  return { status: receipt.status, mode: config.mode,
    verification, output };
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR77HttpV664(
    parseR77HttpOptionsV664(process.argv.slice(2)))));
}

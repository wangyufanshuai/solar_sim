import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from "./build-mainline-a-r75-matrix-v662.mjs";
import { verifyR75MatrixShapeV662 } from "./verify-mainline-a-r75-matrix-v662.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function check(value, code, detail) {
  if (!value) throw new Error(`r75-http:${code}${detail ? `:${detail}` : ""}`);
}
export function parseHttpOptionsV662(argv) {
  check(argv.length === 4 && argv[0] === "--run-id"
    && argv[2] === "--port", "usage");
  const runId = argv[1];
  const port = Number(argv[3]);
  check(/^20261013v662r75web0[1-9]$/.test(runId)
    && Number.isInteger(port) && port >= 1024 && port <= 65535,
  "run-id-or-port");
  return { runId, origin: `http://127.0.0.1:${port}` };
}
async function request(url, init = {}) {
  const response = await fetch(url, { redirect: "manual", cache: "no-store",
    signal: AbortSignal.timeout(20_000), ...init });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { status: response.status, finalUrl: response.url,
    redirected: response.redirected,
    contentType: response.headers.get("content-type"),
    bytes: bytes.length, sha256: sha(bytes),
    contentLength: response.headers.get("content-length"),
    artifactSha256: response.headers.get("x-artifact-sha256"),
    reviewBoundary: response.headers.get("x-mainline-a-review-only"),
    rights: response.headers.get("x-mainline-a-rights"),
    candidateOnly: response.headers.get("x-mainline-a-candidate-only"),
    admission: response.headers.get("x-mainline-a-admission"),
    writeback: response.headers.get("x-scientific-payload-writeback") };
}
export function verifyHttpMatrixV662(matrix, observations, origin) {
  const issues = [];
  const missing = (code) => issues.push(code);
  if (!verifyR75MatrixShapeV662(matrix).ok) missing("matrix-invalid");
  if (observations?.home?.status !== 200
    || observations?.health?.status !== 200
    || observations?.webSky?.status !== 200
    || observations?.webSky?.candidateOnly !== "true"
    || observations?.webSky?.admission !== "hold"
    || observations?.webSky?.writeback !== "false") {
    missing("home-health-or-web-sky");
  }
  const beta = matrix.rows.filter((row) => row.group === "beta-nebula");
  const review = beta.filter((row) => row.imageRoute);
  const held = beta.filter((row) => !row.imageRoute);
  if (review.length !== 19 || held.length !== 5
    || observations?.reviewImages?.length !== 19
    || observations?.heldImages?.length !== 5) {
    missing("nebula-http-coverage");
  }
  for (const row of review) {
    const received = observations?.reviewImages?.find((item) =>
      item.id === row.id);
    if (!received || received.status !== 200
      || received.finalUrl !== origin + row.imageRoute
      || received.sha256 !== row.imageSha256
      || received.artifactSha256 !== row.imageSha256
      || received.reviewBoundary !== "candidate-hold"
      || received.rights !== "pending"
      || received.writeback !== "false") {
      missing(`review-image:${row.id}`);
    }
  }
  for (const row of held) {
    const received = observations?.heldImages?.find((item) =>
      item.id === row.id);
    if (!received || received.status !== 404
      || received.finalUrl !== `${origin}/api/atlas/mainline-a-nebula-review/${row.id}/detail`) {
      missing(`held-image-served:${row.id}`);
    }
  }
  const aNebulae = matrix.rows.filter((row) => row.group === "a-nebula");
  if (aNebulae.length !== 12 || observations?.aAssets?.length !== 12)
    missing("a-nebula-http-coverage");
  for (const row of aNebulae) {
    const received = observations?.aAssets?.find((item) => item.id === row.id);
    if (!received || received.status !== 200
      || received.sha256 !== row.imageSha256) {
      missing(`a-asset:${row.id}`);
    }
  }
  if (observations?.foreignOrigin?.status !== 404
    || observations?.invalidReview?.status !== 404) {
    missing("negative-routes");
  }
  return { ok: issues.length === 0, issues,
    aAssets: aNebulae.length, reviewImages: review.length,
    heldImages: held.length };
}
export async function runR75HttpV662(config) {
  const buildPath = `docs/release/v607/mainline-a-r75-build-${config.runId}.json`;
  const matrixPath = `docs/release/v607/mainline-a-r75-v662-matrix-${config.runId}.json`;
  const [build, matrix, source] = await Promise.all([
    readFile(safeWorkspacePathV662(buildPath), "utf8").then(JSON.parse),
    readFile(safeWorkspacePathV662(matrixPath), "utf8").then(JSON.parse),
    captureBuildInputs(),
  ]);
  check(build.status === "passed" && build.sourceStable === true
    && build.inputAfterSha256 === source.sha256
    && matrix.appSourceSha256 === source.sha256,
  "build-or-matrix-source-drift");
  check(verifyR75MatrixShapeV662(matrix).ok, "matrix-invalid");
  const startedAt = new Date().toISOString();
  const home = await request(config.origin);
  const health = await request(`${config.origin}/api/health`);
  const webSky = await request(`${config.origin}/api/atlas/mainline-a-web-sky`);
  const aAssets = [];
  for (const row of matrix.rows.filter((item) => item.group === "a-nebula")) {
    const assetUrl = `/${row.imageRoute.replace(/^public\//, "")}`;
    aAssets.push({ id: row.id, url: assetUrl,
      ...await request(config.origin + assetUrl) });
  }
  const reviewImages = [];
  const heldImages = [];
  for (const row of matrix.rows.filter((item) => item.group === "beta-nebula")) {
    if (row.imageRoute) {
      reviewImages.push({ id: row.id, route: row.imageRoute,
        ...await request(config.origin + row.imageRoute) });
    } else {
      const route = `/api/atlas/mainline-a-nebula-review/${row.id}/detail`;
      heldImages.push({ id: row.id, route,
        ...await request(config.origin + route) });
    }
  }
  const sample = matrix.rows.find((row) => row.group === "beta-nebula"
    && row.imageRoute);
  const foreignOrigin = await request(config.origin + sample.imageRoute,
    { headers: { Origin: "https://example.invalid" } });
  const invalidReview = await request(`${config.origin}/api/atlas/mainline-a-nebula-review/not-an-object/detail`);
  const observations = { home, health, webSky, aAssets,
    reviewImages, heldImages, foreignOrigin, invalidReview };
  const verification = verifyHttpMatrixV662(matrix, observations, config.origin);
  const sourceAfter = await captureBuildInputs();
  check(sourceAfter.sha256 === source.sha256, "source-drift-during-http");
  check(verification.ok, "http-boundary-failed", verification.issues.join(","));
  const receipt = { schema: "mainline-a-r75-http-v662",
    status: "passed-local-production-build",
    startedAt, endedAt: new Date().toISOString(),
    origin: config.origin, buildId: build.buildId,
    appSourceSha256: source.sha256,
    buildReceipt: buildPath, matrixReceipt: matrixPath,
    observations, verification,
    physicalMobile: "not-run", publicDeployment: "not-run",
    claims: { productionPerformance: false, realUserValidation: false,
      scientificValidity: false, copyrightApproval: false,
      publicWebReleaseApproved: false,
      scientificPayloadWriteback: false } };
  const output = `docs/release/v607/mainline-a-r75-v662-http-${config.runId}.json`;
  await writeFile(path.join(ROOT, output),
    `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  return { status: receipt.status, output,
    verification: receipt.verification };
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR75HttpV662(
    parseHttpOptionsV662(process.argv.slice(2)))));
}

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from "./build-mainline-a-r75-matrix-v662.mjs";
import { verifyR75MatrixShapeV662 } from
  "./verify-mainline-a-r75-matrix-v662.mjs";

function check(condition, code, detail) {
  if (!condition) throw new Error(`r75-http-disabled:${code}${detail
    ? `:${detail}` : ""}`);
}
export function parseDisabledOptionsV662(argv) {
  check(argv.length === 4 && argv[0] === "--run-id"
    && argv[2] === "--port", "usage");
  const port = Number(argv[3]);
  check(/^20261013v662r75web0[1-9]$/.test(argv[1])
    && Number.isInteger(port) && port >= 1024 && port <= 65535,
  "run-id-or-port");
  return { runId: argv[1], origin: `http://127.0.0.1:${port}` };
}
async function request(url) {
  const response = await fetch(url, { cache: "no-store",
    redirect: "manual", signal: AbortSignal.timeout(20_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { status: response.status, finalUrl: response.url,
    contentType: response.headers.get("content-type"),
    bytes: bytes.length,
    reviewBoundary: response.headers.get("x-mainline-a-review-only"),
    writeback: response.headers.get("x-scientific-payload-writeback") };
}
export function verifyDisabledHttpV662(matrix, receipt, origin) {
  const issues = [];
  if (!verifyR75MatrixShapeV662(matrix).ok)
    issues.push("matrix-invalid");
  if (receipt?.home?.status !== 200
    || receipt?.health?.status !== 200
    || receipt?.webSky?.status !== 200)
    issues.push("non-image-routes-failed");
  const review = matrix.rows.filter((row) => row.group === "beta-nebula"
    && row.imageRoute);
  const held = matrix.rows.filter((row) => row.group === "beta-nebula"
    && !row.imageRoute);
  if (review.length !== 19 || held.length !== 5
    || receipt?.review?.length !== 19
    || receipt?.held?.length !== 5)
    issues.push("image-route-coverage");
  for (const row of review) {
    const received = receipt?.review?.find((entry) => entry.id === row.id);
    if (!received || received.status !== 404
      || received.route !== row.imageRoute
      || received.finalUrl !== origin + row.imageRoute)
      issues.push(`review-image-exposed:${row.id}`);
  }
  for (const row of held) {
    const received = receipt?.held?.find((entry) => entry.id === row.id);
    const route = `/api/atlas/mainline-a-nebula-review/${row.id}/detail`;
    if (!received || received.status !== 404
      || received.route !== route
      || received.finalUrl !== origin + route)
      issues.push(`held-image-exposed:${row.id}`);
  }
  return { ok: issues.length === 0, issues,
    reviewImagesDenied: review.length, heldImagesDenied: held.length };
}
export async function runDisabledHttpV662(config) {
  const buildPath = `docs/release/v607/mainline-a-r75-build-${config.runId}.json`;
  const matrixPath = `docs/release/v607/mainline-a-r75-v662-matrix-${config.runId}.json`;
  const [build, matrix, source] = await Promise.all([
    readFile(safeWorkspacePathV662(buildPath), "utf8").then(JSON.parse),
    readFile(safeWorkspacePathV662(matrixPath), "utf8").then(JSON.parse),
    captureBuildInputs(),
  ]);
  check(build.status === "passed" && build.sourceStable
    && build.inputAfterSha256 === source.sha256
    && matrix.appSourceSha256 === source.sha256,
  "build-source-identity");
  const startedAt = new Date().toISOString();
  const home = await request(config.origin);
  const health = await request(`${config.origin}/api/health`);
  const webSky = await request(`${config.origin}/api/atlas/mainline-a-web-sky`);
  const review = [];
  const held = [];
  for (const row of matrix.rows.filter((item) => item.group === "beta-nebula")) {
    const route = row.imageRoute
      ?? `/api/atlas/mainline-a-nebula-review/${row.id}/detail`;
    const entry = { id: row.id, route,
      ...await request(config.origin + route) };
    if (row.imageRoute) review.push(entry);
    else held.push(entry);
  }
  const observations = { home, health, webSky, review, held };
  const verification = verifyDisabledHttpV662(matrix,
    observations, config.origin);
  check(verification.ok, "image-policy-failed", verification.issues);
  check((await captureBuildInputs()).sha256 === source.sha256,
    "source-drift-during-http");
  const output = `docs/release/v607/mainline-a-r75-v662-http-disabled-${config.runId}.json`;
  const receipt = { schema: "mainline-a-r75-http-disabled-v662",
    status: "passed-default-off-local-production-build",
    startedAt, endedAt: new Date().toISOString(),
    origin: config.origin, buildId: build.buildId,
    appSourceSha256: source.sha256,
    buildReceipt: buildPath, matrixReceipt: matrixPath,
    observations, verification,
    candidateOnly: true, hold: true, notAdmitted: true,
    scientificPayloadWriteback: false,
    publicDeployment: "not-run",
    claims: { copyrightApproval: false, scientificValidity: false,
      productionPerformance: false, realUserValidation: false,
      publicWebReleaseApproved: false } };
  await writeFile(safeWorkspacePathV662(output),
    `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  return { status: receipt.status, verification, output };
}
if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runDisabledHttpV662(
    parseDisabledOptionsV662(process.argv.slice(2)))));
}

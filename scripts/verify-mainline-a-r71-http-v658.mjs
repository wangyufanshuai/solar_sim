import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = "docs/release/v607/mainline-a-r71-build-20261013v658r71web02.json";
const OVERLAY = "app/data/mainlineANebulaR71SourceV658.generated.json";
const OUTPUT = "docs/release/v607/mainline-a-r71-v658-http-20261013v658r71web02.json";
const ENABLED = "http://127.0.0.1:3113";
const DISABLED = "http://127.0.0.1:3114";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function check(value, code) {
  if (!value) throw new Error(`r71-http-v658:${code}`);
}

async function fetchResponse(url, options = {}) {
  const response = await fetch(url, { cache: "no-store",
    redirect: "manual", signal: AbortSignal.timeout(20_000),
    ...options });
  const body = Buffer.from(await response.arrayBuffer());
  return { status: response.status, finalUrl: response.url,
    headers: Object.fromEntries(response.headers), body };
}

async function checkPage(url) {
  const result = await fetchResponse(url);
  check(result.status === 200 && result.body.length > 1_000,
    `page-http:${url}`);
  const text = result.body.toString("utf8");
  check(text.includes("/_next/static/"), `next-static-reference:${url}`);
  return { status: result.status, bytes: result.body.length,
    sha256: sha(result.body), finalUrl: result.finalUrl };
}

async function checkImage(row) {
  const route = `/api/atlas/mainline-a-r71-source/${row.id}/image`;
  const result = await fetchResponse(`${ENABLED}${route}`);
  check(result.status === 200, `${row.id}:image-http`);
  check(result.headers["content-type"] === "image/jpeg"
    && result.headers["x-mainline-a-review-only"] === "candidate-hold"
    && result.headers["x-mainline-a-rights"] === "pending"
    && result.headers["x-scientific-payload-writeback"] === "false"
    && result.headers["x-artifact-sha256"] === row.imageRaw.sha256
    && result.headers["x-nasa-id"] === row.nasaId
    && result.body.length === row.imageRaw.bytes
    && sha(result.body) === row.imageRaw.sha256,
  `${row.id}:image-pin-or-boundary`);
  return { id: row.id, nasaId: row.nasaId, route,
    status: result.status, bytes: result.body.length,
    sha256: sha(result.body), contentType: result.headers["content-type"],
    rights: result.headers["x-mainline-a-rights"],
    candidate: result.headers["x-mainline-a-review-only"],
    scientificPayloadWriteback:
      result.headers["x-scientific-payload-writeback"] };
}

const [build, overlay, source] = await Promise.all([
  readFile(path.join(ROOT, BUILD), "utf8").then(JSON.parse),
  readFile(path.join(ROOT, OVERLAY), "utf8").then(JSON.parse),
  captureBuildInputs(),
]);
check(build.status === "passed" && build.sourceStable === true
  && build.inputAfterSha256 === source.sha256
  && overlay.rows?.length === 6
  && overlay.counts?.rightsSigned === 0
  && overlay.boundary?.scientificPayloadWriteback === false,
"build-source-or-overlay-invalid");

const [home, health, images, disabled, invalid, crossOrigin] = await Promise.all([
  checkPage(ENABLED),
  fetchResponse(`${ENABLED}/api/health`),
  Promise.all(overlay.rows.map(checkImage)),
  fetchResponse(`${DISABLED}/api/atlas/mainline-a-r71-source/${overlay.rows[0].id}/image`),
  fetchResponse(`${ENABLED}/api/atlas/mainline-a-r71-source/unknown-id/image`),
  fetchResponse(`${ENABLED}/api/atlas/mainline-a-r71-source/${overlay.rows[0].id}/image`,
    { headers: { origin: "https://example.com" } }),
]);
check(health.status === 200 && disabled.status === 404
  && invalid.status === 404 && crossOrigin.status === 404,
"health-or-negative-route-invalid");
check((await captureBuildInputs()).sha256 === source.sha256,
  "app-source-changed-during-http");
const report = { schema: "mainline-a-r71-local-http-v658",
  status: "passed-current-source-local-production-build",
  buildReceipt: BUILD, buildId: build.buildId,
  runtimeBuildId: build.runtimeBuildId,
  sourceSha256: source.sha256, origin: ENABLED,
  home, health: { status: health.status, bytes: health.body.length,
    sha256: sha(health.body) },
  images,
  negatives: { defaultDisabled: disabled.status,
    invalidId: invalid.status, foreignOrigin: crossOrigin.status },
  counts: { images: images.length, shaMatches: images.filter((row) =>
    overlay.rows.find((sourceRow) => sourceRow.id === row.id)
      ?.imageRaw.sha256 === row.sha256).length,
  rightsSigned: 0, runtimeAdmitted: 0 },
  claims: { publicDeployment: false, copyrightApproval: false,
    scientificValidity: false, productionPerformance: false,
    realUserValidation: false, physicalMobile: false,
    scientificPayloadWriteback: false } };
await writeFile(path.join(ROOT, OUTPUT),
  `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
console.log(JSON.stringify({ status: report.status,
  counts: report.counts, output: OUTPUT }, null, 2));

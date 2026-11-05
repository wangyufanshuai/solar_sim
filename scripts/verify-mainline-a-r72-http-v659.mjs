import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD =
  "docs/release/v607/mainline-a-r72-build-20261013v659r72web02.json";
const OVERLAY = "app/data/mainlineANebulaR72SourceV659.generated.json";
const OUTPUT =
  "docs/release/v607/mainline-a-r72-v659-http-20261013v659r72web02.json";
const ENABLED = "http://127.0.0.1:3117";
const DISABLED = "http://127.0.0.1:3118";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function check(condition, code) {
  if (!condition) throw new Error(`r72-http-v659:${code}`);
}

async function get(url, options = {}) {
  const response = await fetch(url, { method: "GET", cache: "no-store",
    redirect: "manual", signal: AbortSignal.timeout(20_000),
    ...options });
  const body = Buffer.from(await response.arrayBuffer());
  return { status: response.status, finalUrl: response.url,
    headers: Object.fromEntries(response.headers), body };
}

async function ordinaryPage(url) {
  const result = await get(url);
  check(result.status === 200 && result.body.length > 1_000,
    `page-http:${url}`);
  check(result.body.toString("utf8").includes("/_next/static/"),
    `next-static-reference:${url}`);
  return { status: result.status, finalUrl: result.finalUrl,
    bytes: result.body.length, sha256: sha(result.body) };
}

const [build, overlay, source] = await Promise.all([
  readFile(path.join(ROOT, BUILD), "utf8").then(JSON.parse),
  readFile(path.join(ROOT, OVERLAY), "utf8").then(JSON.parse),
  captureBuildInputs(),
]);
check(build.status === "passed" && build.sourceStable === true
  && build.inputAfterSha256 === source.sha256
  && overlay.rows?.length === 6
  && overlay.counts?.imagesCaptured === 1
  && overlay.counts?.blockedImageRequestsUnexecuted === 5
  && overlay.boundary?.scientificPayloadWriteback === false,
"build-source-or-overlay-invalid");

const california = overlay.rows.find((row) =>
  row.id === "california-nebula");
check(Boolean(california?.imageRaw), "california-pin-missing");
const route = (id) => `/api/atlas/mainline-a-r72-source/${id}`;
const held = overlay.rows.filter((row) => !row.imageAcquisitionAllowed);
check(held.length === 5 && held.every((row) =>
  row.imageRaw === null && row.imageRequestExecuted === false),
"five-held-source-rows-invalid");

const [home, health, image, ...negativeResponses] = await Promise.all([
  ordinaryPage(ENABLED), get(`${ENABLED}/api/health`),
  get(`${ENABLED}${route(california.id)}`),
  ...held.map((row) => get(`${ENABLED}${route(row.id)}`)),
  get(`${DISABLED}${route(california.id)}`),
  get(`${ENABLED}${route("unknown-nebula")}`),
  get(`${ENABLED}${route(california.id)}`,
    { headers: { origin: "https://example.com" } }),
]);
check(health.status === 200, "health-invalid");
check(image.status === 200
  && image.headers["content-type"] === "image/jpeg"
  && image.headers["x-mainline-a-review-only"] === "candidate-hold"
  && image.headers["x-mainline-a-rights"] === "pending"
  && image.headers["x-scientific-payload-writeback"] === "false"
  && image.headers["x-artifact-sha256"] === california.imageRaw.sha256
  && image.headers["x-nasa-id"] === california.nasaId
  && image.headers["cache-control"]?.includes("no-store")
  && image.body.length === california.imageRaw.bytes
  && sha(image.body) === california.imageRaw.sha256,
"california-http-sha-or-boundary-invalid");
check(negativeResponses.length === 8
  && negativeResponses.every((response) => response.status === 404),
"blocked-disabled-or-foreign-route-not-closed");
check((await captureBuildInputs()).sha256 === source.sha256,
  "app-source-changed-during-http");

const report = {
  schema: "mainline-a-r72-local-http-v659",
  status: "passed-current-source-local-production-build",
  buildReceipt: BUILD, buildId: build.buildId,
  runtimeBuildId: build.runtimeBuildId,
  sourceSha256: source.sha256, origin: ENABLED,
  home, health: { status: health.status,
    bytes: health.body.length, sha256: sha(health.body) },
  image: { id: california.id, nasaId: california.nasaId,
    route: route(california.id), status: image.status,
    bytes: image.body.length, sha256: sha(image.body),
    contentType: image.headers["content-type"],
    candidate: image.headers["x-mainline-a-review-only"],
    rights: image.headers["x-mainline-a-rights"],
    scientificPayloadWriteback:
      image.headers["x-scientific-payload-writeback"] },
  negatives: { heldIds: held.map((row) => row.id),
    heldStatuses: negativeResponses.slice(0, 5).map((response) =>
      response.status),
    defaultDisabled: negativeResponses[5].status,
    invalidId: negativeResponses[6].status,
    foreignOrigin: negativeResponses[7].status },
  counts: { imageShaMatches: 1, heldImagesServed: 0,
    rightsSigned: 0, runtimeAdmitted: 0 },
  claims: { publicDeployment: false, copyrightApproval: false,
    scientificValidity: false, productionPerformance: false,
    realUserValidation: false, physicalMobile: false,
    scientificPayloadWriteback: false },
};
await writeFile(path.join(ROOT, OUTPUT),
  `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
process.stdout.write(`${JSON.stringify({ status: report.status,
  counts: report.counts, output: OUTPUT })}\n`);

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { R74_TARGET_IDS_V661 } from "./mainline-a-r74-alternative-contract-v661.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUN = "20261013v661r74web03";
const BUILD = "docs/release/v607/mainline-a-r74-build-20261013v661r74web02.json";
const OUTPUT = `docs/release/v607/mainline-a-r74-v661-http-${RUN}.json`;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assert(condition, code, detail = null) {
  if (!condition) throw new Error(`r74-http-v661:${code}:${JSON.stringify(detail)}`);
}

function selectedPort(argv) {
  assert(argv.length === 2 && argv[0] === "--port", "usage-invalid");
  const port = Number(argv[1]);
  assert(Number.isInteger(port) && port >= 1024 && port <= 65535,
    "port-invalid", port);
  return port;
}

async function observe(url) {
  const response = await fetch(url, { redirect: "manual", cache: "no-store",
    signal: AbortSignal.timeout(20_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { status: response.status, finalUrl: response.url,
    contentType: response.headers.get("content-type"),
    bytes: bytes.length, sha256: sha256(bytes),
    candidateBoundary: response.headers.get("x-mainline-a-review-only"),
    rights: response.headers.get("x-mainline-a-rights"),
    scientificPayloadWriteback: response.headers.get(
      "x-scientific-payload-writeback") };
}

export function inspectR74HttpV661(report) {
  const issues = [];
  if (report?.home?.status !== 200
    || !report.home.contentType?.startsWith("text/html")
    || report?.health?.status !== 200
    || !report.health.contentType?.startsWith("application/json")) {
    issues.push("home-or-health-not-200");
  }
  if (report?.heldImages?.length !== 5
    || report.heldImages.some((row, index) =>
      row.id !== R74_TARGET_IDS_V661[index]
      || row.response.status !== 404)) {
    issues.push("held-images-incorrectly-served");
  }
  if (report?.rawArtifactRoute?.status !== 404) {
    issues.push("raw-page-exposed-by-http");
  }
  if (report?.allowedSample?.status !== 200
    || report.allowedSample.candidateBoundary !== "candidate-hold"
    || report.allowedSample.rights !== "pending"
    || report.allowedSample.scientificPayloadWriteback !== "false") {
    issues.push("allowed-review-sample-not-guarded");
  }
  if (report?.build?.sourceStable !== true
    || report?.build?.appSourceSha256 !== report?.currentAppSourceSha256) {
    issues.push("http-build-not-current-source");
  }
  return { ok: issues.length === 0, issues };
}

export async function runR74HttpV661(port) {
  const build = JSON.parse(await readFile(path.join(ROOT, BUILD), "utf8"));
  const current = await captureBuildInputs();
  assert(build.status === "passed" && build.sourceStable === true
    && build.inputAfterSha256 === current.sha256,
  "source-changed-after-build", { build: build.inputAfterSha256,
    current: current.sha256 });
  const origin = `http://127.0.0.1:${port}`;
  const home = await observe(origin + "/");
  const health = await observe(origin + "/api/health");
  const heldImages = [];
  for (const id of R74_TARGET_IDS_V661) {
    heldImages.push({ id, response: await observe(
      `${origin}/api/atlas/mainline-a-nebula-review/${id}/detail`) });
  }
  const rawArtifactRoute = await observe(
    `${origin}/docs/release/v607/nebula-r74-v661/raw/ring-photojournal.html`);
  const allowedSample = await observe(
    `${origin}/api/atlas/mainline-a-nebula-review/heart-nebula/thumb`);
  const report = { schema: "mainline-a-r74-http-evidence-v661",
    observedAt: new Date().toISOString(), origin,
    evidenceClass: "local-production-build-http",
    build: { buildId: build.buildId,
      appSourceSha256: build.inputAfterSha256,
      sourceStable: build.sourceStable,
      distDir: build.distDir },
    currentAppSourceSha256: current.sha256,
    home, health, heldImages, rawArtifactRoute, allowedSample,
    pageCaptureDoesNotServeHeldImages: true,
    physicalMobile: "not-run", publicDeployment: "not-run" };
  const checked = inspectR74HttpV661(report);
  assert(checked.ok, "observations-invalid", checked.issues);
  await writeFile(path.join(ROOT, OUTPUT), `${JSON.stringify(report, null, 2)}\n`,
    { flag: "wx" });
  return { ...checked, output: OUTPUT,
    home: home.status, health: health.status,
    allowedSample: allowedSample.status,
    heldImages: heldImages.map((row) => row.response.status) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runR74HttpV661(selectedPort(process.argv.slice(2))).then((result) =>
    console.log(JSON.stringify(result, null, 2))).catch((error) => {
    console.error(String(error?.message ?? error));
    process.exitCode = 1;
  });
}

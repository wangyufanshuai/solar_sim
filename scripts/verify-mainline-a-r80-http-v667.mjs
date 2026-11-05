import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { inspectR79VisualAuditV666 } from
  "./audit-mainline-a-r79-visual-v666.mjs";
import { verifyR79HttpV666 } from
  "./verify-mainline-a-r79-http-v666.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes)
  .digest("hex");
function check(value, code, detail) {
  if (!value) throw new Error("r80-http:" + code
    + (detail ? ":" + JSON.stringify(detail) : ""));
}

export function parseR80HttpOptionsV667(argv) {
  check(argv.length === 8 && argv[0] === "--mode"
    && argv[2] === "--run-id" && argv[4] === "--port"
    && argv[6] === "--build-run-id", "usage");
  const port = Number(argv[5]);
  check(["enabled", "default-off"].includes(argv[1])
    && /^20261013v667r80http0[1-9]$/.test(argv[3])
    && /^20261013v667r80web0[1-9]$/.test(argv[7])
    && Number.isInteger(port) && port >= 1024 && port <= 65535,
  "mode-run-id-or-port");
  return { mode: argv[1], runId: argv[3],
    port, buildRunId: argv[7],
    origin: "http://127.0.0.1:" + port };
}

async function json(relative) {
  return JSON.parse(await readFile(safeWorkspacePathV662(relative), "utf8"));
}

async function request(origin, route) {
  check(route.startsWith("/") && !route.startsWith("//")
    && !route.includes("..") && !route.includes("?")
    && !route.includes("#"), "route", route);
  const response = await fetch(origin + route, {
    method: "GET", redirect: "manual", cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  const body = Buffer.from(await response.arrayBuffer());
  return { route, finalUrl: response.url, status: response.status,
    contentType: response.headers.get("content-type"),
    bytes: body.length, sha256: sha256(body),
    artifactSha256: response.headers.get("x-artifact-sha256"),
    reviewOnly: response.headers.get("x-mainline-a-review-only"),
    rights: response.headers.get("x-mainline-a-rights"),
    writeback: response.headers.get("x-scientific-payload-writeback"),
  };
}

export function verifyR80HttpV667(audit, observation, origin, mode) {
  const prior = verifyR79HttpV666(audit, observation, origin, mode);
  const issues = [...prior.issues];
  const expectedRoutes = new Set(audit?.images?.map((pin) => pin.route));
  const seenRoutes = new Set(observation?.images?.map((item) => item.route));
  if (expectedRoutes.size !== 31 || seenRoutes.size !== 31
    || [...expectedRoutes].some((route) => !seenRoutes.has(route))) {
    issues.push("current-31-route-identity");
  }
  if (mode === "default-off" && observation?.images?.some((item) => {
    const pin = audit.images.find((candidate) =>
      candidate.route === item.route);
    return pin && pin.kind !== "a-local-image" && item.status !== 404;
  })) issues.push("beta-image-exposed-with-flag-off");
  if (observation?.heldImages?.some((item) =>
    !["ring-nebula", "dumbbell-nebula", "bubble-nebula",
      "cats-eye-nebula", "omega-nebula"].includes(item.id))) {
    issues.push("unexpected-held-image-id");
  }
  return { ok: issues.length === 0, issues,
    requestableImageRoutes: 31, heldImageRoutes: 5,
    mode, candidateOnly: true,
    scientificPayloadWriteback: false,
    publicWebReleaseApproved: false };
}

export async function runR80HttpV667(config) {
  const buildPath = "docs/release/v607/mainline-a-r80-build-"
    + config.buildRunId + ".json";
  const auditPath = "docs/release/v607/mainline-a-r79-v666-visual-static-"
    + "20261013v666r79visual04.json";
  const [build, audit, source] = await Promise.all([
    json(buildPath), json(auditPath), captureBuildInputs(),
  ]);
  check(build.status === "passed" && build.sourceStable === true
    && build.inputAfterSha256 === source.sha256
    && build.runtimeBuildId === "mainline-a-"
      + source.sha256.slice(0, 16)
    && audit.appSourceSha256 === source.sha256
    && inspectR79VisualAuditV666(audit).ok,
  "build-or-audit-source");
  const startedAt = new Date().toISOString();
  const stage = { value: "home" };
  const output = "docs/release/v607/mainline-a-r80-v667-http-"
    + config.mode + "-" + config.runId + ".json";
  const attempt = "docs/release/v607/mainline-a-r80-v667-http-attempt-"
    + config.mode + "-" + config.runId + ".json";
  try {
    const home = await request(config.origin, "/");
    stage.value = "health";
    const health = await request(config.origin, "/api/health");
    const images = [];
    for (const pin of audit.images) {
      stage.value = "image:" + pin.key;
      images.push(await request(config.origin, pin.route));
    }
    const heldImages = [];
    for (const id of ["ring-nebula", "dumbbell-nebula",
      "bubble-nebula", "cats-eye-nebula", "omega-nebula"]) {
      stage.value = "held:" + id;
      heldImages.push({ id, ...await request(config.origin,
        "/api/atlas/mainline-a-nebula-review/" + id + "/detail") });
    }
    stage.value = "invalid-route";
    const invalidRoute = await request(config.origin,
      "/api/atlas/mainline-a-nebula-review/not-an-object/detail");
    const observation = { home, health, images, heldImages,
      invalidRoute };
    const verification = verifyR80HttpV667(audit,
      observation, config.origin, config.mode);
    check(verification.ok, "verification", verification.issues);
    check((await captureBuildInputs()).sha256 === source.sha256,
      "source-drift-during-http");
    const receipt = { schema: "mainline-a-r80-http-v667",
      status: "passed-current-source-local-http-candidate-hold",
      startedAt, endedAt: new Date().toISOString(),
      mode: config.mode, origin: config.origin,
      appSourceSha256: source.sha256,
      buildId: build.buildId,
      runtimeBuildId: build.runtimeBuildId,
      buildReceipt: buildPath, auditReceipt: auditPath,
      observation, verification,
      evidenceClass: "local-production-http",
      physicalMobile: "not-run",
      publicDeployment: "not-run",
      boundary: { candidateOnly: true, hold: true,
        notAdmitted: true, scientificPayloadWriteback: false,
        publicWebReleaseApproved: false },
      claims: { realUserValidation: false,
        scientificValidity: false, copyrightApproval: false,
        productionPerformance: false } };
    await writeFile(safeWorkspacePathV662(output),
      JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
    return { status: receipt.status, output, verification };
  } catch (error) {
    await writeFile(safeWorkspacePathV662(attempt),
      JSON.stringify({ schema: "mainline-a-r80-http-attempt-v667",
        status: "failed-preserved", startedAt,
        endedAt: new Date().toISOString(),
        stage: stage.value, origin: config.origin,
        appSourceSha256: source.sha256,
        buildId: build.buildId,
        errorClass: error?.name ?? "Error",
        errorMessage: error?.message ?? String(error),
        publicWebReleaseApproved: false,
        scientificPayloadWriteback: false }, null, 2) + "\n",
    { flag: "wx" });
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR80HttpV667(
    parseR80HttpOptionsV667(process.argv.slice(2)))));
}

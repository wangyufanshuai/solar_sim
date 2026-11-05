import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { inspectR79VisualAuditV666 } from
  "./audit-mainline-a-r79-visual-v666.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes)
  .digest("hex");
function check(value, code, detail) {
  if (!value) throw new Error("r79-http:" + code
    + (detail ? ":" + JSON.stringify(detail) : ""));
}

export function parseR79HttpOptionsV666(argv) {
  check(argv.length === 10 && argv[0] === "--mode"
    && argv[2] === "--run-id" && argv[4] === "--port"
    && argv[6] === "--build-run-id"
    && argv[8] === "--audit-run-id", "usage");
  const mode = argv[1];
  const port = Number(argv[5]);
  check(["enabled", "default-off"].includes(mode)
    && /^20261013v666r79http0[1-9]$/.test(argv[3])
    && /^20261013v666r79web0[1-9]$/.test(argv[7])
    && /^20261013v666r79visual0[1-9]$/.test(argv[9])
    && Number.isInteger(port) && port >= 1024 && port <= 65535,
  "mode-run-id-or-port");
  return { mode, runId: argv[3], port,
    buildRunId: argv[7], auditRunId: argv[9],
    origin: "http://127.0.0.1:" + port };
}

async function json(relative) {
  return JSON.parse(await readFile(safeWorkspacePathV662(relative), "utf8"));
}

async function request(origin, route) {
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

export function verifyR79HttpV666(audit, observation, origin, mode) {
  const issues = [...inspectR79VisualAuditV666(audit).issues];
  if (!["enabled", "default-off"].includes(mode)
    || !/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
    issues.push("origin-or-mode");
  }
  if (observation?.home?.status !== 200
    || observation?.health?.status !== 200) {
    issues.push("home-or-health");
  }
  const images = observation?.images;
  if (!Array.isArray(images) || images.length !== 31) {
    issues.push("image-observation-count");
  } else {
    for (const pin of audit.images) {
      const seen = images.find((item) => item.route === pin.route);
      const shouldLoad = pin.kind === "a-local-image"
        || mode === "enabled";
      if (!seen || images.filter((item) =>
        item.route === pin.route).length !== 1
        || seen.finalUrl !== origin + pin.route) {
        issues.push(`image-route:${pin.key}`);
      } else if (shouldLoad) {
        if (seen.status !== 200 || seen.sha256 !== pin.sha256
          || seen.bytes !== pin.bytes
          || !seen.contentType?.startsWith(pin.mimeType)) {
          issues.push(`image-bytes:${pin.key}`);
        }
        if (pin.kind !== "a-local-image"
          && (seen.artifactSha256 !== pin.sha256
            || seen.reviewOnly !== "candidate-hold"
            || seen.rights !== "pending"
            || seen.writeback !== "false")) {
          issues.push(`candidate-headers:${pin.key}`);
        }
      } else if (seen.status !== 404 || seen.reviewOnly !== null
        || seen.artifactSha256 !== null) {
        issues.push(`default-off-image-exposed:${pin.key}`);
      }
    }
  }
  const held = observation?.heldImages;
  if (!Array.isArray(held) || held.length !== 5
    || held.some((item) => item.status !== 404
      || item.artifactSha256 !== null
      || item.reviewOnly !== null)) {
    issues.push("held-images-exposed");
  }
  if (observation?.invalidRoute?.status !== 404) {
    issues.push("invalid-route-exposed");
  }
  return { ok: issues.length === 0, issues,
    expectedImages: 31,
    expectedHeldImages: 5,
    mode, publicWebReleaseApproved: false };
}

export async function runR79HttpV666(config) {
  const buildPath = "docs/release/v607/mainline-a-r79-build-"
    + config.buildRunId + ".json";
  const auditPath = "docs/release/v607/mainline-a-r79-v666-visual-static-"
    + config.auditRunId + ".json";
  const [build, audit, source] = await Promise.all([
    json(buildPath), json(auditPath), captureBuildInputs(),
  ]);
  check(build.status === "passed" && build.sourceStable
    && build.inputAfterSha256 === source.sha256
    && audit.appSourceSha256 === source.sha256
    && inspectR79VisualAuditV666(audit).ok,
  "source-build-or-audit-drift");
  const startedAt = new Date().toISOString();
  const home = await request(config.origin, "/");
  const health = await request(config.origin, "/api/health");
  const images = [];
  for (const pin of audit.images) {
    images.push(await request(config.origin, pin.route));
  }
  const heldImages = [];
  for (const id of ["ring-nebula", "dumbbell-nebula",
    "bubble-nebula", "cats-eye-nebula", "omega-nebula"]) {
    const route = "/api/atlas/mainline-a-nebula-review/"
      + id + "/detail";
    heldImages.push({ id, ...await request(config.origin, route) });
  }
  const invalidRoute = await request(config.origin,
    "/api/atlas/mainline-a-nebula-review/not-an-object/detail");
  const observation = { home, health, images, heldImages,
    invalidRoute };
  const verification = verifyR79HttpV666(audit,
    observation, config.origin, config.mode);
  check(verification.ok, "http-verification", verification.issues);
  check((await captureBuildInputs()).sha256 === source.sha256,
    "source-changed-during-http");
  const output = "docs/release/v607/mainline-a-r79-v666-http-"
    + config.mode + "-" + config.runId + ".json";
  const receipt = {
    schema: "mainline-a-r79-http-v666",
    status: "passed-local-current-source-candidate-hold",
    mode: config.mode, startedAt,
    endedAt: new Date().toISOString(),
    origin: config.origin, buildReceipt: buildPath,
    auditReceipt: auditPath, buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId,
    appSourceSha256: source.sha256,
    observation, verification,
    evidenceClass: "local-production-http",
    publicDeployment: "not-run",
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false },
    claims: { scientificValidity: false, copyrightApproval: false,
      productionPerformance: false, realUserValidation: false,
      publicWebReleaseApproved: false },
  };
  await writeFile(safeWorkspacePathV662(output),
    JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
  return { output, status: receipt.status,
    mode: config.mode, verification };
}

if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR79HttpV666(
    parseR79HttpOptionsV666(process.argv.slice(2)))));
}

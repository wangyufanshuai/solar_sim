import { createHash } from "node:crypto";
import { lstat, readFile, writeFile } from "node:fs/promises";
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
  if (!value) throw new Error("r79-external:" + code
    + (detail ? ":" + JSON.stringify(detail) : ""));
}

export function parseR79ExternalOptionsV666(argv) {
  check(argv.length === 4 && argv[0] === "--run-id"
    && argv[2] === "--audit-run-id"
    && /^20261013v666r79external0[1-9]$/.test(argv[1])
    && /^20261013v666r79visual0[1-9]$/.test(argv[3]),
  "usage");
  return { runId: argv[1], auditRunId: argv[3] };
}

export function inspectR79ExternalBoundaryV666(
  readiness, audit, observedPins, sourceSha256,
) {
  const issues = [...inspectR79VisualAuditV666(audit).issues];
  if (audit?.appSourceSha256 !== sourceSha256
    || !/^[a-f0-9]{64}$/.test(sourceSha256 ?? "")) {
    issues.push("current-source-or-audit");
  }
  const expected = readiness?.sourcePins;
  if (!Array.isArray(expected) || expected.length !== 20
    || !Array.isArray(observedPins) || observedPins.length !== 20
    || new Set(expected.map((pin) => pin.path)).size !== 20) {
    issues.push("prior-source-pin-count");
  } else {
    for (const pin of expected) {
      const actual = observedPins.find((item) => item.path === pin.path);
      if (!actual || actual.sha256 !== pin.sha256
        || actual.bytes !== pin.bytes) {
        issues.push(`prior-source-pin-drift:${pin.path}`);
      }
    }
  }
  if (readiness?.stars?.length !== 4
    || readiness.stars.some((item) =>
      item.physicalComponentConfirmed !== false
        || item.state !== "component-review-hold"
        || item.runtimeAdmission !== "candidate-only"
        || item.scientificPayloadWriteback !== false)
    || readiness?.nebulae?.length !== 5
    || readiness.nebulae.some((item) =>
      item.imageRequestExecuted !== false
        || item.imageResponseCaptured !== 0
        || item.imageRequestIntent?.responseCaptured !== 0
        || item.imageRequestIntent?.rawArtifact !== null
        || item.rightsSigned !== false
        || item.state !== "image-acquisition-policy-hold")) {
    issues.push("stellar-or-nebula-hold-promoted");
  }
  if (readiness?.gates?.aNebulaRightsSigned !== 0
    || readiness.gates.betaNebulaRightsSigned !== 0
    || readiness.gates.publicWebReleaseAllowed !== false
    || readiness?.claims?.copyrightApproval !== false
    || readiness.claims.scientificValidity !== false
    || readiness?.boundary?.candidateOnly !== true
    || readiness.boundary.hold !== true
    || readiness.boundary.notAdmitted !== true
    || readiness.boundary.scientificPayloadWriteback !== false) {
    issues.push("rights-science-or-release-promotion");
  }
  return { ok: issues.length === 0, issues,
    priorSourcePinsRecomputed: observedPins?.length ?? 0,
    stellarPhysicalComponentsConfirmed: 0,
    stellarComponentHolds: 4,
    nebulaImageAcquisitionHolds: 5,
    heldImageResponsesCaptured: 0,
    aNebulaRightsSigned: 0,
    betaNebulaRightsSigned: 0,
    currentLocalImagesRecomputed: audit?.images?.length ?? 0,
    newHttpsRequests: 0,
    scientificValidityApproved: false,
    copyrightApproval: false,
    publicWebReleaseApproved: false };
}

export async function runR79ExternalBoundaryV666(config) {
  const readinessPath =
    "app/data/mainlineAWebReadinessV663.generated.json";
  const auditPath = "docs/release/v607/mainline-a-r79-v666-visual-static-"
    + config.auditRunId + ".json";
  const [readinessBytes, auditBytes, sourceBefore] = await Promise.all([
    readFile(safeWorkspacePathV662(readinessPath)),
    readFile(safeWorkspacePathV662(auditPath)),
    captureBuildInputs(),
  ]);
  const readiness = JSON.parse(readinessBytes.toString("utf8"));
  const audit = JSON.parse(auditBytes.toString("utf8"));
  const observedPins = [];
  for (const pin of readiness.sourcePins ?? []) {
    const file = safeWorkspacePathV662(pin.path);
    const stat = await lstat(file);
    check(stat.isFile() && !stat.isSymbolicLink(),
      "source-pin-not-regular", pin.path);
    const bytes = await readFile(file);
    observedPins.push({ path: pin.path,
      bytes: bytes.length, sha256: sha256(bytes) });
  }
  const verification = inspectR79ExternalBoundaryV666(
    readiness, audit, observedPins, sourceBefore.sha256);
  check(verification.ok, "external-boundary", verification.issues);
  check((await captureBuildInputs()).sha256 === sourceBefore.sha256,
    "source-changed-during-replay");
  const output = "docs/release/v607/mainline-a-r79-v666-external-source-"
    + config.runId + ".json";
  const receipt = {
    schema: "mainline-a-r79-external-source-v666",
    status: "prior-raw-pins-recomputed-current-local-images-held",
    generatedAt: new Date().toISOString(),
    evidenceClass: "external-source-prior-raw-replay-no-new-network",
    appSourceSha256: sourceBefore.sha256,
    inputs: [
      { path: readinessPath, bytes: readinessBytes.length,
        sha256: sha256(readinessBytes) },
      { path: auditPath, bytes: auditBytes.length,
        sha256: sha256(auditBytes) },
    ],
    verification,
    observedPins,
    newHttpsRequests: 0,
    scientificValidityApproved: false,
    copyrightApproval: false,
    publicWebReleaseApproved: false,
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false },
  };
  await writeFile(safeWorkspacePathV662(output),
    JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
  return { output, status: receipt.status,
    verification, appSourceSha256: sourceBefore.sha256 };
}

if (process.argv[1] && path.resolve(process.argv[1])
  === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await runR79ExternalBoundaryV666(
    parseR79ExternalOptionsV666(process.argv.slice(2)))));
}

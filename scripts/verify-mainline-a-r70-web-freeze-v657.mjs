import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { readPinnedFile, safeFile, sha256 } from
  "./mainline-a-release-evidence.mjs";
import { buildR70FreezeCandidateV657,
  replayR70FreezeCandidateV657 } from
  "./build-mainline-a-r70-web-freeze-v657.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE = "docs/release/v607/mainline-a-r70-web-freeze-candidate-20261012v657web02.json";
const OUTPUT = "docs/release/v607/mainline-a-r70-web-freeze-replay-20261012v657web02.json";
const SHA = /^[a-f0-9]{64}$/;

function fail(code) { throw new Error(`r70-freeze-replay-v657:${code}`); }
function check(value, code) { if (!value) fail(code); }

export function collectR70FreezePinsV657(saved) {
  const evidence = saved?.evidence && typeof saved.evidence === "object"
    ? Object.values(saved.evidence) : [];
  const groups = {
    evidence,
    sourceInputs: saved?.sourceInputs ?? [],
    immutableScienceInputs: saved?.immutableScienceInputs ?? [],
    candidateArtifacts: saved?.candidateArtifacts ?? [],
    browserScreenshots: saved?.browserScreenshots ?? [],
    stageScreenshots: saved?.stageScreenshots ?? [],
    buildArtifacts: saved?.buildArtifacts ?? [],
  };
  const counts = Object.fromEntries(Object.entries(groups).map(
    ([kind, items]) => [kind, Array.isArray(items) ? items.length : -1]));
  const pins = Object.values(groups).flat();
  return Object.freeze({ groups, counts, pins });
}

export function validateR70FreezeShapeV657(saved) {
  const issues = [];
  const { counts, pins } = collectR70FreezePinsV657(saved);
  if (saved?.schema !== "mainline-a-r70-web-freeze-candidate-v657"
    || saved.status
      !== "technical-candidate-evidence-complete-release-blocked"
    || !SHA.test(saved.sourceSha256 ?? "")
    || !saved.buildId || saved.runtimeBuildId
      !== `mainline-a-${saved.sourceSha256?.slice(0, 16)}`
    || saved.preservedBuild
      !== ".next-mainline-a-r70-20261012v657web02/.next") {
    issues.push("candidate-identity-invalid");
  }
  if (saved?.counts?.canonicalSelections !== 72
    || saved.counts.candidateDetailsOpened !== 24
    || saved.counts.candidateImageHttpShaMatches !== 36
    || saved.counts.localCandidateArtifacts !== 60
    || saved.counts.canonicalScreenshotsPinned !== 72
    || saved.counts.independentLongRuns !== 2
    || saved.counts.rightsSigned !== 0
    || saved.counts.componentIdentitySigned !== 0
    || saved.stageData?.counts?.canonicalStars !== 12
    || saved.stageData?.counts?.canonicalNebulae !== 12
    || saved.stageData?.counts?.canonicalConstellations !== 12
    || saved.stageData?.counts?.betaStars !== 24) {
    issues.push("coverage-or-gate-count-invalid");
  }
  if (saved?.gates?.rights !== "pending-0-of-12"
    || saved.gates.stellarPhysicalComponentIdentity
      !== "pending-0-of-4"
    || saved.gates.publicWebRelease !== "blocked"
    || saved.gates.physicalMobile !== "not-run"
    || saved.rollback?.deploymentChanged !== false
    || saved.claims?.releaseApproved !== false
    || saved.claims.copyrightApproval !== false
    || saved.claims.scientificValidity !== false
    || saved.claims.productionPerformance !== false
    || saved.claims.realUserValidation !== false
    || saved.claims.physicalMobile !== false
    || saved.claims.scientificPayloadWriteback !== false
    || saved.stageData?.boundary?.scientificPayloadWriteback !== false
    || saved.technicalDecision?.status !== "technical-candidate-ready"
    || saved.technicalDecision.publicReleaseApproved !== false) {
    issues.push("release-or-science-boundary-opened");
  }
  if (counts.evidence !== 13 || counts.sourceInputs !== 7
    || counts.immutableScienceInputs !== 2
    || counts.candidateArtifacts !== 60
    || counts.browserScreenshots !== 72
    || counts.stageScreenshots !== 4
    || counts.buildArtifacts !== 3) {
    issues.push("pin-group-coverage-incomplete");
  }
  if (pins.some((pin) => typeof pin?.path !== "string"
    || pin.path.includes("\\")
    || pin.path.startsWith("/")
    || pin.path.split("/").includes("..")
    || !SHA.test(pin.sha256 ?? "")
    || !Number.isInteger(pin.bytes) || pin.bytes < 1
    || !["static", "http", "visual", "browser", "performance",
      "external-source"].includes(pin.evidenceClass))) {
    issues.push("pin-format-or-class-invalid");
  }
  if (new Set(pins.map((pin) => pin.path)).size !== pins.length) {
    issues.push("pin-path-duplicate");
  }
  if (saved?.longRuns?.length !== 2
    || saved.longRuns[0]?.device !== "desktop"
    || saved.longRuns[1]?.device !== "mobile-viewport"
    || saved.longRuns.some((row) => row.durationMs < 30 * 60 * 1000
      || row.visibilityInterruptions !== 0
      || row.resourceRestored !== true
      || row.sourceSha256 !== saved.sourceSha256)) {
    issues.push("longrun-binding-invalid");
  }
  return Object.freeze({ ok: issues.length === 0,
    issues: Object.freeze(issues), counts: Object.freeze(counts),
    pinCount: pins.length });
}

export async function verifyR70FreezeCandidateV657() {
  const file = await safeFile(ROOT, PACKAGE);
  const bytes = await readFile(file.absolute);
  const saved = JSON.parse(bytes.toString("utf8"));
  const shape = validateR70FreezeShapeV657(saved);
  check(shape.ok, `shape:${shape.issues.join(",")}`);
  const current = await captureBuildInputs();
  check(current.sha256 === saved.sourceSha256, "source-not-current");
  const pinned = collectR70FreezePinsV657(saved);
  const verified = [];
  for (const [index, pin] of pinned.pins.entries()) {
    const result = await readPinnedFile(ROOT, pin,
      `${pin.evidenceClass}:${index}`);
    verified.push(result.record);
  }
  const fresh = await buildR70FreezeCandidateV657();
  const replay = replayR70FreezeCandidateV657(saved, fresh);
  check(saved.buildId === fresh.buildId
    && saved.sourceSha256 === fresh.sourceSha256,
  "fresh-rebuild-drift");
  const classCounts = Object.fromEntries([
    "static", "http", "visual", "browser", "performance",
    "external-source"].map((kind) => [kind,
    verified.filter((pin) => pin.evidenceClass === kind).length]));
  return Object.freeze({ schema: "mainline-a-r70-web-freeze-replay-v657",
    status: "verified-current-source-local-candidate",
    evidenceScope: "offline-local-replay",
    sourceSha256: current.sha256,
    package: { path: PACKAGE, bytes: bytes.length,
      sha256: sha256(bytes) },
    buildId: saved.buildId, runtimeBuildId: saved.runtimeBuildId,
    pinGroups: shape.counts, pinCount: shape.pinCount,
    classCounts, replay,
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false,
      publicWebRelease: "blocked" },
    claims: { releaseApproved: false, copyrightApproval: false,
      scientificValidity: false, productionPerformance: false,
      realUserValidation: false, physicalMobile: false } });
}

if (process.argv[1] && path.resolve(process.argv[1]) ===
    fileURLToPath(import.meta.url)) {
  const result = await verifyR70FreezeCandidateV657();
  await writeFile(path.join(ROOT, OUTPUT),
    `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: result.status,
    sourceSha256: result.sourceSha256,
    buildId: result.buildId, verifiedPins: result.pinCount,
    output: OUTPUT }, null, 2));
}

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { safeFile } from "./mainline-a-release-evidence.mjs";
import {
  buildWebCandidatePackageV648, replaySavedWebCandidateV648,
} from "./build-mainline-a-web-candidate-v648.mjs";
import {
  auditWebCurrentLongRunV648, replayWebCurrentLongRunV648,
} from "./verify-mainline-a-web-r65-current-v648.mjs";
import longRunModule from "../app/lib/mainlineAR65LongRunV643.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "mainline-a-web-candidate-longrun-supplement-v648";
const RUN = "20261007-v648long01";
const PATHS = Object.freeze({
  base: "docs/release/v607/mainline-a-r66-web-candidate-20261007-v648web02.json",
  build: "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json",
  raw: `docs/release/v607/mainline-a-r66-web-r65-browser-final-raw-${RUN}.json`,
  formal: `docs/release/v607/mainline-a-r66-web-r65-longrun-${RUN}.json`,
  replay: `docs/release/v607/mainline-a-r66-web-r65-longrun-replay-${RUN}.json`,
  binding: `docs/release/v607/mainline-a-r66-web-r65-longrun-binding-${RUN}.json`,
});
const { verifyMainlineAR65LongRunReceiptV643,
  replayMainlineAR65LongRunReceiptV643 } = longRunModule.default ?? longRunModule;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function fail(code) { throw new Error(`web-longrun-candidate-v648:${code}`); }
async function pinned(relative, role) {
  const file = await safeFile(ROOT, relative);
  if (file.stat.size < 1 || file.stat.size > 256 * 1024 * 1024) fail(`input-size:${role}`);
  const bytes = await readFile(file.absolute);
  return { value: JSON.parse(bytes.toString("utf8")), pin: { role, path: relative,
    bytes: bytes.length, sha256: sha(bytes) } };
}

export function validateWebLongRunCandidateInputsV648(input, currentSha) {
  const { base, build, raw, formal, replay, binding } = input;
  if (base?.schema !== "mainline-a-web-candidate-package-v648"
    || base.status !== "candidate-blocked-current-source"
    || base.sourceSha256 !== currentSha
    || base.counts?.humanRightsSigned !== 0
    || base.counts?.stellarPhysicalComponentConfirmed !== 0
    || base.gates?.nebulaRightsSignoff !== "pending-0-of-12"
    || base.gates?.stellarPhysicalComponentIdentity !== "pending-0-of-4"
    || base.gates?.publicWebRelease !== "blocked"
    || base.claims?.releaseApproved !== false
    || base.claims?.copyrightApproval !== false
    || base.claims?.scientificValidity !== false) fail("base-candidate-invalid");
  if (build?.status !== "passed" || build.sourceStable !== true
    || build.inputBefore?.sha256 !== currentSha
    || build.inputAfterSha256 !== currentSha
    || build.buildId !== base.buildId
    || build.runtimeBuildId !== base.runtimeBuildId
    || build.branch !== base.branch || build.head !== base.head) fail("build-drift");
  if (binding?.schema !== "mainline-a-web-r65-current-longrun-v648"
    || binding.status !== "verified-current-source-local-longrun"
    || binding.sourceSha256 !== currentSha
    || binding.buildId !== build.buildId
    || binding.runtimeBuildId !== build.runtimeBuildId
    || binding.currentSourceLongRuns !== 2
    || binding.observations?.length !== 2
    || binding.issues?.length !== 0
    || binding.claims?.productionPerformance !== false
    || binding.claims?.physicalMobile !== false) fail("current-longrun-binding-invalid");
  if (raw?.schema !== "mainline-a-r65-long-run-v643"
    || raw.status !== "qualified"
    || raw.build?.buildId !== build.runtimeBuildId
    || raw.observations?.length !== 2
    || raw.claims?.productionPerformance !== false
    || raw.boundary?.scientificPayloadWriteback !== false) fail("raw-longrun-invalid");
  if (formal?.schema !== raw.schema || formal.status !== "qualified"
    || formal.build?.buildId !== raw.build.buildId
    || !same(formal.observations.map((row) => [row.sessionId, row.digest]),
      raw.observations.map((row) => [row.sessionId, row.digest]))) fail("formal-longrun-drift");
  const verified = verifyMainlineAR65LongRunReceiptV643(formal);
  const recomputedReplay = replayMainlineAR65LongRunReceiptV643(formal);
  if (!verified.ok || verified.completeLongRuns !== 2
    || !same(replay, recomputedReplay)
    || replay.status !== "verified" || replay.failures.length !== 0) fail("offline-longrun-replay-invalid");
  if (!same(binding.observations.map((row) => [row.sessionId, row.digest]),
    raw.observations.map((row) => [row.sessionId, row.digest]))) fail("binding-observation-drift");
  return Object.freeze({ sourceSha256: currentSha, buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId, longRuns: 2,
    rightsSigned: 0, publicWebRelease: "blocked" });
}

export async function buildWebLongRunCandidateSupplementV648() {
  const loaded = Object.fromEntries(await Promise.all(Object.entries(PATHS).map(
    async ([role, relative]) => [role, await pinned(relative, role)])));
  const values = Object.fromEntries(Object.entries(loaded).map(([role, item]) => [role, item.value]));
  const current = await captureBuildInputs();
  const checked = validateWebLongRunCandidateInputsV648(values, current.sha256);
  const baseFresh = await buildWebCandidatePackageV648();
  replaySavedWebCandidateV648(values.base, baseFresh);
  const bindingFresh = await auditWebCurrentLongRunV648(PATHS.build, PATHS.raw);
  replayWebCurrentLongRunV648(values.binding, bindingFresh);
  if (values.binding.rawBrowserReceipt.sha256 !== loaded.raw.pin.sha256
    || values.binding.buildReceipt.sha256 !== loaded.build.pin.sha256) fail("binding-pin-drift");
  const observations = Object.freeze(values.binding.observations.map((row) => Object.freeze({
    device: row.device, sessionId: row.sessionId, durationMs: row.observedDurationMs,
    frames: row.frameSamples, frameP95Ms: row.frameP95Ms,
    memorySamples: row.memorySamples, memoryDeltaBytes: row.memoryDeltaBytes,
    resourceTotal: row.resourceTotal, resourceDigest: row.resourceDigest,
    visibilityInterruptions: row.visibilityInterruptions,
  })));
  return Object.freeze({ schema: SCHEMA,
    status: "candidate-blocked-current-source-longrun-qualified",
    deliveryTarget: "next-web-only", sourceSha256: checked.sourceSha256,
    buildId: checked.buildId, runtimeBuildId: checked.runtimeBuildId,
    branch: values.base.branch, head: values.base.head,
    preservedBuildDirectory: values.base.preservedBuildDirectory,
    buildArtifactPins: values.base.buildArtifactPins,
    evidence: Object.values(loaded).map((item) => item.pin),
    observations, counts: { currentSourceLongRuns: 2,
      localPreviewImages: 12, humanRightsSigned: 0,
      stellarPhysicalComponentConfirmed: 0 },
    checks: { localBrowserRuntimeLongRun: "two-independent-thirty-minute-runs-qualified",
      browserReplay: "verified", performanceClaim: "local-browser-observation-only",
      physicalMobile: "not-run", externalSource: "historical-pending" },
    gates: { nebulaRightsSignoff: "pending-0-of-12",
      stellarPhysicalComponentIdentity: "pending-0-of-4",
      publicWebRelease: "blocked",
      rootAppParity: "out-of-scope-for-current-web-only-batch" },
    rollback: values.base.rollback,
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { releaseApproved: false, copyrightApproval: false,
      scientificValidity: false, productionPerformance: false,
      realUserValidation: false, physicalMobile: false },
    note: "The long-run evidence upgrades only local browser technical review; copyright and science gates remain pending." });
}
export function replayWebLongRunCandidateSupplementV648(saved, fresh) {
  if (saved?.schema !== SCHEMA
    || saved.status !== "candidate-blocked-current-source-longrun-qualified"
    || saved.sourceSha256 !== fresh.sourceSha256 || saved.buildId !== fresh.buildId
    || saved.runtimeBuildId !== fresh.runtimeBuildId
    || !same(saved.evidence, fresh.evidence)
    || !same(saved.buildArtifactPins, fresh.buildArtifactPins)
    || !same(saved.observations, fresh.observations)
    || !same(saved.counts, fresh.counts)
    || !same(saved.gates, fresh.gates)
    || !same(saved.claims, fresh.claims)
    || !same(saved.boundary, fresh.boundary)
    || saved.counts?.currentSourceLongRuns !== 2
    || saved.counts?.humanRightsSigned !== 0
    || saved.gates?.publicWebRelease !== "blocked"
    || saved.claims?.releaseApproved !== false
    || saved.claims?.productionPerformance !== false
    || saved.boundary?.scientificPayloadWriteback !== false) fail("saved-supplement-replay-mismatch");
  return Object.freeze({ status: "replayed-candidate-blocked-current-source-longrun-qualified",
    sourceSha256: fresh.sourceSha256, buildId: fresh.buildId,
    currentSourceLongRuns: 2, publicWebRelease: "blocked" });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fresh = await buildWebLongRunCandidateSupplementV648();
  const outputAt = process.argv.indexOf("--output");
  const replayAt = process.argv.indexOf("--replay");
  for (const index of [outputAt, replayAt].filter((value) => value >= 0)) {
    const relative = process.argv[index + 1];
    if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(relative ?? "")) fail("path-invalid");
  }
  if (outputAt >= 0) await writeFile(path.join(ROOT, process.argv[outputAt + 1]),
    `${JSON.stringify(fresh, null, 2)}\n`, { flag: "wx" });
  if (replayAt >= 0) {
    const saved = JSON.parse(await readFile(path.join(ROOT, process.argv[replayAt + 1]), "utf8"));
    console.log(JSON.stringify(replayWebLongRunCandidateSupplementV648(saved, fresh), null, 2));
  } else console.log(JSON.stringify({ status: fresh.status, buildId: fresh.buildId,
    currentSourceLongRuns: fresh.counts.currentSourceLongRuns,
    humanRightsSigned: fresh.counts.humanRightsSigned }, null, 2));
}

import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { sha256V651 } from "./mainline-a-nebula-source-page-v651.mjs";
import {
  auditWebPointerMatrixV649, replayWebPointerMatrixV649,
} from "./verify-mainline-a-web-pointer-matrix-v649.mjs";
import {
  auditSourcePageLedgerV651, replaySourcePageAuditV651,
} from "./verify-mainline-a-nebula-source-pages-v651.mjs";
import {
  auditPageImageLinkLedgerV652, replayPageImageLinkAuditV652,
} from "./verify-mainline-a-nebula-page-image-link-v652.mjs";
import {
  auditNebulaPixelLinksV653, replayNebulaPixelAuditV653,
} from "./verify-mainline-a-nebula-pixel-link-v653.mjs";
import {
  auditWebCurrentLongRunV648, replayWebCurrentLongRunV648,
} from "./verify-mainline-a-web-r65-current-v648.mjs";
import { verifyBatchFile } from "./verify-mainline-a-nebula-batch-v628.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "mainline-a-r66-web-current-evidence-supplement-v651";
const STATUS = "candidate-blocked-current-source-technical-evidence";
const PATHS = Object.freeze({
  build: "docs/release/v607/mainline-a-r66-build-20261011-v649web02.json",
  http: "docs/release/v607/mainline-a-r66-http-20261011-v649web02.json",
  pointer: "docs/release/v607/mainline-a-r66-web-pointer-verification-20261011-v649pointer02.json",
  sourcePageLedger: "docs/release/v607/mainline-a-r66-nebula-source-page-ledger-20261011-v651page01.json",
  sourcePageAudit: "docs/release/v607/mainline-a-r66-nebula-source-page-audit-20261011-v651page01.json",
  imageLinkLedger: "docs/release/v607/mainline-a-r66-nebula-page-image-link-ledger-20261011-v652link01.json",
  imageLinkAudit: "docs/release/v607/mainline-a-r66-nebula-page-image-link-audit-20261011-v652link01-fixed.json",
  pixelLinkAudit: "docs/release/v607/mainline-a-r66-nebula-pixel-link-audit-20261011-v653pixel01.json",
  longRunRaw: "docs/release/v607/mainline-a-r66-web-r65-browser-final-raw-20261011-v650long01.json",
  longRunBinding: "docs/release/v607/mainline-a-r66-web-r65-longrun-binding-20261011-v650long01.json",
  priorRound: "docs/release/v607/mainline-a-r66-web-v649-technical-round-20261011.json",
  priorCodeChange: "docs/release/v607/mainline-a-r66-web-v649-code-change-20261011.json",
});
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function fail(code) {
  throw new Error(`web-evidence-supplement-v651:${code}`);
}
function requireValue(condition, code) {
  if (!condition) fail(code);
}
function safeRelative(relative) {
  if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/.test(relative ?? "")) {
    fail("unsafe-receipt-path");
  }
  return relative;
}
async function pinnedJson(relative, role, maximumBytes = 256 * 1024 * 1024) {
  safeRelative(relative);
  const absolute = path.resolve(ROOT, relative);
  if (!absolute.startsWith(`${path.resolve(ROOT)}${path.sep}`)) fail(`escaped-${role}`);
  const info = await stat(absolute);
  if (!info.isFile() || info.size < 1 || info.size > maximumBytes) fail(`input-size-${role}`);
  const bytes = await readFile(absolute);
  return { value: JSON.parse(bytes.toString("utf8")),
    pin: { role, path: relative, bytes: bytes.byteLength, sha256: sha256V651(bytes) } };
}

export function validateWebEvidenceSupplementInputsV651(values, currentSha) {
  const { build, http, pointer, sourcePageLedger, sourcePageAudit,
    imageLinkLedger, imageLinkAudit, pixelLinkAudit,
    longRunRaw, longRunBinding,
    priorRound, priorCodeChange } = values;
  requireValue(build?.status === "passed" && build.exitCode === 0
    && build.sourceStable === true
    && build.inputBefore?.sha256 === currentSha
    && build.inputAfterSha256 === currentSha
    && build.runtimeBuildId === `mainline-a-${currentSha.slice(0, 16)}`
    && build.distDir === ".next-mainline-a-r66-20261011-v649web02/.next",
  "build-source-invalid");
  requireValue(http?.schema === "mainline-a-http-evidence-v626"
    && http.status === "passed" && http.buildId === build.buildId
    && http.runtimeBuildId === build.runtimeBuildId
    && http.sourceReport === PATHS.build
    && http.pageStatus === 200 && http.healthStatus === 200
    && http.allScriptAssetsOk === true
    && http.scriptAssets?.length > 0
    && http.scriptAssets.every((asset) => asset.matchesBuild === true)
    && http.errors?.length === 0
    && http.scientificPayloadWriteback === false,
  "http-build-binding-invalid");
  requireValue(pointer?.schema === "mainline-a-r66-web-pointer-matrix-verification-v649"
    && pointer.status === "verified-local-pointer-matrix-candidate"
    && pointer.sourceSha256 === currentSha
    && pointer.buildId === build.buildId
    && pointer.counts?.desktopPointerReady === 36
    && pointer.counts?.mobilePointerReady === 36
    && pointer.counts?.screenshotHashes === 72
    && pointer.counts?.keyboardActivations === 0
    && pointer.counts?.humanRightsSigned === 0
    && pointer.boundary?.scientificPayloadWriteback === false,
  "pointer-matrix-invalid");
  requireValue(sourcePageLedger?.schema === "mainline-a-r66-nebula-source-page-ledger-v651"
    && sourcePageLedger.counts?.responseCaptured === 6
    && sourcePageLedger.counts?.officialPageCandidateVerified === 6
    && sourcePageLedger.counts?.rightsSigned === 0
    && sourcePageLedger.rows?.every((row) => row.sourcePageStatus ===
      "verified-official-source-page-candidate" && row.rightsSignoff === "pending"
      && row.scientificPayloadWriteback === false),
  "source-page-ledger-invalid");
  requireValue(sourcePageAudit?.schema === "mainline-a-r66-nebula-source-page-audit-v651"
    && sourcePageAudit.status === "verified-six-official-pages-candidate"
    && sourcePageAudit.issues?.length === 0
    && sourcePageAudit.artifacts?.length === 6
    && sourcePageAudit.counts?.rightsSigned === 0
    && sourcePageAudit.claims?.copyrightApproval === false
    && sourcePageAudit.boundary?.scientificPayloadWriteback === false,
  "source-page-audit-invalid");
  requireValue(imageLinkLedger?.schema === "mainline-a-r66-nebula-page-image-link-ledger-v652"
    && imageLinkLedger.counts?.responseCaptured === 6
    && imageLinkLedger.counts?.byteIdentical === 1
    && imageLinkLedger.counts?.rightsSigned === 0
    && imageLinkLedger.rows?.length === 6
    && imageLinkLedger.rows.every((row) => row.rightsSignoff === "pending"
      && row.scientificPayloadWriteback === false)
    && imageLinkLedger.boundary?.scientificPayloadWriteback === false,
  "image-link-ledger-invalid");
  requireValue(imageLinkAudit?.schema === "mainline-a-r66-nebula-page-image-link-audit-v652"
    && imageLinkAudit.status === "verified-six-official-jpegs-candidate-with-variant-counts"
    && imageLinkAudit.issues?.length === 0
    && imageLinkAudit.counts?.responseCaptured === 6
    && imageLinkAudit.counts?.byteIdentical === 1
    && imageLinkAudit.counts?.variantPending === 5
    && imageLinkAudit.counts?.rightsSigned === 0
    && imageLinkAudit.claims?.copyrightApproval === false
    && imageLinkAudit.boundary?.scientificPayloadWriteback === false,
  "image-link-audit-invalid");
  requireValue(pixelLinkAudit?.schema === "mainline-a-r66-nebula-pixel-link-audit-v653"
    && pixelLinkAudit.status === "verified-six-decoded-pixel-links-candidate"
    && pixelLinkAudit.issues?.length === 0
    && pixelLinkAudit.rows?.length === 6
    && pixelLinkAudit.counts?.decodedPixelIdentical === 6
    && pixelLinkAudit.counts?.rawByteIdentical === 1
    && pixelLinkAudit.counts?.rawVariantsWithIdenticalPixels === 5
    && pixelLinkAudit.counts?.rightsSigned === 0
    && pixelLinkAudit.claims?.copyrightApproval === false
    && pixelLinkAudit.boundary?.scientificPayloadWriteback === false,
  "pixel-link-audit-invalid");
  requireValue(longRunRaw?.schema === "mainline-a-r65-long-run-v643"
    && longRunRaw.status === "qualified"
    && longRunRaw.observations?.length === 2
    && longRunRaw.build?.buildId === build.runtimeBuildId
    && longRunRaw.claims?.productionPerformance === false
    && longRunRaw.boundary?.scientificPayloadWriteback === false,
  "longrun-raw-invalid");
  requireValue(longRunBinding?.schema === "mainline-a-web-r65-current-longrun-v648"
    && longRunBinding.status === "verified-current-source-local-longrun"
    && longRunBinding.sourceSha256 === currentSha
    && longRunBinding.buildId === build.buildId
    && longRunBinding.currentSourceLongRuns === 2
    && longRunBinding.issues?.length === 0
    && longRunBinding.claims?.productionPerformance === false
    && longRunBinding.claims?.physicalMobile === false,
  "longrun-binding-invalid");
  requireValue(priorRound?.schema === "mainline-a-r66-web-v649-technical-round"
    && priorRound.sourceSha256 === currentSha
    && priorRound.buildId === build.buildId
    && priorRound.status?.publicWebRelease === "blocked"
    && priorRound.status?.nebulaHumanRightsSigned === "0/12"
    && priorRound.boundary?.scientificPayloadWriteback === false,
  "prior-round-invalid");
  requireValue(priorCodeChange?.schema === "mainline-a-r66-web-v649-code-change"
    && priorCodeChange.sourceSha256 === currentSha
    && priorCodeChange.effectiveCode?.effectiveChangedLinesAtLeast >= 500
    && priorCodeChange.boundary?.scientificPayloadWriteback === false,
  "prior-code-change-invalid");
  return Object.freeze({ sourceSha256: currentSha, buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId, branch: build.branch, head: build.head });
}

async function verifyPreservedBuildId(build) {
  const relative = `${build.distDir}/BUILD_ID`;
  const absolute = path.resolve(ROOT, relative);
  if (!absolute.startsWith(`${path.resolve(ROOT)}${path.sep}`)) fail("build-path-escaped");
  const bytes = await readFile(absolute);
  requireValue(bytes.toString("utf8").trim() === build.buildId,
    "preserved-build-id-mismatch");
  return { path: relative.replaceAll("\\", "/"), bytes: bytes.byteLength,
    sha256: sha256V651(bytes), buildId: build.buildId };
}

export async function buildWebEvidenceSupplementV651() {
  const loaded = Object.fromEntries(await Promise.all(Object.entries(PATHS).map(
    async ([role, relative]) => [role, await pinnedJson(relative, role)])));
  const values = Object.fromEntries(Object.entries(loaded).map(
    ([role, item]) => [role, item.value]));
  const current = await captureBuildInputs();
  const identity = validateWebEvidenceSupplementInputsV651(values, current.sha256);

  const pointerFresh = await auditWebPointerMatrixV649("20261011-v649pointer02");
  replayWebPointerMatrixV649(values.pointer, pointerFresh);
  const pagesFresh = await auditSourcePageLedgerV651(PATHS.sourcePageLedger);
  replaySourcePageAuditV651(values.sourcePageAudit, pagesFresh);
  const linksFresh = await auditPageImageLinkLedgerV652(PATHS.imageLinkLedger);
  replayPageImageLinkAuditV652(values.imageLinkAudit, linksFresh);
  const pixelsFresh = await auditNebulaPixelLinksV653();
  replayNebulaPixelAuditV653(values.pixelLinkAudit, pixelsFresh);
  const imageBatch = verifyBatchFile(ROOT);
  requireValue(imageBatch.status === "passed"
    && imageBatch.recomputed?.total === 6
    && imageBatch.recomputed?.captured === 6
    && imageBatch.recomputed?.sourcePagePending === 6
    && imageBatch.fileSha256 === pagesFresh.inputBatch.sha256
    && imageBatch.boundary?.scientificPayloadWriteback === false,
  "source-page-overlay-image-batch-drift");
  const longRunFresh = await auditWebCurrentLongRunV648(PATHS.build, PATHS.longRunRaw);
  replayWebCurrentLongRunV648(values.longRunBinding, longRunFresh);
  requireValue(values.sourcePageAudit.ledger.sha256 === loaded.sourcePageLedger.pin.sha256,
    "source-ledger-pin-drift");
  requireValue(values.imageLinkAudit.ledger.sha256 === loaded.imageLinkLedger.pin.sha256
    && values.imageLinkAudit.inputPins.pageLedger.sha256
      === loaded.sourcePageLedger.pin.sha256
    && values.imageLinkAudit.inputPins.pageAudit.sha256
      === loaded.sourcePageAudit.pin.sha256,
  "source-image-link-pin-drift");
  requireValue(values.pixelLinkAudit.inputs.linkLedger.sha256
      === loaded.imageLinkLedger.pin.sha256
    && values.pixelLinkAudit.inputs.linkAudit.sha256
      === loaded.imageLinkAudit.pin.sha256,
  "decoded-pixel-link-pin-drift");
  requireValue(values.longRunBinding.rawBrowserReceipt.sha256 === loaded.longRunRaw.pin.sha256
    && values.longRunBinding.buildReceipt.sha256 === loaded.build.pin.sha256,
  "longrun-raw-or-build-pin-drift");
  const buildIdPin = await verifyPreservedBuildId(values.build);
  const observations = values.longRunBinding.observations.map((entry) => ({
    device: entry.device,
    durationMs: entry.observedDurationMs,
    frameSamples: entry.frameSamples,
    frameP95Ms: entry.frameP95Ms,
    memorySamples: entry.memorySamples,
    resourceTotals: entry.resourceTotal,
    visibilityInterruptions: entry.visibilityInterruptions,
  }));
  return Object.freeze({ schema: SCHEMA, status: STATUS,
    deliveryTarget: "next-web-only-local-technical-review",
    ...identity, preservedBuildDirectory: values.build.distDir,
    buildIdPin, evidence: Object.freeze(Object.values(loaded).map((item) => item.pin)),
    imageBatchPin: { path: imageBatch.path,
      sha256: imageBatch.fileSha256,
      rawImagesRecomputed: imageBatch.recomputed.captured,
      generatedSourcePageStatus: "pending-overlay-only" },
    observations: Object.freeze(observations),
    counts: { canonicalPointerRoutesDesktop: 36,
      canonicalPointerRoutesMobileViewport: 36,
      pointerScreenshotHashes: 72,
      officialSourcePagesCaptured: 6,
      sourcePagesLinkedToImageCandidatesByPiaId: 6,
      officialPageJpegsCaptured: 6,
      officialPageJpegsByteIdenticalToImageApi: 1,
      officialPageJpegVariantsPending: 5,
      officialPageJpegsDecodedPixelIdenticalToImageApi: 6,
      localThirtyMinuteObservations: 2,
      nebulaHumanRightsSigned: 0,
      stellarPhysicalComponentIdentitySigned: 0 },
    checks: { static: "current-build-and-hashes-replayed",
      HTTP: "page-health-and-all-static-script-bytes-match-preserved-build",
      visual: "72-candidate-screenshot-hashes-recomputed",
      browser: "72-real-pointer-routes-and-two-independent-long-runs",
      performance: "local-browser-observation-only",
      externalSource: "six-official-pages-and-jpegs-captured-one-byte-identical-six-decoded-pixel-identical-rights-pending" },
    gates: { publicWebRelease: "blocked",
      nebulaRightsSignoff: "pending-0-of-12",
      stellarPhysicalComponentIdentity: "pending-0-of-4",
      rootAppParity: "out-of-scope-for-current-web-only-batch",
      physicalMobile: "not-run" },
    rollback: { previousPreservedBuild: ".next-mainline-a-r66-20261007-v648web01/.next",
      previousBuildRequiresIndependentVerification: true,
      destructiveGitAction: false },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { releaseApproved: false, copyrightApproval: false,
      scientificValidity: false, productionPerformance: false,
      realUserValidation: false, physicalMobile: false } });
}

export function replayWebEvidenceSupplementV651(saved, fresh) {
  if (saved?.schema !== SCHEMA || saved.status !== STATUS
    || fresh.status !== saved.status
    || saved.sourceSha256 !== fresh.sourceSha256
    || saved.buildId !== fresh.buildId
    || !same(saved.buildIdPin, fresh.buildIdPin)
    || !same(saved.imageBatchPin, fresh.imageBatchPin)
    || !same(saved.evidence, fresh.evidence)
    || !same(saved.observations, fresh.observations)
    || !same(saved.counts, fresh.counts)
    || !same(saved.checks, fresh.checks)
    || !same(saved.gates, fresh.gates)
    || !same(saved.boundary, fresh.boundary)
    || !same(saved.claims, fresh.claims)
    || saved.counts.nebulaHumanRightsSigned !== 0
    || saved.counts.stellarPhysicalComponentIdentitySigned !== 0
    || saved.gates.publicWebRelease !== "blocked"
    || saved.claims.releaseApproved !== false
    || saved.claims.productionPerformance !== false
    || saved.boundary.scientificPayloadWriteback !== false) {
    fail("saved-replay-mismatch");
  }
  return Object.freeze({ status: "replayed-candidate-blocked-current-source",
    sourceSha256: fresh.sourceSha256, buildId: fresh.buildId,
    officialSourcePagesCaptured: 6,
    officialPageJpegsByteIdentical: 1,
    officialPageJpegVariantsPending: 5,
    officialPageJpegsDecodedPixelIdentical: 6,
    currentSourceLongRuns: 2,
    publicWebRelease: "blocked" });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputAt = process.argv.indexOf("--output");
  const replayAt = process.argv.indexOf("--replay");
  const output = outputAt < 0 ? null : safeRelative(process.argv[outputAt + 1]);
  const replay = replayAt < 0 ? null : safeRelative(process.argv[replayAt + 1]);
  const fresh = await buildWebEvidenceSupplementV651();
  if (output) await writeFile(path.join(ROOT, output), `${JSON.stringify(fresh, null, 2)}\n`,
    { flag: "wx" });
  if (replay) {
    const saved = JSON.parse(await readFile(path.join(ROOT, replay), "utf8"));
    console.log(JSON.stringify(replayWebEvidenceSupplementV651(saved, fresh), null, 2));
  } else console.log(JSON.stringify({ status: fresh.status,
    sourceSha256: fresh.sourceSha256, buildId: fresh.buildId,
    evidencePins: fresh.evidence.length,
    sourcePages: fresh.counts.officialSourcePagesCaptured,
    currentSourceLongRuns: fresh.counts.localThirtyMinuteObservations }, null, 2));
}

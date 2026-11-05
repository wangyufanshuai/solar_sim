import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { EXACT_AB_FRAMES_V593 } from "../tmp/v593-exact-ab-browser-collector.mjs";

const root = resolve(process.cwd());
const outputDefault = resolve(root, "docs/release/v593/human-visual-signoff-v593.json");
const sourcePath = resolve(root, "docs/release/v593/source-manifest-v593.json");
const manifestPath = resolve(root, "public/data/final-art-direction-v593/manifest.json");
const standaloneBuildPath = resolve(root, "dist/release/atlas-v593-standalone-build-resource.json");
const liteBuildPath = resolve(root, "dist/release/atlas-v593-lite-build-resource.json");
const finalBrowserPath = resolve(root, "docs/release/v593/final-sealed-browser-matrix-v593.json");
const liteBrowserPath = resolve(root, "docs/release/v593/lite-browser-matrix-v593.json");
const SCIENTIFIC_PAYLOAD_SHA256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const PASSES = Object.freeze(["sun", "earth", "jupiter", "saturn", "stellar-archetypes", "deep-sky"]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function argumentValue(name) {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
function assertSeal(document, field, label) {
  const unsigned = { ...document };
  delete unsigned[field];
  assert(document[field] === canonicalSha(unsigned), `v593-human-signoff-seal:${label}`);
}
function safeAbsolute(path, label) {
  const absolute = resolve(root, path);
  const workspacePath = relative(root, absolute);
  assert(
    workspacePath !== ""
      && workspacePath !== ".."
      && !workspacePath.startsWith(`..${sep}`)
      && !isAbsolute(workspacePath)
      && resolve(root, workspacePath) === absolute,
    `v593-human-signoff-boundary:${label}`,
  );
  return absolute;
}
function verifyFile(record, label) {
  assert(
    record
      && typeof record.path === "string"
      && Number.isSafeInteger(record.bytes)
      && record.bytes >= 0
      && typeof record.sha256 === "string"
      && /^[0-9a-f]{64}$/.test(record.sha256),
    `v593-human-signoff-record:${label}`,
  );
  const path = safeAbsolute(record.path, label);
  assert(existsSync(path) && statSync(path).isFile(), `v593-human-signoff-missing:${label}`);
  const bytes = readFileSync(path);
  assert(bytes.byteLength === record.bytes && sha256(bytes) === record.sha256, `v593-human-signoff-drift:${label}`);
  return bytes;
}
function fileRecord(path, format = undefined) {
  const bytes = readFileSync(path);
  return {
    path: relative(root, path).replaceAll("\\", "/"),
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    ...(format ? { format } : {}),
  };
}

const stageDossierArgument = argumentValue("--stage-dossier") ?? process.env.V593_HUMAN_REVIEW_STAGE_DOSSIER;
assert(stageDossierArgument, "v593-human-signoff-stage-dossier-required");
const stageDossierPath = safeAbsolute(stageDossierArgument, "stage-dossier");
const outputPath = safeAbsolute(argumentValue("--output") ?? outputDefault, "output");
const decisionArgument = argumentValue("--decision-file") ?? process.env.V593_HUMAN_DECISION_FILE;
assert(decisionArgument, "v593-human-signoff-user-decision-file-required");
const decisionPath = safeAbsolute(decisionArgument, "decision-file");

const source = readJson(sourcePath);
const manifest = readJson(manifestPath);
const expectedDeploymentId = `v593-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`;
const standaloneBuild = readJson(standaloneBuildPath);
const liteBuild = readJson(liteBuildPath);
const finalBrowser = readJson(finalBrowserPath);
const liteBrowser = readJson(liteBrowserPath);
const stage = readJson(stageDossierPath);
const userDecision = readJson(decisionPath);
for (const [document, field, label] of [
  [source, "receiptSha256", "source"],
  [manifest, "manifestSha256", "manifest"],
  [finalBrowser, "receiptSha256", "final-browser"],
  [liteBrowser, "receiptSha256", "lite-browser"],
  [stage, "receiptSha256", "stage-dossier"],
]) assertSeal(document, field, label);
assertSeal(userDecision, "decisionSha256", "user-decision");
for (const entry of source.files ?? []) verifyFile(entry, `source:${entry.path}`);
assert(
  standaloneBuild.status === "passed"
    && liteBuild.status === "passed"
    && standaloneBuild.deliveryTier === "standalone-full"
    && liteBuild.deliveryTier === "vercel-lite"
    && standaloneBuild.buildId === liteBuild.buildId
    && standaloneBuild.deploymentId === expectedDeploymentId
    && liteBuild.deploymentId === expectedDeploymentId
    && standaloneBuild.candidateSourceManifestSha256 === source.receiptSha256
    && liteBuild.candidateSourceManifestSha256 === source.receiptSha256
    && finalBrowser.version === "v593-final-sealed-browser-matrix-receipt-v1"
    && finalBrowser.status === "passed-sealed-standalone-42-frame-automatic-gates-human-signoff-pending"
    && finalBrowser.candidate?.sourceManifestSha256 === source.receiptSha256
    && finalBrowser.candidate?.manifestSha256 === manifest.manifestSha256
    && finalBrowser.candidate?.deploymentId === expectedDeploymentId
    && finalBrowser.build?.buildId === standaloneBuild.buildId
    && finalBrowser.frames?.length === 42
    && liteBrowser.version === "v593-lite-browser-matrix-v1"
    && liteBrowser.status === "passed-8-frame-lite-automatic-gates-human-signoff-pending"
    && liteBrowser.build?.buildId === liteBuild.buildId
    && liteBrowser.build?.sourceManifestSha256 === source.receiptSha256
    && liteBrowser.build?.manifestSha256 === manifest.manifestSha256
    && liteBrowser.build?.deploymentId === expectedDeploymentId
    && liteBrowser.frames?.length === 8,
  "v593-human-signoff-current-formal-matrix-contract",
);
assert(
  stage.version === "v593-human-visual-signoff-stage-dossier-v1"
    && stage.status === "pending-human-visual-signoff-not-promoted"
    && stage.candidate?.route === "/local-shadow-v593"
    && stage.candidate?.buildId === standaloneBuild.buildId
    && stage.candidate?.deploymentId === expectedDeploymentId
    && typeof stage.candidate?.deploymentId === "string"
    && stage.candidate.deploymentId.length > 0
    && stage.candidate?.sourceManifestSha256 === source.receiptSha256
    && stage.candidate?.manifestSha256 === manifest.manifestSha256
    && stage.candidate?.formalProductPointer === "v263"
    && stage.policy?.sameBuildBeforeAfter === true
    && stage.policy?.currentBuildOnly === true
    && stage.policy?.noHistoricalScreenshotSubstitution === true
    && stage.policy?.fullFrameAndOneToOneRoiRequired === true
    && stage.policy?.exactViewportWithoutClipPaddingRequired === true
    && stage.policy?.scientificPayloadWriteback === false
    && stage.policy?.signaturePassesRequired === PASSES.length
    && stage.policy?.promotion === "staging-only"
    && stage.reviewReadiness?.allAutomaticPassPrerequisitesPassed === true
    && stage.reviewReadiness?.blockedPasses?.length === 0
    && stage.signaturePassesApproved === 0
    && stage.approved === false
    && stage.reviewer === null
    && stage.frames?.length === EXACT_AB_FRAMES_V593.length
    && stage.contactSheets?.length === PASSES.length
    && JSON.stringify(Object.keys(stage.passes ?? {})) === JSON.stringify(PASSES),
  "v593-human-signoff-stage-contract",
);
verifyFile(stage.exactAbStage ?? stage.captureCorrection, "stage-exact-ab-evidence");
if (stage.captureCorrectionLedger) verifyFile(stage.captureCorrectionLedger, "stage-capture-geometry-evidence");
verifyFile(stage.liveTelemetry?.evidence, "stage-live-telemetry");
const liveTelemetry = JSON.parse(verifyFile(stage.liveTelemetry.evidence, "stage-live-telemetry-repeat").toString("utf8"));
assertSeal(liveTelemetry, "receiptSha256", "stage-live-telemetry");
assert(
  liveTelemetry.candidate?.buildId === standaloneBuild.buildId
    && liveTelemetry.candidate?.deploymentId === stage.candidate.deploymentId
    && liveTelemetry.candidate?.sourceManifestSha256 === source.receiptSha256
    && liveTelemetry.candidate?.manifestSha256 === manifest.manifestSha256
    && liveTelemetry.gates?.webglAbCorePassed === true
    && liveTelemetry.gates?.payloadImmutable === true
    && liveTelemetry.gates?.fpsPassed === true
    && liveTelemetry.gates?.gpuPassed === true
    && liveTelemetry.gates?.exactViewportPassed === true
    && liveTelemetry.gates?.pagePixelCoveragePassed === true
    && liveTelemetry.gates?.decodedPixelProvenancePassed === true
    && liveTelemetry.gates?.humanVisualSignoff === false
    && liveTelemetry.authority?.scientificPayloadSha256 === SCIENTIFIC_PAYLOAD_SHA256
    && liveTelemetry.authority?.scientificPayloadWriteback === false,
  "v593-human-signoff-live-telemetry-contract",
);

const finalFrames = new Map(finalBrowser.frames.map((frame) => [frame.matrixId, frame]));
const formalFrames = stage.frames.map((frame) => {
  const expectedFrame = EXACT_AB_FRAMES_V593.find((candidate) => candidate.id === frame.id);
  assert(expectedFrame && expectedFrame.pass === frame.pass && expectedFrame.preset === frame.preset && expectedFrame.mode === frame.mode, `v593-human-signoff-fixed-frame:${frame.id}`);
  const signatureFrame = finalFrames.get(frame.id);
  assert(signatureFrame, `v593-human-signoff-final-frame:${frame.id}`);
  for (const [label, record] of [
    ["baseline", frame.baseline],
    ["signature", frame.signature],
    ["baseline-roi", frame.baselineRoi],
    ["signature-roi", frame.signatureRoi],
  ]) verifyFile(record, `${frame.id}:${label}`);
  assert(
    PASSES.includes(frame.pass)
      && frame.humanReview === "pending"
      && frame.imageProvenance?.decodedPixelsIdenticalToBrowserJpeg === true
      && frame.imageProvenance?.pagePixelCoveragePassed === true
      && frame.telemetry?.baseline?.manifest === manifest.manifestSha256
      && frame.telemetry?.signature?.manifest === manifest.manifestSha256
      && frame.telemetry?.baseline?.payload === SCIENTIFIC_PAYLOAD_SHA256
      && frame.telemetry?.signature?.payload === SCIENTIFIC_PAYLOAD_SHA256
      && frame.telemetry?.baseline?.writeback === "false"
      && frame.telemetry?.signature?.writeback === "false"
      && frame.telemetry?.baseline?.patch === 0
      && frame.telemetry?.signature?.patch > 0
      && frame.telemetry?.signature?.patch === frame.telemetry?.signature?.materials,
    `v593-human-signoff-stage-frame:${frame.id}`,
  );
  return {
    id: frame.id,
    pass: frame.pass,
    baseline: frame.baseline,
    signature: frame.signature,
    baselineRoi: frame.baselineRoi,
    signatureRoi: frame.signatureRoi,
    comparison: frame.comparison,
    matrixId: signatureFrame.matrixId,
    requestedPreset: signatureFrame.requestedPreset,
    actualPreset: signatureFrame.actualPreset,
    requestedMode: signatureFrame.requestedMode,
    actualMode: signatureFrame.actualMode,
    baselineQuery: `/local-shadow-v593?frame=${encodeURIComponent(signatureFrame.requestedPreset)}&mode=${encodeURIComponent(signatureFrame.requestedMode)}&art=baseline`,
    signatureQuery: `/local-shadow-v593?frame=${encodeURIComponent(signatureFrame.actualPreset)}&mode=${encodeURIComponent(signatureFrame.actualMode)}&art=signature`,
    signatureBuild: finalBrowser.build,
    signatureTelemetry: signatureFrame.telemetry,
    liveBrowserAbTelemetry: { id: frame.id, ...frame.telemetry },
    imageProvenance: frame.imageProvenance,
    roiPolicy: frame.roiPolicy,
    scientificPayloadSha256: SCIENTIFIC_PAYLOAD_SHA256,
    scientificPayloadWriteback: false,
    humanReview: "approved",
  };
});

assert(EXACT_AB_FRAMES_V593.length === formalFrames.length && EXACT_AB_FRAMES_V593.every((expected) => formalFrames.some((frame) => frame.id === expected.id)), "v593-human-signoff-fixed-frame-set");

const formalPasses = Object.fromEntries(PASSES.map((name) => {
  const pass = stage.passes[name];
  const frames = formalFrames.filter((frame) => frame.pass === name);
  const runtimeAbGate = frames.every((frame) => (
    frame.liveBrowserAbTelemetry.baseline?.patch === 0
    && frame.liveBrowserAbTelemetry.signature?.patch > 0
    && frame.liveBrowserAbTelemetry.signature?.patch === frame.liveBrowserAbTelemetry.signature?.materials
  ));
  assert(
    pass?.sourceMaterialCorrectness?.startsWith("passed-live-webgl-material")
      && pass.currentBuildBeforeAfter === true
      && pass.payloadStable === true
      && pass.fpsGpuResourceGate === true
      && pass.humanVisualSignoff === "pending"
      && runtimeAbGate,
    `v593-human-signoff-stage-pass:${name}`,
  );
  return [name, {
    frameCount: frames.length,
    sourceMaterialCorrectness: pass.sourceMaterialCorrectness,
    currentBuildBeforeAfter: true,
    cropInspection: "reviewed-one-to-one-source-pixel-roi",
    runtimeAbGate: true,
    payloadStable: true,
    fpsGpuResourceGate: true,
    humanVisualSignoff: "approved",
  }];
}));
for (const sheet of stage.contactSheets) {
  assert(PASSES.includes(sheet.pass), `v593-human-signoff-stage-contact-sheet:${sheet.pass}`);
  verifyFile(sheet.image, `stage-contact-sheet:${sheet.pass}`);
}

const challenge = {
  version: "v593-human-visual-signoff-decision-challenge-v1",
  candidate: {
    buildId: standaloneBuild.buildId,
    deploymentId: stage.candidate.deploymentId,
    sourceManifestSha256: source.receiptSha256,
    manifestSha256: manifest.manifestSha256,
    formalProductPointer: "v263",
  },
  stageReceiptSha256: stage.receiptSha256,
  exactFrameIds: EXACT_AB_FRAMES_V593.map((frame) => frame.id),
  requiredPasses: PASSES,
};
assert(userDecision.version === "v593-human-user-decision-v1", "v593-human-signoff-user-decision-version");
assert(userDecision.decision === "approve-v593-six-of-six" && userDecision.approved === true, "v593-human-signoff-user-decision-explicit");
assert(userDecision.reviewer === "workspace-owner", "v593-human-signoff-user-decision-reviewer");
assert(typeof userDecision.reviewedAt === "string" && Number.isFinite(Date.parse(userDecision.reviewedAt)), "v593-human-signoff-user-decision-reviewed-at");
assert(userDecision.challengeSha256 === canonicalSha(challenge), "v593-human-signoff-user-decision-challenge");
assert(JSON.stringify(Object.keys(userDecision.passes ?? {})) === JSON.stringify(PASSES), "v593-human-signoff-user-decision-pass-order");
for (const pass of PASSES) {
  assert(userDecision.passes[pass]?.decision === "approved", `v593-human-signoff-user-decision-pass:${pass}`);
  assert(typeof userDecision.passes[pass]?.reviewedAt === "string" && Number.isFinite(Date.parse(userDecision.passes[pass].reviewedAt)), `v593-human-signoff-user-decision-pass-time:${pass}`);
}
const reviewedAt = userDecision.reviewedAt;
const reviewer = userDecision.reviewer;

const receipt = {
  version: "v593-human-visual-signoff-dossier-v1",
  generatedAt: reviewedAt,
  reviewedAt,
  status: "approved-v593-six-signature-pass-human-visual-signoff",
  reviewer,
  statement: "The workspace owner approved all six v593 visual signature passes against the current shared-build exact A/B packet. This does not migrate v263, authorize production deployment, or change scientific, measured, or GPU authority.",
  candidate: {
    route: "/local-shadow-v593",
    sourceManifestSha256: source.receiptSha256,
    manifestSha256: manifest.manifestSha256,
    buildId: standaloneBuild.buildId,
    deploymentId: stage.candidate.deploymentId,
    formalProductPointer: "v263",
  },
  policy: {
    sameBuildBeforeAfter: true,
    currentBuildOnly: true,
    noHistoricalScreenshotSubstitution: true,
    fullFrameAnd100PercentCropRequired: true,
    scientificPayloadWriteback: false,
    signaturePassesRequired: PASSES.length,
  },
  sourceStageDossier: fileRecord(stageDossierPath, "json"),
  exactAbStage: stage.exactAbStage ?? stage.captureCorrection,
  ...(stage.captureCorrectionLedger ? { captureCorrectionLedger: stage.captureCorrectionLedger } : {}),
  userDecision: fileRecord(decisionPath, "json"),
  decisionChallengeSha256: canonicalSha(challenge),
  passes: formalPasses,
  frames: formalFrames,
  contactSheets: stage.contactSheets,
  liveBrowserAbTelemetry: {
    evidence: stage.liveTelemetry.evidence,
    status: stage.liveTelemetry.status,
    aggregate: liveTelemetry.aggregate,
    gates: liveTelemetry.gates,
  },
  reviewReadiness: { allAutomaticPassPrerequisitesPassed: true, blockedPasses: [] },
  reviewerChecklist: PASSES.map((pass) => ({ pass, decision: "approved", reviewer, reviewedAt, notes: null })),
  signaturePassesApproved: PASSES.length,
  approved: true,
  authority: {
    scientificPayloadSha256: SCIENTIFIC_PAYLOAD_SHA256,
    scientificPayloadWriteback: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    productionReleaseAuthorized: false,
  },
};
receipt.receiptSha256 = canonicalSha(receipt);
await mkdir(dirname(outputPath), { recursive: true });
const partialPath = `${outputPath}.${process.pid}.part`;
await rm(partialPath, { force: true });
await writeFile(partialPath, `${JSON.stringify(receipt, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
await rename(partialPath, outputPath);
console.log(JSON.stringify({
  status: receipt.status,
  reviewer: receipt.reviewer,
  reviewedAt: receipt.reviewedAt,
  signaturePassesApproved: receipt.signaturePassesApproved,
  sourceManifestSha256: receipt.candidate.sourceManifestSha256,
  manifestSha256: receipt.candidate.manifestSha256,
  buildId: receipt.candidate.buildId,
  receiptSha256: receipt.receiptSha256,
  productionReleaseAuthorized: false,
}, null, 2));

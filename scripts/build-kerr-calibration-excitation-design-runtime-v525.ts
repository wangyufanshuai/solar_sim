import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "../app/lib/atlasResourceLifecycle";
import {
  getKerrCalibrationExcitationDesignSnapshotV525,
  getKerrCalibrationExcitationDesignTelemetryV525,
  loadKerrCalibrationExcitationDesignSummaryV525,
  resetKerrCalibrationExcitationDesignClientForTestsV525,
  subscribeKerrCalibrationExcitationDesignV525,
} from "../app/lib/kerrCalibrationExcitationDesignClientV525";
import {
  KERR_CALIBRATION_EXCITATION_DESIGN_ARTIFACT_MAX_BYTES_V525,
  loadKerrCalibrationExcitationDesignV525,
  resetKerrCalibrationExcitationDesignServerCacheForTestsV525,
} from "../app/lib/kerrCalibrationExcitationDesignServerV525";
import {
  KERR_CALIBRATION_EXCITATION_DESIGN_API_VERSION_V525,
  compareKerrCalibrationDesignHudEncodingsV525,
  createKerrCalibrationDesignHudEncodingV525,
  parseKerrCalibrationExcitationDesignArtifactV525,
  resolveKerrCalibrationDesignHudProfileV525,
} from "../app/lib/kerrCalibrationExcitationDesignV525";

const root = process.cwd();
const paths = {
  artifact: "dist/science/kerr-calibration-excitation-design-v525/design.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v524-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v524.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  intake: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-calibration-excitation-design-v525/runtime-audit.json",
} as const;
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const text = (path: string) => bytes(path).toString("utf8");
const read = (path: string) => JSON.parse(text(path));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !transient.has(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

async function main() {
  const artifact = parseKerrCalibrationExcitationDesignArtifactV525(read(paths.artifact));
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const detector = read(paths.detector);
  const intake = read(paths.intake);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    sha(artifact) !== artifact.artifactSha256
    || previousEvidence.version !== "orbit-atlas-shadow-v524-evidence-v1"
    || sha(previousEvidence) !== previousEvidence.evidenceSha256
    || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v524"
    || sha(previousPointer) !== previousPointer.pointerSha256
    || detector.counts.measuredCalibrationFiles !== 0
    || detector.counts.requiredMeasuredCalibrationFiles !== 6
    || intake.contract.requiredFileCount !== 6
    || intake.inspect.readyFileCount !== 0
    || intake.inspect.attemptConsumed !== false
    || dense.status !== "incomplete-0-of-49"
    || dense.completedShardCount !== 0
    || dense.attemptConsumed !== false
    || dense.aggregateAvailable !== false
    || formal.version !== "v263-current-product-evidence-pointer"
    || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
    || formalEvidence.contracts?.singleCanvas !== true
    || formalEvidence.contracts?.legacyRootAttributes !== 603
    || formalEvidence.contracts?.evidenceLedgerClaims !== 84
  ) throw new Error("v525-runtime-upstream-boundary");

  resetKerrCalibrationExcitationDesignServerCacheForTestsV525();
  const firstServerLoad = await loadKerrCalibrationExcitationDesignV525();
  const secondServerLoad = await loadKerrCalibrationExcitationDesignV525();
  if (
    firstServerLoad !== secondServerLoad
    || firstServerLoad.artifact.artifactSha256 !== artifact.artifactSha256
    || firstServerLoad.export.bytes.byteLength > KERR_CALIBRATION_EXCITATION_DESIGN_ARTIFACT_MAX_BYTES_V525
  ) throw new Error("v525-runtime-server-boundary");
  const body = JSON.stringify({
    version: KERR_CALIBRATION_EXCITATION_DESIGN_API_VERSION_V525,
    available: true,
    reason: "ready",
    summary: firstServerLoad.summary,
  });
  if (Buffer.byteLength(body) > 128 * 1024) throw new Error("v525-runtime-summary-size");

  const scienceEncoding = createKerrCalibrationDesignHudEncodingV525(firstServerLoad.summary, "science");
  const cinematicEncoding = createKerrCalibrationDesignHudEncodingV525(firstServerLoad.summary, "cinematic");
  const encodingAudit = compareKerrCalibrationDesignHudEncodingsV525(scienceEncoding, cinematicEncoding);
  const scienceProfile = resolveKerrCalibrationDesignHudProfileV525("science");
  const cinematicProfile = resolveKerrCalibrationDesignHudProfileV525("cinematic");
  if (
    scienceProfile !== resolveKerrCalibrationDesignHudProfileV525("science")
    || cinematicProfile !== resolveKerrCalibrationDesignHudProfileV525("cinematic")
    || scienceProfile.scienceBoundary.bloomIntensity !== 0
    || scienceProfile.scienceBoundary.colorGradeIntensity !== 0
    || encodingAudit.scientificPayloadStable !== true
    || encodingAudit.scientificRowsStable !== true
    || encodingAudit.numericScientificStyleInputCount !== 0
  ) throw new Error("v525-runtime-profile-boundary");

  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  resetKerrCalibrationExcitationDesignClientForTestsV525();
  const baseline = getAtlasResourceSnapshot();
  let notifications = 0;
  const releases = [
    subscribeKerrCalibrationExcitationDesignV525(() => { notifications += 1; }),
    subscribeKerrCalibrationExcitationDesignV525(() => { notifications += 1; }),
  ];
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const automaticRequestCount = requests.length;
  let first;
  let second;
  try {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requests.push(String(input));
      return new Response(body, { status: 200 });
    }) as typeof fetch;
    [first, second] = await Promise.all([
      loadKerrCalibrationExcitationDesignSummaryV525(),
      loadKerrCalibrationExcitationDesignSummaryV525(),
    ]);
  } finally {
    releases.forEach((release) => release());
    releases.forEach((release) => release());
    globalThis.fetch = originalFetch;
  }
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const telemetry = getKerrCalibrationExcitationDesignTelemetryV525();
  const snapshot = getKerrCalibrationExcitationDesignSnapshotV525();
  if (
    automaticRequestCount !== 0
    || requests.length !== 1
    || first !== second
    || first?.artifactSha256 !== artifact.artifactSha256
    || notifications !== 4
    || peak.subscriptions !== 2
    || telemetry.listenerCount !== 0
    || telemetry.requestCount !== 1
    || telemetry.status !== "ready"
    || telemetry.sceneRevisionDelta !== 0
    || telemetry.scientificFieldMutationAllowed !== false
    || snapshot.status !== "ready"
    || finalDiff.status !== "baseline"
  ) throw new Error("v525-runtime-client-boundary");
  resetKerrCalibrationExcitationDesignClientForTestsV525();

  const component = text("app/components/KerrCalibrationExcitationDesignV525.tsx");
  const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV525.tsx");
  const route = text("app/api/atlas/relativity-evidence/v525/calibration-excitation-design/route.ts");
  const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
  if (
    !component.includes("compareKerrCalibrationDesignHudEncodingsV525")
    || !component.includes("两者不是同一计数")
    || component.includes("Math.random")
    || component.includes("<canvas")
    || component.includes("锟")
    || !wrapper.includes('import("./KerrCalibrationExcitationDesignV525")')
    || wrapper.includes("fetch(")
    || wrapper.includes("锟")
    || !route.includes('delivery !== "local-shadow"')
    || !route.includes('"Cache-Control": "no-store"')
    || !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV525"')
  ) throw new Error("v525-runtime-source-boundary");

  const sourcePaths = [
    paths.artifact,
    paths.previousEvidence,
    paths.previousPointer,
    paths.detector,
    paths.intake,
    paths.dense,
    paths.formal,
    "app/lib/kerrCalibrationExcitationDesignV525.ts",
    "app/lib/kerrCalibrationExcitationDesignV525.test.ts",
    "app/lib/kerrCalibrationExcitationDesignServerV525.ts",
    "app/lib/kerrCalibrationExcitationDesignServerV525.test.ts",
    "app/lib/kerrCalibrationExcitationDesignClientV525.ts",
    "app/lib/kerrCalibrationExcitationDesignClientV525.test.ts",
    "app/api/atlas/relativity-evidence/v525/calibration-excitation-design/route.ts",
    "app/api/atlas/relativity-evidence/v525/calibration-excitation-design/route.test.ts",
    "app/components/KerrCalibrationExcitationDesignV525.tsx",
    "app/components/KerrCalibrationExcitationDesignV525.test.tsx",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV525.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV525.test.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV525.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV525.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/run-kerr-calibration-excitation-design-v525.py",
    "scripts/test-kerr-calibration-excitation-design-v525.py",
    "scripts/build-kerr-calibration-excitation-design-runtime-v525.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const unsigned = {
    version: "v525-kerr-calibration-excitation-design-runtime-audit-v1",
    generatedAt: "2026-08-02T00:00:00Z",
    status: "calibration-design-runtime-qualified-v7r4-science-cinematic-payload-stable",
    source: {
      designArtifactSha256: artifact.artifactSha256,
      v524EvidenceSha256: previousEvidence.evidenceSha256,
      v524PointerSha256: previousPointer.pointerSha256,
      v314StateSha256: dense.stateSha256,
    },
    runtime: {
      serverFileBytes: firstServerLoad.export.bytes.byteLength,
      summaryResponseBytes: Buffer.byteLength(body),
      serverFingerprintCacheHit: firstServerLoad === secondServerLoad,
      automaticRequestCount,
      explicitRequestCount: requests.length,
      singleFlightConsumerCount: 2,
      notificationCount: notifications,
      peakSubscriptionCount: peak.subscriptions,
      finalSubscriptionCount: finalDiff.subscriptions,
      finalObjectUrlCount: finalDiff.objectUrls,
      finalResourceStatus: finalDiff.status,
      responseCachePolicy: "no-store",
      artifactMaximumBytes: KERR_CALIBRATION_EXCITATION_DESIGN_ARTIFACT_MAX_BYTES_V525,
      summaryMaximumBytes: 128 * 1024,
      localShadowOnly: true,
    },
    visualProfile: {
      profileId: scienceProfile.id,
      scienceLinearDisplay: scienceProfile.scienceBoundary.linearDisplay,
      scienceBloomIntensity: scienceProfile.scienceBoundary.bloomIntensity,
      scienceColorGradeIntensity: scienceProfile.scienceBoundary.colorGradeIntensity,
      cinematicBloomIntensity: cinematicProfile.scienceBoundary.bloomIntensity,
      cinematicColorGradeIntensity: cinematicProfile.scienceBoundary.colorGradeIntensity,
      cinematicSeed: cinematicProfile.cinematicSeed,
      scientificPayloadStable: encodingAudit.scientificPayloadStable,
      scientificRowsStable: encodingAudit.scientificRowsStable,
      numericScientificStyleInputCount: encodingAudit.numericScientificStyleInputCount,
      rankDrivesStyle: false,
      conditionNumberDrivesStyle: false,
      determinantDrivesStyle: false,
      nullityDrivesStyle: false,
      scientificFieldMutation: false,
    },
    selectedDesign: artifact.selectedDesign,
    acquisitionBoundary: artifact.acquisitionBoundary,
    counts: artifact.counts,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
    sourceManifest,
    sourceSha256: sha(sourceManifest),
  };
  const audit = { ...unsigned, artifactSha256: sha(unsigned) };
  atomic(paths.output, audit);
  console.log(JSON.stringify({
    status: audit.status,
    artifactSha256: audit.artifactSha256,
    designSha256: artifact.artifactSha256,
    candidatePairs: artifact.counts.candidatePairCount,
    fullRankPairs: artifact.counts.fullRankPairCount,
    selectedConstraints: artifact.selectedDesign.constraintIds,
    automaticRequests: audit.runtime.automaticRequestCount,
    explicitRequests: audit.runtime.explicitRequestCount,
    finalResourceStatus: audit.runtime.finalResourceStatus,
    scientificRowsStable: audit.visualProfile.scientificRowsStable,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

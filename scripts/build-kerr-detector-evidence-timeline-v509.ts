import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  getKerrTopologyDetectorAdmissionTelemetryV509,
  loadKerrTopologyDetectorAdmissionSummaryV501,
  resetKerrTopologyDetectorAdmissionClientForTestsV501,
  subscribeKerrTopologyDetectorAdmissionV501,
} from "../app/lib/kerrTopologyDetectorAdmissionClientV501";
import {
  getAtlasCalibrationEvidenceTelemetryV508,
  loadAtlasCalibrationPreflightV508,
  loadAtlasCalibrationReadinessV508,
  resetAtlasCalibrationEvidenceClientForTestsV508,
  subscribeAtlasCalibrationPreflightV508,
  subscribeAtlasCalibrationReadinessV508,
} from "../app/lib/atlasCalibrationEvidenceClientV508";
import {
  getAtlasCalibrationHudModeSnapshotV506,
  resetAtlasCalibrationHudModeStoreForTestsV506,
  setAtlasCalibrationHudModeV506,
  subscribeAtlasCalibrationHudModeV506,
} from "../app/lib/atlasCalibrationHudModeStoreV506";
import {
  createKerrTopologyDetectorAdmissionSummaryV501,
  KERR_TOPOLOGY_DETECTOR_ADMISSION_API_VERSION_V501,
} from "../app/lib/kerrTopologyDetectorAdmissionV501";
import {
  createKerrMeasuredCalibrationReadinessSummaryV503,
  KERR_MEASURED_CALIBRATION_READINESS_API_VERSION_V503,
} from "../app/lib/kerrMeasuredCalibrationReadinessV503";
import {
  createKerrMeasuredCalibrationPreflightSummaryV504,
  KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504,
} from "../app/lib/kerrMeasuredCalibrationPreflightV504";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";

const root = process.cwd();
const paths = Object.freeze({
  admission:
    "dist/science/kerr-topology-detector-admission-v501/admission-bridge.json",
  readiness:
    "dist/science/kerr-measured-calibration-readiness-v503/readiness.json",
  preflight:
    "dist/science/kerr-measured-calibration-preflight-v504/preflight.json",
  v508Replay:
    "dist/science/atlas-calibration-evidence-replay-v508/replay-audit.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v508-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v508.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-detector-evidence-timeline-v509/timeline-audit.json",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "stageChainSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const text = (path: string) => bytes(path).toString("utf8");
const fileSha = (path: string) =>
  createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

async function main(): Promise<void> {
  const admissionArtifact = read(paths.admission);
  const readinessArtifact = read(paths.readiness);
  const preflightArtifact = read(paths.preflight);
  const v508Replay = read(paths.v508Replay);
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    admissionArtifact.version !== "v501-kerr-topology-detector-admission-artifact-v1" ||
    sha(admissionArtifact) !== admissionArtifact.artifactSha256 ||
    readinessArtifact.version !== "v503-kerr-measured-calibration-readiness-artifact-v1" ||
    sha(readinessArtifact) !== readinessArtifact.artifactSha256 ||
    preflightArtifact.version !== "v504-kerr-measured-calibration-preflight-v1" ||
    sha(preflightArtifact) !== preflightArtifact.artifactSha256 ||
    v508Replay.version !== "v508-atlas-calibration-evidence-replay-audit-v1" ||
    sha(v508Replay) !== v508Replay.artifactSha256 ||
    previousEvidence.version !== "orbit-atlas-shadow-v508-evidence-v1" ||
    sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
    previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v508" ||
    sha(previousPointer) !== previousPointer.pointerSha256 ||
    dense.status !== "incomplete-0-of-49" ||
    dense.completedShardCount !== 0 ||
    dense.attemptConsumed !== false ||
    formal.version !== "v263-current-product-evidence-pointer" ||
    formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
    formalEvidence.contracts?.singleCanvas !== true ||
    formalEvidence.contracts?.legacyRootAttributes !== 603 ||
    formalEvidence.contracts?.evidenceLedgerClaims !== 84
  ) {
    throw new Error("v509-upstream-boundary");
  }

  const summaries = Object.freeze({
    admission: createKerrTopologyDetectorAdmissionSummaryV501(admissionArtifact),
    readiness: createKerrMeasuredCalibrationReadinessSummaryV503(readinessArtifact),
    preflight: createKerrMeasuredCalibrationPreflightSummaryV504(preflightArtifact),
  });
  const bodies = Object.freeze({
    admission: JSON.stringify({
      version: KERR_TOPOLOGY_DETECTOR_ADMISSION_API_VERSION_V501,
      available: true,
      reason: "ready",
      summary: summaries.admission,
    }),
    readiness: JSON.stringify({
      version: KERR_MEASURED_CALIBRATION_READINESS_API_VERSION_V503,
      available: true,
      reason: "ready",
      summary: summaries.readiness,
    }),
    preflight: JSON.stringify({
      version: KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504,
      available: true,
      reason: "ready",
      summary: summaries.preflight,
    }),
  });
  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    requests.push(url);
    const body = url.includes("v501")
      ? bodies.admission
      : url.includes("v503")
        ? bodies.readiness
        : bodies.preflight;
    return new Response(body, { status: 200 });
  }) as typeof fetch;

  resetKerrTopologyDetectorAdmissionClientForTestsV501();
  resetAtlasCalibrationEvidenceClientForTestsV508();
  resetAtlasCalibrationHudModeStoreForTestsV506();
  const baselineResources = getAtlasResourceSnapshot();
  const notifications = { admission: 0, readiness: 0, preflight: 0, mode: 0 };
  const releases = [
    subscribeKerrTopologyDetectorAdmissionV501(() => {
      notifications.admission += 1;
    }),
    subscribeAtlasCalibrationReadinessV508(() => {
      notifications.readiness += 1;
    }),
    subscribeAtlasCalibrationPreflightV508(() => {
      notifications.preflight += 1;
    }),
    subscribeAtlasCalibrationHudModeV506(() => {
      notifications.mode += 1;
    }),
  ];
  const peakResources = getAtlasResourceSnapshot();
  const peakDiff = diffAtlasResourceSnapshotsV300(baselineResources, peakResources);
  const automaticRequestCount = requests.length;
  const [admissionLoaded, readinessLoaded, preflightLoaded] = await Promise.all([
    loadKerrTopologyDetectorAdmissionSummaryV501(),
    loadAtlasCalibrationReadinessV508(),
    loadAtlasCalibrationPreflightV508(),
  ]);
  setAtlasCalibrationHudModeV506("cinematic");
  releases.forEach((release) => release());
  releases[0]();
  const finalResources = getAtlasResourceSnapshot();
  const finalDiff = diffAtlasResourceSnapshotsV300(baselineResources, finalResources);
  const admissionTelemetry = getKerrTopologyDetectorAdmissionTelemetryV509();
  const calibrationTelemetry = getAtlasCalibrationEvidenceTelemetryV508();
  const finalMode = getAtlasCalibrationHudModeSnapshotV506();
  globalThis.fetch = originalFetch;

  if (
    automaticRequestCount !== 0 ||
    requests.length !== 3 ||
    requests.filter((url) => url.includes("v501")).length !== 1 ||
    requests.filter((url) => url.includes("v503")).length !== 1 ||
    requests.filter((url) => url.includes("v504")).length !== 1 ||
    admissionLoaded.decision.admitted !== false ||
    readinessLoaded.decision.admitted !== false ||
    preflightLoaded.decision.measuredDetectorAuthorityGranted !== false ||
    peakDiff.subscriptions !== 4 ||
    peakDiff.total !== 4 ||
    notifications.admission !== 2 ||
    notifications.readiness !== 2 ||
    notifications.preflight !== 2 ||
    notifications.mode !== 1 ||
    admissionTelemetry.listenerCount !== 0 ||
    admissionTelemetry.requestCount !== 1 ||
    calibrationTelemetry.totalListenerCount !== 0 ||
    calibrationTelemetry.totalRequestCount !== 2 ||
    finalMode.mode !== "cinematic" ||
    finalMode.hudRevision !== 1 ||
    finalDiff.status !== "baseline" ||
    finalDiff.subscriptions !== 0 ||
    finalDiff.identityChanged !== false ||
    finalDiff.ownerChanged !== false
  ) {
    throw new Error("v509-timeline-replay-boundary");
  }
  resetKerrTopologyDetectorAdmissionClientForTestsV501();
  resetAtlasCalibrationEvidenceClientForTestsV508();
  resetAtlasCalibrationHudModeStoreForTestsV506();

  const sourceFiles = Object.freeze({
    timeline: "app/components/KerrDetectorEvidenceTimelineV509.tsx",
    wrapper: "app/components/KerrPhotonMetrologyObservatoryIntentV509.tsx",
    workbench: "app/components/RelativityResearchWorkbenchV280.tsx",
    admissionClient: "app/lib/kerrTopologyDetectorAdmissionClientV501.ts",
    calibrationClient: "app/lib/atlasCalibrationEvidenceClientV508.ts",
    appShell: "app/components/AtlasAppShell.tsx",
  });
  const sources = Object.fromEntries(
    Object.entries(sourceFiles).map(([id, path]) => [id, text(path)]),
  ) as Record<keyof typeof sourceFiles, string>;
  if (
    !sources.timeline.includes('data-atlas-v509-automatic-request-count="0"') ||
    !sources.timeline.includes('data-atlas-v509-subscription-count="4"') ||
    sources.timeline.includes("useEffect") ||
    sources.timeline.includes("fetch(") ||
    !sources.wrapper.includes('data-atlas-v509-detail-catalog-size') ||
    !sources.wrapper.includes('data-atlas-v509-static-network-budget="0"') ||
    !sources.workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV509"') ||
    !sources.admissionClient.includes('acquireAtlasResource(\n    "subscription"') ||
    !sources.calibrationClient.includes('acquireAtlasResource(\n        "subscription"') ||
    sources.appShell.includes("KerrDetectorEvidenceTimelineV509") ||
    [sources.timeline, sources.wrapper, sources.admissionClient, sources.calibrationClient].some(
      (source) =>
        source.includes("Math.random") ||
        source.includes("<canvas") ||
        source.includes("physicsEngine") ||
        source.includes("setSceneRevision"),
    )
  ) {
    throw new Error("v509-runtime-source-boundary");
  }

  const sourcePaths = [
    paths.admission,
    paths.readiness,
    paths.preflight,
    paths.v508Replay,
    paths.previousEvidence,
    paths.previousPointer,
    paths.dense,
    paths.formal,
    ...Object.values(sourceFiles),
    "app/components/KerrDetectorEvidenceTimelineV509.test.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV509.test.tsx",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV509.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV509.test.ts",
    "app/lib/kerrTopologyDetectorAdmissionClientV501.test.ts",
    "app/lib/atlasCalibrationEvidenceClientV508.test.ts",
    "app/lib/atlasCalibrationHudModeStoreV506.ts",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/build-kerr-detector-evidence-timeline-v509.ts",
  ];
  const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
  const unsigned = {
    version: "v509-kerr-detector-evidence-timeline-audit-v1",
    generatedAt: "2026-08-01T00:00:00Z",
    status: "three-stage-detector-evidence-timeline-qualified-browser-pending",
    source: {
      v501AdmissionArtifactSha256: admissionArtifact.artifactSha256,
      v503ReadinessArtifactSha256: readinessArtifact.artifactSha256,
      v504PreflightArtifactSha256: preflightArtifact.artifactSha256,
      v508ReplayArtifactSha256: v508Replay.artifactSha256,
      v508EvidenceSha256: previousEvidence.evidenceSha256,
      v508PointerSha256: previousPointer.pointerSha256,
    },
    timeline: {
      stageCount: 3,
      stages: ["detector-admission", "calibration-readiness", "candidate-preflight"],
      evidenceSubscriptionCount: 3,
      modeSubscriptionCount: 1,
      totalSubscriptionCount: 4,
      automaticRequestCount,
      explicitRequestCount: requests.length,
      requestCounts: { admission: 1, readiness: 1, preflight: 1 },
      finalMode: finalMode.mode,
      finalHudRevision: finalMode.hudRevision,
    },
    stageSnapshots: {
      admission: {
        artifactSha256: admissionLoaded.artifactSha256,
        requestCount: admissionTelemetry.requestCount,
        responseBytes: admissionTelemetry.responseBytes,
        admitted: false,
        reason: admissionLoaded.decision.reason,
      },
      readiness: {
        artifactSha256: readinessLoaded.artifactSha256,
        requestCount: calibrationTelemetry.readiness.requestCount,
        responseBytes: calibrationTelemetry.readiness.responseBytes,
        measuredFiles: "0/6",
        admitted: false,
      },
      preflight: {
        artifactSha256: preflightLoaded.artifactSha256,
        requestCount: calibrationTelemetry.preflight.requestCount,
        responseBytes: calibrationTelemetry.preflight.responseBytes,
        bytesRead: preflightLoaded.observation.bytesRead,
        authorityGranted: false,
      },
    },
    scienceBoundary: {
      detectorAuthority: false,
      detectorResponse: "unavailable",
      observedCounts: "unavailable",
      observedIntensity: "unavailable",
      scienceRaster: "unavailable",
      sciencePixelRows: 0,
      scientificFieldMutationAllowed: false,
      sceneRevisionDelta: 0,
    },
    resources: {
      peakSubscriptionDelta: peakDiff.subscriptions,
      peakTotalDelta: peakDiff.total,
      finalDiff,
      returnedToBaseline: true,
    },
    runtime: {
      detailCatalogSize: 11,
      concurrentDetailBudget: 1,
      publicPanelIdAdded: false,
      appShellSubscription: false,
      canvasCreated: false,
      physicsMutationAllowed: false,
    },
    qualification: {
      threeStageTimeline: "qualified",
      explicitLoadBoundary: "qualified",
      singleFlightChannels: "qualified-3",
      dynamicShaVisibility: "qualified",
      subscriptionRegistry: "qualified",
      lifecycleBaseline: "qualified",
      browser: "not-run",
      visualMatrix: "not-run",
      soak: "not-run",
    },
    sourceManifest,
    sourceSha256: sha(sourceManifest),
    release: {
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      ordinaryStandaloneProfile: "legacy-v9",
      liteProfile: "legacy-v9",
      localShadowDefaultProfile: "legacy-v9",
      localShadowDefaultApplied: false,
    },
    denseCampaignStatus: "incomplete-0-of-49",
    formalDefaultKernel: "legacy-eih-1pn",
    boundary:
      "v509-explicit-three-stage-detector-evidence-timeline-four-registry-tracked-subscriptions-zero-automatic-three-explicit-single-flight-requests-dynamic-sha-final-baseline-zero-authority-science-field-app-shell-canvas-scene-physics-or-default-mutation",
  };
  const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
  atomic(paths.output, artifact);
  console.log(
    JSON.stringify(
      {
        status: artifact.status,
        artifactSha256: artifact.artifactSha256,
        stages: 3,
        subscriptions: 4,
        automaticRequests: 0,
        explicitRequests: "1/1/1",
        finalMode: artifact.timeline.finalMode,
        finalResourceStatus: artifact.resources.finalDiff.status,
        detectorAuthority: false,
        browserQualification: "not-run",
        denseCampaign: "0/49",
      },
      null,
      2,
    ),
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

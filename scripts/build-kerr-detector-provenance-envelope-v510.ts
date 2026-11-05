import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  getAtlasCalibrationPreflightSnapshotV508,
  getAtlasCalibrationReadinessSnapshotV508,
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
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  acquireKerrDetectorProvenanceExportV510,
  createKerrDetectorProvenanceEnvelopeV510,
  serializeKerrDetectorProvenanceCsvV510,
  serializeKerrDetectorProvenanceJsonV510,
} from "../app/lib/kerrDetectorProvenanceEnvelopeV510";
import {
  createKerrMeasuredCalibrationPreflightSummaryV504,
  KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504,
} from "../app/lib/kerrMeasuredCalibrationPreflightV504";
import {
  createKerrMeasuredCalibrationReadinessSummaryV503,
  KERR_MEASURED_CALIBRATION_READINESS_API_VERSION_V503,
} from "../app/lib/kerrMeasuredCalibrationReadinessV503";
import {
  createKerrTopologyDetectorAdmissionSummaryV501,
  KERR_TOPOLOGY_DETECTOR_ADMISSION_API_VERSION_V501,
} from "../app/lib/kerrTopologyDetectorAdmissionV501";
import {
  getKerrTopologyDetectorAdmissionSnapshotV501,
  loadKerrTopologyDetectorAdmissionSummaryV501,
  resetKerrTopologyDetectorAdmissionClientForTestsV501,
  subscribeKerrTopologyDetectorAdmissionV501,
} from "../app/lib/kerrTopologyDetectorAdmissionClientV501";

const root = process.cwd();
const paths = Object.freeze({
  admission: "dist/science/kerr-topology-detector-admission-v501/admission-bridge.json",
  readiness: "dist/science/kerr-measured-calibration-readiness-v503/readiness.json",
  preflight: "dist/science/kerr-measured-calibration-preflight-v504/preflight.json",
  previousTimeline: "dist/science/kerr-detector-evidence-timeline-v509/timeline-audit.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v509-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v509.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-detector-provenance-envelope-v510/envelope-audit.json",
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
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
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
  const previousTimeline = read(paths.previousTimeline);
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    sha(admissionArtifact) !== admissionArtifact.artifactSha256 ||
    sha(readinessArtifact) !== readinessArtifact.artifactSha256 ||
    sha(preflightArtifact) !== preflightArtifact.artifactSha256 ||
    previousTimeline.version !== "v509-kerr-detector-evidence-timeline-audit-v1" ||
    sha(previousTimeline) !== previousTimeline.artifactSha256 ||
    previousEvidence.version !== "orbit-atlas-shadow-v509-evidence-v1" ||
    sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
    previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v509" ||
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
    throw new Error("v510-upstream-boundary");
  }

  const summaries = Object.freeze({
    admission: createKerrTopologyDetectorAdmissionSummaryV501(admissionArtifact),
    readiness: createKerrMeasuredCalibrationReadinessSummaryV503(readinessArtifact),
    preflight: createKerrMeasuredCalibrationPreflightSummaryV504(preflightArtifact),
  });
  const responseBodies = Object.freeze({
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
      ? responseBodies.admission
      : url.includes("v503")
        ? responseBodies.readiness
        : responseBodies.preflight;
    return new Response(body, { status: 200 });
  }) as typeof fetch;

  resetKerrTopologyDetectorAdmissionClientForTestsV501();
  resetAtlasCalibrationEvidenceClientForTestsV508();
  resetAtlasCalibrationHudModeStoreForTestsV506();
  const baseline = getAtlasResourceSnapshot();
  const releases = [
    subscribeKerrTopologyDetectorAdmissionV501(() => undefined),
    subscribeAtlasCalibrationReadinessV508(() => undefined),
    subscribeAtlasCalibrationPreflightV508(() => undefined),
    subscribeAtlasCalibrationHudModeV506(() => undefined),
  ];
  const subscriptionPeak = diffAtlasResourceSnapshotsV300(
    baseline,
    getAtlasResourceSnapshot(),
  );
  const automaticRequestCount = requests.length;
  await loadKerrTopologyDetectorAdmissionSummaryV501();
  await loadAtlasCalibrationReadinessV508();
  await loadAtlasCalibrationPreflightV508();
  const envelope = await createKerrDetectorProvenanceEnvelopeV510(
    getKerrTopologyDetectorAdmissionSnapshotV501(),
    getAtlasCalibrationReadinessSnapshotV508(),
    getAtlasCalibrationPreflightSnapshotV508(),
  );
  const jsonText = serializeKerrDetectorProvenanceJsonV510(envelope);
  const csvText = serializeKerrDetectorProvenanceCsvV510(envelope);
  const jsonExport = acquireKerrDetectorProvenanceExportV510(envelope, "json");
  const csvExport = acquireKerrDetectorProvenanceExportV510(envelope, "csv");
  const exportPeak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  jsonExport.release();
  jsonExport.release();
  csvExport.release();
  csvExport.release();
  setAtlasCalibrationHudModeV506("cinematic");
  releases.forEach((release) => release());
  releases[0]();
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const finalMode = getAtlasCalibrationHudModeSnapshotV506();
  globalThis.fetch = originalFetch;

  if (
    automaticRequestCount !== 0 ||
    requests.length !== 3 ||
    requests.filter((url) => url.includes("v501")).length !== 1 ||
    requests.filter((url) => url.includes("v503")).length !== 1 ||
    requests.filter((url) => url.includes("v504")).length !== 1 ||
    subscriptionPeak.total !== 4 ||
    subscriptionPeak.subscriptions !== 4 ||
    exportPeak.total !== 6 ||
    exportPeak.subscriptions !== 4 ||
    exportPeak.objectUrls !== 2 ||
    envelope.status !== "portable-provenance-qualified-detector-authority-blocked" ||
    envelope.chain.readyStageCount !== 3 ||
    envelope.chain.requestedStageCount !== 3 ||
    envelope.authority.measuredCalibrationFiles !== "0/6" ||
    envelope.authority.measuredDetectorAuthorityGranted !== false ||
    envelope.authority.scienceRasterAvailable !== false ||
    envelope.authority.denseCampaignStatus !== "incomplete-0-of-49" ||
    envelope.boundary.automaticRequestCount !== 0 ||
    envelope.boundary.formalProductPointer !== "v263" ||
    envelope.boundary.formalDefaultKernel !== "legacy-eih-1pn" ||
    jsonText.includes('"pid":') ||
    jsonText.includes('"rawFileContents":') ||
    csvText.trim().split("\n").length !== 4 ||
    finalMode.mode !== "cinematic" ||
    finalDiff.status !== "baseline" ||
    finalDiff.total !== 0 ||
    finalDiff.objectUrls !== 0 ||
    finalDiff.subscriptions !== 0
  ) {
    throw new Error("v510-dynamic-envelope-boundary");
  }
  resetKerrTopologyDetectorAdmissionClientForTestsV501();
  resetAtlasCalibrationEvidenceClientForTestsV508();
  resetAtlasCalibrationHudModeStoreForTestsV506();

  const sourcePaths = [
    "app/lib/kerrDetectorProvenanceEnvelopeV510.ts",
    "app/lib/kerrDetectorProvenanceEnvelopeV510.test.ts",
    "app/components/KerrDetectorProvenanceEnvelopeV510.tsx",
    "app/components/KerrDetectorProvenanceEnvelopeV510.test.tsx",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV510.ts",
    "app/lib/kerrPhotonMetrologyObservatoryIntentV510.test.ts",
    "app/components/KerrPhotonMetrologyObservatoryIntentV510.tsx",
    "app/components/KerrPhotonMetrologyObservatoryIntentV510.test.tsx",
    "app/components/RelativityResearchWorkbenchV280.tsx",
    "app/lib/kerrTopologyDetectorAdmissionClientV501.ts",
    "app/lib/atlasCalibrationEvidenceClientV508.ts",
    "app/lib/atlasCalibrationHudModeStoreV506.ts",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/build-kerr-detector-provenance-envelope-v510.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const sourceSha256 = sha(sourceManifest);
  const unsigned = {
    version: "v510-kerr-detector-provenance-envelope-audit-v1",
    generatedAt: new Date().toISOString(),
    status: "portable-provenance-qualified-detector-authority-blocked",
    source: {
      v501ArtifactSha256: admissionArtifact.artifactSha256,
      v503ArtifactSha256: readinessArtifact.artifactSha256,
      v504ArtifactSha256: preflightArtifact.artifactSha256,
      v509ArtifactSha256: previousTimeline.artifactSha256,
      v509EvidenceSha256: previousEvidence.evidenceSha256,
      v509PointerSha256: previousPointer.pointerSha256,
    },
    replay: {
      stageCount: 3,
      subscriptionCount: 4,
      automaticRequestCount,
      explicitRequestCount: requests.length,
      explicitRequestDistribution: "1/1/1",
      exportFormatCount: 2,
      peakObjectUrlCount: exportPeak.objectUrls,
      finalResourceStatus: finalDiff.status,
      finalMode: finalMode.mode,
    },
    envelope,
    exports: {
      jsonBytes: Buffer.byteLength(jsonText),
      csvBytes: Buffer.byteLength(csvText),
      csvRowCount: csvText.trim().split("\n").length - 1,
      objectUrlsReleased: true,
      duplicateReleaseIdempotent: true,
    },
    boundary: {
      measuredCalibrationFiles: "0/6",
      detectorAuthority: false,
      detectorResponseAvailable: false,
      observedCountsAvailable: false,
      observedIntensityAvailable: false,
      scienceRasterAvailable: false,
      denseCampaign: "incomplete-0-of-49",
      browserQualification: "not-run",
      scientificFieldMutation: false,
      canvasCreated: false,
      sceneRevisionDelta: 0,
      formalProductPointer: "v263",
      formalDefaultKernel: "legacy-eih-1pn",
    },
    sourceManifest,
    sourceSha256,
  };
  const audit = { ...unsigned, artifactSha256: sha(unsigned) };
  atomic(paths.output, audit);
  console.log(
    JSON.stringify(
      {
        status: audit.status,
        artifactSha256: audit.artifactSha256,
        envelopeSha256: envelope.canonicalSha256,
        chainSha256: envelope.chain.chainSha256,
        stages: envelope.chain.readyStageCount,
        exports: "json/csv",
        automaticRequests: automaticRequestCount,
        explicitRequests: "1/1/1",
        peakObjectUrls: exportPeak.objectUrls,
        finalResourceStatus: finalDiff.status,
        detectorAuthority: false,
        denseCampaign: "0/49",
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

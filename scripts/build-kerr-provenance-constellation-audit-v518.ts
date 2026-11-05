import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
} from "../app/lib/atlasResourceLifecycle";
import {
  getAtlasCalibrationHudModeSnapshotV506,
  resetAtlasCalibrationHudModeStoreForTestsV506,
  setAtlasCalibrationHudModeV506,
  subscribeAtlasCalibrationHudModeV506,
} from "../app/lib/atlasCalibrationHudModeStoreV506";
import {
  createKerrUncertaintyIndependentVerificationSummaryV517,
  KERR_UNCERTAINTY_INDEPENDENT_VERIFICATION_API_VERSION_V517,
} from "../app/lib/kerrUncertaintyIndependentVerificationV517";
import {
  getKerrUncertaintyIndependentVerificationSnapshotV517,
  loadKerrUncertaintyIndependentVerificationSummaryV517,
  resetKerrUncertaintyIndependentVerificationClientForTestsV517,
  subscribeKerrUncertaintyIndependentVerificationV517,
} from "../app/lib/kerrUncertaintyIndependentVerificationClientV517";
import {
  compareKerrProvenanceConstellationEncodingsV518,
  createKerrProvenanceConstellationEncodingV518,
  resolveKerrProvenanceConstellationProfileV518,
} from "../app/lib/kerrProvenanceConstellationV518";

const root = process.cwd();
const paths = {
  receipt:
    "dist/science/kerr-uncertainty-independent-verification-v517/verification-receipt.json",
  previousEvidence: "dist/science/orbit-atlas-shadow-v517-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v517.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-provenance-constellation-v518/visual-audit.json",
} as const;
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "evidenceSha256",
  "pointerSha256",
  "stageChainSha256",
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
            .sort(([a], [b]) => a.localeCompare(b))
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

async function main() {
  const receipt = read(paths.receipt);
  const previousEvidence = read(paths.previousEvidence);
  const previousPointer = read(paths.previousPointer);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    sha(receipt) !== receipt.artifactSha256 ||
    previousEvidence.version !== "orbit-atlas-shadow-v517-evidence-v1" ||
    sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
    previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v517" ||
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
    throw new Error("v518-upstream-boundary");
  }
  const summary = createKerrUncertaintyIndependentVerificationSummaryV517(receipt);
  const body = JSON.stringify({
    version: KERR_UNCERTAINTY_INDEPENDENT_VERIFICATION_API_VERSION_V517,
    available: true,
    reason: "ready",
    summary,
  });
  const requests: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requests.push(String(input));
    return new Response(body, { status: 200 });
  }) as typeof fetch;
  resetKerrUncertaintyIndependentVerificationClientForTestsV517();
  resetAtlasCalibrationHudModeStoreForTestsV506();
  const baseline = getAtlasResourceSnapshot();
  let receiptNotifications = 0;
  let modeNotifications = 0;
  const releases = [
    subscribeKerrUncertaintyIndependentVerificationV517(() => {
      receiptNotifications += 1;
    }),
    subscribeAtlasCalibrationHudModeV506(() => {
      modeNotifications += 1;
    }),
  ];
  const peak = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const automaticRequestCount = requests.length;
  await loadKerrUncertaintyIndependentVerificationSummaryV517();
  const loaded = getKerrUncertaintyIndependentVerificationSnapshotV517().summary;
  if (!loaded) throw new Error("v518-summary-unavailable");
  const science = createKerrProvenanceConstellationEncodingV518(loaded, "science");
  const cinematic = createKerrProvenanceConstellationEncodingV518(loaded, "cinematic");
  const comparison = compareKerrProvenanceConstellationEncodingsV518(science, cinematic);
  setAtlasCalibrationHudModeV506("cinematic");
  setAtlasCalibrationHudModeV506("science");
  releases.forEach((release) => release());
  releases.forEach((release) => release());
  const finalDiff = diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot());
  const finalMode = getAtlasCalibrationHudModeSnapshotV506();
  globalThis.fetch = originalFetch;
  const scienceProfile = resolveKerrProvenanceConstellationProfileV518("science");
  const cinematicProfile = resolveKerrProvenanceConstellationProfileV518("cinematic");
  if (
    automaticRequestCount !== 0 ||
    requests.length !== 1 ||
    receiptNotifications !== 2 ||
    modeNotifications !== 2 ||
    peak.subscriptions !== 2 ||
    finalDiff.status !== "baseline" ||
    finalMode.mode !== "science" ||
    finalMode.hudRevision !== 2 ||
    comparison.scientificPayloadStable !== true ||
    comparison.geometryStable !== true ||
    comparison.numericScientificStyleInputCount !== 0 ||
    comparison.hashDrivenStyleCount !== 0 ||
    comparison.uncertaintyDrivenStyleCount !== 0 ||
    comparison.scientificFieldMutation !== false ||
    scienceProfile.scienceBoundary.bloomIntensity !== 0 ||
    scienceProfile.scienceBoundary.colorGradeIntensity !== 0 ||
    scienceProfile.scienceBoundary.animated !== false ||
    cinematicProfile.cinematicSeed !== "orbit-atlas-v518-provenance-constellation-seed-01" ||
    resolveKerrProvenanceConstellationProfileV518("science") !== scienceProfile ||
    resolveKerrProvenanceConstellationProfileV518("cinematic") !== cinematicProfile
  ) {
    throw new Error("v518-visual-boundary");
  }
  resetKerrUncertaintyIndependentVerificationClientForTestsV517();
  resetAtlasCalibrationHudModeStoreForTestsV506();
  const geometrySignatureSha256 = sha({ nodes: science.nodes, edges: science.edges });
  const sourcePaths = [
    paths.receipt,
    paths.previousEvidence,
    paths.previousPointer,
    paths.dense,
    paths.formal,
    "app/lib/kerrProvenanceConstellationV518.ts",
    "app/lib/kerrProvenanceConstellationV518.test.ts",
    "app/lib/kerrUncertaintyIndependentVerificationV517.ts",
    "app/lib/kerrUncertaintyIndependentVerificationClientV517.ts",
    "app/lib/atlasCalibrationHudModeStoreV506.ts",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/build-kerr-provenance-constellation-audit-v518.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const unsigned = {
    version: "v518-kerr-provenance-constellation-visual-audit-v1",
    generatedAt: "2026-08-01T00:00:00Z",
    status: "science-cinematic-v7r2-provenance-constellation-qualified",
    source: {
      verificationReceiptSha256: receipt.artifactSha256,
      v517EvidenceSha256: previousEvidence.evidenceSha256,
      v517PointerSha256: previousPointer.pointerSha256,
    },
    encoding: {
      profileId: "science-cinematic-v7r2-v518",
      modeCount: 2,
      nodeCount: 8,
      edgeCount: 7,
      witnessCount: 512,
      checkpointCount: 8,
      geometrySignatureSha256,
      scientificPayloadKey: science.scientificPayloadKey,
      scientificPayloadStable: comparison.scientificPayloadStable,
      geometryStable: comparison.geometryStable,
      numericScientificStyleInputCount: comparison.numericScientificStyleInputCount,
      hashDrivenStyleCount: comparison.hashDrivenStyleCount,
      uncertaintyDrivenStyleCount: comparison.uncertaintyDrivenStyleCount,
      scientificFieldMutation: comparison.scientificFieldMutation,
    },
    science: {
      linearDisplay: scienceProfile.scienceBoundary.linearDisplay,
      bloomIntensity: scienceProfile.scienceBoundary.bloomIntensity,
      colorGradeIntensity: scienceProfile.scienceBoundary.colorGradeIntensity,
      animated: scienceProfile.scienceBoundary.animated,
      seed: scienceProfile.cinematicSeed,
    },
    cinematic: {
      seed: cinematicProfile.cinematicSeed,
      bloomIntensity: cinematicProfile.scienceBoundary.bloomIntensity,
      colorGradeIntensity: cinematicProfile.scienceBoundary.colorGradeIntensity,
      animated: cinematicProfile.scienceBoundary.animated,
      geometryMutationAllowed: false,
      scientificWritebackAllowed: false,
    },
    runtime: {
      automaticRequestCount,
      explicitRequestCount: requests.length,
      subscriptionCount: peak.subscriptions,
      receiptNotifications,
      modeNotifications,
      finalMode: finalMode.mode,
      finalResourceStatus: finalDiff.status,
    },
    boundary: {
      detectorAuthorityAvailable: false,
      denseCampaignStatus: "incomplete-0-of-49",
      browserQualification: "not-run",
      defaultApplied: false,
      canvasCreated: false,
      sceneRevisionDelta: 0,
      formalProductPointer: "v263",
      formalDefaultKernel: "legacy-eih-1pn",
    },
    sourceManifest,
    sourceSha256: sha(sourceManifest),
  };
  const audit = { ...unsigned, artifactSha256: sha(unsigned) };
  atomic(paths.output, audit);
  console.log(
    JSON.stringify(
      {
        status: audit.status,
        artifactSha256: audit.artifactSha256,
        profileId: audit.encoding.profileId,
        nodes: audit.encoding.nodeCount,
        edges: audit.encoding.edgeCount,
        scientificPayloadStable: audit.encoding.scientificPayloadStable,
        geometryStable: audit.encoding.geometryStable,
        numericScientificStyleInputs: audit.encoding.numericScientificStyleInputCount,
        hashDrivenStyles: audit.encoding.hashDrivenStyleCount,
        scienceBloom: audit.science.bloomIntensity,
        scienceGrade: audit.science.colorGradeIntensity,
        automaticRequests: audit.runtime.automaticRequestCount,
        explicitRequests: audit.runtime.explicitRequestCount,
        finalResourceStatus: audit.runtime.finalResourceStatus,
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

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "stageChainSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const text = (path) => bytes(path).toString("utf8");
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const hudPath = "dist/science/atlas-calibration-hud-v505/hud-audit.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v505-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v505.json";
const hud = read(hudPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v504-evidence.json");
const previousPointer = read(
  "dist/release/orbit-atlas-current-local-shadow-candidate-v504.json",
);
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  hud.version !== "v505-atlas-calibration-hud-audit-v1" ||
  evidence.version !== "orbit-atlas-shadow-v505-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v505" ||
  sha(hud) !== hud.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v504EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v504PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v505HudArtifactSha256 !== hud.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(evidencePath)
) {
  throw new Error("v505-canonical-chain");
}

if (
  hud.profile.resolverReferenceStable !== true ||
  hud.profile.profileObjectsFrozen !== true ||
  hud.profile.tokenCount !== 12 ||
  hud.profile.allTokensConsumed !== true ||
  hud.profile.tokenConsumption.length !== 12 ||
  hud.profile.tokenConsumption.some((entry) => entry.consumers.length === 0) ||
  hud.profile.science.glowOpacity !== 0 ||
  hud.profile.science.transitionMs !== 0 ||
  hud.profile.science.linearScientificReadout !== true ||
  hud.profile.cinematic.glowOpacity <= 0 ||
  hud.payloadBoundary.sharedPayloadReferencePreserved !== true ||
  hud.payloadBoundary.scientificFieldMutationAllowed !== false ||
  hud.payloadBoundary.classificationMutationAllowed !== false ||
  hud.payloadBoundary.redshiftMutationAllowed !== false ||
  hud.payloadBoundary.evpaMutationAllowed !== false ||
  hud.payloadBoundary.intensityMutationAllowed !== false ||
  hud.payloadBoundary.randomDrawCount !== 0 ||
  hud.runtime.consumerSurfaceCount !== 2 ||
  hud.runtime.modeToggleCount !== 2 ||
  hud.runtime.automaticRequestDeltaFromModeToggle !== 0 ||
  hud.runtime.canvasCreated !== false ||
  hud.runtime.sceneRevisionDelta !== 0 ||
  hud.runtime.physicsMutationAllowed !== false ||
  hud.runtime.mojibakeMatches !== 0
) {
  throw new Error("v505-hud-boundary");
}

const readiness = text("app/components/KerrMeasuredCalibrationReadinessV503.tsx");
const preflight = text("app/components/KerrMeasuredCalibrationPreflightV504.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx");
const profile = text("app/lib/atlasCalibrationHudProfileV505.ts");
const combined = `${readiness}\n${preflight}\n${wrapper}\n${profile}`;
if (
  !readiness.includes("bindAtlasCalibrationHudV505(mode, state.summary)") ||
  !preflight.includes("bindAtlasCalibrationHudV505(mode, state.summary)") ||
  !readiness.includes('data-atlas-v505-science-payload-reference-preserved="true"') ||
  !preflight.includes('data-atlas-v505-science-payload-reference-preserved="true"') ||
  !wrapper.includes('data-atlas-v505-scientific-field-mutation="false"') ||
  /\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/u.test(combined) ||
  ["Math.random", "<canvas", "physicsEngine", "setSceneRevision"].some((token) =>
    combined.includes(token),
  )
) {
  throw new Error("v505-runtime-boundary");
}

if (
  evidence.runtime.observatoryDetailCatalogSize !== 10 ||
  evidence.runtime.concurrentDetailSurfaceCount !== 1 ||
  evidence.runtime.staticNetworkRequestBudget !== 0 ||
  evidence.scienceBoundary.measuredCalibrationFiles !== "0/6" ||
  evidence.scienceBoundary.detectorAuthority !== false ||
  evidence.scienceBoundary.scienceRaster !== "unavailable" ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  pointer.formalProductPointer !== "v263" ||
  pointer.localShadowDefaultApplied !== false
) {
  throw new Error("v505-continuity-boundary");
}

for (const entry of hud.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v505-hud-source-manifest:${entry.path}`);
  }
}
if (sha(hud.sourceManifest) !== hud.sourceSha256) {
  throw new Error("v505-hud-source-manifest-canonical");
}
for (const entry of evidence.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v505-evidence-source-manifest:${entry.path}`);
  }
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v505-evidence-source-manifest-canonical");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v505-low-memory-science-cinematic-calibration-hud",
      hudArtifactSha256: hud.artifactSha256,
      sharedPayloadSha256: hud.payloadBoundary.sharedPayloadSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      tokenConsumption: "12/12",
      consumerSurfaces: 2,
      scientificFieldMutation: false,
      mojibakeMatches: 0,
      browserQualification: "not-run",
      denseCampaign: "0/49",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);

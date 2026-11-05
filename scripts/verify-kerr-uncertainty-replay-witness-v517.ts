import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  canonicalKerrUncertaintyIndependentVerificationV517,
  parseKerrUncertaintyIndependentVerificationReceiptV517,
} from "../app/lib/kerrUncertaintyIndependentVerificationV517";

const root = process.cwd();
const paths = {
  witness: "dist/science/kerr-uncertainty-replay-witness-v516/witness-chain.json",
  runtime: "dist/science/kerr-uncertainty-replay-witness-v516/runtime-audit.json",
  evidence: "dist/science/orbit-atlas-shadow-v516-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v516.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output:
    "dist/science/kerr-uncertainty-independent-verification-v517/verification-receipt.json",
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

function main() {
  const witness = read(paths.witness);
  const runtime = read(paths.runtime);
  const evidence = read(paths.evidence);
  const pointer = read(paths.pointer);
  const detector = read(paths.detector);
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  const witnessBytes = bytes(paths.witness).byteLength;
  let boundaryViolationCount = 0;
  if (sha(witness) !== witness.artifactSha256) boundaryViolationCount += 1;
  if (sha(runtime) !== runtime.artifactSha256) boundaryViolationCount += 1;
  if (sha(evidence) !== evidence.evidenceSha256) boundaryViolationCount += 1;
  if (sha(pointer) !== pointer.pointerSha256) boundaryViolationCount += 1;
  if (runtime.source?.witnessArtifactSha256 !== witness.artifactSha256) {
    boundaryViolationCount += 1;
  }
  if (evidence.dependency?.v516WitnessArtifactSha256 !== witness.artifactSha256) {
    boundaryViolationCount += 1;
  }
  if (pointer.evidence?.canonicalSha256 !== evidence.evidenceSha256) {
    boundaryViolationCount += 1;
  }
  if (
    witnessBytes <= 0 ||
    witnessBytes > 128 * 1024 ||
    witness.chain?.transitionCount !== 512 ||
    witness.chain?.witnessCount !== 512 ||
    witness.chain?.checkpointCount !== 8 ||
    witness.chain?.passCount !== 2 ||
    witness.chain?.headSha256 !== witness.chain?.repeatHeadSha256 ||
    witness.boundary?.detectorAuthorityAvailable !== false ||
    witness.boundary?.denseCampaignStatus !== "incomplete-0-of-49" ||
    witness.boundary?.browserQualification !== "not-run"
  ) {
    boundaryViolationCount += 1;
  }
  if (
    detector.counts?.measuredCalibrationFiles !== 0 ||
    detector.counts?.requiredMeasuredCalibrationFiles !== 6 ||
    detector.boundary?.detectorResponseAvailable !== false ||
    detector.boundary?.scienceRasterAvailable !== false ||
    dense.status !== "incomplete-0-of-49" ||
    dense.completedShardCount !== 0 ||
    dense.attemptConsumed !== false ||
    dense.aggregateAvailable !== false ||
    formal.version !== "v263-current-product-evidence-pointer" ||
    formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
    formalEvidence.contracts?.singleCanvas !== true ||
    formalEvidence.contracts?.legacyRootAttributes !== 603 ||
    formalEvidence.contracts?.evidenceLedgerClaims !== 84
  ) {
    boundaryViolationCount += 1;
  }

  let sourceManifestValid = Array.isArray(witness.sourceManifest);
  let invalidShaCount = 0;
  if (sourceManifestValid) {
    for (const entry of witness.sourceManifest) {
      if (!entry?.path || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
        invalidShaCount += 1;
        continue;
      }
      if (fileSha(entry.path) !== entry.sha256) sourceManifestValid = false;
    }
    if (sha(witness.sourceManifest) !== witness.sourceSha256) sourceManifestValid = false;
  }

  const genesisSha256 = sha({
    version: "v516-kerr-uncertainty-replay-genesis-v1",
    v515ReplayArtifactSha256: witness.source.v515ReplayArtifactSha256,
    scientificPayloadKey: witness.source.scientificPayloadKey,
    ...witness.basis,
  });
  if (genesisSha256 !== witness.chain.genesisSha256) boundaryViolationCount += 1;
  let previousWitnessSha256 = genesisSha256;
  let witnessMismatchCount = 0;
  let sequenceMismatchCount = 0;
  let recomputedWitnessCount = 0;
  for (let index = 0; index < witness.witnesses.length; index += 1) {
    const stored = witness.witnesses[index];
    const mode = index % 2 === 0 ? "cinematic" : "science";
    if (stored.index !== index || stored.mode !== mode || stored.revision !== index + 1) {
      sequenceMismatchCount += 1;
    }
    const expected = sha({
      version: "v516-kerr-uncertainty-transition-witness-v1",
      index,
      mode,
      revision: index + 1,
      scientificPayloadKey: witness.source.scientificPayloadKey,
      scientificRowsSha256: witness.basis.scientificRowsSha256,
      scienceVisualSignatureSha256: witness.basis.scienceVisualSignatureSha256,
      cinematicVisualSignatureSha256: witness.basis.cinematicVisualSignatureSha256,
      previousWitnessSha256,
      numericStyleInputCount: 0,
      scientificMutation: false,
    });
    recomputedWitnessCount += 1;
    if (stored.witnessSha256 !== expected) witnessMismatchCount += 1;
    previousWitnessSha256 = stored.witnessSha256;
  }
  if (previousWitnessSha256 !== witness.chain.headSha256) witnessMismatchCount += 1;

  let checkpointMismatchCount = 0;
  let matchedCheckpointCount = 0;
  for (let index = 0; index < witness.checkpoints.length; index += 1) {
    const transitionIndex = (index + 1) * 64 - 1;
    const checkpoint = witness.checkpoints[index];
    const stored = witness.witnesses[transitionIndex];
    if (
      checkpoint.transitionIndex !== transitionIndex ||
      checkpoint.revision !== transitionIndex + 1 ||
      checkpoint.mode !== "science" ||
      checkpoint.witnessSha256 !== stored?.witnessSha256
    ) {
      checkpointMismatchCount += 1;
    } else {
      matchedCheckpointCount += 1;
    }
  }
  if (
    !sourceManifestValid ||
    invalidShaCount !== 0 ||
    witnessMismatchCount !== 0 ||
    checkpointMismatchCount !== 0 ||
    sequenceMismatchCount !== 0 ||
    boundaryViolationCount !== 0 ||
    recomputedWitnessCount !== 512 ||
    matchedCheckpointCount !== 8
  ) {
    throw new Error("v517-independent-verification-failed");
  }

  const sourcePaths = [
    paths.witness,
    paths.runtime,
    paths.evidence,
    paths.pointer,
    paths.detector,
    paths.dense,
    paths.formal,
    "app/lib/kerrUncertaintyIndependentVerificationV517.ts",
    "scripts/verify-kerr-uncertainty-replay-witness-v517.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const unsigned = {
    version: "v517-kerr-uncertainty-independent-verification-receipt-v1" as const,
    generatedAt: "2026-08-01T00:00:00Z",
    status: "independent-replay-witness-verification-qualified" as const,
    source: {
      v516WitnessArtifactSha256: witness.artifactSha256,
      v516WitnessFileSha256: fileSha(paths.witness),
      v516RuntimeArtifactSha256: runtime.artifactSha256,
      v516EvidenceSha256: evidence.evidenceSha256,
      v516PointerSha256: pointer.pointerSha256,
      verifierSourceSha256: fileSha("scripts/verify-kerr-uncertainty-replay-witness-v517.ts"),
    },
    verification: {
      independentImplementation: true as const,
      importedV516Parser: false as const,
      importedV516Builder: false as const,
      artifactCanonicalValid: true as const,
      sourceManifestValid: true as const,
      sourceManifestEntryCount: witness.sourceManifest.length,
      transitionCount: 512 as const,
      witnessCount: 512 as const,
      recomputedWitnessCount: recomputedWitnessCount as 512,
      checkpointCount: 8 as const,
      matchedCheckpointCount: matchedCheckpointCount as 8,
      passCount: 2 as const,
      chainHeadSha256: witness.chain.headSha256,
      repeatHeadSha256: witness.chain.repeatHeadSha256,
      chainHeadMatches: true as const,
      witnessMismatchCount: witnessMismatchCount as 0,
      checkpointMismatchCount: checkpointMismatchCount as 0,
      sequenceMismatchCount: sequenceMismatchCount as 0,
      invalidShaCount: invalidShaCount as 0,
      boundaryViolationCount: boundaryViolationCount as 0,
      artifactBytes: witnessBytes,
      artifactMaximumBytes: 128 * 1024 as 131072,
    },
    lifecycle: {
      filesystemReadsBounded: true as const,
      networkRequestCount: 0 as const,
      workerCreated: false as const,
      objectUrlCount: 0 as const,
      canvasCreated: false as const,
      sceneRevisionDelta: 0 as const,
    },
    boundary: {
      detectorCalibrationStatus: "incomplete-0-of-6" as const,
      detectorAuthorityAvailable: false as const,
      scienceRasterAvailable: false as const,
      denseCampaignStatus: "incomplete-0-of-49" as const,
      browserQualification: "not-run" as const,
      localShadowDefaultApplied: false as const,
      formalProductPointer: "v263" as const,
      formalDefaultKernel: "legacy-eih-1pn" as const,
    },
    sourceManifest,
    sourceSha256: sha(sourceManifest),
  };
  const receipt = parseKerrUncertaintyIndependentVerificationReceiptV517({
    ...unsigned,
    artifactSha256: createHash("sha256")
      .update(canonicalKerrUncertaintyIndependentVerificationV517(unsigned))
      .digest("hex"),
  });
  atomic(paths.output, receipt);
  console.log(
    JSON.stringify(
      {
        status: receipt.status,
        artifactSha256: receipt.artifactSha256,
        verifiedArtifactSha256: receipt.source.v516WitnessArtifactSha256,
        witnessesRecomputed: receipt.verification.recomputedWitnessCount,
        checkpointsMatched: receipt.verification.matchedCheckpointCount,
        chainHead: receipt.verification.chainHeadSha256,
        mismatches: 0,
        sourceManifestValid: receipt.verification.sourceManifestValid,
        boundaryViolations: receipt.verification.boundaryViolationCount,
      },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}

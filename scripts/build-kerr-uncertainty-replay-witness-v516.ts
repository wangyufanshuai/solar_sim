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
import { createKerrProductUncertaintyEligibilitySummaryV513 } from "../app/lib/kerrProductUncertaintyEligibilityV513";
import {
  compareKerrUncertaintyVisualEncodingsV514,
  createKerrUncertaintyVisualEncodingV514,
} from "../app/lib/kerrUncertaintyVisualEncodingV514";
import {
  canonicalKerrUncertaintyReplayWitnessV516,
  parseKerrUncertaintyReplayWitnessArtifactV516,
  type KerrUncertaintyTransitionWitnessV516,
} from "../app/lib/kerrUncertaintyReplayWitnessV516";
import { parseKerrUncertaintyReplayArtifactV515 } from "../app/lib/kerrUncertaintyReplayV515";

const root = process.cwd();
const paths = {
  v513: "dist/science/kerr-product-uncertainty-eligibility-v513/uncertainty-eligibility.json",
  v514: "dist/science/kerr-uncertainty-visual-v514/visual-audit.json",
  v515: "dist/science/kerr-uncertainty-replay-v515/replay.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-uncertainty-replay-witness-v516/witness-chain.json",
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

type ReplayPass = Readonly<{
  witnesses: readonly KerrUncertaintyTransitionWitnessV516[];
  headSha256: string;
  notifications: number;
  alternationMismatchCount: number;
  revisionMismatchCount: number;
  scientificDigestMismatchCount: number;
  visualDigestMismatchCount: number;
  numericStyleViolationCount: number;
  scientificMutationCount: number;
  peakSubscriptions: number;
  finalResourceStatus: "baseline";
  finalMode: "science";
  finalRevision: 512;
}>;

async function main() {
  const v513 = read(paths.v513);
  const v514 = read(paths.v514);
  const v515 = parseKerrUncertaintyReplayArtifactV515(read(paths.v515));
  const dense = read(paths.dense);
  const formal = read(paths.formal);
  const formalEvidence = read(formal.source);
  if (
    sha(v513) !== v513.artifactSha256 ||
    sha(v514) !== v514.artifactSha256 ||
    sha(v515) !== v515.artifactSha256 ||
    v515.replay.transitionCount !== 512 ||
    v515.replay.scientificPayloadMismatchCount !== 0 ||
    v515.replay.scientificMutationCount !== 0 ||
    dense.status !== "incomplete-0-of-49" ||
    dense.completedShardCount !== 0 ||
    dense.attemptConsumed !== false ||
    formal.version !== "v263-current-product-evidence-pointer" ||
    formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
    formalEvidence.contracts?.singleCanvas !== true ||
    formalEvidence.contracts?.legacyRootAttributes !== 603 ||
    formalEvidence.contracts?.evidenceLedgerClaims !== 84
  ) {
    throw new Error("v516-upstream-boundary");
  }

  const summary = createKerrProductUncertaintyEligibilitySummaryV513(v513);
  const baselineScience = createKerrUncertaintyVisualEncodingV514(summary, "science");
  const baselineCinematic = createKerrUncertaintyVisualEncodingV514(summary, "cinematic");
  compareKerrUncertaintyVisualEncodingsV514(baselineScience, baselineCinematic);
  const scientificRows = baselineScience.rows.map((row) => [
    row.id,
    row.status,
    row.applicability,
    row.displayMaximum,
    row.reason,
  ]);
  const scienceVisualSignature = baselineScience.rows.map((row) => [
    row.styleKey,
    row.marker,
    row.borderPattern,
  ]);
  const cinematicVisualSignature = baselineCinematic.rows.map((row) => [
    row.styleKey,
    row.marker,
    row.borderPattern,
  ]);
  const basis = Object.freeze({
    scientificRowCount: 9 as const,
    scientificRowsSha256: sha(scientificRows),
    scienceVisualSignatureSha256: sha(scienceVisualSignature),
    cinematicVisualSignatureSha256: sha(cinematicVisualSignature),
    numericStyleInputCount: 0 as const,
    scientificMutationAllowed: false as const,
  });
  const genesisSha256 = sha({
    version: "v516-kerr-uncertainty-replay-genesis-v1",
    v515ReplayArtifactSha256: v515.artifactSha256,
    scientificPayloadKey: summary.artifactSha256,
    ...basis,
  });

  const runPass = (): ReplayPass => {
    resetAtlasCalibrationHudModeStoreForTestsV506();
    const resourceBaseline = getAtlasResourceSnapshot();
    let notifications = 0;
    const release = subscribeAtlasCalibrationHudModeV506(() => {
      notifications += 1;
    });
    const peak = diffAtlasResourceSnapshotsV300(resourceBaseline, getAtlasResourceSnapshot());
    const witnesses: KerrUncertaintyTransitionWitnessV516[] = [];
    let previousWitnessSha256 = genesisSha256;
    let alternationMismatchCount = 0;
    let revisionMismatchCount = 0;
    let scientificDigestMismatchCount = 0;
    let visualDigestMismatchCount = 0;
    let numericStyleViolationCount = 0;
    let scientificMutationCount = 0;
    for (let index = 0; index < 512; index += 1) {
      const mode = index % 2 === 0 ? "cinematic" : "science";
      const modeSnapshot = setAtlasCalibrationHudModeV506(mode);
      const science = createKerrUncertaintyVisualEncodingV514(summary, "science");
      const cinematic = createKerrUncertaintyVisualEncodingV514(summary, "cinematic");
      compareKerrUncertaintyVisualEncodingsV514(science, cinematic);
      if (modeSnapshot.mode !== mode) alternationMismatchCount += 1;
      if (modeSnapshot.hudRevision !== index + 1) revisionMismatchCount += 1;
      if (
        science.scientificPayloadKey !== summary.artifactSha256 ||
        cinematic.scientificPayloadKey !== summary.artifactSha256 ||
        sha(
          science.rows.map((row) => [
            row.id,
            row.status,
            row.applicability,
            row.displayMaximum,
            row.reason,
          ]),
        ) !== basis.scientificRowsSha256
      ) {
        scientificDigestMismatchCount += 1;
      }
      if (
        sha(science.rows.map((row) => [row.styleKey, row.marker, row.borderPattern])) !==
          basis.scienceVisualSignatureSha256 ||
        sha(cinematic.rows.map((row) => [row.styleKey, row.marker, row.borderPattern])) !==
          basis.cinematicVisualSignatureSha256
      ) {
        visualDigestMismatchCount += 1;
      }
      if (science.numericStyleInputCount !== 0 || cinematic.numericStyleInputCount !== 0) {
        numericStyleViolationCount += 1;
      }
      if (science.scientificFieldMutation || cinematic.scientificFieldMutation) {
        scientificMutationCount += 1;
      }
      const witnessSha256 = sha({
        version: "v516-kerr-uncertainty-transition-witness-v1",
        index,
        mode,
        revision: modeSnapshot.hudRevision,
        scientificPayloadKey: summary.artifactSha256,
        scientificRowsSha256: basis.scientificRowsSha256,
        scienceVisualSignatureSha256: basis.scienceVisualSignatureSha256,
        cinematicVisualSignatureSha256: basis.cinematicVisualSignatureSha256,
        previousWitnessSha256,
        numericStyleInputCount: 0,
        scientificMutation: false,
      });
      witnesses.push(Object.freeze({ index, mode, revision: index + 1, witnessSha256 }));
      previousWitnessSha256 = witnessSha256;
    }
    release();
    release();
    const finalResource = diffAtlasResourceSnapshotsV300(
      resourceBaseline,
      getAtlasResourceSnapshot(),
    );
    const finalMode = getAtlasCalibrationHudModeSnapshotV506();
    if (
      notifications !== 512 ||
      peak.subscriptions !== 1 ||
      finalResource.status !== "baseline" ||
      finalMode.mode !== "science" ||
      finalMode.hudRevision !== 512
    ) {
      throw new Error("v516-pass-lifecycle-boundary");
    }
    resetAtlasCalibrationHudModeStoreForTestsV506();
    return Object.freeze({
      witnesses: Object.freeze(witnesses),
      headSha256: previousWitnessSha256,
      notifications,
      alternationMismatchCount,
      revisionMismatchCount,
      scientificDigestMismatchCount,
      visualDigestMismatchCount,
      numericStyleViolationCount,
      scientificMutationCount,
      peakSubscriptions: peak.subscriptions,
      finalResourceStatus: finalResource.status,
      finalMode: finalMode.mode,
      finalRevision: finalMode.hudRevision as 512,
    });
  };

  const passA = runPass();
  const passB = runPass();
  const mismatchCount = passA.witnesses.reduce(
    (count, witness, index) =>
      count + (witness.witnessSha256 === passB.witnesses[index]?.witnessSha256 ? 0 : 1),
    0,
  );
  if (
    mismatchCount !== 0 ||
    passA.headSha256 !== passB.headSha256 ||
    passA.alternationMismatchCount !== 0 ||
    passA.revisionMismatchCount !== 0 ||
    passA.scientificDigestMismatchCount !== 0 ||
    passA.visualDigestMismatchCount !== 0 ||
    passA.numericStyleViolationCount !== 0 ||
    passA.scientificMutationCount !== 0 ||
    passB.alternationMismatchCount !== 0 ||
    passB.revisionMismatchCount !== 0 ||
    passB.scientificDigestMismatchCount !== 0 ||
    passB.visualDigestMismatchCount !== 0 ||
    passB.numericStyleViolationCount !== 0 ||
    passB.scientificMutationCount !== 0
  ) {
    throw new Error("v516-repeatability-boundary");
  }

  const checkpoints = Array.from({ length: 8 }, (_, index) => {
    const transitionIndex = (index + 1) * 64 - 1;
    const witness = passA.witnesses[transitionIndex];
    if (!witness) throw new Error("v516-checkpoint-missing");
    return Object.freeze({
      transitionIndex,
      mode: witness.mode,
      revision: witness.revision,
      witnessSha256: witness.witnessSha256,
    });
  });
  const sourcePaths = [
    paths.v513,
    paths.v514,
    paths.v515,
    paths.dense,
    paths.formal,
    "app/lib/kerrUncertaintyReplayWitnessV516.ts",
    "app/lib/kerrUncertaintyReplayV515.ts",
    "app/lib/kerrUncertaintyVisualEncodingV514.ts",
    "app/lib/kerrProductUncertaintyEligibilityV513.ts",
    "app/lib/atlasCalibrationHudModeStoreV506.ts",
    "app/lib/atlasResourceLifecycle.ts",
    "scripts/build-kerr-uncertainty-replay-witness-v516.ts",
  ];
  const sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const unsigned = {
    version: "v516-kerr-uncertainty-replay-witness-chain-v1" as const,
    generatedAt: "2026-08-01T00:00:00Z",
    status: "uncertainty-replay-witness-chain-qualified-512-transitions" as const,
    source: {
      v515ReplayArtifactSha256: v515.artifactSha256,
      v513ArtifactSha256: v513.artifactSha256,
      v514VisualAuditSha256: v514.artifactSha256,
      scientificPayloadKey: summary.artifactSha256,
    },
    basis,
    chain: {
      transitionCount: 512 as const,
      passCount: 2 as const,
      witnessCount: 512 as const,
      checkpointInterval: 64 as const,
      checkpointCount: 8 as const,
      genesisSha256,
      headSha256: passA.headSha256,
      repeatHeadSha256: passB.headSha256,
      mismatchCount: mismatchCount as 0,
      alternationMismatchCount: passA.alternationMismatchCount as 0,
      revisionMismatchCount: passA.revisionMismatchCount as 0,
      scientificDigestMismatchCount: passA.scientificDigestMismatchCount as 0,
      visualDigestMismatchCount: passA.visualDigestMismatchCount as 0,
      numericStyleViolationCount: passA.numericStyleViolationCount as 0,
      scientificMutationCount: passA.scientificMutationCount as 0,
      notificationCountPerPass: passA.notifications as 512,
      finalMode: passA.finalMode,
      finalModeRevision: passA.finalRevision,
    },
    witnesses: passA.witnesses,
    checkpoints: Object.freeze(checkpoints),
    lifecycle: {
      peakSubscriptionCount: passA.peakSubscriptions as 1,
      finalSubscriptionCount: 0 as const,
      finalResourceStatus: passA.finalResourceStatus,
      identityChanged: false as const,
      ownerChanged: false as const,
      objectUrlCount: 0 as const,
      canvasCreated: false as const,
      sceneRevisionDelta: 0 as const,
    },
    boundary: {
      fullTransitionPayloadEmbedded: false as const,
      scientificFieldMutationAllowed: false as const,
      uncertaintyDrivenPresentationAllowed: false as const,
      detectorAuthorityAvailable: false as const,
      denseCampaignStatus: "incomplete-0-of-49" as const,
      browserQualification: "not-run" as const,
      formalProductPointer: "v263" as const,
      formalDefaultKernel: "legacy-eih-1pn" as const,
    },
    sourceManifest,
    sourceSha256: sha(sourceManifest),
  };
  const artifact = parseKerrUncertaintyReplayWitnessArtifactV516({
    ...unsigned,
    artifactSha256: createHash("sha256")
      .update(canonicalKerrUncertaintyReplayWitnessV516(unsigned))
      .digest("hex"),
  });
  atomic(paths.output, artifact);
  console.log(
    JSON.stringify(
      {
        status: artifact.status,
        artifactSha256: artifact.artifactSha256,
        transitions: artifact.chain.transitionCount,
        witnesses: artifact.chain.witnessCount,
        checkpoints: artifact.chain.checkpointCount,
        passCount: artifact.chain.passCount,
        headSha256: artifact.chain.headSha256,
        repeatHeadSha256: artifact.chain.repeatHeadSha256,
        mismatches: artifact.chain.mismatchCount,
        finalResourceStatus: artifact.lifecycle.finalResourceStatus,
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

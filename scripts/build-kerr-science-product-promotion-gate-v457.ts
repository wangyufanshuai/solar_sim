import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { auditAtlasScienceCinematicV7BoundaryV457 } from "../app/lib/atlasScienceCinematicV7V457";
import {
  canonicalScienceProductPromotionPayloadV457,
  evaluateScienceProductPromotionV457,
  SCIENCE_PRODUCT_PROMOTION_VERSION_V457,
  type ScienceProductGateEntryV457,
} from "../app/lib/scienceProductPromotionGateV457";

const root = process.cwd();
const paths = {
  v456: "dist/science/kerr-sparse-science-image-v456/sparse-image-qualification.json",
  v451: "dist/science/kerr-detector-input-admission-v451/input-admission-qualification.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output:
    "dist/science/kerr-science-product-promotion-gate-v457/science-product-promotion-gate.json",
};
const read = (path: string) =>
  JSON.parse(readFileSync(resolve(root, path), "utf8"));
const canonicalSha = (value: unknown): string =>
  createHash("sha256")
    .update(canonicalScienceProductPromotionPayloadV457(value))
    .digest("hex");
const atomic = (path: string, value: unknown): void => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const v456 = read(paths.v456);
const v451 = read(paths.v451);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  v456.version !== "v456-kerr-sparse-science-image-artifact-v1" ||
  v456.qualification?.fitsKeywordSyntaxQualified !== true ||
  v456.qualification?.provenanceGraphQualified !== true ||
  v456.sciencePayload?.detectorValueAuthority !== false ||
  v451.status !== "blocked-v443-detector-inputs-missing" ||
  v451.detector?.requiredFileCount !== 6 ||
  v451.detector?.readyFileCount !== 0 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v457-promotion-source-boundary");
}

const gates: readonly ScienceProductGateEntryV457[] = Object.freeze([
  Object.freeze({
    id: "fits-header",
    label: "FITS header structure",
    status: "qualified",
    evidence: "v456: 22 cards, Astropy round-trip mismatch 0",
    blocker: false,
  }),
  Object.freeze({
    id: "provenance-graph",
    label: "Provenance graph",
    status: "qualified",
    evidence: "v456: seven SHA-linked provenance nodes",
    blocker: false,
  }),
  Object.freeze({
    id: "measured-detector-inputs",
    label: "Measured detector input admission",
    status: "blocked",
    evidence: `v451: ${v451.detector.readyFileCount}/${v451.detector.requiredFileCount} required files ready`,
    blocker: true,
  }),
  Object.freeze({
    id: "detector-pixel-values",
    label: "Detector pixel value authority",
    status: "blocked",
    evidence: "v456: sparse value rows 0; science raster rows 0",
    blocker: true,
  }),
  Object.freeze({
    id: "dense-aggregate",
    label: "Dense Kerr aggregate",
    status: "incomplete",
    evidence: `v314: ${dense.completedShardCount}/${dense.plannedShardCount} shards; aggregate unavailable`,
    blocker: true,
  }),
  Object.freeze({
    id: "selection-bias",
    label: "Selection bias quantification",
    status: "unquantified",
    evidence: "Measured detector population and dense aggregate unavailable",
    blocker: true,
  }),
  Object.freeze({
    id: "browser",
    label: "Desktop/mobile browser qualification",
    status: "not-run",
    evidence: "No v457 browser matrix evidence",
    blocker: true,
  }),
  Object.freeze({
    id: "visual-matrix",
    label: "Science/Cinematic visual matrix",
    status: "not-run",
    evidence: "No v457 visual matrix evidence",
    blocker: true,
  }),
  Object.freeze({
    id: "soak",
    label: "Lifecycle soak",
    status: "not-run",
    evidence: "No v457 UI or compute soak evidence",
    blocker: true,
  }),
  Object.freeze({
    id: "rtx-webgpu",
    label: "RTX/WebGPU differential",
    status: "not-run",
    evidence: "CPU authority retained; GPU qualification absent",
    blocker: true,
  }),
]);
const decisions = evaluateScienceProductPromotionV457(gates);
const unsigned = {
  version: SCIENCE_PRODUCT_PROMOTION_VERSION_V457,
  generatedAt: "2026-07-30T00:00:00Z",
  status:
    "blocked-science-product-promotion-structure-qualified-value-authority-missing" as const,
  source: {
    v456ArtifactSha256: v456.artifactSha256,
    v451ArtifactSha256: v451.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  gates,
  counts: {
    gateCount: 10 as const,
    qualifiedCount: gates.filter((gate) => gate.status === "qualified").length,
    blockerCount: decisions.blockerIds.length,
    measuredDetectorRequired: 6 as const,
    measuredDetectorReady: v451.detector.readyFileCount,
    denseShardsCompleted: dense.completedShardCount,
    denseShardsPlanned: 49 as const,
  },
  decisions,
  visualProfile: auditAtlasScienceCinematicV7BoundaryV457(),
  boundary: {
    fitsHeaderStructureQualified: true as const,
    provenanceGraphQualified: true as const,
    detectorPixelAuthority: false as const,
    scienceProductAuthority: false as const,
    fitsHduEmitted: false as const,
    pngEmitted: false as const,
    scienceAndCinematicSeparated: true as const,
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
  },
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
};
const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
atomic(paths.output, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      qualifiedCount: artifact.counts.qualifiedCount,
      blockerCount: artifact.counts.blockerCount,
      promotionAllowed: artifact.decisions.promotionAllowed,
      fitsWriteAllowed: artifact.decisions.fitsWriteAllowed,
      pngWriteAllowed: artifact.decisions.pngWriteAllowed,
      profile: artifact.visualProfile.profileId,
    },
    null,
    2,
  ),
);

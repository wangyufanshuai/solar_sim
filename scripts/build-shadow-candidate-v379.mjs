import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v378-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v378.json",
  readiness: "dist/science/measured-authority-readiness-v379/readiness.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v379-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v379.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const readiness = read(paths.readiness);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.status !== "measurement-authority-topology-v378-qualified-inputs-partial-1-of-8-image-unavailable-browser-pending-dense-incomplete-0-of-49" ||
  previousPointer.capabilities?.v378AuthorityTopology !== "qualified-acyclic-10-nodes-9-required-edges" ||
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 ||
  readiness.version !== "v379-measured-authority-readiness-matrix-v1" ||
  readiness.status !== "readiness-matrix-qualified-contracts-7-of-7-inputs-0-of-7" ||
  sha(readiness) !== readiness.artifactSha256 ||
  readiness.expectedMissingInputCount !== 7 || readiness.presentInputCount !== 0 || readiness.missingInputCount !== 7 ||
  readiness.schemaContractQualifiedCount !== 7 || readiness.boundedReadQualifiedCount !== 7 ||
  readiness.entries?.length !== 7 || readiness.entries.some((entry) => entry.present || !entry.schemaContractQualified || !entry.boundedReadQualified || entry.automaticPromotionAllowed || entry.automaticRetryAllowed) ||
  readiness.downstream?.v375EnvelopeAvailable !== false || readiness.downstream?.v376ScienceImageAvailable !== false || readiness.downstream?.observedCountsAvailable !== false ||
  existsSync(resolve(root, paths.envelope)) || existsSync(resolve(root, paths.imageJson)) || existsSync(resolve(root, paths.imageCsv)) ||
  state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v379-boundary");

const sourcePaths = [
  "scripts/build-measured-expectation-v375.ts",
  "app/lib/measuredAuthorityReadinessV379.ts",
  "app/lib/measuredAuthorityReadinessV379.test.ts",
  "app/lib/measuredAuthorityReadinessServerV379.ts",
  "app/lib/measuredAuthorityReadinessServerV379.test.ts",
  "app/api/atlas/relativity-evidence/v379/measured-authority-readiness/route.ts",
  "app/api/atlas/relativity-evidence/v379/measured-authority-readiness/route.test.ts",
  "app/components/MeasuredAuthorityReadinessSurfaceV379.tsx",
  "app/components/MeasuredAuthorityReadinessSurfaceV379.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV379.ts",
  "app/lib/atlasShadowCapabilityPointerV379.test.ts",
  "scripts/build-measured-authority-readiness-v379.ts",
  "scripts/build-shadow-candidate-v379.mjs",
  "scripts/verify-shadow-v379-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v379-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "measured-authority-readiness-v379-qualified-contracts-7-of-7-inputs-missing-0-of-7-browser-pending-dense-incomplete-0-of-49",
  dependency: { v378EvidenceSha256: previousEvidence.evidenceSha256, v378PointerSha256: previousPointer.pointerSha256, readinessArtifactSha256: readiness.artifactSha256, readinessFileSha256: fileSha(paths.readiness) },
  readiness: {
    expectedMissingInputCount: readiness.expectedMissingInputCount,
    presentInputCount: readiness.presentInputCount,
    missingInputCount: readiness.missingInputCount,
    schemaContractQualifiedCount: readiness.schemaContractQualifiedCount,
    boundedReadQualifiedCount: readiness.boundedReadQualifiedCount,
    photonAuthorityQualified: readiness.photonAuthorityQualified,
    entries: readiness.entries.map((entry) => ({ id: entry.id, lane: entry.lane, path: entry.path, maximumBytes: entry.maximumBytes, schemaSource: entry.schemaSource, schemaSymbol: entry.schemaSymbol, schemaSourceFileSha256: entry.schemaSourceFileSha256, boundedConsumerSource: entry.boundedConsumerSource, boundedConsumerSourceFileSha256: entry.boundedConsumerSourceFileSha256, producerCommand: entry.producerCommand, validatorCommands: entry.validatorCommands, readiness: entry.readiness })),
  },
  failurePropagation: { v375EnvelopeAvailable: false, v376ScienceImageAvailable: false, observedCountsAvailable: false, zeroImageFallbackAllowed: false, syntheticFallbackAllowed: false, automaticRetryAllowed: false, automaticPromotionAllowed: false },
  runtime: { profile: "science-cinematic-v11-v377", consumer: "MeasuredAuthorityReadinessSurfaceV379", endpoint: "/api/atlas/relativity-evidence/v379/measured-authority-readiness", responseMaximumBytes: 128 * 1024, noStore: true, localShadowOnly: true, defaultApplied: false, legacyV9Default: true },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  attemptConsumed: false,
  networkAttempted: false,
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "contracts-and-bounded-reads-qualified-measured-files-still-missing-no-authority-expectation-image-or-observed-count-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v379", generatedAt: new Date().toISOString(), status: evidence.status, formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
  capabilities: { v378AuthorityTopology: "qualified-acyclic-10-nodes-9-required-edges", v379SchemaContracts: "qualified-7-of-7", v379BoundedAuthorityReads: "qualified-8-of-8-v375-inputs", v379MeasuredInputs: "missing-0-of-7-present", v379FailurePropagation: "v375-withheld-v376-withheld-observed-counts-unavailable", v379RuntimeConsumer: "v11-qualification-breakers-wired", v379DefaultBoundary: "manual-local-shadow-only-default-legacy-v9", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable", browserQualification: "not-run" },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, contracts: pointer.capabilities.v379SchemaContracts, boundedReads: pointer.capabilities.v379BoundedAuthorityReads, measuredInputs: pointer.capabilities.v379MeasuredInputs, dense: pointer.capabilities.v314CorrectedDense, browser: pointer.capabilities.browserQualification }, null, 2));

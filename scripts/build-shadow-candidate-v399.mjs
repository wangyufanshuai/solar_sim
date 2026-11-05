import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v398-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v398.json",
  artifact: "dist/science/kerr-physical-observation-template-v399/template-diagnostic.json",
  template: "dist/templates/kerr-physical-observation-v399/intake-template.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v399-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v399.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const template = read(paths.template);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) || previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 || previousPointer.capabilities?.v398IntakeManifestContract !== "qualified-13-file-graph" || artifact.version !== "v399-kerr-physical-observation-template-diagnostic-v1" || artifact.status !== "template-diagnostic-topology-qualified-physical-input-unavailable" || sha(artifact) !== artifact.artifactSha256 || sha(template) !== artifact.integrity?.templateCanonicalSha256 || artifact.template?.slots?.length !== 13 || artifact.template?.containsObservationValues !== false || artifact.template?.compileEligible !== false || artifact.diagnostic?.missingFileCount !== 13 || artifact.diagnostic?.readyForCompile !== false || artifact.topology?.nodeCount !== 16 || artifact.topology?.edgeCount !== 15 || artifact.topology?.actualSourceCount !== 0 || artifact.validator?.rejectedAdversarialFixtureCount !== 8 || artifact.productionAdmission?.physicalObservationValuesAvailable !== false || artifact.productionAdmission?.templateUsedAsObservation !== false || artifact.productionAdmission?.compileExecuted !== false || artifact.productionAdmission?.measuredAuthorityGranted !== false || artifact.networkAttempted !== false || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.eihOnePnMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v399-boundary");

const sourcePaths = [
  "app/lib/kerrPhysicalObservationTemplateV399.ts", "app/lib/kerrPhysicalObservationTemplateV399.test.ts",
  "app/lib/kerrPhysicalObservationTemplateServerV399.ts", "app/lib/kerrPhysicalObservationTemplateServerV399.test.ts",
  "app/lib/atlasShadowCapabilityPointerV399.ts", "app/lib/atlasShadowCapabilityPointerV399.test.ts",
  "app/api/atlas/relativity-evidence/v399/provenance-template/route.ts", "app/api/atlas/relativity-evidence/v399/provenance-template/route.test.ts",
  "app/api/atlas/relativity-evidence/v399/intake-template/route.ts", "app/api/atlas/relativity-evidence/v399/intake-template/route.test.ts",
  "app/components/KerrProvenanceRailV399.tsx", "app/components/KerrProvenanceRailV399.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx", "scripts/build-kerr-physical-observation-template-v399.ts",
  "scripts/build-shadow-candidate-v399.mjs", "scripts/reseal-shadow-evidence-chain-v399.mjs", "scripts/verify-shadow-v399-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v399-evidence-v1", generatedAt: new Date().toISOString(), status: "template-diagnostic-topology-qualified-physical-input-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: { v398EvidenceSha256: previousEvidence.evidenceSha256, v398PointerSha256: previousPointer.pointerSha256, templateArtifactSha256: artifact.artifactSha256, templateArtifactFileSha256: fileSha(paths.artifact), downloadableTemplateCanonicalSha256: artifact.integrity.templateCanonicalSha256, downloadableTemplateFileSha256: fileSha(paths.template), v398IntakeArtifactSha256: artifact.source.v398IntakeArtifactSha256, fullShortAuthoritySha256: artifact.source.fullShortAuthoritySha256 },
  template: { slotCount: 13, containsObservationValues: false, compileEligible: false, publicationAllowed: false, measuredAuthorityAllowed: false, missingFileCount: 13, readyForCompile: false },
  topology: { semantics: artifact.topology.semantics, nodeCount: 16, edgeCount: 15, actualSourceCount: 0, topologyCanonicalSha256: artifact.integrity.topologyCanonicalSha256 },
  authorityBoundary: { templateOnly: true, physicalStagingAvailable: false, physicalObservationValuesAvailable: false, templateUsedAsObservation: false, compileExecuted: false, candidatePublished: false, measuredAuthorityGranted: false, sciencePayloadMutationAllowed: false, cinematicConsumerAllowed: false },
  runtime: { profile: "science-cinematic-v11-v377", consumer: "KerrProvenanceRailV399", endpoint: "/api/atlas/relativity-evidence/v399/provenance-template", templateDownloadEndpoint: "/api/atlas/relativity-evidence/v399/intake-template", responseMaximumBytes: 128 * 1024, noStore: true, localShadowOnly: true, defaultApplied: false, legacyV9Default: true },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  networkAttempted: false, automaticRetryApplied: false, browserQualification: "not-run", sourceManifest, sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "template-and-required-topology-only-zero-observation-values-zero-actual-sources-no-compile-no-authority-no-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v399", generatedAt: new Date().toISOString(), status: evidence.status,
  formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
  capabilities: { v398IntakeManifestContract: "qualified-13-file-graph", v399ValueFreeTemplate: "qualified-13-slots-no-values-not-compile-eligible", v399Diagnostic: "staging-unavailable-13-missing-0-invalid", v399ProvenanceTopology: "qualified-required-16-nodes-15-edges-0-actual-sources", v399Validator: "qualified-8-of-8-adversarial-rejections", v399TemplateDownload: "local-shadow-only-wired", v399Compile: "not-run", v399MeasuredAuthority: "not-granted", v399RuntimeConsumer: "v11-provenance-rail-wired", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable", browserQualification: "not-run" },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, template: pointer.capabilities.v399ValueFreeTemplate, topology: pointer.capabilities.v399ProvenanceTopology, authority: pointer.capabilities.v399MeasuredAuthority, dense: pointer.capabilities.v314CorrectedDense, browser: pointer.capabilities.browserQualification }, null, 2));

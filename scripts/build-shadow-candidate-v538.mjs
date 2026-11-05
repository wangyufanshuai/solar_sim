import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = { previousEvidence: "dist/science/orbit-atlas-shadow-v537-evidence.json", previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v537.json", artifact: "dist/science/kerr-response-aware-fits-column-schema-v538/atlas.json", csv: "dist/science/kerr-response-aware-fits-column-schema-v538/column-schema.csv", runtime: "dist/science/kerr-response-aware-fits-column-schema-v538/runtime-audit.json", dense: "dist/science/kerr-campaign-v314/campaign-state.json", formal: "dist/release/orbit-atlas-current-product-evidence-v263.json", evidence: "dist/science/orbit-atlas-shadow-v538-evidence.json", pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v538.json" };
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256", "columnSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const compare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => compare(left, right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`); renameSync(part, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const runtime = read(paths.runtime);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (previousEvidence.version !== "orbit-atlas-shadow-v537-evidence-v1" || sha(previousEvidence) !== previousEvidence.evidenceSha256
  || previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v537" || sha(previousPointer) !== previousPointer.pointerSha256
  || sha(artifact) !== artifact.artifactSha256 || artifact.columns.some((column) => sha(column) !== column.columnSha256)
  || sha(runtime) !== runtime.artifactSha256 || artifact.export.csvFileSha256 !== fileSha(paths.csv)
  || artifact.counts.qualifiedColumnCount !== 17 || artifact.counts.physicalUncertaintyValueCount !== 0 || artifact.counts.pixelSampleCount !== 0 || artifact.counts.fitsImageHduCount !== 0
  || runtime.runtime.finalResourceStatus !== "baseline" || runtime.detailCatalog.detailCount !== 40 || runtime.independentReplay.columnShaReplayCount !== 17
  || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false || dense.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v538-evidence-boundary");

const sourcePaths = [paths.previousEvidence, paths.previousPointer, paths.artifact, paths.csv, paths.runtime, paths.dense, paths.formal,
  "dist/science/kerr-response-aware-sparse-fits-v537/atlas.json", "dist/science/kerr-response-aware-sparse-fits-v537/response-aware-sparse-table.fits",
  "dist/science/kerr-response-aware-sparse-image-v536/atlas.json", "scripts/build-kerr-response-aware-fits-column-schema-v538.py", "scripts/test-kerr-response-aware-fits-column-schema-v538.py",
  "app/lib/kerrResponseAwareFitsColumnSchemaV538.ts", "app/lib/kerrResponseAwareFitsColumnSchemaV538.test.ts",
  "app/lib/kerrResponseAwareFitsColumnSchemaServerV538.ts", "app/lib/kerrResponseAwareFitsColumnSchemaServerV538.test.ts", "app/lib/kerrResponseAwareFitsColumnSchemaClientV538.ts",
  "app/api/atlas/relativity-evidence/v538/response-aware-fits-column-schema/route.ts", "app/api/atlas/relativity-evidence/v538/response-aware-fits-column-schema/route.test.ts",
  "app/components/KerrResponseAwareFitsColumnSchemaV538.tsx", "app/components/KerrResponseAwareFitsColumnSchemaV538.test.tsx",
  "app/components/kerrPhotonMetrologyDetailCatalogV538.ts", "app/components/kerrPhotonMetrologyDetailCatalogV538.test.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV538.ts", "app/components/KerrPhotonMetrologyObservatoryIntentV538.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx", "app/lib/atlasResourceLifecycle.ts", "scripts/build-kerr-response-aware-fits-column-schema-runtime-v538.ts",
  "scripts/build-shadow-candidate-v538.mjs", "scripts/build-shadow-v538.mjs", "scripts/verify-shadow-v538-light.mjs", "scripts/atlas.mjs"];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) })).sort((left, right) => compare(left.path, right.path));
const status = "v538-fits-column-semantics-qualified-physical-uncertainty-unavailable-heavy-browser-pending";
const unsigned = { version: "orbit-atlas-shadow-v538-evidence-v1", generatedAt: "2026-08-02T00:00:00Z", status, dependency: { v537EvidenceSha256: previousEvidence.evidenceSha256, v537PointerSha256: previousPointer.pointerSha256, v538ArtifactSha256: artifact.artifactSha256, v538RuntimeSha256: runtime.artifactSha256, v314StateSha256: dense.stateSha256 }, contract: artifact.contract, table: artifact.table, columns: artifact.columns, invariants: artifact.invariants, counts: artifact.counts, qualification: artifact.qualification, runtime: runtime.runtime, independentReplay: runtime.independentReplay, detailCatalog: runtime.detailCatalog, visualProfile: runtime.visualProfile, boundary: artifact.boundary, sourceManifest, sourceSha256: sha(sourceManifest), qualificationStatement: "v538-qualifies-all-seventeen-fits-columns-for-format-unit-domain-applicability-missingness-and-column-sha", boundaryStatement: "Column semantics do not create measurements. PHYS_UNC=false means unavailable, not zero uncertainty; PIXEL=false means no sample, not a zero-valued pixel. No image HDU, raster, physical uncertainty interval, dense authority, or product promotion is claimed." };
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = { version: "orbit-atlas-current-local-shadow-candidate-v538", generatedAt: "2026-08-02T00:00:00Z", status, formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true, capabilities: { v537FitsBinaryTable: "qualified-preserved-1-table-4-rows-17-columns", v538FitsColumnSchema: "qualified-17-of-17", v538FormatsAndUnits: "qualified-17-of-17", v538ApplicabilityAndMissingness: "qualified-17-of-17", v538ColumnShaReplay: "qualified-17-of-17-python-typescript", v538OrientationUnitNorm: `qualified-max-${artifact.invariants.maximumOrientationUnitNormResidual}`, v538PhysicalUncertainty: "unavailable-values-0-measured-calibration-0-of-6", v538PixelSamples: "unavailable-0", v538ImageHdus: "unavailable-0", v538SharedDetailCatalog: "qualified-40-of-40-one-new-lazy-import", v538RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers", v538Lifecycle: "qualified-baseline", v538BrowserQualification: "not-run", v314DenseCampaign: "incomplete-0-of-49" }, promotion: { promotionAllowed: false, scienceRasterPayloadAllowed: false, productionImageAllowed: false, localShadowDefaultApplied: false }, evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 } };
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status, artifactSha256: artifact.artifactSha256, runtimeArtifactSha256: runtime.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, qualifiedColumns: "17/17", physicalUncertaintyValues: 0, pixelSamples: 0, imageHdus: 0, detailCatalog: "40/40", denseCampaign: "0/49", formalProductPointer: "v263" }, null, 2));

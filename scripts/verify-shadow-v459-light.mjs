import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const validation = read("dist/science/kerr-measured-detector-blind-validation-v459/blind-validation.json");
const evidence = read("dist/science/orbit-atlas-shadow-v459-evidence.json");
const pointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v459.json");
const previousEvidence = read("dist/science/orbit-atlas-shadow-v458-evidence.json");
const previousPointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v458.json");
const intake = read("dist/science/kerr-measured-detector-intake-v458/intake-inspect.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const forbiddenProducts = readdirSync(resolve(root, "dist/science/kerr-measured-detector-blind-validation-v459")).filter((name) => [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()));
if (
  canonicalSha(validation) !== validation.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  validation.protocol.version !== "v459-blind-train-holdout-protocol-v1" ||
  validation.protocol.fixedFoldCount !== 3 ||
  validation.protocol.minimumRepeatsPerFold !== 3 ||
  validation.protocol.sourceRowsNeverFitOnHoldout !== true ||
  validation.protocol.holdoutReadOnlyAfterLock !== true ||
  validation.protocol.overlapTolerance !== 0 ||
  validation.leakageControls.preprocessingFitOnTrainOnly !== true ||
  validation.leakageControls.holdoutUsedForThresholdSelection !== false ||
  validation.leakageControls.provenanceShaLockedBeforeFit !== true ||
  validation.thresholds.thresholdSelectionStatus !== "pre-registered-not-fit" ||
  validation.uncertaintyBudget.combination !== "linear-unless-independence-proven" ||
  validation.uncertaintyBudget.rssAllowed !== false ||
  validation.uncertaintyBudget.measuredComponentsAvailable !== false ||
  validation.control.status !== "validation-only" ||
  validation.control.authorityGranted !== false ||
  validation.control.split.overlapIds.length !== 0 ||
  validation.adversarialFixtures.length !== 6 ||
  validation.adversarialFixtures.some((fixture) => fixture.rejected !== true || fixture.expectedReason !== fixture.observedReason) ||
  validation.inspect.measuredInputReady !== false ||
  validation.inspect.trainRows !== 0 ||
  validation.inspect.holdoutRows !== 0 ||
  validation.inspect.fitExecuted !== false ||
  validation.inspect.holdoutExecuted !== false ||
  validation.inspect.validationExecuted !== false ||
  validation.inspect.authorityGranted !== false ||
  validation.qualification.protocolQualified !== true ||
  validation.qualification.leakageControlsQualified !== true ||
  validation.qualification.uncertaintyBudgetContractQualified !== true ||
  validation.qualification.measuredBlindValidationQualified !== false ||
  validation.boundary.holdoutValuesPresent !== false ||
  validation.boundary.sciencePixelsAvailable !== false ||
  validation.boundary.fitsWriteAllowed !== false ||
  validation.boundary.pngWriteAllowed !== false ||
  pointer.capabilities.v459BlindValidationProtocol !== "qualified" ||
  pointer.capabilities.v459BlindFit !== "not-run-inputs-unavailable" ||
  pointer.capabilities.v459BlindHoldout !== "not-run-inputs-unavailable" ||
  pointer.capabilities.v459MeasuredDetectorAuthority !== "not-granted" ||
  pointer.promotion.promotionAllowed !== false ||
  pointer.promotion.fitsWriteAllowed !== false ||
  pointer.promotion.pngWriteAllowed !== false ||
  intake.inspect.readyFileCount !== 0 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.runNextAuthorized !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  evidence.dependency.v458EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v458PointerSha256 !== previousPointer.pointerSha256
) throw new Error("v459-fail-closed-validation");
for (const entry of evidence.sourceManifest ?? []) if (fileSha(entry.path) !== entry.sha256) throw new Error(`v459-source-manifest-mismatch:${entry.path}`);
if (/[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(JSON.stringify({ validation, evidence, pointer }))) throw new Error("v459-transient-evidence-leak");
const componentSource = readFileSync(resolve(root, "app/components/KerrMeasuredDetectorBlindValidationV459.tsx"), "utf8");
if (!componentSource.includes("先锁住盲区，再谈像素可信度") || /鍧|銆|鏁|绱|锛/.test(componentSource)) throw new Error("v459-utf8-observatory-validation");
console.log(JSON.stringify({ status: "passed-v459-low-memory-blind-validation-protocol-fail-closed", artifactSha256: validation.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, protocol: "qualified", controlTrainRows: 6, controlHoldoutRows: 6, controlOverlapRows: 0, productionTrainRows: 0, productionHoldoutRows: 0, fitExecuted: false, holdoutExecuted: false, authorityGranted: false, promotionAllowed: false, forbiddenImageProducts: forbiddenProducts.length, denseCampaign: "0/49", browserQualification: "not-run", formalProductPointer: "v263" }, null, 2));

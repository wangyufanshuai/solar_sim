import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  canonicalKerrMeasuredDetectorBlindResultsPayloadV460,
  createKerrMeasuredDetectorBlindControlRowsV460,
  evaluateKerrMeasuredDetectorBlindResultsV460,
  KERR_MEASURED_DETECTOR_BLIND_RESULTS_ARTIFACT_VERSION_V460,
  parseKerrMeasuredDetectorBlindResultsArtifactV460,
} from "../app/lib/kerrMeasuredDetectorBlindResultsV460";

const root = process.cwd();
const paths = {
  v459: "dist/science/kerr-measured-detector-blind-validation-v459/blind-validation.json",
  v458: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  v457: "dist/science/kerr-science-product-promotion-gate-v457/science-product-promotion-gate.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-measured-detector-blind-results-v460/blind-results.json",
};
const read = (path: string) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const sha = (value: unknown): string => createHash("sha256").update(canonicalKerrMeasuredDetectorBlindResultsPayloadV460(value)).digest("hex");
const atomic = (path: string, value: unknown): void => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(part, target); };
const v459 = read(paths.v459); const v458 = read(paths.v458); const v457 = read(paths.v457); const dense = read(paths.dense); const formal = read(paths.formal); const formalEvidence = read(formal.source);
if (v459.version !== "v459-kerr-measured-detector-blind-validation-artifact-v1" || v459.qualification?.protocolQualified !== true || v459.inspect?.holdoutRows !== 0 || v458.inspect?.readyFileCount !== 0 || v457.decisions?.promotionAllowed !== false || dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v460-source-boundary");
const sourceSha = "a".repeat(64);
const control = evaluateKerrMeasuredDetectorBlindResultsV460(createKerrMeasuredDetectorBlindControlRowsV460(sourceSha), "synthetic-validation-fixture", sourceSha, { uRepeatability: 0.001, uTrainFit: 0.001, uHoldout: 0.002, uReference: 0.001, uInitialState: 0.001 });
if (control.status !== "validation-only" || !control.thresholdPass || !control.uncertaintyBudget.closed || control.authorityEligible) throw new Error("v460-control-firewall");
const nullMetrics = { plateScaleRepeatCv: null, distortionHoldoutMaxResidualPx: null, psfRepeatCv: null, pixelResponseRelativeResidual: null, holdoutCoverage: null } as const;
const nullBudget = { components: { uRepeatability: null, uTrainFit: null, uHoldout: null, uReference: null, uInitialState: null }, totalLinear: null, combination: "linear-unless-independence-proven" as const, rssAllowed: false as const, closed: false as const };
const unsigned = { version: KERR_MEASURED_DETECTOR_BLIND_RESULTS_ARTIFACT_VERSION_V460, generatedAt: "2026-07-30T00:00:00Z", status: "blind-results-evaluator-qualified-production-results-unavailable" as const, source: { v459ArtifactSha256: v459.artifactSha256, v458IntakeArtifactSha256: v458.artifactSha256, v457PromotionGateArtifactSha256: v457.artifactSha256 }, evaluator: { qualified: true as const, metricCount: 5 as const, rowIdentityRequired: true as const, sourceShaLockedRequired: true as const, thresholdComparisonExplicit: true as const, linearUncertaintyRequired: true as const, syntheticAuthorityFirewall: true as const }, control, production: { status: "incomplete" as const, reason: "measured-inputs-unavailable" as const, trainRows: 0 as const, holdoutRows: 0 as const, metrics: nullMetrics, uncertaintyBudget: nullBudget, authorityEligible: false as const }, inspect: { measuredInputsAvailable: false as const, fitExecuted: false as const, holdoutExecuted: false as const, thresholdGateExecuted: false as const, uncertaintyBudgetClosed: false as const, authorityGranted: false as const, fitsWriteAllowed: false as const, pngWriteAllowed: false as const }, qualification: { evaluatorQualified: true as const, controlResultValidationOnly: true as const, productionResultQualified: false as const, uncertaintyBudgetQualified: false as const, detectorAuthorityGranted: false as const, browserQualification: "not-run" as const }, boundary: { syntheticControlMayGrantAuthority: false as const, productionPixelsAvailable: false as const, sciencePayloadMutationAllowed: false as const, fitsWriteAllowed: false as const, pngWriteAllowed: false as const, networkAttempted: false as const, automaticRetryApplied: false as const }, formalProductPointer: "v263" as const, formalDefaultKernel: "legacy-eih-1pn" as const, denseCampaignStatus: "incomplete-0-of-49" as const };
const artifact = parseKerrMeasuredDetectorBlindResultsArtifactV460({ ...unsigned, artifactSha256: sha(unsigned) }); atomic(paths.output, artifact); console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, evaluator: "qualified", control: "validation-only", controlThresholdPass: artifact.control.thresholdPass, controlUncertaintyClosed: artifact.control.uncertaintyBudget.closed, productionMetrics: "unavailable", fitExecuted: false, holdoutExecuted: false, authorityGranted: false }, null, 2));

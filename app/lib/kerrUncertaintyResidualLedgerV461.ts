import { createHash } from "node:crypto";

export const KERR_UNCERTAINTY_RESIDUAL_LEDGER_ARTIFACT_VERSION_V461 =
  "v461-kerr-uncertainty-residual-ledger-artifact-v1" as const;
export const KERR_UNCERTAINTY_RESIDUAL_LEDGER_SUMMARY_VERSION_V461 =
  "v461-kerr-uncertainty-residual-ledger-summary-v1" as const;
export const KERR_UNCERTAINTY_RESIDUAL_LEDGER_API_VERSION_V461 =
  "v461-kerr-uncertainty-residual-ledger-api-v1" as const;
export const KERR_UNCERTAINTY_COMPONENT_IDS_V461 = Object.freeze([
  "uRepeatability",
  "uTrainFit",
  "uHoldout",
  "uReference",
  "uInitialState",
] as const);
export type KerrUncertaintyComponentIdV461 = (typeof KERR_UNCERTAINTY_COMPONENT_IDS_V461)[number];
export type KerrUncertaintyResidualEntryV461 = Readonly<{
  componentId: KerrUncertaintyComponentIdV461;
  split: "train" | "holdout" | "reference" | "initial-state";
  value: number;
  unit: "fractional-response" | "pixel" | "arcsec" | "electron";
  method: string;
  sourceSha256: string;
  evidenceSha256: string;
}>;
export type KerrHoldoutCoverageLedgerV461 = Readonly<{
  expectedRows: number;
  observedRows: number;
  overlapRows: number;
  duplicateRows: number;
  coverageFraction: number | null;
  rowSetSha256: string | null;
  status: "qualified" | "incomplete" | "rejected";
}>;
export type KerrUncertaintyResidualLedgerResultV461 = Readonly<{
  status: "qualified" | "incomplete" | "rejected" | "validation-only";
  reason: "none" | "entry-inventory" | "duplicate-component" | "source-sha-mismatch" | "nonfinite-value" | "coverage-incomplete" | "coverage-overlap" | "coverage-duplicate";
  entries: readonly KerrUncertaintyResidualEntryV461[];
  coverage: KerrHoldoutCoverageLedgerV461;
  linearTotal: number | null;
  combination: "linear-unless-independence-proven";
  rssAllowed: false;
  closed: boolean;
  authorityEligible: boolean;
}>;
export type KerrUncertaintyResidualLedgerArtifactV461 = Readonly<{
  version: typeof KERR_UNCERTAINTY_RESIDUAL_LEDGER_ARTIFACT_VERSION_V461;
  generatedAt: string;
  status: "residual-ledger-protocol-qualified-production-ledger-unavailable";
  source: Readonly<{ v460ResultsArtifactSha256: string; v459ValidationArtifactSha256: string; v458IntakeArtifactSha256: string }>;
  contract: Readonly<{ componentCount: 5; uniqueComponentRequired: true; sourceShaRequired: true; evidenceShaRequired: true; finiteValueRequired: true; coverageLedgerRequired: true; linearCombinationRequired: true; rssAllowed: false; syntheticAuthorityFirewall: true }>;
  control: KerrUncertaintyResidualLedgerResultV461;
  production: Readonly<{ status: "incomplete"; entries: readonly []; coverage: KerrHoldoutCoverageLedgerV461; linearTotal: null; closed: false; authorityEligible: false }>;
  inspect: Readonly<{ measuredInputsAvailable: false; residualEntries: 0; holdoutExpectedRows: 0; holdoutObservedRows: 0; coverageStatus: "incomplete"; ledgerClosed: false; authorityGranted: false; fitsWriteAllowed: false; pngWriteAllowed: false }>;
  qualification: Readonly<{ ledgerProtocolQualified: true; controlLedgerValidationOnly: true; productionLedgerQualified: false; coverageLedgerQualified: false; detectorAuthorityGranted: false; browserQualification: "not-run" }>;
  boundary: Readonly<{ syntheticControlMayGrantAuthority: false; productionResidualsAvailable: false; sciencePayloadMutationAllowed: false; fitsWriteAllowed: false; pngWriteAllowed: false; networkAttempted: false; automaticRetryApplied: false }>;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  denseCampaignStatus: "incomplete-0-of-49";
  artifactSha256: string;
}>;
export type KerrUncertaintyResidualLedgerSummaryV461 = Readonly<{ version: typeof KERR_UNCERTAINTY_RESIDUAL_LEDGER_SUMMARY_VERSION_V461; status: KerrUncertaintyResidualLedgerArtifactV461["status"]; artifactSha256: string; contract: KerrUncertaintyResidualLedgerArtifactV461["contract"]; control: KerrUncertaintyResidualLedgerArtifactV461["control"]; production: KerrUncertaintyResidualLedgerArtifactV461["production"]; inspect: KerrUncertaintyResidualLedgerArtifactV461["inspect"]; qualification: KerrUnUncertaintyQualificationV461; boundary: KerrUncertaintyResidualLedgerArtifactV461["boundary"] }>;
type KerrUnUncertaintyQualificationV461 = KerrUncertaintyResidualLedgerArtifactV461["qualification"];
export type KerrUncertaintyResidualLedgerApiV461 = Readonly<{ version: typeof KERR_UNCERTAINTY_RESIDUAL_LEDGER_API_VERSION_V461; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed"; summary: KerrUncertaintyResidualLedgerSummaryV461 | null }>;

const SHA256 = /^[a-f0-9]{64}$/; const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]); const freezeDeep = <T>(value: T): T => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value as Record<string, unknown>)) freezeDeep(child); } return value; }; const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)])); export const canonicalKerrUncertaintyResidualLedgerPayloadV461 = (value: unknown): string => JSON.stringify(canonicalize(value)); const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
export function buildKerrUncertaintyResidualLedgerV461(entries: readonly KerrUncertaintyResidualEntryV461[], coverage: KerrHoldoutCoverageLedgerV461, expectedSourceSha256: string, expectedEvidenceSha256: string, contentClass: "measured-detector-calibration" | "synthetic-validation-fixture"): KerrUncertaintyResidualLedgerResultV461 {
  const ids = entries.map((entry) => entry.componentId); const duplicateComponent = ids.length - new Set(ids).size > 0; const inventory = ids.length !== 5 || KERR_UNCERTAINTY_COMPONENT_IDS_V461.some((id) => !ids.includes(id)); const shaMismatch = entries.some((entry) => entry.sourceSha256 !== expectedSourceSha256 || entry.evidenceSha256 !== expectedEvidenceSha256 || !SHA256.test(entry.sourceSha256) || !SHA256.test(entry.evidenceSha256)); const nonfinite = entries.some((entry) => !finite(entry.value) || entry.value < 0); const reason = duplicateComponent ? "duplicate-component" : inventory ? "entry-inventory" : shaMismatch ? "source-sha-mismatch" : nonfinite ? "nonfinite-value" : coverage.overlapRows > 0 ? "coverage-overlap" : coverage.duplicateRows > 0 ? "coverage-duplicate" : coverage.status !== "qualified" ? "coverage-incomplete" : "none"; const linearTotal = reason === "none" ? entries.reduce((sum, entry) => sum + entry.value, 0) : null; const closed = reason === "none" && linearTotal !== null && coverage.coverageFraction !== null; const baseStatus = reason === "none" && closed ? "qualified" : reason === "none" ? "incomplete" : "rejected"; const status = contentClass === "synthetic-validation-fixture" && baseStatus === "qualified" ? "validation-only" : baseStatus; return freezeDeep({ status, reason, entries: Object.freeze(entries), coverage, linearTotal, combination: "linear-unless-independence-proven" as const, rssAllowed: false as const, closed, authorityEligible: status === "qualified" });
}
export const createKerrUncertaintyResidualControlEntriesV461 = (sourceSha256: string, evidenceSha256: string): readonly KerrUncertaintyResidualEntryV461[] => Object.freeze([{ componentId: "uRepeatability", split: "train", value: 0.001, unit: "fractional-response", method: "synthetic-repeatability-control", sourceSha256, evidenceSha256 }, { componentId: "uTrainFit", split: "train", value: 0.001, unit: "fractional-response", method: "synthetic-train-fit-control", sourceSha256, evidenceSha256 }, { componentId: "uHoldout", split: "holdout", value: 0.002, unit: "fractional-response", method: "synthetic-holdout-control", sourceSha256, evidenceSha256 }, { componentId: "uReference", split: "reference", value: 0.001, unit: "fractional-response", method: "synthetic-reference-control", sourceSha256, evidenceSha256 }, { componentId: "uInitialState", split: "initial-state", value: 0.001, unit: "fractional-response", method: "synthetic-initial-state-control", sourceSha256, evidenceSha256 }]);
export const createKerrUncertaintyCoverageControlV461 = (): KerrHoldoutCoverageLedgerV461 => Object.freeze({ expectedRows: 6, observedRows: 6, overlapRows: 0, duplicateRows: 0, coverageFraction: 1, rowSetSha256: createHash("sha256").update("v461-control-holdout-rows").digest("hex"), status: "qualified" });
export function parseKerrUncertaintyResidualLedgerArtifactV461(value: unknown): KerrUncertaintyResidualLedgerArtifactV461 { const artifact = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrUncertaintyResidualLedgerArtifactV461> : null; if (!artifact || artifact.version !== KERR_UNCERTAINTY_RESIDUAL_LEDGER_ARTIFACT_VERSION_V461 || artifact.status !== "residual-ledger-protocol-qualified-production-ledger-unavailable" || !SHA256.test(artifact.artifactSha256 ?? "") || !artifact.source || Object.values(artifact.source).some((entry) => !SHA256.test(entry)) || artifact.contract?.componentCount !== 5 || artifact.contract.uniqueComponentRequired !== true || artifact.contract.sourceShaRequired !== true || artifact.contract.evidenceShaRequired !== true || artifact.contract.finiteValueRequired !== true || artifact.contract.coverageLedgerRequired !== true || artifact.contract.linearCombinationRequired !== true || artifact.contract.rssAllowed !== false || artifact.contract.syntheticAuthorityFirewall !== true || artifact.control?.status !== "validation-only" || artifact.control.closed !== true || artifact.control.authorityEligible !== false || artifact.production?.status !== "incomplete" || artifact.production.entries.length !== 0 || artifact.production.linearTotal !== null || artifact.production.closed !== false || artifact.production.authorityEligible !== false || artifact.inspect?.measuredInputsAvailable !== false || artifact.inspect.residualEntries !== 0 || artifact.inspect.holdoutExpectedRows !== 0 || artifact.inspect.holdoutObservedRows !== 0 || artifact.inspect.coverageStatus !== "incomplete" || artifact.inspect.ledgerClosed !== false || artifact.inspect.authorityGranted !== false || artifact.inspect.fitsWriteAllowed !== false || artifact.inspect.pngWriteAllowed !== false || artifact.qualification?.ledgerProtocolQualified !== true || artifact.qualification.controlLedgerValidationOnly !== true || artifact.qualification.productionLedgerQualified !== false || artifact.qualification.coverageLedgerQualified !== false || artifact.qualification.detectorAuthorityGranted !== false || artifact.qualification.browserQualification !== "not-run" || artifact.boundary?.syntheticControlMayGrantAuthority !== false || artifact.boundary.productionResidualsAvailable !== false || artifact.boundary.sciencePayloadMutationAllowed !== false || artifact.boundary.fitsWriteAllowed !== false || artifact.boundary.pngWriteAllowed !== false || artifact.boundary.networkAttempted !== false || artifact.boundary.automaticRetryApplied !== false || artifact.formalProductPointer !== "v263" || artifact.formalDefaultKernel !== "legacy-eih-1pn" || artifact.denseCampaignStatus !== "incomplete-0-of-49") throw new Error("v461-residual-ledger-artifact-identity"); return freezeDeep(value as KerrUncertaintyResidualLedgerArtifactV461); }
export function createKerrUncertaintyResidualLedgerSummaryV461(value: unknown): KerrUncertaintyResidualLedgerSummaryV461 { const artifact = parseKerrUncertaintyResidualLedgerArtifactV461(value); return freezeDeep({ version: KERR_UNCERTAINTY_RESIDUAL_LEDGER_SUMMARY_VERSION_V461, status: artifact.status, artifactSha256: artifact.artifactSha256, contract: artifact.contract, control: artifact.control, production: artifact.production, inspect: artifact.inspect, qualification: artifact.qualification, boundary: artifact.boundary }); }
export function parseKerrUncertaintyResidualLedgerApiV461(value: unknown): KerrUncertaintyResidualLedgerApiV461 { const api = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrUncertaintyResidualLedgerApiV461> : null; if (!api || api.version !== KERR_UNCERTAINTY_RESIDUAL_LEDGER_API_VERSION_V461 || typeof api.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(api.reason ?? "") || (api.available && !api.summary) || (!api.available && api.summary !== null)) throw new Error("v461-residual-ledger-api-identity"); return freezeDeep(value as KerrUncertaintyResidualLedgerApiV461); }

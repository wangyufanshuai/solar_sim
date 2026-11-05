export type AtlasShadowCapabilityPointerV403 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v403";
  status: "fixture-lifecycle-replay-qualified-browser-soak-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v402CacheLifecycle: "static-qualified-final-scope-release-entries-0-bytes-0";
    v403FixtureReplay: "qualified-30-cycles-114-requests-30-baselines";
    v403ReplayOutcomes: "108-success-4-failure-2-released-pending";
    v403Determinism: "qualified-two-executions-canonical-equal";
    v403AuditRail: "implemented-runtime-ledger-awaiting-browser-qualification";
    v403BrowserSoak: "not-run";
    v403ProductionLifecycle: "not-qualified";
    v403VisualMatrix: "not-run";
    v403RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV403(value: unknown): AtlasShadowCapabilityPointerV403 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV403> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v403" || source.status !== "fixture-lifecycle-replay-qualified-browser-soak-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || source.capabilities?.v402CacheLifecycle !== "static-qualified-final-scope-release-entries-0-bytes-0" || source.capabilities.v403FixtureReplay !== "qualified-30-cycles-114-requests-30-baselines" || source.capabilities.v403ReplayOutcomes !== "108-success-4-failure-2-released-pending" || source.capabilities.v403Determinism !== "qualified-two-executions-canonical-equal" || source.capabilities.v403AuditRail !== "implemented-runtime-ledger-awaiting-browser-qualification" || source.capabilities.v403BrowserSoak !== "not-run" || source.capabilities.v403ProductionLifecycle !== "not-qualified" || source.capabilities.v403VisualMatrix !== "not-run" || source.capabilities.v403RtxWebGpu !== "not-run" || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable" || !SHA256.test(source.evidence?.fileSha256 ?? "") || !SHA256.test(source.evidence?.canonicalSha256 ?? "") || !SHA256.test(source.pointerSha256 ?? "")) throw new Error("v403-pointer-identity");
  return value as AtlasShadowCapabilityPointerV403;
}

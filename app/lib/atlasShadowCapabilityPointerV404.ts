export type AtlasShadowCapabilityPointerV404 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v404";
  status: "bounded-lifecycle-summary-qualified-browser-soak-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v403FixtureReplay: "qualified-30-cycles-114-requests-30-baselines";
    v404BoundedSummary: "qualified-cycles-omitted-response-under-128-kib";
    v404WorkbenchEvidence: "implemented-read-only-single-flight";
    v404V12AuditRail: "implemented-read-only-single-flight";
    v404LiteBoundary: "unavailable";
    v404BrowserSoak: "not-run";
    v404ProductionLifecycle: "not-qualified";
    v404VisualMatrix: "not-run";
    v404RtxWebGpu: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV404(value: unknown): AtlasShadowCapabilityPointerV404 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<AtlasShadowCapabilityPointerV404>
    : null;
  if (
    !source
    || source.version !== "orbit-atlas-current-local-shadow-candidate-v404"
    || source.status !== "bounded-lifecycle-summary-qualified-browser-soak-pending-dense-incomplete-0-of-49"
    || source.formalProductPointer !== "v263"
    || source.formalProductPointerAdvanced !== false
    || source.localShadowDefaultApplied !== false
    || source.publicDeploymentBlocked !== true
    || source.capabilities?.v403FixtureReplay !== "qualified-30-cycles-114-requests-30-baselines"
    || source.capabilities.v404BoundedSummary !== "qualified-cycles-omitted-response-under-128-kib"
    || source.capabilities.v404WorkbenchEvidence !== "implemented-read-only-single-flight"
    || source.capabilities.v404V12AuditRail !== "implemented-read-only-single-flight"
    || source.capabilities.v404LiteBoundary !== "unavailable"
    || source.capabilities.v404BrowserSoak !== "not-run"
    || source.capabilities.v404ProductionLifecycle !== "not-qualified"
    || source.capabilities.v404VisualMatrix !== "not-run"
    || source.capabilities.v404RtxWebGpu !== "not-run"
    || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49"
    || source.capabilities.denseAggregate !== "unavailable"
    || !SHA256.test(source.evidence?.fileSha256 ?? "")
    || !SHA256.test(source.evidence?.canonicalSha256 ?? "")
    || !SHA256.test(source.pointerSha256 ?? "")
  ) throw new Error("v404-pointer-identity");
  return value as AtlasShadowCapabilityPointerV404;
}

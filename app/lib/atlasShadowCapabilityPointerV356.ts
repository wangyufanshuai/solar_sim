export type AtlasShadowCapabilityPointerV356 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v356";
  generatedAt: string;
  status: "spectral-envelope-v356-qualified-fixture-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v355Eigenmodes: "qualified-deterministic-synthetic-principal-axes";
    v356Envelope: "qualified-reconstructable-synthetic-2d-3d-envelope";
    v356Exports: "qualified-sanitized-json-csv-path-pid-time-excluded";
    v356MeasuredEnvelopeAuthority: "unavailable-input-covariance-is-synthetic-not-measured";
    v356CinematicBoundary: "provenance-and-uncertainty-envelopes-never-cinematic-color-input";
    v356FitsPng: "unavailable-browser-free-offline-product-not-generated";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

export function parseAtlasShadowCapabilityPointerV356(value: unknown): AtlasShadowCapabilityPointerV356 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV356> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v356" || source.status !== "spectral-envelope-v356-qualified-fixture-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || source.capabilities?.v355Eigenmodes !== "qualified-deterministic-synthetic-principal-axes" || source.capabilities.v356Envelope !== "qualified-reconstructable-synthetic-2d-3d-envelope" || source.capabilities.v356Exports !== "qualified-sanitized-json-csv-path-pid-time-excluded" || source.capabilities.v356MeasuredEnvelopeAuthority !== "unavailable-input-covariance-is-synthetic-not-measured" || source.capabilities.v356CinematicBoundary !== "provenance-and-uncertainty-envelopes-never-cinematic-color-input" || source.capabilities.v356FitsPng !== "unavailable-browser-free-offline-product-not-generated" || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable" || source.capabilities.browserQualification !== "not-run" || !/^[a-f0-9]{64}$/.test(source.pointerSha256 ?? "")) throw new Error("v356-capability-pointer-identity");
  return value as AtlasShadowCapabilityPointerV356;
}

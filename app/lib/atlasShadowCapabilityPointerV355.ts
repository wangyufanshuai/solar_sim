export type AtlasShadowCapabilityPointerV355 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v355";
  generatedAt: string;
  status: "spectral-eigenmode-v355-qualified-fixture-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v354SpectralCorrelation: "qualified-explicit-positive-definite-synthetic-covariance";
    v355Eigenmodes: "qualified-deterministic-synthetic-principal-axes";
    v355Ellipses: "qualified-three-band-pair-one-sigma-ellipses";
    v355MeasuredEigenmodeAuthority: "unavailable-input-covariance-is-synthetic-not-measured";
    v355CinematicBoundary: "spectral-eigenmodes-and-ellipses-never-cinematic-color-input";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

export function parseAtlasShadowCapabilityPointerV355(value: unknown): AtlasShadowCapabilityPointerV355 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<AtlasShadowCapabilityPointerV355>
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v355" ||
    source.status !== "spectral-eigenmode-v355-qualified-fixture-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v354SpectralCorrelation !== "qualified-explicit-positive-definite-synthetic-covariance" ||
    source.capabilities.v355Eigenmodes !== "qualified-deterministic-synthetic-principal-axes" ||
    source.capabilities.v355Ellipses !== "qualified-three-band-pair-one-sigma-ellipses" ||
    source.capabilities.v355MeasuredEigenmodeAuthority !== "unavailable-input-covariance-is-synthetic-not-measured" ||
    source.capabilities.v355CinematicBoundary !== "spectral-eigenmodes-and-ellipses-never-cinematic-color-input" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !/^[a-f0-9]{64}$/.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v355-capability-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV355;
}

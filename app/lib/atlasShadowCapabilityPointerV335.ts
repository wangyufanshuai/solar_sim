export type AtlasShadowCapabilityPointerV335 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v335";
  status: "resource-lifecycle-replay-v335-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v334RuntimeMatrix: "v5-v6-eight-groups-sixteen-consumption-rows";
    v335LifecycleKinds: "eleven-registry-kinds-covered";
    v335BaselineReturn: "identity-owner-bytes-all-zero-diff";
    v335ReleaseSemantics: "reverse-order-idempotent-duplicate-safe";
    v335ReplayBoundary: "bounded-in-process-no-worker-gpu-network-created";
    v335BrowserGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV335(value: unknown): value is AtlasShadowCapabilityPointerV335 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV335>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v335"
    && pointer.status === "resource-lifecycle-replay-v335-qualified-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v334RuntimeMatrix === "v5-v6-eight-groups-sixteen-consumption-rows"
    && pointer.capabilities.v335LifecycleKinds === "eleven-registry-kinds-covered"
    && pointer.capabilities.v335BaselineReturn === "identity-owner-bytes-all-zero-diff"
    && pointer.capabilities.v335ReleaseSemantics === "reverse-order-idempotent-duplicate-safe"
    && pointer.capabilities.v335ReplayBoundary === "bounded-in-process-no-worker-gpu-network-created"
    && pointer.capabilities.v335BrowserGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}

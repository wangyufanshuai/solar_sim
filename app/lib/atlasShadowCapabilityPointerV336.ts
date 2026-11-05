export type AtlasShadowCapabilityPointerV336 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v336";
  status: "runtime-profile-state-replay-v336-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v335LifecycleBaseline: "eleven-registry-kinds-identity-owner-bytes-returned";
    v336ProfileSequence: "legacy-v9-to-v5-to-v6-to-legacy-v9";
    v336StateInvariants: "scene-selection-scale-research-focus-panels-safe-viewport-no-drift";
    v336SceneRevision: "zero-increment";
    v336CameraLease: "identity-returned-to-baseline-idempotent";
    v336SingleCanvas: "static-main-scene-host-count-one-browser-pending";
    v336ScienceCinematicBoundary: "presentation-only-no-selection-or-runtime-physics-mutation";
    v336ResolverStability: "v5-v6-reference-stable";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV336(value: unknown): value is AtlasShadowCapabilityPointerV336 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV336>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v336"
    && pointer.status === "runtime-profile-state-replay-v336-qualified-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v335LifecycleBaseline === "eleven-registry-kinds-identity-owner-bytes-returned"
    && pointer.capabilities.v336ProfileSequence === "legacy-v9-to-v5-to-v6-to-legacy-v9"
    && pointer.capabilities.v336StateInvariants === "scene-selection-scale-research-focus-panels-safe-viewport-no-drift"
    && pointer.capabilities.v336SceneRevision === "zero-increment"
    && pointer.capabilities.v336CameraLease === "identity-returned-to-baseline-idempotent"
    && pointer.capabilities.v336SingleCanvas === "static-main-scene-host-count-one-browser-pending"
    && pointer.capabilities.v336ScienceCinematicBoundary === "presentation-only-no-selection-or-runtime-physics-mutation"
    && pointer.capabilities.v336ResolverStability === "v5-v6-reference-stable"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}

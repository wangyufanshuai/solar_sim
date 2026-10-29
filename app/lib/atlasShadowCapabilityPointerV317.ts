export type AtlasShadowCapabilityPointerV317 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v317";
  status: "buffer-integrity-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v315ScienceRuntime: "implemented-v312-v313-sparse-authority";
    v316VisualTokenFields: "static-qualified-46-of-46-runtime-signature-wired";
    v317ScienceBufferIntegrity: "qualified-67-of-67-byte-digested-raster-disjoint";
    v317InteractiveAuthority: "current-v312-v313-full-short-shadow-only-differential-pending";
    v317Lifecycle: "idempotent-texture-worker-response-scope-static-qualified-browser-baseline-pending";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV317(value: unknown): value is AtlasShadowCapabilityPointerV317 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV317>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v317"
    && pointer.status === "buffer-integrity-qualified-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263"
    && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false
    && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v315ScienceRuntime === "implemented-v312-v313-sparse-authority"
    && pointer.capabilities.v316VisualTokenFields === "static-qualified-46-of-46-runtime-signature-wired"
    && pointer.capabilities.v317ScienceBufferIntegrity === "qualified-67-of-67-byte-digested-raster-disjoint"
    && pointer.capabilities.v317InteractiveAuthority === "current-v312-v313-full-short-shadow-only-differential-pending"
    && pointer.capabilities.v317Lifecycle === "idempotent-texture-worker-response-scope-static-qualified-browser-baseline-pending"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string"
    && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}

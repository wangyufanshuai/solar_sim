export type AtlasShadowCapabilityPointerV316 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v316";
  status: "visual-token-fields-qualified-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v315ScienceRuntime: "implemented-v312-v313-sparse-authority";
    v316VisualTokenFields: "static-qualified-46-of-46-runtime-signature-wired";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    scienceCinematicBoundary: "immutable-science-buffer-seeded-cinematic-only";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV316(value: unknown): value is AtlasShadowCapabilityPointerV316 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV316>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v316"
    && pointer.status === "visual-token-fields-qualified-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263"
    && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false
    && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v315ScienceRuntime === "implemented-v312-v313-sparse-authority"
    && pointer.capabilities.v316VisualTokenFields === "static-qualified-46-of-46-runtime-signature-wired"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.scienceCinematicBoundary === "immutable-science-buffer-seeded-cinematic-only"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string"
    && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}


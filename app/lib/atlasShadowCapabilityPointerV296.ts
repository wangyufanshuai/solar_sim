export type AtlasShadowCapabilityPointerV296 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v296";
  status: "geometry-redshift-qualified-polarization-and-heavy-qualification-pending";
  capabilities: Readonly<{
    v282: "identity-cache-partial-1-of-9";
    v288: "failed-preserved";
    v291: "diagnostics-failed-preserved";
    v292: "geometry-redshift-failed-preserved";
    v293: "blocked-by-v292-preserved";
    v296: "geometry-redshift-qualified";
    polarization: "pending-v297";
    campaign: "incomplete-0-of-49";
    browserQualification: "not-run";
  }>;
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  pointerSha256: string;
}>;

export function validateAtlasShadowCapabilityPointerV296(value: AtlasShadowCapabilityPointerV296): boolean {
  return value.version === "orbit-atlas-current-local-shadow-candidate-v296"
    && value.status === "geometry-redshift-qualified-polarization-and-heavy-qualification-pending"
    && value.capabilities.v296 === "geometry-redshift-qualified"
    && value.capabilities.polarization === "pending-v297"
    && value.capabilities.campaign === "incomplete-0-of-49"
    && value.formalProductPointerAdvanced === false
    && value.localShadowDefaultApplied === false
    && /^[a-f0-9]{64}$/.test(value.pointerSha256);
}

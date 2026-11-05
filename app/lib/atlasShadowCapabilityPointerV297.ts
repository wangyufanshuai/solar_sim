export type AtlasShadowCapabilityPointerV297 = {
  version: "orbit-atlas-current-local-shadow-candidate-v297";
  status: "full-kerr-short-authority-qualified-campaign-pending" | "polarization-failed-campaign-blocked";
  capabilities: {
    v282: "identity-cache-partial-1-of-9";
    v283: "qualification-withdrawn";
    v284: "quarantined-nonauthoritative-1-of-49";
    v288: "failed-preserved";
    v296: "geometry-redshift-qualified";
    v297: "full-kerr-short-authority-qualified" | "polarization-short-gate-failed";
    campaign: "incomplete-0-of-49" | "blocked-by-v297";
    browserQualification: "not-run";
  };
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
};

export function isAtlasShadowCapabilityPointerV297(value: unknown): value is AtlasShadowCapabilityPointerV297 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AtlasShadowCapabilityPointerV297>;
  return candidate.version === "orbit-atlas-current-local-shadow-candidate-v297"
    && (candidate.status === "full-kerr-short-authority-qualified-campaign-pending" || candidate.status === "polarization-failed-campaign-blocked")
    && candidate.formalProductPointer === "v263"
    && candidate.formalProductPointerAdvanced === false
    && candidate.localShadowDefaultApplied === false
    && candidate.publicDeploymentBlocked === true;
}

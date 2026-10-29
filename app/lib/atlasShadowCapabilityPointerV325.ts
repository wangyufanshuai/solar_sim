export type AtlasShadowCapabilityPointerV325 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v325";
  status: "componentwise-uncertainty-wired-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v324ScienceProfileAB: "science-equivalent-cinematic-distinct";
    v325ScienceUncertainty: "four-rays-twelve-bands-linear-sum-no-rss";
    v325Interpretation: "deterministic-audit-envelope-not-statistical-confidence-interval";
    v325RuntimeBoundary: "science-intent-only-cinematic-hidden";
    v325BrowserGate: "authored-not-run";
    cpuScienceAuthority: "v312-geometry+v313-polarization";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    v5V6Profiles: "manual-local-shadow-only-not-default";
    browserQualification: "not-run";
  }>;
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV325(value: unknown): value is AtlasShadowCapabilityPointerV325 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV325>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v325"
    && pointer.status === "componentwise-uncertainty-wired-browser-pending-dense-incomplete-0-of-49"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && pointer.capabilities?.v324ScienceProfileAB === "science-equivalent-cinematic-distinct"
    && pointer.capabilities.v325ScienceUncertainty === "four-rays-twelve-bands-linear-sum-no-rss"
    && pointer.capabilities.v325Interpretation === "deterministic-audit-envelope-not-statistical-confidence-interval"
    && pointer.capabilities.v325RuntimeBoundary === "science-intent-only-cinematic-hidden"
    && pointer.capabilities.v325BrowserGate === "authored-not-run"
    && pointer.capabilities.cpuScienceAuthority === "v312-geometry+v313-polarization"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && pointer.capabilities.denseAggregate === "unavailable"
    && pointer.capabilities.v5V6Profiles === "manual-local-shadow-only-not-default"
    && pointer.capabilities.browserQualification === "not-run"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}

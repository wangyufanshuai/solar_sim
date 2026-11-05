export type AtlasShadowCapabilityPointerV295 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v295";
  status: "low-memory-implementation-complete-heavy-qualification-pending";
  capabilities: Readonly<{
    v282: "identity-cache-partial-1-of-9";
    legacyV283: "qualification-withdrawn";
    legacyV284: "quarantined";
    v288: "failed-preserved";
    v291: "diagnostics-qualified" | "diagnostics-failed";
    v292: "geometry-redshift-qualified" | "geometry-redshift-failed";
    v293: "polarization-qualified" | "blocked-by-geometry" | "polarization-failed";
    campaign: "incomplete-0-of-49";
    v294: "implemented-awaiting-browser-qualification";
    v295: "heavy-qualification-pending";
  }>;
  formalProductPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  pointerSha256: string;
}>;

export function validateAtlasShadowCapabilityPointerV295(value: AtlasShadowCapabilityPointerV295): boolean {
  return value.version === "orbit-atlas-current-local-shadow-candidate-v295"
    && value.status === "low-memory-implementation-complete-heavy-qualification-pending"
    && value.capabilities.v282 === "identity-cache-partial-1-of-9"
    && value.capabilities.v288 === "failed-preserved"
    && value.capabilities.campaign === "incomplete-0-of-49"
    && value.capabilities.v295 === "heavy-qualification-pending"
    && value.formalProductPointerAdvanced === false
    && value.localShadowDefaultApplied === false
    && /^[a-f0-9]{64}$/.test(value.pointerSha256);
}

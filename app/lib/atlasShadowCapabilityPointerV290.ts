export type AtlasShadowCapabilityStateV290 =
  | "qualified"
  | "identity-cache-partial-1-of-9"
  | "qualification-withdrawn"
  | "quarantined"
  | "qualified-short-gate-only"
  | "blocked"
  | "incomplete-0-of-49"
  | "implemented-awaiting-browser-qualification"
  | "incomplete-heavy-qualification-not-run";

export type AtlasShadowCapabilityPointerV290 = {
  version: "orbit-atlas-current-local-shadow-candidate-v290";
  status: "low-memory-implementation-complete-heavy-qualification-pending";
  capabilities: {
    v281: AtlasShadowCapabilityStateV290;
    v282: AtlasShadowCapabilityStateV290;
    legacyV283: AtlasShadowCapabilityStateV290;
    legacyV284: AtlasShadowCapabilityStateV290;
    v288ShortGate: AtlasShadowCapabilityStateV290;
    v288Campaign: AtlasShadowCapabilityStateV290;
    v289: AtlasShadowCapabilityStateV290;
    v290: AtlasShadowCapabilityStateV290;
  };
  formalProductPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  pointerSha256: string;
};

export type AtlasShadowCapabilityPointerV314 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v314";
  status: "full-kerr-short-qualified-corrected-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{ fullKerrShortAuthority: "qualified-v312-v313-envelope"; historicalV298r1: "quarantined-1-of-49-tolerance-ladder-degenerate"; v314CorrectedDense: "incomplete-0-of-49"; runNext: "implemented-disabled-awaiting-explicit-authorization"; denseAggregate: "unavailable"; browserQualification: "not-run" }>;
  pointerSha256: string;
}>;
export function isAtlasShadowCapabilityPointerV314(value: unknown): value is AtlasShadowCapabilityPointerV314 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV314>;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v314" && pointer.status === "full-kerr-short-qualified-corrected-dense-incomplete-0-of-49" && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true && pointer.capabilities?.fullKerrShortAuthority === "qualified-v312-v313-envelope" && pointer.capabilities.historicalV298r1 === "quarantined-1-of-49-tolerance-ladder-degenerate" && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49" && pointer.capabilities.runNext === "implemented-disabled-awaiting-explicit-authorization" && pointer.capabilities.denseAggregate === "unavailable" && pointer.capabilities.browserQualification === "not-run" && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}

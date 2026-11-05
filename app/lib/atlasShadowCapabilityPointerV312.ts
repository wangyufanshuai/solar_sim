export type AtlasShadowCapabilityPointerV312 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v312";
  status: "corrected-geometry-qualified-polarization-and-dense-pending";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v296: "geometry-redshift-qualified-historical";
    v296ToleranceConvergence: "withdrawn-same-effective-solver-tolerance";
    v297: "historical-polarization-qualified-not-v312-promoted";
    v298r1: "quarantined-1-of-49-tolerance-ladder-degenerate";
    v311: "negative-truth-evidence-qualified";
    v312GeometryTolerance: "corrected-authority-qualified";
    v312Polarization: "requalification-pending";
    correctedDenseCampaign: "not-created";
    browserQualification: "not-run";
    visualV5V6: "manual-local-shadow-only-not-default";
  }>;
  continuation: "requalify-polarization-against-v312-then-create-new-dense-namespace-only-with-explicit-shard-authorization";
  pointerSha256: string;
}>;

export function isAtlasShadowCapabilityPointerV312(value: unknown): value is AtlasShadowCapabilityPointerV312 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pointer = value as Partial<AtlasShadowCapabilityPointerV312>;
  const capabilities = pointer.capabilities;
  return pointer.version === "orbit-atlas-current-local-shadow-candidate-v312"
    && pointer.status === "corrected-geometry-qualified-polarization-and-dense-pending"
    && pointer.formalProductPointer === "v263" && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false && pointer.publicDeploymentBlocked === true
    && capabilities?.v298r1 === "quarantined-1-of-49-tolerance-ladder-degenerate"
    && capabilities.v312GeometryTolerance === "corrected-authority-qualified"
    && capabilities.v312Polarization === "requalification-pending"
    && capabilities.correctedDenseCampaign === "not-created"
    && pointer.continuation === "requalify-polarization-against-v312-then-create-new-dense-namespace-only-with-explicit-shard-authorization"
    && typeof pointer.pointerSha256 === "string" && /^[a-f0-9]{64}$/.test(pointer.pointerSha256);
}

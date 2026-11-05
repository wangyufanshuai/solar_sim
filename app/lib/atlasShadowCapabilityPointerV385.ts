export type AtlasShadowCapabilityPointerV385 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v385";
  status: "photon-error-budget-v385-computational-qualified-scientific-systematics-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v384PhotonObservable: "qualified-four-authority-disk-rays";
    v385ComputationalBudget: "qualified-four-components-linear-upper-bound";
    v385ScientificSystematics: "unavailable-two-of-two";
    v385CombinationRule: "linear-sum-rss-prohibited-unknown-not-zero";
    v385AbsoluteScientificBudget: "not-qualified";
    v385ElectronExpectation: "unavailable";
    v385ObservedCounts: "unavailable";
    v385RuntimeConsumer: "v11-uncertainty-breaker-ladder-wired";
    v385PromotionBoundary: "computational-only-zero-authority-zero-image-zero-counts";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{
    path: string;
    fileSha256: string;
    canonicalSha256: string;
  }>;
  pointerSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;

export function parseAtlasShadowCapabilityPointerV385(
  value: unknown,
): AtlasShadowCapabilityPointerV385 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV385>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v385" ||
    source.status !==
      "photon-error-budget-v385-computational-qualified-scientific-systematics-unavailable-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v384PhotonObservable !==
      "qualified-four-authority-disk-rays" ||
    source.capabilities.v385ComputationalBudget !==
      "qualified-four-components-linear-upper-bound" ||
    source.capabilities.v385ScientificSystematics !==
      "unavailable-two-of-two" ||
    source.capabilities.v385CombinationRule !==
      "linear-sum-rss-prohibited-unknown-not-zero" ||
    source.capabilities.v385AbsoluteScientificBudget !== "not-qualified" ||
    source.capabilities.v385ElectronExpectation !== "unavailable" ||
    source.capabilities.v385ObservedCounts !== "unavailable" ||
    source.capabilities.v385RuntimeConsumer !==
      "v11-uncertainty-breaker-ladder-wired" ||
    source.capabilities.v385PromotionBoundary !==
      "computational-only-zero-authority-zero-image-zero-counts" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v385-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV385;
}

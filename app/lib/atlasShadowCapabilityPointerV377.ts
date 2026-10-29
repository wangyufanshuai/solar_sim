export type AtlasShadowCapabilityPointerV377 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v377";
  status: "visual-v11-measurement-lab-v377-implemented-science-image-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v375MeasuredExpectation: "unavailable-0-of-12";
    v376ScienceImage: "unavailable-no-pixel-arrays";
    v377VisualProfile: "science-cinematic-v11-measurement-lab";
    v377RuntimeTokens: "hud-and-strong-gravity-consumers-wired";
    v377ScienceBoundary: "identity-linear-float64-1-0-0-immutable";
    v377CinematicBoundary: "seeded-decoration-no-science-encoding";
    v377DefaultBoundary: "manual-local-shadow-only-default-legacy-v9";
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

export function parseAtlasShadowCapabilityPointerV377(
  value: unknown,
): AtlasShadowCapabilityPointerV377 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<AtlasShadowCapabilityPointerV377>)
      : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v377" ||
    source.status !==
      "visual-v11-measurement-lab-v377-implemented-science-image-unavailable-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v375MeasuredExpectation !== "unavailable-0-of-12" ||
    source.capabilities.v376ScienceImage !== "unavailable-no-pixel-arrays" ||
    source.capabilities.v377VisualProfile !==
      "science-cinematic-v11-measurement-lab" ||
    source.capabilities.v377RuntimeTokens !==
      "hud-and-strong-gravity-consumers-wired" ||
    source.capabilities.v377ScienceBoundary !==
      "identity-linear-float64-1-0-0-immutable" ||
    source.capabilities.v377CinematicBoundary !==
      "seeded-decoration-no-science-encoding" ||
    source.capabilities.v377DefaultBoundary !==
      "manual-local-shadow-only-default-legacy-v9" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v377-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV377;
}

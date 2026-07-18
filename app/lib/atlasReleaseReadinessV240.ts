export const ATLAS_RELEASE_READINESS_V240_VERSION =
  "v240-local-release-readiness" as const;

export type AtlasReleaseOutcomeV240 =
  | "orbit-atlas-web-1.0.0-ga-ready-local"
  | "orbit-atlas-web-1.0.0-local-candidate-blocked";

export type AtlasDesktopReleaseOutcomeV240 =
  | "desktop-1.0.0-beta.1-unsigned-rc"
  | "desktop-1.0.0-beta.1-signed-external-install-qualified";

export type AtlasResearchReleaseOutcomeV240 =
  | "relativity-v12-research-candidate-shadow-retained"
  | "relativity-v12-promotion-qualified-not-applied";

export type AtlasReleaseGateIdV240 =
  | "evidence-consistent"
  | "typescript"
  | "rust"
  | "regression"
  | "standalone-build"
  | "lite-build"
  | "content-packs"
  | "visual-40-frame"
  | "fresh-browser-qa"
  | "accessibility"
  | "lifecycle-30-cycle"
  | "bundle-budget"
  | "rtx4060-performance";

export type AtlasReleaseGateMapV240 = Readonly<Record<AtlasReleaseGateIdV240, boolean>>;

export type AtlasReleaseReadinessInputV240 = {
  productGates: AtlasReleaseGateMapV240;
  denseKerrComplete: boolean;
  variationalStmQualified: boolean;
  perBodyNoRegression: boolean;
  scientificPromotionQualified: boolean;
  desktopArtifactsBuilt: boolean;
  desktopSigned: boolean;
  externalInstallReportPassed: boolean;
};

export type AtlasReleaseReadinessV240 = {
  version: typeof ATLAS_RELEASE_READINESS_V240_VERSION;
  product: {
    outcome: AtlasReleaseOutcomeV240;
    passed: boolean;
    blockers: readonly AtlasReleaseGateIdV240[];
  };
  desktop: {
    outcome: AtlasDesktopReleaseOutcomeV240;
    artifactsBuilt: boolean;
    signed: boolean;
    externalInstallReportPassed: boolean;
    blockers: readonly string[];
  };
  research: {
    outcome: AtlasResearchReleaseOutcomeV240;
    defaultKernel: "legacy-eih-1pn";
    candidateRuntimePolicy: "offline-shadow";
    denseKerrComplete: boolean;
    variationalStmQualified: boolean;
    perBodyNoRegression: boolean;
    blockers: readonly string[];
  };
  boundary: "local-evidence-only-no-deploy-sign-stage-commit-or-runtime-promotion";
};

export function evaluateAtlasReleaseReadinessV240(
  input: AtlasReleaseReadinessInputV240,
): AtlasReleaseReadinessV240 {
  const productBlockers = (Object.entries(input.productGates) as Array<
    [AtlasReleaseGateIdV240, boolean]
  >)
    .filter(([, passed]) => !passed)
    .map(([id]) => id);
  const productPassed = productBlockers.length === 0;
  const desktopQualified = input.desktopArtifactsBuilt && input.desktopSigned &&
    input.externalInstallReportPassed;
  const researchQualified = input.scientificPromotionQualified &&
    input.denseKerrComplete && input.variationalStmQualified && input.perBodyNoRegression;

  return {
    version: ATLAS_RELEASE_READINESS_V240_VERSION,
    product: {
      outcome: productPassed
        ? "orbit-atlas-web-1.0.0-ga-ready-local"
        : "orbit-atlas-web-1.0.0-local-candidate-blocked",
      passed: productPassed,
      blockers: productBlockers,
    },
    desktop: {
      outcome: desktopQualified
        ? "desktop-1.0.0-beta.1-signed-external-install-qualified"
        : "desktop-1.0.0-beta.1-unsigned-rc",
      artifactsBuilt: input.desktopArtifactsBuilt,
      signed: input.desktopSigned,
      externalInstallReportPassed: input.externalInstallReportPassed,
      blockers: [
        ...(!input.desktopArtifactsBuilt ? ["desktop-artifacts-not-built"] : []),
        ...(!input.desktopSigned ? ["azure-artifact-signing-not-complete"] : []),
        ...(!input.externalInstallReportPassed ? ["external-windows-install-report-not-passed"] : []),
      ],
    },
    research: {
      outcome: researchQualified
        ? "relativity-v12-promotion-qualified-not-applied"
        : "relativity-v12-research-candidate-shadow-retained",
      defaultKernel: "legacy-eih-1pn",
      candidateRuntimePolicy: "offline-shadow",
      denseKerrComplete: input.denseKerrComplete,
      variationalStmQualified: input.variationalStmQualified,
      perBodyNoRegression: input.perBodyNoRegression,
      blockers: [
        ...(!input.denseKerrComplete ? ["dense-kerr-49-shards-incomplete"] : []),
        ...(!input.variationalStmQualified ? ["variational-stm-release-qualification-incomplete"] : []),
        ...(!input.perBodyNoRegression ? ["weak-field-per-body-regressions-remain"] : []),
        ...(!input.scientificPromotionQualified ? ["scientific-promotion-decision-not-qualified"] : []),
      ],
    },
    boundary: "local-evidence-only-no-deploy-sign-stage-commit-or-runtime-promotion",
  };
}

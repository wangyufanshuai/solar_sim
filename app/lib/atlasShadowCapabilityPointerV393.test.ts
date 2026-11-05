import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV393 } from "./atlasShadowCapabilityPointerV393";

const SHA = "a".repeat(64);

describe("v393 shadow pointer", () => {
  it("keeps source topology separate from production covariance", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v393",
      status:
        "covariance-source-dossier-v393-qualified-physical-sources-unavailable-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v392CovarianceAdmission: "qualified-validator-projection-primitive-only",
        v393SourceDossierSchema: "qualified-3-components-3-cross-sources",
        v393DossierValidator: "qualified-9-of-9-adversarial-rejections",
        v393CorrelatedPackAssembly: "qualified-synthetic-control-only",
        v393PhysicalSourceDossier:
          "unavailable-0-of-3-components-0-of-3-cross-sources",
        v393ProductionPack: "not-built",
        v393ProductionProjection: "not-run",
        v393AbsoluteScientificInterval: "not-qualified",
        v393RuntimeConsumer: "v11-correlation-patchbay-wired",
        v393PromotionBoundary:
          "dossier-infrastructure-only-zero-physical-sources-zero-pack-zero-projection-zero-probability",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: {
        path: "dist/science/orbit-atlas-shadow-v393-evidence.json",
        fileSha256: SHA,
        canonicalSha256: SHA,
      },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV393(pointer)).toBe(pointer);
  });
});

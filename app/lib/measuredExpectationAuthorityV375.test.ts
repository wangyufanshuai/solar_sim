import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseKerrSciencePhotonBandViewV328 } from "./kerrSciencePhotonBandsV328";
import {
  createMeasuredPhotonExpectationV369,
  type MeasuredPhotonExpectationV369,
} from "./measuredPhotonExpectationV369";
import {
  createMeasuredExpectationAuthorityEnvelopeV375,
  validateMeasuredGeometryAuthorityChainV375,
  type ObservationGeometryPublicationReceiptV375,
} from "./measuredExpectationAuthorityV375";
import type {
  ObservationGeometryAdmissionArtifactV374,
  ObservationGeometryAuthorityPointerV374,
} from "./observationGeometryRuntimePublicationV374";

const SHA = {
  detectorPointer: "a".repeat(64),
  detectorAdmission: "b".repeat(64),
  geometryPointer: "c".repeat(64),
  geometryPointerFile: "d".repeat(64),
  geometryAdmission: "e".repeat(64),
  geometryReceipt: "f".repeat(64),
  geometryFile: "1".repeat(64),
  geometry: "2".repeat(64),
  photon: "3".repeat(64),
} as const;

function photonView() {
  const artifact = JSON.parse(
    readFileSync(
      "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
      "utf8",
    ),
  ) as { view: unknown };
  return parseKerrSciencePhotonBandViewV328(artifact.view);
}

function unavailableExpectation() {
  return createMeasuredPhotonExpectationV369({
    photonView: photonView(),
    admission: null,
    authorityPointer: null,
    manifest: null,
    verifiedManifestFileSha256: null,
    verifiedManifestCanonicalSha256: null,
    observationGeometry: null,
  });
}

function geometryContext() {
  const geometry = {
    version: "v369-measured-observation-geometry-v1",
    sourceKind: "measured-instrument-geometry",
    instrumentSerialOrCampaignId: "campaign-001",
    collectingAreaM2: 0.8,
    pixelSolidAngleSr: 5.8e-12,
    provenance: {
      sourceUrl: "https://observatory.example/geometry",
      licenseOrTerms: "measured terms",
      artifactSha256: SHA.geometry,
    },
  } as const;
  const authorityPointer = {
    version: "v373-observation-geometry-authority-pointer-v1",
    status: "qualified-measured-observation-geometry-authority-local-shadow-only",
    authorityGranted: true,
    admissionArtifactSha256: SHA.geometryAdmission,
    validationArtifactCanonicalSha256: "4".repeat(64),
    validationArtifactFileSha256: "5".repeat(64),
    candidateCanonicalSha256: SHA.geometry,
    candidateFileSha256: "6".repeat(64),
    instrumentSerialOrCampaignId: "campaign-001",
    localShadowOnly: true,
    runtimeGeometryPublicationAllowed: false,
    productPromotionAllowed: false,
    formalProductPointer: "v263",
    denseCampaignStatus: "incomplete-0-of-49",
    pointerSha256: SHA.geometryPointer,
  } as ObservationGeometryAuthorityPointerV374;
  const admission = {
    version: "v373-observation-geometry-authority-envelope-v1",
    status: authorityPointer.status,
    decision: { authorityGranted: true },
    candidateCanonicalSha256: SHA.geometry,
    validationArtifactCanonicalSha256: "4".repeat(64),
    attemptConsumed: true,
    networkAttempted: false,
    automaticPromotionApplied: false,
    runtimeGeometryPublished: false,
    formalProductPointer: "v263",
    denseCampaignStatus: "incomplete-0-of-49",
    browserQualification: "not-run",
    artifactSha256: SHA.geometryAdmission,
  } as unknown as ObservationGeometryAdmissionArtifactV374;
  const receipt = {
    version: "v374-observation-geometry-runtime-publication-receipt-v1",
    status: "qualified-local-shadow-runtime-geometry-publication",
    decision: {
      publicationAllowed: true,
      authorityPointerQualified: true,
      inputShaLocked: true,
    },
    authorityPointerFileSha256: SHA.geometryPointerFile,
    authorityPointerCanonicalSha256: SHA.geometryPointer,
    admissionArtifactSha256: SHA.geometryAdmission,
    validationArtifactSha256: "4".repeat(64),
    candidateArtifactSha256: SHA.geometry,
    runtimeGeometryFileSha256: SHA.geometryFile,
    attemptConsumed: true,
    networkAttempted: false,
    automaticPromotionApplied: false,
    formalProductPointer: "v263",
    denseCampaignStatus: "incomplete-0-of-49",
    browserQualification: "not-run",
    artifactSha256: SHA.geometryReceipt,
  } as unknown as ObservationGeometryPublicationReceiptV375;
  return validateMeasuredGeometryAuthorityChainV375({
    authorityPointer,
    admission,
    receipt,
    geometry,
    verifiedAuthorityPointerFileSha256: SHA.geometryPointerFile,
    verifiedAuthorityPointerCanonicalSha256: SHA.geometryPointer,
    verifiedAdmissionCanonicalSha256: SHA.geometryAdmission,
    verifiedReceiptCanonicalSha256: SHA.geometryReceipt,
    verifiedGeometryFileSha256: SHA.geometryFile,
    verifiedGeometryCanonicalSha256: SHA.geometry,
  });
}

function qualifiedExpectation(): MeasuredPhotonExpectationV369 {
  const base = unavailableExpectation();
  return {
    ...base,
    status: "qualified-measured-expectation-operator",
    authorityGranted: true,
    observationGeometryQualified: true,
    measuredExpectationAvailable: true,
    unavailableReasons: [],
    rows: Array.from({ length: 12 }, (_, index) => ({ rayIndex: index })),
    counts: { rayCount: 4, bandCount: 3, expectationRowCount: 12 },
    maxima: {
      quadratureRelativeDifference: 1e-8,
      totalElectronExpectation: 100,
      standardDeviationElectron: 10,
    },
    provenance: {
      fullShortAuthoritySha256: "7".repeat(64),
      authorityPointerSha256: SHA.detectorPointer,
      admissionArtifactSha256: SHA.detectorAdmission,
      manifestFileSha256: "8".repeat(64),
      manifestCanonicalSha256: "9".repeat(64),
      observationGeometryArtifactSha256: SHA.geometry,
    },
  } as unknown as MeasuredPhotonExpectationV369;
}

describe("v375 measured expectation dual authority", () => {
  it("preserves the current unavailable result without placeholder rows", () => {
    expect(
      createMeasuredExpectationAuthorityEnvelopeV375({
        expectation: unavailableExpectation(),
        detectorAuthorityQualified: false,
        geometryAuthority: null,
        detectorInstrumentSerialOrCampaignId: null,
        detectorAuthorityPointerSha256: null,
        detectorAdmissionArtifactSha256: null,
        photonArtifactSha256: SHA.photon,
      }),
    ).toMatchObject({
      status: "unavailable-detector-or-geometry-authority",
      detectorAuthorityQualified: false,
      geometryAuthorityQualified: false,
      measuredExpectationAvailable: false,
      instrumentIdentityMatched: false,
      counts: { expectationRowCount: 0 },
      provenance: null,
      observedCounts: "unavailable-expectation-is-not-observed-detector-counts",
      syntheticFallbackUsed: false,
    });
  });

  it("qualifies 12 expectations only with matching detector and geometry authority", () => {
    const context = geometryContext();
    expect(
      createMeasuredExpectationAuthorityEnvelopeV375({
        expectation: qualifiedExpectation(),
        detectorAuthorityQualified: true,
        geometryAuthority: context,
        detectorInstrumentSerialOrCampaignId: "campaign-001",
        detectorAuthorityPointerSha256: SHA.detectorPointer,
        detectorAdmissionArtifactSha256: SHA.detectorAdmission,
        photonArtifactSha256: SHA.photon,
      }),
    ).toMatchObject({
      status: "qualified-dual-authority-measured-expectation",
      detectorAuthorityQualified: true,
      geometryAuthorityQualified: true,
      measuredExpectationAvailable: true,
      instrumentIdentityMatched: true,
      counts: { rayCount: 4, bandCount: 3, expectationRowCount: 12 },
      provenance: {
        detectorAuthorityPointerSha256: SHA.detectorPointer,
        geometryAuthorityPointerSha256: SHA.geometryPointer,
        geometryPublicationReceiptSha256: SHA.geometryReceipt,
        photonArtifactSha256: SHA.photon,
      },
    });
  });

  it("rejects an expectation claim without both matching authorities", () => {
    expect(() =>
      createMeasuredExpectationAuthorityEnvelopeV375({
        expectation: qualifiedExpectation(),
        detectorAuthorityQualified: true,
        geometryAuthority: null,
        detectorInstrumentSerialOrCampaignId: "campaign-001",
        detectorAuthorityPointerSha256: SHA.detectorPointer,
        detectorAdmissionArtifactSha256: SHA.detectorAdmission,
        photonArtifactSha256: SHA.photon,
      }),
    ).toThrow("v375-expectation-without-dual-authority");
  });

  it("rejects a publication receipt that does not lock the runtime geometry file", () => {
    const context = geometryContext();
    expect(() =>
      validateMeasuredGeometryAuthorityChainV375({
        authorityPointer: context.authorityPointer,
        admission: context.admission,
        receipt: context.receipt,
        geometry: context.geometry,
        verifiedAuthorityPointerFileSha256: SHA.geometryPointerFile,
        verifiedAuthorityPointerCanonicalSha256: SHA.geometryPointer,
        verifiedAdmissionCanonicalSha256: SHA.geometryAdmission,
        verifiedReceiptCanonicalSha256: SHA.geometryReceipt,
        verifiedGeometryFileSha256: "0".repeat(64),
        verifiedGeometryCanonicalSha256: SHA.geometry,
      }),
    ).toThrow("v375-geometry-authority-identity");
  });

  it("keeps the explicit builder non-networked and artifact-gated", () => {
    const source = readFileSync("scripts/build-measured-expectation-v375.ts", "utf8");
    expect(source).toContain("validateMeasuredDetectorAuthorityChainV368");
    expect(source).toContain("validateMeasuredGeometryAuthorityChainV375");
    expect(source).toContain("createMeasuredPhotonExpectationV369");
    expect(source).toContain("qualified-dual-authority-measured-expectation");
    expect(source).not.toContain("fetch(");
  });
});

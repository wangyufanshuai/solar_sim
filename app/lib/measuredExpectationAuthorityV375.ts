import type { MeasuredPhotonExpectationV369 } from "./measuredPhotonExpectationV369";
import { parseMeasuredPhotonExpectationV369 } from "./measuredPhotonExpectationV369";
import type {
  ObservationGeometryAdmissionArtifactV374,
  ObservationGeometryAuthorityPointerV374,
  ObservationGeometryRuntimePublicationDecisionV374,
} from "./observationGeometryRuntimePublicationV374";
import type { MeasuredObservationGeometryV369 } from "./measuredPhotonExpectationV369";

export const MEASURED_EXPECTATION_AUTHORITY_VERSION_V375 =
  "v375-dual-authority-measured-expectation-envelope-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;

export type ObservationGeometryPublicationReceiptV375 = Readonly<{
  version: "v374-observation-geometry-runtime-publication-receipt-v1";
  status: "qualified-local-shadow-runtime-geometry-publication";
  decision: ObservationGeometryRuntimePublicationDecisionV374;
  authorityPointerFileSha256: string;
  authorityPointerCanonicalSha256: string;
  admissionArtifactSha256: string;
  validationArtifactSha256: string;
  candidateArtifactSha256: string;
  runtimeGeometryFileSha256: string;
  attemptConsumed: true;
  networkAttempted: false;
  automaticPromotionApplied: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

export type MeasuredGeometryAuthorityContextV375 = Readonly<{
  authorityPointer: ObservationGeometryAuthorityPointerV374;
  admission: ObservationGeometryAdmissionArtifactV374;
  receipt: ObservationGeometryPublicationReceiptV375;
  geometry: MeasuredObservationGeometryV369;
  authorityPointerCanonicalSha256: string;
  admissionCanonicalSha256: string;
  receiptCanonicalSha256: string;
  geometryCanonicalSha256: string;
}>;

export type MeasuredExpectationAuthorityEnvelopeV375 = Readonly<{
  version: typeof MEASURED_EXPECTATION_AUTHORITY_VERSION_V375;
  status:
    | "qualified-dual-authority-measured-expectation"
    | "unavailable-detector-or-geometry-authority";
  detectorAuthorityQualified: boolean;
  geometryAuthorityQualified: boolean;
  measuredExpectationAvailable: boolean;
  instrumentIdentityMatched: boolean;
  expectation: MeasuredPhotonExpectationV369;
  counts: Readonly<{ rayCount: number; bandCount: number; expectationRowCount: number }>;
  provenance: Readonly<{
    detectorAuthorityPointerSha256: string;
    detectorAdmissionArtifactSha256: string;
    geometryAuthorityPointerSha256: string;
    geometryAdmissionArtifactSha256: string;
    geometryPublicationReceiptSha256: string;
    geometryArtifactSha256: string;
    photonArtifactSha256: string;
  }> | null;
  observedCounts: "unavailable-expectation-is-not-observed-detector-counts";
  syntheticFallbackUsed: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "dual-authority-envelope-never-converts-expectation-into-observed-counts-or-cinematic-input";
}>;

export function validateMeasuredGeometryAuthorityChainV375(args: Readonly<{
  authorityPointer: ObservationGeometryAuthorityPointerV374;
  admission: ObservationGeometryAdmissionArtifactV374;
  receipt: ObservationGeometryPublicationReceiptV375;
  geometry: MeasuredObservationGeometryV369;
  verifiedAuthorityPointerFileSha256: string;
  verifiedAuthorityPointerCanonicalSha256: string;
  verifiedAdmissionCanonicalSha256: string;
  verifiedReceiptCanonicalSha256: string;
  verifiedGeometryFileSha256: string;
  verifiedGeometryCanonicalSha256: string;
}>): MeasuredGeometryAuthorityContextV375 {
  if (
    ![
      args.verifiedAuthorityPointerFileSha256,
      args.verifiedAuthorityPointerCanonicalSha256,
      args.verifiedAdmissionCanonicalSha256,
      args.verifiedReceiptCanonicalSha256,
      args.verifiedGeometryFileSha256,
      args.verifiedGeometryCanonicalSha256,
    ].every((entry) => SHA256.test(entry))
  ) {
    throw new Error("v375-geometry-sha-format");
  }
  if (
    args.authorityPointer.status !==
      "qualified-measured-observation-geometry-authority-local-shadow-only" ||
    args.authorityPointer.authorityGranted !== true ||
    args.authorityPointer.localShadowOnly !== true ||
    args.authorityPointer.productPromotionAllowed !== false ||
    args.authorityPointer.pointerSha256 !==
      args.verifiedAuthorityPointerCanonicalSha256 ||
    args.admission.status !==
      "qualified-measured-observation-geometry-authority-local-shadow-only" ||
    args.admission.decision.authorityGranted !== true ||
    args.admission.artifactSha256 !== args.verifiedAdmissionCanonicalSha256 ||
    args.receipt.status !== "qualified-local-shadow-runtime-geometry-publication" ||
    args.receipt.decision.publicationAllowed !== true ||
    args.receipt.decision.authorityPointerQualified !== true ||
    args.receipt.decision.inputShaLocked !== true ||
    args.receipt.artifactSha256 !== args.verifiedReceiptCanonicalSha256 ||
    args.receipt.authorityPointerFileSha256 !==
      args.verifiedAuthorityPointerFileSha256 ||
    args.receipt.authorityPointerCanonicalSha256 !==
      args.verifiedAuthorityPointerCanonicalSha256 ||
    args.receipt.admissionArtifactSha256 !== args.verifiedAdmissionCanonicalSha256 ||
    args.receipt.runtimeGeometryFileSha256 !== args.verifiedGeometryFileSha256 ||
    args.receipt.candidateArtifactSha256 !==
      args.verifiedGeometryCanonicalSha256 ||
    args.geometry.provenance.artifactSha256 !==
      args.verifiedGeometryCanonicalSha256 ||
    args.geometry.instrumentSerialOrCampaignId !==
      args.authorityPointer.instrumentSerialOrCampaignId
  ) {
    throw new Error("v375-geometry-authority-identity");
  }
  return Object.freeze({
    authorityPointer: args.authorityPointer,
    admission: args.admission,
    receipt: args.receipt,
    geometry: args.geometry,
    authorityPointerCanonicalSha256: args.verifiedAuthorityPointerCanonicalSha256,
    admissionCanonicalSha256: args.verifiedAdmissionCanonicalSha256,
    receiptCanonicalSha256: args.verifiedReceiptCanonicalSha256,
    geometryCanonicalSha256: args.verifiedGeometryCanonicalSha256,
  });
}

export function createMeasuredExpectationAuthorityEnvelopeV375(args: Readonly<{
  expectation: MeasuredPhotonExpectationV369;
  detectorAuthorityQualified: boolean;
  geometryAuthority: MeasuredGeometryAuthorityContextV375 | null;
  detectorInstrumentSerialOrCampaignId: string | null;
  detectorAuthorityPointerSha256: string | null;
  detectorAdmissionArtifactSha256: string | null;
  photonArtifactSha256: string;
}>): MeasuredExpectationAuthorityEnvelopeV375 {
  const expectation = parseMeasuredPhotonExpectationV369(args.expectation);
  if (!SHA256.test(args.photonArtifactSha256)) {
    throw new Error("v375-photon-artifact-sha");
  }
  const geometryAuthorityQualified = args.geometryAuthority !== null;
  const instrumentIdentityMatched = Boolean(
    args.detectorAuthorityQualified &&
      args.geometryAuthority &&
      args.detectorInstrumentSerialOrCampaignId ===
        args.geometryAuthority.geometry.instrumentSerialOrCampaignId,
  );
  const qualified =
    args.detectorAuthorityQualified &&
    geometryAuthorityQualified &&
    instrumentIdentityMatched &&
    expectation.status === "qualified-measured-expectation-operator" &&
    expectation.measuredExpectationAvailable === true &&
    expectation.counts.rayCount === 4 &&
    expectation.counts.bandCount === 3 &&
    expectation.counts.expectationRowCount === 12;
  if (
    qualified &&
    (!args.detectorAuthorityPointerSha256 ||
      !args.detectorAdmissionArtifactSha256 ||
      !SHA256.test(args.detectorAuthorityPointerSha256) ||
      !SHA256.test(args.detectorAdmissionArtifactSha256) ||
      expectation.provenance?.authorityPointerSha256 !==
        args.detectorAuthorityPointerSha256 ||
      expectation.provenance.admissionArtifactSha256 !==
        args.detectorAdmissionArtifactSha256 ||
      expectation.provenance.observationGeometryArtifactSha256 !==
        args.geometryAuthority?.geometryCanonicalSha256)
  ) {
    throw new Error("v375-expectation-provenance-identity");
  }
  if (!qualified && expectation.measuredExpectationAvailable) {
    throw new Error("v375-expectation-without-dual-authority");
  }
  const provenance = qualified
    ? Object.freeze({
        detectorAuthorityPointerSha256: args.detectorAuthorityPointerSha256!,
        detectorAdmissionArtifactSha256: args.detectorAdmissionArtifactSha256!,
        geometryAuthorityPointerSha256:
          args.geometryAuthority!.authorityPointerCanonicalSha256,
        geometryAdmissionArtifactSha256:
          args.geometryAuthority!.admissionCanonicalSha256,
        geometryPublicationReceiptSha256:
          args.geometryAuthority!.receiptCanonicalSha256,
        geometryArtifactSha256: args.geometryAuthority!.geometryCanonicalSha256,
        photonArtifactSha256: args.photonArtifactSha256,
      })
    : null;
  return Object.freeze({
    version: MEASURED_EXPECTATION_AUTHORITY_VERSION_V375,
    status: qualified
      ? "qualified-dual-authority-measured-expectation"
      : "unavailable-detector-or-geometry-authority",
    detectorAuthorityQualified: args.detectorAuthorityQualified,
    geometryAuthorityQualified,
    measuredExpectationAvailable: qualified,
    instrumentIdentityMatched,
    expectation,
    counts: Object.freeze({ ...expectation.counts }),
    provenance,
    observedCounts: "unavailable-expectation-is-not-observed-detector-counts",
    syntheticFallbackUsed: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
    formalProductPointer: "v263",
    denseCampaignStatus: "incomplete-0-of-49",
    browserQualification: "not-run",
    boundary:
      "dual-authority-envelope-never-converts-expectation-into-observed-counts-or-cinematic-input",
  });
}

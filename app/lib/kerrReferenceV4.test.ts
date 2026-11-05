import { describe, expect, it } from "vitest";

import {
  KERR_REFERENCE_V4_VERSION,
  validateKerrCpuCrossValidationReportV4,
} from "./kerrReferenceV4";

describe("Kerr CPU cross-validation V4 contract", () => {
  it("keeps incomplete strong-field evidence fail closed", () => {
    expect(
      validateKerrCpuCrossValidationReportV4({
        version: KERR_REFERENCE_V4_VERSION,
        rayCount: 1,
        classificationAgreementCount: 1,
        classificationAgreement: 1,
        maxKerrSchildNullConstraint: 2e-10,
        maxCarterNullConstraint: 0,
        gates: {
          classificationAgreementAtLeast999: true,
          kerrSchildNullBelow1e10: false,
          carterNullBelow1e10: true,
          redshiftCrossValidated: false,
          polarizationCrossValidated: false,
        },
        comparisons: [{
          rayIndex: 0,
          screenDirection: { radial: -1, polar: 0, azimuthal: 0 },
          kerrSchildStatus: "captured",
          carterStatus: "captured",
          classificationAgreement: true,
          kerrSchildNullConstraint: 2e-10,
          carterNullConstraint: 0,
        }],
        promotionDecision: "shadow-retained",
        liveStateMutated: false,
        boundary: "offline-only",
        canonicalEvidenceSha256: "a".repeat(64),
      }),
    ).toBe(true);
  });
});

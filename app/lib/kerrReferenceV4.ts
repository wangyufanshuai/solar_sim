export const KERR_REFERENCE_V4_VERSION = "v214-kerr-cpu-cross-validation-v4" as const;

export type KerrCpuRayClassV4 = "captured" | "not-captured";

export interface KerrCpuCrossValidationRayV4 {
  rayIndex: number;
  screenDirection: {
    radial: number;
    polar: number;
    azimuthal: number;
  };
  kerrSchildStatus: string;
  carterStatus: string;
  classificationAgreement: boolean;
  kerrSchildNullConstraint: number;
  carterNullConstraint: number;
}

export interface KerrCpuCrossValidationReportV4 {
  version: typeof KERR_REFERENCE_V4_VERSION;
  rayCount: number;
  classificationAgreementCount: number;
  classificationAgreement: number;
  maxKerrSchildNullConstraint: number;
  maxCarterNullConstraint: number;
  gates: {
    classificationAgreementAtLeast999: boolean;
    kerrSchildNullBelow1e10: boolean;
    carterNullBelow1e10: boolean;
    redshiftCrossValidated: boolean;
    polarizationCrossValidated: boolean;
  };
  comparisons: KerrCpuCrossValidationRayV4[];
  promotionDecision: "shadow-retained";
  liveStateMutated: false;
  boundary: string;
  canonicalEvidenceSha256: string;
}

export function validateKerrCpuCrossValidationReportV4(
  value: unknown,
): value is KerrCpuCrossValidationReportV4 {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<KerrCpuCrossValidationReportV4>;
  return (
    report.version === KERR_REFERENCE_V4_VERSION &&
    report.promotionDecision === "shadow-retained" &&
    report.liveStateMutated === false &&
    Number.isInteger(report.rayCount) &&
    typeof report.classificationAgreement === "number" &&
    Array.isArray(report.comparisons) &&
    report.comparisons.length === report.rayCount &&
    /^[a-f0-9]{64}$/.test(report.canonicalEvidenceSha256 ?? "")
  );
}

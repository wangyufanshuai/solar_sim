export type KerrGeodesicEventKindV291 = "capture" | "escape" | "disk-hit";

export type KerrGeodesicEventV291 = Readonly<{
  kind: KerrGeodesicEventKindV291;
  parameter: number;
  radiusM: number;
  valid: boolean;
  detail: string;
}>;

export type KerrConservationBudgetV291 = Readonly<{
  massShellResidualRaw: number;
  massShellResidualNormalized: number;
  carterResidualRaw: number | null;
  carterResidualNormalized: number | null;
  metricPullbackResidual: number | null;
  covectorRoundtripResidual: number | null;
  metricDerivativeAuditResidual: number | null;
}>;

export type KerrCoordinateTransformAuditV291 = Readonly<{
  version: "v291-kerr-coordinate-transform-audit-v1";
  metricPullbackResidual: number;
  covectorRoundtripResidual: number;
  initialHamiltonianResidual: number;
  metricDerivativeAuditResidual: number;
  qualified: boolean;
}>;

export type KerrGeometryQualificationV292 = Readonly<{
  version: "v292-kerr-geometry-redshift-short-gate-v1";
  status: "geometry-redshift-qualified" | "geometry-redshift-failed";
  geometryRedshiftQualified: boolean;
  polarizationStatus: "polarization-pending" | "blocked-by-geometry";
  fullKerrAuthorityQualified: false;
  executionCount: 128;
  criticalBracketCount: 40;
  evidenceSha256: string;
}>;

export type KerrPolarizationPayloadV293 = Readonly<{
  rayId: string;
  applicability: "applicable" | "not-applicable";
  emitterModel: "projected-disk-normal" | null;
  walkerPenroseEvpaDeg: number | null;
  directTransportEvpaDeg: number | null;
  differenceDeg: number | null;
}>;

export type KerrPolarizationQualificationV293 = Readonly<{
  version: "v293-kerr-polarization-gate-v1";
  status: "polarization-qualified" | "blocked-by-geometry" | "polarization-failed";
  qualified: boolean;
  geometryEvidenceSha256: string | null;
  applicableExecutionCount: number;
  evidenceSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;

export function validateKerrGeometryQualificationV292(value: KerrGeometryQualificationV292): boolean {
  return value.version === "v292-kerr-geometry-redshift-short-gate-v1"
    && value.executionCount === 128
    && value.criticalBracketCount === 40
    && SHA.test(value.evidenceSha256)
    && value.fullKerrAuthorityQualified === false
    && (value.geometryRedshiftQualified
      ? value.status === "geometry-redshift-qualified" && value.polarizationStatus === "polarization-pending"
      : value.status === "geometry-redshift-failed" && value.polarizationStatus === "blocked-by-geometry");
}

export type KerrConstraintStabilityDiagnosticV296 = Readonly<{
  version: "v296-carter-constraint-stability-diagnostic-v1";
  status: "diagnostics-qualified" | "diagnostics-failed";
  qualified: boolean;
  executionCount: 32;
  evidenceSha256: string;
}>;

export type KerrGeometryQualificationV296 = Readonly<{
  version: "v296-kerr-geometry-redshift-short-gate-v1";
  status: "geometry-redshift-qualified" | "geometry-redshift-failed";
  geometryRedshiftQualified: boolean;
  polarizationStatus: "polarization-pending" | "blocked-by-geometry";
  fullKerrAuthorityQualified: false;
  executionCount: 128;
  criticalBracketCount: 40;
  constraintStabilization: Readonly<{
    method: "segmented-first-integral-projection";
    projectionIntervalMino: number;
    exactSurfaceMutation: "none";
    thresholdRelaxation: "not-applied";
  }>;
  evidenceSha256: string;
}>;

export function validateKerrGeometryQualificationV296(value: KerrGeometryQualificationV296): boolean {
  return value.version === "v296-kerr-geometry-redshift-short-gate-v1"
    && value.executionCount === 128
    && value.criticalBracketCount === 40
    && value.constraintStabilization.method === "segmented-first-integral-projection"
    && value.constraintStabilization.projectionIntervalMino === 0.01
    && value.constraintStabilization.exactSurfaceMutation === "none"
    && value.constraintStabilization.thresholdRelaxation === "not-applied"
    && value.fullKerrAuthorityQualified === false
    && /^[a-f0-9]{64}$/.test(value.evidenceSha256)
    && (value.geometryRedshiftQualified
      ? value.status === "geometry-redshift-qualified" && value.polarizationStatus === "polarization-pending"
      : value.status === "geometry-redshift-failed" && value.polarizationStatus === "blocked-by-geometry");
}

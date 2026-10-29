export type KerrPolarizationStatusV297 =
  | "full-kerr-short-authority-qualified"
  | "polarization-short-gate-failed"
  | "unavailable";

export interface KerrWalkerPenroseResultV297 {
  readonly rayId: string;
  readonly spin: number;
  readonly toleranceClass: "release" | "internal";
  readonly evpaDeg: number;
  readonly invariantDrift: number;
  readonly applicable: true;
}

export interface KerrParallelTransportResultV297 {
  readonly success: boolean;
  readonly evpaDeg: number;
  readonly nullResidualNormalized: number;
  readonly orthogonalityResidualNormalized: number;
  readonly normResidual: number;
  readonly walkerPenroseInvariantDrift: number;
  readonly endpointResidual: number;
}

export interface KerrPolarizationQualificationV297 {
  readonly version: "v297-kerr-disk-polarization-short-gate-v1";
  readonly status: KerrPolarizationStatusV297;
  readonly qualified: boolean;
  readonly applicableExecutionCount: number;
  readonly sourceDiskHitExecutionCount: number;
  readonly captureEscapeNotApplicableCount: number;
  readonly gates: Readonly<Record<string, boolean>>;
  readonly thresholds: Readonly<Record<string, number>>;
  readonly failureReasons: readonly string[];
  readonly evidenceSha256: string;
}

export function isKerrPolarizationQualificationV297(value: unknown): value is KerrPolarizationQualificationV297 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<KerrPolarizationQualificationV297>;
  return candidate.version === "v297-kerr-disk-polarization-short-gate-v1"
    && (candidate.status === "full-kerr-short-authority-qualified" || candidate.status === "polarization-short-gate-failed")
    && typeof candidate.qualified === "boolean"
    && Number.isSafeInteger(candidate.applicableExecutionCount)
    && Number.isSafeInteger(candidate.sourceDiskHitExecutionCount)
    && typeof candidate.evidenceSha256 === "string"
    && /^[a-f0-9]{64}$/.test(candidate.evidenceSha256);
}

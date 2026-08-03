export const OBSERVATION_GEOMETRY_VALIDATION_INSPECT_VERSION_V372 =
  "v372-independent-observation-geometry-validation-inspect-v1" as const;

export type ObservationGeometryValidationInspectV372 = Readonly<{
  version: typeof OBSERVATION_GEOMETRY_VALIDATION_INSPECT_VERSION_V372;
  generatedAt: string;
  status:
    | "blocked-validation-inputs-unavailable"
    | "blocked-validation-inputs-invalid"
    | "ready-for-explicit-independent-validation";
  expectedInputs: readonly [
    "v371-compiled-artifact",
    "v371-geometry-candidate",
    "identity-json",
    "collecting-area-csv",
    "plate-scale-csv",
    "provenance-json",
  ];
  presentInputCount: number;
  missingInputs: readonly string[];
  invalidReason: string | null;
  validatorImplemented: true;
  validationCommand: "npm run atlas -- relativity observation-geometry-v372-validate";
  validationExecuted: false;
  measuredValidationQualified: false;
  runtimeGeometryPublished: false;
  measuredAuthorityGranted: false;
  attemptConsumed: false;
  networkAttempted: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const EXPECTED =
  "v371-compiled-artifact|v371-geometry-candidate|identity-json|collecting-area-csv|plate-scale-csv|provenance-json";

export function parseObservationGeometryValidationInspectV372(
  value: unknown,
): ObservationGeometryValidationInspectV372 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<ObservationGeometryValidationInspectV372>)
      : null;
  if (
    !source ||
    source.version !== OBSERVATION_GEOMETRY_VALIDATION_INSPECT_VERSION_V372 ||
    ![
      "blocked-validation-inputs-unavailable",
      "blocked-validation-inputs-invalid",
      "ready-for-explicit-independent-validation",
    ].includes(source.status ?? "") ||
    source.expectedInputs?.join("|") !== EXPECTED ||
    !Number.isInteger(source.presentInputCount) ||
    Number(source.presentInputCount) < 0 ||
    Number(source.presentInputCount) + Number(source.missingInputs?.length ?? 0) !== 6 ||
    source.validatorImplemented !== true ||
    source.validationCommand !==
      "npm run atlas -- relativity observation-geometry-v372-validate" ||
    source.validationExecuted !== false ||
    source.measuredValidationQualified !== false ||
    source.runtimeGeometryPublished !== false ||
    source.measuredAuthorityGranted !== false ||
    source.attemptConsumed !== false ||
    source.networkAttempted !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !/^[a-f0-9]{64}$/.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v372-validation-inspect-identity");
  }
  if (
    source.status === "blocked-validation-inputs-unavailable" &&
    (source.missingInputs?.length ?? 0) < 1
  ) {
    throw new Error("v372-validation-inspect-missing");
  }
  return value as ObservationGeometryValidationInspectV372;
}

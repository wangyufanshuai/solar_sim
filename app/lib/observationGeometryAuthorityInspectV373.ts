export const OBSERVATION_GEOMETRY_AUTHORITY_INSPECT_VERSION_V373 =
  "v373-observation-geometry-authority-inspect-v1" as const;
export const OBSERVATION_GEOMETRY_AUTHORITY_INPUTS_V373 = [
  "v371-compiled-artifact",
  "v371-geometry-candidate",
  "v372-validation-artifact",
  "identity-json",
  "collecting-area-csv",
  "plate-scale-csv",
  "provenance-json",
] as const;

export type ObservationGeometryAuthorityInspectV373 = Readonly<{
  version: typeof OBSERVATION_GEOMETRY_AUTHORITY_INSPECT_VERSION_V373;
  generatedAt: string;
  status:
    | "blocked-admission-inputs-unavailable"
    | "blocked-admission-inputs-invalid"
    | "ready-for-explicit-authority-admission";
  expectedInputs: typeof OBSERVATION_GEOMETRY_AUTHORITY_INPUTS_V373;
  presentInputCount: number;
  missingInputs: readonly string[];
  invalidReason: string | null;
  admissionControllerImplemented: true;
  admissionCommand: "npm run atlas -- relativity observation-geometry-v373-admit";
  admissionExecuted: false;
  authorityPointerPublished: false;
  runtimeGeometryPublished: false;
  measuredAuthorityGranted: false;
  attemptConsumed: false;
  networkAttempted: false;
  automaticPromotionAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

export function parseObservationGeometryAuthorityInspectV373(
  value: unknown,
): ObservationGeometryAuthorityInspectV373 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<ObservationGeometryAuthorityInspectV373>)
      : null;
  if (
    !source ||
    source.version !== OBSERVATION_GEOMETRY_AUTHORITY_INSPECT_VERSION_V373 ||
    ![
      "blocked-admission-inputs-unavailable",
      "blocked-admission-inputs-invalid",
      "ready-for-explicit-authority-admission",
    ].includes(source.status ?? "") ||
    source.expectedInputs?.join("|") !==
      OBSERVATION_GEOMETRY_AUTHORITY_INPUTS_V373.join("|") ||
    !Number.isInteger(source.presentInputCount) ||
    Number(source.presentInputCount) < 0 ||
    Number(source.presentInputCount) + Number(source.missingInputs?.length ?? 0) !==
      OBSERVATION_GEOMETRY_AUTHORITY_INPUTS_V373.length ||
    source.admissionControllerImplemented !== true ||
    source.admissionCommand !==
      "npm run atlas -- relativity observation-geometry-v373-admit" ||
    source.admissionExecuted !== false ||
    source.authorityPointerPublished !== false ||
    source.runtimeGeometryPublished !== false ||
    source.measuredAuthorityGranted !== false ||
    source.attemptConsumed !== false ||
    source.networkAttempted !== false ||
    source.automaticPromotionAllowed !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !/^[a-f0-9]{64}$/.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v373-authority-inspect-identity");
  }
  if (
    source.status === "blocked-admission-inputs-unavailable" &&
    (source.missingInputs?.length ?? 0) < 1
  ) {
    throw new Error("v373-authority-inspect-missing");
  }
  if (
    source.status === "ready-for-explicit-authority-admission" &&
    (source.missingInputs?.length !== 0 || source.invalidReason !== null)
  ) {
    throw new Error("v373-authority-inspect-ready");
  }
  return value as ObservationGeometryAuthorityInspectV373;
}

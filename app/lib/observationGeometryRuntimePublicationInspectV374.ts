export const OBSERVATION_GEOMETRY_RUNTIME_PUBLICATION_INSPECT_VERSION_V374 =
  "v374-observation-geometry-runtime-publication-inspect-v1" as const;
export const OBSERVATION_GEOMETRY_RUNTIME_PUBLICATION_INPUTS_V374 = [
  "v373-authority-pointer",
  "v373-admission-artifact",
  "v372-validation-artifact",
  "v371-compiled-artifact",
  "v371-geometry-candidate",
  "identity-json",
  "collecting-area-csv",
  "plate-scale-csv",
  "provenance-json",
] as const;

export type ObservationGeometryRuntimePublicationInspectV374 = Readonly<{
  version: typeof OBSERVATION_GEOMETRY_RUNTIME_PUBLICATION_INSPECT_VERSION_V374;
  generatedAt: string;
  status:
    | "blocked-publication-inputs-unavailable"
    | "blocked-publication-inputs-invalid"
    | "ready-for-explicit-runtime-publication";
  expectedInputs: typeof OBSERVATION_GEOMETRY_RUNTIME_PUBLICATION_INPUTS_V374;
  presentInputCount: number;
  missingInputs: readonly string[];
  invalidReason: string | null;
  publicationControllerImplemented: true;
  publicationCommand: "npm run atlas -- relativity observation-geometry-v374-publish";
  publicationExecuted: false;
  runtimeGeometryPublished: false;
  measuredAuthorityAvailable: false;
  measuredExpectationAvailable: false;
  attemptConsumed: false;
  networkAttempted: false;
  automaticPromotionAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

export function parseObservationGeometryRuntimePublicationInspectV374(
  value: unknown,
): ObservationGeometryRuntimePublicationInspectV374 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<ObservationGeometryRuntimePublicationInspectV374>)
      : null;
  if (
    !source ||
    source.version !==
      OBSERVATION_GEOMETRY_RUNTIME_PUBLICATION_INSPECT_VERSION_V374 ||
    ![
      "blocked-publication-inputs-unavailable",
      "blocked-publication-inputs-invalid",
      "ready-for-explicit-runtime-publication",
    ].includes(source.status ?? "") ||
    source.expectedInputs?.join("|") !==
      OBSERVATION_GEOMETRY_RUNTIME_PUBLICATION_INPUTS_V374.join("|") ||
    !Number.isInteger(source.presentInputCount) ||
    Number(source.presentInputCount) < 0 ||
    Number(source.presentInputCount) + Number(source.missingInputs?.length ?? 0) !==
      OBSERVATION_GEOMETRY_RUNTIME_PUBLICATION_INPUTS_V374.length ||
    source.publicationControllerImplemented !== true ||
    source.publicationCommand !==
      "npm run atlas -- relativity observation-geometry-v374-publish" ||
    source.publicationExecuted !== false ||
    source.runtimeGeometryPublished !== false ||
    source.measuredAuthorityAvailable !== false ||
    source.measuredExpectationAvailable !== false ||
    source.attemptConsumed !== false ||
    source.networkAttempted !== false ||
    source.automaticPromotionAllowed !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !/^[a-f0-9]{64}$/.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v374-publication-inspect-identity");
  }
  if (
    source.status === "blocked-publication-inputs-unavailable" &&
    (source.missingInputs?.length ?? 0) < 1
  ) {
    throw new Error("v374-publication-inspect-missing");
  }
  return value as ObservationGeometryRuntimePublicationInspectV374;
}

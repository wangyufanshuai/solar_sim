export const MEASURED_EXPECTATION_AUTHORITY_INSPECT_VERSION_V375 =
  "v375-dual-authority-measured-expectation-inspect-v1" as const;
export const MEASURED_EXPECTATION_AUTHORITY_INPUTS_V375 = [
  "v367-detector-admission",
  "v367-detector-authority-pointer",
  "v361-detector-manifest",
  "v373-geometry-admission",
  "v373-geometry-authority-pointer",
  "v374-geometry-publication-receipt",
  "v369-runtime-observation-geometry",
  "v328-photon-radiance",
] as const;

export type MeasuredExpectationAuthorityInspectV375 = Readonly<{
  version: typeof MEASURED_EXPECTATION_AUTHORITY_INSPECT_VERSION_V375;
  generatedAt: string;
  status:
    | "blocked-dual-authority-inputs-unavailable"
    | "blocked-dual-authority-inputs-invalid"
    | "ready-for-explicit-measured-expectation-build";
  expectedInputs: typeof MEASURED_EXPECTATION_AUTHORITY_INPUTS_V375;
  presentInputCount: number;
  missingInputs: readonly string[];
  invalidReason: string | null;
  envelopeBuilderImplemented: true;
  buildCommand: "npm run atlas -- relativity measured-expectation-v375-build";
  buildExecuted: false;
  photonInputQualified: boolean;
  detectorAuthorityQualified: false;
  geometryAuthorityQualified: false;
  measuredExpectationAvailable: false;
  expectationRowCount: 0;
  attemptConsumed: false;
  networkAttempted: false;
  automaticPromotionAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

export function parseMeasuredExpectationAuthorityInspectV375(
  value: unknown,
): MeasuredExpectationAuthorityInspectV375 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<MeasuredExpectationAuthorityInspectV375>)
      : null;
  if (
    !source ||
    source.version !== MEASURED_EXPECTATION_AUTHORITY_INSPECT_VERSION_V375 ||
    ![
      "blocked-dual-authority-inputs-unavailable",
      "blocked-dual-authority-inputs-invalid",
      "ready-for-explicit-measured-expectation-build",
    ].includes(source.status ?? "") ||
    source.expectedInputs?.join("|") !==
      MEASURED_EXPECTATION_AUTHORITY_INPUTS_V375.join("|") ||
    !Number.isInteger(source.presentInputCount) ||
    Number(source.presentInputCount) < 0 ||
    Number(source.presentInputCount) + Number(source.missingInputs?.length ?? 0) !==
      MEASURED_EXPECTATION_AUTHORITY_INPUTS_V375.length ||
    source.envelopeBuilderImplemented !== true ||
    source.buildCommand !==
      "npm run atlas -- relativity measured-expectation-v375-build" ||
    source.buildExecuted !== false ||
    typeof source.photonInputQualified !== "boolean" ||
    source.detectorAuthorityQualified !== false ||
    source.geometryAuthorityQualified !== false ||
    source.measuredExpectationAvailable !== false ||
    source.expectationRowCount !== 0 ||
    source.attemptConsumed !== false ||
    source.networkAttempted !== false ||
    source.automaticPromotionAllowed !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !/^[a-f0-9]{64}$/.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v375-expectation-inspect-identity");
  }
  if (
    source.status === "blocked-dual-authority-inputs-unavailable" &&
    (source.missingInputs?.length ?? 0) < 1
  ) {
    throw new Error("v375-expectation-inspect-missing");
  }
  return value as MeasuredExpectationAuthorityInspectV375;
}

export const EXPECTED_ELECTRON_SCIENCE_IMAGE_INSPECT_VERSION_V376 =
  "v376-expected-electron-science-image-inspect-v1" as const;

export type ExpectedElectronScienceImageInspectV376 = Readonly<{
  version: typeof EXPECTED_ELECTRON_SCIENCE_IMAGE_INSPECT_VERSION_V376;
  generatedAt: string;
  status:
    | "blocked-envelope-unavailable"
    | "blocked-envelope-invalid"
    | "ready-for-explicit-image-build";
  expectedInput: "v375-dual-authority-envelope";
  presentInputCount: 0 | 1;
  missingInputs: readonly string[];
  invalidReason: string | null;
  compilerImplemented: true;
  buildCommand: "npm run atlas -- relativity expected-electron-image-v376-build";
  buildExecuted: false;
  imageAvailable: false;
  jsonPublished: false;
  csvPublished: false;
  zeroImageFallbackUsed: false;
  observedCountsAvailable: false;
  attemptConsumed: false;
  networkAttempted: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

export function parseExpectedElectronScienceImageInspectV376(
  value: unknown,
): ExpectedElectronScienceImageInspectV376 {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<ExpectedElectronScienceImageInspectV376>)
      : null;
  if (
    !source ||
    source.version !== EXPECTED_ELECTRON_SCIENCE_IMAGE_INSPECT_VERSION_V376 ||
    ![
      "blocked-envelope-unavailable",
      "blocked-envelope-invalid",
      "ready-for-explicit-image-build",
    ].includes(source.status ?? "") ||
    source.expectedInput !== "v375-dual-authority-envelope" ||
    ![0, 1].includes(Number(source.presentInputCount)) ||
    Number(source.presentInputCount) + Number(source.missingInputs?.length ?? 0) !== 1 ||
    source.compilerImplemented !== true ||
    source.buildCommand !==
      "npm run atlas -- relativity expected-electron-image-v376-build" ||
    source.buildExecuted !== false ||
    source.imageAvailable !== false ||
    source.jsonPublished !== false ||
    source.csvPublished !== false ||
    source.zeroImageFallbackUsed !== false ||
    source.observedCountsAvailable !== false ||
    source.attemptConsumed !== false ||
    source.networkAttempted !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !/^[a-f0-9]{64}$/.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v376-image-inspect-identity");
  }
  return value as ExpectedElectronScienceImageInspectV376;
}

import type { MeasuredExpectationAuthorityEnvelopeV375 } from "./measuredExpectationAuthorityV375";

export const EXPECTED_ELECTRON_SCIENCE_IMAGE_VERSION_V376 =
  "v376-expected-electron-science-image-v1" as const;
export const EXPECTED_ELECTRON_SCIENCE_IMAGE_BANDS_V376 = Object.freeze([
  "visible",
  "euv",
  "soft-x-ray",
] as const);
export const EXPECTED_ELECTRON_SCIENCE_IMAGE_CONSERVATION_LIMIT_V376 = 1e-15;

export type ExpectedElectronScienceImageCellV376 = Readonly<{
  row: number;
  column: number;
  rayIndex: number;
  bandId: "visible" | "euv" | "soft-x-ray";
  sourceElectronExpectation: number;
  darkElectronExpectation: number;
  backgroundElectronExpectation: number;
  readNoiseVarianceElectronSquared: number;
  totalElectronExpectation: number;
  expectedAdu: number;
  varianceElectronSquared: number;
  standardDeviationElectron: number;
  componentSumRelativeDifference: number;
  varianceReconstructionRelativeDifference: number;
}>;

export type ExpectedElectronScienceImageProductV376 = Readonly<{
  status: "qualified-expected-electron-science-image";
  counts: Readonly<{
    rowCount: 4;
    columnCount: 3;
    cellCount: 12;
    rayCount: 4;
    bandCount: 3;
  }>;
  bandOrder: typeof EXPECTED_ELECTRON_SCIENCE_IMAGE_BANDS_V376;
  rayOrder: readonly number[];
  cells: readonly ExpectedElectronScienceImageCellV376[];
  layers: Readonly<{
    sourceElectronExpectation: readonly number[];
    darkElectronExpectation: readonly number[];
    backgroundElectronExpectation: readonly number[];
    readNoiseVarianceElectronSquared: readonly number[];
    totalElectronExpectation: readonly number[];
    expectedAdu: readonly number[];
    varianceElectronSquared: readonly number[];
    standardDeviationElectron: readonly number[];
  }>;
  maximumComponentSumRelativeDifference: number;
  maximumVarianceReconstructionRelativeDifference: number;
  inferredGainElectronPerAdu: number;
  display: Readonly<{
    transform: "identity-linear-float64-no-normalization";
    exposure: 1;
    bloom: 0;
    noise: 0;
    colorGrade: "none";
  }>;
  cinematicCopy: null;
}>;

export type ExpectedElectronScienceImageV376 = Readonly<{
  version: typeof EXPECTED_ELECTRON_SCIENCE_IMAGE_VERSION_V376;
  status:
    | "qualified-expected-electron-science-image"
    | "unavailable-dual-authority-envelope";
  imageAvailable: boolean;
  product: ExpectedElectronScienceImageProductV376 | null;
  provenance: Readonly<{
    envelopeArtifactSha256: string;
    detectorAuthorityPointerSha256: string;
    geometryAuthorityPointerSha256: string;
    geometryPublicationReceiptSha256: string;
    geometryArtifactSha256: string;
    photonArtifactSha256: string;
  }> | null;
  observedCounts: "unavailable-expectation-is-not-observed-detector-counts";
  syntheticFallbackUsed: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "expected-electron-image-is-linear-expectation-and-error-layer-not-observed-exposure-or-cinematic-buffer";
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right));

export function createExpectedElectronScienceImageV376(
  envelope: MeasuredExpectationAuthorityEnvelopeV375 | null,
  verifiedEnvelopeArtifactSha256: string | null,
): ExpectedElectronScienceImageV376 {
  const common = {
    version: EXPECTED_ELECTRON_SCIENCE_IMAGE_VERSION_V376,
    observedCounts: "unavailable-expectation-is-not-observed-detector-counts" as const,
    syntheticFallbackUsed: false as const,
    sciencePayloadMutationAllowed: false as const,
    cinematicConsumerAllowed: false as const,
    formalProductPointer: "v263" as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
    browserQualification: "not-run" as const,
    boundary:
      "expected-electron-image-is-linear-expectation-and-error-layer-not-observed-exposure-or-cinematic-buffer" as const,
  };
  if (!envelope) {
    return Object.freeze({
      ...common,
      status: "unavailable-dual-authority-envelope",
      imageAvailable: false,
      product: null,
      provenance: null,
    });
  }
  if (
    !verifiedEnvelopeArtifactSha256 ||
    !SHA256.test(verifiedEnvelopeArtifactSha256) ||
    envelope.version !== "v375-dual-authority-measured-expectation-envelope-v1" ||
    envelope.status !== "qualified-dual-authority-measured-expectation" ||
    envelope.detectorAuthorityQualified !== true ||
    envelope.geometryAuthorityQualified !== true ||
    envelope.measuredExpectationAvailable !== true ||
    envelope.instrumentIdentityMatched !== true ||
    envelope.counts.rayCount !== 4 ||
    envelope.counts.bandCount !== 3 ||
    envelope.counts.expectationRowCount !== 12 ||
    !envelope.provenance ||
    !Object.values(envelope.provenance).every((entry) => SHA256.test(entry)) ||
    envelope.expectation.status !== "qualified-measured-expectation-operator" ||
    envelope.expectation.rows.length !== 12
  ) {
    throw new Error("v376-envelope-boundary");
  }

  const rayOrder = [...new Set(envelope.expectation.rows.map((row) => row.rayIndex))].sort(
    (left, right) => left - right,
  );
  if (rayOrder.length !== 4) throw new Error("v376-ray-count");
  const rowsByIdentity = new Map(
    envelope.expectation.rows.map((row) => [`${row.rayIndex}:${row.bandId}`, row]),
  );
  if (rowsByIdentity.size !== 12) throw new Error("v376-cell-identity");

  let maximumComponentDifference = 0;
  let maximumVarianceDifference = 0;
  let inferredGain = 0;
  const cells: ExpectedElectronScienceImageCellV376[] = [];
  for (let rowIndex = 0; rowIndex < rayOrder.length; rowIndex += 1) {
    for (
      let columnIndex = 0;
      columnIndex < EXPECTED_ELECTRON_SCIENCE_IMAGE_BANDS_V376.length;
      columnIndex += 1
    ) {
      const bandId = EXPECTED_ELECTRON_SCIENCE_IMAGE_BANDS_V376[columnIndex];
      const measurement = rowsByIdentity.get(`${rayOrder[rowIndex]}:${bandId}`);
      if (!measurement) throw new Error("v376-cell-missing");
      const componentTotal =
        measurement.sourceElectronExpectation +
        measurement.darkElectronExpectation +
        measurement.backgroundElectronExpectation;
      const varianceTotal =
        componentTotal + measurement.readNoiseVarianceElectronSquared;
      const componentDifference = relativeDifference(
        componentTotal,
        measurement.totalElectronExpectation,
      );
      const varianceDifference = relativeDifference(
        varianceTotal,
        measurement.varianceElectronSquared,
      );
      const gain = measurement.totalElectronExpectation / measurement.expectedAdu;
      if (
        ![
          measurement.sourceElectronExpectation,
          measurement.darkElectronExpectation,
          measurement.backgroundElectronExpectation,
          measurement.readNoiseVarianceElectronSquared,
          measurement.totalElectronExpectation,
          measurement.expectedAdu,
          measurement.varianceElectronSquared,
          measurement.standardDeviationElectron,
          gain,
        ].every((entry) => Number.isFinite(entry) && entry > 0) ||
        componentDifference > EXPECTED_ELECTRON_SCIENCE_IMAGE_CONSERVATION_LIMIT_V376 ||
        varianceDifference > EXPECTED_ELECTRON_SCIENCE_IMAGE_CONSERVATION_LIMIT_V376 ||
        relativeDifference(
          measurement.standardDeviationElectron ** 2,
          measurement.varianceElectronSquared,
        ) > EXPECTED_ELECTRON_SCIENCE_IMAGE_CONSERVATION_LIMIT_V376
      ) {
        throw new Error(`v376-conservation:${measurement.rayIndex}:${bandId}`);
      }
      if (inferredGain === 0) inferredGain = gain;
      else if (relativeDifference(inferredGain, gain) > 1e-12) {
        throw new Error("v376-gain-inconsistent");
      }
      maximumComponentDifference = Math.max(
        maximumComponentDifference,
        componentDifference,
        measurement.componentSumRelativeDifference,
      );
      maximumVarianceDifference = Math.max(
        maximumVarianceDifference,
        varianceDifference,
      );
      cells.push(
        Object.freeze({
          row: rowIndex,
          column: columnIndex,
          rayIndex: measurement.rayIndex,
          bandId,
          sourceElectronExpectation: measurement.sourceElectronExpectation,
          darkElectronExpectation: measurement.darkElectronExpectation,
          backgroundElectronExpectation: measurement.backgroundElectronExpectation,
          readNoiseVarianceElectronSquared:
            measurement.readNoiseVarianceElectronSquared,
          totalElectronExpectation: measurement.totalElectronExpectation,
          expectedAdu: measurement.expectedAdu,
          varianceElectronSquared: measurement.varianceElectronSquared,
          standardDeviationElectron: measurement.standardDeviationElectron,
          componentSumRelativeDifference: componentDifference,
          varianceReconstructionRelativeDifference: varianceDifference,
        }),
      );
    }
  }
  const layer = <K extends keyof ExpectedElectronScienceImageCellV376>(key: K) =>
    Object.freeze(cells.map((cell) => cell[key] as number));
  const product: ExpectedElectronScienceImageProductV376 = Object.freeze({
    status: "qualified-expected-electron-science-image",
    counts: Object.freeze({
      rowCount: 4,
      columnCount: 3,
      cellCount: 12,
      rayCount: 4,
      bandCount: 3,
    }),
    bandOrder: EXPECTED_ELECTRON_SCIENCE_IMAGE_BANDS_V376,
    rayOrder: Object.freeze(rayOrder),
    cells: Object.freeze(cells),
    layers: Object.freeze({
      sourceElectronExpectation: layer("sourceElectronExpectation"),
      darkElectronExpectation: layer("darkElectronExpectation"),
      backgroundElectronExpectation: layer("backgroundElectronExpectation"),
      readNoiseVarianceElectronSquared: layer("readNoiseVarianceElectronSquared"),
      totalElectronExpectation: layer("totalElectronExpectation"),
      expectedAdu: layer("expectedAdu"),
      varianceElectronSquared: layer("varianceElectronSquared"),
      standardDeviationElectron: layer("standardDeviationElectron"),
    }),
    maximumComponentSumRelativeDifference: maximumComponentDifference,
    maximumVarianceReconstructionRelativeDifference: maximumVarianceDifference,
    inferredGainElectronPerAdu: inferredGain,
    display: Object.freeze({
      transform: "identity-linear-float64-no-normalization",
      exposure: 1,
      bloom: 0,
      noise: 0,
      colorGrade: "none",
    }),
    cinematicCopy: null,
  });
  return Object.freeze({
    ...common,
    status: "qualified-expected-electron-science-image",
    imageAvailable: true,
    product,
    provenance: Object.freeze({
      envelopeArtifactSha256: verifiedEnvelopeArtifactSha256,
      detectorAuthorityPointerSha256:
        envelope.provenance.detectorAuthorityPointerSha256,
      geometryAuthorityPointerSha256:
        envelope.provenance.geometryAuthorityPointerSha256,
      geometryPublicationReceiptSha256:
        envelope.provenance.geometryPublicationReceiptSha256,
      geometryArtifactSha256: envelope.provenance.geometryArtifactSha256,
      photonArtifactSha256: envelope.provenance.photonArtifactSha256,
    }),
  });
}

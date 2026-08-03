export const MEASURED_VISIBLE_THROUGHPUT_VERSION_V383 =
  "v383-visible-throughput-normalization-v1" as const;
export const VISIBLE_LOWER_WAVELENGTH_ANGSTROM_V383 = 4000 as const;
export const VISIBLE_UPPER_WAVELENGTH_ANGSTROM_V383 = 7000 as const;
export const VISIBLE_EXPECTED_ROW_COUNT_V383 = 3301 as const;
export const VISIBLE_ORACLE_RELATIVE_DIFFERENCE_LIMIT_V383 = 1e-12;

const SHA256 = /^[a-f0-9]{64}$/;

export type MeasuredVisibleThroughputRowV383 = Readonly<{
  wavelengthAngstrom: number;
  wavelengthM: number;
  throughput: number;
  sourceWavelengthText: string;
  sourceThroughputText: string;
}>;

export type MeasuredVisibleThroughputMetricsV383 = Readonly<{
  rowCount: 3301;
  lowerWavelengthAngstrom: 4000;
  upperWavelengthAngstrom: 7000;
  minimumThroughput: number;
  maximumThroughput: number;
  equivalentWidthAngstrom: number;
  meanThroughput: number;
  throughputWeightedMeanWavelengthAngstrom: number;
  pivotWavelengthAngstrom: number;
  strictlyIncreasing: true;
  duplicateWavelengthCount: 0;
  interpolationApplied: false;
}>;

export type MeasuredVisibleThroughputNormalizationV383 = Readonly<{
  rows: readonly MeasuredVisibleThroughputRowV383[];
  metrics: MeasuredVisibleThroughputMetricsV383;
  sourceRowCanonicalText: string;
}>;

export type MeasuredVisibleThroughputArtifactV383 = Readonly<{
  version: typeof MEASURED_VISIBLE_THROUGHPUT_VERSION_V383;
  generatedAt: string;
  status:
    "visible-throughput-candidate-qualified-dual-implementation-authority-withheld-source-dossier-incomplete";
  candidate: Readonly<{
    bandId: "visible";
    facility: "HST";
    instrument: "WFC3/UVIS1";
    spectralElement: "F350LP";
    wavelengthUnit: "m";
    throughputUnit: "dimensionless";
    lowerWavelengthM: 4e-7;
    upperWavelengthM: 7e-7;
    rowCount: 3301;
  }>;
  input: Readonly<{
    rawProfilePath:
      "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml";
    rawProfileSha256: string;
    v382r1ForensicArtifactSha256: string;
    v382r1SourceDossierStatus: "incomplete-1-of-7";
  }>;
  normalizedProfile: Readonly<{
    path: "dist/science/measured-visible-throughput-v383/profile.csv";
    fileSha256: string;
    sourceRowCanonicalSha256: string;
    metrics: MeasuredVisibleThroughputMetricsV383;
  }>;
  dualImplementation: Readonly<{
    typescript:
      "regex-votable-parser-plus-float64-trapezoid-and-pivot-integrals";
    python:
      "xml-etree-parser-plus-decimal-50-digit-trapezoid-and-pivot-integrals";
    parserImplementationIndependent: true;
    arithmeticImplementationIndependent: true;
    sourceRowCanonicalShaMatched: true;
    rowCountMatched: true;
    endpointMatched: true;
    maximumMetricRelativeDifference: number;
    relativeDifferenceLimit: typeof VISIBLE_ORACLE_RELATIVE_DIFFERENCE_LIMIT_V383;
    qualified: true;
  }>;
  authorityBoundary: Readonly<{
    normalizedCandidateQualified: true;
    sourceDossierAvailable: false;
    detectorNoiseAuthorityAvailable: false;
    observationGeometryAuthorityAvailable: false;
    visibleMeasuredAuthorityGranted: false;
    measuredBandAuthorityCount: 0;
    observedCountsAvailable: false;
    runtimePackagingAllowed: false;
    sciencePayloadMutationAllowed: false;
    cinematicConsumerAllowed: false;
  }>;
  networkAttempted: false;
  automaticRetryApplied: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

function trapezoid(
  rows: readonly MeasuredVisibleThroughputRowV383[],
  value: (row: MeasuredVisibleThroughputRowV383) => number,
) {
  let sum = 0;
  let correction = 0;
  for (let index = 1; index < rows.length; index += 1) {
    const left = rows[index - 1];
    const right = rows[index];
    const term =
      0.5 *
      (right.wavelengthAngstrom - left.wavelengthAngstrom) *
      (value(left) + value(right));
    const next = sum + term;
    correction +=
      Math.abs(sum) >= Math.abs(term)
        ? sum - next + term
        : term - next + sum;
    sum = next;
  }
  return sum + correction;
}

export function normalizeMeasuredVisibleThroughputV383(
  xml: string,
): MeasuredVisibleThroughputNormalizationV383 {
  if (
    Buffer.byteLength(xml, "utf8") <= 0 ||
    Buffer.byteLength(xml, "utf8") > 4 * 1024 * 1024 ||
    !/<VOTABLE[\s>]/i.test(xml)
  ) {
    throw new Error("v383-votable-boundary");
  }
  const sourceRows = [
    ...xml.matchAll(
      /<TR>\s*<TD>([^<]+)<\/TD>\s*<TD>([^<]+)<\/TD>\s*<\/TR>/gi,
    ),
  ].map((match) => ({
    wavelengthAngstrom: Number(match[1]),
    throughput: Number(match[2]),
    sourceWavelengthText: match[1].trim(),
    sourceThroughputText: match[2].trim(),
  }));
  if (
    sourceRows.length !== 8705 ||
    sourceRows.some(
      (row) =>
        !Number.isFinite(row.wavelengthAngstrom) ||
        !Number.isFinite(row.throughput) ||
        row.wavelengthAngstrom <= 0 ||
        row.throughput < 0 ||
        row.throughput > 1,
    )
  ) {
    throw new Error("v383-source-rows");
  }
  let duplicateWavelengthCount = 0;
  for (let index = 1; index < sourceRows.length; index += 1) {
    if (
      sourceRows[index].wavelengthAngstrom <=
      sourceRows[index - 1].wavelengthAngstrom
    ) {
      if (
        sourceRows[index].wavelengthAngstrom ===
        sourceRows[index - 1].wavelengthAngstrom
      ) {
        duplicateWavelengthCount += 1;
      } else {
        throw new Error("v383-source-not-monotonic");
      }
    }
  }
  if (duplicateWavelengthCount !== 0) {
    throw new Error("v383-source-duplicates");
  }
  const rows = Object.freeze(
    sourceRows
      .filter(
        (row) =>
          row.wavelengthAngstrom >=
            VISIBLE_LOWER_WAVELENGTH_ANGSTROM_V383 &&
          row.wavelengthAngstrom <=
            VISIBLE_UPPER_WAVELENGTH_ANGSTROM_V383,
      )
      .map((row) =>
        Object.freeze({
          ...row,
          wavelengthM: row.wavelengthAngstrom * 1e-10,
        }),
      ),
  );
  if (
    rows.length !== VISIBLE_EXPECTED_ROW_COUNT_V383 ||
    rows[0].wavelengthAngstrom !==
      VISIBLE_LOWER_WAVELENGTH_ANGSTROM_V383 ||
    rows[rows.length - 1].wavelengthAngstrom !==
      VISIBLE_UPPER_WAVELENGTH_ANGSTROM_V383
  ) {
    throw new Error("v383-visible-endpoints");
  }
  const equivalentWidthAngstrom = trapezoid(rows, (row) => row.throughput);
  const firstMoment = trapezoid(
    rows,
    (row) => row.throughput * row.wavelengthAngstrom,
  );
  const reciprocalMoment = trapezoid(
    rows,
    (row) => row.throughput / row.wavelengthAngstrom,
  );
  const metrics = Object.freeze({
    rowCount: VISIBLE_EXPECTED_ROW_COUNT_V383,
    lowerWavelengthAngstrom: VISIBLE_LOWER_WAVELENGTH_ANGSTROM_V383,
    upperWavelengthAngstrom: VISIBLE_UPPER_WAVELENGTH_ANGSTROM_V383,
    minimumThroughput: Math.min(...rows.map((row) => row.throughput)),
    maximumThroughput: Math.max(...rows.map((row) => row.throughput)),
    equivalentWidthAngstrom,
    meanThroughput:
      equivalentWidthAngstrom /
      (VISIBLE_UPPER_WAVELENGTH_ANGSTROM_V383 -
        VISIBLE_LOWER_WAVELENGTH_ANGSTROM_V383),
    throughputWeightedMeanWavelengthAngstrom:
      firstMoment / equivalentWidthAngstrom,
    pivotWavelengthAngstrom: Math.sqrt(firstMoment / reciprocalMoment),
    strictlyIncreasing: true as const,
    duplicateWavelengthCount: 0 as const,
    interpolationApplied: false as const,
  });
  if (
    !Object.values(metrics).every(
      (value) => typeof value !== "number" || Number.isFinite(value),
    ) ||
    !(metrics.minimumThroughput >= 0) ||
    !(metrics.maximumThroughput <= 1) ||
    !(metrics.equivalentWidthAngstrom > 0) ||
    !(metrics.meanThroughput > 0 && metrics.meanThroughput <= 1) ||
    !(
      metrics.throughputWeightedMeanWavelengthAngstrom >= 4000 &&
      metrics.throughputWeightedMeanWavelengthAngstrom <= 7000
    ) ||
    !(
      metrics.pivotWavelengthAngstrom >= 4000 &&
      metrics.pivotWavelengthAngstrom <= 7000
    )
  ) {
    throw new Error("v383-metrics-nonphysical");
  }
  return Object.freeze({
    rows,
    metrics,
    sourceRowCanonicalText: rows
      .map(
        (row) =>
          `${row.sourceWavelengthText},${row.sourceThroughputText}\n`,
      )
      .join(""),
  });
}

export function parseMeasuredVisibleThroughputArtifactV383(
  value: unknown,
): MeasuredVisibleThroughputArtifactV383 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<MeasuredVisibleThroughputArtifactV383>)
    : null;
  if (
    !source ||
    source.version !== MEASURED_VISIBLE_THROUGHPUT_VERSION_V383 ||
    source.status !==
      "visible-throughput-candidate-qualified-dual-implementation-authority-withheld-source-dossier-incomplete" ||
    source.candidate?.bandId !== "visible" ||
    source.candidate.facility !== "HST" ||
    source.candidate.instrument !== "WFC3/UVIS1" ||
    source.candidate.spectralElement !== "F350LP" ||
    source.candidate.lowerWavelengthM !== 4e-7 ||
    source.candidate.upperWavelengthM !== 7e-7 ||
    source.candidate.rowCount !== 3301 ||
    !SHA256.test(source.input?.rawProfileSha256 ?? "") ||
    !SHA256.test(source.input?.v382r1ForensicArtifactSha256 ?? "") ||
    source.input?.v382r1SourceDossierStatus !== "incomplete-1-of-7" ||
    source.normalizedProfile?.path !==
      "dist/science/measured-visible-throughput-v383/profile.csv" ||
    !SHA256.test(source.normalizedProfile.fileSha256 ?? "") ||
    !SHA256.test(source.normalizedProfile.sourceRowCanonicalSha256 ?? "") ||
    source.normalizedProfile.metrics.rowCount !== 3301 ||
    source.normalizedProfile.metrics.interpolationApplied !== false ||
    source.dualImplementation?.parserImplementationIndependent !== true ||
    source.dualImplementation.arithmeticImplementationIndependent !== true ||
    source.dualImplementation.sourceRowCanonicalShaMatched !== true ||
    source.dualImplementation.rowCountMatched !== true ||
    source.dualImplementation.endpointMatched !== true ||
    !Number.isFinite(source.dualImplementation.maximumMetricRelativeDifference) ||
    source.dualImplementation.maximumMetricRelativeDifference >=
      VISIBLE_ORACLE_RELATIVE_DIFFERENCE_LIMIT_V383 ||
    source.dualImplementation.relativeDifferenceLimit !==
      VISIBLE_ORACLE_RELATIVE_DIFFERENCE_LIMIT_V383 ||
    source.dualImplementation.qualified !== true ||
    source.authorityBoundary?.normalizedCandidateQualified !== true ||
    source.authorityBoundary.sourceDossierAvailable !== false ||
    source.authorityBoundary.detectorNoiseAuthorityAvailable !== false ||
    source.authorityBoundary.observationGeometryAuthorityAvailable !== false ||
    source.authorityBoundary.visibleMeasuredAuthorityGranted !== false ||
    source.authorityBoundary.measuredBandAuthorityCount !== 0 ||
    source.authorityBoundary.observedCountsAvailable !== false ||
    source.authorityBoundary.runtimePackagingAllowed !== false ||
    source.authorityBoundary.sciencePayloadMutationAllowed !== false ||
    source.authorityBoundary.cinematicConsumerAllowed !== false ||
    source.networkAttempted !== false ||
    source.automaticRetryApplied !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v383-throughput-artifact-identity");
  }
  return value as MeasuredVisibleThroughputArtifactV383;
}

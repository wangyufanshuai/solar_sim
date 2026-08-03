import {
  GAIA_RESEARCH_COLOR_EDGES,
  GAIA_RESEARCH_G_EDGES,
  GAIA_RESEARCH_QUALITY_TIERS,
  GAIA_RESEARCH_RESPONSE_MAX_BYTES,
  atlasSubsetInclusionV267,
  createDefaultGaiaResearchFiltersV267,
  parseGaiaResearchQueryV267,
  type GaiaResearchFiltersV267,
  type GaiaResearchHrBinV267,
} from "./gaiaResearchWorkbenchV267";
import {
  reconstructGaiaAstrometricCovarianceV1,
  type GaiaAstrometricCovarianceV1,
  type GaiaScienceQualityTierV8,
  type GaiaScienceRecordV8,
} from "./gaiaScienceV8";

export const GAIA_RESEARCH_WORKBENCH_VERSION_V271 = "v271-gaia-research-workbench-v2" as const;
export { GAIA_RESEARCH_COLOR_EDGES, GAIA_RESEARCH_G_EDGES, GAIA_RESEARCH_RESPONSE_MAX_BYTES };

export type GaiaResearchPopulationV271 = "v7-presentation" | "v7-gaia-id";
export type GaiaResearchFiltersV271 = GaiaResearchFiltersV267;

export type GaiaResearchQueryV271 =
  | { kind: "overview"; filters: GaiaResearchFiltersV271 }
  | { kind: "healpix-density"; order: 3 | 5; filters: GaiaResearchFiltersV271 }
  | { kind: "hr-density"; bins: 64 | 128; filters: GaiaResearchFiltersV271 }
  | { kind: "selection"; order: 3 | 5; population: GaiaResearchPopulationV271; filters: GaiaResearchFiltersV271 };

export type GaiaResearchQualityCutV271 = { order: number; id: string; count: number };
export type GaiaResearchAnalysisFlagCountV271 = {
  flag: string;
  quality: GaiaScienceQualityTierV8;
  count: number;
};

export type GaiaResearchOverviewV271 = {
  kind: "overview";
  frozenRows: 200_000;
  selectionDomainRows: number;
  matchedRows: number;
  qualityCounts: Readonly<Record<GaiaScienceQualityTierV8, number>>;
  qualityCutFlow: readonly GaiaResearchQualityCutV271[];
  analysisFlags: readonly GaiaResearchAnalysisFlagCountV271[];
  motherPopulations: Readonly<Record<GaiaResearchPopulationV271, number>>;
  hrEligibleRows: number;
  astrophysicalOverlapRows: number;
  gaiaSurveyCompleteness: "unavailable";
};

export type GaiaResearchSelectionCellV271 = {
  cell: number;
  raDeg: number;
  decDeg: number;
  selected: number;
  mother: number;
  inclusionFraction: number | null;
};

export type GaiaResearchDensityCellV271 = { cell: number; raDeg: number; decDeg: number; count: number };

export type GaiaResearchPayloadV271 =
  | GaiaResearchOverviewV271
  | {
    kind: "healpix-density";
    order: 3 | 5;
    densityBasis: "all-frozen-science-rows" | "canonical-selection-domain";
    cells: readonly GaiaResearchDensityCellV271[];
  }
  | {
    kind: "hr-density";
    bins: 64 | 128;
    variant: "raw-no-extinction-correction";
    cells: readonly GaiaResearchHrBinV267[];
    xDomain: readonly [-2, 6];
    yDomain: readonly [-10, 20];
    underflowCount: number;
    overflowCount: number;
  }
  | {
    kind: "selection";
    order: 3 | 5;
    population: GaiaResearchPopulationV271;
    numerator: "quality-and-ruwe-filtered-frozen-science-subset";
    denominator: "g-and-color-filtered-v7-population";
    cells: readonly GaiaResearchSelectionCellV271[];
    selected: number;
    mother: number;
    inclusionFraction: number | null;
  };

export type GaiaResearchResponseV271 = {
  version: typeof GAIA_RESEARCH_WORKBENCH_VERSION_V271;
  canonical: true;
  source: "frozen-gaia-science-v8-derived-v271";
  query: GaiaResearchQueryV271;
  payload: GaiaResearchPayloadV271;
  provenance: {
    manifestSha256: string;
    aggregateSha256: string;
    scienceSourceSha256: string;
    motherCatalogSha256: string;
    generatedAt: string;
    units: Readonly<Record<string, string>>;
  };
  boundary: "frozen-derived-analysis-not-gaia-survey-completeness-or-physics";
};

export type GaiaResearchAnalysisFlagsV271 = {
  version: "v271-gaia-derived-analysis-flags-v1";
  positiveParallax: boolean;
  distanceUsable: boolean;
  nonDuplicated: boolean;
  photometricCleanV8: boolean;
  radialVelocityWithError: boolean;
  boundary: "derived-flags-do-not-reclassify-frozen-quality-tier";
};

export type GaiaCovarianceDiagnosticsV271 = {
  version: "v271-gaia-covariance-diagnostics-v1";
  covariance: GaiaAstrometricCovarianceV1;
  correlation: readonly (readonly number[])[];
  eigenvalues: readonly number[];
  positiveSemidefinite: boolean;
  boundary: "five-parameter-covariance-only-radial-velocity-cross-covariance-unavailable";
};

export type GaiaEpochPropagationV271 = {
  version: "v271-gaia-proper-motion-epoch-propagation-v1";
  sourceId: string;
  referenceEpochJulianYear: number;
  targetEpochJulianYear: number;
  raDeg: number;
  decDeg: number;
  assumption: "linear-tangent-plane-propagation-pmra-includes-cos-dec";
  boundary: "presentation-and-analysis-only-not-orbit-physics";
};

export type GaiaResearchExportV271 = {
  fileName: string;
  mediaType: "application/json;charset=utf-8" | "text/csv;charset=utf-8";
  content: string;
};

const POPULATIONS = ["v7-presentation", "v7-gaia-id"] as const;

function canonicalQualities(qualities: readonly GaiaScienceQualityTierV8[]): GaiaScienceQualityTierV8[] {
  return GAIA_RESEARCH_QUALITY_TIERS.filter((tier) => qualities.includes(tier));
}

export function createDefaultGaiaResearchFiltersV271(): GaiaResearchFiltersV271 {
  return createDefaultGaiaResearchFiltersV267();
}

export function parseGaiaResearchQueryV271(value: unknown): GaiaResearchQueryV271 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Gaia research query must be an object");
  const root = value as Record<string, unknown>;
  const population = root.population;
  const legacyValue = Object.fromEntries(Object.entries(root).filter(([key]) => key !== "population"));
  const parsed = parseGaiaResearchQueryV267(legacyValue);
  const filters = { ...parsed.filters, qualityTiers: canonicalQualities(parsed.filters.qualityTiers) };
  if (parsed.kind !== "selection") {
    if (population !== undefined) throw new Error("Gaia research population is valid only for selection queries");
    return { ...parsed, filters } as GaiaResearchQueryV271;
  }
  const canonicalPopulation = population === undefined ? "v7-gaia-id" : population;
  if (!POPULATIONS.includes(canonicalPopulation as GaiaResearchPopulationV271)) {
    throw new Error("Gaia research mother population is invalid");
  }
  return { ...parsed, population: canonicalPopulation as GaiaResearchPopulationV271, filters };
}

export function isFullGaiaResearchFilterV271(filters: GaiaResearchFiltersV271): boolean {
  return filters.qualityTiers.length === GAIA_RESEARCH_QUALITY_TIERS.length
    && GAIA_RESEARCH_QUALITY_TIERS.every((tier) => filters.qualityTiers.includes(tier))
    && filters.gMin === GAIA_RESEARCH_G_EDGES[0]
    && filters.gMax === GAIA_RESEARCH_G_EDGES.at(-1)
    && filters.bpRpMin === GAIA_RESEARCH_COLOR_EDGES[0]
    && filters.bpRpMax === GAIA_RESEARCH_COLOR_EDGES.at(-1)
    && filters.ruweMax === null;
}

export function atlasSubsetInclusionV271(selected: number, mother: number): number | null {
  return atlasSubsetInclusionV267(selected, mother);
}

function csvCellV271(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function serializeGaiaResearchExportV271(
  response: GaiaResearchResponseV271,
  format: "json" | "csv",
): GaiaResearchExportV271 {
  const stem = `orbit-atlas-gaia-${response.payload.kind}-v271`;
  if (format === "json") {
    return {
      fileName: `${stem}.json`,
      mediaType: "application/json;charset=utf-8",
      content: JSON.stringify(response, null, 2),
    };
  }
  const rows = response.payload.kind === "overview"
    ? Object.entries(response.payload).map(([key, value]) => [key, typeof value === "object" ? JSON.stringify(value) : String(value)])
    : response.payload.cells.map((cell) => Object.values(cell).map(String));
  const header = response.payload.kind === "overview"
    ? ["metric", "value"]
    : Object.keys(response.payload.cells[0] ?? { cell: "", count: "" });
  const metadata = [
    `# version=${response.version}`,
    `# manifest_sha256=${response.provenance.manifestSha256}`,
    `# aggregate_sha256=${response.provenance.aggregateSha256}`,
    `# science_sha256=${response.provenance.scienceSourceSha256}`,
    `# mother_sha256=${response.provenance.motherCatalogSha256}`,
    `# query=${JSON.stringify(response.query)}`,
    `# units=${JSON.stringify(response.provenance.units)}`,
    "# gaia_survey_completeness=unavailable",
    `# boundary=${response.boundary}`,
  ];
  return {
    fileName: `${stem}.csv`,
    mediaType: "text/csv;charset=utf-8",
    content: [...metadata, header.map(csvCellV271).join(","), ...rows.map((row) => row.map(csvCellV271).join(","))].join("\n"),
  };
}

export function deriveGaiaResearchAnalysisFlagsV271(record: GaiaScienceRecordV8): GaiaResearchAnalysisFlagsV271 {
  const positiveParallax = Number.isFinite(record.parallaxMas) && record.parallaxMas > 0;
  const parallaxSnr = record.parallaxErrorMas > 0 ? Math.abs(record.parallaxMas / record.parallaxErrorMas) : 0;
  const lower = 1 + 0.015 * record.bpRp * record.bpRp;
  const upper = 1.3 + 0.06 * record.bpRp * record.bpRp;
  return {
    version: "v271-gaia-derived-analysis-flags-v1",
    positiveParallax,
    distanceUsable: positiveParallax && parallaxSnr >= 5 && record.qualityTier !== "limited",
    nonDuplicated: !record.duplicatedSource,
    photometricCleanV8: Number.isFinite(record.photBpRpExcessFactor)
      && record.photBpRpExcessFactor > lower
      && record.photBpRpExcessFactor < upper,
    radialVelocityWithError: record.radialVelocityKmS !== null && record.radialVelocityErrorKmS !== null,
    boundary: "derived-flags-do-not-reclassify-frozen-quality-tier",
  };
}

function jacobiEigenvalues(matrix: readonly (readonly number[])[]): number[] {
  const a = matrix.map((row) => [...row]);
  const size = a.length;
  for (let iteration = 0; iteration < 80; iteration += 1) {
    let p = 0;
    let q = 1;
    let largest = 0;
    for (let row = 0; row < size; row += 1) {
      for (let column = row + 1; column < size; column += 1) {
        const candidate = Math.abs(a[row]![column]!);
        if (candidate > largest) {
          largest = candidate;
          p = row;
          q = column;
        }
      }
    }
    const scale = Math.max(1, ...a.map((row, index) => Math.abs(row[index]!)));
    if (largest <= scale * 1e-13) break;
    const phi = 0.5 * Math.atan2(2 * a[p]![q]!, a[q]![q]! - a[p]![p]!);
    const cosine = Math.cos(phi);
    const sine = Math.sin(phi);
    const app = cosine * cosine * a[p]![p]! - 2 * sine * cosine * a[p]![q]! + sine * sine * a[q]![q]!;
    const aqq = sine * sine * a[p]![p]! + 2 * sine * cosine * a[p]![q]! + cosine * cosine * a[q]![q]!;
    for (let index = 0; index < size; index += 1) {
      if (index === p || index === q) continue;
      const aip = a[index]![p]!;
      const aiq = a[index]![q]!;
      a[index]![p] = a[p]![index] = cosine * aip - sine * aiq;
      a[index]![q] = a[q]![index] = sine * aip + cosine * aiq;
    }
    a[p]![p] = app;
    a[q]![q] = aqq;
    a[p]![q] = a[q]![p] = 0;
  }
  return a.map((row, index) => row[index]!).sort((left, right) => left - right);
}

export function createGaiaCovarianceDiagnosticsV271(record: GaiaScienceRecordV8): GaiaCovarianceDiagnosticsV271 {
  const covariance = reconstructGaiaAstrometricCovarianceV1(record);
  const deviations = covariance.matrix.map((row, index) => Math.sqrt(Math.max(0, row[index]!)));
  const correlation = covariance.matrix.map((row, rowIndex) => row.map((value, columnIndex) => {
    const denominator = deviations[rowIndex]! * deviations[columnIndex]!;
    return denominator > 0 ? value / denominator : rowIndex === columnIndex ? 1 : 0;
  }));
  return {
    version: "v271-gaia-covariance-diagnostics-v1",
    covariance,
    correlation,
    eigenvalues: jacobiEigenvalues(covariance.matrix),
    positiveSemidefinite: covariance.positiveSemidefinite,
    boundary: "five-parameter-covariance-only-radial-velocity-cross-covariance-unavailable",
  };
}

export function propagateGaiaProperMotionEpochV271(
  record: GaiaScienceRecordV8,
  targetEpochJulianYear: number,
  referenceEpochJulianYear = 2016,
): GaiaEpochPropagationV271 {
  if (!Number.isFinite(targetEpochJulianYear) || !Number.isFinite(referenceEpochJulianYear)) {
    throw new Error("Gaia epoch must be finite");
  }
  const years = targetEpochJulianYear - referenceEpochJulianYear;
  const cosine = Math.cos(record.decDeg * Math.PI / 180);
  if (Math.abs(cosine) < 1e-8) throw new Error("Gaia tangent-plane RA propagation is unavailable at the pole");
  const raDeg = ((record.raDeg + record.pmRaMasYr * years / (3_600_000 * cosine)) % 360 + 360) % 360;
  const decDeg = record.decDeg + record.pmDecMasYr * years / 3_600_000;
  if (decDeg < -90 || decDeg > 90) throw new Error("Gaia linear proper-motion propagation crossed a celestial pole");
  return {
    version: "v271-gaia-proper-motion-epoch-propagation-v1",
    sourceId: record.sourceId,
    referenceEpochJulianYear,
    targetEpochJulianYear,
    raDeg,
    decDeg,
    assumption: "linear-tangent-plane-propagation-pmra-includes-cos-dec",
    boundary: "presentation-and-analysis-only-not-orbit-physics",
  };
}

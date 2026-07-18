import {
  KERR_RELATIVITY_STUDIO_VERSION,
  createKerrRelativityStudioSummary,
} from "./kerrRelativityStudio";
import {
  RELATIVITY_GUIDED_TOUR_VERSION,
  createRelativityGuidedTourSummary,
} from "./relativityGuidedTour";
import {
  RELATIVITY_OBSERVABLE_ATLAS_VERSION,
  RELATIVITY_OBSERVABLE_EXPLAINER_VERSION,
  createRelativityObservableAtlasSummary,
  createRelativityObservableExplainerSummary,
} from "./relativityObservableAtlas";
import type {
  AtlasRelativityBenchmarkProfile,
  AtlasRelativityVerificationClassification,
  AtlasRelativityVerificationReadout,
  AtlasRelativityVerificationSummary,
  AtlasRelativityVerificationVersion,
  EvidenceClaimStatus,
  KerrRelativityStudioSummary,
  RelativityGuidedTourSummary,
  RelativityObservableAtlasSummary,
  RelativityObservableExplainerSummary,
  RelativityObservableRow,
  RelativityKernelId,
  SimulationDiagnostics,
} from "./simulationDiagnosticsTypes";

export const ATLAS_RELATIVITY_VERIFICATION_VERSION: AtlasRelativityVerificationVersion =
  "v73-relativity-verification-readability";

export const ATLAS_RELATIVITY_BENCHMARK_PROFILE: AtlasRelativityBenchmarkProfile =
  "v73-weak-field-kerr-benchmark-readout";

export const ATLAS_RELATIVITY_VERIFICATION_BOUNDARY =
  "Local v73 read-only relativity verification readability metadata over existing EIH 1PN weak-field diagnostics, Relativity Observable Atlas, Guided Tour and Kerr Studio summaries. It is not a NASA/JPL precision ephemeris replacement, not numerical relativity, not online scientific certification, not an online data refresh, and it does not modify SolarSystemIntegrator, physicsEngine, worker physics, EIH 1PN dynamics, sky assets or the Kerr kernel.";

export const ATLAS_RELATIVITY_KERNEL_ID: RelativityKernelId =
  "eih-1pn+kerr-geodesic-v17";

const WEAK_FIELD_IDS: readonly RelativityObservableRow["id"][] = [
  "mercury-perihelion-advance",
  "solar-limb-light-deflection",
  "shapiro-radar-delay",
  "gravitational-kinematic-time-dilation",
];

const STRONG_FIELD_IDS: readonly RelativityObservableRow["id"][] = [
  "kerr-null-probe-4m-over-b",
  "kerr-isco-split",
];

const NUMERICAL_HEALTH_IDS: readonly RelativityObservableRow["id"][] = [
  "kerr-hamiltonian-drift",
];

export type CreateAtlasRelativityVerificationSummaryArgs = {
  diagnostics?: SimulationDiagnostics | null;
  kerrStudioSummary?: KerrRelativityStudioSummary | null;
  observableAtlasSummary?: RelativityObservableAtlasSummary | null;
  explainerSummary?: RelativityObservableExplainerSummary | null;
  guidedTourSummary?: RelativityGuidedTourSummary | null;
};

export function createAtlasRelativityVerificationSummary({
  diagnostics = null,
  kerrStudioSummary = null,
  observableAtlasSummary = null,
  explainerSummary = null,
  guidedTourSummary = null,
}: CreateAtlasRelativityVerificationSummaryArgs = {}): AtlasRelativityVerificationSummary {
  const kerr = kerrStudioSummary ?? createKerrRelativityStudioSummary();
  const atlas =
    observableAtlasSummary ??
    createRelativityObservableAtlasSummary({
      diagnostics,
      kerrStudioSummary: kerr,
    });
  const explainer =
    explainerSummary ??
    createRelativityObservableExplainerSummary({
      diagnostics,
      kerrStudioSummary: kerr,
      observableAtlasSummary: atlas,
    });
  const tour =
    guidedTourSummary ??
    createRelativityGuidedTourSummary({
      diagnostics,
      observableAtlasSummary: atlas,
      explainerSummary: explainer,
    });
  const readouts = atlas.rows.map((row) => readout(row, tour));
  const readyReadoutCount = readouts.filter((item) => item.status === "ready").length;

  return {
    version: ATLAS_RELATIVITY_VERIFICATION_VERSION,
    status: summaryStatus(readouts),
    benchmarkProfile: ATLAS_RELATIVITY_BENCHMARK_PROFILE,
    observableAtlasVersion: RELATIVITY_OBSERVABLE_ATLAS_VERSION,
    explainerVersion: RELATIVITY_OBSERVABLE_EXPLAINER_VERSION,
    guidedTourVersion: RELATIVITY_GUIDED_TOUR_VERSION,
    kerrStudioVersion: KERR_RELATIVITY_STUDIO_VERSION,
    kerrKernelId: ATLAS_RELATIVITY_KERNEL_ID,
    weakFieldObservableCount: countIds(readouts, WEAK_FIELD_IDS),
    strongFieldObservableCount: countIds(readouts, STRONG_FIELD_IDS),
    numericalHealthMetricCount: countIds(readouts, NUMERICAL_HEALTH_IDS),
    readyReadoutCount,
    readoutCount: readouts.length,
    physicsMutation: "not-applied",
    skyAssetMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    trustedBoundary: ATLAS_RELATIVITY_VERIFICATION_BOUNDARY,
    readouts,
  };
}

function readout(
  row: RelativityObservableRow,
  tour: RelativityGuidedTourSummary,
): AtlasRelativityVerificationReadout {
  const tourStep = tour.steps.find((step) => step.observableId === row.id);
  return {
    id: row.id,
    kind: row.kind,
    classification: classificationForRow(row),
    title: row.title,
    status: row.status,
    source: row.source,
    route: routeForRow(row, Boolean(tourStep)),
    boundary: `${row.boundary} v73 classification: ${classificationForRow(row)}.`,
  };
}

function classificationForRow(
  row: RelativityObservableRow,
): AtlasRelativityVerificationClassification {
  if (row.kind === "weak-field") return "weak-field-observable";
  if (row.kind === "strong-field") return "kerr-test-particle-reference";
  return "numerical-health-only";
}

function routeForRow(
  row: RelativityObservableRow,
  hasTourStep: boolean,
): AtlasRelativityVerificationReadout["route"] {
  if (row.kind === "strong-field" || row.id === "kerr-hamiltonian-drift") {
    return "kerr-studio-and-guided-tour";
  }
  return hasTourStep ? "observable-atlas-and-guided-tour" : "observable-atlas";
}

function countIds(
  readouts: readonly AtlasRelativityVerificationReadout[],
  ids: readonly RelativityObservableRow["id"][],
): number {
  const idSet = new Set(ids);
  return readouts.filter((item) => idSet.has(item.id)).length;
}

function summaryStatus(
  readouts: readonly AtlasRelativityVerificationReadout[],
): EvidenceClaimStatus {
  if (readouts.some((item) => item.status === "failed")) return "failed";
  if (readouts.some((item) => item.status === "pending")) return "pending";
  if (readouts.some((item) => item.status === "ready")) return "ready";
  return "informational";
}

import { KERR_RELATIVITY_STUDIO_BOUNDARY } from "./kerrRelativityStudio";
import {
  RELATIVITY_OBSERVABLE_ATLAS_VERSION,
  RELATIVITY_OBSERVABLE_EXPLAINER_VERSION,
  createRelativityObservableAtlasSummary,
  createRelativityObservableExplainerSummary,
} from "./relativityObservableAtlas";
import type {
  AtlasNavigatorPanelId,
  AtlasValidationDomainId,
  AtlasWorkflowId,
  EvidenceClaimStatus,
  RelativityGuidedTourStep,
  RelativityGuidedTourSummary,
  RelativityGuidedTourVersion,
  RelativityObservableAtlasSummary,
  RelativityObservableExplainerSummary,
  RelativityObservableRow,
  SimulationDiagnostics,
} from "./simulationDiagnosticsTypes";

export const RELATIVITY_GUIDED_TOUR_VERSION: RelativityGuidedTourVersion =
  "v40-relativity-guided-tour";

export const RELATIVITY_GUIDED_TOUR_WORKFLOW_ID: AtlasWorkflowId =
  "relativity-guided-tour";

export const RELATIVITY_GUIDED_TOUR_BOUNDARY =
  "Read-only guided workflow over existing v37 Observable Atlas rows and v39 derivation cards; local navigation metadata only, not scientific certification, not full numerical relativity, not an Einstein field-equation solver, not cosmological N-body, not online validation, and not a physics mutation.";

const KERR_KERNEL_ID = "eih-1pn+kerr-geodesic-v17";

export type CreateRelativityGuidedTourSummaryArgs = {
  diagnostics?: SimulationDiagnostics | null;
  observableAtlasSummary?: RelativityObservableAtlasSummary | null;
  explainerSummary?: RelativityObservableExplainerSummary | null;
};

type TourStepTemplate = {
  id: RelativityGuidedTourStep["id"];
  title: string;
  navigatorItemId: "panel:relativity-observables" | "panel:kerr-relativity-lab";
  panelId: AtlasNavigatorPanelId;
  validationDomainId: AtlasValidationDomainId;
  evidenceClaimId: "relativity-observable-explainer" | "kerr-geodesic-lab";
  actionLabel: string;
  model: string;
  trustedBoundary: string;
  expectedDomMarker: string;
};

const TOUR_STEP_TEMPLATES: Record<RelativityObservableRow["id"], TourStepTemplate> = {
  "mercury-perihelion-advance": {
    id: "tour-mercury-precession",
    title: "Mercury precession story",
    navigatorItemId: "panel:relativity-observables",
    panelId: "relativity-observables",
    validationDomainId: "relativity-explainer",
    evidenceClaimId: "relativity-observable-explainer",
    actionLabel: "Open atlas",
    model: "Weak-field perihelion tour step over the v37 row and v39 derivation card",
    trustedBoundary:
      "Weak-field explanation route only; no SolarSystemIntegrator, EIH 1PN, or physicsEngine mutation.",
    expectedDomMarker: 'data-relativity-explainer-card-id="mercury-perihelion-advance"',
  },
  "solar-limb-light-deflection": {
    id: "tour-light-deflection",
    title: "Solar-limb light bending story",
    navigatorItemId: "panel:relativity-observables",
    panelId: "relativity-observables",
    validationDomainId: "relativity-explainer",
    evidenceClaimId: "relativity-observable-explainer",
    actionLabel: "Open atlas",
    model: "Weak-field light-deflection tour step over the v37 row and v39 derivation card",
    trustedBoundary:
      "Closed-form weak-field explanation route only; not a ray tracer and not full numerical relativity.",
    expectedDomMarker: 'data-relativity-explainer-card-id="solar-limb-light-deflection"',
  },
  "shapiro-radar-delay": {
    id: "tour-shapiro-delay",
    title: "Shapiro radar delay story",
    navigatorItemId: "panel:relativity-observables",
    panelId: "relativity-observables",
    validationDomainId: "relativity-explainer",
    evidenceClaimId: "relativity-observable-explainer",
    actionLabel: "Open atlas",
    model: "Weak-field radar-delay tour step over the v37 row and v39 derivation card",
    trustedBoundary:
      "Local diagnostic explanation route only; no online ephemeris refresh or radar observation ingest.",
    expectedDomMarker: 'data-relativity-explainer-card-id="shapiro-radar-delay"',
  },
  "gravitational-kinematic-time-dilation": {
    id: "tour-time-dilation",
    title: "Clock-rate dilation story",
    navigatorItemId: "panel:relativity-observables",
    panelId: "relativity-observables",
    validationDomainId: "relativity-explainer",
    evidenceClaimId: "relativity-observable-explainer",
    actionLabel: "Open atlas",
    model: "Weak-field clock-rate tour step over the v37 row and v39 derivation card",
    trustedBoundary:
      "Weak-field clock explanation route only; not precision timing certification.",
    expectedDomMarker:
      'data-relativity-explainer-card-id="gravitational-kinematic-time-dilation"',
  },
  "kerr-null-probe-4m-over-b": {
    id: "tour-kerr-null-probe",
    title: "Kerr null-probe story",
    navigatorItemId: "panel:kerr-relativity-lab",
    panelId: "kerr-lab",
    validationDomainId: "kerr-lab",
    evidenceClaimId: "kerr-geodesic-lab",
    actionLabel: "Open Kerr Studio",
    model: "Kerr Studio tour step over the v35 null-probe and v37 4M/b row",
    trustedBoundary:
      `${KERR_RELATIVITY_STUDIO_BOUNDARY}; test-particle/null-geodesic lab only.`,
    expectedDomMarker: 'data-kerr-studio-boundary="test-particle-null-geodesic-lab"',
  },
  "kerr-isco-split": {
    id: "tour-kerr-isco",
    title: "Kerr ISCO split story",
    navigatorItemId: "panel:kerr-relativity-lab",
    panelId: "kerr-lab",
    validationDomainId: "kerr-lab",
    evidenceClaimId: "kerr-geodesic-lab",
    actionLabel: "Open Kerr Studio",
    model: "Kerr Studio tour step over the v35 ISCO split and v37 observable row",
    trustedBoundary:
      `${KERR_RELATIVITY_STUDIO_BOUNDARY}; independent from solar-system EIH 1PN dynamics.`,
    expectedDomMarker: 'data-kerr-relativity-studio-version="v35-kerr-relativity-studio"',
  },
  "kerr-hamiltonian-drift": {
    id: "tour-kerr-numerical-health",
    title: "Kerr numerical-health boundary",
    navigatorItemId: "panel:kerr-relativity-lab",
    panelId: "kerr-lab",
    validationDomainId: "kerr-lab",
    evidenceClaimId: "kerr-geodesic-lab",
    actionLabel: "Open Kerr Studio",
    model:
      "Numerical-health tour step over the v35 Hamiltonian drift cue and v37 numerical-health row",
    trustedBoundary:
      "Numerical health only; not an astrophysical observable, not scientific certification, and not a Kerr physics mutation.",
    expectedDomMarker: "data-kerr-studio-hamiltonian-drift",
  },
};

export function createRelativityGuidedTourSummary({
  diagnostics = null,
  observableAtlasSummary = null,
  explainerSummary = null,
}: CreateRelativityGuidedTourSummaryArgs = {}): RelativityGuidedTourSummary {
  const atlas =
    observableAtlasSummary ??
    createRelativityObservableAtlasSummary({
      diagnostics,
    });
  const explainer =
    explainerSummary ??
    createRelativityObservableExplainerSummary({
      diagnostics,
      observableAtlasSummary: atlas,
    });
  const explainerIds = new Set(explainer.cards.map((card) => card.observableId));
  const steps = atlas.rows.map((row) => guidedTourStep(row, explainerIds.has(row.id)));
  const readyCount = steps.filter((step) => step.status === "ready").length;

  return {
    version: RELATIVITY_GUIDED_TOUR_VERSION,
    status: readyCount === steps.length ? "ready" : "pending",
    workflowId: RELATIVITY_GUIDED_TOUR_WORKFLOW_ID,
    stepCount: steps.length,
    readyCount,
    weakFieldStepCount: steps.filter((step) => step.kind === "weak-field").length,
    strongFieldStepCount: steps.filter((step) => step.kind === "strong-field").length,
    numericalHealthStepCount: steps.filter((step) => step.kind === "numerical-health").length,
    source: `${RELATIVITY_OBSERVABLE_ATLAS_VERSION} / ${RELATIVITY_OBSERVABLE_EXPLAINER_VERSION}`,
    boundary: RELATIVITY_GUIDED_TOUR_BOUNDARY,
    steps,
  };
}

function guidedTourStep(
  row: RelativityObservableRow,
  hasExplainerCard: boolean,
): RelativityGuidedTourStep {
  const template = TOUR_STEP_TEMPLATES[row.id];
  const status: EvidenceClaimStatus = hasExplainerCard ? "ready" : "pending";
  const kerrKernelSuffix =
    row.id.startsWith("kerr-") && !row.source.includes(KERR_KERNEL_ID)
      ? ` / ${KERR_KERNEL_ID}`
      : "";
  const kerrBoundarySuffix =
    row.id.startsWith("kerr-") && !template.trustedBoundary.includes(KERR_KERNEL_ID)
      ? ` ${KERR_KERNEL_ID}.`
      : "";
  return {
    id: template.id,
    observableId: row.id,
    kind: row.kind,
    title: template.title,
    source: `${row.source}${kerrKernelSuffix} / ${RELATIVITY_GUIDED_TOUR_VERSION}`,
    model: template.model,
    observableStatus: row.status,
    status,
    navigatorItemId: template.navigatorItemId,
    panelId: template.panelId,
    validationDomainId: template.validationDomainId,
    evidenceClaimId: template.evidenceClaimId,
    actionLabel: template.actionLabel,
    expectedDomMarker: template.expectedDomMarker,
    trustedBoundary: `${row.boundary} ${template.trustedBoundary}${kerrBoundarySuffix} ${RELATIVITY_GUIDED_TOUR_BOUNDARY}`,
  };
}

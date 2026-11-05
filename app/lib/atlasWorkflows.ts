import { createAtlasNavigatorSummary } from "./atlasNavigator";
import {
  RELATIVITY_GUIDED_TOUR_BOUNDARY,
  RELATIVITY_GUIDED_TOUR_VERSION,
  RELATIVITY_GUIDED_TOUR_WORKFLOW_ID,
  createRelativityGuidedTourSummary,
} from "./relativityGuidedTour";
import type {
  AtlasNavigatorItem,
  AtlasNavigatorSummary,
  AtlasWorkflow,
  AtlasWorkflowId,
  AtlasWorkflowStep,
  AtlasWorkflowStepSurface,
  AtlasWorkflowSummary,
  AtlasWorkflowVersion,
  RelativityGuidedTourStep,
} from "./simulationDiagnosticsTypes";

export const ATLAS_WORKFLOW_VERSION: AtlasWorkflowVersion = "v25-atlas-workflows";

export type CreateAtlasWorkflowSummaryArgs = {
  navigatorSummary?: AtlasNavigatorSummary | null;
};

type WorkflowTemplate = {
  id: AtlasWorkflowId;
  title: string;
  subtitle: string;
  objective: string;
  source: string;
  model: string;
  boundary: string;
  steps: readonly StepTemplate[];
};

type StepTemplate = {
  id: string;
  title: string;
  target: string;
  source: string;
  model: string;
  expectedSurface: AtlasWorkflowStepSurface;
  boundary: string;
  actionLabel: string;
  navigatorItemId?: string;
  evidenceClaimId?: string;
  catalogObjectId?: string;
  bodyId?: string;
  relativityGuidedTourStepId?: RelativityGuidedTourStep["id"];
  relativityObservableId?: RelativityGuidedTourStep["observableId"];
};

const RELATIVITY_GUIDED_TOUR_SUMMARY = createRelativityGuidedTourSummary();

const WORKFLOW_TEMPLATES: readonly WorkflowTemplate[] = [
  {
    id: "solar-validation",
    title: "Solar Validation",
    subtitle: "EIH 1PN / Horizons / weak-field GR path",
    objective:
      "Focus a solar-system target, inspect orbit diagnostics when available, then open the validation passports.",
    source: "Orbit Atlas solar diagnostics and Evidence Ledger",
    model: "Solar EIH 1PN dynamics with offline Horizons and weak-field GR checks",
    boundary:
      "Solar-system weak-field validation only; not Kerr strong-field dynamics and not spacecraft-grade ephemeris uncertainty.",
    steps: [
      step("focus-mercury", "Focus Mercury", "Mercury", "J2000 local ephemeris", "Live solar-system body focus", "body-focus", "Selects an existing solar body; it does not create or alter a body.", "Focus body", {
        navigatorItemId: "solar-body:mercury",
        bodyId: "mercury",
      }),
      step("open-orbit-analysis", "Open Orbit Analysis", "Selected Orbit Atlas body", "Orbit Analysis sheet", "Osculating diagnostics", "orbit-analysis", "Requires a selected Orbit Atlas body; unavailable in sandbox-only context.", "Open analysis", {
        navigatorItemId: "panel:orbit-analysis",
      }),
      step("open-horizons-evidence", "Open EIH / Horizons Evidence", "Solar EIH 1PN / JPL Horizons", "Evidence Ledger v21", "Solar N-body EIH 1PN validation claim", "evidence-passport", "Evidence passport summarizes existing diagnostics; it does not run a new Horizons fetch.", "Open evidence", {
        navigatorItemId: "evidence-claim:solar-eih-1pn-horizons",
        evidenceClaimId: "solar-eih-1pn-horizons",
      }),
      step("open-weak-field-evidence", "Open GR Weak-field Evidence", "Mercury / light deflection / Shapiro / time dilation", "Evidence Ledger v21", "Analytic weak-field GR checks", "evidence-passport", "Analytic weak-field checks only; not full numerical relativity.", "Open evidence", {
        navigatorItemId: "evidence-claim:gr-weak-field-tests",
        evidenceClaimId: "gr-weak-field-tests",
      }),
    ],
  },
  {
    id: "relativity-lab",
    title: "Kerr Relativity Studio",
    subtitle: "Kerr geodesic experiment deck and weak-field reference path",
    objective:
      "Open the Kerr Relativity Studio, then inspect the strong-field and weak-field evidence passports.",
    source: "Kerr Relativity Studio v35 and Evidence Ledger",
    model: "Independent test-particle/null geodesic experiment deck plus weak-field formula checks",
    boundary:
      "Kerr Studio remains an independent geodesic-backed lab; it is not an Einstein field equation solver.",
    steps: [
      step("open-kerr-lab", "Open Kerr Relativity Studio", "Kerr strong-field experiment deck", "Kerr geodesic kernel v17", "v35 Studio over v19 interactive Kerr lab", "kerr-lab", "Does not replace EIH 1PN solar dynamics.", "Open studio", {
        navigatorItemId: "panel:kerr-relativity-lab",
      }),
      step("open-kerr-evidence", "Open Kerr Evidence", "Kerr Studio geodesic claim", "Evidence Ledger v21", "Kerr geodesic-backed Studio validation passport", "evidence-passport", "Reports test-particle/null geodesic metrics, not numerical relativity.", "Open evidence", {
        navigatorItemId: "evidence-claim:kerr-geodesic-lab",
        evidenceClaimId: "kerr-geodesic-lab",
      }),
      step("open-weak-field-reference", "Open Weak-field Reference", "GR weak-field analytic tests", "Evidence Ledger v21", "4GM/(c^2 b), Shapiro, time dilation checks", "evidence-passport", "Weak-field reference formulas are separate from the Kerr strong-field Studio.", "Open evidence", {
        navigatorItemId: "evidence-claim:gr-weak-field-tests",
        evidenceClaimId: "gr-weak-field-tests",
      }),
    ],
  },
  {
    id: RELATIVITY_GUIDED_TOUR_WORKFLOW_ID,
    title: "Relativity Guided Tour",
    subtitle: "Observable Atlas, derivation cards, Kerr Studio and numerical-health boundary",
    objective:
      "Walk through the seven existing relativity observable rows, opening the right Atlas or Kerr surface while keeping every trusted boundary visible.",
    source: `Relativity Guided Tour ${RELATIVITY_GUIDED_TOUR_VERSION}`,
    model:
      "Read-only science story over v37 Observable Atlas rows and v39 derivation cards",
    boundary: RELATIVITY_GUIDED_TOUR_BOUNDARY,
    steps: RELATIVITY_GUIDED_TOUR_SUMMARY.steps.map(tourStepToWorkflowStep),
  },
  {
    id: "deep-sky-provenance",
    title: "Deep Sky Provenance",
    subtitle: "Catalog objects, object passports, and catalog evidence",
    objective:
      "Focus representative local catalog objects and inspect the catalog-level provenance passport.",
    source: "Celestial Catalog Atlas v22 and Object Passport v23",
    model: "Curated local catalog navigation layer",
    boundary:
      "Presentation/navigation catalog only; not SIMBAD, not VizieR, not the full Gaia archive, and not N-body.",
    steps: [
      step("focus-sirius", "Focus Sirius", "Sirius", "curated-local-v22", "Nearby star catalog direction focus", "object-passport", "Camera direction focus only; no physical body is inserted.", "Focus + passport", {
        navigatorItemId: "celestial-object:nearby-star:sirius",
        catalogObjectId: "nearby-star:sirius",
      }),
      step("focus-orion-nebula", "Focus Orion Nebula", "Orion Nebula", "messier-ngc-curated", "Curated nebula marker", "object-passport", "Static catalog marker; not a nebula physics simulation.", "Focus + passport", {
        navigatorItemId: "celestial-object:nebula:m42",
        catalogObjectId: "nebula:m42",
      }),
      step("focus-pleiades", "Focus Pleiades", "Pleiades", "messier-ngc-curated", "Curated star-cluster marker", "object-passport", "Static cluster marker; not stellar evolution or cluster dynamics.", "Focus + passport", {
        navigatorItemId: "celestial-object:star-cluster:m45",
        catalogObjectId: "star-cluster:m45",
      }),
      step("focus-andromeda", "Focus Andromeda Galaxy", "Andromeda Galaxy", "messier-ngc-curated", "Curated galaxy marker", "object-passport", "Static Local Group marker; not an extragalactic dynamics simulation.", "Focus + passport", {
        navigatorItemId: "celestial-object:galaxy:m31",
        catalogObjectId: "galaxy:m31",
      }),
      step("open-catalog-evidence", "Open Catalog Evidence", "Celestial Catalog Atlas", "Evidence Ledger v21", "Catalog source chain and boundary passport", "evidence-passport", "Catalog evidence summarizes local curated provenance only.", "Open evidence", {
        navigatorItemId: "evidence-claim:celestial-catalog-atlas",
        evidenceClaimId: "celestial-catalog-atlas",
      }),
    ],
  },
  {
    id: "cosmology-validation",
    title: "Cosmology Validation",
    subtitle: "FRW Planck 2018 analytic validation path",
    objective: "Open the FRW Planck 2018 evidence passport and keep its trusted boundary explicit.",
    source: "FRW Planck 2018 validation layer and Evidence Ledger",
    model: "Flat LCDM analytic distance and age checks",
    boundary:
      "Analytic FRW validation layer only; not a Boltzmann solver, not CMB inference, and not cosmological N-body.",
    steps: [
      step("open-frw-evidence", "Open FRW Planck 2018 Evidence", "FRW Planck 2018 flat LCDM", "Evidence Ledger v21", "Analytic FRW distance/age validation passport", "evidence-passport", "Reports analytic validation anchors; not structure formation.", "Open evidence", {
        navigatorItemId: "evidence-claim:frw-planck2018-lcdm",
        evidenceClaimId: "frw-planck2018-lcdm",
      }),
      step("open-evidence-ledger", "Open Evidence Ledger", "Global Evidence Ledger", "Evidence Ledger v21", "Global claim passport index", "panel", "Global summary surface; does not introduce new diagnostics.", "Open ledger", {
        navigatorItemId: "panel:evidence-ledger",
      }),
    ],
  },
  {
    id: "gaia-galactic-context",
    title: "Gaia / Galactic Context",
    subtitle: "Gaia source, galactic dynamics, and nearby-star context",
    objective:
      "Open Gaia and galactic dynamics evidence, then focus a nearby catalog star for object-level provenance.",
    source: "Gaia DR3 catalog layers and Evidence Ledger",
    model: "Gaia DR3 catalog provenance plus analytic galactic potential validation",
    boundary:
      "Catalog-backed and analytic validation context only; not full Gaia archive analytics and not galactic N-body.",
    steps: [
      step("open-gaia-evidence", "Open Gaia DR3 Evidence", "Gaia DR3 catalog", "Evidence Ledger v21", "Gaia catalog source and quality gates", "evidence-passport", "Catalog-backed layer; not full Gaia archive coverage.", "Open evidence", {
        navigatorItemId: "evidence-claim:gaia-dr3-catalog",
        evidenceClaimId: "gaia-dr3-catalog",
      }),
      step("open-galactic-evidence", "Open Galactic Dynamics Evidence", "Galactic dynamics validation", "Evidence Ledger v21", "Analytic potential and Gaia kinematics validation", "evidence-passport", "Analytic galactic validation; not cosmological or galactic N-body.", "Open evidence", {
        navigatorItemId: "evidence-claim:galactic-dynamics-validation",
        evidenceClaimId: "galactic-dynamics-validation",
      }),
      step("focus-sirius-context", "Focus Sirius Context", "Sirius", "curated-local-v22", "Nearby star object passport", "object-passport", "Nearby-star direction focus only; no N-body insertion.", "Focus + passport", {
        navigatorItemId: "celestial-object:nearby-star:sirius",
        catalogObjectId: "nearby-star:sirius",
      }),
    ],
  },
];

export function createAtlasWorkflowSummary({
  navigatorSummary,
}: CreateAtlasWorkflowSummaryArgs = {}): AtlasWorkflowSummary {
  const sourceSummary = navigatorSummary ?? createAtlasNavigatorSummary({ maxResults: 2000 });
  const navigatorItemsById = new Map(sourceSummary.items.map((item) => [item.id, item]));
  const workflows = WORKFLOW_TEMPLATES.map((template) =>
    createWorkflow(template, navigatorItemsById),
  );
  const readyStepCount = workflows.reduce((sum, workflow) => sum + workflow.readyStepCount, 0);
  const blockedStepCount = workflows.reduce((sum, workflow) => sum + workflow.blockedStepCount, 0);

  return {
    version: ATLAS_WORKFLOW_VERSION,
    workflowCount: workflows.length,
    readyStepCount,
    blockedStepCount,
    selectedDefaultId: "solar-validation",
    workflows,
  };
}

function createWorkflow(
  template: WorkflowTemplate,
  navigatorItemsById: ReadonlyMap<string, AtlasNavigatorItem>,
): AtlasWorkflow {
  const steps = template.steps.map((templateStep) =>
    createWorkflowStep(templateStep, navigatorItemsById),
  );
  const readyStepCount = steps.filter((item) => item.status === "ready").length;
  const blockedStepCount = steps.filter((item) => item.status === "blocked").length;

  return {
    id: template.id,
    title: template.title,
    subtitle: template.subtitle,
    objective: template.objective,
    source: template.source,
    model: template.model,
    boundary: template.boundary,
    stepCount: steps.length,
    readyStepCount,
    blockedStepCount,
    steps,
  };
}

function createWorkflowStep(
  template: StepTemplate,
  navigatorItemsById: ReadonlyMap<string, AtlasNavigatorItem>,
): AtlasWorkflowStep {
  const navigatorItem = template.navigatorItemId
    ? navigatorItemsById.get(template.navigatorItemId)
    : undefined;
  const missingReason = template.navigatorItemId && !navigatorItem
    ? `Navigator item ${template.navigatorItemId} is unavailable.`
    : undefined;
  const disabledReason = navigatorItem?.disabled ? navigatorItem.disabledReason : undefined;
  const status = missingReason || disabledReason ? "blocked" : "ready";

  return {
    id: template.id,
    title: template.title,
    status,
    target: template.target,
    source: template.source,
    model: template.model,
    expectedSurface: template.expectedSurface,
    boundary: template.boundary,
    actionLabel: template.actionLabel,
    navigatorItemId: template.navigatorItemId,
    navigatorItem,
    evidenceClaimId: template.evidenceClaimId,
    catalogObjectId: template.catalogObjectId,
    bodyId: template.bodyId,
    relativityGuidedTourStepId: template.relativityGuidedTourStepId,
    relativityObservableId: template.relativityObservableId,
    blockedReason: missingReason ?? disabledReason,
  };
}

function tourStepToWorkflowStep(tourStep: RelativityGuidedTourStep): StepTemplate {
  return step(
    tourStep.id,
    tourStep.title,
    tourStep.observableId,
    tourStep.source,
    tourStep.model,
    tourStep.panelId === "kerr-lab" ? "kerr-lab" : "panel",
    tourStep.trustedBoundary,
    tourStep.actionLabel,
    {
      navigatorItemId: tourStep.navigatorItemId,
      evidenceClaimId: tourStep.evidenceClaimId,
      relativityGuidedTourStepId: tourStep.id,
      relativityObservableId: tourStep.observableId,
    },
  );
}

function step(
  id: string,
  title: string,
  target: string,
  source: string,
  model: string,
  expectedSurface: AtlasWorkflowStepSurface,
  boundary: string,
  actionLabel: string,
  links: Pick<
    StepTemplate,
    | "navigatorItemId"
    | "evidenceClaimId"
    | "catalogObjectId"
    | "bodyId"
    | "relativityGuidedTourStepId"
    | "relativityObservableId"
  >,
): StepTemplate {
  return {
    id,
    title,
    target,
    source,
    model,
    expectedSurface,
    boundary,
    actionLabel,
    ...links,
  };
}

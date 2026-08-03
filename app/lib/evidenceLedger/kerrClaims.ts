/* v250 Evidence Ledger domain: kerr. */
import { ATLAS_NUMERICAL_INTEGRITY_VERSION, createAtlasNumericalIntegritySummary } from "../atlasNumericalIntegrity";
import { ATLAS_RELATIVITY_CHART_VERSION, createAtlasRelativityChartSummary } from "../atlasRelativityCharts";
import { ATLAS_RELATIVITY_VERIFICATION_VERSION, createAtlasRelativityVerificationSummary } from "../atlasRelativityVerification";
import { createKerrRelativityStudioSummary, KERR_RELATIVITY_STUDIO_VERSION } from "../kerrRelativityStudio";
import { createRelativityGuidedTourSummary, RELATIVITY_GUIDED_TOUR_VERSION } from "../relativityGuidedTour";
import { createRelativityObservableAtlasSummary, createRelativityObservableExplainerSummary, RELATIVITY_OBSERVABLE_ATLAS_VERSION, RELATIVITY_OBSERVABLE_EXPLAINER_VERSION } from "../relativityObservableAtlas";
import type { EvidenceClaim, SimulationDiagnostics } from "../simulationDiagnosticsTypes";
import { createPassport, formatNumber, formula, mapReadyFailedStatus, metric, withPassport } from "./shared";
import type { EvidenceClaimWithoutPassport } from "./shared";

export function relativityObservableAtlasClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const summary = createRelativityObservableAtlasSummary({ diagnostics });
  const claim: EvidenceClaimWithoutPassport = {
    id: "relativity-observable-atlas",
    group: "relativity-observable-atlas",
    title: "Relativity Observable Atlas",
    status: "informational",
    confidence: "formula-checked",
    source: `Relativity Observable Atlas ${RELATIVITY_OBSERVABLE_ATLAS_VERSION}`,
    model:
      "Read-only science depth layer over existing weak-field diagnostics and Kerr Studio summaries",
    metric: `${summary.readyCount}/${summary.observableCount} ready formula-backed rows; weak-field ${summary.weakFieldCount}; Kerr ${summary.strongFieldCount}; numerical health ${summary.numericalHealthCount}`,
    error:
      "No new physical error budget. Rows reuse existing diagnostics and label Kerr Hamiltonian drift as numerical health only.",
    boundary: summary.boundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Relativity Validation weak-field diagnostics",
        "Kerr Relativity Studio v35 summary",
        "Evidence Ledger v21 claim passports",
        RELATIVITY_OBSERVABLE_ATLAS_VERSION,
      ],
      method:
        "Build deterministic observable rows from already-computed weak-field GR diagnostics and the existing Kerr Studio summary without running tests, fetching data, mutating state or changing the physics kernels.",
      formulas: [
        formula(
          "mercury-perihelion",
          "Mercury perihelion advance",
          "Delta omega = 6*pi*GM/(a(1-e^2)c^2)",
          "Solar GM, Mercury semimajor axis a, eccentricity e and c",
          "Weak-field 1PN explanation row only.",
        ),
        formula(
          "solar-limb-deflection",
          "Solar-limb light deflection",
          "alpha = 4GM/(c^2 b)",
          "Solar GM, impact parameter b and c",
          "Weak-field closed-form reference, not full ray-traced numerical relativity.",
        ),
        formula(
          "shapiro-delay",
          "Shapiro radar delay",
          "Delta t = 2GM/c^3 ln((rE+rT+R)/(rE+rT-R))",
          "Solar GM, Earth range rE, target range rT, baseline R and c",
          "Local diagnostic explanation only; no online ephemeris refresh.",
        ),
        formula(
          "kerr-4m-over-b",
          "Kerr null-probe weak-field reference",
          "alpha_weak ~= 4M/b",
          "Kerr mass unit M and probe impact parameter b",
          "Kerr Studio v35 test-particle/null-geodesic lab boundary.",
        ),
      ],
      metrics: [
        metric("atlas-version", "Atlas version", summary.version, "informational"),
        metric("observable-count", "Observable rows", String(summary.observableCount), "informational"),
        metric("ready-count", "Ready rows", String(summary.readyCount), summary.status),
        metric("weak-field-count", "Weak-field rows", String(summary.weakFieldCount), "informational"),
        metric("kerr-count", "Kerr rows", String(summary.strongFieldCount), "informational"),
        metric(
          "numerical-health",
          "Hamiltonian drift",
          "numerical health only; not an astrophysical observable",
          "informational",
        ),
        metric("online-source-claim", "Online source claim", "not claimed", "informational"),
        metric("physics-mutation", "Physics mutation", "not applied", "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the explanation layer: observable rows are deterministic projections of existing local diagnostics and Kerr Studio summaries, not a new integrator or validation run.",
      assumptions: [
        "Weak-field rows depend on the current local diagnostics snapshot when available.",
        "Kerr rows use the existing v35 test-particle/null-geodesic studio summary.",
      ],
      limitations: [
        "Does not solve Einstein field equations or provide full numerical relativity.",
        "Does not run lint, tests, builds, online catalog checks or Horizons refreshes.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["relativity-observables", "kerr-lab", "evidence-ledger"],
    }),
  );
}


export function relativityObservableExplainerClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const summary = createRelativityObservableExplainerSummary({ diagnostics });
  const claim: EvidenceClaimWithoutPassport = {
    id: "relativity-observable-explainer",
    group: "relativity-observable-explainer",
    title: "Relativity Observable Explainer",
    status: "informational",
    confidence: "formula-checked",
    source: `Relativity Observable Explainer ${RELATIVITY_OBSERVABLE_EXPLAINER_VERSION}`,
    model:
      "Read-only derivation cards keyed to existing Relativity Observable Atlas rows",
    metric: `${summary.cardCount} derivation cards; ${summary.totalStepCount} steps; ${summary.totalVariableCount} variables`,
    error:
      "No new scientific error budget. Cards explain existing rows and keep Kerr Hamiltonian drift as numerical health only.",
    boundary: summary.boundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Relativity Observable Atlas v37 rows",
        "Relativity Validation weak-field diagnostics",
        "Kerr Relativity Studio v35 summary",
        "Evidence Ledger v21 claim passports",
        RELATIVITY_OBSERVABLE_EXPLAINER_VERSION,
      ],
      method:
        "Map each existing v37 observable row to a deterministic local derivation card with variables, explanation steps, scale interpretation, applicability and trusted boundary. The helper does not run tests, fetch data, mutate state or change physics kernels.",
      formulas: [
        formula(
          "explainer-card-contract",
          "Explainer card mapping",
          "card.observableId in v37 observable row ids",
          "Existing observable row ids, formulas and source labels",
          "Explanation metadata only; not a new observable or certification system.",
        ),
        formula(
          "step-count",
          "Deterministic step count",
          "totalStepCount = sum(card.derivationSteps.length)",
          "Local explainer card array",
          "Product explanation metric only.",
        ),
      ],
      metrics: [
        metric("explainer-version", "Explainer version", summary.version, "informational"),
        metric("card-count", "Explainer cards", String(summary.cardCount), "informational"),
        metric("step-count", "Derivation steps", String(summary.totalStepCount), "informational"),
        metric("variable-count", "Variables", String(summary.totalVariableCount), "informational"),
        metric("observable-row-contract", "Observable row contract", "7 existing v37 rows", "informational"),
        metric("scientific-certification", "Scientific certification", "not claimed", "informational"),
        metric("online-source-claim", "Online source claim", "not claimed", "informational"),
        metric("physics-mutation", "Physics mutation", "not applied", "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the explanation layer: derivation cards are deterministic local descriptions of existing rows and do not introduce new diagnostics, sources or solver behavior.",
      assumptions: [
        "The v37 observable row ids remain stable.",
        "Weak-field and Kerr explanatory text remains tied to existing local diagnostics and Studio summaries.",
      ],
      limitations: [
        "Does not solve Einstein field equations or provide full numerical relativity.",
        "Does not run online validation, catalog lookups, Horizons refreshes, tests, lint or builds from inside the app.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["relativity-observables", "kerr-lab", "evidence-ledger"],
    }),
  );
}


export function relativityGuidedTourClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const summary = createRelativityGuidedTourSummary({ diagnostics });
  const claim: EvidenceClaimWithoutPassport = {
    id: "relativity-guided-tour",
    group: "relativity-guided-tour",
    title: "Relativity Guided Tour",
    status: "informational",
    confidence: "formula-checked",
    source: `Relativity Guided Tour ${RELATIVITY_GUIDED_TOUR_VERSION}`,
    model:
      "Read-only science story workflow over existing Relativity Observable Atlas rows and derivation cards",
    metric: `${summary.readyCount}/${summary.stepCount} guided steps ready; workflow ${summary.workflowId}`,
    error:
      "No new scientific error budget. The tour routes to existing panels and preserves observable, explainer and Kerr boundaries.",
    boundary: summary.boundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Relativity Observable Atlas v37 rows",
        "Relativity Observable Explainer v39 cards",
        "Atlas Workflows v25 guided actions",
        "Kerr Relativity Studio v35 boundary",
        RELATIVITY_GUIDED_TOUR_VERSION,
      ],
      method:
        "Map the seven existing v37 observable row ids to deterministic workflow steps that open existing Atlas or Kerr surfaces. The helper does not add observables, run commands, fetch data, mutate state or alter physics kernels.",
      formulas: [
        formula(
          "tour-step-contract",
          "Guided tour step mapping",
          "step.observableId in v37 observable row ids",
          "Existing observable row ids, v39 explainer cards and stable Navigator panel actions",
          "Navigation metadata only; not a new science solver or certification layer.",
        ),
        formula(
          "tour-ready-count",
          "Guided tour readiness",
          "readyCount = count(steps where v39 card mapping exists)",
          "Local guided-tour step array",
          "Product workflow cue only; not command/runtime pass status.",
        ),
      ],
      metrics: [
        metric("tour-version", "Tour version", summary.version, "informational"),
        metric("workflow-id", "Workflow id", summary.workflowId, "informational"),
        metric("step-count", "Guided steps", String(summary.stepCount), "informational"),
        metric("ready-count", "Ready guided steps", String(summary.readyCount), summary.status),
        metric("weak-field-steps", "Weak-field steps", String(summary.weakFieldStepCount), "informational"),
        metric("kerr-steps", "Kerr steps", String(summary.strongFieldStepCount), "informational"),
        metric(
          "numerical-health-step",
          "Numerical health step",
          "Hamiltonian drift remains numerical health only",
          "informational",
        ),
        metric("scientific-certification", "Scientific certification", "not claimed", "informational"),
        metric("runtime-command-status", "Runtime command status", "not claimed in app", "informational"),
        metric("online-validation", "Online validation", "not claimed", "informational"),
        metric("physics-mutation", "Physics mutation", "not applied", "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the workflow layer: the tour is deterministic local navigation metadata over existing rows, cards and panels.",
      assumptions: [
        "The v37 observable row ids and v39 derivation card ids remain stable.",
        "Navigator keeps stable panel actions for Atlas Workflows, Observable Atlas and Kerr Studio.",
      ],
      limitations: [
        "Does not add observables, formulas, datasets, online validation or command execution.",
        "Does not solve Einstein field equations, provide full numerical relativity or add cosmological N-body.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics or the Kerr geodesic kernel.",
      ],
      relatedViews: ["atlas-workflows", "relativity-observables", "kerr-lab", "evidence-ledger"],
    }),
  );
}


export function relativityVerificationReadabilityClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasRelativityVerificationSummary({ diagnostics });
  const claim: EvidenceClaimWithoutPassport = {
    id: "relativity-verification-readability",
    group: "relativity-verification-readability",
    title: "Relativity Verification Readability",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Relativity Verification ${ATLAS_RELATIVITY_VERIFICATION_VERSION}`,
    model:
      "Read-only v73 benchmark readout over existing weak-field diagnostics, Observable Atlas, Guided Tour and Kerr Studio",
    metric: `weak-field ${summary.weakFieldObservableCount}; Kerr ${summary.strongFieldObservableCount}; numerical health ${summary.numericalHealthMetricCount}; kernel ${summary.kerrKernelId}`,
    error:
      "No new physical error budget. v73 clarifies observable classifications and trusted boundaries only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Relativity Observable Atlas v37 rows",
        "Relativity Observable Explainer v39 cards",
        "Relativity Guided Tour v40 steps",
        "Kerr Relativity Studio v35 summary",
        ATLAS_RELATIVITY_VERIFICATION_VERSION,
      ],
      method:
        "Classify the seven existing relativity rows into four weak-field observables, two Kerr test-particle references and one numerical-health metric. The helper does not run commands, fetch online data, mutate state, alter sky assets or change physics kernels.",
      formulas: [
        formula(
          "v73-readout-partition",
          "Relativity readout partition",
          "4 weak-field + 2 Kerr references + 1 numerical-health metric",
          "Existing v37 observable row ids and v40 guided-tour step ids",
          "Readability contract only; not a new solver, dataset or validation run.",
        ),
        formula(
          "kernel-lock",
          "Kerr kernel lock",
          "kerrKernelId = eih-1pn+kerr-geodesic-v17",
          "Existing local Kerr geodesic kernel id",
          "Identifier lock only; not a Kerr kernel upgrade.",
        ),
      ],
      metrics: [
        metric("verification-version", "Verification version", summary.version, "informational"),
        metric("benchmark-profile", "Benchmark profile", summary.benchmarkProfile, "informational"),
        metric("weak-field-count", "Weak-field observables", String(summary.weakFieldObservableCount), "informational"),
        metric("kerr-count", "Kerr references", String(summary.strongFieldObservableCount), "informational"),
        metric(
          "numerical-health-count",
          "Numerical health metrics",
          String(summary.numericalHealthMetricCount),
          "informational",
        ),
        metric("kerr-kernel", "Kerr kernel", summary.kerrKernelId, "informational"),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, "informational"),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, "informational"),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the readout layer: v73 is a deterministic classification of existing local rows, cards, guided steps and Kerr summaries.",
      assumptions: [
        "The v37 observable row ids remain stable.",
        "The Kerr kernel id remains eih-1pn+kerr-geodesic-v17.",
      ],
      limitations: [
        "Does not replace NASA/JPL precision ephemerides or fetch online validation data.",
        "Does not solve Einstein field equations or provide numerical relativity.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics, sky assets or the Kerr geodesic kernel.",
      ],
      relatedViews: ["relativity-observables", "kerr-lab", "atlas-workflows", "evidence-ledger"],
    }),
  );
}


export function relativityVerificationChartsClaim(
  diagnostics: SimulationDiagnostics | null,
): EvidenceClaim {
  const summary = createAtlasRelativityChartSummary({ diagnostics });
  const claim: EvidenceClaimWithoutPassport = {
    id: "relativity-verification-charts",
    group: "relativity-verification-charts",
    title: "Relativity Verification Charts",
    status: "informational",
    confidence: "formula-checked",
    source: `Atlas Relativity Charts ${ATLAS_RELATIVITY_CHART_VERSION}`,
    model:
      "Read-only v74 chart presentation over existing v73 verification readouts, weak-field diagnostics and Kerr Studio metrics",
    metric: `Mercury curve ${summary.mercuryCurve.length} points; ISCO bars ${summary.kerrIscoBars.length}; Hamiltonian drift ${summary.hamiltonianDrift.formatted}`,
    error:
      "No new physical error budget. v74 charts visualize existing local readouts only.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Relativity Verification v73 readouts",
        "Relativity Validation weak-field diagnostics",
        "Kerr Relativity Studio v35 summary",
        ATLAS_RELATIVITY_CHART_VERSION,
      ],
      method:
        "Render deterministic local chart data for Mercury Newtonian vs EIH 1PN precession, Kerr ISCO prograde/retrograde/split and Hamiltonian drift numerical health. The helper does not run commands, fetch online data, mutate state, alter sky assets or change physics kernels.",
      formulas: [
        formula(
          "mercury-curve",
          "Mercury precession curve",
          "arcsec(f) = arcsec_per_century * f",
          "Century fraction f, Newtonian baseline, EIH 1PN readout and GR target",
          "Chart presentation only; not a new orbit integration.",
        ),
        formula(
          "kerr-isco-bars",
          "Kerr ISCO bar readout",
          "bars = [r_prograde, r_retrograde, r_retrograde - r_prograde]",
          "Existing Kerr Studio v35 summary",
          "Test-particle geodesic lab visualization only.",
        ),
      ],
      metrics: [
        metric("chart-version", "Chart version", summary.version, "informational"),
        metric("chart-profile", "Chart profile", summary.chartProfile, "informational"),
        metric("mercury-points", "Mercury curve points", String(summary.mercuryCurve.length), "informational"),
        metric("isco-bars", "ISCO bars", String(summary.kerrIscoBars.length), "informational"),
        metric("hamiltonian-drift", "Hamiltonian drift", summary.hamiltonianDrift.formatted, "informational"),
        metric("kerr-kernel", "Kerr kernel", summary.kerrKernelId, "informational"),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, "informational"),
        metric("sky-asset-mutation", "Sky asset mutation", summary.skyAssetMutation, "informational"),
        metric("kerr-kernel-mutation", "Kerr kernel mutation", summary.kerrKernelMutation, "informational"),
      ],
      confidenceRationale:
        "Formula-checked at the chart layer: v74 is a deterministic chart projection of existing local diagnostics and summaries.",
      assumptions: [
        "The v73 readout partition remains stable.",
        "Mercury chart values are explanatory arcsec-per-century readouts, not a new integration.",
      ],
      limitations: [
        "Does not replace NASA/JPL precision ephemerides or fetch online validation data.",
        "Does not solve Einstein field equations or provide numerical relativity.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics, sky assets or the Kerr geodesic kernel.",
      ],
      relatedViews: ["relativity-observables", "kerr-lab", "evidence-ledger"],
    }),
  );
}


export function numericalIntegrityGateClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const summary = createAtlasNumericalIntegritySummary(diagnostics);
  const claim: EvidenceClaimWithoutPassport = {
    id: "numerical-integrity-gate",
    group: "numerical-integrity-gate",
    title: "Numerical integrity gate",
    status: summary.status,
    confidence: "formula-checked",
    source: `Atlas Numerical Integrity ${ATLAS_NUMERICAL_INTEGRITY_VERSION}`,
    model:
      "Read-only local audit over existing conservation drift diagnostics plus deterministic local timestep, time-reversal and unit-audit test coverage",
    metric: `${summary.integrityStatus}; energy ${summary.energyDriftTrend}; angular momentum ${summary.angularMomentumDriftTrend}`,
    error:
      "No runtime benchmark execution, CI status, scientific certification, online validation, new physics model, integrator mutation, or Kerr kernel replacement is claimed.",
    boundary: summary.trustedBoundary,
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        `Atlas Numerical Integrity ${summary.version}`,
        "Existing SimulationDiagnostics energyHistory, angMomHistory, relEnergyDrift and relAngMomDrift",
        "Local deterministic unit tests for timestep sensitivity, time reversal and unit audit",
        "v35 Kerr numerical-health boundary and EIH 1PN solar-system dynamics boundary",
      ],
      method:
        "Classify current conservation drift trends from local diagnostics and document deterministic local benchmark coverage without running heavy benchmarks in the runtime UI or mutating physics state.",
      metrics: [
        metric("numerical-integrity-version", "Numerical integrity version", summary.version, claim.status),
        metric("integrity-status", "Integrity status", summary.integrityStatus, claim.status),
        metric("energy-drift-trend", "Energy drift trend", summary.energyDriftTrend, claim.status),
        metric(
          "angular-momentum-drift-trend",
          "Angular momentum drift trend",
          summary.angularMomentumDriftTrend,
          claim.status,
        ),
        metric("current-energy-drift", "Current energy drift", formatNumber(summary.currentEnergyDrift, 6), claim.status),
        metric(
          "current-angular-momentum-drift",
          "Current angular momentum drift",
          formatNumber(summary.currentAngularMomentumDrift, 6),
          claim.status,
        ),
        metric("max-energy-drift", "Max energy drift", formatNumber(summary.maxEnergyDrift, 6), claim.status),
        metric(
          "max-angular-momentum-drift",
          "Max angular momentum drift",
          formatNumber(summary.maxAngularMomentumDrift, 6),
          claim.status,
        ),
        metric("energy-drift-slope", "Energy drift slope", formatNumber(summary.energyDriftSlope, 6), claim.status),
        metric(
          "angular-momentum-drift-slope",
          "Angular momentum drift slope",
          formatNumber(summary.angularMomentumDriftSlope, 6),
          claim.status,
        ),
        metric(
          "timestep-sensitivity-coverage",
          "Timestep sensitivity coverage",
          summary.timestepSensitivityCoverage,
          claim.status,
        ),
        metric("time-reversal-coverage", "Time reversal coverage", summary.timeReversalCoverage, claim.status),
        metric("unit-audit-coverage", "Unit audit coverage", summary.unitAuditCoverage, claim.status),
        metric("benchmark-count", "Benchmark count", `${summary.benchmarkCount}`, claim.status),
        metric(
          "runtime-benchmark-execution",
          "Runtime benchmark execution",
          summary.runtimeBenchmarkExecution,
          claim.status,
        ),
        metric("runtime-certification", "Runtime certification", summary.runtimeCertificationStatus, claim.status),
        metric("ci-certification", "CI certification", summary.ciCertificationStatus, claim.status),
        metric("scientific-certification", "Scientific certification", summary.scientificCertificationStatus, claim.status),
        metric("online-validation", "Online validation", summary.onlineValidationStatus, claim.status),
        metric("physics-mutation", "Physics mutation", summary.physicsMutation, claim.status),
      ],
      confidenceRationale:
        "Formula-check confidence: runtime summary is derived from existing drift diagnostics, while timestep, time-reversal and unit-audit coverage is asserted by local deterministic tests rather than by the runtime UI.",
      assumptions: [
        "The numerical-integrity gate is a local audit layer over existing diagnostics and local tests.",
        "Benchmark coverage describes local test coverage only; it is not the latest command result or CI certification.",
      ],
      limitations: [
        "Does not claim latest runtime command pass/fail, CI certification, scientific certification, online validation, online completeness, or asset completeness.",
        "Does not add J2, radiation pressure, tides, new relativity terms, full numerical relativity, cosmological N-body, or a new astronomical database.",
        "Does not mutate SolarSystemIntegrator, physicsEngine, EIH 1PN dynamics, worker physics, or the Kerr geodesic kernel.",
      ],
      relatedViews: ["evidence-ledger", "telemetry"],
    }),
  );
}


export function kerrStrongFieldClaim(diagnostics: SimulationDiagnostics | null): EvidenceClaim {
  const validation = diagnostics?.strongFieldValidation;
  const status = mapReadyFailedStatus(validation?.status);
  const studio = validation
    ? createKerrRelativityStudioSummary({
        spinA: validation.kerr.spinA,
        impactParameterM: validation.probe.impactParameterM,
        presetId: validation.orbitPresetId,
        validationSummary: validation,
      })
    : null;
  const radialRange =
    validation != null
      ? `${validation.probe.radialRangeMinM.toFixed(2)}-${validation.probe.radialRangeMaxM.toFixed(2)}M`
      : "unavailable";
  const claim: EvidenceClaimWithoutPassport = {
    id: "kerr-geodesic-lab",
    group: "kerr-strong-field",
    title: "Kerr Relativity Studio strong-field lab",
    status,
    confidence: validation ? "formula-checked" : "visual",
    source: "Schwarzschild/Kerr analytic geodesic kernel",
    model: validation
      ? `${validation.relativityKernel} / ${validation.labVersion} / ${KERR_RELATIVITY_STUDIO_VERSION}`
      : `eih-1pn+kerr-geodesic-v17 / v19-interactive-kerr-lab / ${KERR_RELATIVITY_STUDIO_VERSION}`,
    metric: validation
      ? `preset ${validation.orbitPresetId}; b=${validation.probe.impactParameterM.toFixed(2)}M; probe ${validation.probe.probeStatus}; ISCO split ${studio?.iscoSplitM.toFixed(3) ?? "n/a"}M; spin a/M=${validation.kerr.spinA.toFixed(2)}`
      : "Kerr lab diagnostics pending",
    error: validation
      ? validation.error ??
        `max H drift ${formatNumber(studio?.maxHamiltonianDrift ?? validation.integration.probeHamiltonianDrift, 3)}; radial range ${validation.probe.radialRangeMinM.toFixed(2)}-${validation.probe.radialRangeMaxM.toFixed(2)}M`
      : "Pending until the geodesic validation summary is available.",
    boundary: "Independent test-particle/null geodesic lab. Not an Einstein field equation solver or full numerical relativity.",
  };
  return withPassport(
    claim,
    createPassport({
      claim,
      sourceChain: [
        "Schwarzschild/Kerr analytic geodesic kernel",
        validation?.relativityKernel ?? "eih-1pn+kerr-geodesic-v17",
        validation?.labVersion ?? "v19-interactive-kerr-lab",
        KERR_RELATIVITY_STUDIO_VERSION,
        "Evidence Ledger passport view",
      ],
      method:
        "Integrate independent test-particle/null geodesic probes for the Kerr Studio and compare the interactive null probe with a weak-field 4M/b reference, ISCO split, radial range and Hamiltonian drift readout.",
      formulas: [
        formula(
          "weak-field-kerr-reference",
          "Weak-field deflection reference",
          "alpha = 4M/b",
          "geometric mass M and impact parameter b",
          "Only a weak-field reference for the interactive null probe.",
        ),
        formula(
          "outer-horizon",
          "Kerr outer horizon",
          "r_+ = M + sqrt(M^2 - a^2)",
          "geometric mass M and spin parameter a",
          "Kerr metric diagnostic for |a/M| < 1.",
        ),
      ],
      metrics: [
        metric("preset", "v19 preset", validation?.orbitPresetId ?? "pending", status),
        metric("studio-version", "v35 studio version", studio?.version ?? KERR_RELATIVITY_STUDIO_VERSION, status),
        metric("impact-parameter", "Impact parameter b/M", formatNumber(validation?.probe.impactParameterM, 2, "M"), status),
        metric("probe-status", "Probe status", validation?.probe.probeStatus ?? "pending", status),
        metric("spin", "Spin a/M", formatNumber(validation?.kerr.spinA, 2), status),
        metric("weak-field-4m-b", "4M/b reference", formatNumber(validation?.probe.weakFieldDeflectionRad, 4, " rad"), status),
        metric("isco-split", "ISCO split", formatNumber(studio?.iscoSplitM, 3, "M"), status),
        metric("studio-hamiltonian-drift", "Studio max Hamiltonian drift", formatNumber(studio?.maxHamiltonianDrift, 3), status),
        metric("probe-hamiltonian-drift", "Probe Hamiltonian drift", formatNumber(validation?.integration.probeHamiltonianDrift, 3), status),
        metric("radial-range", "Radial range", radialRange, status),
        metric("studio-boundary", "Studio boundary", studio?.boundary ?? "test-particle-null-geodesic-lab", "informational"),
      ],
      confidenceRationale:
        validation?.status === "ready"
          ? "Formula-checked: status and error metrics come from the v19 Kerr geodesic validation summary plus the v35 Kerr Relativity Studio readout for the current preset and impact parameter."
          : "Pending or failed until the Kerr lab produces a validation summary.",
      assumptions: [
        "The Kerr lab is independent of the solar-system EIH 1PN integrator.",
        "The probe is a test-particle/null geodesic visualization, not a live ray tracer.",
      ],
      limitations: [
        "Not an Einstein field equation solver.",
        "Not full numerical relativity and not a complete real-time Kerr ray tracer.",
      ],
      relatedViews: ["kerr-lab", "telemetry", "evidence-ledger"],
    }),
  );
}

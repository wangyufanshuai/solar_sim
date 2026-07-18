import { describe, expect, it } from "vitest";
import { createEvidenceLedgerSummary, selectEvidenceClaim } from "./evidenceLedger";
import { createAtlasPerformanceBudgetSummary } from "./atlasPerformanceBudget";
import { createFrwCosmologyValidationSummary } from "./frwCosmologyValidation";
import { PENDING_GALACTIC_VALIDATION } from "./galacticDynamicsValidation";
import { createKerrGeodesicValidationSummary } from "./kerrGeodesicKernel";
import {
  PENDING_HORIZONS_VALIDATION_RUN,
  solarLimbLightDeflectionValidation,
} from "./relativityValidation";
import { createResearchValidationSummary } from "./researchValidation";
import type { SimulationDiagnostics } from "./simulationDiagnosticsTypes";

describe("Evidence Ledger v21", () => {
  it("always includes the required claim groups and complete evidence passports", () => {
    const summary = createEvidenceLedgerSummary({
      diagnostics: null,
      orbitAtlasProfile: "orbit-atlas-v12",
      orbitAtlasRenderer: "cold-body-web-v12",
      gaiaCatalogSource: "placeholder",
      orbitAtlasReady: false,
      presentationMode: "orbit-atlas",
    });

    expect(summary.version).toBe("v21-claim-passports");
    expect(summary.groups).toEqual([
      "orbit-visual-layer",
      "mission-capsule-reproducibility",
      "scientific-report-dossier",
      "validation-console-readiness",
      "observatory-deck-workbench",
      "performance-budget-readiness",
      "release-candidate-gate",
      "relativity-observable-atlas",
      "relativity-observable-explainer",
      "relativity-guided-tour",
      "relativity-verification-readability",
      "relativity-verification-charts",
      "physics-benchmark-release-gate",
      "horizons-gate-closure-audit",
      "physics-gate-split",
      "release-readiness-documentation",
      "scientific-gate-preflight",
      "horizons-residual-decomposition",
      "horizons-candidate-lab",
      "pluto-residual-isolation",
      "outer-system-force-model-preflight",
      "outer-system-reference-adoption",
      "horizons-candidate-scientific-gate",
      "strict-horizons-migration-dry-run",
      "strict-horizons-shadow-migration-gate",
      "default-strict-horizons-migration",
      "horizons-provenance-freeze",
      "offline-runtime-boundary-audit",
      "scientific-gate-maintenance-runbook",
      "scientific-gate-release-evidence",
      "browser-ci-stability-lock",
      "release-artifact-manifest-lock",
      "final-maintenance-baseline",
      "gaia-starfield-enhancement",
      "relativity-simulation-optimization",
      "art-polish",
      "post-enhancement-maintenance-baseline",
      "browser-resource-performance-lock",
      "maintenance-evidence-index",
      "presentation-runtime-performance-lock",
      "browser-acceptance-runtime-cost-lock",
      "final-gaia-art-enhancement-lock",
      "release-candidate-evidence-closure-lock",
      "interaction-catalog-completion-lock",
      "interaction-repair-launch-ux-lock",
      "interaction-visual-quality-lock",
      "critical-ui-relativity-visibility-lock",
      "camera-stellar-closeup-lock",
      "launch-gameplay-openrocket-bridge-lock",
      "scientific-model-upgrade-contract",
      "visual-launch-performance-lock",
      "browser-acceptance-harness",
      "accessibility-workbench",
      "cinematic-visual-system",
      "planetary-visual-fidelity",
      "cinematic-lighting",
      "chinese-deep-space-fidelity",
      "cinematic-deep-space-camera",
      "universe-sandbox-reference-backdrop",
      "reference-grade-space-art",
      "planetary-material-composition",
      "cinematic-closeup-director",
      "cinematic-key-light-director",
      "planetary-depth-lighting",
      "planetary-color-grading",
      "numerical-integrity-gate",
      "cinematic-planetary-art-direction",
      "cinematic-deep-space-backdrop",
      "sparse-deep-space-director",
      "closeup-presentation-truth",
      "closeup-visual-fidelity",
      "solar-eih-1pn",
      "gr-weak-field",
      "gaia-catalog",
      "celestial-catalog-atlas",
      "galactic-dynamics",
      "frw-cosmology",
      "kerr-strong-field",
    ]);
    expect(summary.claimCount).toBeGreaterThan(0);
    for (const claim of summary.claims) {
      expect(claim.id).toBeTruthy();
      expect(claim.source).toBeTruthy();
      expect(claim.model).toBeTruthy();
      expect(claim.metric).toBeTruthy();
      expect(claim.error).toBeTruthy();
      expect(claim.boundary).toBeTruthy();
      expect(claim.passport.claimId).toBe(claim.id);
      expect(claim.passport.sourceChain.length).toBeGreaterThan(0);
      expect(claim.passport.method).toBeTruthy();
      expect(claim.passport.metrics.length).toBeGreaterThan(0);
      expect(claim.passport.confidenceRationale).toBeTruthy();
      expect(claim.passport.assumptions.length).toBeGreaterThan(0);
      expect(claim.passport.limitations.length).toBeGreaterThan(0);
      expect(claim.passport.sections.map((section) => section.id)).toEqual(
        expect.arrayContaining(["source-chain", "method", "metrics", "confidence", "limitations"]),
      );
    }
  });

  it("maps Gaia, Horizons, weak-field GR, FRW, galactic and Kerr diagnostics into passports", () => {
    const summary = createEvidenceLedgerSummary({
      diagnostics: createDiagnostics(),
      orbitAtlasProfile: "orbit-atlas-v12",
      orbitAtlasRenderer: "cold-body-web-v12",
      gaiaCatalogSource: "gaia-dr3",
      orbitAtlasReady: true,
      presentationMode: "orbit-atlas",
    });

    expect(summary.claims.find((claim) => claim.id === "gaia-dr3-catalog")?.confidence).toBe("catalog-backed");
    expect(summary.claims.find((claim) => claim.id === "celestial-catalog-atlas")?.confidence).toBe("catalog-backed");
    expect(summary.claims.find((claim) => claim.id === "scientific-report-dossier")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "report-version", value: "v28-scientific-report" }),
        expect.objectContaining({ id: "studio-version", value: "v29-report-studio" }),
        expect.objectContaining({ id: "export-formats", value: expect.stringContaining("printable HTML") }),
        expect.objectContaining({ id: "excluded-state", value: expect.stringContaining("telemetry samples") }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "validation-console-readiness")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "console-version", value: "v30-validation-console" }),
        expect.objectContaining({ id: "status-model", value: expect.stringContaining("ready") }),
        expect.objectContaining({ id: "trust-score", value: "not generated" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "observatory-deck-workbench")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "deck-version", value: "v31-observatory-deck" }),
        expect.objectContaining({ id: "zone-count", value: expect.stringContaining("4") }),
        expect.objectContaining({ id: "action-routing", value: expect.stringContaining("Navigator") }),
        expect.objectContaining({ id: "excluded-behavior", value: expect.stringContaining("no physics mutation") }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "performance-budget-readiness")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "performance-version", value: "v34-performance-budget" }),
        expect.objectContaining({ id: "auto-degrade", value: "not applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "release-candidate-gate")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "release-gate-version", value: "v36-release-candidate-gate" }),
        expect.objectContaining({ id: "runtime-command-status", value: "not claimed in app" }),
        expect.objectContaining({ id: "physics-mutation", value: "not applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "release-candidate-gate")?.boundary).toContain(
      "not CI status",
    );
    expect(summary.claims.find((claim) => claim.id === "relativity-observable-atlas")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "atlas-version", value: "v37-relativity-observable-atlas" }),
        expect.objectContaining({ id: "observable-count", value: "7" }),
        expect.objectContaining({ id: "online-source-claim", value: "not claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not applied" }),
        expect.objectContaining({
          id: "numerical-health",
          value: expect.stringContaining("not an astrophysical observable"),
        }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "relativity-observable-atlas")?.boundary).toContain(
      "not full numerical relativity",
    );
    expect(summary.claims.find((claim) => claim.id === "relativity-observable-explainer")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "explainer-version", value: "v39-relativity-observable-explainer" }),
        expect.objectContaining({ id: "card-count", value: "7" }),
        expect.objectContaining({ id: "step-count", value: "28" }),
        expect.objectContaining({ id: "observable-row-contract", value: "7 existing v37 rows" }),
        expect.objectContaining({ id: "scientific-certification", value: "not claimed" }),
        expect.objectContaining({ id: "online-source-claim", value: "not claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "relativity-observable-explainer")?.boundary).toContain(
      "not scientific certification",
    );
    expect(summary.claims.find((claim) => claim.id === "relativity-guided-tour")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "tour-version", value: "v40-relativity-guided-tour" }),
        expect.objectContaining({ id: "workflow-id", value: "relativity-guided-tour" }),
        expect.objectContaining({ id: "step-count", value: "7" }),
        expect.objectContaining({ id: "ready-count", value: "7" }),
        expect.objectContaining({ id: "scientific-certification", value: "not claimed" }),
        expect.objectContaining({ id: "runtime-command-status", value: "not claimed in app" }),
        expect.objectContaining({ id: "online-validation", value: "not claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "relativity-guided-tour")?.boundary).toContain(
      "not scientific certification",
    );
    expect(summary.claims.find((claim) => claim.id === "relativity-verification-readability")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "verification-version", value: "v73-relativity-verification-readability" }),
        expect.objectContaining({ id: "benchmark-profile", value: "v73-weak-field-kerr-benchmark-readout" }),
        expect.objectContaining({ id: "weak-field-count", value: "4" }),
        expect.objectContaining({ id: "kerr-count", value: "2" }),
        expect.objectContaining({ id: "numerical-health-count", value: "1" }),
        expect.objectContaining({ id: "kerr-kernel", value: "eih-1pn+kerr-geodesic-v17" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "relativity-verification-readability")?.boundary).toContain(
      "not numerical relativity",
    );
    expect(summary.claims.find((claim) => claim.id === "relativity-verification-charts")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "chart-version", value: "v74-relativity-verification-charts" }),
        expect.objectContaining({ id: "chart-profile", value: "v74-newtonian-eih-kerr-readout-curves" }),
        expect.objectContaining({ id: "mercury-points", value: "5" }),
        expect.objectContaining({ id: "isco-bars", value: "3" }),
        expect.objectContaining({ id: "kerr-kernel", value: "eih-1pn+kerr-geodesic-v17" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "relativity-verification-charts")?.boundary).toContain(
      "Charts are presentation-layer visual aids only",
    );
    expect(summary.claims.find((claim) => claim.id === "physics-benchmark-release-gate")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "gate-version", value: "v75-physics-benchmark-release-gate" }),
        expect.objectContaining({ id: "budget-profile", value: "v75-weak-field-horizons-kerr-error-budget" }),
        expect.objectContaining({ id: "ci-certification", value: "not-claimed-in-app" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "physics-benchmark-release-gate")?.boundary).toContain(
      "does not claim the latest CI result",
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-gate-closure-audit")).toEqual(
      expect.objectContaining({
        group: "horizons-gate-closure-audit",
        status: "informational",
        source: expect.stringContaining("v77-horizons-gate-closure-audit"),
        metric: expect.stringContaining("1PN RMS"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-gate-closure-audit")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "audit-version", value: "v77-horizons-gate-closure-audit" }),
        expect.objectContaining({ id: "audit-profile", value: "v77-j2000-frame-unit-integrator-audit" }),
        expect.objectContaining({ id: "failure-classification", value: expect.stringMatching(/pending|model-limit|none/) }),
        expect.objectContaining({
          id: "current-failure",
          value: expect.stringContaining("1PN RMS"),
        }),
        expect.objectContaining({ id: "full-release-gate", value: "blocked-by-v75-horizons-until-fixed" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "material-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-gate-closure-audit")?.boundary).toContain(
      "not a threshold relaxation",
    );
    expect(summary.claims.find((claim) => claim.id === "physics-gate-split")).toEqual(
      expect.objectContaining({
        group: "physics-gate-split",
        status: "informational",
        source: expect.stringContaining("v78-product-scientific-physics-gate-split"),
        metric: expect.stringContaining("product pass"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "physics-gate-split")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "split-version", value: "v78-product-scientific-physics-gate-split" }),
        expect.objectContaining({ id: "split-profile", value: "v78-local-product-ready-strict-horizons-blocked" }),
        expect.objectContaining({ id: "product-release-gate", value: "pass" }),
        expect.objectContaining({ id: "scientific-horizons-gate", value: expect.stringMatching(/pending-runtime-run|blocked-model-limit|pass/) }),
        expect.objectContaining({ id: "product-full-command", value: "npm run verify:atlas:full" }),
        expect.objectContaining({ id: "scientific-full-command", value: "npm run verify:atlas:scientific" }),
        expect.objectContaining({ id: "strict-horizons-command", value: "npm run test:atlas:horizons-scientific-gate" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "physics-gate-split")?.boundary).toContain(
      "does not relax v75 Horizons thresholds",
    );
    expect(summary.claims.find((claim) => claim.id === "release-readiness-documentation")).toEqual(
      expect.objectContaining({
        group: "release-readiness-documentation",
        status: "informational",
        source: expect.stringContaining("v79-release-readiness-gate-semantics"),
        metric: expect.stringContaining("product-ready-scientific-horizons-blocked"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "release-readiness-documentation")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "readiness-version", value: "v79-release-readiness-gate-semantics" }),
        expect.objectContaining({ id: "readiness-profile", value: "v79-product-ready-scientific-blocker-disclosed" }),
        expect.objectContaining({ id: "release-semantics", value: "product-ready-scientific-horizons-blocked" }),
        expect.objectContaining({ id: "product-full-command", value: "npm run verify:atlas:full" }),
        expect.objectContaining({ id: "scientific-full-command", value: "npm run verify:atlas:scientific" }),
        expect.objectContaining({ id: "strict-horizons-command", value: "npm run test:atlas:horizons-scientific-gate" }),
        expect.objectContaining({ id: "known-scientific-blocker", value: expect.stringContaining("1PN RMS") }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "release-readiness-documentation")?.boundary).toContain(
      "does not relax Horizons thresholds",
    );
    expect(summary.claims.find((claim) => claim.id === "scientific-gate-preflight")).toEqual(
      expect.objectContaining({
        group: "scientific-gate-preflight",
        status: "informational",
        source: expect.stringContaining("v80-scientific-horizons-closure-preflight"),
        metric: expect.stringContaining("3 candidate paths"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "scientific-gate-preflight")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "preflight-version", value: "v80-scientific-horizons-closure-preflight" }),
        expect.objectContaining({ id: "preflight-profile", value: "v80-horizons-model-limit-upgrade-roadmap" }),
        expect.objectContaining({ id: "preflight-status", value: "product-ready-strict-scientific-blocked-preflight-ready" }),
        expect.objectContaining({ id: "candidate-path-count", value: "3" }),
        expect.objectContaining({ id: "candidate-paths", value: expect.stringContaining("ephemeris-initial-state-upgrade") }),
        expect.objectContaining({ id: "known-scientific-blocker", value: expect.stringContaining("1PN RMS") }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "scientific-gate-preflight")?.boundary).toContain(
      "does not relax v75 thresholds",
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-residual-decomposition")).toEqual(
      expect.objectContaining({
        group: "horizons-residual-decomposition",
        status: "informational",
        source: expect.stringContaining("v81-horizons-residual-decomposition"),
        metric: expect.stringContaining("RTN rows"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-residual-decomposition")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "decomposition-version", value: "v81-horizons-residual-decomposition" }),
        expect.objectContaining({ id: "decomposition-profile", value: "v81-rtn-body-checkpoint-error-attribution" }),
        expect.objectContaining({ id: "decomposition-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "reference-frame", value: "sun-centered-reference-rtn" }),
        expect.objectContaining({ id: "residual-row-count", value: "0" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-residual-decomposition")?.boundary).toContain(
      "do not prove a root cause",
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-candidate-lab")).toEqual(
      expect.objectContaining({
        group: "horizons-candidate-lab",
        status: "informational",
        source: expect.stringContaining("v82-horizons-dynamical-parameter-candidate-lab"),
        metric: expect.stringContaining("0/5 candidate rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-candidate-lab")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "candidate-lab-version", value: "v82-horizons-dynamical-parameter-candidate-lab" }),
        expect.objectContaining({ id: "candidate-profile", value: "v82-de440-gm-softening-step-hierarchy-matrix" }),
        expect.objectContaining({ id: "candidate-status", value: "pending-offline-run" }),
        expect.objectContaining({ id: "candidate-count", value: "5" }),
        expect.objectContaining({ id: "strict-default-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "candidate-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-candidate-lab")?.boundary).toContain(
      "Candidate rows are diagnostics only",
    );
    expect(summary.claims.find((claim) => claim.id === "pluto-residual-isolation")).toEqual(
      expect.objectContaining({
        group: "pluto-residual-isolation",
        status: "informational",
        source: expect.stringContaining("v83-pluto-residual-cause-isolation"),
        metric: expect.stringContaining("0/6 rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "pluto-residual-isolation")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "pluto-isolation-version", value: "v83-pluto-residual-cause-isolation" }),
        expect.objectContaining({ id: "pluto-isolation-profile", value: "v83-outer-system-phase-force-model-matrix" }),
        expect.objectContaining({ id: "pluto-isolation-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "pluto-isolation-classification", value: "not-isolated" }),
        expect.objectContaining({ id: "candidate-count", value: "6" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "pluto-residual-isolation")?.boundary).toContain(
      "diagnostic attribution only",
    );
    expect(summary.claims.find((claim) => claim.id === "outer-system-force-model-preflight")).toEqual(
      expect.objectContaining({
        group: "outer-system-force-model-preflight",
        status: "informational",
        source: expect.stringContaining("v84-outer-system-force-model-preflight"),
        metric: expect.stringContaining("0/5 rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "outer-system-force-model-preflight")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "outer-system-preflight-version", value: "v84-outer-system-force-model-preflight" }),
        expect.objectContaining({ id: "outer-system-preflight-profile", value: "v84-pluto-barycenter-tno-force-model-upgrade-path" }),
        expect.objectContaining({ id: "outer-system-preflight-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "outer-system-classification", value: "not-enough-evidence" }),
        expect.objectContaining({ id: "candidate-count", value: "5" }),
        expect.objectContaining({ id: "fixture-provenance-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "outer-system-force-model-preflight")?.boundary).toContain(
      "audits fixture provenance",
    );
    expect(summary.claims.find((claim) => claim.id === "outer-system-reference-adoption")).toEqual(
      expect.objectContaining({
        group: "outer-system-reference-adoption",
        status: "informational",
        source: expect.stringContaining("v85-outer-system-reference-adoption-preflight"),
        metric: expect.stringContaining("0/1 rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "outer-system-reference-adoption")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "outer-system-reference-adoption-version", value: "v85-outer-system-reference-adoption-preflight" }),
        expect.objectContaining({ id: "outer-system-reference-adoption-profile", value: "v85-barycentric-fixture-adoption-readiness" }),
        expect.objectContaining({ id: "outer-system-reference-adoption-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "outer-system-reference-adoption-classification", value: "mixed" }),
        expect.objectContaining({ id: "candidate-count", value: "1" }),
        expect.objectContaining({ id: "default-strict-fixture-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "default-scientific-gate-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "outer-system-reference-adoption")?.boundary).toContain(
      "migration readiness only",
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-candidate-scientific-gate")).toEqual(
      expect.objectContaining({
        group: "horizons-candidate-scientific-gate",
        status: "informational",
        source: expect.stringContaining("v86-horizons-candidate-scientific-gate"),
        metric: expect.stringContaining("0/1 rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-candidate-scientific-gate")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "horizons-candidate-scientific-gate-version", value: "v86-horizons-candidate-scientific-gate" }),
        expect.objectContaining({ id: "horizons-candidate-scientific-gate-profile", value: "v86-barycentric-reference-candidate-gate" }),
        expect.objectContaining({ id: "horizons-candidate-scientific-gate-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "horizons-candidate-scientific-gate-classification", value: "mixed" }),
        expect.objectContaining({ id: "candidate-count", value: "1" }),
        expect.objectContaining({ id: "default-scientific-gate-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "worker-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "rk4-default-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "eih-one-pn-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-candidate-scientific-gate")?.boundary).toContain(
      "unapplied candidate",
    );
    expect(summary.claims.find((claim) => claim.id === "strict-horizons-migration-dry-run")).toEqual(
      expect.objectContaining({
        group: "strict-horizons-migration-dry-run",
        status: "informational",
        source: expect.stringContaining("v87-strict-horizons-migration-dry-run"),
        metric: expect.stringContaining("0/1 diffs complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "strict-horizons-migration-dry-run")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "strict-horizons-migration-dry-run-version", value: "v87-strict-horizons-migration-dry-run" }),
        expect.objectContaining({ id: "strict-horizons-migration-dry-run-profile", value: "v87-default-gate-migration-diff-audit" }),
        expect.objectContaining({ id: "strict-horizons-migration-dry-run-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "strict-horizons-migration-dry-run-classification", value: "mixed" }),
        expect.objectContaining({ id: "migration-diff-count", value: "1" }),
        expect.objectContaining({ id: "default-strict-command-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "default-scientific-gate-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "worker-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "rk4-default-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "eih-one-pn-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "strict-horizons-migration-dry-run")?.boundary).toContain(
      "dry-run audit",
    );
    expect(summary.claims.find((claim) => claim.id === "strict-horizons-shadow-migration-gate")).toEqual(
      expect.objectContaining({
        group: "strict-horizons-shadow-migration-gate",
        status: "informational",
        source: expect.stringContaining("v88-strict-horizons-shadow-migration-gate"),
        metric: expect.stringContaining("0/1 shadow rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "strict-horizons-shadow-migration-gate")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "strict-horizons-shadow-migration-gate-version", value: "v88-strict-horizons-shadow-migration-gate" }),
        expect.objectContaining({ id: "strict-horizons-shadow-migration-gate-profile", value: "v88-parallel-default-gate-rehearsal" }),
        expect.objectContaining({ id: "strict-horizons-shadow-migration-gate-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "strict-horizons-shadow-migration-gate-classification", value: "mixed" }),
        expect.objectContaining({ id: "shadow-gate-count", value: "1" }),
        expect.objectContaining({ id: "default-strict-command-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "shadow-gate-command-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "default-scientific-gate-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "worker-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "rk4-default-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "eih-one-pn-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "strict-horizons-shadow-migration-gate")?.boundary).toContain(
      "shadow strict Horizons gate rehearsal",
    );
    expect(summary.claims.find((claim) => claim.id === "default-strict-horizons-migration")).toEqual(
      expect.objectContaining({
        group: "default-strict-horizons-migration",
        status: "informational",
        source: expect.stringContaining("v89-default-strict-horizons-scientific-gate-migration"),
        metric: expect.stringContaining("0/1 migration rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "default-strict-horizons-migration")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "default-strict-horizons-migration-version", value: "v89-default-strict-horizons-scientific-gate-migration" }),
        expect.objectContaining({ id: "default-strict-horizons-migration-profile", value: "v89-apply-barycentric-reference-default-gate" }),
        expect.objectContaining({ id: "default-strict-horizons-migration-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "default-strict-horizons-migration-classification", value: "mixed" }),
        expect.objectContaining({ id: "default-scientific-gate-migration", value: "applied-offline-gate-only" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "worker-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "rk4-default-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "eih-one-pn-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "background-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "default-strict-horizons-migration")?.boundary).toContain(
      "offline strict Horizons scientific gate",
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-provenance-freeze")).toEqual(
      expect.objectContaining({
        group: "horizons-provenance-freeze",
        status: "informational",
        source: expect.stringContaining("v90-horizons-provenance-freeze"),
        metric: expect.stringContaining("0/1 freeze rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-provenance-freeze")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "horizons-provenance-freeze-version", value: "v90-horizons-provenance-freeze" }),
        expect.objectContaining({ id: "horizons-provenance-freeze-profile", value: "v90-default-gate-command-fixture-hash-lock" }),
        expect.objectContaining({ id: "horizons-provenance-freeze-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "horizons-provenance-freeze-classification", value: "mixed" }),
        expect.objectContaining({ id: "provenance-freeze", value: "applied-offline-contract-only" }),
        expect.objectContaining({ id: "default-gate-config-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "legacy-audit-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "worker-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "rk4-default-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "eih-one-pn-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "background-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "horizons-provenance-freeze")?.boundary).toContain(
      "fixture hashes",
    );
    expect(summary.claims.find((claim) => claim.id === "offline-runtime-boundary-audit")).toEqual(
      expect.objectContaining({
        group: "offline-runtime-boundary-audit",
        status: "informational",
        source: expect.stringContaining("v91-offline-runtime-boundary-audit"),
        metric: expect.stringContaining("0/1 boundary rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "offline-runtime-boundary-audit")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "offline-runtime-boundary-audit-version", value: "v91-offline-runtime-boundary-audit" }),
        expect.objectContaining({ id: "offline-runtime-boundary-audit-profile", value: "v91-scientific-gate-runtime-boundary-lock" }),
        expect.objectContaining({ id: "offline-runtime-boundary-audit-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "offline-runtime-boundary-audit-classification", value: "mixed" }),
        expect.objectContaining({ id: "offline-runtime-boundary-audit", value: "applied-contract-only" }),
        expect.objectContaining({ id: "default-gate-config-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "worker-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "rk4-default-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "eih-one-pn-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "background-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "fixture-data-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "certification-claim-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "offline-runtime-boundary-audit")?.boundary).toContain(
      "live runtime physics",
    );
    expect(summary.claims.find((claim) => claim.id === "scientific-gate-maintenance-runbook")).toEqual(
      expect.objectContaining({
        group: "scientific-gate-maintenance-runbook",
        status: "informational",
        source: expect.stringContaining("v92-scientific-gate-maintenance-runbook-lock"),
        metric: expect.stringContaining("0/1 runbook rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "scientific-gate-maintenance-runbook")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "scientific-gate-runbook-version", value: "v92-scientific-gate-maintenance-runbook-lock" }),
        expect.objectContaining({ id: "scientific-gate-runbook-profile", value: "v92-offline-gate-release-rollback-command-runbook" }),
        expect.objectContaining({ id: "scientific-gate-runbook-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "scientific-gate-runbook-classification", value: "mixed" }),
        expect.objectContaining({ id: "scientific-gate-maintenance-runbook", value: "applied-contract-only" }),
        expect.objectContaining({ id: "migrated-default-fixture", value: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json" }),
        expect.objectContaining({ id: "legacy-v75-fixture", value: "public/data/horizons-validation-j2000.json" }),
        expect.objectContaining({ id: "default-gate-config-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "worker-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "rk4-default-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "eih-one-pn-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "background-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "fixture-data-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "certification-claim-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "scientific-gate-maintenance-runbook")?.boundary).toContain(
      "maintenance runbook",
    );
    expect(summary.claims.find((claim) => claim.id === "scientific-gate-release-evidence")).toEqual(
      expect.objectContaining({
        group: "scientific-gate-release-evidence",
        status: "informational",
        source: expect.stringContaining("v93-scientific-gate-release-evidence-lock"),
        metric: expect.stringContaining("0/1 release evidence rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "scientific-gate-release-evidence")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "scientific-gate-release-evidence-version", value: "v93-scientific-gate-release-evidence-lock" }),
        expect.objectContaining({ id: "scientific-gate-release-evidence-profile", value: "v93-offline-gate-release-evidence-bundle" }),
        expect.objectContaining({ id: "scientific-gate-release-evidence-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "scientific-gate-release-evidence-classification", value: "mixed" }),
        expect.objectContaining({ id: "scientific-gate-release-evidence", value: "applied-contract-only" }),
        expect.objectContaining({ id: "migrated-default-fixture", value: "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json" }),
        expect.objectContaining({ id: "legacy-v75-fixture", value: "public/data/horizons-validation-j2000.json" }),
        expect.objectContaining({ id: "migrated-fixture-sha256", value: "0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D" }),
        expect.objectContaining({ id: "legacy-fixture-sha256", value: "7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B" }),
        expect.objectContaining({ id: "default-gate-config-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "legacy-audit-config-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "worker-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "rk4-default-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "eih-one-pn-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "background-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "fixture-data-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "certification-claim-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "scientific-gate-release-evidence")?.boundary).toContain(
      "release evidence bundle lock",
    );
    expect(summary.claims.find((claim) => claim.id === "browser-ci-stability-lock")).toEqual(
      expect.objectContaining({
        group: "browser-ci-stability-lock",
        status: "informational",
        source: expect.stringContaining("v94-browser-ci-stability-lock"),
        metric: expect.stringContaining("0/1 stability rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "browser-ci-stability-lock")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "browser-ci-stability-lock-version", value: "v94-browser-ci-stability-lock" }),
        expect.objectContaining({ id: "browser-ci-stability-lock-profile", value: "v94-fresh-browser-ci-runtime-stability" }),
        expect.objectContaining({ id: "browser-ci-stability-lock-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "browser-ci-stability-lock-classification", value: "mixed" }),
        expect.objectContaining({ id: "browser-fresh-command", value: "npm run test:atlas:browser:fresh" }),
        expect.objectContaining({ id: "browser-ci-stability-command", value: "npm run test:atlas:browser-ci-stability" }),
        expect.objectContaining({ id: "fresh-browser-port", value: "3015" }),
        expect.objectContaining({ id: "screenshot-retry-attempts", value: "3" }),
        expect.objectContaining({ id: "pixel-settle-attempts", value: "4" }),
        expect.objectContaining({ id: "watchpack-warning-policy", value: "known-windows-noise-non-failing" }),
        expect.objectContaining({ id: "browser-ci-stability-lock", value: "applied-contract-only" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "worker-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "rk4-default-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "eih-one-pn-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "background-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "fixture-data-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "default-gate-config-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "certification-claim-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "browser-ci-stability-lock")?.boundary).toContain(
      "browser and CI stability lock",
    );
    expect(summary.claims.find((claim) => claim.id === "release-artifact-manifest-lock")).toEqual(
      expect.objectContaining({
        group: "release-artifact-manifest-lock",
        status: "informational",
        source: expect.stringContaining("v95-release-artifact-manifest-lock"),
        metric: expect.stringContaining("0/1 manifest rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "release-artifact-manifest-lock")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "release-artifact-manifest-lock-version", value: "v95-release-artifact-manifest-lock" }),
        expect.objectContaining({ id: "release-artifact-manifest-lock-profile", value: "v95-offline-release-artifact-manifest" }),
        expect.objectContaining({ id: "release-artifact-manifest-lock-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "release-artifact-manifest-lock-classification", value: "mixed" }),
        expect.objectContaining({ id: "release-evidence-command", value: "npm run test:atlas:scientific-gate-release-evidence" }),
        expect.objectContaining({ id: "browser-ci-stability-command", value: "npm run test:atlas:browser-ci-stability" }),
        expect.objectContaining({ id: "v93-screenshot-glob", value: "test-results/v93-scientific-gate-release-evidence-lock/**/*.png" }),
        expect.objectContaining({ id: "v94-screenshot-glob", value: "test-results/v94-browser-ci-stability-lock/**/*.png" }),
        expect.objectContaining({ id: "rollback-interpretation", value: "legacy-v75-rollback-blocker-evidence-only" }),
        expect.objectContaining({ id: "release-artifact-manifest-lock", value: "applied-contract-only" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "worker-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "rk4-default-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "eih-one-pn-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "background-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "fixture-data-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "default-gate-config-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "release-packaging-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "certification-claim-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "release-artifact-manifest-lock")?.boundary).toContain(
      "release artifact manifest lock",
    );
    expect(summary.claims.find((claim) => claim.id === "final-maintenance-baseline")).toEqual(
      expect.objectContaining({
        group: "final-maintenance-baseline",
        status: "informational",
        source: expect.stringContaining("v96-final-maintenance-baseline"),
        metric: expect.stringContaining("0/1 baseline rows complete"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "final-maintenance-baseline")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "final-maintenance-baseline-version", value: "v96-final-maintenance-baseline" }),
        expect.objectContaining({ id: "final-maintenance-baseline-profile", value: "v96-final-offline-maintenance-baseline" }),
        expect.objectContaining({ id: "final-maintenance-baseline-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "final-maintenance-baseline-classification", value: "mixed" }),
        expect.objectContaining({ id: "product-full-command", value: "npm run verify:atlas:full" }),
        expect.objectContaining({ id: "scientific-verify-command", value: "npm run verify:atlas:scientific" }),
        expect.objectContaining({ id: "release-artifact-manifest-command", value: "npm run test:atlas:release-artifact-manifest" }),
        expect.objectContaining({ id: "browser-ci-stability-command", value: "npm run test:atlas:browser-ci-stability" }),
        expect.objectContaining({ id: "final-baseline-policy", value: "post-v96-scientific-mainline-requires-intentional-upgrade" }),
        expect.objectContaining({ id: "final-maintenance-baseline", value: "applied-contract-only" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "worker-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "rk4-default-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "eih-one-pn-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "background-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "material-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "fixture-data-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "default-gate-config-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "release-packaging-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "certification-claim-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "final-maintenance-baseline")?.boundary).toContain(
      "final maintenance baseline",
    );
    expect(summary.claims.find((claim) => claim.id === "gaia-starfield-enhancement")).toEqual(
      expect.objectContaining({
        group: "gaia-starfield-enhancement",
        status: "informational",
        source: expect.stringContaining("v97-gaia-starfield-enhancement"),
        metric: expect.stringContaining("budget 1800"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "gaia-starfield-enhancement")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "gaia-starfield-enhancement-version", value: "v97-gaia-starfield-enhancement" }),
        expect.objectContaining({ id: "gaia-starfield-enhancement-profile", value: "v97-gaia-constellation-nebula-overlay" }),
        expect.objectContaining({ id: "gaia-starfield-enhancement-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "gaia-starfield-enhancement-classification", value: "mixed" }),
        expect.objectContaining({ id: "gaia-overlay-mobile-budget", value: "1000" }),
        expect.objectContaining({ id: "gaia-overlay-balanced-budget", value: "1800" }),
        expect.objectContaining({ id: "gaia-overlay-dense-budget", value: "3000" }),
        expect.objectContaining({ id: "gaia-bright-row-count", value: "5000" }),
        expect.objectContaining({ id: "gaia-kinematics-row-count", value: "2000" }),
        expect.objectContaining({ id: "normalized-iau-constellation-count", value: "88" }),
        expect.objectContaining({ id: "full-gaia-archive-policy", value: "not-full-gaia-archive" }),
        expect.objectContaining({ id: "official-certification-policy", value: "not-gaia-nasa-jpl-certified" }),
        expect.objectContaining({ id: "gaia-starfield-enhancement", value: "applied-overlay-only" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "v9-sky-direction-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "fixture-data-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "gaia-starfield-enhancement")?.boundary).toContain(
      "not the full Gaia archive",
    );
    expect(summary.claims.find((claim) => claim.id === "relativity-simulation-optimization")).toEqual(
      expect.objectContaining({
        group: "relativity-simulation-optimization",
        status: "informational",
        source: expect.stringContaining("v98-relativity-simulation-optimization"),
        metric: expect.stringContaining("kernel eih-1pn+kerr-geodesic-v17"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "relativity-simulation-optimization")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "relativity-simulation-optimization-version", value: "v98-relativity-simulation-optimization" }),
        expect.objectContaining({ id: "relativity-simulation-optimization-profile", value: "v98-relativity-observability-teaching-layer" }),
        expect.objectContaining({ id: "relativity-simulation-optimization-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "relativity-simulation-optimization-classification", value: "mixed" }),
        expect.objectContaining({ id: "observable-atlas-version", value: "v37-relativity-observable-atlas" }),
        expect.objectContaining({ id: "kerr-kernel-id", value: "eih-1pn+kerr-geodesic-v17" }),
        expect.objectContaining({ id: "weak-field-observable-count", value: "4" }),
        expect.objectContaining({ id: "strong-field-readout-count", value: "2" }),
        expect.objectContaining({ id: "numerical-health-metric-count", value: "1" }),
        expect.objectContaining({ id: "performance-hud-policy", value: "optional-collapsed-read-only-main-canvas" }),
        expect.objectContaining({ id: "scientific-model-upgrade-policy", value: "not-scientific-model-upgrade" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "worker-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "eih-one-pn-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "fixture-data-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "relativity-simulation-optimization")?.boundary).toContain(
      "not a scientific model upgrade",
    );
    expect(summary.claims.find((claim) => claim.id === "art-polish")).toEqual(
      expect.objectContaining({
        group: "art-polish",
        status: "informational",
        source: expect.stringContaining("v99-art-polish"),
        metric: expect.stringContaining("opacity mobile 0.62"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "art-polish")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "art-polish-version", value: "v99-art-polish" }),
        expect.objectContaining({ id: "art-polish-profile", value: "v99-gaia-overlay-closeup-presentation-polish" }),
        expect.objectContaining({ id: "art-polish-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "art-polish-classification", value: "mixed" }),
        expect.objectContaining({ id: "gaia-mobile-budget", value: "1000" }),
        expect.objectContaining({ id: "gaia-balanced-budget", value: "1800" }),
        expect.objectContaining({ id: "gaia-dense-budget", value: "3000" }),
        expect.objectContaining({ id: "mobile-opacity-cap", value: "0.62" }),
        expect.objectContaining({ id: "balanced-opacity-cap", value: "1.05" }),
        expect.objectContaining({ id: "dense-opacity-cap", value: "1.2" }),
        expect.objectContaining({ id: "closeup-opacity-cap", value: "0.18" }),
        expect.objectContaining({ id: "official-certification-policy", value: "not-nasa-jpl-gaia-universe-sandbox-certified" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "v9-sky-direction-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "fixture-data-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "art-polish")?.boundary).toContain(
      "v97 Gaia render budgets",
    );
    expect(summary.claims.find((claim) => claim.id === "post-enhancement-maintenance-baseline")).toEqual(
      expect.objectContaining({
        group: "post-enhancement-maintenance-baseline",
        status: "informational",
        source: expect.stringContaining("v100-post-enhancement-maintenance-baseline"),
        metric: expect.stringContaining("Gaia 1000/1800/3000"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "post-enhancement-maintenance-baseline")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "post-enhancement-baseline-version", value: "v100-post-enhancement-maintenance-baseline" }),
        expect.objectContaining({ id: "post-enhancement-baseline-profile", value: "v100-v97-v99-visual-teaching-maintenance-lock" }),
        expect.objectContaining({ id: "post-enhancement-baseline-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "post-enhancement-baseline-classification", value: "mixed" }),
        expect.objectContaining({ id: "final-maintenance-baseline-version", value: "v96-final-maintenance-baseline" }),
        expect.objectContaining({ id: "gaia-enhancement-version", value: "v97-gaia-starfield-enhancement" }),
        expect.objectContaining({ id: "relativity-optimization-version", value: "v98-relativity-simulation-optimization" }),
        expect.objectContaining({ id: "art-polish-version", value: "v99-art-polish" }),
        expect.objectContaining({ id: "gaia-mobile-budget", value: "1000" }),
        expect.objectContaining({ id: "gaia-balanced-budget", value: "1800" }),
        expect.objectContaining({ id: "gaia-dense-budget", value: "3000" }),
        expect.objectContaining({ id: "closeup-opacity-cap", value: "0.18" }),
        expect.objectContaining({ id: "post-enhancement-command", value: "npm run verify:atlas:post-enhancement" }),
        expect.objectContaining({ id: "browser-resource-policy", value: "about-blank-unload-imagebitmap-close-screenshot-retry-3015-teardown-watchpack-noise" }),
        expect.objectContaining({ id: "relativity-teaching-policy", value: "v98-teaching-observability-not-scientific-upgrade" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "v9-sky-direction-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "performance-optimization-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "post-enhancement-maintenance-baseline")?.boundary).toContain(
      "post-enhancement maintenance baseline",
    );
    expect(summary.claims.find((claim) => claim.id === "browser-resource-performance-lock")).toEqual(
      expect.objectContaining({
        group: "browser-resource-performance-lock",
        status: "informational",
        source: expect.stringContaining("v101-browser-resource-performance-lock"),
        metric: expect.stringContaining("shared-imagebitmap-canvas-sampler"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "browser-resource-performance-lock")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "browser-resource-performance-version", value: "v101-browser-resource-performance-lock" }),
        expect.objectContaining({ id: "browser-resource-performance-profile", value: "v101-fresh-browser-resource-performance" }),
        expect.objectContaining({ id: "browser-resource-performance-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "browser-resource-performance-classification", value: "mixed" }),
        expect.objectContaining({ id: "browser-resource-command", value: "npm run verify:atlas:browser-resource" }),
        expect.objectContaining({ id: "browser-fresh-command", value: "npm run test:atlas:browser:fresh" }),
        expect.objectContaining({ id: "pixel-sampler-policy", value: "shared-imagebitmap-canvas-sampler-explicit-close-and-zero" }),
        expect.objectContaining({ id: "fresh-teardown-policy", value: "fresh-3015-global-teardown-no-reuse-existing-server" }),
        expect.objectContaining({ id: "console-error-policy", value: "console-and-page-errors-observed-as-empty-arrays" }),
        expect.objectContaining({ id: "browser-resource-performance", value: "applied-browser-acceptance-helper-resource-optimization" }),
        expect.objectContaining({ id: "runtime-performance-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "v9-sky-direction-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "browser-resource-performance-lock")?.boundary).toContain(
      "browser acceptance helper resource optimization",
    );
    expect(summary.claims.find((claim) => claim.id === "maintenance-evidence-index")).toEqual(
      expect.objectContaining({
        group: "maintenance-evidence-index",
        status: "informational",
        source: expect.stringContaining("v102-maintenance-evidence-index"),
        metric: expect.stringContaining("no-reset-no-revert-no-clean-no-stage-no-commit"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "maintenance-evidence-index")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "maintenance-evidence-index-version", value: "v102-maintenance-evidence-index" }),
        expect.objectContaining({ id: "maintenance-evidence-index-profile", value: "v102-v93-v101-maintenance-evidence-index" }),
        expect.objectContaining({ id: "maintenance-evidence-index-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "maintenance-evidence-index-classification", value: "mixed" }),
        expect.objectContaining({ id: "maintenance-evidence-verify-command", value: "npm run verify:atlas:maintenance-evidence" }),
        expect.objectContaining({ id: "watchpack-noise-policy", value: "dumpstack-pagefile-known-non-failure-noise" }),
        expect.objectContaining({ id: "browser-qa-policy", value: "root-observable-evidence-validation-console-errors-zero-teardown-clear" }),
        expect.objectContaining({ id: "maintenance-evidence-index", value: "applied-maintenance-index-only" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "v9-sky-direction-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "maintenance-evidence-index")?.boundary).toContain(
      "maintenance evidence index",
    );
    expect(summary.claims.find((claim) => claim.id === "presentation-runtime-performance-lock")).toEqual(
      expect.objectContaining({
        group: "presentation-runtime-performance-lock",
        status: "informational",
        source: expect.stringContaining("v103-presentation-runtime-performance-lock"),
        metric: expect.stringContaining("gaia-uniform-write-dedupe-static-instance-attributes"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "presentation-runtime-performance-lock")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "presentation-runtime-performance-version", value: "v103-presentation-runtime-performance-lock" }),
        expect.objectContaining({ id: "presentation-runtime-performance-profile", value: "v103-gaia-constellation-label-runtime-cost" }),
        expect.objectContaining({ id: "presentation-runtime-performance-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "presentation-runtime-performance-classification", value: "mixed" }),
        expect.objectContaining({ id: "presentation-runtime-verify-command", value: "npm run verify:atlas:presentation-runtime" }),
        expect.objectContaining({ id: "gaia-runtime-policy", value: "gaia-uniform-write-dedupe-static-instance-attributes" }),
        expect.objectContaining({ id: "constellation-runtime-policy", value: "constellation-frame-signature-material-write-dedupe" }),
        expect.objectContaining({ id: "label-runtime-policy", value: "label-dom-visible-style-write-dedupe" }),
        expect.objectContaining({ id: "budget-threshold-policy", value: "v97-v99-v75-browser-thresholds-preserved" }),
        expect.objectContaining({ id: "presentation-runtime-performance", value: "applied-presentation-runtime-cost-only" }),
        expect.objectContaining({ id: "browser-acceptance-cost-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "v9-sky-direction-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "presentation-runtime-performance-lock")?.boundary).toContain(
      "presentation runtime performance",
    );
    expect(summary.claims.find((claim) => claim.id === "browser-acceptance-runtime-cost-lock")).toEqual(
      expect.objectContaining({
        group: "browser-acceptance-runtime-cost-lock",
        status: "informational",
        source: expect.stringContaining("v104-browser-acceptance-runtime-cost-lock"),
        metric: expect.stringContaining("default-current-plus-core-full-review-history"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "browser-acceptance-runtime-cost-lock")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "browser-acceptance-runtime-cost-version", value: "v104-browser-acceptance-runtime-cost-lock" }),
        expect.objectContaining({ id: "browser-acceptance-runtime-cost-profile", value: "v104-fresh-browser-acceptance-cost-review" }),
        expect.objectContaining({ id: "browser-acceptance-runtime-cost-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "browser-acceptance-runtime-cost-classification", value: "mixed" }),
        expect.objectContaining({ id: "browser-acceptance-runtime-cost-verify-command", value: "npm run verify:atlas:browser-acceptance-runtime" }),
        expect.objectContaining({ id: "full-review-command", value: "npm run test:atlas:browser:fresh:review" }),
        expect.objectContaining({ id: "marker-coverage-policy", value: "root-observable-evidence-validation-preserved" }),
        expect.objectContaining({ id: "console-error-policy", value: "console-page-error-zero-preserved" }),
        expect.objectContaining({ id: "browser-acceptance-runtime-cost", value: "applied-browser-screenshot-manifest-split" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "v9-sky-direction-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "browser-acceptance-runtime-cost-lock")?.boundary).toContain(
      "browser acceptance runtime cost",
    );
    expect(summary.claims.find((claim) => claim.id === "final-gaia-art-enhancement-lock")).toEqual(
      expect.objectContaining({
        group: "final-gaia-art-enhancement-lock",
        status: "informational",
        source: expect.stringContaining("v105-final-gaia-art-enhancement-lock"),
        metric: expect.stringContaining("deterministic-bright-near-color-spread-sky-binned"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "final-gaia-art-enhancement-lock")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "final-gaia-art-enhancement-version", value: "v105-final-gaia-art-enhancement-lock" }),
        expect.objectContaining({ id: "final-gaia-art-enhancement-profile", value: "v105-budget-preserved-gaia-art-polish" }),
        expect.objectContaining({ id: "final-gaia-art-enhancement-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "final-gaia-art-enhancement-classification", value: "mixed" }),
        expect.objectContaining({ id: "gaia-render-budget", value: "1000/1800/3000" }),
        expect.objectContaining({ id: "opacity-caps", value: "0.62/1.05/1.2/0.18" }),
        expect.objectContaining({ id: "gaia-selection-policy", value: "deterministic-bright-near-color-spread-sky-binned" }),
        expect.objectContaining({ id: "verify-command", value: "npm run verify:atlas:final-gaia-art" }),
        expect.objectContaining({ id: "final-gaia-art-enhancement", value: "applied-budget-preserved-presentation-data-polish" }),
        expect.objectContaining({ id: "live-physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "v9-sky-direction-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "final-gaia-art-enhancement-lock")?.boundary).toContain(
      "budget-preserved Gaia art enhancement",
    );
    expect(summary.claims.find((claim) => claim.id === "release-candidate-evidence-closure-lock")).toEqual(
      expect.objectContaining({
        group: "release-candidate-evidence-closure-lock",
        status: "informational",
        source: expect.stringContaining("v106-release-candidate-evidence-closure-lock"),
        metric: expect.stringContaining("v93-v105-focused-and-verify-commands-indexed"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "release-candidate-evidence-closure-lock")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "rc-evidence-closure-version", value: "v106-release-candidate-evidence-closure-lock" }),
        expect.objectContaining({ id: "rc-evidence-closure-profile", value: "v106-v93-v105-final-rc-evidence-closure" }),
        expect.objectContaining({ id: "rc-evidence-closure-status", value: "pending-runtime-run" }),
        expect.objectContaining({ id: "rc-evidence-closure-classification", value: "mixed" }),
        expect.objectContaining({ id: "command-matrix-policy", value: "v93-v105-focused-and-verify-commands-indexed" }),
        expect.objectContaining({ id: "artifact-index-policy", value: "v93-v105-browser-screenshot-directories-indexed" }),
        expect.objectContaining({ id: "dirty-worktree-policy", value: "no-reset-no-revert-no-clean-no-stage-no-commit" }),
        expect.objectContaining({ id: "watchpack-noise-policy", value: "DumpStack.log.tmp-pagefile.sys-known-non-failure-noise" }),
        expect.objectContaining({ id: "verify-command", value: "npm run verify:atlas:rc-evidence" }),
        expect.objectContaining({ id: "rc-evidence-closure", value: "applied-rc-evidence-closure-only" }),
        expect.objectContaining({ id: "release-archive-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "staging-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "commit-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "budget-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "release-candidate-evidence-closure-lock")?.boundary).toContain(
      "release-candidate evidence closure",
    );
    expect(summary.claims.find((claim) => claim.id === "browser-acceptance-harness")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "harness-version", value: "v38-browser-acceptance-harness" }),
        expect.objectContaining({ id: "test-command", value: "npm run test:atlas:browser" }),
        expect.objectContaining({ id: "full-gate-command", value: "npm run verify:atlas:full" }),
        expect.objectContaining({ id: "runtime-command-status", value: "not claimed in app" }),
        expect.objectContaining({ id: "ci-certification", value: "not claimed" }),
        expect.objectContaining({ id: "online-validation", value: "not claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "browser-acceptance-harness")?.boundary).toContain(
      "does not claim the latest command result",
    );
    expect(summary.claims.find((claim) => claim.id === "accessibility-workbench")).toEqual(
      expect.objectContaining({
        group: "accessibility-workbench",
        status: "informational",
        source: expect.stringContaining("v41-atlas-workbench-accessibility"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "accessibility-workbench")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "standard-target", value: "wcag-2.2-aa-target" }),
        expect.objectContaining({ id: "surface-count", value: "9" }),
        expect.objectContaining({ id: "minimum-target", value: "24px" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-visual-system")).toEqual(
      expect.objectContaining({
        group: "cinematic-visual-system",
        status: "informational",
        source: expect.stringContaining("v42-cinematic-science-workbench"),
        boundary: expect.stringContaining("preserves the v41 AA workbench boundary"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-visual-system")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "visual-version", value: "v42-cinematic-science-workbench" }),
        expect.objectContaining({ id: "visual-target", value: "scientific-instrument-cinematic" }),
        expect.objectContaining({ id: "quality-target", value: "aaa-inspired-local-art-direction" }),
        expect.objectContaining({ id: "aa-boundary", value: "v41-aa-boundary-preserved" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "planetary-visual-fidelity")).toEqual(
      expect.objectContaining({
        group: "planetary-visual-fidelity",
        status: "informational",
        source: expect.stringContaining("v43-planetary-visual-fidelity-pass"),
        boundary: expect.stringContaining("network-prepared local textures"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "planetary-visual-fidelity")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "visual-fidelity-version", value: "v43-planetary-visual-fidelity-pass" }),
        expect.objectContaining({ id: "visual-target", value: "selected-body-closeup-realism" }),
        expect.objectContaining({ id: "style-target", value: "restrained-scientific-instrument" }),
        expect.objectContaining({ id: "asset-policy", value: "network-prepared-local-runtime" }),
        expect.objectContaining({ id: "runtime-assets", value: "local-public-textures-only" }),
        expect.objectContaining({ id: "online-validation", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-lighting")).toEqual(
      expect.objectContaining({
        group: "cinematic-lighting",
        status: "informational",
        source: expect.stringContaining("v44-cinematic-lighting-composition"),
        boundary: expect.stringContaining("developer-prepared local assets"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-lighting")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "lighting-version", value: "v44-cinematic-lighting-composition" }),
        expect.objectContaining({ id: "visual-target", value: "closeup-cinematic-lighting-composition" }),
        expect.objectContaining({ id: "lighting-profile", value: "filmic-closeup-balanced" }),
        expect.objectContaining({ id: "postfx-profile", value: "aces-vignette-restrained-bloom" }),
        expect.objectContaining({ id: "asset-policy", value: "dev-prepared-local-runtime" }),
        expect.objectContaining({ id: "runtime-assets", value: "local-public-textures-only" }),
        expect.objectContaining({ id: "runtime-certification", value: "not-claimed-in-app" }),
        expect.objectContaining({ id: "artistic-certification", value: "not-claimed" }),
        expect.objectContaining({ id: "scientific-certification", value: "not-claimed" }),
        expect.objectContaining({ id: "online-validation", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "chinese-deep-space-fidelity")).toEqual(
      expect.objectContaining({
        group: "chinese-deep-space-fidelity",
        status: "informational",
        source: expect.stringContaining("v45-chinese-deep-space-fidelity"),
        boundary: expect.stringContaining("curated local catalogs"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "chinese-deep-space-fidelity")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "chinese-interface-version", value: "v45-chinese-deep-space-fidelity" }),
        expect.objectContaining({ id: "ui-language", value: "zh-CN" }),
        expect.objectContaining({ id: "localization-mode", value: "zh-cn-primary-scientific-ids-preserved" }),
        expect.objectContaining({ id: "visual-profile", value: "milky-way-constellation-nebula-balanced" }),
        expect.objectContaining({ id: "asset-policy", value: "local-runtime-assets" }),
        expect.objectContaining({ id: "runtime-assets", value: "public-textures-and-curated-local-catalogs" }),
        expect.objectContaining({ id: "online-validation", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-deep-space-camera")).toEqual(
      expect.objectContaining({
        group: "cinematic-deep-space-camera",
        status: "informational",
        source: expect.stringContaining("v46-cinematic-deep-space-camera"),
        boundary: expect.stringContaining("local public textures"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-deep-space-camera")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "camera-version", value: "v46-cinematic-deep-space-camera" }),
        expect.objectContaining({ id: "visual-target", value: "cinematic-deep-space-camera-composition" }),
        expect.objectContaining({ id: "default-camera-profile", value: "overview-atlas" }),
        expect.objectContaining({ id: "closeup-camera-profile", value: "selected-body-cinematic" }),
        expect.objectContaining({ id: "quality-budget", value: "stable-high-fidelity" }),
        expect.objectContaining({ id: "runtime-certification", value: "not-claimed-in-app" }),
        expect.objectContaining({ id: "artistic-certification", value: "not-claimed" }),
        expect.objectContaining({ id: "wcag-certification", value: "not-claimed" }),
        expect.objectContaining({ id: "scientific-certification", value: "not-claimed" }),
        expect.objectContaining({ id: "online-validation", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "universe-sandbox-reference-backdrop")).toEqual(
      expect.objectContaining({
        group: "universe-sandbox-reference-backdrop",
        status: "informational",
        source: expect.stringContaining("v47-universe-sandbox-reference-backdrop"),
        boundary: expect.stringContaining("Universe Sandbox"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "universe-sandbox-reference-backdrop")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "reference-version", value: "v47-universe-sandbox-reference-backdrop" }),
        expect.objectContaining({ id: "reference-mode", value: "inspired-reference-comparison" }),
        expect.objectContaining({ id: "background-art-direction", value: "sparse-stars-layered-milky-way" }),
        expect.objectContaining({ id: "subject-visibility", value: "selected-body-in-frame" }),
        expect.objectContaining({ id: "screenshot-review", value: "local-only" }),
        expect.objectContaining({ id: "universe-sandbox-clone", value: "not-claimed" }),
        expect.objectContaining({ id: "runtime-certification", value: "not-claimed-in-app" }),
        expect.objectContaining({ id: "artistic-certification", value: "not-claimed" }),
        expect.objectContaining({ id: "wcag-certification", value: "not-claimed" }),
        expect.objectContaining({ id: "scientific-certification", value: "not-claimed" }),
        expect.objectContaining({ id: "online-validation", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "reference-grade-space-art")).toEqual(
      expect.objectContaining({
        group: "reference-grade-space-art",
        status: "informational",
        source: expect.stringContaining("v48-reference-grade-space-art"),
        boundary: expect.stringContaining("generated local public sky assets"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "reference-grade-space-art")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "space-art-version", value: "v48-reference-grade-space-art" }),
        expect.objectContaining({ id: "art-direction", value: "cinematic-scientific-space-simulation" }),
        expect.objectContaining({ id: "asset-policy", value: "generated-local-runtime-assets" }),
        expect.objectContaining({ id: "review-mode", value: "local-reference-screenshot-rubric" }),
        expect.objectContaining({ id: "closeup-composite", value: "selected-body-subject-matte" }),
        expect.objectContaining({ id: "closeup-sky-layer", value: "v48-local-closeup-negative-space" }),
        expect.objectContaining({ id: "starfield-profile", value: "closeup-star-noise-suppressed" }),
        expect.objectContaining({ id: "subject-matte", value: "selected-body-background-matte" }),
        expect.objectContaining({ id: "planet-material", value: "closeup-microcontrast-fill" }),
        expect.objectContaining({ id: "runtime-assets", value: "generated-local-public-textures-and-local-catalogs" }),
        expect.objectContaining({ id: "runtime-certification", value: "not-claimed-in-app" }),
        expect.objectContaining({ id: "universe-sandbox-clone", value: "not-claimed" }),
        expect.objectContaining({ id: "artistic-certification", value: "not-claimed" }),
        expect.objectContaining({ id: "wcag-certification", value: "not-claimed" }),
        expect.objectContaining({ id: "scientific-certification", value: "not-claimed" }),
        expect.objectContaining({ id: "online-validation", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "planetary-material-composition")).toEqual(
      expect.objectContaining({
        group: "planetary-material-composition",
        status: "informational",
        source: expect.stringContaining("v49-planetary-material-composition"),
        boundary: expect.stringContaining("local planet texture maps"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "planetary-material-composition")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "planetary-material-version", value: "v49-planetary-material-composition" }),
        expect.objectContaining({ id: "material-target", value: "closeup-body-material-depth" }),
        expect.objectContaining({ id: "asset-policy", value: "dev-refresh-prepared-local-runtime" }),
        expect.objectContaining({ id: "earth-material", value: "earth-cloud-night-depth" }),
        expect.objectContaining({ id: "gas-giant-material", value: "gas-giant-band-depth" }),
        expect.objectContaining({ id: "saturn-material", value: "saturn-ring-material-depth" }),
        expect.objectContaining({ id: "saturn-ring", value: "saturn-cassini-layered-ring" }),
        expect.objectContaining({ id: "solar-material", value: "solar-granulation-depth" }),
        expect.objectContaining({ id: "lunar-mars-material", value: "lunar-mars-relief-depth" }),
        expect.objectContaining({ id: "asset-completeness-certification", value: "not-claimed" }),
        expect.objectContaining({ id: "online-validation", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-closeup-director")).toEqual(
      expect.objectContaining({
        group: "cinematic-closeup-director",
        status: "informational",
        source: expect.stringContaining("v50-cinematic-closeup-director"),
        boundary: expect.stringContaining("close-up composition metadata"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-closeup-director")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "closeup-director-version", value: "v50-cinematic-closeup-director" }),
        expect.objectContaining({ id: "composition-target", value: "aaa-inspired-closeup-subject-composition" }),
        expect.objectContaining({ id: "gas-giant-composition", value: "gas-giant-band-portrait" }),
        expect.objectContaining({ id: "saturn-composition", value: "saturn-ring-showcase" }),
        expect.objectContaining({ id: "saturn-ring-showcase", value: "saturn-wide-tilted-ring-showcase" }),
        expect.objectContaining({ id: "universe-sandbox-clone", value: "not-claimed" }),
        expect.objectContaining({ id: "online-validation", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-key-light-director")).toEqual(
      expect.objectContaining({
        group: "cinematic-key-light-director",
        status: "informational",
        source: expect.stringContaining("v51-cinematic-key-light-director"),
        boundary: expect.stringContaining("key-light and phase metadata"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-key-light-director")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "key-light-director-version", value: "v51-cinematic-key-light-director" }),
        expect.objectContaining({ id: "lighting-target", value: "selected-body-readable-key-light-phase" }),
        expect.objectContaining({ id: "gas-giant-key-light", value: "gas-giant-readable-key-fill" }),
        expect.objectContaining({ id: "saturn-key-light", value: "saturn-ring-key-fill" }),
        expect.objectContaining({ id: "universe-sandbox-clone", value: "not-claimed" }),
        expect.objectContaining({ id: "online-validation", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "planetary-depth-lighting")).toEqual(
      expect.objectContaining({
        group: "planetary-depth-lighting",
        status: "informational",
        source: expect.stringContaining("v52-planetary-depth-lighting"),
        boundary: expect.stringContaining("depth-lighting metadata"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "planetary-depth-lighting")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "planetary-depth-lighting-version", value: "v52-planetary-depth-lighting" }),
        expect.objectContaining({ id: "lighting-target", value: "closeup-atmospheric-terminator-ring-depth" }),
        expect.objectContaining({ id: "gas-giant-depth-lighting", value: "gas-giant-banded-phase-depth" }),
        expect.objectContaining({ id: "saturn-depth-lighting", value: "saturn-ring-shadow-depth" }),
        expect.objectContaining({ id: "ring-shadow-cue", value: "saturn-equatorial-ring-shadow-matte" }),
        expect.objectContaining({ id: "universe-sandbox-clone", value: "not-claimed" }),
        expect.objectContaining({ id: "online-validation", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "planetary-color-grading")).toEqual(
      expect.objectContaining({
        group: "planetary-color-grading",
        status: "informational",
        source: expect.stringContaining("v53-planetary-color-grading"),
        boundary: expect.stringContaining("color-grading and layer-depth metadata"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "planetary-color-grading")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "planetary-color-grading-version", value: "v53-planetary-color-grading" }),
        expect.objectContaining({ id: "color-target", value: "closeup-planet-color-layer-depth" }),
        expect.objectContaining({ id: "gas-giant-color-grade", value: "gas-giant-layer-color-grade" }),
        expect.objectContaining({ id: "saturn-color-grade", value: "saturn-ring-occlusion-color-grade" }),
        expect.objectContaining({ id: "saturn-occlusion-cue", value: "saturn-ring-body-occlusion-tone" }),
        expect.objectContaining({ id: "universe-sandbox-clone", value: "not-claimed" }),
        expect.objectContaining({ id: "online-validation", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "numerical-integrity-gate")).toEqual(
      expect.objectContaining({
        group: "numerical-integrity-gate",
        source: expect.stringContaining("v54-numerical-integrity-gate"),
        boundary: expect.stringContaining("Local numerical-integrity metadata"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "numerical-integrity-gate")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "numerical-integrity-version", value: "v54-numerical-integrity-gate" }),
        expect.objectContaining({ id: "timestep-sensitivity-coverage", value: "covered-by-local-tests-not-runtime-claimed" }),
        expect.objectContaining({ id: "time-reversal-coverage", value: "covered-by-local-tests-not-runtime-claimed" }),
        expect.objectContaining({ id: "unit-audit-coverage", value: "covered-by-local-tests-not-runtime-claimed" }),
        expect.objectContaining({ id: "runtime-benchmark-execution", value: "not-run-in-runtime-ui" }),
        expect.objectContaining({ id: "ci-certification", value: "not-claimed" }),
        expect.objectContaining({ id: "online-validation", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-planetary-art-direction")).toEqual(
      expect.objectContaining({
        group: "cinematic-planetary-art-direction",
        source: expect.stringContaining("v55-cinematic-planetary-art-direction"),
        boundary: expect.stringContaining("Universe Sandbox clone"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-planetary-art-direction")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "cinematic-planetary-art-version", value: "v55-cinematic-planetary-art-direction" }),
        expect.objectContaining({ id: "quality-target", value: "aaa-inspired-scientific-space-simulation" }),
        expect.objectContaining({ id: "asset-policy", value: "dev-refresh-prepared-local-runtime" }),
        expect.objectContaining({ id: "gas-giant-art-profile", value: "gas-giant-band-depth-cinematic" }),
        expect.objectContaining({ id: "saturn-ring-art-profile", value: "saturn-cassini-backlit-ring-art" }),
        expect.objectContaining({ id: "earth-cloud-night-profile", value: "earth-clean-cloud-night-shadow-art" }),
        expect.objectContaining({ id: "solar-surface-profile", value: "solar-granulation-controlled-corona-art" }),
        expect.objectContaining({ id: "global-color-grade-profile", value: "filmic-cool-space-warm-planet-protection" }),
        expect.objectContaining({ id: "universe-sandbox-clone", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-deep-space-backdrop")).toEqual(
      expect.objectContaining({
        group: "cinematic-deep-space-backdrop",
        source: expect.stringContaining("v56-cinematic-deep-space-backdrop"),
        boundary: expect.stringContaining("Universe Sandbox clone"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "cinematic-deep-space-backdrop")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "cinematic-backdrop-version", value: "v56-cinematic-deep-space-backdrop" }),
        expect.objectContaining({ id: "sky-manifest", value: "orbit-atlas-v56" }),
        expect.objectContaining({ id: "source-policy", value: "nasa-svs-prepared-local-runtime" }),
        expect.objectContaining({ id: "negative-space-profile", value: "layered-milky-way-negative-space" }),
        expect.objectContaining({ id: "universe-sandbox-clone", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "sparse-deep-space-director")).toEqual(
      expect.objectContaining({
        group: "sparse-deep-space-director",
        source: expect.stringContaining("v57-sparse-deep-space-director"),
        boundary: expect.stringContaining("Universe Sandbox clone"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "sparse-deep-space-director")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "sparse-deep-space-version", value: "v57-sparse-deep-space-director" }),
        expect.objectContaining({ id: "source-policy", value: "nasa-svs-16k-prepared-local-runtime" }),
        expect.objectContaining({ id: "sky-manifest", value: "orbit-atlas-v57" }),
        expect.objectContaining({ id: "starfield-profile", value: "sparse-primary-stars-ultrafaint-distant-field" }),
        expect.objectContaining({ id: "milky-way-profile", value: "deep-cold-gray-blue-dark-lanes" }),
        expect.objectContaining({ id: "negative-space-profile", value: "overview-wide-negative-space" }),
        expect.objectContaining({ id: "universe-sandbox-clone", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "closeup-presentation-truth")).toEqual(
      expect.objectContaining({
        group: "closeup-presentation-truth",
        source: expect.stringContaining("v58-closeup-presentation-truth"),
        boundary: expect.stringContaining("selected-body sidebar preview"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "closeup-presentation-truth")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "closeup-presentation-version", value: "v58-closeup-presentation-truth" }),
        expect.objectContaining({ id: "preview-sync-target", value: "selected-body-sidebar-preview" }),
        expect.objectContaining({ id: "solar-backdrop-profile", value: "solar-clean-negative-space" }),
        expect.objectContaining({ id: "planet-readability-profile", value: "body-specific-closeup-readable" }),
        expect.objectContaining({ id: "universe-sandbox-clone", value: "not-claimed" }),
        expect.objectContaining({ id: "online-validation", value: "not-claimed" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "closeup-visual-fidelity")).toEqual(
      expect.objectContaining({
        group: "closeup-visual-fidelity",
        status: "informational",
        source: expect.stringContaining("v76-closeup-visual-fidelity-pass"),
        metric: expect.stringContaining("product-ready-scientific-horizons-blocked"),
      }),
    );
    expect(summary.claims.find((claim) => claim.id === "closeup-visual-fidelity")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "closeup-visual-version", value: "v76-closeup-visual-fidelity-pass" }),
        expect.objectContaining({ id: "asset-policy", value: "v76-local-hd-planets-existing-source-audited" }),
        expect.objectContaining({ id: "protected-sky", value: "orbit-atlas-v9" }),
        expect.objectContaining({ id: "full-release-gate", value: "product-ready-scientific-horizons-blocked" }),
        expect.objectContaining({ id: "physics-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "sky-asset-mutation", value: "not-applied" }),
        expect.objectContaining({ id: "kerr-kernel-mutation", value: "not-applied" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "solar-eih-1pn-horizons")?.confidence).toBe("validated");
    expect(summary.claims.find((claim) => claim.id === "gr-weak-field-tests")?.metric).toContain("Mercury");
    expect(summary.claims.find((claim) => claim.id === "galactic-dynamics-validation")?.source).toContain("Gaia DR3");
    expect(summary.claims.find((claim) => claim.id === "frw-planck2018-lcdm")?.source).toContain("Planck 2018");
    expect(summary.claims.find((claim) => claim.id === "kerr-geodesic-lab")?.model).toContain("eih-1pn+kerr-geodesic-v17");

    expect(summary.claims.find((claim) => claim.id === "gaia-dr3-catalog")?.passport.metrics).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "catalog-source", value: "gaia-dr3" })]),
    );
    expect(summary.claims.find((claim) => claim.id === "celestial-catalog-atlas")?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "entry-count" }),
        expect.objectContaining({ id: "quality-checks", value: expect.stringContaining("constellations 88/88") }),
        expect.objectContaining({ id: "object-passport-version", value: "v23-object-passports" }),
        expect.objectContaining({ id: "deep-sky-navigation-version", value: "v33-deep-sky-navigation" }),
        expect.objectContaining({ id: "catalog-expansion-v33", value: "13 local deep-sky entries" }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "celestial-catalog-atlas")?.passport.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "source-chain", body: expect.stringContaining("curated-local-v22") }),
        expect.objectContaining({ id: "limitations", body: expect.stringContaining("SIMBAD") }),
        expect.objectContaining({ id: "limitations", body: expect.stringContaining("VizieR") }),
      ]),
    );
    expect(summary.claims.find((claim) => claim.id === "solar-eih-1pn-horizons")?.passport.metrics).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "rms-position", value: expect.stringContaining("km") })]),
    );
    expect(summary.claims.find((claim) => claim.id === "gr-weak-field-tests")?.passport.formulas).toEqual(
      expect.arrayContaining([expect.objectContaining({ expression: "alpha = 4GM/(c^2 b)" })]),
    );
    expect(summary.claims.find((claim) => claim.id === "galactic-dynamics-validation")?.passport.metrics).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "vc-r0", target: "220-240 km/s" })]),
    );
    expect(summary.claims.find((claim) => claim.id === "frw-planck2018-lcdm")?.passport.formulas).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "hubble-redshift" })]),
    );
  });

  it("keeps pending and failed diagnostics non-crashing evidence entries", () => {
    const diagnostics = createDiagnostics({
      horizonsValidationStatus: "failed",
      galacticValidation: {
        ...PENDING_GALACTIC_VALIDATION,
        status: "failed",
        error: "missing test catalog",
      },
      galacticValidationStatus: "failed",
    });
    const summary = createEvidenceLedgerSummary({
      diagnostics,
      orbitAtlasProfile: "orbit-atlas-v12",
      orbitAtlasRenderer: "cold-body-web-v12",
      gaiaCatalogSource: "placeholder",
    });

    expect(summary.status).toBe("failed");
    expect(summary.failedCount).toBeGreaterThanOrEqual(2);
    expect(summary.claims.find((claim) => claim.id === "galactic-dynamics-validation")?.error).toContain("missing test catalog");
    expect(summary.claims.find((claim) => claim.id === "galactic-dynamics-validation")?.passport.sections).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "limitations", body: expect.stringContaining("N-body") })]),
    );
  });

  it("reflects the current v35 Kerr Studio preset, impact parameter and probe status", () => {
    const diagnostics = createDiagnostics({
      strongFieldValidation: createKerrGeodesicValidationSummary({
        spinA: 0.72,
        impactParameterM: 4.2,
        presetId: "capture-cone",
      }),
    });
    const summary = createEvidenceLedgerSummary({
      diagnostics,
      orbitAtlasProfile: "orbit-atlas-v12",
      orbitAtlasRenderer: "cold-body-web-v12",
      gaiaCatalogSource: "gaia-dr3",
    });
    const kerr = summary.claims.find((claim) => claim.id === "kerr-geodesic-lab");

    expect(kerr?.metric).toContain("capture-cone");
    expect(kerr?.metric).toContain("b=4.20M");
    expect(kerr?.metric).toContain("capture");
    expect(kerr?.metric).toContain("ISCO split");
    expect(kerr?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "preset", value: "capture-cone" }),
        expect.objectContaining({ id: "studio-version", value: "v35-kerr-relativity-studio" }),
        expect.objectContaining({ id: "impact-parameter", value: "4.2M" }),
        expect.objectContaining({ id: "probe-status", value: "capture" }),
        expect.objectContaining({ id: "isco-split" }),
        expect.objectContaining({ id: "studio-hamiltonian-drift" }),
        expect.objectContaining({ id: "studio-boundary", value: "test-particle-null-geodesic-lab" }),
      ]),
    );
    expect(kerr?.passport.sections.find((section) => section.id === "method")?.body).toContain("4M/b");
  });

  it("maps current performance budget into an informational passport", () => {
    const performanceBudgetSummary = createAtlasPerformanceBudgetSummary({
      presentationMode: "orbit-atlas",
      renderBudget: "dense",
      viewportWidth: 390,
      devicePixelRatio: 3,
      showCatalogLabels: true,
      catalogLabelCount: 18,
      showKerrBlackHole: true,
      canvasReady: true,
      skyReady: true,
      coreBodiesReady: true,
    });
    const summary = createEvidenceLedgerSummary({
      diagnostics: null,
      orbitAtlasProfile: "orbit-atlas-v12",
      orbitAtlasRenderer: "cold-body-web-v12",
      gaiaCatalogSource: "placeholder",
      performanceBudgetSummary,
    });
    const claim = summary.claims.find((candidate) => candidate.id === "performance-budget-readiness");

    expect(claim?.status).toBe("informational");
    expect(claim?.metric).toContain("mobile-safe");
    expect(claim?.boundary.toLowerCase()).toContain("not a scientific accuracy score");
    expect(claim?.passport.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "tier", value: "mobile-safe" }),
        expect.objectContaining({ id: "stability", value: "constrained" }),
        expect.objectContaining({ id: "deep-sky-label-budget", value: "6" }),
      ]),
    );
  });

  it("falls back to the first claim when the selected claim id is invalid", () => {
    const summary = createEvidenceLedgerSummary({
      diagnostics: null,
      orbitAtlasProfile: "orbit-atlas-v12",
      orbitAtlasRenderer: "cold-body-web-v12",
      gaiaCatalogSource: "placeholder",
    });

    expect(selectEvidenceClaim(summary, "missing-claim")?.id).toBe(summary.claims[0]?.id);
    expect(selectEvidenceClaim(summary, summary.claims[3]?.id)?.id).toBe(summary.claims[3]?.id);
    expect(selectEvidenceClaim({ ...summary, claims: [] }, "missing-claim")).toBeNull();
  });
});

function createDiagnostics(overrides: Partial<SimulationDiagnostics> = {}): SimulationDiagnostics {
  const horizons = {
    ...PENDING_HORIZONS_VALIDATION_RUN,
    status: "complete" as const,
    progress: 1,
    modes: [
      {
        mode: "1pn" as const,
        checkpoints: [],
        rmsPositionKm: 120_000,
        rmsVelocityMs: 1.5,
      },
    ],
  };
  const light = solarLimbLightDeflectionValidation();
  const cosmologyValidation = createFrwCosmologyValidationSummary();
  const strongFieldValidation = createKerrGeodesicValidationSummary({
    spinA: 0.9,
    impactParameterM: 8,
    presetId: "wide-deflection",
  });
  const galacticValidation = {
    ...PENDING_GALACTIC_VALIDATION,
    status: "ready" as const,
    source: "gaia-dr3-kinematics" as const,
    sampleCount: 2000,
    rotationCurve: [{ radiusKpc: 8.178, circularVelocityKmS: 229 }],
    circularVelocityAtR0KmS: 229,
    escapeSpeedAtR0KmS: 540,
    medianTangentialVelocityKmS: 24,
    medianSpeedKmS: 36,
    weakFieldPhiOverC2: 6e-7,
    weakFieldClockOffsetUsPerDay: 51.8,
  };
  const base: SimulationDiagnostics = {
    simDays: 0,
    energyJ: 1,
    angMomNormKgM2S: 1,
    relEnergyDrift: 1e-6,
    relAngMomDrift: 2e-6,
    energyHistory: [],
    angMomHistory: [],
    mercuryPrecessionArcsecPerCentury: 42.98,
    mercuryPrecessionErrorPercent: 0,
    mercuryPrecessionStatus: "ready",
    horizonsRmsPositionKm: 120_000,
    horizonsRmsVelocityMs: 1.5,
    gaiaCatalogSource: "gaia-dr3",
    researchConfidence: "validated",
    researchValidation: createResearchValidationSummary({
      mercuryArcsecPerCentury: 42.98,
      mercuryStatus: "ready",
      relEnergyDrift: 1e-6,
      relAngMomDrift: 2e-6,
      pnAccelFraction: 3e-8,
    }),
    relativityValidation: {
      mercuryPrecession: {
        sameInitialState: true,
        method: "analytic-1pn-from-osculating-state",
        newtonArcsecPerCentury: 0,
        onePnArcsecPerCentury: 42.98,
        targetArcsecPerCentury: 42.98,
        errorPercent: 0,
        sampledOrbits: 415,
        status: "ready",
      },
      lightDeflection: light,
      shapiroDelay: {
        bodyId: "mercury",
        microseconds: 120,
        formulaMicroseconds: 120,
        errorPercent: 0,
        status: "ready",
      },
      timeDilation: {
        bodyId: "earth",
        ratio: 1,
        slowdownFraction: 1e-8,
        gravitationalPlusKinematicUsPerDay: 864,
        surfaceRedshift: 7e-10,
        status: "ready",
      },
      horizons,
      semantics: {
        presentation: "orbit-atlas-visual-guide",
        dynamics: "live-nbody-eih-1pn-state",
        validation: "offline-gr-targets-and-jpl-horizons",
        kerr: "independent-strong-field-geodesic-lab",
      },
    },
    lightDeflectionErrorPercent: light.errorPercent,
    shapiroDelayErrorPercent: 0,
    timeDilationUsPerDay: 864,
    horizonsValidationStatus: "complete",
    relativityConfidence: "validated",
    galacticValidation,
    galacticValidationStatus: "ready",
    galacticValidationSource: "gaia-dr3-kinematics",
    cosmologyValidation,
    cosmologyValidationStatus: cosmologyValidation.status,
    cosmologyModelSource: cosmologyValidation.source,
    cosmologyConfidence: cosmologyValidation.confidence,
    strongFieldValidation,
    strongFieldValidationStatus: strongFieldValidation.status,
    relativityKernel: strongFieldValidation.relativityKernel,
    gravitationalRedshiftZ: 7e-10,
    conservationWarn: false,
  };

  return {
    ...base,
    ...overrides,
  };
}

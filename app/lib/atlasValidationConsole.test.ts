import { describe, expect, it } from "vitest";
import { createAtlasMissionCapsule, restoreAtlasMissionCapsule } from "./atlasMissionCapsule";
import { createAtlasMissionHubSummary } from "./atlasMissionHub";
import { createAtlasNavigatorSummary } from "./atlasNavigator";
import {
  ATLAS_VALIDATION_CONSOLE_VERSION,
  createAtlasValidationConsoleSummary,
} from "./atlasValidationConsole";
import {
  createAtlasReportStudioSummary,
  createAtlasScientificReportSummary,
} from "./atlasScientificReport";
import { createAtlasWorkflowSummary } from "./atlasWorkflows";
import { createEvidenceLedgerSummary } from "./evidenceLedger";
import type {
  AtlasMissionCapsule,
  AtlasMissionCapsuleRestoreSummary,
  AtlasMissionHubSummary,
  AtlasNavigatorSummary,
  AtlasReportStudioSummary,
  AtlasValidationDomainId,
  AtlasWorkflowSummary,
  EvidenceLedgerSummary,
} from "./simulationDiagnosticsTypes";

const REQUIRED_DOMAINS: readonly AtlasValidationDomainId[] = [
  "evidence-ledger",
  "solar-eih-1pn",
  "gr-weak-field",
  "gaia-catalog",
  "celestial-catalog",
  "galactic-dynamics",
  "frw-cosmology",
  "kerr-lab",
  "relativity-observables",
  "relativity-explainer",
  "relativity-tour",
  "relativity-verification",
  "relativity-charts",
  "physics-benchmark-gate",
  "horizons-gate-audit",
  "physics-gate-split",
  "release-readiness",
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
  "browser-acceptance",
  "accessibility-workbench",
  "visual-system",
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
  "numerical-integrity",
  "cinematic-planetary-art-direction",
  "cinematic-deep-space-backdrop",
  "sparse-deep-space-director",
  "closeup-presentation-truth",
  "closeup-visual-fidelity",
  "performance-budget",
  "mission-capsule",
  "mission-hub",
  "navigator-workflows",
  "report-studio",
  "release-gate",
];

describe("Atlas Validation Console v30", () => {
  it("creates a deterministic status matrix without a trust score", () => {
    const fixture = baseSummaries();
    const first = createConsoleSummary(fixture);
    const second = createConsoleSummary(fixture);

    expect(first.version).toBe(ATLAS_VALIDATION_CONSOLE_VERSION);
    expect(first.domains.map((domain) => domain.id)).toEqual(REQUIRED_DOMAINS);
    expect(first.releaseGate.version).toBe("v36-release-candidate-gate");
    expect(first.domains.find((domain) => domain.id === "release-gate")?.primaryMetric).toBe(
      first.releaseGate.primaryMetric,
    );
    expect(first.domains.find((domain) => domain.id === "relativity-observables")).toEqual(
      expect.objectContaining({
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "relativity-observable-atlas",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "relativity-explainer")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "relativity-observable-explainer",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "relativity-explainer")?.boundary).toContain(
      "not scientific certification",
    );
    expect(first.domains.find((domain) => domain.id === "relativity-tour")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open workflows",
        relatedNavigatorItemId: "panel:atlas-workflows",
        relatedPanelId: "atlas-workflows",
        relatedEvidenceClaimId: "relativity-guided-tour",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "relativity-tour")?.boundary).toContain(
      "not scientific certification",
    );
    expect(first.domains.find((domain) => domain.id === "relativity-verification")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "relativity-verification-readability",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "relativity-verification")?.boundary).toContain(
      "not numerical relativity",
    );
    expect(first.domains.find((domain) => domain.id === "relativity-charts")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "relativity-verification-charts",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "relativity-charts")?.boundary).toContain(
      "presentation-layer visual aids",
    );
    expect(first.domains.find((domain) => domain.id === "physics-benchmark-gate")).toEqual(
      expect.objectContaining({
        status: "pending",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "physics-benchmark-release-gate",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "physics-benchmark-gate")?.boundary).toContain(
      "does not claim the latest CI result",
    );
    expect(first.domains.find((domain) => domain.id === "horizons-gate-audit")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open evidence",
        relatedNavigatorItemId: "evidence-claim:horizons-gate-closure-audit",
        relatedPanelId: "evidence-ledger",
        relatedEvidenceClaimId: "horizons-gate-closure-audit",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "horizons-gate-audit")?.boundary).toContain(
      "not a threshold relaxation",
    );
    expect(first.domains.find((domain) => domain.id === "physics-gate-split")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open evidence",
        relatedNavigatorItemId: "evidence-claim:physics-gate-split",
        relatedPanelId: "evidence-ledger",
        relatedEvidenceClaimId: "physics-gate-split",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "physics-gate-split")?.boundary).toContain(
      "does not relax v75 Horizons thresholds",
    );
    expect(first.domains.find((domain) => domain.id === "release-readiness")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open evidence",
        relatedNavigatorItemId: "evidence-claim:release-readiness-documentation",
        relatedPanelId: "evidence-ledger",
        relatedEvidenceClaimId: "release-readiness-documentation",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "release-readiness")?.boundary).toContain(
      "does not relax Horizons thresholds",
    );
    expect(first.domains.find((domain) => domain.id === "scientific-gate-preflight")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open evidence",
        relatedNavigatorItemId: "evidence-claim:scientific-gate-preflight",
        relatedPanelId: "evidence-ledger",
        relatedEvidenceClaimId: "scientific-gate-preflight",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "scientific-gate-preflight")?.boundary).toContain(
      "does not relax v75 thresholds",
    );
    expect(first.domains.find((domain) => domain.id === "horizons-residual-decomposition")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open evidence",
        relatedNavigatorItemId: "evidence-claim:horizons-residual-decomposition",
        relatedPanelId: "evidence-ledger",
        relatedEvidenceClaimId: "horizons-residual-decomposition",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "horizons-residual-decomposition")?.boundary).toContain(
      "do not prove a root cause",
    );
    expect(first.domains.find((domain) => domain.id === "horizons-candidate-lab")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "horizons-candidate-lab",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "horizons-candidate-lab")?.boundary).toContain(
      "Candidate rows are diagnostics only",
    );
    expect(first.domains.find((domain) => domain.id === "pluto-residual-isolation")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "pluto-residual-isolation",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "pluto-residual-isolation")?.boundary).toContain(
      "diagnostic attribution only",
    );
    expect(first.domains.find((domain) => domain.id === "outer-system-force-model-preflight")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "outer-system-force-model-preflight",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "outer-system-force-model-preflight")?.boundary).toContain(
      "audits fixture provenance",
    );
    expect(first.domains.find((domain) => domain.id === "outer-system-reference-adoption")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "outer-system-reference-adoption",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "outer-system-reference-adoption")?.boundary).toContain(
      "migration readiness only",
    );
    expect(first.domains.find((domain) => domain.id === "horizons-candidate-scientific-gate")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "horizons-candidate-scientific-gate",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "horizons-candidate-scientific-gate")?.boundary).toContain(
      "unapplied candidate",
    );
    expect(first.domains.find((domain) => domain.id === "strict-horizons-migration-dry-run")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "strict-horizons-migration-dry-run",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "strict-horizons-migration-dry-run")?.boundary).toContain(
      "dry-run audit",
    );
    expect(first.domains.find((domain) => domain.id === "strict-horizons-shadow-migration-gate")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "strict-horizons-shadow-migration-gate",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "strict-horizons-shadow-migration-gate")?.boundary).toContain(
      "shadow strict Horizons gate rehearsal",
    );
    expect(first.domains.find((domain) => domain.id === "default-strict-horizons-migration")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "default-strict-horizons-migration",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "default-strict-horizons-migration")?.boundary).toContain(
      "offline strict Horizons scientific gate",
    );
    expect(first.domains.find((domain) => domain.id === "horizons-provenance-freeze")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "horizons-provenance-freeze",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "horizons-provenance-freeze")?.boundary).toContain(
      "fixture hashes",
    );
    expect(first.domains.find((domain) => domain.id === "offline-runtime-boundary-audit")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "offline-runtime-boundary-audit",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "offline-runtime-boundary-audit")?.boundary).toContain(
      "live runtime physics",
    );
    expect(first.domains.find((domain) => domain.id === "scientific-gate-maintenance-runbook")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "scientific-gate-maintenance-runbook",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "scientific-gate-maintenance-runbook")?.boundary).toContain(
      "maintenance runbook",
    );
    expect(first.domains.find((domain) => domain.id === "scientific-gate-release-evidence")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "scientific-gate-release-evidence",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "scientific-gate-release-evidence")?.boundary).toContain(
      "release evidence bundle lock",
    );
    expect(first.domains.find((domain) => domain.id === "browser-ci-stability-lock")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "browser-ci-stability-lock",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "browser-ci-stability-lock")?.boundary).toContain(
      "browser and CI stability lock",
    );
    expect(first.domains.find((domain) => domain.id === "release-artifact-manifest-lock")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "release-artifact-manifest-lock",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "release-artifact-manifest-lock")?.boundary).toContain(
      "release artifact manifest lock",
    );
    expect(first.domains.find((domain) => domain.id === "final-maintenance-baseline")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "final-maintenance-baseline",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "final-maintenance-baseline")?.boundary).toContain(
      "final maintenance baseline",
    );
    expect(first.domains.find((domain) => domain.id === "gaia-starfield-enhancement")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open atlas",
        relatedNavigatorItemId: "panel:relativity-observables",
        relatedPanelId: "relativity-observables",
        relatedEvidenceClaimId: "gaia-starfield-enhancement",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "gaia-starfield-enhancement")?.boundary).toContain(
      "not the full Gaia archive",
    );
    expect(first.domains.find((domain) => domain.id === "browser-acceptance-runtime-cost-lock")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "browser-acceptance-runtime-cost-lock",
        relatedNavigatorItemId: "evidence-claim:browser-acceptance-runtime-cost-lock",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "browser-acceptance-runtime-cost-lock")?.boundary).toContain(
      "browser acceptance runtime cost",
    );
    expect(first.domains.find((domain) => domain.id === "browser-acceptance")).toEqual(
      expect.objectContaining({
        status: "informational",
        actionLabel: "Open evidence",
        relatedNavigatorItemId: "evidence-claim:browser-acceptance-harness",
        relatedPanelId: "evidence-ledger",
        relatedEvidenceClaimId: "browser-acceptance-harness",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "browser-acceptance")?.boundary).toContain(
      "does not claim the latest command result",
    );
    expect(first.domains.find((domain) => domain.id === "accessibility-workbench")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "accessibility-workbench",
        relatedNavigatorItemId: "evidence-claim:accessibility-workbench",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "visual-system")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "cinematic-visual-system",
        relatedNavigatorItemId: "evidence-claim:cinematic-visual-system",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "visual-system")?.boundary).toContain(
      "preserves the v41 AA workbench boundary",
    );
    expect(first.domains.find((domain) => domain.id === "planetary-visual-fidelity")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "planetary-visual-fidelity",
        relatedNavigatorItemId: "evidence-claim:planetary-visual-fidelity",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "planetary-visual-fidelity")?.boundary).toContain(
      "online asset completeness",
    );
    expect(first.domains.find((domain) => domain.id === "cinematic-lighting")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "cinematic-lighting",
        relatedNavigatorItemId: "evidence-claim:cinematic-lighting",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "cinematic-lighting")?.boundary).toContain(
      "AAA certification",
    );
    expect(first.domains.find((domain) => domain.id === "chinese-deep-space-fidelity")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "chinese-deep-space-fidelity",
        relatedNavigatorItemId: "evidence-claim:chinese-deep-space-fidelity",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "chinese-deep-space-fidelity")?.boundary).toContain(
      "online catalog completeness",
    );
    expect(first.domains.find((domain) => domain.id === "cinematic-deep-space-camera")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "cinematic-deep-space-camera",
        relatedNavigatorItemId: "evidence-claim:cinematic-deep-space-camera",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "cinematic-deep-space-camera")?.boundary).toContain(
      "AAA certification",
    );
    expect(first.domains.find((domain) => domain.id === "universe-sandbox-reference-backdrop")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "universe-sandbox-reference-backdrop",
        relatedNavigatorItemId: "evidence-claim:universe-sandbox-reference-backdrop",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "universe-sandbox-reference-backdrop")?.boundary).toContain(
      "Universe Sandbox",
    );
    expect(first.domains.find((domain) => domain.id === "reference-grade-space-art")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "reference-grade-space-art",
        relatedNavigatorItemId: "evidence-claim:reference-grade-space-art",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "reference-grade-space-art")?.boundary).toContain(
      "Universe Sandbox clone",
    );
    expect(first.domains.find((domain) => domain.id === "planetary-material-composition")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "planetary-material-composition",
        relatedNavigatorItemId: "evidence-claim:planetary-material-composition",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "planetary-material-composition")?.boundary).toContain(
      "asset completeness certification",
    );
    expect(first.domains.find((domain) => domain.id === "cinematic-closeup-director")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "cinematic-closeup-director",
        relatedNavigatorItemId: "evidence-claim:cinematic-closeup-director",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "cinematic-closeup-director")?.boundary).toContain(
      "Universe Sandbox clone",
    );
    expect(first.domains.find((domain) => domain.id === "cinematic-key-light-director")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "cinematic-key-light-director",
        relatedNavigatorItemId: "evidence-claim:cinematic-key-light-director",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "cinematic-key-light-director")?.boundary).toContain(
      "key-light",
    );
    expect(first.domains.find((domain) => domain.id === "planetary-depth-lighting")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "planetary-depth-lighting",
        relatedNavigatorItemId: "evidence-claim:planetary-depth-lighting",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "planetary-depth-lighting")?.boundary).toContain(
      "depth-lighting",
    );
    expect(first.domains.find((domain) => domain.id === "planetary-color-grading")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "planetary-color-grading",
        relatedNavigatorItemId: "evidence-claim:planetary-color-grading",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "planetary-color-grading")?.boundary).toContain(
      "color-grading",
    );
    expect(first.domains.find((domain) => domain.id === "numerical-integrity")).toEqual(
      expect.objectContaining({
        relatedEvidenceClaimId: "numerical-integrity-gate",
        relatedNavigatorItemId: "evidence-claim:numerical-integrity-gate",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "numerical-integrity")?.boundary).toContain(
      "numerical-integrity",
    );
    expect(first.domains.find((domain) => domain.id === "cinematic-planetary-art-direction")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "cinematic-planetary-art-direction",
        relatedNavigatorItemId: "evidence-claim:cinematic-planetary-art-direction",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "cinematic-planetary-art-direction")?.boundary).toContain(
      "Universe Sandbox clone",
    );
    expect(first.domains.find((domain) => domain.id === "cinematic-deep-space-backdrop")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "cinematic-deep-space-backdrop",
        relatedNavigatorItemId: "evidence-claim:cinematic-deep-space-backdrop",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "cinematic-deep-space-backdrop")?.boundary).toContain(
      "Universe Sandbox clone",
    );
    expect(first.domains.find((domain) => domain.id === "sparse-deep-space-director")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "sparse-deep-space-director",
        relatedNavigatorItemId: "evidence-claim:sparse-deep-space-director",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "sparse-deep-space-director")?.boundary).toContain(
      "Universe Sandbox clone",
    );
    expect(first.domains.find((domain) => domain.id === "closeup-presentation-truth")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "closeup-presentation-truth",
        relatedNavigatorItemId: "evidence-claim:closeup-presentation-truth",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "closeup-presentation-truth")?.boundary).toContain(
      "selected-body sidebar preview",
    );
    expect(first.domains.find((domain) => domain.id === "closeup-visual-fidelity")).toEqual(
      expect.objectContaining({
        status: "informational",
        relatedEvidenceClaimId: "closeup-visual-fidelity",
        relatedNavigatorItemId: "evidence-claim:closeup-visual-fidelity",
      }),
    );
    expect(first.domains.find((domain) => domain.id === "closeup-visual-fidelity")?.boundary).toContain(
      "strict Horizons scientific certification remains blocked",
    );
    expect(first).toEqual(second);
    expect("trustScore" in first).toBe(false);
    expect(first.readyCount + first.pendingCount + first.failedCount + first.informationalCount).toBe(
      first.domains.length,
    );
    for (const domain of first.domains) {
      expect(domain.title).toBeTruthy();
      expect(domain.source).toBeTruthy();
      expect(domain.model).toBeTruthy();
      expect(domain.primaryMetric).toBeTruthy();
      expect(domain.boundary).toBeTruthy();
      expect(domain.actionLabel).toBeTruthy();
      expect(["ready", "pending", "failed", "informational"]).toContain(domain.status);
    }
  });

  it("maps failed and pending evidence claims into blocker and warning issues", () => {
    const fixture = baseSummaries();
    const claims = fixture.evidenceLedgerSummary.claims.map((claim, index) => {
      if (index === 0) {
        return { ...claim, status: "failed" as const, error: "synthetic failure" };
      }
      if (index === 1) {
        return { ...claim, status: "pending" as const, error: "synthetic pending" };
      }
      return claim;
    });
    const evidenceLedgerSummary: EvidenceLedgerSummary = {
      ...fixture.evidenceLedgerSummary,
      status: "failed",
      failedCount: fixture.evidenceLedgerSummary.failedCount + 1,
      claims,
    };

    const summary = createConsoleSummary({ ...fixture, evidenceLedgerSummary });

    expect(summary.status).toBe("failed");
    expect(summary.blockerCount).toBeGreaterThanOrEqual(1);
    expect(summary.warningCount).toBeGreaterThanOrEqual(1);
    expect(summary.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: `claim:${claims[0]?.id}`,
          severity: "blocker",
          relatedNavigatorItemId: `evidence-claim:${claims[0]?.id}`,
        }),
        expect.objectContaining({
          id: `claim:${claims[1]?.id}`,
          severity: "warning",
          relatedNavigatorItemId: `evidence-claim:${claims[1]?.id}`,
        }),
      ]),
    );
  });

  it("reflects capsule warnings, report studio template, Kerr and core evidence domains", () => {
    const fixture = baseSummaries({
      capsuleWarnings: [
        {
          code: "stale-id",
          field: "selected.evidenceClaimId",
          message: "Evidence claim id is stale.",
        },
      ],
      reportTemplateId: "relativity-lab-brief",
    });
    const evidenceLedgerSummary: EvidenceLedgerSummary = {
      ...fixture.evidenceLedgerSummary,
      claims: fixture.evidenceLedgerSummary.claims.map((claim) =>
        claim.id === "kerr-geodesic-lab"
          ? {
              ...claim,
              status: "ready" as const,
              metric: "preset capture-cone; b=4.20M; probe capture; drift 1e-6",
              error: "Hamiltonian drift within local visual-lab tolerance",
            }
          : claim,
      ),
    };
    const summary = createConsoleSummary({ ...fixture, evidenceLedgerSummary });

    expect(summary.warningCount).toBeGreaterThanOrEqual(1);
    expect(summary.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "capsule:stale-id:selected.evidenceClaimId",
          domainId: "mission-capsule",
          severity: "warning",
        }),
      ]),
    );
    expect(summary.context.reportTemplateId).toBe("relativity-lab-brief");
    expect(summary.domains.find((domain) => domain.id === "report-studio")?.primaryMetric).toContain(
      "relativity-lab-brief",
    );
    expect(summary.domains.find((domain) => domain.id === "kerr-lab")?.primaryMetric).toContain("b=");
    expect(summary.domains.find((domain) => domain.id === "frw-cosmology")?.source).toContain("Planck");
    expect(summary.domains.find((domain) => domain.id === "gaia-catalog")?.source).toContain("Gaia");
    expect(summary.domains.find((domain) => domain.id === "solar-eih-1pn")?.primaryMetric).toBeTruthy();
    expect(summary.domains.find((domain) => domain.id === "release-gate")?.boundary).toContain(
      "does not run tests",
    );
  });

  it("keeps context readable for selected body, catalog, evidence and workflow step", () => {
    const fixture = baseSummaries();
    const summary = createConsoleSummary(fixture, {
      selectedBodyId: "mars",
      selectedCatalogObjectId: "nearby-star:sirius",
      selectedEvidenceClaimId: "frw-planck2018-lcdm",
      selectedWorkflowId: "relativity-lab",
      activeWorkflowStepId: "open-kerr-lab",
    });

    expect(summary.context).toEqual(
      expect.objectContaining({
        selectedBodyId: "mars",
        selectedCatalogObjectId: "nearby-star:sirius",
        selectedEvidenceClaimId: "frw-planck2018-lcdm",
        selectedWorkflowId: "relativity-lab",
        activeWorkflowStepId: "open-kerr-lab",
      }),
    );
  });

  it.each([
    "validation",
    "trust matrix",
    "quality console",
    "readiness",
    "rc gate",
    "release candidate",
    "hardening",
    "browser acceptance",
    "playwright smoke",
    "desktop mobile",
    "regression gate",
    "visual polish",
    "cinematic ui",
    "art direction",
    "universe sandbox",
    "aaa visual",
    "planet closeup",
    "planet realism",
    "earth detail",
    "sun surface",
    "deep space backdrop",
    "sky fidelity",
    "universe background",
    "cinematic lighting",
    "filmic exposure",
    "post fx",
    "color grading",
    "closeup composition",
    "planet lighting",
    "中文界面",
    "中文 UI",
    "星空背景",
    "银河背景",
    "星云",
    "星座",
    "深空美术",
    "deep space fidelity",
    "3A画质",
    "电影级构图",
    "深空镜头",
    "宇宙沙盒质感",
    "背景降噪",
    "目标分离",
    "cinematic camera",
    "deep space camera",
    "宇宙沙盒背景",
    "背景对比",
    "3A背景",
    "星空标杆",
    "银河质感",
    "深空层次",
    "reference backdrop",
    "sandbox reference",
    "sky benchmark",
    "reference grade",
    "space art direction",
    "cinematic composite",
    "3A星体",
    "3A背景",
    "宇宙沙盒对比",
    "气态巨行星",
    "土星环质感",
    "地球夜面",
    "太阳表面",
    "整体调色",
    "planetary art direction",
    "cinematic planet grade",
    "universe sandbox look",
    "宇宙背景",
    "3A宇宙背景",
    "深空背景",
    "银河暗带",
    "背景星噪",
    "NASA星图",
    "星云背景",
    "电影级背景",
    "universe sandbox backdrop",
    "deep-space backdrop",
    "NASA star map",
    "近景一致性",
    "右侧预览",
    "太阳背景修复",
    "行星可读性",
    "closeup preview",
    "solar backdrop fix",
    "planet readability",
  ])(
    "lets Navigator search %s open the Validation Console panel",
    (query) => {
      const { evidenceLedgerSummary } = baseSummaries();
      const navigator = createAtlasNavigatorSummary({
        query,
        evidenceLedgerSummary,
        orbitAnalysisAvailable: true,
        maxResults: 8,
      });

      expect(navigator.results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "panel:validation-console",
            panelId: "validation-console",
            action: "open-panel",
          }),
        ]),
      );
    },
  );
});

function createConsoleSummary(
  fixture: ReturnType<typeof baseSummaries>,
  selected: Partial<Parameters<typeof createAtlasValidationConsoleSummary>[0]> = {},
) {
  return createAtlasValidationConsoleSummary({
    evidenceLedgerSummary: fixture.evidenceLedgerSummary,
    missionHubSummary: fixture.missionHubSummary,
    reportStudioSummary: fixture.reportStudioSummary,
    navigatorSummary: fixture.navigatorSummary,
    workflowSummary: fixture.workflowSummary,
    ...selected,
  });
}

function baseSummaries(options: {
  capsuleWarnings?: readonly AtlasMissionCapsuleRestoreSummary["warnings"][number][];
  reportTemplateId?: "mission-dossier" | "evidence-audit" | "object-brief" | "relativity-lab-brief" | "catalog-provenance";
} = {}): {
  capsule: AtlasMissionCapsule;
  evidenceLedgerSummary: EvidenceLedgerSummary;
  navigatorSummary: AtlasNavigatorSummary;
  workflowSummary: AtlasWorkflowSummary;
  missionHubSummary: AtlasMissionHubSummary;
  reportStudioSummary: AtlasReportStudioSummary;
} {
  const evidenceLedgerSummary = createEvidenceLedgerSummary({
    diagnostics: null,
    orbitAtlasProfile: "orbit-atlas-v12",
    orbitAtlasRenderer: "cold-body-web-v12",
    gaiaCatalogSource: "gaia-dr3",
    orbitAtlasReady: true,
    presentationMode: "orbit-atlas",
  });
  const navigatorSummary = createAtlasNavigatorSummary({
    evidenceLedgerSummary,
    orbitAnalysisAvailable: true,
    maxResults: 2000,
  });
  const workflowSummary = createAtlasWorkflowSummary({ navigatorSummary });
  const capsule = createAtlasMissionCapsule({
    presentationMode: "orbit-atlas",
    scaleMode: "compressed",
    renderBudget: "balanced",
    viewSettings: {
      showConstellationLines: true,
      showDeepSkyObjects: true,
      showCatalogLabels: false,
      showKerrBlackHole: true,
    },
    selectedBodyId: "mars",
    selectedCatalogObjectId: "nearby-star:sirius",
    selectedEvidenceClaimId: "frw-planck2018-lcdm",
    selectedWorkflowId: "relativity-lab",
    activeWorkflowStepId: "open-kerr-lab",
    missionHubStoredState: {
      recentActions: [
        { id: "panel:kerr-relativity-lab", kind: "panel-action", timestamp: 20 },
      ],
      pinnedItems: [
        { id: "evidence-claim:frw-planck2018-lcdm", kind: "evidence-claim", timestamp: 31 },
      ],
    },
    kerrLab: {
      showKerrBlackHole: true,
      spinA: 0.73,
      impactParameterM: 4.2,
      orbitPresetId: "capture-cone",
      renderMode: "both",
      studioMode: "probe",
    },
    createdAt: "2026-06-25T12:00:00.000Z",
  });
  const restoreSummary = restoreAtlasMissionCapsule({
    capsule,
    warnings: options.capsuleWarnings,
    source: options.capsuleWarnings?.length ? "json-import" : "copy-link",
    navigatorSummary,
    workflowSummary,
  });
  const missionHubSummary = createAtlasMissionHubSummary({
    navigatorSummary,
    workflowSummary,
    storedState: capsule.missionHub,
    capsuleRestoreSummary: restoreSummary,
    selectedBodyId: "mars",
    selectedCatalogObjectId: "nearby-star:sirius",
    selectedEvidenceClaimId: "frw-planck2018-lcdm",
    selectedWorkflowId: "relativity-lab",
    activeWorkflowStepId: "open-kerr-lab",
  });
  const reportSummary = createAtlasScientificReportSummary({
    missionCapsule: capsule,
    missionHubSummary,
    evidenceLedgerSummary,
    selectedObjectPassport: null,
    workflowSummary,
    selectedBodyId: "mars",
    selectedEvidenceClaimId: "frw-planck2018-lcdm",
    selectedWorkflowId: "relativity-lab",
    activeWorkflowStepId: "open-kerr-lab",
    kerrLab: capsule.kerrLab,
    createdAt: "2026-06-25T12:30:00.000Z",
  });
  const reportStudioSummary = createAtlasReportStudioSummary({
    reportSummary,
    settings: {
      templateId: options.reportTemplateId ?? "mission-dossier",
      exportFormat: "html",
    },
  });

  return {
    capsule,
    evidenceLedgerSummary,
    navigatorSummary,
    workflowSummary,
    missionHubSummary,
    reportStudioSummary,
  };
}

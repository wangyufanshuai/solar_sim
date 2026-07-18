import type {
  AtlasMissionHubSummary,
  AtlasNavigatorPanelId,
  AtlasNavigatorSummary,
  AtlasReportStudioSummary,
  AtlasValidationConsoleSummary,
  AtlasValidationConsoleVersion,
  AtlasValidationDomain,
  AtlasValidationDomainId,
  AtlasValidationDomainStatus,
  AtlasValidationIssue,
  AtlasValidationIssueSeverity,
  AtlasWorkflowSummary,
  EvidenceClaim,
  EvidenceClaimGroup,
  EvidenceLedgerSummary,
} from "./simulationDiagnosticsTypes";
import {
  createAtlasReleaseGateDomain,
  createAtlasReleaseGateSummary,
} from "./atlasReleaseGate";

export const ATLAS_VALIDATION_CONSOLE_VERSION: AtlasValidationConsoleVersion =
  "v30-validation-console";

type CreateAtlasValidationConsoleSummaryArgs = {
  evidenceLedgerSummary: EvidenceLedgerSummary;
  missionHubSummary: AtlasMissionHubSummary;
  reportStudioSummary: AtlasReportStudioSummary;
  navigatorSummary: AtlasNavigatorSummary;
  workflowSummary: AtlasWorkflowSummary;
  selectedBodyId?: string | null;
  selectedCatalogObjectId?: string | null;
  selectedEvidenceClaimId?: string | null;
  selectedWorkflowId?: string | null;
  activeWorkflowStepId?: string | null;
};

type ClaimDomainConfig = {
  id: AtlasValidationDomainId;
  group: EvidenceClaimGroup;
  title: string;
};

const CLAIM_DOMAINS: readonly ClaimDomainConfig[] = [
  { id: "solar-eih-1pn", group: "solar-eih-1pn", title: "Solar EIH 1PN / JPL" },
  { id: "gr-weak-field", group: "gr-weak-field", title: "GR weak-field tests" },
  { id: "gaia-catalog", group: "gaia-catalog", title: "Gaia catalog" },
  { id: "celestial-catalog", group: "celestial-catalog-atlas", title: "Celestial catalog" },
  { id: "galactic-dynamics", group: "galactic-dynamics", title: "Galactic dynamics" },
  { id: "frw-cosmology", group: "frw-cosmology", title: "FRW cosmology" },
  { id: "kerr-lab", group: "kerr-strong-field", title: "Kerr Studio" },
  { id: "relativity-observables", group: "relativity-observable-atlas", title: "Relativity observables" },
  { id: "relativity-explainer", group: "relativity-observable-explainer", title: "Relativity explainer" },
  { id: "relativity-tour", group: "relativity-guided-tour", title: "Relativity guided tour" },
  { id: "relativity-verification", group: "relativity-verification-readability", title: "Relativity verification readout" },
  { id: "relativity-charts", group: "relativity-verification-charts", title: "Relativity verification charts" },
  { id: "physics-benchmark-gate", group: "physics-benchmark-release-gate", title: "Physics benchmark release gate" },
  { id: "horizons-gate-audit", group: "horizons-gate-closure-audit", title: "Horizons gate closure audit" },
  { id: "physics-gate-split", group: "physics-gate-split", title: "Product/scientific physics gate split" },
  { id: "release-readiness", group: "release-readiness-documentation", title: "Release readiness documentation" },
  { id: "scientific-gate-preflight", group: "scientific-gate-preflight", title: "Scientific Horizons closure preflight" },
  { id: "horizons-residual-decomposition", group: "horizons-residual-decomposition", title: "Horizons RTN residual decomposition" },
  { id: "horizons-candidate-lab", group: "horizons-candidate-lab", title: "Horizons candidate lab" },
  { id: "pluto-residual-isolation", group: "pluto-residual-isolation", title: "Pluto residual isolation" },
  { id: "outer-system-force-model-preflight", group: "outer-system-force-model-preflight", title: "Outer-system force-model preflight" },
  { id: "outer-system-reference-adoption", group: "outer-system-reference-adoption", title: "Outer-system reference adoption" },
  { id: "horizons-candidate-scientific-gate", group: "horizons-candidate-scientific-gate", title: "Horizons candidate scientific gate" },
  { id: "strict-horizons-migration-dry-run", group: "strict-horizons-migration-dry-run", title: "Strict Horizons migration dry-run" },
  { id: "strict-horizons-shadow-migration-gate", group: "strict-horizons-shadow-migration-gate", title: "Strict Horizons shadow migration gate" },
  { id: "default-strict-horizons-migration", group: "default-strict-horizons-migration", title: "Default strict Horizons migration" },
  { id: "horizons-provenance-freeze", group: "horizons-provenance-freeze", title: "Horizons provenance freeze" },
  { id: "offline-runtime-boundary-audit", group: "offline-runtime-boundary-audit", title: "Offline/runtime boundary audit" },
  { id: "scientific-gate-maintenance-runbook", group: "scientific-gate-maintenance-runbook", title: "Scientific gate maintenance runbook" },
  { id: "scientific-gate-release-evidence", group: "scientific-gate-release-evidence", title: "Scientific gate release evidence" },
  { id: "browser-ci-stability-lock", group: "browser-ci-stability-lock", title: "Browser CI stability lock" },
  { id: "release-artifact-manifest-lock", group: "release-artifact-manifest-lock", title: "Release artifact manifest lock" },
  { id: "final-maintenance-baseline", group: "final-maintenance-baseline", title: "Final maintenance baseline" },
  { id: "gaia-starfield-enhancement", group: "gaia-starfield-enhancement", title: "Gaia starfield enhancement" },
  { id: "relativity-simulation-optimization", group: "relativity-simulation-optimization", title: "Relativity simulation optimization" },
  { id: "art-polish", group: "art-polish", title: "Art polish" },
  { id: "post-enhancement-maintenance-baseline", group: "post-enhancement-maintenance-baseline", title: "Post-enhancement maintenance baseline" },
  { id: "browser-resource-performance-lock", group: "browser-resource-performance-lock", title: "Browser resource performance lock" },
  { id: "maintenance-evidence-index", group: "maintenance-evidence-index", title: "Maintenance evidence index" },
  { id: "presentation-runtime-performance-lock", group: "presentation-runtime-performance-lock", title: "Presentation runtime performance lock" },
  { id: "browser-acceptance-runtime-cost-lock", group: "browser-acceptance-runtime-cost-lock", title: "Browser acceptance runtime cost lock" },
  { id: "final-gaia-art-enhancement-lock", group: "final-gaia-art-enhancement-lock", title: "Final Gaia art enhancement lock" },
  { id: "release-candidate-evidence-closure-lock", group: "release-candidate-evidence-closure-lock", title: "Release candidate evidence closure lock" },
  { id: "interaction-catalog-completion-lock", group: "interaction-catalog-completion-lock", title: "Interaction and catalog completion lock" },
  { id: "interaction-repair-launch-ux-lock", group: "interaction-repair-launch-ux-lock", title: "Interaction repair and launch UX lock" },
  { id: "interaction-visual-quality-lock", group: "interaction-visual-quality-lock", title: "Interaction visual quality lock" },
  { id: "critical-ui-relativity-visibility-lock", group: "critical-ui-relativity-visibility-lock", title: "Critical UI and relativity visibility lock" },
  { id: "camera-stellar-closeup-lock", group: "camera-stellar-closeup-lock", title: "Camera and stellar close-up lock" },
  { id: "launch-gameplay-openrocket-bridge-lock", group: "launch-gameplay-openrocket-bridge-lock", title: "Launch gameplay and OpenRocket bridge lock" },
  { id: "scientific-model-upgrade-contract", group: "scientific-model-upgrade-contract", title: "Scientific model upgrade contract" },
  { id: "visual-launch-performance-lock", group: "visual-launch-performance-lock", title: "Visual launch and runtime scene focus lock" },
  { id: "browser-acceptance", group: "browser-acceptance-harness", title: "Browser acceptance" },
  { id: "accessibility-workbench", group: "accessibility-workbench", title: "Accessible workbench" },
  { id: "visual-system", group: "cinematic-visual-system", title: "Cinematic visual system" },
  { id: "planetary-visual-fidelity", group: "planetary-visual-fidelity", title: "Planetary visual fidelity" },
  { id: "cinematic-lighting", group: "cinematic-lighting", title: "Cinematic lighting and post-FX" },
  { id: "chinese-deep-space-fidelity", group: "chinese-deep-space-fidelity", title: "Chinese interface and deep-space fidelity" },
  { id: "cinematic-deep-space-camera", group: "cinematic-deep-space-camera", title: "Cinematic deep-space camera" },
  { id: "universe-sandbox-reference-backdrop", group: "universe-sandbox-reference-backdrop", title: "Universe Sandbox reference backdrop" },
  { id: "reference-grade-space-art", group: "reference-grade-space-art", title: "Reference-grade space art" },
  { id: "planetary-material-composition", group: "planetary-material-composition", title: "Planetary material composition" },
  { id: "cinematic-closeup-director", group: "cinematic-closeup-director", title: "Cinematic close-up director" },
  { id: "cinematic-key-light-director", group: "cinematic-key-light-director", title: "Cinematic key-light director" },
  { id: "planetary-depth-lighting", group: "planetary-depth-lighting", title: "Planetary depth lighting" },
  { id: "planetary-color-grading", group: "planetary-color-grading", title: "Planetary color grading" },
  { id: "numerical-integrity", group: "numerical-integrity-gate", title: "Numerical integrity gate" },
  { id: "cinematic-planetary-art-direction", group: "cinematic-planetary-art-direction", title: "Cinematic planetary art direction" },
  { id: "cinematic-deep-space-backdrop", group: "cinematic-deep-space-backdrop", title: "Cinematic deep-space backdrop" },
  { id: "sparse-deep-space-director", group: "sparse-deep-space-director", title: "Sparse deep-space director" },
  { id: "closeup-presentation-truth", group: "closeup-presentation-truth", title: "Close-up presentation truth" },
  { id: "closeup-visual-fidelity", group: "closeup-visual-fidelity", title: "Close-up visual fidelity" },
  { id: "performance-budget", group: "performance-budget-readiness", title: "Performance budget" },
];

export function createAtlasValidationConsoleSummary({
  evidenceLedgerSummary,
  missionHubSummary,
  reportStudioSummary,
  navigatorSummary,
  workflowSummary,
  selectedBodyId,
  selectedCatalogObjectId,
  selectedEvidenceClaimId,
  selectedWorkflowId,
  activeWorkflowStepId,
}: CreateAtlasValidationConsoleSummaryArgs): AtlasValidationConsoleSummary {
  const baseDomains: AtlasValidationDomain[] = [
    evidenceLedgerDomain(evidenceLedgerSummary),
    ...CLAIM_DOMAINS.map((config) => claimDomain(config, evidenceLedgerSummary)),
    missionCapsuleDomain(missionHubSummary),
    missionHubDomain(missionHubSummary),
    navigatorWorkflowDomain(navigatorSummary, workflowSummary),
    reportStudioDomain(reportStudioSummary),
  ];
  const releaseGate = createAtlasReleaseGateSummary({ validationDomains: baseDomains });
  const domains: AtlasValidationDomain[] = [
    ...baseDomains,
    createAtlasReleaseGateDomain(releaseGate),
  ];
  const issues = createIssues(domains, evidenceLedgerSummary, missionHubSummary, reportStudioSummary);

  const readyCount = domains.filter((domain) => domain.status === "ready").length;
  const pendingCount = domains.filter((domain) => domain.status === "pending").length;
  const failedCount = domains.filter((domain) => domain.status === "failed").length;
  const informationalCount = domains.filter((domain) => domain.status === "informational").length;
  const blockerCount = issues.filter((issue) => issue.severity === "blocker").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const infoCount = issues.filter((issue) => issue.severity === "info").length;

  return {
    version: ATLAS_VALIDATION_CONSOLE_VERSION,
    releaseGate,
    status: consoleStatus(domains),
    readyCount,
    pendingCount,
    failedCount,
    informationalCount,
    blockerCount,
    warningCount,
    infoCount,
    selectedDefaultDomainId: domains[0]?.id ?? "evidence-ledger",
    domains,
    issues,
    context: {
      selectedBodyId: selectedBodyId ?? "",
      selectedCatalogObjectId: selectedCatalogObjectId ?? "",
      selectedEvidenceClaimId: selectedEvidenceClaimId ?? "",
      selectedWorkflowId: selectedWorkflowId ?? "",
      activeWorkflowStepId: activeWorkflowStepId ?? "",
      missionHubCurrentId: missionHubSummary.current.currentId,
      reportTemplateId: reportStudioSummary.settings.templateId,
      reportIncludedSectionCount: reportStudioSummary.includedSectionCount,
    },
  };
}

function evidenceLedgerDomain(summary: EvidenceLedgerSummary): AtlasValidationDomain {
  return {
    id: "evidence-ledger",
    title: "Evidence Ledger",
    status: summary.status,
    source: summary.version,
    model: "Claim passports grouped by validation layer",
    primaryMetric: `${summary.claimCount} claims; ${summary.readyCount} ready; ${summary.failedCount} failed`,
    boundary: "Read-only provenance matrix over existing claims; not a new validation run.",
    actionLabel: "Open ledger",
    relatedNavigatorItemId: "panel:evidence-ledger",
    relatedPanelId: "evidence-ledger",
  };
}

function claimDomain(
  config: ClaimDomainConfig,
  summary: EvidenceLedgerSummary,
): AtlasValidationDomain {
  const claims = summary.claims.filter((claim) => claim.group === config.group);
  const primary = claims[0];
  const opensObservableAtlas =
    (
      config.id === "relativity-observables" ||
      config.id === "relativity-explainer" ||
      config.id === "relativity-verification" ||
      config.id === "relativity-charts" ||
      config.id === "physics-benchmark-gate" ||
      config.id === "horizons-candidate-lab" ||
      config.id === "pluto-residual-isolation" ||
      config.id === "outer-system-force-model-preflight" ||
      config.id === "outer-system-reference-adoption" ||
      config.id === "horizons-candidate-scientific-gate" ||
      config.id === "strict-horizons-migration-dry-run" ||
      config.id === "strict-horizons-shadow-migration-gate" ||
      config.id === "default-strict-horizons-migration" ||
      config.id === "horizons-provenance-freeze" ||
      config.id === "offline-runtime-boundary-audit" ||
      config.id === "scientific-gate-maintenance-runbook" ||
      config.id === "scientific-gate-release-evidence" ||
      config.id === "browser-ci-stability-lock" ||
      config.id === "release-artifact-manifest-lock" ||
      config.id === "final-maintenance-baseline" ||
      config.id === "gaia-starfield-enhancement" ||
      config.id === "relativity-simulation-optimization" ||
      config.id === "art-polish"
    ) &&
    Boolean(primary);
  const opensWorkflows = config.id === "relativity-tour" && Boolean(primary);
  return {
    id: config.id,
    title: config.title,
    status: groupedStatus(claims),
    source: primary?.source ?? "Evidence Ledger claim pending",
    model: primary?.model ?? "No local claim available",
    primaryMetric: primary?.metric ?? "No claim metric available",
    boundary: primary?.boundary ?? "No trusted boundary available.",
    actionLabel: opensObservableAtlas
      ? "Open atlas"
      : opensWorkflows
        ? "Open workflows"
        : primary
          ? "Open evidence"
          : "Open ledger",
    relatedNavigatorItemId: opensObservableAtlas
      ? "panel:relativity-observables"
      : opensWorkflows
        ? "panel:atlas-workflows"
        : primary
          ? `evidence-claim:${primary.id}`
          : "panel:evidence-ledger",
    relatedPanelId: opensObservableAtlas
      ? "relativity-observables"
      : opensWorkflows
        ? "atlas-workflows"
        : "evidence-ledger",
    relatedEvidenceClaimId: primary?.id,
  };
}

function missionCapsuleDomain(summary: AtlasMissionHubSummary): AtlasValidationDomain {
  const restore = summary.capsuleRestoreSummary;
  const active = restore?.active ?? false;
  const warningCount = restore?.warningCount ?? 0;
  return {
    id: "mission-capsule",
    title: "Mission Capsule",
    status: active ? (warningCount > 0 ? "pending" : "ready") : "informational",
    source: "Mission Capsule v27 restore summary",
    model: "Local URL hash / JSON UI-session reproducibility",
    primaryMetric: active
      ? `restored ${restore?.restoredCount ?? 0}; warnings ${warningCount}`
      : "No active capsule restore in this session",
    boundary: "UI/session provenance only; no physics buffers, ephemeris arrays, or telemetry samples.",
    actionLabel: "Open hub",
    relatedNavigatorItemId: "panel:mission-hub",
    relatedPanelId: "mission-hub",
  };
}

function missionHubDomain(summary: AtlasMissionHubSummary): AtlasValidationDomain {
  return {
    id: "mission-hub",
    title: "Mission Hub",
    status: summary.current.currentKind ? "ready" : "informational",
    source: summary.version,
    model: "Current context, recents, pins and recommended local actions",
    primaryMetric: `${summary.current.currentKind || "idle"}; recents ${summary.recentCount}; pins ${summary.pinnedCount}`,
    boundary: "Local browser session memory only; no account, sync, or telemetry analytics.",
    actionLabel: "Open hub",
    relatedNavigatorItemId: "panel:mission-hub",
    relatedPanelId: "mission-hub",
  };
}

function navigatorWorkflowDomain(
  navigatorSummary: AtlasNavigatorSummary,
  workflowSummary: AtlasWorkflowSummary,
): AtlasValidationDomain {
  const status: AtlasValidationDomainStatus =
    navigatorSummary.itemCount > 0 && workflowSummary.workflowCount > 0
      ? workflowSummary.blockedStepCount > 0
        ? "pending"
        : "ready"
      : "failed";
  return {
    id: "navigator-workflows",
    title: "Navigator / Workflows",
    status,
    source: `${navigatorSummary.version} / ${workflowSummary.version}`,
    model: "Local command index and guided scientific mission paths",
    primaryMetric: `${navigatorSummary.itemCount} navigator items; ${workflowSummary.workflowCount} workflows; ${workflowSummary.blockedStepCount} blocked steps`,
    boundary: "Guidance and panel routing only; no online search or new science model.",
    actionLabel: "Open workflows",
    relatedNavigatorItemId: "panel:atlas-workflows",
    relatedPanelId: "atlas-workflows",
  };
}

function reportStudioDomain(summary: AtlasReportStudioSummary): AtlasValidationDomain {
  const hasTrustedBoundary = summary.includedSectionIds.includes("trusted-boundaries");
  const status: AtlasValidationDomainStatus =
    summary.includedSectionCount > 0 && hasTrustedBoundary ? "ready" : "pending";
  return {
    id: "report-studio",
    title: "Report Studio",
    status,
    source: `${summary.version} / ${summary.reportVersion}`,
    model: "Template-controlled Markdown / JSON / printable HTML evidence dossier",
    primaryMetric: `${summary.settings.templateId}; sections ${summary.includedSectionCount}/${summary.totalSectionCount}; export ${summary.settings.exportFormat}`,
    boundary: "Local UI/session evidence dossier; not PDF generation or publication archive.",
    actionLabel: "Open studio",
    relatedNavigatorItemId: "panel:scientific-report",
    relatedPanelId: "scientific-report",
    relatedEvidenceClaimId: "scientific-report-dossier",
  };
}

function createIssues(
  domains: readonly AtlasValidationDomain[],
  evidenceLedgerSummary: EvidenceLedgerSummary,
  missionHubSummary: AtlasMissionHubSummary,
  reportStudioSummary: AtlasReportStudioSummary,
): readonly AtlasValidationIssue[] {
  const issues: AtlasValidationIssue[] = [];

  for (const claim of evidenceLedgerSummary.claims) {
    if (claim.status !== "failed" && claim.status !== "pending") continue;
    const domainId = domainIdForClaimGroup(claim.group);
    issues.push({
      id: `claim:${claim.id}`,
      severity: claim.status === "failed" ? "blocker" : "warning",
      domainId,
      title: claim.title,
      message: `${claim.status}: ${claim.error}`,
      source: claim.source,
      actionLabel: "Open evidence",
      relatedNavigatorItemId: `evidence-claim:${claim.id}`,
      relatedPanelId: "evidence-ledger",
      relatedEvidenceClaimId: claim.id,
    });
  }

  for (const warning of missionHubSummary.capsuleRestoreSummary?.warnings ?? []) {
    issues.push({
      id: `capsule:${warning.code}:${warning.field ?? "payload"}`,
      severity: "warning",
      domainId: "mission-capsule",
      title: "Mission Capsule warning",
      message: warning.message,
      source: warning.field ?? warning.code,
      actionLabel: "Open hub",
      relatedNavigatorItemId: "panel:mission-hub",
      relatedPanelId: "mission-hub",
    });
  }

  if (!reportStudioSummary.includedSectionIds.includes("trusted-boundaries")) {
    issues.push({
      id: "report-studio:trusted-boundaries",
      severity: "warning",
      domainId: "report-studio",
      title: "Trusted boundaries omitted",
      message: "Report Studio should retain trusted-boundaries in exported dossiers.",
      source: reportStudioSummary.version,
      actionLabel: "Open studio",
      relatedNavigatorItemId: "panel:scientific-report",
      relatedPanelId: "scientific-report",
    });
  }

  if (issues.length === 0) {
    const informational = domains.find((domain) => domain.status === "informational");
    if (informational) {
      issues.push({
        id: `info:${informational.id}`,
        severity: "info",
        domainId: informational.id,
        title: `${informational.title} is informational`,
        message: informational.primaryMetric,
        source: informational.source,
        actionLabel: informational.actionLabel,
        relatedNavigatorItemId: informational.relatedNavigatorItemId,
        relatedPanelId: informational.relatedPanelId,
        relatedEvidenceClaimId: informational.relatedEvidenceClaimId,
      });
    }
  }

  return issues;
}

function groupedStatus(claims: readonly EvidenceClaim[]): AtlasValidationDomainStatus {
  if (claims.some((claim) => claim.status === "failed")) return "failed";
  if (claims.some((claim) => claim.status === "pending")) return "pending";
  if (claims.some((claim) => claim.status === "ready")) return "ready";
  return "informational";
}

function consoleStatus(
  domains: readonly AtlasValidationDomain[],
): AtlasValidationDomainStatus {
  if (domains.some((domain) => domain.status === "failed")) return "failed";
  if (domains.some((domain) => domain.status === "pending")) return "pending";
  if (domains.some((domain) => domain.status === "ready")) return "ready";
  return "informational";
}

function domainIdForClaimGroup(group: EvidenceClaimGroup): AtlasValidationDomainId {
  switch (group) {
    case "solar-eih-1pn":
      return "solar-eih-1pn";
    case "gr-weak-field":
      return "gr-weak-field";
    case "gaia-catalog":
      return "gaia-catalog";
    case "celestial-catalog-atlas":
      return "celestial-catalog";
    case "galactic-dynamics":
      return "galactic-dynamics";
    case "frw-cosmology":
      return "frw-cosmology";
    case "kerr-strong-field":
      return "kerr-lab";
    case "relativity-observable-atlas":
      return "relativity-observables";
    case "relativity-observable-explainer":
      return "relativity-explainer";
    case "relativity-guided-tour":
      return "relativity-tour";
    case "relativity-verification-readability":
      return "relativity-verification";
    case "relativity-verification-charts":
      return "relativity-charts";
    case "physics-benchmark-release-gate":
      return "physics-benchmark-gate";
    case "horizons-gate-closure-audit":
      return "horizons-gate-audit";
    case "physics-gate-split":
      return "physics-gate-split";
    case "release-readiness-documentation":
      return "release-readiness";
    case "scientific-gate-preflight":
      return "scientific-gate-preflight";
    case "horizons-residual-decomposition":
      return "horizons-residual-decomposition";
    case "horizons-candidate-lab":
      return "horizons-candidate-lab";
    case "pluto-residual-isolation":
      return "pluto-residual-isolation";
    case "outer-system-force-model-preflight":
      return "outer-system-force-model-preflight";
    case "outer-system-reference-adoption":
      return "outer-system-reference-adoption";
    case "horizons-candidate-scientific-gate":
      return "horizons-candidate-scientific-gate";
    case "strict-horizons-migration-dry-run":
      return "strict-horizons-migration-dry-run";
    case "strict-horizons-shadow-migration-gate":
      return "strict-horizons-shadow-migration-gate";
    case "default-strict-horizons-migration":
      return "default-strict-horizons-migration";
    case "horizons-provenance-freeze":
      return "horizons-provenance-freeze";
    case "offline-runtime-boundary-audit":
      return "offline-runtime-boundary-audit";
    case "scientific-gate-maintenance-runbook":
      return "scientific-gate-maintenance-runbook";
    case "scientific-gate-release-evidence":
      return "scientific-gate-release-evidence";
    case "browser-ci-stability-lock":
      return "browser-ci-stability-lock";
    case "release-artifact-manifest-lock":
      return "release-artifact-manifest-lock";
    case "final-maintenance-baseline":
      return "final-maintenance-baseline";
    case "gaia-starfield-enhancement":
      return "gaia-starfield-enhancement";
    case "relativity-simulation-optimization":
      return "relativity-simulation-optimization";
    case "art-polish":
      return "art-polish";
    case "browser-resource-performance-lock":
      return "browser-resource-performance-lock";
    case "maintenance-evidence-index":
      return "maintenance-evidence-index";
    case "presentation-runtime-performance-lock":
      return "presentation-runtime-performance-lock";
    case "browser-acceptance-runtime-cost-lock":
      return "browser-acceptance-runtime-cost-lock";
    case "final-gaia-art-enhancement-lock":
      return "final-gaia-art-enhancement-lock";
    case "release-candidate-evidence-closure-lock":
      return "release-candidate-evidence-closure-lock";
    case "interaction-catalog-completion-lock":
      return "interaction-catalog-completion-lock";
    case "interaction-repair-launch-ux-lock":
      return "interaction-repair-launch-ux-lock";
    case "interaction-visual-quality-lock":
      return "interaction-visual-quality-lock";
    case "critical-ui-relativity-visibility-lock":
      return "critical-ui-relativity-visibility-lock";
    case "camera-stellar-closeup-lock":
      return "camera-stellar-closeup-lock";
    case "launch-gameplay-openrocket-bridge-lock":
      return "launch-gameplay-openrocket-bridge-lock";
    case "scientific-model-upgrade-contract":
      return "scientific-model-upgrade-contract";
    case "visual-launch-performance-lock":
      return "visual-launch-performance-lock";
    case "browser-acceptance-harness":
      return "browser-acceptance";
    case "accessibility-workbench":
      return "accessibility-workbench";
    case "cinematic-visual-system":
      return "visual-system";
    case "planetary-visual-fidelity":
      return "planetary-visual-fidelity";
    case "cinematic-lighting":
      return "cinematic-lighting";
    case "chinese-deep-space-fidelity":
      return "chinese-deep-space-fidelity";
    case "cinematic-deep-space-camera":
      return "cinematic-deep-space-camera";
    case "universe-sandbox-reference-backdrop":
      return "universe-sandbox-reference-backdrop";
    case "reference-grade-space-art":
      return "reference-grade-space-art";
    case "planetary-material-composition":
      return "planetary-material-composition";
    case "cinematic-closeup-director":
      return "cinematic-closeup-director";
    case "cinematic-key-light-director":
      return "cinematic-key-light-director";
    case "planetary-depth-lighting":
      return "planetary-depth-lighting";
    case "planetary-color-grading":
      return "planetary-color-grading";
    case "numerical-integrity-gate":
      return "numerical-integrity";
    case "cinematic-planetary-art-direction":
      return "cinematic-planetary-art-direction";
    case "cinematic-deep-space-backdrop":
      return "cinematic-deep-space-backdrop";
    case "sparse-deep-space-director":
      return "sparse-deep-space-director";
    case "closeup-presentation-truth":
      return "closeup-presentation-truth";
    case "closeup-visual-fidelity":
      return "closeup-visual-fidelity";
    case "mission-capsule-reproducibility":
      return "mission-capsule";
    case "scientific-report-dossier":
      return "report-studio";
    case "performance-budget-readiness":
      return "performance-budget";
    case "release-candidate-gate":
      return "release-gate";
    case "validation-console-readiness":
    case "observatory-deck-workbench":
      return "evidence-ledger";
    case "orbit-visual-layer":
    default:
      return "evidence-ledger";
  }
}

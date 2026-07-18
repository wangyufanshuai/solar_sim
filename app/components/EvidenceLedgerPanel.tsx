"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Database,
  Info,
  ScrollText,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type MutableRefObject } from "react";
import { useAtlasWorkbenchSurfaceAccessibility } from "./AtlasInstrumentUi";
import type { GaiaCatalogSource } from "../data/gaiaStarCatalog";
import {
  createEvidenceLedgerSummary,
  selectEvidenceClaim,
  type CreateEvidenceLedgerSummaryArgs,
} from "../lib/evidenceLedger";
import type {
  EvidenceClaim,
  EvidenceClaimGroup,
  EvidenceClaimStatus,
  EvidenceLedgerSummary,
  EvidenceRelatedView,
  SimulationDiagnostics,
} from "../lib/simulationDiagnosticsTypes";
import ScientificEvidenceGateStrip from "./ScientificEvidenceGateStrip";

type EvidenceLedgerPanelProps = Omit<CreateEvidenceLedgerSummaryArgs, "diagnostics"> & {
  open: boolean;
  onClose: () => void;
  initialSelectedClaimId?: string;
  simulationDiagnosticsRef: MutableRefObject<SimulationDiagnostics | null>;
  gaiaCatalogSource: GaiaCatalogSource;
};

const GROUP_LABELS: Record<EvidenceClaimGroup, string> = {
  "orbit-visual-layer": "Orbit visual layer",
  "mission-capsule-reproducibility": "Mission Capsule",
  "scientific-report-dossier": "Report Studio",
  "validation-console-readiness": "Validation Console",
  "observatory-deck-workbench": "Observatory Deck",
  "performance-budget-readiness": "Performance Budget",
  "release-candidate-gate": "Release Candidate Gate",
  "relativity-observable-atlas": "Relativity Observable Atlas",
  "relativity-observable-explainer": "Relativity Observable Explainer",
  "relativity-guided-tour": "Relativity Guided Tour",
  "relativity-verification-readability": "Relativity Verification Readout",
  "relativity-verification-charts": "Relativity Verification Charts",
  "physics-benchmark-release-gate": "Physics Benchmark Release Gate",
  "horizons-gate-closure-audit": "Horizons Gate Closure Audit",
  "physics-gate-split": "Product / Scientific Physics Gate Split",
  "release-readiness-documentation": "Release Readiness Documentation",
  "scientific-gate-preflight": "Scientific Gate Preflight",
  "horizons-residual-decomposition": "Horizons RTN Residual Decomposition",
  "horizons-candidate-lab": "Horizons Candidate Lab",
  "pluto-residual-isolation": "Pluto Residual Isolation",
  "outer-system-force-model-preflight": "Outer-System Force Model Preflight",
  "outer-system-reference-adoption": "Outer-System Reference Adoption",
  "horizons-candidate-scientific-gate": "Horizons Candidate Scientific Gate",
  "strict-horizons-migration-dry-run": "Strict Horizons Migration Dry-Run",
  "strict-horizons-shadow-migration-gate": "Strict Horizons Shadow Migration Gate",
  "default-strict-horizons-migration": "Default Strict Horizons Migration",
  "horizons-provenance-freeze": "Horizons Provenance Freeze",
  "offline-runtime-boundary-audit": "Offline Runtime Boundary Audit",
  "scientific-gate-maintenance-runbook": "Scientific Gate Runbook",
  "scientific-gate-release-evidence": "Scientific Gate Release Evidence",
  "browser-ci-stability-lock": "Browser CI Stability Lock",
  "release-artifact-manifest-lock": "Release Artifact Manifest Lock",
  "final-maintenance-baseline": "Final Maintenance Baseline",
  "gaia-starfield-enhancement": "Gaia Starfield Enhancement",
  "relativity-simulation-optimization": "Relativity Simulation Optimization",
  "art-polish": "Art Polish",
  "post-enhancement-maintenance-baseline": "Post-Enhancement Maintenance Baseline",
  "browser-resource-performance-lock": "Browser Resource Performance Lock",
  "maintenance-evidence-index": "Maintenance Evidence Index",
  "presentation-runtime-performance-lock": "Presentation Runtime Performance Lock",
  "browser-acceptance-runtime-cost-lock": "Browser Acceptance Runtime Cost Lock",
  "final-gaia-art-enhancement-lock": "Final Gaia Art Enhancement Lock",
  "release-candidate-evidence-closure-lock": "Release Candidate Evidence Closure Lock",
  "interaction-catalog-completion-lock": "Interaction & Catalog Completion Lock",
  "interaction-repair-launch-ux-lock": "Interaction Repair & Launch UX Upgrade Lock",
  "interaction-visual-quality-lock": "Interaction Visual Quality Lock",
  "critical-ui-relativity-visibility-lock": "Critical UI & Relativity Visibility Lock",
  "camera-stellar-closeup-lock": "Camera & Stellar Close-up Lock",
  "launch-gameplay-openrocket-bridge-lock": "Launch Gameplay & OpenRocket Bridge Lock",
  "scientific-model-upgrade-contract": "Scientific Model Upgrade Contract",
  "visual-launch-performance-lock": "Visual Launch Performance Lock",
  "browser-acceptance-harness": "Browser Acceptance Harness",
  "accessibility-workbench": "Accessible Atlas Workbench",
  "cinematic-visual-system": "Cinematic Visual System",
  "planetary-visual-fidelity": "Planetary Visual Fidelity",
  "cinematic-lighting": "Cinematic Lighting",
  "chinese-deep-space-fidelity": "Chinese interface and deep-space fidelity",
  "cinematic-deep-space-camera": "Cinematic deep-space camera",
  "universe-sandbox-reference-backdrop": "Universe Sandbox reference backdrop",
  "reference-grade-space-art": "Reference-grade space art",
  "planetary-material-composition": "Planetary material composition",
  "cinematic-closeup-director": "Cinematic close-up director",
  "cinematic-key-light-director": "Cinematic key-light director",
  "planetary-depth-lighting": "Planetary depth lighting",
  "planetary-color-grading": "Planetary color grading",
  "numerical-integrity-gate": "Numerical integrity gate",
  "cinematic-planetary-art-direction": "Cinematic planetary art direction",
  "cinematic-deep-space-backdrop": "Cinematic deep-space backdrop",
  "sparse-deep-space-director": "Sparse deep-space director",
  "closeup-presentation-truth": "Close-up presentation truth",
  "closeup-visual-fidelity": "Close-up visual fidelity",
  "solar-eih-1pn": "Solar EIH 1PN / JPL Horizons",
  "gr-weak-field": "GR weak-field tests",
  "gaia-catalog": "Gaia DR3 catalog",
  "celestial-catalog-atlas": "Celestial Catalog Atlas",
  "galactic-dynamics": "Galactic dynamics",
  "frw-cosmology": "FRW Planck 2018",
  "kerr-strong-field": "Kerr Relativity Studio",
};

const STATUS_CLASS: Record<EvidenceClaimStatus, string> = {
  ready: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  pending: "border-sky-300/25 bg-sky-300/10 text-sky-100",
  failed: "border-rose-300/35 bg-rose-300/10 text-rose-100",
  informational: "border-white/14 bg-white/[0.045] text-white/65",
};

const RELATED_VIEW_LABELS: Record<EvidenceRelatedView, string> = {
  "orbit-analysis": "Orbit Analysis",
  telemetry: "Telemetry",
  "body-sidebar": "Body sidebar",
  "kerr-lab": "Kerr Studio",
  "atlas-workflows": "Atlas Workflows",
  "relativity-observables": "Relativity Observable Atlas",
  "evidence-ledger": "Evidence Ledger",
};

export default function EvidenceLedgerPanel({
  open,
  onClose,
  initialSelectedClaimId = "",
  simulationDiagnosticsRef,
  orbitAtlasProfile,
  orbitAtlasRenderer,
  gaiaCatalogSource,
  orbitAtlasReady,
  presentationMode,
  performanceBudgetSummary,
}: EvidenceLedgerPanelProps) {
  const createSummary = useCallback(
    () =>
      createEvidenceLedgerSummary({
        diagnostics: simulationDiagnosticsRef.current,
        orbitAtlasProfile,
        orbitAtlasRenderer,
        gaiaCatalogSource,
        orbitAtlasReady,
        presentationMode,
        performanceBudgetSummary,
      }),
    [
      simulationDiagnosticsRef,
      orbitAtlasProfile,
      orbitAtlasRenderer,
      gaiaCatalogSource,
      orbitAtlasReady,
      presentationMode,
      performanceBudgetSummary,
    ],
  );
  const [summary, setSummary] = useState<EvidenceLedgerSummary>(createSummary);
  const [selectedClaimId, setSelectedClaimId] = useState("");
  const [mobilePassportOpen, setMobilePassportOpen] = useState(false);

  useEffect(() => {
    if (!open || !initialSelectedClaimId) return;
    setSelectedClaimId(initialSelectedClaimId);
    setMobilePassportOpen(true);
  }, [initialSelectedClaimId, open]);

  useEffect(() => {
    if (!open) return;
    setSummary(createSummary());
    const intervalId = window.setInterval(() => setSummary(createSummary()), 600);
    return () => window.clearInterval(intervalId);
  }, [open, createSummary]);

  const selectedClaim = useMemo(
    () => selectEvidenceClaim(summary, selectedClaimId),
    [summary, selectedClaimId],
  );

  useEffect(() => {
    if (!open) {
      setMobilePassportOpen(false);
      return;
    }
    if (initialSelectedClaimId && selectedClaimId !== initialSelectedClaimId) {
      return;
    }
    const fallbackClaim = selectEvidenceClaim(summary, selectedClaimId);
    if (fallbackClaim?.id !== selectedClaimId) {
      setSelectedClaimId(fallbackClaim?.id ?? "");
    }
  }, [initialSelectedClaimId, open, selectedClaimId, summary]);

  const handleClaimSelect = useCallback((claimId: string) => {
    setSelectedClaimId(claimId);
    setMobilePassportOpen(true);
  }, []);

  const claimsByGroup = useMemo(() => {
    return summary.groups.map((group) => [
      group,
      summary.claims.filter((claim) => claim.group === group),
    ] as const);
  }, [summary]);
  const { closeWithFocusReturn, onSurfaceKeyDown } = useAtlasWorkbenchSurfaceAccessibility({
    open,
    surfaceId: "evidence-ledger",
    onClose,
  });

  if (!open) return null;

  return (
    <aside
      className="atlas-accessible-surface atlas-cinematic-workbench pointer-events-auto fixed inset-x-2 bottom-[calc(var(--ui-dock-height)+14px+env(safe-area-inset-bottom))] z-[104] max-h-[calc(100dvh-var(--ui-dock-height)-28px-env(safe-area-inset-bottom))] overflow-hidden rounded-lg border text-white shadow-[0_24px_80px_rgba(0,0,0,0.48)] sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-16 sm:w-[56rem] sm:max-w-[calc(100vw-2rem)]"
      data-evidence-ledger-version={summary.version}
      data-evidence-ledger-status={summary.status}
      data-evidence-claim-count={summary.claimCount}
      data-evidence-selected-claim-id={selectedClaim?.id ?? ""}
      data-evidence-passport-open={selectedClaim ? "true" : "false"}
      data-atlas-accessibility-surface-id="evidence-ledger"
      data-atlas-accessibility-focus-target="true"
      aria-label="证据账本"
      tabIndex={-1}
      onKeyDown={onSurfaceKeyDown}
    >
      <header className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-cyan-100/58">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-100/68" />
            证据账本
          </div>
          <div className="mt-1 text-[12px] leading-5 text-white/58">
            科学来源、验证状态与可信边界
          </div>
        </div>
        <button
          type="button"
          onClick={closeWithFocusReturn}
          className="atlas-accessible-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white/48 transition-colors hover:bg-white/8 hover:text-white/86"
          aria-label="关闭证据账本"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <ScientificEvidenceGateStrip />

      <div className="grid grid-cols-4 gap-px border-b border-white/10 bg-white/8 text-center">
        <LedgerStat label="状态" value={summary.status} tone={summary.status} />
        <LedgerStat label="声明" value={String(summary.claimCount)} />
        <LedgerStat label="就绪" value={String(summary.readyCount)} tone="ready" />
        <LedgerStat
          label="失败"
          value={String(summary.failedCount)}
          tone={summary.failedCount > 0 ? "failed" : "informational"}
        />
      </div>

      <div className="max-h-[calc(100dvh-var(--ui-dock-height)-178px-env(safe-area-inset-bottom))] overflow-hidden sm:max-h-[calc(100dvh-14rem)]">
        <div className="grid max-h-[inherit] min-h-0 sm:grid-cols-[minmax(13rem,0.9fr)_minmax(0,1.15fr)]">
          <div
            className={`max-h-[inherit] min-h-0 overflow-y-auto px-3 py-3 ${
              mobilePassportOpen ? "hidden sm:block" : "block"
            }`}
            aria-label="证据声明"
          >
            {claimsByGroup.map(([group, claims]) => (
              <section key={group} className="mb-3 last:mb-0">
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <h3 className="text-[10px] uppercase tracking-[0.14em] text-white/38">
                    {GROUP_LABELS[group]}
                  </h3>
                  <span className="ui-instrument text-[9px] text-white/28">{claims.length}</span>
                </div>
                <div className="space-y-2">
                  {claims.map((claim) => (
                    <ClaimButton
                      key={claim.id}
                      claim={claim}
                      selected={selectedClaim?.id === claim.id}
                      onSelect={() => handleClaimSelect(claim.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div
            className={`max-h-[inherit] min-h-0 overflow-hidden border-t border-white/10 sm:block sm:border-l sm:border-t-0 ${
              mobilePassportOpen ? "block" : "hidden"
            }`}
          >
            {selectedClaim ? (
              <PassportView claim={selectedClaim} onBack={() => setMobilePassportOpen(false)} />
            ) : (
              <div className="px-4 py-4 text-[12px] text-white/56">没有可用证据声明。</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function LedgerStat({
  label,
  value,
  tone = "informational",
}: {
  label: string;
  value: string;
  tone?: EvidenceClaimStatus;
}) {
  return (
    <div className="bg-black/18 px-2 py-2">
      <div className="text-[9px] uppercase tracking-[0.14em] text-white/32">{label}</div>
      <div
        className={`mt-0.5 truncate text-[11px] font-medium ${
          tone === "failed" ? "text-rose-100" : tone === "ready" ? "text-emerald-100" : "text-white/76"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ClaimButton({
  claim,
  selected,
  onSelect,
}: {
  claim: EvidenceClaim;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/40 ${
        selected
          ? "border-cyan-200/32 bg-cyan-100/[0.08] shadow-[inset_2px_0_0_rgba(165,243,252,0.55)]"
          : "border-white/9 bg-white/[0.035] hover:border-white/16 hover:bg-white/[0.055]"
      }`}
      data-evidence-claim-id={claim.id}
      aria-pressed={selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusIcon status={claim.status} />
            <h4 className="truncate text-[12px] font-medium text-white/86">{claim.title}</h4>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Pill text={claim.status} status={claim.status} />
            <Pill text={claim.confidence} />
          </div>
        </div>
        <ChevronRight
          className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${selected ? "text-cyan-100/80" : "text-white/28"}`}
        />
      </div>
      <div className="mt-3 grid gap-2 text-[11px] leading-4">
        <ClaimSummaryRow label="Source" value={claim.source} />
        <ClaimSummaryRow label="Metric" value={claim.metric} />
      </div>
    </button>
  );
}

function PassportView({ claim, onBack }: { claim: EvidenceClaim; onBack: () => void }) {
  const passport = claim.passport;

  return (
    <article
      className="max-h-[inherit] min-w-0 overflow-y-auto px-4 py-3"
      role="region"
      aria-label="Evidence passport"
      tabIndex={0}
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-[11px] text-white/68 transition-colors hover:bg-white/[0.07] hover:text-white sm:hidden"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to claims
      </button>

      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-cyan-100/58">
          <ScrollText className="h-3.5 w-3.5 text-cyan-100/70" />
          Claim Passport
        </div>
        <h3 className="mt-1 break-words text-[15px] font-semibold text-white/90">{claim.title}</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Pill text={claim.status} status={claim.status} />
          <Pill text={claim.confidence} />
          <Pill text={claim.id} />
        </div>
      </div>

      <dl className="mt-3 grid gap-2 rounded-md border border-white/9 bg-black/16 p-3 text-[11px] leading-4">
        <LedgerRow label="Source" value={claim.source} />
        <LedgerRow label="Model" value={claim.model} />
        <LedgerRow label="Primary metric" value={claim.metric} />
        <LedgerRow label="Error / tolerance" value={claim.error} />
        <LedgerRow label="Trusted boundary" value={claim.boundary} />
      </dl>

      <div className="mt-3 grid gap-2">
        {passport.sections.map((section) => (
          <section
            key={section.id}
            className="rounded-md border border-white/9 bg-white/[0.03] p-3"
            data-evidence-passport-section={section.id}
          >
            <h4 className="text-[10px] uppercase tracking-[0.13em] text-white/38">{section.title}</h4>
            <p className="mt-1 break-words text-[11px] leading-4 text-white/66">{section.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-3 rounded-md border border-white/9 bg-white/[0.03] p-3">
        <h4 className="text-[10px] uppercase tracking-[0.13em] text-white/38">Source Chain</h4>
        <ol className="mt-2 grid gap-1.5 text-[11px] leading-4 text-white/66">
          {passport.sourceChain.map((source, index) => (
            <li key={`${source}-${index}`} className="flex gap-2">
              <span className="ui-instrument mt-px w-4 shrink-0 text-white/28">{index + 1}</span>
              <span className="min-w-0 break-words">{source}</span>
            </li>
          ))}
        </ol>
      </section>

      {passport.formulas.length > 0 ? (
        <section className="mt-3 rounded-md border border-white/9 bg-white/[0.03] p-3">
          <h4 className="text-[10px] uppercase tracking-[0.13em] text-white/38">Formula References</h4>
          <div className="mt-2 grid gap-2">
            {passport.formulas.map((formulaItem) => (
              <div key={formulaItem.id} className="rounded border border-cyan-100/10 bg-cyan-100/[0.035] p-2">
                <div className="text-[11px] font-medium text-cyan-50/78">{formulaItem.label}</div>
                <code className="mt-1 block break-words text-[11px] leading-4 text-cyan-50/70">
                  {formulaItem.expression}
                </code>
                <div className="mt-1 text-[10px] leading-4 text-white/48">
                  {formulaItem.variables}; {formulaItem.applicability}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-3 rounded-md border border-white/9 bg-white/[0.03] p-3">
        <h4 className="text-[10px] uppercase tracking-[0.13em] text-white/38">Metric Details</h4>
        <div className="mt-2 grid gap-2">
          {passport.metrics.map((metricItem) => (
            <div key={metricItem.id} className="rounded border border-white/8 bg-black/12 p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-medium text-white/78">{metricItem.label}</div>
                <Pill text={metricItem.status} status={metricItem.status} />
              </div>
              <div className="mt-1 break-words text-[11px] leading-4 text-white/66">{metricItem.value}</div>
              {metricItem.target || metricItem.tolerance ? (
                <div className="mt-1 break-words text-[10px] leading-4 text-white/42">
                  {metricItem.target ? `target ${metricItem.target}` : ""}
                  {metricItem.target && metricItem.tolerance ? " / " : ""}
                  {metricItem.tolerance ? `tolerance/error ${metricItem.tolerance}` : ""}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-3 rounded-md border border-white/9 bg-white/[0.03] p-3">
        <h4 className="text-[10px] uppercase tracking-[0.13em] text-white/38">Related Views</h4>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {passport.relatedViews.map((view) => (
            <Pill key={view} text={RELATED_VIEW_LABELS[view]} />
          ))}
        </div>
      </section>
    </article>
  );
}

function ClaimSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.12em] text-white/30">{label}</div>
      <div className="mt-0.5 break-words text-white/66">{value}</div>
    </div>
  );
}

function StatusIcon({ status }: { status: EvidenceClaimStatus }) {
  if (status === "ready") return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-200/80" />;
  if (status === "failed") return <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-200/82" />;
  if (status === "pending") return <Database className="h-3.5 w-3.5 shrink-0 text-sky-200/76" />;
  return <Info className="h-3.5 w-3.5 shrink-0 text-white/48" />;
}

function Pill({ text, status }: { text: string; status?: EvidenceClaimStatus }) {
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] ${
        status ? STATUS_CLASS[status] : "border-cyan-100/14 bg-cyan-100/8 text-cyan-50/64"
      }`}
    >
      {text}
    </span>
  );
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] uppercase tracking-[0.12em] text-white/30">{label}</dt>
      <dd className="mt-0.5 break-words text-white/66">{value}</dd>
    </div>
  );
}

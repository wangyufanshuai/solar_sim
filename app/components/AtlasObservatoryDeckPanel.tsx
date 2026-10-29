"use client";

import {
  Compass,
  FileText,
  Gauge,
  LayoutDashboard,
  Play,
  Route,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  AtlasInstrumentActionButton,
  AtlasInstrumentHeader,
  AtlasInstrumentInfoBlock,
  AtlasInstrumentMetricPill,
  AtlasInstrumentPanelShell,
  AtlasInstrumentSection,
  AtlasInstrumentSegmentedTabs,
  AtlasInstrumentStat,
  AtlasInstrumentStatStrip,
  AtlasInstrumentStatusBadge,
  useAtlasWorkbenchSurfaceAccessibility,
} from "./AtlasInstrumentUi";
import { ATLAS_OBSERVATORY_DECK_VERSION } from "../lib/atlasObservatoryDeck";
import type {
  AtlasObservatoryDeckAction,
  AtlasObservatoryDeckSummary,
  AtlasObservatoryDeckZone,
  AtlasObservatoryZoneId,
  EvidencePassportMetric,
} from "../lib/simulationDiagnosticsTypes";

type AtlasObservatoryDeckPanelProps = {
  open: boolean;
  summary: AtlasObservatoryDeckSummary;
  activeZoneId: AtlasObservatoryZoneId;
  onActiveZoneIdChange: (zoneId: AtlasObservatoryZoneId) => void;
  onRunAction: (action: AtlasObservatoryDeckAction) => void;
  onClose: () => void;
};

const ZONE_LABELS: Record<AtlasObservatoryZoneId, string> = {
  "current-target": "目标",
  "trust-matrix": "验证",
  "mission-path": "任务",
  "report-export": "报告",
};

const ZONE_ICONS: Record<AtlasObservatoryZoneId, ReactNode> = {
  "current-target": <Compass className="h-4 w-4" />,
  "trust-matrix": <ShieldCheck className="h-4 w-4" />,
  "mission-path": <Route className="h-4 w-4" />,
  "report-export": <FileText className="h-4 w-4" />,
};

export default function AtlasObservatoryDeckPanel({
  open,
  summary,
  activeZoneId,
  onActiveZoneIdChange,
  onRunAction,
  onClose,
}: AtlasObservatoryDeckPanelProps) {
  const { closeWithFocusReturn, onSurfaceKeyDown } = useAtlasWorkbenchSurfaceAccessibility({
    open,
    surfaceId: "observatory-deck",
    onClose,
  });
  if (!open) return null;

  const activeZone =
    summary.zones.find((zone) => zone.id === activeZoneId) ??
    summary.zones[0] ??
    null;

  return (
    <AtlasInstrumentPanelShell
      kind="observatory-deck"
      accessibilitySurfaceId="observatory-deck"
      className="z-[109] overflow-hidden sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-14 sm:w-[min(76rem,calc(100vw-2rem))] sm:-translate-x-1/2"
      data-atlas-observatory-deck-version={ATLAS_OBSERVATORY_DECK_VERSION}
      data-atlas-observatory-deck-open="true"
      data-atlas-observatory-zone-count={summary.zoneCount}
      data-atlas-observatory-active-zone={activeZone?.id ?? ""}
      data-atlas-observatory-current-kind={summary.currentKind}
      data-atlas-observatory-current-id={summary.currentId}
      data-atlas-observatory-readiness-status={summary.readinessStatus}
      aria-label="观测台"
      data-no-escape-clear
      onKeyDown={onSurfaceKeyDown}
    >
      <AtlasInstrumentHeader
        icon={<LayoutDashboard className="h-3.5 w-3.5" />}
        title="观测台"
        subtitle="覆盖当前目标、验证矩阵、任务路径和报告导出的科学控制工作台"
        closeLabel="关闭观测台"
        onClose={closeWithFocusReturn}
      />

      <AtlasInstrumentStatStrip className="grid-cols-4">
        <AtlasInstrumentStat label="状态" value={summary.readinessStatus} tone={summary.readinessStatus} />
        <AtlasInstrumentStat label="当前" value={summary.currentKind || "none"} />
        <AtlasInstrumentStat label="问题" value={String(summary.trustIssueCount)} tone={summary.trustIssueCount > 0 ? "pending" : "ready"} />
        <AtlasInstrumentStat label="报告" value={`${summary.reportIncludedSectionCount} 节`} tone="informational" />
      </AtlasInstrumentStatStrip>

      {activeZone ? (
        <AtlasInstrumentSegmentedTabs
          tabs={summary.zones.map((zone) => ({ id: zone.id, label: ZONE_LABELS[zone.id] }))}
          activeId={activeZone.id}
          onChange={onActiveZoneIdChange}
          className="grid-cols-4"
        />
      ) : null}

      <div
        className="max-h-[calc(100dvh-var(--ui-dock-height)-166px-env(safe-area-inset-bottom))] overflow-y-auto p-3 sm:max-h-[calc(100dvh-12.5rem)]"
        role="region"
        aria-label="Observatory Deck zones"
        tabIndex={0}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {summary.zones.map((zone) => (
            <div
              key={zone.id}
              className={activeZone?.id === zone.id ? "block" : "hidden sm:block"}
            >
              <ZoneCard
                zone={zone}
                active={activeZone?.id === zone.id}
                onSelect={() => onActiveZoneIdChange(zone.id)}
                onRunAction={onRunAction}
              />
            </div>
          ))}
        </div>
      </div>
    </AtlasInstrumentPanelShell>
  );
}

function ZoneCard({
  zone,
  active,
  onSelect,
  onRunAction,
}: {
  zone: AtlasObservatoryDeckZone;
  active: boolean;
  onSelect: () => void;
  onRunAction: (action: AtlasObservatoryDeckAction) => void;
}) {
  return (
    <AtlasInstrumentSection
      className={`min-w-0 transition-colors ${
        active
          ? "border-cyan-100/24 bg-cyan-100/[0.055]"
          : "border-white/9 bg-white/[0.026]"
      }`}
      data-atlas-observatory-zone-id={zone.id}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full min-w-0 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/36"
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-cyan-100/14 bg-cyan-100/[0.06] text-cyan-50/74">
          {ZONE_ICONS[zone.id]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[15px] font-semibold text-white/90">{zone.title}</h2>
            <AtlasInstrumentStatusBadge status={zone.status} />
          </div>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/54">
            {zone.subtitle}
          </p>
        </div>
      </button>

      <div className="mt-3 grid gap-2 text-[10px] leading-4 text-white/48 sm:grid-cols-2">
        <AtlasInstrumentInfoBlock label="source" value={zone.source} />
        <AtlasInstrumentInfoBlock label="model" value={zone.model} />
        <AtlasInstrumentInfoBlock label="metric" value={zone.primaryMetric} />
        <AtlasInstrumentInfoBlock label="boundary" value={zone.boundary} />
      </div>

      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {zone.metrics.slice(0, 6).map((metric) => (
          <MetricPill key={metric.id} metric={metric} />
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {zone.actions.map((action) => (
          <AtlasInstrumentActionButton
            key={action.id}
            data-atlas-observatory-action-id={action.id}
            onClick={() => onRunAction(action)}
            title={action.boundary}
            icon={<Play className="h-3.5 w-3.5" />}
          >
            {action.label}
          </AtlasInstrumentActionButton>
        ))}
      </div>
    </AtlasInstrumentSection>
  );
}

function MetricPill({ metric }: { metric: EvidencePassportMetric }) {
  return (
    <AtlasInstrumentMetricPill
      icon={<Gauge className="h-3 w-3" />}
      label={metric.label}
      value={metric.value}
    />
  );
}

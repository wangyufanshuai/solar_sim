"use client";

import {
  Bookmark,
  BookmarkCheck,
  Clock3,
  Compass,
  Download,
  Eraser,
  Crosshair,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Link2,
  Play,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AtlasInstrumentActionButton,
  AtlasInstrumentHeader,
  AtlasInstrumentInfoBlock,
  AtlasInstrumentPanelShell,
  AtlasInstrumentSegmentedTabs,
  AtlasInstrumentStat,
  AtlasInstrumentStatStrip,
  useAtlasWorkbenchSurfaceAccessibility,
} from "./AtlasInstrumentUi";
import { ATLAS_MISSION_HUB_VERSION } from "../lib/atlasMissionHub";
import { ATLAS_MISSION_CAPSULE_VERSION } from "../lib/atlasMissionCapsule";
import type {
  AtlasMissionHubItem,
  AtlasMissionHubItemKind,
  AtlasMissionHubSummary,
} from "../lib/simulationDiagnosticsTypes";

type AtlasMissionHubPanelProps = {
  open: boolean;
  summary: AtlasMissionHubSummary;
  onExecuteItem: (item: AtlasMissionHubItem) => void;
  onTogglePinned: (item: AtlasMissionHubItem) => void;
  onCopyCapsuleLink: () => void;
  onExportCapsule: () => void;
  onImportCapsule: () => void;
  onClearCapsule: () => void;
  onScientificReportOpen: () => void;
  onValidationConsoleOpen: () => void;
  onObservatoryDeckOpen: () => void;
  onClose: () => void;
};

type MobileTab = "current" | "recent" | "pinned";

const KIND_LABELS: Record<AtlasMissionHubItemKind, string> = {
  "solar-body": "天体",
  "celestial-object": "目录",
  "gaia-star": "Gaia",
  "evidence-claim": "证据",
  workflow: "流程",
  "workflow-step": "步骤",
  "panel-action": "面板",
};

export default function AtlasMissionHubPanel({
  open,
  summary,
  onExecuteItem,
  onTogglePinned,
  onCopyCapsuleLink,
  onExportCapsule,
  onImportCapsule,
  onClearCapsule,
  onScientificReportOpen,
  onValidationConsoleOpen,
  onObservatoryDeckOpen,
  onClose,
}: AtlasMissionHubPanelProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("current");
  const { closeWithFocusReturn, onSurfaceKeyDown } = useAtlasWorkbenchSurfaceAccessibility({
    open,
    surfaceId: "mission-hub",
    onClose,
  });
  const currentItems = useMemo(
    () => summary.recommendedItems.slice(0, 3),
    [summary.recommendedItems],
  );

  if (!open) return null;

  return (
    <AtlasInstrumentPanelShell
      kind="mission-hub"
      accessibilitySurfaceId="mission-hub"
      className="z-[106] overflow-y-auto sm:inset-x-auto sm:bottom-auto sm:left-4 sm:top-14 sm:w-[52rem] sm:max-w-[calc(100vw-2rem)] sm:overflow-hidden"
      data-atlas-mission-hub-version={ATLAS_MISSION_HUB_VERSION}
      data-atlas-mission-hub-open="true"
      data-atlas-mission-hub-current-kind={summary.current.currentKind}
      data-atlas-mission-hub-current-id={summary.current.currentId}
      data-atlas-mission-hub-recent-count={summary.recentCount}
      data-atlas-mission-hub-pinned-count={summary.pinnedCount}
      data-atlas-mission-capsule-version={ATLAS_MISSION_CAPSULE_VERSION}
      data-atlas-mission-capsule-active={summary.capsuleRestoreSummary?.active ? "true" : "false"}
      data-atlas-mission-capsule-restored-count={summary.capsuleRestoreSummary?.restoredCount ?? 0}
      data-atlas-mission-capsule-warning-count={summary.capsuleRestoreSummary?.warningCount ?? 0}
      aria-label="任务中心"
      data-no-escape-clear
      onKeyDown={onSurfaceKeyDown}
    >
      <AtlasInstrumentHeader
        icon={<Compass className="h-3.5 w-3.5" />}
        title="任务中心"
        subtitle="本地验证图谱界面的科学会话记忆"
        closeLabel="关闭任务中心"
        onClose={closeWithFocusReturn}
      />

      <AtlasInstrumentStatStrip className="grid-cols-3">
        <AtlasInstrumentStat label="当前" value={summary.current.currentKind || "none"} />
        <AtlasInstrumentStat label="最近" value={String(summary.recentCount)} tone="cyan" />
        <AtlasInstrumentStat label="固定" value={String(summary.pinnedCount)} tone="amber" />
      </AtlasInstrumentStatStrip>

      <div className="border-b border-white/10 px-3 py-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <CapsuleActionButton action="copy-link" label="复制链接" icon={<Link2 className="h-3.5 w-3.5" />} onClick={onCopyCapsuleLink} />
          <CapsuleActionButton action="export" label="导出胶囊" icon={<Download className="h-3.5 w-3.5" />} onClick={onExportCapsule} />
          <CapsuleActionButton action="import" label="导入胶囊" icon={<Upload className="h-3.5 w-3.5" />} onClick={onImportCapsule} />
          <CapsuleActionButton action="clear" label="清除胶囊" icon={<Eraser className="h-3.5 w-3.5" />} onClick={onClearCapsule} />
        </div>
        <AtlasInstrumentActionButton
          data-atlas-observatory-action-id="open-observatory-deck"
          onClick={onObservatoryDeckOpen}
          className="mt-2 w-full"
          icon={<LayoutDashboard className="h-3.5 w-3.5" />}
        >
          打开观测台
        </AtlasInstrumentActionButton>
        <AtlasInstrumentActionButton
          data-atlas-scientific-report-action="open"
          onClick={onScientificReportOpen}
          className="mt-2 w-full"
          icon={<FileText className="h-3.5 w-3.5" />}
        >
          报告工作室
        </AtlasInstrumentActionButton>
        <AtlasInstrumentActionButton
          data-atlas-validation-console-action="open"
          onClick={onValidationConsoleOpen}
          className="mt-2 w-full"
          icon={<ShieldAlert className="h-3.5 w-3.5" />}
        >
          验证控制台
        </AtlasInstrumentActionButton>
      </div>

      <AtlasInstrumentSegmentedTabs
        tabs={[
          { id: "current", label: "当前" },
          { id: "recent", label: "最近" },
          { id: "pinned", label: "固定" },
        ]}
        activeId={mobileTab}
        onChange={setMobileTab}
        className="grid-cols-3"
      />

      <div className="grid min-h-0 sm:max-h-[calc(100dvh-13rem)] sm:grid-cols-[18rem_minmax(0,1fr)] sm:overflow-hidden">
        <div className="min-h-0 border-b border-white/10 px-3 py-3 sm:max-h-[inherit] sm:overflow-y-auto sm:border-b-0 sm:border-r">
          <div className={mobileTab === "current" ? "block" : "hidden sm:block"}>
            <PanelSection
              title="当前任务"
              icon={<Crosshair className="h-3.5 w-3.5" />}
              emptyText="暂无活动任务上下文。"
            >
              <ContextCard summary={summary} />
              <MiniList
                title="Continue"
                items={currentItems}
                onExecuteItem={onExecuteItem}
                onTogglePinned={onTogglePinned}
              />
            </PanelSection>
          </div>

          <div className={mobileTab === "recent" ? "mt-0 block" : "mt-4 hidden sm:block"}>
            <PanelSection
              title="最近记录"
              icon={<Clock3 className="h-3.5 w-3.5" />}
              emptyText="运行导航器或流程动作后会生成最近记录。"
            >
              <MiniList
                items={summary.recentItems.slice(0, 6)}
                onExecuteItem={onExecuteItem}
                onTogglePinned={onTogglePinned}
              />
            </PanelSection>
          </div>

          <div className={mobileTab === "pinned" ? "mt-0 block" : "mt-4 hidden sm:block"}>
            <PanelSection
              title="固定项目"
              icon={<BookmarkCheck className="h-3.5 w-3.5" />}
              emptyText="Pin bodies, claims, workflows, or panels for quick return."
            >
              <MiniList
                items={summary.pinnedItems.slice(0, 8)}
                onExecuteItem={onExecuteItem}
                onTogglePinned={onTogglePinned}
              />
            </PanelSection>
          </div>
        </div>

        <div className="min-h-0 px-4 py-3 sm:max-h-[inherit] sm:overflow-y-auto">
          <div className={mobileTab === "current" ? "block" : "hidden sm:block"}>
            <ContextPassport summary={summary} />
          </div>
          <div className="mt-3 grid gap-2">
            {summary.recommendedItems.map((item) => (
              <MissionHubItemCard
                key={item.id}
                item={item}
                onExecuteItem={onExecuteItem}
                onTogglePinned={onTogglePinned}
              />
            ))}
          </div>
        </div>
      </div>
    </AtlasInstrumentPanelShell>
  );
}

function ContextPassport({ summary }: { summary: AtlasMissionHubSummary }) {
  const capsuleSummary = summary.capsuleRestoreSummary;
  return (
    <div className="grid gap-3">
      <section className="rounded-md border border-white/9 bg-white/[0.032] p-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-100/14 bg-cyan-100/[0.055] text-cyan-50/75">
            <FileCheck2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-white/90">{summary.current.title}</h2>
            <p className="mt-1 text-[11px] leading-4 text-white/58">{summary.current.subtitle}</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 text-[10px] leading-4 text-white/48 sm:grid-cols-2">
          <InfoBlock label="source" value={summary.current.source} />
          <InfoBlock label="model" value={summary.current.model} />
          <InfoBlock label="metric" value={summary.current.primaryMetric} />
          <InfoBlock label="boundary" value={summary.current.boundary} />
        </div>
      </section>
      {capsuleSummary && capsuleSummary.source !== "none" ? (
        <section className="rounded-md border border-cyan-100/12 bg-cyan-100/[0.035] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-100/50">Mission Capsule</div>
              <div className="mt-1 text-[12px] font-medium text-white/82">{capsuleSummary.source}</div>
            </div>
            <div className="ui-instrument text-[10px] text-white/45">
              restored {capsuleSummary.restoredCount} / warnings {capsuleSummary.warningCount}
            </div>
          </div>
          <div className="mt-2 grid gap-2 text-[10px] leading-4 text-white/50 sm:grid-cols-2">
            <InfoBlock label="created" value={capsuleSummary.createdAt || "unavailable"} />
            <InfoBlock label="boundary" value="UI/session provenance only; physics buffers and telemetry are not restored." />
          </div>
          {capsuleSummary.warnings.length > 0 ? (
            <div className="mt-2 grid gap-1">
              {capsuleSummary.warnings.slice(0, 4).map((warning, index) => (
                <div key={`${warning.code}-${warning.field ?? index}`} className="rounded border border-amber-300/14 bg-amber-300/[0.045] px-2 py-1.5 text-[10px] leading-4 text-amber-50/72">
                  {warning.message}
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function ContextCard({ summary }: { summary: AtlasMissionHubSummary }) {
  return (
    <div className="rounded-md border border-cyan-100/14 bg-cyan-100/[0.045] p-2.5">
      <div className="ui-instrument text-[9px] uppercase tracking-[0.12em] text-cyan-100/48">
        {summary.current.currentKind || "idle"}
      </div>
      <div className="mt-1 truncate text-[12px] font-medium text-white/86">
        {summary.current.title}
      </div>
      <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/48">
        {summary.current.primaryMetric}
      </div>
    </div>
  );
}

function MiniList({
  title,
  items,
  onExecuteItem,
  onTogglePinned,
}: {
  title?: string;
  items: readonly AtlasMissionHubItem[];
  onExecuteItem: (item: AtlasMissionHubItem) => void;
  onTogglePinned: (item: AtlasMissionHubItem) => void;
}) {
  if (items.length === 0) {
    return <div className="rounded border border-white/8 px-2 py-2 text-[10px] text-white/36">暂无本地项目。</div>;
  }
  return (
    <div className="grid gap-2">
      {title ? <div className="px-1 text-[10px] uppercase tracking-[0.13em] text-white/34">{title}</div> : null}
      {items.map((item) => (
        <MissionHubMiniItem
          key={item.id}
          item={item}
          onExecuteItem={onExecuteItem}
          onTogglePinned={onTogglePinned}
        />
      ))}
    </div>
  );
}

function MissionHubMiniItem({
  item,
  onExecuteItem,
  onTogglePinned,
}: {
  item: AtlasMissionHubItem;
  onExecuteItem: (item: AtlasMissionHubItem) => void;
  onTogglePinned: (item: AtlasMissionHubItem) => void;
}) {
  return (
    <div
      className="rounded-md border border-white/8 bg-white/[0.026] p-2"
      data-atlas-mission-hub-item-id={item.id}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="ui-instrument text-[9px] uppercase tracking-[0.1em] text-white/30">
            {KIND_LABELS[item.kind]}{item.stale ? " / stale" : ""}
          </div>
          <div className="mt-0.5 truncate text-[11px] font-medium text-white/82">{item.title}</div>
          <div className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-white/42">{item.primaryMetric}</div>
        </div>
        <PinButton item={item} onTogglePinned={onTogglePinned} />
      </div>
      <button
        type="button"
        onClick={() => onExecuteItem(item)}
        disabled={item.stale}
        className="mt-2 flex h-7 w-full items-center justify-center gap-1.5 rounded border border-cyan-100/16 bg-cyan-100/[0.045] text-[10px] text-cyan-50/74 transition-colors hover:bg-cyan-100/[0.08] disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.02] disabled:text-white/26"
      >
        <Play className="h-3 w-3" />
        {item.stale ? "Unavailable" : item.actionLabel}
      </button>
    </div>
  );
}

function MissionHubItemCard({
  item,
  onExecuteItem,
  onTogglePinned,
}: {
  item: AtlasMissionHubItem;
  onExecuteItem: (item: AtlasMissionHubItem) => void;
  onTogglePinned: (item: AtlasMissionHubItem) => void;
}) {
  return (
    <section
      className="rounded-md border border-white/9 bg-white/[0.026] p-3"
      data-atlas-mission-hub-item-id={item.id}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-white/9 bg-white/[0.035] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-white/38">
              {KIND_LABELS[item.kind]}
            </span>
            {item.stale ? (
              <span className="rounded border border-amber-300/24 bg-amber-300/8 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-amber-100/74">
                stale
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 text-[13px] font-medium text-white/86">{item.title}</h3>
          <p className="mt-1 text-[11px] leading-4 text-white/56">{item.subtitle}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <PinButton item={item} onTogglePinned={onTogglePinned} />
          <button
            type="button"
            onClick={() => onExecuteItem(item)}
            disabled={item.stale}
            className="flex h-8 min-w-[8rem] items-center justify-center gap-1.5 rounded-md border border-cyan-100/18 bg-cyan-100/[0.055] px-2.5 text-[10px] text-cyan-50/78 transition-colors hover:bg-cyan-100/[0.09] disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.025] disabled:text-white/28"
          >
            <Play className="h-3.5 w-3.5" />
            {item.stale ? "Unavailable" : item.actionLabel}
          </button>
        </div>
      </div>
      <div className="mt-2 grid gap-2 text-[10px] leading-4 text-white/45 sm:grid-cols-2">
        <InfoBlock label="source" value={item.source} />
        <InfoBlock label="model" value={item.model} />
        <InfoBlock label="metric" value={item.primaryMetric} />
        <InfoBlock label="boundary" value={item.boundary} />
      </div>
    </section>
  );
}

function PinButton({
  item,
  onTogglePinned,
}: {
  item: AtlasMissionHubItem;
  onTogglePinned: (item: AtlasMissionHubItem) => void;
}) {
  const Icon = item.pinned ? BookmarkCheck : Bookmark;
  return (
    <button
      type="button"
      onClick={() => onTogglePinned(item)}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/8 bg-white/[0.025] text-white/48 transition-colors hover:bg-white/[0.055] hover:text-white/78"
      aria-label={item.pinned ? `Unpin ${item.title}` : `Pin ${item.title}`}
      aria-pressed={item.pinned}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function PanelSection({
  title,
  icon,
  emptyText,
  children,
}: {
  title: string;
  icon: ReactNode;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 px-1 text-[10px] uppercase tracking-[0.14em] text-white/34">
        {icon}
        <span>{title}</span>
      </div>
      {children ?? <div className="rounded border border-white/8 px-2 py-2 text-[10px] text-white/36">{emptyText}</div>}
    </section>
  );
}

function CapsuleActionButton({
  action,
  label,
  icon,
  onClick,
}: {
  action: "copy-link" | "export" | "import" | "clear";
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <AtlasInstrumentActionButton
      data-atlas-capsule-action={action}
      onClick={onClick}
      tone="quiet"
      icon={icon}
    >
      {label}
    </AtlasInstrumentActionButton>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return <AtlasInstrumentInfoBlock label={label} value={value} />;
}

"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  LayoutDashboard,
  ListChecks,
  Play,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  AtlasInstrumentActionButton,
  AtlasInstrumentHeader,
  AtlasInstrumentInfoBlock,
  AtlasInstrumentPanelShell,
  AtlasInstrumentSegmentedTabs,
  AtlasInstrumentStat,
  AtlasInstrumentStatStrip,
  AtlasInstrumentStatusBadge,
  useAtlasWorkbenchSurfaceAccessibility,
} from "./AtlasInstrumentUi";
import { ATLAS_VALIDATION_CONSOLE_VERSION } from "../lib/atlasValidationConsole";
import type {
  AtlasValidationConsoleSummary,
  AtlasValidationDomain,
  AtlasValidationDomainId,
  AtlasValidationDomainStatus,
  AtlasValidationIssue,
  AtlasValidationIssueSeverity,
} from "../lib/simulationDiagnosticsTypes";
import ScientificEvidenceGateStrip from "./ScientificEvidenceGateStrip";

type AtlasValidationConsolePanelProps = {
  open: boolean;
  summary: AtlasValidationConsoleSummary;
  selectedDomainId: AtlasValidationDomainId;
  onSelectedDomainIdChange: (domainId: AtlasValidationDomainId) => void;
  onRunDomainAction: (domain: AtlasValidationDomain) => void;
  onRunIssueAction: (issue: AtlasValidationIssue) => void;
  onObservatoryDeckOpen: () => void;
  onClose: () => void;
};

type MobileTab = "matrix" | "issues" | "context";

const ISSUE_TONE: Record<AtlasValidationIssueSeverity, string> = {
  blocker: "border-rose-200/22 bg-rose-200/[0.06] text-rose-50/82",
  warning: "border-amber-200/20 bg-amber-200/[0.055] text-amber-50/78",
  info: "border-cyan-100/16 bg-cyan-100/[0.045] text-cyan-50/72",
};

export default function AtlasValidationConsolePanel({
  open,
  summary,
  selectedDomainId,
  onSelectedDomainIdChange,
  onRunDomainAction,
  onRunIssueAction,
  onObservatoryDeckOpen,
  onClose,
}: AtlasValidationConsolePanelProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("matrix");
  const { closeWithFocusReturn, onSurfaceKeyDown } = useAtlasWorkbenchSurfaceAccessibility({
    open,
    surfaceId: "validation-console",
    onClose,
  });
  const selectedDomain = useMemo(
    () =>
      summary.domains.find((domain) => domain.id === selectedDomainId) ??
      summary.domains[0] ??
      null,
    [selectedDomainId, summary.domains],
  );
  const selectedIssues = useMemo(
    () =>
      selectedDomain
        ? summary.issues.filter((issue) => issue.domainId === selectedDomain.id)
        : [],
    [selectedDomain, summary.issues],
  );

  if (!open) return null;

  return (
    <AtlasInstrumentPanelShell
      kind="validation-console"
      accessibilitySurfaceId="validation-console"
      className="z-[108] overflow-hidden sm:inset-x-auto sm:bottom-auto sm:left-4 sm:top-14 sm:w-[55rem] sm:max-w-[calc(100vw-2rem)]"
      data-atlas-validation-console-version={ATLAS_VALIDATION_CONSOLE_VERSION}
      data-atlas-validation-console-open="true"
      data-atlas-validation-console-status={summary.status}
      data-atlas-validation-ready-count={summary.readyCount}
      data-atlas-validation-pending-count={summary.pendingCount}
      data-atlas-validation-failed-count={summary.failedCount}
      data-atlas-validation-blocker-count={summary.blockerCount}
      data-atlas-validation-selected-domain-id={selectedDomain?.id ?? ""}
      aria-label="验证控制台"
      data-no-escape-clear
      onKeyDown={onSurfaceKeyDown}
    >
      <AtlasInstrumentHeader
        icon={<ShieldAlert className="h-3.5 w-3.5" />}
        title="验证控制台"
        subtitle="本地证据来源与科学就绪状态的只读矩阵"
        closeLabel="关闭验证控制台"
        onClose={closeWithFocusReturn}
      />

      <ScientificEvidenceGateStrip />

      <AtlasInstrumentStatStrip className="grid-cols-4">
        <AtlasInstrumentStat label="状态" value={summary.status} tone={summary.status} />
        <AtlasInstrumentStat label="就绪" value={String(summary.readyCount)} tone="ready" />
        <AtlasInstrumentStat label="待定" value={String(summary.pendingCount)} tone="pending" />
        <AtlasInstrumentStat label="阻塞" value={String(summary.blockerCount)} tone={summary.blockerCount > 0 ? "failed" : "ready"} />
      </AtlasInstrumentStatStrip>

      <div className="border-b border-white/10 px-3 py-2">
        <AtlasInstrumentActionButton
          data-atlas-observatory-action-id="open-observatory-deck"
          onClick={onObservatoryDeckOpen}
          className="w-full"
          icon={<LayoutDashboard className="h-3.5 w-3.5" />}
        >
          打开观测台
        </AtlasInstrumentActionButton>
      </div>

      <AtlasInstrumentSegmentedTabs
        tabs={[
          { id: "matrix", label: "矩阵" },
          { id: "issues", label: "问题" },
          { id: "context", label: "上下文" },
        ]}
        activeId={mobileTab}
        onChange={setMobileTab}
        className="grid-cols-3"
      />

      <div className="grid min-h-0 sm:max-h-[calc(100dvh-13rem)] sm:grid-cols-[19rem_minmax(0,1fr)] sm:overflow-hidden">
        <div className={`${mobileTab === "matrix" ? "block" : "hidden sm:block"} min-h-0 border-b border-white/10 px-3 py-3 sm:max-h-[inherit] sm:overflow-y-auto sm:border-b-0 sm:border-r`}>
          <div className="mb-2 flex items-center gap-2 px-1 text-[10px] uppercase tracking-[0.14em] text-white/34">
            <ListChecks className="h-3.5 w-3.5" />
            <span>状态矩阵</span>
          </div>
          <div className="grid gap-2">
            {summary.domains.map((domain) => (
              <button
                key={domain.id}
                type="button"
                onClick={() => onSelectedDomainIdChange(domain.id)}
                className={`min-w-0 rounded-md border p-2 text-left transition-colors ${
                  selectedDomain?.id === domain.id
                    ? "border-cyan-100/26 bg-cyan-100/[0.07]"
                    : "border-white/8 bg-white/[0.024] hover:border-cyan-100/16 hover:bg-cyan-100/[0.035]"
                }`}
                data-atlas-validation-domain-id={domain.id}
                aria-pressed={selectedDomain?.id === domain.id}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-medium text-white/82">{domain.title}</span>
                  <AtlasInstrumentStatusBadge status={domain.status} />
                </div>
                <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/42">
                  {domain.primaryMetric}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 px-4 py-3 sm:max-h-[inherit] sm:overflow-y-auto">
          <div className={mobileTab === "issues" ? "block" : "hidden sm:block"}>
            <IssueList
              issues={summary.issues}
              onRunIssueAction={onRunIssueAction}
              onSelectedDomainIdChange={onSelectedDomainIdChange}
            />
          </div>

          <div className={mobileTab === "context" ? "block" : "hidden sm:block"}>
            {selectedDomain ? (
              <DomainDetail
                domain={selectedDomain}
                issues={selectedIssues}
                context={summary.context}
                onRunDomainAction={onRunDomainAction}
                onRunIssueAction={onRunIssueAction}
              />
            ) : null}
          </div>
        </div>
      </div>
    </AtlasInstrumentPanelShell>
  );
}

function DomainDetail({
  domain,
  issues,
  context,
  onRunDomainAction,
  onRunIssueAction,
}: {
  domain: AtlasValidationDomain;
  issues: readonly AtlasValidationIssue[];
  context: AtlasValidationConsoleSummary["context"];
  onRunDomainAction: (domain: AtlasValidationDomain) => void;
  onRunIssueAction: (issue: AtlasValidationIssue) => void;
}) {
  return (
    <div className="grid gap-3">
      <section className="rounded-md border border-cyan-100/12 bg-cyan-100/[0.04] p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusIcon status={domain.status} />
              <h2 className="text-[15px] font-semibold text-white/90">{domain.title}</h2>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-white/58">{domain.primaryMetric}</p>
          </div>
          <button
            type="button"
            onClick={() => onRunDomainAction(domain)}
            className="flex h-8 min-w-[7.5rem] shrink-0 items-center justify-center gap-1.5 rounded-md border border-cyan-100/18 bg-cyan-100/[0.055] px-2.5 text-[10px] text-cyan-50/78 transition-colors hover:bg-cyan-100/[0.09] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/36"
          >
            <Play className="h-3.5 w-3.5" />
            {domain.actionLabel}
          </button>
        </div>
        <div className="mt-3 grid gap-2 text-[10px] leading-4 text-white/48 sm:grid-cols-2">
          <InfoBlock label="状态" value={domain.status} />
          <InfoBlock label="来源" value={domain.source} />
          <InfoBlock label="模型" value={domain.model} />
          <InfoBlock label="边界" value={domain.boundary} />
        </div>
      </section>

      <section className="rounded-md border border-white/9 bg-white/[0.028] p-3">
        <h3 className="text-[10px] uppercase tracking-[0.13em] text-white/38">当前上下文</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <InfoBlock label="天体" value={context.selectedBodyId || "无"} />
          <InfoBlock label="目录对象" value={context.selectedCatalogObjectId || "无"} />
          <InfoBlock label="证据声明" value={context.selectedEvidenceClaimId || "无"} />
          <InfoBlock label="工作流" value={context.selectedWorkflowId || "无"} />
          <InfoBlock label="工作流步骤" value={context.activeWorkflowStepId || "无"} />
          <InfoBlock label="报告模板" value={`${context.reportTemplateId}; ${context.reportIncludedSectionCount} 个章节`} />
        </div>
      </section>

      <section className="rounded-md border border-white/9 bg-white/[0.028] p-3">
        <h3 className="text-[10px] uppercase tracking-[0.13em] text-white/38">当前域问题</h3>
        <div className="mt-2 grid gap-2">
          {issues.length > 0 ? (
            issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onRunIssueAction={onRunIssueAction} />
            ))
          ) : (
            <div className="rounded border border-white/8 px-2 py-2 text-[10px] text-white/38">
              当前域没有阻塞或警告。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function IssueList({
  issues,
  onRunIssueAction,
  onSelectedDomainIdChange,
}: {
  issues: readonly AtlasValidationIssue[];
  onRunIssueAction: (issue: AtlasValidationIssue) => void;
  onSelectedDomainIdChange: (domainId: AtlasValidationDomainId) => void;
}) {
  return (
    <section className="mb-3 rounded-md border border-white/9 bg-white/[0.028] p-3 sm:mb-0">
      <h3 className="text-[10px] uppercase tracking-[0.13em] text-white/38">问题</h3>
      <div className="mt-2 grid gap-2">
        {issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            onRunIssueAction={onRunIssueAction}
            onSelect={() => onSelectedDomainIdChange(issue.domainId)}
          />
        ))}
      </div>
    </section>
  );
}

function IssueCard({
  issue,
  onRunIssueAction,
  onSelect,
}: {
  issue: AtlasValidationIssue;
  onRunIssueAction: (issue: AtlasValidationIssue) => void;
  onSelect?: () => void;
}) {
  return (
    <div
      className={`rounded-md border p-2 ${ISSUE_TONE[issue.severity]}`}
      data-atlas-validation-issue-id={issue.id}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-medium">{issue.title}</span>
          <span className="shrink-0 text-[9px] uppercase tracking-[0.1em] opacity-70">
            {issue.severity}
          </span>
        </div>
        <p className="mt-1 text-[10px] leading-4 opacity-80">{issue.message}</p>
      </button>
      <button
        type="button"
        onClick={() => onRunIssueAction(issue)}
        className="mt-2 flex h-7 w-full items-center justify-center gap-1.5 rounded border border-current/20 bg-black/12 px-2 text-[10px] transition-colors hover:bg-black/20"
      >
        <Play className="h-3 w-3" />
        {issue.actionLabel}
      </button>
    </div>
  );
}

function StatusIcon({ status }: { status: AtlasValidationDomainStatus }) {
  if (status === "ready") return <CheckCircle2 className="h-4 w-4 text-emerald-100/80" />;
  if (status === "failed") return <AlertTriangle className="h-4 w-4 text-rose-100/82" />;
  if (status === "pending") return <AlertTriangle className="h-4 w-4 text-amber-100/80" />;
  return <Info className="h-4 w-4 text-cyan-100/74" />;
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return <AtlasInstrumentInfoBlock label={label} value={value} />;
}

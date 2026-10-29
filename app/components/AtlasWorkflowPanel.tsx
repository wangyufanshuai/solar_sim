"use client";

import {
  CheckCircle2,
  CircleDashed,
  FlaskConical,
  ListChecks,
  MapPinned,
  Play,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useAtlasWorkbenchSurfaceAccessibility } from "./AtlasInstrumentUi";
import { ATLAS_WORKFLOW_VERSION } from "../lib/atlasWorkflows";
import { RELATIVITY_GUIDED_TOUR_WORKFLOW_ID } from "../lib/relativityGuidedTour";
import type {
  AtlasWorkflow,
  AtlasWorkflowStep,
  AtlasWorkflowStepStatus,
  AtlasWorkflowSummary,
} from "../lib/simulationDiagnosticsTypes";

type AtlasWorkflowPanelProps = {
  open: boolean;
  summary: AtlasWorkflowSummary;
  selectedWorkflowId: string;
  activeStepId: string;
  onSelectedWorkflowIdChange: (workflowId: string) => void;
  onActiveStepIdChange: (stepId: string) => void;
  onRunStep: (step: AtlasWorkflowStep) => void;
  onMissionHubOpen?: () => void;
  onClose: () => void;
};

const STATUS_CLASS: Record<AtlasWorkflowStepStatus, string> = {
  ready: "border-emerald-300/28 bg-emerald-300/10 text-emerald-100",
  blocked: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  informational: "border-white/12 bg-white/[0.045] text-white/60",
};

export default function AtlasWorkflowPanel({
  open,
  summary,
  selectedWorkflowId,
  activeStepId,
  onSelectedWorkflowIdChange,
  onActiveStepIdChange,
  onRunStep,
  onMissionHubOpen,
  onClose,
}: AtlasWorkflowPanelProps) {
  const selectedWorkflow = useMemo(
    () =>
      summary.workflows.find((workflow) => workflow.id === selectedWorkflowId) ??
      summary.workflows.find((workflow) => workflow.id === summary.selectedDefaultId) ??
      summary.workflows[0] ??
      null,
    [selectedWorkflowId, summary.selectedDefaultId, summary.workflows],
  );
  const { closeWithFocusReturn, onSurfaceKeyDown } = useAtlasWorkbenchSurfaceAccessibility({
    open,
    surfaceId: "atlas-workflows",
    onClose,
  });

  useEffect(() => {
    if (!open || !selectedWorkflow) return;
    if (selectedWorkflow.id !== selectedWorkflowId) {
      onSelectedWorkflowIdChange(selectedWorkflow.id);
    }
  }, [onSelectedWorkflowIdChange, open, selectedWorkflow, selectedWorkflowId]);

  if (!open) return null;

  return (
    <aside
      className="atlas-accessible-surface atlas-cinematic-workbench pointer-events-auto fixed inset-x-2 bottom-[calc(var(--ui-dock-height)+14px+env(safe-area-inset-bottom))] z-[105] max-h-[calc(100dvh-var(--ui-dock-height)-28px-env(safe-area-inset-bottom))] overflow-y-auto rounded-lg border text-white shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:inset-x-auto sm:bottom-auto sm:left-4 sm:top-16 sm:w-[46rem] sm:max-w-[calc(100vw-2rem)] sm:overflow-hidden"
      data-atlas-workflow-version={ATLAS_WORKFLOW_VERSION}
      data-atlas-workflow-open="true"
      data-atlas-workflow-selected-id={selectedWorkflow?.id ?? ""}
      data-atlas-workflow-active-step-id={activeStepId}
      data-relativity-guided-tour-workflow-id={RELATIVITY_GUIDED_TOUR_WORKFLOW_ID}
      data-atlas-accessibility-surface-id="atlas-workflows"
      data-atlas-accessibility-focus-target="true"
      aria-label="图谱流程"
      data-no-escape-clear
      tabIndex={-1}
      onKeyDown={onSurfaceKeyDown}
    >
      <header className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-cyan-100/58">
            <ListChecks className="h-3.5 w-3.5 text-cyan-100/68" />
            图谱流程
          </div>
          <div className="mt-1 text-[12px] leading-5 text-white/58">
            基于既有验证层的科学导览任务
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onMissionHubOpen ? (
            <button
              type="button"
              onClick={onMissionHubOpen}
              className="atlas-accessible-focus flex h-9 items-center gap-1.5 rounded-md border border-cyan-100/14 bg-cyan-100/[0.04] px-2 text-[10px] text-cyan-50/70 transition-colors hover:bg-cyan-100/[0.08] hover:text-cyan-50/90"
              aria-label="打开任务中心"
            >
              <MapPinned className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">任务中心</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={closeWithFocusReturn}
            className="atlas-accessible-focus flex h-9 w-9 items-center justify-center rounded-md text-white/48 transition-colors hover:bg-white/8 hover:text-white/86"
            aria-label="关闭图谱流程"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-px border-b border-white/10 bg-white/8 text-center">
        <Stat label="workflows" value={String(summary.workflowCount)} />
        <Stat label="ready steps" value={String(summary.readyStepCount)} tone="ready" />
        <Stat
          label="blocked"
          value={String(summary.blockedStepCount)}
          tone={summary.blockedStepCount > 0 ? "blocked" : "informational"}
        />
      </div>

      <div className="grid min-h-0 sm:max-h-[calc(100dvh-14rem)] sm:grid-cols-[16rem_minmax(0,1fr)] sm:overflow-hidden">
        <div className="min-h-0 border-b border-white/10 px-3 py-3 sm:max-h-[inherit] sm:overflow-y-auto sm:border-b-0 sm:border-r">
          <div className="mb-2 px-1 text-[10px] uppercase tracking-[0.14em] text-white/34">
            Mission paths
          </div>
          <div className="grid gap-2">
            {summary.workflows.map((workflow) => (
              <WorkflowButton
                key={workflow.id}
                workflow={workflow}
                selected={selectedWorkflow?.id === workflow.id}
                onSelect={() => onSelectedWorkflowIdChange(workflow.id)}
              />
            ))}
          </div>
        </div>

        <div className="min-h-0 px-4 py-3 sm:max-h-[inherit] sm:overflow-y-auto">
          {selectedWorkflow ? (
            <WorkflowDetail
              workflow={selectedWorkflow}
              activeStepId={activeStepId}
              onActiveStepIdChange={onActiveStepIdChange}
              onRunStep={onRunStep}
            />
          ) : (
            <div className="text-[12px] text-white/56">No workflow available.</div>
          )}
        </div>
      </div>
    </aside>
  );
}

function WorkflowButton({
  workflow,
  selected,
  onSelect,
}: {
  workflow: AtlasWorkflow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/40 ${
        selected
          ? "border-cyan-100/25 bg-cyan-100/[0.075]"
          : "border-white/8 bg-white/[0.028] hover:border-white/14 hover:bg-white/[0.05]"
      }`}
      data-atlas-workflow-id={workflow.id}
      data-relativity-guided-tour-workflow-id={
        workflow.id === RELATIVITY_GUIDED_TOUR_WORKFLOW_ID ? workflow.id : undefined
      }
      data-relativity-guided-tour-step-count={
        workflow.id === RELATIVITY_GUIDED_TOUR_WORKFLOW_ID ? workflow.stepCount : undefined
      }
      data-relativity-guided-tour-ready-count={
        workflow.id === RELATIVITY_GUIDED_TOUR_WORKFLOW_ID ? workflow.readyStepCount : undefined
      }
      aria-pressed={selected}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[12px] font-medium text-white/84">{workflow.title}</span>
        <span className="ui-instrument text-[9px] text-white/34">
          {workflow.readyStepCount}/{workflow.stepCount}
        </span>
      </div>
      <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/46">
        {workflow.subtitle}
      </div>
    </button>
  );
}

function WorkflowDetail({
  workflow,
  activeStepId,
  onActiveStepIdChange,
  onRunStep,
}: {
  workflow: AtlasWorkflow;
  activeStepId: string;
  onActiveStepIdChange: (stepId: string) => void;
  onRunStep: (step: AtlasWorkflowStep) => void;
}) {
  return (
    <div>
      <div className="mb-3 rounded-md border border-white/9 bg-white/[0.032] p-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-100/14 bg-cyan-100/[0.055] text-cyan-50/75">
            <FlaskConical className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-white/90">{workflow.title}</h2>
            <p className="mt-1 text-[11px] leading-4 text-white/58">{workflow.objective}</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 text-[10px] leading-4 text-white/48 sm:grid-cols-2">
          <InfoBlock label="source" value={workflow.source} />
          <InfoBlock label="model" value={workflow.model} />
        </div>
        <div className="mt-2 flex items-start gap-2 rounded border border-white/8 bg-black/16 px-2 py-2 text-[10px] leading-4 text-white/48">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-100/54" />
          <span>{workflow.boundary}</span>
        </div>
      </div>

      <div className="grid gap-2">
        {workflow.steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            index={index + 1}
            active={activeStepId === step.id}
            onRun={() => {
              onActiveStepIdChange(step.id);
              onRunStep(step);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function StepCard({
  step,
  index,
  active,
  onRun,
}: {
  step: AtlasWorkflowStep;
  index: number;
  active: boolean;
  onRun: () => void;
}) {
  const runnable = step.status !== "blocked" && Boolean(step.navigatorItem);
  return (
    <section
      className={`rounded-md border p-3 ${
        active ? "border-cyan-100/24 bg-cyan-100/[0.055]" : "border-white/9 bg-white/[0.026]"
      }`}
      data-atlas-workflow-step-id={step.id}
      data-atlas-workflow-step-status={step.status}
      data-relativity-guided-tour-step-id={step.relativityGuidedTourStepId}
      data-relativity-guided-tour-observable-id={step.relativityObservableId}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ui-instrument text-[9px] text-white/32">STEP {index}</span>
            <StatusPill status={step.status} />
            <span className="rounded border border-white/9 bg-white/[0.035] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-white/38">
              {step.expectedSurface}
            </span>
          </div>
          <h3 className="mt-1 text-[13px] font-medium text-white/86">{step.title}</h3>
          <p className="mt-1 text-[11px] leading-4 text-white/56">{step.target}</p>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={!runnable}
          className="flex h-8 w-full shrink-0 items-center justify-center gap-1.5 rounded-md border border-cyan-100/18 bg-cyan-100/[0.055] px-2.5 text-[10px] text-cyan-50/78 transition-colors hover:bg-cyan-100/[0.09] disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.025] disabled:text-white/28 sm:w-auto"
        >
          <Play className="h-3.5 w-3.5" />
          {runnable ? step.actionLabel : "Blocked"}
        </button>
      </div>
      <div className="mt-2 grid gap-2 text-[10px] leading-4 text-white/45 sm:grid-cols-2">
        <InfoBlock label="source" value={step.source} />
        <InfoBlock label="model" value={step.model} />
      </div>
      <div className="mt-2 text-[10px] leading-4 text-white/42">
        {step.blockedReason ?? step.boundary}
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: AtlasWorkflowStepStatus }) {
  const Icon = status === "ready" ? CheckCircle2 : CircleDashed;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] ${STATUS_CLASS[status]}`}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

function Stat({
  label,
  value,
  tone = "informational",
}: {
  label: string;
  value: string;
  tone?: AtlasWorkflowStepStatus;
}) {
  return (
    <div className="bg-black/18 px-2 py-2">
      <div className="text-[9px] uppercase tracking-[0.14em] text-white/32">{label}</div>
      <div
        className={`mt-0.5 truncate text-[11px] font-medium ${
          tone === "blocked" ? "text-amber-100" : tone === "ready" ? "text-emerald-100" : "text-white/76"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded border border-white/8 bg-black/12 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.13em] text-white/28">{label}</div>
      <div className="mt-0.5 break-words text-white/58">{value}</div>
    </div>
  );
}

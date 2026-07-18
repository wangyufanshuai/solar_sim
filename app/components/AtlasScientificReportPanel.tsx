"use client";

import {
  ClipboardCopy,
  Download,
  FileCode2,
  FileJson2,
  FileText,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  AtlasInstrumentActionButton,
  AtlasInstrumentHeader,
  AtlasInstrumentInfoBlock,
  AtlasInstrumentPanelShell,
  AtlasInstrumentStat,
  AtlasInstrumentStatStrip,
  useAtlasWorkbenchSurfaceAccessibility,
} from "./AtlasInstrumentUi";
import {
  ATLAS_REPORT_STUDIO_VERSION,
  ATLAS_SCIENTIFIC_REPORT_VERSION,
} from "../lib/atlasScientificReport";
import type {
  AtlasReportExportFormat,
  AtlasReportSectionId,
  AtlasReportStudioSummary,
  AtlasReportTemplateId,
  AtlasScientificReportSection,
  AtlasScientificReportSummary,
} from "../lib/simulationDiagnosticsTypes";

type AtlasScientificReportPanelProps = {
  open: boolean;
  summary: AtlasScientificReportSummary;
  studioSummary: AtlasReportStudioSummary;
  exportFormat: AtlasReportExportFormat;
  onTemplateChange: (templateId: AtlasReportTemplateId) => void;
  onSectionToggle: (sectionId: AtlasReportSectionId, enabled: boolean) => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onExportHtml: () => void;
  onCopySummary: () => void;
  onValidationConsoleOpen: () => void;
  onObservatoryDeckOpen: () => void;
  onClose: () => void;
};

export default function AtlasScientificReportPanel({
  open,
  summary,
  studioSummary,
  exportFormat,
  onTemplateChange,
  onSectionToggle,
  onExportMarkdown,
  onExportJson,
  onExportHtml,
  onCopySummary,
  onValidationConsoleOpen,
  onObservatoryDeckOpen,
  onClose,
}: AtlasScientificReportPanelProps) {
  const { closeWithFocusReturn, onSurfaceKeyDown } = useAtlasWorkbenchSurfaceAccessibility({
    open,
    surfaceId: "report-studio",
    onClose,
  });
  if (!open) return null;

  return (
    <AtlasInstrumentPanelShell
      kind="report-studio"
      accessibilitySurfaceId="report-studio"
      className="z-[107] overflow-hidden sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-14 sm:w-[53rem] sm:max-w-[calc(100vw-2rem)]"
      data-atlas-scientific-report-version={ATLAS_SCIENTIFIC_REPORT_VERSION}
      data-atlas-scientific-report-open="true"
      data-atlas-scientific-report-section-count={summary.sectionCount}
      data-atlas-scientific-report-export-format={exportFormat}
      data-atlas-report-studio-version={ATLAS_REPORT_STUDIO_VERSION}
      data-atlas-report-template-id={studioSummary.settings.templateId}
      data-atlas-report-included-section-count={studioSummary.includedSectionCount}
      data-atlas-report-export-format={exportFormat}
      aria-label="报告工作室"
      data-no-escape-clear
      onKeyDown={onSurfaceKeyDown}
    >
      <AtlasInstrumentHeader
        icon={<ScrollText className="h-3.5 w-3.5" />}
        title="报告工作室"
        subtitle="基于任务胶囊、证据账本、对象护照和流程的可打印证据档案"
        closeLabel="关闭报告工作室"
        onClose={closeWithFocusReturn}
      />

      <AtlasInstrumentStatStrip className="grid-cols-4">
        <AtlasInstrumentStat label="工作室" value="v29" />
        <AtlasInstrumentStat label="模板" value={studioSummary.selectedTemplate.title} />
        <AtlasInstrumentStat label="章节" value={`${studioSummary.includedSectionCount}/${studioSummary.totalSectionCount}`} />
        <AtlasInstrumentStat label="格式" value={exportFormat} tone="cyan" />
      </AtlasInstrumentStatStrip>

      <div className="border-b border-white/10 px-3 py-2">
        <div className="grid gap-2 sm:grid-cols-[1.1fr_0.9fr]">
          <section className="min-w-0">
            <div className="mb-1.5 text-[9px] uppercase tracking-[0.14em] text-white/32">
              模板
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
              {studioSummary.templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => onTemplateChange(template.id)}
                  className={`min-w-0 rounded-md border px-2 py-1.5 text-left text-[10px] leading-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-100/36 ${
                    studioSummary.settings.templateId === template.id
                      ? "border-cyan-100/28 bg-cyan-100/[0.09] text-cyan-50/88"
                      : "border-white/9 bg-white/[0.025] text-white/56 hover:border-cyan-100/18 hover:text-white/78"
                  }`}
                  aria-pressed={studioSummary.settings.templateId === template.id}
                >
                  <span className="block truncate">{template.title}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="min-w-0">
            <div className="mb-1.5 text-[9px] uppercase tracking-[0.14em] text-white/32">
              章节
            </div>
            <div className="grid max-h-24 grid-cols-2 gap-1.5 overflow-y-auto pr-1" role="region" aria-label="Report section selection" tabIndex={0}>
              {studioSummary.sectionToggles.map((toggle) => (
                <label
                  key={toggle.id}
                  data-atlas-report-section-toggle-id={toggle.id}
                  className="flex min-w-0 items-center gap-1.5 rounded-md border border-white/8 bg-black/12 px-2 py-1.5 text-[10px] text-white/56"
                >
                  <input
                    type="checkbox"
                    checked={toggle.enabled}
                    disabled={toggle.required}
                    onChange={(event) => onSectionToggle(toggle.id, event.currentTarget.checked)}
                    className="h-3 w-3 accent-cyan-200"
                  />
                  <span className="truncate">{toggle.label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="border-b border-white/10 px-3 py-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ReportActionButton
            label="导出 Markdown"
            icon={<FileText className="h-3.5 w-3.5" />}
            onClick={onExportMarkdown}
            action="export-markdown"
          />
          <ReportActionButton
            label="导出 JSON"
            icon={<FileJson2 className="h-3.5 w-3.5" />}
            onClick={onExportJson}
            action="export-json"
          />
          <ReportActionButton
            label="导出 HTML"
            icon={<FileCode2 className="h-3.5 w-3.5" />}
            onClick={onExportHtml}
            action="export-html"
          />
          <ReportActionButton
            label="复制摘要"
            icon={<ClipboardCopy className="h-3.5 w-3.5" />}
            onClick={onCopySummary}
            action="copy-summary"
          />
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
          data-atlas-validation-console-action="open"
          onClick={onValidationConsoleOpen}
          className="mt-2 w-full"
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
        >
          验证控制台
        </AtlasInstrumentActionButton>
      </div>

      <div
        className="max-h-[calc(100dvh-var(--ui-dock-height)-274px-env(safe-area-inset-bottom))] overflow-y-auto px-4 py-3 sm:max-h-[calc(100dvh-20rem)]"
        role="region"
        aria-label="Report preview"
        tabIndex={0}
      >
        <section className="rounded-md border border-cyan-100/12 bg-cyan-100/[0.04] p-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-100/14 bg-cyan-100/[0.06] text-cyan-50/76">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-white/90">{summary.title}</h2>
              <p className="mt-1 text-[11px] leading-4 text-white/58">
                {studioSummary.selectedTemplate.subtitle}
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-[10px] leading-4 text-white/48 sm:grid-cols-2">
            <InfoBlock label="created" value={summary.createdAt} />
            <InfoBlock label="mission capsule" value={summary.missionCapsuleVersion} />
            <InfoBlock label="selected evidence" value={summary.selectedEvidenceClaimId || "none"} />
            <InfoBlock label="selected target" value={summary.selectedObjectId || "none"} />
            <InfoBlock label="workflow" value={summary.selectedWorkflowId || "none"} />
            <InfoBlock label="Kerr Studio" value={`${summary.kerrLab.orbitPresetId}; ${summary.kerrLab.studioMode ?? "overview"}; b/M ${formatMetricNumber(summary.kerrLab.impactParameterM)}`} />
          </div>
        </section>

        <div className="mt-3 grid gap-3">
          {studioSummary.includedSections.map((section) => (
            <ReportSection key={section.id} section={section} />
          ))}
        </div>

        {studioSummary.excludedStateIncluded ? (
          <section className="mt-3 rounded-md border border-white/9 bg-white/[0.03] p-3">
            <h3 className="text-[10px] uppercase tracking-[0.13em] text-white/38">Excluded State</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {summary.excludedState.map((item) => (
                <span
                  key={item}
                  className="rounded border border-white/9 bg-black/14 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-white/46"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-4 text-white/52">
              Report Studio exports local UI/session and evidence provenance. It is not a PDF pipeline,
              simulation data archive, Horizons refresh, telemetry export, screenshot bundle, or scientific publication archive.
            </p>
          </section>
        ) : null}
      </div>
    </AtlasInstrumentPanelShell>
  );
}

function ReportSection({ section }: { section: AtlasScientificReportSection }) {
  return (
    <section
      className="rounded-md border border-white/9 bg-white/[0.028] p-3"
      data-atlas-scientific-report-section-id={section.id}
    >
      <h3 className="text-[10px] uppercase tracking-[0.13em] text-white/38">{section.title}</h3>
      <p className="mt-1 break-words text-[11px] leading-4 text-white/62">{section.body}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {section.metrics.map((metric) => (
          <InfoBlock
            key={metric.id}
            label={metric.label}
            value={[
              metric.value,
              metric.target ? `target ${metric.target}` : "",
              metric.tolerance ? `tolerance ${metric.tolerance}` : "",
            ].filter(Boolean).join(" / ")}
          />
        ))}
      </div>
    </section>
  );
}

function ReportActionButton({
  label,
  icon,
  onClick,
  action,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  action: "export-markdown" | "export-json" | "export-html" | "copy-summary";
}) {
  return (
    <AtlasInstrumentActionButton
      data-atlas-scientific-report-action={action}
      onClick={onClick}
      tone="quiet"
      icon={
        <>
          {action.startsWith("export-") ? (
            <Download className="hidden h-3.5 w-3.5 text-white/38 sm:block" />
          ) : null}
          {icon}
        </>
      }
    >
      {label}
    </AtlasInstrumentActionButton>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return <AtlasInstrumentInfoBlock label={label} value={value} />;
}

function formatMetricNumber(value: number): string {
  if (!Number.isFinite(value)) return "unavailable";
  return value.toLocaleString("en-US", { maximumFractionDigits: 3 });
}

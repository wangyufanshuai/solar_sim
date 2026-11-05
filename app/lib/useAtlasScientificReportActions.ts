"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type {
  AtlasReportExportFormat,
  AtlasReportSectionId,
  AtlasReportStudioSummary,
  AtlasReportTemplateId,
  AtlasScientificReportSummary,
} from "./simulationDiagnosticsTypes";
import { downloadText } from "./telemetryExport";

type Options = {
  reportSummary: AtlasScientificReportSummary;
  studioSummary: AtlasReportStudioSummary;
  setTemplateId: (templateId: AtlasReportTemplateId) => void;
  setIncludedSectionIds: Dispatch<SetStateAction<readonly AtlasReportSectionId[] | null>>;
  setExportFormat: Dispatch<SetStateAction<AtlasReportExportFormat>>;
};

const timestamp = () => new Date().toISOString().slice(0, 19).replace(/:/g, "-");

export function useAtlasScientificReportActions({
  reportSummary,
  studioSummary,
  setTemplateId,
  setIncludedSectionIds,
  setExportFormat,
}: Options) {
  const handleAtlasReportTemplateChange = useCallback((templateId: AtlasReportTemplateId) => {
    setTemplateId(templateId);
    setIncludedSectionIds(null);
  }, [setIncludedSectionIds, setTemplateId]);

  const handleAtlasReportSectionToggle = useCallback((
    sectionId: AtlasReportSectionId,
    enabled: boolean,
  ) => {
    setIncludedSectionIds(() => {
      const next = new Set(studioSummary.includedSectionIds);
      if (enabled) next.add(sectionId);
      else next.delete(sectionId);
      return Array.from(next);
    });
  }, [setIncludedSectionIds, studioSummary.includedSectionIds]);

  const handleExportScientificReportMarkdown = useCallback(async () => {
    setExportFormat("markdown");
    const { serializeAtlasScientificReportMarkdown } = await import("./atlasScientificReportExport");
    downloadText(
      `orbit-atlas-report-studio-v29-${timestamp()}.md`,
      serializeAtlasScientificReportMarkdown(reportSummary, studioSummary.settings),
      "text/markdown;charset=utf-8",
    );
  }, [reportSummary, setExportFormat, studioSummary.settings]);

  const handleExportScientificReportJson = useCallback(async () => {
    setExportFormat("json");
    const { serializeAtlasScientificReportJson } = await import("./atlasScientificReportExport");
    downloadText(
      `orbit-atlas-report-studio-v29-${timestamp()}.json`,
      serializeAtlasScientificReportJson(reportSummary, studioSummary.settings),
      "application/json;charset=utf-8",
    );
  }, [reportSummary, setExportFormat, studioSummary.settings]);

  const handleExportScientificReportHtml = useCallback(async () => {
    setExportFormat("html");
    const { serializeAtlasScientificReportHtml } = await import("./atlasScientificReportExport");
    downloadText(
      `orbit-atlas-report-studio-v29-${timestamp()}.html`,
      serializeAtlasScientificReportHtml(reportSummary, studioSummary.settings),
      "text/html;charset=utf-8",
    );
  }, [reportSummary, setExportFormat, studioSummary.settings]);

  const handleCopyScientificReportSummary = useCallback(async () => {
    setExportFormat("markdown");
    const { serializeAtlasScientificReportMarkdown } = await import("./atlasScientificReportExport");
    void navigator.clipboard
      ?.writeText(serializeAtlasScientificReportMarkdown(reportSummary, studioSummary.settings))
      .catch(() => undefined);
  }, [reportSummary, setExportFormat, studioSummary.settings]);

  return {
    handleAtlasReportTemplateChange,
    handleAtlasReportSectionToggle,
    handleExportScientificReportMarkdown,
    handleExportScientificReportJson,
    handleExportScientificReportHtml,
    handleCopyScientificReportSummary,
  };
}

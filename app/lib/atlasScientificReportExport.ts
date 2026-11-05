import type {
  AtlasReportStudioSettings,
  AtlasScientificReportSummary,
} from "./simulationDiagnosticsTypes";
import {
  ATLAS_REPORT_STUDIO_VERSION,
  includedSectionsFor,
  normalizeReportStudioSettings,
  templateById,
} from "./atlasScientificReport";

function serializableReport(
  summary: AtlasScientificReportSummary,
  settings?: Partial<AtlasReportStudioSettings> | null,
): AtlasScientificReportSummary {
  if (!settings) return summary;
  const normalized = normalizeReportStudioSettings(settings, summary.sections);
  const sections = includedSectionsFor(summary.sections, normalized.includedSectionIds);
  return {
    ...summary,
    sectionCount: sections.length,
    sections,
    excludedState: normalized.includedSectionIds.includes("excluded-state")
      ? summary.excludedState
      : [],
    reportStudioVersion: ATLAS_REPORT_STUDIO_VERSION,
    templateId: normalized.templateId,
    includedSectionIds: normalized.includedSectionIds,
  };
}

export function serializeAtlasScientificReportJson(
  summary: AtlasScientificReportSummary,
  settings?: Partial<AtlasReportStudioSettings> | null,
): string {
  return JSON.stringify(serializableReport(summary, settings), null, 2);
}

export function serializeAtlasScientificReportMarkdown(
  summary: AtlasScientificReportSummary,
  settings?: Partial<AtlasReportStudioSettings> | null,
): string {
  const normalized = settings
    ? normalizeReportStudioSettings(settings, summary.sections)
    : null;
  const serializable = serializableReport(summary, settings);
  const excludedStateIncluded =
    !normalized || normalized.includedSectionIds.includes("excluded-state");
  const lines = [
    `# ${serializable.title}`,
    "",
    serializable.subtitle,
    "",
    `- Version: ${serializable.version}`,
    `- Report studio: ${serializable.reportStudioVersion ?? "none"}`,
    `- Template: ${serializable.templateId ?? "none"}`,
    `- Created: ${serializable.createdAt}`,
    `- Evidence claims: ${serializable.evidenceClaimCount} (${serializable.readyEvidenceCount} ready, ${serializable.failedEvidenceCount} failed)`,
    `- Mission capsule: ${serializable.missionCapsuleVersion}; active ${serializable.missionCapsuleActive ? "yes" : "no"}; warnings ${serializable.missionCapsuleWarningCount}`,
    `- Selected evidence: ${serializable.selectedEvidenceClaimId || "none"}`,
    `- Selected object: ${serializable.selectedObjectId || "none"}`,
    `- Selected workflow: ${serializable.selectedWorkflowId || "none"}`,
    "",
  ];

  for (const section of serializable.sections) {
    lines.push(`## ${section.title}`, "", section.body, "");
    for (const item of section.metrics) lines.push(`- ${item.label}: ${item.value}`);
    lines.push("");
  }

  if (excludedStateIncluded) {
    lines.push(
      "## Excluded state",
      "",
      ...summary.excludedState.map((item) => `- ${item}`),
      "",
      "This report is UI/session and evidence provenance. It is not a simulation data archive, Horizons refresh, telemetry export, or scientific publication archive.",
      "",
    );
  }
  return lines.join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatNumber(value: number, digits: number): string {
  if (!Number.isFinite(value)) return "unavailable";
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function htmlExcludedState(excludedState: readonly string[]): readonly string[] {
  return excludedState.map((item) => {
    switch (item) {
      case "live physics buffers": return "live simulation state arrays";
      case "SharedArrayBuffer state": return "shared-memory runtime state";
      case "ephemeris arrays": return "bulk ephemeris data";
      case "telemetry samples": return "raw time-series diagnostics";
      case "screenshots": return "image capture artifacts";
      case "large catalog rows": return "large raw catalog tables";
      default: return item;
    }
  });
}

export function serializeAtlasScientificReportHtml(
  summary: AtlasScientificReportSummary,
  settings?: Partial<AtlasReportStudioSettings> | null,
): string {
  const normalized = normalizeReportStudioSettings(settings, summary.sections);
  const serializable = serializableReport(summary, normalized);
  const selectedTemplate = templateById(normalized.templateId);
  const sectionsHtml = serializable.sections.map((sectionItem) => {
    const metrics = sectionItem.metrics
      .map((item) => `<li><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.value)}</span></li>`)
      .join("");
    return `<section class="section" data-section-id="${escapeHtml(sectionItem.id)}"><h2>${escapeHtml(sectionItem.title)}</h2><p>${escapeHtml(sectionItem.body)}</p><ul class="metrics">${metrics}</ul></section>`;
  }).join("");
  const excludedHtml = normalized.includedSectionIds.includes("excluded-state")
    ? `<section class="section" data-section-id="excluded-state"><h2>Excluded state</h2><p>This printable dossier records UI/session and evidence provenance only. It omits raw runtime data and image capture artifacts.</p><ul class="metrics">${htmlExcludedState(summary.excludedState).map((item) => `<li><strong>Excluded</strong><span>${escapeHtml(item)}</span></li>`).join("")}</ul></section>`
    : "";
  return [
    "<!doctype html>", `<html lang="en"><head><meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${escapeHtml(serializable.title)} - ${escapeHtml(selectedTemplate.title)}</title>`,
    "<style>body{margin:0;background:#f6f8fb;color:#101820;font-family:Inter,Arial,sans-serif;line-height:1.5}main{max-width:920px;margin:0 auto;padding:42px 28px 56px}.cover{border:1px solid #cfd8e3;background:#fff;padding:28px}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#526173}.meta,.metrics{display:grid;gap:8px;margin:18px 0 0;padding:0;list-style:none}.meta{grid-template-columns:repeat(2,minmax(0,1fr))}.meta li,.metrics li{border:1px solid #d9e1ea;background:#fbfdff;padding:8px 10px}.metrics li{display:grid;grid-template-columns:minmax(120px,.35fr) minmax(0,1fr);gap:10px}.section{margin-top:18px;border:1px solid #d9e1ea;background:#fff;padding:22px;break-inside:avoid}.boundary{color:#394657}.footer{margin-top:22px;font-size:12px;color:#526173}@media print{body{background:#fff}main{padding:0}.section,.cover{box-shadow:none}}@media(max-width:640px){main{padding:22px 14px}.meta{grid-template-columns:1fr}.metrics li{grid-template-columns:1fr}}</style></head><body><main>",
    `<section class="cover"><div class="eyebrow">Orbit Atlas Report Studio / ${escapeHtml(ATLAS_REPORT_STUDIO_VERSION)}</div><h1>${escapeHtml(serializable.title)}</h1><p>${escapeHtml(serializable.subtitle)}</p><ul class="meta">`,
    `<li><strong>Template</strong><br>${escapeHtml(selectedTemplate.id)} - ${escapeHtml(selectedTemplate.title)}</li>`,
    `<li><strong>Created</strong><br>${escapeHtml(serializable.createdAt)}</li>`,
    `<li><strong>Evidence claims</strong><br>${serializable.evidenceClaimCount} total / ${serializable.readyEvidenceCount} ready / ${serializable.failedEvidenceCount} failed</li>`,
    `<li><strong>Kerr Studio</strong><br>${escapeHtml(serializable.kerrLab.orbitPresetId)}; mode ${escapeHtml(serializable.kerrLab.studioMode ?? "overview")}; b/M ${escapeHtml(formatNumber(serializable.kerrLab.impactParameterM, 3))}; spin ${escapeHtml(formatNumber(serializable.kerrLab.spinA, 3))}</li></ul></section>`,
    sectionsHtml,
    excludedHtml,
    `<p class="footer boundary">This is a local printable evidence dossier. It is not a PDF pipeline, not a Horizons refresh, not a telemetry export, and not a scientific publication archive.</p></main></body></html>`,
  ].join("");
}

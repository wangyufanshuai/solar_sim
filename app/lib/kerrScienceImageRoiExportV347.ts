"use client";
import { acquireAtlasResource } from "./atlasResourceLifecycle";
import { serializeKerrScienceImageRoiCsvV347, serializeKerrScienceImageRoiJsonV347, type KerrScienceImageRoiSummaryV347 } from "./kerrScienceImageRoiV347";

export type KerrScienceImageRoiExportFormatV347 = "json" | "csv";
export type AcquiredKerrScienceImageRoiExportV347 = Readonly<{ format: KerrScienceImageRoiExportFormatV347; filename: string; objectUrl: string; bytes: number; release: () => void }>;
export function acquireKerrScienceImageRoiExportV347(summary: KerrScienceImageRoiSummaryV347, probeArtifactSha256: string, format: KerrScienceImageRoiExportFormatV347): AcquiredKerrScienceImageRoiExportV347 {
  const content = format === "json" ? serializeKerrScienceImageRoiJsonV347(summary, probeArtifactSha256) : serializeKerrScienceImageRoiCsvV347(summary, probeArtifactSha256); const mimeType = format === "json" ? "application/json" : "text/csv;charset=utf-8"; const blob = new Blob([content], { type: mimeType }); const objectUrl = URL.createObjectURL(blob); const filename = `orbit-atlas-${summary.roiId.replaceAll(":", "-")}-v347.${format}`;
  const releaseRegistry = acquireAtlasResource("object-url", "relativity-lab", `v347:roi-export:${format}`, { owner: "v347-science-image-roi", estimatedBytes: blob.size, contentSha256: probeArtifactSha256, manifestSha256: probeArtifactSha256 }); let released = false;
  return Object.freeze({ format, filename, objectUrl, bytes: blob.size, release: () => { if (released) return; released = true; URL.revokeObjectURL(objectUrl); releaseRegistry(); } });
}

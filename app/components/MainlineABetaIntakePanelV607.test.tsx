import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MAINLINE_A_BETA_INTAKE_QUEUE, summarizeMainlineABetaIntakeV607 } from "../data/mainlineABetaAssetIntakeV607";

const source = readFileSync(new URL("./MainlineABetaIntakePanelV607.tsx", import.meta.url), "utf8");

describe("Mainline A Beta intake panel source contract", () => {
  it("mounts the dedicated queue panel and keeps it client-side", () => {
    expect(source.startsWith('"use client";')).toBe(true);
    expect(source).toContain("export default function MainlineABetaIntakePanelV607");
    expect(source).toContain("MAINLINE_A_BETA_INTAKE_QUEUE");
  });

  it("renders a visible admission summary and fail-closed language", () => {
    expect(source).toContain("data-mainline-a-beta-intake-panel");
    expect(source).toContain("data-mainline-a-beta-intake-blocked");
    expect(source).toContain("data-mainline-a-beta-intake-admitted");
    expect(source).toContain("fail-closed");
    expect(source).toContain("Source snapshots, per-image rights and local manifests are required");
  });

  it("exposes deterministic search and filter controls", () => {
    expect(source).toContain("data-mainline-a-beta-intake-search");
    expect(source).toContain("data-mainline-a-beta-intake-filter={option.id}");
    expect(source).toContain("data-mainline-a-beta-intake-results={records.length}");
    expect(source).toContain("no records match this filter");
    expect(source).toContain("role=\"tablist\"");
  });

  it("renders every record with kind, status, admission, and blocker markers", () => {
    expect(source).toContain("data-mainline-a-beta-intake-row={record.id}");
    expect(source).toContain("data-mainline-a-beta-kind={record.kind}");
    expect(source).toContain("data-mainline-a-beta-status={record.status}");
    expect(source).toContain("data-mainline-a-beta-admission={record.admission}");
    expect(source).toContain("data-mainline-a-beta-blocker={record.id}");
  });

  it("keeps the runtime projection separate from the 24-record queue", () => {
    const summary = summarizeMainlineABetaIntakeV607(MAINLINE_A_BETA_INTAKE_QUEUE);
    expect(summary.total).toBe(16);
    expect(summary.admitted).toBe(0);
    expect(summary.blocked).toBe(16);
    expect(MAINLINE_A_BETA_INTAKE_QUEUE.every((record) => record.admission === "not-admitted")).toBe(true);
  });

  it("does not expose measurement write-back or a source admission shortcut", () => {
    expect(source).toContain("Presentation models never write back measurements");
    expect(source).not.toContain("measurementAdmission = \"admitted\"");
    expect(source).not.toContain("force-admit");
  });

  it("keeps panel dimensions bounded for narrow viewports", () => {
    expect(source).toContain("w-[min(360px,calc(100vw-24px))]");
    expect(source).toContain("max-h-[42dvh]");
    expect(source).toContain("min-w-0");
    expect(source).toContain("overflow-y-auto");
  });

  it("keeps every status label explicit", () => {
    for (const label of ["awaiting source", "source captured", "rights review", "rights cleared", "runtime admitted"]) {
      expect(source).toContain(label);
    }
  });

  it("uses a stable row key and no array index key", () => {
    expect(source).toContain("key={record.id}");
    expect(source).not.toContain("key={index}");
  });
});

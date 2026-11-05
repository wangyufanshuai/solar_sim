import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Panel, { canonicalObservationTargetV635, observationHistorySummaryV635, formatObservationBytesV633, observationExportV633, resourceOwnerChangesV633 } from "./MainlineAResourceObservationPanelV633";
import type { MainlineAResourceObservationV633 } from "../lib/mainlineAResourceObservationV633";
import { acquireAtlasResource, getAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import { createCanonicalRuntimeRegistryV635, CANONICAL_COVERAGE_SHA256_V635 } from "../lib/mainlineACanonicalRuntimeV635";
import { createMainlineALifecycleSessionV633 } from "../lib/mainlineALifecycleSessionV633";

describe("resource observation panel", () => {
  it("renders safe idle controls with no invented observation", () => {
    vi.stubGlobal("React", React);
    try {
      const html = renderToStaticMarkup(createElement(Panel));
      expect(html).toContain('data-observation-state="idle"');
      expect(html).toContain("30 分钟 · 持续观察");
      expect(html).toContain("同场景 canonical 对象往返");
      expect(html).not.toContain('data-resource-observation-result="measured-local"');
      expect(html).not.toContain("<textarea");
      expect(html).toMatch(/<button[^>]+disabled=""[^>]*>记录加载后/);
      expect(html).toMatch(/<button[^>]+disabled=""[^>]*>完成并校验/);
      expect(html).toMatch(/<button[^>]+disabled=""[^>]*>中止并保留/);
    } finally { vi.unstubAllGlobals(); }
  });

  it("selects canonical identities without admitting beta-only or invented targets", () => {
    expect(canonicalObservationTargetV635("star:achernar")).toMatchObject({ id: "achernar", kind: "star", route: "mainline-a-stellar-parametric", assetHash: null });
    expect(canonicalObservationTargetV635("star:invented")).toBeNull();
    expect(canonicalObservationTargetV635("nebula:achernar")).toBeNull();
  });

  it("never counts a duration label or fixture summary as a successful observation", () => {
    expect(observationHistorySummaryV635([])).toEqual({ observedObjects: 0, blocked: 0, longRuns: 0 });
    const raw = { schema: "mainline-a-resource-observation-v633", runId: "fixture", session: { requestedDurationMs: 1_800_000 }, checkpoints: [] } as unknown as MainlineAResourceObservationV633;
    expect(observationHistorySummaryV635([raw])).toEqual({ observedObjects: 0, blocked: 1, longRuns: 0 });
  });

  it("reopens the displayed target after a later failed or cancelled attempt and closes it only after a new successful cycle", () => {
    const releaseBaseline = acquireAtlasResource("subscription", "atlas", "panel-static-baseline", { owner: "panel-static-test", estimatedBytes: 32 });
    try {
    let now = 0;
    const clock = () => new Date(Date.UTC(2026, 8, 27) + now).toISOString();
    const registry = createCanonicalRuntimeRegistryV635(clock);
    const build = { buildId: "static-panel-test", branch: "codex/test", head: "a".repeat(40) };
    const viewport = { width: 1280, height: 720, devicePixelRatio: 1, device: "desktop" as const };
    const target = canonicalObservationTargetV635("star:achernar")!;
    const observation = (abort: boolean, index: number) => {
      registry.publish(null);
      const start = now;
      const session = createMainlineALifecycleSessionV633({
        runId: `static-panel-test-${index}`, build, viewport, durationMs: 30_000,
        mode: "canonical-object", canonicalTarget: target, canonicalManifestDigest: CANONICAL_COVERAGE_SHA256_V635,
        dependencies: { clock: () => now, isoNow: clock, resources: getAtlasResourceSnapshot, scene: () => "atlas",
          visible: () => true, heap: () => null, build: () => build, viewport: () => viewport, canonical: registry.read },
      });
      session.pushFrame(now);
      now += 1000;
      registry.publish({ ...target, loading: "ready", error: null });
      session.pushFrame(now);
      expect(session.markActive()).toBe(true);
      now = start + 30_000;
      registry.publish(null);
      session.pushFrame(now);
      return abort ? session.abort("static-test-cancelled") : session.finish();
    };
    const passed = observation(false, 1);
    expect(observationHistorySummaryV635([passed]).observedObjects).toBe(1);
    const cancelled = observation(true, 2);
    expect(observationHistorySummaryV635([passed, cancelled])).toMatchObject({ observedObjects: 0, blocked: 1 });
    const retried = observation(false, 3);
    expect(observationHistorySummaryV635([passed, cancelled, retried])).toMatchObject({ observedObjects: 1, blocked: 1 });
    const wrongBinding = structuredClone(retried);
    wrongBinding.objectCycle!.target.route = "changed-route";
    expect(observationHistorySummaryV635([passed, wrongBinding]).observedObjects).toBe(0);
    } finally { releaseBaseline(); }
  });

  it("exports raw fields without rewriting blocked or unknown evidence", () => {
    const blocked = { runId: "blocked-example", boundary: { scientificPayloadWriteback: false }, session: { issues: ["document-hidden"] }, checkpoints: [] } as unknown as MainlineAResourceObservationV633;
    expect(JSON.parse(observationExportV633(blocked))).toEqual(blocked);
    expect(observationExportV633(blocked)).not.toContain("measured-local");
  });

  it("bounds export by UTF-8 bytes rather than character count", () => {
    const huge = { runId: "界".repeat(800_000) } as MainlineAResourceObservationV633;
    expect(() => observationExportV633(huge)).toThrow("2 MiB");
  });

  it("preserves nested resource identities and unicode labels exactly", () => {
    const raw = { checkpoints: [{ snapshot: { byIdentity: { "银河": { owner: "星云", count: 2, contentSha256: null } } } }], session: { issues: [] } } as unknown as MainlineAResourceObservationV633;
    expect(JSON.parse(observationExportV633(raw))).toEqual(raw);
  });

  it("does not display nonfinite or negative memory as a measured value", () => {
    expect(formatObservationBytesV633(NaN)).toBe("不可用");
    expect(formatObservationBytesV633(Infinity)).toBe("不可用");
    expect(formatObservationBytesV633(-1)).toBe("不可用");
    expect(formatObservationBytesV633(0)).toBe("0 B");
    expect(formatObservationBytesV633(1024)).toBe("1.0 KiB");
    expect(formatObservationBytesV633(2 ** 20)).toBe("1.00 MiB");
  });

  it("reports acquired-and-returned owners separately from retained owners", () => {
    const observation = { checkpoints: [
      { phase: "baseline", snapshot: { byOwner: { core: { count: 1, estimatedBytes: 32 } } } },
      { phase: "active", snapshot: { byOwner: { core: { count: 1, estimatedBytes: 32 }, texture: { count: 2, estimatedBytes: 64 }, leaked: { count: 1, estimatedBytes: 128 } } } },
      { phase: "returned", snapshot: { byOwner: { core: { count: 1, estimatedBytes: 32 }, leaked: { count: 1, estimatedBytes: 128 } } } },
    ] } as unknown as MainlineAResourceObservationV633;
    const rows = resourceOwnerChangesV633(observation);
    expect(rows.find((row) => row.owner === "core")).toMatchObject({ changed: false, restored: true });
    expect(rows.find((row) => row.owner === "texture")).toMatchObject({ before: 0, active: 2, after: 0, bytesDelta: 0, restored: true });
    expect(rows.find((row) => row.owner === "leaked")).toMatchObject({ after: 1, bytesDelta: 128, restored: false });
    expect(resourceOwnerChangesV633({ checkpoints: [] } as unknown as MainlineAResourceObservationV633)).toEqual([]);
  });
});

import { readFileSync } from "node:fs";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import panel from "./MainlineAPerformancePanelV625";
import { acquireAtlasResource, getAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import { createMainlineALifecycleSessionV633 } from "../lib/mainlineALifecycleSessionV633";
import { evaluateMainlineAResourceObservationV633 } from "../lib/mainlineAResourceObservationV633";

const source = readFileSync("app/components/MainlineAPerformancePanelV625.tsx", "utf8");

describe("Mainline A V625 runtime observation export", () => {
  it("keeps the panel candidate-only and exposes a stable run marker", () => {
    expect(panel).toBeTypeOf("function");
    expect(source).toContain('data-mainline-a-performance="v625"');
    expect(source).toContain('data-mainline-a-performance-scientific-payload-writeback="false"');
    expect(source).toContain("data-mainline-a-performance-run={run.runId}");
    expect(source).toContain("selectMainlineAPerformanceIdentityRootV625");
  });

  it("exposes re-computable timing, frame, memory, visibility and lifecycle fields", () => {
    const requiredMarkers = [
      "data-started-at={run.startedAt}",
      "data-ended-at={run.endedAt ?? \"\"}",
      "data-duration-ms={run.durationMs}",
      "data-frame-samples={run.frame.sampleCount}",
      "data-frame-p95-ms={run.frame.p95Ms ?? \"\"}",
      "data-heap-used-bytes={run.memory.jsHeapUsedBytes ?? \"\"}",
      "data-resource-before={run.resources.before.identityDigest}",
      "data-resource-after={run.resources.after.identityDigest}",
      "data-resource-diff-total={run.resources.diff.total}",
      "data-resource-repeated-index={run.resources.repeatedRunIndex}",
      "data-document-visibility={run.visibility.documentVisibility}",
      "data-canvas-count={run.visibility.canvasCount}",
      "data-console-errors={run.consoleErrors}",
      "data-page-errors={run.pageErrors}",
    ];
    for (const marker of requiredMarkers) expect(source).toContain(marker);
  });

  it("keeps evidence labels bounded to browser runtime observation", () => {
    expect(source).toContain("browser-runtime-observation");
    expect(source).toContain("physical mobile");
    expect(source).toContain("真实用户性能");
    expect(source).toContain("screenshots/tests are separate evidence classes");
  });
});

describe("observation docking structure and session continuity; no browser or React mount claim", () => {
  const parsed = ts.createSourceFile("panel.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  it("renders an accessible restore control and a mounted resource child in the expanded layout", () => {
    vi.stubGlobal("React", React);
    try {
      const html = renderToStaticMarkup(createElement(panel, { onClose: () => undefined }));
      expect(html).toContain('data-mainline-a-performance-docked="false"');
      expect(html).toContain('aria-label="展开性能观察面板"');
      expect(html).toContain("收起以选择对象");
      expect(html).toContain('data-mainline-a-resource-observation="v633"');
      expect(html).toContain("不改变窗口尺寸");
    } finally { vi.unstubAllGlobals(); }
  });

  it("hides a stable ancestor instead of conditionally mounting the resource observer", () => {
    const children: ts.JsxSelfClosingElement[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(parsed) === "MainlineAResourceObservationPanelV633") children.push(node);
      ts.forEachChild(node, visit);
    };
    visit(parsed);
    expect(children).toHaveLength(1);
    let ancestor: ts.Node | undefined = children[0].parent;
    let hiddenAncestor = false;
    while (ancestor && !ts.isReturnStatement(ancestor)) {
      expect(ts.isConditionalExpression(ancestor)).toBe(false);
      expect(ts.isBinaryExpression(ancestor)).toBe(false);
      if (ts.isJsxElement(ancestor)) {
        hiddenAncestor ||= ancestor.openingElement.attributes.properties.some((prop) =>
          ts.isJsxAttribute(prop) && prop.name.getText(parsed) === "hidden"
          && prop.initializer?.getText(parsed) === "{docked}");
      }
      ancestor = ancestor.parent;
    }
    expect(hiddenAncestor).toBe(true);
  });

  it("keeps docking independent of stop, viewport, scene and scientific controls", () => {
    const callbacks: string[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isArrowFunction(node) && node.body.getText(parsed).startsWith("setDocked(")) callbacks.push(node.body.getText(parsed));
      ts.forEachChild(node, visit);
    };
    visit(parsed);
    expect(callbacks).toEqual(["setDocked(false)", "setDocked(true)"]);
    expect(source).toContain("pointer-events-auto shrink-0 max-w-full");
  });

  it("renders the compact entry with the solver's complete dimensions and accessible name", () => {
    vi.stubGlobal("React", React);
    try {
      const html = renderToStaticMarkup(createElement(panel, { onClose: () => undefined, dockedMode: "compact" }));
      expect(html).toContain('data-mainline-a-performance-restore-mode="compact"');
      expect(html).toContain('style="width:76px;height:28px"');
      expect(html).toContain('aria-label="展开性能观察面板"');
      expect(html).toContain('data-mainline-a-resource-observation="v633"');
    } finally { vi.unstubAllGlobals(); }
  });

  it("keeps the existing controller sampling while view-only transitions leave the document visible", () => {
    let now = 0;
    let scene = "atlas";
    const build = { buildId: "test-only-docking", branch: "codex/test", head: "a".repeat(40) };
    const viewport = { width: 375, height: 812, devicePixelRatio: 2, device: "mobile-simulated" as const };
    const session = createMainlineALifecycleSessionV633({
      runId: "test-only-docking-continuity", build, viewport, durationMs: 30_000,
      dependencies: {
        clock: () => now, isoNow: () => new Date(Date.UTC(2026, 8, 27) + now).toISOString(),
        resources: getAtlasResourceSnapshot, scene: () => scene, visible: () => true,
        heap: () => null, build: () => build, viewport: () => viewport,
      },
    });
    const release = acquireAtlasResource("texture", "atlas", "test-only-docking", { owner: "test-only-docking", estimatedBytes: 16 });
    try {
      session.pushFrame(0);
      now = 1000;
      scene = "inspect";
      expect(session.markActive()).toBe(true);
      // No browser is involved: the source checks above establish that docking
      // invokes only setDocked, while this tests the real retained controller.
      for (now = 1000; now <= 30_000; now += 1000) {
        session.observeBinding();
        session.observeVisibility();
        session.pushFrame(now);
      }
      now = 30_000;
      expect(session.state()).toBe("running");
      expect(session.snapshot().frameCount).toBe(30);
      expect(session.snapshot().activeCaptured).toBe(true);
      scene = "atlas";
      release();
      const observation = session.finish();
      expect(observation.runId).toBe("test-only-docking-continuity");
      expect(observation.session.issues).toEqual([]);
      expect(evaluateMainlineAResourceObservationV633(observation)).toMatchObject({
        status: "measured-local", baselineRestored: true, retainedCount: 0,
      });
    } finally { release(); }
  });
});

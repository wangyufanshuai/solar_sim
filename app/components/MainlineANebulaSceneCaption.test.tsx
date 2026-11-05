import { createElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import MainlineANebulaSceneCaption from "./MainlineANebulaSceneCaption";
import { createNebulaLoadAttemptV638, NebulaLoadErrorV638, transitionNebulaLoadAttemptV638 } from "../lib/mainlineANebulaLoadV638";

const start = "2026-10-14T00:00:00.000Z";
const at = "2026-10-14T00:00:01.000Z";
const asset = { objectId: "m42", bands: ["optical"], credit: "NASA, ESA and the Hubble Heritage Team", sourcePage: "https://example.test/m42", licenseUrl: "https://example.test/license", license: "source-declared license" };
const initial = createNebulaLoadAttemptV638(1, start);
const decoded = transitionNebulaLoadAttemptV638(initial, { type: "decoded", attempt: 1, at });
const ready = transitionNebulaLoadAttemptV638(decoded, { type: "rendered", attempt: 1, at });
const base = { asset, title: "猎户座大星云", attempt: ready, expanded: false, onToggle: vi.fn(), onCancel: vi.fn(), onRetry: vi.fn() };
const markup = (changes: Partial<typeof base> = {}) => renderToStaticMarkup(createElement(MainlineANebulaSceneCaption, { ...base, ...changes }));

describe("nebula disclosure content and available loading controls", () => {
  it("offers image inspection only after a verified image has actually drawn", () => {
    const onOpenViewer = vi.fn();
    const inspection = (attempt: typeof ready, canOpenViewer: boolean) => renderToStaticMarkup(createElement(MainlineANebulaSceneCaption, { ...base, attempt, canOpenViewer, onOpenViewer }));
    expect(inspection(ready, true)).toMatch(/aria-label="放大观测图"(?![^>]*disabled)/);
    for (const attempt of [initial, decoded]) {
      expect(inspection(attempt, true)).toMatch(/aria-label="放大观测图"[^>]*disabled/);
    }
    expect(inspection(ready, false)).toMatch(/aria-label="放大观测图"[^>]*disabled/);
    expect(inspection(ready, true)).toContain("这张图聚焦猎户座星云的中心区域");
  });
  it("keeps title, 2D, pending rights and the official source outside collapsed details", () => {
    const html = markup();
    const summary = html.slice(0, html.indexOf('id="mainline-a-nebula-caption-m42"'));
    expect(summary).toContain("猎户座大星云");
    expect(summary).toContain(">2D<");
    expect(summary).toContain("版权待审");
    expect(summary).toContain('href="https://example.test/m42"');
    expect(summary).toContain('aria-label="官方来源与完整图像"');
    expect(summary).toContain('aria-expanded="false"');
    expect(html).toMatch(/id="mainline-a-nebula-caption-m42" hidden=""/);
    expect(html).toContain(asset.credit);
  });

  it("exposes complete credit, licensing and 2D limits when expanded without changing provenance", () => {
    const html = markup({ expanded: true });
    expect(html).not.toMatch(/id="mainline-a-nebula-caption-m42" hidden/);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('data-mainline-a-scene-image-credit="true"');
    expect(html).toContain(asset.credit);
    expect(html).toContain('href="https://example.test/license"');
    expect(html).toContain("不表示三维深度、目录角径或肉眼色彩");
    expect(html).toContain("逐图版权签署仍待完成");
  });

  it.each([initial, decoded])("leaves cancellation reachable while $status even with details closed", (attempt) => {
    const html = markup({ attempt });
    expect(html.indexOf("取消加载观测图")).toBeLessThan(html.indexOf('id="mainline-a-nebula-caption-m42"'));
    expect(html).not.toContain("重试加载观测图");
    expect(html).toContain('role="status" aria-live="polite"');
  });

  it.each([
    transitionNebulaLoadAttemptV638(initial, { type: "cancelled", attempt: 1, at }),
    transitionNebulaLoadAttemptV638(initial, { type: "failed", attempt: 1, at, error: new NebulaLoadErrorV638("http", "request", "http:404", 404) }),
  ])("keeps retry and real error state visible after $status", (attempt) => {
    const html = markup({ attempt });
    expect(html.indexOf("重试加载观测图")).toBeLessThan(html.indexOf('id="mainline-a-nebula-caption-m42"'));
    expect(html).not.toContain("取消加载观测图");
    expect(html).not.toContain("本地观测图已绘制");
    if (attempt.status === "failed") expect(html).toContain("HTTP 404");
  });

  it("routes disclosure, cancellation and retry to distinct callbacks", () => {
    const onToggle = vi.fn(); const onCancel = vi.fn(); const onRetry = vi.fn();
    const buttons = (node: ReactNode): ReactElement<Record<string, unknown>>[] => {
      if (Array.isArray(node)) return node.flatMap(buttons);
      if (!node || typeof node !== "object" || !("props" in node)) return [];
      const element = node as ReactElement<{ children?: ReactNode }>;
      return [...(element.type === "button" ? [element as ReactElement<Record<string, unknown>>] : []), ...buttons(element.props.children)];
    };
    const pending = MainlineANebulaSceneCaption({ ...base, attempt: initial, onToggle, onCancel, onRetry });
    const pendingButtons = buttons(pending);
    (pendingButtons[0].props.onClick as () => void)();
    expect(onToggle).toHaveBeenCalledTimes(1); expect(onCancel).not.toHaveBeenCalled(); expect(onRetry).not.toHaveBeenCalled();
    (pendingButtons[1].props.onClick as () => void)();
    expect(onCancel).toHaveBeenCalledTimes(1); expect(onRetry).not.toHaveBeenCalled();
    const cancelled = transitionNebulaLoadAttemptV638(initial, { type: "cancelled", attempt: 1, at });
    (buttons(MainlineANebulaSceneCaption({ ...base, attempt: cancelled, onToggle, onCancel, onRetry }))[1].props.onClick as () => void)();
    expect(onRetry).toHaveBeenCalledTimes(1); expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

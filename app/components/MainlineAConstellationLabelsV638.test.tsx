import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ConstellationLabels from "./ConstellationLabels";
import CelestialCatalogLabels from "./CelestialCatalogLabels";
import { createFloatingOrigin } from "../lib/floatingOrigin";

vi.mock("@react-three/fiber", () => ({
  useFrame: () => undefined,
  useThree: (selector: (state: { size: { width: number; height: number } }) => unknown) => selector({ size: { width: 1280, height: 720 } }),
}));
vi.mock("../lib/v594CdpSoakSurface", () => ({
  PostV594CdpSoakHtml: ({ children, distanceFactor }: { children: ReactNode; distanceFactor?: number }) => createElement("div", {
    "data-test-label-scale": distanceFactor ?? "css-pixels",
  }, children),
}));

describe("selected constellation label ownership", () => {
  it("uses one fixed-pixel title and explicit member names for Cyg", () => {
    const html = renderToStaticMarkup(createElement(ConstellationLabels, { enabled: true, selectedCatalogId: "constellation:Cyg", closeupSuppressed: true }));
    expect((html.match(/data-constellation-label-selected="true"/g) ?? [])).toHaveLength(1);
    expect((html.match(/data-mainline-a-constellation-anchor-label=/g) ?? [])).toHaveLength(5);
    expect(html).toContain('data-mainline-a-constellation-anchor-label="sadr"');
    expect(html).not.toContain('data-mainline-a-constellation-anchor-label="vega"');
    expect(html).not.toContain('data-test-label-scale="8"');
    expect(html).toContain("font-size:14px");
    expect(html).toContain("font-size:12px");
  });

  it("suppresses the second selected constellation title while preserving star labels", () => {
    const floatingOriginRef = { current: createFloatingOrigin() };
    floatingOriginRef.current.lodTier = "far";
    const shared = { floatingOriginRef, enabled: true, orbitAtlas: true, labelBudget: 20 };
    const selectedFigure = renderToStaticMarkup(createElement(CelestialCatalogLabels, { ...shared, selectedCatalogId: "constellation:Cyg" }));
    expect(selectedFigure).not.toContain('data-deep-sky-label-id="constellation:Cyg"');
    expect(selectedFigure).not.toContain('data-deep-sky-label-kind="constellation"');
    const selectedStar = renderToStaticMarkup(createElement(CelestialCatalogLabels, { ...shared, selectedCatalogId: "nearby-star:deneb" }));
    expect(selectedStar).toContain('data-deep-sky-label-id="nearby-star:deneb"');
    expect(selectedStar).toContain('data-deep-sky-selected-label="true"');
  });
});

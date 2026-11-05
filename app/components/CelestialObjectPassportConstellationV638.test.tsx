import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import CelestialObjectPassportPanel from "./CelestialObjectPassportPanel";
import { createCelestialObjectPassport } from "../lib/celestialCatalog";
import { MAINLINE_A_CONSTELLATION_FIGURES_V607 } from "../data/mainlineAConstellationFiguresV607";
import * as labels from "../lib/mainlineAConstellationPassportV638";

afterEach(() => vi.restoreAllMocks());

function renderPassport(code: string) {
  const passport = createCelestialObjectPassport(`constellation:${code}`);
  expect(passport).not.toBeNull();
  return renderToStaticMarkup(createElement(CelestialObjectPassportPanel, { passport, onClose() {} }));
}

describe("actual passport constellation labels", () => {
  it("shows Aljanah in the rendered Cygnus representative-star section", () => {
    const html = renderPassport("Cyg");
    expect(html).toContain('data-mainline-a-constellation-representative-id="epsilon_cyg"');
    expect(html).toContain('data-mainline-a-constellation-representative-status="candidate-only"');
    expect(html).toContain("Epsilon Cygni (Aljanah) / 天鹅座 ε");
    expect(html).not.toMatch(/Gienah|天津九/);
    expect(html).toContain("mainline-a-constellation-source-20260928-081");
  });

  it("retains the component A qualifier in the real Lyra passport", () => {
    const html = renderPassport("Lyr");
    expect(html).toContain('data-mainline-a-constellation-representative-id="epsilon1_lyr"');
    expect(html).toContain("HR7051");
    expect(html).toContain("目录组件A");
    expect(html).toContain("不代表科学身份准入");
  });

  it("renders a missing-source status and does not fall back to the legacy representative table", () => {
    const cyg = MAINLINE_A_CONSTELLATION_FIGURES_V607.Cyg;
    const incomplete = labels.resolveMainlineAConstellationPassportV638("Cyg", { Cyg: { ...cyg,
      stars: cyg.stars.filter((star) => star.id !== "epsilon_cyg"), sourceComplete: false, missingAnchorIds: ["epsilon_cyg"] } });
    vi.spyOn(labels, "resolveMainlineAConstellationPassportV638").mockReturnValue(incomplete);
    const html = renderPassport("Cyg");
    expect(html).toContain('data-mainline-a-constellation-representative-status="incomplete"');
    expect(html).not.toContain('data-mainline-a-constellation-representative-id="epsilon_cyg"');
    expect(html).toContain("代表星资料待补：epsilon_cyg");
    expect(html).not.toMatch(/Gienah|天津九/);
  });
});

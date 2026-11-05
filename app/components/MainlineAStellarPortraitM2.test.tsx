import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { AtlasRuntimeStoreState } from "../lib/atlasRuntimeStore";
import { MAINLINE_A_CURRENT_STARS } from "../data/mainlineAMetadataV607";
import { MAINLINE_A_STELLAR_PRESENTATION_M2_IDS, resolveMainlineAStellarPresentationM2 } from "../lib/mainlineAStellarPresentationM2";
import MainlineAStellarPortraitV607 from "./MainlineAStellarPortraitV607";

const fixture = vi.hoisted(() => ({ mode: "explore" as AtlasRuntimeStoreState["experienceMode"] }));
vi.mock("../lib/atlasRuntimeStore", () => ({
  useAtlasRuntimeStore: (select: (state: AtlasRuntimeStoreState) => unknown) => select({ experienceMode: fixture.mode } as AtlasRuntimeStoreState),
}));

beforeEach(() => { fixture.mode = "explore"; });

function star(id: string) {
  const row = MAINLINE_A_CURRENT_STARS.find((entry) => entry.id === id);
  if (!row) throw new Error(`Missing fixture ${id}`);
  return row;
}

function render(id: string) {
  const row = star(id);
  return renderToStaticMarkup(<MainlineAStellarPortraitV607 objectId={row.id} title={row.displayName} profile={row.artDirection} />);
}

describe("M2 shared stellar portrait", () => {
  it.each(MAINLINE_A_STELLAR_PRESENTATION_M2_IDS)("binds %s colours, shape and identity to its scene contract", (id) => {
    const shared = resolveMainlineAStellarPresentationM2(id)!;
    const html = render(id);
    expect(html).toContain('data-mainline-a-stellar-presentation-id="m2-shared-v596"');
    expect(html).toContain(`data-mainline-a-stellar-presentation-sha256="${shared.appearance.signatureSha256}"`);
    expect(html).toContain(`data-mainline-a-stellar-color-srgb="${shared.appearance.baseColor}"`);
    expect(html).toContain(`data-mainline-a-stellar-color-family="${shared.contract.archetype}"`);
    expect(html).toContain(`data-mainline-a-photosphere-ratio="${shared.contract.geometry.axisRatio}"`);
    expect(html).toContain(`ry="${91 / shared.contract.geometry.axisRatio}"`);
    expect(html).toContain("二维图鉴为近似示意");
    expect(html).toContain("非已解析的真实表面");
  });

  it.each(["sirius-a", "betelgeuse", "vega", "achernar"])("uses three luminance-only texture scales for %s", (id) => {
    const html = render(id);
    const morphology = resolveMainlineAStellarPresentationM2(id)!.appearance.surface;
    const frequencies = [...html.matchAll(/baseFrequency="([^"]+)"/g)].map((entry) => Number(entry[1]));
    expect(frequencies).toEqual([morphology.macroScale, morphology.mesoScale, morphology.microScale].map((scale) => scale / 182));
    expect(html).not.toContain('mode="soft-light"');
    const matrices = [...html.matchAll(/<feColorMatrix[^>]+values="([^"]+)"/g)].map((entry) => entry[1].split(" ").map(Number));
    expect(matrices).toHaveLength(3);
    for (const matrix of matrices) {
      expect(matrix.slice(0, 5)).toEqual(matrix.slice(5, 10));
      expect(matrix.slice(5, 10)).toEqual(matrix.slice(10, 15));
      expect(matrix.slice(15)).toEqual([0, 0, 0, 0, 1]);
      // Turbulence also carries alpha noise: a dim noise sample must still
      // leave the scalar mask opaque, including after all three composites.
      for (const noiseAlpha of [0, 0.2, 0.5, 1]) {
        expect(matrix[18] * noiseAlpha + matrix[19]).toBe(1);
      }
    }
    const midtoneBrightness = matrices.reduce((brightness, matrix) =>
      brightness * (0.5 * (matrix[0] + matrix[1] + matrix[2]) + matrix[4]), 1);
    expect(midtoneBrightness).toBeGreaterThan(0.8);
    expect(midtoneBrightness).toBeLessThanOrEqual(1);
    expect(html.match(/operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/g)).toHaveLength(3);
    expect(html).not.toMatch(/<filter[^>]*><g/);
  });

  it.each(["vega", "achernar"])("separates %s model shape and temperature from retained catalogue metrics", (id) => {
    const row = star(id);
    const shared = resolveMainlineAStellarPresentationM2(id)!;
    const html = render(id);
    expect(shared.appearance.axisRatio).toBeGreaterThan(1.1);
    expect(html).toContain(`展示模型色温 ${shared.appearance.colorTemperatureK} K`);
    expect(html).toContain(`目录色温 ${row.artDirection.colorTemperatureK.toLocaleString("zh-CN")} K`);
    expect(html).toContain(`光度 ${row.artDirection.luminositySolar.toLocaleString("zh-CN")} L☉`);
    expect(html).toContain(`半径 ${row.artDirection.radiusSolar.toLocaleString("zh-CN")} R☉`);
    expect(html).toContain("目录数值保留各自定义");
    expect(html).toContain("按赤道侧视画出扁率");
    expect(html).toContain("极区增亮与赤道暗化");
  });

  it("suppresses every shared halo in research mode without removing the texture control", () => {
    fixture.mode = "research";
    for (const id of MAINLINE_A_STELLAR_PRESENTATION_M2_IDS) {
      const html = render(id);
      expect(html).toContain('data-mainline-a-stellar-render-mode="science"');
      expect(html).toContain('data-mainline-a-stellar-halo-enabled="false"');
      expect(html).not.toContain('data-mainline-a-stellar-svg-halo="true"');
      expect(html).toContain('aria-pressed="true"');
      expect(html).toContain("min-h-11 min-w-11");
      expect(html).toContain("隐藏表面纹理");
    }
  });

  it("preserves an unbound portrait without attributing an M2 signature or accepting new objects", () => {
    const profile = { ...star("sirius-a").artDirection };
    const before = JSON.stringify(profile);
    const html = renderToStaticMarkup(<MainlineAStellarPortraitV607 objectId="unreviewed-star" title="Unreviewed star" profile={profile} />);
    expect(html).not.toContain("m2-shared-v596");
    expect(html).not.toContain("data-mainline-a-stellar-presentation-sha256");
    expect(html).not.toContain("data-mainline-a-stellar-color-srgb");
    expect(html).toContain('mode="soft-light"');
    expect(JSON.stringify(profile)).toBe(before);
  });
});

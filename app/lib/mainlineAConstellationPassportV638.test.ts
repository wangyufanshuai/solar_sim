import { describe, expect, it } from "vitest";
import { MAINLINE_A_CONSTELLATION_FIGURES_V607 } from "../data/mainlineAConstellationFiguresV607";
import { MAINLINE_A_CURRENT_CONSTELLATIONS } from "../data/mainlineAMetadataV607";
import { resolveMainlineAConstellationPassportV638 } from "./mainlineAConstellationPassportV638";

describe("constellation passport member labels", () => {
  it("derives the Cyg epsilon label from the actual supplemental identity without changing legacy metadata", () => {
    const legacy = MAINLINE_A_CURRENT_CONSTELLATIONS.find((row) => row.id === "Cyg")!;
    const before = JSON.stringify(legacy);
    expect(legacy.representativeStars.join(" ")).toContain("Gienah / 天津九");
    const view = resolveMainlineAConstellationPassportV638("Cyg");
    const epsilon = view.representativeStars.find((star) => star.id === "epsilon_cyg")!;
    const source = MAINLINE_A_CONSTELLATION_FIGURES_V607.Cyg.stars.find((star) => star.id === "epsilon_cyg")!;
    expect(epsilon.label).toBe(`${source.name} / ${source.nameCn}`);
    expect(epsilon.label).toContain("Aljanah");
    expect(epsilon.label).not.toMatch(/Gienah|天津九/);
    expect(epsilon.sourceRef).toBe(source.sourceRef);
    expect(epsilon.rawArtifactSha256).toBe(source.rawArtifactSha256);
    expect(view.status).toBe("candidate-only");
    expect(view.scientificPayloadWriteback).toBe(false);
    expect(JSON.stringify(legacy)).toBe(before);
  });

  it("retains component-qualified labels and never calls epsilon1 a system centre", () => {
    const row = resolveMainlineAConstellationPassportV638("Lyr").representativeStars.find((star) => star.id === "epsilon1_lyr")!;
    expect(row.label).toContain("HR7051");
    expect(row.label).toContain("目录组件A");
    expect(row.label).not.toContain("系统中心");
  });

  it("uses each of the twelve resolved figure member sets with no neighboring association stars", () => {
    for (const [code, figure] of Object.entries(MAINLINE_A_CONSTELLATION_FIGURES_V607)) {
      const view = resolveMainlineAConstellationPassportV638(code);
      expect(view.representativeStars.map((row) => row.id), code).toEqual(figure.requiredAnchorIds);
      for (const row of view.representativeStars) {
        const star = figure.stars.find((entry) => entry.id === row.id)!;
        expect(row.label).toBe(`${star.name} / ${star.nameCn}`);
      }
    }
    expect(resolveMainlineAConstellationPassportV638("Gem").representativeStars.map((star) => star.id)).not.toContain("procyon");
    expect(resolveMainlineAConstellationPassportV638("Cyg").representativeStars.map((star) => star.id)).not.toContain("vega");
  });

  it("keeps missing epsilon data pending instead of reintroducing the historical Gienah string", () => {
    const cyg = MAINLINE_A_CONSTELLATION_FIGURES_V607.Cyg;
    const view = resolveMainlineAConstellationPassportV638("Cyg", { Cyg: { ...cyg,
      stars: cyg.stars.filter((star) => star.id !== "epsilon_cyg"), sourceComplete: false, missingAnchorIds: ["epsilon_cyg"] } });
    expect(view.status).toBe("incomplete");
    expect(view.missingAnchorIds).toEqual(["epsilon_cyg"]);
    expect(view.representativeStars.map((star) => star.label).join(" ")).not.toMatch(/Aljanah|Gienah|天津九/);
  });

  it.each(["wrong-code", "duplicate", "blank-source"])("does not print an unresolved %s identity", (failure) => {
    const cyg = MAINLINE_A_CONSTELLATION_FIGURES_V607.Cyg;
    const original = cyg.stars.find((star) => star.id === "epsilon_cyg")!;
    const stars = failure === "duplicate" ? [...cyg.stars, original]
      : cyg.stars.map((star) => star.id !== original.id ? star : { ...star,
        constellationCode: failure === "wrong-code" ? "Lyr" : star.constellationCode,
        sourceRef: failure === "blank-source" ? "" : star.sourceRef });
    const view = resolveMainlineAConstellationPassportV638("Cyg", { Cyg: { ...cyg, stars } });
    expect(view.status).toBe("incomplete");
    expect(view.representativeStars.some((star) => star.id === original.id)).toBe(false);
    expect(view.missingAnchorIds).toContain(original.id);
  });

  it("reports an unavailable definition without manufacturing representative names", () => {
    expect(resolveMainlineAConstellationPassportV638("NoSuchFigure", {})).toEqual({
      status: "unavailable", representativeStars: [], missingAnchorIds: [], scientificPayloadWriteback: false,
    });
  });
});

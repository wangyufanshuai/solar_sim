import { describe, expect, it } from "vitest";
import source from "../data/mainlineAWebSkyAtlasV656.generated.json";
import {
  filterWebSkyConstellationsV656, filterWebSkyStarsV656,
  focusWebSkyConstellationV656, focusWebSkyStarV656,
  inspectWebSkyAtlasV656, type WebSkyAtlasPackV656,
} from "./mainlineAWebSkyV656";

const pack = source as WebSkyAtlasPackV656;
const copy = () => structuredClone(pack);

describe("Mainline A V656 candidate web sky atlas", () => {
  it("binds all 24 stars and 12 canonical constellations", () => {
    expect(inspectWebSkyAtlasV656(pack)).toMatchObject({ ok: true,
      counts: { stars: 24, runtimeExisting: 20, candidateHold: 4,
        constellations: 12, componentConfirmed: 0,
        constellationSignoff: 0 } });
  });

  it("allows existing runtime references but never the four hold candidates", () => {
    const runtime = pack.stars.filter((row) => row.phase === "runtime-existing");
    const hold = pack.stars.filter((row) => row.phase === "candidate-hold");
    expect(runtime).toHaveLength(20);
    expect(hold.map((row) => row.id)).toEqual(["acrux", "spica", "regulus", "polaris"]);
    expect(runtime.every((row) => focusWebSkyStarV656(row)?.catalogId
      === `stellar-hero:${row.id}`)).toBe(true);
    expect(hold.every((row) => focusWebSkyStarV656(row) === null)).toBe(true);
  });

  it("routes every signed-pending constellation to an existing chart", () => {
    expect(pack.constellations).toHaveLength(12);
    expect(pack.constellations.every((row) => focusWebSkyConstellationV656(row)?.catalogId
      === `constellation:${row.code}`)).toBe(true);
  });

  it("filters by names, IAU codes and hold phase without admitting rows", () => {
    expect(filterWebSkyStarsV656(pack.stars, "acrux", "all")
      .map((row) => row.id)).toEqual(["acrux"]);
    expect(filterWebSkyStarsV656(pack.stars, "", "candidate-hold"))
      .toHaveLength(4);
    expect(filterWebSkyStarsV656(pack.stars, "", "runtime-existing"))
      .toHaveLength(20);
    expect(filterWebSkyConstellationsV656(pack.constellations, "猎户")
      .map((row) => row.code)).toEqual(["Ori"]);
  });

  it("rejects forged focus of a candidate-hold star", () => {
    const forged = copy();
    const acrux = forged.stars.find((row) => row.id === "acrux")!;
    Object.assign(acrux, { canFocusScene: true,
      focusCatalogId: "stellar-hero:acrux" });
    expect(inspectWebSkyAtlasV656(forged).issues)
      .toContain("star-boundary:acrux");
    expect(focusWebSkyStarV656(acrux)).toBeNull();
  });

  it("rejects false science, false signing and route changes", () => {
    const writable = copy();
    Object.assign(writable.boundary, { scientificPayloadWriteback: true });
    expect(inspectWebSkyAtlasV656(writable).ok).toBe(false);
    const signed = copy();
    Object.assign(signed.constellations[0], { reviewState: "signed" });
    expect(inspectWebSkyAtlasV656(signed).ok).toBe(false);
    const rerouted = copy();
    Object.assign(rerouted.constellations[0], { routeCatalogId: "constellation:NoV" });
    expect(inspectWebSkyAtlasV656(rerouted).ok).toBe(false);
  });

  it("rejects duplicate coverage and missing input binding", () => {
    const duplicate = copy();
    Object.assign(duplicate.stars[1], { id: duplicate.stars[0].id });
    expect(inspectWebSkyAtlasV656(duplicate).ok).toBe(false);
    const missing = copy();
    delete (missing.generatedFrom as Record<string, unknown>).roster;
    expect(inspectWebSkyAtlasV656(missing).issues)
      .toContain("input-pins-invalid");
    const wrongPath = copy();
    Object.assign(wrongPath.generatedFrom.roster,
      { path: "app/data/fake-roster.json" });
    expect(inspectWebSkyAtlasV656(wrongPath).issues)
      .toContain("input-pins-invalid");
  });
});

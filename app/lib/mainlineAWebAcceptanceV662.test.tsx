import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import canonical from "../data/mainlineACanonicalCoverageV622.generated.json";
import sky from "../data/mainlineAWebSkyAtlasV656.generated.json";
import nebula from "../data/mainlineANebulaR73CatalogV660.generated.json";
import alternatives from "../data/mainlineANebulaR74AlternativesV661.generated.json";
import { assembleMainlineAWebAcceptanceV662,
  filterMainlineAWebAcceptanceV662,
  mainlineAWebAcceptanceHttpRoutesV662 } from
  "./mainlineAWebAcceptanceV662";
import MainlineAWebAcceptancePanelV662 from
  "../components/MainlineAWebAcceptancePanelV662";

const fresh = () => [structuredClone(canonical), structuredClone(sky),
  structuredClone(nebula), structuredClone(alternatives)] as const;
function matrix() {
  const [a, s, n, r] = fresh();
  return assembleMainlineAWebAcceptanceV662(a, s, n, r);
}

describe("R75 cross-entry web acceptance", () => {
  it("assembles 96 distinct entry-point checks without admission", () => {
    const result = matrix();
    expect(result.status).toBe("valid");
    expect(result.rows).toHaveLength(96);
    expect(new Set(result.rows.map((row) => row.key)).size).toBe(96);
    expect(result.counts).toMatchObject({ aStars: 12,
      aConstellations: 12, aNebulae: 12, betaStars: 24,
      betaConstellations: 12, betaNebulae: 24,
      existingStars: 20, identityHolds: 4,
      reviewImages: 19, imageHolds: 5,
      rightsSigned: 0, runtimeAdmitted: 0 });
    expect(result.rows.every((row) => row.candidateOnly
      && row.hold && row.notAdmitted
      && !row.scientificPayloadWriteback && row.rights === "pending"))
      .toBe(true);
  });

  it("keeps all four physical component holds out of runtime routes", () => {
    const held = matrix().rows.filter((row) => row.state === "identity-hold");
    expect(held.map((row) => row.id).sort()).toEqual(
      ["acrux", "polaris", "regulus", "spica"]);
    expect(held.every((row) => row.route === null
      && row.imageRoute === null && row.componentIdentity === "pending"))
      .toBe(true);
  });

  it("keeps five held nebulae off the image request list", () => {
    const result = matrix();
    const routes = mainlineAWebAcceptanceHttpRoutesV662(result);
    expect(routes.reviewImages).toHaveLength(19);
    expect(routes.heldIds).toHaveLength(5);
    expect(result.rows.filter((row) => row.group === "beta-nebula"
      && row.state === "source-hold")
      .every((row) => row.imageRoute === null
        && row.alternatives.every((entry) => !entry.imageRequested)))
      .toBe(true);
  });

  it("preserves Dumbbell's conflicting official page separately", () => {
    const row = matrix().rows.find((item) =>
      item.key === "beta:nebula:dumbbell-nebula");
    expect(row?.alternatives.map((entry) => entry.pageIdentity).sort())
      .toEqual(["confirmed", "conflict"]);
    expect(row?.state).toBe("source-hold");
  });

  it("rejects a forged star component promotion", () => {
    const [a, s, n, r] = fresh();
    const star = s.stars.find((item) => item.id === "acrux")!;
    Object.assign(star, { phase: "runtime-existing", canFocusScene: true,
      focusCatalogId: "stellar-hero:acrux" });
    const result = assembleMainlineAWebAcceptanceV662(a, s, n, r);
    expect(result.status).toBe("invalid");
    expect(result.rows).toHaveLength(0);
    expect(result.issues).toContain("star-component-hold:acrux");
  });

  it("rejects a forged nebula image and rights signoff", () => {
    const [a, s, n, r] = fresh();
    const ring = n.rows.find((item) => item.id === "ring-nebula")!;
    Object.assign(ring, { delivery: { route: "/fake.jpg",
      sha256: "a".repeat(64) }, rightsStatus: "signed" });
    const result = assembleMainlineAWebAcceptanceV662(a, s, n, r);
    expect(result.status).toBe("invalid");
    expect(result.rows).toHaveLength(0);
    expect(result.issues.some((issue) => issue.includes("ring-nebula")))
      .toBe(true);
  });

  it("rejects missing raw page identity and attempts to request held images", () => {
    const [a, s, n, r] = fresh();
    Object.assign(r.rows[0].alternatives[0], {
      imageRequestExecuted: true, imageResponseCaptured: 1,
      responseCaptured: 0 });
    const result = assembleMainlineAWebAcceptanceV662(a, s, n, r);
    expect(result.status).toBe("invalid");
    expect(result.issues).toContain("alternative-request-boundary:ring-nebula");
  });

  it("rejects changed canonical constellation hashes and external HTTP pages", () => {
    const [a, s, n, r] = fresh();
    s.constellations[0].coverageRowHash = "0".repeat(64);
    s.stars[0].sourcePageUrl = "http://not-https.invalid/source";
    const result = assembleMainlineAWebAcceptanceV662(a, s, n, r);
    expect(result.status).toBe("invalid");
    expect(result.issues).toContain("constellation-cross-reference:Ori");
    expect(result.issues).toContain("source-url:beta:star:sirius-a");
  });

  it("filters across grouped entry points without changing source rows", () => {
    const result = matrix();
    expect(filterMainlineAWebAcceptanceV662(result.rows,
      "beta-star", "identity-hold", "spica").map((row) => row.id))
      .toEqual(["spica"]);
    expect(filterMainlineAWebAcceptanceV662(result.rows,
      "beta-nebula", "source-hold", "no-such-object"))
      .toHaveLength(0);
    expect(result.rows).toHaveLength(96);
  });

  it("server renders a closed, fail-safe candidate summary", () => {
    const html = renderToStaticMarkup(<MainlineAWebAcceptancePanelV662 />);
    expect(html).toContain("data-mainline-a-r75-data=\"valid\"");
    expect(html).toContain("data-mainline-a-r75-release=\"blocked\"");
    expect(html).toContain("scientificPayloadWriteback=false");
    expect(html).not.toContain("data-mainline-a-r75-row=");
    expect(html).not.toContain("<img");
  });
});

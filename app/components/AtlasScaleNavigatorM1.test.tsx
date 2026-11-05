import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createAtlasScaleJourneyV268, createIdleAtlasScaleJourneyV268 } from "../lib/atlasScaleJourneyV268";
import type { AtlasRuntimeStoreState } from "../lib/atlasRuntimeStore";
import AtlasScaleNavigatorV260 from "./AtlasScaleNavigatorV260";

const fixture = vi.hoisted(() => ({ state: {} as AtlasRuntimeStoreState }));
vi.mock("../lib/atlasRuntimeStore", () => ({
  useAtlasRuntimeStore: (select: (state: AtlasRuntimeStoreState) => unknown) => select(fixture.state),
  atlasRuntimeStore: {},
}));

beforeEach(() => {
  fixture.state = {
    sceneMode: "inspect", scaleBand: "stellar", researchOverlay: "none", selectedObjectId: "",
    scaleJourney: createIdleAtlasScaleJourneyV268("stellar"),
  } as AtlasRuntimeStoreState;
});

describe("focused observation scale navigation", () => {
  it.each(["stellar-hero:sirius-a", "constellation:Ori", "nebula:m42"])(
    "keeps the current scale and an accessible disclosure for %s", (id) => {
      const html = renderToStaticMarkup(<AtlasScaleNavigatorV260 embedded focusObjectId={id} />);
      expect(html).toContain('data-mainline-a-scale-compact="true"');
      expect(html).toContain('aria-label="展开尺度导航"');
      expect(html).toContain('aria-expanded="false"');
      expect(html).toMatch(/<div id="[^"]+" hidden="">/);
      expect(html).toContain("本地恒星");
      expect(html).toContain("连续对数尺度");
    },
  );

  it("keeps the ordinary full scale journey outside inspect mode", () => {
    fixture.state.sceneMode = "atlas";
    const html = renderToStaticMarkup(<AtlasScaleNavigatorV260 embedded focusObjectId="nebula:m42" />);
    expect(html).toContain('data-mainline-a-scale-compact="false"');
    expect(html).not.toContain('aria-label="展开尺度导航"');
    expect(html).not.toContain('hidden=""');
    expect(html).toContain('aria-label="宇宙尺度导航"');
  });

  it("does not collapse planetary or standalone navigation", () => {
    for (const props of [{ embedded: true, focusObjectId: "earth" }, { focusObjectId: "constellation:Ori" }]) {
      const html = renderToStaticMarkup(<AtlasScaleNavigatorV260 {...props} />);
      expect(html).toContain('data-mainline-a-scale-compact="false"');
      expect(html).not.toContain('hidden=""');
    }
  });

  it("keeps the research overlay inert even with the compact disclosure", () => {
    fixture.state.researchOverlay = "relativity" as AtlasRuntimeStoreState["researchOverlay"];
    const html = renderToStaticMarkup(<AtlasScaleNavigatorV260 embedded focusObjectId="nebula:m42" />);
    expect(html).toContain('inert=""');
    expect(html).toContain('aria-hidden="true"');
  });

  it("removes a retained-passport warning when focus is cleared without rewriting the old journey", () => {
    fixture.state.scaleBand = "solar";
    fixture.state.selectedObjectId = "constellation:UMa";
    const journey = createIdleAtlasScaleJourneyV268("solar", 3, [], { selectedObjectId: "constellation:UMa" });
    fixture.state.scaleJourney = journey;
    const before = JSON.stringify(journey);
    expect(renderToStaticMarkup(<AtlasScaleNavigatorV260 />)).toContain("position unavailable in target band");

    fixture.state.selectedObjectId = "";
    const cleared = renderToStaticMarkup(<AtlasScaleNavigatorV260 />);
    expect(cleared).toContain('data-atlas-scale-position-status="retained"');
    expect(cleared).not.toContain("Selection passport retained");
    expect(JSON.stringify(journey)).toBe(before);
    expect(fixture.state.scaleJourney).toBe(journey);
  });

  it("updates availability for the current object even when the old journey described another selection", () => {
    fixture.state.scaleBand = "solar";
    fixture.state.scaleJourney = createIdleAtlasScaleJourneyV268("solar", 4, [], { selectedObjectId: "earth" });
    fixture.state.selectedObjectId = "nebula:m42";
    const nebula = renderToStaticMarkup(<AtlasScaleNavigatorV260 />);
    expect(nebula).toContain('data-atlas-scale-position-status="position-unavailable"');
    expect(nebula).toContain("position unavailable in target band");

    fixture.state.scaleJourney = createIdleAtlasScaleJourneyV268("solar", 5, [], { selectedObjectId: "nebula:m42" });
    fixture.state.selectedObjectId = "earth";
    const earth = renderToStaticMarkup(<AtlasScaleNavigatorV260 />);
    expect(earth).toContain('data-atlas-scale-position-status="retained"');
    expect(earth).not.toContain("Selection passport retained");
  });

  it("keeps genuine unavailable and angular-only messages tied to the displayed destination", () => {
    fixture.state.scaleJourney = createAtlasScaleJourneyV268({ requestId: 6, from: "stellar", to: "local-group",
      selectedObjectId: "constellation:UMa", returnPath: [], requestedAtMs: 0 });
    fixture.state.selectedObjectId = "constellation:UMa";
    const unavailable = renderToStaticMarkup(<AtlasScaleNavigatorV260 />);
    expect(unavailable).toContain('data-atlas-scale-journey="transition"');
    expect(unavailable).toContain('data-atlas-scale-position-status="position-unavailable"');
    expect(unavailable).toContain("position unavailable in target band");

    fixture.state.selectedObjectId = "openngc:ngc224";
    const angularOnly = renderToStaticMarkup(<AtlasScaleNavigatorV260 />);
    expect(angularOnly).toContain('data-atlas-scale-position-status="angular-shell-only"');
    expect(angularOnly).toContain("angular shell only; no distance is invented");
    expect(angularOnly).not.toContain("position unavailable in target band");
  });
});

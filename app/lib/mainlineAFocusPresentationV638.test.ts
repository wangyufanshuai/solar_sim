import { describe, expect, it } from "vitest";
import { createMainlineAFocusPresentationV638, knownStellarFocusV638, mainlineAFocusBandV638,
  mainlineAFocusBodyViewSettingsV638, mainlineASolarAnnotationsSuppressedV638,
  type MainlineAFocusScaleV638 } from "./mainlineAFocusPresentationV638";
import { ATLAS_UNIVERSAL_FOCUS_VERSION, type AtlasFocusTargetV2 } from "./atlasFocusV2";
import { createIdleAtlasScaleJourneyV268 } from "./atlasScaleJourneyV268";
import { DEFAULT_SIMULATION_VIEW_SETTINGS } from "./simulationViewSettings";

function setup(band: MainlineAFocusScaleV638["scaleBand"] = "solar") {
  let current: MainlineAFocusScaleV638 = { scaleBand: band, scaleJourney: { requestId: 1, lifecycle: "idle" } };
  const writes: string[] = [];
  const setBand = (next: MainlineAFocusScaleV638["scaleBand"]) => {
    writes.push(next);
    current = { scaleBand: next, scaleJourney: { requestId: current.scaleJourney.requestId + 1, lifecycle: "idle" } };
  };
  return { journey: createMainlineAFocusPresentationV638({ read: () => current, setBand }),
    read: () => current, setBand, writes,
    transition: () => { current = { ...current, scaleJourney: { requestId: current.scaleJourney.requestId + 1, lifecycle: "transition" } }; } };
}

describe("Mainline A reversible presentation route", () => {
  it.each(["star", "nearby-star", "bright-star", "nebula", "constellation"])("brings %s into a visible scale and restores the original", (kind) => {
    const { journey, read, writes } = setup("near-universe");
    expect(journey.focus("test-object", kind)).toBe(true);
    expect(read().scaleBand).toBe("stellar");
    expect(journey.release()).toBe(true);
    expect(read().scaleBand).toBe("near-universe");
    expect(writes).toEqual(["stellar", "near-universe"]);
    expect(journey.release()).toBe(false);
  });
  it("retains the initial scale across star to nebula to constellation", () => {
    const { journey, read, writes } = setup();
    journey.focus("alpha-centauri-a", "star");
    journey.focus("m42", "nebula");
    journey.focus("Ori", "constellation");
    expect(journey.snapshot()?.originalBand).toBe("solar");
    expect(journey.snapshot()?.objectId).toBe("Ori");
    expect(writes).toEqual(["stellar"]);
    journey.release();
    expect(read().scaleBand).toBe("solar");
  });
  it("does not roll back a manual scale journey or same-band reselection", () => {
    for (const manual of ["transition", "same-band"] as const) {
      const test = setup();
      test.journey.focus("m42", "nebula");
      if (manual === "transition") test.transition(); else test.setBand("stellar");
      const before = test.read();
      expect(test.journey.release()).toBe(false);
      expect(test.read()).toBe(before);
    }
  });
  it("treats a later user scale as the baseline for a new focus", () => {
    const test = setup();
    test.journey.focus("m42", "nebula");
    test.setBand("local-group");
    test.journey.focus("Ori", "constellation");
    test.journey.release();
    expect(test.read().scaleBand).toBe("local-group");
  });
  it("cancels an in-flight scale transition before presenting the target", () => {
    const test = setup("stellar");
    test.transition();
    expect(test.journey.focus("m42", "nebula")).toBe(true);
    expect(test.read().scaleJourney.lifecycle).toBe("idle");
    expect(test.writes).toEqual(["stellar"]);
  });
  it("preserves a galactic view and does not mutate for unsupported targets", () => {
    const test = setup("galactic");
    expect(test.journey.focus("Ori", "constellation")).toBe(true);
    expect(test.journey.release()).toBe(false);
    expect(test.journey.focus("unknown", "galaxy")).toBe(false);
    expect(test.writes).toEqual([]);
  });
  it("rejects invalid identities and invalid host revisions", () => {
    const test = setup();
    expect(test.journey.focus("", "star")).toBe(false);
    expect(test.journey.focus("bad\nname", "star")).toBe(false);
    test.read().scaleJourney.requestId = NaN;
    expect(test.journey.focus("m42", "nebula")).toBe(false);
    expect(test.writes).toEqual([]);
  });
  it("cannot claim an applied route when the host refuses the transition", () => {
    const route = createMainlineAFocusPresentationV638({ read: () => ({ scaleBand: "solar", scaleJourney: { requestId: 1, lifecycle: "idle" } }), setBand: () => undefined });
    expect(route.focus("m42", "nebula")).toBe(false);
    expect(route.snapshot()).toBeNull();
  });
  it("accepts only exact known hero identities, including the explicit prefix", () => {
    expect(knownStellarFocusV638("stellar-hero:alpha-centauri-a")).toBe(true);
    expect(knownStellarFocusV638("alpha-centauri-a")).toBe(true);
    expect(knownStellarFocusV638("alpha-centauri")).toBe(false);
    expect(knownStellarFocusV638("__proto__")).toBe(false);
    expect(mainlineAFocusBandV638("star", "galactic")).toBe("galactic");
  });
});

function solarAnnotationFocus(catalogId = "constellation:UMa", stellar = false) {
  const target: AtlasFocusTargetV2 = stellar ? {
    kind: "stellar", objectId: catalogId, catalogId, direction: [1, 0, 0],
    identity: { objectId: catalogId, namespace: "gaia-dr3", gaiaSourceId: "2947050466531873024", hygId: null, designation: null },
  } : { kind: "catalog-object", objectId: catalogId, catalogId, direction: [1, 0, 0] };
  const state: Parameters<typeof mainlineASolarAnnotationsSuppressedV638>[0] = {
    sceneMode: "inspect", experienceMode: "explore", researchOverlay: "none",
    observerPresentation: { enabled: false, targetId: "", widthDeg: 0, heightDeg: 0, rotationDeg: 0 },
    scaleBand: "stellar", scaleJourney: createIdleAtlasScaleJourneyV268("stellar", 2),
    selectedObjectId: catalogId, focusRequestId: 3, focusTransition: "locked",
    focusCommand: { version: ATLAS_UNIVERSAL_FOCUS_VERSION, requestId: 3, issuedAtMs: 0,
      source: "object-browser", phase: "locked", target },
  };
  const gate: Parameters<typeof mainlineASolarAnnotationsSuppressedV638>[1] = {
    selectedCatalogId: catalogId, sceneMode: "inspect", researchDiagnosticsActive: false,
    captureActive: false, launchActive: false, kerrActive: false, closeupActive: false,
  };
  return { state, gate };
}

describe("Mainline A focused solar annotations", () => {
  it.each(["command", "transition", "locked"] as const)(
    "suppresses only solar annotations throughout a same-object %s focus", (phase) => {
      for (const [catalogId, stellar] of [
        ["constellation:UMa", false], ["nebula:m42", false], ["nebula:b33", false],
        ["nearby-star:betelgeuse", false], ["bright-star:rigel", false],
        ["stellar-hero:sirius-a", false], ["gaia-dr3:2947050466531873024", true],
      ] as const) {
        const { state, gate } = solarAnnotationFocus(catalogId, stellar);
        state.focusTransition = phase;
        state.focusCommand!.phase = phase;
        const before = JSON.stringify({ state, gate });
        expect(mainlineASolarAnnotationsSuppressedV638(state, gate)).toBe(true);
        expect(JSON.stringify({ state, gate })).toBe(before);
      }
    },
  );

  it("also applies in ordinary atlas and galactic views", () => {
    const { state, gate } = solarAnnotationFocus();
    state.sceneMode = "atlas";
    state.scaleBand = "galactic";
    state.scaleJourney = createIdleAtlasScaleJourneyV268("galactic", 4);
    expect(mainlineASolarAnnotationsSuppressedV638(state, { ...gate, sceneMode: "atlas" })).toBe(true);
  });

  it("does not let stale commands, a different object or a retired focus hide annotations", () => {
    const mutations: Array<(fixture: ReturnType<typeof solarAnnotationFocus>) => void> = [
      ({ state }) => { state.focusRequestId += 1; },
      ({ state }) => { state.selectedObjectId = "nebula:m42"; },
      ({ state }) => { state.focusCommand = null; },
      ({ state }) => { state.focusTransition = "idle"; state.focusCommand!.phase = "idle"; },
      ({ state }) => { state.focusTransition = "command"; },
      ({ state }) => { state.focusCommand!.target = { kind: "catalog-object", objectId: state.selectedObjectId,
        catalogId: "constellation:Ori", direction: [1, 0, 0] }; },
      ({ state }) => { state.focusCommand!.target = { kind: "solar-body", objectId: state.selectedObjectId, bodyIndex: 0, mode: "lock" }; },
      ({ state }) => { state.focusCommand!.target = { kind: "exoplanet-system", objectId: state.selectedObjectId, systemId: "test-system" }; },
    ];
    for (const mutate of mutations) {
      const fixture = solarAnnotationFocus();
      mutate(fixture);
      expect(mainlineASolarAnnotationsSuppressedV638(fixture.state, fixture.gate)).toBe(false);
    }
    const { state, gate } = solarAnnotationFocus();
    expect(mainlineASolarAnnotationsSuppressedV638(state, { ...gate, selectedCatalogId: "" })).toBe(false);
    expect(mainlineASolarAnnotationsSuppressedV638(state, { ...gate, selectedCatalogId: "constellation:Ori" })).toBe(false);
  });

  it("preserves solar, other scales, manual scale transitions and research views", () => {
    const { state, gate } = solarAnnotationFocus();
    for (const scaleBand of ["solar", "local-group", "near-universe"] as const) {
      expect(mainlineASolarAnnotationsSuppressedV638({ ...state, scaleBand }, gate)).toBe(false);
    }
    expect(mainlineASolarAnnotationsSuppressedV638({ ...state,
      scaleJourney: { ...state.scaleJourney, lifecycle: "transition" } }, gate)).toBe(false);
    expect(mainlineASolarAnnotationsSuppressedV638({ ...state, experienceMode: "research" }, gate)).toBe(false);
    for (const researchOverlay of ["observing-planner", "gaia-analysis"] as const) {
      expect(mainlineASolarAnnotationsSuppressedV638({ ...state, researchOverlay }, gate)).toBe(false);
    }
  });

  it("leaves launch, Kerr, close-up, diagnostics and exact/checkpoint capture unchanged", () => {
    const { state, gate } = solarAnnotationFocus();
    for (const key of ["researchDiagnosticsActive", "captureActive", "launchActive", "kerrActive", "closeupActive"] as const) {
      expect(mainlineASolarAnnotationsSuppressedV638(state, { ...gate, [key]: true })).toBe(false);
    }
    for (const sceneMode of ["launch", "kerr", "exoplanet-system", "relativity-lab", "scene-lab"] as const) {
      expect(mainlineASolarAnnotationsSuppressedV638(state, { ...gate, sceneMode })).toBe(false);
      expect(mainlineASolarAnnotationsSuppressedV638({ ...state, sceneMode }, gate)).toBe(false);
    }
  });

  it("preserves observer presentation even with a matching active catalog focus", () => {
    const { state, gate } = solarAnnotationFocus("nebula:m42");
    state.observerPresentation = { enabled: true, targetId: "nebula:m42", widthDeg: 3, heightDeg: 2, rotationDeg: 15 };
    expect(mainlineASolarAnnotationsSuppressedV638(state, gate)).toBe(false);
    state.observerPresentation = { ...state.observerPresentation, enabled: false };
    expect(mainlineASolarAnnotationsSuppressedV638(state, gate)).toBe(true);
  });

  it("derives only body labels and restores each user's current setting on exit", () => {
    const { state, gate } = solarAnnotationFocus();
    for (const showBodyLabels of [false, true]) {
      for (const showReferenceOrbits of [false, true]) {
        const settings = Object.freeze({ ...DEFAULT_SIMULATION_VIEW_SETTINGS, showBodyLabels, showReferenceOrbits });
        const before = JSON.stringify(settings);
        const suppressed = mainlineASolarAnnotationsSuppressedV638(state, gate);
        const rendered = mainlineAFocusBodyViewSettingsV638(settings, suppressed);
        expect(rendered).toEqual({ ...settings, showBodyLabels: false });
        expect(JSON.stringify(settings)).toBe(before);
        expect(mainlineAFocusBodyViewSettingsV638(settings, false)).toBe(settings);
      }
    }
  });

  it("honors preferences changed during focus instead of restoring an older snapshot", () => {
    const { state, gate } = solarAnnotationFocus();
    const initial = Object.freeze({ ...DEFAULT_SIMULATION_VIEW_SETTINGS, showBodyLabels: false, showReferenceOrbits: true });
    const updated = Object.freeze({ ...initial, showBodyLabels: true, showReferenceOrbits: false });
    expect(mainlineAFocusBodyViewSettingsV638(initial, mainlineASolarAnnotationsSuppressedV638(state, gate))).toBe(initial);
    expect(mainlineAFocusBodyViewSettingsV638(updated, mainlineASolarAnnotationsSuppressedV638(state, gate)))
      .toEqual({ ...updated, showBodyLabels: false });
    state.focusCommand = null;
    state.focusTransition = "idle";
    state.selectedObjectId = "";
    const restored = mainlineAFocusBodyViewSettingsV638(updated,
      mainlineASolarAnnotationsSuppressedV638(state, { ...gate, selectedCatalogId: "" }));
    expect(restored).toBe(updated);
    expect(restored.showBodyLabels).toBe(true);
    expect(restored.showReferenceOrbits).toBe(false);
    expect(initial.showBodyLabels).toBe(false);
    expect(initial.showReferenceOrbits).toBe(true);
  });
});

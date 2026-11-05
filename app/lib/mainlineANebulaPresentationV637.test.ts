import { describe, expect, it } from "vitest";
import { MAINLINE_A_NEBULA_ATLAS_CANDIDATES, MAINLINE_A_NEBULA_ATLAS_CURRENT, type NebulaAtlasEntry } from "./mainlineANebulaAtlasV609";
import {
  createNebulaAtlasState,
  createNebulaPreviewState,
  formatNebulaMeasurement,
  formatNebulaSourceBytes,
  nebulaAtlasResultsAnnouncement,
  nebulaAtlasView,
  nebulaCatalogMeasurements,
  nebulaEntryMatchesQuery,
  nebulaHttpsLink,
  nebulaKnownMeasurementCount,
  nebulaLocalPreviewPath,
  nebulaMeasurementState,
  nebulaSourceDimensions,
  normalizeNebulaMeasurement,
  normalizeNebulaKind,
  orderNebulaEntries,
  reduceNebulaAtlasState,
  reduceNebulaPreviewState,
  sameNebulaCatalog,
  type NebulaCatalogField,
} from "./mainlineANebulaPresentationV637";

const current = MAINLINE_A_NEBULA_ATLAS_CURRENT[0];
const candidate = MAINLINE_A_NEBULA_ATLAS_CANDIDATES[0];
const rows: readonly NebulaAtlasEntry[] = [
  { ...current, id: "near", catalogName: "M 2", distancePc: 100, sizeArcmin: 10 },
  { ...current, id: "far", catalogName: "M 10", distancePc: 900, sizeArcmin: 2 },
  { ...candidate, id: "unknown", catalogName: "IC 1805", distancePc: null, sizeArcmin: null },
];

describe("V637 nebula missing measurement semantics", () => {
  it("only accepts known catalog kinds and leaves invalid kinds unknown", () => {
    expect(normalizeNebulaKind("reflection")).toBe("reflection");
    for (const value of [undefined, null, "quasar", "constructor", "toString", 0]) {
      expect(normalizeNebulaKind(value)).toBe("unknown");
    }
  });
  it("preserves real coordinate zero but rejects zero distance and angular extent", () => {
    expect(normalizeNebulaMeasurement(0, "galLonDeg")).toBe(0);
    expect(normalizeNebulaMeasurement(-0, "galLatDeg")).toBe(0);
    expect(formatNebulaMeasurement(-0, "galLatDeg")).toBe("0°");
    expect(normalizeNebulaMeasurement(0, "distancePc")).toBeNull();
    expect(normalizeNebulaMeasurement(0, "sizeArcmin")).toBeNull();
    expect(formatNebulaMeasurement(null, "sizeArcmin")).toBe("未提供");
    expect(formatNebulaMeasurement(0, "sizeArcmin")).toBe("待核实");
  });

  it.each<NebulaCatalogField>(["galLonDeg", "galLatDeg", "distancePc", "sizeArcmin"])("rejects coercion and nonfinite values for %s", (field) => {
    for (const value of [NaN, Infinity, -Infinity, "0", "100", "", true, {}, []]) {
      expect(nebulaMeasurementState(value, field)).toBe("invalid");
      expect(normalizeNebulaMeasurement(value, field)).toBeNull();
      expect(formatNebulaMeasurement(value, field)).toBe("待核实");
    }
    for (const value of [null, undefined]) {
      expect(nebulaMeasurementState(value, field)).toBe("missing");
      expect(formatNebulaMeasurement(value, field)).toBe("未提供");
    }
  });

  it("validates coordinate and extent boundaries without silently wrapping them", () => {
    expect(normalizeNebulaMeasurement(359.999, "galLonDeg")).toBe(359.999);
    expect(normalizeNebulaMeasurement(360, "galLonDeg")).toBeNull();
    expect(normalizeNebulaMeasurement(-0.001, "galLonDeg")).toBeNull();
    expect(normalizeNebulaMeasurement(-90, "galLatDeg")).toBe(-90);
    expect(normalizeNebulaMeasurement(90, "galLatDeg")).toBe(90);
    expect(normalizeNebulaMeasurement(90.001, "galLatDeg")).toBeNull();
    expect(normalizeNebulaMeasurement(21600, "sizeArcmin")).toBe(21600);
    expect(normalizeNebulaMeasurement(21601, "sizeArcmin")).toBeNull();
  });

  it("formats units and small values without manufacturing a displayed zero", () => {
    expect(formatNebulaMeasurement(1234.5, "distancePc")).toBe("1,234.5 pc");
    expect(formatNebulaMeasurement(2.5, "sizeArcmin")).toBe("2.5′");
    expect(formatNebulaMeasurement(0.00001, "sizeArcmin")).toBe("1.00e-5′");
    expect(formatNebulaMeasurement(-19.4, "galLatDeg")).toBe("-19.4°");
  });

  it("reports partial records field by field instead of claiming four known values", () => {
    const partial = { ...current, galLonDeg: 0, galLatDeg: 0, distancePc: null, sizeArcmin: NaN };
    expect(nebulaKnownMeasurementCount(partial)).toBe(2);
    expect(nebulaCatalogMeasurements(partial).map(({ state }) => state)).toEqual(["missing", "invalid", "known", "known"]);
  });

  it("always sorts missing or malformed values after valid measurements in either direction", () => {
    const invalid = { ...current, id: "invalid", distancePc: -5, sizeArcmin: NaN };
    const entries = [rows[2], rows[1], invalid, rows[0]];
    expect(orderNebulaEntries(entries, "distance").map((entry) => entry.id)).toEqual(["near", "far", "invalid", "unknown"]);
    expect(orderNebulaEntries(entries, "angular-size").map((entry) => entry.id)).toEqual(["near", "far", "invalid", "unknown"]);
    expect(entries.map((entry) => entry.id)).toEqual(["unknown", "far", "invalid", "near"]);
    expect(orderNebulaEntries(entries, "catalog")).not.toBe(entries);
  });
});

describe("V637 nebula query and identity", () => {
  it("matches complete normalized catalog aliases without prefix identity collisions", () => {
    expect(sameNebulaCatalog("M42 / NGC 1976", "ｍ ４２")).toBe(true);
    expect(sameNebulaCatalog("M42 / NGC 1976", "NGC1976")).toBe(true);
    expect(sameNebulaCatalog("M1 / NGC 1952", "M17 / NGC 6618")).toBe(false);
    expect(sameNebulaCatalog("IC 41", "IC 410")).toBe(false);
    expect(sameNebulaCatalog("", "")).toBe(false);
  });

  it("supports AND queries across human names, catalog spelling and source identifiers", () => {
    expect(nebulaEntryMatchesQuery(current, "猎户座 NGC1976")).toBe(true);
    expect(nebulaEntryMatchesQuery(current, "M 42")).toBe(true);
    expect(nebulaEntryMatchesQuery(current, "猎户座 IC1805")).toBe(false);
    expect(nebulaEntryMatchesQuery(candidate, "heart nebula IC 1805")).toBe(true);
    expect(nebulaEntryMatchesQuery(candidate, "heart-nebula")).toBe(true);
    expect(nebulaEntryMatchesQuery(candidate, "类型待核")).toBe(true);
  });

  it("uses numeric name ordering and deterministic ID ties", () => {
    const duplicates = [...rows, { ...rows[0], id: "before" }];
    expect(orderNebulaEntries(duplicates, "name").map((entry) => entry.id)).toEqual(["unknown", "before", "near", "far"]);
  });
});

describe("V637 atlas selection and accessible result state", () => {
  it("moves selection into filtered results and clears stale details for no results", () => {
    let state = createNebulaAtlasState(rows);
    expect(state.selectedId).toBe("near");
    state = reduceNebulaAtlasState(state, { type: "scope", value: "candidate" }, rows);
    expect(state.selectedId).toBe("unknown");
    expect(nebulaAtlasView(rows, state).visible.map((entry) => entry.id)).toEqual(["unknown"]);
    state = reduceNebulaAtlasState(state, { type: "query", value: "missing object" }, rows);
    expect(state.selectedId).toBeNull();
    expect(nebulaAtlasView(rows, state).selected).toBeNull();
    expect(nebulaAtlasResultsAnnouncement(rows, state)).toContain("没有匹配记录，可清除筛选");
    state = reduceNebulaAtlasState(state, { type: "reset" }, rows);
    expect(state.selectedId).toBe("near");
    expect(nebulaAtlasView(rows, state).visible).toHaveLength(3);
  });

  it("preserves a visible selection across reorder and rejects invisible selection requests", () => {
    let state = createNebulaAtlasState(rows);
    state = reduceNebulaAtlasState(state, { type: "select", id: "far" }, rows);
    state = reduceNebulaAtlasState(state, { type: "order", value: "distance" }, rows);
    expect(state.selectedId).toBe("far");
    expect(nebulaAtlasView(rows, state).selectedIndex).toBe(1);
    state = reduceNebulaAtlasState(state, { type: "scope", value: "current" }, rows);
    expect(reduceNebulaAtlasState(state, { type: "select", id: "unknown" }, rows)).toBe(state);
    expect(reduceNebulaAtlasState(state, { type: "select", id: "not-real" }, rows)).toBe(state);
  });

  it("uses visible order for previous and next without wrapping past a boundary", () => {
    let state = createNebulaAtlasState(rows);
    expect(reduceNebulaAtlasState(state, { type: "step", direction: -1 }, rows)).toBe(state);
    state = reduceNebulaAtlasState(state, { type: "step", direction: 1 }, rows);
    expect(state.selectedId).toBe("far");
    state = reduceNebulaAtlasState(state, { type: "step", direction: 1 }, rows);
    expect(state.selectedId).toBe("unknown");
    expect(nebulaAtlasView(rows, state)).toMatchObject({ canGoNext: false, canGoPrevious: true });
    expect(reduceNebulaAtlasState(state, { type: "step", direction: 1 }, rows)).toBe(state);
  });

  it("combines completeness and rights filters without changing catalog evidence", () => {
    const before = JSON.stringify(rows);
    let state = createNebulaAtlasState(rows);
    state = reduceNebulaAtlasState(state, { type: "completeness", value: "incomplete" }, rows);
    expect(nebulaAtlasView(rows, state)).toMatchObject({ currentCount: 0, candidateCount: 1, incompleteCount: 1 });
    state = reduceNebulaAtlasState(state, { type: "filter", value: "rights-cleared" }, rows);
    expect(nebulaAtlasView(rows, state).visible).toEqual([]);
    expect(state.selectedId).toBeNull();
    expect(JSON.stringify(rows)).toBe(before);
  });

  it("announces pending sort values and keeps an empty dataset usable", () => {
    const sorted = reduceNebulaAtlasState(createNebulaAtlasState(rows), { type: "order", value: "distance" }, rows);
    expect(nebulaAtlasResultsAnnouncement(rows, sorted)).toContain("1 条排序值未提供或无效，已置于末尾");
    const empty = createNebulaAtlasState([]);
    expect(empty.selectedId).toBeNull();
    expect(reduceNebulaAtlasState(empty, { type: "step", direction: 1 }, [])).toBe(empty);
    expect(nebulaAtlasView([], empty)).toMatchObject({ visible: [], selected: null, canGoNext: false });
  });
});

describe("V637 evidence link and preview boundaries", () => {
  it("only loads existing A-line texture paths; candidate cache paths never become runtime images", () => {
    expect(nebulaLocalPreviewPath(current)).toBe("/textures/mainline-a/opo0205d.jpg");
    expect(nebulaLocalPreviewPath(candidate)).toBeNull();
    expect(nebulaLocalPreviewPath({ ...candidate, sourceImagePath: current.sourceImagePath })).toBeNull();
    for (const sourceImagePath of ["https://example.org/image.jpg", "//example.org/image.jpg", "/textures/mainline-a/../secret.jpg", "/textures/mainline-a/%2e%2e.jpg", "source-cache/a.jpg", "/textures/mainline-a/a.jpg?redirect=1"]) {
      expect(nebulaLocalPreviewPath({ ...current, sourceImagePath })).toBeNull();
    }
  });

  it("accepts HTTPS source references while rejecting malformed or credential-bearing links", () => {
    expect(nebulaHttpsLink("https://esahubble.org/images/opo0205d/")).toBe("https://esahubble.org/images/opo0205d/");
    for (const url of [null, "", "javascript:alert(1)", "file:///tmp/a", "http://example.org/a", "https://name:secret@example.org/a", "/relative/source"]) {
      expect(nebulaHttpsLink(url)).toBeNull();
    }
  });

  it("validates dimension and byte evidence without truthy coercion", () => {
    expect(nebulaSourceDimensions(1280, 720)).toEqual({ width: 1280, height: 720 });
    for (const invalid of [0, -1, 1.5, Infinity, NaN, "100", null, Number.MAX_SAFE_INTEGER + 1]) {
      expect(nebulaSourceDimensions(invalid, 100)).toBeNull();
      expect(nebulaSourceDimensions(100, invalid)).toBeNull();
    }
    expect(formatNebulaSourceBytes(null)).toBe("未提供");
    expect(formatNebulaSourceBytes(0)).toBe("待核实");
    expect(formatNebulaSourceBytes(1024)).toBe("1,024 bytes");
  });

  it("handles failure and explicit retry while discarding stale load events", () => {
    const path = "/textures/mainline-a/test.jpg";
    let state = createNebulaPreviewState(path);
    state = reduceNebulaPreviewState(state, { type: "failed", path, attempt: 0 });
    expect(state.status).toBe("failed");
    state = reduceNebulaPreviewState(state, { type: "retry" });
    expect(state).toMatchObject({ status: "loading", attempt: 1 });
    expect(reduceNebulaPreviewState(state, { type: "loaded", path, attempt: 0, width: 100, height: 100 })).toBe(state);
    expect(reduceNebulaPreviewState(state, { type: "failed", path: "/other.jpg", attempt: 1 })).toBe(state);
    state = reduceNebulaPreviewState(state, { type: "loaded", path, attempt: 1, width: 100, height: 100 });
    expect(state.status).toBe("loaded");
    expect(reduceNebulaPreviewState(state, { type: "failed", path, attempt: 1 })).toBe(state);
    expect(reduceNebulaPreviewState(state, { type: "retry" })).toBe(state);
  });

  it("treats zero-sized loaded images as failures and has no retry path for candidate placeholders", () => {
    const state = createNebulaPreviewState("/textures/mainline-a/test.jpg");
    expect(reduceNebulaPreviewState(state, { type: "loaded", path: state.path!, attempt: 0, width: 0, height: 100 }).status).toBe("failed");
    const unavailable = createNebulaPreviewState(null);
    expect(unavailable.status).toBe("unavailable");
    expect(reduceNebulaPreviewState(unavailable, { type: "retry" })).toBe(unavailable);
  });
});

import { describe, expect, it } from "vitest";
import { Matrix4, PerspectiveCamera, Vector3 } from "three";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { starToDirection } from "../data/nearbyStars";
import coverage from "../data/mainlineACanonicalCoverageV622.generated.json";
import { CELESTIAL_CATALOG_ENTRIES, celestialEntriesForKinds, celestialEntryToDirection } from "./celestialCatalog";
import {
  mainlineAConstellationCatalogRowsV638,
  mainlineAConstellationCodeV638,
  mainlineAConstellationFrameStateV638,
  projectMainlineAConstellationSegmentsV638,
  selectMainlineAConstellationFigureV638,
  type MainlineAConstellationFigureV638,
} from "./mainlineAConstellationSelectionV638";

const IDENTITY = new Matrix4().elements;
const CANONICAL_CODES = coverage.records.filter((row) => row.kind === "constellation").map((row) => row.id);
const CANONICAL_VIEWPORT_CASES = CANONICAL_CODES.flatMap((code) => [
  { code, viewport: "desktop", aspect: 16 / 9 },
  { code, viewport: "mobile-portrait", aspect: 390 / 844 },
]);
const SIMPLE_FIGURE: MainlineAConstellationFigureV638 = {
  iauCode: "Ori", name: "Orion", waypoints: [[0, 0], [10, 0], [10, 10]],
};

describe("V638 selected constellation identity and geometry", () => {
  it("does not interpret stars, prefix fragments or wrong case as constellation routes", () => {
    for (const id of ["stellar-hero:orion", "Ori", "constellation:orion", "constellation:Ori:other", "constellation:ori"]) {
      expect(mainlineAConstellationCodeV638(id)).toBeNull();
      expect(selectMainlineAConstellationFigureV638(id, [SIMPLE_FIGURE], 9500).status).toBe("none");
    }
    expect(mainlineAConstellationCodeV638("constellation:UMa")).toBe("UMa");
  });

  it("builds only the exact selected figure instead of concatenating the background catalog", () => {
    const selected = selectMainlineAConstellationFigureV638("constellation:Ori", [
      SIMPLE_FIGURE,
      { iauCode: "UMa", name: "Ursa Major", waypoints: [[180, 45], [200, 50]] },
    ], 9500);
    expect(selected.status).toBe("selected");
    expect(selected.segmentCount).toBe(2);
    expect(selected.positions).toHaveLength(12);
    expect(Array.from(selected.positions.slice(0, 3))).toEqual([9500, 0, 0]);
    expect(selected.positions[6]).toBeCloseTo(Math.cos(Math.PI / 18) * 9500, 2);
  });

  it("does not borrow another figure for missing or ambiguous identities", () => {
    expect(selectMainlineAConstellationFigureV638("constellation:Cas", [SIMPLE_FIGURE], 9500)).toMatchObject({
      status: "invalid", segmentCount: 0, issues: ["figure:not-found"],
    });
    expect(selectMainlineAConstellationFigureV638("constellation:Ori", [SIMPLE_FIGURE, SIMPLE_FIGURE], 9500).issues)
      .toEqual(["figure:ambiguous-code"]);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_VALUE, 0, -1])("rejects invalid scene radius %s", (radius) => {
    expect(selectMainlineAConstellationFigureV638("constellation:Ori", [SIMPLE_FIGURE], radius).status).toBe("invalid");
  });

  it.each([[361, 0], [-1, 0], [0, 91], [0, -91], [NaN, 0], [0, Infinity]])("rejects invalid angular coordinates %s,%s", (ra, dec) => {
    const figure = { ...SIMPLE_FIGURE, waypoints: [[ra, dec], [10, 5]] as [number, number][] };
    expect(selectMainlineAConstellationFigureV638("constellation:Ori", [figure], 9500)).toMatchObject({
      status: "invalid", segmentCount: 0, issues: ["figure:coordinate-invalid:0"],
    });
  });

  it("omits degenerate repeated points without joining across other valid vertices", () => {
    const repeated = { ...SIMPLE_FIGURE, waypoints: [[0, 0], [360, 0], [10, 0], [10, 0], [20, 5]] as [number, number][] };
    const selected = selectMainlineAConstellationFigureV638("constellation:Ori", [repeated], 9500);
    expect(selected.segmentCount).toBe(2);
    expect(selectMainlineAConstellationFigureV638("constellation:Ori", [{ ...SIMPLE_FIGURE, waypoints: [[0, 90], [180, 90]] }], 9500).issues)
      .toEqual(["figure:no-drawable-segments"]);
  });

  it("provides finite independent geometry for all twelve sealed canonical codes", () => {
    const buffers = new Set<ArrayBufferLike>();
    expect(CANONICAL_CODES).toHaveLength(12);
    for (const code of CANONICAL_CODES) {
      const selected = selectMainlineAConstellationFigureV638(`constellation:${code}`, CONSTELLATION_LINES, 9500);
      expect(selected.status, code).toBe("selected");
      expect(selected.segmentCount, code).toBeGreaterThan(0);
      expect(Array.from(selected.positions).every(Number.isFinite), code).toBe(true);
      buffers.add(selected.positions.buffer);
    }
    expect(buffers.size).toBe(12);
  });
});

describe("V638 projected selected-figure visibility", () => {
  it("accepts a segment crossing the viewport even when both endpoints are outside", () => {
    const projection = projectMainlineAConstellationSegmentsV638([-2, 0, 0, 2, 0, 0], IDENTITY);
    expect(projection).toMatchObject({
      status: "visible", visibleSegments: 1, bounds: { left: -1, right: 1, top: 0, bottom: 0 },
    });
  });

  it("rejects same-side and diagonal nonintersecting segments", () => {
    for (const segment of [
      [2, 0, 0, 3, 1, 0],
      [0, 2, 0, 1, 3, 0],
      [0, 0, 2, 1, 1, 3],
      [-3, 0, 0, 0, 3, 0],
    ]) {
      expect(projectMainlineAConstellationSegmentsV638(segment, IDENTITY).status).toBe("outside-viewport");
    }
  });

  it("honors camera perspective, near/far planes, and figures behind the camera", () => {
    const camera = new PerspectiveCamera(60, 1, 1, 10);
    const matrix = camera.projectionMatrix.elements;
    expect(projectMainlineAConstellationSegmentsV638([-.1, 0, -2, .1, 0, -2], matrix).visibleSegments).toBe(1);
    expect(projectMainlineAConstellationSegmentsV638([-.1, 0, 2, .1, 0, 2], matrix).visibleSegments).toBe(0);
    expect(projectMainlineAConstellationSegmentsV638([-.1, 0, -.1, .1, 0, -.1], matrix).visibleSegments).toBe(0);
    expect(projectMainlineAConstellationSegmentsV638([-.1, 0, -20, .1, 0, -20], matrix).visibleSegments).toBe(0);
    expect(projectMainlineAConstellationSegmentsV638([-.1, 0, -.5, .1, 0, -2], matrix).visibleSegments).toBe(1);
  });

  it("does not count projected points or depth-only segments as a visible figure", () => {
    expect(projectMainlineAConstellationSegmentsV638([0, 0, -.5, 0, 0, .5], IDENTITY).visibleSegments).toBe(0);
    expect(projectMainlineAConstellationSegmentsV638([.2, .2, 0, .2, .2, 0], IDENTITY).bounds).toBeNull();
  });

  it("applies world transforms rather than testing untransformed figure positions", () => {
    const translated = new Matrix4().makeTranslation(5, 0, 0);
    expect(projectMainlineAConstellationSegmentsV638([-.1, 0, 0, .1, 0, 0], translated.elements).visibleSegments).toBe(0);
  });

  it("fails closed on malformed positions, projection matrices and numerical overflow", () => {
    for (const [positions, matrix] of [
      [[], IDENTITY], [[1, 2, 3], IDENTITY], [[0, 0, 0, NaN, 0, 0], IDENTITY],
      [[0, 0, 0, 1, 0, 0], [1, 0]], [[0, 0, 0, 1, 0, 0], IDENTITY.map(() => NaN)],
      [[Number.MAX_VALUE, 0, 0, Number.MAX_VALUE, 1, 0], new Matrix4().makeScale(2, 2, 2).elements],
    ]) expect(projectMainlineAConstellationSegmentsV638(positions, matrix).status).toBe("invalid");
  });

  it("can distinguish every canonical figure viewed head-on from the same figure behind the camera", () => {
    for (const code of CANONICAL_CODES) {
      const selected = selectMainlineAConstellationFigureV638(`constellation:${code}`, CONSTELLATION_LINES, 9500);
      const center = new Vector3();
      for (let index = 0; index < selected.positions.length; index += 3) {
        center.add(new Vector3(selected.positions[index], selected.positions[index + 1], selected.positions[index + 2]));
      }
      center.normalize();
      const camera = new PerspectiveCamera(60, 16 / 9, .1, 20000);
      camera.lookAt(center);
      camera.updateMatrixWorld();
      const forward = new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      expect(projectMainlineAConstellationSegmentsV638(selected.positions, forward.elements).visibleSegments, code).toBeGreaterThan(0);
      camera.lookAt(center.negate());
      camera.updateMatrixWorld();
      const backward = new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      expect(projectMainlineAConstellationSegmentsV638(selected.positions, backward.elements).visibleSegments, code).toBe(0);
    }
  });

  it.each(CANONICAL_VIEWPORT_CASES)("keeps $code reachable from its actual catalog direction in $viewport", ({ code, aspect }) => {
    const entries = celestialEntriesForKinds(["constellation"]);
    const entry = entries.find((candidate) => candidate.id === `constellation:${code}`);
    expect(entry, code).toBeDefined();
    const direction = celestialEntryToDirection(entry!);
    expect(direction, code).not.toBeNull();
    const selection = selectMainlineAConstellationFigureV638(entry!.id, CONSTELLATION_LINES, 9500);
    const camera = new PerspectiveCamera(60, aspect, .1, 20000);
    camera.lookAt(new Vector3(...direction!));
    camera.updateMatrixWorld();
    const matrix = new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    const projection = projectMainlineAConstellationSegmentsV638(selection.positions, matrix.elements);
    expect(projection.status).toBe("visible");
    expect(projection.visibleSegments).toBeGreaterThan(0);
    expect(projection.bounds).not.toBeNull();
    expect(Object.values(projection.bounds!).every(Number.isFinite)).toBe(true);
  });

  it("uses one sky basis for every catalog kind, so members lie near their constellation (A4)", () => {
    const placed = CELESTIAL_CATALOG_ENTRIES.filter((entry) => entry.raHours != null && entry.decDeg != null);
    expect(placed.some((entry) => entry.kind !== "constellation")).toBe(true);
    for (const entry of placed) {
      expect(celestialEntryToDirection(entry), entry.id).toEqual(starToDirection(entry.raHours!, entry.decDeg!));
    }
    // Shared basis: +Z for increasing RA (a known mirror of the real sky, kept consistent across layers).
    expect(starToDirection(6, 0)[2]).toBe(1);
    const angle = (a: string, b: string) => {
      const [u, v] = [a, b].map((id) => celestialEntryToDirection(CELESTIAL_CATALOG_ENTRIES.find((entry) => entry.id === id)!)!);
      return Math.acos(Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2])) * 180 / Math.PI;
    };
    expect(angle("constellation:Ori", "nebula:m42")).toBeLessThan(20);
  });
});

describe("V638 observed frame contract", () => {
  const selection = selectMainlineAConstellationFigureV638("constellation:Ori", [SIMPLE_FIGURE], 1);
  const projection = projectMainlineAConstellationSegmentsV638(selection.positions, IDENTITY);
  const visible = { selection, enabled: true, ancestorsVisible: true, opacity: .3, projection, drawObserved: true };

  it("requires an actual selected-figure draw after the projection check", () => {
    expect(mainlineAConstellationFrameStateV638({ ...visible, drawObserved: false })).toBe("awaiting-draw");
    expect(mainlineAConstellationFrameStateV638(visible)).toBe("ready");
  });

  it("invalidates ready when hidden by a parent, disabled, transparent or moved outside the viewport", () => {
    for (const override of [
      { enabled: false }, { ancestorsVisible: false }, { opacity: 0 }, { opacity: NaN },
      { projection: projectMainlineAConstellationSegmentsV638([2, 0, 0, 3, 0, 0], IDENTITY) },
    ]) expect(mainlineAConstellationFrameStateV638({ ...visible, ...override })).toBe("unobserved");
  });

  it("does not replace missing or invalid selected geometry with background success", () => {
    expect(mainlineAConstellationFrameStateV638({
      ...visible, selection: selectMainlineAConstellationFigureV638("", [], 1),
    })).toBe("none");
    expect(mainlineAConstellationFrameStateV638({
      ...visible, selection: selectMainlineAConstellationFigureV638("constellation:Ori", [], 1),
    })).toBe("failed");
  });
});

describe("V638 reachable canonical constellation index", () => {
  it("uses exact catalog IDs and sealed order without admitting near-name matches", () => {
    const rows = [{ id: "constellation:UMa" }, { id: "stellar-hero:Ori" }, { id: "constellation:Ori" }, { id: "constellation:Ori:copy" }];
    expect(mainlineAConstellationCatalogRowsV638(rows, ["Ori", "UMa", "Cas"], "canonical"))
      .toEqual([{ id: "constellation:Ori" }, { id: "constellation:UMa" }]);
    expect(mainlineAConstellationCatalogRowsV638(rows, CANONICAL_CODES, "all")).toBe(rows);
  });
});

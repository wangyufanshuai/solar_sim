import { describe, expect, it } from "vitest";
import bindingReceipt from "../../public/data/celestial-art-v589/constellation-gaia-bindings-v589.json";
import {
  GAIA_RANGE_MAX_BYTES_V590,
  GAIA_RANGE_CONCURRENCY_V590,
  CELESTIAL_SPHERE_RADIUS_V590,
  CONSTELLATION_SPHERE_RADIUS_V590,
  CONSTELLATION_BINDING_IDENTITY_SHA256_V590,
  DEFAULT_CONSTELLATIONS_DESKTOP_V590,
  DEFAULT_CONSTELLATIONS_MOBILE_V590,
  FROZEN_SKY_ASSETS_V590,
  HERO_NEBULAE_V590,
  MILKY_WAY_SPHERE_RADIUS_V590,
  MILKY_WAY_ROTATION_V590,
  angularDistanceDegV590,
  bpRpToLinearRgbV590,
  cameraCentredCelestialPositionV590,
  celestialDirectionFromCameraV590,
  classifyStarPsfV590,
  mergeBoundedCatalogRangesV590,
  normalizeCelestialPositionV590,
  parseConstellationBindingReceiptV590,
  raDecToCelestialPositionV590,
  selectStratifiedCatalogLeavesV590,
  selectStratifiedCatalogParentsV590,
  shouldRequestStarfieldViewV590,
  starBudgetV590,
  starPixelSizeV590,
  starPsfRotationV590,
  stratifiedParentLimitV590,
  visualMagnitudeFluxV590,
} from "./celestialDeepSpaceV590";
import { DEEP_SPACE_LAYERS_V590 } from "./celestialRenderingV590";

describe("v590 celestial deep-space contract", () => {
  it("pins the v588 base identity separately from its frozen V9 overlays", () => {
    expect(MILKY_WAY_ROTATION_V590).toEqual([-0.34, 4.24, -0.86]);
    expect(FROZEN_SKY_ASSETS_V590).toHaveLength(3);
    expect(FROZEN_SKY_ASSETS_V590[0]?.frozenDependency).toBe("v588-readonly");
    expect(FROZEN_SKY_ASSETS_V590.slice(1).every((asset) => asset.frozenDependency === "V9-readonly")).toBe(true);
    expect(FROZEN_SKY_ASSETS_V590[0]?.desktopUrl).toContain("candidate-v588/sky/milky-way-desktop.jpg");
    expect(FROZEN_SKY_ASSETS_V590[0]?.mobileUrl).toContain("candidate-v588/sky/milky-way-mobile.jpg");
  });

  it("uses one common celestial radius without source-id parallax", () => {
    const a = raDecToCelestialPositionV590(0, 0);
    const b = raDecToCelestialPositionV590(173.2, -48.5);
    expect(Math.hypot(...a)).toBeCloseTo(CELESTIAL_SPHERE_RADIUS_V590, 9);
    expect(Math.hypot(...b)).toBeCloseTo(CELESTIAL_SPHERE_RADIUS_V590, 9);
    expect(Math.hypot(...normalizeCelestialPositionV590([84, -22, 90]))).toBeCloseTo(CELESTIAL_SPHERE_RADIUS_V590, 9);
    expect(MILKY_WAY_SPHERE_RADIUS_V590).toBe(CELESTIAL_SPHERE_RADIUS_V590);
    expect(CONSTELLATION_SPHERE_RADIUS_V590).toBe(CELESTIAL_SPHERE_RADIUS_V590);
  });

  it("keeps every Gaia Range response inside the buffered delivery ceiling", () => {
    expect(GAIA_RANGE_CONCURRENCY_V590).toBe(1);
    const ranges = mergeBoundedCatalogRangesV590([
      { cell: 1, archiveOffset: 0, byteLength: 700_000, rowCount: 1, parentOrder5Cell: 0, centerRaDeg: 0, centerDecDeg: 0 },
      { cell: 2, archiveOffset: 700_128, byteLength: 700_000, rowCount: 1, parentOrder5Cell: 0, centerRaDeg: 0, centerDecDeg: 0 },
      { cell: 3, archiveOffset: 1_500_000, byteLength: 16_384, rowCount: 1, parentOrder5Cell: 0, centerRaDeg: 0, centerDecDeg: 0 },
    ]);
    expect(ranges).toHaveLength(3);
    expect(ranges.every((range) => range.end - range.start + 1 <= GAIA_RANGE_MAX_BYTES_V590)).toBe(true);
    expect(() => mergeBoundedCatalogRangesV590([
      { cell: 4, archiveOffset: 0, byteLength: GAIA_RANGE_MAX_BYTES_V590 + 1, rowCount: 1, parentOrder5Cell: 0, centerRaDeg: 0, centerDecDeg: 0 },
    ])).toThrow("v590-gaia-range-entry:4");
  });

  it("stratifies dense Gaia parents and leaves across the complete view cone", () => {
    const view = { raDeg: 266.4, decDeg: -28.9, fovDeg: 85 } as const;
    let cell = 0;
    const parents = Array.from({ length: 21 }, (_, row) => Array.from({ length: 21 }, (_, column) => {
      const x = (column - 10) * 4;
      const y = (row - 10) * 4;
      return {
        cell: cell++,
        archiveOffset: cell * 4096,
        byteLength: 4096,
        rowCount: Math.hypot(x, y) < 8 ? 2_400 : 80,
        parentOrder5Cell: 0,
        centerRaDeg: view.raDeg + x / Math.cos(view.decDeg * Math.PI / 180),
        centerDecDeg: view.decDeg + y,
      };
    })).flat();
    const selected = selectStratifiedCatalogParentsV590(parents, view, 120);
    const replay = selectStratifiedCatalogParentsV590(parents, view, 120);
    expect(selected.map((entry) => entry.cell)).toEqual(replay.map((entry) => entry.cell));
    expect(selected).toHaveLength(120);
    expect(Math.max(...selected.map((entry) => angularDistanceDegV590(
      entry.centerRaDeg,
      entry.centerDecDeg,
      view.raDeg,
      view.decDeg,
    )))).toBeGreaterThan(30);
    expect(stratifiedParentLimitV590(60_000)).toBe(384);

    const parentOrder = selected.slice(0, 3).map((entry) => entry.cell);
    const leaves = parentOrder.flatMap((parent) => Array.from({ length: 4 }, (_, index) => ({
      cell: parent * 16 + index,
      rowCount: 10,
    })));
    const selectedLeaves = selectStratifiedCatalogLeavesV590(leaves, parentOrder, 50);
    expect(selectedLeaves).toHaveLength(5);
    expect(new Set(selectedLeaves.slice(0, 3).map((entry) => Math.floor(entry.cell / 16))).size).toBe(3);
  });

  it("preserves celestial orientation under arbitrary camera translation", () => {
    const direction = raDecToCelestialPositionV590(83.8221, -5.3911, 1);
    const firstCamera = [0, 0, 0] as const;
    const translatedCamera = [42.5, -3.25, 18.75] as const;
    const first = cameraCentredCelestialPositionV590(direction, firstCamera);
    const translated = cameraCentredCelestialPositionV590(direction, translatedCamera);
    const firstDirection = celestialDirectionFromCameraV590(first, firstCamera);
    const translatedDirection = celestialDirectionFromCameraV590(translated, translatedCamera);
    firstDirection.forEach((value, index) => expect(value).toBeCloseTo(translatedDirection[index]!, 13));
  });

  it("never reloads a stationary view merely because throttle time elapsed", () => {
    const view = { raDeg: 83.8, decDeg: -5.4, fovDeg: 72 } as const;
    expect(shouldRequestStarfieldViewV590({
      current: view,
      lastRequested: { ...view, sentAtMs: 1_000 },
      lastAngleChangeAtMs: 1_000,
      nowMs: 120_000,
      requestInFlight: false,
    })).toBe(false);
    expect(shouldRequestStarfieldViewV590({
      current: { ...view, raDeg: 96 },
      lastRequested: { ...view, sentAtMs: 1_000 },
      lastAngleChangeAtMs: 2_000,
      nowMs: 3_000,
      requestInFlight: false,
    })).toBe(true);
    expect(shouldRequestStarfieldViewV590({
      current: { ...view, raDeg: 96 },
      lastRequested: { ...view, sentAtMs: 1_000 },
      lastAngleChangeAtMs: 2_000,
      nowMs: 3_000,
      requestInFlight: true,
    })).toBe(false);
  });

  it("keeps flux classes photometric and source identity rotation-only", () => {
    expect(visualMagnitudeFluxV590(1) / visualMagnitudeFluxV590(2)).toBeCloseTo(2.5118864315, 9);
    expect(classifyStarPsfV590(3.5)).toBe(2);
    expect(classifyStarPsfV590(3.5001)).toBe(1);
    expect(classifyStarPsfV590(8.25)).toBe(1);
    expect(classifyStarPsfV590(8.2501)).toBe(0);
    expect(starPixelSizeV590(1)).toBeGreaterThan(starPixelSizeV590(9));
    expect(starPsfRotationV590("123456789")).toBe(starPsfRotationV590(BigInt("123456789")));
    expect(starPsfRotationV590("123456789")).not.toBe(starPsfRotationV590("123456780"));
    expect(bpRpToLinearRgbV590(-0.2)[2]).toBeGreaterThan(bpRpToLinearRgbV590(2.8)[2]);
  });

  it("validates all 88 constellations and 484 Gaia-bound waypoints", () => {
    const parsed = parseConstellationBindingReceiptV590(bindingReceipt);
    expect(parsed.bindingSha256).toBe(CONSTELLATION_BINDING_IDENTITY_SHA256_V590);
    expect(parsed.bindings).toHaveLength(88);
    expect(parsed.bindings.flatMap((entry) => entry.waypoints)).toHaveLength(484);
    expect(Math.max(...parsed.bindings.flatMap((entry) => entry.waypoints.map((point) => point.angularDistanceDeg)))).toBeLessThanOrEqual(1.5);
    expect(DEFAULT_CONSTELLATIONS_DESKTOP_V590).toHaveLength(12);
    expect(DEFAULT_CONSTELLATIONS_MOBILE_V590).toHaveLength(8);
  });

  it("keeps six real-coordinate nebula markers honestly asset-blocked", () => {
    expect(HERO_NEBULAE_V590).toHaveLength(6);
    expect(HERO_NEBULAE_V590.every((entry) => entry.assetState === "asset-blocked")).toBe(true);
    expect(HERO_NEBULAE_V590.every((entry) => entry.markerState === "verified-coordinate-marker")).toBe(true);
    const contract = DEEP_SPACE_LAYERS_V590.filter((entry) => entry.kind === "catalog-nebula");
    expect(HERO_NEBULAE_V590.map((entry) => ({
      id: entry.id,
      ra: entry.raDeg,
      dec: entry.decDeg,
      size: entry.angularSizeDeg,
    }))).toEqual(contract.map((entry) => ({
      id: entry.id,
      ra: entry.rightAscensionDeg,
      dec: entry.declinationDeg,
      size: entry.angularSizeDeg,
    })));
  });

  it("locks full and lite Gaia budgets", () => {
    expect(starBudgetV590("standalone-full", "desktop")).toBe(60_000);
    expect(starBudgetV590("standalone-full", "mobile")).toBe(18_000);
    expect(starBudgetV590("vercel-lite", "desktop")).toBe(30_000);
    expect(starBudgetV590("vercel-lite", "mobile")).toBe(10_000);
  });
});

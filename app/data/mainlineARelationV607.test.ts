import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MAINLINE_A1_OBJECTS } from "./mainlineARegistryV607";
import { getMainlineA1CatalogId, getMainlineA1Object } from "./mainlineARegistryV607";
import { selectCelestialCatalogEntry } from "../lib/celestialCatalog";
import { PULSARS } from "./pulsarCatalog";
import { NEBULAE } from "./nebulaCatalog";
import { getMainlineAObservationRoutesForObjectV607, getMainlineAObservationStepCatalogIdV607 } from "./mainlineAObservationRoutesV607";

describe("Mainline A stage A5 relation navigation", () => {
  it("keeps both Crab pulsar aliases at the same cited distance as their remnant", () => {
    const distance = NEBULAE.find((row) => row.id === "m1")!.distancePc;
    expect(distance).toBe(2000);
    for (const id of ["b0531+21", "j0534+2200"]) expect(PULSARS.find((row) => row.id === id)?.distancePc).toBe(distance);
  });
  it("resolves every internal and external relation to a catalog focus target", () => {
    for (const object of MAINLINE_A1_OBJECTS) {
      for (const relatedId of object.relatedObjectIds ?? []) {
        const target = getMainlineA1Object(relatedId);
        const catalogId = getMainlineA1CatalogId(relatedId);
        expect(target, `${object.id} -> ${relatedId} registry target`).toBeDefined();
        expect(catalogId, `${object.id} -> ${relatedId} catalog id`).toBeDefined();
        expect(selectCelestialCatalogEntry(catalogId!), `${object.id} -> ${catalogId} catalog entry`).not.toBeNull();
      }
      for (const catalogId of object.relatedCatalogIds ?? []) {
        expect(selectCelestialCatalogEntry(catalogId), `${object.id} -> ${catalogId} external catalog entry`).not.toBeNull();
      }
    }
  });

  it("keeps internal relation edges reciprocal so a focus path can return", () => {
    for (const object of MAINLINE_A1_OBJECTS) {
      for (const relatedId of object.relatedObjectIds ?? []) {
        const target = getMainlineA1Object(relatedId);
        expect(target?.relatedObjectIds ?? [], `${object.id} -> ${relatedId}`).toContain(object.id);
      }
    }
  });

  it("exposes relation controls that invoke the shared catalog-focus path", () => {
    const passportSource = readFileSync("app/components/CelestialObjectPassportPanel.tsx", "utf8");
    const focusSource = readFileSync("app/lib/useAtlasFocusController.ts", "utf8");
    expect(passportSource).toContain('data-mainline-a-related-objects="true"');
    expect(passportSource).toContain('data-mainline-a-related-catalog-objects="true"');
    expect(passportSource).toContain("onSelectRelatedObject(catalogId)");
    expect(focusSource).toContain("const requestCatalogObjectFocus");
    expect(focusSource).toContain("dispatchCameraFocusDirection(direction)");
    expect(focusSource).toContain('setSelectedCelestialCatalogId(entry.id)');
  });

  it("keeps the external Crab pulsar edge reversible through the route context", () => {
    const routes = getMainlineAObservationRoutesForObjectV607("pulsar:b0531+21");
    expect(routes).toHaveLength(1);
    const route = routes[0]!;
    const pulsar = route.steps.find((step) => getMainlineAObservationStepCatalogIdV607(step) === "pulsar:b0531+21");
    expect(pulsar?.relationType).toBe("物理关联");
    const m1 = route.steps.find((step) => step.objectId === "m1");
    expect(getMainlineAObservationStepCatalogIdV607(m1!)).toBe("nebula:m1");
  });
});

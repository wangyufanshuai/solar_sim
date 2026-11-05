import { describe, expect, it } from "vitest";
import { selectCelestialCatalogEntry } from "../lib/celestialCatalog";
import { MAINLINE_A1_OBJECTS, getMainlineA1Object, getMainlineA1ObjectByCatalogId } from "./mainlineARegistryV607";
import {
  getMainlineAObservationStepCatalogIdV607,
  MAINLINE_A_OBSERVATION_ROUTES_V607,
} from "./mainlineAObservationRoutesV607";

describe("Mainline A science observation routes", () => {
  it("keeps five compact routes with unique stable route and stop identities", () => {
    expect(MAINLINE_A_OBSERVATION_ROUTES_V607).toHaveLength(5);
    const routeIds = MAINLINE_A_OBSERVATION_ROUTES_V607.map((route) => route.id);
    const stepIds = MAINLINE_A_OBSERVATION_ROUTES_V607.flatMap((route) => route.steps.map((step) => step.id));
    expect(new Set(routeIds).size).toBe(routeIds.length);
    expect(new Set(stepIds).size).toBe(stepIds.length);
    for (const route of MAINLINE_A_OBSERVATION_ROUTES_V607) {
      expect(route.id).toMatch(/^[a-z][a-z0-9-]+$/);
      expect(route.steps.length).toBeGreaterThanOrEqual(3);
      expect(route.steps.length).toBeLessThanOrEqual(5);
      expect(route.titleCn).toMatch(/[\u4e00-\u9fff]/);
      expect(route.questionCn).toMatch(/[\u4e00-\u9fff].*？$/);
      expect(route.summaryCn.length).toBeGreaterThan(0);
      for (const step of route.steps) {
        expect(step.id).toMatch(/^[a-z][a-z0-9-]+$/);
        expect(step.titleCn).toMatch(/[\u4e00-\u9fff]/);
        expect(step.whyCn).toMatch(/[\u4e00-\u9fff]/);
        const sentences = step.whyCn.split(/[。！？]/).filter((sentence) => sentence.trim());
        expect(sentences.length).toBeGreaterThanOrEqual(1);
        expect(sentences.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it("resolves every stop to the runtime focus catalog without inventing registry identities", () => {
    for (const route of MAINLINE_A_OBSERVATION_ROUTES_V607) {
      const destinations = route.steps.map((step) => getMainlineAObservationStepCatalogIdV607(step));
      expect(new Set(destinations).size, route.id).toBe(route.steps.length);
      for (const step of route.steps) {
        expect(Number(typeof step.objectId === "string") + Number(typeof step.catalogId === "string"), step.id).toBe(1);
        const catalogId = getMainlineAObservationStepCatalogIdV607(step);
        const catalogEntry = selectCelestialCatalogEntry(catalogId);
        expect(catalogEntry, `${route.id}: ${step.id} -> ${catalogId}`).not.toBeNull();
        expect(catalogEntry?.id).toBe(catalogId);
        if (step.objectId) {
          expect(getMainlineA1Object(step.objectId), step.id).toBeDefined();
          expect(getMainlineA1ObjectByCatalogId(catalogId!)?.id, step.id).toBe(step.objectId);
        }
      }
    }
  });

  it("preserves registry aliases and does not fabricate a target for an unknown object", () => {
    expect(getMainlineAObservationStepCatalogIdV607({ objectId: "sirius-a" })).toBe("nearby-star:sirius");
    expect(getMainlineAObservationStepCatalogIdV607({ objectId: "missing-object" })).toBeUndefined();
    expect(getMainlineAObservationStepCatalogIdV607({ catalogId: "pulsar:b0531+21" })).toBe("pulsar:b0531+21");
  });

  it("gives every relation an explicit different stop, including each route's starting point", () => {
    for (const route of MAINLINE_A_OBSERVATION_ROUTES_V607) {
      for (const step of route.steps) {
        expect(route.steps.find((candidate) => candidate.id === step.relationToStepId), step.id).toBeDefined();
        expect(step.relationToStepId, step.id).not.toBe(step.id);
        expect(["视线邻近", "演化对比", "物理关联", "呈现对比"]).toContain(step.relationType);
        expect(step.relationNoteCn.length, step.id).toBeGreaterThan(0);
      }
    }
  });

  it("keeps Orion and Scorpius sky relationships distinct from a physical system", () => {
    const skySteps = MAINLINE_A_OBSERVATION_ROUTES_V607.flatMap((route) => route.steps)
      .filter((step) => step.relationType === "视线邻近");
    expect(skySteps.length).toBeGreaterThan(0);
    for (const step of skySteps) {
      expect(step.relationNoteCn, step.id).toMatch(/天空|投影|方向|视线/);
      expect(step.relationNoteCn, step.id).toMatch(/不表示|不把|不由|不代表|另一个对象/);
    }
    const orion = MAINLINE_A_OBSERVATION_ROUTES_V607.find((route) => route.id === "orion-clouds-and-stars")!;
    expect(orion.steps.map((step) => step.objectId)).toEqual(["Ori", "m42", "b33", "betelgeuse", "rigel"]);
    expect(orion.steps.every((step) => step.relationType !== "物理关联")).toBe(true);
    expect(orion.steps.find((step) => step.objectId === "b33")?.relationNoteCn).toContain("不由目录中相近的距离值推断同一云团");
  });

  it("compares independent planetary nebulae without turning shapes into a time sequence", () => {
    const shells = MAINLINE_A_OBSERVATION_ROUTES_V607.find((route) => route.id === "stellar-shells")!;
    expect(shells.summaryCn).toContain("不是按年龄排列");
    expect(shells.steps.map((step) => step.objectId).sort()).toEqual(["m57", "ngc6543", "ngc7293"]);
    for (const step of shells.steps) {
      const object = getMainlineA1Object(step.objectId!);
      expect(object?.kind).toBe("nebula");
      expect(object && "nebulaKind" in object ? object.nebulaKind : undefined).toBe("planetary");
      expect(step.relationType).toBe("演化对比");
    }
  });

  it("requires existing object evidence for the Crab physical relation, not angular or distance proximity", () => {
    const physicalEdges = MAINLINE_A_OBSERVATION_ROUTES_V607.flatMap((route) =>
      route.steps.filter((step) => step.relationType === "物理关联").map((step) => ({ route, step })),
    );
    expect(physicalEdges).toHaveLength(1);
    for (const { route, step } of physicalEdges) {
      const related = route.steps.find((candidate) => candidate.id === step.relationToStepId)!;
      const pair = [getMainlineAObservationStepCatalogIdV607(step), getMainlineAObservationStepCatalogIdV607(related)].sort();
      expect(pair).toEqual(["nebula:m1", "pulsar:b0531+21"]);
      expect(getMainlineA1Object(related.objectId!)?.relatedCatalogIds).toContain(step.catalogId);
    }
  });

  it("provides a route entry for every current Mainline A object and the external pulsar", () => {
    const destinations = new Set(MAINLINE_A_OBSERVATION_ROUTES_V607.flatMap((route) => route.steps.map((step) => step.objectId ?? step.catalogId)));
    for (const object of MAINLINE_A1_OBJECTS) expect(destinations, object.id).toContain(object.id);
    expect(destinations).toContain("pulsar:b0531+21");
  });
});

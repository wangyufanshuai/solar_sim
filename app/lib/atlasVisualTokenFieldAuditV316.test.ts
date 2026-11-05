import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ATLAS_VISUAL_TOKEN_FIELD_CONSUMERS_V316,
  ATLAS_VISUAL_TOKEN_FIELDS_V316,
  createAtlasVisualTokenFieldAuditV316,
} from "./atlasVisualTokenFieldAuditV316";

describe("v316 visual token field audit", () => {
  it("maps all 46 profile fields to concrete source expressions", () => {
    const audit = createAtlasVisualTokenFieldAuditV316();
    expect(audit).toMatchObject({
      status: "field-complete-static-consumer-contract",
      requiredFieldCount: 46,
      declaredFieldCount: 46,
      boundary: "source-contract-plus-runtime-group-signature-browser-matrix-pending",
    });
    expect(Object.values(audit.missingByGroup).every((fields) => fields.length === 0)).toBe(true);
    expect(Object.keys(ATLAS_VISUAL_TOKEN_FIELDS_V316)).toHaveLength(8);
    for (const consumer of ATLAS_VISUAL_TOKEN_FIELD_CONSUMERS_V316) {
      const source = readFileSync(resolve(process.cwd(), consumer.source), "utf8");
      for (const field of consumer.fields) expect(source, `${consumer.source}:${field.token}`).toContain(field.expression);
    }
  });

  it("keeps the newly closed fields attached to rendering math rather than metadata only", () => {
    const sky = readFileSync(resolve(process.cwd(), "app/components/GalaxyEnvironmentSupport.ts"), "utf8");
    const planets = readFileSync(resolve(process.cwd(), "app/components/usePlanetPresentationMaterials.ts"), "utf8");
    const catalog = readFileSync(resolve(process.cwd(), "app/components/GaiaStarField.tsx"), "utf8");
    const hud = readFileSync(resolve(process.cwd(), "app/components/ScienceCinematicVisualSurfaceV261.tsx"), "utf8");
    expect(sky).toContain("uDarkfieldStrength.value + sky.blackLevel");
    expect(sky).toContain("uExposureRolloff.value *= sky.highlightShoulder");
    expect(planets).toContain("uProfileTerminatorSoftness");
    expect(planets).toContain("profileSoftness");
    expect(catalog).toContain("profileDistanceAttenuation");
    expect(hud).toContain("hudGridSizePx");
  });
});

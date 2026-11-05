import type { BufferGeometry, Material } from "three";
import { acquireAtlasResource } from "./atlasResourceLifecycle";

export type ConstellationEngravingResourcesV592 = Readonly<{
  outline: BufferGeometry;
  inner: BufferGeometry;
  hatch: BufferGeometry;
  fill: BufferGeometry;
  outlineMaterial: Material;
  innerMaterial: Material;
  hatchMaterial: Material;
  fillMaterial: Material;
}>;

export const CONSTELLATION_ENGRAVING_RESOURCE_OWNER_V592 = "v592-constellation-engraving";

export function acquireConstellationEngravingResourcesV592(
  resources: ConstellationEngravingResourcesV592,
  identity: Readonly<{ code: string; signature: string; deviceTier: "desktop" | "mobile" }>,
): () => void {
  const geometries = ["outline", "inner", "hatch", "fill"] as const;
  const materials = ["outlineMaterial", "innerMaterial", "hatchMaterial", "fillMaterial"] as const;
  const prefix = `v592-constellation-${identity.code}-${identity.signature}-${identity.deviceTier}`;
  const entries = [...geometries, ...materials].map((part) => {
    const resource = resources[part];
    // Attribute bytes are an allocation estimate; material/GPU overhead is unknown.
    const geometry = geometries.includes(part as typeof geometries[number]) ? resources[part as typeof geometries[number]] : null;
    const estimatedBytes = geometry?.getAttribute("position")?.array.byteLength ?? 0;
    return {
      resource,
      released: false,
      releaseRegistry: acquireAtlasResource("model", "atlas", `${prefix}-${part}`, {
        owner: CONSTELLATION_ENGRAVING_RESOURCE_OWNER_V592,
        estimatedBytes,
      }),
    };
  });
  return () => {
    const errors: unknown[] = [];
    for (const entry of entries) {
      if (entry.released) continue;
      try {
        entry.resource.dispose();
        entry.releaseRegistry();
        entry.released = true;
      } catch (error) {
        // Failed disposal stays visible in the registry and can be retried.
        errors.push(error);
      }
    }
    if (errors.length) throw new AggregateError(errors, "constellation-engraving-disposal-failed");
  };
}

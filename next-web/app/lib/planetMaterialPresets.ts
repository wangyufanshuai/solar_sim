/**
 * Per-body MeshStandardMaterial presets tuned for realistic PBR appearance.
 * Roughness closer to 1.0 = matte/diffuse; closer to 0.0 = mirror-like.
 * Gas giants are smooth but diffuse; rocky bodies are rough.
 */
export type PlanetMaterialPreset = {
  roughness: number;
  metalness: number;
  emissiveIntensity: number;
};

export function planetMaterialPreset(planetId: string): PlanetMaterialPreset {
  switch (planetId) {
    // Rocky planets — high roughness, slight metallicity for iron-rich surfaces
    case "mercury":
      return { roughness: 0.95, metalness: 0.12, emissiveIntensity: 0.06 };
    case "venus":
      return { roughness: 0.65, metalness: 0.0, emissiveIntensity: 0.08 };
    case "earth":
      return { roughness: 0.78, metalness: 0.02, emissiveIntensity: 0.04 };
    case "moon":
      return { roughness: 0.96, metalness: 0.01, emissiveIntensity: 0.04 };
    case "mars":
      return { roughness: 0.92, metalness: 0.03, emissiveIntensity: 0.05 };
    // Gas giants — low roughness (smooth banded atmosphere), very low metalness
    case "jupiter":
      return { roughness: 0.58, metalness: 0.0, emissiveIntensity: 0.05 };
    case "saturn":
      return { roughness: 0.62, metalness: 0.0, emissiveIntensity: 0.04 };
    // Ice giants — slightly rougher, subtle sheen
    case "uranus":
      return { roughness: 0.55, metalness: 0.0, emissiveIntensity: 0.04 };
    case "neptune":
      return { roughness: 0.52, metalness: 0.0, emissiveIntensity: 0.04 };
    // Icy moons
    case "europa":
      return { roughness: 0.72, metalness: 0.0, emissiveIntensity: 0.04 };
    case "ganymede":
      return { roughness: 0.88, metalness: 0.02, emissiveIntensity: 0.04 };
    case "callisto":
      return { roughness: 0.94, metalness: 0.01, emissiveIntensity: 0.04 };
    case "enceladus":
      return { roughness: 0.42, metalness: 0.0, emissiveIntensity: 0.06 };
    case "titan":
      return { roughness: 0.68, metalness: 0.0, emissiveIntensity: 0.04 };
    case "io":
      return { roughness: 0.82, metalness: 0.0, emissiveIntensity: 0.06 };
    case "triton":
      return { roughness: 0.70, metalness: 0.0, emissiveIntensity: 0.04 };
    // Dwarf planets / small bodies
    case "pluto":
      return { roughness: 0.90, metalness: 0.02, emissiveIntensity: 0.04 };
    case "ceres":
      return { roughness: 0.92, metalness: 0.03, emissiveIntensity: 0.04 };
    default:
      return { roughness: 0.90, metalness: 0.02, emissiveIntensity: 0.04 };
  }
}

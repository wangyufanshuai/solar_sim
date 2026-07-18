export const ORBIT_DIRECTOR_V3_VERSION =
  "v163-million-discovery-orbit-director-v3" as const;

export type OrbitGeometryProvenanceV3 =
  | "reference-kepler"
  | "reported"
  | "derived-kepler-display"
  | "layout-only"
  | "unknown-dashed-layout"
  | "mission-history";

export type OrbitDisplayDocumentV3 = {
  version: typeof ORBIT_DIRECTOR_V3_VERSION;
  objectId: string;
  provenance: OrbitGeometryProvenanceV3;
  priority: "selected" | "major" | "context";
  lineStyle: "selected-solid" | "reference-solid" | "derived-dash" | "unknown-dash" | "history-gradient";
  opacityScale: number;
  labelWeight: number;
  render: boolean;
  boundary: "display-layer-only-no-orbit-integrator-mutation";
};

export function createOrbitDisplayDocumentV3(args: {
  objectId: string;
  selectedObjectId?: string;
  major: boolean;
  inspectActive: boolean;
  closeupActive: boolean;
  provenance?: OrbitGeometryProvenanceV3;
}): OrbitDisplayDocumentV3 {
  const provenance = args.provenance ?? "reference-kepler";
  const selected = args.objectId === args.selectedObjectId;
  const priority = selected ? "selected" : args.major ? "major" : "context";
  const lineStyle = selected
    ? "selected-solid"
    : provenance === "unknown-dashed-layout"
      ? "unknown-dash"
      : provenance === "derived-kepler-display" || provenance === "layout-only"
        ? "derived-dash"
        : provenance === "mission-history"
          ? "history-gradient"
          : "reference-solid";
  const opacityScale = selected
    ? 1
    : args.closeupActive
      ? args.major ? 0.12 : 0.025
      : args.inspectActive
        ? args.major ? 0.44 : 0.08
        : args.major ? 0.9 : 0.22;
  return {
    version: ORBIT_DIRECTOR_V3_VERSION,
    objectId: args.objectId,
    provenance,
    priority,
    lineStyle,
    opacityScale,
    labelWeight: selected ? 1 : args.major ? 0.62 : 0.2,
    render: selected || args.major || !args.closeupActive,
    boundary: "display-layer-only-no-orbit-integrator-mutation",
  };
}

export type MillionStarDiscoveryCapabilityV3 = {
  version: "v163-million-star-discovery";
  localCatalogObjects: 1_224_219;
  parameterRichObjects: 218_617;
  liteCatalogObjects: 224_361;
  focusableCatalogObjects: 1_224_219;
  visibleRenderBudget: readonly [1000, 1800, 3000];
  stellarOrbitPolicy: "proper-motion-evidence-only-no-fabricated-galactic-orbits";
};

export const MILLION_STAR_DISCOVERY_CAPABILITY_V3: MillionStarDiscoveryCapabilityV3 = {
  version: "v163-million-star-discovery",
  localCatalogObjects: 1_224_219,
  parameterRichObjects: 218_617,
  liteCatalogObjects: 224_361,
  focusableCatalogObjects: 1_224_219,
  visibleRenderBudget: [1000, 1800, 3000],
  stellarOrbitPolicy: "proper-motion-evidence-only-no-fabricated-galactic-orbits",
};

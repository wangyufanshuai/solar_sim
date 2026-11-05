import * as THREE from "three";

export const V594_RELEASED_HEAP_QUERY = "v594ReleasedHeap" as const;
export const V594_RELEASED_HEAP_PROTOTYPE_REGISTRY_VERSION =
  "v594-released-heap-prototype-registry-v1" as const;

export const V594_RELEASED_HEAP_PROTOTYPE_KINDS = Object.freeze([
  "renderer",
  "scene",
  "scene-object",
  "geometry",
  "material",
  "texture",
] as const);

export type V594ReleasedHeapPrototypeKind =
  (typeof V594_RELEASED_HEAP_PROTOTYPE_KINDS)[number];

type V594ReleasedHeapPrototypeRegistry = {
  readonly version: typeof V594_RELEASED_HEAP_PROTOTYPE_REGISTRY_VERSION;
  readonly timeOrigin: number;
  readonly prototypes: Readonly<Record<V594ReleasedHeapPrototypeKind, Set<object>>>;
  registrationCount: number;
};

declare global {
  interface Window {
    __atlasV594ReleasedHeapPrototypeRegistryV1?: V594ReleasedHeapPrototypeRegistry;
  }
}

function createRegistry(): V594ReleasedHeapPrototypeRegistry {
  const prototypes = Object.fromEntries(
    V594_RELEASED_HEAP_PROTOTYPE_KINDS.map((kind) => [kind, new Set<object>()]),
  ) as Record<V594ReleasedHeapPrototypeKind, Set<object>>;
  return {
    version: V594_RELEASED_HEAP_PROTOTYPE_REGISTRY_VERSION,
    timeOrigin: performance.timeOrigin,
    prototypes: Object.freeze(prototypes),
    registrationCount: 0,
  };
}

function currentRegistry(): V594ReleasedHeapPrototypeRegistry {
  const existing = window.__atlasV594ReleasedHeapPrototypeRegistryV1;
  if (existing) return existing;
  const registry = createRegistry();
  Object.defineProperty(window, "__atlasV594ReleasedHeapPrototypeRegistryV1", {
    configurable: false,
    enumerable: false,
    writable: false,
    value: registry,
  });
  return registry;
}

function addPrototype(
  registry: V594ReleasedHeapPrototypeRegistry,
  kind: V594ReleasedHeapPrototypeKind,
  value: unknown,
) {
  if ((typeof value !== "object" && typeof value !== "function") || value === null) return;
  const prototype = Object.getPrototypeOf(value) as unknown;
  if ((typeof prototype === "object" || typeof prototype === "function") && prototype !== null) {
    registry.prototypes[kind].add(prototype as object);
  }
}

function materialRows(material: THREE.Material | THREE.Material[] | undefined) {
  if (!material) return [];
  return Array.isArray(material) ? material : [material];
}

function registerMaterialTextures(
  registry: V594ReleasedHeapPrototypeRegistry,
  material: THREE.Material,
) {
  for (const value of Object.values(material)) {
    if (value && typeof value === "object" && "isTexture" in value
      && (value as { isTexture?: unknown }).isTexture === true) {
      addPrototype(registry, "texture", value);
    }
  }
}

export function isV594ReleasedHeapSemanticProbeEnabled() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(V594_RELEASED_HEAP_QUERY) === "1";
}

/**
 * Registers prototypes only. No renderer, scene, material, geometry, texture,
 * or Object3D instance is retained by this audit-only registry. CDP can later
 * use Runtime.queryObjects against these stable prototypes after a released
 * double-GC checkpoint, which keeps an observed zero distinct from unknown.
 */
export function registerV594ReleasedHeapSemanticPrototypes(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
) {
  if (!isV594ReleasedHeapSemanticProbeEnabled()) return null;
  const registry = currentRegistry();
  addPrototype(registry, "renderer", gl);
  addPrototype(registry, "scene", scene);
  scene.traverse((object) => {
    addPrototype(registry, "scene-object", object);
    const renderable = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    if (renderable.geometry) addPrototype(registry, "geometry", renderable.geometry);
    for (const material of materialRows(renderable.material)) {
      addPrototype(registry, "material", material);
      registerMaterialTextures(registry, material);
    }
  });
  if (scene.background instanceof THREE.Texture) {
    addPrototype(registry, "texture", scene.background);
  }
  if (scene.environment instanceof THREE.Texture) {
    addPrototype(registry, "texture", scene.environment);
  }
  registry.registrationCount += 1;
  return Object.freeze({
    version: registry.version,
    timeOrigin: registry.timeOrigin,
    registrationCount: registry.registrationCount,
    prototypeCounts: Object.freeze(Object.fromEntries(
      V594_RELEASED_HEAP_PROTOTYPE_KINDS.map((kind) => [
        kind,
        registry.prototypes[kind].size,
      ]),
    )),
  });
}

import type { Material, Mesh } from "three";

// Background star layers use transparent, depth-test-free draws. The selected
// surface must join that queue before its halo (45) and corona (46), even though
// its fragment shader remains fully opaque.
export const MAINLINE_A_STELLAR_SURFACE_RENDER_ORDER_V638 = 44;

/** Borrows only the surface's queue flag; never owns or disposes its resources. */
export function createMainlineAStellarSurfaceCompositionV638() {
  const states = new Map<Material, { restoreOpaque: boolean }>();
  const disposed = new WeakSet<Material>();
  let active = true;

  function release(material: Material, restore: boolean): void {
    const state = states.get(material);
    if (!state) return;
    material.removeEventListener("dispose", onDisposed);
    if (restore && state.restoreOpaque && material.transparent) {
      material.transparent = false;
      material.needsUpdate = true;
    }
    states.delete(material);
  }

  function onDisposed({ target }: { target: Material }): void {
    disposed.add(target);
    release(target, false);
  }

  function retain(material: Material): void {
    if (disposed.has(material)) return;
    let state = states.get(material);
    if (!state) {
      state = { restoreOpaque: false };
      states.set(material, state);
      material.addEventListener("dispose", onDisposed);
    }
    if (!material.transparent) {
      state.restoreOpaque = true;
      material.transparent = true;
      material.needsUpdate = true;
    }
  }

  return {
    get materialCount() { return states.size; },
    update(surface: Mesh | null): void {
      if (!active) return;
      const current = surface?.material;
      for (const material of states.keys()) {
        if (Array.isArray(current) ? !current.includes(material) : current !== material) release(material, true);
      }
      if (Array.isArray(current)) {
        for (const material of current) retain(material);
      } else if (current) retain(current);
    },
    dispose(): void {
      if (!active) return;
      active = false;
      for (const material of states.keys()) release(material, true);
    },
  };
}

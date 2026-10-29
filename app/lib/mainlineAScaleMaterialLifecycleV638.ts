import type { IUniform, Material, Object3D, ShaderMaterial } from "three";

type MaterialObject = Object3D & { material?: Material | Material[] };
type OwnedValue<T> = { base: T; applied: T };
type AlphaState = OwnedValue<number> & { uniform: IUniform<number> | null };
type MaterialState = {
  alpha: AlphaState;
  transparent: OwnedValue<boolean>;
  depthWrite: OwnedValue<boolean>;
  owners: Set<MaterialObject>;
};

function opacityUniform(material: Material): IUniform<number> | null {
  const uniform = (material as ShaderMaterial).uniforms?.uOpacity;
  return uniform && typeof uniform.value === "number" && Number.isFinite(uniform.value) ? uniform : null;
}

function captureAlpha(material: Material): AlphaState {
  const uniform = opacityUniform(material);
  const base = uniform ? uniform.value : material.opacity;
  return { uniform, base, applied: base };
}

function readAlpha(material: Material, alpha: AlphaState): number {
  return alpha.uniform ? alpha.uniform.value : material.opacity;
}

function writeAlpha(material: Material, alpha: AlphaState, value: number): void {
  if (alpha.uniform) alpha.uniform.value = value;
  else material.opacity = value;
}

function restoreAlpha(material: Material, alpha: AlphaState): void {
  if (readAlpha(material, alpha) === alpha.applied) writeAlpha(material, alpha, alpha.base);
}

/** Borrows materials; release only removes listeners and restores values this tracker still owns. */
export function createMainlineAScaleMaterialTrackerV638(root: Object3D) {
  const nodes = new Set<Object3D>();
  const objects = new Map<MaterialObject, Set<Material>>();
  const states = new Map<Material, MaterialState>();
  const disposed = new WeakSet<Material>();
  let active = true;
  let scale = 1;

  function apply(material: Material, state: MaterialState): void {
    if (opacityUniform(material) !== state.alpha.uniform) {
      restoreAlpha(material, state.alpha);
      state.alpha = captureAlpha(material);
    }
    const currentAlpha = readAlpha(material, state.alpha);
    if (currentAlpha !== state.alpha.applied) state.alpha.base = currentAlpha;
    const alpha = state.alpha.base * scale;
    if (currentAlpha !== alpha) writeAlpha(material, state.alpha, alpha);
    state.alpha.applied = alpha;

    if (material.transparent !== state.transparent.applied) state.transparent.base = material.transparent;
    if (material.depthWrite !== state.depthWrite.applied) state.depthWrite.base = material.depthWrite;
    const transparent = state.transparent.base || scale < 0.999;
    if (material.transparent !== transparent) {
      material.transparent = transparent;
      material.needsUpdate = true;
    }
    state.transparent.applied = transparent;
    material.depthWrite = state.depthWrite.applied = scale < 0.999 ? false : state.depthWrite.base;
  }

  function release(material: Material, restore: boolean): void {
    const state = states.get(material);
    if (!state) return;
    material.removeEventListener("dispose", onDisposed);
    if (restore) {
      restoreAlpha(material, state.alpha);
      if (material.transparent === state.transparent.applied && material.transparent !== state.transparent.base) {
        material.transparent = state.transparent.base;
        material.needsUpdate = true;
      }
      if (material.depthWrite === state.depthWrite.applied) material.depthWrite = state.depthWrite.base;
    }
    for (const owner of state.owners) objects.get(owner)?.delete(material);
    state.owners.clear();
    states.delete(material);
  }

  function onDisposed({ target }: { target: Material }): void {
    disposed.add(target);
    release(target, false);
  }

  function releaseOwner(object: MaterialObject, material: Material): void {
    objects.get(object)?.delete(material);
    const state = states.get(material);
    if (!state) return;
    state.owners.delete(object);
    if (state.owners.size === 0) release(material, true);
  }

  function retain(object: MaterialObject, material: Material): void {
    const materials = objects.get(object)!;
    if (materials.has(material) || disposed.has(material)) return;
    let state = states.get(material);
    if (!state) {
      state = {
        alpha: captureAlpha(material),
        transparent: { base: material.transparent, applied: material.transparent },
        depthWrite: { base: material.depthWrite, applied: material.depthWrite },
        owners: new Set(),
      };
      states.set(material, state);
      material.addEventListener("dispose", onDisposed);
      apply(material, state);
    }
    materials.add(material);
    state.owners.add(object);
  }

  function sync(object: MaterialObject, materials: Set<Material>): void {
    const current = object.material;
    for (const material of materials) {
      if (Array.isArray(current) ? !current.includes(material) : current !== material) releaseOwner(object, material);
    }
    if (Array.isArray(current)) {
      for (const material of current) retain(object, material);
    } else if (current) retain(object, current);
  }

  function attachTree(object: Object3D): void {
    object.traverse((node) => {
      if (nodes.has(node)) return;
      nodes.add(node);
      node.addEventListener("childadded", onAdded);
      node.addEventListener("childremoved", onRemoved);
      if ("material" in node) {
        const materials = new Set<Material>();
        objects.set(node as MaterialObject, materials);
        sync(node as MaterialObject, materials);
      }
    });
  }

  function onAdded({ child }: { child: Object3D }): void {
    attachTree(child);
  }

  function onRemoved({ child }: { child: Object3D }): void {
    child.traverse((node) => {
      node.removeEventListener("childadded", onAdded);
      node.removeEventListener("childremoved", onRemoved);
      for (const material of objects.get(node as MaterialObject) ?? []) releaseOwner(node as MaterialObject, material);
      objects.delete(node as MaterialObject);
      nodes.delete(node);
    });
  }

  attachTree(root);
  return {
    get materialCount() { return states.size; },
    get objectCount() { return nodes.size; },
    update(opacity: number): void {
      if (!active) return;
      scale = Number.isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 1;
      // Three has no material-replacement event. Inspect only material-bearing nodes,
      // including in-place material-array edits; subtree changes are event driven.
      for (const [object, materials] of objects) sync(object, materials);
      for (const [material, state] of states) apply(material, state);
    },
    dispose(): void {
      if (!active) return;
      active = false;
      for (const node of nodes) {
        node.removeEventListener("childadded", onAdded);
        node.removeEventListener("childremoved", onRemoved);
      }
      for (const material of states.keys()) release(material, true);
      objects.clear();
      nodes.clear();
    },
  };
}

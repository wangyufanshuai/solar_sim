import { Frustum, Matrix4, type Camera, type Material, type Mesh, type Object3D, type ShaderMaterial } from "three";

type DrawGroup = { start: number; count: number; materialIndex?: number };

function isDrawGroup(value: unknown): value is DrawGroup {
  if (!value || typeof value !== "object") return false;
  const group = value as Partial<DrawGroup>;
  return typeof group.start === "number" && typeof group.count === "number"
    && (group.materialIndex === undefined || Number.isSafeInteger(group.materialIndex) && group.materialIndex >= 0);
}

function materialVisible(material: Material): boolean {
  if (!material.visible || !Number.isFinite(material.opacity) || material.opacity <= 0) return false;
  const uniform = (material as ShaderMaterial).uniforms?.uOpacity?.value;
  return uniform === undefined || typeof uniform === "number" && Number.isFinite(uniform) && uniform > 0;
}

function finiteStart(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function validCount(value: number): boolean {
  return value === Infinity || Number.isSafeInteger(value) && value >= 0;
}

function hasTriangles(mesh: Mesh, group?: DrawGroup): boolean {
  const geometry = mesh.geometry;
  const position = geometry.getAttribute("position");
  if (!position || !Number.isSafeInteger(position.count) || position.count < 3) return false;
  const available = geometry.index?.count ?? position.count;
  const range = geometry.drawRange;
  if (!Number.isSafeInteger(available) || !finiteStart(range.start) || !validCount(range.count)) return false;
  let start = range.start;
  let end = Math.min(available, start + range.count);
  if (group) {
    if (!finiteStart(group.start) || !validCount(group.count)) return false;
    start = Math.max(start, group.start);
    end = Math.min(end, group.start + group.count);
  }
  return end - start >= 3;
}

function hasVisibleDraw(mesh: Mesh, drawnMaterial?: Material, drawnGroup?: DrawGroup): boolean {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  if (drawnMaterial && !materials.includes(drawnMaterial)) return false;
  if (Array.isArray(mesh.material)) {
    return mesh.geometry.groups.some((group) => {
      const material = materials[group.materialIndex ?? 0];
      return Boolean(material && (!drawnMaterial || material === drawnMaterial)
        && (!drawnGroup || drawnGroup.start === group.start && drawnGroup.count === group.count
          && drawnGroup.materialIndex === group.materialIndex)
        && materialVisible(material) && hasTriangles(mesh, group));
    });
  }
  return materialVisible(mesh.material) && hasTriangles(mesh, drawnGroup);
}

/** Draw eligibility only: callers still require a real renderer callback; no occlusion or GPU proof. */
export function createMainlineARenderVisibilityV638() {
  const frustum = new Frustum();
  const matrix = new Matrix4();
  return (mesh: Mesh | null, camera: Camera, drawnMaterial?: Material, drawnGroup?: unknown): boolean => {
    if (drawnGroup != null && !isDrawGroup(drawnGroup)) return false;
    if (!mesh?.geometry || !camera.layers.test(mesh.layers) || !hasVisibleDraw(mesh, drawnMaterial, drawnGroup ?? undefined)) return false;
    let ancestor: Object3D | null = mesh;
    while (ancestor) {
      if (!ancestor.visible) return false;
      ancestor = ancestor.parent;
    }
    mesh.updateWorldMatrix(true, false);
    camera.updateWorldMatrix(true, false);
    if (mesh.matrixWorld.elements.some((value) => !Number.isFinite(value))) return false;
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    if (matrix.elements.some((value) => !Number.isFinite(value))) return false;
    frustum.setFromProjectionMatrix(matrix, camera.coordinateSystem);
    return frustum.intersectsObject(mesh);
  };
}

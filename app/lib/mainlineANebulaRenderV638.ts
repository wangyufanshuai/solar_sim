import type { BufferGeometry, Camera, Material, Mesh, MeshBasicMaterial, Texture } from "three";
import { createMainlineARenderVisibilityV638 } from "./mainlineARenderVisibilityV638";
import { transitionNebulaLoadAttemptV638, type NebulaLoadAttemptV638 } from "./mainlineANebulaLoadV638";

type RenderState = { attempt: NebulaLoadAttemptV638; mesh: Mesh | null; texture: Texture | null };
type Dependencies = {
  geometry: BufferGeometry;
  material: MeshBasicMaterial;
  assetSha256: string;
  read: () => RenderState;
  write: (attempt: NebulaLoadAttemptV638) => void;
  producer: { rendered: () => boolean; unobserved: () => boolean };
  now?: () => string;
};

function planeHasWorldArea(mesh: Mesh): boolean {
  const e = mesh.matrixWorld.elements;
  const x = e[1] * e[6] - e[2] * e[5];
  const y = e[2] * e[4] - e[0] * e[6];
  const z = e[0] * e[5] - e[1] * e[4];
  const areaSquared = x * x + y * y + z * z;
  return Number.isFinite(areaSquared) && areaSquared > 0;
}

/** Local draw eligibility only; a callback is not pixel, user, rights, or scientific acceptance. */
export function createNebulaRenderObserverV638(dependencies: Dependencies) {
  const { geometry, material, assetSha256, read, write, producer } = dependencies;
  const now = dependencies.now ?? (() => new Date().toISOString());
  const visible = createMainlineARenderVisibilityV638();
  const decoded = (state: RenderState) => state.attempt.status === "decoded" || state.attempt.status === "ready";
  const bound = (state: RenderState) => Boolean(state.mesh && state.mesh.geometry === geometry
    && state.mesh.material === material && state.texture && material.map === state.texture
    && state.texture.userData.atlasVisualAssetSha256 === assetSha256);
  const invalidate = (state: RenderState) => {
    if (!decoded(state)) return;
    producer.unobserved();
    const next = transitionNebulaLoadAttemptV638(state.attempt, {
      type: "render-invalidated", attempt: state.attempt.attempt, at: now(),
    });
    if (next !== state.attempt) write(next);
  };
  return {
    inspect(camera: Camera): void {
      const state = read();
      if (decoded(state) && (!bound(state) || !visible(state.mesh, camera) || !planeHasWorldArea(state.mesh!))) invalidate(state);
    },
    afterDraw(mesh: Mesh, camera: Camera, drawnGeometry: BufferGeometry, drawnMaterial: Material, group: unknown = null): boolean {
      const state = read();
      if (!decoded(state) || state.mesh !== mesh || drawnGeometry !== geometry || drawnMaterial !== material) return false;
      if (!bound(state) || !visible(mesh, camera, drawnMaterial, group) || !planeHasWorldArea(mesh)) {
        invalidate(state);
        return false;
      }
      const next = transitionNebulaLoadAttemptV638(state.attempt, {
        type: "rendered", attempt: state.attempt.attempt, at: now(),
      });
      if (next.status !== "ready") return false;
      if (!producer.rendered()) {
        invalidate(state);
        return false;
      }
      if (next !== state.attempt) write(next);
      return true;
    },
  };
}

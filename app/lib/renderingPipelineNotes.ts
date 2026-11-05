/**
 * Rendering / performance invariants (US immersive plan — map-verify).
 *
 * - Body world positions: updated in `useFrame` from `physicsRef` / SharedArrayBuffer views
 *   (`SolarSystemBodies` BodyShell); not driven by React `useState`.
 * - `UniverseCanvas` enables `logarithmicDepthBuffer` on the R3F renderer; tune `near`/`far`
 *   and line `depthWrite` if Z-fighting persists.
 * - Orbit trails: prefer preallocated geometry + ribbon mesh updates over per-frame MeshLine
 *   `setPoints` rebuilds (see `orbitRibbonTrail.ts`).
 *
 * - Point-light shadows from the Sun: one map cannot stay sharp for every planet scale at once.
 *   `SunBody` lowers shadow map resolution when the camera is far from the Sun and can boost
 *   resolution when inspecting a selected body up close (see `detailShadowBodyIndex`).
 */

export {};

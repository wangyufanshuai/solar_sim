import type { MeshLineMaterial } from "meshline";
import * as THREE from "three";

/**
 * meshline's gradient path forces `alpha = 1.0`; we need linear alpha along `vCounters`
 * (tail 0 → head 1 in this project's point order), scaled by the material `opacity` uniform.
 */
export function patchMeshLineGradientLinearAlpha(
  material: MeshLineMaterial | THREE.ShaderMaterial,
  headAlpha: number,
  tailAlpha: number
): void {
  const uniforms = material.uniforms as Record<string, THREE.IUniform>;
  if (!uniforms.headAlpha) uniforms.headAlpha = { value: headAlpha };
  else uniforms.headAlpha.value = headAlpha;
  if (!uniforms.tailAlpha) uniforms.tailAlpha = { value: tailAlpha };
  else uniforms.tailAlpha.value = tailAlpha;

  if (material.userData.orbitTrailAlphaPatched) return;
  material.userData.orbitTrailAlphaPatched = true;

  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prev?.(shader, renderer);
    const frag = shader.fragmentShader;
    if (frag.includes("uniform float headAlpha")) return;

    const withUniforms = frag.replace(
      "uniform vec3 gradient[2];",
      "uniform vec3 gradient[2];\nuniform float headAlpha;\nuniform float tailAlpha;\n"
    );
    const replaced = withUniforms.replace(
      "if (useGradient == 1.) diffuseColor = vec4(mix(gradient[0], gradient[1], vCounters), 1.0);",
      "if (useGradient == 1.) diffuseColor = vec4(mix(gradient[0], gradient[1], vCounters), mix(tailAlpha, headAlpha, vCounters) * opacity);"
    );
    if (replaced === withUniforms && withUniforms === frag) {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        console.warn(
          "[orbitTrail] MeshLine gradient alpha patch: expected GLSL snippet not found; upgrade meshline?"
        );
      }
      return;
    }
    shader.fragmentShader = replaced;
  };

  material.needsUpdate = true;
}

export function setMeshLineTrailAlphaUniforms(
  material: MeshLineMaterial | THREE.ShaderMaterial,
  headAlpha: number,
  tailAlpha: number
): void {
  const uniforms = material.uniforms as Record<string, THREE.IUniform | undefined>;
  if (uniforms.headAlpha) uniforms.headAlpha.value = headAlpha;
  if (uniforms.tailAlpha) uniforms.tailAlpha.value = tailAlpha;
}

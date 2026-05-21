import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

/** Subtle darkening toward edges; `darkness` 0 = off, ~0.35–0.55 typical. */
export function createVignetteShaderPass(
  darkness: number,
  offset: number
): ShaderPass {
  const shader = {
    uniforms: {
      tDiffuse: { value: null },
      darkness: { value: darkness },
      offset: { value: offset },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float darkness;
      uniform float offset;
      varying vec2 vUv;
      void main() {
        vec4 texel = texture2D(tDiffuse, vUv);
        vec2 uv = (vUv - 0.5) * vec2(offset);
        float dist = length(uv);
        float vig = smoothstep(0.75, 0.15 * offset + 0.25, dist);
        float dim = mix(1.0, vig, darkness);
        gl_FragColor = vec4(texel.rgb * dim, texel.a);
      }
    `,
  };
  return new ShaderPass(shader);
}

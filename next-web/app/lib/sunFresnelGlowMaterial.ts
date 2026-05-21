import * as THREE from "three";

/**
 * Slightly larger than the solar disk: rim-bright (Fresnel), pale orange, additive-friendly.
 */
export function createSunFresnelGlowMaterial(options?: {
  color?: THREE.ColorRepresentation;
  power?: number;
  maxAlpha?: number;
}): THREE.ShaderMaterial {
  const color = options?.color ?? "#ffccaa";
  const power = options?.power ?? 2.35;
  const maxAlpha = options?.maxAlpha ?? 0.38;

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uPower: { value: power },
      uMaxAlpha: { value: maxAlpha },
    },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vPosView;
      #include <common>
      #include <logdepthbuf_pars_vertex>
      void main() {
        vNormalView = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vPosView = mv.xyz;
        gl_Position = projectionMatrix * mv;
        #include <logdepthbuf_vertex>
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uMaxAlpha;
      varying vec3 vNormalView;
      varying vec3 vPosView;
      #include <logdepthbuf_pars_fragment>
      void main() {
        vec3 viewDir = normalize(-vPosView);
        float fresnel = pow(1.0 - abs(dot(vNormalView, viewDir)), uPower);
        gl_FragColor = vec4(uColor, fresnel * uMaxAlpha);
        #include <logdepthbuf_fragment>
      }
    `,
  });
}

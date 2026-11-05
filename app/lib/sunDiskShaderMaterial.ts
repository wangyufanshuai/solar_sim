import * as THREE from "three";

/**
 * Photosphere-style disk: warm center, limb darkening, preserves a readable terminator
 * (avoids a flat blown-out white circle).
 */
function createDefaultWhiteMapTexture(): THREE.DataTexture {
  const data = new Uint8Array([255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

export function createSunDiskShaderMaterial(): THREE.ShaderMaterial {
  const uMap = createDefaultWhiteMapTexture();
  return new THREE.ShaderMaterial({
    toneMapped: false,
    depthWrite: true,
    depthTest: true,
    transparent: false,
    side: THREE.FrontSide,
    uniforms: {
      uTint: { value: new THREE.Vector3(1, 1, 1) },
      uCenterColor: { value: new THREE.Color(1.0, 1.0, 1.0) },
      uLimbColor: { value: new THREE.Color(1.0, 0.94, 0.82) },
      uLimbDarken: { value: 0.52 },
      uRimBoost: { value: 0.15 },
      uBloomFloor: { value: 1.05 },
      uMap: { value: uMap },
      uUseMap: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormalView;
      varying vec3 vPosView;
      varying vec2 vUv;
      #include <common>
      #include <logdepthbuf_pars_vertex>
      void main() {
        vUv = uv;
        vNormalView = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vPosView = mv.xyz;
        gl_Position = projectionMatrix * mv;
        #include <logdepthbuf_vertex>
      }
    `,
    fragmentShader: `
      uniform vec3 uTint;
      uniform vec3 uCenterColor;
      uniform vec3 uLimbColor;
      uniform float uLimbDarken;
      uniform float uRimBoost;
      uniform float uBloomFloor;
      uniform sampler2D uMap;
      uniform float uUseMap;
      varying vec3 vNormalView;
      varying vec3 vPosView;
      varying vec2 vUv;
      #include <logdepthbuf_pars_fragment>
      void main() {
        vec3 viewDir = normalize(-vPosView);
        float mu = max(dot(normalize(vNormalView), viewDir), 0.0);
        float limb = pow(mu, uLimbDarken);
        vec3 base;
        if (uUseMap > 0.5) {
          vec3 texRgb = texture2D(uMap, vUv).rgb;
          base = texRgb * mix(0.62, 1.0, limb);
        } else {
          base = mix(uLimbColor, uCenterColor, limb);
        }
        float rim = pow(1.0 - mu, 2.2) * uRimBoost;
        vec3 col = base * (0.92 + 0.28 * limb) + vec3(rim * 0.35, rim * 0.2, rim * 0.05);
        col *= uTint;
        // Bloom guard: ensure disk luminance stays above bloom threshold.
        // This prevents the limb from oscillating above/below the UnrealBloomPass
        // threshold due to AA/camera micro-movement, which causes flickering.
        float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
        if (lum > 0.0 && lum < uBloomFloor) {
          col *= uBloomFloor / lum;
        }
        gl_FragColor = vec4(col, 1.0);
        #include <logdepthbuf_fragment>
      }
    `,
  });
}

/**
 * Unified corona shader: nonlinear Fresnel with exponential falloff.
 *
 * Center is transparent (reveals the white disk), limb glows brightest,
 * then alpha decays smoothly to zero — no hard geometric boundary.
 * The corona sphere is significantly larger than the disk so the
 * Fresnel curve has room to reach absolute transparency.
 */
export function createSunCoronaMaterial(options?: {
  color?: THREE.ColorRepresentation;
  edgePower?: number;
  falloffExponent?: number;
  maxAlpha?: number;
}): THREE.ShaderMaterial {
  const color = options?.color ?? "#ffaa00";
  const edgePower = options?.edgePower ?? 3.5;
  const falloffExponent = options?.falloffExponent ?? 0.8;
  const maxAlpha = options?.maxAlpha ?? 0.5;

  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uEdgePower: { value: edgePower },
      uFalloffExponent: { value: falloffExponent },
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
      uniform float uEdgePower;
      uniform float uFalloffExponent;
      uniform float uMaxAlpha;
      varying vec3 vNormalView;
      varying vec3 vPosView;
      #include <logdepthbuf_pars_fragment>
      void main() {
        vec3 viewDir = normalize(-vPosView);
        float cosTheta = max(dot(normalize(vNormalView), viewDir), 0.0);

        // Limb brightness: peaks where cosTheta→0 (sphere edge), zero at center
        float limbBrightness = pow(1.0 - cosTheta, uEdgePower);

        // Exponential geometric falloff ensures alpha→0 at sphere boundary
        float geometricFalloff = pow(cosTheta + 0.001, uFalloffExponent);

        // Combined: transparent at center, bright at limb, fading to zero at edge
        float alpha = limbBrightness * (1.0 - geometricFalloff) * uMaxAlpha;

        // Color: warm amber with subtle brightening at peak corona
        vec3 col = uColor * (1.0 + 0.4 * limbBrightness);
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        #include <logdepthbuf_fragment>
      }
    `,
  });
}

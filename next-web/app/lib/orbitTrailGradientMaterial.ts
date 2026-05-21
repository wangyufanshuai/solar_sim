import * as THREE from "three";

const vertexShader = /* glsl */ `
attribute float lineProgress;
varying float vProgress;
#include <common>
#include <logdepthbuf_pars_vertex>

void main() {
  vProgress = lineProgress;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  #include <logdepthbuf_vertex>
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uHeadAlpha;
uniform float uOpacityScale;
uniform float uClosed;
uniform float uRgbMul;
varying float vProgress;
#include <logdepthbuf_pars_fragment>

void main() {
  float t = clamp(vProgress, 0.0, 1.0);
  float alpha;
  vec3 rgb;
  if (uClosed > 0.5) {
    float w = 0.5 + 0.5 * cos(6.28318530718 * t);
    w = 0.28 + 0.72 * w;
    float glint = pow(w, 4.5);
    alpha = uOpacityScale * uHeadAlpha * 0.72 * w;
    rgb = uColor * mix(0.42, 1.65, w) + vec3(1.0, 0.93, 0.78) * glint * 0.2;
  } else {
    float tailFade = pow(t, 1.85);
    float headBoost = smoothstep(0.62, 1.0, t);
    float hotCore = pow(headBoost, 3.0);
    alpha = uOpacityScale * uHeadAlpha * (tailFade * 0.82 + hotCore * 0.28);
    rgb = uColor * mix(0.34, 1.85, headBoost) + vec3(1.0, 0.92, 0.72) * hotCore * 0.24;
  }
  rgb *= max(uRgbMul, 0.0);
  rgb = clamp(rgb, vec3(0.0), vec3(7.0));
  alpha = clamp(alpha, 0.0, 1.0);
  gl_FragColor = vec4(rgb, alpha);
  #include <logdepthbuf_fragment>
}
`;

export function createOrbitGradientLineMaterial(options: {
  color: THREE.Color;
  closed: boolean;
  headAlpha?: number;
}): THREE.ShaderMaterial {
  const c = options.color;
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Vector3(c.r, c.g, c.b) },
      uHeadAlpha: { value: options.headAlpha ?? 0.82 },
      uOpacityScale: { value: 1 },
      uClosed: { value: options.closed ? 1 : 0 },
      uRgbMul: { value: 1 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

export type GradientOrbitLineBundle = {
  line: THREE.Line | THREE.LineLoop;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
};

export function createGradientOrbitLineBundle(
  color: THREE.Color,
  options: {
    closed: boolean;
    renderOrder?: number;
    maxVertices?: number;
    headAlpha?: number;
  }
): GradientOrbitLineBundle {
  const maxV = Math.max(8, options.maxVertices ?? 1200);
  const positions = new Float32Array(maxV * 3);
  const lineProgress = new Float32Array(maxV);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("lineProgress", new THREE.BufferAttribute(lineProgress, 1));
  geometry.setDrawRange(0, 0);

  const material = createOrbitGradientLineMaterial({
    color,
    closed: options.closed,
    headAlpha: options.headAlpha,
  });

  const line = options.closed
    ? new THREE.LineLoop(geometry, material)
    : new THREE.Line(geometry, material);
  line.frustumCulled = false;
  line.renderOrder = options.renderOrder ?? -40;
  return { line, geometry, material };
}

export function setGradientLinePositions(
  geometry: THREE.BufferGeometry,
  points: THREE.Vector3[],
  n: number,
  mode: "openHeadAtEnd" | "closedLoop"
): void {
  const posAttr = geometry.attributes.position as THREE.BufferAttribute | undefined;
  const progAttr = geometry.attributes.lineProgress as THREE.BufferAttribute | undefined;
  if (!posAttr || !progAttr) return;
  const posArr = posAttr.array as Float32Array;
  const progArr = progAttr.array as Float32Array;
  if (n < 2) {
    geometry.setDrawRange(0, 0);
    return;
  }
  const cap = Math.min(n, posArr.length / 3);
  const m = cap;
  for (let i = 0; i < m; i++) {
    const p = points[i]!;
    const o = i * 3;
    posArr[o] = p.x;
    posArr[o + 1] = p.y;
    posArr[o + 2] = p.z;
    if (mode === "openHeadAtEnd") {
      progArr[i] = m > 1 ? i / (m - 1) : 0;
    } else {
      progArr[i] = m > 0 ? i / m : 0;
    }
  }
  posAttr.needsUpdate = true;
  progAttr.needsUpdate = true;
  geometry.setDrawRange(0, m);
}

export function setGradientLineColor(
  material: THREE.ShaderMaterial,
  color: THREE.Color
): void {
  const u = material.uniforms.uColor?.value as THREE.Vector3 | undefined;
  if (u) u.set(color.r, color.g, color.b);
}

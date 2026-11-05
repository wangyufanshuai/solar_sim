import * as THREE from "three";

const _tan = new THREE.Vector3();
const _view = new THREE.Vector3();
const _side = new THREE.Vector3();

/**
 * Fills a triangle-strip ribbon along `points[0..n-1]` (camera-facing, fixed half-width).
 * Writes `2 * n` vertices: interleaved bottom/top for THREE.TriangleStrip.
 * Returns vertex count for `setDrawRange(0, count)`.
 */
export function fillRibbonTriangleStripAttributes(
  positions: Float32Array,
  lineProgress: Float32Array,
  points: THREE.Vector3[],
  n: number,
  cameraWorld: THREE.Vector3,
  halfWidth: number
): number {
  if (n < 2) return 0;

  for (let i = 0; i < n; i++) {
    const p = points[i]!;
    if (i === 0) {
      _tan.subVectors(points[1]!, p);
    } else if (i === n - 1) {
      _tan.subVectors(p, points[n - 2]!);
    } else {
      _tan.subVectors(points[i + 1]!, points[i - 1]!);
    }
    if (_tan.lengthSq() < 1e-16) {
      _tan.set(0, 1, 0);
    } else {
      _tan.normalize();
    }

    _view.subVectors(cameraWorld, p);
    if (_view.lengthSq() < 1e-16) {
      _view.set(0, 0, 1);
    } else {
      _view.normalize();
    }

    _side.crossVectors(_tan, _view);
    if (_side.lengthSq() < 1e-16) {
      _side.set(0, 1, 0);
    } else {
      _side.normalize();
    }

    const prog = n <= 1 ? 0 : i / (n - 1);
    const ax = p.x + _side.x * halfWidth;
    const ay = p.y + _side.y * halfWidth;
    const az = p.z + _side.z * halfWidth;
    const bx = p.x - _side.x * halfWidth;
    const by = p.y - _side.y * halfWidth;
    const bz = p.z - _side.z * halfWidth;

    const o = i * 6;
    positions[o] = ax;
    positions[o + 1] = ay;
    positions[o + 2] = az;
    positions[o + 3] = bx;
    positions[o + 4] = by;
    positions[o + 5] = bz;

    const po = i * 2;
    lineProgress[po] = prog;
    lineProgress[po + 1] = prog;
  }

  return 2 * n;
}

/**
 * Triangle list for a ribbon strip: `2 * n` vertices laid out as (b0,t0,b1,t1,...).
 * Writes `6 * (n - 1)` indices; returns index count.
 */
export function fillRibbonTriangleIndices(
  indices: Uint16Array | Uint32Array,
  n: number
): number {
  if (n < 2) return 0;
  let w = 0;
  for (let i = 0; i < n - 1; i++) {
    const a = 2 * i;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices[w++] = a;
    indices[w++] = b;
    indices[w++] = c;
    indices[w++] = b;
    indices[w++] = d;
    indices[w++] = c;
  }
  return w;
}

/** Closed polyline: tangents wrap (`points.length` ≥ 3). */
export function fillClosedRibbonTriangleStripAttributes(
  positions: Float32Array,
  lineProgress: Float32Array,
  points: THREE.Vector3[],
  n: number,
  cameraWorld: THREE.Vector3,
  halfWidth: number
): number {
  if (n < 3) return 0;

  for (let i = 0; i < n; i++) {
    const p = points[i]!;
    const iPrev = (i - 1 + n) % n;
    const iNext = (i + 1) % n;
    _tan.subVectors(points[iNext]!, points[iPrev]!);
    if (_tan.lengthSq() < 1e-16) {
      _tan.set(0, 1, 0);
    } else {
      _tan.normalize();
    }

    _view.subVectors(cameraWorld, p);
    if (_view.lengthSq() < 1e-16) {
      _view.set(0, 0, 1);
    } else {
      _view.normalize();
    }

    _side.crossVectors(_tan, _view);
    if (_side.lengthSq() < 1e-16) {
      _side.set(0, 1, 0);
    } else {
      _side.normalize();
    }

    const prog = i / n;
    const ax = p.x + _side.x * halfWidth;
    const ay = p.y + _side.y * halfWidth;
    const az = p.z + _side.z * halfWidth;
    const bx = p.x - _side.x * halfWidth;
    const by = p.y - _side.y * halfWidth;
    const bz = p.z - _side.z * halfWidth;

    const o = i * 6;
    positions[o] = ax;
    positions[o + 1] = ay;
    positions[o + 2] = az;
    positions[o + 3] = bx;
    positions[o + 4] = by;
    positions[o + 5] = bz;

    const po = i * 2;
    lineProgress[po] = prog;
    lineProgress[po + 1] = prog;
  }

  return 2 * n;
}

/** Closed ribbon: segments wrap from last row back to first. */
export function fillClosedRibbonTriangleIndices(
  indices: Uint16Array | Uint32Array,
  n: number
): number {
  if (n < 3) return 0;
  let w = 0;
  for (let i = 0; i < n; i++) {
    const a = 2 * i;
    const b = a + 1;
    const j = (i + 1) % n;
    const c = 2 * j;
    const d = c + 1;
    indices[w++] = a;
    indices[w++] = b;
    indices[w++] = c;
    indices[w++] = b;
    indices[w++] = d;
    indices[w++] = c;
  }
  return w;
}

export const ORBIT_RIBBON_VERTEX_SHADER = /* glsl */ `
  attribute float lineProgress;
  varying float vLineProgress;
  #include <common>
  #include <logdepthbuf_pars_vertex>
  void main() {
    vLineProgress = lineProgress;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    #include <logdepthbuf_vertex>
  }
`;

export const ORBIT_RIBBON_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uHeadAlpha;
  uniform float uTailAlpha;
  uniform float uOpacity;
  varying float vLineProgress;
  #include <logdepthbuf_pars_fragment>

  void main() {
    float a = mix(uTailAlpha, uHeadAlpha, clamp(vLineProgress, 0.0, 1.0)) * uOpacity;
    gl_FragColor = vec4(uColor * a, 1.0);
    #include <logdepthbuf_fragment>
  }
`;

export function createOrbitRibbonShaderMaterial(
  color: THREE.Color,
  opacity: number,
  headAlpha: number,
  tailAlpha: number
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color.clone() },
      uOpacity: { value: opacity },
      uHeadAlpha: { value: headAlpha },
      uTailAlpha: { value: tailAlpha },
    },
    vertexShader: ORBIT_RIBBON_VERTEX_SHADER,
    fragmentShader: ORBIT_RIBBON_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

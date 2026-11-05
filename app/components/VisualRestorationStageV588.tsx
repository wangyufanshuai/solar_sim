"use client";

import { PostV594CdpSoakHtml as Html } from "../lib/v594CdpSoakSurface";
import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import {
  diffAtlasResourceSnapshotsV300,
  getAtlasResourceSnapshot,
  type AtlasRuntimeResourceSnapshot,
} from "../lib/atlasResourceLifecycle";
import {
  createOrbitLine2Bundle,
  setOrbitLine2GradientColors,
  setOrbitLine2Positions,
  setOrbitLine2Resolution,
  type OrbitLine2ReusableBuffers,
} from "../lib/orbitLine2";
import {
  disposeV588TextureLoader,
  useV588Texture,
  type V588TextureLoadPolicy,
} from "../lib/useV588Texture";
import {
  FEATURED_CONSTELLATION_CODES_V588,
  HERO_ORBITS_V588,
  V588_SCIENTIFIC_PAYLOAD_REFERENCE_SHA256,
  heroAssetLoadPolicyV588,
  orbitLandmarksV588,
  orbitPathV588,
  orbitPointV588,
  orbitTangentV588,
  predictedOrbitV588,
  type HeroBodyIdV588,
  type HeroOrbitDefinitionV588,
  type Vec3V588,
  type VisualRestorationModeV588,
  type VisualRestorationVariantV588,
} from "../lib/visualRestorationV588";

const FEATURED_CODES = new Set<string>(FEATURED_CONSTELLATION_CODES_V588);
const ATMOSPHERE_VERTEX_V588 = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;
const ATMOSPHERE_FRAGMENT_V588 = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  uniform vec3 uColor;
  uniform float uDensity;
  uniform float uPower;
  void main() {
    float fresnel = pow(1.0 - max(0.0, dot(normalize(vNormal), normalize(vViewDirection))), uPower);
    float alpha = clamp(fresnel * uDensity, 0.0, 0.92);
    gl_FragColor = vec4(uColor * (0.72 + fresnel * 0.62), alpha);
  }
`;
const NIGHT_VERTEX_V588 = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;
const NIGHT_FRAGMENT_V588 = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D uNightMap;
  uniform sampler2D uNightMask;
  uniform float uGain;
  void main() {
    vec3 toSun = normalize(-vWorldPosition);
    float dayFacing = dot(normalize(vWorldNormal), toSun);
    float nightGate = 1.0 - smoothstep(-0.10, 0.18, dayFacing);
    vec3 emission = texture2D(uNightMap, vUv).rgb;
    float mask = texture2D(uNightMask, vUv).r;
    float alpha = clamp(max(max(emission.r, emission.g), emission.b) * mask * nightGate * uGain, 0.0, 0.9);
    gl_FragColor = vec4(emission * (1.1 + uGain), alpha);
  }
`;
const RING_SHADOW_VERTEX_V588 = /* glsl */ `
  varying vec3 vLocalNormal;
  varying vec3 vWorldPosition;
  void main() {
    vLocalNormal = normal;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;
const RING_SHADOW_FRAGMENT_V588 = /* glsl */ `
  precision highp float;
  varying vec3 vLocalNormal;
  varying vec3 vWorldPosition;
  uniform float uOpacity;
  void main() {
    float equator = exp(-pow(abs(vLocalNormal.y) * 11.0, 2.0));
    float dayGate = smoothstep(-0.15, 0.45, dot(normalize(vLocalNormal), normalize(-vWorldPosition)));
    gl_FragColor = vec4(vec3(0.0), equator * dayGate * uOpacity);
  }
`;

function toVector3(value: Vec3V588): THREE.Vector3 {
  return new THREE.Vector3(value[0], value[1], value[2]);
}

function deterministicStars(count: number): Float32Array {
  let state = 0x588c0ffe;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const z = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const radial = Math.sqrt(Math.max(0, 1 - z * z));
    const distance = 82 + random() * 12;
    positions[index * 3] = radial * Math.cos(angle) * distance;
    positions[index * 3 + 1] = z * distance;
    positions[index * 3 + 2] = radial * Math.sin(angle) * distance;
  }
  return positions;
}

function RuntimeProbeV588() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const lastPublishRef = useRef(0);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - lastPublishRef.current < 0.25) return;
    lastPublishRef.current = clock.elapsedTime;
    const root = document.querySelector<HTMLElement>(
      '[data-atlas-browser-acceptance-version="v588-visual-restoration-browser-acceptance"]',
    );
    if (!root) return;
    const candidateTextures = new Set<THREE.Texture>();
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!material) continue;
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture && value.userData.atlasCandidate === "v588") candidateTextures.add(value);
          if (value && typeof value === "object" && "value" in value) {
            const uniformValue = (value as { value?: unknown }).value;
            if (uniformValue instanceof THREE.Texture && uniformValue.userData.atlasCandidate === "v588") {
              candidateTextures.add(uniformValue);
            }
          }
        }
      }
    });
    const resources = getAtlasResourceSnapshot();
    const admittedTextureCount = resources.byOwner["v588-visual-restoration"]?.count ?? candidateTextures.size;
    const requiredTextureCount = Number(root.dataset.atlasV588RequiredTextureCount ?? "17");
    root.dataset.atlasV588ReadyTextureCount = String(admittedTextureCount);
    root.dataset.atlasV588AssetAdmission = admittedTextureCount >= requiredTextureCount ? "ready" : "loading";
    root.dataset.atlasRenderDrawCalls = String(gl.info.render.calls);
    root.dataset.atlasRenderTriangles = String(gl.info.render.triangles);
    root.dataset.atlasRenderPrograms = String(gl.info.programs?.length ?? 0);
    root.dataset.atlasRenderTextures = String(gl.info.memory.textures);
    root.dataset.atlasRenderTargets = String(resources.gpuRenderTargets);
    root.dataset.atlasRenderResourceEstimatedBytes = String(resources.estimatedBytes);
    root.dataset.atlasRenderResourceEstimatedGpuBytes = String(resources.estimatedGpuBytes);
  });
  return null;
}

/**
 * Stays mounted while the candidate scene is removed so browser acceptance can
 * observe the live renderer returning to an empty scene. Keeping the Canvas
 * alive prevents WebGL context destruction from hiding leaked programs.
 */
export function VisualRestorationReleaseProbeV588({
  active,
  baseline,
}: {
  active: boolean;
  baseline: AtlasRuntimeResourceSnapshot;
}) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const lastPublishRef = useRef(0);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - lastPublishRef.current < 0.1) return;
    lastPublishRef.current = clock.elapsedTime;
    const root = document.querySelector<HTMLElement>(
      '[data-atlas-browser-acceptance-version="v588-visual-restoration-browser-acceptance"]',
    );
    if (!root) return;
    const resources = getAtlasResourceSnapshot();
    const diff = diffAtlasResourceSnapshotsV300(baseline, resources);
    let candidateSceneNodes = 0;
    scene.traverse((object) => {
      if (object.userData.atlasCandidate || object.userData.atlasHeroPlanet) candidateSceneNodes += 1;
    });
    const geometries = gl.info.memory.geometries;
    const textures = gl.info.memory.textures;
    const programs = gl.info.programs?.length ?? 0;
    const candidateResources = resources.byOwner["v588-visual-restoration"]?.count ?? 0;
    root.dataset.atlasV588ReleaseRegistryStatus = diff.status;
    root.dataset.atlasV588ReleaseRegistryDelta = String(diff.total);
    root.dataset.atlasV588ReleaseCandidateResources = String(candidateResources);
    root.dataset.atlasV588ReleaseSceneNodes = String(candidateSceneNodes);
    root.dataset.atlasV588ReleaseGeometries = String(geometries);
    root.dataset.atlasV588ReleaseTextures = String(textures);
    root.dataset.atlasV588ReleasePrograms = String(programs);
    root.dataset.atlasV588ReleaseRenderTargets = String(resources.gpuRenderTargets - baseline.gpuRenderTargets);
    if (active) {
      root.dataset.atlasV588ResourceReleaseStatus = "armed";
      return;
    }
    const released = diff.status === "baseline"
      && candidateResources === 0
      && candidateSceneNodes === 0
      && geometries === 0
      && textures === 0
      && programs === 0
      && resources.gpuRenderTargets === baseline.gpuRenderTargets;
    root.dataset.atlasV588ResourceReleaseStatus = released ? "released-zero" : "draining";
  });
  return null;
}

function MilkyWayBackdropV588({
  mode,
  variant,
}: {
  mode: VisualRestorationModeV588;
  variant: VisualRestorationVariantV588;
}) {
  const asset = useV588Texture(
    `milky-way-${variant}`,
    variant,
    "verified-fallback-only",
    true,
  );
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const size = useThree((state) => state.size);
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const distance = 78;
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;
    mesh.position.copy(camera.position).addScaledVector(forward, distance);
    mesh.quaternion.copy(camera.quaternion);
    mesh.scale.set(height * Math.max(1, size.width / Math.max(1, size.height)), height, 1);
  });
  if (!asset.texture) return null;
  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      renderOrder={-900}
      userData={{
        atlasCandidate: "v588",
        atlasLayer: "frozen-v9-milky-way-restoration",
        atlasPresentationOnly: true,
        atlasScientificPayloadMutation: false,
      }}
    >
      <meshBasicMaterial
        map={asset.texture}
        side={THREE.FrontSide}
        color={mode === "cinematic" ? "#d8e2ee" : "#738394"}
        transparent
        opacity={mode === "cinematic" ? 0.96 : 0.43}
        depthWrite={false}
        toneMapped={mode === "cinematic"}
      />
    </mesh>
  );
}

function StarHierarchyV588({
  mode,
  variant,
}: {
  mode: VisualRestorationModeV588;
  variant: VisualRestorationVariantV588;
}) {
  const count = variant === "mobile" ? 900 : 1800;
  const positions = useMemo(() => deterministicStars(count), [count]);
  const geometry = useMemo(() => {
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return next;
  }, [positions]);
  const material = useMemo(() => new THREE.PointsMaterial({
    color: mode === "cinematic" ? 0xfff1d6 : 0xd0e5ef,
    size: mode === "cinematic" ? 0.095 : 0.065,
    sizeAttenuation: true,
    transparent: true,
    opacity: mode === "cinematic" ? 0.72 : 0.38,
    depthWrite: false,
    toneMapped: false,
  }), [mode]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return <points geometry={geometry} material={material} renderOrder={-850} frustumCulled={false} />;
}

function raDecToScene(raDeg: number, decDeg: number, distance = 76): THREE.Vector3 {
  const ra = raDeg * Math.PI / 180;
  const dec = decDeg * Math.PI / 180;
  return new THREE.Vector3(
    Math.cos(dec) * Math.cos(ra) * distance,
    Math.sin(dec) * distance,
    Math.cos(dec) * Math.sin(ra) * distance,
  );
}

function FeaturedConstellationsV588({
  mode,
  variant,
  focusedCode,
}: {
  mode: VisualRestorationModeV588;
  variant: VisualRestorationVariantV588;
  focusedCode: string;
}) {
  const definitions = useMemo(() => {
    const featuredBudget = variant === "mobile" ? 8 : 12;
    const featured = CONSTELLATION_LINES.filter((entry) => FEATURED_CODES.has(entry.iauCode)).slice(0, featuredBudget);
    const focused = CONSTELLATION_LINES.find((entry) => entry.iauCode === focusedCode);
    return focused && !featured.some((entry) => entry.iauCode === focused.iauCode)
      ? [...featured, focused]
      : featured;
  }, [focusedCode, variant]);
  const geometry = useMemo(() => {
    const positions: number[] = [];
    for (const definition of definitions) {
      const segments = definition.coordinateSegments ?? definition.waypoints.slice(1)
        .map((point, index) => [definition.waypoints[index], point] as const);
      for (const [from, to] of segments) {
        positions.push(...raDecToScene(...from).toArray());
        positions.push(...raDecToScene(...to).toArray());
      }
    }
    const next = new THREE.BufferGeometry();
    next.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return next;
  }, [definitions]);
  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: mode === "cinematic" ? "#90b9d8" : "#a8deef",
    transparent: true,
    opacity: mode === "cinematic" ? 0.24 : 0.42,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }), [mode]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group userData={{ atlasCandidate: "v588", atlasDefaultConstellationCount: variant === "mobile" ? 8 : 12 }}>
      <lineSegments geometry={geometry} material={material} renderOrder={-810} frustumCulled={false} />
      {definitions.map((definition) => {
        const position = new THREE.Vector3();
        for (const waypoint of definition.waypoints) position.add(raDecToScene(...waypoint));
        position.normalize().multiplyScalar(74);
        const focused = definition.iauCode === focusedCode;
        return (
          <Html key={definition.iauCode} position={position} center distanceFactor={42} zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
            <span
              className={focused
                ? "rounded border border-cyan-100/35 bg-black/75 px-1.5 py-0.5 text-[8px] uppercase tracking-[.14em] text-cyan-50"
                : "text-[7px] uppercase tracking-[.14em] text-sky-100/55 drop-shadow-[0_1px_4px_rgba(0,0,0,1)]"}
              data-atlas-v588-constellation={definition.iauCode}
              data-atlas-v588-constellation-focused={focused ? "true" : "false"}
            >
              {definition.name}
            </span>
          </Html>
        );
      })}
    </group>
  );
}

function OrbitStrokeV588({
  points,
  color,
  selected,
  predicted = false,
  mode,
}: {
  points: readonly Vec3V588[];
  color: string;
  selected: boolean;
  predicted?: boolean;
  mode: VisualRestorationModeV588;
}) {
  const size = useThree((state) => state.size);
  const reusable = useRef<OrbitLine2ReusableBuffers>({});
  const vectors = useMemo(() => points.map(toVector3), [points]);
  const lineColor = useMemo(() => new THREE.Color(color), [color]);
  const bundle = useMemo(() => createOrbitLine2Bundle({
    color: lineColor,
    maxVertices: Math.max(32, points.length + 2),
    renderOrder: predicted ? -16 : -22,
    stylePreset: "classicCinematic",
  }), [lineColor, points.length, predicted]);
  useLayoutEffect(() => {
    const count = setOrbitLine2Positions(
      bundle.geometry,
      vectors,
      vectors.length,
      predicted ? "open" : "closed",
      reusable.current,
    );
    setOrbitLine2GradientColors(
      bundle.geometry,
      lineColor,
      count,
      predicted ? "open" : "closed",
      "classicCinematic",
      reusable.current,
    );
  }, [bundle.geometry, lineColor, predicted, vectors]);
  useFrame(() => {
    setOrbitLine2Resolution(bundle.material, size.width, size.height);
    bundle.material.linewidth = predicted
      ? selected ? 2.25 : 0
      : selected ? 1.85 : mode === "science" ? 0.92 : 0.72;
    bundle.material.opacity = predicted
      ? selected ? 0.72 : 0
      : selected ? 0.88 : mode === "science" ? 0.42 : 0.26;
    bundle.line.visible = bundle.material.linewidth > 0;
  });
  useEffect(() => () => {
    bundle.geometry.dispose();
    bundle.material.dispose();
  }, [bundle]);
  return <primitive object={bundle.line} />;
}

function MarkerV588({
  position,
  color,
  label,
  kind,
}: {
  position: Vec3V588;
  color: string;
  label: string;
  kind: string;
}) {
  return (
    <group position={position} userData={{ atlasOrbitLandmark: kind }}>
      <mesh>
        <sphereGeometry args={[0.095, 18, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <Html position={[0.13, 0.13, 0]} distanceFactor={17} zIndexRange={[6, 0]} style={{ pointerEvents: "none" }}>
        <span className="whitespace-nowrap text-[7px] uppercase tracking-[.13em] text-white/65 drop-shadow-[0_1px_4px_#000]">{label}</span>
      </Html>
    </group>
  );
}

function DirectionArrowV588({ orbit, anomaly }: { orbit: HeroOrbitDefinitionV588; anomaly: number }) {
  const position = useMemo(() => toVector3(orbitPointV588(orbit, anomaly)), [anomaly, orbit]);
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    toVector3(orbitTangentV588(orbit, anomaly)).normalize(),
  ), [anomaly, orbit]);
  return (
    <mesh position={position} quaternion={quaternion} userData={{ atlasOrbitDirectionArrow: orbit.id }}>
      <coneGeometry args={[0.11, 0.34, 12]} />
      <meshBasicMaterial color={orbit.accent} transparent opacity={0.82} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function OrbitalPlaneV588({ orbit, mode }: { orbit: HeroOrbitDefinitionV588; mode: VisualRestorationModeV588 }) {
  const quaternion = useMemo(() => {
    const inclination = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), orbit.inclinationRad);
    const node = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), orbit.ascendingNodeRad);
    return node.multiply(inclination);
  }, [orbit]);
  return (
    <group quaternion={quaternion} userData={{ atlasOrbitPlane: orbit.id }}>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[orbit.semiMajorAxis * 1.03, orbit.semiMajorAxis * 1.03, 1]} renderOrder={-40}>
        <circleGeometry args={[1, 96]} />
        <meshBasicMaterial
          color={orbit.accent}
          transparent
          opacity={mode === "science" ? 0.035 : 0.022}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function VelocityHandleV588({
  orbit,
  scale,
  onScale,
}: {
  orbit: HeroOrbitDefinitionV588;
  scale: number;
  onScale: (value: number) => void;
}) {
  const start = useMemo(() => toVector3(orbitPointV588(orbit, orbit.phaseRad)), [orbit]);
  const tangent = useMemo(() => toVector3(orbitTangentV588(orbit, orbit.phaseRad)).normalize(), [orbit]);
  const end = useMemo(() => start.clone().add(tangent.clone().multiplyScalar(0.75 + scale * 0.74)), [scale, start, tangent]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints([start, end]), [end, start]);
  const material = useMemo(() => new THREE.LineBasicMaterial({
    color: orbit.accent,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    toneMapped: false,
  }), [orbit.accent]);
  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);
  const dragRef = useRef<{ y: number; scale: number } | null>(null);
  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    dragRef.current = { y: event.nativeEvent.clientY, scale };
    (event.target as Element).setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragRef.current) return;
    event.stopPropagation();
    onScale(dragRef.current.scale + (dragRef.current.y - event.nativeEvent.clientY) / 180);
  };
  const finish = (event: ThreeEvent<PointerEvent>) => {
    if (!dragRef.current) return;
    event.stopPropagation();
    dragRef.current = null;
    (event.target as Element).releasePointerCapture?.(event.pointerId);
  };
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);
  return (
    <group userData={{ atlasVelocityDragHandle: orbit.id, atlasPredictionWriteback: false }}>
      <primitive object={line} />
      <mesh position={end} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={finish} onPointerCancel={finish}>
        <sphereGeometry args={[0.18, 24, 16]} />
        <meshBasicMaterial color={orbit.accent} transparent opacity={0.96} toneMapped={false} />
      </mesh>
    </group>
  );
}

function AtmosphereShellV588({
  color,
  radius,
  mode,
  density = 0.7,
  power = 2.4,
}: {
  color: string;
  radius: number;
  mode: VisualRestorationModeV588;
  density?: number;
  power?: number;
}) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: ATMOSPHERE_VERTEX_V588,
    fragmentShader: ATMOSPHERE_FRAGMENT_V588,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uDensity: { value: density * (mode === "cinematic" ? 1 : 0.7) },
      uPower: { value: power },
    },
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: mode === "cinematic" ? THREE.AdditiveBlending : THREE.NormalBlending,
    toneMapped: false,
  }), [color, density, mode, power]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material} scale={1.024} renderOrder={6}>
      <sphereGeometry args={[radius, 72, 48]} />
    </mesh>
  );
}

function assetPolicy(selected: boolean, variant: VisualRestorationVariantV588, assetId: string): V588TextureLoadPolicy {
  const base = heroAssetLoadPolicyV588(variant, selected);
  return base === "ktx2-first" && assetId.endsWith("-albedo") ? "ktx2-first" : "verified-fallback-only";
}

function EarthHeroV588({
  orbit,
  variant,
  mode,
  selected,
  highResolution,
  onSelect,
}: PlanetComponentPropsV588) {
  const policy = (id: string) => assetPolicy(highResolution, variant, id);
  const albedo = useV588Texture("earth-albedo", variant, policy("earth-albedo"));
  const roughness = useV588Texture("earth-roughness", variant, policy("earth-roughness"));
  const clouds = useV588Texture("earth-clouds", variant, policy("earth-clouds"));
  const cloudAlpha = useV588Texture("earth-cloud-alpha", variant, policy("earth-cloud-alpha"));
  const night = useV588Texture("earth-night", variant, policy("earth-night"));
  const nightMask = useV588Texture("earth-night-mask", variant, policy("earth-night-mask"));
  const groupRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const nightMaterial = useMemo(() => night.texture && nightMask.texture ? new THREE.ShaderMaterial({
    vertexShader: NIGHT_VERTEX_V588,
    fragmentShader: NIGHT_FRAGMENT_V588,
    uniforms: {
      uNightMap: { value: night.texture },
      uNightMask: { value: nightMask.texture },
      uGain: { value: mode === "cinematic" ? 1.15 : 0.68 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }) : null, [mode, night.texture, nightMask.texture]);
  useEffect(() => () => nightMaterial?.dispose(), [nightMaterial]);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * orbit.rotationRate;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.009;
  });
  if (!albedo.texture) return null;
  return (
    <group ref={groupRef} rotation={[0, -1.55, orbit.axialTiltRad]} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <mesh receiveShadow userData={{ atlasHeroPlanet: "earth", atlasProceduralFallback: false }}>
        <sphereGeometry args={[orbit.visualRadius, selected ? 128 : 80, selected ? 96 : 52]} />
        <meshPhysicalMaterial
          map={albedo.texture}
          roughnessMap={roughness.texture}
          roughness={0.58}
          metalness={0.01}
          clearcoat={mode === "cinematic" ? 0.18 : 0.08}
          clearcoatRoughness={0.42}
          emissive={mode === "cinematic" && highResolution ? "#ffffff" : "#000000"}
          emissiveMap={mode === "cinematic" && highResolution ? albedo.texture : null}
          emissiveIntensity={mode === "cinematic" && highResolution ? 0.11 : 0}
        />
      </mesh>
      {nightMaterial ? (
        <mesh material={nightMaterial} scale={1.002} renderOrder={4}>
          <sphereGeometry args={[orbit.visualRadius, 96, 64]} />
        </mesh>
      ) : null}
      {clouds.texture && cloudAlpha.texture ? (
        <>
          <mesh scale={1.006} renderOrder={4}>
            <sphereGeometry args={[orbit.visualRadius, 96, 64]} />
            <meshBasicMaterial
              alphaMap={cloudAlpha.texture}
              color="#02090e"
              transparent
              opacity={mode === "cinematic" ? 0.17 : 0.1}
              depthWrite={false}
              blending={THREE.MultiplyBlending}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={cloudsRef} scale={1.018} renderOrder={5}>
            <sphereGeometry args={[orbit.visualRadius, 96, 64]} />
            <meshPhysicalMaterial
              map={clouds.texture}
              alphaMap={cloudAlpha.texture}
              transparent
              opacity={mode === "cinematic" ? 0.82 : 0.65}
              depthWrite={false}
              roughness={0.95}
              metalness={0}
            />
          </mesh>
        </>
      ) : null}
      <AtmosphereShellV588 color="#67b5dc" radius={orbit.visualRadius} mode={mode} density={0.3} power={4.8} />
    </group>
  );
}

function JupiterHeroV588(props: PlanetComponentPropsV588) {
  const { orbit, variant, mode, selected, highResolution, onSelect } = props;
  const albedo = useV588Texture("jupiter-albedo", variant, assetPolicy(highResolution, variant, "jupiter-albedo"));
  const roughness = useV588Texture("jupiter-roughness", variant, "verified-fallback-only");
  const bandMask = useV588Texture("jupiter-band-mask", variant, "verified-fallback-only");
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * orbit.rotationRate;
  });
  if (!albedo.texture) return null;
  return (
    <group ref={groupRef} rotation={[0, 0, orbit.axialTiltRad]} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <mesh userData={{ atlasHeroPlanet: "jupiter", atlasProceduralFallback: false }}>
        <sphereGeometry args={[orbit.visualRadius, selected ? 128 : 88, selected ? 96 : 56]} />
        <meshPhysicalMaterial color="#d8cec4" map={albedo.texture} roughnessMap={roughness.texture} roughness={0.82} clearcoat={0.025} />
      </mesh>
      {bandMask.texture ? (
        <mesh scale={1.004} renderOrder={4}>
          <sphereGeometry args={[orbit.visualRadius, 96, 64]} />
          <meshBasicMaterial
            alphaMap={bandMask.texture}
            color={mode === "cinematic" ? "#ffd0a0" : "#c7d5d6"}
            transparent
            opacity={mode === "cinematic" ? 0.075 : 0.035}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ) : null}
      <AtmosphereShellV588 color="#e9b278" radius={orbit.visualRadius} mode={mode} density={0.38} power={2.8} />
    </group>
  );
}

function SaturnHeroV588(props: PlanetComponentPropsV588) {
  const { orbit, variant, mode, selected, highResolution, onSelect } = props;
  const albedo = useV588Texture("saturn-albedo", variant, assetPolicy(highResolution, variant, "saturn-albedo"));
  const roughness = useV588Texture("saturn-roughness", variant, "verified-fallback-only");
  const bandMask = useV588Texture("saturn-band-mask", variant, "verified-fallback-only");
  const ringColor = useV588Texture("saturn-ring-color", variant, "verified-fallback-only");
  const ringAlpha = useV588Texture("saturn-ring-alpha", variant, "verified-fallback-only");
  const groupRef = useRef<THREE.Group>(null);
  const shadowMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: RING_SHADOW_VERTEX_V588,
    fragmentShader: RING_SHADOW_FRAGMENT_V588,
    uniforms: { uOpacity: { value: mode === "cinematic" ? 0.34 : 0.2 } },
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  }), [mode]);
  useEffect(() => () => shadowMaterial.dispose(), [shadowMaterial]);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * orbit.rotationRate;
  });
  if (!albedo.texture) return null;
  return (
    <group ref={groupRef} rotation={[0, 0, orbit.axialTiltRad]} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <mesh userData={{ atlasHeroPlanet: "saturn", atlasProceduralFallback: false }}>
        <sphereGeometry args={[orbit.visualRadius, selected ? 128 : 88, selected ? 96 : 56]} />
        <meshPhysicalMaterial color="#d9ceb4" map={albedo.texture} roughnessMap={roughness.texture} roughness={0.84} clearcoat={0.015} />
      </mesh>
      {bandMask.texture ? (
        <mesh scale={1.003} renderOrder={4}>
          <sphereGeometry args={[orbit.visualRadius, 88, 56]} />
          <meshBasicMaterial alphaMap={bandMask.texture} color="#f1dfb1" transparent opacity={0.045} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ) : null}
      <mesh material={shadowMaterial} scale={1.005} renderOrder={5}>
        <sphereGeometry args={[orbit.visualRadius, 96, 64]} />
      </mesh>
      {ringColor.texture && ringAlpha.texture ? (
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={3} userData={{ atlasSaturnRingShadow: true }}>
          <ringGeometry args={[orbit.visualRadius * 1.28, orbit.visualRadius * 2.48, selected ? 256 : 160, 2]} />
          <meshPhysicalMaterial
            map={ringColor.texture}
            alphaMap={ringAlpha.texture}
            transparent
            opacity={mode === "cinematic" ? 0.95 : 0.78}
            depthWrite={false}
            side={THREE.DoubleSide}
            roughness={0.82}
            metalness={0.01}
          />
        </mesh>
      ) : null}
      <AtmosphereShellV588 color="#dfc895" radius={orbit.visualRadius} mode={mode} density={0.28} power={3.1} />
    </group>
  );
}

function MarsHeroV588(props: PlanetComponentPropsV588) {
  const { orbit, variant, mode, selected, highResolution, onSelect } = props;
  const albedo = useV588Texture("mars-albedo", variant, assetPolicy(highResolution, variant, "mars-albedo"));
  const roughness = useV588Texture("mars-roughness", variant, "verified-fallback-only");
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * orbit.rotationRate;
  });
  if (!albedo.texture) return null;
  return (
    <group ref={groupRef} rotation={[0, 0, orbit.axialTiltRad]} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <mesh userData={{ atlasHeroPlanet: "mars", atlasProceduralFallback: false }}>
        <sphereGeometry args={[orbit.visualRadius, selected ? 128 : 80, selected ? 96 : 52]} />
        <meshPhysicalMaterial
          color={mode === "cinematic" ? "#b8c8d2" : "#ffffff"}
          map={albedo.texture}
          bumpMap={roughness.texture}
          bumpScale={0.012}
          roughness={0.94}
          clearcoat={0}
        />
      </mesh>
      <AtmosphereShellV588 color="#d9a083" radius={orbit.visualRadius} mode={mode} density={0.2} power={3.4} />
    </group>
  );
}

type PlanetComponentPropsV588 = Readonly<{
  orbit: HeroOrbitDefinitionV588;
  variant: VisualRestorationVariantV588;
  mode: VisualRestorationModeV588;
  selected: boolean;
  highResolution: boolean;
  onSelect: () => void;
}>;

function HeroPlanetV588(props: PlanetComponentPropsV588) {
  const position = orbitPointV588(props.orbit, props.orbit.phaseRad);
  const content = props.orbit.id === "earth"
    ? <EarthHeroV588 {...props} />
    : props.orbit.id === "jupiter"
      ? <JupiterHeroV588 {...props} />
      : props.orbit.id === "saturn"
        ? <SaturnHeroV588 {...props} />
        : <MarsHeroV588 {...props} />;
  return (
    <group position={position} userData={{ atlasHeroPlanetAnchor: props.orbit.id }}>
      {content}
      {!props.highResolution ? <Html position={[0, props.orbit.visualRadius * 1.7, 0]} center distanceFactor={14} zIndexRange={[6, 0]} style={{ pointerEvents: "none" }}>
        <span className={props.selected
          ? "rounded-full border border-white/25 bg-black/70 px-2 py-1 text-[8px] uppercase tracking-[.18em] text-white"
          : "text-[7px] uppercase tracking-[.16em] text-white/48 drop-shadow-[0_1px_5px_#000]"}>
          {props.orbit.name}
        </span>
      </Html> : null}
      {props.highResolution && props.mode === "cinematic" ? (
        <pointLight position={[1.8, 1.25, 3.4]} color="#c8dded" intensity={12} distance={8} decay={1.4} />
      ) : null}
    </group>
  );
}

function OrbitSystemV588({
  selectedBody,
  velocityScale,
  mode,
  focusBody,
  onVelocityScale,
}: {
  selectedBody: HeroBodyIdV588;
  velocityScale: number;
  mode: VisualRestorationModeV588;
  focusBody: "overview" | HeroBodyIdV588;
  onVelocityScale: (value: number) => void;
}) {
  const selectedOrbit = HERO_ORBITS_V588.find((orbit) => orbit.id === selectedBody)!;
  const predicted = useMemo(() => predictedOrbitV588(selectedOrbit, velocityScale), [selectedOrbit, velocityScale]);
  const landmarks = useMemo(() => orbitLandmarksV588(selectedOrbit), [selectedOrbit]);
  const closeup = focusBody !== "overview";
  return (
    <group userData={{
      atlasOrbitSystem: "universe-sandbox-inspired-v588",
      atlasOrbitPredictionAuthority: false,
      atlasOrbitPredictionWriteback: false,
    }}>
      {!closeup ? HERO_ORBITS_V588.map((orbit) => (
        <OrbitStrokeV588
          key={orbit.id}
          points={orbitPathV588(orbit)}
          color={orbit.accent}
          selected={orbit.id === selectedBody}
          mode={mode}
        />
      )) : null}
      {!closeup ? <>
        <OrbitStrokeV588 points={predicted.points} color="#f6f0cf" selected predicted mode={mode} />
        <OrbitalPlaneV588 orbit={selectedOrbit} mode={mode} />
        <MarkerV588 position={landmarks.periapsis} color="#ffd68a" label="PERIAPSIS" kind="periapsis" />
        <MarkerV588 position={landmarks.apoapsis} color="#a9d7f4" label="APOAPSIS" kind="apoapsis" />
        <MarkerV588 position={landmarks.ascendingNode} color="#7ff0d5" label="ASC NODE" kind="ascending-node" />
        <MarkerV588 position={landmarks.descendingNode} color="#ef91b5" label="DESC NODE" kind="descending-node" />
        {[0.55, 2.25, 4.2].map((anomaly) => <DirectionArrowV588 key={anomaly} orbit={selectedOrbit} anomaly={anomaly} />)}
        <VelocityHandleV588 orbit={selectedOrbit} scale={velocityScale} onScale={onVelocityScale} />
      </> : null}
    </group>
  );
}

function SunV588({ mode, showDisc }: { mode: VisualRestorationModeV588; showDisc: boolean }) {
  return (
    <group userData={{ atlasPresentationSun: "v588" }}>
      {showDisc ? <>
      <mesh>
        <sphereGeometry args={[0.72, 64, 48]} />
        <meshBasicMaterial color={mode === "cinematic" ? "#ffd8a0" : "#fff0d4"} toneMapped={mode === "cinematic"} />
      </mesh>
      <mesh scale={1.7}>
        <sphereGeometry args={[0.72, 48, 32]} />
        <meshBasicMaterial color="#ffb35a" transparent opacity={mode === "cinematic" ? 0.13 : 0.06} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      </> : null}
      <pointLight color="#fff0d2" intensity={mode === "cinematic" ? 82 : 56} distance={44} decay={1.7} />
    </group>
  );
}

function CameraRigV588({
  focusBody,
  variant,
}: {
  focusBody: "overview" | HeroBodyIdV588;
  variant: VisualRestorationVariantV588;
}) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const transitionRef = useRef<{
    start: number;
    fromPosition: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toPosition: THREE.Vector3;
    toTarget: THREE.Vector3;
  } | null>(null);
  useEffect(() => {
    const controls = controlsRef.current;
    const fromTarget = controls?.target.clone() ?? new THREE.Vector3();
    if (focusBody === "overview") {
      transitionRef.current = {
        start: performance.now(),
        fromPosition: camera.position.clone(),
        fromTarget,
        toPosition: variant === "mobile" ? new THREE.Vector3(0, 34, 76) : new THREE.Vector3(0, 13.5, 30),
        toTarget: new THREE.Vector3(0, 0, 0),
      };
      return;
    }
    const orbit = HERO_ORBITS_V588.find((entry) => entry.id === focusBody)!;
    const target = toVector3(orbitPointV588(orbit, orbit.phaseRad));
    const baseOffset = orbit.id === "saturn"
      ? new THREE.Vector3(orbit.visualRadius * 3.1, orbit.visualRadius * 1.55, orbit.visualRadius * 8.4)
      : new THREE.Vector3(orbit.visualRadius * 2.9, orbit.visualRadius * 1.45, orbit.visualRadius * 4.6);
    const offset = variant === "mobile" ? baseOffset.multiplyScalar(1.22) : baseOffset;
    transitionRef.current = {
      start: performance.now(),
      fromPosition: camera.position.clone(),
      fromTarget,
      toPosition: target.clone().add(offset),
      toTarget: target,
    };
  }, [camera, focusBody, variant]);
  useFrame(() => {
    const transition = transitionRef.current;
    const controls = controlsRef.current;
    if (!transition || !controls) return;
    const raw = Math.min(1, (performance.now() - transition.start) / 1050);
    const eased = raw * raw * (3 - 2 * raw);
    camera.position.lerpVectors(transition.fromPosition, transition.toPosition, eased);
    controls.target.lerpVectors(transition.fromTarget, transition.toTarget, eased);
    controls.update();
    if (raw >= 1) transitionRef.current = null;
  });
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.065}
      minDistance={0.9}
      maxDistance={58}
      enablePan
      panSpeed={0.55}
      rotateSpeed={0.48}
      zoomSpeed={0.72}
    />
  );
}

export default function VisualRestorationStageV588({
  mode,
  variant,
  exposureStress,
  selectedBody,
  focusBody,
  velocityScale,
  focusedConstellation,
  onSelectBody,
  onVelocityScale,
}: {
  mode: VisualRestorationModeV588;
  variant: VisualRestorationVariantV588;
  exposureStress: boolean;
  selectedBody: HeroBodyIdV588;
  focusBody: "overview" | HeroBodyIdV588;
  velocityScale: number;
  focusedConstellation: string;
  onSelectBody: (body: HeroBodyIdV588) => void;
  onVelocityScale: (value: number) => void;
}) {
  const scene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    scene.background = new THREE.Color(0x010205);
    gl.shadowMap.enabled = false;
    return () => {
      scene.background = null;
    };
  }, [gl, scene]);
  useEffect(() => {
    gl.toneMappingExposure = exposureStress
      ? mode === "science" ? 1.75 : 2.4
      : mode === "science" ? 1 : 1.12;
  }, [exposureStress, gl, mode]);
  useEffect(() => () => disposeV588TextureLoader(gl), [gl]);
  return (
    <group userData={{
      atlasCandidate: "v588-visual-restoration",
      atlasSharedScientificGeometry: true,
      atlasScientificPayloadSha256: V588_SCIENTIFIC_PAYLOAD_REFERENCE_SHA256,
      atlasScientificPayloadMutation: false,
      atlasSingleCanvas: true,
    }}>
      <RuntimeProbeV588 />
      <CameraRigV588 focusBody={focusBody} variant={variant} />
      <MilkyWayBackdropV588 mode={mode} variant={variant} />
      <StarHierarchyV588 mode={mode} variant={variant} />
      <FeaturedConstellationsV588 mode={mode} variant={variant} focusedCode={focusedConstellation} />
      <ambientLight intensity={mode === "cinematic" ? 0.11 : 0.085} color="#8aa0b9" />
      <SunV588 mode={mode} showDisc={focusBody === "overview"} />
      <OrbitSystemV588 selectedBody={selectedBody} velocityScale={velocityScale} mode={mode} focusBody={focusBody} onVelocityScale={onVelocityScale} />
      {HERO_ORBITS_V588.filter((orbit) => focusBody === "overview" || orbit.id === focusBody).map((orbit) => (
        <HeroPlanetV588
          key={orbit.id}
          orbit={orbit}
          variant={variant}
          mode={mode}
          selected={selectedBody === orbit.id}
          highResolution={focusBody === orbit.id}
          onSelect={() => onSelectBody(orbit.id)}
        />
      ))}
    </group>
  );
}

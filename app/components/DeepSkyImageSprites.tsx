"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import { VISUAL_CALIBRATION } from "../lib/visualCalibration";

type DeepSkySpriteDef = {
  id: string;
  name: string;
  imageUrl: string;
  galLonDeg: number;
  galLatDeg: number;
  size: number;
  rotation: number;
  opacity: number;
  priority?: boolean;
};

const SKY_RADIUS = 8700;
const PRIORITY_DEEP_SKY_COUNT = 10;
const textureCache = new Map<string, THREE.Texture>();
const PLANE_FORWARD = new THREE.Vector3(0, 0, 1);
const CORE_DECAL_SCALE = 0.86;
const DEFERRED_DECAL_SCALE = 0.76;
const BALANCED_LOAD_GAP_MS = 90;
const QUALITY_LOAD_GAP_MS = 35;

const DEEP_SKY_IMAGES: DeepSkySpriteDef[] = [
  {
    id: "m42",
    name: "Orion Nebula",
    imageUrl: "/textures/deep-sky/orion-nebula-pia04227.jpg",
    galLonDeg: 209.0,
    galLatDeg: -19.4,
    size: 620,
    rotation: -0.18,
    opacity: 0.58,
    priority: true,
  },
  {
    id: "ic434",
    name: "Horsehead Nebula",
    imageUrl: "/textures/deep-sky/horsehead-nebula-pia04215.jpg",
    galLonDeg: 206.8,
    galLatDeg: -16.5,
    size: 430,
    rotation: 0.2,
    opacity: 0.46,
    priority: true,
  },
  {
    id: "ngc2237",
    name: "Rosette Nebula",
    imageUrl: "/textures/deep-sky/rosette-nebula-pia09268.jpg",
    galLonDeg: 206.3,
    galLatDeg: -2.1,
    size: 580,
    rotation: 0.08,
    opacity: 0.52,
    priority: true,
  },
  {
    id: "m8",
    name: "Lagoon Nebula",
    imageUrl: "/textures/deep-sky/lagoon-nebula-gsfc.jpg",
    galLonDeg: 6.0,
    galLatDeg: -1.3,
    size: 520,
    rotation: -0.35,
    opacity: 0.5,
    priority: true,
  },
  {
    id: "m16",
    name: "Eagle Nebula",
    imageUrl: "/textures/deep-sky/eagle-nebula.jpg",
    galLonDeg: 17.0,
    galLatDeg: 0.8,
    size: 470,
    rotation: 0.18,
    opacity: 0.48,
    priority: true,
  },
  {
    id: "m17",
    name: "Omega Nebula",
    imageUrl: "/textures/deep-sky/omega-nebula.jpg",
    galLonDeg: 15.0,
    galLatDeg: -0.7,
    size: 470,
    rotation: -0.2,
    opacity: 0.46,
    priority: true,
  },
  {
    id: "m20",
    name: "Trifid Nebula",
    imageUrl: "/textures/deep-sky/trifid-nebula.jpg",
    galLonDeg: 7.0,
    galLatDeg: -2.4,
    size: 430,
    rotation: 0.32,
    opacity: 0.48,
    priority: true,
  },
  {
    id: "ngc7000",
    name: "North America Nebula",
    imageUrl: "/textures/deep-sky/north-america-nebula.jpg",
    galLonDeg: 85.0,
    galLatDeg: -1.0,
    size: 680,
    rotation: -0.12,
    opacity: 0.42,
    priority: true,
  },
  {
    id: "ngc7293",
    name: "Helix Nebula",
    imageUrl: "/textures/deep-sky/helix-nebula.jpg",
    galLonDeg: 34.0,
    galLatDeg: -56.7,
    size: 430,
    rotation: 0.1,
    opacity: 0.48,
    priority: true,
  },
  {
    id: "m57",
    name: "Ring Nebula",
    imageUrl: "/textures/deep-sky/ring-nebula.jpg",
    galLonDeg: 63.3,
    galLatDeg: 13.9,
    size: 300,
    rotation: 0,
    opacity: 0.52,
    priority: true,
  },
  {
    id: "m27",
    name: "Dumbbell Nebula",
    imageUrl: "/textures/deep-sky/dumbbell-nebula.jpg",
    galLonDeg: 59.6,
    galLatDeg: -3.6,
    size: 360,
    rotation: -0.22,
    opacity: 0.48,
  },
  {
    id: "m1",
    name: "Crab Nebula",
    imageUrl: "/textures/deep-sky/crab-nebula.jpg",
    galLonDeg: 184.6,
    galLatDeg: -5.8,
    size: 360,
    rotation: 0.16,
    opacity: 0.5,
  },
  {
    id: "ngc6960",
    name: "Veil Nebula",
    imageUrl: "/textures/deep-sky/veil-nebula.jpg",
    galLonDeg: 70.0,
    galLatDeg: 2.0,
    size: 720,
    rotation: -0.32,
    opacity: 0.38,
  },
  {
    id: "carina",
    name: "Carina Nebula",
    imageUrl: "/textures/deep-sky/carina-nebula.jpg",
    galLonDeg: 287.6,
    galLatDeg: -0.6,
    size: 700,
    rotation: 0.26,
    opacity: 0.48,
  },
  {
    id: "m45",
    name: "Pleiades",
    imageUrl: "/textures/deep-sky/pleiades.jpg",
    galLonDeg: 166.6,
    galLatDeg: -23.5,
    size: 520,
    rotation: 0.12,
    opacity: 0.45,
  },
  {
    id: "rho_oph",
    name: "Rho Ophiuchi",
    imageUrl: "/textures/deep-sky/rho-ophiuchi.jpg",
    galLonDeg: 353.0,
    galLatDeg: 17.0,
    size: 520,
    rotation: -0.12,
    opacity: 0.42,
  },
  {
    id: "ngc6543",
    name: "Cat's Eye Nebula",
    imageUrl: "/textures/deep-sky/cats-eye-nebula.jpg",
    galLonDeg: 96.4,
    galLatDeg: 32.7,
    size: 320,
    rotation: 0,
    opacity: 0.5,
  },
  {
    id: "ngc6302",
    name: "Butterfly Nebula",
    imageUrl: "/textures/deep-sky/butterfly-nebula.jpg",
    galLonDeg: 350.0,
    galLatDeg: -4.0,
    size: 390,
    rotation: 0.18,
    opacity: 0.5,
  },
  {
    id: "ngc2024",
    name: "Flame Nebula",
    imageUrl: "/textures/deep-sky/flame-nebula.jpg",
    galLonDeg: 206.5,
    galLatDeg: -16.4,
    size: 380,
    rotation: 0.12,
    opacity: 0.44,
  },
  {
    id: "ngc7023",
    name: "Iris Nebula",
    imageUrl: "/textures/deep-sky/iris-nebula.jpg",
    galLonDeg: 104.1,
    galLatDeg: 14.2,
    size: 410,
    rotation: -0.12,
    opacity: 0.42,
  },
  {
    id: "ngc281",
    name: "Pacman Nebula",
    imageUrl: "/textures/deep-sky/pacman-nebula.jpg",
    galLonDeg: 123.1,
    galLatDeg: -6.3,
    size: 470,
    rotation: 0.22,
    opacity: 0.42,
  },
  {
    id: "ngc2174",
    name: "Monkey Head Nebula",
    imageUrl: "/textures/deep-sky/monkey-head-nebula.jpg",
    galLonDeg: 190.3,
    galLatDeg: 0.5,
    size: 430,
    rotation: -0.2,
    opacity: 0.42,
  },
  {
    id: "ic1396",
    name: "Elephant's Trunk Nebula",
    imageUrl: "/textures/deep-sky/elephants-trunk-nebula.jpg",
    galLonDeg: 99.3,
    galLatDeg: 3.7,
    size: 560,
    rotation: 0.08,
    opacity: 0.4,
  },
  {
    id: "omega_cen",
    name: "Omega Centauri",
    imageUrl: "/textures/deep-sky/omega-centauri.jpg",
    galLonDeg: 309.1,
    galLatDeg: 15.0,
    size: 420,
    rotation: 0,
    opacity: 0.44,
  },
  {
    id: "47_tuc",
    name: "47 Tucanae",
    imageUrl: "/textures/deep-sky/47-tucanae.jpg",
    galLonDeg: 305.9,
    galLatDeg: -44.9,
    size: 390,
    rotation: 0.06,
    opacity: 0.42,
  },
  {
    id: "cen_a",
    name: "Centaurus A",
    imageUrl: "/textures/deep-sky/centaurus-a.jpg",
    galLonDeg: 309.5,
    galLatDeg: 19.4,
    size: 460,
    rotation: -0.28,
    opacity: 0.38,
  },
  {
    id: "m31",
    name: "Andromeda Galaxy",
    imageUrl: "/textures/deep-sky/andromeda-galaxy.jpg",
    galLonDeg: 121.2,
    galLatDeg: -21.6,
    size: 760,
    rotation: 0.18,
    opacity: 0.36,
  },
  {
    id: "m33",
    name: "Triangulum Galaxy",
    imageUrl: "/textures/deep-sky/triangulum-galaxy.jpg",
    galLonDeg: 133.6,
    galLatDeg: -31.3,
    size: 500,
    rotation: -0.1,
    opacity: 0.36,
  },
];

function galacticSkyPosition(lonDeg: number, latDeg: number): THREE.Vector3 {
  const l = THREE.MathUtils.degToRad(lonDeg);
  const b = THREE.MathUtils.degToRad(latDeg);
  return new THREE.Vector3(
    -Math.cos(b) * Math.cos(l) * SKY_RADIUS,
    Math.sin(b) * SKY_RADIUS,
    Math.cos(b) * Math.sin(l) * SKY_RADIUS,
  );
}

function skyDecalQuaternion(position: THREE.Vector3, rotation: number): THREE.Quaternion {
  const inward = position.clone().normalize().negate();
  const base = new THREE.Quaternion().setFromUnitVectors(PLANE_FORWARD, inward);
  const roll = new THREE.Quaternion().setFromAxisAngle(inward, rotation);
  return base.multiply(roll);
}

function textureAspect(texture: THREE.Texture): number {
  const image = texture.image as { width?: number; height?: number } | undefined;
  if (!image?.width || !image?.height) return 1;
  return THREE.MathUtils.clamp(image.width / image.height, 0.65, 1.85);
}

export default function DeepSkyImageSprites({
  floatingOriginRef,
  highQuality = false,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  highQuality?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRefs = useRef<THREE.MeshBasicMaterial[]>([]);
  const lastTierRef = useRef<string | null>(null);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const texturesRef = useRef<Record<string, THREE.Texture>>({});
  const loadedIdsRef = useRef<Set<string>>(new Set());
  const pendingCommitRef = useRef(false);
  const [loadedIds, setLoadedIds] = useState<string[]>([]);
  const [allowFullSet, setAllowFullSet] = useState(false);
  const alphaMap = useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.2,
      size / 2,
      size / 2,
      size * 0.5,
    );
    gradient.addColorStop(0, "rgb(255,255,255)");
    gradient.addColorStop(0.58, "rgb(235,235,235)");
    gradient.addColorStop(0.82, "rgb(70,70,70)");
    gradient.addColorStop(1, "rgb(0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, []);
  const defs = useMemo(
    () =>
      DEEP_SKY_IMAGES.filter(
        (def, index) => allowFullSet || highQuality || def.priority || index < PRIORITY_DEEP_SKY_COUNT,
      ).map((def) => ({
        ...def,
        position: galacticSkyPosition(def.galLonDeg, def.galLatDeg),
      })),
    [allowFullSet, highQuality],
  );

  useEffect(() => {
    if (!highQuality) {
      setAllowFullSet(false);
      return;
    }
    const scheduleFull = () => setAllowFullSet(true);
    let idleId: number | null = null;
    const timeoutId = window.setTimeout(scheduleFull, 400);
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(scheduleFull, { timeout: 700 });
    }
    return () => {
      window.clearTimeout(timeoutId);
      if (idleId !== null && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
    };
  }, [highQuality]);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    const maxAnisotropy = Math.min(highQuality ? 8 : 4, gl.capabilities.getMaxAnisotropy());
    const queue = defs.filter((def) => !loadedIdsRef.current.has(def.id));
    const loadGapMs = highQuality ? QUALITY_LOAD_GAP_MS : BALANCED_LOAD_GAP_MS;
    let timerId: number | null = null;

    const commitLoadedIds = () => {
      if (cancelled || pendingCommitRef.current) return;
      pendingCommitRef.current = true;
      const run = () => {
        pendingCommitRef.current = false;
        if (cancelled) return;
        setLoadedIds(Array.from(loadedIdsRef.current));
      };
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(run, { timeout: 180 });
      } else {
        globalThis.setTimeout(run, 32);
      }
    };

    const markLoaded = (id: string, tex: THREE.Texture) => {
      texturesRef.current[id] = tex;
      loadedIdsRef.current.add(id);
      commitLoadedIds();
    };

    for (const def of defs) {
      const cached = textureCache.get(def.id);
      if (cached) {
        markLoaded(def.id, cached);
      }
    }

    let queueIndex = 0;
    const loadNext = () => {
      if (cancelled || queueIndex >= queue.length) return;
      const def = queue[queueIndex++]!;
      if (textureCache.has(def.id)) {
        const cached = textureCache.get(def.id)!;
        markLoaded(def.id, cached);
        timerId = window.setTimeout(loadNext, loadGapMs);
        return;
      }
      loader.load(
        def.imageUrl,
        (tex) => {
          if (cancelled) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.generateMipmaps = true;
          tex.anisotropy = maxAnisotropy;
          tex.needsUpdate = true;
          textureCache.set(def.id, tex);
          markLoaded(def.id, tex);
          timerId = window.setTimeout(loadNext, loadGapMs);
        },
        undefined,
        () => {
          if (!cancelled) timerId = window.setTimeout(loadNext, loadGapMs);
        },
      );
    };

    timerId = window.setTimeout(loadNext, highQuality ? 60 : 140);

    return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [defs, gl, highQuality]);

  const loadedIdSet = useMemo(() => new Set(loadedIds), [loadedIds]);

  useEffect(() => () => alphaMap?.dispose(), [alphaMap]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.position.copy(camera.position);
    const tier = floatingOriginRef.current.lodTier;
    if (lastTierRef.current === tier) return;
    lastTierRef.current = tier;
    const opacityScale =
      tier === "solar"
        ? VISUAL_CALIBRATION.deepSkySolarLodOpacity
        : tier === "mid"
          ? VISUAL_CALIBRATION.deepSkyMidLodOpacity
          : VISUAL_CALIBRATION.deepSkyFarLodOpacity;
    for (const mat of materialRefs.current) {
      const opacity = (mat.userData.baseOpacity as number | undefined) ?? 0.45;
      mat.opacity = opacity * opacityScale;
    }
  }, 1002);

  return (
    <group ref={groupRef} renderOrder={-470}>
      {defs.map((def) => {
        if (!loadedIdSet.has(def.id)) return null;
        const tex = texturesRef.current[def.id];
        if (!tex) return null;
        const aspect = textureAspect(tex);
        const quaternion = skyDecalQuaternion(def.position, def.rotation);
        const decalSize = def.size * (def.priority ? CORE_DECAL_SCALE : DEFERRED_DECAL_SCALE);
        const decalOpacity = def.opacity * (def.priority ? VISUAL_CALIBRATION.deepSkyCoreOpacityScale : VISUAL_CALIBRATION.deepSkyDeferredOpacityScale);
        return (
          <mesh
            key={def.id}
            position={def.position}
            quaternion={quaternion}
            scale={[decalSize * aspect, decalSize, 1]}
            renderOrder={-470}
            userData={{ opacity: decalOpacity, label: def.name }}
          >
            <planeGeometry args={[1, 1, 1, 1]} />
            <meshBasicMaterial
              ref={(mat) => {
                if (!mat) return;
                mat.userData.baseOpacity = decalOpacity;
                if (!materialRefs.current.includes(mat)) materialRefs.current.push(mat);
              }}
              map={tex}
              alphaMap={alphaMap ?? undefined}
              color="#ffffff"
              transparent
              opacity={decalOpacity}
              alphaTest={0.015}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

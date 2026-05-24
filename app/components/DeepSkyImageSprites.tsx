"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";

type DeepSkySpriteDef = {
  id: string;
  name: string;
  imageUrl: string;
  galLonDeg: number;
  galLatDeg: number;
  size: number;
  rotation: number;
  opacity: number;
};

const SKY_RADIUS = 8700;

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

export default function DeepSkyImageSprites({
  floatingOriginRef,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRefs = useRef<THREE.SpriteMaterial[]>([]);
  const lastTierRef = useRef<string | null>(null);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const [textures, setTextures] = useState<Record<string, THREE.Texture>>({});
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
      DEEP_SKY_IMAGES.map((def) => ({
        ...def,
        position: galacticSkyPosition(def.galLonDeg, def.galLatDeg),
      })),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    const loaded: THREE.Texture[] = [];

    Promise.all(
      DEEP_SKY_IMAGES.map(
        (def) =>
          new Promise<[string, THREE.Texture] | null>((resolve) => {
            loader.load(
              def.imageUrl,
              (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.minFilter = THREE.LinearMipmapLinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.generateMipmaps = true;
                tex.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
                tex.needsUpdate = true;
                loaded.push(tex);
                resolve([def.id, tex]);
              },
              undefined,
              () => resolve(null),
            );
          }),
      ),
    ).then((items) => {
      if (cancelled) return;
      const next: Record<string, THREE.Texture> = {};
      for (const item of items) {
        if (item) next[item[0]] = item[1];
      }
      setTextures(next);
    });

    return () => {
      cancelled = true;
      for (const tex of loaded) tex.dispose();
    };
  }, [gl]);

  useEffect(() => () => alphaMap?.dispose(), [alphaMap]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.position.copy(camera.position);
    const tier = floatingOriginRef.current.lodTier;
    if (lastTierRef.current === tier) return;
    lastTierRef.current = tier;
    const opacityScale = tier === "solar" ? 1 : tier === "mid" ? 0.82 : 0.68;
    for (const mat of materialRefs.current) {
      const opacity = (mat.userData.baseOpacity as number | undefined) ?? 0.45;
      mat.opacity = opacity * opacityScale;
    }
  }, -990);

  return (
    <group ref={groupRef} renderOrder={-470}>
      {defs.map((def) => {
        const tex = textures[def.id];
        if (!tex) return null;
        return (
          <sprite
            key={def.id}
            position={def.position}
            scale={[def.size, def.size, 1]}
            renderOrder={-470}
            userData={{ opacity: def.opacity, label: def.name }}
          >
            <spriteMaterial
              ref={(mat) => {
                if (!mat) return;
                mat.userData.baseOpacity = def.opacity;
                if (!materialRefs.current.includes(mat)) materialRefs.current.push(mat);
              }}
              map={tex}
              alphaMap={alphaMap ?? undefined}
              color="#ffffff"
              transparent
              opacity={def.opacity}
              rotation={def.rotation}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        );
      })}
    </group>
  );
}

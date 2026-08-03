import type { RefObject } from "react";
import * as THREE from "three";
import type { OrbitAtlasSkyLayerManifest } from "../lib/orbitAtlasPresentation";

type GalaxyEnvironmentLayersProps = {
  rootRef: RefObject<THREE.Group | null>;
  layerManifest: OrbitAtlasSkyLayerManifest;
  baseMaterial: THREE.ShaderMaterial;
  distantStarsMaterial: THREE.ShaderMaterial;
  starsMaterial: THREE.ShaderMaterial;
  distantStarsTexture: THREE.Texture | null;
  starsTexture: THREE.Texture | null;
  orbitAtlas: boolean;
  mobile: boolean;
  gasGiantCloseup: boolean;
  selectedBodyCinematic: boolean;
};

export default function GalaxyEnvironmentLayers({
  rootRef, layerManifest, baseMaterial, distantStarsMaterial, starsMaterial,
  distantStarsTexture, starsTexture, orbitAtlas, mobile, gasGiantCloseup,
  selectedBodyCinematic,
}: GalaxyEnvironmentLayersProps) {
  const useManifestBackdropRotation = layerManifest.desktopBase.includes("/orbit-atlas-");
  const rotation = useManifestBackdropRotation
    ? [...layerManifest.rotation] as [number, number, number]
    : [0.1, Math.PI + 0.22, -0.76] as [number, number, number];

  return (
    <group ref={rootRef} rotation={rotation} frustumCulled={false}>
      <mesh frustumCulled={false} renderOrder={-10000} scale={900000}>
        <sphereGeometry args={[1, 128, 64]} />
        <primitive object={baseMaterial} attach="material" />
      </mesh>
      {orbitAtlas && distantStarsTexture ? (
        <mesh frustumCulled={false} renderOrder={-9999} scale={899850}>
          <sphereGeometry args={[1, 128, 64]} />
          <primitive object={distantStarsMaterial} attach="material" />
        </mesh>
      ) : null}
      {useManifestBackdropRotation && starsTexture ? (
        <mesh frustumCulled={false} renderOrder={-9998} scale={899900}>
          <sphereGeometry args={[1, 128, 64]} />
          <primitive object={starsMaterial} attach="material" />
        </mesh>
      ) : null}
      {mobile && gasGiantCloseup && selectedBodyCinematic ? (
        <mesh frustumCulled={false} renderOrder={-9997} scale={899700}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial
            color="#020308"
            depthTest={false}
            depthWrite={false}
            side={THREE.BackSide}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </group>
  );
}

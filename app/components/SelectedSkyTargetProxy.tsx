"use client";

import { Billboard } from "@react-three/drei/core/Billboard";
import { Html } from "@react-three/drei/web/Html";
import { useMemo } from "react";
import type { GaiaIndexedStar } from "../lib/gaiaCatalogIndex";
import { selectedSkyTargetDescriptor } from "../lib/selectedSkyTarget";
import { SKY_TARGET_DISTANCE_SCENE, skyTargetPosition } from "../lib/skyTargetFocus";
import { stellarMaterialProfile } from "../lib/stellarMaterialProfile";
import { createStellarPortraitProfileV7 } from "../lib/stellarPortraitProfileV7";
import StellarPortraitMaterial, { StellarCoronaMaterial, StellarHaloMaterial } from "./StellarPortraitMaterial";

export default function SelectedSkyTargetProxy({
  selectedCatalogId,
  gaiaIndex,
  enabled,
}: {
  selectedCatalogId: string;
  gaiaIndex: readonly GaiaIndexedStar[];
  enabled: boolean;
}) {
  const target = useMemo(() => {
    const descriptor = selectedSkyTargetDescriptor(selectedCatalogId, gaiaIndex);
    if (!descriptor) return null;
    const position = skyTargetPosition(descriptor.direction, SKY_TARGET_DISTANCE_SCENE);
    return position ? { descriptor, position } : null;
  }, [gaiaIndex, selectedCatalogId]);

  if (!enabled || !target) return null;
  const material = stellarMaterialProfile({
    id: target.descriptor.id,
    colorBpRp: target.descriptor.colorBpRp,
    mag: target.descriptor.mag,
    parallaxMas: target.descriptor.parallaxMas,
    fallbackColor: target.descriptor.color ?? (target.descriptor.kind === "gaia" ? "#a7f3ff" : "#ffd891"),
  });
  return <StellarPortrait position={target.position} descriptor={target.descriptor} material={material} />;
}

function StellarPortrait({
  position,
  descriptor,
  material,
}: {
  position: [number, number, number];
  descriptor: NonNullable<ReturnType<typeof selectedSkyTargetDescriptor>>;
  material: ReturnType<typeof stellarMaterialProfile>;
}) {
  const radius = descriptor.kind === "gaia" ? 142 : 156;
  const portrait = createStellarPortraitProfileV7({
    material,
    teffK: descriptor.teffK,
    teffLowerK: descriptor.teffLowerK,
    teffUpperK: descriptor.teffUpperK,
    logg: descriptor.logg,
    radiusSolar: descriptor.radiusSolar,
    metallicityDex: descriptor.metallicityDex,
    dataTier: descriptor.dataTier,
    variable: descriptor.variable,
    spectralType: descriptor.spectralType,
    colorIndexAvailable: descriptor.colorBpRp != null,
  });
  const spectralLabel = descriptor.spectralType || portrait.atmosphereClass;

  return (
    <group position={position}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <mesh renderOrder={45} scale={[radius * 3.5, radius * 3.5, 1]}>
          <planeGeometry args={[1, 1]} />
          <StellarHaloMaterial portrait={portrait} />
        </mesh>
      </Billboard>
      <mesh renderOrder={47}>
        <sphereGeometry args={[radius, 64, 48]} />
        <StellarPortraitMaterial material={material} portrait={portrait} />
      </mesh>
      <mesh renderOrder={46} scale={1.22}>
        <sphereGeometry args={[radius, 48, 32]} />
        <StellarCoronaMaterial portrait={portrait} />
      </mesh>
      <Html center distanceFactor={6.4} style={{ pointerEvents: "none" }} zIndexRange={[55, 0]}>
        <div
          className="relative h-[132px] w-[132px]"
          data-sky-target-proxy="true"
          data-sky-target-proxy-id={descriptor.id}
          data-sky-target-proxy-kind={descriptor.kind}
          data-sky-target-proxy-spectral-label={spectralLabel}
          data-stellar-portrait="gaia-derived-offline-curated-presentation-portrait"
          data-stellar-portrait-version={portrait.version}
          data-stellar-portrait-derivation={portrait.derivation}
          data-stellar-atmosphere-class={portrait.atmosphereClass}
          data-stellar-parameter-source={portrait.parameterSource}
          data-stellar-parameter-completeness={portrait.parameterCompleteness}
          data-stellar-data-tier={portrait.dataTier}
          data-stellar-parameter-confidence={portrait.parameterConfidence.toFixed(3)}
          data-stellar-metallicity-dex={portrait.metallicityDex ?? "unknown"}
          data-stellar-color-temperature-k={material.colorTemperatureK}
          data-stellar-flare-count={portrait.prominenceBudget}
          data-stellar-draw-call-budget={portrait.drawCallBudget}
        >
          <div className="absolute left-1/2 top-full mt-2 min-w-[210px] -translate-x-1/2 rounded-md border border-cyan-100/25 bg-black/72 px-2.5 py-1.5 text-center text-[9px] text-cyan-50 backdrop-blur-md">
            <div className="truncate text-white/90">{descriptor.label}</div>
            <div className="mt-0.5 truncate text-white/50">
              恒星肖像 / {spectralLabel} / {Math.round(portrait.temperatureK)} K
            </div>
            <div className="mt-0.5 truncate text-white/35">
              参数派生展示 / {portrait.parameterSource} / 非解析表面
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  CONSTELLATION_ART_COVERAGE_V592,
  buildConstellationEngravingGeometryV592,
} from "../lib/constellationArtV592";
import type { CelestialRenderProfileV590 } from "../lib/celestialRenderingV590";
import type { LivingConstellationRangeV592 } from "../workers/livingStarfieldV592.worker";
import { acquireConstellationEngravingResourcesV592 } from "../lib/constellationEngravingResourcesV592";

function geometryV592(values: Float32Array): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(values, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

export default function ConstellationEngravingV592({
  segments,
  range,
  profile,
}: Readonly<{
  segments: Float32Array;
  range: LivingConstellationRangeV592 | null;
  profile: CelestialRenderProfileV590;
}>) {
  const active = profile.mode === "cinematic" && range !== null;
  const packet = useMemo(
    () => active && range ? buildConstellationEngravingGeometryV592(segments, range) : null,
    [active, range, segments],
  );
  const resources = useMemo(() => {
    if (!packet) return null;
    const outline = geometryV592(packet.outlinePositions);
    const inner = geometryV592(packet.innerOutlinePositions);
    const hatch = geometryV592(packet.hatchSegmentPositions);
    const fill = geometryV592(packet.fillTrianglePositions);
    const mobile = profile.deviceTier === "mobile";
    return {
      outline,
      inner,
      hatch,
      fill,
      outlineMaterial: new THREE.LineBasicMaterial({
        color: 0xa8c0c5,
        transparent: true,
        opacity: mobile ? 0.16 : 0.21,
        depthTest: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        toneMapped: false,
      }),
      innerMaterial: new THREE.LineBasicMaterial({
        color: 0x7899a2,
        transparent: true,
        opacity: mobile ? 0.08 : 0.115,
        depthTest: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        toneMapped: false,
      }),
      hatchMaterial: new THREE.LineBasicMaterial({
        color: 0xc2a879,
        transparent: true,
        opacity: mobile ? 0.055 : 0.075,
        depthTest: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        toneMapped: false,
      }),
      fillMaterial: new THREE.MeshBasicMaterial({
        color: 0x31515a,
        transparent: true,
        opacity: mobile ? 0.018 : 0.026,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        toneMapped: false,
      }),
    };
  }, [packet, profile.deviceTier]);

  useEffect(() => {
    if (!resources || !packet) return;
    return acquireConstellationEngravingResourcesV592(resources, {
      code: packet.code,
      signature: packet.signature,
      deviceTier: profile.deviceTier,
    });
  }, [resources, packet, profile.deviceTier]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("section[data-atlas-v592-candidate]");
    if (!root) return;
    root.dataset.atlasV592ConstellationArtStatus = CONSTELLATION_ART_COVERAGE_V592.status;
    root.dataset.atlasV592ConstellationArtAdmission = `${CONSTELLATION_ART_COVERAGE_V592.admittedCount}/${CONSTELLATION_ART_COVERAGE_V592.requiredCount}`;
    root.dataset.atlasV592ConstellationArtPrimaryModel = CONSTELLATION_ART_COVERAGE_V592.primaryModel;
    root.dataset.atlasV592ConstellationArtActiveCode = packet?.code ?? "none";
    root.dataset.atlasV592ConstellationArtSignature = packet?.signature ?? "none";
    root.dataset.atlasV592ConstellationArtAnchorCount = String(packet?.uniqueAnchorCount ?? 0);
    root.dataset.atlasV592ConstellationArtDrawCalls = packet ? "4" : "0";
    root.dataset.atlasV592ConstellationArtProceduralFallback = "false";
    root.dataset.atlasV592ConstellationArtObservationImageClaim = "false";
    root.dataset.atlasV592ConstellationArtScientificWriteback = "false";
  }, [packet]);

  if (!packet || !resources) return null;
  const commonUserData = {
    atlasCandidate: "v592",
    atlasLayer: "gaia-tangent-plane-constellation-engraving-v592",
    atlasConstellationCode: packet.code,
    atlasConstellationArtSignature: packet.signature,
    atlasPrimaryModel: CONSTELLATION_ART_COVERAGE_V592.primaryModel,
    atlasPresentationOnly: true,
    atlasObservationImageClaim: false,
    atlasProceduralFallback: false,
    atlasScientificPayloadWriteback: false,
  };
  return (
    <group userData={commonUserData}>
      <mesh geometry={resources.fill} material={resources.fillMaterial} renderOrder={-839} frustumCulled={false} />
      <lineLoop geometry={resources.outline} material={resources.outlineMaterial} renderOrder={-838} frustumCulled={false} />
      <lineLoop geometry={resources.inner} material={resources.innerMaterial} renderOrder={-838} frustumCulled={false} />
      <lineSegments geometry={resources.hatch} material={resources.hatchMaterial} renderOrder={-837} frustumCulled={false} />
    </group>
  );
}

"use client";

import type { CelestialClockControllerV592 } from "../lib/celestialClockV592";
import type {
  CelestialFocusTargetV590,
  CelestialRenderProfileV590,
  HeroAssetAdmissionV590,
  HeroBodyIdV590,
} from "../lib/celestialRenderingV590";
import CelestialConvergenceStageV591 from "./CelestialConvergenceStageV591";
import CelestialRotationBridgeV592 from "./CelestialRotationBridgeV592";
import CelestialWorkerPolicyBridgeV592 from "./CelestialWorkerPolicyBridgeV592";
import LivingStarfieldV592 from "./LivingStarfieldV592";
import StellarHeroV592 from "./StellarHeroV592";
import type { StellarHeroIdV592 } from "../lib/stellarHeroesV592";
import type { LivingUniverseFocusTargetV592 } from "../lib/nebulaVisualAssetsV592";
import ExpandedNebulaLayerV592 from "./ExpandedNebulaLayerV592";
import MajorMoonHeroV592 from "./MajorMoonHeroV592";
import type { MajorMoonIdV592 } from "../lib/majorMoonsV592";
import CelestialKtx2LaneBridgeV592 from "./CelestialKtx2LaneBridgeV592";
import DeepSpaceReferenceLayerV592 from "./DeepSpaceReferenceLayerV592";
import LegacyNebulaTelemetryBridgeV592 from "./LegacyNebulaTelemetryBridgeV592";

export default function LivingUniverseStageV592({
  profile,
  baselineAdmissions,
  baselineFocusTarget,
  livingFocusTarget,
  clock,
  stellarHeroId,
  majorMoonId,
}: Readonly<{
  profile: CelestialRenderProfileV590;
  baselineAdmissions: Readonly<Record<HeroBodyIdV590, HeroAssetAdmissionV590>>;
  baselineFocusTarget: CelestialFocusTargetV590;
  livingFocusTarget: LivingUniverseFocusTargetV592;
  clock: CelestialClockControllerV592;
  stellarHeroId: StellarHeroIdV592 | null;
  majorMoonId: MajorMoonIdV592 | null;
}>) {
  return (
    <>
      <CelestialWorkerPolicyBridgeV592 />
      <CelestialKtx2LaneBridgeV592 />
      <CelestialConvergenceStageV591
        profile={profile}
        baselineAdmissions={baselineAdmissions}
        focusTarget={baselineFocusTarget}
      />
      <LivingStarfieldV592 profile={profile} closeup={livingFocusTarget !== "overview" || Boolean(stellarHeroId)} />
      <ExpandedNebulaLayerV592 profile={profile} focusTarget={livingFocusTarget} />
      <LegacyNebulaTelemetryBridgeV592 focusTarget={livingFocusTarget} />
      <DeepSpaceReferenceLayerV592 profile={profile} focusTarget={livingFocusTarget} />
      <CelestialRotationBridgeV592 clock={clock} />
      {stellarHeroId ? (
        <StellarHeroV592
          starId={stellarHeroId}
          mode={profile.mode}
          deviceTier={profile.deviceTier}
          clock={clock}
        />
      ) : null}
      {majorMoonId ? <MajorMoonHeroV592 moonId={majorMoonId} profile={profile} clock={clock} /> : null}
    </>
  );
}

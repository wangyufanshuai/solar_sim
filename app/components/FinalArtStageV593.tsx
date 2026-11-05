"use client";

import type { CelestialClockControllerV592 } from "../lib/celestialClockV592";
import type {
  CelestialFocusTargetV590,
  CelestialRenderProfileV590,
  HeroAssetAdmissionV590,
  HeroBodyIdV590,
} from "../lib/celestialRenderingV590";
import type { LivingUniverseFocusTargetV592 } from "../lib/nebulaVisualAssetsV592";
import type { StellarHeroIdV592 } from "../lib/stellarHeroesV592";
import LivingUniverseStageV592 from "./LivingUniverseStageV592";
import SignatureArtDirectionBridgeV593 from "./SignatureArtDirectionBridgeV593";

export default function FinalArtStageV593({
  profile,
  baselineAdmissions,
  baselineFocusTarget,
  livingFocusTarget,
  clock,
  stellarHeroId,
  focusId,
  framePresetId,
  artDirectionEnabled,
}: Readonly<{
  profile: CelestialRenderProfileV590;
  baselineAdmissions: Readonly<Record<HeroBodyIdV590, HeroAssetAdmissionV590>>;
  baselineFocusTarget: CelestialFocusTargetV590;
  livingFocusTarget: LivingUniverseFocusTargetV592;
  clock: CelestialClockControllerV592;
  stellarHeroId: StellarHeroIdV592 | null;
  focusId: string;
  framePresetId: string;
  artDirectionEnabled: boolean;
}>) {
  return (
    <>
      <LivingUniverseStageV592
        profile={profile}
        baselineAdmissions={baselineAdmissions}
        baselineFocusTarget={baselineFocusTarget}
        livingFocusTarget={livingFocusTarget}
        clock={clock}
        stellarHeroId={stellarHeroId}
        majorMoonId={null}
      />
      <SignatureArtDirectionBridgeV593
        mode={profile.mode}
        focusId={focusId}
        framePresetId={framePresetId}
        enabled={artDirectionEnabled}
      />
    </>
  );
}

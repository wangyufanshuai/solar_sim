import type { GalaxyEnvironmentSphereProps } from "./GalaxyEnvironmentSupport";

export type GalaxyEnvironmentBackdropFlagsV281 = {
  referenceDepth: number;
  negativeSpace: number;
  finalBackdrop: boolean;
  referenceBackdropMode: boolean;
  layeredBackdrop: boolean;
  cleanBackdrop: boolean;
};

export function classifyGalaxyEnvironmentBackdropV281(args: {
  layerManifest: GalaxyEnvironmentSphereProps["layerManifest"];
  orbitAtlas: boolean;
  backgroundDepthProfile: string;
}): GalaxyEnvironmentBackdropFlagsV281 {
  const desktop = args.layerManifest?.desktopBase ?? "";
  const referenceDepth = args.backgroundDepthProfile === "closeup-subject-negative-space" ? 0.94 : args.backgroundDepthProfile === "showcase-reference-depth" ? 0.64 : 0.54;
  const negativeSpace = args.backgroundDepthProfile === "closeup-subject-negative-space" ? 0.94 : args.backgroundDepthProfile === "showcase-reference-depth" ? 0.42 : 0.22;
  const finalBackdrop = ["v62", "v63-final", "v64-cinematic", "v65-lock", "v66-milky-way-depth", "v67-galactic-depth", "v68-reference-backdrop"].some((token) => desktop.includes(token));
  const referenceBackdropMode = args.orbitAtlas || desktop.includes("v68-reference-backdrop") || desktop.includes("v9-base");
  const layeredBackdrop = args.layerManifest?.nebulaHazeMask?.includes("v56") || desktop.includes("v57") || desktop.includes("v59") || desktop.includes("v60") || finalBackdrop;
  const cleanBackdrop = false;
  return { referenceDepth, negativeSpace, finalBackdrop, referenceBackdropMode, layeredBackdrop, cleanBackdrop };
}

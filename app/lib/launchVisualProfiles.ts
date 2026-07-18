export const LAUNCH_VISUAL_PROFILE_MANIFEST_VERSION =
  "v112-launch-visual-profile-manifest";

export type LaunchVisualProfileId =
  | "leo-satellite-deployer"
  | "sls-artemis-stack"
  | "mars-cargo-heavy-lift";

export type LaunchVisualProfile = {
  id: LaunchVisualProfileId;
  missionProfileIds: readonly string[];
  label: string;
  vehicleScale: number;
  boosterCount: number;
  serviceTowerHeight: number;
  payloadKind: "deployable-satellite" | "crew-stack" | "cargo-fairing";
  stageLabels: readonly string[];
  primaryColor: string;
  accentColor: string;
};

export const LAUNCH_VISUAL_PROFILES: readonly LaunchVisualProfile[] = [
  {
    id: "leo-satellite-deployer",
    missionProfileIds: ["leo_satellite", "leo_validation"],
    label: "LEO satellite deployer",
    vehicleScale: 2.6,
    boosterCount: 0,
    serviceTowerHeight: 0.23,
    payloadKind: "deployable-satellite",
    stageLabels: ["Liftoff", "Max-Q", "Fairing open", "Satellite deploy"],
    primaryColor: "#e4ecf4",
    accentColor: "#60a5fa",
  },
  {
    id: "sls-artemis-stack",
    missionProfileIds: ["artemis_ii"],
    label: "SLS / Artemis stack",
    vehicleScale: 4.2,
    boosterCount: 2,
    serviceTowerHeight: 0.28,
    payloadKind: "crew-stack",
    stageLabels: ["Core stage", "SRB sep", "ICPS", "TLI coast"],
    primaryColor: "#f8fafc",
    accentColor: "#f59e0b",
  },
  {
    id: "mars-cargo-heavy-lift",
    missionProfileIds: ["mars_cargo"],
    label: "Mars cargo heavy lift",
    vehicleScale: 4.0,
    boosterCount: 2,
    serviceTowerHeight: 0.27,
    payloadKind: "cargo-fairing",
    stageLabels: ["Boost", "Max-Q", "Stage sep", "Mars transfer"],
    primaryColor: "#f1f5f9",
    accentColor: "#fb7185",
  },
];

export function getLaunchVisualProfile(missionProfileId: string | undefined | null): LaunchVisualProfile {
  return (
    LAUNCH_VISUAL_PROFILES.find((profile) =>
      profile.missionProfileIds.includes(missionProfileId ?? ""),
    ) ?? LAUNCH_VISUAL_PROFILES[0]!
  );
}

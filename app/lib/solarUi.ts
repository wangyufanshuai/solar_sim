export type SolarUiMode = "solar" | "deep-universe" | "atlas" | "mission" | "gallery";

export type SolarUiDensity = "compact" | "standard" | "inspect";

export type HudVisibilityState = {
  mode: SolarUiMode;
  density: SolarUiDensity;
  ordinaryHudVisible: boolean;
  developerHudVisible: boolean;
  immersive: boolean;
};

export type SolarConsoleCopyKey =
  | "explore"
  | "atlas"
  | "mission"
  | "deep"
  | "gallery"
  | "search"
  | "reset"
  | "focus"
  | "play"
  | "pause";

export const SOLAR_CONSOLE_COPY: Record<SolarConsoleCopyKey, string> = {
  explore: "Explore",
  atlas: "Atlas",
  mission: "Mission",
  deep: "Deep",
  gallery: "Gallery",
  search: "Search",
  reset: "Reset view",
  focus: "Focus target",
  play: "Play",
  pause: "Pause",
};

export function describeSolarUiMode(mode: SolarUiMode): string {
  switch (mode) {
    case "deep-universe":
      return "Deep Universe";
    case "atlas":
      return "Sky Atlas";
    case "mission":
      return "Mission Ops";
    case "gallery":
      return "Gallery";
    default:
      return "Solar System";
  }
}

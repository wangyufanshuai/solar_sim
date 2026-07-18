import { describe, expect, it } from "vitest";
import {
  LAUNCH_MISSION_PROFILES,
  configFromMissionProfile,
  getLaunchMissionProfile,
} from "./launchMissionProfiles";

describe("v107 single satellite launch profile", () => {
  it("reuses the existing LEO launch configuration path", () => {
    const profile = getLaunchMissionProfile("leo_satellite");
    expect(LAUNCH_MISSION_PROFILES.some((item) => item.id === "leo_satellite")).toBe(true);
    expect(profile).toMatchObject({
      missionMode: "leo",
      destination: "LEO",
      targetAltitudeM: 550_000,
      cargoMassKg: 1_200,
      targetInclinationDeg: 53,
    });
    expect(configFromMissionProfile(profile)).toMatchObject({
      profile: "leo_satellite",
      missionMode: "leo",
      target_altitude_m: 550_000,
      cargoMassKg: 1_200,
    });
  });
});

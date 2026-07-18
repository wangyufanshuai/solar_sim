import { describe, expect, it } from "vitest";
import {
  bpRpToTemperatureK,
  spectralLabelForBpRp,
  stellarMaterialProfile,
} from "./stellarMaterialProfile";

describe("stellarMaterialProfile", () => {
  it("maps hot and cool Gaia colors to distinct material profiles", () => {
    const hot = stellarMaterialProfile({
      id: "vega",
      colorBpRp: 0,
      mag: 0.03,
      parallaxMas: 130.2,
    });
    const cool = stellarMaterialProfile({
      id: "red-giant",
      colorBpRp: 2.2,
      mag: 2.1,
      parallaxMas: 7,
    });

    expect(bpRpToTemperatureK(0)).toBeGreaterThan(bpRpToTemperatureK(2.2));
    expect(hot.spectralLabel).toBe("A/F white");
    expect(cool.spectralLabel).toBe("K/M amber-red");
    expect(hot.color).not.toBe(cool.color);
    expect(hot.haloScale).toBeGreaterThan(1);
    expect(cool.coreIntensity).toBeGreaterThan(0.5);
  });

  it("is deterministic for stable catalog ids", () => {
    const first = stellarMaterialProfile({ id: "4049506483413484672", colorBpRp: 1.42, mag: 2.3, parallaxMas: 7.8 });
    const second = stellarMaterialProfile({ id: "4049506483413484672", colorBpRp: 1.42, mag: 2.3, parallaxMas: 7.8 });
    expect(first.twinkleSeed).toBe(second.twinkleSeed);
    expect(spectralLabelForBpRp(1.42)).toBe("G/K warm");
  });
});

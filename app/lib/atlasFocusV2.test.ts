import { describe, expect, it } from "vitest";
import {
  catalogIdentityFromSourceId,
  chooseStellarPickCandidate,
  stellarPointerIsShortClick,
  type StellarPickCandidate,
} from "./atlasFocusV2";

const candidates: StellarPickCandidate[] = [
  { kind: "bright-star", stableId: "sirius", catalogId: "nearby-star:sirius", screenX: 100, screenY: 100, magnitude: -1.46, labelled: true },
  { kind: "gaia-star", stableId: "gaia-2", catalogId: "gaia-dr3:2", screenX: 103, screenY: 100, magnitude: 4, labelled: false },
];

describe("atlas universal focus v154", () => {
  it("prefers the labelled bright target inside the click radius", () => {
    expect(chooseStellarPickCandidate(candidates, { screenX: 102, screenY: 100, pointerType: "mouse" })?.stableId).toBe("sirius");
  });

  it("uses a wider touch radius without accepting desktop misses", () => {
    expect(chooseStellarPickCandidate(candidates, { screenX: 122, screenY: 100, pointerType: "mouse" })).toBeNull();
    expect(chooseStellarPickCandidate(candidates, { screenX: 122, screenY: 100, pointerType: "touch" })?.stableId).toBe("gaia-2");
  });

  it("rejects drags and long presses", () => {
    expect(stellarPointerIsShortClick({ downX: 0, downY: 0, upX: 10, upY: 0, elapsedMs: 100 })).toBe(false);
    expect(stellarPointerIsShortClick({ downX: 0, downY: 0, upX: 1, upY: 1, elapsedMs: 700 })).toBe(false);
  });

  it("does not advertise HYG identities as Gaia source IDs", () => {
    expect(catalogIdentityFromSourceId({ objectId: "hyg:32263", sourceId: "hyg:32263" })).toMatchObject({ namespace: "hyg", gaiaSourceId: null, hygId: "32263" });
    expect(catalogIdentityFromSourceId({ objectId: "gaia:1", sourceId: "4049506483413484672" })).toMatchObject({ namespace: "gaia-dr3", gaiaSourceId: "4049506483413484672" });
  });
});

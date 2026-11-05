import { afterEach, describe, expect, it } from "vitest";
import { registerMainlineAJourneyMeasurementM4, registerMainlineAJourneyViewportM4, resolveMainlineAJourneyViewportM4 } from "./mainlineAJourneyViewportM4";

const base = { left: 0, top: 84, right: 920, bottom: 650, viewportWidth: 1280, viewportHeight: 720 };
const canvas = { x: 0, y: 0, width: 1280, height: 720 };
const cleanups: Array<() => void> = [];
afterEach(() => { while (cleanups.length) cleanups.pop()!(); });
function activate() {
  cleanups.push(registerMainlineAJourneyViewportM4());
  const writer = registerMainlineAJourneyMeasurementM4(); cleanups.push(writer.release);
  return writer;
}
describe("journey measured viewport", () => {
  it("preserves the existing safe viewport when no journey is present", () => {
    expect(resolveMainlineAJourneyViewportM4(1280, 720, base)).toBe(base);
  });
  it("waits for an actual measurement and never treats full coverage as free sky", () => {
    const writer = activate();
    expect(resolveMainlineAJourneyViewportM4(1280, 720, base)).toBeNull();
    writer.publish({ canvas, viewport: canvas, blockers: [{ id: "route", kind: "other", rect: canvas }] });
    expect(resolveMainlineAJourneyViewportM4(1280, 720, base)).toBeNull();
  });
  it("keeps a desktop subject outside the measured journey and passport", () => {
    const writer = activate(); const hud = { x: 16, y: 92, width: 310, height: 220 };
    writer.publish({ canvas, viewport: canvas, blockers: [{ id: "route", kind: "other", rect: hud }] });
    const rect = resolveMainlineAJourneyViewportM4(1280, 720, base)!;
    expect(rect.right).toBeLessThanOrEqual(920);
    expect(rect.left >= hud.x + hud.width || rect.top >= hud.y + hud.height).toBe(true);
  });
  it("updates mobile free area when the narrative expands", () => {
    const writer = activate(); const mobile = { x: 0, y: 0, width: 390, height: 844 };
    const mobileBase = { left: 0, top: 84, right: 390, bottom: 650, viewportWidth: 390, viewportHeight: 844 };
    writer.publish({ canvas: mobile, viewport: mobile, blockers: [{ id: "route", kind: "other", rect: { x: 8, y: 90, width: 374, height: 200 } }] });
    const first = resolveMainlineAJourneyViewportM4(390, 844, mobileBase)!;
    writer.publish({ canvas: mobile, viewport: mobile, blockers: [{ id: "route", kind: "other", rect: { x: 8, y: 90, width: 374, height: 320 } }] });
    const expanded = resolveMainlineAJourneyViewportM4(390, 844, mobileBase)!;
    expect(expanded.top).toBeGreaterThan(first.top);
    expect(expanded.bottom).toBe(650);
  });
  it("old observer and journey cleanups cannot erase successors", () => {
    const old = activate(); const newer = registerMainlineAJourneyMeasurementM4(); cleanups.push(newer.release);
    newer.publish({ canvas, viewport: canvas, blockers: [] });
    old.release(); old.publish(null);
    expect(resolveMainlineAJourneyViewportM4(1280, 720, base)).not.toBeNull();
    const releaseOld = registerMainlineAJourneyViewportM4();
    const releaseNew = registerMainlineAJourneyViewportM4(); cleanups.push(releaseNew);
    releaseOld(); newer.publish(null);
    expect(resolveMainlineAJourneyViewportM4(1280, 720, base)).toBeNull();
  });
});

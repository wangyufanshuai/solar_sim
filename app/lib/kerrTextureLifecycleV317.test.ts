import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { clearKerrInteractiveValuesV317, releaseKerrDataTextureV317 } from "./kerrTextureLifecycleV317";

describe("v317 Kerr texture and response lifecycle", () => {
  it("clears texture ownership before one idempotent disposal", () => {
    const dispose = vi.fn();
    const texture = { image: { data: new Uint8Array(64), width: 4, height: 4 }, needsUpdate: true, dispose };
    expect(releaseKerrDataTextureV317(texture)).toMatchObject({ released: true, sourceByteLength: 64, retainedByteLength: 0 });
    expect(texture.image).toMatchObject({ width: 0, height: 0 });
    expect(texture.image.data.byteLength).toBe(0);
    expect(texture.needsUpdate).toBe(false);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(releaseKerrDataTextureV317(texture)).toMatchObject({ released: false, retainedByteLength: 0 });
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("wipes transferred cinematic values after materialization", () => {
    const values = new Float32Array([1, 2, 3, 4]);
    expect(clearKerrInteractiveValuesV317(values)).toBe(16);
    expect([...values]).toEqual([0, 0, 0, 0]);
  });

  it("wires cancellation, rejection, Worker failure, materialization failure and repeated cleanup", () => {
    const source = readFileSync(resolve(process.cwd(), "app/components/KerrStrongGravityRendererV299.tsx"), "utf8");
    expect(source).toContain("if (cancelled) {\n        clearKerrInteractiveValuesV317(response.values);");
    expect(source).toContain('"cinematic-response-rejected"');
    expect(source).toContain('"cinematic-worker-failed"');
    expect(source).toContain('"cinematic-response-materialization-failed"');
    expect(source).toContain('"cinematic-effect-cleanup"');
    expect(source).toContain("setTexture((current) => current === nextTexture ? null : current)");
    expect(source).toContain("releaseKerrDataTextureV317(nextTexture)");
  });
});

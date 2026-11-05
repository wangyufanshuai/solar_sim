import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
type ShadowPointer = {
  pointerSha256: string;
  formalProductPointer: string;
  formalProductPointerAdvanced: boolean;
  promotionApplied: boolean;
  science: Record<string, unknown>;
  contracts: Record<string, unknown>;
  sources: Record<string, { path: string; sha256: string }>;
  resourcePreflight: { heavyGateAllowed: boolean };
  status: string;
};
type PhaseEvidence = {
  evidenceSha256: string;
  release: Record<string, unknown>;
  validation: Record<string, unknown> & { lightweight?: { status?: string } };
  qualificationApplied: boolean;
};
const readJson = <T = Record<string, unknown>>(path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
const fileSha256 = (path: string) => sha256(readFileSync(resolve(process.cwd(), path)));

describe("v267-v270 local shadow evidence", () => {
  it("retains v263 as the formal product pointer and binds all phase evidence", () => {
    const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v270.json";
    const pointer = readJson<ShadowPointer>(pointerPath);
    const unsignedPointer: Partial<ShadowPointer> = { ...pointer };
    delete unsignedPointer.pointerSha256;
    expect(pointer.pointerSha256).toBe(sha256(JSON.stringify(canonicalize(unsignedPointer))));
    expect(pointer.formalProductPointer).toBe("dist/release/orbit-atlas-current-product-evidence-v263.json");
    expect(readJson(pointer.formalProductPointer).version).toBe("v263-current-product-evidence-pointer");
    expect(pointer.formalProductPointerAdvanced).toBe(false);
    expect(pointer.promotionApplied).toBe(false);
    expect(pointer.science).toMatchObject({
      defaultKernel: "legacy-eih-1pn",
      codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8",
      screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037",
      workerPhysicsMutation: "not-applied",
      eihOnePnMutation: "not-applied",
      kerrMutation: "not-applied",
    });
    expect(pointer.contracts).toMatchObject({ legacyRootAttributes: 603, evidenceLedgerClaims: 84, singleCanvas: true });
    expect(Object.keys(pointer.sources)).toEqual(["v267", "v268", "v269", "v270"]);
    for (const source of Object.values(pointer.sources)) {
      expect(fileSha256(source.path)).toBe(source.sha256);
      const evidence = readJson<PhaseEvidence>(source.path);
      const unsigned: Partial<PhaseEvidence> = { ...evidence };
      delete unsigned.evidenceSha256;
      expect(evidence.evidenceSha256).toBe(sha256(JSON.stringify(canonicalize(unsigned))));
      expect(evidence.release).toMatchObject({ promotionApplied: false, correctedV266Applied: false, v265DownloadResumed: false });
    }
  });

  it("records resource-blocked heavy gates without claiming qualification", () => {
    const pointer = readJson<ShadowPointer>("dist/release/orbit-atlas-current-local-shadow-candidate-v270.json");
    expect(pointer.resourcePreflight.heavyGateAllowed).toBe(false);
    expect(pointer.status).toContain("blocked-resource-preflight");
    const v270 = readJson<PhaseEvidence>(pointer.sources.v270!.path);
    expect(v270.validation.lightweight?.status).toBe("passed-lightweight-shadow-validation");
    expect(v270.validation.build).toBe("blocked-resource-preflight");
    expect(v270.validation.browserMatrix).toBe("blocked-resource-preflight");
    expect(v270.qualificationApplied).toBe(false);
  });
});

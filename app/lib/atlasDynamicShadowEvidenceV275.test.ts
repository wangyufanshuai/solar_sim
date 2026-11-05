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
const readJson = <T = Record<string, unknown>>(path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
const fileSha = (path: string) => sha256(readFileSync(resolve(process.cwd(), path)));

type Pointer = {
  pointerSha256: string;
  formalProductPointer: string;
  formalProductPointerAdvanced: boolean;
  promotionApplied: boolean;
  localShadowVisualDefaultApplied: boolean;
  sources: Record<string, { path: string; sha256: string }>;
  capabilities: Record<string, { state: "qualified" | "implemented-awaiting-browser-qualification" | "blocked" | "incomplete"; reason: string }>;
  diagnosticBrowserMatrix: {
    diagnosticStatus: string;
    formalQualificationApplied: boolean;
    path: string;
    sha256: string;
    aggregate: Record<string, number>;
  };
  resourcePreflight: { heavyGateAllowed: boolean };
  science: Record<string, unknown>;
  contracts: Record<string, unknown>;
};

describe("v271-v275 capability-level local shadow evidence", () => {
  it("retains v263 and binds five independently classified capability documents", () => {
    const pointer = readJson<Pointer>("dist/release/orbit-atlas-current-local-shadow-candidate-v275.json");
    const unsigned: Partial<Pointer> = { ...pointer };
    delete unsigned.pointerSha256;
    expect(pointer.pointerSha256).toBe(sha256(JSON.stringify(canonicalize(unsigned))));
    expect(pointer.formalProductPointer).toBe("dist/release/orbit-atlas-current-product-evidence-v263.json");
    expect(pointer.formalProductPointerAdvanced).toBe(false);
    expect(pointer.promotionApplied).toBe(false);
    expect(pointer.localShadowVisualDefaultApplied).toBe(false);
    expect(Object.keys(pointer.sources)).toEqual(["v271", "v272", "v273", "v274", "v275"]);
    expect(pointer.capabilities).toMatchObject({
      v271: { state: "implemented-awaiting-browser-qualification" },
      v272: { state: "implemented-awaiting-browser-qualification" },
      v273: { state: "implemented-awaiting-browser-qualification" },
      v274: { state: "implemented-awaiting-browser-qualification" },
      v275: { state: "blocked" },
    });
    expect(pointer.diagnosticBrowserMatrix).toMatchObject({
      diagnosticStatus: "passed-low-memory-diagnostic-browser-matrix-nonqualifying",
      formalQualificationApplied: false,
      aggregate: {
        expected: 3,
        skipped: 0,
        unexpected: 0,
        flaky: 0,
        consoleErrors: 0,
        pageErrors: 0,
        missingResources: 0,
        rendererFaults: 0,
      },
    });
    expect(fileSha(pointer.diagnosticBrowserMatrix.path)).toBe(pointer.diagnosticBrowserMatrix.sha256);
    for (const source of Object.values(pointer.sources)) {
      expect(fileSha(source.path)).toBe(source.sha256);
      const evidence = readJson<Record<string, unknown>>(source.path);
      const evidenceSha256 = String(evidence.evidenceSha256);
      delete evidence.evidenceSha256;
      expect(evidenceSha256).toBe(sha256(JSON.stringify(canonicalize(evidence))));
      expect(evidence.qualificationApplied).toBe(false);
    }
  });

  it("records the exact science and legacy contract freeze while heavy gates remain blocked", () => {
    const pointer = readJson<Pointer>("dist/release/orbit-atlas-current-local-shadow-candidate-v275.json");
    expect(pointer.resourcePreflight.heavyGateAllowed).toBe(false);
    expect(pointer.science).toMatchObject({
      status: "science-failed-shadow-retained",
      defaultKernel: "legacy-eih-1pn",
      codeSha256: "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8",
      screenSha256: "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037",
      workerPhysicsMutation: "not-applied",
      eihOnePnMutation: "not-applied",
      kerrMutation: "not-applied",
    });
    expect(pointer.contracts).toMatchObject({
      legacyRootAttributes: 603,
      evidenceLedgerClaims: 84,
      singleCanvas: true,
      sceneRevisionSemanticsChanged: false,
    });
  });
});

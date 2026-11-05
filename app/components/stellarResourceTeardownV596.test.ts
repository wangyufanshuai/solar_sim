import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Children, isValidElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { acquireAtlasResource, getAtlasResourceSnapshot, listAtlasRuntimeResources } from "../lib/atlasResourceLifecycle";
import { createFloatingOrigin } from "../lib/floatingOrigin";
import ConstellationLines from "./ConstellationLines";

const lifecycle = vi.hoisted(() => ({ effects: [] as Array<() => void | (() => void)> }));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useMemo: (factory: () => unknown) => factory(),
  useRef: (initial: unknown) => ({ current: initial }),
  useState: (initial: unknown) => [typeof initial === "function" ? initial() : initial, vi.fn()],
  useEffect: (effect: () => void | (() => void)) => { lifecycle.effects.push(effect); },
}));
vi.mock("@react-three/fiber", () => ({
  useFrame: vi.fn(),
  useThree: (selector: (state: { size: { width: number; height: number } }) => unknown) =>
    selector({ size: { width: 1280, height: 720 } }),
}));

const pendingCleanup: Array<() => void> = [];
afterEach(() => {
  for (const cleanup of pendingCleanup.splice(0).reverse()) cleanup();
  lifecycle.effects.length = 0;
  vi.restoreAllMocks();
});

/** Execute production effect setup/cleanup with real Three resources; no renderer is claimed. */
function mountConstellation(selectedCatalogId = "constellation:Ori") {
  lifecycle.effects.length = 0;
  const output = ConstellationLines({
    floatingOriginRef: { current: createFloatingOrigin() }, selectedCatalogId, asterismEnabled: false,
  });
  const cleanups = lifecycle.effects.splice(0).map((effect) => effect())
    .filter((cleanup): cleanup is () => void => typeof cleanup === "function");
  const cleanup = () => { for (const release of [...cleanups].reverse()) release(); };
  pendingCleanup.push(cleanup);
  return { output, cleanup };
}

type TeardownExpectation = Readonly<{
  path: string;
  resources: readonly string[];
}>;

const EXPECTATIONS: readonly TeardownExpectation[] = [
  {
    path: "app/components/BrightStarCatalog.tsx",
    resources: ["geometry", "material"],
  },
  {
    path: "app/components/NebulaMarkers.tsx",
    resources: ["geometry", "material"],
  },
  {
    path: "app/components/StarClusterMarkers.tsx",
    resources: ["geometry", "material"],
  },
  {
    path: "app/components/BrightGalaxyMarkers.tsx",
    resources: ["geometry", "material"],
  },
  {
    path: "app/components/PulsarField.tsx",
    resources: ["geometry", "material"],
  },
  {
    path: "app/components/ObservationFovOverlayV266.tsx",
    resources: ["geometry"],
  },
];

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

describe("v596 owned Atlas geometry teardown", () => {
  it("retains the direct-effect cleanup wiring on unchanged catalog renderers", () => {
    for (const expectation of EXPECTATIONS) {
      const text = compact(source(expectation.path));
      expect(text, expectation.path).toContain("useEffect");
      for (const resource of expectation.resources) {
        expect(
          text,
          `${expectation.path} must dispose ${resource} from an effect cleanup`,
        ).toMatch(
          new RegExp(
            `useEffect\\(\\(\\) => \\(\\) => (?:\\{[^}]*${resource}\\.dispose\\(\\)[^}]*\\}|${resource}\\.dispose\\(\\))`,
          ),
        );
      }
    }
  });

  it("disposes all twelve actual constellation resources once and restores the ledger", () => {
    const before = getAtlasResourceSnapshot();
    const geometryDispose = vi.spyOn(THREE.BufferGeometry.prototype, "dispose");
    const materialDispose = vi.spyOn(THREE.Material.prototype, "dispose");
    const mounted = mountConstellation();
    const owned = listAtlasRuntimeResources().filter((entry) => entry.owner === "mainline-a-constellation-lines");
    expect(getAtlasResourceSnapshot().models - before.models).toBe(12);
    expect(owned).toHaveLength(12);
    expect(new Set(owned.map((entry) => entry.label)).size).toBe(12);
    expect(owned.map((entry) => entry.label)).toEqual(expect.arrayContaining([
      "constellation-figures-geometry", "constellation-boundaries-geometry", "constellation-asterisms-geometry",
      "constellation-nodes-geometry", "constellation-selected:Ori:geometry", "constellation-selected:Ori:nodes-geometry",
      "constellation-figures-material", "constellation-boundaries-material", "constellation-asterisms-material",
      "constellation-nodes-material", "constellation-selected-material", "constellation-selected-nodes-material",
    ]));
    const nodes = Children.toArray(mounted.output.props.children);
    expect(nodes).toHaveLength(6);
    for (const node of nodes) {
      expect(isValidElement<{ dispose?: unknown }>(node) && node.props.dispose === null).toBe(true);
    }
    mounted.cleanup();
    mounted.cleanup();
    expect(geometryDispose).toHaveBeenCalledTimes(6);
    expect(materialDispose).toHaveBeenCalledTimes(6);
    expect(new Set(geometryDispose.mock.contexts).size).toBe(6);
    expect(new Set(materialDispose.mock.contexts).size).toBe(6);
    expect(getAtlasResourceSnapshot().byIdentity).toEqual(before.byIdentity);
  });

  it("keeps a newer constellation instance and unrelated resources alive during stale cleanup", () => {
    const before = getAtlasResourceSnapshot();
    const unrelated = acquireAtlasResource("model", "atlas", "unrelated-teardown-test", { owner: "other-owner" });
    pendingCleanup.push(unrelated);
    const first = mountConstellation("constellation:Ori");
    const second = mountConstellation("constellation:Cyg");
    expect(getAtlasResourceSnapshot().models - before.models).toBe(25);
    first.cleanup();
    first.cleanup();
    expect(getAtlasResourceSnapshot().models - before.models).toBe(13);
    const remaining = listAtlasRuntimeResources();
    expect(remaining.some((entry) => entry.label === "constellation-selected:Ori:geometry")).toBe(false);
    expect(remaining.some((entry) => entry.label === "constellation-selected:Cyg:geometry")).toBe(true);
    expect(remaining.some((entry) => entry.owner === "other-owner")).toBe(true);
    second.cleanup();
    expect(getAtlasResourceSnapshot().models - before.models).toBe(1);
    unrelated();
    expect(getAtlasResourceSnapshot().byIdentity).toEqual(before.byIdentity);
  });

  it("does not replace the intentionally shared sprite/instance geometry", () => {
    const overlay = source("app/components/ObservationFovOverlayV266.tsx");
    const starCatalog = source("app/components/BrightStarCatalog.tsx");
    expect(compact(overlay)).toContain(
      "useEffect(() => () => geometry.dispose(), [geometry]);",
    );
    expect(compact(starCatalog)).toContain(
      "useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);",
    );
  });
});

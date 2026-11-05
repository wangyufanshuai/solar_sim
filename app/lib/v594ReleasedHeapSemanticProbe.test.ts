import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  V594_RELEASED_HEAP_PROTOTYPE_KINDS,
  V594_RELEASED_HEAP_PROTOTYPE_REGISTRY_VERSION,
  V594_RELEASED_HEAP_QUERY,
} from "./v594ReleasedHeapSemanticProbe";

describe("v594 released heap semantic probe source boundary", () => {
  it("keeps the probe query-gated and prototype-only", () => {
    expect(V594_RELEASED_HEAP_QUERY).toBe("v594ReleasedHeap");
    expect(V594_RELEASED_HEAP_PROTOTYPE_REGISTRY_VERSION)
      .toBe("v594-released-heap-prototype-registry-v1");
    expect(V594_RELEASED_HEAP_PROTOTYPE_KINDS).toEqual([
      "renderer",
      "scene",
      "scene-object",
      "geometry",
      "material",
      "texture",
    ]);
    const source = readFileSync(
      resolve(process.cwd(), "app/lib/v594ReleasedHeapSemanticProbe.ts"),
      "utf8",
    );
    expect(source).toContain("Runtime.queryObjects");
    expect(source).toContain("Registers prototypes only");
    expect(source).not.toContain("new WeakRef");
  });
});


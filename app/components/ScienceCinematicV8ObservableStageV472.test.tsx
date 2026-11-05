import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  ATLAS_V8_TOKEN_CONSUMER_BINDINGS_V472,
  ATLAS_V8_TOKEN_PATHS_V472,
} from "../lib/atlasScienceCinematicV8V472";

describe("v472 V8 observable stage", () => {
  it("really consumes every declared token and consumer", () => {
    const source = readFileSync(
      "app/components/ScienceCinematicV8ObservableStageV472.tsx",
      "utf8",
    );

    for (const tokenPath of ATLAS_V8_TOKEN_PATHS_V472) {
      expect(source).toContain("tokens." + tokenPath);
    }
    for (const consumer of new Set(
      ATLAS_V8_TOKEN_CONSUMER_BINDINGS_V472.map((entry) => entry.consumerId),
    )) {
      expect(source).toContain(consumer);
    }
    expect(source).toContain('data-atlas-v472-scientific-field-mutation="false"');
    expect(source).toContain('data-atlas-v472-default-applied="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });

  it("keeps V8 local-shadow-only and the science fields read-only", () => {
    const source = readFileSync(
      "app/components/ScienceCinematicV8ObservableStageV472.tsx",
      "utf8",
    );
    const page = readFileSync("app/local-shadow-v472/page.tsx", "utf8");

    expect(source).toContain("同一组观测量，两种光线；科学字段只有一份");
    expect(source).toContain("redshift、EVPA 与 intensity 永远只读");
    expect(page).toContain('process.env.NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(page).toContain("电影效果不接触科学字段");
    expect(source).not.toMatch(/\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/);
  });
});

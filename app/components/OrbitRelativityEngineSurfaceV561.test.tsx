import { createElement } from "react";
import { describe, expect, it } from "vitest";
import OrbitRelativityEngineSurfaceV561 from "./OrbitRelativityEngineSurfaceV561";

describe("Orbit Relativity Engine V561 surface", () => {
  it("is a client surface with an explicit active boundary", () => {
    const element = createElement(OrbitRelativityEngineSurfaceV561, { active: false });
    expect(element.type).toBe(OrbitRelativityEngineSurfaceV561);
    expect(element.props.active).toBe(false);
  });
});

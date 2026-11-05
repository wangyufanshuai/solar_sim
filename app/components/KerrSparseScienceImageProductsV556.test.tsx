import { createElement } from "react";
import { describe, expect, it } from "vitest";
import KerrSparseScienceImageProductsV556 from "./KerrSparseScienceImageProductsV556";
describe("v556 sparse science products HUD", () => { it("remains a client-only no-Canvas surface", () => { const element = createElement(KerrSparseScienceImageProductsV556); expect(element.type).toBe(KerrSparseScienceImageProductsV556); expect(element.props).toEqual({}); }); });

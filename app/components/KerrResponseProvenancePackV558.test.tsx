import { createElement } from "react";
import { describe, expect, it } from "vitest";
import KerrResponseProvenancePackV558 from "./KerrResponseProvenancePackV558";
describe("v558 response provenance HUD", () => { it("remains client-only and canvas-free", () => { const element = createElement(KerrResponseProvenancePackV558); expect(element.type).toBe(KerrResponseProvenancePackV558); expect(element.props).toEqual({}); }); });

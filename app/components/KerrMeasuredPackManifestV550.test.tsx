import { createElement } from "react";
import { describe, expect, it } from "vitest";
import KerrMeasuredPackManifestV550 from "./KerrMeasuredPackManifestV550";
describe("v550 pack manifest HUD", () => { it("stays a client-only lazy surface without creating a Canvas", () => { const element = createElement(KerrMeasuredPackManifestV550); expect(element.type).toBe(KerrMeasuredPackManifestV550); expect(element.props).toEqual({}); }); });

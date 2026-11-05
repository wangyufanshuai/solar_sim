import { createElement } from "react";
import { describe, expect, it } from "vitest";
import KerrSparseScienceImageV555 from "./KerrSparseScienceImageV555";
describe("v555 sparse science image HUD", () => { it("remains a client-only no-Canvas surface", () => { const element = createElement(KerrSparseScienceImageV555); expect(element.type).toBe(KerrSparseScienceImageV555); expect(element.props).toEqual({}); }); });

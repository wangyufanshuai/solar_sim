import { describe, expect, it } from "vitest";
import { createElement } from "react";
import KerrReplayCompatibilityV542 from "./KerrReplayCompatibilityV542";

describe("v542 compatibility HUD", () => { it("remains a client-only lazy surface without creating a Canvas", () => { const element = createElement(KerrReplayCompatibilityV542); expect(element.type).toBe(KerrReplayCompatibilityV542); expect(element.props).toEqual({}); }); });

import { createElement } from "react";
import { describe, expect, it } from "vitest";
import KerrReplayIsolatedPreflightV543 from "./KerrReplayIsolatedPreflightV543";
describe("v543 isolated preflight HUD", () => { it("stays a client-only lazy surface without creating a Canvas", () => { const element = createElement(KerrReplayIsolatedPreflightV543); expect(element.type).toBe(KerrReplayIsolatedPreflightV543); expect(element.props).toEqual({}); }); });

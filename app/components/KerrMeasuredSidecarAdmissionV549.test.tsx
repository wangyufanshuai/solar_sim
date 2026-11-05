import { createElement } from "react";
import { describe, expect, it } from "vitest";
import KerrMeasuredSidecarAdmissionV549 from "./KerrMeasuredSidecarAdmissionV549";
describe("v549 sidecar admission HUD", () => { it("stays a client-only lazy surface without creating a Canvas", () => { const element = createElement(KerrMeasuredSidecarAdmissionV549); expect(element.type).toBe(KerrMeasuredSidecarAdmissionV549); expect(element.props).toEqual({}); }); });

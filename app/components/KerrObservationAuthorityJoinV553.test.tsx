import { createElement } from "react";
import { describe, expect, it } from "vitest";
import KerrObservationAuthorityJoinV553 from "./KerrObservationAuthorityJoinV553";
describe("v553 observation authority join HUD", () => { it("is client-only and does not create a Canvas", () => { const element = createElement(KerrObservationAuthorityJoinV553); expect(element.type).toBe(KerrObservationAuthorityJoinV553); expect(element.props).toEqual({}); }); });

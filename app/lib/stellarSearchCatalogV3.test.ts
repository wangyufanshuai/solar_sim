import { describe, expect, it } from "vitest";
import { stellarPrefix } from "./stellarSearchCatalogV3";
describe("stellar catalog v3",()=>{it("routes names and catalog ids",()=>{expect(stellarPrefix("Sirius")).toBe("s");expect(stellarPrefix("HD 209458")).toBe("h");expect(stellarPrefix("织女星")).toBe("unicode");});});

import { describe, expect, it } from "vitest";
import { parseOpenRocketDesignXml } from "./openRocketReplay";

describe("OpenRocket replay manifest", () => {
  it("parses structured OpenRocket XML stages and components", () => {
    const design = parseOpenRocketDesignXml(`<openrocket><rocket><name>LEO Test</name><subcomponents><stage><name>Booster</name><bodytube/><nosecone/></stage><stage><name>Upper</name><bodytube/></stage></subcomponents></rocket></openrocket>`);
    expect(design.name).toBe("LEO Test");
    expect(design.stages.map((stage) => stage.name)).toEqual(["Booster", "Upper"]);
    expect(design.stages[0]?.componentCount).toBe(2);
  });
});

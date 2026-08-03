import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import IxpeMeasuredIntakeSurfaceV562 from "./IxpeMeasuredIntakeSurfaceV562";

describe("IXPE intake surface v562", () => {
  it("declares a local-shadow measured-authority boundary", () => {
    const html = renderToStaticMarkup(<IxpeMeasuredIntakeSurfaceV562 />);
    expect(html).toContain("data-atlas-ixpe-intake-v562");
    expect(html).toContain("explicit HEASARC acquisition required");
  });
});

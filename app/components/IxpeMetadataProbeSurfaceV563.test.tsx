import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import IxpeMetadataProbeSurfaceV563 from "./IxpeMetadataProbeSurfaceV563";

describe("IXPE metadata surface v563", () => {
  it("declares a HEAD-only payload boundary", () => {
    const html = renderToStaticMarkup(<IxpeMetadataProbeSurfaceV563 />);
    expect(html).toContain("data-atlas-ixpe-metadata-v563");
    expect(html).toContain("HEAD-only metadata probe");
  });
});

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL } from "../data/mainlineANebulaVisualAssetsV607.all.generated";
import MainlineANebulaPortraitV607 from "./MainlineANebulaPortraitV607";

const escapedHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("'", "&#x27;")
  .replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

describe("current web nebula portrait rights disclosure", () => {
  it("shows all twelve local previews with visible credits and pending human signoff", () => {
    for (const asset of MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL) {
      const html = renderToStaticMarkup(createElement(MainlineANebulaPortraitV607,
        { objectId: asset.objectId, title: asset.objectId }));
      expect(html).toContain(`data-mainline-a-nebula-portrait="${asset.objectId}"`);
      expect(html).toContain('data-mainline-a-nebula-preview="candidate-only"');
      expect(html).toContain('data-mainline-a-human-rights-signoff="pending"');
      expect(html).toContain('data-mainline-a-rights-badge="pending-human-signoff"');
      expect(html).toContain(escapedHtml(asset.credit));
      expect(html).toContain(escapedHtml(asset.sourcePage));
      expect(html).not.toContain('data-mainline-a-rights-badge="CC BY 4.0"');
    }
  });

  it("falls back to a directory marker when an object has no canonical candidate preview", () => {
    const html = renderToStaticMarkup(createElement(MainlineANebulaPortraitV607,
      { objectId: "unreviewed-nebula", title: "Unreviewed" }));
    expect(html).toContain('data-mainline-a-nebula-preview="marker-only"');
    expect(html).toContain('data-mainline-a-human-rights-signoff="pending"');
    expect(html).not.toContain("<img");
    expect(html).not.toContain('data-mainline-a-rights-badge="CC BY 4.0"');
  });
});

import { describe, expect, it } from "vitest";
import { isReviewSelectionVisibleV664, reviewNavigationV664,
  stepReviewNavigationV664 } from "./mainlineAReviewNavigationV664";

describe("R77 mobile review navigation", () => {
  const keys = ["star:acrux", "star:spica", "nebula:ring"];

  it("keeps stable order and exposes one selected detail", () => {
    const view = reviewNavigationV664(keys, "star:spica");
    expect(view).toMatchObject({
      currentKey: "star:spica", index: 1, total: 3,
      previousKey: "star:acrux", nextKey: "nebula:ring",
      canGoPrevious: true, canGoNext: true, hasSelection: true,
    });
    expect(view.announcement).toBe("第 2 项，共 3 项");
  });

  it("fails closed to an empty list after filtering", () => {
    expect(reviewNavigationV664([], "star:spica")).toMatchObject({
      currentKey: null, index: -1, total: 0,
      hasSelection: false, announcement: "当前筛选没有对象",
    });
    expect(stepReviewNavigationV664([], "star:spica", "next"))
      .toBeNull();
    expect(isReviewSelectionVisibleV664([], "star:spica"))
      .toBe(false);
  });

  it("chooses the first visible item when a filter removes the old one", () => {
    const next = reviewNavigationV664(["nebula:ring"],
      "star:spica");
    expect(next.currentKey).toBe("nebula:ring");
    expect(next.index).toBe(0);
    expect(next.canGoPrevious).toBe(false);
    expect(next.canGoNext).toBe(false);
    expect(isReviewSelectionVisibleV664(["nebula:ring"],
      "star:spica")).toBe(false);
  });

  it("steps without wrapping or inventing a replacement target", () => {
    expect(stepReviewNavigationV664(keys, keys[0], "previous"))
      .toBe(keys[0]);
    expect(stepReviewNavigationV664(keys, keys[0], "next"))
      .toBe(keys[1]);
    expect(stepReviewNavigationV664(keys, keys[2], "next"))
      .toBe(keys[2]);
    expect(stepReviewNavigationV664(keys, "missing", "last"))
      .toBe(keys[2]);
    expect(stepReviewNavigationV664(keys, "missing", "first"))
      .toBe(keys[0]);
  });

  it("removes duplicate keys before counting or stepping", () => {
    const repeated = ["a", "a", "b", "b", "c"];
    expect(reviewNavigationV664(repeated, "b").total).toBe(3);
    expect(stepReviewNavigationV664(repeated, "b", "next"))
      .toBe("c");
  });
});

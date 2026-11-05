import { Children, createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CelestialObjectPassportPanel from "./CelestialObjectPassportPanel";
import { createCelestialObjectPassport } from "../lib/celestialCatalog";
import { MAINLINE_A_CURRENT_STARS } from "../data/mainlineAMetadataV607";
import { getMainlineA1CatalogId } from "../data/mainlineARegistryV607";
import { initialPassportPresentationM1, reducePassportPresentationM1, type PassportPresentationActionM1, type PassportPresentationM1 } from "../lib/mainlineAPassportPresentationM1";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { resolveMainlineAStellarPresentationM2 } from "../lib/mainlineAStellarPresentationM2";

const hooks = vi.hoisted(() => ({ state: null as PassportPresentationM1 | null }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useReducer: (reducer: typeof reducePassportPresentationM1, initial: PassportPresentationM1) => {
    hooks.state ??= initial;
    return [hooks.state, (action: PassportPresentationActionM1) => { hooks.state = reducer(hooks.state!, action); }];
  },
}));

type ElementProps = { children?: ReactNode; onClick?: () => void; onKeyDown?: (event: unknown) => void; "aria-label"?: string; "aria-expanded"?: boolean; className?: string; };
function find(tree: ReactNode, predicate: (node: ReactElement<ElementProps>) => boolean): ReactElement<ElementProps> | undefined {
  for (const child of Children.toArray(tree)) {
    if (!isValidElement<ElementProps>(child)) continue;
    if (predicate(child)) return child;
    const nested = find(child.props.children, predicate); if (nested) return nested;
  }
  return undefined;
}
function textOf(node: ReactNode): string {
  return Children.toArray(node).map((child) => isValidElement<ElementProps>(child) ? textOf(child.props.children) : String(child)).join("");
}
function render(id: string, mobile = false) {
  const passport = createCelestialObjectPassport(id);
  expect(passport).not.toBeNull();
  hooks.state ??= initialPassportPresentationM1(passport!.objectId, mobile);
  const onClose = vi.fn(); const onExitFocus = vi.fn();
  let tree: ReactNode;
  function Harness() { tree = CelestialObjectPassportPanel({ passport, onClose, onExitFocus }); return tree; }
  const html = renderToStaticMarkup(createElement(Harness));
  const button = (label: string) => {
    const result = find(tree, (node) => node.type === "button" && (node.props["aria-label"] === label || textOf(node.props.children).includes(label)));
    expect(result, label).toBeDefined(); return result!;
  };
  return { html, tree, button, onClose, onExitFocus };
}

beforeEach(() => { hooks.state = null; });

describe("M1 single-stage passport", () => {
  it.each([
    ["nearby-star:alpha-centauri", "data-mainline-a-stellar-portrait", "参数化示意"],
    ["constellation:Ori", "data-mainline-a-star-chart", "星座图示"],
    ["nebula:m42", "data-mainline-a-nebula-portrait", "候选观测影像"],
  ])("keeps %s facts and sources without mounting a second hero", (id, portrait, boundary) => {
    const test = render(id);
    expect(test.html).toContain('data-mainline-a-passport-state="half"');
    expect(test.html).toContain('data-mainline-a-passport-art-expanded="false"');
    expect(test.html).not.toContain(portrait);
    expect(test.html).toContain(boundary);
    expect(test.html).toContain('data-mainline-a-passport-sources="true"');
    expect(test.html).toContain('data-mainline-a-source=');
    expect(test.html).not.toMatch(/<details[^>]*\sopen(?:=|>)/);
    expect(test.button("查看图鉴 / 比较").props["aria-expanded"]).toBe(false);
  });

  it("opens the original evidence and photosphere for every current star through its visible comparison button", () => {
    for (const star of MAINLINE_A_CURRENT_STARS) {
      hooks.state = null;
      const id = getMainlineA1CatalogId(star.id)!;
      render(id).button("查看图鉴 / 比较").props.onClick?.();
      const expanded = render(id);
      expect(expanded.html, star.id).toContain(`data-mainline-a-stellar-portrait="${star.id}"`);
      const model = resolveMainlineAStellarPresentationM2(star.id);
      const displayedRatio = model?.appearance.axisRatio ?? Math.max(1, star.artDirection.equatorialPolarRadiusRatio);
      expect(expanded.html).toContain(`data-mainline-a-photosphere-ratio="${displayedRatio}"`);
      expect(expanded.html).toContain(`目录色温 ${star.artDirection.colorTemperatureK.toLocaleString("zh-CN")} K`);
      expect(expanded.html).toContain(`光度 ${star.artDirection.luminositySolar.toLocaleString("zh-CN")} L☉`);
      expect(expanded.html).toContain(`半径 ${star.artDirection.radiusSolar.toLocaleString("zh-CN")} R☉`);
      if (model) {
        expect(expanded.html).toContain(`data-mainline-a-stellar-presentation-sha256="${model.appearance.signatureSha256}"`);
      } else {
        expect(expanded.html).not.toContain('data-mainline-a-stellar-presentation-id="m2-shared-v596"');
      }
      expect(expanded.html).toContain('data-mainline-a-stellar-uncertainty="true"');
      expect(expanded.html).toContain('data-mainline-a-stellar-fact-layers="true"');
      expect(expanded.html).toContain("不按真实半径、距离或视亮度缩放");
      expanded.button("收起图鉴，继续看场景").props.onClick?.();
      expect(render(id).html).not.toContain('data-mainline-a-stellar-portrait=');
    }
  });

  it("uses real buttons for mobile collapsed, half and details without changing runtime selection", () => {
    const before = atlasRuntimeStore.getSnapshot();
    let test = render("nebula:m42", true);
    expect(test.html).toContain('data-mainline-a-passport-state="collapsed"');
    expect(test.html).toContain('id="atlas-celestial-object-passport-content" hidden=""');
    expect(test.html).toContain("候选观测影像 · 版权待签");
    test.button("查看摘要").props.onClick?.(); test = render("nebula:m42", true);
    expect(test.html).toContain('data-mainline-a-passport-state="half"');
    test.button("查看详情").props.onClick?.(); test = render("nebula:m42", true);
    expect(test.html).toContain('data-mainline-a-passport-state="details"');
    test.button("收起详情查看场景").props.onClick?.(); test = render("nebula:m42", true);
    expect(test.html).toContain('data-mainline-a-passport-state="collapsed"');
    expect(atlasRuntimeStore.getSnapshot()).toBe(before);
  });

  it("resets media and tab state immediately for a new selection", () => {
    render("nebula:m42", true).button("查看摘要").props.onClick?.();
    render("nebula:m42", true).button("查看图鉴 / 比较").props.onClick?.();
    const next = render("constellation:Ori", true);
    expect(next.html).toContain('data-mainline-a-passport-state="collapsed"');
    expect(next.html).toContain('data-mainline-a-passport-art-expanded="false"');
    expect(next.html).not.toContain('data-mainline-a-star-chart=');
  });

  it("steps back on Escape within details, then leaves collapsed Escape for the existing coordinator", () => {
    render("nebula:m42", true).button("查看摘要").props.onClick?.();
    render("nebula:m42", true).button("查看详情").props.onClick?.();
    const key = () => {
      const event = { key: "Escape", nativeEvent: { isComposing: false }, defaultPrevented: false, preventDefault: vi.fn(), stopPropagation: vi.fn() };
      const test = render("nebula:m42", true);
      find(test.tree, (node) => node.type === "aside")?.props.onKeyDown?.(event);
      return event;
    };
    expect(key().preventDefault).toHaveBeenCalledOnce();
    expect(hooks.state?.sheet).toBe("half");
    expect(key().stopPropagation).toHaveBeenCalledOnce();
    expect(hooks.state?.sheet).toBe("collapsed");
    expect(key().preventDefault).not.toHaveBeenCalled();
  });

  it("keeps close and exit-focus as distinct callbacks", () => {
    const test = render("nebula:m42");
    test.button("关闭天体档案").props.onClick?.();
    expect(test.onClose).toHaveBeenCalledOnce(); expect(test.onExitFocus).not.toHaveBeenCalled();
    test.button("退出聚焦").props.onClick?.(); expect(test.onExitFocus).toHaveBeenCalledOnce();
  });
});

describe("M1 responsive state boundaries", () => {
  it("collapses on entering mobile and clears the large comparison view", () => {
    let state = initialPassportPresentationM1("nebula:m42", false);
    state = reducePassportPresentationM1(state, { type: "art", expanded: true });
    state = reducePassportPresentationM1(state, { type: "viewport", mobile: true });
    expect(state).toMatchObject({ sheet: "collapsed", artExpanded: false, view: "portrait" });
    state = reducePassportPresentationM1(state, { type: "viewport", mobile: false });
    expect(state.sheet).toBe("half");
  });
});

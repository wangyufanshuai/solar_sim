import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS } from "../data/mainlineANebulaVisualAssetsV607.generated";
import MainlineANebulaViewerM3 from "./MainlineANebulaViewerM3";

const fixture = vi.hoisted(() => ({ tree: null as ReactNode, destination: null as unknown }));
vi.mock("react-dom", async (original) => ({
  ...await original<typeof import("react-dom")>(),
  createPortal: (tree: ReactNode, destination: unknown) => { fixture.tree = tree; fixture.destination = destination; return tree; },
}));

type Props = { children?: ReactNode; onKeyDown?: (event: unknown) => void; onCancel?: (event: unknown) => void; onClick?: () => void; "aria-label"?: string };
function elements(node: ReactNode): ReactElement<Props>[] {
  return Children.toArray(node).flatMap((child) => isValidElement<Props>(child)
    ? [child, ...elements(child.props.children)] : []);
}

beforeEach(() => { fixture.tree = null; fixture.destination = null; vi.stubGlobal("document", { body: {} }); });
afterEach(() => vi.unstubAllGlobals());

function render() {
  const asset = MAINLINE_A3_NEBULA_VISUAL_ASSETS[0];
  const image = { naturalWidth: asset.dimensions.width, naturalHeight: asset.dimensions.height } as HTMLImageElement;
  const onClose = vi.fn();
  const html = renderToStaticMarkup(<MainlineANebulaViewerM3 asset={asset} title="M42" image={image} onClose={onClose} />);
  return { html, onClose, asset, nodes: elements(fixture.tree) };
}

describe("M3 native observation viewer controls", () => {
  it("opens at the complete composition and preserves source, credit, bands and pending rights", () => {
    const { html, asset } = render();
    expect(fixture.destination).toBe(document.body);
    expect(html).toContain('data-mainline-a-nebula-viewer="m42"');
    expect(html).toContain('data-mainline-a-nebula-viewer-zoom="1"');
    expect(html).toContain(`data-image-sha256="${asset.sha256}"`);
    expect(html).toContain(`href="${asset.sourcePage}"`);
    expect(html).toContain(asset.credit.replaceAll("'", "&#x27;"));
    expect(html).toContain(asset.bands.join(" · "));
    expect(html).toContain("逐图版权签署仍待完成");
    expect(html).toContain("完整构图 · 等比适配");
    expect(html).toContain("2× 局部");
    expect(html).toContain("4× 局部");
    expect(html).toContain("恢复全图");
    expect(html).not.toMatch(/<img|<canvas/);
    expect(html).toContain("二维观测合成图不表示三维深度");
  });

  it("handles one Escape inside the viewer before the atlas receives the same key", () => {
    const { nodes, onClose } = render();
    const dialog = nodes.find((node) => node.type === "dialog")!;
    const event = { key: "Escape", nativeEvent: { isComposing: false }, preventDefault: vi.fn(), stopPropagation: vi.fn() };
    dialog.props.onKeyDown?.(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(event.stopPropagation).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps composing Escape inside the viewer without closing it", () => {
    const { nodes, onClose } = render();
    const event = { key: "Escape", nativeEvent: { isComposing: true }, preventDefault: vi.fn(), stopPropagation: vi.fn() };
    nodes.find((node) => node.type === "dialog")?.props.onKeyDown?.(event);
    expect(onClose).not.toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalledOnce();
  });

  it("has separate accessible close and native cancel paths", () => {
    const { nodes, onClose } = render();
    nodes.find((node) => node.props["aria-label"] === "关闭观测图放大")?.props.onClick?.();
    expect(onClose).toHaveBeenCalledOnce();
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
    nodes.find((node) => node.type === "dialog")?.props.onCancel?.(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(event.stopPropagation).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

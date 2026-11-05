import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import PostV593RelativityWorkbenchPanel, {
  RelativityWorkbenchLauncherV638,
  relativityWorkbenchLauncherLayoutV638,
} from "./PostV593RelativityWorkbenchPanel";

describe("post-v593 main-route relativity workbench", () => {
  it("exposes the sealed full-trajectory evidence without promoting the shadow kernel", () => {
    const html = renderToStaticMarkup(
      <PostV593RelativityWorkbenchPanel
        mode="validation"
        defaultExpanded
        onModeChange={() => undefined}
        onOpenValidation={() => undefined}
      />,
    );

    expect(html).toContain('data-post-v593-relativity-authority="shadow-only"');
    expect(html).toContain('data-post-v593-relativity-default-kernel="legacy-eih-1pn"');
    expect(html).toContain('data-post-v593-relativity-live-state-mutated="false"');
    expect(html).toContain('data-post-v593-relativity-trajectory-status="qualified"');
    expect(html).toContain('data-post-v593-relativity-promotion-applied="false"');
    expect(html).toContain("instantaneous + sealed trajectory");
    expect(html).toContain("RK4 observed order");
    expect(html).toContain("full trajectory round trip");
    expect(html).toContain("trajectory effect isolation");
    expect(html).toContain("631443a8dcd6…");
    expect(html).toContain("promotion blocked");
    expect(html).toContain('data-v595-timelike-kerr-reference="reference-candidate"');
    expect(html).toContain('data-v595-timelike-kerr-formal-evidence="false"');
    expect(html).toContain('data-v595-timelike-kerr-promotion="none"');
    expect(html).toContain('data-v595-timelike-kerr-fixture-count="4"');
    expect(html).toContain('data-v595-timelike-kerr-anchor-count="3"');
    expect(html).toContain('data-v595-timelike-kerr-fixture="bound"');
    expect(html).toContain('data-v595-timelike-kerr-fixture="capture"');
    expect(html).toContain('data-v595-timelike-kerr-fixture="scatter"');
    expect(html).toContain('data-v595-timelike-kerr-fixture="escape"');
    expect(html).toContain("3D timelike Kerr reference");
    expect(html).toContain("dynamic θ / pθ");
    expect(html).toContain("independent RK45");
    expect(html).toContain("analytic anchors");
    expect(html).toContain("formal evidence false");
  });

  it("keeps only the accessible launcher mounted until the user opens the workbench", () => {
    const html = renderToStaticMarkup(<PostV593RelativityWorkbenchPanel mode="cinematic"
      onModeChange={() => undefined} onOpenValidation={() => undefined} />);
    expect(html).toContain('aria-label="打开相对论工作台"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('data-mainline-a-relativity-expanded="true"');
    expect(html).toContain('data-post-v593-relativity-live-state-mutated="false"');
  });

  it("does not mount the obstructing content while the object browser owns the workspace", () => {
    const html = renderToStaticMarkup(<PostV593RelativityWorkbenchPanel mode="validation"
      defaultExpanded objectBrowserOpen onModeChange={() => undefined} onOpenValidation={() => undefined} />);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('id="mainline-a-relativity-workbench-content"');
    expect(html).toContain('aria-label="打开相对论工作台"');
  });

  it("closes object browsing before opening controls, and closing controls does not request another workspace", () => {
    const actions: string[] = [];
    const open = RelativityWorkbenchLauncherV638({ expanded: false, objectBrowserOpen: true,
      onRequestOpen: () => actions.push("close-object-browser"),
      onExpandedChange: (value) => actions.push(value ? "expand-workbench" : "collapse-workbench") });
    open.props.onClick();
    expect(actions).toEqual(["close-object-browser", "expand-workbench"]);
    const requestOpen = vi.fn();
    const change = vi.fn();
    const close = RelativityWorkbenchLauncherV638({ expanded: true, objectBrowserOpen: false,
      onRequestOpen: requestOpen, onExpandedChange: change });
    close.props.onClick();
    expect(change).toHaveBeenCalledExactlyOnceWith(false);
    expect(requestOpen).not.toHaveBeenCalled();
    expect(open.props.type).toBe("button");
    expect(close.props["aria-expanded"]).toBe(true);
  });

  it("puts the launcher in the free header slot, outside the observed search row and nebula caption", () => {
    const headerBottom = 114;
    const bounds = relativityWorkbenchLauncherLayoutV638(true);
    const launcher = { x: bounds.left, y: headerBottom + bounds.topInset, w: bounds.width, h: bounds.height };
    const intersects = (other: { x: number; y: number; w: number; h: number }) => launcher.x < other.x + other.w
      && launcher.x + launcher.w > other.x && launcher.y < other.y + other.h && launcher.y + launcher.h > other.y;
    expect(launcher.x).toBeGreaterThanOrEqual(90);
    expect(launcher.x + launcher.w).toBeLessThanOrEqual(230);
    expect(launcher.y + launcher.h).toBeLessThanOrEqual(headerBottom + 56);
    expect(intersects({ x: 12, y: 542, w: 262, h: 45 })).toBe(false);
    expect(intersects({ x: 180, y: 486, w: 510, h: 174 })).toBe(false);
    expect(intersects({ x: 12, y: headerBottom, w: 44, h: 44 })).toBe(false);
    expect(intersects({ x: 230, y: headerBottom + 6, w: 44, h: 44 })).toBe(false);
    const scene = relativityWorkbenchLauncherLayoutV638(false);
    expect(scene.left).toBeGreaterThanOrEqual(12 + 44 + 8);
    expect(scene.left + scene.width).toBeLessThan(320);
  });
});

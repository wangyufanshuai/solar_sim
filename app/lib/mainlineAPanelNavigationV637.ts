export const MAINLINE_A_PANEL_IDS_V637 = [
  "roster", "stellar-atlas", "web-sky", "nebula-atlas", "nebula-review", "hero-review", "performance",
] as const;

export type MainlineAPanelIdV637 = typeof MAINLINE_A_PANEL_IDS_V637[number];
export type MainlineAPanelCloseReasonV637 =
  | "close-button" | "escape" | "scene-focus" | "navigation" | "programmatic";
export type MainlineAPanelTransitionV637 = Readonly<{
  kind: "open" | "switch" | "close";
  from: MainlineAPanelIdV637 | null;
  to: MainlineAPanelIdV637 | null;
  reason: MainlineAPanelCloseReasonV637 | "open-button" | "switch-panel";
}>;

type NavigationBase = Readonly<{
  revision: number;
  openerKey: string | null;
  lastTransition: MainlineAPanelTransitionV637 | null;
}>;

export type MainlineAPanelNavigationStateV637 = NavigationBase & (
  | Readonly<{ phase: "closed"; activePanel: null; session: null }>
  | Readonly<{ phase: "open"; activePanel: MainlineAPanelIdV637; session: number }>
);

export type MainlineAPanelNavigationActionV637 =
  | Readonly<{ type: "open"; panel: MainlineAPanelIdV637; openerKey?: string | null }>
  | Readonly<{
    type: "close";
    reason: MainlineAPanelCloseReasonV637;
    expectedSession: number;
    expectedPanel?: MainlineAPanelIdV637;
  }>;

export function isMainlineAPanelIdV637(value: unknown): value is MainlineAPanelIdV637 {
  return typeof value === "string" && MAINLINE_A_PANEL_IDS_V637.some((id) => id === value);
}

export function createMainlineAPanelNavigationV637(): MainlineAPanelNavigationStateV637 {
  return { phase: "closed", activePanel: null, session: null, revision: 0, openerKey: null, lastTransition: null };
}

export function reduceMainlineAPanelNavigationV637(
  state: MainlineAPanelNavigationStateV637,
  action: MainlineAPanelNavigationActionV637,
): MainlineAPanelNavigationStateV637 {
  if (action.type === "open") {
    if (!isMainlineAPanelIdV637(action.panel) || state.activePanel === action.panel) return state;
    const revision = state.revision + 1;
    return {
      phase: "open",
      activePanel: action.panel,
      session: revision,
      revision,
      openerKey: action.openerKey ?? state.openerKey,
      lastTransition: {
        kind: state.phase === "open" ? "switch" : "open",
        from: state.activePanel,
        to: action.panel,
        reason: state.phase === "open" ? "switch-panel" : "open-button",
      },
    };
  }
  if (action.type !== "close" || state.phase !== "open") return state;
  if (action.expectedSession !== state.session) return state;
  if (action.expectedPanel !== undefined && action.expectedPanel !== state.activePanel) return state;
  return {
    phase: "closed",
    activePanel: null,
    session: null,
    revision: state.revision + 1,
    openerKey: state.openerKey,
    lastTransition: { kind: "close", from: state.activePanel, to: null, reason: action.reason },
  };
}

export type MainlineAPanelBoundaryModeV637 = "custom-modal" | "native-modal" | "modeless";
export type MainlineAPanelKeyDecisionV637 =
  | "ignore" | "close" | "native-cancel" | "focus-first" | "focus-last" | "focus-boundary";

export function mainlineAPanelKeyDecisionV637(input: Readonly<{
  key: string;
  shiftKey: boolean;
  isComposing: boolean;
  defaultPrevented: boolean;
  mode: MainlineAPanelBoundaryModeV637;
  focusInside: boolean;
  focusIndex: number;
  focusableCount: number;
}>): MainlineAPanelKeyDecisionV637 {
  if (input.isComposing || input.defaultPrevented || input.mode === "modeless") return "ignore";
  if (input.key === "Escape") return input.mode === "native-modal" ? "native-cancel" : "close";
  if (input.key !== "Tab" || input.mode === "native-modal") return "ignore";
  if (input.focusableCount === 0) return "focus-boundary";
  if (!input.focusInside || input.focusIndex < 0) return input.shiftKey ? "focus-last" : "focus-first";
  if (input.shiftKey && input.focusIndex === 0) return "focus-last";
  if (!input.shiftKey && input.focusIndex === input.focusableCount - 1) return "focus-first";
  return "ignore";
}

const FOCUSABLE_SELECTOR = [
  "a[href]", "area[href]", "button", 'input:not([type="hidden"])', "select", "textarea",
  "summary", "[tabindex]", '[contenteditable="true"]', "audio[controls]", "video[controls]",
].join(",");

export function isMainlineAFocusTargetV637(element: HTMLElement | null): element is HTMLElement {
  if (!element?.isConnected || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  if (element.matches(":disabled")) return false;
  const view = element.ownerDocument.defaultView;
  if (!view) return false;
  const style = view.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && style.visibility !== "collapse"
    && element.getClientRects().length > 0;
}

export function mainlineAPanelFocusableElementsV637(boundary: HTMLElement): HTMLElement[] {
  const candidates = Array.from(boundary.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => element.tabIndex >= 0 && isMainlineAFocusTargetV637(element));
  const radioGroups = new Map<string, Map<HTMLFormElement | null, HTMLInputElement[]>>();
  for (const element of candidates) {
    if (element.tagName !== "INPUT") continue;
    const input = element as HTMLInputElement;
    if (input.type !== "radio" || !input.name) continue;
    const forms = radioGroups.get(input.name) ?? new Map<HTMLFormElement | null, HTMLInputElement[]>();
    const group = forms.get(input.form) ?? [];
    group.push(input);
    forms.set(input.form, group);
    radioGroups.set(input.name, forms);
  }
  return candidates.filter((element) => {
    if (element.tagName !== "INPUT") return true;
    const input = element as HTMLInputElement;
    if (input.type !== "radio" || !input.name) return true;
    const group = radioGroups.get(input.name)?.get(input.form) ?? [];
    return element === (group.find((radio) => radio.checked) ?? group[0]);
  }).sort((left, right) => {
    const leftOrder = left.tabIndex > 0 ? left.tabIndex : Number.POSITIVE_INFINITY;
    const rightOrder = right.tabIndex > 0 ? right.tabIndex : Number.POSITIVE_INFINITY;
    return leftOrder - rightOrder || 0;
  });
}

export function focusMainlineATargetV637(target: HTMLElement | null): boolean {
  if (!isMainlineAFocusTargetV637(target)) return false;
  target.focus({ preventScroll: true });
  return target.ownerDocument.activeElement === target;
}

export function restoreMainlineAPanelFocusV637(
  opener: HTMLElement | null,
  fallback: HTMLElement | null = null,
): boolean {
  return focusMainlineATargetV637(opener) || (fallback !== opener && focusMainlineATargetV637(fallback));
}

export function mainlineAPanelOpenerKeyV637(element: HTMLElement | null, panel: MainlineAPanelIdV637): string {
  return element?.getAttribute("data-mainline-a-panel-trigger") || element?.id || `panel-trigger:${panel}`;
}

export type MainlineAPanelBoundaryControllerV637 = Readonly<{
  refresh: () => void;
  stop: () => void;
  mode: () => MainlineAPanelBoundaryModeV637;
}>;

export function attachMainlineAPanelBoundaryV637(
  boundary: HTMLElement,
  options: Readonly<{
    panel: MainlineAPanelIdV637;
    onClose: (reason: MainlineAPanelCloseReasonV637) => void;
    onNativeCancel?: () => void;
  }>,
): MainlineAPanelBoundaryControllerV637 {
  const document = boundary.ownerDocument;
  const view = document.defaultView;
  let stopped = false;
  let redirecting = false;
  let scheduledFrame: number | null = null;
  let lastFocus: HTMLElement | null = null;
  let temporaryTabIndex = false;
  const originalTabIndex = boundary.getAttribute("tabindex");
  const nativeDialog = () => boundary.matches("dialog")
    ? boundary : boundary.querySelector<HTMLElement>("dialog");
  const mode = (): MainlineAPanelBoundaryModeV637 => {
    if (options.panel === "performance") return "modeless";
    return nativeDialog() ? "native-modal" : "custom-modal";
  };
  const contains = (target: EventTarget | null): target is HTMLElement => {
    return !!target && boundary.contains(target as Node);
  };
  const focusBoundary = () => {
    if (boundary.getAttribute("tabindex") === null) {
      boundary.setAttribute("tabindex", "-1");
      temporaryTabIndex = true;
    }
    return focusMainlineATargetV637(boundary);
  };
  const focusFirst = () => {
    const requested = boundary.querySelector<HTMLElement>("[data-mainline-a-initial-focus], [autofocus]");
    return focusMainlineATargetV637(requested)
      || focusMainlineATargetV637(mainlineAPanelFocusableElementsV637(boundary)[0] ?? null)
      || focusBoundary();
  };
  const refresh = () => {
    if (stopped || !boundary.isConnected || mode() !== "custom-modal") return;
    if (contains(document.activeElement) && isMainlineAFocusTargetV637(document.activeElement as HTMLElement)) return;
    redirecting = true;
    if (!contains(lastFocus) || !focusMainlineATargetV637(lastFocus)) focusFirst();
    redirecting = false;
  };
  const scheduleRefresh = () => {
    if (stopped || !view || scheduledFrame !== null) return;
    scheduledFrame = view.requestAnimationFrame(() => {
      scheduledFrame = null;
      refresh();
    });
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (stopped || !boundary.isConnected) return;
    const currentMode = mode();
    const elements = event.key === "Tab" && currentMode === "custom-modal"
      ? mainlineAPanelFocusableElementsV637(boundary) : [];
    const decision = mainlineAPanelKeyDecisionV637({
      key: event.key,
      shiftKey: event.shiftKey,
      isComposing: event.isComposing,
      defaultPrevented: event.defaultPrevented,
      mode: currentMode,
      focusInside: contains(document.activeElement),
      focusIndex: elements.indexOf(document.activeElement as HTMLElement),
      focusableCount: elements.length,
    });
    if (decision === "ignore") return;
    event.stopPropagation();
    if (decision === "native-cancel") return;
    event.preventDefault();
    if (decision === "close") options.onClose("escape");
    else if (decision === "focus-first") focusMainlineATargetV637(elements[0] ?? null);
    else if (decision === "focus-last") focusMainlineATargetV637(elements.at(-1) ?? null);
    else focusBoundary();
  };
  const onFocusIn = (event: FocusEvent) => {
    if (stopped || redirecting || mode() !== "custom-modal") return;
    if (contains(event.target)) lastFocus = event.target;
    else refresh();
  };
  const onCancel = (event: Event) => {
    if (stopped || mode() !== "native-modal" || event.target !== nativeDialog()) return;
    if (!event.defaultPrevented) options.onNativeCancel?.();
  };
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("focusin", onFocusIn, true);
  boundary.addEventListener("cancel", onCancel, true);
  const observer = view && "MutationObserver" in view
    ? new view.MutationObserver(scheduleRefresh) : null;
  observer?.observe(boundary, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["disabled", "hidden", "inert", "aria-hidden", "open"],
  });
  scheduleRefresh();
  return {
    mode,
    refresh,
    stop: () => {
      if (stopped) return;
      stopped = true;
      observer?.disconnect();
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
      boundary.removeEventListener("cancel", onCancel, true);
      if (scheduledFrame !== null) view?.cancelAnimationFrame(scheduledFrame);
      scheduledFrame = null;
      lastFocus = null;
      if (temporaryTabIndex && boundary.getAttribute("tabindex") === "-1") {
        if (originalTabIndex === null) boundary.removeAttribute("tabindex");
        else boundary.setAttribute("tabindex", originalTabIndex);
      }
    },
  };
}

"use client";

import { X } from "lucide-react";
import type {
  ComponentPropsWithoutRef,
  KeyboardEvent,
  ReactNode,
} from "react";
import { useCallback, useLayoutEffect, useRef } from "react";
import { ATLAS_INSTRUMENT_UI_VERSION } from "../lib/atlasInstrumentUi";
import type {
  AtlasInstrumentPanelKind,
  AtlasValidationDomainStatus,
  AtlasWorkbenchAccessibilitySurfaceId,
} from "../lib/simulationDiagnosticsTypes";

type InstrumentTone =
  | "default"
  | "cyan"
  | "amber"
  | "muted"
  | AtlasValidationDomainStatus;

type AtlasInstrumentPanelShellProps = ComponentPropsWithoutRef<"aside"> & {
  kind: AtlasInstrumentPanelKind;
  accessibilitySurfaceId?: AtlasWorkbenchAccessibilitySurfaceId;
};

export function AtlasInstrumentPanelShell({
  kind,
  accessibilitySurfaceId,
  className,
  children,
  ...props
}: AtlasInstrumentPanelShellProps) {
  return (
    <aside
      {...props}
      className={instrumentClassNames(
        "atlas-accessible-surface atlas-cinematic-workbench pointer-events-auto fixed inset-x-2 bottom-[calc(var(--ui-dock-height)+14px+env(safe-area-inset-bottom))] max-h-[calc(100dvh-var(--ui-dock-height)-28px-env(safe-area-inset-bottom))] rounded-lg border text-white shadow-[0_28px_96px_rgba(0,0,0,0.62)]",
        className,
      )}
      data-atlas-instrument-ui-version={ATLAS_INSTRUMENT_UI_VERSION}
      data-atlas-instrument-panel-kind={kind}
      data-atlas-accessibility-surface-id={accessibilitySurfaceId}
      data-atlas-accessibility-focus-target={accessibilitySurfaceId ? "true" : undefined}
      tabIndex={accessibilitySurfaceId ? -1 : props.tabIndex}
    >
      {children}
    </aside>
  );
}

export function AtlasInstrumentHeader({
  icon,
  title,
  subtitle,
  closeLabel,
  onClose,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-[var(--atlas-a11y-border)] bg-[var(--atlas-a11y-surface-elevated)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--atlas-cine-gold)]">
          <span className="text-[var(--atlas-cine-gold)]">{icon}</span>
          <span className="truncate">{title}</span>
        </h2>
        <div className="mt-1 max-w-[68ch] text-[12px] leading-5 text-[var(--atlas-a11y-text-secondary)]">
          {subtitle}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="atlas-accessible-focus flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-transparent text-[var(--atlas-a11y-text-secondary)] transition-colors hover:border-[var(--atlas-a11y-border)] hover:bg-[var(--atlas-a11y-surface-active)] hover:text-[var(--atlas-a11y-text-primary)]"
        aria-label={closeLabel}
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  );
}

export function AtlasInstrumentStatStrip({
  children,
  className = "grid-cols-4",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={instrumentClassNames(
        "grid gap-px border-b border-[var(--atlas-a11y-border)] bg-[var(--atlas-a11y-surface-elevated)] text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AtlasInstrumentStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: InstrumentTone;
}) {
  return (
    <div className="min-w-0 bg-[var(--atlas-a11y-surface)] px-2 py-2">
      <div className="text-[9px] uppercase tracking-[0.14em] text-[var(--atlas-a11y-text-muted)]">
        {label}
      </div>
      <div className={instrumentClassNames("mt-0.5 truncate text-[11px] font-medium", toneTextClass(tone))}>
        {value}
      </div>
    </div>
  );
}

export function AtlasInstrumentSegmentedTabs<T extends string>({
  tabs,
  activeId,
  onChange,
  className,
}: {
  tabs: readonly { id: T; label: string }[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className="border-b border-cyan-100/10 p-2 sm:hidden">
      <div
        className={instrumentClassNames(
          "grid gap-1 rounded-md border border-[var(--atlas-a11y-border)] bg-[var(--atlas-a11y-surface)] p-1",
          className,
        )}
        role="group"
        aria-label="面板视图"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={instrumentClassNames(
              "atlas-accessible-focus h-9 min-w-0 rounded text-[10px] transition-colors",
              activeId === tab.id
                ? "bg-[var(--atlas-a11y-surface-active)] text-[var(--atlas-a11y-text-primary)]"
                : "text-[var(--atlas-a11y-text-secondary)] hover:bg-[var(--atlas-a11y-surface-elevated)] hover:text-[var(--atlas-a11y-text-primary)]",
            )}
            aria-pressed={activeId === tab.id}
          >
            <span className="truncate px-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AtlasInstrumentStatusBadge({
  status,
}: {
  status: AtlasValidationDomainStatus;
}) {
  return (
    <span
      className={instrumentClassNames(
        "shrink-0 rounded border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em]",
        toneSurfaceClass(status),
      )}
    >
      {status}
    </span>
  );
}

export function AtlasInstrumentInfoBlock({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={instrumentClassNames("min-w-0 rounded border border-[var(--atlas-a11y-border)] bg-[var(--atlas-a11y-surface-elevated)] px-2 py-1.5", className)}>
      <div className="text-[9px] uppercase tracking-[0.13em] text-[var(--atlas-a11y-text-muted)]">
        {label}
      </div>
      <div className="mt-0.5 break-words text-[10px] leading-4 text-[var(--atlas-a11y-text-secondary)]">
        {value}
      </div>
    </div>
  );
}

export function AtlasInstrumentMetricPill({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded border border-[var(--atlas-a11y-border)] bg-[var(--atlas-a11y-surface-elevated)] px-2 py-1.5">
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.11em] text-[var(--atlas-a11y-text-muted)]">
        {icon ? <span className="shrink-0 text-[var(--atlas-a11y-text-muted)]">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-0.5 truncate text-[10px] text-[var(--atlas-a11y-text-secondary)]">{value}</div>
    </div>
  );
}

type AtlasInstrumentActionButtonProps = ComponentPropsWithoutRef<"button"> & {
  icon?: ReactNode;
  tone?: "primary" | "subtle" | "quiet";
};

export function AtlasInstrumentActionButton({
  icon,
  tone = "subtle",
  className,
  children,
  ...props
}: AtlasInstrumentActionButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={instrumentClassNames(
        "atlas-accessible-focus flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border px-2 text-[10px] transition-colors disabled:cursor-not-allowed disabled:border-[var(--atlas-a11y-border)] disabled:bg-[var(--atlas-a11y-surface-elevated)] disabled:text-[var(--atlas-a11y-text-muted)]",
        tone === "primary"
          ? "border-[var(--atlas-a11y-accent)] bg-[var(--atlas-a11y-surface-active)] text-[var(--atlas-a11y-text-primary)] hover:bg-[var(--atlas-a11y-surface-elevated)]"
          : tone === "quiet"
            ? "border-[var(--atlas-a11y-border)] bg-[var(--atlas-a11y-surface-elevated)] text-[var(--atlas-a11y-text-secondary)] hover:bg-[var(--atlas-a11y-surface-active)] hover:text-[var(--atlas-a11y-text-primary)]"
            : "border-[var(--atlas-a11y-accent)] bg-[var(--atlas-a11y-surface-elevated)] text-[var(--atlas-a11y-text-secondary)] hover:bg-[var(--atlas-a11y-surface-active)] hover:text-[var(--atlas-a11y-text-primary)]",
        className,
      )}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </button>
  );
}

type AtlasInstrumentSectionProps = ComponentPropsWithoutRef<"section">;

export function AtlasInstrumentSection({
  children,
  className,
  ...props
}: AtlasInstrumentSectionProps) {
  return (
    <section
      {...props}
      className={instrumentClassNames(
        "rounded-md border border-[var(--atlas-a11y-border)] bg-[var(--atlas-a11y-surface-elevated)] p-3",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function useAtlasWorkbenchSurfaceAccessibility({
  open,
  surfaceId,
  onClose,
}: {
  open: boolean;
  surfaceId: AtlasWorkbenchAccessibilitySurfaceId;
  onClose: () => void;
}) {
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document
      .querySelector<HTMLElement>(
        `[data-atlas-accessibility-surface-id="${surfaceId}"][data-atlas-accessibility-focus-target]`,
      )
      ?.focus({ preventScroll: true });
  }, [open, surfaceId]);

  const closeWithFocusReturn = useCallback(() => {
    onClose();
    window.requestAnimationFrame(() => {
      const returnTarget = returnFocusRef.current;
      if (isUsableFocusTarget(returnTarget)) {
        returnTarget.focus({ preventScroll: true });
        return;
      }
      document
        .querySelector<HTMLElement>('[data-atlas-accessibility-return-target="search"]')
        ?.focus({ preventScroll: true });
    });
  }, [onClose]);

  const onSurfaceKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      closeWithFocusReturn();
    },
    [closeWithFocusReturn],
  );

  return { closeWithFocusReturn, onSurfaceKeyDown };
}

export function instrumentClassNames(
  ...classes: readonly (string | false | null | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}

function toneTextClass(tone: InstrumentTone): string {
  switch (tone) {
    case "ready":
      return "text-emerald-100";
    case "pending":
    case "amber":
      return "text-amber-100";
    case "failed":
      return "text-rose-100";
    case "informational":
    case "cyan":
      return "text-cyan-100";
    case "muted":
      return "text-[var(--atlas-a11y-text-muted)]";
    case "default":
    default:
      return "text-[var(--atlas-a11y-text-primary)]";
  }
}

function toneSurfaceClass(status: AtlasValidationDomainStatus): string {
  switch (status) {
    case "ready":
      return "border-emerald-200 bg-emerald-950 text-emerald-100";
    case "pending":
      return "border-amber-200 bg-amber-950 text-amber-100";
    case "failed":
      return "border-rose-200 bg-rose-950 text-rose-100";
    case "informational":
    default:
      return "border-cyan-100 bg-cyan-950 text-cyan-100";
  }
}

function isUsableFocusTarget(target: HTMLElement | null): target is HTMLElement {
  return Boolean(target?.isConnected && target.getClientRects().length && !target.closest("[aria-hidden='true']"));
}

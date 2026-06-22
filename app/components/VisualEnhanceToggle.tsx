"use client";

type VisualEnhanceToggleProps = {
  enabled: boolean;
  onChange: (next: boolean) => void;
};

/**
 * Top-bar visual enhancement switch for contrast / bloom / glow.
 */
export default function VisualEnhanceToggle({
  enabled,
  onChange,
}: VisualEnhanceToggleProps) {
  return (
    <div
      className="pointer-events-auto fixed left-1/2 top-[max(0.5rem,env(safe-area-inset-top))] z-[91] -translate-x-1/2"
      role="group"
      aria-label="Visual enhance"
    >
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`flex items-center gap-2 rounded-full border border-solid border-ui-strong bg-ui-glass px-3 py-1.5 text-xs font-medium shadow-ui-panel backdrop-blur-ui transition-colors ${
          enabled
            ? "text-ui-primary ring-1 ring-ui-strong"
            : "text-ui-muted hover:bg-[var(--ui-hover-bg)] hover:text-ui-primary"
        }`}
        title="Increase contrast and glow strength"
      >
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            enabled ? "bg-ui-primary" : "bg-ui-dim"
          }`}
          aria-hidden
        />
        Visual Enhance
        <span className="text-[10px] font-normal text-ui-dim">Enhance</span>
      </button>
    </div>
  );
}

"use client";

type VisualEnhanceToggleProps = {
  enabled: boolean;
  onChange: (next: boolean) => void;
};

/**
 * 顶栏「视觉增强」开关：控制画布后处理（对比度 / Bloom / 光晕）。
 */
export default function VisualEnhanceToggle({
  enabled,
  onChange,
}: VisualEnhanceToggleProps) {
  return (
    <div
      className="pointer-events-auto fixed left-1/2 top-[max(0.5rem,env(safe-area-inset-top))] z-[91] -translate-x-1/2"
      role="group"
      aria-label="视觉增强"
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
        title="提高对比度与发光强度（Bloom / 光晕）"
      >
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            enabled ? "bg-ui-primary" : "bg-ui-dim"
          }`}
          aria-hidden
        />
        Visual Enhance
        <span className="text-[10px] font-normal text-ui-dim">视觉增强</span>
      </button>
    </div>
  );
}

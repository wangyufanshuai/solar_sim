import * as THREE from "three";

export type RenderAssetPriority = "preview" | "critical" | "visible" | "idle" | "upgrade" | "quality";
export type RenderBudget = "safe" | "balanced" | "quality";

type TextureTask = {
  url: string;
  priority: RenderAssetPriority;
  colorSpace: THREE.ColorSpace;
  anisotropy: number;
  configure?: (texture: THREE.Texture) => void;
  onLoad: (texture: THREE.Texture) => void;
  onError?: () => void;
  cancelled: boolean;
};

const PRIORITY_ORDER: Record<RenderAssetPriority, number> = {
  preview: 0,
  critical: 1,
  visible: 2,
  idle: 3,
  upgrade: 4,
  quality: 5,
};

const CORE_TEXTURE_HINTS = [
  "sun",
  "earth_daymap",
  "moon",
  "jupiter",
  "saturn",
];

const textureCache = new Map<string, THREE.Texture>();
const loadedCoreTextureHints = new Set<string>();
const loadedPreviewCoreTextureHints = new Set<string>();
const loadedQualityCoreTextureHints = new Set<string>();

function requestFrame(cb: () => void) {
  if (typeof window !== "undefined") window.requestAnimationFrame(() => cb());
  else globalThis.setTimeout(cb, 16);
}

function allowsPriority(budget: RenderBudget, priority: RenderAssetPriority) {
  if (budget === "quality") return true;
  if (budget === "balanced") return priority !== "quality";
  return priority === "preview" || priority === "critical" || priority === "visible";
}

export function markRenderAssetStage(stage: string) {
  if (typeof performance === "undefined") return;
  const name = `solar:${stage}`;
  const existing = performance.getEntriesByName(name, "mark");
  if (existing.length === 0) performance.mark(name);
}

export function priorityForTextureUrl(url: string | undefined): RenderAssetPriority {
  if (!url) return "idle";
  if (url.includes("/textures/sky/")) return "preview";
  if (url.includes("/textures/planets/")) {
    const lower = url.toLowerCase();
    return CORE_TEXTURE_HINTS.some((hint) => lower.includes(hint)) ? "visible" : "idle";
  }
  return "idle";
}

function noteTextureStage(url: string) {
  const lower = url.toLowerCase();
  for (const hint of CORE_TEXTURE_HINTS) {
    if (lower.includes(hint)) loadedCoreTextureHints.add(hint);
  }
  const previewHits: Record<string, string[]> = {
    sun: ["sun.jpg"],
    earth_daymap: ["earth_2k.jpg", "earth.jpg"],
    moon: ["moon_2k.jpg", "moon.jpg"],
    jupiter: ["jupiter_2k.jpg", "jupiter.jpg"],
    saturn: ["saturn_2k.jpg", "saturn.jpg"],
  };
  const qualityHits: Record<string, string[]> = {
    sun: ["8k_sun.jpg"],
    earth_daymap: ["8k_earth_daymap.jpg"],
    moon: ["8k_moon.jpg"],
    jupiter: ["8k_jupiter.jpg"],
    saturn: ["8k_saturn.jpg"],
  };
  for (const [hint, patterns] of Object.entries(previewHits)) {
    if (patterns.some((pattern) => lower.includes(pattern))) {
      loadedPreviewCoreTextureHints.add(hint);
    }
  }
  for (const [hint, patterns] of Object.entries(qualityHits)) {
    if (patterns.some((pattern) => lower.includes(pattern))) {
      loadedQualityCoreTextureHints.add(hint);
    }
  }
  if (loadedCoreTextureHints.size >= CORE_TEXTURE_HINTS.length) {
    markRenderAssetStage("core-planets-ready");
  }
  if (loadedPreviewCoreTextureHints.size >= CORE_TEXTURE_HINTS.length) {
    markRenderAssetStage("preview-planets-ready");
  }
  if (loadedQualityCoreTextureHints.size >= CORE_TEXTURE_HINTS.length) {
    markRenderAssetStage("quality-planets-ready");
  }
}

export class RenderAssetQueue {
  private budget: RenderBudget;
  private pending: TextureTask[] = [];
  private active = false;
  private loader = new THREE.TextureLoader();
  private lastStartAt = 0;
  private createdAt = typeof performance !== "undefined" ? performance.now() : 0;
  private interactiveUntil = 0;
  private wakeTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

  constructor(budget: RenderBudget) {
    this.budget = budget;
    if (typeof window !== "undefined") {
      const noteInteraction = () => {
        this.interactiveUntil = performance.now() + 1400;
      };
      window.addEventListener("pointerdown", noteInteraction, { passive: true });
      window.addEventListener("pointermove", noteInteraction, { passive: true });
      window.addEventListener("wheel", noteInteraction, { passive: true });
      window.addEventListener("click", noteInteraction, { passive: true });
      window.addEventListener("keydown", noteInteraction);
    }
  }

  setBudget(budget: RenderBudget) {
    this.budget = budget;
    this.pump();
  }

  loadTexture(task: Omit<TextureTask, "cancelled">): () => void {
    const cached = textureCache.get(task.url);
    const queued: TextureTask = { ...task, cancelled: false };
    if (cached) {
      requestFrame(() => {
        if (!queued.cancelled) task.onLoad(cached);
      });
      return () => {
        queued.cancelled = true;
      };
    }
    this.pending.push(queued);
    this.pending.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    this.pump();
    return () => {
      queued.cancelled = true;
    };
  }

  private pump() {
    if (this.active) return;
    const nextIndex = this.pending.findIndex((task) => this.canStart(task));
    if (nextIndex < 0) {
      this.scheduleWake();
      return;
    }
    const now = performance.now();
    const minGap = this.budget === "quality" ? 24 : this.budget === "balanced" ? 56 : 96;
    const wait = Math.max(0, this.lastStartAt + minGap - now);
    const start = () => {
      if (this.active) return;
      const index = this.pending.findIndex((task) => this.canStart(task));
      if (index < 0) return;
      const task = this.pending.splice(index, 1)[0]!;
      this.active = true;
      this.lastStartAt = performance.now();
      this.loader.load(
        task.url,
        (texture) => {
          texture.colorSpace = task.colorSpace;
          const useMipmaps = this.budget === "quality";
          texture.generateMipmaps = useMipmaps;
          texture.minFilter = useMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = task.anisotropy;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          task.configure?.(texture);
          texture.needsUpdate = true;
          textureCache.set(task.url, texture);
          noteTextureStage(task.url);
          requestFrame(() => {
            if (!task.cancelled) task.onLoad(texture);
            this.active = false;
            this.pump();
          });
        },
        undefined,
        () => {
          if (!task.cancelled) task.onError?.();
          this.active = false;
          this.pump();
        },
      );
    };
    if (wait > 0) globalThis.setTimeout(start, wait);
    else requestFrame(start);
  }

  private canStart(task: TextureTask) {
    if (task.cancelled || !allowsPriority(this.budget, task.priority)) return false;
    const now = performance.now();
    if (this.budget === "balanced" && (task.priority === "idle" || task.priority === "upgrade" || task.priority === "quality")) {
      if (now - this.createdAt < 12000) return false;
    }
    if ((task.priority === "idle" || task.priority === "upgrade" || task.priority === "quality") && now < this.interactiveUntil) {
      return false;
    }
    return true;
  }

  private scheduleWake() {
    if (this.wakeTimer || this.pending.every((task) => task.cancelled)) return;
    const now = performance.now();
    const nextIdleAt =
      this.budget === "balanced"
        ? this.createdAt + 12000
        : now + 400;
    const nextInteractiveAt = this.interactiveUntil > now ? this.interactiveUntil + 50 : now + 400;
    const wait = Math.max(120, Math.min(nextIdleAt, nextInteractiveAt) - now);
    this.wakeTimer = globalThis.setTimeout(() => {
      this.wakeTimer = null;
      this.pump();
    }, wait);
  }
}

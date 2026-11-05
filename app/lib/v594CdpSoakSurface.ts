"use client";

import {
  createContext,
  createElement,
  forwardRef,
  useContext,
  type ReactNode,
} from "react";
import { Html as DreiHtml, type HtmlProps } from "@react-three/drei/web/Html";
import type { AtlasV594BuildIdentity } from "./atlasV594BuildIdentity";
import {
  createV594ExactAbRuntimeRequest,
  resolveV594ExactAbSearch,
  type V594ExactAbMode,
  type V594ExactAbRuntimeRequest,
} from "./v594ExactAbContract";
import {
  POST_V594_SAME_REALM_LIFECYCLE_QUERY,
  isPostV594SameRealmLifecycleAuditSearch,
} from "./postV594SameRealmLifecycle";

export const POST_V594_CDP_SOAK_QUERY_KEY = "v594CdpSoak" as const;
export const POST_V594_CDP_SOAK_QUERY_VALUE = "1" as const;
export const POST_V594_CDP_SOAK_SURFACE_VERSION =
  "v594-cdp-soak-app-surface-v3" as const;
export const POST_V594_CDP_SOAK_CANDIDATE_OBSERVER_VERSION =
  "v594-cdp-soak-candidate-dom-observer-v1" as const;

/**
 * Every Drei Html instance owns a separate React DOM root. Chrome retains
 * those removed roots long enough to make a repeated same-realm teardown look
 * like monotonic heap growth even when they share a persistent portal host.
 * The audit does not inspect scene labels, so suppress only those Html roots
 * while keeping the ordinary Exact DOM/evidence surfaces outside the Canvas.
 * Normal product and visual A/B routes keep Drei's original behavior.
 */
const PostV594CdpSoakHtmlSuppressedContext = createContext(false);

export function PostV594CdpSoakHtmlSuppressionProvider({
  children,
  enabled,
}: Readonly<{ children?: ReactNode; enabled: boolean }>) {
  return createElement(
    PostV594CdpSoakHtmlSuppressedContext.Provider,
    { value: enabled },
    children,
  );
}

/** Drop-in Html replacement used by scene components that can run in soak mode. */
export const PostV594CdpSoakHtml = forwardRef<HTMLDivElement, HtmlProps>(function PostV594CdpSoakHtml(
  props,
  ref,
) {
  const auditHtmlSuppressed = useContext(PostV594CdpSoakHtmlSuppressedContext);
  if (auditHtmlSuppressed) return null;
  return createElement(DreiHtml, {
    ...props,
    ref,
  });
});
PostV594CdpSoakHtml.displayName = "PostV594CdpSoakHtml";

export type PostV594CdpSoakProfile = Readonly<{
  key: string;
  targetId: string;
  archetype: string | null;
  requestArchetype: string;
  kind: "stellar" | "relativity";
  mode: V594ExactAbMode;
}>;

export const POST_V594_CDP_SOAK_PROFILES = Object.freeze([
  Object.freeze({
    key: "hot-radiative",
    targetId: "sirius-a",
    archetype: "hot-radiative",
    requestArchetype: "hot-radiative",
    kind: "stellar",
    mode: "cinematic",
  }),
  Object.freeze({
    key: "blue-supergiant-wind",
    targetId: "rigel",
    archetype: "blue-supergiant-wind",
    requestArchetype: "blue-supergiant-wind",
    kind: "stellar",
    mode: "cinematic",
  }),
  Object.freeze({
    key: "solar-like-convective",
    targetId: "alpha-centauri-a",
    archetype: "solar-like-convective",
    requestArchetype: "solar-like-convective",
    kind: "stellar",
    mode: "cinematic",
  }),
  Object.freeze({
    key: "cool-convective",
    targetId: "arcturus",
    archetype: "cool-convective",
    requestArchetype: "cool-convective",
    kind: "stellar",
    mode: "cinematic",
  }),
  Object.freeze({
    key: "red-giant-supergiant",
    targetId: "betelgeuse",
    archetype: "red-giant-supergiant",
    requestArchetype: "red-giant-supergiant",
    kind: "stellar",
    mode: "cinematic",
  }),
  Object.freeze({
    key: "warm-radiative-convective",
    targetId: "procyon-a",
    archetype: "warm-radiative-convective",
    requestArchetype: "warm-radiative-convective",
    kind: "stellar",
    mode: "cinematic",
  }),
  Object.freeze({
    key: "rapid-rotator-gravity-darkened",
    targetId: "achernar",
    archetype: "rapid-rotator-gravity-darkened",
    requestArchetype: "rapid-rotator-gravity-darkened",
    kind: "stellar",
    mode: "cinematic",
  }),
  Object.freeze({
    key: "relativity-workbench",
    targetId: "sun",
    archetype: null,
    requestArchetype: "relativity-workbench",
    kind: "relativity",
    mode: "validation",
  }),
] as const satisfies readonly PostV594CdpSoakProfile[]);

export type PostV594CdpSoakSearchResolution = Readonly<{
  status: "inactive" | "active" | "invalid";
  reason:
    | "absent"
    | "exact-contract"
    | "duplicate"
    | "unknown-value"
    | "missing-same-realm"
    | "missing-exact-ab";
}>;

export function resolvePostV594CdpSoakSearch(
  search: string,
): PostV594CdpSoakSearchResolution {
  const values = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    .getAll(POST_V594_CDP_SOAK_QUERY_KEY);
  if (values.length === 0) return Object.freeze({ status: "inactive", reason: "absent" });
  if (values.length !== 1) return Object.freeze({ status: "invalid", reason: "duplicate" });
  if (values[0] !== POST_V594_CDP_SOAK_QUERY_VALUE) {
    return Object.freeze({ status: "invalid", reason: "unknown-value" });
  }
  if (!isPostV594SameRealmLifecycleAuditSearch(search)) {
    return Object.freeze({ status: "invalid", reason: "missing-same-realm" });
  }
  if (resolveV594ExactAbSearch(search).status !== "active") {
    return Object.freeze({ status: "invalid", reason: "missing-exact-ab" });
  }
  return Object.freeze({ status: "active", reason: "exact-contract" });
}

export function resolvePostV594CdpSoakAudit(): boolean {
  return typeof window !== "undefined"
    && resolvePostV594CdpSoakSearch(window.location.search).status === "active";
}

export function createPostV594CdpSoakRuntimeRequest(
  profile: PostV594CdpSoakProfile,
  identity: AtlasV594BuildIdentity,
): V594ExactAbRuntimeRequest {
  if (!POST_V594_CDP_SOAK_PROFILES.some((candidate) => candidate === profile)) {
    throw new Error("v594-cdp-soak-unknown-profile");
  }
  return createV594ExactAbRuntimeRequest({
    lane: "candidate-v594",
    targetId: profile.targetId,
    archetype: profile.requestArchetype,
    mode: profile.mode,
    identity,
  });
}

export const POST_V594_CDP_SOAK_LIFECYCLE_QUERY =
  POST_V594_SAME_REALM_LIFECYCLE_QUERY;

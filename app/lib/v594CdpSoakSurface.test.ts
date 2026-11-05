import { createElement, type ForwardedRef, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createAtlasV594BuildIdentity } from "./atlasV594BuildIdentity";

vi.mock("@react-three/drei/web/Html", async () => {
  const react = await import("react");
  return {
    Html: react.forwardRef(function MockDreiHtml(
      props: Readonly<{ children?: ReactNode; className?: string }>,
      ref: ForwardedRef<HTMLDivElement>,
    ) {
      return react.createElement("div", {
        ref,
        className: props.className,
        "data-mock-drei-html": "true",
      }, props.children);
    }),
  };
});

import {
  POST_V594_CDP_SOAK_PROFILES,
  PostV594CdpSoakHtml,
  PostV594CdpSoakHtmlSuppressionProvider,
  createPostV594CdpSoakRuntimeRequest,
  resolvePostV594CdpSoakAudit,
  resolvePostV594CdpSoakSearch,
} from "./v594CdpSoakSurface";

const SOURCE_SHA = "a".repeat(64);
const CANDIDATE_SHA = "b".repeat(64);
const FINGERPRINT = "c".repeat(64);
const IDENTITY = createAtlasV594BuildIdentity({
  sourceManifestSha256: SOURCE_SHA,
  candidateManifestSha256: CANDIDATE_SHA,
  buildFingerprint: FINGERPRINT,
  buildId: `v594b-${FINGERPRINT}`,
  deploymentId: `v594-${SOURCE_SHA.slice(0, 12)}-${CANDIDATE_SHA.slice(0, 12)}`,
  deliveryTier: "standalone-full",
  nodeEnv: "production",
});

const VALID_SEARCH =
  "?lifecycleAudit=v594-same-realm-v2&v594ExactAb=1&v594CdpSoak=1";

describe("v594 CDP soak app surface contract", () => {
  it("binds the observed delivery tier into the application identity", () => {
    expect(IDENTITY.deliveryTier).toBe("standalone-full");
    expect(IDENTITY.bindingStatus).toBe("bound");
    expect(createAtlasV594BuildIdentity({
      sourceManifestSha256: SOURCE_SHA,
      candidateManifestSha256: CANDIDATE_SHA,
      buildFingerprint: FINGERPRINT,
      buildId: `v594b-${FINGERPRINT}`,
      deploymentId: `v594-${SOURCE_SHA.slice(0, 12)}-${CANDIDATE_SHA.slice(0, 12)}`,
      nodeEnv: "production",
    }).bindingStatus).toBe("unbound-production");
  });

  it.each([
    ["", "inactive", "absent"],
    ["?v594CdpSoak=1", "invalid", "missing-same-realm"],
    ["?lifecycleAudit=v594-same-realm-v2&v594CdpSoak=1", "invalid", "missing-exact-ab"],
    [`${VALID_SEARCH}&v594CdpSoak=1`, "invalid", "duplicate"],
    [VALID_SEARCH.replace("v594CdpSoak=1", "v594CdpSoak=true"), "invalid", "unknown-value"],
    [VALID_SEARCH, "active", "exact-contract"],
  ] as const)("resolves %s fail closed", (search, status, reason) => {
    expect(resolvePostV594CdpSoakSearch(search)).toEqual({ status, reason });
  });

  it("exposes the exact eight ordered source-owned profiles", () => {
    expect(POST_V594_CDP_SOAK_PROFILES.map(({ key, targetId, archetype, kind }) => ({
      key,
      targetId,
      archetype,
      kind,
    }))).toEqual([
      { key: "hot-radiative", targetId: "sirius-a", archetype: "hot-radiative", kind: "stellar" },
      { key: "blue-supergiant-wind", targetId: "rigel", archetype: "blue-supergiant-wind", kind: "stellar" },
      { key: "solar-like-convective", targetId: "alpha-centauri-a", archetype: "solar-like-convective", kind: "stellar" },
      { key: "cool-convective", targetId: "arcturus", archetype: "cool-convective", kind: "stellar" },
      { key: "red-giant-supergiant", targetId: "betelgeuse", archetype: "red-giant-supergiant", kind: "stellar" },
      { key: "warm-radiative-convective", targetId: "procyon-a", archetype: "warm-radiative-convective", kind: "stellar" },
      { key: "rapid-rotator-gravity-darkened", targetId: "achernar", archetype: "rapid-rotator-gravity-darkened", kind: "stellar" },
      { key: "relativity-workbench", targetId: "sun", archetype: null, kind: "relativity" },
    ]);
  });

  it("creates candidate-only Exact requests without changing relativity authority", () => {
    for (const profile of POST_V594_CDP_SOAK_PROFILES) {
      const request = createPostV594CdpSoakRuntimeRequest(profile, IDENTITY);
      expect(request.frame.lane).toBe("candidate-v594");
      expect(request.frame.targetId).toBe(profile.targetId);
      expect(request.frame.archetype).toBe(profile.requestArchetype);
      expect(request.frame.mode).toBe(profile.mode);
    }
    expect(resolvePostV594CdpSoakAudit()).toBe(false);
  });

  it("rejects an unregistered profile clone", () => {
    expect(() => createPostV594CdpSoakRuntimeRequest(
      { ...POST_V594_CDP_SOAK_PROFILES[0] },
      IDENTITY,
    )).toThrow("v594-cdp-soak-unknown-profile");
  });

  it("suppresses per-instance Drei Html roots only inside the exact CDP soak", () => {
    const render = (enabled: boolean) => renderToStaticMarkup(createElement(
      PostV594CdpSoakHtmlSuppressionProvider,
      { enabled },
      createElement(PostV594CdpSoakHtml, { className: "normal-product-html" }, "scene label"),
    ));

    expect(render(true)).toBe("");
    expect(render(false)).toContain('data-mock-drei-html="true"');
    expect(render(false)).toContain('class="normal-product-html"');
    expect(renderToStaticMarkup(
      createElement(PostV594CdpSoakHtml, null, "default product label"),
    )).toContain("default product label");
  });

  it("keeps the soak controls in DOM and mounts only the formal single scene layer", () => {
    const surface = readFileSync("app/components/V594CdpSoakSurface.tsx", "utf8");
    const portal = readFileSync("app/lib/v594CdpSoakSurface.ts", "utf8");
    const workbench = readFileSync("app/components/AtlasRuntimeWorkbenchSurface.tsx", "utf8");
    const runtime = readFileSync("app/AtlasRuntimeWorkbench.tsx", "utf8");
    const physics = readFileSync("app/lib/useSolarSystem.ts", "utf8");
    const canvas = readFileSync("app/components/UniverseCanvas.tsx", "utf8");
    expect(surface.match(/<AtlasRuntimeSceneLayer\b/g)).toHaveLength(1);
    expect(surface).toContain("{sceneMounted && exactRequest ? (");
    expect(surface).toContain('data-atlas-v594-cdp-soak-target-id={profile.targetId}');
    expect(surface).toContain('data-atlas-v594-cdp-soak-action="stabilize-profile"');
    expect(surface).toContain('data-atlas-v594-cdp-soak-action="repeat"');
    expect(surface).toContain('data-atlas-v594-lifecycle-action="exit"');
    expect(surface).toContain("const candidateObserverActive = selectedProfile !== null");
    expect(surface).toContain('(phase === "mounted" || phase === "profile-stable")');
    expect(surface).toContain("profileMatchesReceipt(selectedProfile, exactReceipt)");
    expect(surface).toContain("data-atlas-candidate={candidateObserverActive");
    expect(surface).toContain('? "v596"');
    expect(surface).toContain('? "v595"');
    expect(surface).toContain(': "v594"');
    expect(surface).toContain("ATLAS_V596_VISUAL_CHECKPOINT_IDENTITY.bindingStatus");
    expect(surface).toContain("createV596VisualCheckpointRuntimeRequest");
    expect(surface).toContain("visualCheckpointRequest={exactRequest.version");
    expect(surface).toContain("data-atlas-v596-visual-checkpoint-consumer-receipt");
    expect(surface).toContain("V596_CDP_SOAK_PARENT_V595_IDENTITY");
    expect(surface).toContain("data-atlas-v595-cdp-soak-identity-adapter");
    expect(surface).toContain('data-atlas-v595-cdp-soak-instrumentation="inherited-v594-same-realm-renderer-observability"');
    expect(surface).toContain("data-atlas-v594-cdp-soak-candidate-observer={candidateObserverActive");
    expect(surface).toContain('data-atlas-v594-scene-census-authority={candidateObserverActive ? "false" : undefined}');
    expect(surface).not.toContain("<PostV594CdpSoakCandidateObserver");
    expect(surface).not.toContain("selectedProfile?.kind === \"relativity\"");
    expect(surface).toContain('href="/downloads"');
    expect(surface).toContain("prefetch={false}");
    expect(surface).not.toContain("location.href");
    expect(portal).toContain("if (auditHtmlSuppressed) return null;");
    expect(portal).not.toContain("document.createElement");
    expect(portal).not.toContain("[data-atlas-v594-lifecycle-root]");
    expect(workbench).toContain("<V595ExactAbDomSurface");
    expect(workbench).toContain("resolvePostV594CdpSoakAudit");
    expect(workbench).toContain("<V594CdpSoakSurface domains={domains} />");
    expect(runtime).toContain("resolvePostV594SameRealmLifecycleAudit");
    expect(runtime).toContain("useSolarSystemPhysics({ forceMainThread: sameRealmLifecycleAudit })");
    expect(physics).toContain("if (options.forceMainThread === true)");
    expect(physics).toContain("physicsRef.current = new SolarSystemPhysics()");
    expect(canvas).toContain('lifecyclePhase === "resetting"');
    expect(canvas).toContain('snapshotCallback?.("exited", detachedSnapshot)');
    expect(canvas).toContain("rendererObserver = null");
    expect(canvas).toContain("resourceReferencesReleased: true");
    expect(canvas).toContain("resolvePostV594CdpSoakAudit()");
  });
});

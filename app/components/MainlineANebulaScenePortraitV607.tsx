"use client";

import { Billboard } from "@react-three/drei/core/Billboard";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { PostV594CdpSoakHtml as Html } from "../lib/v594CdpSoakSurface";
import {
  mainlineANebulaSceneEnabledV607,
  mainlineANebulaSceneSizeV607,
  resolveMainlineANebulaSceneTargetV607,
  type MainlineANebulaSceneGateV607,
} from "../lib/mainlineANebulaSceneV607";
import { loadMainlineANebulaSceneTextureV607, type MainlineANebulaSceneTextureLeaseV607 } from "../lib/mainlineANebulaSceneTextureV607";
import { releaseCanonicalTextureLeaseV635, useCanonicalDisposableV635, useCanonicalProducerV635 } from "../lib/mainlineACanonicalProducerV635";
import { createNebulaRenderObserverV638 } from "../lib/mainlineANebulaRenderV638";
import { createMainlineANebulaImageMaterialV638, MAINLINE_A_NEBULA_IMAGE_RENDER_ORDER_V638 } from "../lib/mainlineANebulaCompositionV638";
import {
  applyMainlineANebulaCaptionFrameV638,
  applyMainlineANebulaCaptionLayoutV638,
  createMainlineANebulaCaptionBindingV638,
  constrainMainlineANebulaCaptionMeasurementV638,
  fitMainlineANebulaPortraitFrameV638,
  projectMainlineANebulaCaptionV638,
  resolveMainlineANebulaCaptionLayoutV638,
} from "../lib/mainlineANebulaCaptionLayoutV638";
import {
  classifyNebulaLoadErrorV638,
  createNebulaLoadAttemptV638,
  transitionNebulaLoadAttemptV638,
  type NebulaLoadAttemptV638,
  type NebulaLoadEventV638,
} from "../lib/mainlineANebulaLoadV638";
import MainlineANebulaSceneCaption from "./MainlineANebulaSceneCaption";
import MainlineANebulaViewerM3 from "./MainlineANebulaViewerM3";
import NebulaParallaxLayers from "./NebulaParallaxLayers";
import captionStyles from "./MainlineANebulaSceneCaption.module.css";
import { resolveMainlineAJourneyViewportM4 } from "../lib/mainlineAJourneyViewportM4";
import { runtimeSafeViewportRect } from "../lib/atlasSceneFocusCameraRuntime";

type TargetV607 = NonNullable<ReturnType<typeof resolveMainlineANebulaSceneTargetV607>>;

export default function MainlineANebulaScenePortraitV607({
  selectedCatalogId,
  ...gate
}: Omit<MainlineANebulaSceneGateV607, "research"> & { selectedCatalogId: string }) {
  const research = useAtlasRuntimeStore((snapshot) => snapshot.experienceMode === "research");
  const enabled = mainlineANebulaSceneEnabledV607({ ...gate, research });
  const target = useMemo(() => enabled ? resolveMainlineANebulaSceneTargetV607(selectedCatalogId) : null, [enabled, selectedCatalogId]);
  return target ? <ObservationPlaneV607 key={`${target.catalogId}:${target.asset.sha256}`} target={target} /> : null;
}

function ObservationPlaneV607({ target }: { target: TargetV607 }) {
  const { asset, title } = target;
  const [attempt, setAttempt] = useState<NebulaLoadAttemptV638>(() => createNebulaLoadAttemptV638(1, new Date().toISOString()));
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [request, setRequest] = useState(0);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const attemptRef = useRef(attempt);
  const textureRef = useRef<THREE.Texture | null>(null);
  const attemptNumber = useRef(0);
  const cancelAttempt = useRef<(() => void) | null>(null);
  const imageRef = useRef<THREE.Mesh>(null);
  const billboardRef = useRef<THREE.Group>(null);
  const captionAnchorRef = useRef<THREE.Group>(null);
  const canvas = useThree((state) => state.gl.domElement);
  const captionBinding = useMemo(() => createMainlineANebulaCaptionBindingV638(canvas), [canvas]);
  const position = useMemo(() => new THREE.Vector3(...target.position), [target.position]);
  const worldPosition = useMemo(() => new THREE.Vector3(), []);
  const canonicalProducer = useCanonicalProducerV635("nebula", asset.objectId, "mainline-a3-nebula-visual", asset.sha256);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const material = useMemo(() => createMainlineANebulaImageMaterialV638(), []);
  const publishAttempt = useCallback((next: NebulaLoadAttemptV638) => {
    if (attemptRef.current === next) return;
    attemptRef.current = next;
    setAttempt(next);
  }, []);
  const renderObserver = useMemo(() => createNebulaRenderObserverV638({
    geometry, material, assetSha256: asset.sha256,
    read: () => ({ attempt: attemptRef.current, mesh: imageRef.current, texture: textureRef.current }),
    write: publishAttempt, producer: canonicalProducer,
  }), [asset.sha256, canonicalProducer, geometry, material, publishAttempt]);
  useCanonicalDisposableV635(geometry, "mainline-a-nebula-observation-plane", `${asset.objectId}-plane-geometry`);
  useCanonicalDisposableV635(material, "mainline-a-nebula-observation-plane", `${asset.objectId}-plane-material`);
  useEffect(() => {
    // A retry or invalidated draw cannot reopen an old inspection automatically.
    if (attempt.status !== "ready") setViewerOpen(false);
  }, [attempt.status]);
  useEffect(() => {
    material.map = texture;
    material.needsUpdate = true;
    return () => { material.map = null; material.needsUpdate = true; };
  }, [material, texture]);

  useEffect(() => {
    const abort = new AbortController();
    const number = ++attemptNumber.current;
    let active = true;
    let lease: MainlineANebulaSceneTextureLeaseV607 | null = null;
    const publish = (event: NebulaLoadEventV638) => {
      if (active) publishAttempt(transitionNebulaLoadAttemptV638(attemptRef.current, event));
    };
    const release = () => {
      textureRef.current = null;
      material.map = null;
      material.needsUpdate = true;
      releaseCanonicalTextureLeaseV635(lease?.release, asset.objectId);
      lease = null;
    };
    setTexture(null);
    publishAttempt(createNebulaLoadAttemptV638(number, new Date().toISOString()));
    canonicalProducer.loading();
    const cancel = () => {
      if (!active || abort.signal.aborted) return;
      publish({ type: "cancelled", attempt: number, at: new Date().toISOString() });
      abort.abort();
      release();
      setTexture(null);
      canonicalProducer.unobserved();
    };
    cancelAttempt.current = cancel;
    void loadMainlineANebulaSceneTextureV607(asset, abort.signal, {
      retry: request > 0,
      onPhase: (phase) => publish({ type: "phase", attempt: number, phase }),
    }).then((candidate) => {
      if (!active || abort.signal.aborted) { releaseCanonicalTextureLeaseV635(candidate.release, asset.objectId); return; }
      lease = candidate;
      textureRef.current = candidate.texture;
      setTexture(candidate.texture);
      publish({ type: "decoded", attempt: number, at: new Date().toISOString() });
    }).catch((error: unknown) => {
      if (active && !abort.signal.aborted) {
        const failure = classifyNebulaLoadErrorV638(error, "request");
        setTexture(null);
        publish({ type: "failed", attempt: number, at: new Date().toISOString(), error: failure });
        canonicalProducer.failed(failure.message);
      }
    });
    return () => {
      active = false;
      abort.abort();
      release();
      if (cancelAttempt.current === cancel) cancelAttempt.current = null;
    };
  }, [asset, canonicalProducer, material, publishAttempt, request]);

  useFrame(({ camera, viewport }) => {
    camera.updateMatrixWorld();
    billboardRef.current?.updateWorldMatrix(true, false);
    if (billboardRef.current) billboardRef.current.getWorldPosition(worldPosition);
    else worldPosition.copy(position);
    const baseFrame = mainlineANebulaSceneSizeV607(asset.dimensions, viewport.getCurrentViewport(camera, worldPosition));
    const { figure, measurement: measured } = captionBinding.read();
    const safe = measured ? resolveMainlineAJourneyViewportM4(measured.canvas.width, measured.canvas.height,
      runtimeSafeViewportRect(measured.canvas.width, measured.canvas.height)) : null;
    const measurement = measured && safe ? constrainMainlineANebulaCaptionMeasurementV638(measured, safe) : null;
    const baseProjection = measurement ? projectMainlineANebulaCaptionV638(camera, worldPosition, measurement.canvas, baseFrame.height) : null;
    const frame = fitMainlineANebulaPortraitFrameV638(baseFrame, baseProjection, measurement);
    const projection = baseProjection ? { ...baseProjection, preferredImageHeight: frame.height / baseProjection.unitsPerPixelY } : null;
    const layout = measurement && projection ? resolveMainlineANebulaCaptionLayoutV638({
      measurement, anchorY: projection.anchorY, anchorX: projection.anchorX, preferredImageHeight: projection.preferredImageHeight, hasImage: Boolean(texture),
    }) : null;
    applyMainlineANebulaCaptionFrameV638({
      image: imageRef.current, captionAnchor: captionAnchorRef.current,
      frame, projection, layout, captionMounted: figure !== null,
    });
    if (figure) applyMainlineANebulaCaptionLayoutV638(figure, layout);
    renderObserver.inspect(camera);
  });

  return (<>
    <NebulaParallaxLayers objectId={asset.objectId} position={target.position} visible={attempt.status === "ready" && Boolean(texture)} />
    <Billboard ref={billboardRef} position={target.position} userData={{
      atlasLayer: "mainline-a-nebula-observation-plane-v607",
      atlasObjectId: asset.objectId,
      atlasImageId: asset.imageId,
      atlasImageStatus: attempt.status,
      atlasPresentationOnly: true,
      atlasObservationImageClaim: true,
      atlasDepthReconstructionClaimed: false,
      atlasAngularSizeClaimed: false,
      atlasNakedEyeRepresentationClaimed: false,
      atlasScientificPayloadWriteback: false,
    }}>
      {texture ? <mesh ref={imageRef} renderOrder={MAINLINE_A_NEBULA_IMAGE_RENDER_ORDER_V638} raycast={() => null}
        geometry={geometry} material={material} dispose={null}
        onAfterRender={function (this: THREE.Mesh, _renderer, _scene, camera, drawnGeometry, drawnMaterial, group) {
          renderObserver.afterDraw(this, camera, drawnGeometry, drawnMaterial, group);
        }} /> : null}
      <group ref={captionAnchorRef}>
        <Html zIndexRange={[38, 0]} style={{ pointerEvents: "none", transform: "translateX(-50%)" }}>
          <figure
            ref={captionBinding.attach}
            aria-label={`${title}：观测图说明、版权与来源`}
            onWheel={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            // Drei Html shares the Canvas event host. Keyboard activation also
            // emits click, which must not trigger the canvas pointer-missed reset.
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) event.stopPropagation(); }}
            data-mainline-a-scene-nebula={asset.objectId}
            data-mainline-a-scene-image-status={attempt.status}
            data-mainline-a-scene-image-sha256={asset.sha256}
            data-mainline-a-scene-image-attempt={attempt.attempt}
            data-mainline-a-scene-image-phase={attempt.phase}
            data-mainline-a-scene-image-started-at={attempt.startedAt}
            data-mainline-a-scene-image-ended-at={attempt.endedAt ?? "pending"}
            data-mainline-a-scene-image-render-invalidated-at={attempt.renderInvalidatedAt ?? "none"}
            data-mainline-a-scene-image-error={attempt.errorCode ?? "none"}
            data-mainline-a-scene-human-rights-signoff="pending"
            data-mainline-a-scene-release-admission="candidate-only"
            className={captionStyles.figure}
          >
            <MainlineANebulaSceneCaption asset={asset} title={title} attempt={attempt} expanded={captionExpanded}
              onToggle={() => setCaptionExpanded((previous) => !previous)}
              onOpenViewer={() => setViewerOpen(true)} canOpenViewer={attempt.status === "ready" && Boolean(texture)}
              onCancel={() => cancelAttempt.current?.()} onRetry={() => setRequest((previous) => previous + 1)} />
            {viewerOpen && attempt.status === "ready" && texture?.image instanceof HTMLImageElement ?
              <MainlineANebulaViewerM3 asset={asset} title={title} image={texture.image} onClose={() => setViewerOpen(false)} /> : null}
          </figure>
        </Html>
      </group>
    </Billboard>
  </>);
}

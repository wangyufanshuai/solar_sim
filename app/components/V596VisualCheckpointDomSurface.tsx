"use client";

import {
  V596_VISUAL_CHECKPOINT_CANVAS_IDENTITY,
  V596_VISUAL_CHECKPOINT_CONSUMER,
  V596_VISUAL_CHECKPOINT_CONSUMER_RECEIPT_VERSION,
  V596_VISUAL_CHECKPOINT_RUNTIME_VERSION,
  deriveV596VisualCheckpointSimulationStateSha,
  visualCheckpointSimulationStateBindingV596,
  type V596VisualCheckpointConsumerReceipt,
  type V596VisualCheckpointRuntimeRequest,
} from "../lib/v596VisualCheckpointContract";

export default function V596VisualCheckpointDomSurface({
  request,
  receipt,
  blockedReason,
}: Readonly<{
  request: V596VisualCheckpointRuntimeRequest | null;
  receipt: V596VisualCheckpointConsumerReceipt | null;
  blockedReason: string;
}>) {
  const frame = request?.frame ?? receipt?.frame ?? null;
  const simulationStateSha256 = frame
    ? deriveV596VisualCheckpointSimulationStateSha(
      visualCheckpointSimulationStateBindingV596(frame),
    )
    : "pending";
  return (
    <section
      hidden
      data-atlas-v596-visual-checkpoint={V596_VISUAL_CHECKPOINT_RUNTIME_VERSION}
      data-atlas-v596-visual-checkpoint-candidate="v596"
      data-atlas-v596-visual-checkpoint-target={frame?.targetId ?? "pending"}
      data-atlas-v596-visual-checkpoint-archetype={frame?.archetype ?? "pending"}
      data-atlas-v596-visual-checkpoint-mode={frame?.mode ?? "pending"}
      data-atlas-v596-visual-checkpoint-sim-days={frame?.simDays ?? "pending"}
      data-atlas-v596-visual-checkpoint-paused={frame ? String(frame.paused) : "pending"}
      data-atlas-v596-visual-checkpoint-camera-preset={frame?.cameraPreset ?? "pending"}
      data-atlas-v596-visual-checkpoint-camera-distance={
        frame?.cameraDistanceSceneUnits ?? "pending"
      }
      data-atlas-v596-visual-checkpoint-camera-fov={frame?.cameraFovDegrees ?? "pending"}
      data-atlas-v596-visual-checkpoint-camera-near={frame?.cameraNear ?? "pending"}
      data-atlas-v596-visual-checkpoint-camera-far={frame?.cameraFar ?? "pending"}
      data-atlas-v596-visual-checkpoint-camera-state-sha256={
        receipt?.cameraStateSha256 ?? "pending"
      }
      data-atlas-v596-visual-checkpoint-simulation-state-sha256={
        receipt?.simulationStateSha256 ?? simulationStateSha256
      }
      data-atlas-v596-visual-checkpoint-asset-ready={
        frame ? String(frame.assetReady) : "false"
      }
      data-atlas-v596-visual-checkpoint-selected-target-ready={
        frame ? String(frame.selectedTargetReady) : "false"
      }
      data-atlas-v596-visual-checkpoint-blocked-reason={blockedReason || "none"}
      data-atlas-v596-visual-checkpoint-binding-status={
        request?.identity.bindingStatus ?? "pending"
      }
      data-atlas-v596-visual-checkpoint-source-set-sha256={
        request?.identity.sourceSetSha256 ?? "pending"
      }
      data-atlas-v596-visual-checkpoint-build-fingerprint={
        request?.identity.buildFingerprint ?? "pending"
      }
      data-atlas-v596-visual-checkpoint-id={request?.identity.checkpointId ?? "pending"}
      data-atlas-v596-visual-checkpoint-runtime-tier={
        request?.identity.runtimeTier ?? "pending"
      }
      data-atlas-v596-visual-checkpoint-formal-evidence="false"
      data-atlas-v596-visual-checkpoint-promotion="none"
      data-atlas-v596-visual-checkpoint-supplemental-only="true"
      data-atlas-v596-visual-checkpoint-formal-product-pointer="v263"
      data-atlas-v596-visual-checkpoint-parent-source-manifest-sha256={
        request?.identity.parentV595.sourceManifestSha256 ?? "pending"
      }
      data-atlas-v596-visual-checkpoint-parent-candidate-manifest-sha256={
        request?.identity.parentV595.candidateManifestSha256 ?? "pending"
      }
      data-atlas-v596-visual-checkpoint-parent-build-id={
        request?.identity.parentV595.buildId ?? "pending"
      }
      data-atlas-v596-visual-checkpoint-parent-deployment-id={
        request?.identity.parentV595.deploymentId ?? "pending"
      }
    >
      <div
        data-atlas-v596-visual-checkpoint-consumer={V596_VISUAL_CHECKPOINT_CONSUMER}
        data-atlas-v596-visual-checkpoint-runtime-consumed={String(Boolean(receipt))}
        data-atlas-v596-visual-checkpoint-render-state-sha256={
          receipt?.render.stateSha256 ?? "pending"
        }
        data-atlas-v596-visual-checkpoint-render-contract-sha256={
          receipt?.render.contractSha256 ?? "pending"
        }
        data-atlas-v596-visual-checkpoint-consumer-receipt-sha256={
          receipt?.receiptSha256 ?? "pending"
        }
        data-atlas-v596-visual-checkpoint-canvas-identity={
          receipt?.canvas.identity ?? V596_VISUAL_CHECKPOINT_CANVAS_IDENTITY
        }
        data-atlas-v596-visual-checkpoint-single-canvas-policy={
          receipt?.canvas.singleCanvasPolicy ?? "shared-main-canvas"
        }
        data-atlas-v596-visual-checkpoint-scientific-authority={
          receipt ? String(receipt.render.contractState.scientificAuthority) : "false"
        }
        data-atlas-v596-visual-checkpoint-measured-authority={
          receipt ? String(receipt.render.contractState.measuredAuthority) : "false"
        }
        data-atlas-v596-visual-checkpoint-gpu-authority={
          receipt ? String(receipt.render.contractState.gpuAuthority) : "false"
        }
        data-atlas-v596-visual-checkpoint-resolved-surface-authority={
          receipt ? String(receipt.render.contractState.resolvedSurfaceAuthority) : "false"
        }
        data-atlas-v596-visual-checkpoint-observation-texture-authority={
          receipt ? String(receipt.render.contractState.observationTextureAuthority) : "false"
        }
        data-atlas-v596-visual-checkpoint-radiative-transfer-authority={
          receipt ? String(receipt.render.contractState.radiativeTransferAuthority) : "false"
        }
        data-atlas-v596-visual-checkpoint-grmhd-authority={
          receipt ? String(receipt.render.contractState.grmhdAuthority) : "false"
        }
        data-atlas-v596-visual-checkpoint-scientific-payload-writeback={
          receipt ? String(receipt.render.contractState.scientificPayloadWriteback) : "false"
        }
        data-atlas-v596-visual-checkpoint-ready={String(Boolean(receipt))}
      />
      {receipt ? (
        <script
          type="application/json"
          data-atlas-v596-visual-checkpoint-consumer-receipt={
            V596_VISUAL_CHECKPOINT_CONSUMER_RECEIPT_VERSION
          }
        >
          {JSON.stringify(receipt)}
        </script>
      ) : null}
    </section>
  );
}

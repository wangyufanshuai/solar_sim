"use client";

import { ATLAS_V596_BUILD_IDENTITY } from "../lib/atlasV596BuildIdentity";
import {
  V596_FORMAL_EVIDENCE_RECEIPT_VERSION,
  V596_FORMAL_EVIDENCE_VERSION,
  createV596FormalEvidenceReceipt,
} from "../lib/v596FormalEvidenceContract";
import type { V596VisualCheckpointConsumerReceipt } from "../lib/v596VisualCheckpointContract";

export default function V596FormalEvidenceDomSurface({
  receipt,
}: Readonly<{ receipt: V596VisualCheckpointConsumerReceipt | null }>) {
  const formalReceipt = receipt && ATLAS_V596_BUILD_IDENTITY.bindingStatus === "bound"
    ? createV596FormalEvidenceReceipt(receipt, ATLAS_V596_BUILD_IDENTITY)
    : null;
  return (
    <section
      hidden
      data-atlas-v596-formal-evidence={V596_FORMAL_EVIDENCE_VERSION}
      data-atlas-v596-formal-evidence-ready={String(Boolean(formalReceipt))}
      data-atlas-v596-source-manifest-sha256={
        ATLAS_V596_BUILD_IDENTITY.sourceManifestSha256
      }
      data-atlas-v596-candidate-manifest-sha256={
        ATLAS_V596_BUILD_IDENTITY.candidateManifestSha256
      }
      data-atlas-v596-build-fingerprint={ATLAS_V596_BUILD_IDENTITY.buildFingerprint}
      data-atlas-v596-build-id={ATLAS_V596_BUILD_IDENTITY.buildId}
      data-atlas-v596-deployment-id={ATLAS_V596_BUILD_IDENTITY.deploymentId}
      data-atlas-v596-delivery-tier={ATLAS_V596_BUILD_IDENTITY.deliveryTier}
      data-atlas-v596-identity-binding-status={ATLAS_V596_BUILD_IDENTITY.bindingStatus}
      data-atlas-v596-formal-evidence-claim="true"
      data-atlas-v596-formal-evidence-supplemental-only="false"
      data-atlas-v596-formal-evidence-promotion="none"
      data-atlas-v596-formal-product-pointer="v263"
    >
      {formalReceipt ? (
        <script
          type="application/json"
          data-atlas-v596-formal-evidence-consumer-receipt={
            V596_FORMAL_EVIDENCE_RECEIPT_VERSION
          }
        >
          {JSON.stringify(formalReceipt)}
        </script>
      ) : null}
    </section>
  );
}


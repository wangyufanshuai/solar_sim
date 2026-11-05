from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
ARTIFACT = ROOT / "dist/science/kerr-fixed-band-stokes-v520/stokes-payload.json"
TRANSIENT = {
    "generatedAt",
    "artifactSha256",
    "payloadSha256",
    "evidenceSha256",
    "pointerSha256",
    "stageChainSha256",
}


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {
            key: canonicalize(value[key])
            for key in sorted(value)
            if key not in TRANSIENT
        }
    return value


def canonical_sha(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(
            canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True
        ).encode("utf-8")
    ).hexdigest()


class KerrFixedBandStokesV520Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))

    def test_canonical_identity_and_coverage(self) -> None:
        artifact = self.artifact
        self.assertEqual(canonical_sha(artifact), artifact["artifactSha256"])
        self.assertEqual(artifact["counts"]["rowCount"], 24)
        self.assertEqual(len(artifact["rows"]), 24)
        self.assertEqual(
            {row["transportMethod"] for row in artifact["rows"]},
            {"walker-penrose", "independent-ks-parallel-transport"},
        )

    def test_stokes_and_transport_limits(self) -> None:
        maxima = self.artifact["maxima"]
        limits = self.artifact["limits"]
        self.assertLess(
            float(maxima["linearFractionResidual"]),
            float(limits["linearFractionResidual"]),
        )
        self.assertLess(
            float(maxima["evpaReconstructionDeg"]),
            float(limits["evpaReconstructionDeg"]),
        )
        self.assertLess(
            float(maxima["wpKsEvpaDifferenceDeg"]),
            float(limits["wpKsEvpaDifferenceDeg"]),
        )
        self.assertLess(
            float(maxima["wpKsNormalizedQDifference"]),
            float(limits["wpKsNormalizedStokesDifference"]),
        )
        self.assertLess(
            float(maxima["wpKsNormalizedUDifference"]),
            float(limits["wpKsNormalizedStokesDifference"]),
        )
        self.assertEqual(float(maxima["physicalConeViolation"]), 0.0)

    def test_model_only_boundary(self) -> None:
        artifact = self.artifact
        self.assertEqual(artifact["counts"]["measuredStokesRowCount"], 0)
        self.assertEqual(artifact["counts"]["circularStokesRowCount"], 0)
        self.assertFalse(artifact["boundary"]["measuredPolarimeterAvailable"])
        self.assertFalse(artifact["boundary"]["circularPolarizationAvailable"])
        self.assertFalse(artifact["boundary"]["faradayRotationAvailable"])
        self.assertFalse(artifact["boundary"]["scienceRasterAuthorityAvailable"])
        self.assertEqual(
            artifact["boundary"]["denseCampaignStatus"], "incomplete-0-of-49"
        )


if __name__ == "__main__":
    unittest.main()

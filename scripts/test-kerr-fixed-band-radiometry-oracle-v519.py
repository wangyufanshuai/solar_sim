from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
ARTIFACT = ROOT / "dist/science/kerr-fixed-band-radiometry-oracle-v519/oracle.json"
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


class KerrFixedBandRadiometryOracleV519Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))

    def test_canonical_identity_and_counts(self) -> None:
        artifact = self.artifact
        self.assertEqual(canonical_sha(artifact), artifact["artifactSha256"])
        self.assertEqual(artifact["counts"]["rayCount"], 4)
        self.assertEqual(artifact["counts"]["rowCount"], 12)
        self.assertEqual(len(artifact["rows"]), 12)

    def test_independent_multiprecision_limits(self) -> None:
        maxima = self.artifact["maxima"]
        limits = self.artifact["limits"]
        self.assertLess(
            float(maxima["energyRadianceRelativeDifference"]),
            float(limits["energyRadianceRelativeDifference"]),
        )
        self.assertLess(
            float(maxima["photonRadianceRelativeDifference"]),
            float(limits["photonRadianceRelativeDifference"]),
        )
        self.assertLess(
            float(maxima["meanFrequencyRelativeDifference"]),
            float(limits["meanFrequencyRelativeDifference"]),
        )
        self.assertLess(
            float(maxima["g3TransferRelativeDifference"]),
            float(limits["transferCoefficientRelativeDifference"]),
        )
        self.assertLess(
            float(maxima["g4TransferRelativeDifference"]),
            float(limits["transferCoefficientRelativeDifference"]),
        )

    def test_model_prediction_boundary(self) -> None:
        boundary = self.artifact["boundary"]
        self.assertTrue(boundary["modelPredictionOnly"])
        self.assertFalse(boundary["measuredEmitterSpectrumAvailable"])
        self.assertFalse(boundary["detectorThroughputAvailable"])
        self.assertFalse(boundary["observedDetectorCountsAvailable"])
        self.assertFalse(boundary["scienceRasterAuthorityAvailable"])
        self.assertEqual(boundary["denseCampaignStatus"], "incomplete-0-of-49")
        self.assertEqual(boundary["formalProductPointer"], "v263")


if __name__ == "__main__":
    unittest.main()

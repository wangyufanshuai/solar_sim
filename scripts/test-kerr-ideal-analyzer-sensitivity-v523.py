from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
ARTIFACT = ROOT / "dist/science/kerr-ideal-analyzer-sensitivity-v523/projection.json"
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


class KerrIdealAnalyzerSensitivityV523Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))

    def test_canonical_projection_and_reconstruction_coverage(self) -> None:
        artifact = self.artifact
        self.assertEqual(canonical_sha(artifact), artifact["artifactSha256"])
        self.assertEqual(artifact["counts"]["sourceScenarioRowCount"], 216)
        self.assertEqual(artifact["counts"]["modulationRowCount"], 864)
        self.assertEqual(artifact["counts"]["reconstructionCount"], 216)
        self.assertEqual(artifact["counts"]["channelEnvelopeCount"], 96)
        self.assertEqual(canonical_sha(artifact["analyzerPlan"]), artifact["analyzerPlanSha256"])

    def test_all_algebraic_residuals_are_below_frozen_limit(self) -> None:
        artifact = self.artifact
        limit = float(artifact["limits"]["idealAlgebraResidual"])
        for key, value in artifact["maxima"].items():
            if key == "nonnegativeBeamViolation":
                self.assertEqual(float(value), 0.0)
            else:
                self.assertLess(float(value), limit)

    def test_ideal_operator_does_not_claim_detector_or_measurement_authority(self) -> None:
        artifact = self.artifact
        self.assertTrue(artifact["operator"]["idealOnly"])
        self.assertFalse(artifact["qualification"]["measuredInstrumentQualified"])
        self.assertFalse(artifact["qualification"]["detectorProjectionQualified"])
        self.assertFalse(artifact["qualification"]["scienceAuthorityPromotionAllowed"])
        self.assertEqual(artifact["counts"]["expectedElectronCountRowCount"], 0)
        self.assertEqual(artifact["counts"]["observedCountRowCount"], 0)

    def test_dense_and_formal_boundaries_remain_closed(self) -> None:
        artifact = self.artifact
        self.assertFalse(artifact["boundary"]["instrumentMuellerMatrixAvailable"])
        self.assertFalse(artifact["boundary"]["scienceRasterAuthorityAvailable"])
        self.assertEqual(artifact["boundary"]["denseCampaignStatus"], "incomplete-0-of-49")
        self.assertEqual(artifact["boundary"]["formalProductPointer"], "v263")


if __name__ == "__main__":
    unittest.main()

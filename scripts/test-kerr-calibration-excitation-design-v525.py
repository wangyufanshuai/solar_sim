from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
ARTIFACT = ROOT / "dist/science/kerr-calibration-excitation-design-v525/design.json"
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
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    ).hexdigest()


class KerrCalibrationExcitationDesignV525Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))

    def test_canonical_identity_and_exhaustive_pair_count(self) -> None:
        artifact = self.artifact
        self.assertEqual(canonical_sha(artifact), artifact["artifactSha256"])
        self.assertEqual(artifact["counts"]["candidateConstraintCount"], 8)
        self.assertEqual(artifact["counts"]["candidatePairCount"], 28)
        self.assertEqual(artifact["counts"]["fullRankPairCount"], 9)

    def test_two_constraints_are_minimal_and_remove_both_null_directions(self) -> None:
        selected = self.artifact["selectedDesign"]
        self.assertEqual(selected["constraintIds"], ["delta-q-pair", "delta-u-pair"])
        self.assertEqual(selected["minimumConstraintCount"], 2)
        self.assertEqual(selected["rank"], 6)
        self.assertEqual(selected["nullity"], 0)
        self.assertEqual(selected["nullspaceCouplingRank"], 2)
        self.assertTrue(selected["uniqueDOptimalWithinCandidateSet"])

    def test_condition_and_multiprecision_residuals_are_real(self) -> None:
        artifact = self.artifact
        self.assertAlmostEqual(float(artifact["selectedDesign"]["conditionNumber"]), 1 + 2 ** 0.5)
        self.assertAlmostEqual(float(artifact["selectedDesign"]["gramDeterminant"]), 4.0)
        limit = float(artifact["limits"]["multiprecisionResidual"])
        self.assertTrue(all(float(value) < limit for value in artifact["maxima"].values()))

    def test_design_does_not_replace_measured_acquisition(self) -> None:
        boundary = self.artifact["acquisitionBoundary"]
        self.assertEqual(boundary["algebraicConstraintCount"], 2)
        self.assertEqual(boundary["measuredFileContractCount"], 6)
        self.assertTrue(boundary["countsAreDistinctContracts"])
        self.assertFalse(boundary["designReplacesMeasuredAcquisition"])
        self.assertEqual(boundary["readyMeasuredFileCount"], 0)
        self.assertFalse(self.artifact["qualification"]["measuredInstrumentQualified"])


if __name__ == "__main__":
    unittest.main()

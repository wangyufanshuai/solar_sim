from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path
from typing import Any


ROOT = Path.cwd()
ARTIFACT = ROOT / "dist/science/kerr-calibration-uncertainty-transfer-v526/transfer.json"
TRANSIENT = {"generatedAt", "artifactSha256", "payloadSha256", "evidenceSha256", "pointerSha256", "stageChainSha256"}


def canonicalize(value: Any) -> Any:
    if isinstance(value, list):
        return [canonicalize(entry) for entry in value]
    if isinstance(value, dict):
        return {key: canonicalize(value[key]) for key in sorted(value) if key not in TRANSIENT}
    return value


def canonical_sha(value: Any) -> str:
    return hashlib.sha256(json.dumps(canonicalize(value), ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")).hexdigest()


class KerrCalibrationUncertaintyTransferV526Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.artifact = json.loads(ARTIFACT.read_text(encoding="utf-8"))

    def test_canonical_identity_and_transfer_dimensions(self) -> None:
        artifact = self.artifact
        self.assertEqual(canonical_sha(artifact), artifact["artifactSha256"])
        self.assertEqual(artifact["counts"]["inputChannelCount"], 6)
        self.assertEqual(artifact["counts"]["outputParameterCount"], 6)
        self.assertEqual(artifact["counts"]["observableParameterCount"], 2)

    def test_unit_variance_decomposes_exactly_between_science_and_calibration(self) -> None:
        transfer = self.artifact["unitVarianceTransfer"]
        self.assertEqual(transfer["scienceContribution"], [["0.5", "0.0"], ["0.0", "0.5"]])
        self.assertEqual(transfer["calibrationContribution"], [["0.5", "0.0"], ["0.0", "0.5"]])
        self.assertEqual(transfer["total"], [["1.0", "0.0"], ["0.0", "1.0"]])
        self.assertTrue(all(row["physicalVarianceAvailable"] is False for row in transfer["varianceRows"]))

    def test_exhaustive_unit_box_matches_closed_form_bound(self) -> None:
        bounded = self.artifact["boundedUnitErrorTransfer"]
        self.assertEqual(bounded["vertexCount"], 64)
        self.assertAlmostEqual(float(bounded["maximumQOverIAbsoluteCoefficient"]), 1 + 2 ** -0.5)
        self.assertAlmostEqual(float(bounded["maximumUOverIAbsoluteCoefficient"]), 1 + 2 ** -0.5)
        self.assertAlmostEqual(float(bounded["maximumJointL2Coefficient"]), 1 + 2 ** 0.5)
        self.assertFalse(bounded["physicalErrorBoundAvailable"])

    def test_physical_uncertainty_and_products_remain_unavailable(self) -> None:
        artifact = self.artifact
        self.assertFalse(artifact["qualification"]["physicalUncertaintyQualified"])
        self.assertFalse(artifact["acquisitionBoundary"]["numericalScienceErrorBarsAvailable"])
        self.assertEqual(artifact["acquisitionBoundary"]["readyMeasuredFileCount"], 0)
        self.assertFalse(artifact["boundary"]["scienceRasterAuthorityAvailable"])


if __name__ == "__main__":
    unittest.main()

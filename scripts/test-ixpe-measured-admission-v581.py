from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/build-ixpe-measured-admission-v581.py"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_ixpe_v581_tests", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load v581 IXPE admission")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V581 = load_module()


class IxpeMeasuredAdmissionV581Tests(unittest.TestCase):
    def test_combined_real_package_is_integrity_qualified_but_not_measured(self) -> None:
        admission = V581.build()
        self.assertEqual(len(admission["files"]), 16)
        self.assertTrue(admission["qualification"]["candidatePackageIntegrityQualified"])
        self.assertTrue(admission["qualification"]["primaryDetectorPackQualified"])
        self.assertTrue(admission["qualification"]["independentHoldoutPackQualified"])
        self.assertFalse(admission["qualification"]["measuredAuthorityGranted"])
        self.assertIn("independent-reviewer-attestation-missing", admission["blockers"])
        self.assertIn("polarization-response-pack-not-acquired", admission["blockers"])

    def test_no_synthetic_or_detector_row_writeback_boundary(self) -> None:
        admission = V581.build()
        self.assertFalse(admission["boundary"]["detectorRowsRead"])
        self.assertFalse(admission["boundary"]["syntheticValuesWritten"])
        self.assertFalse(admission["boundary"]["expectedCountsWritten"])
        self.assertFalse(admission["qualification"]["sciencePayloadWritebackAllowed"])
        self.assertTrue(admission["mutationAudit"]["allRejected"])


if __name__ == "__main__":
    unittest.main()

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/build-ixpe-measured-admission-v570.py"


def load_module():
    spec = importlib.util.spec_from_file_location("orbit_atlas_ixpe_v570_tests", SOURCE)
    if spec is None or spec.loader is None:
        raise RuntimeError("unable to load IXPE v570 admission")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


V570 = load_module()


class IxpeMeasuredAdmissionV570Tests(unittest.TestCase):
    def test_all_mutations_are_rejected(self) -> None:
        audit = V570.mutation_audit()
        self.assertEqual(audit["attempted"], 10)
        self.assertEqual(audit["rejected"], 10)
        self.assertTrue(audit["allRejected"])

    def test_path_traversal_is_rejected(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "path-traversal"):
            V570.safe_file("../event.fits")

    def test_admission_cannot_grant_without_response_and_review(self) -> None:
        result = V570.build()
        self.assertIn("independent-reviewer-attestation-missing", result["blockers"])
        self.assertIn("response-application-not-replayed", result["blockers"])
        self.assertFalse(result["qualification"]["measuredAuthorityGranted"])
        self.assertFalse(result["boundary"]["syntheticValuesWritten"])


if __name__ == "__main__":
    unittest.main()

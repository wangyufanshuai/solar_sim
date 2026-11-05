from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("fetch-relativity-reference-v287.py")
SPEC = importlib.util.spec_from_file_location("atlas_reference_v287", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class RelativityReferenceV287Tests(unittest.TestCase):
    def test_command_one_contains_exact_33_tdb_epochs(self):
        url = MODULE.query_url()
        self.assertEqual(len(MODULE.EPOCHS), 33)
        self.assertIn("COMMAND=%271%27", url)
        self.assertIn("TIME_TYPE=%27TDB%27", url)
        self.assertIn("CENTER=%27%400%27", url)

    def test_mercury_command_alias_accepts_reported_199(self):
        name, identifier = MODULE.parse_identity("Target body name: Mercury Barycenter (199)\n")
        self.assertEqual(name, "Mercury Barycenter")
        self.assertEqual(identifier, 199)

    def test_other_body_identity_fails_closed(self):
        with self.assertRaisesRegex(RuntimeError, "identity mismatch"):
            MODULE.parse_identity("Target body name: Venus Barycenter (299)\n")

    def test_source_contains_one_network_call_and_no_target_loop(self):
        source = SCRIPT.read_text(encoding="utf-8")
        self.assertEqual(source.count("urllib.request.urlopen("), 1)
        self.assertNotIn("for target", source)
        self.assertIn("cannot be retried", source)


if __name__ == "__main__":
    unittest.main()

from __future__ import annotations

import hashlib
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class KerrDenseCampaignV8Contract(unittest.TestCase):
    def test_controller_compiles(self) -> None:
        source = (ROOT / "scripts/run-kerr-dense-campaign-v8.py").read_text(encoding="utf-8")
        compile(source, "run-kerr-dense-campaign-v8.py", "exec")

    def test_frozen_v6_runner_is_unchanged(self) -> None:
        digest = hashlib.sha256((ROOT / "scripts/run-kerr-dense-shards-v6.py").read_bytes()).hexdigest()
        self.assertEqual(digest, "b56f2e1f6854ad392820a6a0a6c2757dbae93119858bae0e10fe04c1113776fe")

    def test_controller_is_serial_and_fail_closed(self) -> None:
        source = (ROOT / "scripts/run-kerr-dense-campaign-v8.py").read_text(encoding="utf-8")
        self.assertIn("for index in range(plan[\"shardCount\"])", source)
        self.assertIn("no automatic retry is permitted", source)
        self.assertIn("os.O_EXCL", source)
        self.assertNotIn("ThreadPoolExecutor", source)
        self.assertNotIn("ProcessPoolExecutor", source)


if __name__ == "__main__":
    unittest.main()

from __future__ import annotations

import hashlib
import json
import math
import struct
import unittest
from pathlib import Path

import spiceypy as spice

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "public/data/spice-ephemeris-v1-manifest.json"
BINARY_PATH = ROOT / "public/data/spice-ephemeris-v1.bin"
KERNEL_DIR = ROOT / ".cache/spice"
AU_KM = 149_597_870.7
DAY_SECONDS = 86_400.0


class SpiceToolchainTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        raw = BINARY_PATH.read_bytes()
        cls.values = struct.unpack(f"<{len(raw) // 8}d", raw)
        for name in ("naif0012.tls", "pck00011.tpc", "gm_de440.tpc", "de442s.bsp"):
            kernel = KERNEL_DIR / name
            if not kernel.exists():
                raise unittest.SkipTest("Run npm run fetch:spice before direct SpiceyPy validation")
            spice.furnsh(str(kernel))

    @classmethod
    def tearDownClass(cls) -> None:
        spice.kclear()

    def table_state(self, body_index: int, sim_day: float) -> tuple[list[float], list[float]]:
        manifest = self.manifest
        raw_index = (sim_day - manifest["startSimDay"]) / manifest["stepDays"]
        index = max(0, min(manifest["rowCount"] - 2, math.floor(raw_index)))
        next_index = index + 1
        t = raw_index - index
        h = manifest["stepDays"]
        stride = manifest["rowCount"] * 6
        a = body_index * stride + index * 6
        b = body_index * stride + next_index * 6
        position, velocity = [], []
        for axis in range(3):
            p0, p1 = self.values[a + axis], self.values[b + axis]
            v0, v1 = self.values[a + 3 + axis], self.values[b + 3 + axis]
            t2, t3 = t * t, t * t * t
            position.append(
                (2 * t3 - 3 * t2 + 1) * p0
                + (t3 - 2 * t2 + t) * h * v0
                + (-2 * t3 + 3 * t2) * p1
                + (t3 - t2) * h * v1
            )
            velocity.append(
                (
                    (6 * t2 - 6 * t) * p0
                    + (3 * t2 - 4 * t + 1) * h * v0
                    + (-6 * t2 + 6 * t) * p1
                    + (3 * t2 - 2 * t) * h * v1
                )
                / h
            )
        return position, velocity

    def test_checksum_and_shape(self) -> None:
        raw = BINARY_PATH.read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(), self.manifest["binarySha256"])
        self.assertEqual(
            len(raw),
            len(self.manifest["bodyOrder"]) * self.manifest["rowCount"] * 6 * 8,
        )

    def test_random_epoch_interpolation_against_spiceypy(self) -> None:
        target_names = {
            "earth": "EARTH",
            "venus": "VENUS BARYCENTER",
            "jupiter": "JUPITER BARYCENTER",
            "saturn": "SATURN BARYCENTER",
        }
        sample_days = [12.375, 713.125, 2019.875, 3988.625]
        for body_id, target_name in target_names.items():
            body_index = self.manifest["bodyOrder"].index(body_id)
            for sim_day in sample_days:
                position, velocity = self.table_state(body_index, sim_day)
                et = spice.str2et(f"JD {self.manifest['epochJdTdb'] + sim_day} TDB")
                direct, _ = spice.spkezr(target_name, et, "ECLIPJ2000", "NONE", "SUN")
                position_error_km = math.dist(
                    [component * AU_KM for component in position],
                    direct[:3],
                )
                velocity_error_mps = 1000 * math.dist(
                    [component * AU_KM / DAY_SECONDS for component in velocity],
                    direct[3:],
                )
                self.assertLess(position_error_km, 10)
                self.assertLess(velocity_error_mps, 0.01)


if __name__ == "__main__":
    unittest.main(verbosity=2)

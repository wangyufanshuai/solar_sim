from __future__ import annotations

import hashlib
import math
import unittest
from pathlib import Path

from build_kerr_finite_observer_screen_v8_import import build_manifest
from kerr_finite_observer_separatrix_v8 import (
    KerrFiniteObserverSeparatrixV8,
    finite_zamo_screen_point,
    schwarzschild_screen_radius,
)

ROOT = Path(__file__).resolve().parents[1]


class KerrFiniteObserverSeparatrixV8Tests(unittest.TestCase):
    def test_frozen_v5_v6_v7_bytes_are_unchanged(self) -> None:
        expected = {
            "scripts/run-kerr-dense-shards-v6.py": "b56f2e1f6854ad392820a6a0a6c2757dbae93119858bae0e10fe04c1113776fe",
            "dist/science/kerr-dense-screen-v5.json": "0eaa2d3e746d973155bf08fb0866452dbcd6e5d5341b246bc148f4bbd3c1c6cf",
            "dist/science/kerr-dense-gate-v7.json": "47e0c37faeadf96374bf12465bec9f2b616e6cf86fd22056477c76ee68366927",
        }
        for relative, digest in expected.items():
            self.assertEqual(hashlib.sha256((ROOT / relative).read_bytes()).hexdigest(), digest)

    def test_schwarzschild_finite_distance_radius(self) -> None:
        observer_radius = 50.0
        mapping = KerrFiniteObserverSeparatrixV8(0.0, observer_radius, math.pi / 2.0)
        expected = schwarzschild_screen_radius(observer_radius)
        for index in range(16):
            point = mapping.point_at_angle(2.0 * math.pi * index / 16.0)
            self.assertLess(abs(math.hypot(point.screen_x, point.screen_y) - expected), 1e-14)

    def test_finite_zamo_round_trip_and_spherical_invariants(self) -> None:
        mapping = KerrFiniteObserverSeparatrixV8(0.9, 50.0, math.radians(70.0))
        for pair in (0, 128, 256, 384, 511):
            point = mapping.point_at_angle(2.0 * math.pi * (pair + 0.5) / 512.0)
            self.assertLess(point.observer_null_constraint, 1e-12)
            self.assertLess(point.radial_potential_residual, 1e-12)
            self.assertLess(point.radial_derivative_residual, 1e-12)
            self.assertLess(point.constants_round_trip_relative_error, 1e-12)

    def test_asymptotic_projective_sign_convention(self) -> None:
        spin = 0.9
        theta = math.radians(70.0)
        point = finite_zamo_screen_point(spin, 1e7, theta, 2.5, 1)
        # Project screen X is local +azimuthal slope. Bardeen alpha=-xi/sin(theta),
        # therefore r*screenX approaches -alpha=xi/sin(theta).
        self.assertLess(abs(1e7 * point.screen_x - point.xi / math.sin(theta)), 2e-5)
        beta = math.sqrt(
            point.eta
            + spin * spin * math.cos(theta) ** 2
            - point.xi * point.xi / math.tan(theta) ** 2
        )
        self.assertLess(abs(1e7 * point.screen_y - beta), 2e-5)

    def test_full_manifest_is_unique_continuous_and_deterministic(self) -> None:
        first = build_manifest()
        second = build_manifest()
        self.assertEqual(first, second)
        self.assertEqual(first["counts"], {
            "lowDiscrepancy": 2048,
            "criticalCenters": 512,
            "criticalBrackets": 1024,
        })
        centers = first["criticalCenters"]
        self.assertEqual(len({row["pair"] for row in centers}), 512)
        radii = [row["screenRadius"] for row in centers]
        cyclic_steps = [abs(radii[(index + 1) % 512] - radii[index]) for index in range(512)]
        self.assertLess(max(cyclic_steps), 0.01)
        for row in centers:
            angle_error = abs(math.atan2(
                math.sin(math.atan2(row["screenY"], row["screenX"]) - row["angleRad"]),
                math.cos(math.atan2(row["screenY"], row["screenX"]) - row["angleRad"]),
            ))
            self.assertLess(angle_error, 1e-11)


if __name__ == "__main__":
    unittest.main()


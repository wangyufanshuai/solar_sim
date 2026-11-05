"""Focused invariant tests for the offline Carter/Mino v6 reference."""

from __future__ import annotations

import importlib.util
import math
import unittest
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]


def load(name: str, relative: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {relative}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


observer = load("atlas_test_kerr_observer_v5", "scripts/kerr_observer_frame_v5.py")
carter = load("atlas_test_kerr_carter_v6", "scripts/run-kerr-carter-mino-reference-v6.py")


class CarterMinoReferenceV6Tests(unittest.TestCase):
    def test_shared_zamo_constants_satisfy_null_separated_potentials(self):
        spin = 0.9
        radius = 50.0
        theta = math.radians(70.0)
        frame = observer.zamo_bl_phase_space(spin, radius, theta, np.array([-1.0, 0.12, -0.08]))
        radial, polar, delta, _ = carter.potentials(
            radius,
            theta,
            spin,
            frame["energy"],
            frame["axialAngularMomentum"],
            frame["carterQ"],
        )
        radial_rate = delta * frame["covector"][1]
        polar_rate = frame["covector"][2]
        self.assertLess(abs(radial_rate * radial_rate - radial) / max(1.0, abs(radial)), 1e-12)
        self.assertLess(abs(polar_rate * polar_rate - polar) / max(1.0, abs(polar)), 1e-12)
        self.assertLess(abs(frame["nullConstraint"]), 1e-12)

    def test_projected_segments_report_pre_projection_release_residual(self):
        values = []
        for direction in (
            np.array([-1.0, -0.18, -0.18]),
            np.array([-1.0, 0.0, 0.0]),
            np.array([-1.0, 0.18, 0.18]),
        ):
            first = carter.integrate_ray(0.9, 50.0, math.radians(70.0), direction, 1e-11, 1e-13, 0.02, 20.0, 80.0)
            second = carter.integrate_ray(0.9, 50.0, math.radians(70.0), direction, 1e-11, 1e-13, 0.02, 20.0, 80.0)
            self.assertEqual(carter.canonical_hash(first), carter.canonical_hash(second))
            self.assertGreater(first["projectionCount"], 0)
            self.assertEqual(
                first["projectionPolicy"],
                "short-segment-pre-residual-then-carter-first-integral-projection",
            )
            values.append(first["nullConstraint"])
        self.assertLess(max(values), 1e-10)


if __name__ == "__main__":
    unittest.main()

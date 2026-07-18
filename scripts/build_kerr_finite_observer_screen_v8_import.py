"""Import bridge for the hyphenated V8 screen builder used by unittest."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

PATH = Path(__file__).with_name("build-kerr-finite-observer-screen-v8.py")
SPEC = importlib.util.spec_from_file_location("atlas_kerr_finite_observer_screen_v8", PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"cannot import {PATH}")
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)

build_manifest = MODULE.build_manifest


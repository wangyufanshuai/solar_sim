"""Independent reader for the bounded native SBP/RK4 checkpoint, not a solver.

SHA-256 detects corruption/mismatched identity; it is not authentication and
does not prove that an otherwise well-formed state was produced by evolution.
This format deliberately does not extend the legacy periodic/halo validator.
"""

from __future__ import annotations

import hashlib
import io
import struct

import numpy as np

from .fo_ccz4 import FOCCZ4_VARIABLE_ORDER

MAGIC = b"NR-SBP42-CKPT-1\n"
METHOD = "nr-fo-ccz4-sbp42-analytic-sat-rk4-no-projection-v1"
KERNEL = "nr-k3-cpp-sbp42-sat-rk4-shadow"
LIMIT = 32 * 1024**2
CONTRACT = "canonical58;G=c=1;cartesian3d;SBP42;analyticSAT;RK4;no-projection;f=3alphaChi;mu=.2Chi;tau=1;strict-fp"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def binding(source, executable, blas, openmp):
    for value in (source, executable, blas, openmp):
        require(len(value) == 64 and all(c in "0123456789abcdef" for c in value), "identity SHA256 required")
    return (
        f"release=solar-sim-mainline-a\nmethod={METHOD}\nkernel={KERNEL}\nversion=0.1.0\n"
        f"source={source}\nexe={executable}\nblas={blas}\nopenmp={openmp}\ncontract={CONTRACT}\n"
        f"variables={','.join(FOCCZ4_VARIABLE_ORDER)}\n"
    ).encode("ascii")


def read_plan(raw):
    require(0 < len(raw) <= 16 * 1024**2, "bounded plan required")
    stream = io.BytesIO(raw)

    def line():
        value = stream.readline(513)
        require(len(value) <= 512 and value.endswith(b"\n"), "bounded complete header required")
        return value.decode("ascii").split()

    def integer(value):
        require(value.isascii() and value.isdecimal(), "unsigned integer required")
        return int(value)

    def fields(shape):
        size = 58 * int(np.prod(shape)) * 8
        data = stream.read(size)
        require(len(data) == size, "truncated fields")
        values = np.frombuffer(data, dtype="<f8").reshape((58, *shape))
        require(np.isfinite(values).all(), "finite fields required")
        return values

    header = line()
    require(len(header) == 14 and header[:2] == ["nr-native-rk4-input-v1", "58"], "qualified plan header required")
    shape = tuple(integer(x) for x in header[2:5])
    require(all(9 <= n <= 17 for n in shape), "bounded grid required")
    lower, upper = tuple(map(float, header[5:8])), tuple(map(float, header[8:11]))
    require(all(np.isfinite(a) and np.isfinite(b) and b > a for a, b in zip(lower, upper)), "finite ordered domain required")
    start, steps, dt = integer(header[11]), integer(header[12]), float(header[13])
    require(1 <= steps <= 4 and start + steps <= 2**52 and np.isfinite(dt) and dt > 0, "bounded steps and dt required")
    spacing = tuple((b - a) / (n - 1) for a, b, n in zip(lower, upper, shape))
    require(all(np.isfinite(x) and x > 0 for x in spacing), "finite spacing required")
    initial = fields(shape)
    targets = []
    for tick in range(2 * start, 2 * (start + steps) + 1):
        label = line()
        require(len(label) == 2 and label[0] == "face-targets-v1" and integer(label[1]) == tick, "exact boundary label required")
        targets.append([fields(tuple(shape[d] for d in range(3) if d != axis)) for axis in range(3) for _ in range(2)])
    require(stream.read() == b"", "trailing plan bytes")
    return dict(shape=shape, lower=lower, upper=upper, spacing=spacing, start=start, steps=steps, dt=dt, initial=initial, targets=targets)


def decode(raw, expected_binding, expected_plan_sha):
    require(80 <= len(raw) <= LIMIT, "checkpoint size bound")
    body, checksum = raw[:-32], raw[-32:]
    require(hashlib.sha256(body).digest() == checksum, "checkpoint SHA256 mismatch")
    stream = io.BytesIO(body)

    def take(count):
        require(count <= len(body) - stream.tell(), "truncated checkpoint field")
        return stream.read(count)

    def number():
        return struct.unpack("<Q", take(8))[0]

    require(take(16) == MAGIC, "checkpoint method magic mismatch")
    length = number()
    require(length <= 4096, "binding length bound")
    require(take(length) == expected_binding, "checkpoint binding mismatch")
    step = number()
    length = number()
    require(length <= 16 * 1024**2, "plan size bound")
    plan_raw = take(length)
    require(sha(plan_raw) == expected_plan_sha, "origin plan SHA256 mismatch")
    plan = read_plan(plan_raw)
    require(plan["start"] < step <= plan["start"] + plan["steps"], "accepted step outside plan")
    require(np.isfinite(step * plan["dt"]), "finite endpoint time required")
    length = number()
    require(length == 58 * int(np.prod(plan["shape"])) * 8, "canonical58 endpoint size mismatch")
    state_raw = take(length)
    require(stream.read() == b"", "trailing checkpoint bytes")
    q = np.frombuffer(state_raw, dtype="<f8").reshape((58, *plan["shape"]))
    require(np.isfinite(q).all(), "finite endpoint required")
    with np.errstate(over="ignore", under="ignore"):
        alpha, chi = np.exp(q[6]), np.exp(2 * q[10])
    for value in (alpha, chi):
        require(np.isfinite(value).all() and (value >= np.finfo(float).tiny).all(), "normal positive lapse/chi required")
    h = np.empty((*plan["shape"], 3, 3))
    for slot, (i, j) in enumerate(((0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2))):
        h[..., i, j] = h[..., j, i] = q[slot]
    require((np.linalg.eigvalsh(h)[..., 0] > 0).all(), "SPD endpoint required")
    return dict(plan=plan, plan_raw=plan_raw, step=step, q=q, state_raw=state_raw, checkpoint_sha256=sha(raw), plan_sha256=sha(plan_raw), binding_sha256=sha(expected_binding), state_sha256=sha(state_raw))


def validate_manifest(manifest, checkpoint, expected_binding):
    """Validate the common envelope AND this method's distinct diagnostics."""
    expected = dict(schema_version="nr-run-manifest-v1", kernel_id=KERNEL, kernel_version="0.1.0", formulation="fo-ccz4-58-variable-shadow-contract", status="shadow", promotion="blocked-pending-physical-validation", units="geometric-G=c=1", coordinate_system="cartesian-3d", gauge="advective-1+log-gamma-driver", boundary="sbp42-analytic-target-sat")
    for key, value in expected.items():
        require(manifest.get(key) == value, f"manifest {key} mismatch")
    plan, d, g = checkpoint["plan"], manifest["diagnostics"], manifest["grid"]
    for key in ("shape", "lower", "upper", "spacing"):
        require(g.get(key) == list(plan[key]), f"manifest grid {key} mismatch")
    require(g.get("dt") == plan["dt"] and g.get("interior_order") == 4 and g.get("boundary_order") == 2, "manifest discretization mismatch")
    require(d.get("step") == checkpoint["step"] and d.get("time") == checkpoint["step"] * plan["dt"], "manifest step/time mismatch")
    require(d.get("plan_start") == plan["start"] and d.get("plan_steps") == plan["steps"], "manifest original plan mismatch")
    require(d.get("method_id") == METHOD and d.get("release_identity") == "solar-sim-mainline-a" and d.get("checkpoint_version") == 1, "manifest method mismatch")
    for key in ("checkpoint_sha256", "plan_sha256", "state_sha256", "binding_sha256"):
        require(d.get(key) == checkpoint[key], f"manifest {key} mismatch")
    identity = dict(line.split("=", 1) for line in expected_binding.decode("ascii").splitlines())
    for field, key in (("source", "source"), ("executable", "exe"), ("blas", "blas"), ("openmp", "openmp")):
        require(d.get(field + "_sha256") == identity[key], f"manifest {field} identity mismatch")
    require(d.get("variable_count") == 58 and d.get("variables") == list(FOCCZ4_VARIABLE_ORDER), "manifest canonical order mismatch")
    require(d.get("threads_observed") in (1, 2, 4) and d.get("blas_threads") == 1 and d.get("openmp_version") == 200203, "manifest team mismatch")
    advance = d.get("steps_advanced")
    require(type(advance) is int and 0 <= advance <= checkpoint["step"] - plan["start"] and advance <= 4 and d.get("rhs_evaluations") == 4 * advance, "manifest invocation count mismatch")
    for key in ("native_checkpoint_supported", "component_only"):
        require(d.get(key) is True, f"manifest {key} mismatch")
    for key in ("algebraic_projection", "auxiliaries_reconstructed", "automatic_timestep_change", "fallback", "physical_gate", "live_admission", "scientificPayloadWriteback", "universal_power_loss_durability"):
        require(d.get(key) is False, f"manifest {key} must remain false")

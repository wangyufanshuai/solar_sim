from pathlib import Path
import runpy

import pytest


@pytest.fixture(scope="module")
def driver():
    return runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-auxiliary-manifest-v2.py"))


@pytest.mark.parametrize("steps", (1,3,5,8))
def test_positive_steps_use_real_solver_unchanged(driver, tmp_path, monkeypatch, steps):
    calls = []
    monkeypatch.setattr(driver["BASE"]["Runner"], "native", lambda self, *args, **kw: calls.append((args, kw)))
    runner = driver["Runner"](tmp_path, {"commands": []})
    runner.native("case", Path("solver.exe"), "data", "checkpoint", steps=steps, threads=1)
    assert calls == [(("case", Path("solver.exe"), "data", "checkpoint"),
                      {"steps": steps, "threads": 1, "version": "0.3.2"})]


@pytest.mark.parametrize("version", ("0.3.1", "0.3.2"))
def test_zero_step_requires_explicit_test_only_binary_binding(driver, tmp_path, monkeypatch, version):
    calls = []
    monkeypatch.setattr(driver["BASE"]["Runner"], "native", lambda self, *args, **kw: calls.append((args, kw)))
    runner = driver["Runner"](tmp_path, {"commands": []})
    with pytest.raises(ValueError, match="binding required"):
        runner.native("case", Path("solver.exe"), "data", steps=0, version=version)
    assert calls == []
    runner.inspectors = {"solver.exe": Path("nr-fo-inspect-test.exe")}
    runner.native("case", Path("solver.exe"), "data", steps=0, version=version)
    assert calls == [(("case-function-inspection", Path("nr-fo-inspect-test.exe"), "data", None),
                      {"steps": 0, "threads": 4, "version": version})]


@pytest.mark.parametrize("steps", (-1,False,True,0.,1.,None))
def test_routing_never_coerces_step_types(driver, tmp_path, steps):
    runner = driver["Runner"](tmp_path, {"commands": []})
    with pytest.raises(ValueError, match="integer nonnegative"):
        runner.native("case", "solver.exe", "data", steps=steps)
    assert runner.receipt["commands"] == []


@pytest.mark.parametrize("exe,kind", (("nr-fo-inspect-new.exe", "function-level-zero-step-inspector"),
                                     ("nr-k2-fo-ccz4-shadow.exe", "production-shadow-cli"),
                                     ("baseline-retained.exe", "production-shadow-cli"),
                                     ("cmake.exe", "build-probe-or-verifier")))
def test_command_records_disclose_actual_execution_role(driver, tmp_path, monkeypatch, exe, kind):
    def fake(self, label, command, *, reject=False):
        self.receipt["commands"].append({"label": label, "returncode": 0})
        return '{"test_only":true,"execution_kind":"function-level-zero-step-inspector","evolution_steps":0}', .1
    monkeypatch.setattr(driver["BASE"]["Runner"], "execute", fake)
    runner = driver["Runner"](tmp_path, {"commands": []})
    runner.execute("case", [exe])
    assert runner.receipt["commands"][0]["execution_kind"] == kind
    assert runner.receipt["commands"][0]["expected_rejection"] is False


@pytest.mark.parametrize("output", ('{}', '{"test_only":true,"execution_kind":"function-level-zero-step-inspector","evolution_steps":false}',
                                   '{"test_only":true,"execution_kind":"function-level-zero-step-inspector","evolution_steps":1}'))
def test_inspector_cannot_pass_by_only_claiming_success_exit(driver, tmp_path, monkeypatch, output):
    def fake(self, label, command, *, reject=False):
        self.receipt["commands"].append({"returncode": 0})
        return output, .1
    monkeypatch.setattr(driver["BASE"]["Runner"], "execute", fake)
    runner = driver["Runner"](tmp_path, {"commands": []})
    with pytest.raises(ValueError, match="execution kind/step"):
        runner.execute("test", ["nr-fo-inspect-new.exe"])
    assert runner.receipt["commands"][0]["execution_kind"] == "function-level-zero-step-inspector"


@pytest.mark.parametrize("profile", (False,True))
@pytest.mark.parametrize("order", (2,4))
def test_command_binds_profile_order_and_restart_without_mutating_data(driver, tmp_path, profile, order):
    p = driver["PROFILE"] if profile else None
    data = driver["STENCIL"]["initial"](order, "noise", p, points=5)
    raw = data.to_bytes()
    cmd = driver["command_for"]("solver.exe", data, tmp_path/"out.bin", tmp_path/"out.json", path=tmp_path/"in.bin")
    for flag, value in (("--steps",0),("--points",5),("--spatial-order",order),("--restart",tmp_path/"in.bin")):
        assert cmd[cmd.index(flag)+1] == value
    assert ("--gauge-profile" in cmd) == profile
    assert data.to_bytes() == raw


@pytest.mark.parametrize("anomaly", ("wrong-code", "wrong-error", "new-checkpoint", "new-manifest", "overwrite"))
def test_expected_rejection_still_checks_error_and_file_safety(driver, tmp_path, monkeypatch, anomaly):
    runner = driver["Runner"](tmp_path, {"commands": []})
    output, manifest = tmp_path/"out.bin", tmp_path/"out.json"
    (tmp_path/"case.log").write_text("unrelated" if anomaly == "wrong-error" else "expected error", encoding="utf-8")
    if anomaly in ("new-checkpoint", "overwrite"):
        output.write_bytes(b"changed")
    if anomaly == "new-manifest":
        manifest.write_text("{}", encoding="utf-8")
    def fake(*args, **kw):
        runner.receipt["commands"].append({"returncode": 1 if anomaly == "wrong-code" else 2})
    monkeypatch.setattr(runner, "execute", fake)
    with pytest.raises(ValueError):
        runner.rejected("case", ["solver.exe"], output, manifest, "expected error",
                         retained_bytes=b"original" if anomaly == "overwrite" else None)


def test_wrong_stop_hash_is_rejected_without_following_embedded_paths(driver, tmp_path, monkeypatch):
    monkeypatch.setitem(driver["BASE"], "archive_identity", lambda path: {})
    (tmp_path/"campaign-v1").mkdir()
    (tmp_path/"campaign-v1/receipt.json").write_text("{}", encoding="utf-8")
    with pytest.raises(ValueError, match="immutable zero-step failure"):
        driver["retained_identity"](tmp_path)

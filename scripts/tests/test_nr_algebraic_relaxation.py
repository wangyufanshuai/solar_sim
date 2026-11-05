"""Test campaign guards without compiling, evolving, or touching old evidence."""
from dataclasses import replace
from pathlib import Path
import runpy

import pytest

RUN = runpy.run_path(str(Path(__file__).resolve().parents[1]/"run-nr-k3-algebraic-relaxation.py"))


@pytest.mark.parametrize("order", (2,4))
@pytest.mark.parametrize("profile", (None,RUN["PROFILE"]))
def test_control_builder_keeps_slots_and_sets_only_explicit_envelope(order,profile):
    old = RUN["STENCIL"]["initial"](order,"flat",profile)
    old_raw = old.to_bytes()
    new = RUN["controlled"](old,1.)
    assert new.header == {**old.header,"version":4}
    assert new.slots is old.slots and new.profile == old.profile
    assert old.to_bytes() == old_raw
    assert RUN["controlled"](new,0.).to_bytes() == old_raw


def test_encoding_failure_creates_no_empty_artifact(tmp_path):
    data = RUN["controlled"](RUN["STENCIL"]["initial"](4,"flat",RUN["PROFILE"]),1.)
    bad = replace(data,header={**data.header,"solver_mode":0})
    path = tmp_path/"invalid.bin"
    with pytest.raises(ValueError):
        RUN["encode"](path,bad)
    assert not path.exists()


def test_old_command_omits_new_option_and_candidate_does_not_infer_rate():
    data = RUN["controlled"](RUN["STENCIL"]["initial"](4,"flat",RUN["PROFILE"]),1.)
    old = RUN["command"]("old",data,"out","meta",path="input")
    new = RUN["command"]("new",data,"out","meta",path="input",rate=1.)
    assert "--tau-inverse" not in old
    assert new[-2:] == ["--tau-inverse",1.]
    assert new[new.index("--spatial-order")+1] == 4


def test_all_negative_controls_have_fresh_outputs_and_exact_exit_two(tmp_path):
    class Fake:
        directory = tmp_path
        receipt = {"commands":[]}

        def execute(self,label,command,reject):
            assert reject
            assert not Path(command[command.index("--checkpoint")+1]).exists()
            self.receipt["commands"].append({"returncode":2,"label":label})

    receipt = {"negatives":[]}
    RUN["negative_cases"](Fake(),"unexecuted.exe",receipt)
    assert len(receipt["negatives"]) == 16
    assert len({r["name"] for r in receipt["negatives"]}) == 16


@pytest.mark.parametrize("returncode", (0,1,-1))
def test_negative_control_cannot_pass_on_wrong_exit(tmp_path,returncode):
    class Fake:
        directory = tmp_path
        receipt = {"commands":[]}

        def execute(self,label,command,reject):
            self.receipt["commands"].append({"returncode":returncode})

    with pytest.raises(ValueError,match="negative exit"):
        RUN["negative_cases"](Fake(),"unexecuted.exe",{"negatives":[]})

"""Stdlib-only diagnostic self-controls, loaded exclusively by the owned worker."""

import inspect
import unittest

D = None  # Injected by the bounded diagnostic worker, not a scientific backend.


class GuardDiagnosticTests(unittest.TestCase):
    def test_scan_expression_matches_production(self):
        self.assertTrue(D.scan_equivalence(inspect.getsource(D.G.Budget.guard), inspect.getsource(D.scan_only)))

    def test_scan_expression_mutation_rejected(self):
        changed = inspect.getsource(D.scan_only).replace("p.stat().st_size", "(p.stat().st_size + 1)")
        with self.assertRaisesRegex(ValueError, "scan expression drift"):
            D.scan_equivalence(inspect.getsource(D.G.Budget.guard), changed)

    def test_timer_preserves_result_and_call_count(self):
        calls = []
        wall, cpu = iter((100, 160)), iter((10, 25))
        row, value = D.timed_operation(lambda: calls.append(1) or 42,
                                      wall=lambda: next(wall), cpu=lambda: next(cpu))
        self.assertEqual(row, {"wall_ns": 60, "thread_cpu_ns": 15})
        self.assertEqual(value, 42)
        self.assertEqual(calls, [1])

    def test_operation_error_propagates_without_retry(self):
        calls = []
        def failure():
            calls.append(1)
            raise LookupError("original failure")
        with self.assertRaisesRegex(LookupError, "original failure"):
            D.timed_operation(failure)
        self.assertEqual(calls, [1])

    def test_measure_preserves_pre_and_post_global_guard(self):
        events = []
        class Owner:
            def guard(self):
                events.append("guard")
        wall, cpu = iter((1, 5)), iter((2, 3))
        D.measure(Owner(), lambda: events.append("operation"), wall=lambda: next(wall), cpu=lambda: next(cpu))
        self.assertEqual(events, ["guard", "operation", "guard"])

    def test_global_stop_prevents_probe_execution(self):
        calls = []
        class Owner:
            def guard(self):
                raise D.G.ResourceLimit("original floor")
        with self.assertRaisesRegex(D.G.ResourceLimit, "original floor"):
            D.measure(Owner(), lambda: calls.append(1))
        self.assertEqual(calls, [])

    def test_summary_records_median_and_range(self):
        rows = [{"wall_ns": x, "thread_cpu_ns": 0} for x in (3, 9, 6)]
        self.assertEqual(D.summarize(rows), dict(count=3, min_wall_ns=3, median_wall_ns=6,
                                               max_wall_ns=9, median_thread_cpu_ns=0))

    def test_invalid_timing_samples_rejected(self):
        for rows in ([], [{"wall_ns": 0, "thread_cpu_ns": 0}],
                     [{"wall_ns": True, "thread_cpu_ns": 0}], [{"wall_ns": 1, "thread_cpu_ns": -1}]):
            with self.subTest(rows=rows), self.assertRaises(ValueError):
                D.summarize(rows)

    @staticmethod
    def complete_samples():
        return [dict(target=t, round=r, repeat=i, operation=o, wall_ns=1, thread_cpu_ns=0)
                for t, r, i, o in sorted(D.expected_keys())]

    def test_complete_135_sample_coverage(self):
        rows = self.complete_samples()
        self.assertEqual(len(rows), 135)
        D.validate_samples(rows)

    def test_duplicate_or_missing_sample_rejected(self):
        rows = self.complete_samples()
        for changed in (rows[:-1], rows + [rows[0]], rows[:-1] + [rows[0]]):
            with self.subTest(length=len(changed)), self.assertRaisesRegex(ValueError, "coverage"):
                D.validate_samples(changed)

    def test_readonly_probe_blocks_writes_without_changing_checks(self):
        probe = object.__new__(D.ReadOnlyProbe)
        for operation in (lambda: probe.save("not-created", b"x"), lambda: probe.record("not-created", {})):
            with self.assertRaisesRegex(ValueError, "read-only"):
                operation()
        self.assertIs(D.ReadOnlyProbe.guard, D.G.Budget.guard)
        self.assertIs(D.ReadOnlyProbe.disk_check, D.G.Budget.disk_check)

    def test_backward_clock_rejected(self):
        wall, cpu = iter((3, 2)), iter((0, 0))
        with self.assertRaisesRegex(ValueError, "timing"):
            D.timed_operation(lambda: None, wall=lambda: next(wall), cpu=lambda: next(cpu))

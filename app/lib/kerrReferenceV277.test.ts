import { describe, expect, it } from "vitest";
import {
  createKerrObserverFrameV277,
  createKerrShortGateSkeletonV277,
  kerrCarterQFromCovectorV277,
  kerrMassShellResidualV277,
  kerrNullPolarPotentialV277,
  observerFrameOrthonormalityErrorV277,
} from "./kerrReferenceV277";

describe("corrected v277 Kerr reference contracts", () => {
  it("builds an orthonormal finite-distance ZAMO frame for signed spin", () => {
    for (const spinA of [-0.998, 0, 0.9, 0.998]) {
      const frame = createKerrObserverFrameV277({ spinA, radiusM: 50, thetaRad: Math.PI * 0.39 });
      expect(observerFrameOrthonormalityErrorV277(frame)).toBeLessThan(1e-12);
      expect(kerrMassShellResidualV277({ frame, direction: [-1, 0.12, 0.16] })).toBeLessThan(1e-12);
      expect(kerrMassShellResidualV277({ frame, direction: [-1, 0.12, 0.16], muSquared: 1, localSpeed: 0.4 })).toBeLessThan(1e-12);
    }
  });

  it("uses the photon Carter potential sign, distinct from the massive form", () => {
    const photon = kerrCarterQFromCovectorV277({
      spinA: 0.9,
      thetaRad: 1.1,
      energy: 1,
      axialAngularMomentum: 0.4,
      pTheta: 0.2,
      muSquared: 0,
    });
    const massive = kerrCarterQFromCovectorV277({
      spinA: 0.9,
      thetaRad: 1.1,
      energy: 1,
      axialAngularMomentum: 0.4,
      pTheta: 0.2,
      muSquared: 1,
    });
    expect(massive).not.toBe(photon);
    expect(kerrNullPolarPotentialV277(0.9, 1.1, 1, 0.4, photon)).toBeCloseTo(0.04, 12);
  });

  it("does not declare the short gate passed before the campaign runs", () => {
    const gate = createKerrShortGateSkeletonV277();
    expect(gate.expectedExecutionCount).toBe(128);
    expect(gate.criticalBracketCount).toBe(40);
    expect(gate.status).toBe("not-run");
    expect(gate.gatePassed).toBe(false);
  });
});

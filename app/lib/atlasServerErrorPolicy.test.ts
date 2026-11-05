import { describe, expect, it } from "vitest";
import { isIgnorableClosedResponseController } from "../../scripts/atlas-server-bootstrap.mjs";

describe("standalone server error policy", () => {
  it("suppresses only the known closed response-controller teardown noise", () => {
    expect(isIgnorableClosedResponseController(Object.assign(
      new TypeError("Invalid state: Controller is already closed"),
      { code: "ERR_INVALID_STATE" },
    ))).toBe(true);
    expect(isIgnorableClosedResponseController(Object.assign(
      new TypeError("Invalid state: stream failed"),
      { code: "ERR_INVALID_STATE" },
    ))).toBe(false);
    expect(isIgnorableClosedResponseController(new Error("Controller is already closed"))).toBe(false);
  });
});


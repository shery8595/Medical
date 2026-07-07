import { expect } from "chai";
import {
  computeRegisterAuthDeadline,
  pendingRegisterNonce,
} from "../../src/lib/pendingRegisterAuthCore";

describe("pendingRegisterAuth", function () {
  it("computeRegisterAuthDeadline prefers trial end before max horizon", function () {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const trialEnd = now + 30n * 24n * 3600n;
    const deadline = computeRegisterAuthDeadline(trialEnd);
    expect(deadline).to.equal(trialEnd);
  });

  it("pendingRegisterNonce is stable per trial/nullifier", function () {
    const a = pendingRegisterNonce(7n, 42n);
    const b = pendingRegisterNonce(7n, 42n);
    const c = pendingRegisterNonce(7n, 43n);
    expect(a).to.equal(b);
    expect(a).to.not.equal(c);
  });
});

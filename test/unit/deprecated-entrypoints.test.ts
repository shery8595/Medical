import { deployMedVaultStack } from "../../test-support/deployments";
import { expectRevert } from "../../test-support/assertions";

describe("Unit: deprecated entrypoints", function () {
    it("DEP-01: checkEligibility reverts", async function () {
        const stack = await deployMedVaultStack();
        await expectRevert(
            stack.eligibilityEngine.checkEligibility(stack.patient.address, 1),
            "Legacy eligibility check deprecated"
        );
    });

    it("DEP-02: applyToTrial reverts", async function () {
        const stack = await deployMedVaultStack();
        await expectRevert(
            stack.eligibilityEngine.applyToTrial(1, true, "0x"),
            "Deprecated"
        );
    });

    it("DEP-03: registerParticipant reverts", async function () {
        const stack = await deployMedVaultStack();
        await expectRevert(
            stack.sponsorIncentiveVault.registerParticipant(1, stack.patient.address),
            "revert"
        );
    });

    it("DEP-04: setLegacyPatientRegistry only owner", async function () {
        const stack = await deployMedVaultStack();
        await expectRevert(
            stack.eligibilityEngine
                .connect(stack.stranger)
                .setLegacyPatientRegistry(stack.patient.address),
            "Only owner"
        );
        await stack.eligibilityEngine
            .connect(stack.owner)
            .setLegacyPatientRegistry(stack.patient.address);
    });
});

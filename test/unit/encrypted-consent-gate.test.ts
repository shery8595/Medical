import { expect } from "chai";
import { deployMedVaultStack } from "../../test-support/deployments";
import { expectRevert } from "../../test-support/assertions";

describe("Unit: EncryptedConsentGate", function () {
    it("ECG-01: authorize and deauthorize computer", async function () {
        const stack = await deployMedVaultStack();
        await stack.encryptedConsentGate
            .connect(stack.owner)
            .authorizeComputer(stack.stranger.address);
        expect(await stack.encryptedConsentGate.authorizedComputers(stack.stranger.address)).to.equal(
            true
        );
        await stack.encryptedConsentGate
            .connect(stack.owner)
            .deauthorizeComputer(stack.stranger.address);
        expect(await stack.encryptedConsentGate.authorizedComputers(stack.stranger.address)).to.equal(
            false
        );
    });

    it("ECG-02: unauthorized computer reverts computeGate", async function () {
        const stack = await deployMedVaultStack();
        await expectRevert(
            stack.encryptedConsentGate
                .connect(stack.stranger)
                .getFunction("computeGate(uint256,bytes32,bytes32,bytes32)")(
                    1,
                    "0x" + "00".repeat(32),
                    "0x" + "00".repeat(32),
                    "0x" + "00".repeat(32)
                ),
            /Not authorized|reverted/
        );
    });

    it("ECG-03: setTrialSponsor only owner", async function () {
        const stack = await deployMedVaultStack();
        await stack.encryptedConsentGate
            .connect(stack.owner)
            .setTrialSponsor(1, stack.sponsor.address);
        expect(await stack.encryptedConsentGate.trialSponsor(1)).to.equal(stack.sponsor.address);
    });

    it("ECG-04: gateExists false initially", async function () {
        const stack = await deployMedVaultStack();
        expect(await stack.encryptedConsentGate.gateExists(1, "0x" + "aa".repeat(32))).to.equal(false);
    });

    it("ECG-05: verifyGatePassed false when no gate", async function () {
        const stack = await deployMedVaultStack();
        const passed = await stack.encryptedConsentGate.verifyGatePassed(1, "0x" + "bb".repeat(32));
        expect(passed === false || passed === 0n || passed === "0x" + "00".repeat(32)).to.equal(
            true
        );
    });

    it("ECG-06: owner can authorize computer for computeGateWithActiveConsent path", async function () {
        const stack = await deployMedVaultStack();
        await stack.encryptedConsentGate
            .connect(stack.owner)
            .authorizeComputer(await stack.eligibilityEngine.getAddress());
        expect(
            await stack.encryptedConsentGate.authorizedComputers(
                await stack.eligibilityEngine.getAddress()
            )
        ).to.equal(true);
    });
});

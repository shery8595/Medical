import { expect } from "chai";
import { ethers } from "hardhat";
import {
    deployMedVaultStack,
    createTrialForSponsor,
} from "../../test-support/deployments";
import {
    assertFhevmMock,
    mockUserDecryptBool,
} from "../../test-support/fhe";
import {
    registerPatient,
    stageSemaphoreApply,
} from "../../test-support/journey";

describe("Integration: relayer decrypt visibility (PDV-*)", function () {
    before(function () {
        assertFhevmMock();
    });

    it("PDV-01: relayer cannot user-decrypt when patient ephemeral is permitRecipient", async function () {
        const stack = await deployMedVaultStack();
        const patient = await registerPatient(stack);
        const trialId = await createTrialForSponsor(stack);
        const staged = await stageSemaphoreApply(stack, trialId, patient, stack.patient);

        const engineAddr = await stack.eligibilityEngine.getAddress();
        let err: Error | undefined;
        try {
            await mockUserDecryptBool(staged.finalCt, engineAddr, stack.relayer);
        } catch (e) {
            err = e as Error;
        }
        expect(err).to.exist;
    });

    it("PDV-02: patient permitRecipient can user-decrypt staged finalCt", async function () {
        const stack = await deployMedVaultStack();
        const patient = await registerPatient(stack);
        const trialId = await createTrialForSponsor(stack);
        const staged = await stageSemaphoreApply(stack, trialId, patient, stack.patient);

        const engineAddr = await stack.eligibilityEngine.getAddress();
        const eligible = await mockUserDecryptBool(staged.finalCt, engineAddr, stack.patient);
        expect(eligible).to.equal(true);
    });

    it("PDV-03: assertRelayerVisibilityAcknowledged requires explicit opt-in", async function () {
        const { assertRelayerVisibilityAcknowledged } = await import(
            "../../relayer/eligibility-decrypt.mjs"
        );

        expect(() =>
            assertRelayerVisibilityAcknowledged({ relayerIsPermitHolder: false, acknowledged: false })
        ).to.not.throw();

        let err: Error & { code?: string } | undefined;
        try {
            assertRelayerVisibilityAcknowledged({ relayerIsPermitHolder: true, acknowledged: false });
        } catch (e) {
            err = e as Error & { code?: string };
        }
        expect(err?.code).to.equal("RELAYER_VISIBILITY_NOT_ACKNOWLEDGED");

        expect(() =>
            assertRelayerVisibilityAcknowledged({ relayerIsPermitHolder: true, acknowledged: true })
        ).to.not.throw();
    });
});

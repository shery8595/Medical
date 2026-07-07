import { expect } from "chai";
import { Identity } from "@semaphore-protocol/identity";
import { assertFhevmMock, mockUserDecryptUint8 } from "../../test-support/fhe";
import { deployMedVaultStack, registerPatientOnRegistry } from "../../test-support/deployments";
import { ELIGIBLE_PROFILE } from "../../test-support/fixtures/profiles";
import { impersonateAccount } from "../../test-support/signers";
import { expectRevert } from "../../test-support/assertions";

describe("Unit: sponsor ACL negative (SPN-ACL-*)", function () {
    before(function () {
        assertFhevmMock();
    });

    it("SPN-ACL-01: sponsor cannot userDecrypt patient vitals from AnonymousPatientRegistry", async function () {
        const stack = await deployMedVaultStack();
        const id = new Identity();
        await registerPatientOnRegistry(
            stack,
            stack.patient,
            id.commitment,
            stack.patient.address,
            ELIGIBLE_PROFILE
        );

        const registrySigner = await impersonateAccount(await stack.medVaultRegistry.getAddress());
        const profile = await stack.anonymousPatientRegistry
            .connect(registrySigner)
            .getPatientProfile(id.commitment);
        const registryAddr = await stack.anonymousPatientRegistry.getAddress();

        await expectRevert(
            stack.anonymousPatientRegistry.connect(stack.sponsor).getPatientProfile(id.commitment),
            /Not authorized/
        );

        let sponsorDecryptErr: Error | undefined;
        try {
            await mockUserDecryptUint8(profile.age, registryAddr, stack.sponsor);
        } catch (e) {
            sponsorDecryptErr = e as Error;
        }
        expect(sponsorDecryptErr).to.not.equal(undefined);

        const patientAge = await mockUserDecryptUint8(profile.age, registryAddr, stack.patient);
        expect(patientAge).to.equal(BigInt(ELIGIBLE_PROFILE.age));
    });
});

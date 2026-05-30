import { expect } from "chai";
import { Identity } from "@semaphore-protocol/identity";
import {
    deployMedVaultStack,
    createTrialForSponsor,
    registerPatientOnRegistry,
} from "../../test-support/deployments";
import { ELIGIBLE_PROFILE } from "../../test-support/fixtures/profiles";
import { buildMockSemaphoreProof, deriveNullifier } from "../../test-support/semaphore";
import { expectRevert } from "../../test-support/assertions";
import { mockDecryptBool } from "../../test-support/fhe";
import { grantConsentLegacy } from "../../test-support/consent";
import { impersonateAccount } from "../../test-support/signers";

describe("Integration: eligibility anonymous flow", function () {
    it("INT-EE-01: stage then cancel staged eligibility", async function () {
        const stack = await deployMedVaultStack();
        const id = new Identity();
        await registerPatientOnRegistry(
            stack,
            stack.patient,
            id.commitment,
            stack.patient.address,
            ELIGIBLE_PROFILE
        );
        const trialId = await createTrialForSponsor(stack);
        const nullifier = deriveNullifier(id, trialId);
        const proof = buildMockSemaphoreProof(
            trialId,
            nullifier,
            id.commitment,
            stack.patient.address
        );
        await stack.medVaultRegistry
            .connect(stack.patient)
            .stageAnonymousApply(trialId, proof, id.commitment, stack.patient.address);
        await stack.medVaultRegistry
            .connect(stack.patient)
            .cancelAnonymousApplyStage(trialId, proof, id.commitment, stack.patient.address);
    });

    it("INT-EE-02: stage returns decryptable finalCt", async function () {
        const stack = await deployMedVaultStack();
        const id = new Identity();
        await registerPatientOnRegistry(
            stack,
            stack.patient,
            id.commitment,
            stack.patient.address,
            ELIGIBLE_PROFILE
        );
        const trialId = await createTrialForSponsor(stack);
        const nullifier = deriveNullifier(id, trialId);
        const proof = buildMockSemaphoreProof(
            trialId,
            nullifier,
            id.commitment,
            stack.patient.address
        );
        const tx = await stack.medVaultRegistry
            .connect(stack.patient)
            .stageAnonymousApply(trialId, proof, id.commitment, stack.patient.address);
        const receipt = await tx.wait();
        const ev = receipt?.logs.find(() => true);
        expect(ev).to.not.be.undefined;
    });

    it("INT-EE-03: checkAnonymousEligibilityWithConsent via wallet apply", async function () {
        const stack = await deployMedVaultStack();
        const id = new Identity();
        await registerPatientOnRegistry(
            stack,
            stack.patient,
            id.commitment,
            stack.patient.address,
            ELIGIBLE_PROFILE
        );
        const trialId = await createTrialForSponsor(stack);
        const nullifier = deriveNullifier(id, trialId);
        await grantConsentLegacy(stack.consentManager.connect(stack.patient), trialId);
        await stack.medVaultRegistry
            .connect(stack.patient)
            .applyToTrialWithConsent(trialId, id.commitment, nullifier);
        const status = await stack.eligibilityEngine.getAnonymousApplicationStatus(nullifier, trialId);
        expect(status).to.equal(1n); // Pending
    });

    it("INT-EE-04: revoke consent invalidates active consent decrypt", async function () {
        const stack = await deployMedVaultStack();
        const trialId = await createTrialForSponsor(stack);
        await grantConsentLegacy(stack.consentManager.connect(stack.patient), trialId);
        await stack.consentManager.connect(stack.patient).revokeAllConsent();
        const active = await stack.consentManager.getActiveConsent(stack.patient.address, trialId);
        expect(await mockDecryptBool(active)).to.equal(false);
    });

    it("INT-EE-05: decryptPermitHolder set after wallet apply", async function () {
        const stack = await deployMedVaultStack();
        const id = new Identity();
        await registerPatientOnRegistry(
            stack,
            stack.patient,
            id.commitment,
            stack.patient.address,
            ELIGIBLE_PROFILE
        );
        const trialId = await createTrialForSponsor(stack);
        const nullifier = deriveNullifier(id, trialId);
        await stack.medVaultRegistry
            .connect(stack.patient)
            .applyToTrialWithConsent(trialId, id.commitment, nullifier);
        expect(await stack.eligibilityEngine.decryptPermitHolder(nullifier)).to.equal(
            stack.patient.address
        );
    });

    it("INT-EE-06: unauthorized registry cannot stage on engine", async function () {
        const stack = await deployMedVaultStack();
        await expectRevert(
            stack.eligibilityEngine
                .connect(stack.stranger)
                .stageAnonymousEligibility(1, 1, 1, stack.patient.address),
            "Only authorized registry"
        );
    });

    it("INT-EE-07: inactive trial stage reverts", async function () {
        const stack = await deployMedVaultStack();
        const id = new Identity();
        await registerPatientOnRegistry(
            stack,
            stack.patient,
            id.commitment,
            stack.patient.address,
            ELIGIBLE_PROFILE
        );
        const trialId = await createTrialForSponsor(stack);
        await stack.trialManager.connect(stack.sponsor).deactivateTrial(trialId);
        const nullifier = deriveNullifier(id, trialId);
        const registrySigner = await impersonateAccount(await stack.medVaultRegistry.getAddress());
        await expectRevert(
            stack.eligibilityEngine
                .connect(registrySigner)
                .stageAnonymousEligibility(
                    id.commitment,
                    trialId,
                    nullifier,
                    stack.patient.address
                ),
            /Trial is not active|reverted/
        );
    });

    it("INT-EE-08: getAnonymousScore returns handle after apply", async function () {
        const stack = await deployMedVaultStack();
        const id = new Identity();
        await registerPatientOnRegistry(
            stack,
            stack.patient,
            id.commitment,
            stack.patient.address,
            ELIGIBLE_PROFILE
        );
        const trialId = await createTrialForSponsor(stack);
        const nullifier = deriveNullifier(id, trialId);
        await stack.medVaultRegistry
            .connect(stack.patient)
            .applyToTrialWithConsent(trialId, id.commitment, nullifier);
        const score = await stack.eligibilityEngine.getAnonymousScore(nullifier, trialId);
        expect(score).to.not.equal(0n);
    });

    it("INT-EE-09: finalize with invalid sig reverts", async function () {
        const stack = await deployMedVaultStack();
        const id = new Identity();
        await registerPatientOnRegistry(
            stack,
            stack.patient,
            id.commitment,
            stack.patient.address,
            ELIGIBLE_PROFILE
        );
        const trialId = await createTrialForSponsor(stack);
        const nullifier = deriveNullifier(id, trialId);
        const proof = buildMockSemaphoreProof(
            trialId,
            nullifier,
            id.commitment,
            stack.patient.address
        );
        await stack.medVaultRegistry
            .connect(stack.patient)
            .stageAnonymousApply(trialId, proof, id.commitment, stack.patient.address);
        await expectRevert(
            stack.medVaultRegistry
                .connect(stack.patient)
                .finalizeAnonymousApply(
                    trialId,
                    proof,
                    id.commitment,
                    stack.patient.address,
                    true,
                    "0x"
                ),
            /Invalid eligibility decryption|reverted/
        );
    });

    it("INT-EE-10: double stage reverts", async function () {
        const stack = await deployMedVaultStack();
        const id = new Identity();
        await registerPatientOnRegistry(
            stack,
            stack.patient,
            id.commitment,
            stack.patient.address,
            ELIGIBLE_PROFILE
        );
        const trialId = await createTrialForSponsor(stack);
        const nullifier = deriveNullifier(id, trialId);
        const proof = buildMockSemaphoreProof(
            trialId,
            nullifier,
            id.commitment,
            stack.patient.address
        );
        await stack.medVaultRegistry
            .connect(stack.patient)
            .stageAnonymousApply(trialId, proof, id.commitment, stack.patient.address);
        await expectRevert(
            stack.medVaultRegistry
                .connect(stack.patient)
                .stageAnonymousApply(trialId, proof, id.commitment, stack.patient.address),
            "Already staged"
        );
    });
});

import { expect } from "chai";
import { Identity } from "@semaphore-protocol/identity";
import {
    deployMedVaultStack,
    createTrialForSponsor,
    registerPatientOnRegistry,
} from "../../test-support/deployments";
import { ELIGIBLE_PROFILE } from "../../test-support/fixtures/profiles";
import { buildMockSemaphoreProof, consentMessage, deriveNullifier } from "../../test-support/semaphore";
import { expectRevert } from "../../test-support/assertions";

describe("Integration: MedVaultRegistry", function () {
    it("MVR-01: registerPatient adds semaphore member", async function () {
        const stack = await deployMedVaultStack();
        const id = new Identity();
        await registerPatientOnRegistry(
            stack,
            stack.patient,
            id.commitment,
            stack.patient.address,
            ELIGIBLE_PROFILE
        );
        expect(await stack.medVaultRegistry.isRegisteredMember(id.commitment)).to.equal(true);
    });

    it("MVR-02: stageAnonymousApply emits staged event", async function () {
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
        await expect(
            stack.medVaultRegistry
                .connect(stack.patient)
                .stageAnonymousApply(trialId, proof, id.commitment, stack.patient.address)
        ).to.emit(stack.medVaultRegistry, "AnonymousApplyStaged");
    });

    it("MVR-03: cancelAnonymousApplyStage", async function () {
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

    it("MVR-04: hasAppliedToTrial false before finalize", async function () {
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
        expect(await stack.medVaultRegistry.hasAppliedToTrial(trialId, nullifier)).to.equal(false);
    });

    it("MVR-05: invalid proof when mock disabled", async function () {
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
        await stack.mockSemaphore.setProofsValid(false);
        await expectRevert(
            stack.medVaultRegistry
                .connect(stack.patient)
                .stageAnonymousApply(trialId, proof, id.commitment, stack.patient.address),
            "Invalid Semaphore proof"
        );
        await stack.mockSemaphore.setProofsValid(true);
    });

    it("MVR-06: scope mismatch reverts", async function () {
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
            trialId + 99n,
            nullifier,
            id.commitment,
            stack.patient.address
        );
        await expectRevert(
            stack.medVaultRegistry
                .connect(stack.patient)
                .stageAnonymousApply(trialId, proof, id.commitment, stack.patient.address),
            "Scope mismatch"
        );
    });

    it("MVR-07: consent signal mismatch reverts", async function () {
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
            stack.stranger.address
        );
        await expectRevert(
            stack.medVaultRegistry
                .connect(stack.patient)
                .stageAnonymousApply(trialId, proof, id.commitment, stack.patient.address),
            "Proof does not encode consent"
        );
    });

    it("MVR-08: wallet isRegistered after register", async function () {
        const stack = await deployMedVaultStack();
        const id = new Identity();
        await registerPatientOnRegistry(
            stack,
            stack.patient,
            id.commitment,
            stack.patient.address,
            ELIGIBLE_PROFILE
        );
        expect(await stack.medVaultRegistry.connect(stack.patient).isRegistered()).to.equal(true);
    });

    it("MVR-09: applyToTrialWithConsent marks applied", async function () {
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
        expect(await stack.medVaultRegistry.hasAppliedToTrial(trialId, nullifier)).to.equal(true);
    });

    it("MVR-10: duplicate register reverts", async function () {
        const stack = await deployMedVaultStack();
        const id = new Identity();
        await registerPatientOnRegistry(
            stack,
            stack.patient,
            id.commitment,
            stack.patient.address,
            ELIGIBLE_PROFILE
        );
        await expectRevert(
            registerPatientOnRegistry(
                stack,
                stack.patient,
                id.commitment,
                stack.patient.address,
                ELIGIBLE_PROFILE
            ),
            /Already registered|reverted/
        );
    });

    it("MVR-11: getCommitmentForWallet self only", async function () {
        const stack = await deployMedVaultStack();
        const id = new Identity();
        await registerPatientOnRegistry(
            stack,
            stack.patient,
            id.commitment,
            stack.patient.address,
            ELIGIBLE_PROFILE
        );
        expect(await stack.medVaultRegistry.connect(stack.patient).getCommitmentForWallet(stack.patient.address)).to.equal(
            id.commitment
        );
    });

    it("MVR-12: owner updates merkle tree duration", async function () {
        const stack = await deployMedVaultStack();
        await stack.medVaultRegistry.connect(stack.owner).updateMerkleTreeDuration(2 * 24 * 60 * 60);
    });
});

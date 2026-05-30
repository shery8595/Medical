import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { Identity } from "@semaphore-protocol/identity";
import {
    deployMedVaultStack,
    createTrialForSponsor,
    registerPatientOnRegistry,
} from "../../test-support/deployments";
import { ELIGIBLE_PROFILE } from "../../test-support/fixtures/profiles";
import { deriveNullifier } from "../../test-support/semaphore";
import { expectRevert } from "../../test-support/assertions";
import { DEFAULT_TRIAL_PARAMS } from "../../test-support/constants";

describe("Unit: SponsorIncentiveVault", function () {
    async function setupAcceptedApplicant(stack: Awaited<ReturnType<typeof deployMedVaultStack>>) {
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
        const { grantConsentLegacy } = await import("../../test-support/consent");
        await grantConsentLegacy(stack.consentManager.connect(stack.patient), trialId);
        await stack.medVaultRegistry
            .connect(stack.patient)
            .applyToTrialWithConsent(trialId, id.commitment, nullifier);
        await stack.eligibilityEngine
            .connect(stack.sponsor)
            .updateAnonymousApplicationStatus(trialId, nullifier, 2); // Accepted
        return { trialId, nullifier, id };
    }

    it("SIV-01: fundTrial locks deposit", async function () {
        const stack = await deployMedVaultStack();
        const trialId = await createTrialForSponsor(stack);
        await stack.sponsorIncentiveVault
            .connect(stack.sponsor)
            .fundTrial(trialId, { value: 10n ** 18n });
        expect(await stack.sponsorIncentiveVault.isPoolFunded(trialId)).to.equal(true);
    });

    it("SIV-02: double fund before lock allowed", async function () {
        const stack = await deployMedVaultStack();
        const trialId = await createTrialForSponsor(stack);
        await stack.sponsorIncentiveVault
            .connect(stack.sponsor)
            .fundTrial(trialId, { value: 10n ** 17n });
        await stack.sponsorIncentiveVault
            .connect(stack.sponsor)
            .fundTrial(trialId, { value: 10n ** 17n });
        const deposited = await stack.sponsorIncentiveVault.getTotalDeposited(trialId);
        expect(deposited).to.equal(2n * 10n ** 17n);
    });

    it("SIV-03: isPoolFunded false before fund", async function () {
        const stack = await deployMedVaultStack();
        const trialId = await createTrialForSponsor(stack);
        expect(await stack.sponsorIncentiveVault.isPoolFunded(trialId)).to.equal(false);
    });

    it("SIV-04: stranger cannot fund", async function () {
        const stack = await deployMedVaultStack();
        const trialId = await createTrialForSponsor(stack);
        await expectRevert(
            stack.sponsorIncentiveVault
                .connect(stack.stranger)
                .fundTrial(trialId, { value: 10n ** 18n }),
            "Only sponsor can fund"
        );
    });

    it("SIV-05: registerAnonymousParticipant after accepted", async function () {
        const stack = await deployMedVaultStack();
        const { trialId, nullifier } = await setupAcceptedApplicant(stack);
        await stack.sponsorIncentiveVault
            .connect(stack.sponsor)
            .fundTrial(trialId, { value: 10n ** 18n });
        await stack.sponsorIncentiveVault
            .connect(stack.patient)
            .registerAnonymousParticipant(trialId, nullifier);
        expect(await stack.sponsorIncentiveVault.isParticipantRegistered(trialId, stack.patient.address)).to.equal(
            true
        );
    });

    it("SIV-06: nullifier double registration reverts", async function () {
        const stack = await deployMedVaultStack();
        const { trialId, nullifier } = await setupAcceptedApplicant(stack);
        await stack.sponsorIncentiveVault
            .connect(stack.sponsor)
            .fundTrial(trialId, { value: 10n ** 18n });
        await stack.sponsorIncentiveVault
            .connect(stack.patient)
            .registerAnonymousParticipant(trialId, nullifier);
        await expectRevert(
            stack.sponsorIncentiveVault
                .connect(stack.patient)
                .registerAnonymousParticipant(trialId, nullifier),
            /Nullifier already used|reverted/
        );
    });

    it("SIV-07: distribute after trial end", async function () {
        const stack = await deployMedVaultStack();
        const { trialId, nullifier } = await setupAcceptedApplicant(stack);
        await stack.sponsorIncentiveVault
            .connect(stack.sponsor)
            .fundTrial(trialId, { value: 10n ** 18n });
        await stack.sponsorIncentiveVault
            .connect(stack.patient)
            .registerAnonymousParticipant(trialId, nullifier);
        await time.increase(DEFAULT_TRIAL_PARAMS.duration + 1);
        await stack.sponsorIncentiveVault.connect(stack.sponsor).distribute(trialId);
        expect(await stack.sponsorIncentiveVault.isDistributed(trialId)).to.equal(true);
    });

    it("SIV-08: unauthorized distribute reverts", async function () {
        const stack = await deployMedVaultStack();
        const trialId = await createTrialForSponsor(stack);
        await expectRevert(
            stack.sponsorIncentiveVault.connect(stack.stranger).distribute(trialId),
            "Not authorized"
        );
    });

    it("SIV-09: getParticipantCount", async function () {
        const stack = await deployMedVaultStack();
        const { trialId, nullifier } = await setupAcceptedApplicant(stack);
        await stack.sponsorIncentiveVault
            .connect(stack.sponsor)
            .fundTrial(trialId, { value: 10n ** 18n });
        await stack.sponsorIncentiveVault
            .connect(stack.patient)
            .registerAnonymousParticipant(trialId, nullifier);
        expect(await stack.sponsorIncentiveVault.getParticipantCount(trialId)).to.equal(1n);
    });

    it.skip("SIV-10: reclaimUndistributed when pool unfunded after trial end", async function () {
        const stack = await deployMedVaultStack();
        const trialId = await createTrialForSponsor(stack);
        await time.increase(DEFAULT_TRIAL_PARAMS.duration + 1);
        await stack.sponsorIncentiveVault.connect(stack.sponsor).reclaimUndistributed(trialId);
        expect(await stack.sponsorIncentiveVault.reclaimFinalized(trialId)).to.equal(true);
    });

    it("SIV-11: owner resetPaginationState", async function () {
        const stack = await deployMedVaultStack();
        const trialId = await createTrialForSponsor(stack);
        await stack.sponsorIncentiveVault.connect(stack.owner).resetPaginationState(trialId, 0);
    });

    it("SIV-12: fund locked after registration begins", async function () {
        const stack = await deployMedVaultStack();
        const { trialId, nullifier } = await setupAcceptedApplicant(stack);
        await stack.sponsorIncentiveVault
            .connect(stack.sponsor)
            .fundTrial(trialId, { value: 10n ** 18n });
        await stack.sponsorIncentiveVault
            .connect(stack.patient)
            .registerAnonymousParticipant(trialId, nullifier);
        await expectRevert(
            stack.sponsorIncentiveVault
                .connect(stack.sponsor)
                .fundTrial(trialId, { value: 1n }),
            "Funding locked"
        );
    });

    it("SIV-13: claim without registration reverts", async function () {
        const stack = await deployMedVaultStack();
        const trialId = await createTrialForSponsor(stack);
        await expectRevert(
            stack.sponsorIncentiveVault
                .connect(stack.patient)
                .claimParticipantRewards(trialId, 1n, stack.patient.address, 1, "0x", 1),
            /Patient not registered|reverted/
        );
    });

    it("SIV-14: distributePartial requires ended trial", async function () {
        const stack = await deployMedVaultStack();
        const trialId = await createTrialForSponsor(stack);
        await expectRevert(
            stack.sponsorIncentiveVault.connect(stack.sponsor).distributePartial(trialId, 0),
            /Trial not yet ended|reverted/
        );
    });

    it("SIV-15: getTotalDeposited tracks funding", async function () {
        const stack = await deployMedVaultStack();
        const trialId = await createTrialForSponsor(stack);
        const amt = 5n * 10n ** 17n;
        await stack.sponsorIncentiveVault.connect(stack.sponsor).fundTrial(trialId, { value: amt });
        expect(await stack.sponsorIncentiveVault.getTotalDeposited(trialId)).to.equal(amt);
    });

    it("SIV-16: register without pool reverts", async function () {
        const stack = await deployMedVaultStack();
        const { trialId, nullifier } = await setupAcceptedApplicant(stack);
        await expectRevert(
            stack.sponsorIncentiveVault
                .connect(stack.patient)
                .registerAnonymousParticipant(trialId, nullifier),
            "No incentive pool"
        );
    });
});

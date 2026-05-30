import { expect } from "chai";
import { deployMedVaultStack } from "../../test-support/deployments";
import { createEncryptedUint64 } from "../../test-support/fhe";
import { expectRevert } from "../../test-support/assertions";

describe("Unit: SponsorRegistry", function () {
    it("SR-01: request sponsorship", async function () {
        const stack = await deployMedVaultStack();
        const enc = await createEncryptedUint64(stack.sponsor2.address, stack.sponsor2.address, 42);
        await stack.sponsorRegistry
            .connect(stack.sponsor2)
            .requestSponsorship(enc);
        const req = await stack.sponsorRegistry.requests(stack.sponsor2.address);
        expect(req.status).to.equal(1); // Pending
    });

    it("SR-02: owner approves via addSponsor", async function () {
        const stack = await deployMedVaultStack();
        await stack.sponsorRegistry.connect(stack.owner).addSponsor(stack.sponsor2.address, "S2");
        expect(await stack.sponsorRegistry.isVerifiedSponsor(stack.sponsor2.address)).to.equal(true);
    });

    it("SR-03: reject sponsorship", async function () {
        const stack = await deployMedVaultStack();
        const enc = await createEncryptedUint64(stack.sponsor2.address, stack.sponsor2.address, 1);
        await stack.sponsorRegistry
            .connect(stack.sponsor2)
            .requestSponsorship(enc);
        await stack.sponsorRegistry.connect(stack.owner).rejectSponsorship(stack.sponsor2.address);
        const req = await stack.sponsorRegistry.requests(stack.sponsor2.address);
        expect(req.status).to.equal(3); // Rejected
    });

    it("SR-04: remove sponsor", async function () {
        const stack = await deployMedVaultStack();
        await stack.sponsorRegistry.connect(stack.owner).removeSponsor(stack.sponsor.address);
        expect(await stack.sponsorRegistry.isVerifiedSponsor(stack.sponsor.address)).to.equal(false);
    });

    it("SR-05: double pending request reverts", async function () {
        const stack = await deployMedVaultStack();
        const enc = await createEncryptedUint64(stack.sponsor2.address, stack.sponsor2.address, 1);
        await stack.sponsorRegistry
            .connect(stack.sponsor2)
            .requestSponsorship(enc);
        const enc2 = await createEncryptedUint64(stack.sponsor2.address, stack.sponsor2.address, 1);
        await expectRevert(
            stack.sponsorRegistry.connect(stack.sponsor2).requestSponsorship(enc2),
            /Request already exists|reverted/
        );
    });

    it("SR-06: encrypted institution id stored on request", async function () {
        const stack = await deployMedVaultStack();
        const enc = await createEncryptedUint64(stack.sponsor2.address, stack.sponsor2.address, 99);
        await stack.sponsorRegistry
            .connect(stack.sponsor2)
            .requestSponsorship(enc);
        const req = await stack.sponsorRegistry.requests(stack.sponsor2.address);
        expect(req.hasEncryptedData).to.equal(true);
    });

    it("SR-07: isVerifiedSponsor false for stranger", async function () {
        const stack = await deployMedVaultStack();
        expect(await stack.sponsorRegistry.isVerifiedSponsor(stack.stranger.address)).to.equal(
            false
        );
    });

    it("SR-08: isVerifiedSponsor true after add", async function () {
        const stack = await deployMedVaultStack();
        expect(await stack.sponsorRegistry.isVerifiedSponsor(stack.sponsor.address)).to.equal(true);
    });

    it("SR-09: re-request after reject", async function () {
        const stack = await deployMedVaultStack();
        const enc = await createEncryptedUint64(stack.sponsor2.address, stack.sponsor2.address, 1);
        await stack.sponsorRegistry
            .connect(stack.sponsor2)
            .requestSponsorship(enc);
        await stack.sponsorRegistry.connect(stack.owner).rejectSponsorship(stack.sponsor2.address);
        await stack.sponsorRegistry
            .connect(stack.sponsor2)
            .requestSponsorship(enc);
        const req = await stack.sponsorRegistry.requests(stack.sponsor2.address);
        expect(req.status).to.equal(1);
    });

    it("SR-10: non-owner addSponsor reverts", async function () {
        const stack = await deployMedVaultStack();
        await expectRevert(
            stack.sponsorRegistry.connect(stack.stranger).addSponsor(stack.stranger.address, "X"),
            "Only owner"
        );
    });
});

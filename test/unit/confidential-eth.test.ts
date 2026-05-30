import { expect } from "chai";
import { deployMedVaultStack } from "../../test-support/deployments";
import { CET_MIN_DEPOSIT_WEI } from "../../test-support/constants";
import { expectRevert } from "../../test-support/assertions";
import { impersonateAccount } from "../../test-support/signers";
import { coerceFheHandle } from "../../test-support/fhe";

describe("Unit: ConfidentialETH", function () {
    it("CET-01: deposit increases balance handle", async function () {
        const stack = await deployMedVaultStack();
        await stack.confidentialETH.connect(stack.patient).deposit({ value: CET_MIN_DEPOSIT_WEI });
        const bal = await stack.confidentialETH.getBalance(stack.patient.address);
        expect(coerceFheHandle(bal)).to.be.gt(0n);
    });

    it("CET-02: zero deposit reverts", async function () {
        const stack = await deployMedVaultStack();
        await expectRevert(
            stack.confidentialETH.connect(stack.patient).deposit({ value: 0 }),
            /Amount must be > 0|reverted/
        );
    });

    it("CET-03: unauthorized depositFor reverts", async function () {
        const stack = await deployMedVaultStack();
        await expectRevert(
            stack.confidentialETH
                .connect(stack.stranger)
                .depositFor(stack.patient.address, { value: CET_MIN_DEPOSIT_WEI }),
            /Not authorized|reverted/
        );
    });

    it("CET-04: authorized depositFor succeeds", async function () {
        const stack = await deployMedVaultStack();
        const vaultSigner = await impersonateAccount(await stack.sponsorIncentiveVault.getAddress());
        await stack.confidentialETH
            .connect(vaultSigner)
            .depositFor(stack.patient.address, { value: CET_MIN_DEPOSIT_WEI });
        const bal = await stack.confidentialETH.getBalance(stack.patient.address);
        expect(coerceFheHandle(bal)).to.be.gt(0n);
    });

    it("CET-05: authorize and deauthorize contract", async function () {
        const stack = await deployMedVaultStack();
        await stack.confidentialETH
            .connect(stack.owner)
            .deauthorizeContract(await stack.sponsorIncentiveVault.getAddress());
        expect(
            await stack.confidentialETH.authorizedContracts(
                await stack.sponsorIncentiveVault.getAddress()
            )
        ).to.equal(false);
        await stack.confidentialETH
            .connect(stack.owner)
            .authorizeContract(await stack.sponsorIncentiveVault.getAddress());
        expect(
            await stack.confidentialETH.authorizedContracts(
                await stack.sponsorIncentiveVault.getAddress()
            )
        ).to.equal(true);
    });

    it("CET-06: withdraw without valid sig reverts", async function () {
        const stack = await deployMedVaultStack();
        await stack.confidentialETH.connect(stack.patient).deposit({ value: CET_MIN_DEPOSIT_WEI });
        await expectRevert(
            stack.confidentialETH.connect(stack.patient).withdraw(1, "0x", 1),
            /revert/
        );
    });

    it("CET-07: transferEncrypted between authorized contracts", async function () {
        const stack = await deployMedVaultStack();
        const vaultSigner = await impersonateAccount(await stack.sponsorIncentiveVault.getAddress());
        await stack.confidentialETH
            .connect(vaultSigner)
            .depositFor(stack.patient.address, { value: CET_MIN_DEPOSIT_WEI * 2n });
        const bal = await stack.confidentialETH.getBalance(stack.patient.address);
        await stack.confidentialETH
            .connect(vaultSigner)
            .transferEncrypted(stack.patient.address, stack.sponsor.address, bal);
        const sponsorBal = await stack.confidentialETH.getBalance(stack.sponsor.address);
        expect(coerceFheHandle(sponsorBal)).to.be.gt(0n);
    });

    it("CET-08: withdrawTo only authorized", async function () {
        const stack = await deployMedVaultStack();
        await expectRevert(
            stack.confidentialETH
                .connect(stack.stranger)
                .getFunction("withdrawTo(address,address,uint64,bytes,uint64)")(
                    stack.patient.address,
                    stack.stranger.address,
                    1,
                    "0x",
                    1
                ),
            /Not authorized|reverted/
        );
    });

    it("CET-09: withdrawNonces start at zero", async function () {
        const stack = await deployMedVaultStack();
        expect(await stack.confidentialETH.withdrawNonces(stack.patient.address)).to.equal(0n);
    });

    it("CET-10: getBalance returns handle", async function () {
        const stack = await deployMedVaultStack();
        await stack.confidentialETH.connect(stack.patient).deposit({ value: CET_MIN_DEPOSIT_WEI });
        const bal = await stack.confidentialETH.getBalance(stack.patient.address);
        expect(coerceFheHandle(bal)).to.be.gt(0n);
    });

    it("CET-11: min deposit below UNIT_SCALE reverts", async function () {
        const stack = await deployMedVaultStack();
        await expectRevert(
            stack.confidentialETH.connect(stack.patient).deposit({ value: 1n }),
            /Min deposit|reverted/
        );
    });

    it("CET-12: UNIT_SCALE constant", async function () {
        const stack = await deployMedVaultStack();
        expect(await stack.confidentialETH.UNIT_SCALE()).to.equal(CET_MIN_DEPOSIT_WEI);
    });
});

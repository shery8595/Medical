import { expect } from "chai";
import { ethers } from "hardhat";
import { deployMedVaultStack } from "../../test-support/deployments";
import { expectRevert } from "../../test-support/assertions";

type OwnableContract = {
    proposeOwnership: (addr: string) => Promise<unknown>;
    acceptOwnership: () => Promise<unknown>;
    owner: () => Promise<string>;
    pendingOwner: () => Promise<string>;
    connect: (signer: { address: string }) => OwnableContract;
};

const OWNERSHIP_CONTRACTS: Array<{
    key: keyof Awaited<ReturnType<typeof deployMedVaultStack>>;
    label: string;
}> = [
    { key: "dataAccessLog", label: "DataAccessLog" },
    { key: "trialManager", label: "TrialManager" },
    { key: "sponsorRegistry", label: "SponsorRegistry" },
    { key: "anonymousPatientRegistry", label: "AnonymousPatientRegistry" },
    { key: "eligibilityEngine", label: "EligibilityEngine" },
    { key: "medVaultRegistry", label: "MedVaultRegistry" },
    { key: "confidentialETH", label: "ConfidentialETH" },
    { key: "encryptedConsentGate", label: "EncryptedConsentGate" },
    { key: "encryptedScoreLeaderboard", label: "EncryptedScoreLeaderboard" },
    { key: "sponsorIncentiveVault", label: "SponsorIncentiveVault" },
    { key: "trialMilestoneManager", label: "TrialMilestoneManager" },
    { key: "medVaultAutomation", label: "MedVaultAutomation" },
];

describe("Unit: two-step ownership", function () {
    let stack: Awaited<ReturnType<typeof deployMedVaultStack>>;

    beforeEach(async function () {
        stack = await deployMedVaultStack();
    });

    for (const { key, label } of OWNERSHIP_CONTRACTS) {
        it(`OWN-${label}-01: propose and accept ownership`, async function () {
            const contract = stack[key] as unknown as OwnableContract;
            const newOwner = stack.sponsor2;
            await contract.connect(stack.owner).proposeOwnership(newOwner.address);
            expect(await contract.pendingOwner()).to.equal(newOwner.address);
            await contract.connect(newOwner).acceptOwnership();
            expect(await contract.owner()).to.equal(newOwner.address);
            expect(await contract.pendingOwner()).to.equal(ethers.ZeroAddress);
        });

        it(`OWN-${label}-02: stranger cannot accept ownership`, async function () {
            const contract = stack[key] as unknown as OwnableContract;
            await contract.connect(stack.owner).proposeOwnership(stack.sponsor2.address);
            await expectRevert(
                contract.connect(stack.stranger).acceptOwnership(),
                /Not proposed owner|reverted/
            );
        });
    }
});

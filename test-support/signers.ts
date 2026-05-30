import hre, { ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/** Impersonate a contract or EOA and fund it for Hardhat transactions. */
export async function impersonateAccount(address: string): Promise<HardhatEthersSigner> {
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address],
    });
    await hre.network.provider.request({
        method: "hardhat_setBalance",
        params: [address, "0x1000000000000000000"],
    });
    return ethers.getSigner(address);
}

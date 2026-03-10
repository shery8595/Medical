const { ethers } = require("hardhat");

async function main() {
    const block = await ethers.provider.getBlockNumber();
    console.log("CURRENT_BLOCK:" + block);
}

main().catch((error) => {
    console.error(error);
    process.exit();
});

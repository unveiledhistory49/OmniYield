import { ethers } from "hardhat";

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Address:", signer.address);
    const balance = await ethers.provider.getBalance(signer.address);
    console.log("Balance:", balance.toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

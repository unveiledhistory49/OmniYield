
import { ethers } from "hardhat";

async function main() {
    // Aave V3 Pool (Base Sepolia)
    const POOL_ADDRESS = "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27";
    // USDC (Base Sepolia)
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

    console.log("Connecting to Pool:", POOL_ADDRESS);
    const pool = await ethers.getContractAt("IPool", POOL_ADDRESS);

    try {
        const data = await pool.getReserveData(USDC_ADDRESS);
        console.log("Reserve Data Fetched Successfully");
        console.log("aToken Address:", data.aTokenAddress);
    } catch (e) {
        console.error("Error fetching reserve data:", e);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

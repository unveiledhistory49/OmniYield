import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    // Check if Aave pool is live and USDC is a listed reserve
    const AAVE_POOL = "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27";
    const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

    const poolAbi = [
        "function getReserveData(address asset) view returns (tuple(uint256,uint128,uint128,uint128,uint128,uint128,uint40,uint16,address,address,address,address,uint128,uint128,uint128))"
    ];

    const pool = new ethers.Contract(AAVE_POOL, poolAbi, deployer);

    try {
        const data = await pool.getReserveData(USDC);
        console.log("Aave Reserve Data for USDC:");
        console.log("  aToken address:", data[8]);
        console.log("  Liquidity index:", data[1]?.toString());
        console.log("  Active: reserve data retrieved successfully");
    } catch (e: any) {
        console.log("Error reading Aave reserve:", e.message?.slice(0, 200));
    }

    // Direct supply test (skip vault)
    const usdcAbi = [
        "function approve(address,uint256) returns (bool)",
        "function balanceOf(address) view returns (uint256)",
    ];
    const usdc = new ethers.Contract(USDC, usdcAbi, deployer);

    const balance = await usdc.balanceOf(deployer.address);
    console.log("\nUSDC Balance:", ethers.formatUnits(balance, 6));

    // Try supplying directly to Aave Pool 
    const supplyAbi = ["function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)"];
    const poolSupply = new ethers.Contract(AAVE_POOL, supplyAbi, deployer);

    const testAmount = ethers.parseUnits("1", 6); // 1 USDC  

    console.log("\nApproving Aave Pool to spend 1 USDC...");
    const approveTx = await usdc.approve(AAVE_POOL, testAmount, { gasLimit: 100_000 });
    await approveTx.wait();
    console.log("Approved!");

    console.log("Supplying 1 USDC directly to Aave...");
    try {
        const supplyTx = await poolSupply.supply(USDC, testAmount, deployer.address, 0, { gasLimit: 500_000 });
        const receipt = await supplyTx.wait();
        console.log("Supply SUCCESS! TX:", supplyTx.hash, "Gas used:", receipt.gasUsed.toString());
    } catch (e: any) {
        console.log("Supply FAILED:", e.message?.slice(0, 300));
    }
}

main().catch(console.error);

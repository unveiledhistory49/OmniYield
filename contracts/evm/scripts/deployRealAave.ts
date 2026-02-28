import { ethers } from "hardhat";

async function main() {
    console.log("Starting Real Aave Strategy Deployment on Base Sepolia...");

    // Base Sepolia Addresses
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const AAVE_POOL_ADDRESS = "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27";
    const AAVE_ATOKEN_ADDRESS = "0x1116fcebcaae24d9c79e676063428989523cc096";

    // 1. Deploy Real Aave V3 Strategy
    console.log("Deploying AaveV3Strategy...");
    const StrategyFactory = await ethers.getContractFactory("AaveV3Strategy");
    const aaveStrategy = await StrategyFactory.deploy(
        USDC_ADDRESS,
        AAVE_POOL_ADDRESS,
        AAVE_ATOKEN_ADDRESS,
        {
            gasLimit: 3000000,
            maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei'),
            maxFeePerGas: ethers.parseUnits('5', 'gwei')
        }
    );
    await aaveStrategy.waitForDeployment();
    const strategyAddress = await aaveStrategy.getAddress();
    console.log(`AaveV3Strategy deployed to: ${strategyAddress}`);

    // 2. Deploy Vault
    console.log("Deploying OmniYieldVault...");
    const VaultFactory = await ethers.getContractFactory("OmniYieldVault");
    const vault = await VaultFactory.deploy(
        USDC_ADDRESS,
        "OmniYield Vault",
        "OYV",
        strategyAddress,
        {
            gasLimit: 3000000,
            maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei'),
            maxFeePerGas: ethers.parseUnits('5', 'gwei')
        }
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log(`OmniYieldVault deployed to: ${vaultAddress}`);

    console.log("\n=============================");
    console.log("Deployment Complete:");
    console.log(`Vault: ${vaultAddress}`);
    console.log(`Strategy: ${strategyAddress}`);
    console.log("=============================\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

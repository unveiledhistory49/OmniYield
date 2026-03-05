import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // ─── Real Base Sepolia Addresses ───
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Real testnet USDC (6 decimals)
    const AAVE_POOL_ADDRESS = "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27"; // Aave V3 Pool
    const AAVE_ATOKEN = "0x1116fcebcaae24d9c79e676063428989523cc096"; // aUSDC on Base Sepolia

    const FEE_RECIPIENT = deployer.address; // Will act as multisig placeholder
    const PERFORMANCE_FEE_BPS = 1500; // 15%

    const gasOverrides = {
        gasLimit: 5_000_000,
        maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
        maxFeePerGas: ethers.parseUnits("5", "gwei"),
    };

    // 1. Deploy AaveV3Strategy (Real Aave integration)
    console.log("\n1. Deploying AaveV3Strategy (Real Aave V3)...");
    const StrategyFactory = await ethers.getContractFactory("AaveV3Strategy");
    const strategy = await StrategyFactory.deploy(
        USDC_ADDRESS,
        AAVE_POOL_ADDRESS,
        AAVE_ATOKEN,
        gasOverrides
    );
    await strategy.waitForDeployment();
    const strategyAddress = await strategy.getAddress();
    console.log(`   AaveV3Strategy: ${strategyAddress}`);

    // Verify asset
    const strategyAsset = await strategy.asset();
    console.log(`   Strategy asset():  ${strategyAsset}`);

    // 2. Deploy V2 Vault with real Aave strategy
    console.log("\n2. Deploying OmniYieldVault V2 (Real Aave)...");
    const VaultFactory = await ethers.getContractFactory("OmniYieldVault");
    const vault = await VaultFactory.deploy(
        USDC_ADDRESS,
        "OmniYield USDC Vault",
        "oyUSDC",
        strategyAddress,
        FEE_RECIPIENT,
        PERFORMANCE_FEE_BPS,
        gasOverrides
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log(`   OmniYieldVault: ${vaultAddress}`);

    // 3. Summary
    console.log("\n═══════════════════════════════════════════════");
    console.log("  OmniYield V2 (Real Aave) Deployment Complete!");
    console.log("═══════════════════════════════════════════════");
    console.log(`  USDC (real):       ${USDC_ADDRESS}`);
    console.log(`  Aave Pool:         ${AAVE_POOL_ADDRESS}`);
    console.log(`  aUSDC:             ${AAVE_ATOKEN}`);
    console.log(`  AaveV3Strategy:    ${strategyAddress}`);
    console.log(`  OmniYield Vault:   ${vaultAddress}`);
    console.log(`  Fee Recipient:     ${FEE_RECIPIENT}`);
    console.log(`  Performance Fee:   ${PERFORMANCE_FEE_BPS / 100}%`);
    console.log("═══════════════════════════════════════════════\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

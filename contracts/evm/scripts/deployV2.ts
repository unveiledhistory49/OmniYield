import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

    // ─── Config ───
    const MOCK_USDC_ADDRESS = "0xd702668C0E1BB35166F53965e74399f535fe32a4";
    const FEE_RECIPIENT = deployer.address;
    const PERFORMANCE_FEE_BPS = 1500; // 15%

    const gasOverrides = {
        gasLimit: 5_000_000,
        maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
        maxFeePerGas: ethers.parseUnits("5", "gwei"),
    };

    // 1. Deploy SimpleYieldStrategy
    console.log("\n1. Deploying SimpleYieldStrategy...");
    const StrategyFactory = await ethers.getContractFactory("SimpleYieldStrategy");
    const strategy = await StrategyFactory.deploy(MOCK_USDC_ADDRESS, gasOverrides);
    await strategy.waitForDeployment();
    const strategyAddress = await strategy.getAddress();
    console.log(`   SimpleYieldStrategy: ${strategyAddress}`);

    // Verify asset() works
    const strategyAsset = await strategy.asset();
    console.log(`   Strategy asset():  ${strategyAsset}`);
    console.log(`   Expected asset:    ${MOCK_USDC_ADDRESS}`);

    // 2. Deploy V2 Vault
    console.log("\n2. Deploying OmniYieldVault V2...");
    const VaultFactory = await ethers.getContractFactory("OmniYieldVault");
    const vault = await VaultFactory.deploy(
        MOCK_USDC_ADDRESS,
        "OmniYield Vault V2",
        "OYV2",
        strategyAddress,
        FEE_RECIPIENT,
        PERFORMANCE_FEE_BPS,
        gasOverrides
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log(`   OmniYieldVault V2: ${vaultAddress}`);

    // 3. Summary
    console.log("\n═══════════════════════════════════════");
    console.log("  OmniYield V2 Deployment Complete!");
    console.log("═══════════════════════════════════════");
    console.log(`  MockUSDC:        ${MOCK_USDC_ADDRESS}`);
    console.log(`  SimpleYieldStrategy: ${strategyAddress}`);
    console.log(`  Vault V2:        ${vaultAddress}`);
    console.log(`  Fee Recipient:   ${FEE_RECIPIENT}`);
    console.log(`  Performance Fee: ${PERFORMANCE_FEE_BPS / 100}%`);
    console.log("═══════════════════════════════════════\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // ─── CORRECTED Base Sepolia Addresses ───
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Real testnet USDC (6 decimals)
    const AAVE_POOL_ADDRESS = "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27"; // Aave V3 Pool ✅
    const AAVE_ATOKEN = "0x4e65fe4dba92236447b69ab174c42df643956106"; // aUSDC on Base Sepolia

    const FEE_RECIPIENT = deployer.address;
    const PERFORMANCE_FEE_BPS = 1500; // 15%
    const DECIMALS = 6;
    const DEPOSIT_AMOUNT = ethers.parseUnits("10", DECIMALS); // 10 USDC

    const gasOverrides = {
        gasLimit: 5_000_000,
        maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
        maxFeePerGas: ethers.parseUnits("5", "gwei"),
    };
    const smallGas = {
        gasLimit: 500_000,
        maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
        maxFeePerGas: ethers.parseUnits("5", "gwei"),
    };

    // ═══════════════════════════════════════
    // STEP 1: Deploy AaveV3Strategy (corrected aToken)
    // ═══════════════════════════════════════
    console.log("\n1. Deploying AaveV3Strategy (corrected aUSDC)...");
    const StrategyFactory = await ethers.getContractFactory("AaveV3Strategy");
    const strategy = await StrategyFactory.deploy(
        USDC_ADDRESS, AAVE_POOL_ADDRESS, AAVE_ATOKEN, gasOverrides
    );
    await strategy.waitForDeployment();
    const strategyAddress = await strategy.getAddress();
    console.log(`   AaveV3Strategy: ${strategyAddress}`);

    // ═══════════════════════════════════════
    // STEP 2: Deploy V2 Vault
    // ═══════════════════════════════════════
    console.log("\n2. Deploying OmniYieldVault...");
    const VaultFactory = await ethers.getContractFactory("OmniYieldVault");
    const vault = await VaultFactory.deploy(
        USDC_ADDRESS, "OmniYield USDC Vault", "oyUSDC",
        strategyAddress, FEE_RECIPIENT, PERFORMANCE_FEE_BPS,
        gasOverrides
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log(`   OmniYieldVault: ${vaultAddress}`);

    // ═══════════════════════════════════════
    // STEP 3: Seed — Approve + Deposit 10 USDC
    // ═══════════════════════════════════════
    const usdcAbi = [
        "function approve(address,uint256) returns (bool)",
        "function balanceOf(address) view returns (uint256)",
    ];
    const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, deployer);

    const balance = await usdc.balanceOf(deployer.address);
    console.log(`\n3. USDC Balance: ${ethers.formatUnits(balance, DECIMALS)}`);

    console.log("   Approving vault...");
    const approveTx = await usdc.approve(vaultAddress, DEPOSIT_AMOUNT, smallGas);
    await approveTx.wait();
    console.log(`   Approved! TX: ${approveTx.hash}`);

    console.log("   Depositing 10 USDC...");
    const vaultContract = new ethers.Contract(vaultAddress, [
        "function deposit(uint256,address) returns (uint256)",
        "function totalAssets() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function harvest() returns (uint256)",
        "function performanceFeeBps() view returns (uint256)",
        "function feeRecipient() view returns (address)",
    ], deployer);

    const depositTx = await vaultContract.deposit(DEPOSIT_AMOUNT, deployer.address, smallGas);
    await depositTx.wait();
    console.log(`   Deposited! TX: ${depositTx.hash}`);

    // ═══════════════════════════════════════
    // STEP 4: Harvest
    // ═══════════════════════════════════════
    console.log("\n4. Calling harvest()...");
    try {
        const harvestTx = await vaultContract.harvest(smallGas);
        await harvestTx.wait();
        console.log(`   Harvested! TX: ${harvestTx.hash}`);
    } catch (e: any) {
        console.log(`   Harvest (expected 0 profit): ${e.message?.slice(0, 80)}`);
    }

    // ═══════════════════════════════════════
    // STEP 5: Final State
    // ═══════════════════════════════════════
    const shares = await vaultContract.balanceOf(deployer.address);
    const totalAssets = await vaultContract.totalAssets();

    console.log("\n═══════════════════════════════════════════════");
    console.log("  DEPLOYMENT + SEED COMPLETE!");
    console.log("═══════════════════════════════════════════════");
    console.log(`  USDC:              ${USDC_ADDRESS}`);
    console.log(`  Aave Pool:         ${AAVE_POOL_ADDRESS}`);
    console.log(`  aUSDC:             ${AAVE_ATOKEN}`);
    console.log(`  AaveV3Strategy:    ${strategyAddress}`);
    console.log(`  OmniYield Vault:   ${vaultAddress}`);
    console.log(`  Fee Recipient:     ${FEE_RECIPIENT}`);
    console.log(`  Performance Fee:   15%`);
    console.log(`  Total Assets:      ${ethers.formatUnits(totalAssets, DECIMALS)} USDC`);
    console.log(`  Deployer Shares:   ${ethers.formatUnits(shares, DECIMALS)} oyUSDC`);
    console.log("═══════════════════════════════════════════════\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

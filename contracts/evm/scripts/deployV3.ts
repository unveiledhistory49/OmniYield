import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // ─── Config ───
    const USDC_ADDRESS = "0xd702668C0E1BB35166F53965e74399f535fe32a4"; // TestUSDC (18 decimals)
    const FEE_RECIPIENT = deployer.address;
    const PERFORMANCE_FEE_BPS = 1500; // 15%
    const DECIMALS = 18;

    // Explicit nonce tracking
    let nonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
    console.log(`Starting nonce: ${nonce}`);

    const gas = (n: number) => ({
        gasLimit: 5_000_000,
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        maxFeePerGas: ethers.parseUnits("10", "gwei"),
        nonce: n,
    });
    const smallGas = (n: number) => ({
        gasLimit: 500_000,
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        maxFeePerGas: ethers.parseUnits("10", "gwei"),
        nonce: n,
    });

    // ═══════════════════════════════════════
    // STEP 1: Deploy SimpleYieldStrategy
    // ═══════════════════════════════════════
    console.log(`\n1. Deploying SimpleYieldStrategy... (nonce ${nonce})`);
    const StrategyFactory = await ethers.getContractFactory("SimpleYieldStrategy");
    const strategy = await StrategyFactory.deploy(USDC_ADDRESS, gas(nonce));
    await strategy.waitForDeployment();
    const strategyAddress = await strategy.getAddress();
    nonce++;
    console.log(`   ✅ SimpleYieldStrategy: ${strategyAddress}`);

    // ═══════════════════════════════════════
    // STEP 2: Deploy OmniYieldVault
    // ═══════════════════════════════════════
    console.log(`\n2. Deploying OmniYieldVault... (nonce ${nonce})`);
    const VaultFactory = await ethers.getContractFactory("OmniYieldVault");
    const vault = await VaultFactory.deploy(
        USDC_ADDRESS, "OmniYield USDC Vault", "oyUSDC",
        strategyAddress, FEE_RECIPIENT, PERFORMANCE_FEE_BPS,
        gas(nonce)
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    nonce++;
    console.log(`   ✅ OmniYieldVault: ${vaultAddress}`);

    // ═══════════════════════════════════════
    // STEP 3: Mint + Approve + Deposit 500 USDC
    // ═══════════════════════════════════════
    const usdc = new ethers.Contract(USDC_ADDRESS, [
        "function balanceOf(address) view returns (uint256)",
        "function approve(address,uint256) returns (bool)",
        "function mint(address,uint256)",
    ], deployer);

    console.log(`\n3. Minting 1000 TestUSDC... (nonce ${nonce})`);
    const mintTx = await usdc.mint(deployer.address, ethers.parseUnits("1000", DECIMALS), smallGas(nonce));
    await mintTx.wait();
    nonce++;

    console.log(`   Approving vault... (nonce ${nonce})`);
    const approveTx = await usdc.approve(vaultAddress, ethers.parseUnits("500", DECIMALS), smallGas(nonce));
    await approveTx.wait();
    nonce++;

    console.log(`   Depositing 500 USDC... (nonce ${nonce})`);
    const vaultContract = new ethers.Contract(vaultAddress, [
        "function deposit(uint256,address) returns (uint256)",
        "function totalAssets() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function harvest() returns (uint256)",
        "function performanceFeeBps() view returns (uint256)",
        "function feeRecipient() view returns (address)",
        "function totalHarvestedProfit() view returns (uint256)",
        "function totalFeesCollected() view returns (uint256)",
        "function lastHarvestTimestamp() view returns (uint256)",
    ], deployer);
    const depositTx = await vaultContract.deposit(ethers.parseUnits("500", DECIMALS), deployer.address, smallGas(nonce));
    await depositTx.wait();
    nonce++;
    console.log(`   ✅ Deposited! TX: ${depositTx.hash}`);

    // ═══════════════════════════════════════
    // STEP 4: Simulate 25 USDC yield + harvest
    // ═══════════════════════════════════════
    console.log(`\n4. Simulating 25 USDC yield... (nonce ${nonce})`);
    const yieldTx = await usdc.mint(strategyAddress, ethers.parseUnits("25", DECIMALS), smallGas(nonce));
    await yieldTx.wait();
    nonce++;

    console.log(`   Harvesting... (nonce ${nonce})`);
    const harvestTx = await vaultContract.harvest(smallGas(nonce));
    await harvestTx.wait();
    nonce++;
    console.log(`   ✅ Harvested! TX: ${harvestTx.hash}`);

    // ═══════════════════════════════════════
    // STEP 5: Second yield round
    // ═══════════════════════════════════════
    console.log(`\n5. Simulating 15 USDC yield (round 2)... (nonce ${nonce})`);
    const yield2Tx = await usdc.mint(strategyAddress, ethers.parseUnits("15", DECIMALS), smallGas(nonce));
    await yield2Tx.wait();
    nonce++;

    console.log(`   Harvesting (round 2)... (nonce ${nonce})`);
    const harvest2Tx = await vaultContract.harvest(smallGas(nonce));
    await harvest2Tx.wait();
    nonce++;
    console.log(`   ✅ Harvested! TX: ${harvest2Tx.hash}`);

    // ═══════════════════════════════════════
    // Final State
    // ═══════════════════════════════════════
    const shares = await vaultContract.balanceOf(deployer.address);
    const totalAssets = await vaultContract.totalAssets();
    const feeBps = await vaultContract.performanceFeeBps();
    const feeRecip = await vaultContract.feeRecipient();
    const harvestedProfit = await vaultContract.totalHarvestedProfit();
    const feesCollected = await vaultContract.totalFeesCollected();
    const lastHarvest = await vaultContract.lastHarvestTimestamp();

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  🚀 OmniYield V3 — Fully Deployed + Seeded!");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`  TestUSDC:              ${USDC_ADDRESS}`);
    console.log(`  SimpleYieldStrategy:   ${strategyAddress}`);
    console.log(`  OmniYieldVault:        ${vaultAddress}`);
    console.log(`  Fee Recipient:         ${FEE_RECIPIENT}`);
    console.log(`  Performance Fee:       ${Number(feeBps) / 100}%`);
    console.log(`  ─────────────────────────────────────`);
    console.log(`  Total Assets:          ${ethers.formatUnits(totalAssets, DECIMALS)} USDC`);
    console.log(`  Deployer Shares:       ${ethers.formatUnits(shares, DECIMALS)} oyUSDC`);
    console.log(`  Harvested Profit:      ${ethers.formatUnits(harvestedProfit, DECIMALS)} USDC`);
    console.log(`  Fees Collected:        ${ethers.formatUnits(feesCollected, DECIMALS)} USDC`);
    console.log(`  Last Harvest:          ${new Date(Number(lastHarvest) * 1000).toISOString()}`);
    console.log("═══════════════════════════════════════════════════════════");
    console.log("\n  ➡️  Update src/lib/config/contracts.ts:");
    console.log(`     SEPOLIA_VAULT_ADDRESS = "${vaultAddress}"`);
    console.log(`     SEPOLIA_USDC_ADDRESS  = "${USDC_ADDRESS}"`);
    console.log("═══════════════════════════════════════════════════════════\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

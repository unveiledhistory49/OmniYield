import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // ─── V2 MockStrategy Vault (already deployed) ───
    const MOCK_USDC = "0xd702668C0E1BB35166F53965e74399f535fe32a4";
    const VAULT = "0xb70A0Ace4B5795F9cD89ABD53d920fB7407C6178";
    const STRATEGY = "0x4873f47E864773000952E0eb83dB749d61c26e60";
    const DECIMALS = 18; // MockERC20

    const DEPOSIT_AMOUNT = ethers.parseUnits("500", DECIMALS);

    // Explicit nonce tracking to prevent race conditions
    let nonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
    console.log(`Starting nonce: ${nonce}`);

    const gas = (n: number) => ({
        gasLimit: 500_000,
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        maxFeePerGas: ethers.parseUnits("10", "gwei"),
        nonce: n,
    });

    const usdc = new ethers.Contract(MOCK_USDC, [
        "function balanceOf(address) view returns (uint256)",
        "function approve(address,uint256) returns (bool)",
        "function mint(address,uint256)",
    ], deployer);

    const vault = new ethers.Contract(VAULT, [
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

    // ═══ STEP 1: Mint 1000 MockUSDC ═══
    console.log(`\n1. Minting 1000 MockUSDC... (nonce ${nonce})`);
    const mintTx = await usdc.mint(deployer.address, ethers.parseUnits("1000", DECIMALS), gas(nonce));
    await mintTx.wait();
    nonce++;
    const balance = await usdc.balanceOf(deployer.address);
    console.log(`   Balance: ${ethers.formatUnits(balance, DECIMALS)} mUSDC`);

    // ═══ STEP 2: Approve + Deposit 500 USDC ═══
    console.log(`\n2. Approving vault... (nonce ${nonce})`);
    const approveTx = await usdc.approve(VAULT, DEPOSIT_AMOUNT, gas(nonce));
    await approveTx.wait();
    nonce++;
    console.log(`   ✅ Approved!`);

    console.log(`   Depositing 500 USDC... (nonce ${nonce})`);
    const depositTx = await vault.deposit(DEPOSIT_AMOUNT, deployer.address, gas(nonce));
    await depositTx.wait();
    nonce++;
    console.log(`   ✅ Deposited! TX: ${depositTx.hash}`);

    // ═══ STEP 3: Simulate 25 USDC yield + harvest ═══
    const yieldAmount = ethers.parseUnits("25", DECIMALS);
    console.log(`\n3. Simulating 25 USDC yield... (nonce ${nonce})`);
    const yieldTx = await usdc.mint(STRATEGY, yieldAmount, gas(nonce));
    await yieldTx.wait();
    nonce++;

    console.log(`   Calling harvest()... (nonce ${nonce})`);
    const harvestTx = await vault.harvest(gas(nonce));
    await harvestTx.wait();
    nonce++;
    console.log(`   ✅ Harvested! TX: ${harvestTx.hash}`);

    // ═══ STEP 4: Second yield round ═══
    const yield2 = ethers.parseUnits("15", DECIMALS);
    console.log(`\n4. Simulating 15 USDC yield (round 2)... (nonce ${nonce})`);
    const yield2Tx = await usdc.mint(STRATEGY, yield2, gas(nonce));
    await yield2Tx.wait();
    nonce++;

    console.log(`   Calling harvest() (round 2)... (nonce ${nonce})`);
    const harvest2Tx = await vault.harvest(gas(nonce));
    await harvest2Tx.wait();
    nonce++;
    console.log(`   ✅ Harvested! TX: ${harvest2Tx.hash}`);

    // ═══ Final State ═══
    const shares = await vault.balanceOf(deployer.address);
    const totalAssets = await vault.totalAssets();
    const feeBps = await vault.performanceFeeBps();
    const feeRecip = await vault.feeRecipient();
    const harvestedProfit = await vault.totalHarvestedProfit();
    const feesCollected = await vault.totalFeesCollected();
    const lastHarvest = await vault.lastHarvestTimestamp();

    console.log("\n═══════════════════════════════════════");
    console.log("  VAULT SEEDED SUCCESSFULLY!");
    console.log("═══════════════════════════════════════");
    console.log(`  Total Assets:       ${ethers.formatUnits(totalAssets, DECIMALS)} USDC`);
    console.log(`  Deployer Shares:    ${ethers.formatUnits(shares, DECIMALS)} oyUSDC`);
    console.log(`  Harvested Profit:   ${ethers.formatUnits(harvestedProfit, DECIMALS)} USDC`);
    console.log(`  Fees Collected:     ${ethers.formatUnits(feesCollected, DECIMALS)} USDC`);
    console.log(`  Fee:                ${Number(feeBps) / 100}%`);
    console.log(`  Fee Recipient:      ${feeRecip}`);
    console.log(`  Last Harvest:       ${new Date(Number(lastHarvest) * 1000).toISOString()}`);
    console.log("═══════════════════════════════════════\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

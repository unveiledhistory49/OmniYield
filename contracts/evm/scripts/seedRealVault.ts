import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const VAULT_ADDRESS = "0xc2C4D75Ca1CaaF42056D42fA695747665F31dAE2";
    const DECIMALS = 6;
    const DEPOSIT_AMOUNT = ethers.parseUnits("10", DECIMALS);

    // Get current nonce and manually track it
    let nonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
    console.log(`Starting nonce: ${nonce}`);

    const gasOverrides = (n: number) => ({
        gasLimit: 500_000,
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        maxFeePerGas: ethers.parseUnits("10", "gwei"),
        nonce: n,
    });

    const usdc = new ethers.Contract(USDC_ADDRESS, [
        "function approve(address,uint256) returns (bool)",
        "function balanceOf(address) view returns (uint256)",
    ], deployer);

    const vault = new ethers.Contract(VAULT_ADDRESS, [
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

    const balance = await usdc.balanceOf(deployer.address);
    console.log(`USDC Balance: ${ethers.formatUnits(balance, DECIMALS)}`);

    // Step 1: Approve (nonce N)
    console.log(`\n1. Approving vault... (nonce ${nonce})`);
    const approveTx = await usdc.approve(VAULT_ADDRESS, DEPOSIT_AMOUNT, gasOverrides(nonce));
    console.log(`   TX: ${approveTx.hash}`);
    await approveTx.wait();
    console.log("   ✅ Approved!");
    nonce++;

    // Step 2: Deposit (nonce N+1)
    console.log(`\n2. Depositing 10 USDC... (nonce ${nonce})`);
    const depositTx = await vault.deposit(DEPOSIT_AMOUNT, deployer.address, gasOverrides(nonce));
    console.log(`   TX: ${depositTx.hash}`);
    await depositTx.wait();
    console.log("   ✅ Deposited!");
    nonce++;

    // Step 3: Harvest (nonce N+2)
    console.log(`\n3. Calling harvest()... (nonce ${nonce})`);
    try {
        const harvestTx = await vault.harvest(gasOverrides(nonce));
        console.log(`   TX: ${harvestTx.hash}`);
        await harvestTx.wait();
        console.log("   ✅ Harvested!");
    } catch (e: any) {
        console.log(`   (Expected 0 profit on fresh vault): ${e.message?.slice(0, 100)}`);
    }

    // Final state
    const shares = await vault.balanceOf(deployer.address);
    const totalAssets = await vault.totalAssets();
    const feeBps = await vault.performanceFeeBps();
    const feeRecip = await vault.feeRecipient();

    console.log("\n═══════════════════════════════════════");
    console.log("  VAULT SEEDED SUCCESSFULLY!");
    console.log("═══════════════════════════════════════");
    console.log(`  Vault:          ${VAULT_ADDRESS}`);
    console.log(`  Total Assets:   ${ethers.formatUnits(totalAssets, DECIMALS)} USDC`);
    console.log(`  Your Shares:    ${ethers.formatUnits(shares, DECIMALS)} oyUSDC`);
    console.log(`  Fee:            ${Number(feeBps) / 100}%`);
    console.log(`  Fee Recipient:  ${feeRecip}`);
    console.log("═══════════════════════════════════════\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

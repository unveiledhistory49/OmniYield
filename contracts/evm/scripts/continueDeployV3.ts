import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("ETH Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // ─── Already deployed ───
    const STRATEGY_ADDRESS = "0x596d2b5bf237712a66A57D3aEBfbb27699407907";
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const FEE_RECIPIENT = deployer.address;
    const PERFORMANCE_FEE_BPS = 1500;
    const DECIMALS = 6;
    const DEPOSIT_AMOUNT = ethers.parseUnits("10", DECIMALS);

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
    // STEP 1: Deploy Vault (strategy already deployed)
    // ═══════════════════════════════════════
    console.log("\n1. Deploying OmniYieldVault (using existing AaveV3Strategy)...");
    const VaultFactory = await ethers.getContractFactory("OmniYieldVault");
    const vault = await VaultFactory.deploy(
        USDC_ADDRESS, "OmniYield USDC Vault", "oyUSDC",
        STRATEGY_ADDRESS, FEE_RECIPIENT, PERFORMANCE_FEE_BPS,
        gasOverrides
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log(`   OmniYieldVault: ${vaultAddress}`);

    // ═══════════════════════════════════════
    // STEP 2: Approve + Deposit USDC
    // ═══════════════════════════════════════
    const usdcAbi = [
        "function approve(address,uint256) returns (bool)",
        "function balanceOf(address) view returns (uint256)",
    ];
    const usdc = new ethers.Contract(USDC_ADDRESS, usdcAbi, deployer);

    const balance = await usdc.balanceOf(deployer.address);
    console.log(`\n2. USDC Balance: ${ethers.formatUnits(balance, DECIMALS)}`);

    if (balance < DEPOSIT_AMOUNT) {
        console.log("   ⚠️  Not enough USDC to deposit 10. Skipping deposit + harvest.");
        console.log("   Get testnet USDC from: https://faucet.circle.com/");
    } else {
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
        ], deployer);

        const depositTx = await vaultContract.deposit(DEPOSIT_AMOUNT, deployer.address, smallGas);
        await depositTx.wait();
        console.log(`   Deposited! TX: ${depositTx.hash}`);

        // ═══════════════════════════════════════
        // STEP 3: Harvest
        // ═══════════════════════════════════════
        console.log("\n3. Calling harvest()...");
        try {
            const harvestTx = await vaultContract.harvest(smallGas);
            await harvestTx.wait();
            console.log(`   Harvested! TX: ${harvestTx.hash}`);
        } catch (e: any) {
            console.log(`   Harvest (expected 0 profit on fresh vault): ${e.message?.slice(0, 100)}`);
        }

        const shares = await vaultContract.balanceOf(deployer.address);
        const totalAssets = await vaultContract.totalAssets();
        console.log(`\n   Shares:       ${ethers.formatUnits(shares, DECIMALS)} oyUSDC`);
        console.log(`   Total Assets: ${ethers.formatUnits(totalAssets, DECIMALS)} USDC`);
    }

    // ═══════════════════════════════════════
    // Summary
    // ═══════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════");
    console.log("  DEPLOYMENT COMPLETE!");
    console.log("═══════════════════════════════════════════════");
    console.log(`  USDC:              ${USDC_ADDRESS}`);
    console.log(`  AaveV3Strategy:    ${STRATEGY_ADDRESS}`);
    console.log(`  OmniYield Vault:   ${vaultAddress}`);
    console.log(`  Fee Recipient:     ${FEE_RECIPIENT}`);
    console.log(`  Performance Fee:   15%`);
    console.log("═══════════════════════════════════════════════");
    console.log("\n  ➡️  Update src/lib/config/contracts.ts:");
    console.log(`     SEPOLIA_VAULT_ADDRESS = "${vaultAddress}"`);
    console.log(`     SEPOLIA_USDC_ADDRESS  = "${USDC_ADDRESS}"`);
    console.log(`     SEPOLIA_USDC_DECIMALS = 6`);
    console.log("═══════════════════════════════════════════════\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

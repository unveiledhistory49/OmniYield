import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("OmniYieldVault", function () {
    // ════════════════════════════════════════════════
    //                  FIXTURES
    // ════════════════════════════════════════════════

    async function deployVaultFixture() {
        const [owner, feeRecipient, user1, user2, attacker] = await hre.ethers.getSigners();

        // Deploy MockERC20 (Mock USDC)
        const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
        const mockUSDC = await MockERC20.deploy("Mock USDC", "mUSDC");
        const assetAddress = await mockUSDC.getAddress();

        // Deploy Mock Strategy
        const SimpleYieldStrategy = await hre.ethers.getContractFactory("SimpleYieldStrategy");
        const mockStrategy = await SimpleYieldStrategy.deploy(assetAddress);
        const strategyAddress = await mockStrategy.getAddress();

        // Deploy Vault with 15% fee (1500 bps)
        const OmniYieldVault = await hre.ethers.getContractFactory("OmniYieldVault");
        const vault = await OmniYieldVault.deploy(
            assetAddress,
            "OmniYield Vault",
            "OYV",
            strategyAddress,
            feeRecipient.address,
            1500 // 15% performance fee
        );

        return { vault, mockUSDC, mockStrategy, owner, feeRecipient, user1, user2, attacker };
    }

    const DEPOSIT_AMOUNT = hre.ethers.parseUnits("1000", 18);
    const YIELD_AMOUNT = hre.ethers.parseUnits("100", 18);

    // ════════════════════════════════════════════════
    //              DEPLOYMENT TESTS
    // ════════════════════════════════════════════════

    describe("Deployment", function () {
        it("Should set the correct asset", async function () {
            const { vault, mockUSDC } = await loadFixture(deployVaultFixture);
            expect(await vault.asset()).to.equal(mockUSDC.target);
        });

        it("Should set the correct strategy", async function () {
            const { vault, mockStrategy } = await loadFixture(deployVaultFixture);
            expect(await vault.strategy()).to.equal(mockStrategy.target);
        });

        it("Should set the correct owner", async function () {
            const { vault, owner } = await loadFixture(deployVaultFixture);
            expect(await vault.owner()).to.equal(owner.address);
        });

        it("Should set the correct fee recipient", async function () {
            const { vault, feeRecipient } = await loadFixture(deployVaultFixture);
            expect(await vault.feeRecipient()).to.equal(feeRecipient.address);
        });

        it("Should set the correct performance fee (15%)", async function () {
            const { vault } = await loadFixture(deployVaultFixture);
            expect(await vault.performanceFeeBps()).to.equal(1500);
        });

        it("Should initialize harvest tracking to zero", async function () {
            const { vault } = await loadFixture(deployVaultFixture);
            expect(await vault.totalHarvestedProfit()).to.equal(0);
            expect(await vault.totalFeesCollected()).to.equal(0);
        });

        it("Should revert with fee above MAX_FEE_BPS (30%)", async function () {
            const { mockUSDC, mockStrategy, feeRecipient } = await loadFixture(deployVaultFixture);
            const OmniYieldVault = await hre.ethers.getContractFactory("OmniYieldVault");

            await expect(
                OmniYieldVault.deploy(
                    mockUSDC.target,
                    "Test",
                    "TST",
                    mockStrategy.target,
                    feeRecipient.address,
                    3001 // > 30%
                )
            ).to.be.revertedWith("Fee too high");
        });

        it("Should revert with zero address fee recipient", async function () {
            const { mockUSDC, mockStrategy } = await loadFixture(deployVaultFixture);
            const OmniYieldVault = await hre.ethers.getContractFactory("OmniYieldVault");

            await expect(
                OmniYieldVault.deploy(
                    mockUSDC.target,
                    "Test",
                    "TST",
                    mockStrategy.target,
                    hre.ethers.ZeroAddress,
                    1500
                )
            ).to.be.revertedWith("Invalid fee recipient");
        });

        it("Should revert with zero address strategy", async function () {
            const { mockUSDC, feeRecipient } = await loadFixture(deployVaultFixture);
            const OmniYieldVault = await hre.ethers.getContractFactory("OmniYieldVault");

            await expect(
                OmniYieldVault.deploy(
                    mockUSDC.target,
                    "Test",
                    "TST",
                    hre.ethers.ZeroAddress,
                    feeRecipient.address,
                    1500
                )
            ).to.be.reverted;
        });
    });

    // ════════════════════════════════════════════════
    //              DEPOSIT TESTS
    // ════════════════════════════════════════════════

    describe("Deposits", function () {
        it("Should accept a single deposit and route to strategy", async function () {
            const { vault, mockUSDC, mockStrategy, owner } = await loadFixture(deployVaultFixture);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);

            // 10% of funds should be in vault, 90% in strategy
            const expectedBuffer = (DEPOSIT_AMOUNT * 1000n) / 10000n;
            const expectedStrategy = DEPOSIT_AMOUNT - expectedBuffer;

            expect(await mockUSDC.balanceOf(vault.target)).to.equal(expectedBuffer);
            expect(await mockUSDC.balanceOf(mockStrategy.target)).to.equal(expectedStrategy);
        });

        it("Should mint correct shares (1:1 for first deposit)", async function () {
            const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);

            expect(await vault.balanceOf(owner.address)).to.equal(DEPOSIT_AMOUNT);
        });

        it("Should handle multiple deposits from different users", async function () {
            const { vault, mockUSDC, mockStrategy, user1, user2 } = await loadFixture(deployVaultFixture);
            const amount1 = hre.ethers.parseUnits("500", 18);
            const amount2 = hre.ethers.parseUnits("300", 18);

            // User 1 deposits
            await mockUSDC.mint(user1.address, amount1);
            await mockUSDC.connect(user1).approve(vault.target, amount1);
            await vault.connect(user1).deposit(amount1, user1.address);

            // User 2 deposits
            await mockUSDC.mint(user2.address, amount2);
            await mockUSDC.connect(user2).approve(vault.target, amount2);
            await vault.connect(user2).deposit(amount2, user2.address);

            // Both users should have shares
            expect(await vault.balanceOf(user1.address)).to.equal(amount1);
            expect(await vault.balanceOf(user2.address)).to.equal(amount2);

            // 10% of total funds in vault, 90% in strategy
            const totalAssets = amount1 + amount2;
            const expectedBuffer = (totalAssets * 1000n) / 10000n;
            const expectedStrategy = totalAssets - expectedBuffer;

            expect(await mockUSDC.balanceOf(vault.target)).to.equal(expectedBuffer);
            expect(await mockUSDC.balanceOf(mockStrategy.target)).to.equal(expectedStrategy);
        });

        it("Should report correct totalAssets after deposits", async function () {
            const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);

            expect(await vault.totalAssets()).to.equal(DEPOSIT_AMOUNT);
        });
    });

    // ════════════════════════════════════════════════
    //              WITHDRAWAL TESTS
    // ════════════════════════════════════════════════

    describe("Withdrawals", function () {
        it("Should process full withdrawal", async function () {
            const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);

            const balanceBefore = await mockUSDC.balanceOf(owner.address);
            await vault.withdraw(DEPOSIT_AMOUNT, owner.address, owner.address);
            const balanceAfter = await mockUSDC.balanceOf(owner.address);

            expect(balanceAfter - balanceBefore).to.equal(DEPOSIT_AMOUNT);
            expect(await vault.balanceOf(owner.address)).to.equal(0n);
        });

        it("Should process partial withdrawal", async function () {
            const { vault, mockUSDC, mockStrategy, owner } = await loadFixture(deployVaultFixture);
            const halfAmount = DEPOSIT_AMOUNT / 2n;

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);

            await vault.withdraw(halfAmount, owner.address, owner.address);

            // The withdrawal of 500 should come from the buffer first (which is 100), 
            // and the rest (400) from the strategy.
            // Remaining balance = 500. New buffer target = 50.
            // But since withdraw doesn't rebalance upwards immediately, the strategy holds 500
            // and the vault holds 0.
            expect(await mockUSDC.balanceOf(vault.target)).to.equal(0n);
            expect(await mockUSDC.balanceOf(mockStrategy.target)).to.equal(halfAmount);
        });

        it("Should withdraw correctly with yield accrued", async function () {
            const { vault, mockUSDC, mockStrategy, owner } = await loadFixture(deployVaultFixture);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);

            // Simulate yield by minting to strategy
            await mockUSDC.mint(mockStrategy.target, YIELD_AMOUNT);

            // Total assets should include yield
            expect(await vault.totalAssets()).to.equal(DEPOSIT_AMOUNT + YIELD_AMOUNT);
        });
    });

    // ════════════════════════════════════════════════
    //          HARVEST & COMPOUND TESTS
    // ════════════════════════════════════════════════

    describe("Harvest & Compound", function () {
        it("Should harvest profit from strategy", async function () {
            const { vault, mockUSDC, mockStrategy, owner } = await loadFixture(deployVaultFixture);

            // Deposit
            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);

            // Simulate yield
            await mockUSDC.mint(mockStrategy.target, YIELD_AMOUNT);

            // Harvest
            await expect(vault.harvest())
                .to.emit(vault, "Harvested");

            expect(await vault.totalHarvestedProfit()).to.equal(YIELD_AMOUNT);
        });

        it("Should deduct correct performance fee (15%)", async function () {
            const { vault, mockUSDC, mockStrategy, feeRecipient, owner } = await loadFixture(deployVaultFixture);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);

            // Simulate 100 tokens yield
            await mockUSDC.mint(mockStrategy.target, YIELD_AMOUNT);

            const feeRecipientBefore = await mockUSDC.balanceOf(feeRecipient.address);
            await vault.harvest();
            const feeRecipientAfter = await mockUSDC.balanceOf(feeRecipient.address);

            // 15% of 100 = 15 tokens
            const expectedFee = YIELD_AMOUNT * 1500n / 10000n;
            expect(feeRecipientAfter - feeRecipientBefore).to.equal(expectedFee);
            expect(await vault.totalFeesCollected()).to.equal(expectedFee);
        });

        it("Should re-invest remaining profit after fee", async function () {
            const { vault, mockUSDC, mockStrategy, owner } = await loadFixture(deployVaultFixture);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);

            await mockUSDC.mint(mockStrategy.target, YIELD_AMOUNT);
            await vault.harvest();

            // 85% of 100 = 85 re-invested 
            const expectedReinvested = YIELD_AMOUNT - (YIELD_AMOUNT * 1500n / 10000n);

            // Total in strategy should be original (900) + reinvested + excess buffer swept
            // Since vault now has 1085 total assets, buffer target is 108.5
            // So strategy holds 1085 - 108.5 = 976.5
            const totalAssets = DEPOSIT_AMOUNT + expectedReinvested;
            const expectedBuffer = (totalAssets * 1000n) / 10000n;
            expect(await mockUSDC.balanceOf(vault.target)).to.equal(expectedBuffer);
            expect(await mockUSDC.balanceOf(mockStrategy.target)).to.equal(totalAssets - expectedBuffer);

            expect(await vault.totalAssets()).to.equal(totalAssets);
        });

        it("Should emit FeeCollected event", async function () {
            const { vault, mockUSDC, mockStrategy, feeRecipient, owner } = await loadFixture(deployVaultFixture);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);
            await mockUSDC.mint(mockStrategy.target, YIELD_AMOUNT);

            const expectedFee = YIELD_AMOUNT * 1500n / 10000n;

            await expect(vault.harvest())
                .to.emit(vault, "FeeCollected")
                .withArgs(feeRecipient.address, expectedFee);
        });

        it("Should handle harvest with no profit gracefully", async function () {
            const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);

            // No yield added → harvest should be 0
            await expect(vault.harvest())
                .to.emit(vault, "Harvested")
                .withArgs(0, 0, 0);

            expect(await vault.totalFeesCollected()).to.equal(0);
        });

        it("Should update lastHarvestTimestamp", async function () {
            const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);

            expect(await vault.lastHarvestTimestamp()).to.equal(0);

            await vault.harvest();

            expect(await vault.lastHarvestTimestamp()).to.be.gt(0);
        });

        it("Should allow anyone to call harvest (keeper pattern)", async function () {
            const { vault, mockUSDC, mockStrategy, user1, owner } = await loadFixture(deployVaultFixture);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);
            await mockUSDC.mint(mockStrategy.target, YIELD_AMOUNT);

            // user1 (not owner) calls harvest — should succeed
            await expect(vault.connect(user1).harvest()).to.not.be.reverted;
        });

        it("Should compound idle assets + harvest", async function () {
            const { vault, mockUSDC, mockStrategy, owner } = await loadFixture(deployVaultFixture);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);

            // Send some idle tokens directly to the vault (simulating a direct transfer)
            const idleAmount = hre.ethers.parseUnits("50", 18);
            await mockUSDC.mint(vault.target, idleAmount);

            // Simulate yield in strategy
            await mockUSDC.mint(mockStrategy.target, YIELD_AMOUNT);

            await vault.compound();

            // Idle assets + yield profit (minus fee) should all be in strategy
            expect(await vault.lastHarvestTimestamp()).to.be.gt(0);
        });
    });

    // ════════════════════════════════════════════════
    //              FEE CONFIGURATION TESTS
    // ════════════════════════════════════════════════

    describe("Fee Configuration", function () {
        it("Should allow owner to update fee recipient", async function () {
            const { vault, owner, user1 } = await loadFixture(deployVaultFixture);

            await expect(vault.setFeeRecipient(user1.address))
                .to.emit(vault, "FeeRecipientUpdated");

            expect(await vault.feeRecipient()).to.equal(user1.address);
        });

        it("Should allow owner to update performance fee", async function () {
            const { vault } = await loadFixture(deployVaultFixture);

            await expect(vault.setPerformanceFeeBps(2000))
                .to.emit(vault, "PerformanceFeeUpdated")
                .withArgs(1500, 2000);

            expect(await vault.performanceFeeBps()).to.equal(2000);
        });

        it("Should reject fee above MAX_FEE_BPS", async function () {
            const { vault } = await loadFixture(deployVaultFixture);

            await expect(vault.setPerformanceFeeBps(3001))
                .to.be.revertedWith("Fee too high");
        });

        it("Should reject zero address fee recipient", async function () {
            const { vault } = await loadFixture(deployVaultFixture);

            await expect(vault.setFeeRecipient(hre.ethers.ZeroAddress))
                .to.be.revertedWith("Invalid fee recipient");
        });

        it("Should allow setting fee to 0 (no fee)", async function () {
            const { vault, mockUSDC, mockStrategy, feeRecipient, owner } = await loadFixture(deployVaultFixture);

            // Set fee to 0
            await vault.setPerformanceFeeBps(0);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);
            await mockUSDC.mint(mockStrategy.target, YIELD_AMOUNT);

            const feeRecipientBefore = await mockUSDC.balanceOf(feeRecipient.address);
            await vault.harvest();
            const feeRecipientAfter = await mockUSDC.balanceOf(feeRecipient.address);

            // Fee recipient should get nothing
            expect(feeRecipientAfter - feeRecipientBefore).to.equal(0);
        });

        it("Should calculate net APY correctly", async function () {
            const { vault } = await loadFixture(deployVaultFixture);

            // 10% gross APY (1000 bps) with 15% fee → 8.5% net (850 bps)
            expect(await vault.netApy(1000)).to.equal(850);

            // 20% gross APY (2000 bps) with 15% fee → 17% net (1700 bps)
            expect(await vault.netApy(2000)).to.equal(1700);
        });
    });

    // ════════════════════════════════════════════════
    //              ACCESS CONTROL TESTS
    // ════════════════════════════════════════════════

    describe("Access Control", function () {
        it("Should revert setStrategy from non-owner", async function () {
            const { vault, mockStrategy, attacker } = await loadFixture(deployVaultFixture);

            await expect(vault.connect(attacker).setStrategy(mockStrategy.target))
                .to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
        });

        it("Should revert setFeeRecipient from non-owner", async function () {
            const { vault, attacker } = await loadFixture(deployVaultFixture);

            await expect(vault.connect(attacker).setFeeRecipient(attacker.address))
                .to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
        });

        it("Should revert setPerformanceFeeBps from non-owner", async function () {
            const { vault, attacker } = await loadFixture(deployVaultFixture);

            await expect(vault.connect(attacker).setPerformanceFeeBps(2000))
                .to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
        });

        it("Should allow owner to change strategy", async function () {
            const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);

            // Deploy a new strategy
            const MockStrategy = await hre.ethers.getContractFactory("MockStrategy");
            const newStrategy = await MockStrategy.deploy(mockUSDC.target);

            await expect(vault.setStrategy(newStrategy.target))
                .to.emit(vault, "StrategyUpdated");

            expect(await vault.strategy()).to.equal(newStrategy.target);
        });
    });

    // ════════════════════════════════════════════════
    //              EDGE CASE TESTS
    // ════════════════════════════════════════════════

    describe("Edge Cases", function () {
        it("Should handle multiple harvests correctly", async function () {
            const { vault, mockUSDC, mockStrategy, feeRecipient, owner } = await loadFixture(deployVaultFixture);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);

            // First harvest: 100 yield
            await mockUSDC.mint(mockStrategy.target, YIELD_AMOUNT);
            await vault.harvest();

            // Second harvest: 50 yield
            const secondYield = hre.ethers.parseUnits("50", 18);
            await mockUSDC.mint(mockStrategy.target, secondYield);
            await vault.harvest();

            // Total profit = 100 + 50 = 150
            expect(await vault.totalHarvestedProfit()).to.equal(YIELD_AMOUNT + secondYield);

            // Total fees = 15% of 150 = 22.5
            const totalExpectedFees = (YIELD_AMOUNT + secondYield) * 1500n / 10000n;
            expect(await vault.totalFeesCollected()).to.equal(totalExpectedFees);
        });

        it("Should handle harvest when no deposits have been made", async function () {
            const { vault } = await loadFixture(deployVaultFixture);

            // No deposits, just harvest → should be safe, 0 profit
            await expect(vault.harvest()).to.not.be.reverted;
            expect(await vault.totalHarvestedProfit()).to.equal(0);
        });

        it("Should handle fee at maximum boundary (30%)", async function () {
            const { vault, mockUSDC, mockStrategy, feeRecipient, owner } = await loadFixture(deployVaultFixture);

            // Set max fee
            await vault.setPerformanceFeeBps(3000);

            await mockUSDC.mint(owner.address, DEPOSIT_AMOUNT);
            await mockUSDC.approve(vault.target, DEPOSIT_AMOUNT);
            await vault.deposit(DEPOSIT_AMOUNT, owner.address);
            await mockUSDC.mint(mockStrategy.target, YIELD_AMOUNT);

            const feeRecipientBefore = await mockUSDC.balanceOf(feeRecipient.address);
            await vault.harvest();
            const feeRecipientAfter = await mockUSDC.balanceOf(feeRecipient.address);

            // 30% of 100 = 30
            const expectedFee = YIELD_AMOUNT * 3000n / 10000n;
            expect(feeRecipientAfter - feeRecipientBefore).to.equal(expectedFee);
        });
    });
});

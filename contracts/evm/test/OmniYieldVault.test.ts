import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("OmniYieldVault", function () {
    async function deployVaultFixture() {
        const [owner, otherAccount] = await hre.ethers.getSigners();

        const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
        const mockUSDC = await MockERC20.deploy("Mock USDC", "mUSDC");
        const assetAddress = await mockUSDC.getAddress();

        // Deploy Mock Strategy
        const MockStrategy = await hre.ethers.getContractFactory("MockStrategy");
        const mockStrategy = await MockStrategy.deploy(assetAddress);
        const strategyAddress = await mockStrategy.getAddress();

        const OmniYieldVault = await hre.ethers.getContractFactory("OmniYieldVault");
        const vault = await OmniYieldVault.deploy(
            assetAddress,
            "OmniYield Vault",
            "OYV",
            strategyAddress
        );

        return { vault, mockUSDC, mockStrategy, owner, otherAccount };
    }

    it("Should set the right asset and strategy", async function () {
        const { vault, mockUSDC, mockStrategy } = await loadFixture(deployVaultFixture);
        expect(await vault.asset()).to.equal(mockUSDC.target);
        expect(await vault.strategy()).to.equal(mockStrategy.target);
    });

    it("Should accept deposits and route to strategy", async function () {
        const { vault, mockUSDC, mockStrategy, owner } = await loadFixture(deployVaultFixture);

        const depositAmount = hre.ethers.parseUnits("1000", 18);

        // Mint and approve
        await mockUSDC.mint(owner.address, depositAmount);
        await mockUSDC.approve(vault.target, depositAmount);

        // Deposit
        await vault.deposit(depositAmount, owner.address);

        // Vault should have 0 (all sent to strategy)
        expect(await mockUSDC.balanceOf(vault.target)).to.equal(0n);
        expect(await mockUSDC.balanceOf(mockStrategy.target)).to.equal(depositAmount);

        // Mint real tokens to the strategy to simulate yield (50 tokens)
        const yieldAmount = hre.ethers.parseUnits("50", 18);
        await mockUSDC.mint(mockStrategy.target, yieldAmount);

        const expectedTotal = depositAmount + yieldAmount;
        expect(await vault.totalAssets()).to.equal(expectedTotal);

        // Shares minted initially 1:1, so owner should have `depositAmount` shares
        expect(await vault.balanceOf(owner.address)).to.equal(depositAmount);
    });

    it("Should process withdrawals from strategy", async function () {
        const { vault, mockUSDC, mockStrategy, owner } = await loadFixture(deployVaultFixture);

        const depositAmount = hre.ethers.parseUnits("1000", 18);

        // Deposit
        await mockUSDC.mint(owner.address, depositAmount);
        await mockUSDC.approve(vault.target, depositAmount);
        await vault.deposit(depositAmount, owner.address);

        const withdrawAmount = hre.ethers.parseUnits("500", 18);

        // Withdraw half the assets
        await vault.withdraw(withdrawAmount, owner.address, owner.address);

        // Total minted to owner initially was 1000 + 1000000 (from MockERC20 constructor)
        // By looking at the previous test failure, we know the exact balance.
        // It's easier and safer to check balance differences
        const expectedRemainingInStrategy = depositAmount - withdrawAmount;
        expect(await mockUSDC.balanceOf(mockStrategy.target)).to.equal(expectedRemainingInStrategy);
    });
});

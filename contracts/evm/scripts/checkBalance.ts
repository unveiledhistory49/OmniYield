import { ethers } from "hardhat";

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Address:", signer.address);

    // ETH balance
    const ethBal = await ethers.provider.getBalance(signer.address);
    console.log("ETH Balance:", ethers.formatEther(ethBal), "ETH");

    // Real Base Sepolia USDC balance
    const USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const erc20Abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
    const usdc = new ethers.Contract(USDC, erc20Abi, signer);

    try {
        const decimals = await usdc.decimals();
        const balance = await usdc.balanceOf(signer.address);
        console.log(`USDC Balance: ${ethers.formatUnits(balance, decimals)} USDC (${decimals} decimals)`);
    } catch (e: any) {
        console.log("USDC read error:", e.message);
    }

    // Also check MockERC20
    const MOCK_USDC = "0xd702668C0E1BB35166F53965e74399f535fe32a4";
    const mockUsdc = new ethers.Contract(MOCK_USDC, erc20Abi, signer);
    try {
        const decimals = await mockUsdc.decimals();
        const balance = await mockUsdc.balanceOf(signer.address);
        console.log(`MockUSDC Balance: ${ethers.formatUnits(balance, decimals)} mUSDC (${decimals} decimals)`);
    } catch (e: any) {
        console.log("MockUSDC read error:", e.message);
    }
}

main().catch(console.error);

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const OmniYieldMockModule = buildModule("OmniYieldMockModule", (m) => {
    // 1. Deploy Mock USDC
    const mockUSDC = m.contract("MockERC20", ["Mock USDC", "mUSDC"]);

    // 2. Deploy Mock Strategy
    const mockStrategy = m.contract("MockStrategy", [mockUSDC]);

    // 3. Deploy Vault
    const vault = m.contract("OmniYieldVault", [
        mockUSDC,
        "OmniYield Vault",
        "OYV",
        mockStrategy
    ]);

    return { mockUSDC, mockStrategy, vault };
});

export default OmniYieldMockModule;

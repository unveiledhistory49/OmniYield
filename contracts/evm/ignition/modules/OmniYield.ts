import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const OmniYieldModule = buildModule("OmniYieldModule", (m) => {
    // 1. Deploy test USDC
    const testUSDC = m.contract("MockERC20", ["Test USDC", "tUSDC"]);

    // 2. Deploy Aerodrome Strategy (using test USDC)
    const aeroStrategy = m.contract("AerodromeStrategy", [testUSDC]);

    // 3. Deploy OmniYield Vault
    const vault = m.contract("OmniYieldVault", [
        testUSDC,
        "OmniYield Base Vault",
        "OYV-BASE",
        aeroStrategy
    ]);

    return { testUSDC, aeroStrategy, vault };
});

export default OmniYieldModule;

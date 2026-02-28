import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const OmniYieldRealAaveModule = buildModule("OmniYieldRealAaveModule", (m) => {
    // Base Sepolia Addresses
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const AAVE_POOL_ADDRESS = "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27";
    const AAVE_ATOKEN_ADDRESS = "0x1116fcebcaae24d9c79e676063428989523cc096";

    // 1. Deploy Real Aave V3 Strategy
    const aaveStrategy = m.contract("AaveV3Strategy", [
        USDC_ADDRESS,
        AAVE_POOL_ADDRESS,
        AAVE_ATOKEN_ADDRESS
    ]);

    // 2. Deploy Vault
    const vault = m.contract("OmniYieldVault", [
        USDC_ADDRESS,
        "OmniYield Vault",
        "OYV",
        aaveStrategy
    ]);

    return { aaveStrategy, vault };
});

export default OmniYieldRealAaveModule;

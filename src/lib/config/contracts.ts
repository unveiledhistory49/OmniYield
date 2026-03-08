export const SEPOLIA_VAULT_ADDRESS = "0x88c115C3Fab2F18fFEAC14eC27E65C3854C4dEc4";
export const SEPOLIA_USDC_ADDRESS = "0xd702668C0E1BB35166F53965e74399f535fe32a4";

// MockERC20 = 18 decimals (Aave V3 on Base Sepolia doesn't list USDC as reserve)
export const SEPOLIA_USDC_DECIMALS = 18;

export const VAULT_ABI = [
    {
        "inputs": [
            { "internalType": "contract IERC20", "name": "asset_", "type": "address" },
            { "internalType": "string", "name": "name_", "type": "string" },
            { "internalType": "string", "name": "symbol_", "type": "string" },
            { "internalType": "contract IStrategy", "name": "strategy_", "type": "address" },
            { "internalType": "address", "name": "feeRecipient_", "type": "address" },
            { "internalType": "uint256", "name": "performanceFeeBps_", "type": "uint256" }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    // ── Views ──
    { "inputs": [], "name": "totalAssets", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "assets", "type": "uint256" }], "name": "convertToShares", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "shares", "type": "uint256" }], "name": "convertToAssets", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "asset", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    // ── Fee Views ──
    { "inputs": [], "name": "feeRecipient", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "performanceFeeBps", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "MAX_FEE_BPS", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "FEE_DENOMINATOR", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "liquidityBufferBps", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    // ── Referral Views ──
    { "inputs": [{ "internalType": "address", "name": "user", "type": "address" }], "name": "referrers", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "referrer", "type": "address" }], "name": "referrerPoints", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    // ── Harvest Tracking Views ──
    { "inputs": [], "name": "lastHarvestTimestamp", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "totalHarvestedProfit", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "totalFeesCollected", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "grossApyBps", "type": "uint256" }], "name": "netApy", "outputs": [{ "internalType": "uint256", "name": "netApyBps", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    // ── Strategy ──
    { "inputs": [], "name": "strategy", "outputs": [{ "internalType": "contract IStrategy", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    // ── Mutative ──
    { "inputs": [{ "internalType": "uint256", "name": "assets", "type": "uint256" }, { "internalType": "address", "name": "receiver", "type": "address" }], "name": "deposit", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "assets", "type": "uint256" }, { "internalType": "address", "name": "receiver", "type": "address" }, { "internalType": "address", "name": "referrer", "type": "address" }], "name": "depositWithReferral", "outputs": [{ "internalType": "uint256", "name": "shares", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "uint256", "name": "assets", "type": "uint256" }, { "internalType": "address", "name": "receiver", "type": "address" }, { "internalType": "address", "name": "owner", "type": "address" }], "name": "withdraw", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "harvest", "outputs": [{ "internalType": "uint256", "name": "profit", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "compound", "outputs": [{ "internalType": "uint256", "name": "profit", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" },
    // ── Events ──
    { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "profit", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "reinvested", "type": "uint256" }], "name": "Harvested", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "recipient", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "FeeCollected", "type": "event" },
] as const;

export const ERC20_ABI = [
    { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
] as const;

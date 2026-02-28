import type { Chain } from "./constants";

export interface Vault {
    id: string;
    name: string;
    chain: Chain;
    asset: string;
    apy: number;
    tvl: number;
    strategy: string;
    protocol: string;
    riskLevel: "low" | "medium" | "high";
    apyHistory: { date: string; value: number }[];
    tvlHistory: { date: string; value: number }[];
}

export interface PortfolioPosition {
    vaultId: string;
    vaultName: string;
    chain: Chain;
    asset: string;
    deposited: number;
    currentValue: number;
    yieldEarned: number;
    apy: number;
    shares: number;
}

export interface StatsData {
    totalTVL: number;
    totalUsers: number;
    totalYieldDistributed: number;
    avgAPY: number;
    vaultCount: number;
    supportedChains: number;
}

// Generate realistic APY history for 30 days
function generateApyHistory(baseApy: number): { date: string; value: number }[] {
    const data: { date: string; value: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const variance = (Math.random() - 0.5) * 2;
        data.push({
            date: date.toISOString().slice(0, 10),
            value: Math.max(0.1, baseApy + variance),
        });
    }
    return data;
}

// Generate realistic TVL history for 30 days
function generateTvlHistory(baseTvl: number): { date: string; value: number }[] {
    const data: { date: string; value: number }[] = [];
    const now = new Date();
    let tvl = baseTvl * 0.7;
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        tvl += (Math.random() - 0.3) * baseTvl * 0.03;
        tvl = Math.max(baseTvl * 0.5, tvl);
        data.push({
            date: date.toISOString().slice(0, 10),
            value: Math.round(tvl),
        });
    }
    return data;
}

export const MOCK_VAULTS: Vault[] = [
    {
        id: "sol-kamino-usdc",
        name: "Kamino USDC Lend",
        chain: "solana",
        asset: "USDC",
        apy: 8.42,
        tvl: 42_500_000,
        strategy: "Lending",
        protocol: "Kamino",
        riskLevel: "low",
        apyHistory: generateApyHistory(8.42),
        tvlHistory: generateTvlHistory(42_500_000),
    },
    {
        id: "sol-jito-sol",
        name: "Jito Staked SOL",
        chain: "solana",
        asset: "SOL",
        apy: 7.85,
        tvl: 156_000_000,
        strategy: "Liquid Staking",
        protocol: "Jito",
        riskLevel: "low",
        apyHistory: generateApyHistory(7.85),
        tvlHistory: generateTvlHistory(156_000_000),
    },
    {
        id: "sol-marinade-sol",
        name: "Marinade Staked SOL",
        chain: "solana",
        asset: "SOL",
        apy: 6.95,
        tvl: 98_000_000,
        strategy: "Liquid Staking",
        protocol: "Marinade",
        riskLevel: "low",
        apyHistory: generateApyHistory(6.95),
        tvlHistory: generateTvlHistory(98_000_000),
    },
    {
        id: "sol-kamino-sol",
        name: "Kamino SOL-USDC LP",
        chain: "solana",
        asset: "SOL/USDC",
        apy: 24.3,
        tvl: 18_900_000,
        strategy: "Liquidity Provision",
        protocol: "Kamino",
        riskLevel: "medium",
        apyHistory: generateApyHistory(24.3),
        tvlHistory: generateTvlHistory(18_900_000),
    },
    {
        id: "base-aave-usdc",
        name: "Aave V3 USDC",
        chain: "base",
        asset: "USDC",
        apy: 5.12,
        tvl: 320_000_000,
        strategy: "Lending",
        protocol: "Aave",
        riskLevel: "low",
        apyHistory: generateApyHistory(5.12),
        tvlHistory: generateTvlHistory(320_000_000),
    },
    {
        id: "base-aave-eth",
        name: "Aave V3 ETH",
        chain: "base",
        asset: "ETH",
        apy: 3.87,
        tvl: 245_000_000,
        strategy: "Lending",
        protocol: "Aave",
        riskLevel: "low",
        apyHistory: generateApyHistory(3.87),
        tvlHistory: generateTvlHistory(245_000_000),
    },
    {
        id: "base-aerodrome-eth-usdc",
        name: "Aerodrome ETH-USDC",
        chain: "base",
        asset: "ETH/USDC",
        apy: 18.65,
        tvl: 67_000_000,
        strategy: "Liquidity Provision",
        protocol: "Aerodrome",
        riskLevel: "medium",
        apyHistory: generateApyHistory(18.65),
        tvlHistory: generateTvlHistory(67_000_000),
    },
    {
        id: "base-compound-usdc",
        name: "Compound V3 USDC",
        chain: "base",
        asset: "USDC",
        apy: 4.55,
        tvl: 189_000_000,
        strategy: "Lending",
        protocol: "Compound",
        riskLevel: "low",
        apyHistory: generateApyHistory(4.55),
        tvlHistory: generateTvlHistory(189_000_000),
    },
    {
        id: "sepolia-omniyield-usdc",
        name: "OmniYield Sepolia Vault",
        chain: "sepolia",
        asset: "USDC (Mock)",
        apy: 12.5,
        tvl: 50_000,
        strategy: "Yield Aggregation",
        protocol: "OmniYield",
        riskLevel: "low",
        apyHistory: generateApyHistory(12.5),
        tvlHistory: generateTvlHistory(50_000),
    },
];

export const MOCK_PORTFOLIO: PortfolioPosition[] = [
    {
        vaultId: "sol-kamino-usdc",
        vaultName: "Kamino USDC Lend",
        chain: "solana",
        asset: "USDC",
        deposited: 50_000,
        currentValue: 52_450,
        yieldEarned: 2_450,
        apy: 8.42,
        shares: 49_875.32,
    },
    {
        vaultId: "sol-jito-sol",
        vaultName: "Jito Staked SOL",
        chain: "solana",
        asset: "SOL",
        deposited: 100,
        currentValue: 107.85,
        yieldEarned: 7.85,
        apy: 7.85,
        shares: 99.12,
    },
    {
        vaultId: "base-aave-usdc",
        vaultName: "Aave V3 USDC",
        chain: "base",
        asset: "USDC",
        deposited: 25_000,
        currentValue: 26_280,
        yieldEarned: 1_280,
        apy: 5.12,
        shares: 24_950.88,
    },
    {
        vaultId: "base-aerodrome-eth-usdc",
        vaultName: "Aerodrome ETH-USDC",
        chain: "base",
        asset: "ETH/USDC",
        deposited: 10_000,
        currentValue: 11_865,
        yieldEarned: 1_865,
        apy: 18.65,
        shares: 9_920.45,
    },
];

export const MOCK_STATS: StatsData = {
    totalTVL: 1_137_400_000,
    totalUsers: 28_450,
    totalYieldDistributed: 45_600_000,
    avgAPY: 11.21,
    vaultCount: 8,
    supportedChains: 2,
};

// Generate global TVL history over 6 months
export function generateGlobalTVLHistory(): { date: string; value: number }[] {
    const data: { date: string; value: number }[] = [];
    const now = new Date();
    let tvl = 200_000_000;
    for (let i = 179; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        tvl += (Math.random() - 0.35) * 8_000_000;
        tvl = Math.max(100_000_000, tvl);
        data.push({
            date: date.toISOString().slice(0, 10),
            value: Math.round(tvl),
        });
    }
    return data;
}

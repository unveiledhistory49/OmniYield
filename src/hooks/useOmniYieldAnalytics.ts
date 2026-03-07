import { useQuery } from "@tanstack/react-query";

export interface DefiLlamaPool {
    pool: string;
    project: string;
    symbol: string;
    chain: string;
    tvlUsd: number;
    apy: number;
    apyBase: number | null;
    apyReward: number | null;
    id: string;
    name: string;
}

export interface OmniAnalyticsData {
    totalTVL: number;
    baseTVL: number;
    solTVL: number;
    prices: {
        SOL: number;
        USDC: number;
        JitoSOL: number;
    };
    changes24h: {
        SOL: number;
    };
    strategies: {
        kaminoApy: number;
        aaveApy: number;
        aerodromeApy: number;
    };
    aaveV3Health?: {
        liveApy: number;
        utilization: number;
        totalLiquidity: string;
        totalDebt: string;
        timestamp: number;
    };
    vaults: DefiLlamaPool[];
    lastUpdated: number;
}

export function useOmniYieldAnalytics() {
    return useQuery<OmniAnalyticsData>({
        queryKey: ["omni-analytics"],
        queryFn: async () => {
            const res = await fetch("/api/analytics-data");
            if (!res.ok) throw new Error("Analytics fetch failed");
            const raw = await res.json();

            const vaults: DefiLlamaPool[] = [];
            let totalTVL = 0;
            let baseTVL = 0;
            let solTVL = 0;
            let kaminoApy = 0;
            let aaveApy = 0;
            let aerodromeApy = 0;

            if (raw.data) {
                for (const [name, match] of Object.entries<any>(raw.data)) {
                    // CRITICAL: Exclude metadata objects from being treated as vault pools
                    if (!match || name === "aaveV3Health") continue;

                    const vault = {
                        ...match,
                        id: name.toLowerCase().replace(/ /g, "-"),
                        name: name,
                        apy: match.apy ?? 0,
                        tvlUsd: match.tvlUsd ?? 0,
                        chain: match.chain ?? "Unknown",
                        protocol: match.project ?? match.protocol ?? "Unknown",
                    };
                    vaults.push(vault);

                    totalTVL += vault.tvlUsd;
                    if (vault.chain === "Base") {
                        baseTVL += vault.tvlUsd;
                        if (name === "Aave v3 base usdc") aaveApy = vault.apy;
                        if (name === "Aerodrome eth") aerodromeApy = vault.apy;
                    } else if (vault.chain === "Solana") {
                        solTVL += vault.tvlUsd;
                        if (name === "Kamino usdc") kaminoApy = vault.apy;
                    }
                }
            }

            // Prices are now managed outside the DefiLlama fetch
            let prices = { SOL: 0, USDC: 1, JitoSOL: 0 };
            let changes24h = { SOL: 0 };
            try {
                const cgRes = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana,usd-coin,jito-staked-sol&vs_currencies=usd&include_24hr_change=true");
                if (cgRes.ok) {
                    const cgJson = await cgRes.json();
                    prices = {
                        SOL: cgJson.solana?.usd ?? 0,
                        USDC: cgJson["usd-coin"]?.usd ?? 1,
                        JitoSOL: cgJson["jito-staked-sol"]?.usd ?? 0,
                    };
                    changes24h = {
                        SOL: cgJson.solana?.usd_24h_change ?? 0,
                    };
                }
            } catch (e) {
                console.warn("CoinGecko fetch failed:", e);
            }

            return {
                totalTVL,
                baseTVL,
                solTVL,
                prices,
                changes24h,
                strategies: { kaminoApy, aaveApy, aerodromeApy },
                aaveV3Health: raw.data?.aaveV3Health,
                vaults,
                lastUpdated: Date.now()
            };
        },
        refetchInterval: 60000, // 60s live refresh matches new backend cache
        staleTime: 30000,
    });
}

import { useMemo } from "react";
import { useOmniYieldAnalytics } from "@/hooks/useOmniYieldAnalytics";
import type { Chain } from "@/lib/constants";

export function useVaults(filterChain?: Chain) {
    const { data: liveData, isLoading, error } = useOmniYieldAnalytics();

    const vaults = useMemo(() => {
        if (!liveData?.vaults) return [];

        let processed = liveData.vaults.map((v) => ({
            id: v.id,
            name: v.name,
            protocol: v.project,
            chain: v.chain.toLowerCase() as Chain,
            asset: v.symbol,
            apy: v.apy,
            tvl: v.tvlUsd,
            strategy: v.project.toLowerCase().includes('aave') ? 'Overcollateralized Lending' :
                v.project.toLowerCase().includes('aerodrome') ? 'Concentrated Liquidity' :
                    v.project.toLowerCase().includes('kamino') ? 'Automated Lending' : 'Liquid Staking',
            riskLevel: (v.project.toLowerCase().includes('aerodrome') ? 'medium' : 'low') as "low" | "medium" | "high",
        }));

        if (filterChain) {
            processed = processed.filter((v) => v.chain === filterChain);
        }

        return processed;
    }, [liveData, filterChain]);

    return {
        vaults,
        allVaults: vaults,
        isLoading,
        error,
    };
}

import { useMemo } from "react";
import { useOmniYieldAnalytics } from "@/hooks/useOmniYieldAnalytics";
import type { Chain } from "@/lib/constants";

export function useVaults(filterChain?: Chain) {
    const { data: liveData, isLoading, error } = useOmniYieldAnalytics();

    const vaults = useMemo(() => {
        if (!liveData?.vaults) return [];

        let processed = liveData.vaults.map((v) => {
            const project = String(v.project || v.protocol || "").toLowerCase();
            return {
                id: v.id,
                name: v.name,
                protocol: v.protocol || "Unknown",
                chain: (v.chain?.toLowerCase() || "base") as Chain,
                asset: v.symbol || "Unknown",
                apy: v.apy || 0,
                tvl: v.tvlUsd || 0,
                strategy: project.includes('aave') ? 'Overcollateralized Lending' :
                    project.includes('aerodrome') ? 'Concentrated Liquidity' :
                        project.includes('kamino') ? 'Automated Lending' : 'Liquid Staking',
                riskLevel: (project.includes('aerodrome') ? 'medium' : 'low') as "low" | "medium" | "high",
            };
        });

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

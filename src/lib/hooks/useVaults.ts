"use client";

import { useMemo } from "react";
import { MOCK_VAULTS } from "@/lib/mock-data";
import { useChain } from "@/providers/wallet-provider";
import type { Chain } from "@/lib/constants";

export function useVaults(filterChain?: Chain) {
    const { chain } = useChain();
    const activeChain = filterChain ?? chain;

    const vaults = useMemo(() => {
        if (activeChain === "solana") {
            return MOCK_VAULTS.filter((v) => v.chain === "solana");
        }
        if (activeChain === "base") {
            return MOCK_VAULTS.filter((v) => v.chain === "base");
        }
        return MOCK_VAULTS;
    }, [activeChain]);

    return {
        vaults,
        allVaults: MOCK_VAULTS,
        isLoading: false,
        error: null,
        chain: activeChain,
    };
}

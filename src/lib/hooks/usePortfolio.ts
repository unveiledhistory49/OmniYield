"use client";

import { useState, useCallback, useMemo } from "react";
import { useWallet } from "./useWallet";
import { useOmniYieldAnalytics } from "@/hooks/useOmniYieldAnalytics";

export function usePortfolio() {
    const { isConnected } = useWallet();
    const { data: analytics } = useOmniYieldAnalytics();
    const [positions, setPositions] = useState([]);

    const stats = useMemo(() => {
        if (!isConnected || !analytics) {
            return {
                totalTVL: 0,
                totalUsers: 0,
                totalYieldDistributed: 0,
                avgAPY: 0,
                vaultCount: 0,
                supportedChains: 0,
            };
        }
        return {
            totalTVL: analytics.totalTVL,
            totalUsers: 1420,
            totalYieldDistributed: 120500,
            avgAPY: analytics.vaults && analytics.vaults.length > 0 ? analytics.vaults.reduce((acc, v) => acc + v.apy, 0) / analytics.vaults.length : 0,
            vaultCount: analytics.vaults.length,
            supportedChains: 2,
        };
    }, [isConnected, analytics]);

    const deposit = useCallback(
        (vaultId: string, amount: number) => {
            console.log("Deposit requested:", vaultId, amount);
        },
        []
    );

    const withdraw = useCallback(
        (vaultId: string, amount: number) => {
            console.log("Withdraw requested:", vaultId, amount);
        },
        []
    );

    return {
        positions: isConnected ? positions : [],
        stats,
        isLoading: false,
        deposit,
        withdraw,
    };
}

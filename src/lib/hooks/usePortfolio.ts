"use client";

import { useState, useCallback, useMemo } from "react";
import { MOCK_PORTFOLIO, MOCK_STATS } from "@/lib/mock-data";
import { useWallet } from "./useWallet";

export function usePortfolio() {
    const { isConnected } = useWallet();
    const [positions, setPositions] = useState(MOCK_PORTFOLIO);

    const stats = useMemo(() => {
        if (!isConnected) {
            return {
                totalTVL: 0,
                totalUsers: 0,
                totalYieldDistributed: 0,
                avgAPY: 0,
                vaultCount: 0,
                supportedChains: 0,
            };
        }
        return MOCK_STATS;
    }, [isConnected]);

    const deposit = useCallback(
        (vaultId: string, amount: number) => {
            setPositions((prev) =>
                prev.map((p) =>
                    p.vaultId === vaultId
                        ? { ...p, deposited: p.deposited + amount }
                        : p
                )
            );
        },
        []
    );

    const withdraw = useCallback(
        (vaultId: string, amount: number) => {
            setPositions((prev) =>
                prev.map((p) =>
                    p.vaultId === vaultId
                        ? {
                            ...p,
                            deposited: Math.max(0, p.deposited - amount),
                        }
                        : p
                )
            );
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

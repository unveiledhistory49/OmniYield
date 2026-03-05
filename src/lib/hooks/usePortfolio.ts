"use client";

import { useMemo } from "react";
import { useWallet } from "./useWallet";
import { useOmniYield } from "./useOmniYield";
import { formatUnits } from "viem";
import { SEPOLIA_USDC_DECIMALS } from "../config/contracts";

export interface Position {
    vaultId: string;
    vaultName: string;
    chain: string;
    deposited: number;
    currentValue: number;
    yieldEarned: number;
    apy: number;
}

export function usePortfolio() {
    const { isConnected } = useWallet();
    const { data: omniData } = useOmniYield();

    const positions = useMemo<Position[]>(() => {
        if (!isConnected || !omniData?.vaultBalance) return [];

        const shares = omniData.vaultBalance as bigint;
        if (shares === BigInt(0)) return [];

        // Calculate current value from shares (assuming 18 decimals for MockERC20)
        const sharesNum = parseFloat(formatUnits(shares, SEPOLIA_USDC_DECIMALS));
        const totalAssetsNum = omniData.totalAssets
            ? parseFloat(formatUnits(omniData.totalAssets as bigint, SEPOLIA_USDC_DECIMALS))
            : 0;

        // ERC4626: value = shares * totalAssets / totalSupply
        // Since we're reading our balance (shares) and totalAssets, estimate value
        const currentValue = sharesNum > 0 ? totalAssetsNum * (sharesNum / sharesNum) : 0;
        const deposited = sharesNum; // Initial 1:1 ratio for first depositor
        const yieldEarned = currentValue - deposited;

        return [{
            vaultId: "omniyield-usdc-vault",
            vaultName: "OmniYield USDC Vault",
            chain: "base",
            deposited,
            currentValue,
            yieldEarned: yieldEarned > 0 ? yieldEarned : 0,
            apy: 8.2, // Will come from analytics
        }];
    }, [isConnected, omniData?.vaultBalance, omniData?.totalAssets]);

    const stats = useMemo(() => {
        if (!isConnected || !omniData) {
            return {
                totalDeposited: 0,
                currentValue: 0,
                totalYieldEarned: 0,
                avgAPY: 0,
                totalHarvested: 0,
                totalFees: 0,
                feeBps: 0,
            };
        }

        const totalDeposited = positions.reduce((acc, p) => acc + p.deposited, 0);
        const currentValue = positions.reduce((acc, p) => acc + p.currentValue, 0);
        const totalYieldEarned = positions.reduce((acc, p) => acc + p.yieldEarned, 0);

        const totalHarvested = omniData.totalHarvestedProfit
            ? parseFloat(formatUnits(omniData.totalHarvestedProfit as bigint, SEPOLIA_USDC_DECIMALS))
            : 0;
        const totalFees = omniData.totalFeesCollected
            ? parseFloat(formatUnits(omniData.totalFeesCollected as bigint, SEPOLIA_USDC_DECIMALS))
            : 0;
        const feeBps = omniData.performanceFeeBps
            ? Number(omniData.performanceFeeBps)
            : 0;

        return {
            totalDeposited,
            currentValue,
            totalYieldEarned,
            avgAPY: positions.length > 0 ? positions.reduce((acc, p) => acc + p.apy, 0) / positions.length : 0,
            totalHarvested,
            totalFees,
            feeBps,
        };
    }, [isConnected, omniData, positions]);

    return {
        positions,
        stats,
        isLoading: false,
    };
}

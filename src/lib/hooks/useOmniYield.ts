import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SEPOLIA_VAULT_ADDRESS, SEPOLIA_USDC_ADDRESS, SEPOLIA_USDC_DECIMALS, VAULT_ABI, ERC20_ABI } from "../config/contracts";
import { parseUnits } from "viem";
import { useCallback } from "react";

export function useOmniYield() {
    const { address } = useAccount();
    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    // ── Core Reads ──
    const { data: totalAssets } = useReadContract({
        address: SEPOLIA_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "totalAssets",
    });

    const { data: vaultBalance } = useReadContract({
        address: SEPOLIA_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    const { data: assetBalance, refetch: refetchAssetBalance } = useReadContract({
        address: SEPOLIA_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: SEPOLIA_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: address ? [address, SEPOLIA_VAULT_ADDRESS] : undefined,
        query: { enabled: !!address },
    });

    // ── Fee & Harvest Reads ──
    const { data: performanceFeeBps } = useReadContract({
        address: SEPOLIA_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "performanceFeeBps",
    });

    const { data: feeRecipient } = useReadContract({
        address: SEPOLIA_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "feeRecipient",
    });

    const { data: lastHarvestTimestamp } = useReadContract({
        address: SEPOLIA_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "lastHarvestTimestamp",
    });

    const { data: referrerPoints } = useReadContract({
        address: SEPOLIA_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "referrerPoints",
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    const { data: liquidityBufferBps } = useReadContract({
        address: SEPOLIA_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "liquidityBufferBps",
    });

    const { data: totalHarvestedProfit } = useReadContract({
        address: SEPOLIA_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "totalHarvestedProfit",
    });

    const { data: totalFeesCollected } = useReadContract({
        address: SEPOLIA_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "totalFeesCollected",
    });

    const { data: strategy } = useReadContract({
        address: SEPOLIA_VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "strategy",
    });

    // ── Actions ──
    const mintMockTokens = useCallback((amount: string) => {
        writeContract({
            address: SEPOLIA_USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: "mint",
            args: [address!, parseUnits(amount, SEPOLIA_USDC_DECIMALS)],
        });
    }, [address, writeContract]);

    const withdraw = useCallback((shares: string) => {
        writeContract({
            address: SEPOLIA_VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "withdraw",
            args: [parseUnits(shares, SEPOLIA_USDC_DECIMALS), address!, address!],
        });
    }, [address, writeContract]);

    const harvest = useCallback(() => {
        writeContract({
            address: SEPOLIA_VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "harvest",
        });
    }, [writeContract]);

    const compound = useCallback(() => {
        writeContract({
            address: SEPOLIA_VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "compound",
        });
    }, [writeContract]);

    const depositWithReferral = useCallback((assets: string, referrer: string) => {
        writeContract({
            address: SEPOLIA_VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "depositWithReferral",
            args: [parseUnits(assets, SEPOLIA_USDC_DECIMALS), address!, referrer as `0x${string}`],
        });
    }, [address, writeContract]);

    return {
        data: {
            totalAssets,
            vaultBalance,
            assetBalance,
            allowance,
            hash,
            isPending,
            isConfirming,
            isConfirmed,
            // Fee & harvest data
            performanceFeeBps,
            feeRecipient,
            lastHarvestTimestamp,
            totalHarvestedProfit,
            totalFeesCollected,
            strategy,
            referrerPoints,
            liquidityBufferBps,
        },
        actions: {
            mintMockTokens,
            withdraw,
            harvest,
            compound,
            depositWithReferral,
        }
    };
}

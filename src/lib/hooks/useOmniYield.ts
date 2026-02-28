import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SEPOLIA_VAULT_ADDRESS, SEPOLIA_USDC_ADDRESS, VAULT_ABI, ERC20_ABI } from "../config/contracts";
import { parseUnits } from "viem";
import { useCallback } from "react";

export function useOmniYield() {
    const { address } = useAccount();
    const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    // Reads
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

    // Actions
    const mintMockTokens = useCallback((amount: string) => {
        writeContract({
            address: SEPOLIA_USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: "mint",
            args: [address!, parseUnits(amount, 18)],
        });
    }, [address, writeContract]);



    const withdraw = useCallback((shares: string) => {
        writeContract({
            address: SEPOLIA_VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: "withdraw",
            args: [parseUnits(shares, 18), address!, address!],
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
        },
        actions: {
            mintMockTokens,

            withdraw,
        }
    };
}

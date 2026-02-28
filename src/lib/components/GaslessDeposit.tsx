"use client";

import { useAccount, useWalletClient, useSwitchChain } from 'wagmi'
import { createPublicClient, http, parseAbi, getAddress, parseUnits, encodeFunctionData } from 'viem'
import { baseSepolia } from 'viem/chains'
import {
    createPimlicoClient
} from 'permissionless/clients/pimlico'
import {
    createSmartAccountClient,
} from 'permissionless'
import {
    toSafeSmartAccount
} from 'permissionless/accounts'
import { entryPoint07Address } from 'viem/account-abstraction'
import { useState } from 'react'
import { Zap } from 'lucide-react'
import { SEPOLIA_VAULT_ADDRESS, SEPOLIA_USDC_ADDRESS, VAULT_ABI, ERC20_ABI } from '../config/contracts'

const apiKey = "pim_9bemTephqmcEZzkGZ58uim"; // hardcoded for now, normally from env
const pimlicoUrl = `https://api.pimlico.io/v2/84532/rpc?apikey=${apiKey}`

// Public client
const publicClient = createPublicClient({ chain: baseSepolia, transport: http() })

const entryPoint = {
    address: entryPoint07Address,
    version: '0.7' as const,
};

// Pimlico client handles paymaster and bundler
const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    entryPoint: entryPoint,
})

export function GaslessDeposit({ amount, onSuccess, onError }: { amount: string, onSuccess?: () => void, onError?: (msg: string) => void }) {
    const { address, chainId } = useAccount()
    const { data: walletClient } = useWalletClient()
    const { switchChainAsync } = useSwitchChain()
    const [isPending, setIsPending] = useState(false)

    const handleGaslessDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            onError?.("Please enter a valid amount.")
            return
        }

        if (!walletClient || !address) {
            onError?.("Please connect your wallet first.")
            return
        }

        if (chainId !== baseSepolia.id) {
            try {
                if (switchChainAsync) {
                    await switchChainAsync({ chainId: baseSepolia.id })
                    onError?.("Switched to Base Sepolia! Please click Deposit again.")
                } else {
                    onError?.("Please switch your wallet to Base Sepolia.")
                }
            } catch (error) {
                onError?.("Failed to switch network.")
            }
            return
        }

        setIsPending(true)

        try {
            // 1. Setup Public Node Client (since default viem client might timeout)
            const publicNodeClient = createPublicClient({
                chain: baseSepolia,
                transport: http("https://base-sepolia-rpc.publicnode.com"),
            });

            // 2. Create smart account from user's connected wallet (EOA as owner)
            const smartAccount = await toSafeSmartAccount({
                client: publicNodeClient,
                owners: [walletClient],
                entryPoint: entryPoint,
                version: '1.4.1',
            })

            // 3. Create smart account client with Pimlico middleware
            const smartAccountClient = createSmartAccountClient({
                account: smartAccount,
                chain: baseSepolia,
                bundlerTransport: http(pimlicoUrl),
                paymaster: pimlicoClient,
                userOperation: {
                    estimateFeesPerGas: async () => {
                        return (await pimlicoClient.getUserOperationGasPrice()).fast;
                    }
                }
            })

            const parsedAmount = parseUnits(amount, 18);

            // 4. Build the deposit calls (Approve + Deposit batched)
            const approveData = encodeFunctionData({
                abi: ERC20_ABI,
                functionName: "approve",
                args: [SEPOLIA_VAULT_ADDRESS, parsedAmount],
            });

            const depositData = encodeFunctionData({
                abi: VAULT_ABI,
                functionName: "deposit",
                args: [parsedAmount, smartAccount.address], // Receiver is the smart account itself
            });

            // 5. Send gasless!
            const userOpHash = await smartAccountClient.sendUserOperation({
                account: smartAccount,
                calls: [
                    {
                        to: SEPOLIA_USDC_ADDRESS,
                        data: approveData,
                        value: BigInt(0),
                    },
                    {
                        to: SEPOLIA_VAULT_ADDRESS,
                        data: depositData,
                        value: BigInt(0),
                    }
                ]
            })

            const receipt = await smartAccountClient.waitForUserOperationReceipt({
                hash: userOpHash,
            });
            console.log('Gasless deposit successful:', receipt);
            onSuccess?.()
        } catch (error: any) {
            console.error('Gasless deposit failed', error)
            onError?.(error?.shortMessage || error?.message || "Gasless deposit failed!")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <button
            onClick={handleGaslessDeposit}
            disabled={isPending}
            className="w-full py-3.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
            style={{
                background: "var(--cyan-glow)",
                color: "var(--cyan)",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                opacity: isPending ? 0.5 : 1,
                cursor: isPending ? "not-allowed" : "pointer"
            }}
        >
            <Zap size={16} />
            {isPending ? "Sending Gasless Tx..." : "Deposit Gaslessly"}
        </button>
    )
}

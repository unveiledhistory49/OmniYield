"use client";

import { useMemo, useCallback } from "react";
import { useChain } from "@/providers/wallet-provider";
import { truncateAddress } from "@/lib/utils";
import { type Chain } from "@/lib/constants";

// Solana Imports
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

// EVM Imports
import { useAccount, useConnect, useDisconnect } from "wagmi";

export interface WalletInfo {
    address: string | null;
    displayAddress: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    chain: Chain;
    connect: () => void;
    disconnect: () => void;
}

export function useWallet(): WalletInfo {
    const { chain } = useChain();

    // --- Solana Hooks (always called) ---
    const solanaWallet = useSolanaWallet();
    const { setVisible: setSolanaModalVisible } = useWalletModal();

    // --- EVM Hooks (always called) ---
    const evmAccount = useAccount();
    const { connect: connectEvm, connectors: evmConnectors } = useConnect();
    const { disconnect: disconnectEvm } = useDisconnect();

    // Unified Logic
    const isSolana = chain === "solana";

    // 1. Address & Connection State
    const rawAddress = isSolana
        ? solanaWallet.publicKey?.toBase58()
        : evmAccount.address;

    const isConnected = isSolana
        ? solanaWallet.connected
        : evmAccount.isConnected;

    const isConnecting = isSolana
        ? solanaWallet.connecting
        : evmAccount.isConnecting || evmAccount.isReconnecting;

    // 2. Actions
    const connect = useCallback(() => {
        if (isSolana) {
            setSolanaModalVisible(true);
        } else {
            // For EVM (Base), we prefer MetaMask, but fallback to Injected
            const metaMask = evmConnectors.find((c) => c.name === "MetaMask");
            const injected = evmConnectors.find((c) => c.id === "injected");
            const target = metaMask ?? injected ?? evmConnectors[0];

            if (target) {
                connectEvm({ connector: target });
            } else {
                console.error("No suitable EVM connector found");
            }
        }
    }, [isSolana, setSolanaModalVisible, evmConnectors, connectEvm]);

    const disconnect = useCallback(() => {
        if (isSolana) {
            solanaWallet.disconnect();
        } else {
            disconnectEvm();
        }
    }, [isSolana, solanaWallet, disconnectEvm]);

    // 3. Derived State
    const displayAddress = useMemo(() => {
        return rawAddress ? truncateAddress(rawAddress) : null;
    }, [rawAddress]);

    return {
        address: rawAddress ?? null,
        displayAddress,
        isConnected,
        isConnecting,
        chain,
        connect,
        disconnect,
    };
}

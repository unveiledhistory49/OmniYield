"use client";

import { useMemo } from "react";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import {
    WalletModalProvider,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

/** 
 * Client-only island: mounts Solana providers.
 * MUST wrap children to provide context to the rest of the app.
 */
export default function SolanaProviderIsland({
    children,
}: {
    children: React.ReactNode;
}) {
    const endpoint = useMemo(() => clusterApiUrl("devnet"), []);

    // Pass an empty array — @solana/wallet-adapter v0.19+ auto-detects standard wallets
    const wallets = useMemo(() => [], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

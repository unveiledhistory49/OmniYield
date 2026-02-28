"use client";

import { createContext, useContext, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Chain } from "@/lib/constants";

// Lazy-load wallet provider islands (client-only, never runs during SSR)
const SolanaIsland = dynamic(() => import("./solana-provider"), { ssr: false });
const EvmIsland = dynamic(() => import("./evm-provider"), { ssr: false });

// --- Chain Context ---
interface ChainContextValue {
    chain: Chain;
    setChain: (chain: Chain) => void;
}

const ChainContext = createContext<ChainContextValue>({
    chain: "solana",
    setChain: () => { },
});

export function useChain() {
    return useContext(ChainContext);
}

// --- Main Provider ---
export default function WalletProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    const [chain, setChainState] = useState<Chain>("solana");
    const setChain = useCallback((c: Chain) => setChainState(c), []);

    return (
        <ChainContext.Provider value={{ chain, setChain }}>
            <SolanaIsland>
                <EvmIsland>
                    {children}
                </EvmIsland>
            </SolanaIsland>
        </ChainContext.Provider>
    );
}

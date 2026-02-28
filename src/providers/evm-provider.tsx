"use client";

import { useState, useEffect, useMemo } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { baseSepolia, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { metaMask, coinbaseWallet } from "wagmi/connectors";

/**
 * Client-only island: mounts WagmiProvider + QueryClientProvider.
 * MUST wrap children to provide context to the rest of the app.
 */
export default function EvmProviderIsland({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);

    // Lazily create config and queryClient once
    const config = useMemo(
        () =>
            createConfig({
                chains: [baseSepolia, sepolia],
                connectors: [
                    metaMask(),
                    coinbaseWallet({ appName: "OmniYield" }),
                ],
                transports: {
                    [baseSepolia.id]: http(),
                    [sepolia.id]: http(),
                },
                ssr: true,
            }),
        []
    );
    const queryClient = useMemo(() => new QueryClient(), []);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Return null on server/hydration mismatch to avoid errors, 
    // but this means children won't render until client-side mount.
    if (!mounted) return null;

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
}

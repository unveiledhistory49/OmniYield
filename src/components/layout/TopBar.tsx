"use client";

import ChainSelector from "@/components/ui/ChainSelector";
import { Wallet, Bell, LogOut } from "lucide-react";
import type { Chain } from "@/lib/constants";
import { useWallet } from "@/lib/hooks/useWallet";

interface TopBarProps {
    chain: Chain;
    onChainChange: (chain: Chain) => void;
}

export default function TopBar({ chain, onChainChange }: TopBarProps) {
    const {
        displayAddress,
        isConnected,
        isConnecting,
        connect,
        disconnect,
    } = useWallet();

    return (
        <header
            className="fixed top-0 right-0 z-40 flex items-center justify-between px-6"
            style={{
                left: "72px",
                height: "var(--topbar-height)",
                background: "rgba(10, 14, 26, 0.8)",
                backdropFilter: "blur(16px)",
                borderBottom: "1px solid var(--border)",
            }}
        >
            {/* Left: Page context */}
            <div className="flex items-center gap-4">
                <h2
                    className="text-lg font-semibold"
                    style={{
                        fontFamily: "var(--font-outfit, 'Outfit', sans-serif)",
                        color: "var(--text-primary)",
                    }}
                >
                    {/* Page title injected by pages */}
                </h2>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-4">
                <ChainSelector value={chain} onChange={onChainChange} />

                {/* Notifications */}
                <button
                    className="relative p-2 rounded-lg transition-colors duration-200"
                    style={{
                        background: "var(--glass)",
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                    }}
                >
                    <Bell size={18} />
                    <span
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                        style={{ background: "var(--cyan)" }}
                    />
                </button>

                {/* Connect / Disconnect Wallet */}
                {isConnected ? (
                    <div className="flex items-center gap-2">
                        <div
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                            style={{
                                background: "var(--glass)",
                                border: "1px solid var(--border)",
                                color: "var(--text-primary)",
                            }}
                        >
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ background: "var(--green)" }}
                            />
                            {displayAddress}
                        </div>
                        <button
                            onClick={disconnect}
                            className="p-2 rounded-lg transition-colors duration-200 cursor-pointer"
                            style={{
                                background: "var(--glass)",
                                border: "1px solid var(--border)",
                                color: "var(--text-secondary)",
                            }}
                            title="Disconnect wallet"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={connect}
                        disabled={isConnecting}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer"
                        style={{
                            background: "var(--gradient-primary)",
                            color: "#fff",
                            opacity: isConnecting ? 0.7 : 1,
                        }}
                    >
                        <Wallet size={16} />
                        {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </button>
                )}
            </div>
        </header>
    );
}

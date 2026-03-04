"use client";

import ChainSelector from "@/components/ui/ChainSelector";
import { Wallet, Bell, LogOut, Menu } from "lucide-react";
import type { Chain } from "@/lib/constants";
import { useWallet } from "@/lib/hooks/useWallet";
import { useIsMobile } from "@/components/layout/Sidebar";

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

    const isMobile = useIsMobile();

    return (
        <header
            className="fixed top-0 right-0 z-40 flex items-center justify-between"
            style={{
                left: isMobile ? "0" : "72px",
                height: "var(--topbar-height)",
                background: "rgba(10, 14, 26, 0.8)",
                backdropFilter: "blur(16px)",
                borderBottom: "1px solid var(--border)",
                padding: isMobile ? "0 12px" : "0 24px",
            }}
        >
            {/* Left: Logo on mobile, empty on desktop */}
            <div className="flex items-center gap-3">
                {isMobile && (
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                        style={{ background: "var(--gradient-primary)", color: "#fff" }}
                    >
                        OY
                    </div>
                )}
                {isMobile && (
                    <span
                        className="font-bold text-base gradient-text"
                        style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}
                    >
                        OmniYield
                    </span>
                )}
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2 md:gap-4">
                <ChainSelector value={chain} onChange={onChainChange} />

                {/* Notifications – hidden on small mobile */}
                <button
                    className="relative p-2 rounded-lg transition-colors duration-200 hidden sm:flex"
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
                            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium"
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
                            <span className="hidden sm:inline">{displayAddress}</span>
                            <span className="sm:hidden text-xs">
                                {displayAddress?.slice(0, 4)}...
                            </span>
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
                        className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer"
                        style={{
                            background: "var(--gradient-primary)",
                            color: "#fff",
                            opacity: isConnecting ? 0.7 : 1,
                        }}
                    >
                        <Wallet size={16} />
                        <span className="hidden sm:inline">
                            {isConnecting ? "Connecting..." : "Connect Wallet"}
                        </span>
                        <span className="sm:hidden text-xs">
                            {isConnecting ? "..." : "Connect"}
                        </span>
                    </button>
                )}
            </div>
        </header>
    );
}

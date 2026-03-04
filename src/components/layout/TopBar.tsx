"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChainSelector from "@/components/ui/ChainSelector";
import { Wallet, Bell, LogOut, ChevronDown } from "lucide-react";
import type { Chain } from "@/lib/constants";
import { useWallet } from "@/lib/hooks/useWallet";
import { useIsMobile } from "@/components/layout/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

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
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        }
        if (showDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [showDropdown]);

    // Tap a chain option → set chain + trigger wallet connect immediately
    const handleChainConnect = useCallback((selectedChain: Chain) => {
        onChainChange(selectedChain);
        setShowDropdown(false);
        // Small delay to let the chain context update before triggering connect
        setTimeout(() => {
            connect();
        }, 100);
    }, [onChainChange, connect]);

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
            {/* Left: Logo on mobile */}
            <div className="flex items-center gap-2 shrink-0">
                {isMobile && (
                    <div
                        className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0"
                        style={{ background: "var(--gradient-primary)", color: "#fff" }}
                    >
                        OY
                    </div>
                )}
                {isMobile && (
                    <span
                        className="font-bold text-sm gradient-text"
                        style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}
                    >
                        OmniYield
                    </span>
                )}
            </div>

            {/* Right: Controls */}
            {isMobile ? (
                /* ─── Mobile: Single button with 2-step connect flow ─── */
                <div className="relative" ref={dropdownRef}>
                    {isConnected ? (
                        /* Connected state: show address + disconnect */
                        <div className="flex items-center gap-1.5">
                            <div
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                                style={{
                                    background: "var(--glass)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-primary)",
                                }}
                            >
                                <div className="w-2 h-2 rounded-full" style={{ background: "var(--green)" }} />
                                {displayAddress?.slice(0, 4)}...{displayAddress?.slice(-4)}
                            </div>
                            <button
                                onClick={disconnect}
                                className="p-2 rounded-lg cursor-pointer"
                                style={{
                                    background: "var(--glass)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        /* Not connected: Connect button + dropdown */
                        <>
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm cursor-pointer"
                                style={{
                                    background: "var(--gradient-primary)",
                                    color: "#fff",
                                }}
                            >
                                <Wallet size={14} />
                                Connect
                                <ChevronDown
                                    size={12}
                                    className="transition-transform duration-200"
                                    style={{ transform: showDropdown ? "rotate(180deg)" : "none" }}
                                />
                            </button>

                            {/* Dropdown: just two options */}
                            <AnimatePresence>
                                {showDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden"
                                        style={{
                                            background: "var(--bg-card)",
                                            border: "1px solid var(--border)",
                                            boxShadow: "var(--shadow-lg)",
                                        }}
                                    >
                                        <button
                                            onClick={() => handleChainConnect("solana")}
                                            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors cursor-pointer hover:opacity-80"
                                            style={{
                                                color: "var(--text-secondary)",
                                                borderBottom: "1px solid var(--border)",
                                            }}
                                        >
                                            <span className="text-base">◎</span>
                                            Connect Solana
                                        </button>
                                        <button
                                            onClick={() => handleChainConnect("base")}
                                            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors cursor-pointer hover:opacity-80"
                                            style={{
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            <span className="text-base">Ⓑ</span>
                                            Connect Base
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            ) : (
                /* ─── Desktop: Full controls (unchanged) ─── */
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
            )}
        </header>
    );
}

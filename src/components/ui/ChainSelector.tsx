"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Chain } from "@/lib/constants";
import { useIsMobile } from "@/components/layout/Sidebar";

interface ChainSelectorProps {
    value: Chain;
    onChange: (chain: Chain) => void;
}

export default function ChainSelector({ value, onChange }: ChainSelectorProps) {
    const isMobile = useIsMobile();

    const chains: { id: Chain; label: string; icon: string }[] = [
        { id: "solana", label: "Solana", icon: "◎" },
        { id: "base", label: "Base", icon: "Ⓑ" },
    ];

    return (
        <div
            className="flex items-center rounded-full p-0.5 md:p-1 relative"
            style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
            }}
        >
            {chains.map((chain) => (
                <button
                    key={chain.id}
                    onClick={() => onChange(chain.id)}
                    className="relative z-10 flex items-center gap-1 md:gap-1.5 px-2.5 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors duration-200 cursor-pointer"
                    style={{
                        color:
                            value === chain.id ? "var(--text-primary)" : "var(--text-tertiary)",
                    }}
                >
                    {value === chain.id && (
                        <motion.div
                            layoutId="chain-pill"
                            className="absolute inset-0 rounded-full"
                            style={{
                                background:
                                    chain.id === "solana"
                                        ? "var(--solana-glow)"
                                        : "var(--base-glow)",
                                border: `1px solid ${chain.id === "solana" ? "rgba(153,69,255,0.3)" : "rgba(0,82,255,0.3)"}`,
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10">{chain.icon}</span>
                    {!isMobile && <span className="relative z-10">{chain.label}</span>}
                </button>
            ))}
        </div>
    );
}

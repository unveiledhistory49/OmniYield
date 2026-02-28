"use client";

import { motion } from "framer-motion";
import { User, Shield, Bell, Palette, Globe } from "lucide-react";

const settingSections = [
    {
        icon: User,
        title: "Account",
        description: "Manage your connected wallets and profile.",
        items: [
            { label: "Primary Wallet", value: "7xK4...9mZq", type: "text" as const },
            { label: "Display Name", value: "anon.sol", type: "text" as const },
        ],
    },
    {
        icon: Shield,
        title: "Security",
        description: "Manage approval limits and transaction signing.",
        items: [
            { label: "Auto-approve below", value: "$100", type: "text" as const },
            { label: "Require 2FA", value: true, type: "toggle" as const },
        ],
    },
    {
        icon: Bell,
        title: "Notifications",
        description: "Configure alerts for yield changes and rebalances.",
        items: [
            { label: "Yield drop alerts", value: true, type: "toggle" as const },
            { label: "Rebalance notifications", value: true, type: "toggle" as const },
            { label: "Weekly summary email", value: false, type: "toggle" as const },
        ],
    },
    {
        icon: Palette,
        title: "Appearance",
        description: "Customize the look and feel.",
        items: [
            { label: "Theme", value: "Dark", type: "text" as const },
            { label: "Compact mode", value: false, type: "toggle" as const },
        ],
    },
];

export default function SettingsPage() {
    return (
        <div>
            <h1
                className="text-3xl font-bold mb-1"
                style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}
            >
                Settings
            </h1>
            <p className="mb-8" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Configure your OmniYield experience.
            </p>

            <div className="flex flex-col gap-6 max-w-3xl">
                {settingSections.map((section, si) => (
                    <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: si * 0.08 }}
                        className="glass-card p-6"
                        style={{ background: "var(--bg-card)" }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center"
                                style={{
                                    background: "var(--cyan-glow)",
                                    color: "var(--cyan)",
                                }}
                            >
                                <section.icon size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold">{section.title}</h3>
                                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                    {section.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {section.items.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between py-3 px-4 rounded-lg"
                                    style={{ background: "var(--bg-tertiary)" }}
                                >
                                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                        {item.label}
                                    </span>
                                    {item.type === "toggle" ? (
                                        <div
                                            className="w-10 h-5 rounded-full relative cursor-pointer transition-colors"
                                            style={{
                                                background: item.value
                                                    ? "var(--cyan)"
                                                    : "var(--bg-elevated)",
                                            }}
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full absolute top-0.5 transition-all"
                                                style={{
                                                    background: "white",
                                                    left: item.value ? "22px" : "2px",
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-sm font-medium">{String(item.value)}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

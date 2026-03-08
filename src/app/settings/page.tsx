"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, Bell, Palette, CheckCircle2 } from "lucide-react";
import { useWallet } from "@/lib/hooks/useWallet";

export default function SettingsPage() {
    const { displayAddress, isConnected } = useWallet();

    // --- Local State for Interactive Toggles ---
    const [settings, setSettings] = useState({
        autoApprove: "$100",
        require2fa: true,
        yieldAlerts: true,
        rebalanceNotify: true,
        weeklyEmail: false,
        theme: "Dark",
        compactMode: false,
    });

    const [savedPopup, setSavedPopup] = useState(false);

    // Trigger the satisfying "Settings Saved" popup
    const triggerSave = () => {
        setSavedPopup(true);
        setTimeout(() => setSavedPopup(false), 2000);
    };

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
        triggerSave();
    };

    const cycleTextSetting = (key: keyof typeof settings, options: string[]) => {
        setSettings(prev => {
            const currentIdx = options.indexOf(String(prev[key]));
            const nextIdx = (currentIdx + 1) % options.length;
            return {
                ...prev,
                [key]: options[nextIdx]
            };
        });
        triggerSave();
    };

    const settingSections = [
        {
            icon: User,
            title: "Account",
            description: "Manage your connected wallets and profile.",
            items: [
                {
                    label: "Primary Wallet",
                    value: isConnected && displayAddress ? displayAddress : "Not Connected",
                    type: "text" as const,
                    onClick: undefined // Status only
                },
                {
                    label: "Display Name",
                    value: isConnected && displayAddress ? `anon_${displayAddress.slice(-4)}` : "anon.eth",
                    type: "text" as const,
                    onClick: undefined // Status only
                },
            ],
        },
        {
            icon: Shield,
            title: "Security",
            description: "Manage approval limits and transaction signing.",
            items: [
                {
                    label: "Gasless Auto-approve below",
                    value: settings.autoApprove,
                    type: "text" as const,
                    onClick: () => cycleTextSetting("autoApprove", ["$50", "$100", "$500", "Unlimited"])
                },
                {
                    label: "Require 2FA for Withdrawals",
                    value: settings.require2fa,
                    type: "toggle" as const,
                    onClick: () => toggleSetting("require2fa")
                },
            ],
        },
        {
            icon: Bell,
            title: "Notifications",
            description: "Configure alerts for yield changes and rebalances.",
            items: [
                {
                    label: "Yield drop alerts",
                    value: settings.yieldAlerts,
                    type: "toggle" as const,
                    onClick: () => toggleSetting("yieldAlerts")
                },
                {
                    label: "Rebalance notifications",
                    value: settings.rebalanceNotify,
                    type: "toggle" as const,
                    onClick: () => toggleSetting("rebalanceNotify")
                },
                {
                    label: "Weekly summary email",
                    value: settings.weeklyEmail,
                    type: "toggle" as const,
                    onClick: () => toggleSetting("weeklyEmail")
                },
            ],
        },
        {
            icon: Palette,
            title: "Appearance",
            description: "Customize the look and feel.",
            items: [
                {
                    label: "Theme",
                    value: settings.theme,
                    type: "text" as const,
                    onClick: () => cycleTextSetting("theme", ["Dark", "System", "Cyberpunk"])
                },
                {
                    label: "Compact mode",
                    value: settings.compactMode,
                    type: "toggle" as const,
                    onClick: () => toggleSetting("compactMode")
                },
            ],
        },
    ];

    return (
        <div className="relative pb-24">
            {/* Top Level Toast / Notification */}
            <AnimatePresence>
                {savedPopup && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl"
                        style={{
                            background: "var(--green-glow)",
                            border: "1px solid rgba(0,255,136,0.3)",
                            color: "var(--green)"
                        }}
                    >
                        <CheckCircle2 size={16} />
                        <span className="text-sm font-semibold">Settings Saved Natively</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <h1
                className="text-3xl font-bold mb-1"
                style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}
            >
                Settings
            </h1>
            <p className="mb-8" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Configure your OmniYield smart account and local preferences.
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
                        <div className="flex items-center gap-3 mb-5">
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center shadow-inner"
                                style={{
                                    background: "var(--cyan-glow)",
                                    color: "var(--cyan)",
                                    border: "1px solid rgba(0, 212, 255, 0.2)"
                                }}
                            >
                                <section.icon size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold">{section.title}</h3>
                                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                                    {section.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {section.items.map((item) => (
                                <div
                                    key={item.label}
                                    onClick={item.onClick}
                                    className={`flex items-center justify-between py-3.5 px-4 rounded-xl transition-all ${item.onClick ? "cursor-pointer hover:brightness-110 active:scale-[0.99]" : ""}`}
                                    style={{
                                        background: "var(--bg-tertiary)",
                                        border: "1px solid var(--border)"
                                    }}
                                >
                                    <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                                        {item.label}
                                    </span>
                                    {item.type === "toggle" ? (
                                        <div
                                            className="w-11 h-6 rounded-full relative shadow-inner transition-colors duration-300"
                                            style={{
                                                background: item.value
                                                    ? "var(--cyan)"
                                                    : "var(--bg-elevated)",
                                                boxShadow: item.value ? "0 0 10px rgba(0, 212, 255, 0.3)" : "none"
                                            }}
                                        >
                                            <div
                                                className="w-5 h-5 rounded-full absolute top-0.5 transition-all duration-300 shadow-md flex items-center justify-center"
                                                style={{
                                                    background: "white",
                                                    left: item.value ? "22px" : "2px",
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <span className={`text-sm font-bold ${item.onClick ? "text-[color:var(--cyan)]" : "text-[color:var(--text-primary)]"}`}>
                                            {String(item.value)}
                                        </span>
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

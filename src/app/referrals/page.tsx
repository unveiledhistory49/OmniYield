"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Copy, CheckCircle2, TrendingUp, Info } from "lucide-react";
import { useWallet } from "@/lib/hooks/useWallet";
import { useOmniYield } from "@/lib/hooks/useOmniYield";
import { formatUnits } from "viem";
import { SEPOLIA_USDC_DECIMALS } from "@/lib/config/contracts";

export default function ReferralDashboard() {
    const { address, isConnected, connect } = useWallet();
    const { data: omniData } = useOmniYield();
    const [copied, setCopied] = useState(false);

    const referralLink = address ? `https://omni-yield2.vercel.app/vaults/base-aave-v3-usdc?ref=${address}` : "";

    const handleCopy = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const pointsRaw = omniData?.referrerPoints;
    const pointsFormatted = pointsRaw ? parseFloat(formatUnits(pointsRaw, SEPOLIA_USDC_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0";

    return (
        <div className="max-w-4xl mx-auto pb-24">
            <div className="mb-8 md:mb-12">
                <h1
                    className="text-3xl md:text-4xl font-bold mb-3 md:mb-4"
                    style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}
                >
                    Referrals & Growth
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }} className="max-w-2xl">
                    Invite capital to the OmniYield ecosystem and earn points. This dashboard tracks your on-chain impact and future rewards natively.
                </p>
            </div>

            {/* Referrer Points Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="glass-card p-6 md:p-8" style={{ background: "var(--bg-card)" }}>
                    <div className="flex items-center gap-3 mb-6">
                        <Users size={24} style={{ color: "var(--cyan)" }} />
                        <h2 className="text-xl font-semibold">Your Referral Impact</h2>
                    </div>

                    <div className="mb-4">
                        <span className="text-sm font-medium" style={{ color: "var(--text-tertiary)" }}>Total Points Earned</span>
                        <div className="text-4xl lg:text-5xl font-bold tracking-tight mt-1" style={{ color: "var(--text-primary)" }}>
                            {pointsFormatted} <span className="text-xl font-medium" style={{ color: "var(--text-tertiary)" }}>PTS</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 mt-6 p-3 rounded-lg text-sm" style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid rgba(0, 212, 255, 0.2)" }}>
                        <Info size={16} className="mt-0.5" style={{ color: "var(--cyan)" }} />
                        <p style={{ color: "var(--text-secondary)" }}>
                            You earn 1 Point for every 1 USDC deposited through your referral link. Points are hard-coded into the OmniYieldVault smart contract.
                        </p>
                    </div>
                </div>

                {/* Generate Link Card */}
                <div className="glass-card p-6 md:p-8 flex flex-col justify-center" style={{ background: "var(--bg-card)" }}>
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp size={24} style={{ color: "var(--green)" }} />
                        <h2 className="text-xl font-semibold">Generate Link</h2>
                    </div>

                    {!isConnected ? (
                        <div className="text-center py-6">
                            <p className="mb-4 text-sm" style={{ color: "var(--text-secondary)" }}>Connect your wallet to generate a unique on-chain referral link.</p>
                            <button
                                onClick={connect}
                                className="px-6 py-3 rounded-full text-sm font-semibold transition-all"
                                style={{ background: "var(--text-primary)", color: "#000000" }}
                            >
                                Connect Wallet
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="mb-3 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Share your unique link:</p>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    readOnly
                                    value={referralLink}
                                    className="flex-1 px-4 py-3 rounded-lg text-sm bg-transparent outline-none"
                                    style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
                                />
                                <button
                                    onClick={handleCopy}
                                    className="p-3 rounded-lg transition-colors flex shrink-0 items-center justify-center gap-2"
                                    style={{
                                        background: copied ? "var(--green-glow)" : "var(--cyan-glow)",
                                        color: copied ? "var(--green)" : "var(--cyan)",
                                        border: `1px solid ${copied ? "rgba(0,255,136,0.3)" : "rgba(0, 212, 255, 0.3)"}`
                                    }}
                                >
                                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                    <span className="text-sm font-medium">{copied ? "Copied" : "Copy"}</span>
                                </button>
                            </div>
                            <p className="mt-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
                                Anyone who clicks this link and deposits securely mounts your address to their transaction via Account Abstraction.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

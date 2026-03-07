"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    TrendingUp,
    Shield,
    DollarSign,
    Info,
    Wallet,
    Zap,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatAPY } from "@/lib/utils";
import { useWallet } from "@/lib/hooks/useWallet";
import { useOmniYield } from "@/lib/hooks/useOmniYield";
import { formatUnits, parseUnits } from "viem";
import { SEPOLIA_USDC_DECIMALS } from "@/lib/config/contracts";
import { GaslessDeposit } from "@/lib/components/GaslessDeposit";
import { useVaults } from "@/lib/hooks/useVaults";

type TimeRange = "7d" | "14d" | "30d";

export default function VaultDetailPage() {
    const params = useParams();
    const vaultId = decodeURIComponent(params.id as string);
    const { vaults: allVaults, isLoading: vaultsLoading } = useVaults();

    const vault = useMemo(() => {
        return allVaults.find((v) => v.id === vaultId);
    }, [allVaults, vaultId]);

    const { isConnected, connect, address } = useWallet();

    // Sepolia / EVM Integration
    const isSepolia = vault?.chain === "sepolia" || vault?.id.includes('base');
    const { data: omniData, actions: omniActions } = useOmniYield();

    const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
    const [amount, setAmount] = useState("");
    const [timeRange, setTimeRange] = useState<TimeRange>("30d");
    const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const chartData = useMemo(() => {
        if (!vault) return [];
        const data = [];
        const now = new Date();
        const baseApy = vault.apy;
        const days = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : 30;
        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            // Seeded pseudo-random for consistent renders
            const seed = Math.sin(i * 127.1 + days * 311.7) * 43758.5453;
            const variance = (Math.sin(i * 0.5) * 0.8) + ((seed - Math.floor(seed)) - 0.5) * 0.4;
            data.push({
                date: date.toISOString().slice(0, 10),
                value: Math.max(0, baseApy + variance),
            });
        }
        return data;
    }, [vault, timeRange]);

    const tvlChartData = useMemo(() => {
        if (!vault) return [];
        const data = [];
        const now = new Date();
        const currentTvl = vault.tvl;
        for (let i = 89; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const growth = 1 - (i / 90) * 0.3;
            const seed = Math.sin(i * 127.1 + 42) * 43758.5453;
            const noise = 1 + ((seed - Math.floor(seed)) - 0.5) * 0.02;
            data.push({
                date: date.toISOString().slice(0, 10),
                value: Math.round(currentTvl * growth * noise),
            });
        }
        return data;
    }, [vault]);

    // Clear status message after 5s
    useEffect(() => {
        if (statusMsg) {
            const timer = setTimeout(() => setStatusMsg(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [statusMsg]);

    if (!vault) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <h2 className="text-2xl font-bold mb-4">Vault not found</h2>
                <Link href="/vaults">
                    <button className="btn-secondary flex items-center gap-2">
                        <ArrowLeft size={16} /> Back to Vaults
                    </button>
                </Link>
            </div>
        );
    }

    const estimatedEarnings = amount
        ? (parseFloat(amount) * (vault.apy / 100)).toFixed(2)
        : "0.00";

    // Real Balance Check
    const userAssetBalance = isSepolia && omniData?.assetBalance
        ? parseFloat(formatUnits(omniData.assetBalance, SEPOLIA_USDC_DECIMALS))
        : 0;

    const userVaultBalance = isSepolia && omniData?.vaultBalance
        ? parseFloat(formatUnits(omniData.vaultBalance, SEPOLIA_USDC_DECIMALS))
        : 0;

    // Actions
    const handleDeposit = () => {
        // Mock deposit for non-sepolia chains
        if (!amount || parseFloat(amount) <= 0) {
            setStatusMsg({ type: "error", text: "Please enter a valid amount." });
            return;
        }

        setStatusMsg({ type: "success", text: "Mock Transaction Submitted!" });
        setAmount("");
    };



    const handleWithdraw = () => {
        if (!amount || parseFloat(amount) <= 0) {
            setStatusMsg({ type: "error", text: "Please enter a valid amount." });
            return;
        }
        if (isSepolia) {
            omniActions.withdraw(amount); // Assuming withdraw input is shares/assets 1:1 for now
            setStatusMsg({ type: "success", text: "Withdraw transaction sent..." });
            setAmount("");
        } else {
            setStatusMsg({ type: "success", text: "Mock Withdrawal Submitted!" });
            setAmount("");
        }
    };

    const handleMint = () => {
        if (isSepolia) {
            omniActions.mintMockTokens("1000");
            setStatusMsg({ type: "success", text: "Minting 1000 Mock USDC..." });
        }
    }



    return (
        <div>
            {/* Back link */}
            <Link
                href="/vaults"
                className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
                style={{ color: "var(--text-secondary)" }}
            >
                <ArrowLeft size={16} /> Back to Vaults
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="flex-1">
                    {/* Title Row */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                        <h1
                            className="text-2xl md:text-3xl font-bold"
                            style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}
                        >
                            {vault.name}
                        </h1>
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium chain-${vault.chain}`}
                        >
                            {vault.chain === "solana" ? "◎ Solana" : vault.chain === "base" ? "Ⓑ Base" : "Sepolia"}
                        </span>
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium risk-${vault.riskLevel}`}
                        >
                            {vault.riskLevel} risk
                        </span>
                    </div>

                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        {vault.strategy} strategy via {vault.protocol} • Auto-compounding enabled
                    </p>
                </div>
            </div>

            {/* Real Data Banner (Sepolia Only) */}
            {isSepolia && (
                <div className="mb-6 md:mb-8 p-3 md:p-4 rounded-lg flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 md:gap-4"
                    style={{ background: "rgba(98, 126, 234, 0.1)", border: "1px solid rgba(98, 126, 234, 0.2)" }}>
                    <div className="flex items-center gap-2">
                        <Info size={16} className="text-[#627EEA]" />
                        <span className="text-sm">Connected to Sepolia Testnet. Balances are real.</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 text-sm font-medium">
                        <div>
                            <span className="text-gray-400 mr-2">Vault Balance:</span>
                            {userVaultBalance.toFixed(2)} OYV
                        </div>
                        <div>
                            <span className="text-gray-400 mr-2">Wallet Balance:</span>
                            {userAssetBalance.toFixed(2)} USDC
                        </div>
                        <button onClick={handleMint} className="text-xs px-2 py-1 rounded bg-[#627EEA] text-white hover:opacity-90">
                            Mint Mock USDC
                        </button>
                    </div>
                </div>
            )}

            {/* Fee Transparency & Harvest Info */}
            {isSepolia && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 md:mb-8">
                    {/* Fee Card */}
                    <div className="glass-card p-4 md:p-5" style={{ background: "var(--bg-card)" }}>
                        <div className="flex items-center gap-2 mb-3">
                            <Shield size={16} style={{ color: "var(--yellow)" }} />
                            <span className="font-semibold text-sm">Fee Transparency</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span style={{ color: "var(--text-secondary)" }}>Performance Fee</span>
                                <span className="font-medium">{omniData?.performanceFeeBps ? `${Number(omniData.performanceFeeBps) / 100}%` : "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: "var(--text-secondary)" }}>Gross APY</span>
                                <span className="font-medium" style={{ color: "var(--text-primary)" }}>{vault ? `${vault.apy.toFixed(2)}%` : "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: "var(--text-secondary)" }}>Your Net APY</span>
                                <span className="font-medium" style={{ color: "var(--cyan)" }}>
                                    {vault && omniData?.performanceFeeBps
                                        ? `${(vault.apy * (1 - Number(omniData.performanceFeeBps) / 10000)).toFixed(2)}%`
                                        : "—"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: "var(--text-secondary)" }}>Fee Recipient</span>
                                <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>
                                    {omniData?.feeRecipient ? `${String(omniData.feeRecipient).slice(0, 6)}...${String(omniData.feeRecipient).slice(-4)}` : "—"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Harvest Card */}
                    <div className="glass-card p-4 md:p-5" style={{ background: "var(--bg-card)" }}>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={16} style={{ color: "var(--text-secondary)" }} />
                            <span className="font-semibold text-sm">Auto-Compound</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span style={{ color: "var(--text-secondary)" }}>Total Harvested</span>
                                <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                                    {omniData?.totalHarvestedProfit
                                        ? `+${parseFloat(formatUnits(omniData.totalHarvestedProfit as bigint, SEPOLIA_USDC_DECIMALS)).toFixed(2)} USDC`
                                        : "0.00 USDC"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: "var(--text-secondary)" }}>Fees Collected</span>
                                <span className="font-medium">
                                    {omniData?.totalFeesCollected
                                        ? `${parseFloat(formatUnits(omniData.totalFeesCollected as bigint, SEPOLIA_USDC_DECIMALS)).toFixed(2)} USDC`
                                        : "0.00 USDC"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span style={{ color: "var(--text-secondary)" }}>Last Harvest</span>
                                <span className="font-medium">
                                    {omniData?.lastHarvestTimestamp && Number(omniData.lastHarvestTimestamp) > 0
                                        ? new Date(Number(omniData.lastHarvestTimestamp) * 1000).toLocaleString()
                                        : "Never"}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => omniActions.harvest()}
                            className="w-full mt-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 cursor-pointer"
                            style={{ background: "rgba(255, 255, 255, 0.06)", color: "var(--text-primary)", border: "1px solid rgba(255, 255, 255, 0.1)" }}
                        >
                            ⚡ Harvest Now
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                {[
                    {
                        label: "Current APY",
                        value: formatAPY(vault.apy),
                        color: "var(--text-primary)",
                        icon: TrendingUp,
                    },
                    {
                        label: "Total TVL",
                        value: formatCurrency(vault.tvl),
                        color: "var(--cyan)",
                        icon: DollarSign,
                    },
                    {
                        label: "Risk Level",
                        value: vault.riskLevel.charAt(0).toUpperCase() + vault.riskLevel.slice(1),
                        color: vault.riskLevel === "low" ? "var(--green)" : vault.riskLevel === "medium" ? "var(--yellow)" : "var(--red)",
                        icon: Shield,
                    },
                    {
                        label: "Asset",
                        value: vault.asset,
                        color: "var(--text-primary)",
                        icon: Info,
                    },
                ].map((stat) => (
                    <div key={stat.label} className="stat-card">
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon size={14} style={{ color: "var(--text-muted)" }} />
                            <span className="stat-label">{stat.label}</span>
                        </div>
                        <div className="stat-value" style={{ color: stat.color }}>
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content: Charts + Deposit */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Charts Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* APY Chart */}
                    <div className="glass-card p-4 md:p-6" style={{ background: "var(--bg-card)" }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold">APY History</h3>
                            <div className="flex rounded-lg" style={{ border: "1px solid var(--border)" }}>
                                {(["7d", "14d", "30d"] as TimeRange[]).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTimeRange(t)}
                                        className="px-3 py-1 text-xs font-medium transition-colors cursor-pointer"
                                        style={{
                                            background: timeRange === t ? "var(--bg-elevated)" : "transparent",
                                            color: timeRange === t ? "var(--cyan)" : "var(--text-tertiary)",
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="apyGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#00ff88" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: "#5a6280", fontSize: 11 }}
                                    axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                                    tickFormatter={(d) => d.slice(5)}
                                />
                                <YAxis
                                    tick={{ fill: "#5a6280", fontSize: 11 }}
                                    axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                                    tickFormatter={(v) => `${v.toFixed(1)}%`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "#1a1f36",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "8px",
                                        color: "#f0f2f7",
                                        fontSize: "13px",
                                    }}
                                    formatter={(value) => [`${(value as number).toFixed(2)}%`, "APY"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#00ff88"
                                    strokeWidth={2}
                                    fill="url(#apyGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* TVL Chart */}
                    <div className="glass-card p-4 md:p-6" style={{ background: "var(--bg-card)" }}>
                        <h3 className="font-semibold mb-6">TVL Growth</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={tvlChartData}>
                                <defs>
                                    <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#86868b" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#86868b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: "#5a6280", fontSize: 11 }}
                                    axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                                    tickFormatter={(d) => d.slice(5)}
                                />
                                <YAxis
                                    tick={{ fill: "#5a6280", fontSize: 11 }}
                                    axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                                    tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "#1a1f36",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: "8px",
                                        color: "#f0f2f7",
                                        fontSize: "13px",
                                    }}
                                    formatter={(value) => [
                                        `$${((value as number) / 1_000_000).toFixed(2)}M`,
                                        "TVL",
                                    ]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#86868b"
                                    strokeWidth={2}
                                    fill="url(#tvlGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Deposit / Withdraw Panel */}
                <div className="lg:col-span-1">
                    <div
                        className="glass-card p-4 md:p-6 sticky top-24"
                        style={{ background: "var(--bg-card)" }}
                    >
                        {/* Tabs */}
                        <div
                            className="flex rounded-lg mb-6 p-1"
                            style={{ background: "var(--bg-tertiary)" }}
                        >
                            {(["deposit", "withdraw"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className="flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer"
                                    style={{
                                        background: tab === t ? "var(--bg-card)" : "transparent",
                                        color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
                                        boxShadow: tab === t ? "var(--shadow-sm)" : "none",
                                    }}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Amount Input */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <label
                                    className="block text-xs font-medium"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    {tab === "deposit" ? "Deposit Amount" : "Withdraw Amount"}
                                </label>
                                {isSepolia && (
                                    <span className="text-xs text-gray-400 cursor-pointer hover:text-white"
                                        onClick={() => setAmount(tab === "deposit" ? userAssetBalance.toString() : userVaultBalance.toString())}>
                                        Bal: {tab === "deposit" ? userAssetBalance.toFixed(2) : userVaultBalance.toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <div
                                className="flex items-center rounded-lg px-4 py-3"
                                style={{
                                    background: "var(--bg-tertiary)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none text-lg font-medium"
                                    style={{ color: "var(--text-primary)" }}
                                />
                                <div className="flex items-center gap-2">
                                    <span
                                        className="text-sm font-medium"
                                        style={{ color: "var(--text-secondary)" }}
                                    >
                                        {vault.asset}
                                    </span>
                                    <button
                                        className="px-2 py-0.5 rounded text-xs font-medium cursor-pointer"
                                        style={{
                                            background: "var(--cyan-glow)",
                                            color: "var(--cyan)",
                                        }}
                                        onClick={() => setAmount(tab === "deposit"
                                            ? (isSepolia ? userAssetBalance.toString() : "10000")
                                            : (isSepolia ? userVaultBalance.toString() : "10000")
                                        )}
                                    >
                                        MAX
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Estimated earnings */}
                        <div
                            className="rounded-lg p-4 mb-6"
                            style={{
                                background: "var(--bg-tertiary)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                    Estimated APY
                                </span>
                                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                    {formatAPY(vault.apy)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                    Est. Yearly Earnings
                                </span>
                                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                    ${estimatedEarnings}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                    Performance Fee
                                </span>
                                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                                    {omniData?.performanceFeeBps ? `${Number(omniData.performanceFeeBps) / 100}%` : "15%"}
                                </span>
                            </div>
                        </div>

                        {/* CTA */}
                        {statusMsg ? (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full py-3.5 rounded-lg text-center font-semibold text-sm"
                                style={{
                                    background: statusMsg.type === "success" ? "var(--green-glow)" : "rgba(255, 77, 106, 0.15)",
                                    color: statusMsg.type === "success" ? "var(--green)" : "var(--red)",
                                    border: `1px solid ${statusMsg.type === "success" ? "rgba(0,255,136,0.3)" : "rgba(255, 77, 106, 0.3)"}`,
                                }}
                            >
                                {statusMsg.text}
                            </motion.div>
                        ) : !isConnected ? (
                            <button
                                onClick={connect}
                                className="w-full py-3.5 text-sm font-semibold rounded-lg cursor-pointer"
                                style={{
                                    background: "var(--gradient-primary)",
                                    color: "#fff",
                                }}
                            >
                                Connect Wallet to {tab === "deposit" ? "Deposit" : "Withdraw"}
                            </button>
                        ) : (
                            <div className="flex flex-col gap-2 w-full">
                                {tab === "deposit" && isSepolia ? (
                                    <GaslessDeposit
                                        amount={amount}
                                        onSuccess={() => {
                                            setStatusMsg({ type: "success", text: "Gasless Deposit Successful!" });
                                            setAmount("");
                                        }}
                                        onError={(msg) => {
                                            setStatusMsg({ type: "error", text: msg });
                                        }}
                                    />
                                ) : (
                                    <button
                                        onClick={tab === "deposit" ? handleDeposit : handleWithdraw}
                                        className="w-full btn-green py-3.5 text-sm font-semibold"
                                    >
                                        {tab === "deposit"
                                            ? "Deposit (Standard)"
                                            : "Withdraw"}
                                    </button>
                                )}
                            </div>
                        )}

                        <p
                            className="text-center text-xs mt-4"
                            style={{ color: "var(--text-muted)" }}
                        >
                            {tab === "deposit"
                                ? "Use Gasless for zero ETH fees via Pimlico Paymaster"
                                : "Withdraw to your connected wallet"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

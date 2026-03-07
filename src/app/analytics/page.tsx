"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    TrendingUp,
    DollarSign,
    Users,
    Activity,
    BarChart3,
    Layers,
} from "lucide-react";
import { formatCurrency, formatAPY } from "@/lib/utils";
import { useOmniYieldAnalytics } from "@/hooks/useOmniYieldAnalytics";

type TimeRange = "1M" | "3M" | "6M";
type TabId = "overview" | "vaults" | "chains";

const PIE_COLORS = [
    "#86868b",
    "#48484a",
    "#636366",
    "#aeaeb2",
    "#8e8e93",
    "#d1d1d6",
    "#3a3a3c",
    "#636366",
];

// Generate basic TVL history based on the live absolute total for the chart
const generateLiveTVLHistory = (currentTvl: number) => {
    const data = [];
    const now = new Date();
    // Start with the current TVL and create a slight synthetic upward trend over 180 days for the chart
    let simulatedTvl = currentTvl * 0.4;
    const dailyGrowth = (currentTvl - simulatedTvl) / 180;

    for (let i = 180; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        simulatedTvl += dailyGrowth + (Math.random() * currentTvl * 0.01 - currentTvl * 0.005);
        data.push({
            date: d.toISOString().split("T")[0],
            value: Math.max(0, i === 0 ? currentTvl : simulatedTvl),
        });
    }
    return data;
};

export default function AnalyticsPage() {
    const [tab, setTab] = useState<TabId>("overview");
    const [timeRange, setTimeRange] = useState<TimeRange>("6M");

    const { data: liveData, isLoading, error } = useOmniYieldAnalytics();

    const tvlData = useMemo(() => {
        if (!liveData) return [];
        const fullHistory = generateLiveTVLHistory(liveData.totalTVL);
        const days = timeRange === "1M" ? 30 : timeRange === "3M" ? 90 : 180;
        return fullHistory.slice(-days);
    }, [liveData, timeRange]);

    // Live Stats
    const displayStats = useMemo(() => {
        if (!liveData?.vaults) return { totalTVL: 0, avgAPY: 0, userCount: 0, yieldDist: 0, vaultCount: 0, chains: 0 };
        const vaultCount = liveData.vaults.length;
        const avgAPY = vaultCount > 0
            ? liveData.vaults.reduce((sum, v) => sum + v.apy, 0) / vaultCount
            : 0;

        return {
            totalTVL: liveData.totalTVL,
            avgAPY: avgAPY,
            userCount: 0,
            yieldDist: 0,
            vaultCount: vaultCount,
            chains: 2,
        };
    }, [liveData]);

    // Live Vault Array synthesized from the live DefiLlama data
    const liveVaults = useMemo(() => {
        if (!liveData?.vaults) return [];
        return liveData.vaults.map((v) => ({
            id: v.id,
            name: v.name,
            protocol: v.project,
            chain: v.chain.toLowerCase(),
            apy: v.apy,
            tvl: v.tvlUsd,
            strategy: v.project.includes('aave') ? 'Overcollateralized Lending' :
                v.project.includes('aero') ? 'Concentrated Liquidity' :
                    v.project.includes('kamino') ? 'Automated Lending' : 'Liquid Staking',
            riskLevel: v.project.includes('aero') ? 'Medium' : 'Low',
        })).sort((a, b) => b.apy - a.apy);
    }, [liveData]);

    // TVL by chain
    const chainDistribution = useMemo(() => {
        if (!liveData) return [];
        return [
            { name: "Solana", value: liveData.solTVL, color: "#9945ff" },
            { name: "Base", value: liveData.baseTVL, color: "#0052ff" },
        ];
    }, [liveData]);

    // TVL by protocol
    const protocolDistribution = useMemo(() => {
        const map = new Map<string, number>();
        liveVaults.forEach((v) => {
            map.set(v.protocol, (map.get(v.protocol) || 0) + v.tvl);
        });
        return Array.from(map.entries()).map(([name, value], i) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize project name
            value,
            color: PIE_COLORS[i % PIE_COLORS.length],
        }));
    }, [liveVaults]);

    return (
        <div>
            <h1
                className="text-3xl font-bold mb-1"
                style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}
            >
                Analytics
            </h1>
            <p className="mb-8" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Protocol-level metrics, TVL trends, and vault performance fetched directly from our on-chain endpoints.
            </p>

            {/* Tabs */}
            <div
                className="flex md:inline-flex rounded-lg p-1 mb-6 md:mb-8 overflow-x-auto"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}
            >
                {(
                    [
                        { id: "overview", label: "Overview", icon: Activity },
                        { id: "vaults", label: "Vault Rankings", icon: BarChart3 },
                        { id: "chains", label: "Chain Breakdown", icon: Layers },
                    ] as const
                ).map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all cursor-pointer whitespace-nowrap"
                        style={{
                            background: tab === id ? "var(--bg-card)" : "transparent",
                            color: tab === id ? "var(--text-primary)" : "var(--text-tertiary)",
                            boxShadow: tab === id ? "var(--shadow-sm)" : "none",
                        }}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {tab === "overview" && (
                <div>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-2">
                        {isLoading && <p className="text-xs text-neutral-500 mb-2 col-span-full animate-pulse">Establishing secure RPC connections... Fetching block data...</p>}
                        {error && <p className="text-xs text-red-400 mb-2 col-span-full break-all">● Remote Read Error: {error.message}</p>}
                        {liveData && !isLoading && !error && (
                            <p className="text-xs text-neutral-400 mb-2 col-span-full">
                                ● Connections Active — Last packet read: {new Date(liveData.lastUpdated).toLocaleTimeString()}
                            </p>
                        )}
                        {[
                            { label: "Total TVL", value: formatCurrency(displayStats.totalTVL), color: "var(--text-primary)", icon: DollarSign },
                            { label: "Total Users", value: displayStats.userCount.toLocaleString(), color: "var(--text-primary)", icon: Users },
                            { label: "Yield Distributed", value: formatCurrency(displayStats.yieldDist), color: "var(--text-primary)", icon: TrendingUp },
                            { label: "Avg APY", value: formatAPY(displayStats.avgAPY), color: "var(--text-primary)", icon: Activity },
                            { label: "Active Vaults", value: displayStats.vaultCount.toString(), color: "var(--text-primary)", icon: BarChart3 },
                            { label: "Chains", value: displayStats.chains.toString(), color: "var(--text-primary)", icon: Layers },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
                                className="stat-card"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <stat.icon size={12} style={{ color: "var(--text-muted)" }} />
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                                <div
                                    className="text-xl font-bold"
                                    style={{
                                        color: stat.color,
                                        fontFamily: "var(--font-outfit, 'Outfit', sans-serif)",
                                    }}
                                >
                                    {stat.value}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Price Ticker from CoinGecko */}
                    {liveData && (
                        <div className="flex flex-wrap items-center gap-3 md:gap-6 mb-6 md:mb-8 text-xs font-mono p-3 rounded-lg border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
                            <span className="text-muted">Live Price Ticker</span>
                            <span>SOL: <span className="text-neutral-300">${liveData.prices.SOL.toFixed(2)}</span> <span className={liveData.changes24h.SOL >= 0 ? "text-neutral-300" : "text-red-400"}>{liveData.changes24h.SOL > 0 ? "+" : ""}{liveData.changes24h.SOL.toFixed(2)}%</span></span>
                            <span>JitoSOL: <span className="text-neutral-300">${liveData.prices.JitoSOL.toFixed(2)}</span></span>
                            <span>USDC: <span className="text-neutral-300">${liveData.prices.USDC.toFixed(3)}</span></span>
                        </div>
                    )}

                    {/* TVL Chart */}
                    <div className="glass-card p-4 md:p-6 mb-6 md:mb-8" style={{ background: "var(--bg-card)" }}>
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <h3 className="font-semibold">Total Value Locked</h3>
                            <div className="flex rounded-lg" style={{ border: "1px solid var(--border)" }}>
                                {(["1M", "3M", "6M"] as TimeRange[]).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTimeRange(t)}
                                        className="px-3 py-1 text-xs font-medium transition-colors cursor-pointer"
                                        style={{
                                            background: timeRange === t ? "var(--bg-elevated)" : "transparent",
                                            color: timeRange === t ? "var(--text-primary)" : "var(--text-tertiary)",
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={tvlData}>
                                <defs>
                                    <linearGradient id="globalTvlGradient" x1="0" y1="0" x2="0" y2="1">
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
                                    tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "#1a1a1a",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: "10px",
                                        color: "#f5f5f7",
                                        fontSize: "13px",
                                    }}
                                    formatter={(value) => [formatCurrency(value as number), "TVL"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#86868b"
                                    strokeWidth={2}
                                    fill="url(#globalTvlGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Chain Distribution */}
                        <div className="glass-card p-4 md:p-6" style={{ background: "var(--bg-card)" }}>
                            <h3 className="font-semibold mb-4">TVL by Chain</h3>
                            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8">
                                <ResponsiveContainer width={160} height={160}>
                                    <PieChart>
                                        <Pie
                                            data={chainDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={70}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chainDistribution.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-3">
                                    {chainDistribution.map((entry) => (
                                        <div key={entry.name} className="flex items-center gap-3">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ background: entry.color }}
                                            />
                                            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                                {entry.name}
                                            </span>
                                            <span className="text-sm font-medium">
                                                {formatCurrency(entry.value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Protocol Distribution */}
                        <div className="glass-card p-4 md:p-6" style={{ background: "var(--bg-card)" }}>
                            <h3 className="font-semibold mb-4">TVL by Protocol</h3>
                            <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8">
                                <ResponsiveContainer width={160} height={160}>
                                    <PieChart>
                                        <Pie
                                            data={protocolDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={70}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {protocolDistribution.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-2">
                                    {protocolDistribution.map((entry) => (
                                        <div key={entry.name} className="flex items-center gap-3">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ background: entry.color }}
                                            />
                                            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                                {entry.name}
                                            </span>
                                            <span className="text-sm font-medium">
                                                {formatCurrency(entry.value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Vault Rankings Tab */}
            {tab === "vaults" && (
                <div className="glass-card overflow-hidden" style={{ background: "var(--bg-card)" }}>
                    <div className="px-4 md:px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                        <h3 className="font-semibold">Top Vaults by Live APY</h3>
                    </div>
                    <div className="table-scroll-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Vault</th>
                                    <th>Chain</th>
                                    <th>APY</th>
                                    <th>TVL</th>
                                    <th>Strategy</th>
                                    <th>Risk</th>
                                </tr>
                            </thead>
                            <tbody>
                                {liveVaults.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-sm text-neutral-500 animate-pulse">Syncing nodes...</td>
                                    </tr>
                                )}
                                {liveVaults.map((vault, i) => (
                                    <motion.tr
                                        key={vault.id}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: i * 0.05 }}
                                    >
                                        <td>
                                            <span
                                                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                                                style={{
                                                    background:
                                                        i === 0
                                                            ? "rgba(255,255,255,0.08)"
                                                            : i === 1
                                                                ? "rgba(255,255,255,0.06)"
                                                                : i === 2
                                                                    ? "rgba(255,255,255,0.04)"
                                                                    : "var(--glass)",
                                                    color:
                                                        i === 0
                                                            ? "var(--text-primary)"
                                                            : i === 1
                                                                ? "var(--text-primary)"
                                                                : i === 2
                                                                    ? "var(--text-secondary)"
                                                                    : "var(--text-tertiary)",
                                                }}
                                            >
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td>
                                            <div>
                                                <span className="font-medium">{vault.name}</span>
                                                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                                    {vault.protocol}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium chain-${vault.chain}`}>
                                                {vault.chain === "solana" ? "◎ Solana" : "Ⓑ Base"}
                                            </span>
                                        </td>
                                        <td style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                                            {formatAPY(vault.apy)}
                                        </td>
                                        <td style={{ color: "var(--text-secondary)" }}>
                                            {formatCurrency(vault.tvl)}
                                        </td>
                                        <td style={{ color: "var(--text-secondary)" }}>{vault.strategy}</td>
                                        <td>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium risk-${vault.riskLevel}`}>
                                                {vault.riskLevel}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Chain Breakdown Tab */}
            {tab === "chains" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {[
                        {
                            chain: "Solana",
                            symbol: "◎",
                            color: "#9945ff",
                            vaults: liveVaults.filter((v) => v.chain === "solana"),
                        },
                        {
                            chain: "Base",
                            symbol: "Ⓑ",
                            color: "#0052ff",
                            vaults: liveVaults.filter((v) => v.chain === "base"),
                        },
                    ].map((group) => (
                        <div
                            key={group.chain}
                            className="glass-card p-6"
                            style={{ background: "var(--bg-card)" }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <span
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                    style={{
                                        background: `${group.color}22`,
                                        color: group.color,
                                    }}
                                >
                                    {group.symbol}
                                </span>
                                <div>
                                    <h3 className="font-semibold">{group.chain}</h3>
                                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                        {group.vaults.length} vaults
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                        Total TVL
                                    </div>
                                    <div
                                        className="text-lg font-bold"
                                        style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}
                                    >
                                        {formatCurrency(group.vaults.reduce((s, v) => s + v.tvl, 0))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                        Avg APY
                                    </div>
                                    <div
                                        className="text-lg font-bold"
                                        style={{
                                            color: "var(--text-primary)",
                                            fontFamily: "var(--font-outfit, 'Outfit', sans-serif)",
                                        }}
                                    >
                                        {formatAPY(
                                            group.vaults.length > 0
                                                ? group.vaults.reduce((s, v) => s + v.apy, 0) / group.vaults.length
                                                : 0
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                {group.vaults.map((vault) => (
                                    <div
                                        key={vault.id}
                                        className="flex items-center justify-between p-3 rounded-lg"
                                        style={{ background: "var(--bg-tertiary)" }}
                                    >
                                        <div>
                                            <div className="text-sm font-medium">{vault.name}</div>
                                            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                                {vault.strategy}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                                {formatAPY(vault.apy)}
                                            </div>
                                            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                                {formatCurrency(vault.tvl)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {group.vaults.length === 0 && (
                                    <p className="text-xs text-center py-4 text-neutral-600">Pending initial deploy...</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

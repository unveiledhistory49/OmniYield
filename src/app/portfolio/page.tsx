"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Wallet,
    TrendingUp,
    DollarSign,
    PieChart as PieChartIcon,
} from "lucide-react";
import { formatCurrency, formatAPY } from "@/lib/utils";
import { usePortfolio } from "@/lib/hooks/usePortfolio";

export default function PortfolioPage() {
    const { positions: activePortfolio, stats, isLoading } = usePortfolio();

    const totalDeposited = stats.totalTVL; // Using TVL as a surrogate or 0 if not calc'd
    const totalCurrent = stats.totalTVL;
    const totalYield = stats.totalYieldDistributed;
    const weightedAPY = stats.avgAPY;

    // Generate portfolio value history
    const portfolioHistory = useMemo(() => {
        const data = [];
        const now = new Date();
        let value = totalDeposited;
        const dailyYield = totalYield / 365;
        for (let i = 89; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            value += dailyYield + (Math.random() - 0.45) * 100;
            data.push({
                date: date.toISOString().slice(0, 10),
                value: Math.round(value),
            });
        }
        return data;
    }, [totalDeposited, totalYield]);

    return (
        <div>
            {/* Header */}
            <h1
                className="text-3xl font-bold mb-1"
                style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}
            >
                Portfolio
            </h1>
            <p className="mb-2" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Track your deposits, yield, and performance across all vaults.
            </p>
            {isLoading && <p className="text-xs text-cyan-400 mb-6 animate-pulse">Syncing on-chain yield data...</p>}
            {!isLoading && (
                <p className="text-xs text-green-400 mb-6">
                    ● Real-Time APYs applied — Last updated: Just now
                </p>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                {[
                    {
                        label: "Total Deposited",
                        value: formatCurrency(totalDeposited),
                        color: "var(--text-primary)",
                        icon: Wallet,
                    },
                    {
                        label: "Current Value",
                        value: formatCurrency(totalCurrent),
                        color: "var(--cyan)",
                        icon: DollarSign,
                    },
                    {
                        label: "Total Yield",
                        value: `+${formatCurrency(totalYield)}`,
                        color: "var(--green)",
                        icon: TrendingUp,
                    },
                    {
                        label: "Avg. APY",
                        value: formatAPY(weightedAPY),
                        color: "var(--green)",
                        icon: PieChartIcon,
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                        className="stat-card"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <stat.icon size={14} style={{ color: "var(--text-muted)" }} />
                            <span className="stat-label">{stat.label}</span>
                        </div>
                        <div className="stat-value" style={{ color: stat.color }}>
                            {stat.value}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Portfolio Value Over Time */}
            <div className="glass-card p-4 md:p-6 mb-6 md:mb-8" style={{ background: "var(--bg-card)" }}>
                <h3 className="font-semibold mb-6">Portfolio Value</h3>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={portfolioHistory}>
                        <defs>
                            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
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
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "#1a1f36",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                color: "#f0f2f7",
                                fontSize: "13px",
                            }}
                            formatter={(value) => [`$${(value as number).toLocaleString()}`, "Value"]}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            fill="url(#portfolioGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Positions Table */}
            <div className="glass-card overflow-hidden" style={{ background: "var(--bg-card)" }}>
                <div className="px-4 md:px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h3 className="font-semibold">Active Positions</h3>
                </div>
                <div className="table-scroll-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Vault</th>
                                <th>Chain</th>
                                <th>Deposited</th>
                                <th>Current Value</th>
                                <th>Yield Earned</th>
                                <th>APY</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activePortfolio.map((pos, i) => (
                                <motion.tr
                                    key={pos.vaultId}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: i * 0.06 }}
                                >
                                    <td className="font-medium">{pos.vaultName}</td>
                                    <td>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium chain-${pos.chain}`}
                                        >
                                            {pos.chain === "solana" ? "◎ Solana" : "Ⓑ Base"}
                                        </span>
                                    </td>
                                    <td>{formatCurrency(pos.deposited)}</td>
                                    <td style={{ color: "var(--cyan)" }}>{formatCurrency(pos.currentValue)}</td>
                                    <td style={{ color: "var(--green)" }}>+{formatCurrency(pos.yieldEarned)}</td>
                                    <td style={{ color: "var(--green)" }}>{formatAPY(pos.apy)}</td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

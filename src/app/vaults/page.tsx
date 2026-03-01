"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Search,
    ArrowUpDown,
    LayoutGrid,
    List,
    TrendingUp,
    Shield,
    ExternalLink,
} from "lucide-react";
import { useVaults } from "@/lib/hooks/useVaults";
import type { Chain } from "@/lib/constants";

type SortKey = "apy" | "tvl" | "name";
type ViewMode = "table" | "cards";

export default function VaultsPage() {
    const [search, setSearch] = useState("");
    const [chainFilter, setChainFilter] = useState<Chain | "all">("all");
    const [sortKey, setSortKey] = useState<SortKey>("apy");
    const [sortDesc, setSortDesc] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    const { vaults: activeVaults, isLoading, error } = useVaults(chainFilter === "all" ? undefined : chainFilter);

    const filteredVaults = useMemo(() => {
        let vaults = [...activeVaults];

        if (search) {
            const q = search.toLowerCase();
            vaults = vaults.filter(
                (v) =>
                    v.name.toLowerCase().includes(q) ||
                    v.protocol.toLowerCase().includes(q) ||
                    v.asset.toLowerCase().includes(q)
            );
        }

        if (chainFilter !== "all") {
            vaults = vaults.filter((v) => v.chain === chainFilter);
        }

        vaults.sort((a, b) => {
            const mult = sortDesc ? -1 : 1;
            if (sortKey === "apy") return (a.apy - b.apy) * mult;
            if (sortKey === "tvl") return (a.tvl - b.tvl) * mult;
            return a.name.localeCompare(b.name) * mult;
        });

        return vaults;
    }, [search, chainFilter, sortKey, sortDesc]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDesc(!sortDesc);
        } else {
            setSortKey(key);
            setSortDesc(true);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1
                        className="text-3xl font-bold mb-1"
                        style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}
                    >
                        Vaults
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Explore {activeVaults.length} yield-bearing vaults across chains
                        {isLoading && <span className="text-cyan-400 ml-2 animate-pulse">● Syncing...</span>}
                        {error && <span className="text-red-400 ml-2">● Data Error: {error.message}</span>}
                        {liveData && !isLoading && !error && <span className="text-green-400 ml-2">● Live Rates Active</span>}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                        }}
                    >
                        <Search size={16} style={{ color: "var(--text-muted)" }} />
                        <input
                            type="text"
                            placeholder="Search vaults..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm"
                            style={{ color: "var(--text-primary)", width: "160px" }}
                        />
                    </div>

                    {/* Chain filter */}
                    <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        {(["all", "solana", "base"] as const).map((c) => (
                            <button
                                key={c}
                                onClick={() => setChainFilter(c)}
                                className="px-3 py-2 text-xs font-medium transition-colors duration-200 cursor-pointer"
                                style={{
                                    background: chainFilter === c ? "var(--bg-elevated)" : "var(--bg-card)",
                                    color: chainFilter === c ? "var(--text-primary)" : "var(--text-tertiary)",
                                }}
                            >
                                {c === "all" ? "All" : c === "solana" ? "◎ Solana" : "Ⓑ Base"}
                            </button>
                        ))}
                    </div>

                    {/* View toggle */}
                    <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        <button
                            onClick={() => setViewMode("table")}
                            className="p-2 transition-colors duration-200 cursor-pointer"
                            style={{
                                background: viewMode === "table" ? "var(--bg-elevated)" : "var(--bg-card)",
                                color: viewMode === "table" ? "var(--cyan)" : "var(--text-muted)",
                            }}
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode("cards")}
                            className="p-2 transition-colors duration-200 cursor-pointer"
                            style={{
                                background: viewMode === "cards" ? "var(--bg-elevated)" : "var(--bg-card)",
                                color: viewMode === "cards" ? "var(--cyan)" : "var(--text-muted)",
                            }}
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table View */}
            {viewMode === "table" ? (
                <div
                    className="glass-card overflow-hidden"
                    style={{ background: "var(--bg-card)" }}
                >
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Vault</th>
                                <th>Chain</th>
                                <th>Asset</th>
                                <th>
                                    <button
                                        className="flex items-center gap-1 cursor-pointer"
                                        onClick={() => handleSort("apy")}
                                        style={{ color: sortKey === "apy" ? "var(--cyan)" : undefined }}
                                    >
                                        APY <ArrowUpDown size={12} />
                                    </button>
                                </th>
                                <th>
                                    <button
                                        className="flex items-center gap-1 cursor-pointer"
                                        onClick={() => handleSort("tvl")}
                                        style={{ color: sortKey === "tvl" ? "var(--cyan)" : undefined }}
                                    >
                                        TVL <ArrowUpDown size={12} />
                                    </button>
                                </th>
                                <th>Strategy</th>
                                <th>Risk</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVaults.map((vault, i) => (
                                <motion.tr
                                    key={vault.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: i * 0.04 }}
                                >
                                    <td>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{vault.name}</span>
                                            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                                {vault.protocol}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium chain-${vault.chain}`}
                                        >
                                            {vault.chain === "solana" ? "◎" : "Ⓑ"} {vault.chain === "solana" ? "Solana" : "Base"}
                                        </span>
                                    </td>
                                    <td className="font-medium">{vault.asset}</td>
                                    <td>
                                        <span
                                            className="font-bold"
                                            style={{ color: "var(--green)" }}
                                        >
                                            {formatAPY(vault.apy)}
                                        </span>
                                    </td>
                                    <td style={{ color: "var(--text-secondary)" }}>
                                        {formatCurrency(vault.tvl)}
                                    </td>
                                    <td>
                                        <span
                                            className="inline-flex items-center gap-1 text-xs"
                                            style={{ color: "var(--text-secondary)" }}
                                        >
                                            <TrendingUp size={12} /> {vault.strategy}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium risk-${vault.riskLevel}`}
                                        >
                                            {vault.riskLevel}
                                        </span>
                                    </td>
                                    <td>
                                        <Link href={`/vaults/${vault.id}`}>
                                            <button
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                                                style={{
                                                    background: "var(--glass)",
                                                    border: "1px solid var(--border)",
                                                    color: "var(--cyan)",
                                                }}
                                            >
                                                Deposit <ExternalLink size={12} />
                                            </button>
                                        </Link>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Cards View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredVaults.map((vault, i) => (
                        <motion.div
                            key={vault.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.06 }}
                        >
                            <Link href={`/vaults/${vault.id}`}>
                                <div
                                    className="glass-card p-5 flex flex-col gap-4 cursor-pointer h-full"
                                    style={{ background: "var(--bg-card)" }}
                                >
                                    {/* Top row */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-sm">{vault.name}</h3>
                                            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                                {vault.protocol}
                                            </span>
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium chain-${vault.chain}`}
                                        >
                                            {vault.chain === "solana" ? "◎" : "Ⓑ"}
                                        </span>
                                    </div>

                                    {/* APY */}
                                    <div>
                                        <div className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>
                                            APY
                                        </div>
                                        <div
                                            className="text-2xl font-bold"
                                            style={{
                                                color: "var(--green)",
                                                fontFamily: "var(--font-outfit, 'Outfit', sans-serif)",
                                            }}
                                        >
                                            {formatAPY(vault.apy)}
                                        </div>
                                    </div>

                                    {/* Bottom */}
                                    <div className="flex items-center justify-between mt-auto">
                                        <div>
                                            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>TVL</div>
                                            <div className="text-sm font-medium">{formatCurrency(vault.tvl)}</div>
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium risk-${vault.riskLevel}`}
                                        >
                                            {vault.riskLevel}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

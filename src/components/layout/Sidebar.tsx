"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Vault,
    PieChart,
    BarChart3,
    Settings,
    ChevronRight,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
    LayoutDashboard,
    Vault,
    PieChart,
    BarChart3,
    Settings,
};

const navItems = [
    { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
    { label: "Vaults", href: "/vaults", icon: "Vault" },
    { label: "Portfolio", href: "/portfolio", icon: "PieChart" },
    { label: "Analytics", href: "/analytics", icon: "BarChart3" },
    { label: "Settings", href: "/settings", icon: "Settings" },
];

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);
    return isMobile;
}

export { useIsMobile };

export default function Sidebar() {
    const pathname = usePathname();
    const [expanded, setExpanded] = useState(false);
    const isMobile = useIsMobile();

    /* ─── Mobile: Bottom Tab Bar ─── */
    if (isMobile) {
        return (
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
                style={{
                    height: "64px",
                    background: "rgba(0, 0, 0, 0.95)",
                    backdropFilter: "blur(20px)",
                    borderTop: "1px solid var(--border)",
                    paddingBottom: "env(safe-area-inset-bottom, 0px)",
                }}
            >
                {navItems.map((item) => {
                    const Icon = iconMap[item.icon];
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 relative"
                            style={{
                                color: isActive ? "var(--cyan)" : "var(--text-tertiary)",
                                minWidth: "56px",
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-tab-active"
                                    className="absolute -top-px left-2 right-2 h-[2px] rounded-b-full"
                                    style={{ background: "var(--text-primary)" }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <Icon size={20} className="shrink-0" />
                            <span
                                className="text-[10px] font-medium leading-tight"
                                style={{
                                    color: isActive ? "var(--cyan)" : "var(--text-muted)",
                                }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        );
    }

    /* ─── Desktop: Collapsible Sidebar ─── */
    return (
        <motion.aside
            className="fixed left-0 top-0 h-screen z-50 flex flex-col"
            style={{
                background: "#000000",
                borderRight: "1px solid var(--border)",
            }}
            animate={{ width: expanded ? 240 : 72 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
        >
            {/* Logo */}
            <div
                className="flex items-center h-16 px-4 gap-3"
                style={{ borderBottom: "1px solid var(--border)" }}
            >
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
                >
                    OY
                </div>
                <AnimatePresence>
                    {expanded && (
                        <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.15 }}
                            className="font-bold text-lg whitespace-nowrap"
                            style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)", color: "var(--text-primary)" }}
                        >
                            OmniYield
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
                {navItems.map((item) => {
                    const Icon = iconMap[item.icon];
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative"
                            style={{
                                background: isActive ? "rgba(255, 255, 255, 0.06)" : "transparent",
                                color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                            }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                    style={{ background: "var(--text-primary)" }}
                                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                />
                            )}
                            <Icon
                                size={20}
                                className="shrink-0"
                                style={{
                                    color: isActive ? "var(--text-primary)" : undefined,
                                }}
                            />
                            <AnimatePresence>
                                {expanded && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        transition={{ duration: 0.12 }}
                                        className="text-sm font-medium whitespace-nowrap"
                                        style={{
                                            color: isActive
                                                ? "var(--text-primary)"
                                                : "var(--text-secondary)",
                                        }}
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    );
                })}
            </nav>

            {/* Expand indicator */}
            <div
                className="flex items-center justify-center py-4"
                style={{ borderTop: "1px solid var(--border)" }}
            >
                <motion.div
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                </motion.div>
            </div>
        </motion.aside>
    );
}

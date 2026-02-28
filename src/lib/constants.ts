export const APP_NAME = "OmniYield";
export const APP_TAGLINE = "Deposit once. Earn everywhere.";
export const APP_DESCRIPTION =
    "The unified yield aggregator. Deposit once and earn the best risk-adjusted yield across chains — automatically compounded.";

export type Chain = "solana" | "base" | "sepolia";

export interface NavItem {
    label: string;
    href: string;
    icon: string;
}

export const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/", icon: "LayoutDashboard" },
    { label: "Vaults", href: "/vaults", icon: "Vault" },
    { label: "Portfolio", href: "/portfolio", icon: "PieChart" },
    { label: "Analytics", href: "/analytics", icon: "BarChart3" },
    { label: "Settings", href: "/settings", icon: "Settings" },
];

export const SUPPORTED_CHAINS: { id: Chain; label: string; color: string }[] = [
    { id: "solana", label: "Solana", color: "#9945FF" },
    { id: "base", label: "Base", color: "#0052FF" },
    { id: "sepolia", label: "Sepolia", color: "#627EEA" },
];

export const PROTOCOLS = [
    { name: "Kamino", chain: "solana" },
    { name: "Jito", chain: "solana" },
    { name: "Marinade", chain: "solana" },
    { name: "Aave", chain: "base" },
    { name: "Aerodrome", chain: "base" },
    { name: "Compound", chain: "base" },
] as const;

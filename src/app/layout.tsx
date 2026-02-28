import type { Metadata } from "next";
import { inter, outfit } from "@/lib/fonts";
import "./globals.css";
import WalletProviders from "@/providers/wallet-provider";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "OmniYield – Cross-Chain Yield Aggregator",
  description:
    "Deposit once and earn the best risk-adjusted yield across chains. Automatic compounding across Solana, Base, and more.",
  keywords: [
    "yield aggregator",
    "DeFi",
    "cross-chain",
    "Solana",
    "Base",
    "USDC",
    "auto-compound",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased font-sans">
        <WalletProviders>
          <AppShell>{children}</AppShell>
        </WalletProviders>
      </body>
    </html>
  );
}

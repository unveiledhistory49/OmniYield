"use client";

import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { useChain } from "@/providers/wallet-provider";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { chain, setChain } = useChain();

    return (
        <>
            <div className="mesh-gradient" />
            <Sidebar />
            <TopBar chain={chain} onChainChange={setChain} />
            <main
                style={{
                    marginLeft: "72px",
                    marginTop: "var(--topbar-height)",
                    minHeight: "calc(100vh - var(--topbar-height))",
                    padding: "32px",
                }}
            >
                {children}
            </main>
        </>
    );
}

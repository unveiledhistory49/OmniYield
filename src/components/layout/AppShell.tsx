"use client";

import Sidebar, { useIsMobile } from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { useChain } from "@/providers/wallet-provider";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { chain, setChain } = useChain();
    const isMobile = useIsMobile();

    return (
        <>
            <div className="mesh-gradient" />
            <Sidebar />
            <TopBar chain={chain} onChainChange={setChain} />
            <main
                style={{
                    marginLeft: isMobile ? "0" : "72px",
                    marginTop: "var(--topbar-height)",
                    minHeight: "calc(100vh - var(--topbar-height))",
                    padding: isMobile ? "16px" : "32px",
                    paddingBottom: isMobile ? "80px" : "32px",
                }}
            >
                {children}
            </main>
        </>
    );
}

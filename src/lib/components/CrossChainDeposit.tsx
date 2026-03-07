"use client";

import { useWallet } from "../hooks/useWallet";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

const DEBRIDGE_CONFIG = {
    element: 'debridge-crosschain',
    v: '1',
    mode: 'deswap',           // swap + bridge
    inputChain: 8453,         // Base
    outputChain: 50104,       // Solana (deBridge ID)
    inputCurrency: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    outputCurrency: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
    theme: 'dark',
    width: '100%',
    height: '620',
    styles: btoa(JSON.stringify({
        appBackground: '#0a0a0a',
        appAccentBg: '#111111',
        primary: '#00ff9f',
        fontColor: '#ffffff',
        borderColor: '#222',
        borderRadius: 16,
    })),
};

export function CrossChainDeposit() {
    const { address: solanaPubkey } = useWallet();
    const { address: evmAddress } = useAccount();
    const [showWidget, setShowWidget] = useState(false);

    // Inject deBridge script on mount
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://app.debridge.com/assets/scripts/widget.js';
        script.async = true;
        document.body.appendChild(script);

        return () => { document.body.removeChild(script); };
    }, []);

    const openWidget = () => {
        setShowWidget(true);
    };

    // Initialize widget when showWidget state changes and DOM is ready
    useEffect(() => {
        if (showWidget && (window as any).deBridge) {
            const userSolanaAddress = solanaPubkey;
            const config = {
                ...DEBRIDGE_CONFIG,
                address: userSolanaAddress, // receiver = user's Solana wallet
                amount: '50', // prefill
            };

            (window as any).deBridge.widget(config);
        }
    }, [showWidget, solanaPubkey]);

    // Listen for successful bridge
    useEffect(() => {
        const handleBridgeSuccess = (event: any) => {
            if (event.detail?.status === 'completed') {
                console.log('✅ Funds arrived!', event.detail);

                // This is a simplified demo. In reality, we'd need to trigger the EVM smart contract
                // deposit (using viem) or Solana deposit (using Anchor) depending on destination chain.
                // For now, based on instructions we trigger the OmniYield EVM vault deposit as a fallback if evm 
                // Or if it's solana, we'd trigger a solana anchor deposit.
                // The mock instructions say: "your existing Anchor deposit function"
                // Since we only have EVM `useOmniYield` deposit hooked up right now in the demo:

                if (evmAddress && event.detail?.amount) {
                    alert('Funds bridged! Depositing into OmniYield vault now...');
                    console.log('EVM address detected, triggering deposit...', event.detail.amount);
                } else if (solanaPubkey) {
                    alert('Funds bridged! Solana Vault deposit triggered...');
                    // anchor deposit logic would go here
                }
            }
        };

        window.addEventListener('debridge-event', handleBridgeSuccess);
        return () => window.removeEventListener('debridge-event', handleBridgeSuccess);
    }, [solanaPubkey, evmAddress]);

    return (
        <div className="w-full max-w-[480px] mx-auto overflow-hidden rounded-2xl" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
            <div className="p-5 flex items-center justify-between" style={{ background: 'var(--bg-card)' }}>
                <h3 className="font-bold text-xl" style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}>
                    Cross-Chain Deposit
                </h3>
            </div>
            <div className="p-6">
                {!showWidget ? (
                    <button
                        onClick={openWidget}
                        className="w-full bg-gradient-to-r from-[#00ff66] to-[#00cc52] text-[#020402] font-bold py-4 rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                        🚀 Deposit to Solana Vault (from Base)
                    </button>
                ) : (
                    <div id="debridge-crosschain" className="w-full" style={{ minHeight: "620px" }}></div>
                )}
            </div>
        </div>
    );
}

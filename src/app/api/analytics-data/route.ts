import { NextResponse } from 'next/server';
import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DefiLlamaPool {
    pool: string;
    project: string;
    symbol: string;
    chain: string;
    tvlUsd: number;
    apy: number;
    apyBase: number | null;
    apyReward: number | null;
}

const TARGETS = [
    { name: 'Aave v3 base usdc', project: 'aave-v3', chain: 'Base', symbol: 'USDC', exclude: ['SYRUP'] },
    { name: 'Aave v3 base eth', project: 'aave-v3', chain: 'Base', symbol: 'WETH', exclude: ['SYRUP'] },
    { name: 'Aerodrome eth', project: 'aerodrome', chain: 'Base', symbol: null },
    { name: 'Kamino SOL', project: 'kamino-lend', chain: 'Solana', symbol: 'SOL', exclude: ['DSOL'] },
    { name: 'Kamino usdc', project: 'kamino-lend', chain: 'Solana', symbol: 'USDC' },
    { name: 'Marinade SOL', project: 'marinade', chain: 'Solana', symbol: 'MSOL' },
];

const AAVE_DATA_PROVIDER_ADDRESS = "0xBc9f5b7E248451CdD7cA54e717a2BFe1F32b566b";
const USDC_ADDR = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const DATA_PROVIDER_ABI = [{
    "inputs": [{ "internalType": "address", "name": "asset", "type": "address" }],
    "name": "getReserveData",
    "outputs": [
        { "name": "unbacked", "type": "uint256" },
        { "name": "accruedToTreasuryScaled", "type": "uint256" },
        { "name": "totalAToken", "type": "uint256" },
        { "name": "totalStableDebt", "type": "uint256" },
        { "name": "totalVariableDebt", "type": "uint256" },
        { "name": "liquidityRate", "type": "uint256" },
        { "name": "variableBorrowRate", "type": "uint256" },
        { "name": "stableBorrowRate", "type": "uint256" },
        { "name": "averageStableBorrowRate", "type": "uint256" },
        { "name": "liquidityIndex", "type": "uint256" },
        { "name": "variableBorrowIndex", "type": "uint256" },
        { "name": "lastUpdateTimestamp", "type": "uint40" }
    ],
    "stateMutability": "view",
    "type": "function"
}] as const;

// In-memory cache
let cachedResult: Record<string, any> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000; // 30 seconds for native data

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10_000);
            const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
            clearTimeout(timeout);
            if (res.ok) return res;
        } catch (err) {
            console.error(`Fetch attempt ${i + 1} failed:`, err);
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 800 * (i + 1)));
        }
    }
    throw new Error('All retry attempts failed');
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug') === 'true';
    const now = Date.now();

    if (cachedResult && now - cacheTimestamp < CACHE_TTL) {
        return NextResponse.json({ success: true, data: cachedResult, cached: true });
    }

    try {
        const client = createPublicClient({ chain: baseSepolia, transport: http() });

        // 1. Fetch DefiLlama data for broader context
        const res = await fetchWithRetry('https://yields.llama.fi/pools');
        const { data }: { data: DefiLlamaPool[] } = await res.json();

        // 2. Fetch Live Aave V3 Data from Base Sepolia Protocol Data Provider
        const aaveDataResults: any = await client.readContract({
            address: AAVE_DATA_PROVIDER_ADDRESS,
            abi: DATA_PROVIDER_ABI,
            functionName: 'getReserveData',
            args: [USDC_ADDR as `0x${string}`],
        });

        // 0: unbacked, 1: accruedToTreasuryScaled, 2: totalAToken, 3: totalStableDebt, 4: totalVariableDebt, 5: liquidityRate...
        const RAY = BigInt("1000000000000000000000000000"); // 10^27
        const liquidityRate = BigInt(aaveDataResults[5]);
        const liveAaveApy = (Number(liquidityRate) / Number(RAY)) * 100;

        const totalDebt = BigInt(aaveDataResults[3]) + BigInt(aaveDataResults[4]);
        const totalLiquidity = BigInt(aaveDataResults[2]);
        const utilization = totalLiquidity > 0n
            ? (Number(totalDebt) / Number(totalLiquidity)) * 100
            : 0;

        const result: Record<string, any> = {
            aaveV3Health: {
                liveApy: liveAaveApy,
                utilization: utilization,
                totalLiquidity: formatUnits(totalLiquidity, 6), // Base Sepolia USDC has 6 decimals
                totalDebt: formatUnits(totalDebt, 6),
                timestamp: now
            }
        };


        for (const target of TARGETS) {
            let matches = data.filter((p) => {
                const projectMatch = p.project.toLowerCase().includes(target.project.toLowerCase());
                const chainMatch = p.chain === target.chain;
                const symbolMatch = !target.symbol || p.symbol === target.symbol;
                return projectMatch && chainMatch && symbolMatch;
            });

            if (target.name === 'Aerodrome eth') {
                matches = data.filter(p => p.chain === 'Base' && p.project === 'aerodrome' && p.symbol.includes('ETH'))
                    .sort((a, b) => b.tvlUsd - a.tvlUsd);
            }

            result[target.name] = { ...matches[0] };
        }

        cachedResult = result;
        cacheTimestamp = now;

        return NextResponse.json({ success: true, data: result, cached: false });
    } catch (error) {
        console.error('Omni analytics failed:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}


import { NextResponse } from 'next/server';

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

// In-memory cache (shared across requests in the same server instance)
let cachedResult: Record<string, any> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 60 seconds

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10_000);

            const res = await fetch(url, {
                cache: 'no-store',           // CRITICAL: disables the 2MB Data Cache
                signal: controller.signal,
            });

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

    // Return cached result if fresh
    if (cachedResult && now - cacheTimestamp < CACHE_TTL) {
        return NextResponse.json({
            success: true,
            timestamp: new Date(cacheTimestamp).toISOString(),
            data: cachedResult,
            cached: true,
            note: 'Served from in-memory cache (17 MB fetch happens only every 60s)',
        });
    }

    try {
        const res = await fetchWithRetry('https://yields.llama.fi/pools');
        const { data }: { data: DefiLlamaPool[] } = await res.json();

        const result: Record<string, any> = {};

        for (const target of TARGETS) {
            let matches = data.filter((p) => {
                const projectMatch = p.project.toLowerCase().includes(target.project.toLowerCase());
                const chainMatch = p.chain === target.chain;
                const symbolMatch = !target.symbol || p.symbol === target.symbol;
                const excludeMatch = target.exclude
                    ? !target.exclude.some((ex) => p.symbol.toUpperCase().includes(ex))
                    : true;
                return projectMatch && chainMatch && symbolMatch && excludeMatch;
            });

            if (target.name === 'Aerodrome eth') {
                matches = data
                    .filter((p) =>
                        p.chain === 'Base' &&
                        p.project.toLowerCase().includes('aerodrome') &&
                        (p.symbol.includes('ETH') || p.symbol.includes('WETH'))
                    )
                    .sort((a, b) => b.tvlUsd - a.tvlUsd);
            }

            result[target.name] = {
                ...matches[0],
                alternatives: debug ? matches.slice(0, 3) : undefined,
            };
        }

        // Store filtered result (tiny ~2 KB) in memory
        cachedResult = result;
        cacheTimestamp = now;

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: result,
            cached: false,
            note: 'Fresh data 17 MB fetch skipped on next requests',
        });
    } catch (error) {
        console.error('Omni analytics failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

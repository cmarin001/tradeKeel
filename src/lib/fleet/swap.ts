import { createServerFn } from "@tanstack/react-start";

const SOL = "So11111111111111111111111111111111111111112";
const MINT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const AMOUNT = /^\d+$/;
const MIN_SOL = 5_000_000n;
const MAX_SOL = 5_000_000_000n;

type JupiterToken = {
  id?: string;
  symbol?: string;
  organicScore?: number;
  organicScoreLabel?: string;
  isVerified?: boolean;
  holderCount?: number;
  liquidity?: number;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  tags?: string[];
  audit?: { topHoldersPercentage?: number };
  stats5m?: { priceChange?: number };
};

let boardCache: { at: number; mints: string[] } = { at: 0, mints: [] };

function junkReason(row: JupiterToken): string | null {
  if (!row.id || row.id === SOL) return "not a tradable token";
  const score = Number(row.organicScore) || 0;
  const tags = row.tags ?? [];
  if (row.organicScoreLabel === "low" || score < 60) return "low organic score";
  if (!row.isVerified && score < 75) return "not verified";
  if (tags.includes("unknown") && !row.isVerified) return "unverified launch";
  if ((row.holderCount ?? 0) < 2_000) return "too few holders";
  if ((row.liquidity ?? 0) < 100_000) return "thin book";
  if (row.mintAuthority) return "mint authority live";
  if (row.freezeAuthority) return "freeze live";
  const top = row.audit?.topHoldersPercentage;
  if (typeof top === "number" && top > 40) return "holders concentrated";
  const change = row.stats5m?.priceChange;
  if (typeof change === "number" && change <= -4) return "already falling";
  return null;
}

async function jupiterList(path: string): Promise<JupiterToken[]> {
  const response = await fetch(`https://lite-api.jup.ag/tokens/v2/${path}?limit=40`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(String(response.status));
  const payload = (await response.json()) as JupiterToken[];
  return Array.isArray(payload) ? payload : [];
}

export const phantomBoard = createServerFn({ method: "POST" }).handler(async (): Promise<{ mints: string[] }> => {
  if (boardCache.mints.length > 0 && Date.now() - boardCache.at < 45_000) return { mints: boardCache.mints };
  const [trending, organic] = await Promise.all([jupiterList("toptrending/1h"), jupiterList("toporganicscore/1h")]);
  const mints: string[] = [];
  for (const row of [...trending, ...organic]) {
    if (!row.id || mints.includes(row.id)) continue;
    if (junkReason(row)) continue;
    mints.push(row.id);
  }
  boardCache = { at: Date.now(), mints };
  return { mints };
});

function impactBps(raw: unknown): number {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n <= 0) return 0;
  const pct = n < 1 ? n * 100 : n;
  return Math.round(pct * 100);
}

let cachedSolPrice = 0;
let cachedSolAt = 0;

async function readPrice(url: string, pick: (body: unknown) => number): Promise<number> {
  const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(String(response.status));
  const price = pick(await response.json());
  if (!Number.isFinite(price) || price <= 0) throw new Error("bad price");
  return price;
}

export const solPriceUsd = createServerFn({ method: "POST" }).handler(async (): Promise<number> => {
  const sources = [
    () => readPrice("https://api.coinbase.com/v2/prices/SOL-USD/spot", (body) => Number((body as { data?: { amount?: string } }).data?.amount)),
    () => readPrice("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd", (body) => Number((body as { solana?: { usd?: number } }).solana?.usd)),
    () =>
      readPrice("https://api.kraken.com/0/public/Ticker?pair=SOLUSD", (body) => {
        const row = (body as { result?: { SOLUSD?: { c?: string[] } } }).result?.SOLUSD?.c?.[0];
        return Number(row);
      }),
  ];
  for (const source of sources) {
    try {
      const price = await source();
      cachedSolPrice = price;
      cachedSolAt = Date.now();
      return price;
    } catch {
      /* try the next source */
    }
  }
  if (cachedSolPrice > 0 && Date.now() - cachedSolAt < 10 * 60 * 1000) return cachedSolPrice;
  throw new Error("SOL price did not answer.");
});

export const buildSwap = createServerFn({ method: "POST" })
  .validator(
    (
      input:
        | { owner?: string; inputMint?: string; outputMint?: string; amount?: string; slippageBps?: number }
        | undefined,
    ) => {
      const owner = input?.owner ?? "";
      const inputMint = input?.inputMint ?? "";
      const outputMint = input?.outputMint ?? "";
      const amount = input?.amount ?? "";
      const slippageBps = Math.floor(Number(input?.slippageBps));
      if (!MINT.test(owner)) throw new Error("Bot wallet is missing.");
      if (!MINT.test(inputMint) || !MINT.test(outputMint) || inputMint === outputMint) throw new Error("Bad swap pair.");
      if (!AMOUNT.test(amount)) throw new Error("Bad swap amount.");
      if (!Number.isFinite(slippageBps) || slippageBps < 50 || slippageBps > 300) throw new Error("Slippage out of range.");
      if (inputMint === SOL) {
        const lamports = BigInt(amount);
        if (lamports < MIN_SOL || lamports > MAX_SOL) throw new Error("Sizer size is outside 0.005–5 SOL.");
      }
      return { owner, inputMint, outputMint, amount, slippageBps };
    },
  )
  .handler(async ({ data }) => {
    const quoteUrl = new URL("https://lite-api.jup.ag/swap/v1/quote");
    quoteUrl.searchParams.set("inputMint", data.inputMint);
    quoteUrl.searchParams.set("outputMint", data.outputMint);
    quoteUrl.searchParams.set("amount", data.amount);
    quoteUrl.searchParams.set("slippageBps", String(data.slippageBps));
    const quoteRes = await fetch(quoteUrl, { signal: AbortSignal.timeout(12_000) });
    if (!quoteRes.ok) throw new Error("No Jupiter route for this token.");
    const quote = (await quoteRes.json()) as { outAmount?: string; priceImpactPct?: string };
    if (!quote.outAmount) throw new Error("No Jupiter route for this token.");
    const impact = impactBps(quote.priceImpactPct);
    if (impact > data.slippageBps) {
      return { aborted: true as const, outAmount: quote.outAmount, impactBps: impact, swapTransaction: null };
    }
    const swapRes = await fetch("https://lite-api.jup.ag/swap/v1/swap", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: data.owner,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!swapRes.ok) throw new Error("Jupiter could not build the swap.");
    const swap = (await swapRes.json()) as { swapTransaction?: string };
    if (!swap.swapTransaction) throw new Error("Jupiter could not build the swap.");
    return { aborted: false as const, swapTransaction: swap.swapTransaction, outAmount: quote.outAmount, impactBps: impact };
  });

export const tokenMarks = createServerFn({ method: "POST" })
  .validator((input: { mints?: string[] } | undefined) => ({
    mints: (input?.mints ?? []).filter((mint) => MINT.test(mint)).slice(0, 20),
  }))
  .handler(async ({ data }): Promise<{ marks: { mint: string; symbol: string; price: number }[] }> => {
    if (data.mints.length === 0) return { marks: [] };
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${data.mints.join(",")}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Token prices did not answer.");
    const payload = (await response.json()) as {
      pairs?: { baseToken?: { address?: string; symbol?: string }; priceUsd?: string; liquidity?: { usd?: number } }[];
    };
    const best = new Map<string, { symbol: string; price: number; liq: number }>();
    for (const pair of payload.pairs ?? []) {
      const mint = pair.baseToken?.address ?? "";
      const price = Number(pair.priceUsd);
      const liq = Number(pair.liquidity?.usd ?? 0);
      if (!data.mints.includes(mint) || !Number.isFinite(price) || price <= 0) continue;
      const prev = best.get(mint);
      if (!prev || liq > prev.liq) best.set(mint, { symbol: pair.baseToken?.symbol || mint.slice(0, 4), price, liq });
    }
    return { marks: [...best].map(([mint, row]) => ({ mint, symbol: row.symbol, price: row.price })) };
  });

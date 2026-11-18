import { createServerFn } from "@tanstack/react-start";
import { SCANNER_FLOORS, hashString, type Chain, type RugOut, type Trigger } from "./engine";
import { clamp, round } from "./format";
import { rugFromBase, rugFromSolana, type BaseReport, type SolanaReport } from "./security";

export type MarketRow = {
  runId: string;
  symbol: string;
  name: string;
  chain: Chain;
  token: string;
  pair: string;
  pairAddress: string;
  price: number;
  liquidityUsd: number;
  vol1hUsd: number;
  ageSec: number;
  trigger: Trigger;
  rankScore: number;
  volatility: number;
  url: string;
  rug: RugOut | null;
};

export type MarketPull = {
  scannedAt: number;
  rows: MarketRow[];
  marks: { token: string; price: number }[];
  note: string | null;
};

type RawPool = {
  chain: Chain;
  symbol: string;
  name: string;
  token: string;
  pairAddress: string;
  pair: string;
  price: number;
  liquidityUsd: number;
  vol1hUsd: number;
  ageSec: number;
  createdAt: number;
  changePct: number;
};

const POOL_TTL = 20_000;
const RUG_TTL = 15 * 60_000;
const poolCache = new Map<string, { at: number; rows: RawPool[] }>();
const rugCache = new Map<string, { at: number; rug: RugOut }>();

function rankOf(liq: number, vol: number, trigger: Trigger): number {
  const turnover = vol / Math.max(liq, 1);
  return round(clamp(turnover * 18 + Math.log10(liq) * 9 + (trigger === "new_pair" ? 6 : 0), 1, 99), 1);
}

function cleanList(list: string[] | undefined, chain: Chain): string[] {
  const out: string[] = [];
  for (const item of list ?? []) {
    if (typeof item !== "string") continue;
    if (chain === "solana" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(item)) out.push(item);
    if (chain === "base" && /^0x[a-fA-F0-9]{40}$/.test(item)) out.push(item.toLowerCase());
    if (out.length >= 25) break;
  }
  return out;
}

async function getJson(url: string, ms = 8000): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: "application/json;version=20230302", "user-agent": "KeelFleet/1.0" },
    signal: AbortSignal.timeout(ms),
  });
  if (!response.ok) throw new Error(`${response.status}`);
  return response.json();
}

function num(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function mapPool(chain: Chain, pool: unknown): RawPool | null {
  if (!pool || typeof pool !== "object") return null;
  const row = pool as {
    attributes?: Record<string, unknown>;
    relationships?: { base_token?: { data?: { id?: string } } };
  };
  const attr = row.attributes ?? {};
  const id = row.relationships?.base_token?.data?.id ?? "";
  const token = id.includes("_") ? id.slice(id.indexOf("_") + 1) : "";
  const name = String(attr.name ?? "");
  const created = Date.parse(String(attr.pool_created_at ?? ""));
  const vol = attr.volume_usd as { h1?: string } | undefined;
  const change = attr.price_change_percentage as { h1?: string } | undefined;
  if (!token || !Number.isFinite(created)) return null;
  const symbol = (name.split("/")[0] ?? "").trim().slice(0, 12) || "TOKEN";
  const price = num(attr.base_token_price_usd);
  const liquidityUsd = num(attr.reserve_in_usd);
  const vol1hUsd = num(vol?.h1);
  if (price <= 0 || liquidityUsd < SCANNER_FLOORS.minLiquidity || vol1hUsd < SCANNER_FLOORS.minVol1h) return null;
  const ageSec = Math.max(0, Math.round((Date.now() - created) / 1000));
  if (ageSec < SCANNER_FLOORS.minAgeSec) return null;
  return {
    chain,
    symbol,
    name: name || symbol,
    token,
    pairAddress: String(attr.address ?? ""),
    pair: name || `${symbol}/${chain === "solana" ? "SOL" : "WETH"}`,
    price,
    liquidityUsd,
    vol1hUsd,
    ageSec,
    createdAt: created,
    changePct: Math.abs(num(change?.h1)) / 100,
  };
}

async function loadChain(chain: Chain): Promise<RawPool[]> {
  const hit = poolCache.get(chain);
  if (hit && Date.now() - hit.at < POOL_TTL) return hit.rows;
  const network = chain;
  const [trending, fresh] = await Promise.all([
    getJson(`https://api.geckoterminal.com/api/v2/networks/${network}/trending_pools?page=1`),
    getJson(`https://api.geckoterminal.com/api/v2/networks/${network}/new_pools?page=1`).catch(() => ({ data: [] })),
  ]);
  const bags = [trending, fresh].flatMap((payload) => {
    const data = (payload as { data?: unknown[] }).data;
    return Array.isArray(data) ? data : [];
  });
  const byToken = new Map<string, RawPool>();
  for (const pool of bags) {
    const mapped = mapPool(chain, pool);
    if (!mapped) continue;
    const prev = byToken.get(mapped.token);
    if (!prev || mapped.liquidityUsd > prev.liquidityUsd) byToken.set(mapped.token, mapped);
  }
  const rows = [...byToken.values()];
  poolCache.set(chain, { at: Date.now(), rows });
  return rows;
}

function toRow(pool: RawPool, rug: RugOut | null): MarketRow {
  const trigger: Trigger =
    pool.ageSec < 7200 ? "new_pair" : pool.vol1hUsd / pool.liquidityUsd >= 0.35 ? "vol_spike" : "liq_spike";
  const swing = pool.changePct;
  const volatility = round(clamp(swing > 0 ? swing : 0.4, 0.28, 1.2), 3);
  return {
    runId: hashString(pool.token).toString(16).padStart(8, "0").slice(0, 8),
    symbol: pool.symbol,
    name: pool.name,
    chain: pool.chain,
    token: pool.token,
    pair: pool.pair,
    pairAddress: pool.pairAddress,
    price: pool.price,
    liquidityUsd: Math.round(pool.liquidityUsd),
    vol1hUsd: Math.round(pool.vol1hUsd),
    ageSec: pool.ageSec,
    trigger,
    rankScore: rankOf(pool.liquidityUsd, pool.vol1hUsd, trigger),
    volatility,
    url: `https://dexscreener.com/${pool.chain}/${pool.pairAddress || pool.token}`,
    rug,
  };
}

async function rugSolana(pools: RawPool[]): Promise<void> {
  const due = pools.filter((pool) => {
    const hit = rugCache.get(pool.token);
    return !hit || Date.now() - hit.at > RUG_TTL;
  }).slice(0, 6);
  await Promise.all(
    due.map(async (pool) => {
      try {
        const report = (await getJson(
          `https://api.rugcheck.xyz/v1/tokens/${pool.token}/report`,
          12000,
        )) as SolanaReport;
        const rug = rugFromSolana(report, {
          token: pool.token,
          runId: hashString(pool.token).toString(16).padStart(8, "0").slice(0, 8),
          ageSec: pool.ageSec,
        });
        rugCache.set(pool.token, { at: Date.now(), rug });
      } catch {
        /* leave unchecked; the next pass retries */
      }
    }),
  );
}

async function rugBase(pools: RawPool[]): Promise<string | null> {
  const due = pools.filter((pool) => {
    const hit = rugCache.get(pool.token);
    return !hit || Date.now() - hit.at > RUG_TTL;
  });
  if (due.length === 0) return null;
  const addresses = due.map((pool) => pool.token).join(",");
  try {
    const payload = (await getJson(
      `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${addresses}`,
      12000,
    )) as { code?: number; result?: Record<string, BaseReport> };
    if (payload.code === 4029) return "Base security feed is busy. Those contracts stay unchecked.";
    const result = payload.result ?? {};
    for (const pool of due) {
      const report = result[pool.token] ?? result[pool.token.toLowerCase()];
      if (!report) continue;
      rugCache.set(pool.token, {
        at: Date.now(),
        rug: rugFromBase(report, {
          token: pool.token,
          runId: hashString(pool.token).toString(16).padStart(8, "0").slice(0, 8),
          ageSec: pool.ageSec,
        }),
      });
    }
    return null;
  } catch {
    return "Base security feed did not answer. Those contracts stay unchecked.";
  }
}

async function markPrices(chain: Chain, tokens: string[]): Promise<{ token: string; price: number }[]> {
  if (tokens.length === 0) return [];
  try {
    const payload = (await getJson(
      `https://api.geckoterminal.com/api/v2/simple/networks/${chain}/token_price/${tokens.join("%2C")}`,
    )) as { data?: { attributes?: { token_prices?: Record<string, string> } } };
    const prices = payload.data?.attributes?.token_prices ?? {};
    return tokens.flatMap((token) => {
      const price = num(prices[token] ?? prices[token.toLowerCase()]);
      return price > 0 ? [{ token, price }] : [];
    });
  } catch {
    return [];
  }
}

export const pullMarkets = createServerFn({ method: "POST" })
  .validator((input: { solana?: string[]; base?: string[] } | undefined) => ({
    solana: cleanList(input?.solana, "solana"),
    base: cleanList(input?.base, "base"),
  }))
  .handler(async ({ data }): Promise<MarketPull> => {
    const [solana, base] = await Promise.all([loadChain("solana"), loadChain("base")]);
    const ranked = [...solana, ...base].sort((a, b) => {
      const av = a.vol1hUsd / a.liquidityUsd;
      const bv = b.vol1hUsd / b.liquidityUsd;
      return bv - av;
    });
    const seen = new Set<string>();
    const picked: RawPool[] = [];
    for (const pool of ranked) {
      if (seen.has(pool.token)) continue;
      seen.add(pool.token);
      picked.push(pool);
      if (picked.length >= 20) break;
    }
    const rows = picked
      .map((pool) => toRow(pool, rugCache.get(pool.token)?.rug ?? null))
      .sort((a, b) => b.rankScore - a.rankScore);
    const heldSol = data.solana.filter((token) => !rows.some((row) => row.token === token));
    const heldBase = data.base.filter((token) => !rows.some((row) => row.token === token));
    const [solMarks, baseMarks] = await Promise.all([markPrices("solana", heldSol), markPrices("base", heldBase)]);
    const marks = [
      ...rows.map((row) => ({ token: row.token, price: row.price })),
      ...solMarks,
      ...baseMarks,
    ];
    const pending = rows.filter((row) => !row.rug).length;
    const note = pending > 0 ? `Rug check still owes ${pending} contract${pending === 1 ? "" : "s"}. They are not sized yet.` : null;
    return { scannedAt: Date.now(), rows, marks, note };
  });

export const checkSecurity = createServerFn({ method: "POST" })
  .validator((input: { tokens?: { token?: string; chain?: string; ageSec?: number }[] } | undefined) => {
    const tokens = (input?.tokens ?? []).slice(0, 6).flatMap((item) => {
      const token = item.token ?? "";
      const chain = item.chain === "base" ? "base" : item.chain === "solana" ? "solana" : null;
      const ageSec = Number(item.ageSec);
      if (!chain || !Number.isFinite(ageSec)) return [];
      if (chain === "solana" && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(token)) return [];
      if (chain === "base" && !/^0x[a-fA-F0-9]{40}$/.test(token)) return [];
      return [{ token: chain === "base" ? token.toLowerCase() : token, chain, ageSec }];
    });
    return { tokens };
  })
  .handler(async ({ data }): Promise<{ rugs: { token: string; rug: RugOut }[]; note: string | null }> => {
    const solana = data.tokens.filter((item) => item.chain === "solana").map((item) => ({
      chain: "solana" as const,
      token: item.token,
      ageSec: item.ageSec,
      symbol: "",
      name: "",
      pairAddress: "",
      pair: "",
      price: 0,
      liquidityUsd: 0,
      vol1hUsd: 0,
      createdAt: 0,
      changePct: 0,
    }));
    const base = data.tokens.filter((item) => item.chain === "base").map((item) => ({
      chain: "base" as const,
      token: item.token,
      ageSec: item.ageSec,
      symbol: "",
      name: "",
      pairAddress: "",
      pair: "",
      price: 0,
      liquidityUsd: 0,
      vol1hUsd: 0,
      createdAt: 0,
      changePct: 0,
    }));
    const [baseNote] = await Promise.all([rugBase(base), rugSolana(solana)]);
    const rugs = data.tokens.flatMap((item) => {
      const hit = rugCache.get(item.token);
      return hit ? [{ token: item.token, rug: hit.rug }] : [];
    });
    return { rugs, note: baseNote };
  });

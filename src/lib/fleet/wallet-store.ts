import { create } from "zustand";
import { PublicKey, type Keypair } from "@solana/web3.js";
import { confirmSignature, BOT_ADDRESS, listHeld, loadBotKey, signAndSend, solLamports, type Held } from "./hot-wallet";
import { phantomBoard, solPriceUsd, tokenMarks } from "./swap";
import {
  sizeFor,
  takePctFor,
  type Params,
  type TokenFacts,
} from "./engine";
import type { LiveRun } from "./live-book";

const SOL = "So11111111111111111111111111111111111111112";
const STATE = "keel-auto-v1";
const RESERVE = 20_000_000;
const HOLD_MS = 12 * 60 * 1000;
const TRAIL = 0.05;
const FLOOR = 0.94;

function trailStop(mark: number, high: number, price: number): { highPx: number; stopPx: number } {
  const highPx = Math.max(mark, high, price);
  return { highPx, stopPx: Math.max(mark * FLOOR, highPx * (1 - TRAIL)) };
}

export type AutoFill = {
  id: string;
  mint: string;
  symbol: string;
  action: "entry" | "exit";
  status: "sent" | "confirmed" | "failed" | "aborted";
  signature: string | null;
  sol: number;
  reason: string;
  at: number;
};

type OpenPos = {
  mint: string;
  symbol: string;
  runId: string;
  entryLamports: number;
  tokenRaw: string;
  entryPx: number;
  highPx: number;
  stopPx: number;
  takePx: number;
  deadline: number;
  slippageBps: number;
};

type SavedBag = { mint: string; symbol: string; markPx: number; highPx: number };

export type LiveBag = SavedBag & { ui: number; price: number | null; stopPx: number };

type Saved = { running: boolean; peak: number; fills: AutoFill[]; positions: OpenPos[]; done: string[]; bags: SavedBag[] };

type WalletState = {
  pubkey: string | null;
  sol: number | null;
  solPrice: number | null;
  running: boolean;
  busy: boolean;
  error: string | null;
  notice: string | null;
  fills: AutoFill[];
  positions: OpenPos[];
  bags: LiveBag[];
  boot: () => void;
  refresh: () => Promise<void>;
  setRunning: (running: boolean) => void;
  tick: (book: { runs: LiveRun[]; quotes: Record<string, number>; params: Params }) => Promise<void>;
};

function read(): Saved {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATE) ?? "") as Saved;
    return {
      running: parsed.running !== false,
      peak: Number(parsed.peak) || 0,
      fills: Array.isArray(parsed.fills) ? parsed.fills.slice(0, 16) : [],
      positions: Array.isArray(parsed.positions) ? parsed.positions : [],
      done: Array.isArray(parsed.done) ? parsed.done : [],
      bags: Array.isArray(parsed.bags)
        ? parsed.bags.flatMap((bag) => {
            if (!bag || typeof bag.mint !== "string" || !(bag.markPx > 0)) return [];
            const highPx = bag.highPx > 0 ? bag.highPx : bag.markPx;
            return [{ mint: bag.mint, symbol: bag.symbol || bag.mint.slice(0, 4), markPx: bag.markPx, highPx }];
          })
        : [],
    };
  } catch {
    return { running: true, peak: 0, fills: [], positions: [], done: [], bags: [] };
  }
}

function write(state: Saved): void {
  try {
    localStorage.setItem(STATE, JSON.stringify(state));
  } catch {
    /* ledger is local only */
  }
}

let saved = typeof localStorage === "undefined" ? { running: true, peak: 0, fills: [], positions: [], done: [], bags: [] } : read();

function persist(patch: Partial<Saved>): void {
  saved = { ...saved, ...patch };
  write(saved);
}

function pushFill(fill: AutoFill): void {
  saved = { ...saved, fills: [fill, ...saved.fills].slice(0, 16) };
  write(saved);
  useWallet.setState({ fills: saved.fills });
}

let stepping = false;

async function watchBags(owner: PublicKey, quotes: Record<string, number>): Promise<{ held: Held[] | null; marks: Map<string, { symbol: string; price: number }> }> {
  let held: Held[] | null = null;
  try {
    held = await listHeld(owner);
  } catch {
    held = null;
  }
  const marks = new Map<string, { symbol: string; price: number }>();
  if (held && held.length > 0) {
    try {
      const quoted = await tokenMarks({ data: { mints: held.map((item) => item.mint) } });
      for (const mark of quoted.marks) marks.set(mark.mint, { symbol: mark.symbol, price: mark.price });
    } catch {
      /* a missing price holds the bag */
    }
  }
  for (const [mint, px] of Object.entries(quotes)) {
    if (px > 0 && !marks.has(mint)) marks.set(mint, { symbol: marks.get(mint)?.symbol || mint.slice(0, 4), price: px });
  }
  const next: SavedBag[] = [];
  const live: LiveBag[] = [];
  if (!held) {
    for (const bag of saved.bags) {
      const price = marks.get(bag.mint)?.price ?? null;
      const stop = trailStop(bag.markPx, bag.highPx, price ?? bag.highPx);
      live.push({ ...bag, highPx: stop.highPx, ui: 0, price, stopPx: stop.stopPx });
    }
    useWallet.setState({ bags: live });
    return { held, marks };
  }
  for (const item of held) {
    const quote = marks.get(item.mint);
    const prior = saved.bags.find((bag) => bag.mint === item.mint);
    const markPx = prior?.markPx && prior.markPx > 0 ? prior.markPx : quote?.price ?? 0;
    if (markPx <= 0) continue;
    const stop = trailStop(markPx, prior?.highPx ?? markPx, quote?.price ?? prior?.highPx ?? markPx);
    const bag = { mint: item.mint, symbol: quote?.symbol || prior?.symbol || item.mint.slice(0, 4), markPx, highPx: stop.highPx };
    next.push(bag);
    live.push({ ...bag, ui: item.ui, price: quote?.price ?? null, stopPx: stop.stopPx });
  }
  persist({ bags: next });
  useWallet.setState({ bags: live });
  return { held, marks };
}

async function sellBags(
  key: Keypair,
  watched: { held: Held[] | null; marks: Map<string, { symbol: string; price: number }> },
  busyMints: Set<string>,
): Promise<void> {
  if (!watched.held) return;
  for (const item of watched.held) {
    if (busyMints.has(item.mint)) continue;
    const bag = saved.bags.find((row) => row.mint === item.mint);
    const quote = watched.marks.get(item.mint);
    if (!bag || !quote) continue;
    const stop = trailStop(bag.markPx, bag.highPx, quote.price);
    if (quote.price > stop.stopPx) continue;
    if (item.ui * quote.price < 1) continue;
    const recent = saved.fills.find((fill) => fill.mint === item.mint && fill.action === "exit" && fill.status === "aborted" && Date.now() - fill.at < 120_000);
    if (recent) continue;
    const sold = await signAndSend({
      signer: key,
      inputMint: item.mint,
      outputMint: SOL,
      amount: item.raw,
      slippageBps: 150,
    });
    pushFill({
      id: `${item.mint}:bag:${Date.now()}`,
      mint: item.mint,
      symbol: bag.symbol,
      action: "exit",
      status: sold.aborted ? "aborted" : "sent",
      signature: sold.signature,
      sol: 0,
      reason: sold.aborted ? `bag exit aborted · impact ${sold.impactBps} bps over max` : "sold · trailing stop, 5% under the high",
      at: Date.now(),
    });
    if (sold.signature) {
      void watch(sold.signature);
      persist({ bags: saved.bags.filter((row) => row.mint !== item.mint) });
      useWallet.setState({ bags: useWallet.getState().bags.filter((row) => row.mint !== item.mint) });
    }
  }
}

export const useWallet = create<WalletState>((set, get) => ({
  pubkey: null,
  sol: null,
  solPrice: null,
  running: saved.running,
  busy: false,
  error: null,
  notice: null,
  fills: saved.fills,
  positions: saved.positions,
  bags: saved.bags.map((bag) => ({ ...bag, ui: 0, price: null, stopPx: trailStop(bag.markPx, bag.highPx, bag.highPx).stopPx })),
  boot: () => {
    set({ pubkey: BOT_ADDRESS });
    void get().refresh();
  },
  refresh: async () => {
    try {
      const [lamports, price] = await Promise.all([solLamports(new PublicKey(BOT_ADDRESS)), solPriceUsd()]);
      const sol = lamports / 1_000_000_000;
      set({
        pubkey: BOT_ADDRESS,
        sol,
        solPrice: price,
        notice: loadBotKey() ? null : "This browser does not hold the key for that wallet, so it can watch the balance but cannot sign.",
      });
    } catch (error) {
      set({ pubkey: BOT_ADDRESS, error: error instanceof Error ? error.message : "Wallet lookup failed." });
    }
  },
  setRunning: (running) => {
    persist({ running });
    set({ running, notice: running ? "Executor is on. No approval popup." : "Entries halted. Open risk can still be sold." });
  },
  tick: async (book) => {
    if (stepping) return;
    stepping = true;
    set({ busy: true, error: null });
    try {
      await step(book);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Executor stopped on an error." });
    } finally {
      stepping = false;
      set({ busy: false, positions: saved.positions, fills: saved.fills, bags: useWallet.getState().bags });
    }
  },
}));

async function step(book: { runs: LiveRun[]; quotes: Record<string, number>; params: Params }): Promise<void> {
  const key = loadBotKey();
  const owner = new PublicKey(BOT_ADDRESS);
  const lamports = await solLamports(owner);
  let price = useWallet.getState().solPrice ?? 0;
  try {
    price = await solPriceUsd();
  } catch (error) {
    if (price <= 0) throw error;
  }
  const sol = lamports / 1_000_000_000;
  let tokenUsd = 0;
  for (const position of saved.positions) {
    const px = book.quotes[position.mint];
    if (!px || position.entryPx <= 0) continue;
    tokenUsd += (position.entryLamports / 1_000_000_000) * (px / position.entryPx) * price;
  }
  const equity = sol * price + tokenUsd;
  if (equity > saved.peak) persist({ peak: equity });
  const drawdown = saved.peak > 0 ? (saved.peak - equity) / saved.peak : 0;
  useWallet.setState({ pubkey: BOT_ADDRESS, sol, solPrice: price });
  const watched = await watchBags(owner, book.quotes);
  if (!key) {
    useWallet.setState({ error: "No swap can be signed. This browser does not have the private key." });
    return;
  }

  const still: OpenPos[] = [];
  for (const position of saved.positions) {
    const px = book.quotes[position.mint] ?? watched.marks.get(position.mint)?.price;
    const highPx = Math.max(position.highPx || position.entryPx, px || 0);
    const trailed = px
      ? { ...position, highPx, stopPx: Math.max(position.stopPx, trailStop(position.entryPx, highPx, px).stopPx) }
      : position;
    if (!px || px > trailed.stopPx) {
      still.push(trailed);
      continue;
    }
    if (!watched.held) {
      still.push(position);
      continue;
    }
    const raw = watched.held.find((item) => item.mint === position.mint)?.raw ?? "0";
    if (raw === "0") {
      pushFill({
        id: `${position.runId}:exit-empty`,
        mint: position.mint,
        symbol: position.symbol,
        action: "exit",
        status: "aborted",
        signature: null,
        sol: 0,
        reason: "exit trailing stop · no tokens left in the bot wallet",
        at: Date.now(),
      });
      continue;
    }
    const sold = await signAndSend({
      signer: key,
      inputMint: position.mint,
      outputMint: SOL,
      amount: raw,
      slippageBps: position.slippageBps,
    });
    pushFill({
      id: `${position.runId}:exit`,
      mint: position.mint,
      symbol: position.symbol,
      action: "exit",
      status: sold.aborted ? "aborted" : "sent",
      signature: sold.signature,
      sol: 0,
      reason: sold.aborted ? `exit aborted · impact ${sold.impactBps} bps over max` : "exit trailing stop · signed, no popup",
      at: Date.now(),
    });
    if (sold.signature) void watch(sold.signature);
    if (sold.aborted) still.push(trailed);
  }
  persist({ positions: still });
  await sellBags(key, watched, new Set(still.map((position) => position.mint)));

  if (!saved.running) return;
  let listed: string[] = [];
  try {
    listed = (await phantomBoard()).mints;
  } catch {
    useWallet.setState({ notice: "Phantom's token list did not answer. No new buy this pass." });
    return;
  }
  const revived = saved.done.filter((mint) => {
    const fill = saved.fills.find((item) => item.mint === mint && item.action === "entry");
    return fill?.reason === "slippage eats the risk budget" || Boolean(fill?.reason.includes("below the minimum"));
  });
  if (revived.length) persist({ done: saved.done.filter((mint) => !revived.includes(mint)) });
  for (const next of book.runs) {
    if (next.chain !== "solana" || next.rug?.verdict !== "PASS") continue;
    if (saved.done.includes(next.token) || saved.positions.some((position) => position.mint === next.token)) continue;
    if (!listed.includes(next.token)) {
      const id = `${next.runId}:phantom`;
      if (!saved.fills.some((fill) => fill.id === id)) {
        pushFill({
          id,
          mint: next.token,
          symbol: next.symbol,
          action: "entry",
          status: "aborted",
          signature: null,
          sol: 0,
          reason: "skipped · not on Phantom's trending list, or it failed the quality bar",
          at: Date.now(),
        });
      }
      continue;
    }
    const px = book.quotes[next.token];
    const liquidity = next.scanner.liquidity_usd;
    if (!px || liquidity <= 0) continue;
    const facts: TokenFacts = {
    address: next.token,
    symbol: next.symbol,
    name: next.name,
    chain: "solana",
    price: px,
    liquidityUsd: liquidity,
    vol1hUsd: next.scanner.vol_1h_usd,
    volatility: 0.55,
    ageSec: next.scanner.age_sec,
    renounced: true,
    mintLive: false,
    freeze: false,
    honeypot: false,
    taxBps: 0,
    blacklist: false,
    deployerOk: true,
    lpLocked: true,
    top10: 20,
    path: { phase: 0, driftPerMin: 0, vol: 0.55, shockAt: 1e12, shockMag: 0 },
  };
  const sized = sizeFor(
    facts,
    next.runId,
    { equity, drawdown, volatility: 0.55, liquidity, vol1h: next.scanner.vol_1h_usd, price: px, wave: 0 },
    book.params,
    5,
  );
  const spendLamports = Math.floor((sized.size_usd / price) * 1_000_000_000);
  const affordable = lamports - RESERVE;
  if (sized.size_usd <= 0 || spendLamports < 5_000_000) {
    const id = `${next.runId}:skip`;
    if (!saved.fills.some((fill) => fill.id === id)) {
      pushFill({
        id,
        mint: next.token,
        symbol: next.symbol,
        action: "entry",
        status: "aborted",
        signature: null,
        sol: 0,
        reason: sized.reason,
        at: Date.now(),
      });
    }
    continue;
  }
  if (spendLamports > affordable) {
    const id = `${next.runId}:short`;
    if (!saved.fills.some((fill) => fill.id === id)) {
      pushFill({
        id,
        mint: next.token,
        symbol: next.symbol,
        action: "entry",
        status: "aborted",
        signature: null,
        sol: spendLamports / 1_000_000_000,
        reason: `aborted · sizer wants $${sized.size_usd.toFixed(0)} and the wallet cannot cover it. Not resized.`,
        at: Date.now(),
      });
    }
    continue;
  }
  const slip = Math.min(300, Math.max(50, sized.max_slippage_bps));
  const bought = await signAndSend({
    signer: key,
    inputMint: SOL,
    outputMint: next.token,
    amount: String(spendLamports),
    slippageBps: slip,
  });
  persist({ done: [...saved.done, next.token].slice(-80) });
  if (bought.aborted || !bought.signature) {
    pushFill({
      id: `${next.runId}:abort`,
      mint: next.token,
      symbol: next.symbol,
      action: "entry",
      status: "aborted",
      signature: null,
      sol: spendLamports / 1_000_000_000,
      reason: `aborted pre-send · impact ${bought.impactBps} bps over max ${slip}`,
      at: Date.now(),
    });
    return;
  }
  const take = takePctFor(0.55);
  persist({
    positions: [
      ...saved.positions,
      {
        mint: next.token,
        symbol: next.symbol,
        runId: next.runId,
        tokenRaw: bought.outAmount,
        entryLamports: spendLamports,
        entryPx: px,
        highPx: px,
        stopPx: px * (1 - TRAIL),
        takePx: px * (1 + take),
        deadline: Date.now() + HOLD_MS,
        slippageBps: slip,
      },
    ],
  });
  pushFill({
    id: `${next.runId}:entry`,
    mint: next.token,
    symbol: next.symbol,
    action: "entry",
    status: "sent",
    signature: bought.signature,
    sol: spendLamports / 1_000_000_000,
    reason: sized.reason,
    at: Date.now(),
  });
  void watch(bought.signature);
    return;
  }
}

async function watch(signature: string): Promise<void> {
  for (let i = 0; i < 12; i++) {
    await new Promise((resolve) => window.setTimeout(resolve, 2000));
    const status = await confirmSignature(signature);
    if (status === "pending") continue;
    saved = {
      ...saved,
      fills: saved.fills.map((fill) => (fill.signature === signature ? { ...fill, status } : fill)),
    };
    write(saved);
    useWallet.setState({ fills: saved.fills, notice: status === "confirmed" ? "Confirmed on Solana." : "The transaction failed on Solana." });
    return;
  }
}

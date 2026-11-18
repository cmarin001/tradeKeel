import {
  START_EQUITY,
  estimateSlipBps,
  hashString,
  sizeFor,
  stopPctFor,
  takePctFor,
  type Chain,
  type Counts,
  type ExecOut,
  type FaultOut,
  type LogEvent,
  type Params,
  type RugOut,
  type RunStatus,
  type ScannerOut,
  type SizerOut,
  type TokenFacts,
} from "./engine";
import { formatAge, formatPct, formatUsd, round } from "./format";
import type { MarketPull, MarketRow } from "./markets";

export type LiveRun = {
  runId: string;
  symbol: string;
  name: string;
  token: string;
  chain: Chain;
  status: RunStatus | "pending";
  scanner: ScannerOut;
  rug: RugOut | null;
  sizer: SizerOut | null;
  entry: ExecOut | null;
  exit: ExecOut | null;
  pnl: number | null;
  url: string;
};

export type LivePosition = {
  runId: string;
  token: string;
  symbol: string;
  chain: Chain;
  entryMid: number;
  fillPrice: number;
  sizeUsd: number;
  sizeTokens: number;
  stopPx: number;
  takePx: number;
  deadlineMs: number;
  openedAt: number;
  gasIn: number;
  liquidity: number;
  maxSlippageBps: number;
};

export type LiveClose = {
  runId: string;
  symbol: string;
  chain: Chain;
  pnl: number;
  holdSec: number;
  reason: string;
  ret: number;
};

export type CurvePoint = { t: number; equity: number; mtm: number };

export type Book = {
  equity: number;
  peak: number;
  params: Params;
  runs: LiveRun[];
  logs: LogEvent[];
  positions: LivePosition[];
  closes: LiveClose[];
  curve: CurvePoint[];
  watch: MarketRow[];
  quotes: Record<string, number>;
  noted: Record<string, true>;
  decided: Record<string, true>;
  condemned: Record<string, true>;
  wins: number;
  pnlSum: number;
  closedN: number;
  slipSum: number;
  slipN: number;
  holdSum: number;
  lastPnl: number | null;
  counts: Counts;
};

const HOLD_MS = 12 * 60 * 1000;

export const DEFAULT_PARAMS: Params = {
  maxRiskPct: 0.008,
  maxPoolPct: 0.015,
  ddHaltPct: 0.15,
};

export function blankBook(now = Date.now()): Book {
  return {
    equity: START_EQUITY,
    peak: START_EQUITY,
    params: { ...DEFAULT_PARAMS },
    runs: [],
    logs: [],
    positions: [],
    closes: [],
    curve: [{ t: now, equity: START_EQUITY, mtm: START_EQUITY }],
    watch: [],
    quotes: {},
    noted: {},
    decided: {},
    condemned: {},
    wins: 0,
    pnlSum: 0,
    closedN: 0,
    slipSum: 0,
    slipN: 0,
    holdSum: 0,
    lastPnl: null,
    counts: {
      scanned: 0,
      rugFail: 0,
      rugPass: 0,
      sized: 0,
      sizeZero: 0,
      filled: 0,
      aborted: 0,
      partial: 0,
      closed: 0,
      logged: 0,
    },
  };
}

function gasUsd(chain: Chain): number {
  return chain === "solana" ? 0.08 : 0.62;
}

function scannerOf(row: MarketRow, now: number): ScannerOut {
  return {
    run_id: row.runId,
    token: row.token,
    pair: row.pair,
    chain: row.chain,
    discovered_at: now,
    trigger: row.trigger,
    liquidity_usd: row.liquidityUsd,
    vol_1h_usd: row.vol1hUsd,
    age_sec: row.ageSec,
    rank_score: row.rankScore,
    reason: `${row.trigger.replaceAll("_", " ")} · liq ${formatUsd(row.liquidityUsd, 0)} · 1h ${formatUsd(row.vol1hUsd, 0)} · age ${formatAge(row.ageSec)}`,
  };
}

function factsFor(row: MarketRow): TokenFacts {
  return {
    address: row.token,
    symbol: row.symbol,
    name: row.name,
    chain: row.chain,
    price: row.price,
    liquidityUsd: row.liquidityUsd,
    vol1hUsd: row.vol1hUsd,
    volatility: row.volatility,
    ageSec: row.ageSec,
    renounced: true,
    mintLive: false,
    freeze: false,
    honeypot: false,
    taxBps: 0,
    blacklist: false,
    deployerOk: true,
    lpLocked: true,
    top10: 0,
    path: { phase: 0, driftPerMin: 0, vol: row.volatility, shockAt: 1e12, shockMag: 0 },
  };
}

function log(book: Book, event: LogEvent): void {
  book.logs = [event, ...book.logs].slice(0, 200);
  book.counts = { ...book.counts, logged: book.counts.logged + 1 };
}

export function logDrop(
  input: Book,
  rows: { runId: string; symbol: string; token: string }[],
  reason: string,
  now: number,
): Book {
  const book: Book = { ...input, counts: { ...input.counts }, logs: input.logs };
  for (const row of rows) {
    const id = `${row.runId}:drop`;
    if (book.logs.some((event) => event.id === id)) continue;
    const payload: FaultOut = { run_id: row.runId, token: row.token, agent: "rug", error: reason };
    log(book, {
      id,
      runId: row.runId,
      ts: now,
      agent: "logger",
      symbol: row.symbol,
      token: row.token,
      summary: `dropped · ${reason}`,
      payload,
    });
  }
  return book;
}

function drawdown(book: Book): number {
  if (book.peak <= 0) return 0;
  return (book.peak - book.equity) / book.peak;
}

function upsertRun(book: Book, run: LiveRun): void {
  const idx = book.runs.findIndex((item) => item.runId === run.runId);
  if (idx === -1) book.runs = [run, ...book.runs].slice(0, 80);
  else {
    const next = book.runs.slice();
    next[idx] = run;
    book.runs = next;
  }
}

function markMap(pull: MarketPull): Map<string, number> {
  const marks = new Map<string, number>();
  for (const mark of pull.marks) {
    if (mark.price > 0) marks.set(mark.token, mark.price);
  }
  return marks;
}

function unrealized(position: LivePosition, price: number): number {
  const slip = estimateSlipBps(position.sizeUsd, position.liquidity, 0.4) / 10_000;
  return position.sizeTokens * price * (1 - slip) - position.sizeUsd - position.gasIn - gasUsd(position.chain);
}

export function positionPnl(position: LivePosition, price: number | undefined): number | null {
  if (!price || price <= 0) return null;
  return unrealized(position, price);
}

export function applyPull(input: Book, pull: MarketPull, now: number): Book {
  const book: Book = {
    ...input,
    counts: { ...input.counts },
    noted: { ...input.noted },
    decided: { ...input.decided },
    condemned: { ...input.condemned },
    runs: input.runs.slice(),
    logs: input.logs,
    positions: input.positions.slice(),
    closes: input.closes.slice(),
    watch: pull.rows,
    quotes: { ...input.quotes },
    params: input.params,
  };
  for (const mark of pull.marks) {
    if (mark.price > 0) book.quotes[mark.token] = mark.price;
  }
  const prices = markMap(pull);

  for (const row of pull.rows) {
    if (book.condemned[row.token] || book.positions.some((position) => position.token === row.token)) continue;
    if (!book.noted[row.runId]) {
      const scanner = scannerOf(row, now);
      book.noted[row.runId] = true;
      book.counts.scanned += 1;
      log(book, {
        id: `${row.runId}:scanner`,
        runId: row.runId,
        ts: now,
        agent: "scanner",
        symbol: row.symbol,
        token: row.token,
        summary: scanner.reason,
        payload: scanner,
      });
      upsertRun(book, {
        runId: row.runId,
        symbol: row.symbol,
        name: row.name,
        token: row.token,
        chain: row.chain,
        status: "pending",
        scanner,
        rug: null,
        sizer: null,
        entry: null,
        exit: null,
        pnl: null,
        url: row.url,
      });
    }
    if (!row.rug || book.decided[row.runId]) continue;
    const rug: RugOut = { ...row.rug, run_id: row.runId, token: row.token };
    book.decided[row.runId] = true;
    log(book, {
      id: `${row.runId}:rug`,
      runId: row.runId,
      ts: now,
      agent: "rug",
      symbol: row.symbol,
      token: row.token,
      summary: `${rug.verdict} · ${rug.reason}`,
      payload: rug,
    });
    const existing = book.runs.find((run) => run.runId === row.runId);
    const run: LiveRun = existing
      ? { ...existing, rug, url: row.url }
      : {
          runId: row.runId,
          symbol: row.symbol,
          name: row.name,
          token: row.token,
          chain: row.chain,
          status: "pending",
          scanner: scannerOf(row, now),
          rug,
          sizer: null,
          entry: null,
          exit: null,
          pnl: null,
          url: row.url,
        };
    if (rug.verdict === "FAIL") {
      book.counts.rugFail += 1;
      book.condemned[row.token] = true;
      upsertRun(book, { ...run, status: "fail", rug });
      continue;
    }
    book.counts.rugPass += 1;
    const equity = round(book.equity, 2);
    const sizer = sizeFor(
      factsFor(row),
      row.runId,
      {
        equity,
        drawdown: round(drawdown(book), 4),
        volatility: row.volatility,
        liquidity: row.liquidityUsd,
        vol1h: row.vol1hUsd,
        price: row.price,
        wave: 0,
      },
      book.params,
    );
    log(book, {
      id: `${row.runId}:sizer`,
      runId: row.runId,
      ts: now,
      agent: "sizer",
      symbol: row.symbol,
      token: row.token,
      summary: sizer.reason,
      payload: sizer,
    });
    if (sizer.size_usd <= 0) {
      book.counts.sizeZero += 1;
      upsertRun(book, { ...run, status: "skip", rug, sizer });
      continue;
    }
    book.counts.sized += 1;
    const entry = fillEntry(row, sizer);
    log(book, {
      id: `${row.runId}:entry`,
      runId: row.runId,
      ts: now,
      agent: "executor",
      symbol: row.symbol,
      token: row.token,
      summary: `${entry.action} ${entry.status} · ${entry.reason}`,
      payload: entry,
    });
    if (entry.status === "ABORTED") {
      book.counts.aborted += 1;
      upsertRun(book, { ...run, status: "aborted", rug, sizer, entry });
      continue;
    }
    book.counts.filled += 1;
    book.slipSum += entry.slippage_bps;
    book.slipN += 1;
    const stop = stopPctFor(row.volatility);
    const take = takePctFor(row.volatility);
    book.positions.push({
      runId: row.runId,
      token: row.token,
      symbol: row.symbol,
      chain: row.chain,
      entryMid: row.price,
      fillPrice: entry.fill_price,
      sizeUsd: entry.size_usd,
      sizeTokens: round(entry.size_usd / entry.fill_price, 6),
      stopPx: row.price * (1 - stop),
      takePx: row.price * (1 + take),
      deadlineMs: now + HOLD_MS,
      openedAt: now,
      gasIn: entry.gas_usd,
      liquidity: row.liquidityUsd,
      maxSlippageBps: sizer.max_slippage_bps,
    });
    upsertRun(book, { ...run, status: "open", rug, sizer, entry });
  }

  const still: LivePosition[] = [];
  for (const position of book.positions) {
    const price = prices.get(position.token);
    let trigger: "stop" | "take-profit" | "time" | null = null;
    if (price && price <= position.stopPx) trigger = "stop";
    else if (price && price >= position.takePx) trigger = "take-profit";
    else if (now >= position.deadlineMs) trigger = "time";
    if (!trigger || !price) {
      still.push(position);
      continue;
    }
    closePosition(book, position, price, trigger, now);
  }
  book.positions = still;

  const mtm = round(
    book.equity +
      book.positions.reduce((sum, position) => {
        const price = prices.get(position.token);
        return sum + (price ? unrealized(position, price) : 0);
      }, 0),
    2,
  );
  const curve = book.curve.slice();
  curve.push({ t: now, equity: round(book.equity, 2), mtm });
  book.curve = curve.slice(-180);
  return book;
}

function fillEntry(row: MarketRow, sizer: SizerOut): ExecOut {
  const slip = estimateSlipBps(sizer.size_usd, row.liquidityUsd, row.volatility);
  if (slip > sizer.max_slippage_bps) {
    return {
      run_id: row.runId,
      token: row.token,
      action: "entry",
      status: "ABORTED",
      fill_price: 0,
      size_usd: 0,
      gas_usd: 0,
      slippage_bps: slip,
      tx_hash: "",
      reason: `aborted pre-send · slip ${slip} > max ${sizer.max_slippage_bps}`,
    };
  }
  const fill = round(row.price * (1 + slip / 10_000), 8);
  return {
    run_id: row.runId,
    token: row.token,
    action: "entry",
    status: "FILLED",
    fill_price: fill,
    size_usd: sizer.size_usd,
    gas_usd: round(gasUsd(row.chain), 2),
    slippage_bps: slip,
    tx_hash: `paper_${hashString(row.runId).toString(16).slice(0, 12)}`,
    reason: `paper fill on live price · ${slip} bps`,
  };
}

function closePosition(book: Book, position: LivePosition, price: number, trigger: string, now: number): void {
  const slip = estimateSlipBps(position.sizeUsd, position.liquidity, 0.4);
  const fill = round(price * (1 - slip / 10_000), 8);
  const gasOut = round(gasUsd(position.chain), 2);
  const pnl = round(position.sizeTokens * fill - position.sizeUsd - position.gasIn - gasOut, 2);
  const ret = position.sizeUsd > 0 ? pnl / position.sizeUsd : 0;
  book.equity = round(book.equity + pnl, 2);
  if (book.equity > book.peak) book.peak = book.equity;
  book.pnlSum = round(book.pnlSum + pnl, 2);
  book.closedN += 1;
  book.counts.closed += 1;
  book.holdSum += Math.max(0, (now - position.openedAt) / 1000);
  if (pnl > 0) book.wins += 1;
  book.lastPnl = pnl;
  const exit: ExecOut = {
    run_id: position.runId,
    token: position.token,
    action: "exit",
    status: "FILLED",
    fill_price: fill,
    size_usd: position.sizeUsd,
    gas_usd: gasOut,
    slippage_bps: slip,
    tx_hash: `paper_${hashString(`${position.runId}:exit`).toString(16).slice(0, 12)}`,
    reason: `paper exit · ${trigger} · ${formatPct(ret, 1)}`,
  };
  log(book, {
    id: `${position.runId}:exit`,
    runId: position.runId,
    ts: now,
    agent: "executor",
    symbol: position.symbol,
    token: position.token,
    summary: exit.reason,
    payload: exit,
  });
  log(book, {
    id: `${position.runId}:equity:${now}`,
    runId: position.runId,
    ts: now,
    agent: "equity",
    symbol: position.symbol,
    token: position.token,
    summary: `equity ${formatUsd(book.equity)} · dd ${formatPct(drawdown(book))}`,
    payload: {
      equity_usd: book.equity,
      drawdown_pct: round(drawdown(book), 4),
      win_rate: round(book.closedN ? book.wins / book.closedN : 0, 4),
      expectancy_usd: round(book.closedN ? book.pnlSum / book.closedN : 0, 2),
      trades_closed: book.closedN,
      as_of: now,
    },
  });
  book.closes = [
    { runId: position.runId, symbol: position.symbol, chain: position.chain, pnl, holdSec: (now - position.openedAt) / 1000, reason: trigger, ret },
    ...book.closes,
  ].slice(0, 16);
  const idx = book.runs.findIndex((run) => run.runId === position.runId);
  if (idx >= 0) {
    const next = book.runs.slice();
    next[idx] = { ...next[idx], status: "closed", exit, pnl };
    book.runs = next;
  }
}

export function snapshotOf(book: Book, prices: Map<string, number>) {
  const dd = drawdown(book);
  const openNotional = book.positions.reduce((sum, position) => sum + position.sizeUsd, 0);
  const u = book.positions.reduce((sum, position) => {
    const price = prices.get(position.token);
    return sum + (price ? unrealized(position, price) : 0);
  }, 0);
  return {
    equity: book.equity,
    drawdownPct: dd,
    winRate: book.closedN ? book.wins / book.closedN : 0,
    expectancy: book.closedN ? book.pnlSum / book.closedN : 0,
    tradesClosed: book.closedN,
    avgSlipBps: book.slipN ? book.slipSum / book.slipN : 0,
    avgHoldSec: book.closedN ? book.holdSum / book.closedN : 0,
    mtm: book.equity + u,
    halted: dd >= book.params.ddHaltPct - 1e-9,
    openNotional,
  };
}

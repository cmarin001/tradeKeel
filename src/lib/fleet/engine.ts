import {
  EPOCH,
  clamp,
  formatAge,
  formatPct,
  formatUsd,
  round,
} from "./format";

export const START_EQUITY = 25_000;
export const STEP_SEC = 6;
export const SCAN_GAP_SEC = 18;
export const BOOT_SEC = 480;

const MIN_LIQ = 20_000;
const MIN_AGE = 90;
const MIN_VOL = 12_000;
const RUG_AGE = 180;
const TAX_MAX_BPS = 500;

export type Chain = "solana" | "base";
export type Trigger = "new_pair" | "vol_spike" | "liq_spike";
export type AgentId = "scanner" | "rug" | "sizer" | "executor" | "logger" | "equity";
export type RunStatus = "fail" | "skip" | "aborted" | "open" | "closed";

export type Params = {
  maxRiskPct: number;
  maxPoolPct: number;
  ddHaltPct: number;
};

export type Checks = {
  renounced: boolean;
  mint_auth: boolean;
  freeze_auth: boolean;
  lp_locked_or_burned: boolean;
  honeypot: boolean;
  tax_ok: boolean;
  blacklist: boolean;
  deployer_ok: boolean;
  age_ok: boolean;
  holder_conc_ok: boolean;
};

export type ScannerOut = {
  run_id: string;
  token: string;
  pair: string;
  chain: Chain;
  discovered_at: number;
  trigger: Trigger;
  liquidity_usd: number;
  vol_1h_usd: number;
  age_sec: number;
  rank_score: number;
  reason: string;
};

export type RugOut = {
  run_id: string;
  token: string;
  verdict: "PASS" | "FAIL";
  checks: Checks;
  reason: string;
};

export type SizerOut = {
  run_id: string;
  token: string;
  size_usd: number;
  size_tokens: number;
  max_slippage_bps: number;
  equity_at_decision: number;
  risk_pct_used: number;
  reason: string;
};

export type ExecOut = {
  run_id: string;
  token: string;
  action: "entry" | "exit";
  status: "FILLED" | "ABORTED" | "PARTIAL";
  fill_price: number;
  size_usd: number;
  gas_usd: number;
  slippage_bps: number;
  tx_hash: string;
  reason: string;
};

export type EquityOut = {
  equity_usd: number;
  drawdown_pct: number;
  win_rate: number;
  expectancy_usd: number;
  trades_closed: number;
  as_of: number;
};

export type Path = {
  phase: number;
  driftPerMin: number;
  vol: number;
  shockAt: number;
  shockMag: number;
};

export type TokenFacts = {
  address: string;
  symbol: string;
  name: string;
  chain: Chain;
  price: number;
  liquidityUsd: number;
  vol1hUsd: number;
  volatility: number;
  ageSec: number;
  renounced: boolean;
  mintLive: boolean;
  freeze: boolean;
  honeypot: boolean;
  taxBps: number;
  blacklist: boolean;
  deployerOk: boolean;
  lpLocked: boolean;
  top10: number;
  path: Path;
};

export type DecisionCtx = {
  equity: number;
  drawdown: number;
  volatility: number;
  liquidity: number;
  vol1h: number;
  price: number;
  wave: number;
  params: Params;
};

export type Run = {
  runId: string;
  symbol: string;
  name: string;
  token: string;
  chain: Chain;
  wave: number;
  status: RunStatus;
  scanner: ScannerOut;
  rug: RugOut;
  sizer: SizerOut | null;
  entry: ExecOut | null;
  exit: ExecOut | null;
  pnl: number | null;
  decision: DecisionCtx;
};

export type Position = {
  runId: string;
  token: string;
  symbol: string;
  chain: Chain;
  entryMid: number;
  fillPrice: number;
  sizeUsd: number;
  sizeTokens: number;
  stopMid: number;
  takeMid: number;
  deadlineSec: number;
  openedAtSec: number;
  gasIn: number;
  path: Path;
  liquidity: number;
  maxSlippageBps: number;
};

export type CloseRow = {
  runId: string;
  symbol: string;
  chain: Chain;
  pnl: number;
  holdSec: number;
  reason: string;
  ret: number;
};

export type FaultOut = {
  run_id: string;
  token: string;
  agent: AgentId;
  error: string;
};

export type LogEvent = {
  id: string;
  runId: string;
  ts: number;
  agent: AgentId;
  symbol: string;
  token: string;
  summary: string;
  payload: ScannerOut | RugOut | SizerOut | ExecOut | EquityOut | FaultOut;
};

export type Mark = { t: number; equity: number; mtm: number };

export type Counts = {
  scanned: number;
  rugFail: number;
  rugPass: number;
  sized: number;
  sizeZero: number;
  filled: number;
  aborted: number;
  partial: number;
  closed: number;
  logged: number;
};

export type World = {
  seed: number;
  simSec: number;
  cursor: number;
  params: Params;
  equity: number;
  peak: number;
  pnlSum: number;
  slipSumBps: number;
  slipN: number;
  holdSumSec: number;
  closedN: number;
  wins: number;
  lastPnl: number | null;
  counts: Counts;
  condemned: Record<string, true>;
  runs: Run[];
  logs: LogEvent[];
  positions: Position[];
  recentCloses: CloseRow[];
  marks: Mark[];
  lastHop: { agent: AgentId; symbol: string; detail: string } | null;
};

export type Snapshot = {
  equity: number;
  drawdownPct: number;
  winRate: number;
  expectancy: number;
  tradesClosed: number;
  avgSlipBps: number;
  avgHoldSec: number;
  mtm: number;
  halted: boolean;
  openNotional: number;
};

const ROSTER: [string, string][] = [
  ["BRINE", "Brine"],
  ["KELP", "Kelp"],
  ["WREN", "Wren"],
  ["PULP", "Pulp"],
  ["NERE", "Nereid"],
  ["MOSS", "Moss"],
  ["QUILL", "Quill"],
  ["AXON", "Axon"],
  ["FELD", "Feldspar"],
  ["DRIP", "Drip"],
  ["CROFT", "Croft"],
  ["VANT", "Vant"],
  ["BIRCH", "Birch"],
  ["SABLE", "Sable"],
  ["GULL", "Gull"],
  ["MARL", "Marl"],
  ["CINN", "Cinnabar"],
  ["LOAM", "Loam"],
  ["RILL", "Rill"],
  ["OCHRE", "Ochre"],
  ["FLINT", "Flint"],
  ["COVE", "Cove"],
  ["YARROW", "Yarrow"],
  ["NACRE", "Nacre"],
  ["VEIN", "Vein"],
  ["HUSK", "Husk"],
  ["REEF", "Reef"],
  ["PIO", "Pio"],
  ["THORN", "Thorn"],
  ["SPORE", "Spore"],
  ["ALDER", "Alder"],
  ["KITE", "Kite"],
  ["BORAX", "Borax"],
  ["LARK", "Lark"],
  ["PELT", "Pelt"],
  ["FATHOM", "Fathom"],
];

const CHECK_PRIORITY: (keyof Checks)[] = [
  "honeypot",
  "blacklist",
  "mint_auth",
  "freeze_auth",
  "tax_ok",
  "lp_locked_or_burned",
  "deployer_ok",
  "holder_conc_ok",
  "age_ok",
  "renounced",
];

type Universe = { catalog: TokenFacts[]; tradable: TokenFacts[] };
const universes = new Map<number, Universe>();

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makePath(rand: () => number): Path {
  const roll = rand();
  let shockMag: number;
  if (roll < 0.38) shockMag = -(0.16 + rand() * 0.4);
  else if (roll < 0.55) shockMag = -0.05 + rand() * 0.12;
  else shockMag = 0.22 + rand() * 0.55;
  return {
    phase: rand() * Math.PI * 2,
    driftPerMin: -0.012 + rand() * 0.028,
    vol: 0.35 + rand() * 0.8,
    shockAt: 28 + rand() * 150,
    shockMag,
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function addressFor(chain: Chain, rand: () => number): string {
  if (chain === "base") {
    let hex = "0x";
    const alpha = "0123456789abcdef";
    for (let i = 0; i < 40; i++) hex += alpha[Math.floor(rand() * 16)];
    return hex;
  }
  const alpha = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let s = "";
  for (let i = 0; i < 44; i++) s += alpha[Math.floor(rand() * alpha.length)];
  return s;
}

function buildUniverse(seed: number): Universe {
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const catalog: TokenFacts[] = ROSTER.map(([symbol, name]) => {
    const chain: Chain = rand() < 0.64 ? "solana" : "base";
    const young = rand() < 0.24;
    const ageSec = young ? Math.round(36 + rand() * 740) : Math.round(900 + rand() * 360_000);
    const liquidityUsd = Math.round(9_000 + rand() ** 0.72 * 1_600_000);
    const vol1hUsd = Math.round(liquidityUsd * (0.22 + rand() * 1.8));
    const volatility = round(0.28 + rand() * 0.85, 3);
    const exp = 2 + Math.floor(rand() * 5);
    const price = Number(((0.4 + rand() * 8.5) / 10 ** exp).toPrecision(4));
    const taxBps = rand() < 0.9 ? Math.round(rand() * 420) : Math.round(700 + rand() * 1400);
    return {
      address: addressFor(chain, rand),
      symbol,
      name,
      chain,
      price,
      liquidityUsd,
      vol1hUsd,
      volatility,
      ageSec,
      renounced: rand() < 0.94,
      mintLive: rand() < 0.1,
      freeze: rand() < 0.05,
      honeypot: rand() < 0.08,
      taxBps,
      blacklist: rand() < 0.04,
      deployerOk: rand() < 0.9,
      lpLocked: rand() < 0.9,
      top10: Math.round(14 + rand() * 52),
      path: makePath(rand),
    };
  });
  const tradable = shuffle(
    catalog.filter((t) => t.liquidityUsd >= MIN_LIQ && t.ageSec >= MIN_AGE && t.vol1hUsd >= MIN_VOL),
    mulberry32(seed ^ 0x51ed0),
  );
  return { catalog, tradable };
}

export function universe(seed: number): Universe {
  let u = universes.get(seed);
  if (!u) {
    u = buildUniverse(seed);
    universes.set(seed, u);
  }
  return u;
}

export function factsByAddress(seed: number, address: string): TokenFacts {
  const hit = universe(seed).catalog.find((t) => t.address === address);
  if (!hit) throw new Error(`unknown token ${address}`);
  return hit;
}

export function multipleAt(path: Path, elapsed: number): number {
  const t = Math.max(0, elapsed);
  const wobble =
    Math.sin(t / 23 + path.phase) * path.vol * 0.05 +
    Math.sin(t / 8.5 + path.phase * 1.3) * path.vol * 0.028;
  const wobble0 =
    Math.sin(path.phase) * path.vol * 0.05 + Math.sin(path.phase * 1.3) * path.vol * 0.028;
  let m = 1 + path.driftPerMin * (t / 60) + (wobble - wobble0);
  if (t > path.shockAt) {
    const k = 1 - Math.exp(-(t - path.shockAt) / 16);
    m += path.shockMag * k;
  }
  return Math.max(0.05, m);
}

export type Market = {
  liquidity: number;
  vol1h: number;
  volatility: number;
  path: Path;
  price: number;
};

export function marketAt(facts: TokenFacts, wave: number): Market {
  if (wave === 0) {
    return {
      liquidity: facts.liquidityUsd,
      vol1h: facts.vol1hUsd,
      volatility: facts.volatility,
      path: facts.path,
      price: facts.price,
    };
  }
  const rand = mulberry32(hashString(`${facts.address}:m:${wave}`) ^ 0x51ed);
  return {
    liquidity: Math.round(facts.liquidityUsd * (0.82 + rand() * 0.46)),
    vol1h: Math.round(facts.vol1hUsd * (1.15 + rand() * 2.1)),
    volatility: round(clamp(facts.volatility * (0.72 + rand() * 0.7), 0.2, 1.3), 3),
    path: makePath(rand),
    price: facts.price,
  };
}

export type Discovery = {
  token: string;
  at: number;
  trigger: Trigger;
  wave: number;
};

export function discoveryAt(seed: number, index: number): Discovery | null {
  const list = universe(seed).tradable;
  const n = list.length;
  if (n === 0) return null;
  const wave = Math.floor(index / n);
  const i = index % n;
  const token = list[i];
  const at = 8 + wave * (n * SCAN_GAP_SEC + 30) + i * SCAN_GAP_SEC;
  const h = hashString(`${token.address}:${wave}:trig`);
  const trigger: Trigger =
    wave === 0 && token.ageSec < 1200 ? "new_pair" : h % 2 === 0 ? "vol_spike" : "liq_spike";
  return { token: token.address, at, trigger, wave };
}

function pairFor(facts: TokenFacts): string {
  return facts.chain === "solana" ? `${facts.symbol}/SOL` : `${facts.symbol}/WETH`;
}

function runIdFor(address: string, at: number): string {
  return hashString(`${address}:${at}`).toString(16).padStart(8, "0").slice(0, 8);
}

function txHash(runId: string, action: string): string {
  const h = hashString(`${runId}:${action}:tx`);
  const a = h.toString(16).padStart(8, "0");
  const b = (h ^ 0x9e3779b9).toString(16).padStart(8, "0");
  return `sim_${a}${b}`.slice(0, 20);
}

function triggerLabel(trigger: Trigger): string {
  if (trigger === "new_pair") return "new pair";
  if (trigger === "vol_spike") return "vol spike";
  return "liq spike";
}

export function stopPctFor(vol: number): number {
  return clamp(0.11 + vol * 0.08, 0.12, 0.22);
}

export function takePctFor(vol: number): number {
  return clamp(0.28 + vol * 0.14, 0.26, 0.5);
}

export function maxSlippageBps(vol: number): number {
  return Math.round(clamp(100 + vol * 100, 110, 240));
}

export function estimateSlipBps(sizeUsd: number, liquidity: number, vol: number): number {
  const impact = (sizeUsd / Math.max(liquidity, 1)) * 9000;
  return Math.round(10 + impact + vol * 18);
}

function slipJitter(address: string, salt: string): number {
  const h = hashString(`${address}:${salt}`);
  const bucket = h % 100;
  if (bucket >= 88) return 2.5 + ((h >>> 7) % 200) / 100;
  if (bucket >= 76) return 1.5 + ((h >>> 5) % 70) / 100;
  return 0.86 + ((h >>> 3) % 400) / 1000;
}

function gasUsd(chain: Chain): number {
  return chain === "solana" ? 0.08 : 0.62;
}

export function ageAt(facts: TokenFacts, atSec: number): number {
  return facts.ageSec + atSec;
}

export function rugCheck(facts: TokenFacts, ageSec: number, runId: string): RugOut {
  const youngBand = ageSec < 480 && facts.top10 > 54 && facts.top10 <= 64;
  const checks: Checks = {
    renounced: facts.renounced,
    mint_auth: !facts.mintLive,
    freeze_auth: !facts.freeze,
    lp_locked_or_burned: facts.lpLocked,
    honeypot: !facts.honeypot,
    tax_ok: facts.taxBps <= TAX_MAX_BPS,
    blacklist: !facts.blacklist,
    deployer_ok: facts.deployerOk,
    age_ok: ageSec >= RUG_AGE,
    holder_conc_ok: facts.top10 <= 64 && !youngBand,
  };
  const failed = CHECK_PRIORITY.find((k) => !checks[k]);
  let reason = "checks clear";
  if (failed === "honeypot") reason = "honeypot simulation failed";
  else if (failed === "blacklist") reason = "blacklist function present";
  else if (failed === "mint_auth") reason = "mint authority live";
  else if (failed === "freeze_auth") reason = "freeze authority set";
  else if (failed === "tax_ok") reason = `sell tax ${(facts.taxBps / 100).toFixed(1)}%`;
  else if (failed === "lp_locked_or_burned") reason = "liquidity not locked or burned";
  else if (failed === "deployer_ok") reason = "deployer history is dirty";
  else if (failed === "holder_conc_ok")
    reason = youngBand
      ? `concentration ambiguous · top 10 hold ${facts.top10}%`
      : `top 10 hold ${facts.top10}%`;
  else if (failed === "age_ok") reason = `age ${formatAge(ageSec)} under 3m floor`;
  else if (failed === "renounced") reason = "ownership not renounced";
  return {
    run_id: runId,
    token: facts.address,
    verdict: failed ? "FAIL" : "PASS",
    checks,
    reason,
  };
}

export function sizeFor(
  facts: TokenFacts,
  runId: string,
  ctx: Omit<DecisionCtx, "params">,
  params: Params,
  minNotional = 40,
): SizerOut {
  const dd = ctx.drawdown;
  const base = {
    run_id: runId,
    token: facts.address,
    max_slippage_bps: maxSlippageBps(ctx.volatility),
    equity_at_decision: round(ctx.equity, 2),
    size_tokens: 0,
  };
  if (dd >= params.ddHaltPct) {
    return {
      ...base,
      size_usd: 0,
      risk_pct_used: 0,
      reason: `circuit · drawdown ${formatPct(dd)} ≥ halt ${formatPct(params.ddHaltPct)}`,
    };
  }
  const stopPct = stopPctFor(ctx.volatility);
  const riskBudget = ctx.equity * params.maxRiskPct;
  let size = riskBudget / stopPct;
  const poolMax = ctx.liquidity * params.maxPoolPct;
  let tag = "";
  if (size > poolMax) {
    size = poolMax;
    tag = " · pool-capped";
  }
  const haircut = clamp(1 - Math.max(0, ctx.volatility - 0.55) * 0.65, 0.58, 1);
  size *= haircut;
  const gas = gasUsd(facts.chain);
  const floor = Math.max(minNotional, gas * 30);
  const maxSlip = base.max_slippage_bps;
  let guard = 0;
  while (guard++ < 8 && size >= floor) {
    const est = estimateSlipBps(size, ctx.liquidity, ctx.volatility);
    const slipCost = (size * est) / 10_000;
    if (est <= maxSlip * 0.82 && slipCost <= riskBudget * 0.5) break;
    size *= 0.74;
    tag = " · slip-shrunk";
  }
  if (size < floor) {
    return {
      ...base,
      size_usd: 0,
      risk_pct_used: 0,
      reason: "slippage eats the risk budget",
    };
  }
  size = round(size, 2);
  const tokens = round(size / ctx.price, 4);
  const riskUsed = (size * stopPct) / ctx.equity;
  return {
    ...base,
    size_usd: size,
    size_tokens: tokens,
    risk_pct_used: round(riskUsed, 5),
    reason: `${formatPct(params.maxRiskPct, 2)} × ${formatUsd(ctx.equity, 0)} · stop ${formatPct(stopPct)} → ${formatUsd(size)}${tag}`,
  };
}

function rankScore(liq: number, vol: number, trigger: Trigger): number {
  const turnover = vol / Math.max(liq, 1);
  return round(clamp(turnover * 18 + Math.log10(liq) * 9 + (trigger === "new_pair" ? 6 : 0), 1, 99), 1);
}

function blank(seed: number, params: Params): World {
  return {
    seed,
    simSec: 0,
    cursor: 0,
    params,
    equity: START_EQUITY,
    peak: START_EQUITY,
    pnlSum: 0,
    slipSumBps: 0,
    slipN: 0,
    holdSumSec: 0,
    closedN: 0,
    wins: 0,
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
    condemned: {},
    runs: [],
    logs: [],
    positions: [],
    recentCloses: [],
    marks: [{ t: 0, equity: START_EQUITY, mtm: START_EQUITY }],
    lastHop: null,
  };
}

function pushLog(w: World, event: LogEvent): void {
  w.logs = [event, ...w.logs].slice(0, 420);
  w.counts.logged += 1;
  w.lastHop = { agent: event.agent, symbol: event.symbol, detail: event.summary };
}

function tsOf(simSec: number): number {
  return EPOCH + Math.round(simSec * 1000);
}

export function drawdownOf(w: Pick<World, "equity" | "peak">): number {
  if (w.peak <= 0) return 0;
  return (w.peak - w.equity) / w.peak;
}

export function equityOut(w: World): EquityOut {
  return {
    equity_usd: round(w.equity, 2),
    drawdown_pct: round(drawdownOf(w), 4),
    win_rate: round(w.closedN ? w.wins / w.closedN : 0, 4),
    expectancy_usd: round(w.closedN ? w.pnlSum / w.closedN : 0, 2),
    trades_closed: w.closedN,
    as_of: tsOf(w.simSec),
  };
}

function runCandidate(world: World, d: Discovery): World {
  const w: World = {
    ...world,
    counts: { ...world.counts },
    condemned: world.condemned,
    runs: world.runs.slice(),
    logs: world.logs,
    positions: world.positions.slice(),
    recentCloses: world.recentCloses,
    marks: world.marks,
  };
  const facts = factsByAddress(w.seed, d.token);
  const market = marketAt(facts, d.wave);
  const runId = runIdFor(facts.address, d.at);
  const age = Math.round(ageAt(facts, d.at));
  const score = rankScore(market.liquidity, market.vol1h, d.trigger);
  const scanner: ScannerOut = {
    run_id: runId,
    token: facts.address,
    pair: pairFor(facts),
    chain: facts.chain,
    discovered_at: tsOf(d.at),
    trigger: d.trigger,
    liquidity_usd: Math.round(market.liquidity),
    vol_1h_usd: Math.round(market.vol1h),
    age_sec: age,
    rank_score: score,
    reason: `${triggerLabel(d.trigger)} · liq ${formatUsd(market.liquidity, 0)} · 1h ${formatUsd(market.vol1h, 0)} · age ${formatAge(age)}`,
  };
  const decision: DecisionCtx = {
    equity: round(w.equity, 2),
    drawdown: round(drawdownOf(w), 4),
    volatility: market.volatility,
    liquidity: market.liquidity,
    vol1h: market.vol1h,
    price: market.price,
    wave: d.wave,
    params: { ...w.params },
  };
  const run: Run = {
    runId,
    symbol: facts.symbol,
    name: facts.name,
    token: facts.address,
    chain: facts.chain,
    wave: d.wave,
    status: "fail",
    scanner,
    rug: rugCheck(facts, age, runId),
    sizer: null,
    entry: null,
    exit: null,
    pnl: null,
    decision,
  };
  w.counts.scanned += 1;
  pushLog(w, {
    id: `${runId}:scanner`,
    runId,
    ts: scanner.discovered_at,
    agent: "scanner",
    symbol: facts.symbol,
    token: facts.address,
    summary: scanner.reason,
    payload: scanner,
  });
  pushLog(w, {
    id: `${runId}:rug`,
    runId,
    ts: scanner.discovered_at,
    agent: "rug",
    symbol: facts.symbol,
    token: facts.address,
    summary: `${run.rug.verdict} · ${run.rug.reason}`,
    payload: run.rug,
  });
  if (run.rug.verdict === "FAIL") {
    w.counts.rugFail += 1;
    w.condemned = { ...w.condemned, [facts.address]: true };
    w.runs = [run, ...w.runs].slice(0, 180);
    return w;
  }
  w.counts.rugPass += 1;
  const sizer = sizeFor(facts, runId, decision, w.params);
  run.sizer = sizer;
  pushLog(w, {
    id: `${runId}:sizer`,
    runId,
    ts: scanner.discovered_at,
    agent: "sizer",
    symbol: facts.symbol,
    token: facts.address,
    summary: sizer.reason,
    payload: sizer,
  });
  if (sizer.size_usd <= 0) {
    w.counts.sizeZero += 1;
    run.status = "skip";
    w.runs = [run, ...w.runs].slice(0, 180);
    return w;
  }
  w.counts.sized += 1;
  const entry = executeEntry(facts, sizer, market, d.at);
  run.entry = entry;
  pushLog(w, {
    id: `${runId}:entry`,
    runId,
    ts: scanner.discovered_at,
    agent: "executor",
    symbol: facts.symbol,
    token: facts.address,
    summary: `${entry.action} ${entry.status} · ${entry.reason}`,
    payload: entry,
  });
  if (entry.status === "ABORTED") {
    w.counts.aborted += 1;
    run.status = "aborted";
    w.runs = [run, ...w.runs].slice(0, 180);
    return w;
  }
  if (entry.status === "PARTIAL") w.counts.partial += 1;
  else w.counts.filled += 1;
  const stopPct = stopPctFor(market.volatility);
  const takePct = takePctFor(market.volatility);
  const hold = 150 + (hashString(`${runId}:hold`) % 130);
  w.positions.push({
    runId,
    token: facts.address,
    symbol: facts.symbol,
    chain: facts.chain,
    entryMid: market.price,
    fillPrice: entry.fill_price,
    sizeUsd: entry.size_usd,
    sizeTokens: round(entry.size_usd / entry.fill_price, 6),
    stopMid: market.price * (1 - stopPct),
    takeMid: market.price * (1 + takePct),
    deadlineSec: d.at + hold,
    openedAtSec: d.at,
    gasIn: entry.gas_usd,
    path: market.path,
    liquidity: market.liquidity,
    maxSlippageBps: sizer.max_slippage_bps,
  });
  w.slipSumBps += entry.slippage_bps;
  w.slipN += 1;
  run.status = "open";
  w.runs = [run, ...w.runs].slice(0, 180);
  return w;
}

function executeEntry(facts: TokenFacts, sizer: SizerOut, market: Market, _at: number): ExecOut {
  const est = estimateSlipBps(sizer.size_usd, market.liquidity, market.volatility);
  const jitter = slipJitter(facts.address, `entry:${sizer.run_id}`);
  const realized = Math.round(est * jitter);
  const gas = round(gasUsd(facts.chain), 2);
  if (realized > sizer.max_slippage_bps) {
    return {
      run_id: sizer.run_id,
      token: facts.address,
      action: "entry",
      status: "ABORTED",
      fill_price: 0,
      size_usd: 0,
      gas_usd: 0,
      slippage_bps: realized,
      tx_hash: "",
      reason: `aborted pre-send · slip ${realized} > max ${sizer.max_slippage_bps}`,
    };
  }
  const thin = sizer.size_usd / market.liquidity > 0.0045 && jitter > 1.12 && jitter < 1.5;
  const size = thin ? round(sizer.size_usd * 0.64, 2) : sizer.size_usd;
  const fill = roundPx(market.price * (1 + realized / 10_000));
  return {
    run_id: sizer.run_id,
    token: facts.address,
    action: "entry",
    status: thin ? "PARTIAL" : "FILLED",
    fill_price: fill,
    size_usd: size,
    gas_usd: gas,
    slippage_bps: realized,
    tx_hash: txHash(sizer.run_id, "entry"),
    reason: thin ? `partial · book took ${realized} bps` : `filled · ${realized} bps slip`,
  };
}

function roundPx(n: number): number {
  if (n >= 1) return round(n, 6);
  return Number(n.toPrecision(6));
}

function unrealized(p: Position, now: number): number {
  const mid = p.entryMid * multipleAt(p.path, now - p.openedAtSec);
  const slip = exitSlipBps(p, "mark") / 10_000;
  const px = mid * (1 - slip);
  const gasOut = gasUsd(p.chain);
  return p.sizeTokens * px - p.sizeUsd - p.gasIn - gasOut;
}

function exitSlipBps(p: Position, salt: string): number {
  const j = slipJitter(p.token, salt + p.runId);
  return Math.round((8 + (p.sizeUsd / Math.max(p.liquidity, 1)) * 5000) * j);
}

function settle(world: World, to: number): World {
  const w: World = {
    ...world,
    counts: { ...world.counts },
    runs: world.runs.slice(),
    logs: world.logs,
    positions: [],
    recentCloses: world.recentCloses.slice(),
  };
  for (const p of world.positions) {
    const elapsed = to - p.openedAtSec;
    const midNow = p.entryMid * multipleAt(p.path, elapsed);
    let trigger: "stop" | "take-profit" | "time" | null = null;
    if (midNow <= p.stopMid) trigger = "stop";
    else if (midNow >= p.takeMid) trigger = "take-profit";
    else if (to >= p.deadlineSec) trigger = "time";
    if (!trigger) {
      w.positions.push(p);
      continue;
    }
    const midRef = trigger === "stop" ? p.stopMid : trigger === "take-profit" ? p.takeMid : midNow;
    let slip = exitSlipBps(p, "exit");
    let status: ExecOut["status"] = "FILLED";
    let reason = `exit · ${trigger}`;
    if (slip > 180) {
      status = "PARTIAL";
      slip += 40;
      reason = `exit partial · ${trigger} · thin book`;
    }
    const fill = roundPx(midRef * (1 - slip / 10_000));
    const gasOut = round(gasUsd(p.chain), 2);
    const pnl = round(p.sizeTokens * fill - p.sizeUsd - p.gasIn - gasOut, 2);
    const ret = p.sizeUsd > 0 ? pnl / p.sizeUsd : 0;
    w.equity = round(w.equity + pnl, 2);
    if (w.equity > w.peak) w.peak = w.equity;
    w.pnlSum = round(w.pnlSum + pnl, 2);
    w.closedN += 1;
    w.counts.closed += 1;
    w.holdSumSec += elapsed;
    if (pnl > 0) w.wins += 1;
    w.lastPnl = pnl;
    const exit: ExecOut = {
      run_id: p.runId,
      token: p.token,
      action: "exit",
      status,
      fill_price: fill,
      size_usd: p.sizeUsd,
      gas_usd: gasOut,
      slippage_bps: slip,
      tx_hash: txHash(p.runId, "exit"),
      reason: `${reason} · ${formatPct(ret, 1)}`,
    };
    const eq = equityOut({ ...w, simSec: to });
    pushLog(w, {
      id: `${p.runId}:exit`,
      runId: p.runId,
      ts: tsOf(to),
      agent: "executor",
      symbol: p.symbol,
      token: p.token,
      summary: exit.reason,
      payload: exit,
    });
    pushLog(w, {
      id: `${p.runId}:equity`,
      runId: p.runId,
      ts: tsOf(to),
      agent: "equity",
      symbol: p.symbol,
      token: p.token,
      summary: `equity ${formatUsd(eq.equity_usd)} · dd ${formatPct(eq.drawdown_pct)}`,
      payload: eq,
    });
    w.recentCloses = [
      { runId: p.runId, symbol: p.symbol, chain: p.chain, pnl, holdSec: elapsed, reason: trigger, ret },
      ...w.recentCloses,
    ].slice(0, 16);
    const idx = w.runs.findIndex((r) => r.runId === p.runId);
    if (idx >= 0) {
      const prev = w.runs[idx];
      w.runs[idx] = { ...prev, status: "closed", exit, pnl };
    }
  }
  const mtm = round(w.equity + w.positions.reduce((s, p) => s + unrealized(p, to), 0), 2);
  const mark: Mark = { t: to, equity: round(w.equity, 2), mtm };
  const marks = w.marks.slice();
  if (marks.length && marks[marks.length - 1].t === to) marks.pop();
  marks.push(mark);
  if (marks.length > 280) marks.splice(0, marks.length - 280);
  w.marks = marks;
  w.simSec = to;
  return w;
}

export function step(world: World): World {
  const to = world.simSec + STEP_SEC;
  let w = world;
  let guard = 0;
  while (guard++ < 40) {
    const d = discoveryAt(w.seed, w.cursor);
    if (!d || d.at > to) break;
    const blocked = Boolean(w.condemned[d.token]) || w.positions.some((p) => p.token === d.token);
    w = { ...w, cursor: w.cursor + 1 };
    if (blocked) continue;
    w = runCandidate(w, d);
  }
  return settle(w, to);
}

export function createWorld(seed: number, params: Params): World {
  let w = blank(seed >>> 0, params);
  let guard = 0;
  while (w.simSec < BOOT_SEC && guard++ < 400) w = step(w);
  return w;
}

export function snapshot(w: World): Snapshot {
  const dd = drawdownOf(w);
  const openNotional = w.positions.reduce((s, p) => s + p.sizeUsd, 0);
  const u = w.positions.reduce((s, p) => s + unrealized(p, w.simSec), 0);
  return {
    equity: w.equity,
    drawdownPct: dd,
    winRate: w.closedN ? w.wins / w.closedN : 0,
    expectancy: w.closedN ? w.pnlSum / w.closedN : 0,
    tradesClosed: w.closedN,
    avgSlipBps: w.slipN ? w.slipSumBps / w.slipN : 0,
    avgHoldSec: w.closedN ? w.holdSumSec / w.closedN : 0,
    mtm: w.equity + u,
    halted: dd >= w.params.ddHaltPct - 1e-9,
    openNotional,
  };
}

export function markPrice(p: Position, now: number): number {
  return p.entryMid * multipleAt(p.path, now - p.openedAtSec);
}

export function positionPnl(p: Position, now: number): number {
  return unrealized(p, now);
}

export type Replay = {
  rug: RugOut;
  sizer: SizerOut | null;
  rugMatch: boolean;
  sizeMatch: boolean;
  paramsMatch: boolean;
};

export function replay(seed: number, run: Run, params: Params): Replay {
  const facts = factsByAddress(seed, run.token);
  const rug = rugCheck(facts, run.scanner.age_sec, run.runId);
  const rugMatch = rug.verdict === run.rug.verdict && rug.reason === run.rug.reason;
  const paramsMatch =
    params.maxRiskPct === run.decision.params.maxRiskPct &&
    params.maxPoolPct === run.decision.params.maxPoolPct &&
    params.ddHaltPct === run.decision.params.ddHaltPct;
  if (rug.verdict === "FAIL") {
    return { rug, sizer: null, rugMatch, sizeMatch: run.sizer === null, paramsMatch };
  }
  const sizer = sizeFor(facts, run.runId, run.decision, params);
  const sizeMatch = run.sizer ? sizer.size_usd === run.sizer.size_usd : false;
  return { rug, sizer, rugMatch, sizeMatch, paramsMatch };
}

export const SCANNER_FLOORS = { minLiquidity: MIN_LIQ, minAgeSec: MIN_AGE, minVol1h: MIN_VOL };
export const CHECK_ORDER = CHECK_PRIORITY;

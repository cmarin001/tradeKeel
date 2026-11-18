import { useEffect, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import {
  Crosshair,
  Info,
  LineChart,
  Pause,
  Play,
  Radar,
  RotateCcw,
  Scale,
  ScrollText,
  ShieldAlert,
  SkipForward,
  X,
} from "lucide-react";
import {
  CHECK_ORDER,
  SCANNER_FLOORS,
  markPrice,
  positionPnl,
  replay,
  snapshot,
  type AgentId,
  type Checks,
  type LogEvent,
  type Run,
} from "@/lib/fleet/engine";
import {
  cx,
  EPOCH,
  formatAge,
  formatBps,
  formatClock,
  formatDuration,
  formatPct,
  formatPx,
  formatSignedUsd,
  formatTokens,
  formatUsd,
} from "@/lib/fleet/format";
import {
  DEFAULT_SEED,
  useFleet,
  type ChainFilter,
  type LogFilter,
  type Speed,
  type Tab,
} from "@/lib/fleet/store";

const AGENTS: {
  id: AgentId;
  n: string;
  name: string;
  role: string;
  icon: typeof Radar;
}[] = [
  { id: "scanner", n: "01", name: "Scanner", role: "Discovery only. No opinion.", icon: Radar },
  { id: "rug", n: "02", name: "Rug check", role: "Kill fast. Fail is forever.", icon: ShieldAlert },
  { id: "sizer", n: "03", name: "Sizer", role: "Equity × risk. Never a flat dollar.", icon: Scale },
  { id: "executor", n: "04", name: "Executor", role: "Fill or abort. No rethink.", icon: Crosshair },
  { id: "logger", n: "05", name: "Logger", role: "Append-only. Off the hot path.", icon: ScrollText },
  { id: "equity", n: "06", name: "Equity", role: "Moves on close. Feeds the sizer.", icon: LineChart },
];

const CHECK_LABELS: { key: keyof Checks; label: string }[] = [
  { key: "honeypot", label: "Honeypot sim" },
  { key: "blacklist", label: "Blacklist" },
  { key: "mint_auth", label: "Mint authority" },
  { key: "freeze_auth", label: "Freeze authority" },
  { key: "tax_ok", label: "Sell tax" },
  { key: "lp_locked_or_burned", label: "LP lock" },
  { key: "deployer_ok", label: "Deployer" },
  { key: "holder_conc_ok", label: "Holders" },
  { key: "age_ok", label: "Contract age" },
  { key: "renounced", label: "Ownership" },
];

const TABS: { id: Tab; label: string }[] = [
  { id: "tape", label: "Tape" },
  { id: "curve", label: "Curve" },
  { id: "book", label: "Book" },
  { id: "log", label: "Log" },
];

export function Desk({ onLive }: { onLive?: () => void }) {
  const world = useFleet((s) => s.world);
  const running = useFleet((s) => s.running);
  const speed = useFleet((s) => s.speed);
  const showMtm = useFleet((s) => s.showMtm);
  const selectedId = useFleet((s) => s.selected);
  const logFilter = useFleet((s) => s.logFilter);
  const chainFilter = useFleet((s) => s.chainFilter);
  const tab = useFleet((s) => s.tab);
  const doctrine = useFleet((s) => s.doctrine);
  const contractOpen = useFleet((s) => s.contractOpen);
  const tick = useFleet((s) => s.tick);
  const nudge = useFleet((s) => s.nudge);
  const setRunning = useFleet((s) => s.setRunning);
  const setSpeed = useFleet((s) => s.setSpeed);
  const setShowMtm = useFleet((s) => s.setShowMtm);
  const setParam = useFleet((s) => s.setParam);
  const reset = useFleet((s) => s.reset);
  const select = useFleet((s) => s.select);
  const setLogFilter = useFleet((s) => s.setLogFilter);
  const setChainFilter = useFleet((s) => s.setChainFilter);
  const setTab = useFleet((s) => s.setTab);
  const setDoctrine = useFleet((s) => s.setDoctrine);
  const setContractOpen = useFleet((s) => s.setContractOpen);

  const [mounted, setMounted] = useState(false);
  const [seedDraft, setSeedDraft] = useState(world.seed.toString(16));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!running) return;
    const ms = speed === 1 ? 720 : speed === 4 ? 420 : 260;
    const id = window.setInterval(() => tick(speed), ms);
    return () => window.clearInterval(id);
  }, [running, speed, tick]);

  useEffect(() => {
    if (!doctrine) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDoctrine(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doctrine, setDoctrine]);

  const snap = snapshot(world);
  const run = world.runs.find((r) => r.runId === selectedId) ?? null;
  const again = run ? replay(world.seed, run, world.params) : null;

  const runs = world.runs.filter((r) => chainFilter === "all" || r.chain === chainFilter);
  const logs = world.logs.filter((e) => {
    if (logFilter !== "all" && e.agent !== logFilter) return false;
    if (chainFilter === "all") return true;
    const owner = world.runs.find((r) => r.runId === e.runId);
    return !owner || owner.chain === chainFilter;
  });

  const statusLabel = !running ? "PAUSED" : snap.halted ? "HALTED" : "LIVE";

  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg text-fg">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-3 py-3 lg:px-4">
          <div className="flex items-center gap-3">
            <KeelMark />
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg font-semibold tracking-widest">KEEL</h1>
                <span className="font-mono text-xs text-muted">FLEET DESK</span>
              </div>
              <p className="text-sm text-muted">Paper DEX fleet. Six agents. No role bleed.</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-5">
            <div className="text-right">
              <div className="font-mono text-xs text-muted">SIM {formatClock(world.simSec)} UTC</div>
              <div className="mt-1 flex items-center justify-end gap-2 text-sm">
                <span
                  className={cx(
                    "inline-block size-2 rounded-full",
                    statusLabel === "LIVE" && "bg-sage lamp-live",
                    statusLabel === "HALTED" && "bg-rust",
                    statusLabel === "PAUSED" && "bg-brass",
                  )}
                />
                <span className={statusLabel === "HALTED" ? "text-rust" : "text-fg"}>{statusLabel}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs text-muted">REALIZED EQUITY</div>
              <div className="font-mono text-2xl font-medium tabular-nums text-brass">
                {formatUsd(snap.equity, 0)}
              </div>
              <div
                className={cx(
                  "font-mono text-xs tabular-nums",
                  world.lastPnl == null ? "text-muted" : world.lastPnl >= 0 ? "text-sage" : "text-rust",
                )}
              >
                {world.lastPnl == null ? "no close yet" : `last close ${formatSignedUsd(world.lastPnl)}`}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-3 py-3 lg:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-brass px-4 text-sm font-medium text-brass-ink"
              onClick={() => setRunning(!running)}
            >
              {running ? <Pause className="size-4" /> : <Play className="size-4" />}
              {running ? "Pause" : "Run"}
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm disabled:opacity-40"
              onClick={() => nudge()}
              disabled={running}
            >
              <SkipForward className="size-4" />
              Step
            </button>
            <Segmented
              value={String(speed)}
              options={[
                { id: "1", label: "1×" },
                { id: "4", label: "4×" },
                { id: "16", label: "16×" },
              ]}
              onChange={(id) => setSpeed(Number(id) as Speed)}
            />
            <Segmented
              value={chainFilter}
              options={[
                { id: "all", label: "All" },
                { id: "solana", label: "Solana" },
                { id: "base", label: "Base" },
              ]}
              onChange={(id) => setChainFilter(id as ChainFilter)}
            />
            <label className="flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm">
              <span className="text-muted">Seed</span>
              <input
                value={seedDraft}
                onChange={(e) => setSeedDraft(e.target.value)}
                spellCheck={false}
                aria-label="Simulation seed"
                className="w-20 bg-transparent font-mono text-sm text-fg outline-none"
              />
            </label>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm"
              onClick={() => {
                const next = parseSeed(seedDraft);
                setSeedDraft(next.toString(16));
                reset(next);
              }}
            >
              <RotateCcw className="size-4" />
              Reset
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-brass bg-surface px-3 text-sm text-brass"
              onClick={onLive}
            >
              Live markets
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm"
              onClick={() => setDoctrine(true)}
            >
              <Info className="size-4" />
              Doctrine
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Slider
              label="Max risk / trade"
              display={formatPct(world.params.maxRiskPct, 2)}
              min={0.002}
              max={0.02}
              step={0.001}
              value={world.params.maxRiskPct}
              onChange={(v) => setParam("maxRiskPct", v)}
            />
            <Slider
              label="Max size vs pool"
              display={formatPct(world.params.maxPoolPct, 1)}
              min={0.005}
              max={0.03}
              step={0.001}
              value={world.params.maxPoolPct}
              onChange={(v) => setParam("maxPoolPct", v)}
            />
            <Slider
              label="Halt entries at drawdown"
              display={formatPct(world.params.ddHaltPct, 0)}
              min={0.05}
              max={0.3}
              step={0.01}
              value={world.params.ddHaltPct}
              onChange={(v) => setParam("ddHaltPct", v)}
            />
          </div>
        </div>
      </div>

      {snap.halted && (
        <div className="border-b border-line bg-rust-dim">
          <p className="mx-auto max-w-[1440px] px-3 py-2 text-sm text-rust lg:px-4">
            Entries halted. Drawdown {formatPct(snap.drawdownPct)} is through the{" "}
            {formatPct(world.params.ddHaltPct, 0)} circuit inside the sizer. Exits still run. Raise the halt,
            or wait until equity makes a new high.
          </p>
        </div>
      )}

      <main className="mx-auto grid w-full max-w-[1440px] gap-3 px-3 py-3 lg:grid-cols-[16rem_minmax(0,1fr)_22rem] lg:px-4">
        <aside className="min-w-0 lg:sticky lg:top-3 lg:self-start">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {AGENTS.map((agent) => {
              const active = world.lastHop?.agent === agent.id;
              const Icon = agent.icon;
              return (
                <article
                  key={agent.id}
                  className={cx(
                    "min-w-[11.5rem] shrink-0 rounded-md border bg-surface p-3 lg:min-w-0",
                    active ? "border-brass" : "border-line",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cx("size-4", active ? "text-brass" : "text-muted")} />
                    <span className="font-mono text-xs text-faint">{agent.n}</span>
                    <h2 className="text-sm font-semibold">{agent.name}</h2>
                  </div>
                  <p className="mt-1 hidden text-xs text-pretty text-muted lg:block">{agent.role}</p>
                  <p className="mt-2 font-mono text-xs tabular-nums text-fg">{agentStat(agent.id, world.counts)}</p>
                </article>
              );
            })}
          </div>
          <p className="mt-2 hidden text-xs text-pretty text-faint lg:block">
            Scanner floors: {formatUsd(SCANNER_FLOORS.minLiquidity, 0)} liquidity,{" "}
            {formatAge(SCANNER_FLOORS.minAgeSec)} age, {formatUsd(SCANNER_FLOORS.minVol1h, 0)} hourly volume.
            Check flags are clear-bits — true means the risk is absent.
          </p>
        </aside>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="grid grid-cols-4 gap-1 lg:hidden">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={tab === item.id}
                className={cx(
                  "h-11 rounded-md border text-sm",
                  tab === item.id ? "border-brass bg-brass text-brass-ink" : "border-line bg-surface text-fg",
                )}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <section className={cx("min-w-0", tab !== "tape" && "max-lg:hidden")}>
            <Panel
              title="Candidate tape"
              action={
                <span className="font-mono text-xs text-muted">
                  {world.lastHop ? `${world.lastHop.agent} · ${world.lastHop.symbol}` : "waiting"}
                </span>
              }
            >
              <p className="border-b border-line px-3 py-2 text-sm text-pretty text-muted" aria-live="polite">
                {world.lastHop
                  ? `${world.lastHop.detail}`
                  : "Scanner is quiet. Rug check has not been asked anything."}
              </p>
              <div className="max-h-80 overflow-auto">
                {runs.length === 0 ? (
                  <p className="px-3 py-6 text-sm text-muted">Nothing on this chain yet.</p>
                ) : (
                  runs.map((row) => (
                    <button
                      key={row.runId}
                      id={`run-${row.runId}`}
                      type="button"
                      onClick={() => select(row.runId)}
                      className={cx(
                        "flex w-full items-start gap-3 border-b border-line px-3 py-2.5 text-left",
                        row.runId === run?.runId ? "bg-surface-2" : "hover:bg-surface-2",
                      )}
                    >
                      <span
                        className={cx(
                          "mt-1 w-1 shrink-0 self-stretch rounded-full",
                          row.runId === run?.runId ? "bg-brass" : "bg-transparent",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-semibold">
                            {row.symbol}
                            <span className="ml-2 font-mono text-xs font-normal text-muted">
                              {row.chain === "solana" ? "SOL" : "BASE"}
                            </span>
                          </span>
                          <Outcome row={row} />
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-muted">{row.scanner.reason}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </Panel>
          </section>

          <section className={cx("min-w-0", tab !== "tape" && "max-lg:hidden")}>
            <Inspector
              run={run}
              again={again}
              prior={
                run
                  ? (world.runs.find((r) => r.token === run.token && r.runId !== run.runId) ?? null)
                  : null
              }
              contractOpen={contractOpen}
              copied={copied}
              onToggleContract={() => setContractOpen(!contractOpen)}
              onCopy={(text) => {
                void navigator.clipboard?.writeText(text).then(
                  () => {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1200);
                  },
                  () => setCopied(false),
                );
              }}
            />
          </section>

          <section className={cx("min-w-0", tab !== "log" && "max-lg:hidden")}>
            <Panel
              title="Audit log"
              action={
                <label className="flex items-center gap-2 text-xs text-muted">
                  Agent
                  <select
                    value={logFilter}
                    aria-label="Filter log by agent"
                    onChange={(e) => setLogFilter(e.target.value as LogFilter)}
                    className="h-9 rounded-md border border-line bg-bg px-2 text-sm text-fg"
                  >
                    <option value="all">All</option>
                    {AGENTS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
              }
            >
              <div className="max-h-80 overflow-auto">
                {logs.length === 0 ? (
                  <p className="px-3 py-6 text-sm text-muted">No rows for this filter.</p>
                ) : (
                  logs.slice(0, 160).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => select(event.runId)}
                      className="flex w-full flex-col gap-0.5 border-b border-line px-3 py-2.5 text-left hover:bg-surface-2 sm:flex-row sm:items-baseline sm:gap-3"
                    >
                      <span className="flex shrink-0 items-baseline gap-2">
                        <span className="w-16 font-mono text-xs tabular-nums text-faint">
                          {formatClock((event.ts - EPOCH) / 1000)}
                        </span>
                        <span className={cx("w-16 font-mono text-xs", toneFor(event))}>{event.agent}</span>
                        <span className="w-14 text-sm font-medium">{event.symbol}</span>
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-muted">{event.summary}</span>
                    </button>
                  ))
                )}
              </div>
            </Panel>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <section className={cx(tab !== "curve" && "max-lg:hidden")}>
            <EquityPanel
              mounted={mounted}
              showMtm={showMtm}
              onToggle={() => setShowMtm(!showMtm)}
              marks={world.marks}
              snap={snap}
            />
          </section>
          <section className={cx(tab !== "book" && "max-lg:hidden")}>
            <Book worldSim={world.simSec} positions={world.positions} closes={world.recentCloses} snap={snap} onSelect={select} />
          </section>
        </div>
      </main>

      <footer className="mx-auto max-w-[1440px] px-3 pb-8 text-xs text-pretty text-faint lg:px-4">
        Paper simulation. Deterministic for a seed. Not a wallet, not a venue, not advice. Realized equity is
        the only number the sizer reads, and it changes when a trade closes.
      </footer>

      {doctrine && <Doctrine onClose={() => setDoctrine(false)} />}
    </div>
  );
}

function agentStat(
  id: AgentId,
  counts: {
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
  },
): string {
  if (id === "scanner") return `${counts.scanned} emitted`;
  if (id === "rug") return `${counts.rugFail} killed · ${counts.rugPass} pass`;
  if (id === "sizer") return `${counts.sized} sized · ${counts.sizeZero} zero`;
  if (id === "executor") return `${counts.filled} fill · ${counts.aborted} abort · ${counts.partial} partial`;
  if (id === "logger") return `${counts.logged} rows`;
  return `${counts.closed} closes`;
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-line bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
        <h2 className="text-xs font-semibold tracking-widest text-muted">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function Outcome({ row }: { row: Run }) {
  if (row.status === "fail") return <Chip tone="rust">FAIL</Chip>;
  if (row.status === "skip") return <Chip tone="brass">NO SIZE</Chip>;
  if (row.status === "aborted") return <Chip tone="rust">ABORT</Chip>;
  if (row.status === "open" && row.entry?.status === "PARTIAL") return <Chip tone="brass">PARTIAL</Chip>;
  if (row.status === "open") return <Chip tone="sage">OPEN</Chip>;
  return (
    <span
      className={cx(
        "font-mono text-xs tabular-nums",
        (row.pnl ?? 0) >= 0 ? "text-sage" : "text-rust",
      )}
    >
      {formatSignedUsd(row.pnl ?? 0)}
    </span>
  );
}

function Chip({ tone, children }: { tone: "rust" | "sage" | "brass"; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center rounded-md px-2 font-mono text-xs",
        tone === "rust" && "bg-rust-dim text-rust",
        tone === "sage" && "bg-sage-dim text-sage",
        tone === "brass" && "bg-surface-2 text-brass",
      )}
    >
      {children}
    </span>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex h-11 rounded-md border border-line bg-surface p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={value === opt.id}
          className={cx(
            "rounded-md px-3 text-sm",
            value === opt.id ? "bg-brass text-brass-ink" : "text-fg",
          )}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Slider({
  label,
  display,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  display: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2 py-1">
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-mono tabular-nums text-fg">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 w-full accent-brass"
      />
    </label>
  );
}

function Inspector({
  run,
  again,
  prior,
  contractOpen,
  copied,
  onToggleContract,
  onCopy,
}: {
  run: Run | null;
  again: ReturnType<typeof replay> | null;
  prior: Run | null;
  contractOpen: boolean;
  copied: boolean;
  onToggleContract: () => void;
  onCopy: (text: string) => void;
}) {
  const payload = run
    ? {
        scanner: run.scanner,
        rug: run.rug,
        sizer: run.sizer,
        entry: run.entry,
        exit: run.exit,
      }
    : null;
  const json = contractOpen && payload ? JSON.stringify(payload, null, 2) : "";

  return (
    <Panel
      title="Hand-off"
      action={
        run && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-9 rounded-md border border-line px-2 text-xs"
              onClick={onToggleContract}
            >
              {contractOpen ? "Hide JSON" : "Hand-off JSON"}
            </button>
            {contractOpen && (
              <button
                type="button"
                className="h-9 rounded-md border border-line px-2 text-xs"
                onClick={() => onCopy(json)}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
        )
      }
    >
      {!run || !again ? (
        <p className="px-3 py-6 text-sm text-muted">Select a candidate to read each agent’s output.</p>
      ) : (
        <div className="flex flex-col gap-3 p-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-lg font-semibold">{run.symbol}</h3>
                <span className="text-sm text-muted">{run.name}</span>
              </div>
              <p className="break-all font-mono text-xs text-muted">{run.token}</p>
            </div>
            <p className="font-mono text-xs text-faint">run {run.runId}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {CHECK_LABELS.slice()
              .sort((a, b) => CHECK_ORDER.indexOf(a.key) - CHECK_ORDER.indexOf(b.key))
              .map((item) => {
                const ok = run.rug.checks[item.key];
                return (
                  <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted">{item.label}</span>
                    <span className={ok ? "font-medium text-sage" : "font-medium text-rust"}>
                      {ok ? "Clear" : "Fail"}
                    </span>
                  </div>
                );
              })}
          </div>
          <p className="text-sm">
            <span className="text-muted">Rug check · </span>
            <span className={run.rug.verdict === "PASS" ? "text-sage" : "text-rust"}>
              {run.rug.verdict}
            </span>
            <span className="text-muted"> · {run.rug.reason}</span>
          </p>

          <div className="grid gap-3 border-t border-line pt-3 sm:grid-cols-3">
            <Block title="Scanner">
              <Line k="Trigger" v={run.scanner.trigger.replaceAll("_", " ")} />
              <Line k="Rank" v={String(run.scanner.rank_score)} />
              <Line k="Age" v={formatAge(run.scanner.age_sec)} />
            </Block>
            <Block title="Sizer">
              {run.sizer ? (
                <>
                  <Line k="Size" v={run.sizer.size_usd ? formatUsd(run.sizer.size_usd) : "—"} />
                  <Line k="Tokens" v={run.sizer.size_tokens ? formatTokens(run.sizer.size_tokens) : "—"} />
                  <Line k="Max slip" v={formatBps(run.sizer.max_slippage_bps)} />
                  <Line k="Equity used" v={formatUsd(run.sizer.equity_at_decision, 0)} />
                </>
              ) : (
                <p className="text-sm text-muted">Not called. Rug check stopped the pipe.</p>
              )}
            </Block>
            <Block title="Executor">
              {run.entry ? (
                <>
                  <Line k="Entry" v={run.entry.status} />
                  <Line k="Fill" v={run.entry.fill_price ? formatPx(run.entry.fill_price) : "—"} />
                  <Line k="Slip" v={formatBps(run.entry.slippage_bps)} />
                  <Line k="Exit" v={run.exit ? run.exit.reason : run.status === "open" ? "working" : "—"} />
                </>
              ) : (
                <p className="text-sm text-muted">
                  {run.sizer ? "Not called. Size was zero." : "Not called."}
                </p>
              )}
            </Block>
          </div>

          {run.sizer && <p className="text-sm text-pretty text-muted">{run.sizer.reason}</p>}

          <p className="text-sm text-pretty">
            {again.rugMatch && (again.sizeMatch || !run.sizer) ? (
              <span className="text-sage">Deterministic replay matches this decision.</span>
            ) : !again.paramsMatch ? (
              <span className="text-brass">
                Replay with the sliders you see now would{" "}
                {again.sizer ? `size ${formatUsd(again.sizer.size_usd)}` : "not size"}. The recorded decision
                stands.
              </span>
            ) : (
              <span className="text-rust">Replay diverged from the recorded decision.</span>
            )}
            {prior && (
              <span className="text-muted">
                {" "}
                Another run {prior.runId} on this contract was {prior.rug.verdict}.
              </span>
            )}
          </p>

          {contractOpen && (
            <pre className="max-h-64 overflow-auto rounded-md border border-line bg-bg p-3 font-mono text-xs leading-relaxed text-fg">
              {json}
            </pre>
          )}
        </div>
      )}
    </Panel>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold tracking-widest text-muted">{title}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <p className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted">{k}</span>
      <span className="truncate font-mono text-xs tabular-nums">{v}</span>
    </p>
  );
}

function toneFor(event: LogEvent): string {
  if (event.agent === "rug") return event.summary.startsWith("FAIL") ? "text-rust" : "text-sage";
  if (event.agent === "executor") {
    if (event.summary.includes("ABORTED") || event.summary.includes("stop")) return "text-rust";
    if (event.summary.includes("take-profit")) return "text-sage";
    return "text-brass";
  }
  if (event.agent === "equity") return "text-brass";
  if (event.agent === "sizer") return "text-brass";
  return "text-muted";
}

function EquityPanel({
  mounted,
  showMtm,
  onToggle,
  marks,
  snap,
}: {
  mounted: boolean;
  showMtm: boolean;
  onToggle: () => void;
  marks: { t: number; equity: number; mtm: number }[];
  snap: ReturnType<typeof snapshot>;
}) {
  return (
    <Panel
      title="Equity curve"
      action={
        <button
          type="button"
          aria-pressed={showMtm}
          onClick={onToggle}
          className={cx(
            "h-9 rounded-md border px-2 text-xs",
            showMtm ? "border-brass text-brass" : "border-line text-muted",
          )}
        >
          {showMtm ? "Mark on" : "Show mark"}
        </button>
      }
    >
      <div className="px-3 pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-2xl tabular-nums text-brass">{formatUsd(snap.equity, 0)}</p>
          <p className={cx("font-mono text-sm tabular-nums", snap.drawdownPct > 0 ? "text-rust" : "text-sage")}>
            DD {formatPct(snap.drawdownPct)}
          </p>
        </div>
        <p className="text-xs text-muted">Published on close only. The sizer cannot see unrealized.</p>
      </div>
      <div className="h-40 px-1">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={marks} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                cursor={{ stroke: "var(--color-line)" }}
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-line)",
                  borderRadius: 8,
                  color: "var(--color-fg)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
                formatter={(value, name) => [
                  formatUsd(Number(value ?? 0), 0),
                  name === "mtm" ? "Mark" : "Realized",
                ]}
                labelFormatter={(label) => formatClock(Number(label))}
              />
              <Area
                type="stepAfter"
                dataKey="equity"
                stroke="var(--color-brass)"
                fill="var(--color-brass)"
                fillOpacity={0.16}
                strokeWidth={1.75}
                dot={false}
                isAnimationActive={false}
              />
              {showMtm && (
                <Area
                  type="monotone"
                  dataKey="mtm"
                  stroke="var(--color-sage)"
                  fill="transparent"
                  strokeWidth={1.25}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-line p-3">
        <Stat k="Win rate" v={snap.tradesClosed ? formatPct(snap.winRate, 0) : "—"} />
        <Stat k="Expectancy" v={snap.tradesClosed ? formatSignedUsd(snap.expectancy) : "—"} />
        <Stat k="Closed" v={String(snap.tradesClosed)} />
        <Stat k="Avg slip" v={snap.avgSlipBps ? formatBps(snap.avgSlipBps) : "—"} />
        <Stat k="Avg hold" v={snap.avgHoldSec ? formatDuration(snap.avgHoldSec) : "—"} />
        <Stat k="Open notional" v={formatUsd(snap.openNotional, 0)} />
      </dl>
    </Panel>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="font-mono text-sm tabular-nums">{v}</dd>
    </div>
  );
}

function Book({
  worldSim,
  positions,
  closes,
  snap,
  onSelect,
}: {
  worldSim: number;
  positions: ReturnType<typeof useFleet.getState>["world"]["positions"];
  closes: ReturnType<typeof useFleet.getState>["world"]["recentCloses"];
  snap: ReturnType<typeof snapshot>;
  onSelect: (id: string) => void;
}) {
  return (
    <Panel
      title="Book"
      action={
        <span className="font-mono text-xs text-muted">
          {snap.halted ? "exits only" : `${positions.length} open`}
        </span>
      }
    >
      {positions.length === 0 ? (
        <p className="px-3 py-4 text-sm text-muted">Flat. No open risk.</p>
      ) : (
        <ul>
          {positions.map((p) => {
            const pnl = positionPnl(p, worldSim);
            const last = markPrice(p, worldSim);
            const left = Math.max(0, p.deadlineSec - worldSim);
            return (
              <li key={p.runId} className="border-b border-line">
                <button
                  type="button"
                  onClick={() => onSelect(p.runId)}
                  className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-2"
                >
                  <span className="w-14 text-sm font-semibold">{p.symbol}</span>
                  <span className="min-w-0 flex-1 font-mono text-xs text-muted">
                    {formatPx(p.fillPrice)} → {formatPx(last)}
                    <span className="text-faint"> · {formatDuration(left)} left</span>
                  </span>
                  <span className={cx("font-mono text-xs tabular-nums", pnl >= 0 ? "text-sage" : "text-rust")}>
                    {formatSignedUsd(pnl)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="border-t border-line">
        <h3 className="px-3 pt-3 text-xs font-semibold tracking-widest text-muted">Last closes</h3>
        {closes.length === 0 ? (
          <p className="px-3 py-3 text-sm text-muted">No closes yet. Equity has not moved.</p>
        ) : (
          <ul className="pb-1">
            {closes.slice(0, 6).map((c) => (
              <li key={c.runId + c.reason}>
                <button
                  type="button"
                  onClick={() => onSelect(c.runId)}
                  className="flex min-h-11 w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-surface-2"
                >
                  <span className="w-14 text-sm">{c.symbol}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">
                    {c.reason} · {formatDuration(c.holdSec)}
                  </span>
                  <span className={cx("font-mono text-xs tabular-nums", c.pnl >= 0 ? "text-sage" : "text-rust")}>
                    {formatSignedUsd(c.pnl)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function Doctrine({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-bg/80 p-3 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="doctrine-title"
        className="max-h-[85dvh] w-full max-w-lg overflow-auto rounded-md border border-line bg-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="doctrine-title" className="text-lg font-semibold">
              Doctrine
            </h2>
            <p className="text-sm text-pretty text-muted">One direction. Each agent has one job.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close doctrine"
            className="inline-flex size-11 items-center justify-center rounded-md border border-line"
          >
            <X className="size-4" />
          </button>
        </div>
        <ol className="mt-4 flex flex-col gap-3 text-sm">
          <li>
            <span className="font-semibold">Scanner</span> surfaces pairs and spikes. It does not size or
            trade.
          </li>
          <li>
            <span className="font-semibold">Rug check</span> runs before any size. Fail discards that
            contract forever.
          </li>
          <li>
            <span className="font-semibold">Sizer</span> uses equity × risk, then cuts for volatility, pool
            depth, slippage, and gas. A circuit breaker lives here, reading drawdown — not as a seventh
            shared variable.
          </li>
          <li>
            <span className="font-semibold">Executor</span> fills, partially fills, or aborts. It does not
            reopen the thesis.
          </li>
          <li>
            <span className="font-semibold">Logger</span> appends every hop, including rejects. It never
            decides.
          </li>
          <li>
            <span className="font-semibold">Equity curve</span> updates when a trade closes and publishes
            that number back to the sizer.
          </li>
        </ol>
        <p className="mt-4 text-sm text-pretty text-muted">
          Shared mutable state is only realized equity and the append-only log. Replaying a candidate with
          the same inputs returns the same verdict and the same size. This desk is paper: no keys, no
          chain, no orders.
        </p>
      </div>
    </div>
  );
}

function KeelMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="var(--color-surface-2)" />
      <path
        d="M8 23.5 16 7.5 24 23.5"
        fill="none"
        stroke="var(--color-brass)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M11.2 19.5h9.6"
        stroke="var(--color-sage)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function parseSeed(raw: string): number {
  const t = raw.trim().toLowerCase().replace(/^0x/, "");
  if (!t) return DEFAULT_SEED;
  const hex = /[a-f]/.test(t);
  const n = hex ? Number.parseInt(t, 16) : Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_SEED;
  return n >>> 0;
}

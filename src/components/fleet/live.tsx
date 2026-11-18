import { useEffect, useState, type ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { Crosshair, ExternalLink, LineChart, Pause, Play, Radar, RotateCcw, Scale, ScrollText, ShieldAlert } from "lucide-react";
import { CHECK_ORDER, type AgentId, type Checks } from "@/lib/fleet/engine";
import {
  cx,
  formatAge,
  formatBps,
  formatDuration,
  formatPct,
  formatPx,
  formatSignedUsd,
  formatUsd,
} from "@/lib/fleet/format";
import { positionPnl, snapshotOf, type LiveRun } from "@/lib/fleet/live-book";
import { useLive } from "@/lib/fleet/live-store";
import { useWallet } from "@/lib/fleet/wallet-store";
import { WalletBar } from "@/components/fleet/wallet";

const AGENTS: { id: AgentId; n: string; name: string; role: string; icon: typeof Radar }[] = [
  { id: "scanner", n: "01", name: "Scanner", role: "Discovery only. No opinion.", icon: Radar },
  { id: "rug", n: "02", name: "Rug check", role: "Kill fast. Fail is forever.", icon: ShieldAlert },
  { id: "sizer", n: "03", name: "Sizer", role: "Equity × risk. Never a flat dollar.", icon: Scale },
  { id: "executor", n: "04", name: "Executor", role: "Fill or abort. No rethink.", icon: Crosshair },
  { id: "logger", n: "05", name: "Logger", role: "Append-only. Off the hot path.", icon: ScrollText },
  { id: "equity", n: "06", name: "Equity", role: "Moves on close. Feeds the sizer.", icon: LineChart },
];

const CHECKS: { key: keyof Checks; label: string }[] = [
  { key: "honeypot", label: "Honeypot" },
  { key: "blacklist", label: "Blacklist" },
  { key: "mint_auth", label: "Mint authority" },
  { key: "freeze_auth", label: "Freeze" },
  { key: "tax_ok", label: "Tax" },
  { key: "lp_locked_or_burned", label: "LP lock" },
  { key: "deployer_ok", label: "Deployer" },
  { key: "holder_conc_ok", label: "Holders" },
  { key: "age_ok", label: "Age" },
  { key: "renounced", label: "Ownership" },
];

type Tab = "tape" | "curve" | "book" | "log";
type ChainFilter = "all" | "solana" | "base";

export function LiveDesk({ onPaper }: { onPaper: () => void }) {
  const book = useLive((s) => s.book);
  const paused = useLive((s) => s.paused);
  const status = useLive((s) => s.status);
  const note = useLive((s) => s.note);
  const error = useLive((s) => s.error);
  const updatedAt = useLive((s) => s.updatedAt);
  const hydrate = useLive((s) => s.hydrate);
  const refresh = useLive((s) => s.refresh);
  const setPaused = useLive((s) => s.setPaused);
  const setParam = useLive((s) => s.setParam);
  const reset = useLive((s) => s.reset);

  const [tab, setTab] = useState<Tab>("tape");
  const [chain, setChain] = useState<ChainFilter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    hydrate();
    void refresh();
  }, [hydrate, refresh]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(id);
  }, [paused, refresh]);

  const snap = snapshotOf(book, new Map(Object.entries(book.quotes)));
  const watch = book.watch.filter((row) => chain === "all" || row.chain === chain);
  const runs = new Map(book.runs.map((run) => [run.runId, run]));
  const run = book.runs.find((item) => item.runId === selected) ?? book.runs.find((item) => item.runId === watch[0]?.runId) ?? null;
  const statusLabel = status === "error" ? "FEED DOWN" : paused ? "PAUSED" : status === "loading" || status === "idle" ? "CONNECTING" : snap.halted ? "HALTED" : "LIVE";

  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg text-fg">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-3 py-3 lg:px-4">
          <div className="flex items-center gap-3">
            <Mark />
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg font-semibold tracking-widest">KEEL</h1>
                <span className="font-mono text-xs text-muted">LIVE MARKETS</span>
              </div>
              <p className="text-sm text-muted">Scanner, rug check, sizer, executor. Logger and equity stay off the hot path.</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-5">
            <div className="text-right">
              <div className="font-mono text-xs text-muted">{updatedAt ? clock(updatedAt) : "—"} UTC</div>
              <div className="mt-1 flex items-center justify-end gap-2 text-sm">
                <span
                  className={cx(
                    "inline-block size-2 rounded-full",
                    statusLabel === "LIVE" && "bg-sage lamp-live",
                    (statusLabel === "HALTED" || statusLabel === "FEED DOWN") && "bg-rust",
                    (statusLabel === "PAUSED" || statusLabel === "CONNECTING") && "bg-brass",
                  )}
                />
                <span className={statusLabel === "HALTED" || statusLabel === "FEED DOWN" ? "text-rust" : "text-fg"}>{statusLabel}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs text-muted">PAPER EQUITY</div>
              <div className="font-mono text-2xl font-medium tabular-nums text-brass">{formatUsd(snap.equity, 0)}</div>
              <div className={cx("font-mono text-xs tabular-nums", book.lastPnl == null ? "text-muted" : book.lastPnl >= 0 ? "text-sage" : "text-rust")}>
                {book.lastPnl == null ? "no close yet" : `last close ${formatSignedUsd(book.lastPnl)}`}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-line bg-surface">
        <p className="mx-auto max-w-[1440px] px-3 py-2 text-sm text-pretty text-muted lg:px-4">
          Live Solana and Base. The scanner emits the top 20 and does not size. Rug check runs before any size, and a fail is discarded. The sizer reads realized equity only. The executor fills or aborts on slippage. Nothing here is a fixed dollar bet.
        </p>
      </div>

      <WalletBar book={book} />

      <div className="border-b border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-3 py-3 lg:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="inline-flex h-11 items-center gap-2 rounded-md bg-brass px-4 text-sm font-medium text-brass-ink" onClick={() => setPaused(!paused)}>
              {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
              {paused ? "Run" : "Pause"}
            </button>
            <button type="button" className="inline-flex h-11 items-center rounded-md border border-line bg-surface px-3 text-sm" onClick={() => void refresh()}>
              Refresh
            </button>
            <Seg value={chain} options={[{ id: "all", label: "All" }, { id: "solana", label: "Solana" }, { id: "base", label: "Base" }]} onChange={(id) => setChain(id as ChainFilter)} />
            <button type="button" className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm" onClick={() => { reset(); void refresh(); }}>
              <RotateCcw className="size-4" />
              Reset book
            </button>
            <button type="button" className="inline-flex h-11 items-center rounded-md border border-line bg-surface px-3 text-sm" onClick={onPaper}>
              Paper sim
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Slider label="Max risk / trade" display={formatPct(book.params.maxRiskPct, 2)} min={0.002} max={0.02} step={0.001} value={book.params.maxRiskPct} onChange={(v) => setParam("maxRiskPct", v)} />
            <Slider label="Max size vs pool" display={formatPct(book.params.maxPoolPct, 1)} min={0.005} max={0.03} step={0.001} value={book.params.maxPoolPct} onChange={(v) => setParam("maxPoolPct", v)} />
            <Slider label="Halt entries at drawdown" display={formatPct(book.params.ddHaltPct, 0)} min={0.05} max={0.3} step={0.01} value={book.params.ddHaltPct} onChange={(v) => setParam("ddHaltPct", v)} />
          </div>
        </div>
      </div>

      {(error || note || snap.halted) && (
        <div className={cx("border-b border-line", error || snap.halted ? "bg-rust-dim" : "bg-surface")}>
          <p className={cx("mx-auto max-w-[1440px] px-3 py-2 text-sm lg:px-4", error || snap.halted ? "text-rust" : "text-muted")}>
            {error
              ? error
              : snap.halted
                ? `Entries halted. Drawdown ${formatPct(snap.drawdownPct)} is through the ${formatPct(book.params.ddHaltPct, 0)} circuit. Exits still mark.`
                : note}
          </p>
        </div>
      )}

      <main className="mx-auto grid w-full max-w-[1440px] gap-3 px-3 py-3 lg:grid-cols-[16rem_minmax(0,1fr)_22rem] lg:px-4">
        <aside className="min-w-0 lg:sticky lg:top-3 lg:self-start">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {AGENTS.map((agent) => {
              const Icon = agent.icon;
              const active = book.logs[0]?.agent === agent.id;
              return (
                <article key={agent.id} className={cx("min-w-[11.5rem] shrink-0 rounded-md border bg-surface p-3 lg:min-w-0", active ? "border-brass" : "border-line")}>
                  <div className="flex items-center gap-2">
                    <Icon className={cx("size-4", active ? "text-brass" : "text-muted")} />
                    <span className="font-mono text-xs text-faint">{agent.n}</span>
                    <h2 className="text-sm font-semibold">{agent.name}</h2>
                  </div>
                  <p className="mt-1 hidden text-xs text-pretty text-muted lg:block">{agent.role}</p>
                  <p className="mt-2 font-mono text-xs tabular-nums">{stat(agent.id, book.counts)}</p>
                </article>
              );
            })}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="grid grid-cols-4 gap-1 lg:hidden">
            {(["tape", "curve", "book", "log"] as Tab[]).map((id) => (
              <button key={id} type="button" aria-pressed={tab === id} className={cx("h-11 rounded-md border text-sm capitalize", tab === id ? "border-brass bg-brass text-brass-ink" : "border-line bg-surface")} onClick={() => setTab(id)}>
                {id === "curve" ? "Curve" : id === "tape" ? "Tape" : id === "book" ? "Book" : "Log"}
              </button>
            ))}
          </div>
          <section className={cx(tab !== "tape" && "max-lg:hidden")}>
            <Panel title="Live tape" action={<span className="font-mono text-xs text-muted">{watch.length} cleared floors</span>}>
              {watch.length === 0 ? (
                <p className="px-3 py-6 text-sm text-muted">
                  {status === "error" ? "No fresh pairs this pass." : "Reading Solana and Base. Pools under the liquidity, age, and volume floors stay off the tape."}
                </p>
              ) : (
                <div className="max-h-80 overflow-auto">
                  {watch.map((row) => {
                    const item = runs.get(row.runId);
                    return (
                      <button key={row.runId} type="button" onClick={() => { setSelected(row.runId); setTab("tape"); }} className={cx("flex w-full items-start gap-3 border-b border-line px-3 py-2.5 text-left", run?.runId === row.runId ? "bg-surface-2" : "hover:bg-surface-2")}>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-semibold">
                              {row.symbol}
                              <span className="ml-2 font-mono text-xs font-normal text-muted">{row.chain === "solana" ? "SOL" : "BASE"}</span>
                            </span>
                            <Outcome run={item} />
                          </span>
                          <span className="mt-0.5 block truncate text-sm text-muted">{item?.scanner.reason ?? row.pair}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Panel>
          </section>
          <section className={cx(tab !== "tape" && "max-lg:hidden")}>
            <HandOff run={run} />
          </section>
          <section className={cx(tab !== "log" && "max-lg:hidden")}>
            <Panel title="Audit log">
              <div className="max-h-64 overflow-auto">
                {book.logs.length === 0 ? (
                  <p className="px-3 py-6 text-sm text-muted">No hops yet.</p>
                ) : (
                  book.logs.slice(0, 80).map((event) => (
                    <button key={event.id} type="button" onClick={() => setSelected(event.runId)} className="flex w-full flex-col gap-0.5 border-b border-line px-3 py-2 text-left hover:bg-surface-2 sm:flex-row sm:items-baseline sm:gap-3">
                      <span className="w-16 shrink-0 font-mono text-xs text-faint">{clock(event.ts)}</span>
                      <span className="w-16 shrink-0 font-mono text-xs text-muted">{event.agent}</span>
                      <span className="w-16 shrink-0 text-sm font-medium">{event.symbol}</span>
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
            <Panel title="Equity curve">
              <div className="px-3 pt-3">
                <div className="flex items-baseline justify-between">
                  <p className="font-mono text-2xl tabular-nums text-brass">{formatUsd(snap.equity, 0)}</p>
                  <p className={cx("font-mono text-sm", snap.drawdownPct > 0 ? "text-rust" : "text-sage")}>DD {formatPct(snap.drawdownPct)}</p>
                </div>
                <p className="text-xs text-muted">Published on close only. The sizer cannot see unrealized.</p>
              </div>
              <div className="h-40 px-1">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={book.curve} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
                      <YAxis hide domain={["auto", "auto"]} />
                      <Tooltip
                        contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: 8, color: "var(--color-fg)", fontSize: 12 }}
                        formatter={(value, name) => [formatUsd(Number(value ?? 0), 0), name === "mtm" ? "Mark" : "Realized"]}
                        labelFormatter={(label) => clock(Number(label))}
                      />
                      <Area type="stepAfter" dataKey="equity" stroke="var(--color-brass)" fill="var(--color-brass)" fillOpacity={0.16} strokeWidth={1.75} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-3 border-t border-line p-3">
                <Stat k="Win rate" v={snap.tradesClosed ? formatPct(snap.winRate, 0) : "—"} />
                <Stat k="Expectancy" v={snap.tradesClosed ? formatSignedUsd(snap.expectancy) : "—"} />
                <Stat k="Closed" v={String(snap.tradesClosed)} />
                <Stat k="Avg slip" v={snap.avgSlipBps ? formatBps(snap.avgSlipBps) : "—"} />
                <Stat k="Avg hold" v={snap.avgHoldSec ? formatDuration(snap.avgHoldSec) : "—"} />
                <Stat k="Open notional" v={formatUsd(snap.openNotional, 0)} />
              </dl>
            </Panel>
          </section>
          <section className={cx(tab !== "book" && "max-lg:hidden")}>
            <Panel title="Book" action={<span className="font-mono text-xs text-muted">{book.positions.length} open</span>}>
              {book.positions.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted">Flat. Nothing has passed rug check and the sizer.</p>
              ) : (
                <ul>
                  {book.positions.map((position) => {
                    const pnl = positionPnl(position, book.quotes[position.token]);
                    return (
                      <li key={position.runId} className="border-b border-line">
                        <button type="button" onClick={() => setSelected(position.runId)} className="flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-2">
                          <span className="w-16 text-sm font-semibold">{position.symbol}</span>
                          <span className="min-w-0 flex-1 font-mono text-xs text-muted">{formatPx(position.fillPrice)}</span>
                          <span className={cx("font-mono text-xs tabular-nums", pnl == null ? "text-muted" : pnl >= 0 ? "text-sage" : "text-rust")}>{pnl == null ? "…" : formatSignedUsd(pnl)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="border-t border-line px-3 py-3">
                <h3 className="text-xs font-semibold tracking-widest text-muted">Last closes</h3>
                {book.closes.length === 0 ? (
                  <p className="pt-2 text-sm text-muted">No closes yet.</p>
                ) : (
                  book.closes.slice(0, 5).map((close) => (
                    <button key={close.runId + close.reason} type="button" onClick={() => setSelected(close.runId)} className="flex min-h-11 w-full items-center gap-3 text-left">
                      <span className="w-16 text-sm">{close.symbol}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-muted">{close.reason} · {formatDuration(close.holdSec)}</span>
                      <span className={cx("font-mono text-xs", close.pnl >= 0 ? "text-sage" : "text-rust")}>{formatSignedUsd(close.pnl)}</span>
                    </button>
                  ))
                )}
              </div>
            </Panel>
          </section>
        </div>
      </main>
    </div>
  );
}

function PhantomBuy({ run }: { run: LiveRun }) {
  const fills = useWallet((s) => s.fills);
  const sent = fills.find((fill) => fill.mint === run.token);
  if (run.chain !== "solana") return <p className="text-sm text-muted">Base stays quoted. The bot wallet signs Solana only.</p>;
  if (run.rug?.verdict !== "PASS") return <p className="text-sm text-muted">The executor will not touch this until rug check passes.</p>;
  return (
    <p className="border-t border-line pt-3 text-sm text-pretty text-muted">
      {sent
        ? `${sent.action} ${sent.status}. ${sent.reason}`
        : "No popup. If the bot wallet can cover the sizer, this name is signed on the next pass."}
    </p>
  );
}

function HandOff({ run }: { run: LiveRun | null }) {
  const [contract, setContract] = useState(false);
  if (!run) {
    return (
      <Panel title="Hand-off">
        <p className="px-3 py-6 text-sm text-muted">The scanner has not cleared a pool yet.</p>
      </Panel>
    );
  }
  const schema = {
    scanner: run.scanner,
    rug: run.rug,
    sizer: run.sizer,
    executor: run.exit ?? run.entry,
  };
  return (
    <Panel
      title="Hand-off"
      action={
        <div className="flex items-center gap-2">
          <button type="button" className="h-9 rounded-md border border-line px-2 text-xs" onClick={() => setContract((open) => !open)}>
            {contract ? "Hide schema" : "Schema"}
          </button>
          <a href={run.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1 rounded-md border border-line px-2 text-xs">
            Open pair <ExternalLink className="size-3" />
          </a>
        </div>
      }
    >
      <div className="flex flex-col gap-3 p-3">
        <div>
          <h3 className="text-lg font-semibold">{run.symbol}</h3>
          <p className="break-all font-mono text-xs text-muted">{run.token}</p>
        </div>
        {!run.rug ? (
          <p className="text-sm text-muted">Rug check has not reported. The sizer will not run.</p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {CHECKS.slice().sort((a, b) => CHECK_ORDER.indexOf(a.key) - CHECK_ORDER.indexOf(b.key)).map((item) => {
                const ok = run.rug?.checks[item.key];
                return (
                  <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted">{item.label}</span>
                    <span className={ok ? "font-medium text-sage" : "font-medium text-rust"}>{ok ? "Clear" : "Fail"}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-sm">
              <span className="text-muted">Rug check · </span>
              <span className={run.rug.verdict === "PASS" ? "text-sage" : "text-rust"}>{run.rug.verdict}</span>
              <span className="text-muted"> · {run.rug.reason}</span>
            </p>
          </>
        )}
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
                <Line k="Max slip" v={formatBps(run.sizer.max_slippage_bps)} />
                <Line k="Equity" v={formatUsd(run.sizer.equity_at_decision, 0)} />
              </>
            ) : (
              <p className="text-sm text-muted">{run.rug?.verdict === "FAIL" ? "Not called." : "Waiting on rug check."}</p>
            )}
          </Block>
          <Block title="Executor">
            {run.entry ? (
              <>
                <Line k="Entry" v={run.entry.status} />
                <Line k="Fill" v={run.entry.fill_price ? formatPx(run.entry.fill_price) : "—"} />
                <Line k="Exit" v={run.exit ? run.exit.reason : run.status === "open" ? "working" : "—"} />
              </>
            ) : (
              <p className="text-sm text-muted">No order. Nothing is signed.</p>
            )}
          </Block>
        </div>
        {run.sizer && <p className="text-sm text-pretty text-muted">{run.sizer.reason}</p>}
        {contract && (
          <pre className="max-h-64 overflow-auto rounded-md border border-line bg-bg p-3 font-mono text-xs leading-relaxed text-fg">
            {JSON.stringify(schema, null, 2)}
          </pre>
        )}
        <PhantomBuy run={run} />
      </div>
    </Panel>
  );
}

function Outcome({ run }: { run: LiveRun | undefined }) {
  if (!run || run.status === "pending") return <Chip tone="brass">RUG</Chip>;
  if (run.status === "fail") return <Chip tone="rust">FAIL</Chip>;
  if (run.status === "skip") return <Chip tone="brass">NO SIZE</Chip>;
  if (run.status === "aborted") return <Chip tone="rust">ABORT</Chip>;
  if (run.status === "open") return <Chip tone="sage">OPEN</Chip>;
  return <span className={cx("font-mono text-xs tabular-nums", (run.pnl ?? 0) >= 0 ? "text-sage" : "text-rust")}>{formatSignedUsd(run.pnl ?? 0)}</span>;
}

function Chip({ tone, children }: { tone: "rust" | "sage" | "brass"; children: ReactNode }) {
  return <span className={cx("inline-flex h-6 items-center rounded-md px-2 font-mono text-xs", tone === "rust" && "bg-rust-dim text-rust", tone === "sage" && "bg-sage-dim text-sage", tone === "brass" && "bg-surface-2 text-brass")}>{children}</span>;
}

function stat(id: AgentId, counts: BookCounts): string {
  if (id === "scanner") return `${counts.scanned} emitted`;
  if (id === "rug") return `${counts.rugFail} killed · ${counts.rugPass} pass`;
  if (id === "sizer") return `${counts.sized} sized · ${counts.sizeZero} zero`;
  if (id === "executor") return `${counts.filled} fill · ${counts.aborted} abort`;
  if (id === "logger") return `${counts.logged} rows`;
  return `${counts.closed} closes`;
}

type BookCounts = ReturnType<typeof useLive.getState>["book"]["counts"];

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
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

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="font-mono text-sm tabular-nums">{v}</dd>
    </div>
  );
}

function Seg({ value, options, onChange }: { value: string; options: { id: string; label: string }[]; onChange: (id: string) => void }) {
  return (
    <div className="flex h-11 rounded-md border border-line bg-surface p-1">
      {options.map((opt) => (
        <button key={opt.id} type="button" aria-pressed={value === opt.id} className={cx("rounded-md px-3 text-sm", value === opt.id ? "bg-brass text-brass-ink" : "text-fg")} onClick={() => onChange(opt.id)}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Slider({ label, display, min, max, step, value, onChange }: { label: string; display: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex min-w-0 flex-col gap-2 py-1">
      <span className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-mono tabular-nums">{display}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} className="h-6 w-full accent-brass" />
    </label>
  );
}

function Mark() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="var(--color-surface-2)" />
      <path d="M8 23.5 16 7.5 24 23.5" fill="none" stroke="var(--color-brass)" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M11.2 19.5h9.6" stroke="var(--color-sage)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function clock(ms: number): string {
  return new Date(ms).toISOString().slice(11, 19);
}

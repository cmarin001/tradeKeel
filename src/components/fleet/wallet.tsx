import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { Book } from "@/lib/fleet/live-book";
import { cx, formatUsd } from "@/lib/fleet/format";
import { BOT_ADDRESS, importPhantomPhrase, storedWallet } from "@/lib/fleet/hot-wallet";
import { useWallet, type AutoFill } from "@/lib/fleet/wallet-store";

export function WalletBar({ book }: { book: Book }) {
  const sol = useWallet((s) => s.sol);
  const solPrice = useWallet((s) => s.solPrice);
  const running = useWallet((s) => s.running);
  const busy = useWallet((s) => s.busy);
  const error = useWallet((s) => s.error);
  const notice = useWallet((s) => s.notice);
  const fills = useWallet((s) => s.fills);
  const positions = useWallet((s) => s.positions);
  const bags = useWallet((s) => s.bags);
  const boot = useWallet((s) => s.boot);
  const setRunning = useWallet((s) => s.setRunning);
  const tick = useWallet((s) => s.tick);
  const [revealed, setRevealed] = useState(false);
  const [stored, setStored] = useState<{ address: string; phantomKey: string } | null>(null);
  const [looked, setLooked] = useState(false);

  const bookRef = useRef(book);
  bookRef.current = book;

  useEffect(() => {
    boot();
    setStored(storedWallet());
    setLooked(true);
  }, [boot]);

  useEffect(() => {
    const run = () => {
      const current = bookRef.current;
      void tick({ runs: current.runs, quotes: current.quotes, params: current.params });
    };
    const id = window.setInterval(run, 15_000);
    const first = window.setTimeout(run, 1500);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(first);
    };
  }, [tick]);

  const equity = sol != null && solPrice != null ? sol * solPrice : null;

  return (
    <section className="border-b border-line">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-3 py-3 lg:px-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={cx("inline-flex h-11 items-center rounded-md px-4 text-sm font-medium", running ? "bg-rust text-brass-ink" : "bg-brass text-brass-ink")}
            onClick={() => setRunning(!running)}
          >
            {running ? "Halt entries" : "Resume entries"}
          </button>
          <div className="min-w-0">
            <p className="break-all font-mono text-xs">
              <a className="text-sage" href="https://solscan.io/account/5UB4r3pAgeMtkLpUNVmZ8TPpdDmqx6178b21K1VuUTbC" target="_blank" rel="noreferrer">
                5UB4r3pAgeMtkLpUNVmZ8TPpdDmqx6178b21K1VuUTbC
              </a>
            </p>
            <p className="text-sm text-muted">
              {sol == null ? "Reading balance…" : `${sol.toFixed(3)} SOL`}
              {equity != null ? ` · ${formatUsd(equity, 0)} in SOL` : ""}
              {bags.length ? ` · ${bags.length} bag${bags.length === 1 ? "" : "s"}` : ""}
              {busy ? " · signing" : ""}
              {positions.length ? ` · ${positions.length} open` : ""}
            </p>
          </div>
        </div>
        <p className="text-sm text-pretty text-muted">
          Buys follow Phantom's trending list and skip thin, unverified, or already-falling names. A bad fill sells faster: the stop sits 5% under the high and no more than 6% under the mark.
        </p>
        {bags.length > 0 && (
          <ul className="flex flex-col">
            {bags.map((bag) => {
              const usd = bag.price != null ? bag.ui * bag.price : null;
              const change = bag.price != null && bag.markPx > 0 ? bag.price / bag.markPx - 1 : null;
              const stopOff = bag.highPx > 0 ? 1 - bag.stopPx / bag.highPx : 0.05;
              return (
                <li key={bag.mint} className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="w-16 font-semibold">{bag.symbol}</span>
                  <span className="font-mono text-xs text-muted">{usd == null ? "pricing…" : formatUsd(usd, 2)}</span>
                  <span className={cx("font-mono text-xs", change == null ? "text-muted" : change >= 0 ? "text-sage" : "text-rust")}>
                    {change == null ? "mark set" : `${change >= 0 ? "+" : ""}${(change * 100).toFixed(1)}%`}
                  </span>
                  <span className="text-xs text-muted">trail {Math.round(stopOff * 100)}% under the high</span>
                </li>
              );
            })}
          </ul>
        )}
        {looked && stored?.address === BOT_ADDRESS ? (
          <KeyLine stored={stored} revealed={revealed} onToggle={() => setRevealed((open) => !open)} />
        ) : looked ? (
          <ImportPhrase
            onSaved={() => {
              setStored(storedWallet());
              setRevealed(false);
            }}
          />
        ) : null}
        {(error || notice) && <p className={cx("text-sm", error ? "text-rust" : "text-muted")}>{error ?? notice}</p>}
        {fills.length > 0 && (
          <ul className="flex flex-col">
            {fills.slice(0, 4).map((fill) => (
              <FillRow key={fill.id} fill={fill} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function ImportPhrase({ onSaved }: { onSaved: () => void }) {
  const [phrase, setPhrase] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          importPhantomPhrase(phrase);
          setPhrase("");
          setMessage(null);
          onSaved();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Import failed.");
        }
      }}
    >
      <label className="text-sm text-muted" htmlFor="phantom-phrase">
        Paste the Phantom recovery phrase here, not in chat. It is checked in this browser and saved only if it opens 5UB4….
      </label>
      <textarea
        id="phantom-phrase"
        className="min-h-24 rounded-md border border-line bg-bg px-3 py-2 text-sm"
        autoComplete="off"
        spellCheck={false}
        value={phrase}
        onChange={(event) => setPhrase(event.target.value)}
      />
      <button type="submit" className="inline-flex h-11 w-fit items-center rounded-md bg-brass px-4 text-sm font-medium text-brass-ink">
        Unlock this browser
      </button>
      {message && <p className="text-sm text-rust">{message}</p>}
    </form>
  );
}

function KeyLine({
  stored,
  revealed,
  onToggle,
}: {
  stored: { address: string; phantomKey: string } | null;
  revealed: boolean;
  onToggle: () => void;
}) {
  if (!stored) {
    return (
      <p className="text-sm text-rust">
        This browser does not have the private key for {BOT_ADDRESS}. The address on screen is only the public account. The key was saved in the browser that created it, and it cannot be recovered from here.
      </p>
    );
  }
  if (stored.address !== BOT_ADDRESS) {
    return (
      <p className="text-sm text-rust">
        This browser has a different wallet, {stored.address}. It is not the funded address.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="inline-flex h-11 w-fit items-center rounded-md border border-line bg-surface px-3 text-sm" onClick={onToggle}>
        {revealed ? "Hide private key" : "Show private key"}
      </button>
      {revealed && (
        <div className="flex flex-col gap-2">
          <p className="break-all font-mono text-xs">{stored.phantomKey}</p>
          <p className="text-sm text-muted">Phantom can import this private key. It is not a word phrase. Anyone with it can move the SOL.</p>
        </div>
      )}
    </div>
  );
}

function FillRow({ fill }: { fill: AutoFill }) {
  return (
    <li className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="w-16 font-semibold">{fill.symbol}</span>
      <span className="font-mono text-xs text-muted">{fill.action}</span>
      <span className={cx("font-mono text-xs", fill.status === "confirmed" ? "text-sage" : fill.status === "failed" || fill.status === "aborted" ? "text-rust" : "text-brass")}>
        {fill.status}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-muted">{fill.reason}</span>
      {fill.signature && (
        <a className="inline-flex items-center gap-1 font-mono text-xs text-sage" href={`https://solscan.io/tx/${fill.signature}`} target="_blank" rel="noreferrer">
          {fill.signature.slice(0, 8)}… <ExternalLink className="size-3" />
        </a>
      )}
    </li>
  );
}

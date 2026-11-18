import { create } from "zustand";
import { applyPull, blankBook, logDrop, type Book } from "./live-book";
import { pullMarkets, checkSecurity } from "./markets";
import type { Params } from "./engine";

const KEY = "keel-live-v1";

type LiveStore = {
  book: Book;
  paused: boolean;
  status: "idle" | "loading" | "live" | "error";
  note: string | null;
  error: string | null;
  updatedAt: number;
  ready: boolean;
  hydrate: () => void;
  refresh: () => Promise<void>;
  setPaused: (paused: boolean) => void;
  setParam: (key: keyof Params, value: number) => void;
  reset: () => void;
};

let seq = 0;

function sane(value: unknown): Book | null {
  if (!value || typeof value !== "object") return null;
  const book = value as Book;
  if (typeof book.equity !== "number" || !book.params || !Array.isArray(book.runs)) return null;
  return {
    ...blankBook(),
    ...book,
    quotes: book.quotes ?? {},
    noted: book.noted ?? {},
    decided: book.decided ?? {},
    condemned: book.condemned ?? {},
    counts: { ...blankBook().counts, ...book.counts },
  };
}

function read(): Book | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return sane(JSON.parse(localStorage.getItem(KEY) ?? ""));
  } catch {
    return null;
  }
}

function write(book: Book): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(book));
  } catch {
    /* a full log is not worth breaking the desk */
  }
}

export const useLive = create<LiveStore>((set, get) => ({
  book: blankBook(),
  paused: false,
  status: "idle",
  note: null,
  error: null,
  updatedAt: 0,
  ready: false,
  hydrate: () => {
    if (get().ready) return;
    const stored = read();
    set({ book: stored ?? blankBook(), ready: true });
  },
  refresh: async () => {
    const id = ++seq;
    if (get().status === "idle") set({ status: "loading" });
    const book = get().book;
    try {
      const pull = await pullMarkets({
        data: {
          solana: book.positions.filter((position) => position.chain === "solana").map((position) => position.token),
          base: book.positions.filter((position) => position.chain === "base").map((position) => position.token),
        },
      });
      if (id !== seq) return;
      const seen = applyPull(get().book, pull, Date.now());
      write(seen);
      set({ book: seen, status: "live", note: pull.note, error: null, updatedAt: pull.scannedAt });
      const pending = pull.rows.filter((row) => !row.rug && !seen.decided[row.runId] && !seen.condemned[row.token]).slice(0, 6);
      if (pending.length === 0) return;
      let checked: Awaited<ReturnType<typeof checkSecurity>>;
      try {
        checked = await checkSecurity({
          data: { tokens: pending.map((row) => ({ token: row.token, chain: row.chain, ageSec: row.ageSec })) },
        });
      } catch (error) {
        if (id !== seq) return;
        const raw = error instanceof Error ? error.message : "Rug check did not answer.";
        const message = raw.replace(/\s+/g, " ").slice(0, 140) || "Rug check did not answer.";
        const dropped = logDrop(get().book, pending, message, Date.now());
        write(dropped);
        set({
          book: dropped,
          status: "live",
          note: "Rug check missed this batch. Those names were logged and dropped. The sizer was not called.",
          error: null,
        });
        return;
      }
      if (id !== seq) return;
      const byToken = new Map(checked.rugs.map((item) => [item.token, item.rug]));
      const rows = pull.rows.map((row) => ({ ...row, rug: row.rug ?? byToken.get(row.token) ?? null }));
      const owed = rows.filter((row) => !row.rug).length;
      const note =
        checked.note ??
        (owed > 0 ? `Rug check still owes ${owed} contract${owed === 1 ? "" : "s"}. They are not sized yet.` : null);
      const next = applyPull(get().book, { ...pull, rows, note }, Date.now());
      write(next);
      set({ book: next, status: "live", note, error: null });
    } catch (error) {
      if (id !== seq) return;
      const raw = error instanceof Error ? error.message : "Market feed did not answer.";
      const message = raw.replace(/\s+/g, " ").slice(0, 160) || "Market feed did not answer.";
      set({ status: "error", error: message });
    }
  },
  setPaused: (paused) => set({ paused }),
  setParam: (key, value) =>
    set((state) => {
      const book = { ...state.book, params: { ...state.book.params, [key]: value } };
      write(book);
      return { book };
    }),
  reset: () => {
    const book = blankBook();
    write(book);
    seq += 1;
    set({ book, note: null, error: null, status: "idle", updatedAt: 0 });
  },
}));

import { Buffer } from "buffer";
import { Connection, LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { buildSwap } from "./swap";

if (typeof globalThis.Buffer === "undefined") {
  (globalThis as { Buffer?: typeof Buffer }).Buffer = Buffer;
}

const RPCS = ["https://solana-rpc.publicnode.com", "https://api.mainnet-beta.solana.com"];

type PhantomProvider = {
  isPhantom?: boolean;
  publicKey?: { toString(): string } | null;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>;
  signAndSendTransaction: (tx: VersionedTransaction) => Promise<{ signature: string }>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function provider(): PhantomProvider | null {
  const host = globalThis as { solana?: PhantomProvider; phantom?: { solana?: PhantomProvider } };
  const sol = host.phantom?.solana ?? host.solana;
  return sol?.isPhantom ? sol : null;
}

export function phantomHere(): boolean {
  return provider() != null;
}

export function framed(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export async function connectPhantom(onlyIfTrusted = false): Promise<string> {
  const sol = provider();
  if (!sol) throw new Error("Phantom is not in this window.");
  const res = await sol.connect(onlyIfTrusted ? { onlyIfTrusted: true } : undefined);
  return res.publicKey.toString();
}

export async function solBalance(owner: string): Promise<number> {
  let last = "Balance lookup failed.";
  for (const rpc of RPCS) {
    try {
      const connection = new Connection(rpc, "confirmed");
      const lamports = await connection.getBalance(new PublicKey(owner), "confirmed");
      return lamports / LAMPORTS_PER_SOL;
    } catch (error) {
      last = error instanceof Error ? error.message : last;
    }
  }
  throw new Error(last);
}

export async function signatureState(signature: string): Promise<"pending" | "confirmed" | "failed"> {
  for (const rpc of RPCS) {
    try {
      const connection = new Connection(rpc, "confirmed");
      const status = await connection.getSignatureStatuses([signature]);
      const row = status.value[0];
      if (!row) return "pending";
      if (row.err) return "failed";
      if (row.confirmationStatus === "confirmed" || row.confirmationStatus === "finalized") return "confirmed";
      return "pending";
    } catch {
      /* try the next RPC */
    }
  }
  return "pending";
}

function decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export type BuiltBuy = {
  signature: string | null;
  aborted: boolean;
  lamports: number;
  outAmount: string;
  impactBps: number;
};

export async function signBuy(mint: string, slippageBps: number, lamports: number): Promise<BuiltBuy> {
  const sol = provider();
  if (!sol) throw new Error("Phantom is not in this window.");
  const owner = sol.publicKey?.toString() ?? (await sol.connect()).publicKey.toString();
  const built = await buildSwap({
    data: {
      owner,
      inputMint: "So11111111111111111111111111111111111111112",
      outputMint: mint,
      amount: String(lamports),
      slippageBps,
    },
  });
  if (built.aborted || !built.swapTransaction) {
    return { signature: null, aborted: true, lamports, outAmount: built.outAmount, impactBps: built.impactBps };
  }
  const tx = VersionedTransaction.deserialize(decode(built.swapTransaction));
  const sent = await sol.signAndSendTransaction(tx);
  return {
    signature: sent.signature,
    aborted: false,
    lamports,
    outAmount: built.outAmount,
    impactBps: built.impactBps,
  };
}

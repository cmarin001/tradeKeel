import { wordlist } from "@scure/bip39/wordlists/english.js";
import { mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { derivePath } from "ed25519-hd-key";
import { Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { buildSwap } from "./swap";

const RPCS = ["https://solana-rpc.publicnode.com", "https://api.mainnet-beta.solana.com"];
const SECRET = "keel-bot-secret";
export const BOT_ADDRESS = "5UB4r3pAgeMtkLpUNVmZ8TPpdDmqx6178b21K1VuUTbC";
const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function encodeBase58(bytes: Uint8Array): string {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      const value = digits[i] * 256 + carry;
      digits[i] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let zeros = 0;
  for (const byte of bytes) {
    if (byte !== 0) break;
    zeros += 1;
  }
  return `${"1".repeat(zeros)}${digits
    .reverse()
    .map((digit) => BASE58[digit])
    .join("")}`;
}

function connection(): Connection {
  return new Connection(RPCS[0], "confirmed");
}

export function loadBotKey(): Keypair | null {
  const found = readStoredKey();
  if (!found || found.address !== BOT_ADDRESS) return null;
  return found.key;
}

export function storedWallet(): { address: string; phantomKey: string } | null {
  const found = readStoredKey();
  if (!found) return null;
  return { address: found.address, phantomKey: found.phantomKey };
}

export function importPhantomPhrase(phrase: string): string {
  const words = phrase.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const mnemonic = words.join(" ");
  if (![12, 24].includes(words.length) || !validateMnemonic(mnemonic, wordlist)) {
    throw new Error("That is not a 12-word or 24-word phrase.");
  }
  const seed = mnemonicToSeedSync(mnemonic);
  const hex = [...seed].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  for (let account = 0; account < 10; account++) {
    const derived = derivePath(`m/44'/501'/${account}'/0'`, hex);
    const key = Keypair.fromSeed(derived.key);
    if (key.publicKey.toBase58() !== BOT_ADDRESS) continue;
    localStorage.setItem(SECRET, JSON.stringify(Array.from(key.secretKey)));
    return BOT_ADDRESS;
  }
  throw new Error("That phrase does not open 5UB4…. Nothing was saved.");
}

function readStoredKey(): { key: Keypair; address: string; phantomKey: string } | null {
  if (typeof localStorage === "undefined") return null;
  const existing = localStorage.getItem(SECRET);
  if (!existing) return null;
  try {
    const bytes = JSON.parse(existing) as number[];
    if (!Array.isArray(bytes) || bytes.length !== 64) return null;
    const key = Keypair.fromSecretKey(Uint8Array.from(bytes));
    return { key, address: key.publicKey.toBase58(), phantomKey: encodeBase58(key.secretKey) };
  } catch {
    return null;
  }
}

export async function solLamports(owner: PublicKey): Promise<number> {
  let last = "Balance lookup failed.";
  for (const rpc of RPCS) {
    try {
      return await new Connection(rpc, "confirmed").getBalance(owner, "confirmed");
    } catch (error) {
      last = error instanceof Error ? error.message : last;
    }
  }
  throw new Error(last);
}

export async function tokenRaw(owner: PublicKey, mint: string): Promise<string> {
  const held = await listHeld(owner);
  const hit = held.find((item) => item.mint === mint);
  return hit ? hit.raw : "0";
}

const TOKEN_PROGRAMS = ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"];

export type Held = { mint: string; raw: string; ui: number };

export async function listHeld(owner: PublicKey): Promise<Held[]> {
  let last = "Balance lookup failed.";
  for (const rpc of RPCS) {
    try {
      const merged = new Map<string, Held>();
      for (const programId of TOKEN_PROGRAMS) {
        const accounts = await new Connection(rpc, "confirmed").getParsedTokenAccountsByOwner(owner, { programId: new PublicKey(programId) });
        for (const account of accounts.value) {
          const info = (account.account.data as { parsed?: { info?: { mint?: string; tokenAmount?: { amount?: string; uiAmount?: number | null } } } }).parsed?.info;
          const mint = info?.mint ?? "";
          const raw = info?.tokenAmount?.amount ?? "";
          const ui = Number(info?.tokenAmount?.uiAmount ?? 0);
          if (!mint || !/^\d+$/.test(raw) || raw === "0" || !Number.isFinite(ui) || ui <= 0) continue;
          const prior = merged.get(mint);
          merged.set(mint, { mint, raw: prior ? (BigInt(prior.raw) + BigInt(raw)).toString() : raw, ui: (prior?.ui ?? 0) + ui });
        }
      }
      return [...merged.values()];
    } catch (error) {
      last = error instanceof Error ? error.message : last;
    }
  }
  throw new Error(last);
}

function decode(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function signAndSend(args: {
  signer: Keypair;
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
}): Promise<{ signature: string | null; aborted: boolean; outAmount: string; impactBps: number }> {
  const built = await buildSwap({
    data: {
      owner: args.signer.publicKey.toBase58(),
      inputMint: args.inputMint,
      outputMint: args.outputMint,
      amount: args.amount,
      slippageBps: args.slippageBps,
    },
  });
  if (built.aborted || !built.swapTransaction) {
    return { signature: null, aborted: true, outAmount: built.outAmount, impactBps: built.impactBps };
  }
  const tx = VersionedTransaction.deserialize(decode(built.swapTransaction));
  tx.sign([args.signer]);
  let last = "The network did not take the transaction.";
  for (const rpc of RPCS) {
    try {
      const signature = await new Connection(rpc, "confirmed").sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 2 });
      return { signature, aborted: false, outAmount: built.outAmount, impactBps: built.impactBps };
    } catch (error) {
      last = error instanceof Error ? error.message : last;
    }
  }
  throw new Error(last);
}

export async function confirmSignature(signature: string): Promise<"pending" | "confirmed" | "failed"> {
  try {
    const status = await connection().getSignatureStatuses([signature]);
    const row = status.value[0];
    if (!row) return "pending";
    if (row.err) return "failed";
    if (row.confirmationStatus === "confirmed" || row.confirmationStatus === "finalized") return "confirmed";
  } catch {
    return "pending";
  }
  return "pending";
}

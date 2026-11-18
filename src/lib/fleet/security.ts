import type { Checks, RugOut } from "./engine";

const TAX_MAX = 0.05;
const NONE = new Set(["", "null", "11111111111111111111111111111111"]);
const ZERO = "0x0000000000000000000000000000000000000000";
const DEAD = "0x000000000000000000000000000000000000dead";

const ORDER: (keyof Checks)[] = [
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

export type SecurityMeta = {
  token: string;
  runId: string;
  ageSec: number;
};

type Risk = { name?: string; level?: string; description?: string };

export type SolanaReport = {
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  rugged?: boolean;
  risks?: Risk[];
  topHolders?: { pct?: number }[];
  transferFee?: { pct?: number };
  tokenMeta?: { mutable?: boolean };
  markets?: { lp?: { lpLockedPct?: number } }[];
};

type EvmHolder = {
  percent?: string;
  is_locked?: number | string;
  tag?: string;
  address?: string;
};

export type BaseReport = {
  is_honeypot?: string;
  honeypot_with_same_creator?: string;
  is_mintable?: string;
  is_blacklisted?: string;
  owner_address?: string;
  sell_tax?: string;
  buy_tax?: string;
  cannot_sell_all?: string;
  cannot_buy?: string;
  transfer_pausable?: string;
  holders?: EvmHolder[];
  lp_holders?: EvmHolder[];
};

function blank(): Checks {
  return {
    renounced: true,
    mint_auth: true,
    freeze_auth: true,
    lp_locked_or_burned: true,
    honeypot: true,
    tax_ok: true,
    blacklist: true,
    deployer_ok: true,
    age_ok: true,
    holder_conc_ok: true,
  };
}

function verdict(checks: Checks, reasons: Partial<Record<keyof Checks, string>>): Pick<RugOut, "verdict" | "reason" | "checks"> {
  const failed = ORDER.find((key) => !checks[key]);
  return {
    checks,
    verdict: failed ? "FAIL" : "PASS",
    reason: failed ? (reasons[failed] ?? "failed") : "checks clear",
  };
}

function authorityLive(value: string | null | undefined): boolean {
  if (value == null) return false;
  return !NONE.has(value);
}

function danger(risks: Risk[] | undefined, pattern: RegExp): boolean {
  return (risks ?? []).some(
    (risk) =>
      (risk.level ?? "").toLowerCase() === "danger" &&
      pattern.test(`${risk.name ?? ""} ${risk.description ?? ""}`),
  );
}

function top10(holders: { pct?: number }[] | undefined): number | null {
  if (!holders?.length) return null;
  const sum = holders.slice(0, 10).reduce((total, holder) => total + (Number(holder.pct) || 0), 0);
  return sum > 0 ? sum : null;
}

export function rugFromSolana(report: SolanaReport, meta: SecurityMeta): RugOut {
  const checks = blank();
  const reasons: Partial<Record<keyof Checks, string>> = {};
  const locked = Math.max(0, ...(report.markets ?? []).map((market) => Number(market.lp?.lpLockedPct) || 0));
  const concentration = top10(report.topHolders);
  const tax = Number(report.transferFee?.pct) || 0;
  const youngBand = meta.ageSec < 480 && concentration != null && concentration > 54 && concentration <= 64;

  checks.honeypot = report.rugged !== true && !danger(report.risks, /honey|cannot sell|can't sell/i);
  checks.blacklist = !danger(report.risks, /blacklist/i);
  checks.mint_auth = !authorityLive(report.mintAuthority);
  checks.freeze_auth = !authorityLive(report.freezeAuthority);
  checks.tax_ok = tax <= TAX_MAX * 100;
  checks.lp_locked_or_burned = locked >= 95;
  checks.deployer_ok = !danger(report.risks, /creator|deployer|history/i);
  checks.holder_conc_ok = concentration != null && concentration <= 64 && !youngBand;
  checks.age_ok = meta.ageSec >= 180;
  checks.renounced = report.tokenMeta?.mutable !== true;

  if (!checks.honeypot) reasons.honeypot = report.rugged ? "marked rugged" : "honeypot flag on the report";
  if (!checks.blacklist) reasons.blacklist = "blacklist flag on the report";
  if (!checks.mint_auth) reasons.mint_auth = "mint authority live";
  if (!checks.freeze_auth) reasons.freeze_auth = "freeze authority set";
  if (!checks.tax_ok) reasons.tax_ok = `transfer fee ${tax.toFixed(1)}%`;
  if (!checks.lp_locked_or_burned) reasons.lp_locked_or_burned = locked > 0 ? `LP lock ${locked.toFixed(0)}%` : "LP lock not reported";
  if (!checks.deployer_ok) reasons.deployer_ok = "deployer history is dirty";
  if (!checks.holder_conc_ok) {
    reasons.holder_conc_ok =
      concentration == null
        ? "holder concentration not reported"
        : youngBand
          ? `concentration ambiguous · top 10 hold ${concentration.toFixed(0)}%`
          : `top 10 hold ${concentration.toFixed(0)}%`;
  }
  if (!checks.age_ok) reasons.age_ok = "under 3m floor";
  if (!checks.renounced) reasons.renounced = "metadata still mutable";

  return { run_id: meta.runId, token: meta.token, ...verdict(checks, reasons) };
}

function taxFraction(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n > 1 ? n / 100 : n;
}

function lockedFraction(holders: EvmHolder[] | undefined): number | null {
  if (!holders?.length) return null;
  let locked = 0;
  for (const holder of holders) {
    const tag = `${holder.tag ?? ""} ${holder.address ?? ""}`.toLowerCase();
    const pct = Number(holder.percent);
    const isLocked =
      holder.is_locked === 1 ||
      holder.is_locked === "1" ||
      /lock|burn|dead|null/.test(tag) ||
      holder.address?.toLowerCase() === DEAD ||
      holder.address?.toLowerCase() === ZERO;
    if (isLocked && Number.isFinite(pct)) locked += pct > 1 ? pct / 100 : pct;
  }
  return locked;
}

export function rugFromBase(report: BaseReport, meta: SecurityMeta): RugOut {
  const checks = blank();
  const reasons: Partial<Record<keyof Checks, string>> = {};
  const owner = (report.owner_address ?? "").toLowerCase();
  const sell = Math.max(taxFraction(report.sell_tax), taxFraction(report.buy_tax));
  const holders = (report.holders ?? []).slice(0, 10).map((holder) => {
    const n = Number(holder.percent);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return n <= 1 ? n * 100 : n;
  });
  const concentration = holders.some((n) => n > 0) ? holders.reduce((a, b) => a + b, 0) : null;
  const locked = lockedFraction(report.lp_holders);
  const youngBand = meta.ageSec < 480 && concentration != null && concentration > 54 && concentration <= 64;

  checks.honeypot = report.is_honeypot !== "1" && report.cannot_sell_all !== "1" && report.cannot_buy !== "1";
  checks.blacklist = report.is_blacklisted !== "1";
  checks.mint_auth = report.is_mintable !== "1";
  checks.freeze_auth = report.transfer_pausable !== "1";
  checks.tax_ok = sell <= TAX_MAX;
  checks.lp_locked_or_burned = locked != null && locked >= 0.9;
  checks.deployer_ok = report.honeypot_with_same_creator !== "1";
  checks.holder_conc_ok = concentration != null && concentration <= 64 && !youngBand;
  checks.age_ok = meta.ageSec >= 180;
  checks.renounced = owner === "" || owner === ZERO || owner === DEAD;

  if (!checks.honeypot) reasons.honeypot = "honeypot simulation failed";
  if (!checks.blacklist) reasons.blacklist = "blacklist function present";
  if (!checks.mint_auth) reasons.mint_auth = "mint authority live";
  if (!checks.freeze_auth) reasons.freeze_auth = "transfers can be paused";
  if (!checks.tax_ok) reasons.tax_ok = `sell tax ${(sell * 100).toFixed(1)}%`;
  if (!checks.lp_locked_or_burned) reasons.lp_locked_or_burned = locked == null ? "LP lock not reported" : `LP lock ${(locked * 100).toFixed(0)}%`;
  if (!checks.deployer_ok) reasons.deployer_ok = "deployer history is dirty";
  if (!checks.holder_conc_ok) {
    reasons.holder_conc_ok =
      concentration == null
        ? "holder concentration not reported"
        : youngBand
          ? `concentration ambiguous · top 10 hold ${concentration.toFixed(0)}%`
          : `top 10 hold ${concentration.toFixed(0)}%`;
  }
  if (!checks.age_ok) reasons.age_ok = "under 3m floor";
  if (!checks.renounced) reasons.renounced = "ownership not renounced";

  return { run_id: meta.runId, token: meta.token, ...verdict(checks, reasons) };
}

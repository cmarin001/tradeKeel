import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { S as round, a as clamp, r as SCANNER_FLOORS, v as hashString } from "./engine-lrPwXorj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/markets-DVj9DL7_.js
var TAX_MAX = .05;
var NONE = /* @__PURE__ */ new Set([
	"",
	"null",
	"11111111111111111111111111111111"
]);
var ZERO = "0x0000000000000000000000000000000000000000";
var DEAD = "0x000000000000000000000000000000000000dead";
var ORDER = [
	"honeypot",
	"blacklist",
	"mint_auth",
	"freeze_auth",
	"tax_ok",
	"lp_locked_or_burned",
	"deployer_ok",
	"holder_conc_ok",
	"age_ok",
	"renounced"
];
function blank() {
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
		holder_conc_ok: true
	};
}
function verdict(checks, reasons) {
	const failed = ORDER.find((key) => !checks[key]);
	return {
		checks,
		verdict: failed ? "FAIL" : "PASS",
		reason: failed ? reasons[failed] ?? "failed" : "checks clear"
	};
}
function authorityLive(value) {
	if (value == null) return false;
	return !NONE.has(value);
}
function danger(risks, pattern) {
	return (risks ?? []).some((risk) => (risk.level ?? "").toLowerCase() === "danger" && pattern.test(`${risk.name ?? ""} ${risk.description ?? ""}`));
}
function top10(holders) {
	if (!holders?.length) return null;
	const sum = holders.slice(0, 10).reduce((total, holder) => total + (Number(holder.pct) || 0), 0);
	return sum > 0 ? sum : null;
}
function rugFromSolana(report, meta) {
	const checks = blank();
	const reasons = {};
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
	if (!checks.holder_conc_ok) reasons.holder_conc_ok = concentration == null ? "holder concentration not reported" : youngBand ? `concentration ambiguous · top 10 hold ${concentration.toFixed(0)}%` : `top 10 hold ${concentration.toFixed(0)}%`;
	if (!checks.age_ok) reasons.age_ok = "under 3m floor";
	if (!checks.renounced) reasons.renounced = "metadata still mutable";
	return {
		run_id: meta.runId,
		token: meta.token,
		...verdict(checks, reasons)
	};
}
function taxFraction(raw) {
	const n = Number(raw);
	if (!Number.isFinite(n) || n <= 0) return 0;
	return n > 1 ? n / 100 : n;
}
function lockedFraction(holders) {
	if (!holders?.length) return null;
	let locked = 0;
	for (const holder of holders) {
		const tag = `${holder.tag ?? ""} ${holder.address ?? ""}`.toLowerCase();
		const pct = Number(holder.percent);
		if ((holder.is_locked === 1 || holder.is_locked === "1" || /lock|burn|dead|null/.test(tag) || holder.address?.toLowerCase() === DEAD || holder.address?.toLowerCase() === ZERO) && Number.isFinite(pct)) locked += pct > 1 ? pct / 100 : pct;
	}
	return locked;
}
function rugFromBase(report, meta) {
	const checks = blank();
	const reasons = {};
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
	checks.lp_locked_or_burned = locked != null && locked >= .9;
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
	if (!checks.holder_conc_ok) reasons.holder_conc_ok = concentration == null ? "holder concentration not reported" : youngBand ? `concentration ambiguous · top 10 hold ${concentration.toFixed(0)}%` : `top 10 hold ${concentration.toFixed(0)}%`;
	if (!checks.age_ok) reasons.age_ok = "under 3m floor";
	if (!checks.renounced) reasons.renounced = "ownership not renounced";
	return {
		run_id: meta.runId,
		token: meta.token,
		...verdict(checks, reasons)
	};
}
var POOL_TTL = 2e4;
var RUG_TTL = 9e5;
var poolCache = /* @__PURE__ */ new Map();
var rugCache = /* @__PURE__ */ new Map();
function rankOf(liq, vol, trigger) {
	const turnover = vol / Math.max(liq, 1);
	return round(clamp(turnover * 18 + Math.log10(liq) * 9 + (trigger === "new_pair" ? 6 : 0), 1, 99), 1);
}
function cleanList(list, chain) {
	const out = [];
	for (const item of list ?? []) {
		if (typeof item !== "string") continue;
		if (chain === "solana" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(item)) out.push(item);
		if (chain === "base" && /^0x[a-fA-F0-9]{40}$/.test(item)) out.push(item.toLowerCase());
		if (out.length >= 25) break;
	}
	return out;
}
async function getJson(url, ms = 8e3) {
	const response = await fetch(url, {
		headers: {
			accept: "application/json;version=20230302",
			"user-agent": "KeelFleet/1.0"
		},
		signal: AbortSignal.timeout(ms)
	});
	if (!response.ok) throw new Error(`${response.status}`);
	return response.json();
}
function num(value) {
	const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
	return Number.isFinite(n) ? n : 0;
}
function mapPool(chain, pool) {
	if (!pool || typeof pool !== "object") return null;
	const row = pool;
	const attr = row.attributes ?? {};
	const id = row.relationships?.base_token?.data?.id ?? "";
	const token = id.includes("_") ? id.slice(id.indexOf("_") + 1) : "";
	const name = String(attr.name ?? "");
	const created = Date.parse(String(attr.pool_created_at ?? ""));
	const vol = attr.volume_usd;
	const change = attr.price_change_percentage;
	if (!token || !Number.isFinite(created)) return null;
	const symbol = (name.split("/")[0] ?? "").trim().slice(0, 12) || "TOKEN";
	const price = num(attr.base_token_price_usd);
	const liquidityUsd = num(attr.reserve_in_usd);
	const vol1hUsd = num(vol?.h1);
	if (price <= 0 || liquidityUsd < SCANNER_FLOORS.minLiquidity || vol1hUsd < SCANNER_FLOORS.minVol1h) return null;
	const ageSec = Math.max(0, Math.round((Date.now() - created) / 1e3));
	if (ageSec < SCANNER_FLOORS.minAgeSec) return null;
	return {
		chain,
		symbol,
		name: name || symbol,
		token,
		pairAddress: String(attr.address ?? ""),
		pair: name || `${symbol}/${chain === "solana" ? "SOL" : "WETH"}`,
		price,
		liquidityUsd,
		vol1hUsd,
		ageSec,
		createdAt: created,
		changePct: Math.abs(num(change?.h1)) / 100
	};
}
async function loadChain(chain) {
	const hit = poolCache.get(chain);
	if (hit && Date.now() - hit.at < POOL_TTL) return hit.rows;
	const network = chain;
	const [trending, fresh] = await Promise.all([getJson(`https://api.geckoterminal.com/api/v2/networks/${network}/trending_pools?page=1`), getJson(`https://api.geckoterminal.com/api/v2/networks/${network}/new_pools?page=1`).catch(() => ({ data: [] }))]);
	const bags = [trending, fresh].flatMap((payload) => {
		const data = payload.data;
		return Array.isArray(data) ? data : [];
	});
	const byToken = /* @__PURE__ */ new Map();
	for (const pool of bags) {
		const mapped = mapPool(chain, pool);
		if (!mapped) continue;
		const prev = byToken.get(mapped.token);
		if (!prev || mapped.liquidityUsd > prev.liquidityUsd) byToken.set(mapped.token, mapped);
	}
	const rows = [...byToken.values()];
	poolCache.set(chain, {
		at: Date.now(),
		rows
	});
	return rows;
}
function toRow(pool, rug) {
	const trigger = pool.ageSec < 7200 ? "new_pair" : pool.vol1hUsd / pool.liquidityUsd >= .35 ? "vol_spike" : "liq_spike";
	const swing = pool.changePct;
	const volatility = round(clamp(swing > 0 ? swing : .4, .28, 1.2), 3);
	return {
		runId: hashString(pool.token).toString(16).padStart(8, "0").slice(0, 8),
		symbol: pool.symbol,
		name: pool.name,
		chain: pool.chain,
		token: pool.token,
		pair: pool.pair,
		pairAddress: pool.pairAddress,
		price: pool.price,
		liquidityUsd: Math.round(pool.liquidityUsd),
		vol1hUsd: Math.round(pool.vol1hUsd),
		ageSec: pool.ageSec,
		trigger,
		rankScore: rankOf(pool.liquidityUsd, pool.vol1hUsd, trigger),
		volatility,
		url: `https://dexscreener.com/${pool.chain}/${pool.pairAddress || pool.token}`,
		rug
	};
}
async function rugSolana(pools) {
	const due = pools.filter((pool) => {
		const hit = rugCache.get(pool.token);
		return !hit || Date.now() - hit.at > RUG_TTL;
	}).slice(0, 6);
	await Promise.all(due.map(async (pool) => {
		try {
			const rug = rugFromSolana(await getJson(`https://api.rugcheck.xyz/v1/tokens/${pool.token}/report`, 12e3), {
				token: pool.token,
				runId: hashString(pool.token).toString(16).padStart(8, "0").slice(0, 8),
				ageSec: pool.ageSec
			});
			rugCache.set(pool.token, {
				at: Date.now(),
				rug
			});
		} catch {}
	}));
}
async function rugBase(pools) {
	const due = pools.filter((pool) => {
		const hit = rugCache.get(pool.token);
		return !hit || Date.now() - hit.at > RUG_TTL;
	});
	if (due.length === 0) return null;
	const addresses = due.map((pool) => pool.token).join(",");
	try {
		const payload = await getJson(`https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${addresses}`, 12e3);
		if (payload.code === 4029) return "Base security feed is busy. Those contracts stay unchecked.";
		const result = payload.result ?? {};
		for (const pool of due) {
			const report = result[pool.token] ?? result[pool.token.toLowerCase()];
			if (!report) continue;
			rugCache.set(pool.token, {
				at: Date.now(),
				rug: rugFromBase(report, {
					token: pool.token,
					runId: hashString(pool.token).toString(16).padStart(8, "0").slice(0, 8),
					ageSec: pool.ageSec
				})
			});
		}
		return null;
	} catch {
		return "Base security feed did not answer. Those contracts stay unchecked.";
	}
}
async function markPrices(chain, tokens) {
	if (tokens.length === 0) return [];
	try {
		const prices = (await getJson(`https://api.geckoterminal.com/api/v2/simple/networks/${chain}/token_price/${tokens.join("%2C")}`)).data?.attributes?.token_prices ?? {};
		return tokens.flatMap((token) => {
			const price = num(prices[token] ?? prices[token.toLowerCase()]);
			return price > 0 ? [{
				token,
				price
			}] : [];
		});
	} catch {
		return [];
	}
}
var pullMarkets_createServerFn_handler = createServerRpc({
	id: "29e210dbad9a554e7e88620c2df9b7c1ae7e6236c6993d235e16b81d35d42c4f",
	name: "pullMarkets",
	filename: "src/lib/fleet/markets.ts"
}, (opts) => pullMarkets.__executeServer(opts));
var pullMarkets = createServerFn({ method: "POST" }).validator((input) => ({
	solana: cleanList(input?.solana, "solana"),
	base: cleanList(input?.base, "base")
})).handler(pullMarkets_createServerFn_handler, async ({ data }) => {
	const [solana, base] = await Promise.all([loadChain("solana"), loadChain("base")]);
	const ranked = [...solana, ...base].sort((a, b) => {
		const av = a.vol1hUsd / a.liquidityUsd;
		return b.vol1hUsd / b.liquidityUsd - av;
	});
	const seen = /* @__PURE__ */ new Set();
	const picked = [];
	for (const pool of ranked) {
		if (seen.has(pool.token)) continue;
		seen.add(pool.token);
		picked.push(pool);
		if (picked.length >= 20) break;
	}
	const rows = picked.map((pool) => toRow(pool, rugCache.get(pool.token)?.rug ?? null)).sort((a, b) => b.rankScore - a.rankScore);
	const heldSol = data.solana.filter((token) => !rows.some((row) => row.token === token));
	const heldBase = data.base.filter((token) => !rows.some((row) => row.token === token));
	const [solMarks, baseMarks] = await Promise.all([markPrices("solana", heldSol), markPrices("base", heldBase)]);
	const marks = [
		...rows.map((row) => ({
			token: row.token,
			price: row.price
		})),
		...solMarks,
		...baseMarks
	];
	const pending = rows.filter((row) => !row.rug).length;
	const note = pending > 0 ? `Rug check still owes ${pending} contract${pending === 1 ? "" : "s"}. They are not sized yet.` : null;
	return {
		scannedAt: Date.now(),
		rows,
		marks,
		note
	};
});
var checkSecurity_createServerFn_handler = createServerRpc({
	id: "d86ee6e04e610e0e1a452bdf750c79b63cf4f8c3bb086aeb51680995cc5e7754",
	name: "checkSecurity",
	filename: "src/lib/fleet/markets.ts"
}, (opts) => checkSecurity.__executeServer(opts));
var checkSecurity = createServerFn({ method: "POST" }).validator((input) => {
	return { tokens: (input?.tokens ?? []).slice(0, 6).flatMap((item) => {
		const token = item.token ?? "";
		const chain = item.chain === "base" ? "base" : item.chain === "solana" ? "solana" : null;
		const ageSec = Number(item.ageSec);
		if (!chain || !Number.isFinite(ageSec)) return [];
		if (chain === "solana" && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(token)) return [];
		if (chain === "base" && !/^0x[a-fA-F0-9]{40}$/.test(token)) return [];
		return [{
			token: chain === "base" ? token.toLowerCase() : token,
			chain,
			ageSec
		}];
	}) };
}).handler(checkSecurity_createServerFn_handler, async ({ data }) => {
	const solana = data.tokens.filter((item) => item.chain === "solana").map((item) => ({
		chain: "solana",
		token: item.token,
		ageSec: item.ageSec,
		symbol: "",
		name: "",
		pairAddress: "",
		pair: "",
		price: 0,
		liquidityUsd: 0,
		vol1hUsd: 0,
		createdAt: 0,
		changePct: 0
	}));
	const base = data.tokens.filter((item) => item.chain === "base").map((item) => ({
		chain: "base",
		token: item.token,
		ageSec: item.ageSec,
		symbol: "",
		name: "",
		pairAddress: "",
		pair: "",
		price: 0,
		liquidityUsd: 0,
		vol1hUsd: 0,
		createdAt: 0,
		changePct: 0
	}));
	const [baseNote] = await Promise.all([rugBase(base), rugSolana(solana)]);
	return {
		rugs: data.tokens.flatMap((item) => {
			const hit = rugCache.get(item.token);
			return hit ? [{
				token: item.token,
				rug: hit.rug
			}] : [];
		}),
		note: baseNote
	};
});
//#endregion
export { checkSecurity_createServerFn_handler, pullMarkets_createServerFn_handler };

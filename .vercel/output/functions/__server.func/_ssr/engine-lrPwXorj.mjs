//#region node_modules/.nitro/vite/services/ssr/assets/engine-lrPwXorj.js
var EPOCH = Date.UTC(2026, 10, 14, 14, 30, 0);
function cx(...parts) {
	return parts.filter(Boolean).join(" ");
}
function clamp(n, lo, hi) {
	return Math.min(hi, Math.max(lo, n));
}
function round(n, digits = 2) {
	const p = 10 ** digits;
	return Math.round(n * p) / p;
}
function formatUsd(n, digits) {
	const sign = n < 0 ? "-" : "";
	const v = Math.abs(n);
	if (!Number.isFinite(v)) return "—";
	if (v >= 1e6) return `${sign}$${(v / 1e6).toFixed(2)}M`;
	const d = digits ?? (v >= 1e3 ? 0 : 2);
	const [whole, frac] = v.toFixed(d).split(".");
	const withComma = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return `${sign}$${frac ? `${withComma}.${frac}` : withComma}`;
}
function formatSignedUsd(n) {
	const body = formatUsd(Math.abs(n), Math.abs(n) < 1e3 ? 2 : 0);
	if (n > .004) return `+${body}`;
	if (n < -.004) return `-${body}`;
	return formatUsd(0, 2);
}
function formatPct(fraction, digits = 1) {
	if (!Number.isFinite(fraction)) return "—";
	return `${(fraction * 100).toFixed(digits)}%`;
}
function formatBps(bps) {
	return `${Math.round(bps)} bps`;
}
function formatDuration(sec) {
	if (!Number.isFinite(sec) || sec < 0) return "—";
	if (sec < 90) return `${Math.round(sec)}s`;
	if (sec < 3600) return `${Math.round(sec / 60)}m`;
	const h = Math.floor(sec / 3600);
	const m = Math.round(sec % 3600 / 60);
	return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
function formatAge(sec) {
	if (sec < 90) return `${Math.round(sec)}s`;
	if (sec < 3600) return `${Math.max(1, Math.round(sec / 60))}m`;
	if (sec < 86400) return `${Math.round(sec / 3600)}h`;
	return `${Math.round(sec / 86400)}d`;
}
function formatClock(simSec) {
	const total = Math.floor(EPOCH / 1e3 + simSec);
	const h = Math.floor(total / 3600) % 24;
	const m = Math.floor(total / 60) % 60;
	const s = (total % 60 + 60) % 60;
	const pad = (n) => n.toString().padStart(2, "0");
	return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
function formatPx(n) {
	if (!Number.isFinite(n)) return "—";
	if (n >= 100) return n.toFixed(2);
	if (n >= 1) return n.toFixed(4);
	if (n >= .01) return n.toFixed(5);
	return n.toPrecision(3);
}
function formatTokens(n) {
	if (!Number.isFinite(n)) return "—";
	const v = Math.abs(n);
	if (v >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
	if (v >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
	if (v >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
	if (v >= 1) return n.toFixed(2);
	return n.toPrecision(3);
}
var START_EQUITY = 25e3;
var MIN_LIQ = 2e4;
var MIN_AGE = 90;
var MIN_VOL = 12e3;
var RUG_AGE = 180;
var TAX_MAX_BPS = 500;
var ROSTER = [
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
	["FATHOM", "Fathom"]
];
var CHECK_PRIORITY = [
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
var universes = /* @__PURE__ */ new Map();
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function hashString(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}
function makePath(rand) {
	const roll = rand();
	let shockMag;
	if (roll < .38) shockMag = -(.16 + rand() * .4);
	else if (roll < .55) shockMag = -.05 + rand() * .12;
	else shockMag = .22 + rand() * .55;
	return {
		phase: rand() * Math.PI * 2,
		driftPerMin: -.012 + rand() * .028,
		vol: .35 + rand() * .8,
		shockAt: 28 + rand() * 150,
		shockMag
	};
}
function shuffle(arr, rand) {
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		const tmp = a[i];
		a[i] = a[j];
		a[j] = tmp;
	}
	return a;
}
function addressFor(chain, rand) {
	if (chain === "base") {
		let hex = "0x";
		const alpha = "0123456789abcdef";
		for (let i = 0; i < 40; i++) hex += alpha[Math.floor(rand() * 16)];
		return hex;
	}
	const alpha = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
	let s = "";
	for (let i = 0; i < 44; i++) s += alpha[Math.floor(rand() * 58)];
	return s;
}
function buildUniverse(seed) {
	const rand = mulberry32(seed ^ 2654435769);
	const catalog = ROSTER.map(([symbol, name]) => {
		const chain = rand() < .64 ? "solana" : "base";
		const ageSec = rand() < .24 ? Math.round(36 + rand() * 740) : Math.round(900 + rand() * 36e4);
		const liquidityUsd = Math.round(9e3 + rand() ** .72 * 16e5);
		const vol1hUsd = Math.round(liquidityUsd * (.22 + rand() * 1.8));
		const volatility = round(.28 + rand() * .85, 3);
		const exp = 2 + Math.floor(rand() * 5);
		const price = Number(((.4 + rand() * 8.5) / 10 ** exp).toPrecision(4));
		const taxBps = rand() < .9 ? Math.round(rand() * 420) : Math.round(700 + rand() * 1400);
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
			renounced: rand() < .94,
			mintLive: rand() < .1,
			freeze: rand() < .05,
			honeypot: rand() < .08,
			taxBps,
			blacklist: rand() < .04,
			deployerOk: rand() < .9,
			lpLocked: rand() < .9,
			top10: Math.round(14 + rand() * 52),
			path: makePath(rand)
		};
	});
	return {
		catalog,
		tradable: shuffle(catalog.filter((t) => t.liquidityUsd >= MIN_LIQ && t.ageSec >= MIN_AGE && t.vol1hUsd >= MIN_VOL), mulberry32(seed ^ 335568))
	};
}
function universe(seed) {
	let u = universes.get(seed);
	if (!u) {
		u = buildUniverse(seed);
		universes.set(seed, u);
	}
	return u;
}
function factsByAddress(seed, address) {
	const hit = universe(seed).catalog.find((t) => t.address === address);
	if (!hit) throw new Error(`unknown token ${address}`);
	return hit;
}
function multipleAt(path, elapsed) {
	const t = Math.max(0, elapsed);
	const wobble = Math.sin(t / 23 + path.phase) * path.vol * .05 + Math.sin(t / 8.5 + path.phase * 1.3) * path.vol * .028;
	const wobble0 = Math.sin(path.phase) * path.vol * .05 + Math.sin(path.phase * 1.3) * path.vol * .028;
	let m = 1 + path.driftPerMin * (t / 60) + (wobble - wobble0);
	if (t > path.shockAt) {
		const k = 1 - Math.exp(-(t - path.shockAt) / 16);
		m += path.shockMag * k;
	}
	return Math.max(.05, m);
}
function marketAt(facts, wave) {
	if (wave === 0) return {
		liquidity: facts.liquidityUsd,
		vol1h: facts.vol1hUsd,
		volatility: facts.volatility,
		path: facts.path,
		price: facts.price
	};
	const rand = mulberry32(hashString(`${facts.address}:m:${wave}`) ^ 20973);
	return {
		liquidity: Math.round(facts.liquidityUsd * (.82 + rand() * .46)),
		vol1h: Math.round(facts.vol1hUsd * (1.15 + rand() * 2.1)),
		volatility: round(clamp(facts.volatility * (.72 + rand() * .7), .2, 1.3), 3),
		path: makePath(rand),
		price: facts.price
	};
}
function discoveryAt(seed, index) {
	const list = universe(seed).tradable;
	const n = list.length;
	if (n === 0) return null;
	const wave = Math.floor(index / n);
	const i = index % n;
	const token = list[i];
	const at = 8 + wave * (n * 18 + 30) + i * 18;
	const h = hashString(`${token.address}:${wave}:trig`);
	const trigger = wave === 0 && token.ageSec < 1200 ? "new_pair" : h % 2 === 0 ? "vol_spike" : "liq_spike";
	return {
		token: token.address,
		at,
		trigger,
		wave
	};
}
function pairFor(facts) {
	return facts.chain === "solana" ? `${facts.symbol}/SOL` : `${facts.symbol}/WETH`;
}
function runIdFor(address, at) {
	return hashString(`${address}:${at}`).toString(16).padStart(8, "0").slice(0, 8);
}
function txHash(runId, action) {
	const h = hashString(`${runId}:${action}:tx`);
	return `sim_${h.toString(16).padStart(8, "0")}${(h ^ 2654435769).toString(16).padStart(8, "0")}`.slice(0, 20);
}
function triggerLabel(trigger) {
	if (trigger === "new_pair") return "new pair";
	if (trigger === "vol_spike") return "vol spike";
	return "liq spike";
}
function stopPctFor(vol) {
	return clamp(.11 + vol * .08, .12, .22);
}
function takePctFor(vol) {
	return clamp(.28 + vol * .14, .26, .5);
}
function maxSlippageBps(vol) {
	return Math.round(clamp(100 + vol * 100, 110, 240));
}
function estimateSlipBps(sizeUsd, liquidity, vol) {
	const impact = sizeUsd / Math.max(liquidity, 1) * 9e3;
	return Math.round(10 + impact + vol * 18);
}
function slipJitter(address, salt) {
	const h = hashString(`${address}:${salt}`);
	const bucket = h % 100;
	if (bucket >= 88) return 2.5 + (h >>> 7) % 200 / 100;
	if (bucket >= 76) return 1.5 + (h >>> 5) % 70 / 100;
	return .86 + (h >>> 3) % 400 / 1e3;
}
function gasUsd(chain) {
	return chain === "solana" ? .08 : .62;
}
function ageAt(facts, atSec) {
	return facts.ageSec + atSec;
}
function rugCheck(facts, ageSec, runId) {
	const youngBand = ageSec < 480 && facts.top10 > 54 && facts.top10 <= 64;
	const checks = {
		renounced: facts.renounced,
		mint_auth: !facts.mintLive,
		freeze_auth: !facts.freeze,
		lp_locked_or_burned: facts.lpLocked,
		honeypot: !facts.honeypot,
		tax_ok: facts.taxBps <= TAX_MAX_BPS,
		blacklist: !facts.blacklist,
		deployer_ok: facts.deployerOk,
		age_ok: ageSec >= RUG_AGE,
		holder_conc_ok: facts.top10 <= 64 && !youngBand
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
	else if (failed === "holder_conc_ok") reason = youngBand ? `concentration ambiguous · top 10 hold ${facts.top10}%` : `top 10 hold ${facts.top10}%`;
	else if (failed === "age_ok") reason = `age ${formatAge(ageSec)} under 3m floor`;
	else if (failed === "renounced") reason = "ownership not renounced";
	return {
		run_id: runId,
		token: facts.address,
		verdict: failed ? "FAIL" : "PASS",
		checks,
		reason
	};
}
function sizeFor(facts, runId, ctx, params, minNotional = 40) {
	const dd = ctx.drawdown;
	const base = {
		run_id: runId,
		token: facts.address,
		max_slippage_bps: maxSlippageBps(ctx.volatility),
		equity_at_decision: round(ctx.equity, 2),
		size_tokens: 0
	};
	if (dd >= params.ddHaltPct) return {
		...base,
		size_usd: 0,
		risk_pct_used: 0,
		reason: `circuit · drawdown ${formatPct(dd)} ≥ halt ${formatPct(params.ddHaltPct)}`
	};
	const stopPct = stopPctFor(ctx.volatility);
	const riskBudget = ctx.equity * params.maxRiskPct;
	let size = riskBudget / stopPct;
	const poolMax = ctx.liquidity * params.maxPoolPct;
	let tag = "";
	if (size > poolMax) {
		size = poolMax;
		tag = " · pool-capped";
	}
	const haircut = clamp(1 - Math.max(0, ctx.volatility - .55) * .65, .58, 1);
	size *= haircut;
	const gas = gasUsd(facts.chain);
	const floor = Math.max(minNotional, gas * 30);
	const maxSlip = base.max_slippage_bps;
	let guard = 0;
	while (guard++ < 8 && size >= floor) {
		const est = estimateSlipBps(size, ctx.liquidity, ctx.volatility);
		const slipCost = size * est / 1e4;
		if (est <= maxSlip * .82 && slipCost <= riskBudget * .5) break;
		size *= .74;
		tag = " · slip-shrunk";
	}
	if (size < floor) return {
		...base,
		size_usd: 0,
		risk_pct_used: 0,
		reason: "slippage eats the risk budget"
	};
	size = round(size, 2);
	const tokens = round(size / ctx.price, 4);
	const riskUsed = size * stopPct / ctx.equity;
	return {
		...base,
		size_usd: size,
		size_tokens: tokens,
		risk_pct_used: round(riskUsed, 5),
		reason: `${formatPct(params.maxRiskPct, 2)} × ${formatUsd(ctx.equity, 0)} · stop ${formatPct(stopPct)} → ${formatUsd(size)}${tag}`
	};
}
function rankScore(liq, vol, trigger) {
	return round(clamp(vol / Math.max(liq, 1) * 18 + Math.log10(liq) * 9 + (trigger === "new_pair" ? 6 : 0), 1, 99), 1);
}
function blank(seed, params) {
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
			logged: 0
		},
		condemned: {},
		runs: [],
		logs: [],
		positions: [],
		recentCloses: [],
		marks: [{
			t: 0,
			equity: START_EQUITY,
			mtm: START_EQUITY
		}],
		lastHop: null
	};
}
function pushLog(w, event) {
	w.logs = [event, ...w.logs].slice(0, 420);
	w.counts.logged += 1;
	w.lastHop = {
		agent: event.agent,
		symbol: event.symbol,
		detail: event.summary
	};
}
function tsOf(simSec) {
	return EPOCH + Math.round(simSec * 1e3);
}
function drawdownOf(w) {
	if (w.peak <= 0) return 0;
	return (w.peak - w.equity) / w.peak;
}
function equityOut(w) {
	return {
		equity_usd: round(w.equity, 2),
		drawdown_pct: round(drawdownOf(w), 4),
		win_rate: round(w.closedN ? w.wins / w.closedN : 0, 4),
		expectancy_usd: round(w.closedN ? w.pnlSum / w.closedN : 0, 2),
		trades_closed: w.closedN,
		as_of: tsOf(w.simSec)
	};
}
function runCandidate(world, d) {
	const w = {
		...world,
		counts: { ...world.counts },
		condemned: world.condemned,
		runs: world.runs.slice(),
		logs: world.logs,
		positions: world.positions.slice(),
		recentCloses: world.recentCloses,
		marks: world.marks
	};
	const facts = factsByAddress(w.seed, d.token);
	const market = marketAt(facts, d.wave);
	const runId = runIdFor(facts.address, d.at);
	const age = Math.round(ageAt(facts, d.at));
	const score = rankScore(market.liquidity, market.vol1h, d.trigger);
	const scanner = {
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
		reason: `${triggerLabel(d.trigger)} · liq ${formatUsd(market.liquidity, 0)} · 1h ${formatUsd(market.vol1h, 0)} · age ${formatAge(age)}`
	};
	const decision = {
		equity: round(w.equity, 2),
		drawdown: round(drawdownOf(w), 4),
		volatility: market.volatility,
		liquidity: market.liquidity,
		vol1h: market.vol1h,
		price: market.price,
		wave: d.wave,
		params: { ...w.params }
	};
	const run = {
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
		decision
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
		payload: scanner
	});
	pushLog(w, {
		id: `${runId}:rug`,
		runId,
		ts: scanner.discovered_at,
		agent: "rug",
		symbol: facts.symbol,
		token: facts.address,
		summary: `${run.rug.verdict} · ${run.rug.reason}`,
		payload: run.rug
	});
	if (run.rug.verdict === "FAIL") {
		w.counts.rugFail += 1;
		w.condemned = {
			...w.condemned,
			[facts.address]: true
		};
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
		payload: sizer
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
		payload: entry
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
	const hold = 150 + hashString(`${runId}:hold`) % 130;
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
		maxSlippageBps: sizer.max_slippage_bps
	});
	w.slipSumBps += entry.slippage_bps;
	w.slipN += 1;
	run.status = "open";
	w.runs = [run, ...w.runs].slice(0, 180);
	return w;
}
function executeEntry(facts, sizer, market, _at) {
	const est = estimateSlipBps(sizer.size_usd, market.liquidity, market.volatility);
	const jitter = slipJitter(facts.address, `entry:${sizer.run_id}`);
	const realized = Math.round(est * jitter);
	const gas = round(gasUsd(facts.chain), 2);
	if (realized > sizer.max_slippage_bps) return {
		run_id: sizer.run_id,
		token: facts.address,
		action: "entry",
		status: "ABORTED",
		fill_price: 0,
		size_usd: 0,
		gas_usd: 0,
		slippage_bps: realized,
		tx_hash: "",
		reason: `aborted pre-send · slip ${realized} > max ${sizer.max_slippage_bps}`
	};
	const thin = sizer.size_usd / market.liquidity > .0045 && jitter > 1.12 && jitter < 1.5;
	const size = thin ? round(sizer.size_usd * .64, 2) : sizer.size_usd;
	const fill = roundPx(market.price * (1 + realized / 1e4));
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
		reason: thin ? `partial · book took ${realized} bps` : `filled · ${realized} bps slip`
	};
}
function roundPx(n) {
	if (n >= 1) return round(n, 6);
	return Number(n.toPrecision(6));
}
function unrealized(p, now) {
	const px = p.entryMid * multipleAt(p.path, now - p.openedAtSec) * (1 - exitSlipBps(p, "mark") / 1e4);
	const gasOut = gasUsd(p.chain);
	return p.sizeTokens * px - p.sizeUsd - p.gasIn - gasOut;
}
function exitSlipBps(p, salt) {
	const j = slipJitter(p.token, salt + p.runId);
	return Math.round((8 + p.sizeUsd / Math.max(p.liquidity, 1) * 5e3) * j);
}
function settle(world, to) {
	const w = {
		...world,
		counts: { ...world.counts },
		runs: world.runs.slice(),
		logs: world.logs,
		positions: [],
		recentCloses: world.recentCloses.slice()
	};
	for (const p of world.positions) {
		const elapsed = to - p.openedAtSec;
		const midNow = p.entryMid * multipleAt(p.path, elapsed);
		let trigger = null;
		if (midNow <= p.stopMid) trigger = "stop";
		else if (midNow >= p.takeMid) trigger = "take-profit";
		else if (to >= p.deadlineSec) trigger = "time";
		if (!trigger) {
			w.positions.push(p);
			continue;
		}
		const midRef = trigger === "stop" ? p.stopMid : trigger === "take-profit" ? p.takeMid : midNow;
		let slip = exitSlipBps(p, "exit");
		let status = "FILLED";
		let reason = `exit · ${trigger}`;
		if (slip > 180) {
			status = "PARTIAL";
			slip += 40;
			reason = `exit partial · ${trigger} · thin book`;
		}
		const fill = roundPx(midRef * (1 - slip / 1e4));
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
		const exit = {
			run_id: p.runId,
			token: p.token,
			action: "exit",
			status,
			fill_price: fill,
			size_usd: p.sizeUsd,
			gas_usd: gasOut,
			slippage_bps: slip,
			tx_hash: txHash(p.runId, "exit"),
			reason: `${reason} · ${formatPct(ret, 1)}`
		};
		const eq = equityOut({
			...w,
			simSec: to
		});
		pushLog(w, {
			id: `${p.runId}:exit`,
			runId: p.runId,
			ts: tsOf(to),
			agent: "executor",
			symbol: p.symbol,
			token: p.token,
			summary: exit.reason,
			payload: exit
		});
		pushLog(w, {
			id: `${p.runId}:equity`,
			runId: p.runId,
			ts: tsOf(to),
			agent: "equity",
			symbol: p.symbol,
			token: p.token,
			summary: `equity ${formatUsd(eq.equity_usd)} · dd ${formatPct(eq.drawdown_pct)}`,
			payload: eq
		});
		w.recentCloses = [{
			runId: p.runId,
			symbol: p.symbol,
			chain: p.chain,
			pnl,
			holdSec: elapsed,
			reason: trigger,
			ret
		}, ...w.recentCloses].slice(0, 16);
		const idx = w.runs.findIndex((r) => r.runId === p.runId);
		if (idx >= 0) {
			const prev = w.runs[idx];
			w.runs[idx] = {
				...prev,
				status: "closed",
				exit,
				pnl
			};
		}
	}
	const mtm = round(w.equity + w.positions.reduce((s, p) => s + unrealized(p, to), 0), 2);
	const mark = {
		t: to,
		equity: round(w.equity, 2),
		mtm
	};
	const marks = w.marks.slice();
	if (marks.length && marks[marks.length - 1].t === to) marks.pop();
	marks.push(mark);
	if (marks.length > 280) marks.splice(0, marks.length - 280);
	w.marks = marks;
	w.simSec = to;
	return w;
}
function step(world) {
	const to = world.simSec + 6;
	let w = world;
	let guard = 0;
	while (guard++ < 40) {
		const d = discoveryAt(w.seed, w.cursor);
		if (!d || d.at > to) break;
		const blocked = Boolean(w.condemned[d.token]) || w.positions.some((p) => p.token === d.token);
		w = {
			...w,
			cursor: w.cursor + 1
		};
		if (blocked) continue;
		w = runCandidate(w, d);
	}
	return settle(w, to);
}
function createWorld(seed, params) {
	let w = blank(seed >>> 0, params);
	let guard = 0;
	while (w.simSec < 480 && guard++ < 400) w = step(w);
	return w;
}
function snapshot(w) {
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
		openNotional
	};
}
function markPrice(p, now) {
	return p.entryMid * multipleAt(p.path, now - p.openedAtSec);
}
function positionPnl(p, now) {
	return unrealized(p, now);
}
function replay(seed, run, params) {
	const facts = factsByAddress(seed, run.token);
	const rug = rugCheck(facts, run.scanner.age_sec, run.runId);
	const rugMatch = rug.verdict === run.rug.verdict && rug.reason === run.rug.reason;
	const paramsMatch = params.maxRiskPct === run.decision.params.maxRiskPct && params.maxPoolPct === run.decision.params.maxPoolPct && params.ddHaltPct === run.decision.params.ddHaltPct;
	if (rug.verdict === "FAIL") return {
		rug,
		sizer: null,
		rugMatch,
		sizeMatch: run.sizer === null,
		paramsMatch
	};
	const sizer = sizeFor(facts, run.runId, run.decision, params);
	return {
		rug,
		sizer,
		rugMatch,
		sizeMatch: run.sizer ? sizer.size_usd === run.sizer.size_usd : false,
		paramsMatch
	};
}
var SCANNER_FLOORS = {
	minLiquidity: MIN_LIQ,
	minAgeSec: MIN_AGE,
	minVol1h: MIN_VOL
};
var CHECK_ORDER = CHECK_PRIORITY;
//#endregion
export { sizeFor as C, takePctFor as D, stopPctFor as E, round as S, step as T, formatUsd as _, clamp as a, positionPnl as b, estimateSlipBps as c, formatClock as d, formatDuration as f, formatTokens as g, formatSignedUsd as h, START_EQUITY as i, formatAge as l, formatPx as m, EPOCH as n, createWorld as o, formatPct as p, SCANNER_FLOORS as r, cx as s, CHECK_ORDER as t, formatBps as u, hashString as v, snapshot as w, replay as x, markPrice as y };

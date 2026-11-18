import { o as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { C as sizeFor, D as takePctFor, E as stopPctFor, S as round, T as step$1, _ as formatUsd, b as positionPnl$1, c as estimateSlipBps, d as formatClock, f as formatDuration, g as formatTokens, h as formatSignedUsd, i as START_EQUITY, l as formatAge, m as formatPx, n as EPOCH, o as createWorld, p as formatPct, r as SCANNER_FLOORS, s as cx, t as CHECK_ORDER, u as formatBps, v as hashString, w as snapshot, x as replay, y as markPrice } from "./engine-lrPwXorj.mjs";
import { a as ScrollText, c as Radar, d as Info, f as ExternalLink, i as ShieldAlert, l as Play, m as ChartLine, o as Scale, p as Crosshair, r as SkipForward, s as RotateCcw, t as X, u as Pause } from "../_libs/lucide-react.mjs";
import { a as Tooltip, i as ResponsiveContainer, n as YAxis, r as Area, t as AreaChart } from "../_libs/recharts+[...].mjs";
import { t as create } from "../_libs/zustand.mjs";
import { i as VersionedTransaction, n as Keypair, r as PublicKey, t as Connection } from "../_libs/@solana/web3.js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Be_ZtqhN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_PARAMS$1 = {
	maxRiskPct: .008,
	maxPoolPct: .015,
	ddHaltPct: .15
};
var DEFAULT_SEED = 28385;
function pickRun(world) {
	return world.runs.find((r) => r.status === "open")?.runId ?? world.runs.find((r) => r.status === "closed")?.runId ?? world.runs[0]?.runId ?? null;
}
var useFleet = create((set, get) => {
	const world = createWorld(DEFAULT_SEED, DEFAULT_PARAMS$1);
	return {
		world,
		running: true,
		speed: 1,
		showMtm: false,
		selected: pickRun(world),
		logFilter: "all",
		chainFilter: "all",
		tab: "tape",
		doctrine: false,
		contractOpen: false,
		tick: (speed) => {
			const steps = speed === 1 ? 1 : speed === 4 ? 3 : 8;
			set((s) => {
				let w = s.world;
				for (let i = 0; i < steps; i++) w = step$1(w);
				return { world: w };
			});
		},
		nudge: () => set((s) => ({ world: step$1(s.world) })),
		setRunning: (running) => set({ running }),
		setSpeed: (speed) => set({ speed }),
		setShowMtm: (showMtm) => set({ showMtm }),
		setParam: (key, value) => set((s) => ({ world: {
			...s.world,
			params: {
				...s.world.params,
				[key]: value
			}
		} })),
		reset: (seed) => {
			const safe = seed >>> 0 || 28385;
			const w = createWorld(safe, get().world.params);
			set({
				world: w,
				selected: pickRun(w),
				running: true
			});
		},
		select: (selected) => set({
			selected,
			tab: "tape"
		}),
		setLogFilter: (logFilter) => set({ logFilter }),
		setChainFilter: (chainFilter) => set({ chainFilter }),
		setTab: (tab) => set({ tab }),
		setDoctrine: (doctrine) => set({ doctrine }),
		setContractOpen: (contractOpen) => set({ contractOpen })
	};
});
var AGENTS$1 = [
	{
		id: "scanner",
		n: "01",
		name: "Scanner",
		role: "Discovery only. No opinion.",
		icon: Radar
	},
	{
		id: "rug",
		n: "02",
		name: "Rug check",
		role: "Kill fast. Fail is forever.",
		icon: ShieldAlert
	},
	{
		id: "sizer",
		n: "03",
		name: "Sizer",
		role: "Equity × risk. Never a flat dollar.",
		icon: Scale
	},
	{
		id: "executor",
		n: "04",
		name: "Executor",
		role: "Fill or abort. No rethink.",
		icon: Crosshair
	},
	{
		id: "logger",
		n: "05",
		name: "Logger",
		role: "Append-only. Off the hot path.",
		icon: ScrollText
	},
	{
		id: "equity",
		n: "06",
		name: "Equity",
		role: "Moves on close. Feeds the sizer.",
		icon: ChartLine
	}
];
var CHECK_LABELS = [
	{
		key: "honeypot",
		label: "Honeypot sim"
	},
	{
		key: "blacklist",
		label: "Blacklist"
	},
	{
		key: "mint_auth",
		label: "Mint authority"
	},
	{
		key: "freeze_auth",
		label: "Freeze authority"
	},
	{
		key: "tax_ok",
		label: "Sell tax"
	},
	{
		key: "lp_locked_or_burned",
		label: "LP lock"
	},
	{
		key: "deployer_ok",
		label: "Deployer"
	},
	{
		key: "holder_conc_ok",
		label: "Holders"
	},
	{
		key: "age_ok",
		label: "Contract age"
	},
	{
		key: "renounced",
		label: "Ownership"
	}
];
var TABS = [
	{
		id: "tape",
		label: "Tape"
	},
	{
		id: "curve",
		label: "Curve"
	},
	{
		id: "book",
		label: "Book"
	},
	{
		id: "log",
		label: "Log"
	}
];
function Desk({ onLive }) {
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
	const [mounted, setMounted] = (0, import_react.useState)(false);
	const [seedDraft, setSeedDraft] = (0, import_react.useState)(world.seed.toString(16));
	const [copied, setCopied] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setMounted(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!running) return;
		const ms = speed === 1 ? 720 : speed === 4 ? 420 : 260;
		const id = window.setInterval(() => tick(speed), ms);
		return () => window.clearInterval(id);
	}, [
		running,
		speed,
		tick
	]);
	(0, import_react.useEffect)(() => {
		if (!doctrine) return;
		const onKey = (e) => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh overflow-x-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "border-b border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-3 py-3 lg:px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeelMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-lg font-semibold tracking-widest",
								children: "KEEL"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs text-muted",
								children: "FLEET DESK"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Paper DEX fleet. Six agents. No role bleed."
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-mono text-xs text-muted",
								children: [
									"SIM ",
									formatClock(world.simSec),
									" UTC"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex items-center justify-end gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cx("inline-block size-2 rounded-full", statusLabel === "LIVE" && "bg-sage lamp-live", statusLabel === "HALTED" && "bg-rust", statusLabel === "PAUSED" && "bg-brass") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: statusLabel === "HALTED" ? "text-rust" : "text-fg",
									children: statusLabel
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-mono text-xs text-muted",
									children: "REALIZED EQUITY"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-mono text-2xl font-medium tabular-nums text-brass",
									children: formatUsd(snap.equity, 0)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cx("font-mono text-xs tabular-nums", world.lastPnl == null ? "text-muted" : world.lastPnl >= 0 ? "text-sage" : "text-rust"),
									children: world.lastPnl == null ? "no close yet" : `last close ${formatSignedUsd(world.lastPnl)}`
								})
							]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-[1440px] flex-col gap-3 px-3 py-3 lg:px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-11 items-center gap-2 rounded-md bg-brass px-4 text-sm font-medium text-brass-ink",
								onClick: () => setRunning(!running),
								children: [running ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), running ? "Pause" : "Run"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm disabled:opacity-40",
								onClick: () => nudge(),
								disabled: running,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, { className: "size-4" }), "Step"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								value: String(speed),
								options: [
									{
										id: "1",
										label: "1×"
									},
									{
										id: "4",
										label: "4×"
									},
									{
										id: "16",
										label: "16×"
									}
								],
								onChange: (id) => setSpeed(Number(id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segmented, {
								value: chainFilter,
								options: [
									{
										id: "all",
										label: "All"
									},
									{
										id: "solana",
										label: "Solana"
									},
									{
										id: "base",
										label: "Base"
									}
								],
								onChange: (id) => setChainFilter(id)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted",
									children: "Seed"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: seedDraft,
									onChange: (e) => setSeedDraft(e.target.value),
									spellCheck: false,
									"aria-label": "Simulation seed",
									className: "w-20 bg-transparent font-mono text-sm text-fg outline-none"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm",
								onClick: () => {
									const next = parseSeed(seedDraft);
									setSeedDraft(next.toString(16));
									reset(next);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), "Reset"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "inline-flex h-11 items-center gap-2 rounded-md border border-brass bg-surface px-3 text-sm text-brass",
								onClick: onLive,
								children: "Live markets"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm",
								onClick: () => setDoctrine(true),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-4" }), "Doctrine"]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider$1, {
								label: "Max risk / trade",
								display: formatPct(world.params.maxRiskPct, 2),
								min: .002,
								max: .02,
								step: .001,
								value: world.params.maxRiskPct,
								onChange: (v) => setParam("maxRiskPct", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider$1, {
								label: "Max size vs pool",
								display: formatPct(world.params.maxPoolPct, 1),
								min: .005,
								max: .03,
								step: .001,
								value: world.params.maxPoolPct,
								onChange: (v) => setParam("maxPoolPct", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider$1, {
								label: "Halt entries at drawdown",
								display: formatPct(world.params.ddHaltPct, 0),
								min: .05,
								max: .3,
								step: .01,
								value: world.params.ddHaltPct,
								onChange: (v) => setParam("ddHaltPct", v)
							})
						]
					})]
				})
			}),
			snap.halted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-line bg-rust-dim",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mx-auto max-w-[1440px] px-3 py-2 text-sm text-rust lg:px-4",
					children: [
						"Entries halted. Drawdown ",
						formatPct(snap.drawdownPct),
						" is through the",
						" ",
						formatPct(world.params.ddHaltPct, 0),
						" circuit inside the sizer. Exits still run. Raise the halt, or wait until equity makes a new high."
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto grid w-full max-w-[1440px] gap-3 px-3 py-3 lg:grid-cols-[16rem_minmax(0,1fr)_22rem] lg:px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "min-w-0 lg:sticky lg:top-3 lg:self-start",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0",
							children: AGENTS$1.map((agent) => {
								const active = world.lastHop?.agent === agent.id;
								const Icon = agent.icon;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: cx("min-w-[11.5rem] shrink-0 rounded-md border bg-surface p-3 lg:min-w-0", active ? "border-brass" : "border-line"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cx("size-4", active ? "text-brass" : "text-muted") }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono text-xs text-faint",
													children: agent.n
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
													className: "text-sm font-semibold",
													children: agent.name
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 hidden text-xs text-pretty text-muted lg:block",
											children: agent.role
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 font-mono text-xs tabular-nums text-fg",
											children: agentStat(agent.id, world.counts)
										})
									]
								}, agent.id);
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 hidden text-xs text-pretty text-faint lg:block",
							children: [
								"Scanner floors: ",
								formatUsd(SCANNER_FLOORS.minLiquidity, 0),
								" liquidity,",
								" ",
								formatAge(SCANNER_FLOORS.minAgeSec),
								" age, ",
								formatUsd(SCANNER_FLOORS.minVol1h, 0),
								" hourly volume. Check flags are clear-bits — true means the risk is absent."
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 flex-col gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-4 gap-1 lg:hidden",
								children: TABS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": tab === item.id,
									className: cx("h-11 rounded-md border text-sm", tab === item.id ? "border-brass bg-brass text-brass-ink" : "border-line bg-surface text-fg"),
									onClick: () => setTab(item.id),
									children: item.label
								}, item.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
								className: cx("min-w-0", tab !== "tape" && "max-lg:hidden"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel$1, {
									title: "Candidate tape",
									action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-xs text-muted",
										children: world.lastHop ? `${world.lastHop.agent} · ${world.lastHop.symbol}` : "waiting"
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "border-b border-line px-3 py-2 text-sm text-pretty text-muted",
										"aria-live": "polite",
										children: world.lastHop ? `${world.lastHop.detail}` : "Scanner is quiet. Rug check has not been asked anything."
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "max-h-80 overflow-auto",
										children: runs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "px-3 py-6 text-sm text-muted",
											children: "Nothing on this chain yet."
										}) : runs.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											id: `run-${row.runId}`,
											type: "button",
											onClick: () => select(row.runId),
											className: cx("flex w-full items-start gap-3 border-b border-line px-3 py-2.5 text-left", row.runId === run?.runId ? "bg-surface-2" : "hover:bg-surface-2"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cx("mt-1 w-1 shrink-0 self-stretch rounded-full", row.runId === run?.runId ? "bg-brass" : "bg-transparent") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "min-w-0 flex-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-baseline justify-between gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-sm font-semibold",
														children: [row.symbol, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "ml-2 font-mono text-xs font-normal text-muted",
															children: row.chain === "solana" ? "SOL" : "BASE"
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outcome$1, { row })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mt-0.5 block truncate text-sm text-muted",
													children: row.scanner.reason
												})]
											})]
										}, row.runId))
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
								className: cx("min-w-0", tab !== "tape" && "max-lg:hidden"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inspector, {
									run,
									again,
									prior: run ? world.runs.find((r) => r.token === run.token && r.runId !== run.runId) ?? null : null,
									contractOpen,
									copied,
									onToggleContract: () => setContractOpen(!contractOpen),
									onCopy: (text) => {
										navigator.clipboard?.writeText(text).then(() => {
											setCopied(true);
											window.setTimeout(() => setCopied(false), 1200);
										}, () => setCopied(false));
									}
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
								className: cx("min-w-0", tab !== "log" && "max-lg:hidden"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel$1, {
									title: "Audit log",
									action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-2 text-xs text-muted",
										children: ["Agent", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: logFilter,
											"aria-label": "Filter log by agent",
											onChange: (e) => setLogFilter(e.target.value),
											className: "h-9 rounded-md border border-line bg-bg px-2 text-sm text-fg",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "all",
												children: "All"
											}), AGENTS$1.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: a.id,
												children: a.name
											}, a.id))]
										})]
									}),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "max-h-80 overflow-auto",
										children: logs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "px-3 py-6 text-sm text-muted",
											children: "No rows for this filter."
										}) : logs.slice(0, 160).map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => select(event.runId),
											className: "flex w-full flex-col gap-0.5 border-b border-line px-3 py-2.5 text-left hover:bg-surface-2 sm:flex-row sm:items-baseline sm:gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex shrink-0 items-baseline gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "w-16 font-mono text-xs tabular-nums text-faint",
														children: formatClock((event.ts - EPOCH) / 1e3)
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: cx("w-16 font-mono text-xs", toneFor(event)),
														children: event.agent
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "w-14 text-sm font-medium",
														children: event.symbol
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "min-w-0 flex-1 truncate text-sm text-muted",
												children: event.summary
											})]
										}, event.id))
									})
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 flex-col gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
							className: cx(tab !== "curve" && "max-lg:hidden"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EquityPanel, {
								mounted,
								showMtm,
								onToggle: () => setShowMtm(!showMtm),
								marks: world.marks,
								snap
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
							className: cx(tab !== "book" && "max-lg:hidden"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Book, {
								worldSim: world.simSec,
								positions: world.positions,
								closes: world.recentCloses,
								snap,
								onSelect: select
							})
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "mx-auto max-w-[1440px] px-3 pb-8 text-xs text-pretty text-faint lg:px-4",
				children: "Paper simulation. Deterministic for a seed. Not a wallet, not a venue, not advice. Realized equity is the only number the sizer reads, and it changes when a trade closes."
			}),
			doctrine && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Doctrine, { onClose: () => setDoctrine(false) })
		]
	});
}
function agentStat(id, counts) {
	if (id === "scanner") return `${counts.scanned} emitted`;
	if (id === "rug") return `${counts.rugFail} killed · ${counts.rugPass} pass`;
	if (id === "sizer") return `${counts.sized} sized · ${counts.sizeZero} zero`;
	if (id === "executor") return `${counts.filled} fill · ${counts.aborted} abort · ${counts.partial} partial`;
	if (id === "logger") return `${counts.logged} rows`;
	return `${counts.closed} closes`;
}
function Panel$1({ title, action, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-md border border-line bg-surface",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between gap-3 border-b border-line px-3 py-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xs font-semibold tracking-widest text-muted",
				children: title
			}), action]
		}), children]
	});
}
function Outcome$1({ row }) {
	if (row.status === "fail") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip$1, {
		tone: "rust",
		children: "FAIL"
	});
	if (row.status === "skip") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip$1, {
		tone: "brass",
		children: "NO SIZE"
	});
	if (row.status === "aborted") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip$1, {
		tone: "rust",
		children: "ABORT"
	});
	if (row.status === "open" && row.entry?.status === "PARTIAL") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip$1, {
		tone: "brass",
		children: "PARTIAL"
	});
	if (row.status === "open") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip$1, {
		tone: "sage",
		children: "OPEN"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cx("font-mono text-xs tabular-nums", (row.pnl ?? 0) >= 0 ? "text-sage" : "text-rust"),
		children: formatSignedUsd(row.pnl ?? 0)
	});
}
function Chip$1({ tone, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cx("inline-flex h-6 items-center rounded-md px-2 font-mono text-xs", tone === "rust" && "bg-rust-dim text-rust", tone === "sage" && "bg-sage-dim text-sage", tone === "brass" && "bg-surface-2 text-brass"),
		children
	});
}
function Segmented({ value, options, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-11 rounded-md border border-line bg-surface p-1",
		children: options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-pressed": value === opt.id,
			className: cx("rounded-md px-3 text-sm", value === opt.id ? "bg-brass text-brass-ink" : "text-fg"),
			onClick: () => onChange(opt.id),
			children: opt.label
		}, opt.id))
	});
}
function Slider$1({ label, display, min, max, step, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex min-w-0 flex-col gap-2 py-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-baseline justify-between gap-3 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-muted",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono tabular-nums text-fg",
				children: display
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "range",
			min,
			max,
			step,
			value,
			"aria-label": label,
			onChange: (e) => onChange(Number(e.target.value)),
			className: "h-6 w-full accent-brass"
		})]
	});
}
function Inspector({ run, again, prior, contractOpen, copied, onToggleContract, onCopy }) {
	const payload = run ? {
		scanner: run.scanner,
		rug: run.rug,
		sizer: run.sizer,
		entry: run.entry,
		exit: run.exit
	} : null;
	const json = contractOpen && payload ? JSON.stringify(payload, null, 2) : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel$1, {
		title: "Hand-off",
		action: run && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-9 rounded-md border border-line px-2 text-xs",
				onClick: onToggleContract,
				children: contractOpen ? "Hide JSON" : "Hand-off JSON"
			}), contractOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-9 rounded-md border border-line px-2 text-xs",
				onClick: () => onCopy(json),
				children: copied ? "Copied" : "Copy"
			})]
		}),
		children: !run || !again ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-3 py-6 text-sm text-muted",
			children: "Select a candidate to read each agent’s output."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-3 p-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-lg font-semibold",
							children: run.symbol
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-muted",
							children: run.name
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "break-all font-mono text-xs text-muted",
						children: run.token
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-xs text-faint",
						children: ["run ", run.runId]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-2 sm:grid-cols-2",
					children: CHECK_LABELS.slice().sort((a, b) => CHECK_ORDER.indexOf(a.key) - CHECK_ORDER.indexOf(b.key)).map((item) => {
						const ok = run.rug.checks[item.key];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: item.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: ok ? "font-medium text-sage" : "font-medium text-rust",
								children: ok ? "Clear" : "Fail"
							})]
						}, item.key);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Rug check · "
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: run.rug.verdict === "PASS" ? "text-sage" : "text-rust",
							children: run.rug.verdict
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: [" · ", run.rug.reason]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 border-t border-line pt-3 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Block$1, {
							title: "Scanner",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line$1, {
									k: "Trigger",
									v: run.scanner.trigger.replaceAll("_", " ")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line$1, {
									k: "Rank",
									v: String(run.scanner.rank_score)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line$1, {
									k: "Age",
									v: formatAge(run.scanner.age_sec)
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Block$1, {
							title: "Sizer",
							children: run.sizer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line$1, {
									k: "Size",
									v: run.sizer.size_usd ? formatUsd(run.sizer.size_usd) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line$1, {
									k: "Tokens",
									v: run.sizer.size_tokens ? formatTokens(run.sizer.size_tokens) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line$1, {
									k: "Max slip",
									v: formatBps(run.sizer.max_slippage_bps)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line$1, {
									k: "Equity used",
									v: formatUsd(run.sizer.equity_at_decision, 0)
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Not called. Rug check stopped the pipe."
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Block$1, {
							title: "Executor",
							children: run.entry ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line$1, {
									k: "Entry",
									v: run.entry.status
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line$1, {
									k: "Fill",
									v: run.entry.fill_price ? formatPx(run.entry.fill_price) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line$1, {
									k: "Slip",
									v: formatBps(run.entry.slippage_bps)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line$1, {
									k: "Exit",
									v: run.exit ? run.exit.reason : run.status === "open" ? "working" : "—"
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: run.sizer ? "Not called. Size was zero." : "Not called."
							})
						})
					]
				}),
				run.sizer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-pretty text-muted",
					children: run.sizer.reason
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-pretty",
					children: [again.rugMatch && (again.sizeMatch || !run.sizer) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sage",
						children: "Deterministic replay matches this decision."
					}) : !again.paramsMatch ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-brass",
						children: [
							"Replay with the sliders you see now would",
							" ",
							again.sizer ? `size ${formatUsd(again.sizer.size_usd)}` : "not size",
							". The recorded decision stands."
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-rust",
						children: "Replay diverged from the recorded decision."
					}), prior && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: [
							" ",
							"Another run ",
							prior.runId,
							" on this contract was ",
							prior.rug.verdict,
							"."
						]
					})]
				}),
				contractOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "max-h-64 overflow-auto rounded-md border border-line bg-bg p-3 font-mono text-xs leading-relaxed text-fg",
					children: json
				})
			]
		})
	});
}
function Block$1({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
		className: "mb-1 text-xs font-semibold tracking-widest text-muted",
		children: title
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-1",
		children
	})] });
}
function Line$1({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "flex items-baseline justify-between gap-3 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "truncate font-mono text-xs tabular-nums",
			children: v
		})]
	});
}
function toneFor(event) {
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
function EquityPanel({ mounted, showMtm, onToggle, marks, snap }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel$1, {
		title: "Equity curve",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-pressed": showMtm,
			onClick: onToggle,
			className: cx("h-9 rounded-md border px-2 text-xs", showMtm ? "border-brass text-brass" : "border-line text-muted"),
			children: showMtm ? "Mark on" : "Show mark"
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-3 pt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-2xl tabular-nums text-brass",
						children: formatUsd(snap.equity, 0)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: cx("font-mono text-sm tabular-nums", snap.drawdownPct > 0 ? "text-rust" : "text-sage"),
						children: ["DD ", formatPct(snap.drawdownPct)]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "Published on close only. The sizer cannot see unrealized."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-40 px-1",
				children: mounted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
						data: marks,
						margin: {
							top: 12,
							right: 8,
							left: 8,
							bottom: 0
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								hide: true,
								domain: ["auto", "auto"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								cursor: { stroke: "var(--color-line)" },
								contentStyle: {
									background: "var(--color-surface)",
									border: "1px solid var(--color-line)",
									borderRadius: 8,
									color: "var(--color-fg)",
									fontFamily: "var(--font-mono)",
									fontSize: 12
								},
								formatter: (value, name) => [formatUsd(Number(value ?? 0), 0), name === "mtm" ? "Mark" : "Realized"],
								labelFormatter: (label) => formatClock(Number(label))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
								type: "stepAfter",
								dataKey: "equity",
								stroke: "var(--color-brass)",
								fill: "var(--color-brass)",
								fillOpacity: .16,
								strokeWidth: 1.75,
								dot: false,
								isAnimationActive: false
							}),
							showMtm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
								type: "monotone",
								dataKey: "mtm",
								stroke: "var(--color-sage)",
								fill: "transparent",
								strokeWidth: 1.25,
								dot: false,
								isAnimationActive: false
							})
						]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "grid grid-cols-2 gap-x-3 gap-y-3 border-t border-line p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						k: "Win rate",
						v: snap.tradesClosed ? formatPct(snap.winRate, 0) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						k: "Expectancy",
						v: snap.tradesClosed ? formatSignedUsd(snap.expectancy) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						k: "Closed",
						v: String(snap.tradesClosed)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						k: "Avg slip",
						v: snap.avgSlipBps ? formatBps(snap.avgSlipBps) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						k: "Avg hold",
						v: snap.avgHoldSec ? formatDuration(snap.avgHoldSec) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat$1, {
						k: "Open notional",
						v: formatUsd(snap.openNotional, 0)
					})
				]
			})
		]
	});
}
function Stat$1({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-xs text-muted",
		children: k
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "font-mono text-sm tabular-nums",
		children: v
	})] });
}
function Book({ worldSim, positions, closes, snap, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel$1, {
		title: "Book",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-xs text-muted",
			children: snap.halted ? "exits only" : `${positions.length} open`
		}),
		children: [positions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-3 py-4 text-sm text-muted",
			children: "Flat. No open risk."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: positions.map((p) => {
			const pnl = positionPnl$1(p, worldSim);
			const last = markPrice(p, worldSim);
			const left = Math.max(0, p.deadlineSec - worldSim);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "border-b border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onSelect(p.runId),
					className: "flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-14 text-sm font-semibold",
							children: p.symbol
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1 font-mono text-xs text-muted",
							children: [
								formatPx(p.fillPrice),
								" → ",
								formatPx(last),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-faint",
									children: [
										" · ",
										formatDuration(left),
										" left"
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cx("font-mono text-xs tabular-nums", pnl >= 0 ? "text-sage" : "text-rust"),
							children: formatSignedUsd(pnl)
						})
					]
				})
			}, p.runId);
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border-t border-line",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "px-3 pt-3 text-xs font-semibold tracking-widest text-muted",
				children: "Last closes"
			}), closes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 py-3 text-sm text-muted",
				children: "No closes yet. Equity has not moved."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "pb-1",
				children: closes.slice(0, 6).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onSelect(c.runId),
					className: "flex min-h-11 w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-surface-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-14 text-sm",
							children: c.symbol
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1 truncate text-sm text-muted",
							children: [
								c.reason,
								" · ",
								formatDuration(c.holdSec)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cx("font-mono text-xs tabular-nums", c.pnl >= 0 ? "text-sage" : "text-rust"),
							children: formatSignedUsd(c.pnl)
						})
					]
				}) }, c.runId + c.reason))
			})]
		})]
	});
}
function Doctrine({ onClose }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex items-end justify-center bg-bg/80 p-3 sm:items-center",
		role: "presentation",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-labelledby": "doctrine-title",
			className: "max-h-[85dvh] w-full max-w-lg overflow-auto rounded-md border border-line bg-surface p-4",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "doctrine-title",
						className: "text-lg font-semibold",
						children: "Doctrine"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-pretty text-muted",
						children: "One direction. Each agent has one job."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						"aria-label": "Close doctrine",
						className: "inline-flex size-11 items-center justify-center rounded-md border border-line",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
					className: "mt-4 flex flex-col gap-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold",
							children: "Scanner"
						}), " surfaces pairs and spikes. It does not size or trade."] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold",
							children: "Rug check"
						}), " runs before any size. Fail discards that contract forever."] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold",
							children: "Sizer"
						}), " uses equity × risk, then cuts for volatility, pool depth, slippage, and gas. A circuit breaker lives here, reading drawdown — not as a seventh shared variable."] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold",
							children: "Executor"
						}), " fills, partially fills, or aborts. It does not reopen the thesis."] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold",
							children: "Logger"
						}), " appends every hop, including rejects. It never decides."] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold",
							children: "Equity curve"
						}), " updates when a trade closes and publishes that number back to the sizer."] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-pretty text-muted",
					children: "Shared mutable state is only realized equity and the append-only log. Replaying a candidate with the same inputs returns the same verdict and the same size. This desk is paper: no keys, no chain, no orders."
				})
			]
		})
	});
}
function KeelMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "36",
		height: "36",
		viewBox: "0 0 32 32",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "32",
				height: "32",
				rx: "6",
				fill: "var(--color-surface-2)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 23.5 16 7.5 24 23.5",
				fill: "none",
				stroke: "var(--color-brass)",
				strokeWidth: "2.2",
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M11.2 19.5h9.6",
				stroke: "var(--color-sage)",
				strokeWidth: "1.6",
				strokeLinecap: "round"
			})
		]
	});
}
function parseSeed(raw) {
	const t = raw.trim().toLowerCase().replace(/^0x/, "");
	if (!t) return DEFAULT_SEED;
	const n = /[a-f]/.test(t) ? Number.parseInt(t, 16) : Number.parseInt(t, 10);
	if (!Number.isFinite(n) || n <= 0) return DEFAULT_SEED;
	return n >>> 0;
}
var HOLD_MS$1 = 72e4;
var DEFAULT_PARAMS = {
	maxRiskPct: .008,
	maxPoolPct: .015,
	ddHaltPct: .15
};
function blankBook(now = Date.now()) {
	return {
		equity: START_EQUITY,
		peak: START_EQUITY,
		params: { ...DEFAULT_PARAMS },
		runs: [],
		logs: [],
		positions: [],
		closes: [],
		curve: [{
			t: now,
			equity: START_EQUITY,
			mtm: START_EQUITY
		}],
		watch: [],
		quotes: {},
		noted: {},
		decided: {},
		condemned: {},
		wins: 0,
		pnlSum: 0,
		closedN: 0,
		slipSum: 0,
		slipN: 0,
		holdSum: 0,
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
		}
	};
}
function gasUsd(chain) {
	return chain === "solana" ? .08 : .62;
}
function scannerOf(row, now) {
	return {
		run_id: row.runId,
		token: row.token,
		pair: row.pair,
		chain: row.chain,
		discovered_at: now,
		trigger: row.trigger,
		liquidity_usd: row.liquidityUsd,
		vol_1h_usd: row.vol1hUsd,
		age_sec: row.ageSec,
		rank_score: row.rankScore,
		reason: `${row.trigger.replaceAll("_", " ")} · liq ${formatUsd(row.liquidityUsd, 0)} · 1h ${formatUsd(row.vol1hUsd, 0)} · age ${formatAge(row.ageSec)}`
	};
}
function factsFor(row) {
	return {
		address: row.token,
		symbol: row.symbol,
		name: row.name,
		chain: row.chain,
		price: row.price,
		liquidityUsd: row.liquidityUsd,
		vol1hUsd: row.vol1hUsd,
		volatility: row.volatility,
		ageSec: row.ageSec,
		renounced: true,
		mintLive: false,
		freeze: false,
		honeypot: false,
		taxBps: 0,
		blacklist: false,
		deployerOk: true,
		lpLocked: true,
		top10: 0,
		path: {
			phase: 0,
			driftPerMin: 0,
			vol: row.volatility,
			shockAt: 0xe8d4a51000,
			shockMag: 0
		}
	};
}
function log(book, event) {
	book.logs = [event, ...book.logs].slice(0, 200);
	book.counts = {
		...book.counts,
		logged: book.counts.logged + 1
	};
}
function logDrop(input, rows, reason, now) {
	const book = {
		...input,
		counts: { ...input.counts },
		logs: input.logs
	};
	for (const row of rows) {
		const id = `${row.runId}:drop`;
		if (book.logs.some((event) => event.id === id)) continue;
		const payload = {
			run_id: row.runId,
			token: row.token,
			agent: "rug",
			error: reason
		};
		log(book, {
			id,
			runId: row.runId,
			ts: now,
			agent: "logger",
			symbol: row.symbol,
			token: row.token,
			summary: `dropped · ${reason}`,
			payload
		});
	}
	return book;
}
function drawdown(book) {
	if (book.peak <= 0) return 0;
	return (book.peak - book.equity) / book.peak;
}
function upsertRun(book, run) {
	const idx = book.runs.findIndex((item) => item.runId === run.runId);
	if (idx === -1) book.runs = [run, ...book.runs].slice(0, 80);
	else {
		const next = book.runs.slice();
		next[idx] = run;
		book.runs = next;
	}
}
function markMap(pull) {
	const marks = /* @__PURE__ */ new Map();
	for (const mark of pull.marks) if (mark.price > 0) marks.set(mark.token, mark.price);
	return marks;
}
function unrealized(position, price) {
	const slip = estimateSlipBps(position.sizeUsd, position.liquidity, .4) / 1e4;
	return position.sizeTokens * price * (1 - slip) - position.sizeUsd - position.gasIn - gasUsd(position.chain);
}
function positionPnl(position, price) {
	if (!price || price <= 0) return null;
	return unrealized(position, price);
}
function applyPull(input, pull, now) {
	const book = {
		...input,
		counts: { ...input.counts },
		noted: { ...input.noted },
		decided: { ...input.decided },
		condemned: { ...input.condemned },
		runs: input.runs.slice(),
		logs: input.logs,
		positions: input.positions.slice(),
		closes: input.closes.slice(),
		watch: pull.rows,
		quotes: { ...input.quotes },
		params: input.params
	};
	for (const mark of pull.marks) if (mark.price > 0) book.quotes[mark.token] = mark.price;
	const prices = markMap(pull);
	for (const row of pull.rows) {
		if (book.condemned[row.token] || book.positions.some((position) => position.token === row.token)) continue;
		if (!book.noted[row.runId]) {
			const scanner = scannerOf(row, now);
			book.noted[row.runId] = true;
			book.counts.scanned += 1;
			log(book, {
				id: `${row.runId}:scanner`,
				runId: row.runId,
				ts: now,
				agent: "scanner",
				symbol: row.symbol,
				token: row.token,
				summary: scanner.reason,
				payload: scanner
			});
			upsertRun(book, {
				runId: row.runId,
				symbol: row.symbol,
				name: row.name,
				token: row.token,
				chain: row.chain,
				status: "pending",
				scanner,
				rug: null,
				sizer: null,
				entry: null,
				exit: null,
				pnl: null,
				url: row.url
			});
		}
		if (!row.rug || book.decided[row.runId]) continue;
		const rug = {
			...row.rug,
			run_id: row.runId,
			token: row.token
		};
		book.decided[row.runId] = true;
		log(book, {
			id: `${row.runId}:rug`,
			runId: row.runId,
			ts: now,
			agent: "rug",
			symbol: row.symbol,
			token: row.token,
			summary: `${rug.verdict} · ${rug.reason}`,
			payload: rug
		});
		const existing = book.runs.find((run) => run.runId === row.runId);
		const run = existing ? {
			...existing,
			rug,
			url: row.url
		} : {
			runId: row.runId,
			symbol: row.symbol,
			name: row.name,
			token: row.token,
			chain: row.chain,
			status: "pending",
			scanner: scannerOf(row, now),
			rug,
			sizer: null,
			entry: null,
			exit: null,
			pnl: null,
			url: row.url
		};
		if (rug.verdict === "FAIL") {
			book.counts.rugFail += 1;
			book.condemned[row.token] = true;
			upsertRun(book, {
				...run,
				status: "fail",
				rug
			});
			continue;
		}
		book.counts.rugPass += 1;
		const equity = round(book.equity, 2);
		const sizer = sizeFor(factsFor(row), row.runId, {
			equity,
			drawdown: round(drawdown(book), 4),
			volatility: row.volatility,
			liquidity: row.liquidityUsd,
			vol1h: row.vol1hUsd,
			price: row.price,
			wave: 0
		}, book.params);
		log(book, {
			id: `${row.runId}:sizer`,
			runId: row.runId,
			ts: now,
			agent: "sizer",
			symbol: row.symbol,
			token: row.token,
			summary: sizer.reason,
			payload: sizer
		});
		if (sizer.size_usd <= 0) {
			book.counts.sizeZero += 1;
			upsertRun(book, {
				...run,
				status: "skip",
				rug,
				sizer
			});
			continue;
		}
		book.counts.sized += 1;
		const entry = fillEntry(row, sizer);
		log(book, {
			id: `${row.runId}:entry`,
			runId: row.runId,
			ts: now,
			agent: "executor",
			symbol: row.symbol,
			token: row.token,
			summary: `${entry.action} ${entry.status} · ${entry.reason}`,
			payload: entry
		});
		if (entry.status === "ABORTED") {
			book.counts.aborted += 1;
			upsertRun(book, {
				...run,
				status: "aborted",
				rug,
				sizer,
				entry
			});
			continue;
		}
		book.counts.filled += 1;
		book.slipSum += entry.slippage_bps;
		book.slipN += 1;
		const stop = stopPctFor(row.volatility);
		const take = takePctFor(row.volatility);
		book.positions.push({
			runId: row.runId,
			token: row.token,
			symbol: row.symbol,
			chain: row.chain,
			entryMid: row.price,
			fillPrice: entry.fill_price,
			sizeUsd: entry.size_usd,
			sizeTokens: round(entry.size_usd / entry.fill_price, 6),
			stopPx: row.price * (1 - stop),
			takePx: row.price * (1 + take),
			deadlineMs: now + HOLD_MS$1,
			openedAt: now,
			gasIn: entry.gas_usd,
			liquidity: row.liquidityUsd,
			maxSlippageBps: sizer.max_slippage_bps
		});
		upsertRun(book, {
			...run,
			status: "open",
			rug,
			sizer,
			entry
		});
	}
	const still = [];
	for (const position of book.positions) {
		const price = prices.get(position.token);
		let trigger = null;
		if (price && price <= position.stopPx) trigger = "stop";
		else if (price && price >= position.takePx) trigger = "take-profit";
		else if (now >= position.deadlineMs) trigger = "time";
		if (!trigger || !price) {
			still.push(position);
			continue;
		}
		closePosition(book, position, price, trigger, now);
	}
	book.positions = still;
	const mtm = round(book.equity + book.positions.reduce((sum, position) => {
		const price = prices.get(position.token);
		return sum + (price ? unrealized(position, price) : 0);
	}, 0), 2);
	const curve = book.curve.slice();
	curve.push({
		t: now,
		equity: round(book.equity, 2),
		mtm
	});
	book.curve = curve.slice(-180);
	return book;
}
function fillEntry(row, sizer) {
	const slip = estimateSlipBps(sizer.size_usd, row.liquidityUsd, row.volatility);
	if (slip > sizer.max_slippage_bps) return {
		run_id: row.runId,
		token: row.token,
		action: "entry",
		status: "ABORTED",
		fill_price: 0,
		size_usd: 0,
		gas_usd: 0,
		slippage_bps: slip,
		tx_hash: "",
		reason: `aborted pre-send · slip ${slip} > max ${sizer.max_slippage_bps}`
	};
	const fill = round(row.price * (1 + slip / 1e4), 8);
	return {
		run_id: row.runId,
		token: row.token,
		action: "entry",
		status: "FILLED",
		fill_price: fill,
		size_usd: sizer.size_usd,
		gas_usd: round(gasUsd(row.chain), 2),
		slippage_bps: slip,
		tx_hash: `paper_${hashString(row.runId).toString(16).slice(0, 12)}`,
		reason: `paper fill on live price · ${slip} bps`
	};
}
function closePosition(book, position, price, trigger, now) {
	const slip = estimateSlipBps(position.sizeUsd, position.liquidity, .4);
	const fill = round(price * (1 - slip / 1e4), 8);
	const gasOut = round(gasUsd(position.chain), 2);
	const pnl = round(position.sizeTokens * fill - position.sizeUsd - position.gasIn - gasOut, 2);
	const ret = position.sizeUsd > 0 ? pnl / position.sizeUsd : 0;
	book.equity = round(book.equity + pnl, 2);
	if (book.equity > book.peak) book.peak = book.equity;
	book.pnlSum = round(book.pnlSum + pnl, 2);
	book.closedN += 1;
	book.counts.closed += 1;
	book.holdSum += Math.max(0, (now - position.openedAt) / 1e3);
	if (pnl > 0) book.wins += 1;
	book.lastPnl = pnl;
	const exit = {
		run_id: position.runId,
		token: position.token,
		action: "exit",
		status: "FILLED",
		fill_price: fill,
		size_usd: position.sizeUsd,
		gas_usd: gasOut,
		slippage_bps: slip,
		tx_hash: `paper_${hashString(`${position.runId}:exit`).toString(16).slice(0, 12)}`,
		reason: `paper exit · ${trigger} · ${formatPct(ret, 1)}`
	};
	log(book, {
		id: `${position.runId}:exit`,
		runId: position.runId,
		ts: now,
		agent: "executor",
		symbol: position.symbol,
		token: position.token,
		summary: exit.reason,
		payload: exit
	});
	log(book, {
		id: `${position.runId}:equity:${now}`,
		runId: position.runId,
		ts: now,
		agent: "equity",
		symbol: position.symbol,
		token: position.token,
		summary: `equity ${formatUsd(book.equity)} · dd ${formatPct(drawdown(book))}`,
		payload: {
			equity_usd: book.equity,
			drawdown_pct: round(drawdown(book), 4),
			win_rate: round(book.closedN ? book.wins / book.closedN : 0, 4),
			expectancy_usd: round(book.closedN ? book.pnlSum / book.closedN : 0, 2),
			trades_closed: book.closedN,
			as_of: now
		}
	});
	book.closes = [{
		runId: position.runId,
		symbol: position.symbol,
		chain: position.chain,
		pnl,
		holdSec: (now - position.openedAt) / 1e3,
		reason: trigger,
		ret
	}, ...book.closes].slice(0, 16);
	const idx = book.runs.findIndex((run) => run.runId === position.runId);
	if (idx >= 0) {
		const next = book.runs.slice();
		next[idx] = {
			...next[idx],
			status: "closed",
			exit,
			pnl
		};
		book.runs = next;
	}
}
function snapshotOf(book, prices) {
	const dd = drawdown(book);
	const openNotional = book.positions.reduce((sum, position) => sum + position.sizeUsd, 0);
	const u = book.positions.reduce((sum, position) => {
		const price = prices.get(position.token);
		return sum + (price ? unrealized(position, price) : 0);
	}, 0);
	return {
		equity: book.equity,
		drawdownPct: dd,
		winRate: book.closedN ? book.wins / book.closedN : 0,
		expectancy: book.closedN ? book.pnlSum / book.closedN : 0,
		tradesClosed: book.closedN,
		avgSlipBps: book.slipN ? book.slipSum / book.slipN : 0,
		avgHoldSec: book.closedN ? book.holdSum / book.closedN : 0,
		mtm: book.equity + u,
		halted: dd >= book.params.ddHaltPct - 1e-9,
		openNotional
	};
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
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
var pullMarkets = createServerFn({ method: "POST" }).validator((input) => ({
	solana: cleanList(input?.solana, "solana"),
	base: cleanList(input?.base, "base")
})).handler(createSsrRpc("29e210dbad9a554e7e88620c2df9b7c1ae7e6236c6993d235e16b81d35d42c4f"));
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
}).handler(createSsrRpc("d86ee6e04e610e0e1a452bdf750c79b63cf4f8c3bb086aeb51680995cc5e7754"));
var KEY = "keel-live-v1";
var seq = 0;
function sane(value) {
	if (!value || typeof value !== "object") return null;
	const book = value;
	if (typeof book.equity !== "number" || !book.params || !Array.isArray(book.runs)) return null;
	return {
		...blankBook(),
		...book,
		quotes: book.quotes ?? {},
		noted: book.noted ?? {},
		decided: book.decided ?? {},
		condemned: book.condemned ?? {},
		counts: {
			...blankBook().counts,
			...book.counts
		}
	};
}
function read$1() {
	if (typeof localStorage === "undefined") return null;
	try {
		return sane(JSON.parse(localStorage.getItem(KEY) ?? ""));
	} catch {
		return null;
	}
}
function write$1(book) {
	try {
		localStorage.setItem(KEY, JSON.stringify(book));
	} catch {}
}
var useLive = create((set, get) => ({
	book: blankBook(),
	paused: false,
	status: "idle",
	note: null,
	error: null,
	updatedAt: 0,
	ready: false,
	hydrate: () => {
		if (get().ready) return;
		set({
			book: read$1() ?? blankBook(),
			ready: true
		});
	},
	refresh: async () => {
		const id = ++seq;
		if (get().status === "idle") set({ status: "loading" });
		const book = get().book;
		try {
			const pull = await pullMarkets({ data: {
				solana: book.positions.filter((position) => position.chain === "solana").map((position) => position.token),
				base: book.positions.filter((position) => position.chain === "base").map((position) => position.token)
			} });
			if (id !== seq) return;
			const seen = applyPull(get().book, pull, Date.now());
			write$1(seen);
			set({
				book: seen,
				status: "live",
				note: pull.note,
				error: null,
				updatedAt: pull.scannedAt
			});
			const pending = pull.rows.filter((row) => !row.rug && !seen.decided[row.runId] && !seen.condemned[row.token]).slice(0, 6);
			if (pending.length === 0) return;
			let checked;
			try {
				checked = await checkSecurity({ data: { tokens: pending.map((row) => ({
					token: row.token,
					chain: row.chain,
					ageSec: row.ageSec
				})) } });
			} catch (error) {
				if (id !== seq) return;
				const message = (error instanceof Error ? error.message : "Rug check did not answer.").replace(/\s+/g, " ").slice(0, 140) || "Rug check did not answer.";
				const dropped = logDrop(get().book, pending, message, Date.now());
				write$1(dropped);
				set({
					book: dropped,
					status: "live",
					note: "Rug check missed this batch. Those names were logged and dropped. The sizer was not called.",
					error: null
				});
				return;
			}
			if (id !== seq) return;
			const byToken = new Map(checked.rugs.map((item) => [item.token, item.rug]));
			const rows = pull.rows.map((row) => ({
				...row,
				rug: row.rug ?? byToken.get(row.token) ?? null
			}));
			const owed = rows.filter((row) => !row.rug).length;
			const note = checked.note ?? (owed > 0 ? `Rug check still owes ${owed} contract${owed === 1 ? "" : "s"}. They are not sized yet.` : null);
			const next = applyPull(get().book, {
				...pull,
				rows,
				note
			}, Date.now());
			write$1(next);
			set({
				book: next,
				status: "live",
				note,
				error: null
			});
		} catch (error) {
			if (id !== seq) return;
			set({
				status: "error",
				error: (error instanceof Error ? error.message : "Market feed did not answer.").replace(/\s+/g, " ").slice(0, 160) || "Market feed did not answer."
			});
		}
	},
	setPaused: (paused) => set({ paused }),
	setParam: (key, value) => set((state) => {
		const book = {
			...state.book,
			params: {
				...state.book.params,
				[key]: value
			}
		};
		write$1(book);
		return { book };
	}),
	reset: () => {
		const book = blankBook();
		write$1(book);
		seq += 1;
		set({
			book,
			note: null,
			error: null,
			status: "idle",
			updatedAt: 0
		});
	}
}));
var SOL$1 = "So11111111111111111111111111111111111111112";
var MINT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
var AMOUNT = /^\d+$/;
var MIN_SOL = 5000000n;
var MAX_SOL = 5000000000n;
var solPriceUsd = createServerFn({ method: "POST" }).handler(createSsrRpc("1f1523cd909c7430101cddbc98dd77916aee2d632bfce07e6511bca76dac53b8"));
var buildSwap = createServerFn({ method: "POST" }).validator((input) => {
	const owner = input?.owner ?? "";
	const inputMint = input?.inputMint ?? "";
	const outputMint = input?.outputMint ?? "";
	const amount = input?.amount ?? "";
	const slippageBps = Math.floor(Number(input?.slippageBps));
	if (!MINT.test(owner)) throw new Error("Bot wallet is missing.");
	if (!MINT.test(inputMint) || !MINT.test(outputMint) || inputMint === outputMint) throw new Error("Bad swap pair.");
	if (!AMOUNT.test(amount)) throw new Error("Bad swap amount.");
	if (!Number.isFinite(slippageBps) || slippageBps < 50 || slippageBps > 300) throw new Error("Slippage out of range.");
	if (inputMint === SOL$1) {
		const lamports = BigInt(amount);
		if (lamports < MIN_SOL || lamports > MAX_SOL) throw new Error("Sizer size is outside 0.005–5 SOL.");
	}
	return {
		owner,
		inputMint,
		outputMint,
		amount,
		slippageBps
	};
}).handler(createSsrRpc("1cd788d4f5712aef0943cc6d4a007ce1117473088da6639874e351fd31d404bd"));
var RPCS = ["https://solana-rpc.publicnode.com", "https://api.mainnet-beta.solana.com"];
var SECRET = "keel-bot-secret";
function connection() {
	return new Connection(RPCS[0], "confirmed");
}
function loadBotKey() {
	const existing = localStorage.getItem(SECRET);
	if (existing) {
		const bytes = JSON.parse(existing);
		if (Array.isArray(bytes) && bytes.length === 64) return Keypair.fromSecretKey(Uint8Array.from(bytes));
	}
	const key = Keypair.generate();
	localStorage.setItem(SECRET, JSON.stringify(Array.from(key.secretKey)));
	return key;
}
async function solLamports(owner) {
	let last = "Balance lookup failed.";
	for (const rpc of RPCS) try {
		return await new Connection(rpc, "confirmed").getBalance(owner, "confirmed");
	} catch (error) {
		last = error instanceof Error ? error.message : last;
	}
	throw new Error(last);
}
async function tokenRaw(owner, mint) {
	for (const rpc of RPCS) try {
		const accounts = await new Connection(rpc, "confirmed").getParsedTokenAccountsByOwner(owner, { mint: new PublicKey(mint) });
		let total = 0n;
		for (const account of accounts.value) {
			const amount = account.account.data.parsed?.info?.tokenAmount?.amount;
			if (amount && /^\d+$/.test(amount)) total += BigInt(amount);
		}
		return total.toString();
	} catch {}
	return "0";
}
function decode(b64) {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}
async function signAndSend(args) {
	const built = await buildSwap({ data: {
		owner: args.signer.publicKey.toBase58(),
		inputMint: args.inputMint,
		outputMint: args.outputMint,
		amount: args.amount,
		slippageBps: args.slippageBps
	} });
	if (built.aborted || !built.swapTransaction) return {
		signature: null,
		aborted: true,
		outAmount: built.outAmount,
		impactBps: built.impactBps
	};
	const tx = VersionedTransaction.deserialize(decode(built.swapTransaction));
	tx.sign([args.signer]);
	let last = "The network did not take the transaction.";
	for (const rpc of RPCS) try {
		return {
			signature: await new Connection(rpc, "confirmed").sendRawTransaction(tx.serialize(), {
				skipPreflight: false,
				maxRetries: 2
			}),
			aborted: false,
			outAmount: built.outAmount,
			impactBps: built.impactBps
		};
	} catch (error) {
		last = error instanceof Error ? error.message : last;
	}
	throw new Error(last);
}
async function confirmSignature(signature) {
	try {
		const row = (await connection().getSignatureStatuses([signature])).value[0];
		if (!row) return "pending";
		if (row.err) return "failed";
		if (row.confirmationStatus === "confirmed" || row.confirmationStatus === "finalized") return "confirmed";
	} catch {
		return "pending";
	}
	return "pending";
}
var SOL = "So11111111111111111111111111111111111111112";
var STATE = "keel-auto-v1";
var RESERVE = 2e7;
var HOLD_MS = 72e4;
function read() {
	try {
		const parsed = JSON.parse(localStorage.getItem(STATE) ?? "");
		return {
			running: parsed.running !== false,
			peak: Number(parsed.peak) || 0,
			fills: Array.isArray(parsed.fills) ? parsed.fills.slice(0, 16) : [],
			positions: Array.isArray(parsed.positions) ? parsed.positions : [],
			done: Array.isArray(parsed.done) ? parsed.done : []
		};
	} catch {
		return {
			running: true,
			peak: 0,
			fills: [],
			positions: [],
			done: []
		};
	}
}
function write(state) {
	try {
		localStorage.setItem(STATE, JSON.stringify(state));
	} catch {}
}
var saved = typeof localStorage === "undefined" ? {
	running: true,
	peak: 0,
	fills: [],
	positions: [],
	done: []
} : read();
function persist(patch) {
	saved = {
		...saved,
		...patch
	};
	write(saved);
}
function pushFill(fill) {
	saved = {
		...saved,
		fills: [fill, ...saved.fills].slice(0, 16)
	};
	write(saved);
	useWallet.setState({ fills: saved.fills });
}
var stepping = false;
var useWallet = create((set, get) => ({
	pubkey: null,
	sol: null,
	solPrice: null,
	running: saved.running,
	busy: false,
	error: null,
	notice: null,
	fills: saved.fills,
	positions: saved.positions,
	boot: () => {
		set({ pubkey: loadBotKey().publicKey.toBase58() });
		get().refresh();
	},
	refresh: async () => {
		const key = loadBotKey();
		try {
			const [lamports, price] = await Promise.all([solLamports(key.publicKey), solPriceUsd()]);
			const sol = lamports / 1e9;
			set({
				pubkey: key.publicKey.toBase58(),
				sol,
				solPrice: price
			});
		} catch (error) {
			set({ error: error instanceof Error ? error.message : "Wallet lookup failed." });
		}
	},
	setRunning: (running) => {
		persist({ running });
		set({
			running,
			notice: running ? "Executor is on. No approval popup." : "Entries halted. Open risk can still be sold."
		});
	},
	tick: async (book) => {
		if (stepping) return;
		stepping = true;
		set({
			busy: true,
			error: null
		});
		try {
			await step(book);
		} catch (error) {
			set({ error: error instanceof Error ? error.message : "Executor stopped on an error." });
		} finally {
			stepping = false;
			set({
				busy: false,
				positions: saved.positions,
				fills: saved.fills
			});
		}
	}
}));
async function step(book) {
	const key = loadBotKey();
	const owner = key.publicKey;
	const [lamports, price] = await Promise.all([solLamports(owner), solPriceUsd()]);
	const sol = lamports / 1e9;
	let tokenUsd = 0;
	for (const position of saved.positions) {
		const px = book.quotes[position.mint];
		if (!px || position.entryPx <= 0) continue;
		tokenUsd += position.entryLamports / 1e9 * (px / position.entryPx) * price;
	}
	const equity = sol * price + tokenUsd;
	if (equity > saved.peak) persist({ peak: equity });
	const drawdown = saved.peak > 0 ? (saved.peak - equity) / saved.peak : 0;
	useWallet.setState({
		pubkey: owner.toBase58(),
		sol,
		solPrice: price
	});
	const still = [];
	for (const position of saved.positions) {
		const px = book.quotes[position.mint];
		const hit = px && px <= position.stopPx && "stop" || px && px >= position.takePx && "take-profit" || Date.now() >= position.deadline && "time" || null;
		if (!hit) {
			still.push(position);
			continue;
		}
		const raw = await tokenRaw(owner, position.mint);
		if (raw === "0") {
			pushFill({
				id: `${position.runId}:exit-empty`,
				mint: position.mint,
				symbol: position.symbol,
				action: "exit",
				status: "aborted",
				signature: null,
				sol: 0,
				reason: `exit ${hit} · no tokens left in the bot wallet`,
				at: Date.now()
			});
			continue;
		}
		const sold = await signAndSend({
			signer: key,
			inputMint: position.mint,
			outputMint: SOL,
			amount: raw,
			slippageBps: position.slippageBps
		});
		pushFill({
			id: `${position.runId}:exit`,
			mint: position.mint,
			symbol: position.symbol,
			action: "exit",
			status: sold.aborted ? "aborted" : "sent",
			signature: sold.signature,
			sol: 0,
			reason: sold.aborted ? `exit aborted · impact ${sold.impactBps} bps over max` : `exit ${hit} · signed, no popup`,
			at: Date.now()
		});
		if (sold.signature) watch(sold.signature);
		if (sold.aborted) still.push(position);
	}
	persist({ positions: still });
	if (!saved.running) return;
	for (const next of book.runs) {
		if (next.chain !== "solana" || next.rug?.verdict !== "PASS") continue;
		if (saved.done.includes(next.token) || saved.positions.some((position) => position.mint === next.token)) continue;
		const px = book.quotes[next.token];
		const liquidity = next.scanner.liquidity_usd;
		if (!px || liquidity <= 0) continue;
		const facts = {
			address: next.token,
			symbol: next.symbol,
			name: next.name,
			chain: "solana",
			price: px,
			liquidityUsd: liquidity,
			vol1hUsd: next.scanner.vol_1h_usd,
			volatility: .55,
			ageSec: next.scanner.age_sec,
			renounced: true,
			mintLive: false,
			freeze: false,
			honeypot: false,
			taxBps: 0,
			blacklist: false,
			deployerOk: true,
			lpLocked: true,
			top10: 20,
			path: {
				phase: 0,
				driftPerMin: 0,
				vol: .55,
				shockAt: 0xe8d4a51000,
				shockMag: 0
			}
		};
		const sized = sizeFor(facts, next.runId, {
			equity,
			drawdown,
			volatility: .55,
			liquidity,
			vol1h: next.scanner.vol_1h_usd,
			price: px,
			wave: 0
		}, book.params, 5);
		const spendLamports = Math.floor(sized.size_usd / price * 1e9);
		const affordable = lamports - RESERVE;
		if (sized.size_usd <= 0 || spendLamports < 5e6) {
			persist({ done: [...saved.done, next.token].slice(-80) });
			pushFill({
				id: `${next.runId}:skip`,
				mint: next.token,
				symbol: next.symbol,
				action: "entry",
				status: "aborted",
				signature: null,
				sol: 0,
				reason: sized.reason,
				at: Date.now()
			});
			continue;
		}
		if (spendLamports > affordable) {
			const id = `${next.runId}:short`;
			if (!saved.fills.some((fill) => fill.id === id)) pushFill({
				id,
				mint: next.token,
				symbol: next.symbol,
				action: "entry",
				status: "aborted",
				signature: null,
				sol: spendLamports / 1e9,
				reason: `aborted · sizer wants $${sized.size_usd.toFixed(0)} and the wallet cannot cover it. Not resized.`,
				at: Date.now()
			});
			continue;
		}
		const slip = Math.min(300, Math.max(50, sized.max_slippage_bps));
		const bought = await signAndSend({
			signer: key,
			inputMint: SOL,
			outputMint: next.token,
			amount: String(spendLamports),
			slippageBps: slip
		});
		persist({ done: [...saved.done, next.token].slice(-80) });
		if (bought.aborted || !bought.signature) {
			pushFill({
				id: `${next.runId}:abort`,
				mint: next.token,
				symbol: next.symbol,
				action: "entry",
				status: "aborted",
				signature: null,
				sol: spendLamports / 1e9,
				reason: `aborted pre-send · impact ${bought.impactBps} bps over max ${slip}`,
				at: Date.now()
			});
			return;
		}
		const stop = stopPctFor(.55);
		const take = takePctFor(.55);
		persist({ positions: [...saved.positions, {
			mint: next.token,
			symbol: next.symbol,
			runId: next.runId,
			tokenRaw: bought.outAmount,
			entryLamports: spendLamports,
			entryPx: px,
			stopPx: px * (1 - stop),
			takePx: px * (1 + take),
			deadline: Date.now() + HOLD_MS,
			slippageBps: slip
		}] });
		pushFill({
			id: `${next.runId}:entry`,
			mint: next.token,
			symbol: next.symbol,
			action: "entry",
			status: "sent",
			signature: bought.signature,
			sol: spendLamports / 1e9,
			reason: sized.reason,
			at: Date.now()
		});
		watch(bought.signature);
		return;
	}
}
async function watch(signature) {
	for (let i = 0; i < 12; i++) {
		await new Promise((resolve) => window.setTimeout(resolve, 2e3));
		const status = await confirmSignature(signature);
		if (status === "pending") continue;
		saved = {
			...saved,
			fills: saved.fills.map((fill) => fill.signature === signature ? {
				...fill,
				status
			} : fill)
		};
		write(saved);
		useWallet.setState({
			fills: saved.fills,
			notice: status === "confirmed" ? "Confirmed on Solana." : "The transaction failed on Solana."
		});
		return;
	}
}
function WalletBar({ book }) {
	const pubkey = useWallet((s) => s.pubkey);
	const sol = useWallet((s) => s.sol);
	const solPrice = useWallet((s) => s.solPrice);
	const running = useWallet((s) => s.running);
	const busy = useWallet((s) => s.busy);
	const error = useWallet((s) => s.error);
	const notice = useWallet((s) => s.notice);
	const fills = useWallet((s) => s.fills);
	const positions = useWallet((s) => s.positions);
	const boot = useWallet((s) => s.boot);
	const setRunning = useWallet((s) => s.setRunning);
	const tick = useWallet((s) => s.tick);
	const bookRef = (0, import_react.useRef)(book);
	bookRef.current = book;
	(0, import_react.useEffect)(() => {
		boot();
	}, [boot]);
	(0, import_react.useEffect)(() => {
		const run = () => {
			const current = bookRef.current;
			tick({
				runs: current.runs,
				quotes: current.quotes,
				params: current.params
			});
		};
		const id = window.setInterval(run, 15e3);
		const first = window.setTimeout(run, 1500);
		return () => {
			window.clearInterval(id);
			window.clearTimeout(first);
		};
	}, [tick]);
	const equity = sol != null && solPrice != null ? sol * solPrice : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "border-b border-line",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-[1440px] flex-col gap-3 px-3 py-3 lg:px-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: cx("inline-flex h-11 items-center rounded-md px-4 text-sm font-medium", running ? "bg-rust text-brass-ink" : "bg-brass text-brass-ink"),
						onClick: () => setRunning(!running),
						children: running ? "Halt entries" : "Resume entries"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "break-all font-mono text-xs",
							children: pubkey ?? "Creating bot wallet…"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								sol == null ? "Reading balance…" : `${sol.toFixed(3)} SOL`,
								equity != null ? ` · ${formatUsd(equity, 0)} equity` : "",
								busy ? " · signing" : "",
								positions.length ? ` · ${positions.length} open` : ""
							]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-pretty text-muted",
					children: "This address signs by itself. No popup. Send it only SOL you can lose. The sizer uses that balance, not the paper $25,000. If the wallet cannot cover the size, the executor aborts and does not shrink the trade. Halt stops new buys. Open positions can still be sold."
				}),
				(error || notice) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cx("text-sm", error ? "text-rust" : "text-muted"),
					children: error ?? notice
				}),
				fills.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col",
					children: fills.slice(0, 4).map((fill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FillRow, { fill }, fill.id))
				})
			]
		})
	});
}
function FillRow({ fill }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 text-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-16 font-semibold",
				children: fill.symbol
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-xs text-muted",
				children: fill.action
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cx("font-mono text-xs", fill.status === "confirmed" ? "text-sage" : fill.status === "failed" || fill.status === "aborted" ? "text-rust" : "text-brass"),
				children: fill.status
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "min-w-0 flex-1 truncate text-sm text-muted",
				children: fill.reason
			}),
			fill.signature && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				className: "inline-flex items-center gap-1 font-mono text-xs text-sage",
				href: `https://solscan.io/tx/${fill.signature}`,
				target: "_blank",
				rel: "noreferrer",
				children: [
					fill.signature.slice(0, 8),
					"… ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3" })
				]
			})
		]
	});
}
var AGENTS = [
	{
		id: "scanner",
		n: "01",
		name: "Scanner",
		role: "Discovery only. No opinion.",
		icon: Radar
	},
	{
		id: "rug",
		n: "02",
		name: "Rug check",
		role: "Kill fast. Fail is forever.",
		icon: ShieldAlert
	},
	{
		id: "sizer",
		n: "03",
		name: "Sizer",
		role: "Equity × risk. Never a flat dollar.",
		icon: Scale
	},
	{
		id: "executor",
		n: "04",
		name: "Executor",
		role: "Fill or abort. No rethink.",
		icon: Crosshair
	},
	{
		id: "logger",
		n: "05",
		name: "Logger",
		role: "Append-only. Off the hot path.",
		icon: ScrollText
	},
	{
		id: "equity",
		n: "06",
		name: "Equity",
		role: "Moves on close. Feeds the sizer.",
		icon: ChartLine
	}
];
var CHECKS = [
	{
		key: "honeypot",
		label: "Honeypot"
	},
	{
		key: "blacklist",
		label: "Blacklist"
	},
	{
		key: "mint_auth",
		label: "Mint authority"
	},
	{
		key: "freeze_auth",
		label: "Freeze"
	},
	{
		key: "tax_ok",
		label: "Tax"
	},
	{
		key: "lp_locked_or_burned",
		label: "LP lock"
	},
	{
		key: "deployer_ok",
		label: "Deployer"
	},
	{
		key: "holder_conc_ok",
		label: "Holders"
	},
	{
		key: "age_ok",
		label: "Age"
	},
	{
		key: "renounced",
		label: "Ownership"
	}
];
function LiveDesk({ onPaper }) {
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
	const [tab, setTab] = (0, import_react.useState)("tape");
	const [chain, setChain] = (0, import_react.useState)("all");
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setMounted(true);
		hydrate();
		refresh();
	}, [hydrate, refresh]);
	(0, import_react.useEffect)(() => {
		if (paused) return;
		const id = window.setInterval(() => void refresh(), 3e4);
		return () => window.clearInterval(id);
	}, [paused, refresh]);
	const snap = snapshotOf(book, new Map(Object.entries(book.quotes)));
	const watch = book.watch.filter((row) => chain === "all" || row.chain === chain);
	const runs = new Map(book.runs.map((run) => [run.runId, run]));
	const run = book.runs.find((item) => item.runId === selected) ?? book.runs.find((item) => item.runId === watch[0]?.runId) ?? null;
	const statusLabel = status === "error" ? "FEED DOWN" : paused ? "PAUSED" : status === "loading" || status === "idle" ? "CONNECTING" : snap.halted ? "HALTED" : "LIVE";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh overflow-x-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "border-b border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-3 px-3 py-3 lg:px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-lg font-semibold tracking-widest",
								children: "KEEL"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs text-muted",
								children: "LIVE MARKETS"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Scanner, rug check, sizer, executor. Logger and equity stay off the hot path."
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-mono text-xs text-muted",
								children: [updatedAt ? clock(updatedAt) : "—", " UTC"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex items-center justify-end gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cx("inline-block size-2 rounded-full", statusLabel === "LIVE" && "bg-sage lamp-live", (statusLabel === "HALTED" || statusLabel === "FEED DOWN") && "bg-rust", (statusLabel === "PAUSED" || statusLabel === "CONNECTING") && "bg-brass") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: statusLabel === "HALTED" || statusLabel === "FEED DOWN" ? "text-rust" : "text-fg",
									children: statusLabel
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-mono text-xs text-muted",
									children: "PAPER EQUITY"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-mono text-2xl font-medium tabular-nums text-brass",
									children: formatUsd(snap.equity, 0)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cx("font-mono text-xs tabular-nums", book.lastPnl == null ? "text-muted" : book.lastPnl >= 0 ? "text-sage" : "text-rust"),
									children: book.lastPnl == null ? "no close yet" : `last close ${formatSignedUsd(book.lastPnl)}`
								})
							]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-line bg-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-auto max-w-[1440px] px-3 py-2 text-sm text-pretty text-muted lg:px-4",
					children: "Live Solana and Base. The scanner emits the top 20 and does not size. Rug check runs before any size, and a fail is discarded. The sizer reads realized equity only. The executor fills or aborts on slippage. Nothing here is a fixed dollar bet."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletBar, { book }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-line",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-[1440px] flex-col gap-3 px-3 py-3 lg:px-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-11 items-center gap-2 rounded-md bg-brass px-4 text-sm font-medium text-brass-ink",
								onClick: () => setPaused(!paused),
								children: [paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }), paused ? "Run" : "Pause"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "inline-flex h-11 items-center rounded-md border border-line bg-surface px-3 text-sm",
								onClick: () => void refresh(),
								children: "Refresh"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seg, {
								value: chain,
								options: [
									{
										id: "all",
										label: "All"
									},
									{
										id: "solana",
										label: "Solana"
									},
									{
										id: "base",
										label: "Base"
									}
								],
								onChange: (id) => setChain(id)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 text-sm",
								onClick: () => {
									reset();
									refresh();
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), "Reset book"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "inline-flex h-11 items-center rounded-md border border-line bg-surface px-3 text-sm",
								onClick: onPaper,
								children: "Paper sim"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								label: "Max risk / trade",
								display: formatPct(book.params.maxRiskPct, 2),
								min: .002,
								max: .02,
								step: .001,
								value: book.params.maxRiskPct,
								onChange: (v) => setParam("maxRiskPct", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								label: "Max size vs pool",
								display: formatPct(book.params.maxPoolPct, 1),
								min: .005,
								max: .03,
								step: .001,
								value: book.params.maxPoolPct,
								onChange: (v) => setParam("maxPoolPct", v)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
								label: "Halt entries at drawdown",
								display: formatPct(book.params.ddHaltPct, 0),
								min: .05,
								max: .3,
								step: .01,
								value: book.params.ddHaltPct,
								onChange: (v) => setParam("ddHaltPct", v)
							})
						]
					})]
				})
			}),
			(error || note || snap.halted) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cx("border-b border-line", error || snap.halted ? "bg-rust-dim" : "bg-surface"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cx("mx-auto max-w-[1440px] px-3 py-2 text-sm lg:px-4", error || snap.halted ? "text-rust" : "text-muted"),
					children: error ? error : snap.halted ? `Entries halted. Drawdown ${formatPct(snap.drawdownPct)} is through the ${formatPct(book.params.ddHaltPct, 0)} circuit. Exits still mark.` : note
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto grid w-full max-w-[1440px] gap-3 px-3 py-3 lg:grid-cols-[16rem_minmax(0,1fr)_22rem] lg:px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
						className: "min-w-0 lg:sticky lg:top-3 lg:self-start",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0",
							children: AGENTS.map((agent) => {
								const Icon = agent.icon;
								const active = book.logs[0]?.agent === agent.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: cx("min-w-[11.5rem] shrink-0 rounded-md border bg-surface p-3 lg:min-w-0", active ? "border-brass" : "border-line"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cx("size-4", active ? "text-brass" : "text-muted") }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono text-xs text-faint",
													children: agent.n
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
													className: "text-sm font-semibold",
													children: agent.name
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 hidden text-xs text-pretty text-muted lg:block",
											children: agent.role
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 font-mono text-xs tabular-nums",
											children: stat(agent.id, book.counts)
										})
									]
								}, agent.id);
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 flex-col gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-4 gap-1 lg:hidden",
								children: [
									"tape",
									"curve",
									"book",
									"log"
								].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": tab === id,
									className: cx("h-11 rounded-md border text-sm capitalize", tab === id ? "border-brass bg-brass text-brass-ink" : "border-line bg-surface"),
									onClick: () => setTab(id),
									children: id === "curve" ? "Curve" : id === "tape" ? "Tape" : id === "book" ? "Book" : "Log"
								}, id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
								className: cx(tab !== "tape" && "max-lg:hidden"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
									title: "Live tape",
									action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-xs text-muted",
										children: [watch.length, " cleared floors"]
									}),
									children: watch.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "px-3 py-6 text-sm text-muted",
										children: status === "error" ? "No fresh pairs this pass." : "Reading Solana and Base. Pools under the liquidity, age, and volume floors stay off the tape."
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "max-h-80 overflow-auto",
										children: watch.map((row) => {
											const item = runs.get(row.runId);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => {
													setSelected(row.runId);
													setTab("tape");
												},
												className: cx("flex w-full items-start gap-3 border-b border-line px-3 py-2.5 text-left", run?.runId === row.runId ? "bg-surface-2" : "hover:bg-surface-2"),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "min-w-0 flex-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "flex items-baseline justify-between gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "text-sm font-semibold",
															children: [row.symbol, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "ml-2 font-mono text-xs font-normal text-muted",
																children: row.chain === "solana" ? "SOL" : "BASE"
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outcome, { run: item })]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "mt-0.5 block truncate text-sm text-muted",
														children: item?.scanner.reason ?? row.pair
													})]
												})
											}, row.runId);
										})
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
								className: cx(tab !== "tape" && "max-lg:hidden"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HandOff, { run })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
								className: cx(tab !== "log" && "max-lg:hidden"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
									title: "Audit log",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "max-h-64 overflow-auto",
										children: book.logs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "px-3 py-6 text-sm text-muted",
											children: "No hops yet."
										}) : book.logs.slice(0, 80).map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setSelected(event.runId),
											className: "flex w-full flex-col gap-0.5 border-b border-line px-3 py-2 text-left hover:bg-surface-2 sm:flex-row sm:items-baseline sm:gap-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "w-16 shrink-0 font-mono text-xs text-faint",
													children: clock(event.ts)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "w-16 shrink-0 font-mono text-xs text-muted",
													children: event.agent
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "w-16 shrink-0 text-sm font-medium",
													children: event.symbol
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "min-w-0 flex-1 truncate text-sm text-muted",
													children: event.summary
												})
											]
										}, event.id))
									})
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 flex-col gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
							className: cx(tab !== "curve" && "max-lg:hidden"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
								title: "Equity curve",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "px-3 pt-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-baseline justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-mono text-2xl tabular-nums text-brass",
												children: formatUsd(snap.equity, 0)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: cx("font-mono text-sm", snap.drawdownPct > 0 ? "text-rust" : "text-sage"),
												children: ["DD ", formatPct(snap.drawdownPct)]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted",
											children: "Published on close only. The sizer cannot see unrealized."
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-40 px-1",
										children: mounted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
											width: "100%",
											height: "100%",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
												data: book.curve,
												margin: {
													top: 12,
													right: 8,
													left: 8,
													bottom: 0
												},
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
														hide: true,
														domain: ["auto", "auto"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
														contentStyle: {
															background: "var(--color-surface)",
															border: "1px solid var(--color-line)",
															borderRadius: 8,
															color: "var(--color-fg)",
															fontSize: 12
														},
														formatter: (value, name) => [formatUsd(Number(value ?? 0), 0), name === "mtm" ? "Mark" : "Realized"],
														labelFormatter: (label) => clock(Number(label))
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
														type: "stepAfter",
														dataKey: "equity",
														stroke: "var(--color-brass)",
														fill: "var(--color-brass)",
														fillOpacity: .16,
														strokeWidth: 1.75,
														dot: false,
														isAnimationActive: false
													})
												]
											})
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
										className: "grid grid-cols-2 gap-3 border-t border-line p-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
												k: "Win rate",
												v: snap.tradesClosed ? formatPct(snap.winRate, 0) : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
												k: "Expectancy",
												v: snap.tradesClosed ? formatSignedUsd(snap.expectancy) : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
												k: "Closed",
												v: String(snap.tradesClosed)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
												k: "Avg slip",
												v: snap.avgSlipBps ? formatBps(snap.avgSlipBps) : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
												k: "Avg hold",
												v: snap.avgHoldSec ? formatDuration(snap.avgHoldSec) : "—"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
												k: "Open notional",
												v: formatUsd(snap.openNotional, 0)
											})
										]
									})
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
							className: cx(tab !== "book" && "max-lg:hidden"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
								title: "Book",
								action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono text-xs text-muted",
									children: [book.positions.length, " open"]
								}),
								children: [book.positions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "px-3 py-4 text-sm text-muted",
									children: "Flat. Nothing has passed rug check and the sizer."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: book.positions.map((position) => {
									const pnl = positionPnl(position, book.quotes[position.token]);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "border-b border-line",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setSelected(position.runId),
											className: "flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "w-16 text-sm font-semibold",
													children: position.symbol
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "min-w-0 flex-1 font-mono text-xs text-muted",
													children: formatPx(position.fillPrice)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: cx("font-mono text-xs tabular-nums", pnl == null ? "text-muted" : pnl >= 0 ? "text-sage" : "text-rust"),
													children: pnl == null ? "…" : formatSignedUsd(pnl)
												})
											]
										})
									}, position.runId);
								}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "border-t border-line px-3 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-xs font-semibold tracking-widest text-muted",
										children: "Last closes"
									}), book.closes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "pt-2 text-sm text-muted",
										children: "No closes yet."
									}) : book.closes.slice(0, 5).map((close) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setSelected(close.runId),
										className: "flex min-h-11 w-full items-center gap-3 text-left",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "w-16 text-sm",
												children: close.symbol
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "min-w-0 flex-1 truncate text-sm text-muted",
												children: [
													close.reason,
													" · ",
													formatDuration(close.holdSec)
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: cx("font-mono text-xs", close.pnl >= 0 ? "text-sage" : "text-rust"),
												children: formatSignedUsd(close.pnl)
											})
										]
									}, close.runId + close.reason))]
								})]
							})
						})]
					})
				]
			})
		]
	});
}
function PhantomBuy({ run }) {
	const sent = useWallet((s) => s.fills).find((fill) => fill.mint === run.token);
	if (run.chain !== "solana") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Base stays quoted. The bot wallet signs Solana only."
	});
	if (run.rug?.verdict !== "PASS") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "The executor will not touch this until rug check passes."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "border-t border-line pt-3 text-sm text-pretty text-muted",
		children: sent ? `${sent.action} ${sent.status}. ${sent.reason}` : "No popup. If the bot wallet can cover the sizer, this name is signed on the next pass."
	});
}
function HandOff({ run }) {
	const [contract, setContract] = (0, import_react.useState)(false);
	if (!run) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
		title: "Hand-off",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-3 py-6 text-sm text-muted",
			children: "The scanner has not cleared a pool yet."
		})
	});
	const schema = {
		scanner: run.scanner,
		rug: run.rug,
		sizer: run.sizer,
		executor: run.exit ?? run.entry
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
		title: "Hand-off",
		action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-9 rounded-md border border-line px-2 text-xs",
				onClick: () => setContract((open) => !open),
				children: contract ? "Hide schema" : "Schema"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: run.url,
				target: "_blank",
				rel: "noreferrer",
				className: "inline-flex h-9 items-center gap-1 rounded-md border border-line px-2 text-xs",
				children: ["Open pair ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3" })]
			})]
		}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-3 p-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-lg font-semibold",
					children: run.symbol
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "break-all font-mono text-xs text-muted",
					children: run.token
				})] }),
				!run.rug ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Rug check has not reported. The sizer will not run."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-2 sm:grid-cols-2",
					children: CHECKS.slice().sort((a, b) => CHECK_ORDER.indexOf(a.key) - CHECK_ORDER.indexOf(b.key)).map((item) => {
						const ok = run.rug?.checks[item.key];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: item.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: ok ? "font-medium text-sage" : "font-medium text-rust",
								children: ok ? "Clear" : "Fail"
							})]
						}, item.key);
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Rug check · "
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: run.rug.verdict === "PASS" ? "text-sage" : "text-rust",
							children: run.rug.verdict
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: [" · ", run.rug.reason]
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 border-t border-line pt-3 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Block, {
							title: "Scanner",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									k: "Trigger",
									v: run.scanner.trigger.replaceAll("_", " ")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									k: "Rank",
									v: String(run.scanner.rank_score)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									k: "Age",
									v: formatAge(run.scanner.age_sec)
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Block, {
							title: "Sizer",
							children: run.sizer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									k: "Size",
									v: run.sizer.size_usd ? formatUsd(run.sizer.size_usd) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									k: "Max slip",
									v: formatBps(run.sizer.max_slippage_bps)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									k: "Equity",
									v: formatUsd(run.sizer.equity_at_decision, 0)
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: run.rug?.verdict === "FAIL" ? "Not called." : "Waiting on rug check."
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Block, {
							title: "Executor",
							children: run.entry ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									k: "Entry",
									v: run.entry.status
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									k: "Fill",
									v: run.entry.fill_price ? formatPx(run.entry.fill_price) : "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
									k: "Exit",
									v: run.exit ? run.exit.reason : run.status === "open" ? "working" : "—"
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "No order. Nothing is signed."
							})
						})
					]
				}),
				run.sizer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-pretty text-muted",
					children: run.sizer.reason
				}),
				contract && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "max-h-64 overflow-auto rounded-md border border-line bg-bg p-3 font-mono text-xs leading-relaxed text-fg",
					children: JSON.stringify(schema, null, 2)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhantomBuy, { run })
			]
		})
	});
}
function Outcome({ run }) {
	if (!run || run.status === "pending") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
		tone: "brass",
		children: "RUG"
	});
	if (run.status === "fail") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
		tone: "rust",
		children: "FAIL"
	});
	if (run.status === "skip") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
		tone: "brass",
		children: "NO SIZE"
	});
	if (run.status === "aborted") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
		tone: "rust",
		children: "ABORT"
	});
	if (run.status === "open") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
		tone: "sage",
		children: "OPEN"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cx("font-mono text-xs tabular-nums", (run.pnl ?? 0) >= 0 ? "text-sage" : "text-rust"),
		children: formatSignedUsd(run.pnl ?? 0)
	});
}
function Chip({ tone, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cx("inline-flex h-6 items-center rounded-md px-2 font-mono text-xs", tone === "rust" && "bg-rust-dim text-rust", tone === "sage" && "bg-sage-dim text-sage", tone === "brass" && "bg-surface-2 text-brass"),
		children
	});
}
function stat(id, counts) {
	if (id === "scanner") return `${counts.scanned} emitted`;
	if (id === "rug") return `${counts.rugFail} killed · ${counts.rugPass} pass`;
	if (id === "sizer") return `${counts.sized} sized · ${counts.sizeZero} zero`;
	if (id === "executor") return `${counts.filled} fill · ${counts.aborted} abort`;
	if (id === "logger") return `${counts.logged} rows`;
	return `${counts.closed} closes`;
}
function Panel({ title, action, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-md border border-line bg-surface",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between gap-3 border-b border-line px-3 py-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xs font-semibold tracking-widest text-muted",
				children: title
			}), action]
		}), children]
	});
}
function Block({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
		className: "mb-1 text-xs font-semibold tracking-widest text-muted",
		children: title
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-1",
		children
	})] });
}
function Line({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "flex items-baseline justify-between gap-3 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "truncate font-mono text-xs tabular-nums",
			children: v
		})]
	});
}
function Stat({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
		className: "text-xs text-muted",
		children: k
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
		className: "font-mono text-sm tabular-nums",
		children: v
	})] });
}
function Seg({ value, options, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-11 rounded-md border border-line bg-surface p-1",
		children: options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-pressed": value === opt.id,
			className: cx("rounded-md px-3 text-sm", value === opt.id ? "bg-brass text-brass-ink" : "text-fg"),
			onClick: () => onChange(opt.id),
			children: opt.label
		}, opt.id))
	});
}
function Slider({ label, display, min, max, step, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex min-w-0 flex-col gap-2 py-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-baseline justify-between gap-3 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-muted",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono tabular-nums",
				children: display
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "range",
			min,
			max,
			step,
			value,
			"aria-label": label,
			onChange: (e) => onChange(Number(e.target.value)),
			className: "h-6 w-full accent-brass"
		})]
	});
}
function Mark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "36",
		height: "36",
		viewBox: "0 0 32 32",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "32",
				height: "32",
				rx: "6",
				fill: "var(--color-surface-2)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 23.5 16 7.5 24 23.5",
				fill: "none",
				stroke: "var(--color-brass)",
				strokeWidth: "2.2",
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M11.2 19.5h9.6",
				stroke: "var(--color-sage)",
				strokeWidth: "1.6",
				strokeLinecap: "round"
			})
		]
	});
}
function clock(ms) {
	return new Date(ms).toISOString().slice(11, 19);
}
function Home() {
	const [mode, setMode] = (0, import_react.useState)("live");
	if (mode === "paper") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { onLive: () => setMode("live") });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveDesk, { onPaper: () => setMode("paper") });
}
//#endregion
export { Home as component };

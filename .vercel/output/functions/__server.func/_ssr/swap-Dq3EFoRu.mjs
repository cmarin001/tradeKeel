import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/swap-Dq3EFoRu.js
var SOL = "So11111111111111111111111111111111111111112";
var MINT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
var AMOUNT = /^\d+$/;
var MIN_SOL = 5000000n;
var MAX_SOL = 5000000000n;
function impactBps(raw) {
	const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
	if (!Number.isFinite(n) || n <= 0) return 0;
	const pct = n < 1 ? n * 100 : n;
	return Math.round(pct * 100);
}
var solPriceUsd_createServerFn_handler = createServerRpc({
	id: "1f1523cd909c7430101cddbc98dd77916aee2d632bfce07e6511bca76dac53b8",
	name: "solPriceUsd",
	filename: "src/lib/fleet/swap.ts"
}, (opts) => solPriceUsd.__executeServer(opts));
var solPriceUsd = createServerFn({ method: "POST" }).handler(solPriceUsd_createServerFn_handler, async () => {
	const response = await fetch(`https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price/${SOL}`, {
		headers: { accept: "application/json;version=20230302" },
		signal: AbortSignal.timeout(8e3)
	});
	if (!response.ok) throw new Error("SOL price did not answer.");
	const payload = await response.json();
	const price = Number(payload.data?.attributes?.token_prices?.[SOL] ?? "");
	if (!Number.isFinite(price) || price <= 0) throw new Error("SOL price did not answer.");
	return price;
});
var buildSwap_createServerFn_handler = createServerRpc({
	id: "1cd788d4f5712aef0943cc6d4a007ce1117473088da6639874e351fd31d404bd",
	name: "buildSwap",
	filename: "src/lib/fleet/swap.ts"
}, (opts) => buildSwap.__executeServer(opts));
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
	if (inputMint === SOL) {
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
}).handler(buildSwap_createServerFn_handler, async ({ data }) => {
	const quoteUrl = new URL("https://lite-api.jup.ag/swap/v1/quote");
	quoteUrl.searchParams.set("inputMint", data.inputMint);
	quoteUrl.searchParams.set("outputMint", data.outputMint);
	quoteUrl.searchParams.set("amount", data.amount);
	quoteUrl.searchParams.set("slippageBps", String(data.slippageBps));
	const quoteRes = await fetch(quoteUrl, { signal: AbortSignal.timeout(12e3) });
	if (!quoteRes.ok) throw new Error("No Jupiter route for this token.");
	const quote = await quoteRes.json();
	if (!quote.outAmount) throw new Error("No Jupiter route for this token.");
	const impact = impactBps(quote.priceImpactPct);
	if (impact > data.slippageBps) return {
		aborted: true,
		outAmount: quote.outAmount,
		impactBps: impact,
		swapTransaction: null
	};
	const swapRes = await fetch("https://lite-api.jup.ag/swap/v1/swap", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			quoteResponse: quote,
			userPublicKey: data.owner,
			wrapAndUnwrapSol: true,
			dynamicComputeUnitLimit: true
		}),
		signal: AbortSignal.timeout(12e3)
	});
	if (!swapRes.ok) throw new Error("Jupiter could not build the swap.");
	const swap = await swapRes.json();
	if (!swap.swapTransaction) throw new Error("Jupiter could not build the swap.");
	return {
		aborted: false,
		swapTransaction: swap.swapTransaction,
		outAmount: quote.outAmount,
		impactBps: impact
	};
});
//#endregion
export { buildSwap_createServerFn_handler, solPriceUsd_createServerFn_handler };

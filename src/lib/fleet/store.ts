import { create } from "zustand";
import {
  createWorld,
  step,
  type AgentId,
  type Chain,
  type Params,
  type World,
} from "./engine";

export type Speed = 1 | 4 | 16;
export type Tab = "tape" | "curve" | "book" | "log";
export type ChainFilter = "all" | Chain;
export type LogFilter = "all" | AgentId;

export const DEFAULT_PARAMS: Params = {
  maxRiskPct: 0.008,
  maxPoolPct: 0.015,
  ddHaltPct: 0.15,
};

export const DEFAULT_SEED = 0x6ee1;

type FleetState = {
  world: World;
  running: boolean;
  speed: Speed;
  showMtm: boolean;
  selected: string | null;
  logFilter: LogFilter;
  chainFilter: ChainFilter;
  tab: Tab;
  doctrine: boolean;
  contractOpen: boolean;
  tick: (speed: Speed) => void;
  nudge: () => void;
  setRunning: (v: boolean) => void;
  setSpeed: (v: Speed) => void;
  setShowMtm: (v: boolean) => void;
  setParam: (key: keyof Params, value: number) => void;
  reset: (seed: number) => void;
  select: (id: string | null) => void;
  setLogFilter: (f: LogFilter) => void;
  setChainFilter: (c: ChainFilter) => void;
  setTab: (t: Tab) => void;
  setDoctrine: (v: boolean) => void;
  setContractOpen: (v: boolean) => void;
};

function pickRun(world: World): string | null {
  return (
    world.runs.find((r) => r.status === "open")?.runId ??
    world.runs.find((r) => r.status === "closed")?.runId ??
    world.runs[0]?.runId ??
    null
  );
}

export const useFleet = create<FleetState>((set, get) => {
  const world = createWorld(DEFAULT_SEED, DEFAULT_PARAMS);
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
        for (let i = 0; i < steps; i++) w = step(w);
        return { world: w };
      });
    },
    nudge: () => set((s) => ({ world: step(s.world) })),
    setRunning: (running) => set({ running }),
    setSpeed: (speed) => set({ speed }),
    setShowMtm: (showMtm) => set({ showMtm }),
    setParam: (key, value) =>
      set((s) => ({
        world: { ...s.world, params: { ...s.world.params, [key]: value } },
      })),
    reset: (seed) => {
      const safe = seed >>> 0 || DEFAULT_SEED;
      const w = createWorld(safe, get().world.params);
      set({ world: w, selected: pickRun(w), running: true });
    },
    select: (selected) => set({ selected, tab: "tape" }),
    setLogFilter: (logFilter) => set({ logFilter }),
    setChainFilter: (chainFilter) => set({ chainFilter }),
    setTab: (tab) => set({ tab }),
    setDoctrine: (doctrine) => set({ doctrine }),
    setContractOpen: (contractOpen) => set({ contractOpen }),
  };
});

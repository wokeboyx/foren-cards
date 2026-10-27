// Simulated network: adds latency and can be forced to fail from the demo panel.
import { useAppStore } from "@/stores/app";
import { ApiError } from "../http";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function call<T>(fn: () => T, opts: { kind?: "save" | "load"; latency?: number } = {}): Promise<T> {
  const { demo } = useAppStore();
  await sleep(opts.latency ?? demo.latencyMs);
  if ((opts.kind ?? "save") === "save" && demo.failSaves) throw new ApiError("Simulated failure");
  if (opts.kind === "load" && demo.failLoads) throw new ApiError("Simulated failure");
  return fn();
}

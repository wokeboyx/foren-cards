"use client";
// Mock API: every mutation goes through `call`, which adds latency and can be forced to fail
// from the demo panel. Nothing here touches real money or real card data.
import { useCallback, useEffect, useState } from "react";
import { useStore } from "./store";

export class ApiError extends Error {}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function call<T>(fn: () => T, opts: { kind?: "save" | "load"; latency?: number } = {}): Promise<T> {
  const { demo } = useStore.getState();
  await sleep(opts.latency ?? demo.latencyMs);
  if ((opts.kind ?? "save") === "save" && demo.failSaves) throw new ApiError("Simulated failure");
  if (opts.kind === "load" && demo.failLoads) throw new ApiError("Simulated failure");
  return fn();
}

export type LoadStatus = "loading" | "error" | "ready";

/** Simulates fetching a view so loading skeletons and load errors are demonstrable. */
export function useLoad(key: string): { status: LoadStatus; retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  // Results are tagged with the request they belong to, so a new key/attempt reads as "loading".
  const [result, setResult] = useState<{ id: string; status: LoadStatus } | null>(null);
  const id = `${key}#${attempt}`;
  useEffect(() => {
    let alive = true;
    call(() => true, { kind: "load" })
      .then(() => alive && setResult({ id, status: "ready" }))
      .catch(() => alive && setResult({ id, status: "error" }));
    return () => {
      alive = false;
    };
  }, [id]);
  return { status: result?.id === id ? result.status : "loading", retry: useCallback(() => setAttempt((a) => a + 1), []) };
}

/** Wraps an async action with pending/error state. */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(
    async (...args: A): Promise<{ ok: true; value: R } | { ok: false; value?: undefined }> => {
      setPending(true);
      setError(null);
      try {
        return { ok: true, value: await fn(...args) };
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
        return { ok: false };
      } finally {
        setPending(false);
      }
    },
    [fn]
  );
  return { run, pending, error, clearError: () => setError(null) };
}

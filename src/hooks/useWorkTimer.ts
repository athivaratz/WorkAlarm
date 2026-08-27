import { useCallback, useEffect, useState } from "react";

export const DEMO_DURATION_MS = 10_000;
export const WORK_DURATION_MS = 45 * 60 * 1000;

export type AppMode = "idle" | "working" | "break";

export function useWorkTimer() {
  const [mode, setMode] = useState<AppMode>("idle");
  const [durationMs, setDurationMsState] = useState(WORK_DURATION_MS);
  const [targetAt, setTargetAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const remainingMs =
    mode === "working" && targetAt != null
      ? Math.max(0, targetAt - now)
      : durationMs;

  useEffect(() => {
    if (mode !== "working" || targetAt == null) {
      return;
    }

    const tick = () => {
      const current = Date.now();
      if (current >= targetAt) {
        setMode("break");
        setTargetAt(null);
        return;
      }
      setNow(current);
    };

    tick();
    const intervalId = window.setInterval(tick, 250);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [mode, targetAt]);

  const start = useCallback(() => {
    const startedAt = Date.now();
    setNow(startedAt);
    setTargetAt(startedAt + durationMs);
    setMode("working");
  }, [durationMs]);

  const stop = useCallback(() => {
    setTargetAt(null);
    setMode("idle");
  }, []);

  const goToBreak = useCallback(() => {
    setTargetAt(null);
    setMode("break");
  }, []);

  const setDurationMs = useCallback(
    (nextMs: number) => {
      if (mode !== "idle") {
        return;
      }
      setDurationMsState(nextMs);
    },
    [mode],
  );

  return {
    mode,
    durationMs,
    remainingMs,
    start,
    stop,
    goToBreak,
    setDurationMs,
  };
}

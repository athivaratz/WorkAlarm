import { useCallback, useEffect, useState } from "react";
import { createPersistQueue } from "../lib/persistQueue";
import {
  decideSession,
  isValidDurationMs,
  type StoredWorkSession,
} from "../lib/workSession";
import {
  clearWorkSession,
  readWorkSession,
  writeWorkSession,
} from "../lib/workSessionStore";

export const DEMO_DURATION_MS = 10_000;
export const WORK_DURATION_MS = 45 * 60 * 1000;

export type AppMode = "idle" | "working" | "break";

export type WorkSessionStorage = {
  read: () => Promise<StoredWorkSession | null>;
  write: (session: StoredWorkSession) => Promise<void>;
  clear: () => Promise<void>;
};

const defaultStorage: WorkSessionStorage = {
  read: readWorkSession,
  write: writeWorkSession,
  clear: clearWorkSession,
};

export function useWorkTimer(storage: WorkSessionStorage = defaultStorage) {
  const [mode, setMode] = useState<AppMode>("idle");
  const [durationMs, setDurationMsState] = useState(WORK_DURATION_MS);
  const [targetAt, setTargetAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [endedWhileAway, setEndedWhileAway] = useState(false);
  const [enqueuePersist] = useState(() => createPersistQueue());

  const remainingMs =
    mode === "working" && targetAt != null
      ? Math.max(0, targetAt - now)
      : durationMs;

  useEffect(() => {
    let cancelled = false;

    storage
      .read()
      .then((session) => {
        if (cancelled) {
          return;
        }

        const decision = decideSession(session, Date.now());
        if (decision.type === "working") {
          setDurationMsState(decision.durationMs);
          setTargetAt(decision.targetAt);
          setNow(Date.now());
          setMode("working");
          setResumed(true);
          setEndedWhileAway(false);
          return;
        }

        if (decision.type === "break") {
          setDurationMsState(decision.durationMs);
          setTargetAt(null);
          setMode("break");
          setResumed(false);
          setEndedWhileAway(decision.endedWhileAway);
          if (session?.phase === "working") {
            void enqueuePersist(() =>
              storage.write({
                version: 1,
                phase: "break",
                durationMs: decision.durationMs,
                endedWhileAway: true,
              }),
            ).catch(() => undefined);
          }
          return;
        }

        if (decision.type === "discard") {
          void enqueuePersist(() => storage.clear()).catch(() => undefined);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enqueuePersist, storage]);

  useEffect(() => {
    if (mode !== "working" || targetAt == null) {
      return;
    }

    const tick = () => {
      const current = Date.now();
      if (current >= targetAt) {
        setMode("break");
        setTargetAt(null);
        setResumed(false);
        setEndedWhileAway(false);
        void enqueuePersist(() =>
          storage.write({
            version: 1,
            phase: "break",
            durationMs,
            endedWhileAway: false,
          }),
        ).catch(() => undefined);
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
  }, [durationMs, enqueuePersist, mode, storage, targetAt]);

  const start = useCallback(() => {
    if (!hydrated || mode !== "idle") {
      return;
    }

    const startedAt = Date.now();
    const nextTargetAt = startedAt + durationMs;
    setNow(startedAt);
    setTargetAt(nextTargetAt);
    setMode("working");
    setResumed(false);
    setEndedWhileAway(false);
    void enqueuePersist(() =>
      storage.write({
        version: 1,
        phase: "working",
        targetAt: nextTargetAt,
        durationMs,
      }),
    ).catch(() => undefined);
  }, [durationMs, enqueuePersist, hydrated, mode, storage]);

  const stop = useCallback(() => {
    setTargetAt(null);
    setMode("idle");
    setResumed(false);
    setEndedWhileAway(false);
    void enqueuePersist(() => storage.clear()).catch(() => undefined);
  }, [enqueuePersist, storage]);

  const goToBreak = useCallback(() => {
    setTargetAt(null);
    setMode("break");
    setResumed(false);
    setEndedWhileAway(false);
    void enqueuePersist(() => storage.clear()).catch(() => undefined);
  }, [enqueuePersist, storage]);

  const setDurationMs = useCallback(
    (nextMs: number) => {
      if (!hydrated || mode !== "idle" || !isValidDurationMs(nextMs)) {
        return;
      }
      setDurationMsState(nextMs);
    },
    [hydrated, mode],
  );

  return {
    mode,
    durationMs,
    remainingMs,
    hydrated,
    resumed,
    endedWhileAway,
    start,
    stop,
    goToBreak,
    setDurationMs,
  };
}

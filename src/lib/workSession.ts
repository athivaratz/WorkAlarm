export const MIN_DURATION_MS = 1_000;
export const MAX_DURATION_MS = 4 * 60 * 60 * 1000;

// A saved target can sit slightly past durationMs when the machine clock
// steps backwards a little. Larger gaps are treated as a corrupt record.
const CLOCK_GRACE_MS = 15_000;

export type StoredWorkSession =
  | {
      version: 1;
      phase: "working";
      targetAt: number;
      durationMs: number;
    }
  | {
      version: 1;
      phase: "break";
      durationMs: number;
      endedWhileAway: boolean;
    };

export type SessionDecision =
  | { type: "idle" }
  | { type: "working"; targetAt: number; durationMs: number }
  | { type: "break"; durationMs: number; endedWhileAway: boolean }
  | { type: "discard" };

export function isValidDurationMs(durationMs: number): boolean {
  return (
    Number.isInteger(durationMs) &&
    durationMs >= MIN_DURATION_MS &&
    durationMs <= MAX_DURATION_MS
  );
}

export function parseStoredWorkSession(value: unknown): StoredWorkSession | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as {
    version?: unknown;
    phase?: unknown;
    targetAt?: unknown;
    durationMs?: unknown;
    endedWhileAway?: unknown;
  };

  if (record.version !== 1 || !isValidDurationMs(record.durationMs as number)) {
    return null;
  }

  if (record.phase === "working") {
    if (typeof record.targetAt !== "number" || !Number.isFinite(record.targetAt)) {
      return null;
    }
    return {
      version: 1,
      phase: "working",
      targetAt: record.targetAt,
      durationMs: record.durationMs as number,
    };
  }

  if (record.phase === "break" && typeof record.endedWhileAway === "boolean") {
    return {
      version: 1,
      phase: "break",
      durationMs: record.durationMs as number,
      endedWhileAway: record.endedWhileAway,
    };
  }

  return null;
}

export function decideSession(
  session: StoredWorkSession | null,
  now: number,
): SessionDecision {
  if (session == null) {
    return { type: "idle" };
  }

  if (session.phase === "break") {
    return {
      type: "break",
      durationMs: session.durationMs,
      endedWhileAway: session.endedWhileAway,
    };
  }

  if (!Number.isFinite(now)) {
    return { type: "discard" };
  }

  if (now >= session.targetAt) {
    return {
      type: "break",
      durationMs: session.durationMs,
      endedWhileAway: true,
    };
  }

  if (session.targetAt - now > session.durationMs + CLOCK_GRACE_MS) {
    return { type: "discard" };
  }

  return {
    type: "working",
    targetAt: session.targetAt,
    durationMs: session.durationMs,
  };
}

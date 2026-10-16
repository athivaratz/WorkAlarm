import { describe, expect, it } from "vitest";
import {
  decideSession,
  parseStoredWorkSession,
  type StoredWorkSession,
} from "./workSession";

const NOW = 1_700_000_000_000;

function working(targetAt: number, durationMs = 45 * 60 * 1000): StoredWorkSession {
  return { version: 1, phase: "working", targetAt, durationMs };
}

describe("parseStoredWorkSession", () => {
  it("accepts working and break records", () => {
    expect(parseStoredWorkSession(working(NOW + 1_000))).toEqual(working(NOW + 1_000));
    expect(
      parseStoredWorkSession({
        version: 1,
        phase: "break",
        durationMs: 10_000,
        endedWhileAway: true,
      }),
    ).toEqual({
      version: 1,
      phase: "break",
      durationMs: 10_000,
      endedWhileAway: true,
    });
  });

  it("rejects malformed records", () => {
    expect(parseStoredWorkSession(null)).toBeNull();
    expect(parseStoredWorkSession("session")).toBeNull();
    expect(parseStoredWorkSession({ version: 2, phase: "working", targetAt: NOW, durationMs: 10_000 })).toBeNull();
    expect(parseStoredWorkSession({ version: 1, phase: "working", targetAt: "soon", durationMs: 10_000 })).toBeNull();
    expect(parseStoredWorkSession({ version: 1, phase: "working", targetAt: NOW, durationMs: 500 })).toBeNull();
    expect(parseStoredWorkSession({ version: 1, phase: "break", durationMs: 10_000, endedWhileAway: 1 })).toBeNull();
    expect(parseStoredWorkSession({ version: 1, phase: "paused", durationMs: 10_000 })).toBeNull();
  });
});

describe("decideSession", () => {
  it("returns idle when nothing is stored", () => {
    expect(decideSession(null, NOW)).toEqual({ type: "idle" });
  });

  it("resumes a session that still has time left", () => {
    const session = working(NOW + 6_000, 10_000);
    expect(decideSession(session, NOW)).toEqual({
      type: "working",
      targetAt: NOW + 6_000,
      durationMs: 10_000,
    });
  });

  it("opens the break screen when the target has already passed", () => {
    const session = working(NOW, 10_000);
    expect(decideSession(session, NOW)).toEqual({
      type: "break",
      durationMs: 10_000,
      endedWhileAway: true,
    });
  });

  it("keeps an acknowledged break until it is cleared", () => {
    const session: StoredWorkSession = {
      version: 1,
      phase: "break",
      durationMs: 10_000,
      endedWhileAway: false,
    };
    expect(decideSession(session, NOW)).toEqual({
      type: "break",
      durationMs: 10_000,
      endedWhileAway: false,
    });
  });

  it("discards a target that is further away than the chosen duration", () => {
    const durationMs = 10_000;
    expect(decideSession(working(NOW + durationMs + 15_000, durationMs), NOW)).toEqual({
      type: "working",
      targetAt: NOW + durationMs + 15_000,
      durationMs,
    });
    expect(decideSession(working(NOW + durationMs + 15_001, durationMs), NOW)).toEqual({
      type: "discard",
    });
    expect(decideSession(working(NOW + 60_000, durationMs), Number.NaN)).toEqual({
      type: "discard",
    });
  });
});

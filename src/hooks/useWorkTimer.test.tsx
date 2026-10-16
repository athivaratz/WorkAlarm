import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StoredWorkSession } from "../lib/workSession";
import { readWorkSession, writeWorkSession } from "../lib/workSessionStore";
import { DEMO_DURATION_MS, WORK_DURATION_MS, useWorkTimer, type WorkSessionStorage } from "./useWorkTimer";

describe("useWorkTimer", () => {
  it("does not start until the saved session has been read", async () => {
    let resolveRead: (value: StoredWorkSession | null) => void = () => {};
    const storage: WorkSessionStorage = {
      read: () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),
      write: vi.fn(async () => undefined),
      clear: vi.fn(async () => undefined),
    };

    const { result } = renderHook(() => useWorkTimer(storage));

    act(() => {
      result.current.start();
    });
    expect(result.current.mode).toBe("idle");
    expect(storage.write).not.toHaveBeenCalled();

    await act(async () => {
      resolveRead(null);
    });

    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.mode).toBe("idle");
  });

  it("stays idle when storage cannot be read", async () => {
    const storage: WorkSessionStorage = {
      read: async () => {
        throw new Error("blocked");
      },
      write: async () => {
        throw new Error("blocked");
      },
      clear: async () => {
        throw new Error("blocked");
      },
    };

    const { result } = renderHook(() => useWorkTimer(storage));
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.mode).toBe("idle");

    act(() => {
      result.current.start();
    });
    expect(result.current.mode).toBe("working");
  });

  it("resumes a future session and clears it on stop", async () => {
    const targetAt = Date.now() + 8_000;
    await writeWorkSession({
      version: 1,
      phase: "working",
      targetAt,
      durationMs: DEMO_DURATION_MS,
    });

    const { result } = renderHook(() => useWorkTimer());
    await waitFor(() => expect(result.current.mode).toBe("working"));
    expect(result.current.resumed).toBe(true);
    expect(result.current.durationMs).toBe(DEMO_DURATION_MS);
    expect(result.current.remainingMs).toBeGreaterThan(5_000);
    expect(result.current.remainingMs).toBeLessThanOrEqual(8_000);

    act(() => {
      result.current.stop();
    });
    await waitFor(async () => {
      expect(await readWorkSession()).toBeNull();
    });
    expect(result.current.mode).toBe("idle");
    expect(result.current.resumed).toBe(false);
  });

  it("keeps an ended session on the break screen until it is dismissed", async () => {
    await writeWorkSession({
      version: 1,
      phase: "working",
      targetAt: Date.now() - 5_000,
      durationMs: WORK_DURATION_MS,
    });

    const { result, unmount } = renderHook(() => useWorkTimer());
    await waitFor(() => expect(result.current.mode).toBe("break"));
    expect(result.current.endedWhileAway).toBe(true);
    await waitFor(async () => {
      expect(await readWorkSession()).toEqual({
        version: 1,
        phase: "break",
        durationMs: WORK_DURATION_MS,
        endedWhileAway: true,
      });
    });

    unmount();
    const remounted = renderHook(() => useWorkTimer());
    await waitFor(() => expect(remounted.result.current.mode).toBe("break"));
    expect(remounted.result.current.endedWhileAway).toBe(true);

    act(() => {
      remounted.result.current.stop();
    });
    await waitFor(async () => {
      expect(await readWorkSession()).toBeNull();
    });
  });

  it("discards a stored target that cannot belong to its duration", async () => {
    await writeWorkSession({
      version: 1,
      phase: "working",
      targetAt: Date.now() + 10 * 60 * 60 * 1000,
      durationMs: WORK_DURATION_MS,
    });

    const { result } = renderHook(() => useWorkTimer());
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.mode).toBe("idle");
    await waitFor(async () => {
      expect(await readWorkSession()).toBeNull();
    });
  });

  it("ignores invalid durations and changes to the break record when time runs out", async () => {
    const { result } = renderHook(() => useWorkTimer());
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => {
      result.current.setDurationMs(50);
    });
    expect(result.current.durationMs).toBe(WORK_DURATION_MS);

    act(() => {
      result.current.setDurationMs(1_000);
    });
    expect(result.current.durationMs).toBe(1_000);

    act(() => {
      result.current.start();
    });

    await waitFor(() => expect(result.current.mode).toBe("working"));
    await waitFor(() => expect(result.current.mode).toBe("break"), { timeout: 4_000 });
    expect(result.current.endedWhileAway).toBe(false);
    await waitFor(async () => {
      expect(await readWorkSession()).toEqual({
        version: 1,
        phase: "break",
        durationMs: 1_000,
        endedWhileAway: false,
      });
    });
  });
});

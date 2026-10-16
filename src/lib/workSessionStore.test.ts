import { describe, expect, it } from "vitest";
import {
  WORK_SESSION_DB_NAME,
  WORK_SESSION_KEY,
  WORK_SESSION_STORE,
  clearWorkSession,
  readWorkSession,
  writeWorkSession,
} from "./workSessionStore";

describe("workSessionStore", () => {
  it("round-trips a working session and then clears it", async () => {
    const session = {
      version: 1 as const,
      phase: "working" as const,
      targetAt: Date.now() + 60_000,
      durationMs: 45 * 60 * 1000,
    };

    await writeWorkSession(session);
    expect(await readWorkSession()).toEqual(session);

    await clearWorkSession();
    expect(await readWorkSession()).toBeNull();
  });

  it("round-trips a break record", async () => {
    const session = {
      version: 1 as const,
      phase: "break" as const,
      durationMs: 10_000,
      endedWhileAway: true,
    };

    await writeWorkSession(session);
    expect(await readWorkSession()).toEqual(session);
  });

  it("drops a corrupt record", async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(WORK_SESSION_DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(WORK_SESSION_STORE)) {
          request.result.createObjectStore(WORK_SESSION_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(WORK_SESSION_STORE, "readwrite");
      transaction.objectStore(WORK_SESSION_STORE).put({ version: 1, phase: "nope" }, WORK_SESSION_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();

    expect(await readWorkSession()).toBeNull();
    expect(await readWorkSession()).toBeNull();
  });

  it("refuses to write an invalid session", async () => {
    await expect(
      writeWorkSession({
        version: 1,
        phase: "working",
        targetAt: Date.now(),
        durationMs: 10,
      }),
    ).rejects.toThrow(/invalid work session/i);
    expect(await readWorkSession()).toBeNull();
  });

  it("rejects when IndexedDB is unavailable", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: undefined,
    });

    try {
      await expect(readWorkSession()).rejects.toThrow(/IndexedDB is not available/);
    } finally {
      if (descriptor) {
        Object.defineProperty(globalThis, "indexedDB", descriptor);
      }
    }
  });
});

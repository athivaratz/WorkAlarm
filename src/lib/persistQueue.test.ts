import { describe, expect, it } from "vitest";
import { createPersistQueue } from "./persistQueue";

describe("createPersistQueue", () => {
  it("runs tasks in the order they were enqueued", async () => {
    const enqueue = createPersistQueue();
    const events: string[] = [];
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const first = enqueue(async () => {
      events.push("start");
      await gate;
      events.push("write");
    });
    const second = enqueue(async () => {
      events.push("clear");
    });

    await Promise.resolve();
    expect(events).toEqual(["start"]);

    release();
    await first;
    await second;
    expect(events).toEqual(["start", "write", "clear"]);
  });

  it("keeps later tasks running after an earlier task fails", async () => {
    const enqueue = createPersistQueue();
    const events: string[] = [];

    const first = enqueue(async () => {
      events.push("write");
      throw new Error("quota");
    });
    const second = enqueue(async () => {
      events.push("clear");
    });

    await expect(first).rejects.toThrow("quota");
    await second;
    expect(events).toEqual(["write", "clear"]);
  });
});

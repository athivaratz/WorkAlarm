import { cleanup } from "@testing-library/react";
import "fake-indexeddb/auto";
import { afterEach } from "vitest";
import { WORK_SESSION_DB_NAME } from "../lib/workSessionStore";

afterEach(async () => {
  cleanup();
  document.title = "MoveBreak AI";

  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(WORK_SESSION_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
});

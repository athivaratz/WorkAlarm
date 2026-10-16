import { parseStoredWorkSession, type StoredWorkSession } from "./workSession";

export const WORK_SESSION_DB_NAME = "movebreak";
export const WORK_SESSION_STORE = "work-session";
export const WORK_SESSION_KEY = "current";

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available"));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(WORK_SESSION_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(WORK_SESSION_STORE)) {
        db.createObjectStore(WORK_SESSION_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      reject(request.error ?? new Error("Failed to open the session database"));
    };
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      reject(request.error ?? new Error("IndexedDB request failed"));
    };
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    };
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(WORK_SESSION_STORE, mode);
    const result = await requestToPromise(run(transaction.objectStore(WORK_SESSION_STORE)));
    await transactionDone(transaction);
    return result;
  } finally {
    db.close();
  }
}

export async function readWorkSession(): Promise<StoredWorkSession | null> {
  const raw = await withStore("readonly", (store) => store.get(WORK_SESSION_KEY));
  if (raw === undefined) {
    return null;
  }

  const parsed = parseStoredWorkSession(raw);
  if (parsed == null) {
    await clearWorkSession();
    return null;
  }

  return parsed;
}

export async function writeWorkSession(session: StoredWorkSession): Promise<void> {
  if (parseStoredWorkSession(session) == null) {
    throw new Error("Invalid work session");
  }

  await withStore("readwrite", (store) => store.put(session, WORK_SESSION_KEY));
}

export async function clearWorkSession(): Promise<void> {
  await withStore("readwrite", (store) => store.delete(WORK_SESSION_KEY));
}

import type { OfflineSubmission } from "@/types/sync";

const DB_NAME = "nomad-go-offline";
const DB_VERSION = 1;
const STORE_PENDING = "pending_submissions";
const STORE_CACHE = "offline_cache";

type PendingRecord = OfflineSubmission & { queuedAt: string };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        db.createObjectStore(STORE_PENDING, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE);
      }
    };
  });
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const result = fn(store);
        transaction.oncomplete = () => {
          if (result instanceof IDBRequest) {
            resolve(result.result as T);
          } else {
            resolve();
          }
        };
        transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB tx failed"));
      })
  );
}

export async function enqueuePendingSubmission(submission: OfflineSubmission): Promise<void> {
  const record: PendingRecord = { ...submission, queuedAt: new Date().toISOString() };
  await tx(STORE_PENDING, "readwrite", (store) => store.put(record));
}

export async function listPendingSubmissions(): Promise<OfflineSubmission[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PENDING, "readonly");
    const store = transaction.objectStore(STORE_PENDING);
    const request = store.getAll();
    request.onsuccess = () => {
      const rows = (request.result as PendingRecord[]) ?? [];
      resolve(
        rows.map(({ id, questId, userId, roomId, payload, deviceTimestamp }) => ({
          id,
          questId,
          userId,
          roomId,
          payload,
          deviceTimestamp,
        }))
      );
    };
    request.onerror = () => reject(request.error ?? new Error("Failed to list pending"));
  });
}

export async function removePendingByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_PENDING, "readwrite");
    const store = transaction.objectStore(STORE_PENDING);
    for (const id of ids) store.delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to remove pending"));
  });
}

export async function countPendingSubmissions(): Promise<number> {
  const list = await listPendingSubmissions();
  return list.length;
}

/** Cache expedition agenda / tips for offline read (key e.g. `room:{roomId}`). */
export async function setOfflineCache(key: string, value: unknown): Promise<void> {
  await tx(STORE_CACHE, "readwrite", (store) => store.put(value, key));
}

export async function getOfflineCache<T>(key: string): Promise<T | null> {
  const result = await tx<T | undefined>(STORE_CACHE, "readonly", (store) => store.get(key));
  return (result as T | undefined) ?? null;
}

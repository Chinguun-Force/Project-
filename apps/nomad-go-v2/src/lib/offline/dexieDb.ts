import Dexie, { type Table } from "dexie";
import type {
  OfflineSubmissionRecord,
  QuestExecutionType,
  OfflineSubmissionStatus,
} from "@/types/questExecution";

export type { OfflineSubmissionRecord };

class NomadOfflineDexie extends Dexie {
  offline_submissions!: Table<OfflineSubmissionRecord, string>;

  constructor() {
    super("nomad-go-quest-offline");
    this.version(1).stores({
      offline_submissions:
        "id, questId, roomId, type, status, deviceTimestamp",
    });
  }
}

let dbInstance: NomadOfflineDexie | null = null;

export function getDexieDb(): NomadOfflineDexie {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB unavailable");
  }
  if (!dbInstance) {
    dbInstance = new NomadOfflineDexie();
  }
  return dbInstance;
}

export async function saveOfflineSubmission(
  record: OfflineSubmissionRecord
): Promise<void> {
  await getDexieDb().offline_submissions.put(record);
}

export async function getOfflineSubmission(
  id: string
): Promise<OfflineSubmissionRecord | undefined> {
  return getDexieDb().offline_submissions.get(id);
}

export async function listOfflineSubmissionsByStatus(
  statuses: OfflineSubmissionStatus[]
): Promise<OfflineSubmissionRecord[]> {
  return getDexieDb()
    .offline_submissions.where("status")
    .anyOf(statuses)
    .toArray();
}

export async function listOfflineSubmissionsForQuest(
  questId: string
): Promise<OfflineSubmissionRecord[]> {
  return getDexieDb().offline_submissions.where("questId").equals(questId).toArray();
}

export async function removeOfflineSubmissionsByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await getDexieDb().offline_submissions.bulkDelete(ids);
}

export async function countOfflineSubmissions(
  status?: OfflineSubmissionStatus
): Promise<number> {
  if (status) {
    return getDexieDb().offline_submissions.where("status").equals(status).count();
  }
  return getDexieDb().offline_submissions.count();
}

export type CreateOfflineSubmissionInput = {
  questId: string;
  roomId: string;
  type: QuestExecutionType;
  payload: Record<string, unknown>;
  status: OfflineSubmissionStatus;
  userId?: string;
  deviceTimestamp?: string;
};

export function newClientUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function buildOfflineSubmissionRecord(
  input: CreateOfflineSubmissionInput
): OfflineSubmissionRecord {
  return {
    id: newClientUuid(),
    questId: input.questId,
    roomId: input.roomId,
    type: input.type,
    payload: input.payload,
    deviceTimestamp: input.deviceTimestamp ?? new Date().toISOString(),
    status: input.status,
    userId: input.userId,
  };
}

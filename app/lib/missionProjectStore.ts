import {
  LEGACY_PROJECT_STORAGE_KEY,
  missionProjectToJson,
  parseMissionProjectJson,
} from "./missionProject";
import type { MissionProject } from "./missionDesignerTypes";

const DB_NAME = "solar-sim-workbench";
const STORE_NAME = "mission-projects";
const ACTIVE_KEY = "active";

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB unavailable"));
  });
}

async function readIndexedProject() {
  const database = await openDatabase();
  return new Promise<MissionProject | null>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(ACTIVE_KEY);
    request.onsuccess = () => {
      try {
        resolve(request.result ? parseMissionProjectJson(String(request.result)) : null);
      } catch (error) {
        reject(error);
      } finally {
        database.close();
      }
    };
    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error("Mission project read failed"));
    };
  });
}

export async function saveMissionProject(project: MissionProject) {
  if (typeof indexedDB === "undefined") return;
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(missionProjectToJson(project), ACTIVE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Mission project save failed"));
  });
  database.close();
}

export async function loadMissionProject() {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") return null;
  const indexed = await readIndexedProject();
  if (indexed) return indexed;
  const legacy = window.localStorage.getItem(LEGACY_PROJECT_STORAGE_KEY);
  if (!legacy) return null;
  const migrated = parseMissionProjectJson(legacy);
  await saveMissionProject(migrated);
  window.localStorage.removeItem(LEGACY_PROJECT_STORAGE_KEY);
  return migrated;
}

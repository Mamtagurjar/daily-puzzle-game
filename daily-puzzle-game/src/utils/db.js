import { openDB } from "idb";

const DB_NAME = "DailyPuzzleDB";
const STORE_NAME = "progress";

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveProgress(key, data) {
  const db = await initDB();
  return db.put(STORE_NAME, data, key);
}

export async function getProgress(key) {
  const db = await initDB();
  return db.get(STORE_NAME, key);
}

export async function clearProgress(key) {
  const db = await initDB();
  return db.delete(STORE_NAME, key);
}

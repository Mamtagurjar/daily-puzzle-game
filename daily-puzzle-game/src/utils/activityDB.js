import { openDB } from "idb";

const DB_NAME = "dailyPuzzleDB";
const STORE_NAME = "dailyActivity";
const DB_VERSION = 2; // bump version for upgrade

// ================= INIT DB =================
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "date",
        });

        // 🔥 Index for fast sync lookup
        store.createIndex("synced", "synced");
      }
    },
  });
};

// ================= SAVE ACTIVITY =================
export const saveActivity = async (activity) => {
  const db = await initDB();
  await db.put(STORE_NAME, activity);
};

// ================= GET ALL ACTIVITY =================
export const getAllActivity = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};

// ================= GET UNSYNCED =================
export const getUnsyncedActivity = async () => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const index = tx.store.index("synced");

  return index.getAll(false); // get where synced === false
};

// ================= MARK MULTIPLE AS SYNCED =================
export const markAsSynced = async (dates) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readwrite");

  for (let date of dates) {
    const item = await tx.store.get(date);
    if (item) {
      item.synced = true;
      await tx.store.put(item);
    }
  }

  await tx.done;
};

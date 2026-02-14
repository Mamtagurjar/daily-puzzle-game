import { getUnsyncedActivity, markAsSynced } from "./activityDB";

export async function syncActivity(userId, BASE_URL) {
  try {
    const unsynced = await getUnsyncedActivity();

    if (!unsynced.length) return;

    const payload = {
      entries: unsynced.map(item => ({
        date: item.date,
        score: item.score,
        timeTaken: item.timeTaken
      }))
    };

    const res = await fetch(`${BASE_URL}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firebase_uid: userId,
        entries: payload.entries
      }),
    });

    if (res.ok) {
      await markAsSynced(unsynced.map(item => item.date));
      console.log("✅ Background sync complete");
    }

  } catch (err) {
    console.error("Sync failed:", err);
  }
}

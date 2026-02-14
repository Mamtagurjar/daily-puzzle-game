import { useEffect, useState, useRef } from "react";
import dayjs from "dayjs";
import { auth, provider } from "./services/firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { saveProgress, getProgress } from "./utils/db";
import { saveActivity, getAllActivity } from "./utils/activityDB";
import { calculateStreak } from "./utils/streak";
import Heatmap from "./components/Heatmap";
import { motion } from "framer-motion";
import { syncActivity } from "./utils/syncEngine";
import AchievementPopup from "./components/AchievementPopup";
import { evaluateAchievements } from "./utils/achievementEngine";

function App() {
  const [user, setUser] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState("");
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [batchCounter, setBatchCounter] = useState(0);
  const [streak, setStreak] = useState(0);
  const [newAchievement, setNewAchievement] = useState(null);

  const startTimeRef = useRef(null);

  const BASE_URL = "https://daily-puzzle-server.onrender.com";

  // ================= AUTH =================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // ================= ONLINE SYNC =================
  useEffect(() => {
    const handleOnline = async () => {
      if (user) {
        await syncActivity(user.uid);
        fetchLeaderboard();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [user]);

  // ================= INITIAL LOAD =================
  useEffect(() => {
    if (user) {
      fetchDailyPuzzle();
      fetchLeaderboard();
      updateStreak();
      syncActivity(user.uid);
    }
  }, [user]);

  // ================= FETCH PUZZLE =================
  const fetchDailyPuzzle = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/puzzle`);
      const data = await res.json();
      setPuzzle(data);
      startTimeRef.current = Date.now();
    } catch (err) {
      console.error("Puzzle fetch error:", err);
    }
  };

  // ================= LOAD LOCAL PROGRESS =================
  useEffect(() => {
    const loadProgress = async () => {
      const today = dayjs().format("YYYY-MM-DD");
      const saved = await getProgress(today);

      if (saved) {
        setScore(saved.score);
        setAttempted(saved.attempted);
        setResult(saved.result);
      }
    };
    loadProgress();
  }, []);

  // ================= UPDATE STREAK =================
  const updateStreak = async () => {
    const activity = await getAllActivity();
    const streakValue = calculateStreak(activity);
    setStreak(streakValue);
  };

  // ================= LEADERBOARD =================
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/leaderboard`);
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error("Leaderboard error:", err);
    }
  };

  // ================= LOGIN / LOGOUT =================
  const login = async () => {
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
    setScore(0);
    setAttempted(false);
    setResult("");
    setAnswer("");
    setBatchCounter(0);
    setStreak(0);
  };

  // ================= VALIDATION =================
  const checkAnswer = async () => {
    if (attempted || !puzzle || !user || loading) return;

    setLoading(true);
    const today = dayjs().format("YYYY-MM-DD");

    try {
      const res = await fetch(`${BASE_URL}/api/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: user.uid,
          answer: answer.trim(),
          puzzleDate: today,
        }),
      });

      const data = await res.json();
      let newScore = score;

      if (data.correct) {
        newScore = score + data.addedScore;
        setScore(newScore);
        setResult("Correct ✅");

        const timeTaken = Math.floor(
          (Date.now() - startTimeRef.current) / 1000
        );

        await saveActivity({
          date: today,
          solved: true,
          score: data.addedScore,
          timeTaken,
          difficulty: 1,
          synced: false,
        });

        // 🔥 Update streak
        await updateStreak();

        // 🔥 Evaluate achievements
        const activity = await getAllActivity();
        const achievements = evaluateAchievements(activity);

        if (achievements.length > 0) {
          setNewAchievement(
            achievements[achievements.length - 1]
          );
        }

        // 🔥 Batch sync
        const updatedBatch = batchCounter + 1;
        setBatchCounter(updatedBatch);

        if (updatedBatch >= 5) {
          await syncActivity(user.uid);
          setBatchCounter(0);
          fetchLeaderboard();
        }

      } else {
        setResult(`Wrong ❌ (Correct: ${data.correctAnswer})`);
      }

      setAttempted(true);

      await saveProgress(today, {
        score: newScore,
        attempted: true,
        result: data.correct
          ? "Correct ✅"
          : `Wrong ❌ (Correct: ${data.correctAnswer})`,
      });

    } catch (err) {
      console.error("Validation error:", err);
    }

    setLoading(false);
  };

  // ================= UI =================
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white">
        <button
          onClick={login}
          className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-xl font-bold transition"
        >
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-6">

      <AchievementPopup
        achievement={newAchievement}
        onClose={() => setNewAchievement(null)}
      />

      {/* GAME CARD */}
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-[380px] text-center border border-white/20">

        <h1 className="text-4xl font-extrabold mb-2">
          🧠 Daily Brain Battle
        </h1>

        <p className="text-yellow-400 font-semibold">
          Score: {score}
        </p>

        <motion.p
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-orange-400 font-bold mt-1"
        >
          🔥 Streak: {streak} days
        </motion.p>

        <p className="text-sm text-gray-300 mb-4">
          Sync in: {5 - batchCounter} correct puzzles
        </p>

        {puzzle && (
          <>
            <div className="bg-black/30 p-4 rounded-xl mb-4">
              <p className="text-lg font-medium">
                {puzzle.question}
              </p>
            </div>

            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={attempted}
              className="w-full px-4 py-2 rounded-lg text-black mb-4"
              placeholder="Type your answer..."
            />

            <button
              onClick={checkAnswer}
              disabled={attempted || loading}
              className="w-full py-2 rounded-lg font-bold bg-yellow-400 hover:bg-yellow-300 text-black"
            >
              {loading ? "Checking..." : "Submit"}
            </button>

            {result && (
              <p className="mt-4 text-xl font-bold">
                {result}
              </p>
            )}
          </>
        )}

        <button
          onClick={logout}
          className="mt-6 bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {/* LEADERBOARD */}
      <div className="mt-8 w-[380px] bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
        <h2 className="text-xl font-bold mb-4 text-center">
          🏆 Leaderboard
        </h2>

        {leaderboard.length === 0 ? (
          <p className="text-center text-gray-300">
            No scores yet
          </p>
        ) : (
          <ul className="space-y-2">
            {leaderboard.map((item, index) => (
              <li
                key={index}
                className="flex justify-between bg-black/30 px-4 py-2 rounded-lg"
              >
                <span>
                  {item.firebase_uid.slice(0, 6)}...
                </span>
                <span className="font-bold text-yellow-400">
                  {item.score}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* HEATMAP */}
      <Heatmap />

    </div>
  );
}

export default App;

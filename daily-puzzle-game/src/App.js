import { useEffect, useState } from "react";
import { auth, provider } from "./services/firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getDailyPuzzle } from "./puzzles/PuzzleGenerator";
import { saveProgress, getProgress } from "./utils/db";

function App() {
  const [user, setUser] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState("");
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [batchCounter, setBatchCounter] = useState(0); // ✅ batching counter

  const BASE_URL = "https://daily-puzzle-server.onrender.com";

  // 🔐 Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 🧠 Load Puzzle
  useEffect(() => {
    if (user) {
      setPuzzle(getDailyPuzzle());
      fetchLeaderboard();
    }
  }, [user]);

  // 💾 Load Local Progress
  useEffect(() => {
    const loadProgress = async () => {
      const today = new Date().toISOString().split("T")[0];
      const saved = await getProgress(today);

      if (saved) {
        setScore(saved.score);
        setAttempted(saved.attempted);
        setResult(saved.result);
      }
    };
    loadProgress();
  }, []);

  // 🏆 Leaderboard
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/leaderboard`);
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error("Leaderboard error:", err);
    }
  };

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
  };

  const checkAnswer = async () => {
    if (attempted || !puzzle || !user || loading) return;

    setLoading(true);

    let newScore = score;
    let newResult = "";

    const isCorrect = puzzle.validate(answer.trim());

    if (isCorrect) {
      newScore = score + 10;
      newResult = "Correct ✅";
      setScore(newScore);

      // ✅ Increase batching counter ONLY on correct answers
      const updatedBatch = batchCounter + 1;
      setBatchCounter(updatedBatch);

      // 🔥 Sync every 5 correct puzzles
      if (updatedBatch >= 5) {
        try {
          await fetch(`${BASE_URL}/api/score`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firebase_uid: user.uid,
              score: newScore,
            }),
          });

          console.log("✅ Batch synced to server");
          setBatchCounter(0);
          fetchLeaderboard();
        } catch (err) {
          console.error("Batch sync error:", err);
        }
      }
    } else {
      newResult = "Wrong ❌";
    }

    setResult(newResult);
    setAttempted(true);

    const today = new Date().toISOString().split("T")[0];

    // 💾 Always save locally
    await saveProgress(today, {
      score: newScore,
      attempted: true,
      result: newResult,
    });

    setLoading(false);
  };

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-4">

      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-[380px] text-center border border-white/20">

        <h1 className="text-4xl font-extrabold mb-2">
          🧠 Daily Brain Battle
        </h1>

        <p className="text-yellow-400 font-semibold mb-2">
          Score: {score}
        </p>

        <p className="text-sm text-gray-300 mb-4">
          Sync in: {5 - batchCounter} correct puzzles
        </p>

        {puzzle && (
          <>
            <div className="bg-black/30 p-4 rounded-xl mb-4">
              <p className="text-lg font-medium">{puzzle.question}</p>
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

      {/* Leaderboard */}
      <div className="mt-8 w-[380px] bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
        <h2 className="text-xl font-bold mb-4 text-center">
          🏆 Leaderboard
        </h2>

        {leaderboard.length === 0 ? (
          <p className="text-center text-gray-300">No scores yet</p>
        ) : (
          <ul className="space-y-2">
            {leaderboard.map((item, index) => (
              <li
                key={index}
                className="flex justify-between bg-black/30 px-4 py-2 rounded-lg"
              >
                <span>{item.firebase_uid.slice(0, 6)}...</span>
                <span className="font-bold text-yellow-400">
                  {item.score}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}

export default App;

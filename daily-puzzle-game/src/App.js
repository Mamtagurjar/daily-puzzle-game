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

  // ✅ Correct Base URL
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

  // 🏆 Fetch Leaderboard
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
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setScore(0);
    setAttempted(false);
    setResult("");
    setAnswer("");
  };

  const checkAnswer = async () => {
    if (attempted || !puzzle || !user || loading) return;

    setLoading(true);

    let newScore = score;
    let newResult = "";

    const isCorrect = puzzle.validate(answer.trim());

    if (isCorrect) {
      newResult = "Correct ✅";
      newScore = score + 10;
      setScore(newScore);
    } else {
      newResult = "Wrong ❌";
    }

    setResult(newResult);
    setAttempted(true);

    const today = new Date().toISOString().split("T")[0];

    // 💾 Save locally
    await saveProgress(today, {
      score: newScore,
      attempted: true,
      result: newResult,
    });

    // 🌍 Save to backend
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

      fetchLeaderboard(); // refresh leaderboard
    } catch (err) {
      console.error("Save error:", err);
    }

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

      {/* GAME CARD */}
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-[380px] text-center border border-white/20">

        <h1 className="text-4xl font-extrabold mb-2">
          🧠 Daily Brain Battle
        </h1>

        <p className="text-yellow-400 font-semibold mb-4">
          Score: {score}
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
              onKeyDown={(e) => {
                if (e.key === "Enter") checkAnswer();
              }}
              disabled={attempted}
              className="w-full px-4 py-2 rounded-lg text-black mb-4 outline-none focus:ring-2 focus:ring-yellow-400 transition"
              placeholder="Type your answer..."
            />

            <button
              onClick={checkAnswer}
              disabled={attempted || loading}
              className={`w-full py-2 rounded-lg font-bold transition ${
                attempted
                  ? "bg-gray-500"
                  : "bg-yellow-400 hover:bg-yellow-300 text-black"
              }`}
            >
              {loading ? "Saving..." : "Submit"}
            </button>

            {result && (
              <p className={`mt-4 text-xl font-bold ${
                result.includes("Correct")
                  ? "text-green-400 animate-pulse"
                  : "text-red-400"
              }`}>
                {result}
              </p>
            )}
          </>
        )}

        <button
          onClick={logout}
          className="mt-6 bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg transition"
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

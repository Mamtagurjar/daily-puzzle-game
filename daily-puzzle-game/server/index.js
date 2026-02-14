require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 5000;

// ================= RATE LIMIT =================
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: "Too many requests. Please try again later."
});

app.use(limiter);

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= DATABASE CONNECTION =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// ================= VALIDATE ANSWER (SERVER-SIDE) =================
app.post("/api/validate", async (req, res) => {
  const { firebase_uid, answer, puzzleDate } = req.body;

  if (!firebase_uid || !answer) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const today = puzzleDate || new Date().toISOString().split("T")[0];

    // 🔐 Generate correct answer on server
    const correctAnswer = generateServerPuzzleAnswer(today);

    const isCorrect =
      answer.toString().trim().toLowerCase() ===
      correctAnswer.toString().trim().toLowerCase();

    const scoreToAdd = isCorrect ? 10 : 0;

    // Save daily score
    await pool.query(
      `INSERT INTO daily_scores (firebase_uid, score, puzzle_date)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid, puzzle_date)
       DO UPDATE SET score = daily_scores.score + $2`,
      [firebase_uid, scoreToAdd, today]
    );

    res.json({
      correct: isCorrect,
      addedScore: scoreToAdd,
      correctAnswer: correctAnswer
    });

  } catch (err) {
    console.error("Validation error:", err);
    res.status(500).json({ error: "Server validation failed" });
  }
});

// ================= DAILY LEADERBOARD =================
app.get("/api/leaderboard", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  try {
    const result = await pool.query(
      `SELECT firebase_uid, score
       FROM daily_scores
       WHERE puzzle_date = $1
       ORDER BY score DESC
       LIMIT 10`,
      [today]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ================= SERVER PUZZLE LOGIC =================
function generateServerPuzzleAnswer(date) {
  const today = new Date(date);
  const seed = today.getDate();

  const num1 = seed;
  const num2 = seed + 3;

  return (num1 + num2).toString();
}

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ================= GET DAILY PUZZLE =================
app.get("/api/puzzle", (req, res) => {
  const today = new Date();
  const seed = today.getDate();

  const num1 = seed;
  const num2 = seed + 3;

  const question = `What is ${num1} + ${num2}?`;

  res.json({
    question: question,
  });
});
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = 5000;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= DATABASE CONNECTION =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Optional: Test DB connection at startup
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// ================= SAVE OR UPDATE SCORE =================
app.post("/api/validate", async (req, res) => {
  const { firebase_uid, answer, correctAnswer } = req.body;

  if (!firebase_uid || !answer || !correctAnswer) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const today = new Date().toISOString().split("T")[0];

  const isCorrect = answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

  const scoreToAdd = isCorrect ? 10 : 0;

  try {
    await pool.query(
      `INSERT INTO daily_scores (firebase_uid, score, puzzle_date)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid, puzzle_date)
       DO UPDATE SET score = daily_scores.score + $2`,
      [firebase_uid, scoreToAdd, today]
    );

    res.json({
      success: true,
      correct: isCorrect,
      addedScore: scoreToAdd,
    });

  } catch (err) {
    console.error("Validation error:", err);
    res.status(500).json({ error: "Database error" });
  }
});


// ================= GET DAILY LEADERBOARD =================
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

// ================= GET USER STATS =================
app.post("/api/score", async (req, res) => {
  try {
    const { firebase_uid, answer, correctAnswer } = req.body;

    if (!firebase_uid || !answer || !correctAnswer) {
      return res.status(400).json({ error: "Invalid input" });
    }

    let scoreToAdd = 0;

    if (answer === correctAnswer) {
      scoreToAdd = 10;
    }

    await pool.query(
      `INSERT INTO scores (firebase_uid, score)
       VALUES ($1, $2)
       ON CONFLICT (firebase_uid)
       DO UPDATE SET score = scores.score + $2`,
      [firebase_uid, scoreToAdd]
    );

    res.json({ message: "Score updated securely" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

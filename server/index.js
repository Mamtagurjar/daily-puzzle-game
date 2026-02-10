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
app.post("/api/score", async (req, res) => {
  const { firebase_uid, score } = req.body;

  if (!firebase_uid || score === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    await pool.query(
      `INSERT INTO daily_scores (firebase_uid, score, puzzle_date)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid, puzzle_date)
       DO UPDATE SET score = EXCLUDED.score`,
      [firebase_uid, score, today]
    );

    res.json({ message: "Score saved successfully" });
  } catch (err) {
    console.error("DB Error:", err);
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
app.get("/api/user/:uid", async (req, res) => {
  const { uid } = req.params;

  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS total_days,
              SUM(score) AS total_score
       FROM daily_scores
       WHERE firebase_uid = $1`,
      [uid]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("User stats error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

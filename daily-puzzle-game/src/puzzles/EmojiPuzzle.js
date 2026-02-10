import BasePuzzle from "./BasePuzzle";

class EmojiPuzzle extends BasePuzzle {
  constructor() {
    const puzzles = [
      { q: "🐍 + ☕ = ?", a: "Python" },
      { q: "🌍 + 🕸️ = ?", a: "World Wide Web" },
      { q: "📱 + 🍎 = ?", a: "iPhone" },
    ];

    const today = new Date().toISOString().split("T")[0];
    const seed = today.charCodeAt(0) + today.charCodeAt(5);

    const selected = puzzles[seed % puzzles.length];

    super(selected.q, selected.a);
  }
}

export default EmojiPuzzle;

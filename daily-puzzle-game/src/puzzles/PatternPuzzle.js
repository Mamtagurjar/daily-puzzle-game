import BasePuzzle from "./BasePuzzle";

class PatternPuzzle extends BasePuzzle {
  constructor() {
    const puzzles = [
      { q: "3 → 9, 4 → 16, 5 → 25, 6 → ?", a: "36" },
      { q: "2, 4, 8, 16, ?", a: "32" },
    ];

    const today = new Date().toISOString().split("T")[0];
    const seed = today.charCodeAt(1) + today.charCodeAt(9);

    const selected = puzzles[seed % puzzles.length];

    super(selected.q, selected.a);
  }
}

export default PatternPuzzle;
